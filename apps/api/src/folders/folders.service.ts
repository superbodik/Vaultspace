import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Folder, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService, AccessContext } from '../access/access.service';
import { StorageService } from '../files/storage/storage.service';
import { ActivityService } from '../activity/activity.service';
import { CreateFolderDto } from './dto';
import { RenameDto, MoveItemDto } from '../common/dto';
import { dedupeName, isNameTaken } from '../common/utils/naming';

@Injectable()
export class FoldersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly activity: ActivityService,
  ) {}

  async create(userId: string, dto: CreateFolderDto) {
    const { role } = await this.access.getDataRoomAccess(dto.dataRoomId, { userId });
    this.requireWriteAccess(role);

    let parent: { id: string; path: string; depth: number; dataRoomId: string } | null = null;
    if (dto.parentId) {
      parent = await this.prisma.folder.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.dataRoomId !== dto.dataRoomId) {
        throw new BadRequestException('Parent folder does not belong to this data room');
      }
    }

    const siblings = await this.prisma.folder.findMany({
      where: { dataRoomId: dto.dataRoomId, parentId: parent?.id ?? null },
      select: { name: true },
    });
    const name = dedupeName(dto.name.trim(), siblings.map((s) => s.name));

    const created = await this.prisma.folder.create({
      data: {
        name,
        dataRoomId: dto.dataRoomId,
        parentId: parent?.id ?? null,
        path: parent ? `${parent.path}${parent.id}/` : '/',
        depth: parent ? parent.depth + 1 : 0,
        createdById: userId,
      },
    });

    this.activity.log({
      dataRoomId: dto.dataRoomId,
      actorId: userId,
      action: 'CREATED_FOLDER',
      resourceType: 'FOLDER',
      resourceId: created.id,
      resourceName: created.name,
    });

    return created;
  }

  async browse(dataRoomId: string, folderId: string | null, ctx: AccessContext) {
    let role: string;
    let folder: Folder | null = null;
    let breadcrumbs: { id: string; name: string }[] = [];

    if (folderId) {
      // Folder-level (and data-room-level, inherited) access is fully resolved
      // by getFolderAccess, which walks the materialized-path ancestor chain -
      // it must be checked directly rather than via getDataRoomAccess first,
      // since someone with only a FOLDER share never has a DATA_ROOM share.
      const folderAccess = await this.access.getFolderAccess(folderId, ctx);
      if (folderAccess.folder.dataRoomId !== dataRoomId) throw new NotFoundException('Folder not found');
      if (folderAccess.access.role === 'NONE') throw new NotFoundException('Folder not found');

      role = folderAccess.access.role;
      folder = folderAccess.folder;

      const ancestorIds = folder.path.split('/').filter(Boolean);
      const ancestors = ancestorIds.length
        ? await this.prisma.folder.findMany({ where: { id: { in: ancestorIds } } })
        : [];
      const byId = new Map(ancestors.map((a) => [a.id, a]));
      breadcrumbs = ancestorIds.map((id) => ({ id, name: byId.get(id)?.name ?? '…' })).concat({
        id: folder.id,
        name: folder.name,
      });
    } else {
      const dataRoomAccess = await this.access.getDataRoomAccess(dataRoomId, ctx);
      if (dataRoomAccess.role === 'NONE') throw new NotFoundException('Data room not found');
      role = dataRoomAccess.role;
    }

    const dataRoom = await this.prisma.dataRoom.findUniqueOrThrow({ where: { id: dataRoomId } });

    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { dataRoomId, parentId: folderId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.file.findMany({
        where: { dataRoomId, folderId },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      dataRoom: { id: dataRoom.id, name: dataRoom.name },
      folder,
      breadcrumbs,
      accessRole: role,
      folders,
      files: files.map((f) => ({ ...f, size: f.size.toString() })),
    };
  }

  async stats(folderId: string, ctx: AccessContext) {
    const { folder, access } = await this.access.getFolderAccess(folderId, ctx);
    if (access.role === 'NONE') throw new NotFoundException('Folder not found');

    const descendantIds = await this.descendantFolderIds(folder.dataRoomId, folder.path, folder.id);
    const allFolderIds = [folder.id, ...descendantIds];

    const [fileAgg, folderCount] = await Promise.all([
      this.prisma.file.aggregate({
        where: { folderId: { in: allFolderIds } },
        _count: true,
        _sum: { size: true },
      }),
      Promise.resolve(descendantIds.length),
    ]);

    return {
      folderCount,
      fileCount: fileAgg._count,
      totalSize: (fileAgg._sum.size ?? BigInt(0)).toString(),
    };
  }

  async rename(folderId: string, userId: string, dto: RenameDto) {
    const { folder, access } = await this.access.getFolderAccess(folderId, { userId });
    this.requireWriteAccess(access.role);

    const siblings = await this.prisma.folder.findMany({
      where: { dataRoomId: folder.dataRoomId, parentId: folder.parentId, id: { not: folderId } },
      select: { name: true },
    });
    const trimmed = dto.name.trim();
    if (isNameTaken(trimmed, siblings.map((s) => s.name))) {
      throw new ConflictException({
        message: 'A folder with this name already exists here',
        suggestedName: dedupeName(trimmed, siblings.map((s) => s.name)),
      });
    }

    const updated = await this.prisma.folder.update({ where: { id: folderId }, data: { name: trimmed } });

    this.activity.log({
      dataRoomId: folder.dataRoomId,
      actorId: userId,
      action: 'RENAMED',
      resourceType: 'FOLDER',
      resourceId: folderId,
      resourceName: updated.name,
    });

    return updated;
  }

  async move(folderId: string, userId: string, dto: MoveItemDto) {
    const { folder, access } = await this.access.getFolderAccess(folderId, { userId });
    this.requireWriteAccess(access.role);

    if (dto.targetFolderId === folderId) {
      throw new BadRequestException('Cannot move a folder into itself');
    }

    let target: { id: string; path: string; depth: number; dataRoomId: string } | null = null;
    if (dto.targetFolderId) {
      target = await this.prisma.folder.findUnique({ where: { id: dto.targetFolderId } });
      if (!target || target.dataRoomId !== folder.dataRoomId) {
        throw new BadRequestException('Target folder does not belong to this data room');
      }
      const targetChain = target.path.split('/').filter(Boolean).concat(target.id);
      if (targetChain.includes(folder.id)) {
        throw new BadRequestException('Cannot move a folder into one of its own subfolders');
      }
    }

    const siblings = await this.prisma.folder.findMany({
      where: { dataRoomId: folder.dataRoomId, parentId: target?.id ?? null, id: { not: folderId } },
      select: { name: true },
    });
    const siblingNames = siblings.map((s) => s.name);
    let finalName = folder.name;
    if (isNameTaken(finalName, siblingNames)) {
      if (dto.resolvedName && !isNameTaken(dto.resolvedName.trim(), siblingNames)) {
        finalName = dto.resolvedName.trim();
      } else {
        throw new ConflictException({
          message: 'A folder with this name already exists in the destination',
          suggestedName: dedupeName(finalName, siblingNames),
        });
      }
    }

    const oldPrefix = `${folder.path}${folder.id}/`;
    const newPath = target ? `${target.path}${target.id}/` : '/';
    const newDepth = target ? target.depth + 1 : 0;
    const depthDelta = newDepth - folder.depth;
    const newPrefix = `${newPath}${folder.id}/`;

    await this.prisma.$transaction([
      this.prisma.folder.update({
        where: { id: folderId },
        data: { parentId: target?.id ?? null, path: newPath, depth: newDepth, name: finalName },
      }),
      this.prisma.$executeRaw(Prisma.sql`
        UPDATE "Folder"
        SET path = ${newPrefix} || substring(path from ${oldPrefix.length + 1}),
            depth = depth + ${depthDelta}
        WHERE path LIKE ${oldPrefix + '%'}
      `),
    ]);

    this.activity.log({
      dataRoomId: folder.dataRoomId,
      actorId: userId,
      action: 'MOVED',
      resourceType: 'FOLDER',
      resourceId: folderId,
      resourceName: finalName,
    });

    return { success: true };
  }

  async remove(folderId: string, userId: string) {
    const { folder, access } = await this.access.getFolderAccess(folderId, { userId });
    this.requireWriteAccess(access.role);

    const descendantIds = await this.descendantFolderIds(folder.dataRoomId, folder.path, folder.id);
    const allFolderIds = [folder.id, ...descendantIds];

    const files = await this.prisma.file.findMany({
      where: { folderId: { in: allFolderIds } },
      select: { storageKey: true },
    });

    // DB cascade (Folder/File onDelete: Cascade) removes every descendant row;
    // the blob objects are not tracked by Postgres, so they're cleaned up here.
    await this.prisma.folder.delete({ where: { id: folderId } });
    await Promise.allSettled(files.map((f) => this.storage.delete(f.storageKey)));

    this.activity.log({
      dataRoomId: folder.dataRoomId,
      actorId: userId,
      action: 'DELETED',
      resourceType: 'FOLDER',
      resourceId: folderId,
      resourceName: folder.name,
    });

    return { success: true, deletedFolders: allFolderIds.length, deletedFiles: files.length };
  }

  private async descendantFolderIds(dataRoomId: string, path: string, id: string): Promise<string[]> {
    const prefix = `${path}${id}/`;
    const rows = await this.prisma.folder.findMany({
      where: { dataRoomId, path: { startsWith: prefix } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  private requireWriteAccess(role: string) {
    if (role !== 'OWNER' && role !== 'EDITOR') {
      throw new ForbiddenException('You do not have permission to modify this data room');
    }
  }
}

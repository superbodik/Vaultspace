import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService, AccessContext } from '../access/access.service';
import { StorageService } from './storage/storage.service';
import { ActivityService } from '../activity/activity.service';
import { RenameDto, MoveItemDto } from '../common/dto';
import { dedupeName, isNameTaken } from '../common/utils/naming';

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB per file

export interface IncomingFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly activity: ActivityService,
  ) {}

  async upload(userId: string, dataRoomId: string, folderId: string | undefined, file: IncomingFile) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit`);
    }

    const { role } = await this.access.getDataRoomAccess(dataRoomId, { userId });
    this.requireWriteAccess(role);

    if (folderId) {
      const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder || folder.dataRoomId !== dataRoomId) {
        throw new BadRequestException('Folder does not belong to this data room');
      }
    }

    const siblings = await this.prisma.file.findMany({
      where: { dataRoomId, folderId: folderId ?? null },
      select: { name: true },
    });
    const name = dedupeName(file.originalname, siblings.map((s) => s.name));

    const key = this.storage.newKey(dataRoomId);
    await this.storage.save(key, file.buffer);

    const created = await this.prisma.file.create({
      data: {
        name,
        size: BigInt(file.size),
        mimeType: file.mimetype || 'application/octet-stream',
        storageKey: key,
        storageProvider: process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local',
        dataRoomId,
        folderId: folderId ?? null,
        uploaderId: userId,
      },
    });

    this.activity.log({
      dataRoomId,
      actorId: userId,
      action: 'UPLOADED',
      resourceType: 'FILE',
      resourceId: created.id,
      resourceName: created.name,
    });

    return { ...created, size: created.size.toString() };
  }

  async getMeta(fileId: string, ctx: AccessContext) {
    const { file, access } = await this.access.getFileAccess(fileId, ctx);
    if (access.role === 'NONE') throw new NotFoundException('File not found');
    return { ...file, size: file.size.toString(), accessRole: access.role };
  }

  async getContent(fileId: string, ctx: AccessContext, download = false) {
    const { file, access } = await this.access.getFileAccess(fileId, ctx);
    if (access.role === 'NONE') throw new NotFoundException('File not found');

    this.activity.log({
      dataRoomId: file.dataRoomId,
      actorId: ctx.userId,
      viaShareId: access.shareId,
      action: download ? 'DOWNLOADED' : 'VIEWED',
      resourceType: 'FILE',
      resourceId: file.id,
      resourceName: file.name,
    });

    const { stream } = await this.storage.read(file.storageKey);
    return { file, stream };
  }

  async rename(fileId: string, userId: string, dto: RenameDto) {
    const { file, access } = await this.access.getFileAccess(fileId, { userId });
    this.requireWriteAccess(access.role);

    const siblings = await this.prisma.file.findMany({
      where: { dataRoomId: file.dataRoomId, folderId: file.folderId, id: { not: fileId } },
      select: { name: true },
    });
    const trimmed = dto.name.trim();
    if (isNameTaken(trimmed, siblings.map((s) => s.name))) {
      throw new ConflictException({
        message: 'A file with this name already exists here',
        suggestedName: dedupeName(trimmed, siblings.map((s) => s.name)),
      });
    }

    const updated = await this.prisma.file.update({ where: { id: fileId }, data: { name: trimmed } });

    this.activity.log({
      dataRoomId: file.dataRoomId,
      actorId: userId,
      action: 'RENAMED',
      resourceType: 'FILE',
      resourceId: fileId,
      resourceName: updated.name,
    });

    return { ...updated, size: updated.size.toString() };
  }

  async move(fileId: string, userId: string, dto: MoveItemDto) {
    const { file, access } = await this.access.getFileAccess(fileId, { userId });
    this.requireWriteAccess(access.role);

    if (dto.targetFolderId) {
      const target = await this.prisma.folder.findUnique({ where: { id: dto.targetFolderId } });
      if (!target || target.dataRoomId !== file.dataRoomId) {
        throw new BadRequestException('Target folder does not belong to this data room');
      }
    }

    const siblings = await this.prisma.file.findMany({
      where: { dataRoomId: file.dataRoomId, folderId: dto.targetFolderId ?? null, id: { not: fileId } },
      select: { name: true },
    });
    const siblingNames = siblings.map((s) => s.name);
    let finalName = file.name;
    if (isNameTaken(finalName, siblingNames)) {
      if (dto.resolvedName && !isNameTaken(dto.resolvedName.trim(), siblingNames)) {
        finalName = dto.resolvedName.trim();
      } else {
        throw new ConflictException({
          message: 'A file with this name already exists in the destination',
          suggestedName: dedupeName(finalName, siblingNames),
        });
      }
    }

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: { folderId: dto.targetFolderId ?? null, name: finalName },
    });

    this.activity.log({
      dataRoomId: file.dataRoomId,
      actorId: userId,
      action: 'MOVED',
      resourceType: 'FILE',
      resourceId: fileId,
      resourceName: finalName,
    });

    return { ...updated, size: updated.size.toString() };
  }

  async remove(fileId: string, userId: string) {
    const { file, access } = await this.access.getFileAccess(fileId, { userId });
    this.requireWriteAccess(access.role);

    const versions = await this.prisma.fileVersion.findMany({ where: { fileId }, select: { storageKey: true } });
    await this.prisma.file.delete({ where: { id: fileId } });
    await Promise.allSettled([
      this.storage.delete(file.storageKey),
      ...versions.map((v) => this.storage.delete(v.storageKey)),
    ]);

    this.activity.log({
      dataRoomId: file.dataRoomId,
      actorId: userId,
      action: 'DELETED',
      resourceType: 'FILE',
      resourceId: fileId,
      resourceName: file.name,
    });

    return { success: true };
  }

  async uploadNewVersion(fileId: string, userId: string, incoming: IncomingFile) {
    const { file, access } = await this.access.getFileAccess(fileId, { userId });
    this.requireWriteAccess(access.role);

    await this.prisma.fileVersion.create({
      data: {
        fileId: file.id,
        version: file.version,
        size: file.size,
        mimeType: file.mimeType,
        storageKey: file.storageKey,
        createdById: userId,
      },
    });

    const key = this.storage.newKey(file.dataRoomId);
    await this.storage.save(key, incoming.buffer);

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        storageKey: key,
        size: BigInt(incoming.size),
        mimeType: incoming.mimetype || file.mimeType,
        version: { increment: 1 },
      },
    });

    this.activity.log({
      dataRoomId: file.dataRoomId,
      actorId: userId,
      action: 'UPLOADED',
      resourceType: 'FILE',
      resourceId: fileId,
      resourceName: file.name,
    });

    return { ...updated, size: updated.size.toString() };
  }

  async listVersions(fileId: string, ctx: AccessContext) {
    const { file, access } = await this.access.getFileAccess(fileId, ctx);
    if (access.role === 'NONE') throw new NotFoundException('File not found');

    const versions = await this.prisma.fileVersion.findMany({
      where: { fileId },
      orderBy: { version: 'desc' },
    });

    return [
      { version: file.version, size: file.size.toString(), mimeType: file.mimeType, createdAt: file.updatedAt, current: true },
      ...versions.map((v) => ({
        version: v.version,
        size: v.size.toString(),
        mimeType: v.mimeType,
        createdAt: v.createdAt,
        current: false,
      })),
    ];
  }

  async getVersionContent(fileId: string, version: number, ctx: AccessContext) {
    const { file, access } = await this.access.getFileAccess(fileId, ctx);
    if (access.role === 'NONE') throw new NotFoundException('File not found');

    if (version === file.version) {
      const { stream } = await this.storage.read(file.storageKey);
      return { file, stream };
    }

    const historical = await this.prisma.fileVersion.findUnique({
      where: { fileId_version: { fileId, version } },
    });
    if (!historical) throw new NotFoundException('Version not found');
    const { stream } = await this.storage.read(historical.storageKey);
    return { file: { ...file, name: file.name, mimeType: historical.mimeType }, stream };
  }

  private requireWriteAccess(role: string) {
    if (role !== 'OWNER' && role !== 'EDITOR') {
      throw new ForbiddenException('You do not have permission to modify this data room');
    }
  }
}

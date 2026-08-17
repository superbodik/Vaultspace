import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService, AccessContext } from '../access/access.service';
import { CreateDataRoomDto } from './dto';
import { RenameDto } from '../common/dto';

@Injectable()
export class DataRoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async create(ownerId: string, dto: CreateDataRoomDto) {
    return this.prisma.dataRoom.create({
      data: { name: dto.name.trim(), ownerId },
    });
  }

  async listMine(ownerId: string) {
    const rooms = await this.prisma.dataRoom.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { folders: true, files: true } } },
    });
    return rooms.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      folderCount: r._count.folders,
      fileCount: r._count.files,
    }));
  }

  async listSharedWithMe(ctx: AccessContext) {
    if (!ctx.userEmail) return [];
    const grants = await this.prisma.shareGrant.findMany({
      where: { email: ctx.userEmail.toLowerCase() },
      include: {
        share: {
          include: { dataRoom: true, folder: true, file: true, owner: { select: { name: true, email: true } } },
        },
      },
    });

    return grants
      .filter((g) => !g.share.revokedAt)
      .map((g) => ({
        shareId: g.share.id,
        role: g.role,
        resourceType: g.share.resourceType,
        ownerName: g.share.owner.name,
        dataRoom: g.share.dataRoom
          ? { id: g.share.dataRoom.id, name: g.share.dataRoom.name }
          : null,
        folder: g.share.folder ? { id: g.share.folder.id, name: g.share.folder.name } : null,
        file: g.share.file ? { id: g.share.file.id, name: g.share.file.name } : null,
        sharedAt: g.createdAt,
      }));
  }

  async getOne(id: string, ctx: AccessContext) {
    const { role } = await this.access.getDataRoomAccess(id, ctx);
    if (role === 'NONE') throw new NotFoundException('Data room not found');

    const room = await this.prisma.dataRoom.findUniqueOrThrow({ where: { id } });
    return { ...room, accessRole: role };
  }

  async rename(id: string, ownerId: string, dto: RenameDto) {
    await this.assertOwner(id, ownerId);
    return this.prisma.dataRoom.update({ where: { id }, data: { name: dto.name.trim() } });
  }

  async remove(id: string, ownerId: string) {
    await this.assertOwner(id, ownerId);
    await this.prisma.dataRoom.delete({ where: { id } });
    return { success: true };
  }

  async stats(id: string, ctx: AccessContext) {
    const { role } = await this.access.getDataRoomAccess(id, ctx);
    if (role === 'NONE') throw new NotFoundException('Data room not found');

    const [fileAgg, folderCount] = await Promise.all([
      this.prisma.file.aggregate({ where: { dataRoomId: id }, _count: true, _sum: { size: true } }),
      this.prisma.folder.count({ where: { dataRoomId: id } }),
    ]);

    return {
      fileCount: fileAgg._count,
      folderCount,
      totalSize: (fileAgg._sum.size ?? BigInt(0)).toString(),
    };
  }

  private async assertOwner(id: string, ownerId: string) {
    const room = await this.prisma.dataRoom.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Data room not found');
    if (room.ownerId !== ownerId) throw new ForbiddenException('Only the owner can do this');
    return room;
  }
}

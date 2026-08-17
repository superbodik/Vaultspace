import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateShareDto, AddGrantsDto } from './dto';

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async create(userId: string, dto: CreateShareDto) {
    const { dataRoomId, name } = await this.assertOwnsResource(dto.resourceType, dto.resourceId, userId);

    const data: any = {
      resourceType: dto.resourceType,
      ownerId: userId,
      mode: dto.mode,
      dataRoomId: dto.resourceType === 'DATA_ROOM' ? dto.resourceId : undefined,
      folderId: dto.resourceType === 'FOLDER' ? dto.resourceId : undefined,
      fileId: dto.resourceType === 'FILE' ? dto.resourceId : undefined,
    };

    if (dto.mode === 'PUBLIC_LINK') {
      data.token = randomBytes(24).toString('base64url');
    } else {
      if (!dto.emails?.length) {
        throw new BadRequestException('Provide at least one email to share with');
      }
    }

    const share = await this.prisma.share.create({
      data: {
        ...data,
        grants:
          dto.mode === 'PERMISSIONED'
            ? { create: dedupeEmails(dto.emails!).map((email) => ({ email, role: 'VIEWER' as const })) }
            : undefined,
      },
      include: { grants: true },
    });

    this.activity.log({
      dataRoomId,
      actorId: userId,
      action: 'SHARED',
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      resourceName: name,
    });

    return { ...share, resourceName: name, dataRoomId };
  }

  async listForResource(resourceType: string, resourceId: string, userId: string) {
    await this.assertOwnsResource(resourceType as any, resourceId, userId);

    const filter =
      resourceType === 'DATA_ROOM'
        ? { dataRoomId: resourceId }
        : resourceType === 'FOLDER'
          ? { folderId: resourceId }
          : { fileId: resourceId };

    const shares = await this.prisma.share.findMany({
      where: { ...filter, revokedAt: null },
      include: { grants: true },
      orderBy: { createdAt: 'desc' },
    });

    return shares;
  }

  async addGrants(shareId: string, userId: string, dto: AddGrantsDto) {
    const share = await this.requireOwnedShare(shareId, userId);
    if (share.mode !== 'PERMISSIONED') {
      throw new BadRequestException('Only permissioned shares accept individual grants');
    }

    const emails = dedupeEmails(dto.emails);
    await this.prisma.$transaction(
      emails.map((email) =>
        this.prisma.shareGrant.upsert({
          where: { shareId_email: { shareId, email } },
          create: { shareId, email, role: 'VIEWER' },
          update: {},
        }),
      ),
    );

    return this.prisma.share.findUnique({ where: { id: shareId }, include: { grants: true } });
  }

  async removeGrant(shareId: string, grantId: string, userId: string) {
    await this.requireOwnedShare(shareId, userId);
    await this.prisma.shareGrant.delete({ where: { id: grantId } });
    return { success: true };
  }

  async revoke(shareId: string, userId: string) {
    const share = await this.requireOwnedShare(shareId, userId);
    await this.prisma.share.update({ where: { id: shareId }, data: { revokedAt: new Date() } });

    const resourceId = share.dataRoomId ?? share.folderId ?? share.fileId!;
    const { dataRoomId, name } = await this.assertOwnsResource(share.resourceType, resourceId, userId);
    this.activity.log({
      dataRoomId,
      actorId: userId,
      action: 'REVOKED_SHARE',
      resourceType: share.resourceType,
      resourceId,
      resourceName: name,
    });

    return { success: true };
  }

  async resolvePublicToken(token: string) {
    const share = await this.prisma.share.findUnique({
      where: { token },
      include: { dataRoom: true, folder: true, file: true },
    });
    if (!share || share.revokedAt || share.mode !== 'PUBLIC_LINK') {
      throw new NotFoundException('This link is invalid or has been revoked');
    }

    const dataRoomId = share.dataRoomId ?? share.folder?.dataRoomId ?? share.file?.dataRoomId;
    return {
      resourceType: share.resourceType,
      dataRoomId,
      folderId: share.folderId ?? (share.resourceType === 'FILE' ? share.file?.folderId : undefined) ?? null,
      fileId: share.fileId ?? null,
      token: share.token,
    };
  }

  private async requireOwnedShare(shareId: string, userId: string) {
    const share = await this.prisma.share.findUnique({ where: { id: shareId } });
    if (!share) throw new NotFoundException('Share not found');
    if (share.ownerId !== userId) throw new ForbiddenException('Only the owner can manage this share');
    return share;
  }

  private async assertOwnsResource(resourceType: 'DATA_ROOM' | 'FOLDER' | 'FILE', resourceId: string, userId: string) {
    if (resourceType === 'DATA_ROOM') {
      const room = await this.prisma.dataRoom.findUnique({ where: { id: resourceId } });
      if (!room) throw new NotFoundException('Data room not found');
      if (room.ownerId !== userId) throw new ForbiddenException('Only the owner can share this');
      return { dataRoomId: room.id, name: room.name };
    }
    if (resourceType === 'FOLDER') {
      const folder = await this.prisma.folder.findUnique({ where: { id: resourceId }, include: { dataRoom: true } });
      if (!folder) throw new NotFoundException('Folder not found');
      if (folder.dataRoom.ownerId !== userId) throw new ForbiddenException('Only the owner can share this');
      return { dataRoomId: folder.dataRoomId, name: folder.name };
    }
    const file = await this.prisma.file.findUnique({ where: { id: resourceId }, include: { dataRoom: true } });
    if (!file) throw new NotFoundException('File not found');
    if (file.dataRoom.ownerId !== userId) throw new ForbiddenException('Only the owner can share this');
    return { dataRoomId: file.dataRoomId, name: file.name };
  }
}

function dedupeEmails(emails: string[]): string[] {
  return [...new Set(emails.map((e) => e.trim().toLowerCase()))];
}

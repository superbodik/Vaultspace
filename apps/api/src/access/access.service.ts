import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AccessRole = 'OWNER' | 'EDITOR' | 'VIEWER' | 'NONE';

export interface AccessContext {
  userId?: string;
  userEmail?: string;
  shareToken?: string;
}

export interface AccessResult {
  role: AccessRole;
  /** id of the Share record that granted access, when role came from a share */
  shareId?: string;
}

interface ResourceTarget {
  dataRoomId: string;
  ownerId: string;
  folderChainIds?: string[];
  fileId?: string;
}

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getDataRoomAccess(dataRoomId: string, ctx: AccessContext): Promise<AccessResult> {
    const room = await this.prisma.dataRoom.findUnique({ where: { id: dataRoomId } });
    if (!room) throw new NotFoundException('Data room not found');
    return this.resolveAccess({ dataRoomId: room.id, ownerId: room.ownerId }, ctx);
  }

  async getFolderAccess(folderId: string, ctx: AccessContext) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: { dataRoom: true },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    const chain = [...folder.path.split('/').filter(Boolean), folder.id];
    const access = await this.resolveAccess(
      { dataRoomId: folder.dataRoomId, ownerId: folder.dataRoom.ownerId, folderChainIds: chain },
      ctx,
    );
    return { folder, access };
  }

  async getFileAccess(fileId: string, ctx: AccessContext) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { dataRoom: true, folder: true },
    });
    if (!file) throw new NotFoundException('File not found');
    const chain = file.folder ? [...file.folder.path.split('/').filter(Boolean), file.folder.id] : [];
    const access = await this.resolveAccess(
      {
        dataRoomId: file.dataRoomId,
        ownerId: file.dataRoom.ownerId,
        folderChainIds: chain,
        fileId: file.id,
      },
      ctx,
    );
    return { file, access };
  }

  private async resolveAccess(target: ResourceTarget, ctx: AccessContext): Promise<AccessResult> {
    if (ctx.userId && ctx.userId === target.ownerId) {
      return { role: 'OWNER' };
    }

    const or: any[] = [{ resourceType: 'DATA_ROOM', dataRoomId: target.dataRoomId }];
    if (target.folderChainIds?.length) {
      or.push({ resourceType: 'FOLDER', folderId: { in: target.folderChainIds } });
    }
    if (target.fileId) {
      or.push({ resourceType: 'FILE', fileId: target.fileId });
    }

    const shares = await this.prisma.share.findMany({
      where: { revokedAt: null, OR: or },
      include: { grants: true },
    });

    let best: AccessRole = 'NONE';
    let bestShareId: string | undefined;

    const upgrade = (role: AccessRole, shareId: string) => {
      const rank: Record<AccessRole, number> = { NONE: 0, VIEWER: 1, EDITOR: 2, OWNER: 3 };
      if (rank[role] > rank[best]) {
        best = role;
        bestShareId = shareId;
      }
    };

    for (const share of shares) {
      if (share.mode === 'PUBLIC_LINK' && ctx.shareToken && share.token === ctx.shareToken) {
        upgrade('VIEWER', share.id);
      }
      if (share.mode === 'PERMISSIONED' && ctx.userEmail) {
        const grant = share.grants.find((g) => g.email.toLowerCase() === ctx.userEmail!.toLowerCase());
        if (grant) upgrade(grant.role as AccessRole, share.id);
      }
    }

    return { role: best, shareId: bestShareId };
  }
}

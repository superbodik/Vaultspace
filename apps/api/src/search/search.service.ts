import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService, AccessContext } from '../access/access.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async searchDataRoom(dataRoomId: string, query: string, ctx: AccessContext) {
    const q = query.trim();
    if (!q) return { folders: [], files: [] };

    const room = await this.prisma.dataRoom.findUnique({ where: { id: dataRoomId } });
    if (!room) throw new NotFoundException('Data room not found');

    const roomAccess = await this.access.getDataRoomAccess(dataRoomId, ctx);

    let folderScope: { id: string; path: string }[] | null = null; // null = whole room
    if (roomAccess.role === 'NONE') {
      folderScope = await this.scopedFolderRoots(dataRoomId, ctx);
      if (!folderScope.length) throw new NotFoundException('Data room not found');
    }

    const folderIdFilter = folderScope
      ? { in: (await this.expandScopeToFolderIds(dataRoomId, folderScope)) }
      : undefined;

    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: {
          dataRoomId,
          name: { contains: q, mode: 'insensitive' },
          ...(folderIdFilter ? { id: folderIdFilter } : {}),
        },
        take: 50,
        orderBy: { name: 'asc' },
      }),
      this.prisma.file.findMany({
        where: {
          dataRoomId,
          name: { contains: q, mode: 'insensitive' },
          ...(folderIdFilter ? { folderId: folderIdFilter } : {}),
        },
        take: 50,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      folders,
      files: files.map((f) => ({ ...f, size: f.size.toString() })),
    };
  }

  /** Folder-level shares granted (directly, by token or by email) to this requester within the room. */
  private async scopedFolderRoots(dataRoomId: string, ctx: AccessContext) {
    const or: any[] = [];
    if (ctx.shareToken) or.push({ mode: 'PUBLIC_LINK', token: ctx.shareToken });
    if (ctx.userEmail) or.push({ mode: 'PERMISSIONED', grants: { some: { email: ctx.userEmail.toLowerCase() } } });
    if (!or.length) return [];

    const shares = await this.prisma.share.findMany({
      where: {
        revokedAt: null,
        resourceType: 'FOLDER',
        folder: { dataRoomId },
        OR: or,
      },
      include: { folder: true },
    });

    return shares.filter((s) => s.folder).map((s) => ({ id: s.folder!.id, path: s.folder!.path }));
  }

  private async expandScopeToFolderIds(dataRoomId: string, roots: { id: string; path: string }[]) {
    const ids = new Set<string>();
    for (const root of roots) {
      ids.add(root.id);
      const prefix = `${root.path}${root.id}/`;
      const descendants = await this.prisma.folder.findMany({
        where: { dataRoomId, path: { startsWith: prefix } },
        select: { id: true },
      });
      descendants.forEach((d) => ids.add(d.id));
    }
    return [...ids];
  }
}

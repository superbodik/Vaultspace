import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityAction, ShareResourceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LogInput {
  dataRoomId: string;
  actorId?: string;
  viaShareId?: string;
  action: ActivityAction;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceName: string;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  // fire-and-forget from call sites: a logging hiccup shouldn't fail the
  // actual upload/view/share the user asked for
  log(input: LogInput): void {
    this.prisma.activityEvent.create({ data: input }).catch((err) => {
      console.error('[activity] failed to log event', input.action, err);
    });
  }

  async list(dataRoomId: string, userId: string, before?: string) {
    const room = await this.prisma.dataRoom.findUnique({ where: { id: dataRoomId } });
    if (!room) throw new NotFoundException('Data room not found');
    if (room.ownerId !== userId) throw new ForbiddenException('Only the owner can view activity');

    const events = await this.prisma.activityEvent.findMany({
      where: { dataRoomId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        viaShare: { select: { mode: true } },
      },
    });

    return events.map((e) => ({
      id: e.id,
      action: e.action,
      resourceType: e.resourceType,
      resourceId: e.resourceId,
      resourceName: e.resourceName,
      createdAt: e.createdAt,
      actor: e.actor,
      viaPublicLink: e.viaShare?.mode === 'PUBLIC_LINK',
    }));
  }
}

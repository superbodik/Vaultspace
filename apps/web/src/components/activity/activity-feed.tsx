import {
  Download,
  Eye,
  FolderPlus,
  type LucideIcon,
  Move,
  Pencil,
  Share2,
  ShieldOff,
  Trash2,
  Upload,
} from 'lucide-react';
import type { ActivityAction, ActivityEvent } from '@/types/api';
import { formatRelativeTime, initials } from '@/lib/format';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ACTION_ICON: Record<ActivityAction, LucideIcon> = {
  UPLOADED: Upload,
  VIEWED: Eye,
  DOWNLOADED: Download,
  RENAMED: Pencil,
  MOVED: Move,
  DELETED: Trash2,
  CREATED_FOLDER: FolderPlus,
  SHARED: Share2,
  REVOKED_SHARE: ShieldOff,
};

function describe(event: ActivityEvent): string {
  const isFolder = event.resourceType === 'FOLDER';
  switch (event.action) {
    case 'UPLOADED':
      return `uploaded "${event.resourceName}"`;
    case 'VIEWED':
      return `viewed "${event.resourceName}"`;
    case 'DOWNLOADED':
      return `downloaded "${event.resourceName}"`;
    case 'RENAMED':
      return `renamed ${isFolder ? 'a folder' : 'a file'} to "${event.resourceName}"`;
    case 'MOVED':
      return `moved "${event.resourceName}"`;
    case 'DELETED':
      return `deleted "${event.resourceName}"`;
    case 'CREATED_FOLDER':
      return `created the folder "${event.resourceName}"`;
    case 'SHARED':
      return `shared "${event.resourceName}"`;
    case 'REVOKED_SHARE':
      return `revoked access to "${event.resourceName}"`;
  }
}

function actorLabel(event: ActivityEvent): string {
  if (event.actor) return event.actor.name;
  if (event.viaPublicLink) return 'Someone with the public link';
  return 'Someone';
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-400">Nothing has happened here yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {events.map((event) => {
        const Icon = ACTION_ICON[event.action];
        const isDestructive = event.action === 'DELETED' || event.action === 'REVOKED_SHARE';
        return (
          <div key={event.id} className="flex items-start gap-3 border-b border-ink-50 py-3 last:border-0 dark:border-ink-800/60">
            <Avatar className="mt-0.5 size-7 shrink-0">
              <AvatarFallback className="text-[10px]">
                {event.actor ? initials(event.actor.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-700 dark:text-ink-200">
                <span className="font-medium text-ink-900 dark:text-ink-50">{actorLabel(event)}</span>{' '}
                {describe(event)}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">{formatRelativeTime(event.createdAt)}</p>
            </div>
            <Icon className={`mt-0.5 size-4 shrink-0 ${isDestructive ? 'text-red-500' : 'text-ink-300'}`} />
          </div>
        );
      })}
    </div>
  );
}

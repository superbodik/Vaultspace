import { ChevronRight, FolderLock } from 'lucide-react';
import type { Breadcrumb } from '@/types/api';

export function Breadcrumbs({
  roomName,
  breadcrumbs,
  onNavigateRoot,
  onNavigate,
}: {
  roomName: string;
  breadcrumbs: Breadcrumb[];
  onNavigateRoot: () => void;
  onNavigate: (folderId: string) => void;
}) {
  return (
    <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-sm">
      <button
        onClick={onNavigateRoot}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-50"
      >
        <FolderLock className="size-3.5" />
        <span className={breadcrumbs.length === 0 ? 'text-ink-900 dark:text-ink-50' : ''}>{roomName}</span>
      </button>
      {breadcrumbs.map((crumb, i) => {
        const isLast = i === breadcrumbs.length - 1;
        return (
          <span key={crumb.id} className="flex min-w-0 shrink items-center gap-1">
            <ChevronRight className="size-3.5 shrink-0 text-ink-300" />
            <button
              onClick={() => onNavigate(crumb.id)}
              className={`truncate rounded-md px-1.5 py-1 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800 ${
                isLast ? 'font-medium text-ink-900 dark:text-ink-50' : 'text-ink-500 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              {crumb.name}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

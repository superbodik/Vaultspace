import { Link } from 'react-router-dom';
import { File, Folder, FolderOpen, Users, FolderLock } from 'lucide-react';
import { Topbar } from '@/components/layout/topbar';
import { useMyDataRooms, useSharedWithMe } from '@/hooks/use-data-rooms';
import { DataRoomCard } from '@/components/data-room/data-room-card';
import { CreateDataRoomDialog } from '@/components/data-room/create-data-room-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';

export function DashboardPage() {
  const { data: rooms, isLoading } = useMyDataRooms();
  const { data: shared } = useSharedWithMe();

  return (
    <div className="min-h-screen">
      <Topbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink-900 dark:text-ink-50">Your data rooms</h1>
            <p className="mt-1 text-sm text-ink-400">Secure, organized spaces for deal documents.</p>
          </div>
          <CreateDataRoomDialog />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <DataRoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderLock}
            title="No data rooms yet"
            description="Create your first data room to start organizing documents for diligence."
            action={<CreateDataRoomDialog />}
          />
        )}

        {shared && shared.length > 0 && (
          <div className="mt-12">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-ink-400" />
              <h2 className="text-sm font-semibold text-ink-700 dark:text-ink-200">Shared with you</h2>
            </div>
            <div className="flex flex-col divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-surface-raised dark:divide-ink-800 dark:border-ink-800">
              {shared.map((item) => {
                const target = item.file
                  ? `/files/${item.file.id}`
                  : item.folder
                    ? `/rooms/${item.dataRoom?.id}?folder=${item.folder.id}`
                    : `/rooms/${item.dataRoom?.id}`;
                const name = item.file?.name ?? item.folder?.name ?? item.dataRoom?.name ?? 'Untitled';
                const Icon = item.file ? File : item.folder ? FolderOpen : FolderLock;
                return (
                  <Link key={item.shareId} to={target} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{name}</p>
                      <p className="text-xs text-ink-400">Shared by {item.ownerName} · {formatDate(item.sharedAt)}</p>
                    </div>
                    <Folder className="size-3.5 text-ink-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/common/confirm-delete-dialog';
import { useDataRoomStats, useDeleteDataRoom } from '@/hooks/use-data-rooms';
import { formatBytes } from '@/lib/format';
import type { DataRoomListItem } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';

export function DeleteDataRoomDialog({
  open,
  onOpenChange,
  room,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: DataRoomListItem;
}) {
  const { data: stats, isLoading } = useDataRoomStats(open ? room.id : undefined);
  const del = useDeleteDataRoom();

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete "${room.name}"?`}
      confirmLabel="Delete data room"
      description={
        <>
          <p>This permanently deletes the entire data room, including everything inside it. This cannot be undone.</p>
          {isLoading ? (
            <Skeleton className="mt-3 h-10 w-full" />
          ) : stats ? (
            <p className="mt-3 rounded-lg bg-ink-50 p-2.5 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
              {stats.folderCount} folder{stats.folderCount === 1 ? '' : 's'} · {stats.fileCount} file{stats.fileCount === 1 ? '' : 's'} · {formatBytes(stats.totalSize)}
            </p>
          ) : null}
          <p className="mt-3">Anyone this data room was shared with will immediately lose access.</p>
        </>
      }
      onConfirm={async () => {
        await del.mutateAsync(room.id);
        toast.success('Data room deleted');
      }}
    />
  );
}

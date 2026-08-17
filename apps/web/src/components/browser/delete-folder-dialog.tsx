import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/common/confirm-delete-dialog';
import { useDeleteFolder, useFolderStats } from '@/hooks/use-browse';
import { formatBytes } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
}) {
  const { data: stats, isLoading } = useFolderStats(open ? folderId : undefined);
  const del = useDeleteFolder();

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete "${folderName}"?`}
      confirmLabel="Delete folder"
      description={
        <>
          <p>This permanently deletes this folder and everything inside it. This cannot be undone.</p>
          {isLoading ? (
            <Skeleton className="mt-3 h-10 w-full" />
          ) : stats && (stats.folderCount > 0 || stats.fileCount > 0) ? (
            <p className="mt-3 rounded-lg bg-ink-50 p-2.5 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
              Includes {stats.folderCount} subfolder{stats.folderCount === 1 ? '' : 's'} · {stats.fileCount} file
              {stats.fileCount === 1 ? '' : 's'} · {formatBytes(stats.totalSize)}
            </p>
          ) : null}
          <p className="mt-3">Anyone this folder was shared with will immediately lose access.</p>
        </>
      }
      onConfirm={async () => {
        await del.mutateAsync(folderId);
        toast.success('Folder deleted');
      }}
    />
  );
}

import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/common/confirm-delete-dialog';
import { useDeleteFile } from '@/hooks/use-browse';

export function DeleteFileDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
}) {
  const del = useDeleteFile();

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete "${fileName}"?`}
      confirmLabel="Delete file"
      description={
        <>
          <p>This permanently deletes the file{"'"}s content and version history. This cannot be undone.</p>
          <p className="mt-2">Anyone this file was shared with will immediately lose access.</p>
        </>
      }
      onConfirm={async () => {
        await del.mutateAsync(fileId);
        toast.success('File deleted');
      }}
    />
  );
}

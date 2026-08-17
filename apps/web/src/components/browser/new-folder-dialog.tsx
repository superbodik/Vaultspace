import * as React from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateFolder } from '@/hooks/use-browse';
import { Spinner } from '@/components/ui/page-spinner';

export function NewFolderDialog({
  open,
  onOpenChange,
  dataRoomId,
  parentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataRoomId: string;
  parentId: string | null;
}) {
  const [name, setName] = React.useState('');
  const create = useCreateFolder();

  React.useEffect(() => {
    if (open) setName('');
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ dataRoomId, parentId: parentId ?? undefined, name: name.trim() });
      onOpenChange(false);
      toast.success('Folder created');
    } catch {
      toast.error('Could not create folder');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <Input autoFocus placeholder="Untitled folder" value={name} onChange={(e) => setName(e.target.value)} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending && <Spinner className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

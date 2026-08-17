import * as React from 'react';
import { ChevronRight, Folder as FolderIcon, FolderLock } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrowse } from '@/hooks/use-browse';
import { ApiError } from '@/lib/api';
import { Spinner } from '@/components/ui/page-spinner';

export function MoveDialog({
  open,
  onOpenChange,
  dataRoomId,
  roomName,
  excludeFolderId,
  currentFolderId,
  itemLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataRoomId: string;
  roomName: string;
  excludeFolderId?: string;
  currentFolderId: string | null;
  itemLabel: string;
  onConfirm: (targetFolderId: string | null, resolvedName?: string) => Promise<void>;
}) {
  const [browsingId, setBrowsingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestion, setSuggestion] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setBrowsingId(null);
      setError(null);
      setSuggestion(null);
    }
  }, [open]);

  const { data, isLoading } = useBrowse(open ? dataRoomId : undefined, browsingId, undefined);
  const folders = (data?.folders ?? []).filter((f) => f.id !== excludeFolderId);

  const submit = async (resolvedName?: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(browsingId, resolvedName);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(err.message);
        setSuggestion(err.body?.suggestedName ?? null);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sameLocation = browsingId === currentFolderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move &ldquo;{itemLabel}&rdquo;</DialogTitle>
        </DialogHeader>

        <div className="mb-3 flex items-center gap-1 text-xs text-ink-400">
          <button className="flex items-center gap-1 hover:text-ink-700" onClick={() => setBrowsingId(null)}>
            <FolderLock className="size-3" /> {roomName}
          </button>
          {data?.breadcrumbs.map((b) => (
            <span key={b.id} className="flex items-center gap-1">
              <ChevronRight className="size-3" />
              <button className="hover:text-ink-700" onClick={() => setBrowsingId(b.id)}>
                {b.name}
              </button>
            </span>
          ))}
        </div>

        <div className="h-64 overflow-y-auto rounded-lg border border-ink-100 dark:border-ink-800">
          {isLoading ? (
            <div className="flex flex-col gap-1 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : folders.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-ink-300">No subfolders here</p>
          ) : (
            <div className="flex flex-col p-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setBrowsingId(folder.id)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                  <FolderIcon className="size-4 text-ink-400" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
            <span>{error}</span>
            {suggestion && (
              <button type="button" className="w-fit font-medium underline underline-offset-2" onClick={() => submit(suggestion)}>
                Move and rename to &ldquo;{suggestion}&rdquo;
              </button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => submit()} disabled={submitting || sameLocation}>
            {submitting && <Spinner className="size-4 animate-spin" />}
            Move here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

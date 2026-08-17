import * as React from 'react';
import { History, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFileVersions, useUploadNewVersion } from '@/hooks/use-file';
import { formatBytes, formatDateTime } from '@/lib/format';
import { fileUrl } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/page-spinner';

export function VersionHistoryDialog({
  open,
  onOpenChange,
  fileId,
  canUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  canUpload: boolean;
}) {
  const { data: versions, isLoading } = useFileVersions(open ? fileId : undefined);
  const uploadVersion = useUploadNewVersion(fileId);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4" />
            Version history
          </DialogTitle>
        </DialogHeader>

        {canUpload && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="mb-3 w-fit"
              disabled={uploadVersion.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {uploadVersion.isPending ? <Spinner className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Upload new version
            </Button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  await uploadVersion.mutateAsync(file);
                  toast.success('New version uploaded');
                } catch {
                  toast.error('Could not upload new version');
                }
              }}
            />
          </>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-ink-100 dark:divide-ink-800">
            {versions?.map((v) => (
              <a
                key={v.version}
                href={fileUrl(fileId, { version: v.current ? undefined : v.version })}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/50"
              >
                <span className="font-medium text-ink-700 dark:text-ink-200">v{v.version}</span>
                <span className="text-ink-400">{formatBytes(v.size)}</span>
                <span className="ml-auto text-xs text-ink-400">{formatDateTime(v.createdAt)}</span>
                {v.current && <Badge variant="gold">Current</Badge>}
              </a>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import * as React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Download, History, LogIn, Pencil, Share2, ShieldOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/page-spinner';
import { PdfViewer } from '@/components/viewer/pdf-viewer';
import { VersionHistoryDialog } from '@/components/viewer/version-history';
import { RenameDialog } from '@/components/common/rename-dialog';
import { DeleteFileDialog } from '@/components/browser/delete-file-dialog';
import { ShareDialog } from '@/components/sharing/share-dialog';
import { useFile } from '@/hooks/use-file';
import { useRenameFile } from '@/hooks/use-browse';
import { useAuth } from '@/hooks/use-auth';
import { ApiError, fileUrl } from '@/lib/api';
import { formatBytes, formatDateTime } from '@/lib/format';
import { fileIcon } from '@/lib/file-icon';

export function FilePage() {
  const { fileId } = useParams<{ fileId: string }>();
  const [params] = useSearchParams();
  const shareToken = params.get('st') ?? undefined;
  const { user, isLoading: authLoading } = useAuth();

  const { data: file, isLoading, isError, error } = useFile(fileId, shareToken);
  const rename = useRenameFile();

  const [renaming, setRenaming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const [versionsOpen, setVersionsOpen] = React.useState(false);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen">
        <Topbar />
        <PageSpinner />
      </div>
    );
  }

  if (isError || !file) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="min-h-screen">
        <Topbar />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          {!user ? (
            <EmptyState
              icon={LogIn}
              title="Sign in to view this file"
              action={
                <Button asChild>
                  <Link to="/login" state={{ from: `/files/${fileId}${window.location.search}` }}>
                    Sign in
                  </Link>
                </Button>
              }
            />
          ) : (
            <EmptyState icon={ShieldOff} title={notFound ? "You don't have access to this file" : 'Something went wrong'} />
          )}
        </main>
      </div>
    );
  }

  const canWrite = file.accessRole === 'OWNER' || file.accessRole === 'EDITOR';
  const canShare = file.accessRole === 'OWNER';
  const backTo = file.folderId
    ? `/rooms/${file.dataRoomId}?folder=${file.folderId}${shareToken ? `&st=${shareToken}` : ''}`
    : `/rooms/${file.dataRoomId}${shareToken ? `?st=${shareToken}` : ''}`;

  const Icon = fileIcon(file.mimeType);
  const isPdf = file.mimeType === 'application/pdf';
  const isImage = file.mimeType.startsWith('image/');
  const contentUrl = fileUrl(file.id, { shareToken });

  return (
    <div className="flex h-screen flex-col">
      <Topbar>
        <Link to={backTo} className="flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-50">
          <ChevronLeft className="size-4" />
          Back
        </Link>
      </Topbar>

      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 dark:border-ink-800 sm:px-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{file.name}</h1>
          <p className="text-xs text-ink-400">
            {formatBytes(file.size)} · Updated {formatDateTime(file.updatedAt)} · v{file.version}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="icon" title="Version history" onClick={() => setVersionsOpen(true)}>
            <History className="size-4" />
          </Button>
          {canShare && (
            <Button variant="ghost" size="icon" title="Share" onClick={() => setSharing(true)}>
              <Share2 className="size-4" />
            </Button>
          )}
          {canWrite && (
            <Button variant="ghost" size="icon" title="Rename" onClick={() => setRenaming(true)}>
              <Pencil className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Download" asChild>
            <a href={fileUrl(file.id, { shareToken, download: true })}>
              <Download className="size-4" />
            </a>
          </Button>
          {canWrite && (
            <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleting(true)}>
              <Trash2 className="size-4 text-red-600" />
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-ink-50 p-4 dark:bg-ink-950 sm:p-6">
        {isPdf ? (
          <PdfViewer src={contentUrl} title={file.name} />
        ) : isImage ? (
          <div className="flex h-full items-center justify-center overflow-auto">
            <img src={contentUrl} alt={file.name} className="max-h-full max-w-full rounded-lg object-contain shadow-md" />
          </div>
        ) : (
          <EmptyState
            icon={Icon}
            title="No inline preview available"
            description="This file type can't be previewed in the browser. Download it to view the contents."
            action={
              <Button asChild>
                <a href={fileUrl(file.id, { shareToken, download: true })}>
                  <Download className="size-4" />
                  Download
                </a>
              </Button>
            }
          />
        )}
      </div>

      <RenameDialog
        open={renaming}
        onOpenChange={setRenaming}
        initialName={file.name}
        title="Rename file"
        onSubmit={async (name) => {
          await rename.mutateAsync({ id: file.id, name });
          toast.success('File renamed');
        }}
      />
      <DeleteFileDialog open={deleting} onOpenChange={setDeleting} fileId={file.id} fileName={file.name} />
      {sharing && <ShareDialog open={sharing} onOpenChange={setSharing} resourceType="FILE" resourceId={file.id} resourceName={file.name} />}
      <VersionHistoryDialog open={versionsOpen} onOpenChange={setVersionsOpen} fileId={file.id} canUpload={canWrite} />
    </div>
  );
}

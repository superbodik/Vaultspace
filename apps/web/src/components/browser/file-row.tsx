import * as React from 'react';
import { Link } from 'react-router-dom';
import { Download, MoreHorizontal, Move, Pencil, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AccessRole, FileItem } from '@/types/api';
import { formatBytes, formatDate } from '@/lib/format';
import { fileIcon } from '@/lib/file-icon';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RenameDialog } from '@/components/common/rename-dialog';
import { DeleteFileDialog } from '@/components/browser/delete-file-dialog';
import { MoveDialog } from '@/components/browser/move-dialog';
import { ShareDialog } from '@/components/sharing/share-dialog';
import { useMoveFile, useRenameFile } from '@/hooks/use-browse';
import { fileUrl } from '@/lib/api';

export function FileRow({
  file,
  accessRole,
  roomId,
  roomName,
  currentFolderId,
  shareToken,
}: {
  file: FileItem;
  accessRole: AccessRole;
  roomId: string;
  roomName: string;
  currentFolderId: string | null;
  shareToken?: string;
}) {
  const [renaming, setRenaming] = React.useState(false);
  const [moving, setMoving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const canWrite = accessRole === 'OWNER' || accessRole === 'EDITOR';
  const canShare = accessRole === 'OWNER';
  const Icon = fileIcon(file.mimeType);

  const rename = useRenameFile();
  const move = useMoveFile();

  const linkTo = `/files/${file.id}${shareToken ? `?st=${shareToken}` : ''}`;

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/50">
      <Link to={linkTo} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
          <Icon className="size-4.5" />
        </div>
        <span className="min-w-0 truncate text-sm font-medium text-ink-800 dark:text-ink-100">{file.name}</span>
      </Link>
      <span className="hidden shrink-0 text-xs text-ink-400 sm:block">{formatBytes(file.size)}</span>
      <span className="hidden shrink-0 text-xs text-ink-400 md:block">{formatDate(file.updatedAt)}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={fileUrl(file.id, { shareToken, download: true })}>
              <Download className="size-4" />
              Download
            </a>
          </DropdownMenuItem>
          {canWrite && (
            <>
              {canShare && (
                <DropdownMenuItem onSelect={() => setSharing(true)}>
                  <Share2 className="size-4" />
                  Share
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setRenaming(true)}>
                <Pencil className="size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setMoving(true)}>
                <Move className="size-4" />
                Move to&hellip;
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
      <MoveDialog
        open={moving}
        onOpenChange={setMoving}
        dataRoomId={roomId}
        roomName={roomName}
        currentFolderId={currentFolderId}
        itemLabel={file.name}
        onConfirm={async (targetFolderId, resolvedName) => {
          await move.mutateAsync({ id: file.id, targetFolderId: targetFolderId ?? undefined, resolvedName });
          toast.success('File moved');
        }}
      />
      <DeleteFileDialog open={deleting} onOpenChange={setDeleting} fileId={file.id} fileName={file.name} />
      {sharing && <ShareDialog open={sharing} onOpenChange={setSharing} resourceType="FILE" resourceId={file.id} resourceName={file.name} />}
    </div>
  );
}

import * as React from 'react';
import { Folder as FolderIcon, MoreHorizontal, Move, Pencil, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AccessRole, FolderItem } from '@/types/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RenameDialog } from '@/components/common/rename-dialog';
import { DeleteFolderDialog } from '@/components/browser/delete-folder-dialog';
import { MoveDialog } from '@/components/browser/move-dialog';
import { ShareDialog } from '@/components/sharing/share-dialog';
import { useMoveFolder, useRenameFolder } from '@/hooks/use-browse';

export function FolderRow({
  folder,
  accessRole,
  roomId,
  roomName,
  currentFolderId,
  onOpen,
}: {
  folder: FolderItem;
  accessRole: AccessRole;
  roomId: string;
  roomName: string;
  currentFolderId: string | null;
  onOpen: () => void;
}) {
  const [renaming, setRenaming] = React.useState(false);
  const [moving, setMoving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const canWrite = accessRole === 'OWNER' || accessRole === 'EDITOR';
  const canShare = accessRole === 'OWNER';

  const rename = useRenameFolder();
  const move = useMoveFolder();

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/50">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700 dark:bg-gold-700/15 dark:text-gold-300">
          <FolderIcon className="size-4.5" />
        </div>
        <span className="min-w-0 truncate text-sm font-medium text-ink-800 dark:text-ink-100">{folder.name}</span>
      </button>
      <span className="hidden shrink-0 text-xs text-ink-400 sm:block">{formatDate(folder.updatedAt)}</span>

      {canWrite && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <RenameDialog
        open={renaming}
        onOpenChange={setRenaming}
        initialName={folder.name}
        title="Rename folder"
        onSubmit={async (name) => {
          await rename.mutateAsync({ id: folder.id, name });
          toast.success('Folder renamed');
        }}
      />
      <MoveDialog
        open={moving}
        onOpenChange={setMoving}
        dataRoomId={roomId}
        roomName={roomName}
        excludeFolderId={folder.id}
        currentFolderId={currentFolderId}
        itemLabel={folder.name}
        onConfirm={async (targetFolderId, resolvedName) => {
          await move.mutateAsync({ id: folder.id, targetFolderId: targetFolderId ?? undefined, resolvedName });
          toast.success('Folder moved');
        }}
      />
      <DeleteFolderDialog open={deleting} onOpenChange={setDeleting} folderId={folder.id} folderName={folder.name} />
      {sharing && (
        <ShareDialog open={sharing} onOpenChange={setSharing} resourceType="FOLDER" resourceId={folder.id} resourceName={folder.name} />
      )}
    </div>
  );
}

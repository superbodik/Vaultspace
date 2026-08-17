import * as React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Pencil, Share2, Trash2, FolderLock } from 'lucide-react';
import { toast } from 'sonner';
import type { DataRoomListItem } from '@/types/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RenameDialog } from '@/components/common/rename-dialog';
import { DeleteDataRoomDialog } from '@/components/data-room/delete-data-room-dialog';
import { ShareDialog } from '@/components/sharing/share-dialog';
import { useRenameDataRoom } from '@/hooks/use-data-rooms';

export function DataRoomCard({ room }: { room: DataRoomListItem }) {
  const [renaming, setRenaming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const rename = useRenameDataRoom(room.id);

  return (
    <>
      <div className="group relative flex flex-col gap-3 rounded-2xl border border-ink-100 bg-surface-raised p-4 transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-md hover:shadow-ink-950/5 dark:border-ink-800 dark:hover:border-ink-700">
        <Link to={`/rooms/${room.id}`} className="flex flex-col gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-ink-900 text-gold-400 dark:bg-ink-800">
            <FolderLock className="size-5" />
          </div>
          <div>
            <p className="truncate pr-6 text-sm font-semibold text-ink-900 dark:text-ink-50">{room.name}</p>
            <p className="mt-0.5 text-xs text-ink-400">
              {room.folderCount} folder{room.folderCount === 1 ? '' : 's'} · {room.fileCount} file{room.fileCount === 1 ? '' : 's'}
            </p>
          </div>
          <p className="text-xs text-ink-300">Updated {formatDate(room.updatedAt)}</p>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setSharing(true)}>
              <Share2 className="size-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setRenaming(true)}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <RenameDialog
        open={renaming}
        onOpenChange={setRenaming}
        initialName={room.name}
        title="Rename data room"
        onSubmit={async (name) => {
          await rename.mutateAsync(name);
          toast.success('Data room renamed');
        }}
      />
      <DeleteDataRoomDialog open={deleting} onOpenChange={setDeleting} room={room} />
      {sharing && (
        <ShareDialog open={sharing} onOpenChange={setSharing} resourceType="DATA_ROOM" resourceId={room.id} resourceName={room.name} />
      )}
    </>
  );
}

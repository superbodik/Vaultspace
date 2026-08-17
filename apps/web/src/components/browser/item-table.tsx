import type { AccessRole, FileItem, FolderItem } from '@/types/api';
import { FolderRow } from '@/components/browser/folder-row';
import { FileRow } from '@/components/browser/file-row';

export function ItemTable({
  folders,
  files,
  accessRole,
  roomId,
  roomName,
  currentFolderId,
  shareToken,
  onOpenFolder,
}: {
  folders: FolderItem[];
  files: FileItem[];
  accessRole: AccessRole;
  roomId: string;
  roomName: string;
  currentFolderId: string | null;
  shareToken?: string;
  onOpenFolder: (folderId: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-3 pb-2 text-xs font-medium text-ink-400">
        <span className="flex-1">Name</span>
        <span className="hidden w-16 shrink-0 text-right sm:block">Size</span>
        <span className="hidden w-24 shrink-0 text-right md:block">Modified</span>
        <span className="w-9 shrink-0" />
      </div>
      <div className="flex flex-col gap-0.5">
        {folders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            accessRole={accessRole}
            roomId={roomId}
            roomName={roomName}
            currentFolderId={currentFolderId}
            onOpen={() => onOpenFolder(folder.id)}
          />
        ))}
        {files.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            accessRole={accessRole}
            roomId={roomId}
            roomName={roomName}
            currentFolderId={currentFolderId}
            shareToken={shareToken}
          />
        ))}
      </div>
    </div>
  );
}

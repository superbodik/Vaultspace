import * as React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LogIn, ShieldOff, FolderLock } from 'lucide-react';
import { Topbar } from '@/components/layout/topbar';
import { Breadcrumbs } from '@/components/browser/breadcrumbs';
import { BrowserToolbar } from '@/components/browser/toolbar';
import { ItemTable } from '@/components/browser/item-table';
import { UploadDropzone } from '@/components/browser/upload-dropzone';
import { UploadProgressPanel } from '@/components/browser/upload-progress-panel';
import { NewFolderDialog } from '@/components/browser/new-folder-dialog';
import { ShareDialog } from '@/components/sharing/share-dialog';
import { ActivityDialog } from '@/components/activity/activity-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useBrowse, useSearch } from '@/hooks/use-browse';
import { useUploadQueue } from '@/hooks/use-upload-queue';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';

export function DataRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [params, setParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { enqueue } = useUploadQueue();

  const folderId = params.get('folder');
  const shareToken = params.get('st') ?? undefined;
  const [query, setQuery] = React.useState('');
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [activityOpen, setActivityOpen] = React.useState(false);

  const browse = useBrowse(roomId, folderId, shareToken);
  const search = useSearch(roomId, query, shareToken);

  const openFolder = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('folder', id);
    else next.delete('folder');
    setParams(next, { replace: false });
    setQuery('');
  };

  const handleUpload = (files: File[]) => {
    if (!roomId) return;
    enqueue(files, roomId, folderId);
  };

  if (browse.isError) {
    const notFound = browse.error instanceof ApiError && browse.error.status === 404;
    return (
      <div className="min-h-screen">
        <Topbar />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          {!user && !authLoading ? (
            <EmptyState
              icon={LogIn}
              title="Sign in to view this data room"
              description="This data room requires an account with access."
              action={
                <Button asChild>
                  <Link to="/login" state={{ from: `/rooms/${roomId}${window.location.search}` }}>
                    Sign in
                  </Link>
                </Button>
              }
            />
          ) : notFound ? (
            <EmptyState
              icon={ShieldOff}
              title="You don't have access to this data room"
              description="Ask the owner to share it with you, or check that the link is correct."
              action={
                <Button asChild variant="secondary">
                  <Link to="/dashboard">Back to dashboard</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState icon={ShieldOff} title="Something went wrong" description="Please try again." />
          )}
        </main>
      </div>
    );
  }

  const data = browse.data;
  const isSearching = query.trim().length > 0;
  const displayedFolders = isSearching ? (search.data?.folders ?? []) : (data?.folders ?? []);
  const displayedFiles = isSearching ? (search.data?.files ?? []) : (data?.files ?? []);

  return (
    <UploadDropzone disabled={!data || data.accessRole === 'VIEWER' || data.accessRole === 'NONE'} onFiles={handleUpload}>
      <div className="min-h-screen">
        <Topbar>
          {data && (
            <Breadcrumbs
              roomName={data.dataRoom.name}
              breadcrumbs={data.breadcrumbs}
              onNavigateRoot={() => openFolder(null)}
              onNavigate={(id) => openFolder(id)}
            />
          )}
        </Topbar>

        {data && (
          <BrowserToolbar
            accessRole={data.accessRole}
            query={query}
            onQueryChange={setQuery}
            onNewFolder={() => setNewFolderOpen(true)}
            onUpload={handleUpload}
            onShare={() => setShareOpen(true)}
            onActivity={() => setActivityOpen(true)}
          />
        )}

        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {browse.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : isSearching ? (
            search.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : displayedFolders.length === 0 && displayedFiles.length === 0 ? (
              <EmptyState icon={FolderLock} title="No matches" description={`Nothing found for "${query}".`} />
            ) : (
              <ItemTable
                folders={displayedFolders}
                files={displayedFiles}
                accessRole={data!.accessRole}
                roomId={roomId!}
                roomName={data!.dataRoom.name}
                currentFolderId={folderId}
                shareToken={shareToken}
                onOpenFolder={(id) => openFolder(id)}
              />
            )
          ) : displayedFolders.length === 0 && displayedFiles.length === 0 ? (
            <EmptyState
              icon={FolderLock}
              title={data?.folder ? 'This folder is empty' : 'This data room is empty'}
              description={data && (data.accessRole === 'OWNER' || data.accessRole === 'EDITOR') ? 'Drag and drop files here, or use Upload / New folder above.' : 'There is nothing here yet.'}
            />
          ) : (
            data && (
              <ItemTable
                folders={displayedFolders}
                files={displayedFiles}
                accessRole={data.accessRole}
                roomId={roomId!}
                roomName={data.dataRoom.name}
                currentFolderId={folderId}
                shareToken={shareToken}
                onOpenFolder={(id) => openFolder(id)}
              />
            )
          )}
        </main>

        {roomId && (
          <NewFolderDialog open={newFolderOpen} onOpenChange={setNewFolderOpen} dataRoomId={roomId} parentId={folderId} />
        )}
        {data && shareOpen && (
          <ShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            resourceType={data.folder ? 'FOLDER' : 'DATA_ROOM'}
            resourceId={data.folder ? data.folder.id : data.dataRoom.id}
            resourceName={data.folder ? data.folder.name : data.dataRoom.name}
          />
        )}
        {roomId && activityOpen && <ActivityDialog open={activityOpen} onOpenChange={setActivityOpen} dataRoomId={roomId} />}
      </div>
      <UploadProgressPanel />
    </UploadDropzone>
  );
}

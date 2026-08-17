import * as React from 'react';
import { FolderPlus, History, Search, Share2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AccessRole } from '@/types/api';

export function BrowserToolbar({
  accessRole,
  query,
  onQueryChange,
  onNewFolder,
  onUpload,
  onShare,
  onActivity,
}: {
  accessRole: AccessRole;
  query: string;
  onQueryChange: (q: string) => void;
  onNewFolder: () => void;
  onUpload: (files: File[]) => void;
  onShare: () => void;
  onActivity: () => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const canWrite = accessRole === 'OWNER' || accessRole === 'EDITOR';
  const canShare = accessRole === 'OWNER';

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 px-4 py-3 dark:border-ink-800 sm:px-6">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-300" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search this data room"
          className="pl-8 pr-7"
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
            onClick={() => onQueryChange('')}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {canShare && (
          <>
            <Button variant="outline" size="sm" onClick={onActivity}>
              <History className="size-4" />
              Activity
            </Button>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="size-4" />
              Share
            </Button>
          </>
        )}
        {canWrite && (
          <>
            <Button variant="outline" size="sm" onClick={onNewFolder}>
              <FolderPlus className="size-4" />
              New folder
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) onUpload(files);
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

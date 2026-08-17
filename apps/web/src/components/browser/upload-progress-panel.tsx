import * as React from 'react';
import { Check, ChevronDown, File as FileIcon, X } from 'lucide-react';
import { useUploadQueue } from '@/hooks/use-upload-queue';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/cn';

export function UploadProgressPanel() {
  const { tasks, dismiss } = useUploadQueue();
  const [collapsed, setCollapsed] = React.useState(false);

  if (tasks.length === 0) return null;

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const errorCount = tasks.filter((t) => t.status === 'error').length;
  const active = tasks.filter((t) => t.status !== 'done').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-surface-raised shadow-xl shadow-ink-950/10 animate-slide-up dark:border-ink-800">
      <button
        className="flex w-full items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-800"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="text-sm font-medium text-ink-800 dark:text-ink-100">
          {active > 0 ? `Uploading ${active} item${active === 1 ? '' : 's'}` : `${doneCount} upload${doneCount === 1 ? '' : 's'} complete`}
          {errorCount > 0 && <span className="ml-1.5 text-red-600">· {errorCount} failed</span>}
        </span>
        <ChevronDown className={cn('size-4 text-ink-400 transition-transform', collapsed && '-rotate-90')} />
      </button>
      {!collapsed && (
        <div className="max-h-72 overflow-y-auto scrollbar-thin">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 border-b border-ink-50 px-4 py-2.5 last:border-0 dark:border-ink-800/60">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400 dark:bg-ink-800">
                {task.status === 'done' ? <Check className="size-4 text-emerald-600" /> : <FileIcon className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-ink-700 dark:text-ink-200">{task.fileName}</p>
                {task.status === 'error' ? (
                  <p className="text-xs text-red-600">{task.error}</p>
                ) : task.status === 'done' ? (
                  <p className="text-xs text-ink-400">{formatBytes(task.fileSize)}</p>
                ) : (
                  <Progress value={Math.round(task.progress * 100)} className="mt-1 h-1" />
                )}
              </div>
              <button onClick={() => dismiss(task.id)} className="shrink-0 rounded p-1 text-ink-300 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

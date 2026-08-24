import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, uploadWithProgress } from '@/lib/api';
import { browseKey } from '@/hooks/use-browse';
import { randomId } from '@/lib/id';

export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  dataRoomId: string;
  folderId: string | null;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
  resultName?: string;
}

interface UploadQueueContextValue {
  tasks: UploadTask[];
  enqueue: (files: File[], dataRoomId: string, folderId: string | null) => void;
  dismiss: (id: string) => void;
  clearFinished: () => void;
}

const UploadQueueContext = React.createContext<UploadQueueContextValue | null>(null);
const CONCURRENCY = 3;

export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = React.useState<UploadTask[]>([]);
  const activeAbort = React.useRef(new Map<string, () => void>());
  const queryClient = useQueryClient();

  const runningCount = React.useRef(0);
  const pendingQueue = React.useRef<UploadTask[]>([]);

  const updateTask = (id: string, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const runNext = React.useCallback(() => {
    while (runningCount.current < CONCURRENCY && pendingQueue.current.length > 0) {
      const task = pendingQueue.current.shift()!;
      runningCount.current += 1;
      updateTask(task.id, { status: 'uploading' });

      const form = new FormData();
      const file = fileRegistry.get(task.id);
      if (!file) continue;
      form.append('file', file);
      form.append('dataRoomId', task.dataRoomId);
      if (task.folderId) form.append('folderId', task.folderId);

      const handle = uploadWithProgress('/files/upload', form, (fraction) => {
        updateTask(task.id, { progress: fraction });
      });
      activeAbort.current.set(task.id, handle.abort);

      handle.promise
        .then((result: any) => {
          updateTask(task.id, { status: 'done', progress: 1, resultName: result?.name });
          queryClient.invalidateQueries({ queryKey: browseKey(task.dataRoomId, task.folderId) });
          queryClient.invalidateQueries({ queryKey: ['dataRooms'] });
        })
        .catch((err) => {
          const message = err instanceof ApiError ? err.message : 'Upload failed';
          updateTask(task.id, { status: 'error', error: message });
        })
        .finally(() => {
          activeAbort.current.delete(task.id);
          fileRegistry.delete(task.id);
          runningCount.current -= 1;
          runNext();
        });
    }
  }, [queryClient]);

  const enqueue = React.useCallback(
    (files: File[], dataRoomId: string, folderId: string | null) => {
      const newTasks: UploadTask[] = files.map((file) => {
        const id = randomId();
        fileRegistry.set(id, file);
        return {
          id,
          fileName: file.name,
          fileSize: file.size,
          dataRoomId,
          folderId,
          progress: 0,
          status: 'queued',
        };
      });
      setTasks((prev) => [...prev, ...newTasks]);
      pendingQueue.current.push(...newTasks);
      runNext();
    },
    [runNext],
  );

  const dismiss = React.useCallback((id: string) => {
    activeAbort.current.get(id)?.();
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearFinished = React.useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === 'uploading' || t.status === 'queued'));
  }, []);

  return (
    <UploadQueueContext.Provider value={{ tasks, enqueue, dismiss, clearFinished }}>
      {children}
    </UploadQueueContext.Provider>
  );
}

const fileRegistry = new Map<string, File>();

export function useUploadQueue() {
  const ctx = React.useContext(UploadQueueContext);
  if (!ctx) throw new Error('useUploadQueue must be used within UploadQueueProvider');
  return ctx;
}

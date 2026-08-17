import * as React from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/cn';

export function UploadDropzone({
  disabled,
  onFiles,
  children,
}: {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  children: React.ReactNode;
}) {
  const [dragging, setDragging] = React.useState(false);
  const counter = React.useRef(0);

  if (disabled) return <>{children}</>;

  return (
    <div
      className="relative"
      onDragEnter={(e) => {
        e.preventDefault();
        counter.current += 1;
        if (e.dataTransfer.types.includes('Files')) setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        counter.current -= 1;
        if (counter.current <= 0) {
          counter.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        counter.current = 0;
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
    >
      {children}
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-ink-950/40 backdrop-blur-sm transition-opacity',
          dragging ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gold-400 bg-surface-raised px-12 py-10">
          <UploadCloud className="size-8 text-gold-500" />
          <p className="text-sm font-medium text-ink-800 dark:text-ink-100">Drop files to upload</p>
        </div>
      </div>
    </div>
  );
}

import { Loader2 } from 'lucide-react';

export function PageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="size-6 animate-spin text-ink-400" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={className ?? 'size-4 animate-spin'} />;
}

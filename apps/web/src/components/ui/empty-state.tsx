import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 py-16 text-center dark:border-ink-800', className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{title}</p>
        {description && <p className="max-w-sm text-sm text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

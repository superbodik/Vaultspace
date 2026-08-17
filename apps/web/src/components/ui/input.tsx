import * as React from 'react';
import { cn } from '@/lib/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border border-ink-200 bg-surface-raised px-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors',
        'focus:border-ink-400 focus:ring-2 focus:ring-ink-100',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-ink-700 dark:text-ink-50 dark:focus:border-ink-400 dark:focus:ring-ink-800',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

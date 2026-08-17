import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/cn';

export function Avatar({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn('inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-800 text-white', className)}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn('flex size-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900 text-[11px] font-semibold uppercase tracking-wide text-gold-200', className)}
      {...props}
    />
  );
}

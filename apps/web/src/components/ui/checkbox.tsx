import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Checkbox({ className, ...props }: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded border border-ink-300 bg-surface-raised transition-colors',
        'data-[state=checked]:border-ink-900 data-[state=checked]:bg-ink-900',
        'dark:border-ink-600 dark:data-[state=checked]:border-gold-400 dark:data-[state=checked]:bg-gold-400',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-white dark:text-ink-950">
        <Check className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

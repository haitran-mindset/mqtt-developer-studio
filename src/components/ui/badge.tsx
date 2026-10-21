import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors font-mono select-none',
  {
    variants: {
      variant: {
        default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
        cyan: 'bg-cyan-950/70 text-cyan-400 border border-cyan-800/60',
        emerald: 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60',
        amber: 'bg-amber-950/70 text-amber-400 border border-amber-800/60',
        rose: 'bg-rose-950/70 text-rose-400 border border-rose-800/60',
        outline: 'border border-zinc-700 text-zinc-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-cyan-500 text-zinc-950 shadow hover:bg-cyan-400 font-semibold',
        secondary: 'bg-zinc-800 text-zinc-100 shadow-sm hover:bg-zinc-700 hover:text-white',
        destructive: 'bg-rose-600/90 text-white shadow-sm hover:bg-rose-600',
        outline: 'border border-zinc-700/80 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white text-zinc-300',
        ghost: 'hover:bg-zinc-800/80 hover:text-zinc-100 text-zinc-400',
        link: 'text-cyan-400 underline-offset-4 hover:underline',
        emerald: 'bg-emerald-600 text-white hover:bg-emerald-500 font-semibold',
      },
      size: {
        default: 'h-8 px-3 py-1.5',
        sm: 'h-7 rounded px-2.5 text-xs',
        lg: 'h-9 rounded-md px-4 text-sm',
        icon: 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

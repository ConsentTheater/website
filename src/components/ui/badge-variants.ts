import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        gold: 'border-transparent bg-accent text-accent-foreground',
        required_strict: 'border-transparent bg-red-50 text-red-800 font-mono text-[10px] uppercase tracking-wider px-2 py-0 dark:bg-red-950 dark:text-red-200',
        required: 'border-transparent bg-orange-50 text-orange-800 font-mono text-[10px] uppercase tracking-wider px-2 py-0 dark:bg-orange-950 dark:text-orange-200',
        contested: 'border-transparent bg-amber-50 text-amber-800 font-mono text-[10px] uppercase tracking-wider px-2 py-0 dark:bg-amber-950 dark:text-amber-200',
        minimal: 'border-transparent bg-slate-100 text-slate-600 font-mono text-[10px] uppercase tracking-wider px-2 py-0 dark:bg-slate-800 dark:text-slate-300'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

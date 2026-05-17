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
        required_strict: 'border-transparent bg-red-50 text-red-900 font-mono text-[10px] uppercase tracking-wider px-2 py-0 dark:bg-red-950 dark:text-red-100',
        required: 'border-transparent bg-orange-50 text-orange-900 font-mono text-[10px] uppercase tracking-wider px-2 py-0 dark:bg-orange-950 dark:text-orange-100',
        contested: 'border-transparent bg-amber-50 text-amber-900 font-mono text-[10px] uppercase tracking-wider px-2 py-0 dark:bg-amber-950 dark:text-amber-100',
        minimal: 'border-transparent bg-slate-100 text-slate-700 font-mono text-[10px] uppercase tracking-wider px-2 py-0 dark:bg-slate-800 dark:text-slate-200'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

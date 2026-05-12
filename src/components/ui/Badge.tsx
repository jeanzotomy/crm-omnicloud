import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';

const variants: Record<Variant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-700',
  secondary: 'bg-secondary text-secondary-foreground',
};

interface BadgeProps {
  label: string;
  variant?: Variant;
  className?: string;
}

export default function Badge({ label, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {label}
    </span>
  );
}

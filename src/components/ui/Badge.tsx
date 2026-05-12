import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'purple';

const variants: Record<Variant, string> = {
  default:   'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
  success:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  warning:   'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  danger:    'bg-red-50 text-red-600 ring-1 ring-red-100',
  info:      'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
  secondary: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  purple:    'bg-purple-50 text-purple-700 ring-1 ring-purple-100',
};

interface BadgeProps {
  label: string;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}

const dotColor: Record<Variant, string> = {
  default:   'bg-indigo-500',
  success:   'bg-emerald-500',
  warning:   'bg-amber-500',
  danger:    'bg-red-500',
  info:      'bg-sky-500',
  secondary: 'bg-gray-400',
  purple:    'bg-purple-500',
};

export default function Badge({ label, variant = 'default', dot = false, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor[variant])} />}
      {label}
    </span>
  );
}

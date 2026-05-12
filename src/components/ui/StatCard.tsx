import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: 'blue' | 'violet' | 'emerald' | 'amber';
  className?: string;
}

const colorMap = {
  blue: {
    icon: 'bg-blue-50 text-blue-600',
    accent: 'bg-blue-600',
    glow: 'shadow-blue-100',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600',
    accent: 'bg-violet-600',
    glow: 'shadow-violet-100',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600',
    accent: 'bg-emerald-600',
    glow: 'shadow-emerald-100',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    accent: 'bg-amber-600',
    glow: 'shadow-amber-100',
  },
};

export default function StatCard({ title, value, icon: Icon, description, color = 'blue', className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shadow-sm', c.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className={cn('absolute bottom-0 left-0 h-1 w-full opacity-80', c.accent)} />
    </div>
  );
}

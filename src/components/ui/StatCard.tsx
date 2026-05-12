import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-card border rounded-xl p-6 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <p className={cn('text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-destructive')}>
            {trend.positive ? '+' : ''}{trend.value}% ce mois
          </p>
        )}
      </div>
    </div>
  );
}

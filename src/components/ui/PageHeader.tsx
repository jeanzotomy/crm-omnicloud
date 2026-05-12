import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/admin', label: 'Vue d\'ensemble', exact: true },
  { href: '/admin/modules', label: 'Modules' },
  { href: '/admin/users', label: 'Utilisateurs' },
  { href: '/admin/sla', label: 'Politiques SLA' },
  { href: '/admin/teams', label: 'Équipes' },
  { href: '/admin/workflow', label: 'Automatisation' },
];

export default function AdminNav() {
  const path = usePathname();

  return (
    <nav className="flex gap-1 mt-4 -mb-px">
      {tabs.map(({ href, label, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
              active
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, Users, Building2, TrendingUp, LogOut, ChevronRight,
  Ticket, BookOpen, BarChart3, ShieldCheck, AlertCircle,
  Phone, Monitor, Settings2, Plug,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type Section = { label: string; items: NavItem[] };

const SUPPORT_SECTION: Section = {
  label: 'Support',
  items: [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/tickets', label: 'File de tickets', icon: Ticket },
  ],
};

const CRM_SECTION: Section = {
  label: 'CRM',
  items: [
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/companies', label: 'Entreprises', icon: Building2 },
    { href: '/opportunities', label: 'Opportunités', icon: TrendingUp },
  ],
};

const RESOURCES_SECTION: Section = {
  label: 'Ressources',
  items: [
    { href: '/knowledge', label: 'Base de connaissances', icon: BookOpen },
    { href: '/reports', label: 'Rapports', icon: BarChart3 },
  ],
};

const CALL_CENTER_SECTION: Section = {
  label: 'Centre d\'appel',
  items: [
    { href: '/call-center/agent', label: 'Bureau agent', icon: Phone },
    { href: '/call-center/supervisor', label: 'Superviseur', icon: Monitor },
    { href: '/call-center/admin', label: 'Configuration CC', icon: Settings2 },
  ],
};

const INTEGRATIONS_SECTION: Section = {
  label: 'Intégrations',
  items: [
    { href: '/integrations', label: 'Connecteurs & API', icon: Plug },
  ],
};

const ADMIN_SECTION: Section = {
  label: 'Administration',
  items: [
    { href: '/admin', label: 'Administration', icon: ShieldCheck },
  ],
};

function isActive(path: string, href: string) {
  if (href === '/dashboard') return path === href;
  return path.startsWith(href);
}

export default function Sidebar() {
  const path = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const orgRole = session?.user?.orgRole;

  const enabled = session?.user?.enabledModules ?? [];
  // If no modules are configured yet, show core sections (backward compat)
  const noConfig = enabled.length === 0;

  const showSupport      = noConfig || enabled.includes('SUPPORT');
  const showCrm          = noConfig || enabled.includes('CRM');
  const showCallCenter   = enabled.includes('CALL_CENTER');
  const showIntegrations = enabled.includes('INTEGRATIONS');

  // Restrict CC sections by org role
  const ccItems = CALL_CENTER_SECTION.items.filter(item => {
    if (item.href === '/call-center/agent') return orgRole === 'AGENT' || orgRole === 'MANAGER' || orgRole === 'ADMIN' || orgRole === 'OWNER';
    if (item.href === '/call-center/supervisor') return orgRole === 'MANAGER' || orgRole === 'ADMIN' || orgRole === 'OWNER';
    if (item.href === '/call-center/admin') return orgRole === 'ADMIN' || orgRole === 'OWNER' || isAdmin;
    return false;
  });

  const sections: Section[] = [
    ...(showSupport ? [SUPPORT_SECTION] : []),
    ...(showCrm ? [CRM_SECTION] : []),
    ...(showSupport || showCrm ? [RESOURCES_SECTION] : []),
    ...(showCallCenter && ccItems.length > 0 ? [{ ...CALL_CENTER_SECTION, items: ccItems }] : []),
    ...(showIntegrations ? [INTEGRATIONS_SECTION] : []),
    ...(isAdmin ? [ADMIN_SECTION] : []),
  ];

  return (
    <aside className="w-64 flex flex-col min-h-screen sidebar-bg shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 sidebar-border border-b">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-wide">OmniCloud OS</span>
            <p className="text-[10px] text-indigo-300/70 leading-none mt-0.5">Plateforme métier unifiée</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400/50 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(path, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'sidebar-text hover:bg-white/8 hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0 transition-transform', active ? 'text-white' : 'text-indigo-400 group-hover:text-white')} />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 sidebar-border border-t space-y-1">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium sidebar-text hover:bg-white/8 hover:text-white transition-all duration-150"
        >
          <LogOut className="h-4 w-4 text-indigo-400 group-hover:text-white" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

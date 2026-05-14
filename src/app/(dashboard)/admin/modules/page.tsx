'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ModuleType } from '@prisma/client';
import { MODULE_DEFS, ALL_MODULES } from '@/lib/modules';
import {
  Users, Ticket, Phone, UserSquare2, DollarSign, FolderOpen, Plug,
  Check, Lock, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleRow {
  module: ModuleType;
  enabled: boolean;
  config: Record<string, unknown>;
  enabledAt: string | null;
}

const MODULE_ICONS: Record<ModuleType, React.ComponentType<{ className?: string }>> = {
  CRM:          Users,
  SUPPORT:      Ticket,
  CALL_CENTER:  Phone,
  HR:           UserSquare2,
  FINANCE:      DollarSign,
  GED:          FolderOpen,
  INTEGRATIONS: Plug,
};

const COLOR_CLASSES: Record<string, { bg: string; icon: string; ring: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', ring: 'ring-violet-500', badge: 'bg-violet-100 text-violet-700' },
  sky: { bg: 'bg-sky-50', icon: 'text-sky-600', ring: 'ring-sky-500', badge: 'bg-sky-100 text-sky-700' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-500', badge: 'bg-amber-100 text-amber-700' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', ring: 'ring-orange-500', badge: 'bg-orange-100 text-orange-700' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-600', ring: 'ring-rose-500', badge: 'bg-rose-100 text-rose-700' },
};

export default function ModulesPage() {
  const { update } = useSession();
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<ModuleType | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/modules');
    if (res.ok) setRows(await res.json() as ModuleRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (module: ModuleType, enabled: boolean) => {
    setToggling(module);
    const res = await fetch('/api/modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, enabled }),
    });
    if (res.ok) {
      const updated = await res.json() as ModuleRow;
      setRows(prev => prev.map(r => r.module === module ? { ...r, ...updated } : r));
      // Refresh JWT so sidebar reflects change immediately
      await update();
    }
    setToggling(null);
  };

  const rowMap = new Map(rows.map(r => [r.module, r]));

  if (loading) return <div className="p-8 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Modules de la plateforme</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Activez les modules disponibles pour votre organisation. Les changements sont appliqués immédiatement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ALL_MODULES.map(module => {
          const def = MODULE_DEFS[module];
          const row = rowMap.get(module);
          const enabled = row?.enabled ?? false;
          const isToggling = toggling === module;
          const c = COLOR_CLASSES[def.color];
          const Icon = MODULE_ICONS[module];

          return (
            <div
              key={module}
              className={cn(
                'relative rounded-2xl border-2 bg-white p-5 transition-all',
                enabled ? `border-${def.color}-200 shadow-sm` : 'border-gray-100',
                !def.available && 'opacity-60',
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
                    <Icon className={cn('h-5 w-5', c.icon)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{def.label}</p>
                    {!def.available && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 mt-0.5">
                        <Lock className="h-2.5 w-2.5" /> Bientôt disponible
                      </span>
                    )}
                    {def.available && enabled && (
                      <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full', c.badge)}>
                        <Check className="h-2.5 w-2.5" /> Actif
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <button
                  disabled={!def.available || isToggling}
                  onClick={() => void toggle(module, !enabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40',
                    enabled ? `bg-${def.color}-600 focus:ring-${def.color}-500` : 'bg-gray-200 focus:ring-gray-400',
                  )}
                  aria-pressed={enabled}
                >
                  <span
                    className={cn(
                      'inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ring-0 transition-transform',
                      enabled ? 'translate-x-6' : 'translate-x-1',
                    )}
                  >
                    {isToggling && <Loader2 className="h-2.5 w-2.5 animate-spin text-gray-400" />}
                  </span>
                </button>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">{def.description}</p>

              {/* Feature list */}
              <ul className="mt-3 space-y-1">
                {def.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', enabled ? c.icon.replace('text-', 'bg-') : 'bg-gray-300')} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

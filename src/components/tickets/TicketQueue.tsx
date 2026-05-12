'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Clock, MessageSquare, SlidersHorizontal, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { ticketStatusBadge, ticketPriorityBadge, ticketTypeBadge } from '@/lib/badges';
import { formatDate } from '@/lib/utils';
import { TicketStatus, TicketPriority } from '@prisma/client';
import type { TicketType } from '@prisma/client';

interface Ticket {
  id: string;
  number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  category: string | null;
  slaBreached: boolean;
  dueAt: string | null;
  createdAt: string;
  assignee: { name: string | null } | null;
  team: { name: string } | null;
  contact: { firstName: string; lastName: string } | null;
  company: { name: string } | null;
  _count: { comments: number };
}

type TabId = '' | 'NEW' | 'OPEN' | 'PENDING' | 'CRITICAL';

const TABS: { id: TabId; label: string; status?: string; priority?: string }[] = [
  { id: '', label: 'Tous' },
  { id: 'NEW', label: 'Nouveaux', status: 'NEW' },
  { id: 'OPEN', label: 'Ouverts', status: 'OPEN' },
  { id: 'CRITICAL', label: 'Critiques', priority: 'CRITICAL' },
  { id: 'PENDING', label: 'En attente', status: 'PENDING' },
];

const PRIORITY_STRIPE: Record<TicketPriority, string> = {
  CRITICAL: 'border-l-red-500',
  HIGH: 'border-l-orange-400',
  MEDIUM: 'border-l-indigo-400',
  LOW: 'border-l-gray-200',
};

const PRIORITY_ROW_BG: Record<TicketPriority, string> = {
  CRITICAL: 'hover:bg-red-50/30',
  HIGH: 'hover:bg-orange-50/30',
  MEDIUM: 'hover:bg-gray-50/70',
  LOW: 'hover:bg-gray-50/70',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: TicketStatus.NEW, label: 'Nouveau' },
  { value: TicketStatus.OPEN, label: 'Ouvert' },
  { value: TicketStatus.PENDING, label: 'En attente' },
  { value: TicketStatus.ON_HOLD, label: 'Suspendu' },
  { value: TicketStatus.RESOLVED, label: 'Résolu' },
  { value: TicketStatus.CLOSED, label: 'Fermé' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Toutes les priorités' },
  { value: 'CRITICAL', label: 'Critique' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'LOW', label: 'Basse' },
];

export default function TicketQueue() {
  const [data, setData] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) p.set('search', search);
    if (status) p.set('status', status);
    if (priority) p.set('priority', priority);
    const res = await fetch(`/api/tickets?${p}`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, search, status, priority]);

  useEffect(() => {
    const t = setTimeout(fetchTickets, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchTickets]);

  function applyTab(tab: (typeof TABS)[number]) {
    setActiveTab(tab.id);
    setStatus(tab.status ?? '');
    setPriority(tab.priority ?? '');
    setPage(1);
  }

  const totalPages = Math.ceil(total / pageSize);
  const now = new Date();
  const hasActiveFilters = search || (status && !activeTab) || (priority && activeTab !== 'CRITICAL');

  return (
    <div className="space-y-0">
      {/* Quick tabs */}
      <div className="flex items-center gap-1 border-b border-gray-100 bg-white px-1 mb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => applyTab(tab)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600 after:rounded-t'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
            {tab.id === 'CRITICAL' && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">!</span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 py-2 pr-1">
          <span className="text-xs text-gray-400 font-medium">{total} ticket{total !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
              ${showFilters ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'text-gray-500 hover:bg-gray-100 border border-transparent'}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtres
            {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 bg-indigo-50/50 border-b border-indigo-100 px-4 py-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un ticket, numéro…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setActiveTab(''); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setActiveTab(''); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setPriority(''); setActiveTab(''); setPage(1); }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left pl-8 pr-5 py-3 font-semibold text-[11px] text-gray-400 uppercase tracking-wider">Ticket</th>
              <th className="text-left px-5 py-3 font-semibold text-[11px] text-gray-400 uppercase tracking-wider hidden lg:table-cell">Type</th>
              <th className="text-left px-5 py-3 font-semibold text-[11px] text-gray-400 uppercase tracking-wider">Statut</th>
              <th className="text-left px-5 py-3 font-semibold text-[11px] text-gray-400 uppercase tracking-wider">Priorité</th>
              <th className="text-left px-5 py-3 font-semibold text-[11px] text-gray-400 uppercase tracking-wider hidden xl:table-cell">Assigné à</th>
              <th className="text-left px-5 py-3 font-semibold text-[11px] text-gray-400 uppercase tracking-wider hidden md:table-cell">Échéance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="pl-8 pr-5 py-4" colSpan={6}>
                  <div className="flex items-center gap-3 animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-16" />
                    <div className="h-3 bg-gray-100 rounded flex-1" />
                  </div>
                </td>
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                    <AlertCircle className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Aucun ticket trouvé</p>
                  <p className="text-xs text-gray-300 mt-1">Modifiez vos filtres ou créez un nouveau ticket</p>
                </td>
              </tr>
            )}
            {!loading && data.map((t) => {
              const sb = ticketStatusBadge(t.status);
              const pb = ticketPriorityBadge(t.priority);
              const tb = ticketTypeBadge(t.type);
              const isOverdue = t.dueAt && new Date(t.dueAt) < now && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED;
              return (
                <tr key={t.id} className={`transition-colors group border-l-4 ${PRIORITY_STRIPE[t.priority]} ${PRIORITY_ROW_BG[t.priority]}`}>
                  <td className="pl-4 pr-5 py-3.5">
                    <Link href={`/tickets/${t.id}`} className="group/link block">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-gray-400 tabular-nums">{t.number}</span>
                        {t.slaBreached && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
                            <AlertCircle className="h-2.5 w-2.5" /> SLA
                          </span>
                        )}
                        {t._count.comments > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                            <MessageSquare className="h-3 w-3" /> {t._count.comments}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 group-hover/link:text-indigo-600 transition-colors line-clamp-1 text-[13px]">{t.title}</p>
                      {(t.contact || t.company) && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {t.contact ? `${t.contact.firstName} ${t.contact.lastName}` : ''}
                          {t.contact && t.company ? ' · ' : ''}
                          {t.company?.name}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <Badge label={tb.label} variant={tb.variant} />
                  </td>
                  <td className="px-5 py-3.5"><Badge label={sb.label} variant={sb.variant} dot /></td>
                  <td className="px-5 py-3.5"><Badge label={pb.label} variant={pb.variant} /></td>
                  <td className="px-5 py-3.5 hidden xl:table-cell">
                    {t.assignee?.name ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-indigo-600">{t.assignee.name[0]}</span>
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[120px]">{t.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Non assigné</span>
                    )}
                    {t.team && <p className="text-[11px] text-gray-400 mt-0.5 pl-8">{t.team.name}</p>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {t.dueAt ? (
                      <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {isOverdue && <Clock className="h-3.5 w-3.5 shrink-0" />}
                        {formatDate(t.dueAt)}
                      </div>
                    ) : <span className="text-gray-200 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">{total} ticket{total !== 1 ? 's' : ''} au total</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-all
                    ${page === p ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-gray-500 hover:bg-white hover:border hover:border-gray-200'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

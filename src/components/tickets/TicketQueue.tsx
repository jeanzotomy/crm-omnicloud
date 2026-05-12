'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { ticketStatusBadge, ticketPriorityBadge, ticketTypeBadge } from '@/lib/badges';
import { formatDate } from '@/lib/utils';
import type { TicketStatus, TicketPriority, TicketType } from '@prisma/client';

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

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'NEW', label: 'Nouveau' },
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ON_HOLD', label: 'Suspendu' },
  { value: 'RESOLVED', label: 'Résolu' },
  { value: 'CLOSED', label: 'Fermé' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Toutes les priorités' },
  { value: 'CRITICAL', label: 'Critique' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'LOW', label: 'Basse' },
];

const priorityOrder: Record<TicketPriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function TicketQueue() {
  const [data, setData] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetch_ = useCallback(async () => {
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
    const t = setTimeout(fetch_, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetch_, search]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un ticket…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{total} ticket{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Ticket</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Priorité</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden xl:table-cell">Assigné</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">Échéance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">Chargement…</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun ticket trouvé.</p>
                </td>
              </tr>
            )}
            {!loading && data.map((t) => {
              const sb = ticketStatusBadge(t.status);
              const pb = ticketPriorityBadge(t.priority);
              const tb = ticketTypeBadge(t.type);
              const isOverdue = t.dueAt && new Date(t.dueAt) < new Date() && !['RESOLVED', 'CLOSED'].includes(t.status);
              return (
                <tr key={t.id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/tickets/${t.id}`} className="group/link">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">{t.number}</span>
                        {t.slaBreached && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                        {t._count.comments > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <MessageSquare className="h-3 w-3" /> {t._count.comments}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 group-hover/link:text-indigo-600 transition-colors mt-0.5 line-clamp-1">{t.title}</p>
                      {(t.contact || t.company) && (
                        <p className="text-xs text-gray-400 mt-0.5">
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
                  <td className="px-5 py-3.5 hidden xl:table-cell text-gray-500 text-xs">
                    {t.assignee?.name ?? <span className="text-gray-300 italic">Non assigné</span>}
                    {t.team && <p className="text-gray-400">{t.team.name}</p>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {t.dueAt ? (
                      <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                        {isOverdue && <Clock className="h-3.5 w-3.5" />}
                        {formatDate(t.dueAt)}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{total} ticket{total !== 1 ? 's' : ''} au total</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-40 transition-all">
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-40 transition-all">
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

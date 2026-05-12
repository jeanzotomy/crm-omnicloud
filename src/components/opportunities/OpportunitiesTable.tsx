'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { stageBadge } from '@/lib/badges';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OpportunityStage } from '@prisma/client';

interface Opportunity {
  id: string;
  title: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  contact: { firstName: string; lastName: string } | null;
  company: { name: string } | null;
  closeDate: string | null;
  updatedAt: string;
}

interface ApiResponse {
  data: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
}

const STAGE_OPTIONS = [
  { value: '', label: 'Toutes les étapes' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'QUALIFIED', label: 'Qualifié' },
  { value: 'PROPOSAL', label: 'Proposition' },
  { value: 'NEGOTIATION', label: 'Négociation' },
  { value: 'WON', label: 'Gagné' },
  { value: 'LOST', label: 'Perdu' },
];

export default function OpportunitiesTable() {
  const [data, setData] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    if (stage) params.set('stage', stage);
    const res = await fetch(`/api/opportunities?${params}`);
    const json: ApiResponse = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, search, stage]);

  useEffect(() => {
    const timer = setTimeout(fetchOpportunities, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchOpportunities, search]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une opportunité…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          />
        </div>
        <select
          value={stage}
          onChange={(e) => { setStage(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
        >
          {STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Opportunité</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Étape</th>
              <th className="text-right px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Valeur</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden lg:table-cell">Proba.</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden xl:table-cell">Clôture</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">Chargement…</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <TrendingUp className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucune opportunité trouvée.</p>
                </td>
              </tr>
            )}
            {!loading && data.map((opp) => {
              const badge = stageBadge(opp.stage);
              return (
                <tr key={opp.id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/opportunities/${opp.id}`} className="font-semibold text-gray-800 hover:text-indigo-600 transition-colors">
                      {opp.title}
                    </Link>
                    {opp.company && <p className="text-xs text-gray-400 mt-0.5">{opp.company.name}</p>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-gray-500 text-sm">
                    {opp.contact ? `${opp.contact.firstName} ${opp.contact.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-3.5"><Badge label={badge.label} variant={badge.variant} dot /></td>
                  <td className="px-5 py-3.5 text-right font-bold text-gray-800 tabular-nums">{formatCurrency(opp.value)}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${opp.probability}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{opp.probability}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden xl:table-cell text-gray-400 text-xs">
                    {opp.closeDate ? formatDate(opp.closeDate) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{total} opportunité{total > 1 ? 's' : ''} au total</span>
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
    setData(json.data);
    setTotal(json.total);
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={stage}
          onChange={(e) => { setStage(e.target.value); setPage(1); }}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Titre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Étape</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valeur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Proba.</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Clôture</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Chargement…</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune opportunité trouvée.</td></tr>
            )}
            {!loading && data.map((opp) => {
              const badge = stageBadge(opp.stage);
              return (
                <tr key={opp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/opportunities/${opp.id}`} className="font-medium hover:underline">{opp.title}</Link>
                    {opp.company && <p className="text-xs text-muted-foreground">{opp.company.name}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {opp.contact ? `${opp.contact.firstName} ${opp.contact.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge label={badge.label} variant={badge.variant} /></td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(opp.value)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{opp.probability}%</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">
                    {opp.closeDate ? formatDate(opp.closeDate) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} opportunité{total > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-accent disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>Page {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-accent disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

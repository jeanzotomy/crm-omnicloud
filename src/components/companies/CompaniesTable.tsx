'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  _count: { contacts: number; opportunities: number };
  createdAt: string;
}

interface ApiResponse {
  data: Company[];
  total: number;
  page: number;
  pageSize: number;
}

export default function CompaniesTable() {
  const [data, setData] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    const res = await fetch(`/api/companies?${params}`);
    const json: ApiResponse = await res.json();
    setData(json.data);
    setTotal(json.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchCompanies, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCompanies, search]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Secteur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Localisation</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contacts</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Créé le</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chargement…</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucune entreprise trouvée.</td></tr>
            )}
            {!loading && data.map((company) => (
              <tr key={company.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/companies/${company.id}`} className="font-medium hover:underline">{company.name}</Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{company.industry ?? '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                  {[company.city, company.country].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {company._count.contacts} contact{company._count.contacts !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">{formatDate(company.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} entreprise{total > 1 ? 's' : ''}</span>
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

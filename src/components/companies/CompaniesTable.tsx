'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Building2, Users } from 'lucide-react';
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

function CompanyAvatar({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${c}`}>
      {initials}
    </div>
  );
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
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une entreprise…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Entreprise</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">Secteur</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden lg:table-cell">Localisation</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Contacts</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden xl:table-cell">Ajouté</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">Chargement…</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <Building2 className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucune entreprise trouvée.</p>
                </td>
              </tr>
            )}
            {!loading && data.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50/70 transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <CompanyAvatar name={company.name} />
                    <Link href={`/companies/${company.id}`} className="font-semibold text-gray-800 hover:text-indigo-600 transition-colors">
                      {company.name}
                    </Link>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  {company.industry
                    ? <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{company.industry}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-sm">
                  {[company.city, company.country].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm">{company._count.contacts}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden xl:table-cell text-gray-400 text-xs">{formatDate(company.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{total} entreprise{total > 1 ? 's' : ''} au total</span>
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { statusBadge } from '@/lib/badges';
import { formatDate } from '@/lib/utils';
import type { ContactStatus } from '@prisma/client';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  status: ContactStatus;
  company: { name: string } | null;
  createdAt: string;
}

interface ApiResponse {
  data: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'INACTIVE', label: 'Inactif' },
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700'];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${c}`}>
      {initials}
    </div>
  );
}

export default function ContactsTable() {
  const [data, setData] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const res = await fetch(`/api/contacts?${params}`);
    const json: ApiResponse = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchContacts, search]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un contact…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider hidden lg:table-cell">Entreprise</th>
              <th className="text-left px-5 py-3.5 font-semibold text-xs text-gray-500 uppercase tracking-wider">Statut</th>
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
                  <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun contact trouvé.</p>
                </td>
              </tr>
            )}
            {!loading && data.map((contact) => {
              const badge = statusBadge(contact.status);
              const fullName = `${contact.firstName} ${contact.lastName}`;
              return (
                <tr key={contact.id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={fullName} />
                      <div>
                        <Link href={`/contacts/${contact.id}`} className="font-semibold text-gray-800 hover:text-indigo-600 transition-colors">
                          {fullName}
                        </Link>
                        {contact.title && <p className="text-xs text-gray-400">{contact.title}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-gray-500 text-sm">{contact.email ?? '—'}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-sm">{contact.company?.name ?? '—'}</td>
                  <td className="px-5 py-3.5"><Badge label={badge.label} variant={badge.variant} dot /></td>
                  <td className="px-5 py-3.5 hidden xl:table-cell text-gray-400 text-xs">{formatDate(contact.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{total} contact{total > 1 ? 's' : ''} au total</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-40 transition-all"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

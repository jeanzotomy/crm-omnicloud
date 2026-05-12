'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'INACTIVE', label: 'Inactif' },
];

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
    setData(json.data);
    setTotal(json.total);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchContacts, search]);

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
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Entreprise</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Créé le</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Chargement…</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun contact trouvé.</td></tr>
            )}
            {!loading && data.map((contact) => {
              const badge = statusBadge(contact.status);
              return (
                <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                      {contact.firstName} {contact.lastName}
                    </Link>
                    {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{contact.email ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{contact.company?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge label={badge.label} variant={badge.variant} /></td>
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">{formatDate(contact.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} contact{total > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-accent disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

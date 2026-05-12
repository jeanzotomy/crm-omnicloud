'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Team { id: string; name: string }
interface Dept { id: string; name: string }
interface Contact { id: string; firstName: string; lastName: string }
interface Company { id: string; name: string }
interface SLA { id: string; name: string; priority: string }

interface Props {
  teams: Team[];
  departments: Dept[];
  contacts: Contact[];
  companies: Company[];
  slas: SLA[];
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critique',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

const TYPE_LABELS: Record<string, string> = {
  INCIDENT: 'Incident',
  SERVICE_REQUEST: 'Demande de service',
  PROBLEM: 'Problème',
  CHANGE: 'Changement',
};

const SOURCE_LABELS: Record<string, string> = {
  PORTAL: 'Portail',
  EMAIL: 'Email',
  PHONE: 'Téléphone',
  CHAT: 'Chat',
  API: 'API',
};

export default function TicketForm({ teams, departments, contacts, companies, slas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get('title'),
      description: fd.get('description'),
      priority: fd.get('priority'),
      type: fd.get('type'),
      source: fd.get('source'),
      category: fd.get('category') || null,
      teamId: fd.get('teamId') || null,
      departmentId: fd.get('departmentId') || null,
      contactId: fd.get('contactId') || null,
      companyId: fd.get('companyId') || null,
      slaPolicyId: fd.get('slaPolicyId') || null,
    };

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Une erreur est survenue.');
      setLoading(false);
      return;
    }

    const ticket = await res.json();
    router.push(`/tickets/${ticket.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider text-gray-400 mb-1">Informations générales</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Titre <span className="text-red-500">*</span></label>
          <input name="title" required placeholder="Décrivez brièvement le problème…"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Description <span className="text-red-500">*</span></label>
          <textarea name="description" required rows={5} placeholder="Décrivez en détail le problème, les étapes pour le reproduire, l'impact…"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Priorité</label>
            <select name="priority" defaultValue="MEDIUM" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Type</label>
            <select name="type" defaultValue="INCIDENT" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Source</label>
            <select name="source" defaultValue="PORTAL" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Catégorie</label>
            <input name="category" placeholder="ex. Réseau, Accès, Matériel…"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider text-gray-400 mb-1">Affectation & SLA</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Équipe</label>
            <select name="teamId" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Aucune équipe —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Département</label>
            <select name="departmentId" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Aucun —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Politique SLA</label>
            <select name="slaPolicyId" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Aucun SLA —</option>
              {slas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider text-gray-400 mb-1">Contact & Entreprise</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Contact</label>
            <select name="contactId" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Aucun —</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Entreprise</label>
            <select name="companyId" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Aucune —</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="rounded-xl bg-indigo-600 text-white px-6 py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm">
          {loading ? 'Création…' : 'Créer le ticket'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-xl border border-gray-200 text-gray-600 px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}

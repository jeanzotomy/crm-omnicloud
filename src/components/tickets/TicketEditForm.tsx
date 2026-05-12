'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Ticket, TicketStatus, TicketPriority, TicketType, TicketSource } from '@prisma/client';

interface Agent { id: string; name: string | null }
interface Team { id: string; name: string }
interface Dept { id: string; name: string }
interface Contact { id: string; firstName: string; lastName: string }
interface Company { id: string; name: string }
interface SLA { id: string; name: string; priority: string }

interface Props {
  ticket: Ticket;
  agents: Agent[];
  teams: Team[];
  departments: Dept[];
  contacts: Contact[];
  companies: Company[];
  slas: SLA[];
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Nouveau', OPEN: 'Ouvert', PENDING: 'En attente',
  ON_HOLD: 'Suspendu', RESOLVED: 'Résolu', CLOSED: 'Fermé',
};
const PRIORITY_LABELS: Record<TicketPriority, string> = {
  CRITICAL: 'Critique', HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse',
};
const TYPE_LABELS: Record<TicketType, string> = {
  INCIDENT: 'Incident', SERVICE_REQUEST: 'Demande de service', PROBLEM: 'Problème', CHANGE: 'Changement',
};
const SOURCE_LABELS: Record<TicketSource, string> = {
  PORTAL: 'Portail', EMAIL: 'Email', PHONE: 'Téléphone', CHAT: 'Chat', API: 'API',
};

export default function TicketEditForm({ ticket, agents, teams, departments, contacts, companies, slas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string | null> = {};
    for (const [k, v] of fd.entries()) {
      body[k] = v.toString() || null;
    }

    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Une erreur est survenue.');
      setLoading(false);
      return;
    }
    router.push(`/tickets/${ticket.id}`);
  }

  const Field = ({ label, name, children }: { label: string; name?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );

  const sel = (name: string, def: string, opts: [string, string][]) => (
    <select name={name} defaultValue={def} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Informations</h2>
        <Field label="Titre">
          <input name="title" defaultValue={ticket.title} required
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
        </Field>
        <Field label="Description">
          <textarea name="description" defaultValue={ticket.description} required rows={5}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Statut">{sel('status', ticket.status, Object.entries(STATUS_LABELS) as [string, string][])}</Field>
          <Field label="Priorité">{sel('priority', ticket.priority, Object.entries(PRIORITY_LABELS) as [string, string][])}</Field>
          <Field label="Type">{sel('type', ticket.type, Object.entries(TYPE_LABELS) as [string, string][])}</Field>
          <Field label="Source">{sel('source', ticket.source, Object.entries(SOURCE_LABELS) as [string, string][])}</Field>
        </div>
        <Field label="Catégorie">
          <input name="category" defaultValue={ticket.category ?? ''}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Affectation</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Agent assigné">
            <select name="assigneeId" defaultValue={ticket.assigneeId ?? ''} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Non assigné —</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Équipe">
            <select name="teamId" defaultValue={ticket.teamId ?? ''} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Aucune —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Département">
            <select name="departmentId" defaultValue={ticket.departmentId ?? ''} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Aucun —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="SLA">
            <select name="slaPolicyId" defaultValue={ticket.slaPolicyId ?? ''} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
              <option value="">— Aucun —</option>
              {slas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="rounded-xl bg-indigo-600 text-white px-6 py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-xl border border-gray-200 text-gray-600 px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { TicketPriority } from '@prisma/client';
import { ShieldCheck, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface SLAPolicy {
  id: string;
  name: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  _count: { tickets: number };
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  CRITICAL: 'Critique',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-gray-100 text-gray-600',
};

function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

const emptyForm = { name: '', priority: 'MEDIUM' as TicketPriority, firstResponseMinutes: 60, resolutionMinutes: 480 };

export default function AdminSLAPage() {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SLAPolicy | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/sla');
    if (res.ok) setPolicies(await res.json() as SLAPolicy[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setCreating(true); };
  const openEdit = (p: SLAPolicy) => {
    setForm({ name: p.name, priority: p.priority, firstResponseMinutes: p.firstResponseMinutes, resolutionMinutes: p.resolutionMinutes });
    setEditing(p);
    setCreating(true);
  };
  const closeForm = () => { setCreating(false); setEditing(null); };

  const save = async () => {
    setSaving(true);
    const url = editing ? `/api/sla/${editing.id}` : '/api/sla';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { await load(); closeForm(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette politique SLA ?')) return;
    setDeleting(id);
    await fetch(`/api/sla/${id}`, { method: 'DELETE' });
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  if (loading) return <div className="p-8 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Politiques SLA ({policies.length})</h2>
            <p className="text-xs text-gray-500">Niveaux de service par priorité</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nouvelle politique
        </button>
      </div>

      {/* Formulaire inline */}
      {creating && (
        <div className="mb-6 rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">{editing ? 'Modifier la politique' : 'Nouvelle politique SLA'}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="SLA Standard"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priorité</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {Object.values(TicketPriority).map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Première réponse (min)</label>
              <input
                type="number" min={1}
                value={form.firstResponseMinutes}
                onChange={(e) => setForm({ ...form, firstResponseMinutes: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Résolution (min)</label>
              <input
                type="number" min={1}
                value={form.resolutionMinutes}
                onChange={(e) => setForm({ ...form, resolutionMinutes: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => void save()}
              disabled={saving || !form.name}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Check className="h-3.5 w-3.5" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={closeForm} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <X className="h-3.5 w-3.5" /> Annuler
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Priorité</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">1ère réponse</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Résolution</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tickets</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {policies.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Aucune politique SLA définie</td></tr>
            )}
            {policies.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[p.priority]}`}>
                    {PRIORITY_LABELS[p.priority]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{fmtDuration(p.firstResponseMinutes)}</td>
                <td className="px-4 py-3 text-gray-600">{fmtDuration(p.resolutionMinutes)}</td>
                <td className="px-4 py-3 text-gray-500">{p._count.tickets}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => void remove(p.id)}
                      disabled={deleting === p.id || p._count.tickets > 0}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={p._count.tickets > 0 ? 'Des tickets utilisent cette politique' : 'Supprimer'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

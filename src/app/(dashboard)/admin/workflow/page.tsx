'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkflowTrigger, TicketPriority, TicketStatus, TicketType, TicketSource } from '@prisma/client';
import { Zap, Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import type { WorkflowCondition, WorkflowAction } from '@/lib/workflow';

interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  order: number;
  stopOnMatch: boolean;
}

const TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
  TICKET_CREATED: 'Ticket créé',
  TICKET_UPDATED: 'Ticket modifié',
  TICKET_STATUS_CHANGED: 'Statut changé',
  TICKET_PRIORITY_CHANGED: 'Priorité changée',
  TICKET_ASSIGNED: 'Ticket assigné',
};

const TRIGGER_COLORS: Record<WorkflowTrigger, string> = {
  TICKET_CREATED: 'bg-green-100 text-green-700',
  TICKET_UPDATED: 'bg-blue-100 text-blue-700',
  TICKET_STATUS_CHANGED: 'bg-indigo-100 text-indigo-700',
  TICKET_PRIORITY_CHANGED: 'bg-amber-100 text-amber-700',
  TICKET_ASSIGNED: 'bg-violet-100 text-violet-700',
};

const CONDITION_FIELDS = [
  { value: 'priority', label: 'Priorité' },
  { value: 'type', label: 'Type' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Statut' },
  { value: 'category', label: 'Catégorie' },
  { value: 'assigneeId', label: 'Assigné' },
  { value: 'teamId', label: 'Équipe' },
];

const CONDITION_OPERATORS = [
  { value: 'equals', label: '= égal' },
  { value: 'not_equals', label: '≠ différent' },
  { value: 'contains', label: '∋ contient' },
  { value: 'is_empty', label: 'est vide' },
  { value: 'is_not_empty', label: 'n\'est pas vide' },
];

const ACTION_TYPES = [
  { value: 'set_priority', label: 'Changer la priorité' },
  { value: 'set_status', label: 'Changer le statut' },
  { value: 'assign_to_team', label: 'Assigner à l\'équipe' },
  { value: 'add_tag', label: 'Ajouter un tag' },
  { value: 'set_sla', label: 'Appliquer une politique SLA' },
  { value: 'add_comment', label: 'Ajouter un commentaire' },
];

const emptyForm = {
  name: '',
  description: '',
  trigger: 'TICKET_CREATED' as WorkflowTrigger,
  conditions: [] as WorkflowCondition[],
  actions: [] as WorkflowAction[],
  order: 0,
  stopOnMatch: false,
};

function ActionSummary({ action }: { action: WorkflowAction }) {
  switch (action.type) {
    case 'set_priority': return <span>Priorité → <strong>{action.priority}</strong></span>;
    case 'set_status': return <span>Statut → <strong>{action.status}</strong></span>;
    case 'assign_to_team': return <span>Équipe → <strong>{action.teamId}</strong></span>;
    case 'add_tag': return <span>Tag + <strong>{action.tag}</strong></span>;
    case 'set_sla': return <span>SLA → <strong>{action.slaPolicyId}</strong></span>;
    case 'add_comment': return <span>Commentaire {action.isInternal ? '(interne)' : '(public)'}</span>;
    default: return null;
  }
}

function ActionForm({ action, onChange, onRemove }: {
  action: WorkflowAction;
  onChange: (a: WorkflowAction) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-start bg-white rounded-lg border border-gray-200 p-3">
      <select
        value={action.type}
        onChange={(e) => {
          const t = e.target.value;
          if (t === 'set_priority') onChange({ type: 'set_priority', priority: TicketPriority.MEDIUM });
          else if (t === 'set_status') onChange({ type: 'set_status', status: TicketStatus.OPEN });
          else if (t === 'assign_to_team') onChange({ type: 'assign_to_team', teamId: '' });
          else if (t === 'add_tag') onChange({ type: 'add_tag', tag: '' });
          else if (t === 'set_sla') onChange({ type: 'set_sla', slaPolicyId: '' });
          else onChange({ type: 'add_comment', body: '', isInternal: true });
        }}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
      >
        {ACTION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>

      {action.type === 'set_priority' && (
        <select value={action.priority}
          onChange={(e) => onChange({ ...action, priority: e.target.value as TicketPriority })}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500">
          {Object.values(TicketPriority).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
      {action.type === 'set_status' && (
        <select value={action.status}
          onChange={(e) => onChange({ ...action, status: e.target.value as TicketStatus })}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500">
          {Object.values(TicketStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {(action.type === 'assign_to_team' || action.type === 'set_sla') && (
        <input value={action.type === 'assign_to_team' ? action.teamId : action.slaPolicyId}
          onChange={(e) => onChange(action.type === 'assign_to_team'
            ? { ...action, teamId: e.target.value }
            : { ...action, slaPolicyId: e.target.value })}
          placeholder="ID"
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500" />
      )}
      {action.type === 'add_tag' && (
        <input value={action.tag}
          onChange={(e) => onChange({ ...action, tag: e.target.value })}
          placeholder="tag"
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500" />
      )}
      {action.type === 'add_comment' && (
        <>
          <input value={action.body}
            onChange={(e) => onChange({ ...action, body: e.target.value })}
            placeholder="Texte du commentaire"
            className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500" />
          <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
            <input type="checkbox" checked={action.isInternal}
              onChange={(e) => onChange({ ...action, isInternal: e.target.checked })} />
            Interne
          </label>
        </>
      )}

      <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ConditionForm({ condition, onChange, onRemove }: {
  condition: WorkflowCondition;
  onChange: (c: WorkflowCondition) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center bg-white rounded-lg border border-gray-200 p-3">
      <select value={condition.field}
        onChange={(e) => onChange({ ...condition, field: e.target.value as WorkflowCondition['field'] })}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500">
        {CONDITION_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      <select value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value as WorkflowCondition['operator'] })}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500">
        {CONDITION_OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
        <input
          value={Array.isArray(condition.value) ? condition.value.join(',') : condition.value}
          onChange={(e) => {
            const raw = e.target.value;
            onChange({ ...condition, value: raw.includes(',') ? raw.split(',').map(s => s.trim()) : raw });
          }}
          placeholder={condition.field === 'priority' ? 'MEDIUM' : condition.field === 'type' ? 'INCIDENT' : 'valeur'}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
        />
      )}

      <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function AdminWorkflowPage() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WorkflowRule | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/workflow-rules');
    if (res.ok) setRules(await res.json() as WorkflowRule[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setCreating(true); };
  const openEdit = (r: WorkflowRule) => {
    setForm({ name: r.name, description: r.description ?? '', trigger: r.trigger, conditions: r.conditions, actions: r.actions, order: r.order, stopOnMatch: r.stopOnMatch });
    setEditing(r);
    setCreating(true);
  };
  const closeForm = () => { setCreating(false); setEditing(null); };

  const save = async () => {
    setSaving(true);
    const url = editing ? `/api/workflow-rules/${editing.id}` : '/api/workflow-rules';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { await load(); closeForm(); }
    setSaving(false);
  };

  const toggle = async (rule: WorkflowRule) => {
    await fetch(`/api/workflow-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette règle ?')) return;
    await fetch(`/api/workflow-rules/${id}`, { method: 'DELETE' });
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="p-8 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Zap className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Règles d'automatisation ({rules.length})</h2>
            <p className="text-xs text-gray-500">Déclencheurs · Conditions · Actions</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="h-4 w-4" /> Nouvelle règle
        </button>
      </div>

      {/* Formulaire */}
      {creating && (
        <div className="mb-6 rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-5 space-y-5">
          <h3 className="text-sm font-semibold text-gray-800">{editing ? 'Modifier la règle' : 'Nouvelle règle'}</h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Auto-assigner incidents critiques"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Déclencheur</label>
              <select value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value as WorkflowTrigger })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                {Object.values(WorkflowTrigger).map((t) => (
                  <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ordre</label>
              <input type="number" min={0} value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Conditions (toutes doivent être vraies)</label>
              <button
                onClick={() => setForm({ ...form, conditions: [...form.conditions, { field: 'priority', operator: 'equals', value: '' }] })}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                + Ajouter
              </button>
            </div>
            {form.conditions.length === 0 && (
              <p className="text-xs text-gray-400 italic">Aucune condition — la règle s'applique toujours</p>
            )}
            <div className="space-y-2">
              {form.conditions.map((c, i) => (
                <ConditionForm key={i} condition={c}
                  onChange={(updated) => setForm({ ...form, conditions: form.conditions.map((x, j) => j === i ? updated : x) })}
                  onRemove={() => setForm({ ...form, conditions: form.conditions.filter((_, j) => j !== i) })} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Actions</label>
              <button
                onClick={() => setForm({ ...form, actions: [...form.actions, { type: 'set_priority', priority: TicketPriority.MEDIUM }] })}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                + Ajouter
              </button>
            </div>
            {form.actions.length === 0 && (
              <p className="text-xs text-gray-400 italic">Aucune action définie</p>
            )}
            <div className="space-y-2">
              {form.actions.map((a, i) => (
                <ActionForm key={i} action={a}
                  onChange={(updated) => setForm({ ...form, actions: form.actions.map((x, j) => j === i ? updated : x) })}
                  onRemove={() => setForm({ ...form, actions: form.actions.filter((_, j) => j !== i) })} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.stopOnMatch}
                onChange={(e) => setForm({ ...form, stopOnMatch: e.target.checked })} />
              Arrêter après cette règle si elle correspond
            </label>
          </div>

          <div className="flex gap-2">
            <button onClick={() => void save()} disabled={saving || !form.name || form.actions.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Check className="h-3.5 w-3.5" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={closeForm}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <X className="h-3.5 w-3.5" /> Annuler
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 && !creating && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Zap className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune règle configurée</p>
          <p className="text-xs text-gray-400 mt-1">Créez votre première règle pour automatiser les actions sur les tickets</p>
        </div>
      )}

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id}
            className={`rounded-xl border bg-white p-4 transition-all ${rule.isActive ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => void toggle(rule)} className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors">
                  {rule.isActive
                    ? <ToggleRight className="h-5 w-5 text-indigo-600" />
                    : <ToggleLeft className="h-5 w-5" />}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">{rule.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TRIGGER_COLORS[rule.trigger]}`}>
                      {TRIGGER_LABELS[rule.trigger]}
                    </span>
                    {rule.stopOnMatch && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">stop</span>
                    )}
                  </div>
                  {rule.description && <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {rule.conditions.length > 0 && (
                      <span className="text-xs text-gray-500">
                        Si {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {rule.actions.map((a, i) => (
                      <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        <ActionSummary action={a} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(rule)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => void remove(rule.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowUp, Minus, ArrowDown, Monitor, Mail, Phone, MessageCircle, Globe, Tag, X, CheckCircle2, Users, Building2, ShieldCheck, Info } from 'lucide-react';

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

const PRIORITY_CONFIG = [
  {
    value: 'CRITICAL',
    label: 'Critique',
    desc: 'Service arrêté',
    icon: AlertTriangle,
    active: 'bg-red-600 border-red-600 text-white ring-4 ring-red-100',
    idle: 'border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700',
    dot: 'bg-red-500',
  },
  {
    value: 'HIGH',
    label: 'Haute',
    desc: 'Dégradation sévère',
    icon: ArrowUp,
    active: 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-100',
    idle: 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700',
    dot: 'bg-orange-400',
  },
  {
    value: 'MEDIUM',
    label: 'Moyenne',
    desc: 'Impact limité',
    icon: Minus,
    active: 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100',
    idle: 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700',
    dot: 'bg-indigo-500',
  },
  {
    value: 'LOW',
    label: 'Basse',
    desc: 'Non urgent',
    icon: ArrowDown,
    active: 'bg-gray-500 border-gray-500 text-white ring-4 ring-gray-100',
    idle: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700',
    dot: 'bg-gray-400',
  },
] as const;

const TYPE_CONFIG = [
  { value: 'INCIDENT', label: 'Incident', icon: AlertTriangle },
  { value: 'SERVICE_REQUEST', label: 'Demande', icon: MessageCircle },
  { value: 'PROBLEM', label: 'Problème', icon: Info },
  { value: 'CHANGE', label: 'Changement', icon: Globe },
] as const;

const SOURCE_CONFIG = [
  { value: 'PORTAL', label: 'Portail', icon: Monitor },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'PHONE', label: 'Téléphone', icon: Phone },
  { value: 'CHAT', label: 'Chat', icon: MessageCircle },
  { value: 'API', label: 'API', icon: Globe },
] as const;

export default function TicketForm({ teams, departments, contacts, companies, slas }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [type, setType] = useState('INCIDENT');
  const [source, setSource] = useState('PORTAL');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (tag && !tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get('title'),
      description,
      priority,
      type,
      source,
      category: fd.get('category') || null,
      tags,
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

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors';
  const selectClass = `${inputClass} cursor-pointer`;
  const sectionClass = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Section 1 — Identification */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-indigo-600">1</span>
          </div>
          <h2 className="text-sm font-bold text-gray-800">Description du problème</h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Titre <span className="text-red-500 normal-case font-normal">*</span>
          </label>
          <input
            name="title"
            required
            placeholder="En une phrase, décrivez le problème…"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Description détaillée <span className="text-red-500 normal-case font-normal">*</span>
            </label>
            <span className="text-[11px] text-gray-400 tabular-nums">{description.length} / 3000</span>
          </div>
          <textarea
            required
            rows={5}
            maxLength={3000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez en détail : étapes pour reproduire, impact métier, environnement affecté…"
            className={`${inputClass} resize-none leading-relaxed`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Catégorie</label>
            <input
              name="category"
              placeholder="ex. Réseau, Accès, Matériel…"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tags</label>
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-colors min-h-[48px]">
              <div className="flex flex-wrap gap-1.5 mb-1">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-lg">
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="ml-0.5 text-indigo-400 hover:text-indigo-600">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={tags.length === 0 ? 'Ajouter un tag (Entrée)…' : ''}
                className="text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — Classification */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-indigo-600">2</span>
          </div>
          <h2 className="text-sm font-bold text-gray-800">Classification</h2>
        </div>

        {/* Priority cards */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Priorité</label>
          <div className="grid grid-cols-4 gap-2.5">
            {PRIORITY_CONFIG.map(({ value, label, desc, icon: Icon, active, idle, dot }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3.5 text-center transition-all duration-150 ${priority === value ? active : idle}`}
              >
                <Icon className={`h-5 w-5 ${priority === value ? 'opacity-100' : 'opacity-50'}`} />
                <span className="text-xs font-bold">{label}</span>
                <span className={`text-[10px] ${priority === value ? 'opacity-80' : 'text-gray-400'}`}>{desc}</span>
                {priority === value && (
                  <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 opacity-80" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Type selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</label>
          <div className="flex gap-2 flex-wrap">
            {TYPE_CONFIG.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all
                  ${type === value
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Canal de réception</label>
          <div className="flex gap-2 flex-wrap">
            {SOURCE_CONFIG.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSource(value)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all
                  ${source === value
                    ? 'bg-gray-800 border-gray-800 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3 — Assignation */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-indigo-600">3</span>
          </div>
          <h2 className="text-sm font-bold text-gray-800">Affectation & SLA</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Équipe
            </label>
            <select name="teamId" className={selectClass}>
              <option value="">— Aucune équipe —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Département
            </label>
            <select name="departmentId" className={selectClass}>
              <option value="">— Aucun —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Politique SLA
            </label>
            <select name="slaPolicyId" className={selectClass}>
              <option value="">— Aucun SLA —</option>
              {slas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 4 — Demandeur */}
      <div className={sectionClass}>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-indigo-600">4</span>
          </div>
          <h2 className="text-sm font-bold text-gray-800">Demandeur</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contact</label>
            <select name="contactId" className={selectClass}>
              <option value="">— Aucun —</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Entreprise</label>
            <select name="companyId" className={selectClass}>
              <option value="">— Aucune —</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pb-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-6 py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm shadow-indigo-200"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Création en cours…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Créer le ticket
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-gray-200 text-gray-600 px-6 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

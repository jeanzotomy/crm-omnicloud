'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactInput } from '@/lib/validations/contact';

interface Props {
  defaultValues?: Partial<ContactInput> & { id?: string };
}

const STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'INACTIVE', label: 'Inactif' },
];

export default function ContactForm({ defaultValues }: Props) {
  const router = useRouter();
  const isEdit = Boolean(defaultValues?.id);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaultValues ?? { status: 'LEAD' },
  });

  async function onSubmit(values: ContactInput) {
    const url = isEdit ? `/api/contacts/${defaultValues?.id}` : '/api/contacts';
    const method = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/contacts/${isEdit ? defaultValues?.id : data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50">
        <h2 className="font-semibold text-gray-800">{isEdit ? 'Modifier les informations' : 'Informations du contact'}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Les champs marqués * sont obligatoires</p>
      </div>
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom *" error={errors.firstName?.message}>
            <input {...register('firstName')} placeholder="Jean" className={inputCls(!!errors.firstName)} />
          </Field>
          <Field label="Nom *" error={errors.lastName?.message}>
            <input {...register('lastName')} placeholder="Dupont" className={inputCls(!!errors.lastName)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="jean@exemple.com" className={inputCls(!!errors.email)} />
          </Field>
          <Field label="Téléphone" error={errors.phone?.message}>
            <input {...register('phone')} type="tel" placeholder="+1 514 000 0000" className={inputCls(!!errors.phone)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Poste / Titre" error={errors.title?.message}>
            <input {...register('title')} placeholder="Directeur commercial" className={inputCls(!!errors.title)} />
          </Field>
          <Field label="Statut" error={errors.status?.message}>
            <select {...register('status')} className={inputCls(!!errors.status)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notes" error={errors.notes?.message}>
          <textarea {...register('notes')} rows={3} placeholder="Notes libres sur ce contact…" className={inputCls(!!errors.notes)} />
        </Field>
      </div>
      <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm shadow-indigo-200"
        >
          {isSubmitting ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le contact'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-white transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

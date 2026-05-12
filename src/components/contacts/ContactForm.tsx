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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-xl p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Prénom *" error={errors.firstName?.message}>
          <input {...register('firstName')} className={inputCls} />
        </Field>
        <Field label="Nom *" error={errors.lastName?.message}>
          <input {...register('lastName')} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" error={errors.email?.message}>
          <input {...register('email')} type="email" className={inputCls} />
        </Field>
        <Field label="Téléphone" error={errors.phone?.message}>
          <input {...register('phone')} type="tel" className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Poste / Titre" error={errors.title?.message}>
          <input {...register('title')} className={inputCls} />
        </Field>
        <Field label="Statut" error={errors.status?.message}>
          <select {...register('status')} className={inputCls}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes" error={errors.notes?.message}>
        <textarea {...register('notes')} rows={3} className={inputCls} />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {isSubmitting ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le contact'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-accent"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

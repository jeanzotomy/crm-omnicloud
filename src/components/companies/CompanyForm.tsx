'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companySchema, type CompanyInput } from '@/lib/validations/company';

interface Props {
  defaultValues?: Partial<CompanyInput> & { id?: string };
}

const SIZE_OPTIONS = [
  { value: '', label: 'Non précisé' },
  { value: 'MICRO', label: 'Micro (< 10)' },
  { value: 'SMALL', label: 'Petite (10–49)' },
  { value: 'MEDIUM', label: 'Moyenne (50–249)' },
  { value: 'LARGE', label: 'Grande (250+)' },
];

export default function CompanyForm({ defaultValues }: Props) {
  const router = useRouter();
  const isEdit = Boolean(defaultValues?.id);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: defaultValues ?? {},
  });

  async function onSubmit(values: CompanyInput) {
    const url = isEdit ? `/api/companies/${defaultValues?.id}` : '/api/companies';
    const method = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/companies/${isEdit ? defaultValues?.id : data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-xl p-6 space-y-5">
      <Field label="Nom *" error={errors.name?.message}>
        <input {...register('name')} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Secteur d'activité" error={errors.industry?.message}>
          <input {...register('industry')} className={inputCls} />
        </Field>
        <Field label="Taille" error={errors.size?.message}>
          <select {...register('size')} className={inputCls}>
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Site web" error={errors.website?.message}>
          <input {...register('website')} type="url" placeholder="https://" className={inputCls} />
        </Field>
        <Field label="Chiffre d'affaires (€)" error={errors.revenue?.message}>
          <input {...register('revenue', { valueAsNumber: true })} type="number" min="0" className={inputCls} />
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
      <div className="grid grid-cols-3 gap-4">
        <Field label="Adresse" error={errors.address?.message}>
          <input {...register('address')} className={inputCls} />
        </Field>
        <Field label="Ville" error={errors.city?.message}>
          <input {...register('city')} className={inputCls} />
        </Field>
        <Field label="Pays" error={errors.country?.message}>
          <input {...register('country')} className={inputCls} />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {isSubmitting ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer l\'entreprise'}
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

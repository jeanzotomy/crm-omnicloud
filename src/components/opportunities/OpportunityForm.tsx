'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { opportunitySchema, type OpportunityInput } from '@/lib/validations/opportunity';

interface Props {
  defaultValues?: Partial<OpportunityInput> & { id?: string };
}

const STAGE_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'QUALIFIED', label: 'Qualifié' },
  { value: 'PROPOSAL', label: 'Proposition' },
  { value: 'NEGOTIATION', label: 'Négociation' },
  { value: 'WON', label: 'Gagné' },
  { value: 'LOST', label: 'Perdu' },
];

export default function OpportunityForm({ defaultValues }: Props) {
  const router = useRouter();
  const isEdit = Boolean(defaultValues?.id);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OpportunityInput>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: defaultValues ?? { stage: 'LEAD', value: 0, probability: 0 },
  });

  async function onSubmit(values: OpportunityInput) {
    const url = isEdit ? `/api/opportunities/${defaultValues?.id}` : '/api/opportunities';
    const method = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/opportunities/${isEdit ? defaultValues?.id : data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-xl p-6 space-y-5">
      <Field label="Titre *" error={errors.title?.message}>
        <input {...register('title')} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Valeur (€)" error={errors.value?.message}>
          <input {...register('value', { valueAsNumber: true })} type="number" min="0" step="100" className={inputCls} />
        </Field>
        <Field label="Étape" error={errors.stage?.message}>
          <select {...register('stage')} className={inputCls}>
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Probabilité (%)" error={errors.probability?.message}>
          <input {...register('probability', { valueAsNumber: true })} type="number" min="0" max="100" className={inputCls} />
        </Field>
        <Field label="Date de clôture" error={errors.closeDate?.message}>
          <input {...register('closeDate')} type="date" className={inputCls} />
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
          {isSubmitting ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer l\'opportunité'}
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

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Pencil } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import DeleteButton from '@/components/ui/DeleteButton';
import { stageBadge } from '@/lib/badges';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OpportunityStage } from '@prisma/client';

interface Opportunity {
  id: string;
  title: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  closeDate: string | null;
  notes: string | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  company: { id: string; name: string } | null;
  assignedTo: { name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

async function getOpportunity(id: string): Promise<Opportunity | null> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/opportunities/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch opportunity');
  return res.json();
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) notFound();

  const badge = stageBadge(opp.stage);

  return (
    <div>
      <PageHeader
        title={opp.title}
        icon={TrendingUp}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/opportunities/${opp.id}/edit`}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
            <DeleteButton id={opp.id} entity="opportunities" redirectTo="/opportunities" />
          </div>
        }
      />

      <div className="p-8 max-w-2xl">
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Badge label={badge.label} variant={badge.variant} />
            <span className="text-2xl font-bold">{formatCurrency(opp.value)}</span>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <Info label="Contact" value={opp.contact ? (
              <Link href={`/contacts/${opp.contact.id}`} className="text-primary hover:underline text-sm">
                {opp.contact.firstName} {opp.contact.lastName}
              </Link>
            ) : undefined} />
            <Info label="Entreprise" value={opp.company ? (
              <Link href={`/companies/${opp.company.id}`} className="text-primary hover:underline text-sm">
                {opp.company.name}
              </Link>
            ) : undefined} />
            <Info label="Probabilité" value={`${opp.probability}%`} />
            <Info label="Date de clôture" value={opp.closeDate ? formatDate(opp.closeDate) : undefined} />
            <Info label="Assigné à" value={opp.assignedTo?.name ?? opp.assignedTo?.email} />
            <Info label="Créé le" value={formatDate(opp.createdAt)} />
          </dl>

          {opp.notes && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-1">Notes</dt>
              <dd className="text-sm whitespace-pre-wrap">{opp.notes}</dd>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-0.5">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

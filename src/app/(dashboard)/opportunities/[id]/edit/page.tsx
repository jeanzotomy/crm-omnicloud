import { notFound } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import OpportunityForm from '@/components/opportunities/OpportunityForm';
import type { OpportunityStage } from '@prisma/client';

interface Opportunity {
  id: string;
  title: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  closeDate: string | null;
  notes: string | null;
  contactId: string | null;
  companyId: string | null;
  assignedToId: string | null;
}

async function getOpportunity(id: string): Promise<Opportunity | null> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/opportunities/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) notFound();

  return (
    <div>
      <PageHeader title="Modifier l'opportunité" icon={TrendingUp} />
      <div className="p-8 max-w-2xl">
        <OpportunityForm
          defaultValues={{
            id: opp.id,
            title: opp.title,
            value: opp.value,
            stage: opp.stage,
            probability: opp.probability,
            closeDate: opp.closeDate ? opp.closeDate.split('T')[0] : undefined,
            notes: opp.notes ?? undefined,
            contactId: opp.contactId ?? undefined,
            companyId: opp.companyId ?? undefined,
            assignedToId: opp.assignedToId ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

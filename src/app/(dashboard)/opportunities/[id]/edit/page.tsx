import { notFound } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import OpportunityForm from '@/components/opportunities/OpportunityForm';
import { prisma } from '@/lib/prisma';

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const opp = await prisma.opportunity.findUnique({ where: { id } });
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
            closeDate: opp.closeDate ? opp.closeDate.toISOString().split('T')[0] : undefined,
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

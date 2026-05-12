import { TrendingUp } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import OpportunityForm from '@/components/opportunities/OpportunityForm';

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; companyId?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div>
      <PageHeader title="Nouvelle opportunité" icon={TrendingUp} />
      <div className="p-8 max-w-2xl">
        <OpportunityForm
          defaultValues={{
            contactId: sp.contactId,
            companyId: sp.companyId,
          }}
        />
      </div>
    </div>
  );
}

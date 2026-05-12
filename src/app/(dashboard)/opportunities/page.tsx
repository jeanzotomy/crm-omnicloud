import Link from 'next/link';
import { TrendingUp, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import OpportunitiesTable from '@/components/opportunities/OpportunitiesTable';

export default function OpportunitiesPage() {
  return (
    <div>
      <PageHeader
        title="Opportunités"
        description="Suivez vos affaires en cours"
        icon={TrendingUp}
        actions={
          <Link
            href="/opportunities/new"
            className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nouvelle opportunité
          </Link>
        }
      />
      <div className="p-8">
        <OpportunitiesTable />
      </div>
    </div>
  );
}

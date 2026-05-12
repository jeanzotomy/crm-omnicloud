import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import CompaniesTable from '@/components/companies/CompaniesTable';

export default function CompaniesPage() {
  return (
    <div>
      <PageHeader
        title="Entreprises"
        description="Gérez vos comptes clients et prospects"
        icon={Building2}
        actions={
          <Link
            href="/companies/new"
            className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nouvelle entreprise
          </Link>
        }
      />
      <div className="p-8">
        <CompaniesTable />
      </div>
    </div>
  );
}

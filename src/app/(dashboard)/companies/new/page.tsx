import { Building2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import CompanyForm from '@/components/companies/CompanyForm';

export default function NewCompanyPage() {
  return (
    <div>
      <PageHeader title="Nouvelle entreprise" icon={Building2} />
      <div className="p-8 max-w-2xl">
        <CompanyForm />
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { Building2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import CompanyForm from '@/components/companies/CompanyForm';
import { prisma } from '@/lib/prisma';

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  return (
    <div>
      <PageHeader title="Modifier l'entreprise" icon={Building2} />
      <div className="p-8 max-w-2xl">
        <CompanyForm
          defaultValues={{
            id: company.id,
            name: company.name,
            industry: company.industry ?? undefined,
            website: company.website ?? undefined,
            phone: company.phone ?? undefined,
            email: company.email ?? undefined,
            address: company.address ?? undefined,
            city: company.city ?? undefined,
            country: company.country ?? undefined,
            size: company.size ?? undefined,
            revenue: company.revenue ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

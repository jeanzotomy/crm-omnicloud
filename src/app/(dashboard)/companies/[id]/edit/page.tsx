import { notFound } from 'next/navigation';
import { Building2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import CompanyForm from '@/components/companies/CompanyForm';
import type { CompanySize } from '@prisma/client';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  size: CompanySize | null;
  revenue: number | null;
}

async function getCompany(id: string): Promise<Company | null> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/companies/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);
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

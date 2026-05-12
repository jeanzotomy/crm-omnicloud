import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ContactForm from '@/components/contacts/ContactForm';
import { prisma } from '@/lib/prisma';

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  return (
    <div>
      <PageHeader title="Modifier le contact" icon={Users} />
      <div className="p-8 max-w-2xl">
        <ContactForm
          defaultValues={{
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email ?? undefined,
            phone: contact.phone ?? undefined,
            title: contact.title ?? undefined,
            status: contact.status,
            notes: contact.notes ?? undefined,
            companyId: contact.companyId ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

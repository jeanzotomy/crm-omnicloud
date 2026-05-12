import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ContactForm from '@/components/contacts/ContactForm';
import type { ContactStatus } from '@prisma/client';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  status: ContactStatus;
  notes: string | null;
  companyId: string | null;
}

async function getContact(id: string): Promise<Contact | null> {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/contacts/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContact(id);
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

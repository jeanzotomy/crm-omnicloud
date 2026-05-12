import Link from 'next/link';
import { Users, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ContactsTable from '@/components/contacts/ContactsTable';

export default function ContactsPage() {
  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Gérez vos contacts et prospects"
        icon={Users}
        actions={
          <Link
            href="/contacts/new"
            className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nouveau contact
          </Link>
        }
      />
      <div className="p-8">
        <ContactsTable />
      </div>
    </div>
  );
}

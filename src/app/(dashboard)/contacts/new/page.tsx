import { Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ContactForm from '@/components/contacts/ContactForm';

export default function NewContactPage() {
  return (
    <div>
      <PageHeader title="Nouveau contact" icon={Users} />
      <div className="p-8 max-w-2xl">
        <ContactForm />
      </div>
    </div>
  );
}

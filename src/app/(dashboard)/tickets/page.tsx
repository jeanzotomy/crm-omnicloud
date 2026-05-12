import Link from 'next/link';
import { Plus, Ticket } from 'lucide-react';
import TicketQueue from '@/components/tickets/TicketQueue';

export const metadata = { title: 'File de tickets' };

export default function TicketsPage() {
  return (
    <div>
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">File de tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez et suivez toutes les demandes de support</p>
        </div>
        <Link
          href="/tickets/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus className="h-4 w-4" />
          Nouveau ticket
        </Link>
      </div>
      <div className="p-8">
        <TicketQueue />
      </div>
    </div>
  );
}

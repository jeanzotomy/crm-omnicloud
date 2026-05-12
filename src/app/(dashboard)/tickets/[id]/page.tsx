import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Clock, User, Building2, Tag, Calendar, AlertCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { ticketStatusBadge, ticketPriorityBadge, ticketTypeBadge } from '@/lib/badges';
import { formatDate } from '@/lib/utils';
import TicketTimeline from '@/components/tickets/TicketTimeline';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      company: { select: { id: true, name: true } },
      slaPolicy: true,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      activities: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!ticket) notFound();

  const sb = ticketStatusBadge(ticket.status);
  const pb = ticketPriorityBadge(ticket.priority);
  const tb = ticketTypeBadge(ticket.type);
  const isOverdue = ticket.dueAt && new Date(ticket.dueAt) < new Date() && !['RESOLVED', 'CLOSED'].includes(ticket.status);

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/tickets" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-mono text-sm text-gray-400">{ticket.number}</span>
          {ticket.slaBreached && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5" /> SLA dépassé
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900 flex-1">{ticket.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <Badge label={tb.label} variant={tb.variant} />
            <Badge label={pb.label} variant={pb.variant} />
            <Badge label={sb.label} variant={sb.variant} dot />
            <Link
              href={`/tickets/${ticket.id}/edit`}
              className="rounded-xl border border-gray-200 text-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Modifier
            </Link>
          </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Timeline & Comments */}
          <TicketTimeline
            ticketId={ticket.id}
            comments={ticket.comments.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              updatedAt: c.updatedAt.toISOString(),
            }))}
            activities={ticket.activities.map((a) => ({
              ...a,
              meta: a.meta as Record<string, string>,
              createdAt: a.createdAt.toISOString(),
            }))}
            currentUserId={session.user?.id ?? ''}
          />
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Assignation */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Affectation</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Assigné à</p>
                  <p className="font-medium text-gray-800">{ticket.assignee?.name ?? <span className="text-gray-400 italic">Non assigné</span>}</p>
                </div>
              </div>
              {ticket.team && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Équipe</p>
                    <p className="font-medium text-gray-800">{ticket.team.name}</p>
                  </div>
                </div>
              )}
              {ticket.department && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Département</p>
                    <p className="font-medium text-gray-800">{ticket.department.name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Créé par</p>
                  <p className="font-medium text-gray-800">{ticket.createdBy.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SLA & Dates */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA & Dates</h2>
            <div className="space-y-3 text-sm">
              {ticket.slaPolicy && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Politique SLA</p>
                    <p className="font-medium text-gray-800">{ticket.slaPolicy.name}</p>
                    <p className="text-xs text-gray-400">Résolution : {ticket.slaPolicy.resolutionMinutes / 60}h</p>
                  </div>
                </div>
              )}
              {ticket.dueAt && (
                <div className="flex items-center gap-3">
                  <Calendar className={`h-4 w-4 shrink-0 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-xs text-gray-400">Échéance</p>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>{formatDate(ticket.dueAt.toISOString())}</p>
                  </div>
                </div>
              )}
              {ticket.firstResponseAt && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">1ère réponse</p>
                    <p className="font-medium text-gray-800">{formatDate(ticket.firstResponseAt.toISOString())}</p>
                  </div>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Résolu le</p>
                    <p className="font-medium text-gray-800">{formatDate(ticket.resolvedAt.toISOString())}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Créé le</p>
                  <p className="font-medium text-gray-800">{formatDate(ticket.createdAt.toISOString())}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          {(ticket.contact || ticket.company) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Demandeur</h2>
              {ticket.contact && (
                <div className="space-y-1">
                  <Link href={`/contacts/${ticket.contact.id}`} className="font-semibold text-sm text-indigo-600 hover:underline">
                    {ticket.contact.firstName} {ticket.contact.lastName}
                  </Link>
                  {ticket.contact.email && <p className="text-xs text-gray-400">{ticket.contact.email}</p>}
                  {ticket.contact.phone && <p className="text-xs text-gray-400">{ticket.contact.phone}</p>}
                </div>
              )}
              {ticket.company && (
                <Link href={`/companies/${ticket.company.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {ticket.company.name}
                </Link>
              )}
            </div>
          )}

          {/* Tags */}
          {ticket.tags.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                    <Tag className="h-3 w-3" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Satisfaction */}
          {ticket.satisfactionScore && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Satisfaction client</h2>
              <div className="flex items-center gap-2">
                {'★'.repeat(ticket.satisfactionScore)}{'☆'.repeat(5 - ticket.satisfactionScore)}
                <span className="text-sm font-semibold text-gray-700">{ticket.satisfactionScore}/5</span>
              </div>
              {ticket.satisfactionNote && <p className="text-sm text-gray-500 italic">&ldquo;{ticket.satisfactionNote}&rdquo;</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

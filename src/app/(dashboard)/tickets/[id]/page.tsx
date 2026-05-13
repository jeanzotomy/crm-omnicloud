import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Clock, User, Building2, Tag, Calendar, AlertCircle, CheckCircle2, MailOpen, Phone, Sparkles } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { ticketStatusBadge, ticketPriorityBadge, ticketTypeBadge } from '@/lib/badges';
import { formatDate } from '@/lib/utils';
import { TicketStatus } from '@prisma/client';
import TicketTimeline from '@/components/tickets/TicketTimeline';
import AiAnalyzeButton from '@/components/tickets/AiAnalyzeButton';
import VoiceCallPanel from '@/components/tickets/VoiceCallPanel';

const PRIORITY_GRADIENT: Record<string, string> = {
  CRITICAL: 'from-red-600 to-red-500',
  HIGH: 'from-orange-500 to-orange-400',
  MEDIUM: 'from-indigo-600 to-indigo-500',
  LOW: 'from-gray-500 to-gray-400',
};

const PRIORITY_HEADER_ACCENT: Record<string, string> = {
  CRITICAL: 'border-b-2 border-red-500',
  HIGH: 'border-b-2 border-orange-400',
  MEDIUM: 'border-b-2 border-indigo-500',
  LOW: 'border-b border-gray-100',
};

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
  const isOverdue = ticket.dueAt && new Date(ticket.dueAt) < new Date()
    && ticket.status !== TicketStatus.RESOLVED
    && ticket.status !== TicketStatus.CLOSED;

  // SLA progress
  const slaProgress = ticket.slaPolicy && ticket.dueAt
    ? Math.min(100, Math.round(
        ((Date.now() - ticket.createdAt.getTime()) /
         (ticket.dueAt.getTime() - ticket.createdAt.getTime())) * 100
      ))
    : null;

  const isClosed = ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED;

  return (
    <div>
      {/* Header */}
      <div className={`px-8 py-5 bg-white ${PRIORITY_HEADER_ACCENT[ticket.priority]}`}>
        <div className="flex items-center gap-3 mb-3">
          <Link href="/tickets" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{ticket.number}</span>
            {ticket.slaBreached && !isClosed && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" /> SLA dépassé
              </span>
            )}
            {isClosed && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5" /> Clôturé
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge label={tb.label} variant={tb.variant} />
            <Badge label={pb.label} variant={pb.variant} />
            <Badge label={sb.label} variant={sb.variant} dot />
          </div>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900 flex-1 leading-snug">{ticket.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <AiAnalyzeButton ticketId={ticket.id} />
            <Link
              href={`/tickets/${ticket.id}/edit`}
              className="rounded-xl border border-gray-200 text-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Modifier
            </Link>
          </div>
        </div>

        {/* SLA bar */}
        {slaProgress !== null && !isClosed && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                SLA — {ticket.slaPolicy?.name}
              </span>
              <span className={`text-[11px] font-bold ${isOverdue ? 'text-red-600' : slaProgress > 75 ? 'text-amber-600' : 'text-gray-500'}`}>
                {isOverdue ? 'Dépassé' : `${slaProgress}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverdue ? 'bg-red-500' : slaProgress > 75 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, slaProgress)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-5">
          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Tags */}
          {ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ticket.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                  <Tag className="h-3 w-3 text-gray-400" /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Timeline */}
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Requester */}
          {(ticket.contact || ticket.company) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Demandeur</h2>
              {ticket.contact && (
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {ticket.contact.firstName[0]}{ticket.contact.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/contacts/${ticket.contact.id}`} className="text-sm font-semibold text-gray-800 hover:text-indigo-600 transition-colors">
                      {ticket.contact.firstName} {ticket.contact.lastName}
                    </Link>
                    {ticket.contact.email && (
                      <a href={`mailto:${ticket.contact.email}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 mt-0.5 truncate">
                        <MailOpen className="h-3 w-3 shrink-0" /> {ticket.contact.email}
                      </a>
                    )}
                    {ticket.contact.phone && (
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" /> {ticket.contact.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {ticket.company && (
                <Link href={`/companies/${ticket.company.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  {ticket.company.name}
                </Link>
              )}

              {/* Voice call panel — shown when contact has a phone number */}
              {ticket.contact?.phone && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <VoiceCallPanel
                    contactName={`${ticket.contact.firstName} ${ticket.contact.lastName}`}
                    contactPhone={ticket.contact.phone}
                    ticketId={ticket.id}
                  />
                </div>
              )}
            </div>
          )}

          {/* AI category */}
          {ticket.category && (
            <div className="bg-violet-50 rounded-2xl border border-violet-100 px-5 py-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <p className="text-xs font-medium text-violet-700">{ticket.category}</p>
            </div>
          )}

          {/* Assignment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Affectation</h2>
            <div className="space-y-3">
              <InfoRow icon={User} label="Assigné à">
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-indigo-600">{ticket.assignee.name?.[0]}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{ticket.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Non assigné</span>
                )}
              </InfoRow>
              {ticket.team && <InfoRow icon={User} label="Équipe"><span className="text-sm font-medium text-gray-800">{ticket.team.name}</span></InfoRow>}
              {ticket.department && <InfoRow icon={Building2} label="Département"><span className="text-sm font-medium text-gray-800">{ticket.department.name}</span></InfoRow>}
              <InfoRow icon={User} label="Créé par"><span className="text-sm font-medium text-gray-800">{ticket.createdBy.name}</span></InfoRow>
            </div>
          </div>

          {/* Dates & SLA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Dates & SLA</h2>
            <div className="space-y-3">
              <InfoRow icon={Calendar} label="Créé le"><span className="text-sm text-gray-600">{formatDate(ticket.createdAt.toISOString())}</span></InfoRow>
              {ticket.dueAt && (
                <InfoRow icon={Clock} label="Échéance">
                  <span className={`text-sm font-semibold ${isOverdue && !isClosed ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatDate(ticket.dueAt.toISOString())}
                  </span>
                </InfoRow>
              )}
              {ticket.firstResponseAt && (
                <InfoRow icon={CheckCircle2} label="1ère réponse">
                  <span className="text-sm text-gray-600">{formatDate(ticket.firstResponseAt.toISOString())}</span>
                </InfoRow>
              )}
              {ticket.resolvedAt && (
                <InfoRow icon={CheckCircle2} label="Résolu le">
                  <span className="text-sm text-emerald-600 font-medium">{formatDate(ticket.resolvedAt.toISOString())}</span>
                </InfoRow>
              )}
              {ticket.slaPolicy && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[11px] text-gray-400 mb-1">Politique SLA</p>
                  <p className="text-sm font-medium text-gray-700">{ticket.slaPolicy.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Résolution cible : {ticket.slaPolicy.resolutionMinutes >= 60
                      ? `${ticket.slaPolicy.resolutionMinutes / 60}h`
                      : `${ticket.slaPolicy.resolutionMinutes}min`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Satisfaction */}
          {ticket.satisfactionScore && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Satisfaction client</h2>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-lg ${i < ticket.satisfactionScore! ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-700">{ticket.satisfactionScore}/5</span>
              </div>
              {ticket.satisfactionNote && (
                <p className="text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3 leading-relaxed">&ldquo;{ticket.satisfactionNote}&rdquo;</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

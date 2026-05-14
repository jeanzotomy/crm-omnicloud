import { NextRequest, NextResponse } from 'next/server';
import { TicketStatus, TicketPriority, TicketType, TicketSource, WorkflowTrigger } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { parsePaginationParams } from '@/lib/pagination';
import { sendTicketCreatedToAssignee, sendTicketCreatedToContact } from '@/lib/email';
import { PRIORITY_LABELS } from '@/lib/labels';
import { runWorkflows } from '@/lib/workflow';
import { analyzeTicket } from '@/lib/ai';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = parsePaginationParams(sp);
  const search = sp.get('search') ?? '';
  const status = sp.get('status') as TicketStatus | null;
  const priority = sp.get('priority') as TicketPriority | null;
  const type = sp.get('type') as TicketType | null;
  const source = sp.get('source') as TicketSource | null;
  const contactId = sp.get('contactId');
  const companyId = sp.get('companyId');
  const teamId = sp.get('teamId');
  const from = sp.get('from');
  const to = sp.get('to');
  const assigneeId = sp.get('assigneeId');
  const mine = sp.get('mine') === 'true';

  // Multi-value: ?statuses=OPEN,IN_PROGRESS  (takes priority over single status)
  const statuses = sp.get('statuses')?.split(',').filter(Boolean) as TicketStatus[] | undefined;
  const priorities = sp.get('priorities')?.split(',').filter(Boolean) as TicketPriority[] | undefined;

  // Sort: ?sort=createdAt:desc  default: priority asc, createdAt desc
  const SORTABLE = new Set(['createdAt', 'updatedAt', 'priority', 'status', 'title', 'number']);
  const [sortField = 'createdAt', sortDir = 'desc'] = (sp.get('sort') ?? '').split(':');
  const orderBy = SORTABLE.has(sortField)
    ? [{ [sortField]: sortDir === 'asc' ? 'asc' as const : 'desc' as const }]
    : [{ priority: 'asc' as const }, { createdAt: 'desc' as const }];

  const where = {
    ...(search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { number: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(statuses?.length ? { status: { in: statuses } } : status ? { status } : {}),
    ...(priorities?.length ? { priority: { in: priorities } } : priority ? { priority } : {}),
    ...(type ? { type } : {}),
    ...(source ? { source } : {}),
    ...(contactId ? { contactId } : {}),
    ...(companyId ? { companyId } : {}),
    ...(teamId ? { teamId } : {}),
    ...(from || to ? { createdAt: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
    ...(mine ? { assigneeId: session.user?.id } : assigneeId ? { assigneeId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        slaPolicy: { select: { firstResponseMinutes: true, resolutionMinutes: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, priority, type, source, category, tags, assigneeId, teamId, departmentId, contactId, companyId, slaPolicyId } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
  }

  const count = await prisma.ticket.count();
  const number = `TKT-${String(count + 1).padStart(4, '0')}`;

  let dueAt: Date | undefined;
  if (slaPolicyId) {
    const sla = await prisma.sLAPolicy.findUnique({ where: { id: slaPolicyId } });
    if (sla) dueAt = new Date(Date.now() + sla.resolutionMinutes * 60_000);
  }

  const ticket = await prisma.ticket.create({
    data: {
      number,
      title,
      description,
      priority: (priority as TicketPriority) ?? TicketPriority.MEDIUM,
      type: (type as TicketType) ?? TicketType.INCIDENT,
      source: (source as TicketSource) ?? TicketSource.PORTAL,
      category: category ?? null,
      tags: tags ?? [],
      assigneeId: assigneeId ?? null,
      teamId: teamId ?? null,
      departmentId: departmentId ?? null,
      contactId: contactId ?? null,
      companyId: companyId ?? null,
      slaPolicyId: slaPolicyId ?? null,
      dueAt,
      createdById: session.user.id,
    },
  });

  await prisma.ticketActivity.create({
    data: { ticketId: ticket.id, userId: session.user.id, type: 'created', meta: {} },
  });

  // Fire-and-forget email notifications (non-blocking)
  const emailCtx = {
    ticketNumber: ticket.number,
    ticketId: ticket.id,
    ticketTitle: ticket.title,
    priority: PRIORITY_LABELS[ticket.priority],
  };
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true, email: true } });
    if (assignee) void sendTicketCreatedToAssignee(emailCtx, assignee);
  }
  if (contactId) {
    const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { firstName: true, lastName: true, email: true } });
    if (contact?.email) {
      void sendTicketCreatedToContact(emailCtx, { name: `${contact.firstName} ${contact.lastName}`, email: contact.email });
    }
  }

  // AI analysis + workflow (fire-and-forget)
  void (async () => {
    const analysis = await analyzeTicket(ticket.title, ticket.description);
    if (analysis) {
      const patch: Record<string, unknown> = {};
      if (!ticket.category && analysis.category) patch.category = analysis.category;
      // Upgrade priority only if ticket was left at default MEDIUM and AI is confident
      if (ticket.priority === TicketPriority.MEDIUM && analysis.confidence >= 0.8
        && analysis.suggestedPriority !== TicketPriority.MEDIUM) {
        patch.priority = analysis.suggestedPriority;
      }
      if (analysis.suggestedTags.length > 0) {
        patch.tags = [...new Set([...ticket.tags, ...analysis.suggestedTags])];
      }
      if (Object.keys(patch).length > 0) {
        await prisma.ticket.update({ where: { id: ticket.id }, data: patch });
      }
      if (analysis.summary) {
        await prisma.ticketComment.create({
          data: {
            ticketId: ticket.id,
            authorId: session.user.id,
            isInternal: true,
            body: `**Analyse IA** · Catégorie : ${analysis.category} · Priorité suggérée : ${analysis.suggestedPriority} (confiance ${Math.round(analysis.confidence * 100)} %)\n\n${analysis.summary}`,
          },
        });
      }
    }
  })();

  // Run TICKET_CREATED workflows (fire-and-forget)
  void runWorkflows(WorkflowTrigger.TICKET_CREATED, {
    id: ticket.id,
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    source: ticket.source,
    category: ticket.category,
    tags: ticket.tags,
    assigneeId: ticket.assigneeId,
    teamId: ticket.teamId,
  }, session.user.id);

  return NextResponse.json(ticket, { status: 201 });
}

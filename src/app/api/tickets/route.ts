import { NextRequest, NextResponse } from 'next/server';
import { TicketStatus, TicketPriority, TicketType, TicketSource } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { parsePaginationParams } from '@/lib/pagination';
import { sendTicketCreatedToAssignee, sendTicketCreatedToContact } from '@/lib/email';
import { PRIORITY_LABELS } from '@/lib/labels';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = parsePaginationParams(sp);
  const search = sp.get('search') ?? '';
  const status = sp.get('status') as TicketStatus | null;
  const priority = sp.get('priority') as TicketPriority | null;
  const type = sp.get('type') as TicketType | null;
  const assigneeId = sp.get('assigneeId');
  const mine = sp.get('mine') === 'true';

  const where = {
    ...(search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { number: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(type ? { type } : {}),
    ...(mine ? { assigneeId: session.user?.id } : assigneeId ? { assigneeId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
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

  return NextResponse.json(ticket, { status: 201 });
}

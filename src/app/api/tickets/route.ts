import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TicketStatus, TicketPriority, TicketType, TicketSource } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(sp.get('pageSize') ?? 20)));
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

  return NextResponse.json(ticket, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TicketStatus } from '@prisma/client';
import { sendTicketStatusChanged, sendTicketAssigned } from '@/lib/email';
import { PRIORITY_LABELS, TICKET_STATUS_LABELS } from '@/lib/labels';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const old = await prisma.ticket.findUnique({
    where: { id },
    select: { status: true, assigneeId: true, title: true, number: true, priority: true },
  });
  if (!old) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: Record<string, unknown> = { ...body };

  if (body.status === TicketStatus.RESOLVED && !body.resolvedAt) data.resolvedAt = new Date();
  if (body.status === TicketStatus.CLOSED && !body.closedAt) data.closedAt = new Date();

  const ticket = await prisma.ticket.update({ where: { id }, data });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activities: { type: string; meta: any }[] = [];
  if (body.status && body.status !== old.status) {
    activities.push({ type: 'status_changed', meta: { from: old.status, to: body.status } });
  }
  if (body.assigneeId !== undefined && body.assigneeId !== old.assigneeId) {
    activities.push({ type: 'assigned', meta: { to: body.assigneeId } });
  }

  if (activities.length) {
    await prisma.ticketActivity.createMany({
      data: activities.map((a) => ({ ticketId: id, userId: session.user!.id!, ...a })),
    });
  }

  // Fire-and-forget email notifications
  const emailCtx = {
    ticketNumber: old.number,
    ticketId: id,
    ticketTitle: old.title,
    priority: PRIORITY_LABELS[old.priority],
  };
  const assigneeId = ticket.assigneeId ?? body.assigneeId;
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true, email: true } });
    if (assignee) {
      if (body.status && body.status !== old.status) {
        void sendTicketStatusChanged(
          { ...emailCtx, oldStatus: TICKET_STATUS_LABELS[old.status], newStatus: TICKET_STATUS_LABELS[body.status as TicketStatus] },
          assignee,
        );
      } else if (body.assigneeId && body.assigneeId !== old.assigneeId) {
        void sendTicketAssigned(emailCtx, assignee);
      }
    }
  }

  return NextResponse.json(ticket);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.ticket.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

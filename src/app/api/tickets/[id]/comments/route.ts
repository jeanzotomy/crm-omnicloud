import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: ticketId } = await params;

  const { body, isInternal } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'body is required' }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { id: true, firstResponseAt: true } });
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [comment] = await prisma.$transaction([
    prisma.ticketComment.create({
      data: { ticketId, authorId: session.user.id, body, isInternal: isInternal ?? false },
      include: { author: { select: { id: true, name: true, email: true } } },
    }),
    ...(ticket.firstResponseAt
      ? []
      : [prisma.ticket.update({ where: { id: ticketId }, data: { firstResponseAt: new Date(), status: 'OPEN' } })]),
  ]);

  await prisma.ticketActivity.create({
    data: { ticketId, userId: session.user.id, type: 'comment_added', meta: { isInternal: isInternal ?? false } },
  });

  return NextResponse.json(comment, { status: 201 });
}

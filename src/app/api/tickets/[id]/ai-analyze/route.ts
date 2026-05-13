import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TicketPriority } from '@prisma/client';
import { analyzeTicket } from '@/lib/ai';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, title: true, description: true, priority: true, category: true, tags: true } });
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const analysis = await analyzeTicket(ticket.title, ticket.description);
  if (!analysis) return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });

  const patch: Record<string, unknown> = { category: analysis.category };
  if (analysis.suggestedTags.length > 0) {
    patch.tags = [...new Set([...ticket.tags, ...analysis.suggestedTags])];
  }
  await prisma.ticket.update({ where: { id }, data: patch });

  await prisma.ticketComment.create({
    data: {
      ticketId: id,
      authorId: session.user.id,
      isInternal: true,
      body: `**Re-analyse IA** · Catégorie : ${analysis.category} · Priorité suggérée : ${analysis.suggestedPriority} (confiance ${Math.round(analysis.confidence * 100)} %)\n\n${analysis.summary}`,
    },
  });

  return NextResponse.json(analysis);
}

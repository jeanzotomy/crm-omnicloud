import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const days = Number(sp.get('days') ?? 30);
  const since = new Date(Date.now() - days * 86_400_000);

  const [
    ticketsByDay,
    resolutionByPriority,
    agentPerf,
    satisfaction,
    topCategories,
  ] = await Promise.all([
    prisma.ticket.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.ticket.groupBy({
      by: ['priority'],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.ticket.groupBy({
      by: ['assigneeId'],
      _count: { _all: true },
      where: { createdAt: { gte: since }, assigneeId: { not: null } },
    }),
    prisma.ticket.aggregate({
      _avg: { satisfactionScore: true },
      _count: { satisfactionScore: true },
      where: { satisfactionScore: { not: null }, createdAt: { gte: since } },
    }),
    prisma.ticket.groupBy({
      by: ['category'],
      _count: { _all: true },
      where: { createdAt: { gte: since }, category: { not: null } },
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    }),
  ]);

  const assigneeIds = agentPerf.map((r) => r.assigneeId).filter(Boolean) as string[];
  const agents = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true },
  });
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name]));

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    ticketsByStatus: Object.fromEntries(ticketsByDay.map((r) => [r.status, r._count._all])),
    ticketsByPriority: Object.fromEntries(resolutionByPriority.map((r) => [r.priority, r._count._all])),
    agentPerformance: agentPerf.map((r) => ({
      agentId: r.assigneeId,
      name: agentMap[r.assigneeId ?? ''] ?? 'Inconnu',
      count: r._count._all,
    })),
    satisfaction: {
      avg: satisfaction._avg.satisfactionScore,
      count: satisfaction._count.satisfactionScore,
    },
    topCategories: topCategories.map((r) => ({ category: r.category, count: r._count._all })),
  });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [
    total,
    byStatus,
    byPriority,
    breached,
    resolvedToday,
    openCritical,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ['priority'], _count: { _all: true } }),
    prisma.ticket.count({ where: { slaBreached: true } }),
    prisma.ticket.count({
      where: {
        status: 'RESOLVED',
        resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.ticket.count({ where: { priority: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
  ]);

  return NextResponse.json({
    total,
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    byPriority: Object.fromEntries(byPriority.map((r) => [r.priority, r._count._all])),
    breached,
    resolvedToday,
    openCritical,
  });
}

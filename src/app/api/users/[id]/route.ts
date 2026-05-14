import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  const body = await req.json() as { role?: string };
  if (!body.role || !Object.values(UserRole).includes(body.role as UserRole)) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: body.role as UserRole },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(user);
}

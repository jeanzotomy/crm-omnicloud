import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAzureAdBearer } from '@/lib/azure-ad-validate';

export async function GET(req: NextRequest) {
  const principal = await validateAzureAdBearer(req);
  if (!principal) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const phone = req.nextUrl.searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone query param required' }, { status: 400 });

  const contact = await prisma.contact.findFirst({
    where: { phone },
    include: {
      company: { select: { id: true, name: true } },
      tickets: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      },
    },
  });

  if (!contact) return NextResponse.json({ contact: null, tickets: [] });

  const { tickets, ...contactData } = contact;
  return NextResponse.json({ contact: contactData, tickets });
}

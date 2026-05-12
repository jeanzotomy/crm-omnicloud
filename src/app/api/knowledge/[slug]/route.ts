import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;

  const article = await prisma.knowledgeArticle.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
    },
  });

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.knowledgeArticle.update({ where: { slug }, data: { views: { increment: 1 } } });

  return NextResponse.json(article);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { helpful } = await req.json();

  await prisma.knowledgeArticle.update({
    where: { slug },
    data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } },
  });

  return new NextResponse(null, { status: 204 });
}

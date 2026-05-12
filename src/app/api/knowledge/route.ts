import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const search = sp.get('search') ?? '';
  const categoryId = sp.get('categoryId');

  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      status: 'PUBLISHED',
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { views: 'desc' },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
    },
  });

  const categories = await prisma.knowledgeCategory.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { articles: true } } },
  });

  return NextResponse.json({ articles, categories });
}

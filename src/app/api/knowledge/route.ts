import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { parsePaginationParams } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const search = sp.get('search') ?? '';
  const categoryId = sp.get('categoryId');
  const { page, pageSize } = parsePaginationParams(sp);

  const where = {
    status: KnowledgeStatus.PUBLISHED,
    ...(search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { body: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [articles, total, categories] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where,
      orderBy: { views: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true } },
      },
    }),
    prisma.knowledgeArticle.count({ where }),
    prisma.knowledgeCategory.findMany({
      where: { articles: { some: { status: KnowledgeStatus.PUBLISHED } } },
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: { where: { status: KnowledgeStatus.PUBLISHED } } } } },
    }),
  ]);

  return NextResponse.json({ articles, categories, total, page, pageSize });
}

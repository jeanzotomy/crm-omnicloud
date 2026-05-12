import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookOpen, Eye, ThumbsUp, ChevronRight, Search } from 'lucide-react';

export const metadata = { title: 'Base de connaissances' };

export default async function KnowledgePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [categories, popular] = await Promise.all([
    prisma.knowledgeCategory.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        children: { include: { _count: { select: { articles: true } } } },
        _count: { select: { articles: true } },
      },
    }),
    prisma.knowledgeArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { views: 'desc' },
      take: 8,
      include: { category: { select: { name: true, slug: true } } },
    }),
  ]);

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Base de connaissances</h1>
        <p className="text-sm text-gray-500 mt-0.5">Documentation, guides et procédures internes</p>
      </div>

      {/* Search hero */}
      <div className="gradient-primary px-8 py-10">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Comment pouvons-nous vous aider ?</h2>
          <form action="/knowledge/search" className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              name="q"
              type="search"
              placeholder="Rechercher un article, une procédure…"
              className="w-full rounded-2xl border-0 bg-white pl-12 pr-4 py-4 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </form>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Categories */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-4">Catégories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{cat.name}</h3>
                    <p className="text-xs text-gray-400">{cat._count.articles} article{cat._count.articles !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
                {cat.children.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-gray-50">
                    {cat.children.map((sub) => (
                      <Link key={sub.id} href={`/knowledge?cat=${sub.id}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-indigo-600 py-0.5">
                        <ChevronRight className="h-3 w-3 text-gray-300" />
                        {sub.name}
                        <span className="ml-auto text-gray-400">{sub._count.articles}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Popular articles */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-4">Articles populaires</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {popular.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-400">Aucun article publié.</div>
            )}
            {popular.map((article) => (
              <Link key={article.id} href={`/knowledge/${article.slug}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors group">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{article.title}</p>
                  {article.category && <p className="text-xs text-gray-400 mt-0.5">{article.category.name}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {article.views}</span>
                  <span className="flex items-center gap-1 text-emerald-600"><ThumbsUp className="h-3.5 w-3.5" /> {article.helpful}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

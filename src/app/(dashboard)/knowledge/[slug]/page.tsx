import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Eye, ThumbsUp, ThumbsDown, Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import FeedbackButtons from '@/components/knowledge/FeedbackButtons';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { slug } = await params;

  const article = await prisma.knowledgeArticle.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
    },
  });

  if (!article || article.status !== 'PUBLISHED') notFound();

  await prisma.knowledgeArticle.update({ where: { slug }, data: { views: { increment: 1 } } });

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/knowledge" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {article.category && (
            <Link href="/knowledge" className="text-xs text-indigo-600 hover:underline">{article.category.name}</Link>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {article.author.name}</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(article.updatedAt.toISOString())}</span>
          <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {article.views} vues</span>
          <span className="flex items-center gap-1.5 text-emerald-600"><ThumbsUp className="h-3.5 w-3.5" /> {article.helpful}</span>
        </div>
      </div>

      <div className="p-8 max-w-4xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="prose prose-sm prose-gray max-w-none">
            {article.body.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.slice(2)}</h1>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-800 mt-5 mb-2">{line.slice(3)}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-gray-700 mt-4 mb-2">{line.slice(4)}</h3>;
              if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-700 rounded-r-lg my-3 text-sm">{line.slice(2)}</blockquote>;
              if (line.startsWith('- ')) return <p key={i} className="text-sm text-gray-700 pl-4 before:content-['•'] before:mr-2 before:text-gray-400">{line.slice(2)}</p>;
              if (/^\d+\. /.test(line)) return <p key={i} className="text-sm text-gray-700 pl-4">{line}</p>;
              if (line === '') return <br key={i} />;
              if (line.startsWith('```')) return null;
              return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
            })}
          </div>

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-gray-100">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <FeedbackButtons slug={slug} helpful={article.helpful} notHelpful={article.notHelpful} />
      </div>
    </div>
  );
}

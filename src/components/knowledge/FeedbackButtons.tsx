'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface Props { slug: string; helpful: number; notHelpful: number }

export default function FeedbackButtons({ slug, helpful, notHelpful }: Props) {
  const [voted, setVoted] = useState<'helpful' | 'not' | null>(null);
  const [counts, setCounts] = useState({ helpful, notHelpful });

  async function vote(isHelpful: boolean) {
    if (voted) return;
    const v = isHelpful ? 'helpful' : 'not';
    setVoted(v);
    setCounts((prev) => ({
      helpful: prev.helpful + (isHelpful ? 1 : 0),
      notHelpful: prev.notHelpful + (isHelpful ? 0 : 1),
    }));
    await fetch(`/api/knowledge/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful: isHelpful }),
    });
  }

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
      <p className="text-sm font-semibold text-gray-700">Cet article vous a-t-il été utile ?</p>
      {voted ? (
        <p className="text-sm text-emerald-600 font-medium">Merci pour votre retour !</p>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => vote(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors">
            <ThumbsUp className="h-4 w-4" /> Oui ({counts.helpful})
          </button>
          <button onClick={() => vote(false)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
            <ThumbsDown className="h-4 w-4" /> Non ({counts.notHelpful})
          </button>
        </div>
      )}
    </div>
  );
}

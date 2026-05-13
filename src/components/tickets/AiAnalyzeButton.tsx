'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AiAnalyzeButton({ ticketId }: { ticketId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const run = async () => {
    setLoading(true);
    await fetch(`/api/tickets/${ticketId}/ai-analyze`, { method: 'POST' });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={() => void run()}
      disabled={loading}
      title="Re-analyser avec l'IA"
      className="flex items-center gap-1.5 rounded-xl border border-violet-200 text-violet-600 px-3 py-2 text-sm font-medium hover:bg-violet-50 disabled:opacity-50 transition-colors"
    >
      <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-pulse' : ''}`} />
      {loading ? 'Analyse…' : 'IA'}
    </button>
  );
}

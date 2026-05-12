'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Activity, Lock, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Comment {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string | null; email: string };
}

interface ActivityItem {
  id: string;
  type: string;
  meta: Record<string, string>;
  createdAt: string;
  user: { id: string; name: string | null };
}

interface Props {
  ticketId: string;
  comments: Comment[];
  activities: ActivityItem[];
  currentUserId: string;
}

function activityLabel(type: string, meta: Record<string, string>): string {
  switch (type) {
    case 'created': return 'a créé le ticket';
    case 'status_changed': return `a changé le statut : ${meta.from} → ${meta.to}`;
    case 'assigned': return `a assigné le ticket à ${meta.to ?? 'quelqu\'un'}`;
    case 'comment_added': return meta.isInternal === 'true' ? 'a ajouté une note interne' : 'a répondu';
    default: return type.replace(/_/g, ' ');
  }
}

function initials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return email[0].toUpperCase();
}

function avatarColor(str: string): string {
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length];
}

type TimelineItem =
  | { kind: 'comment'; data: Comment; date: string }
  | { kind: 'activity'; data: ActivityItem; date: string };

export default function TicketTimeline({ ticketId, comments: initialComments, activities, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  const timeline = useMemo<TimelineItem[]>(() => [
    ...comments.map((c) => ({ kind: 'comment' as const, data: c, date: c.createdAt })),
    ...activities.filter((a) => a.type !== 'comment_added').map((a) => ({ kind: 'activity' as const, data: a, date: a.createdAt })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [comments, activities]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, isInternal }),
    });

    if (res.ok) {
      const comment: Comment = await res.json();
      comment.createdAt = comment.createdAt ?? new Date().toISOString();
      comment.updatedAt = comment.updatedAt ?? new Date().toISOString();
      setComments((prev) => [...prev, comment]);
      setBody('');
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-400" />
        <h2 className="font-semibold text-gray-800">Activité & Commentaires</h2>
        <span className="ml-auto text-xs text-gray-400">{comments.length} commentaire{comments.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="divide-y divide-gray-50">
        {timeline.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Aucune activité pour l&apos;instant.</div>
        )}
        {timeline.map((item) => {
          if (item.kind === 'activity') {
            const a = item.data;
            return (
              <div key={a.id} className="flex items-start gap-3 px-6 py-3">
                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{a.user.name ?? 'Système'}</span>{' '}
                    {activityLabel(a.type, a.meta)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.createdAt)}</p>
                </div>
              </div>
            );
          }

          const c = item.data;
          const ini = initials(c.author.name, c.author.email);
          const color = avatarColor(c.author.id);

          return (
            <div key={c.id} className={`px-6 py-4 ${c.isInternal ? 'bg-amber-50/50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-full ${color} flex items-center justify-center shrink-0 text-white text-xs font-bold`}>
                  {ini}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{c.author.name ?? c.author.email}</span>
                    {c.isInternal && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Lock className="h-3 w-3" /> Note interne
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply form */}
      <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50">
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Répondre au ticket…"
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              Note interne
            </label>
            <button
              type="submit"
              disabled={loading || !body.trim()}
              className="ml-auto flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              {loading ? 'Envoi…' : isInternal ? 'Ajouter note' : 'Répondre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users2 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string | null;
  lead: { id: string; name: string | null } | null;
  department: { id: string; name: string } | null;
  _count: { members: number; tickets: number };
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/teams');
    if (res.ok) setTeams(await res.json() as Team[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="p-8 text-sm text-gray-500">Chargement…</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <Users2 className="h-4 w-4 text-violet-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Équipes ({teams.length})</h2>
          <p className="text-xs text-gray-500">Équipes support et leurs membres</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Équipe</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Département</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Responsable</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Membres</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tickets actifs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teams.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Aucune équipe configurée</td></tr>
            )}
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{team.name}</p>
                  {team.description && <p className="text-xs text-gray-400 mt-0.5">{team.description}</p>}
                </td>
                <td className="px-4 py-3 text-gray-500">{team.department?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{team.lead?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                    {team._count.members}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    {team._count.tickets}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

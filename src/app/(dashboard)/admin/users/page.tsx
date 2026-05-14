'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '@prisma/client';
import { Users } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  department: { name: string } | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  AGENT: 'Agent',
  CLIENT: 'Client',
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  MANAGER: 'bg-violet-100 text-violet-700',
  AGENT: 'bg-indigo-100 text-indigo-700',
  CLIENT: 'bg-gray-100 text-gray-600',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json() as AdminUser[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const changeRole = async (userId: string, role: UserRole) => {
    setUpdating(userId);
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const updated = await res.json() as AdminUser;
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: updated.role } : u));
    }
    setUpdating(null);
  };

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Chargement…</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Users className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Utilisateurs ({users.length})</h2>
          <p className="text-xs text-gray-500">Gérez les rôles et accès des membres</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Département</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Rôle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{user.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3 text-gray-500">{user.department?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    disabled={updating === user.id}
                    onChange={(e) => void changeRole(user.id, e.target.value as UserRole)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 ${ROLE_COLORS[user.role]} disabled:opacity-50`}
                  >
                    {Object.values(UserRole).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

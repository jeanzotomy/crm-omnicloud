'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  id: string;
  entity: string;
  redirectTo: string;
}

export default function DeleteButton({ id, entity, redirectTo }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/${entity}/${id}`, { method: 'DELETE' });
    router.push(redirectTo);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Supprimer définitivement ?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {loading ? '…' : 'Confirmer'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-2 rounded-lg border border-red-200 text-red-600 px-3 py-2 text-sm font-medium hover:bg-red-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Supprimer
    </button>
  );
}

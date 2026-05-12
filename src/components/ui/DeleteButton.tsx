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
        <span className="text-sm text-destructive">Confirmer ?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-md bg-destructive text-destructive-foreground px-3 py-2 text-sm font-medium hover:bg-destructive/90 disabled:opacity-60"
        >
          {loading ? '…' : 'Supprimer'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-2 rounded-md border border-destructive/30 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
      Supprimer
    </button>
  );
}

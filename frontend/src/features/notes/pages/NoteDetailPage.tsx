import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { NoteCard } from '@/features/notes/components/NoteCard';
import { ShareNoteModal } from '@/features/notes/components/ShareNoteModal';
import { descargarApunte, getApunte, valorarApunte } from '@/features/notes/services/notesService';
import type { Apunte } from '@/features/notes/types/note.types';
import { FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

/** Destino del vínculo compartido de un apunte. */
export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [shareApunte, setShareApunte] = useState<Apunte | null>(null);

  const apunteQuery = useQuery({
    queryKey: ['apunte', id],
    queryFn: () => getApunte(id!),
    enabled: !!id,
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['apunte', id] }),
      queryClient.invalidateQueries({ queryKey: ['apuntes'] }),
    ]);
  }

  async function handleDownload(apunte: Apunte) {
    setError('');
    try {
      await descargarApunte(apunte);
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo descargar el apunte'));
    }
  }

  async function handleRate(apunte: Apunte, puntuacion: number) {
    setError('');
    try {
      await valorarApunte(apunte.id, puntuacion);
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la valoración'));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/apuntes" className="text-sm font-semibold text-yellow-700 hover:underline">
        ← Volver al banco de apuntes
      </Link>

      {error && <FormAlert message={error} />}

      {apunteQuery.isLoading && <p className="text-gray-500">Cargando apunte...</p>}

      {apunteQuery.isError && (
        <FormAlert message={getApiErrorMessage(apunteQuery.error, 'No se encontró el apunte')} />
      )}

      {apunteQuery.data && (
        <NoteCard
          apunte={apunteQuery.data}
          esPropio={apunteQuery.data.usuarioId === user?.id}
          onDownload={handleDownload}
          onRate={handleRate}
          onShare={setShareApunte}
          detalle
        />
      )}

      <ShareNoteModal apunte={shareApunte} onClose={() => setShareApunte(null)} />
    </div>
  );
}

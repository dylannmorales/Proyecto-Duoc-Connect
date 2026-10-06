import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCarreras } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import { NoteCard } from '@/features/notes/components/NoteCard';
import { UploadNoteModal } from '@/features/notes/components/UploadNoteModal';
import {
  downloadApunte,
  rateApunte,
  searchApuntes,
  uploadApunte,
} from '@/features/notes/services/notesService';
import type { Apunte, UploadApuntePayload } from '@/features/notes/types/note.types';
import { Button, FormAlert, Input, Select } from '@/shared/components/ui/FormControls';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function NotesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [page, setPage] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  const apuntesQuery = useQuery({
    queryKey: ['apuntes', debouncedSearch, carreraId, asignaturaId, page],
    queryFn: () =>
      searchApuntes({
        q: debouncedSearch || undefined,
        carreraId: carreraId || undefined,
        asignaturaId: asignaturaId || undefined,
        page,
      }),
  });

  async function handleUpload(payload: UploadApuntePayload) {
    setError('');
    try {
      await uploadApunte(payload);
      setPage(0);
      await queryClient.invalidateQueries({ queryKey: ['apuntes'] });
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    }
  }

  async function handleDownload(apunte: Apunte) {
    setError('');
    setDownloadingId(apunte.id);
    try {
      await downloadApunte(apunte.id, apunte.nombreArchivo);
      await queryClient.invalidateQueries({ queryKey: ['apuntes'] });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo descargar el apunte'));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleRate(apunte: Apunte, rating: number) {
    setError('');
    try {
      await rateApunte(apunte.id, rating);
      await queryClient.invalidateQueries({ queryKey: ['apuntes'] });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la valoración'));
    }
  }

  const apuntes = apuntesQuery.data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banco de apuntes</h1>
          <p className="text-gray-600">Comparte y descarga material académico en PDF</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>Subir apunte</Button>
      </div>

      {error && <FormAlert message={error} />}

      {apuntesQuery.isError && (
        <FormAlert message={getApiErrorMessage(apuntesQuery.error, 'No se pudieron cargar los apuntes')} />
      )}

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
        <Input
          label="Buscar"
          name="q"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Título o descripción..."
        />
        <Select
          label="Carrera"
          name="carreraId"
          value={carreraId}
          onChange={(e) => {
            setCarreraId(e.target.value);
            setAsignaturaId('');
            setPage(0);
          }}
          options={(carrerasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
          placeholder="Todas las carreras"
        />
        <Select
          label="Asignatura"
          name="asignaturaId"
          value={asignaturaId}
          onChange={(e) => {
            setAsignaturaId(e.target.value);
            setPage(0);
          }}
          options={(asignaturasQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
          placeholder="Todas las asignaturas"
          disabled={!carreraId}
        />
      </div>

      {apuntesQuery.isLoading && <p className="text-gray-500">Cargando apuntes...</p>}

      {!apuntesQuery.isLoading && !apuntesQuery.isError && apuntes.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-600">No se encontraron apuntes con esos filtros.</p>
          <Button className="mt-4" onClick={() => setShowUpload(true)}>
            Subir el primero
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apuntes.map((apunte) => (
          <NoteCard
            key={apunte.id}
            apunte={apunte}
            onDownload={handleDownload}
            onRate={handleRate}
            downloading={downloadingId === apunte.id}
          />
        ))}
      </div>

      {apuntesQuery.data && apuntesQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page + 1} de {apuntesQuery.data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={apuntesQuery.data.last}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      <UploadNoteModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSubmit={handleUpload}
      />
    </div>
  );
}

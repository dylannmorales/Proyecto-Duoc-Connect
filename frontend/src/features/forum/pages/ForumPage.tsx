import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCarreras } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import { CreateQuestionModal } from '@/features/forum/components/CreateQuestionModal';
import { QuestionCard } from '@/features/forum/components/QuestionCard';
import { createPregunta, listPreguntas } from '@/features/forum/services/forumService';
import type { CreatePreguntaPayload } from '@/features/forum/types/forum.types';
import { Button, FormAlert, Input, Select } from '@/shared/components/ui/FormControls';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function ForumPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  const preguntasQuery = useQuery({
    queryKey: ['preguntas', debouncedSearch, carreraId, asignaturaId, page],
    queryFn: () =>
      listPreguntas({
        q: debouncedSearch || undefined,
        carreraId: carreraId || undefined,
        asignaturaId: asignaturaId || undefined,
        page,
      }),
  });

  async function handleCreate(payload: CreatePreguntaPayload, imagen?: File) {
    setError('');
    try {
      const pregunta = await createPregunta(payload, imagen);
      setPage(0);
      await queryClient.invalidateQueries({ queryKey: ['preguntas'] });
      navigate(`/foro/${pregunta.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    }
  }

  const preguntas = preguntasQuery.data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Foro académico</h1>
          <p className="text-gray-600">Publica dudas y ayuda a resolver las de otros estudiantes</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Hacer pregunta</Button>
      </div>

      {error && <FormAlert message={error} />}

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
        <Input
          label="Buscar"
          name="q"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Título o contenido..."
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

      {preguntasQuery.isLoading && <p className="text-gray-500">Cargando preguntas...</p>}

      {!preguntasQuery.isLoading && preguntas.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-600">No hay preguntas con esos filtros.</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            Publicar la primera
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {preguntas.map((pregunta) => (
          <QuestionCard key={pregunta.id} pregunta={pregunta} />
        ))}
      </div>

      {preguntasQuery.data && preguntasQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page + 1} de {preguntasQuery.data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={preguntasQuery.data.last}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      <CreateQuestionModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

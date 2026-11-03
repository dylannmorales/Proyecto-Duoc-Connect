import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCarreras } from '@/features/auth/services/authService';
import { AskQuestionModal } from '@/features/forum/components/AskQuestionModal';
import { QuestionCard } from '@/features/forum/components/QuestionCard';
import { crearPregunta, searchPreguntas } from '@/features/forum/services/forumService';
import type { CrearPreguntaPayload, EstadoPregunta, OrdenPregunta } from '@/features/forum/types/forum.types';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import { Button, FormAlert, Input, Select } from '@/shared/components/ui/FormControls';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function ForumPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [estado, setEstado] = useState<EstadoPregunta>('TODAS');
  const [orden, setOrden] = useState<OrdenPregunta>('recientes');
  const [page, setPage] = useState(0);
  const [showAsk, setShowAsk] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  const preguntasQuery = useQuery({
    queryKey: ['preguntas', debouncedSearch, carreraId, asignaturaId, estado, orden, page],
    queryFn: () =>
      searchPreguntas({
        q: debouncedSearch || undefined,
        carreraId: carreraId || undefined,
        asignaturaId: asignaturaId || undefined,
        estado,
        orden,
        page,
      }),
  });

  async function handleAsk(payload: CrearPreguntaPayload) {
    setError('');
    try {
      const pregunta = await crearPregunta(payload);
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
          <p className="text-gray-600">Resuelve dudas con ayuda de tus compañeros</p>
        </div>
        <Button onClick={() => setShowAsk(true)}>Hacer una pregunta</Button>
      </div>

      {error && <FormAlert message={error} />}

      {preguntasQuery.isError && (
        <FormAlert message={getApiErrorMessage(preguntasQuery.error, 'No se pudieron cargar las preguntas')} />
      )}

      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-5">
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
        <Select
          label="Estado"
          name="estado"
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as EstadoPregunta);
            setPage(0);
          }}
          options={[
            { value: 'ABIERTAS', label: 'Sin resolver' },
            { value: 'RESUELTAS', label: 'Resueltas' },
          ]}
          placeholder="Todas"
        />
        <Select
          label="Ordenar por"
          name="orden"
          value={orden}
          onChange={(e) => {
            setOrden((e.target.value || 'recientes') as OrdenPregunta);
            setPage(0);
          }}
          options={[{ value: 'votos', label: 'Más votadas' }]}
          placeholder="Más recientes"
        />
      </div>

      {preguntasQuery.isLoading && <p className="text-gray-500">Cargando preguntas...</p>}

      {!preguntasQuery.isLoading && !preguntasQuery.isError && preguntas.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-600">No se encontraron preguntas con esos filtros.</p>
          <Button className="mt-4" onClick={() => setShowAsk(true)}>
            Hacer la primera pregunta
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
          <Button variant="secondary" disabled={preguntasQuery.data.last} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}

      <AskQuestionModal open={showAsk} onClose={() => setShowAsk(false)} onSubmit={handleAsk} />
    </div>
  );
}

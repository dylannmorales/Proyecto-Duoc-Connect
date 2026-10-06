import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCarreras } from '@/features/auth/services/authService';
import { CreateGroupModal } from '@/features/groups/components/CreateGroupModal';
import { JoinByCodeModal } from '@/features/groups/components/JoinByCodeModal';
import { GroupCard } from '@/features/groups/components/GroupCard';
import { JoinGroupModal } from '@/features/groups/components/JoinGroupModal';
import { createGrupo, joinGrupo, joinGrupoPorCodigo, buscarGrupoPorCodigo, searchGrupos } from '@/features/groups/services/groupsService';
import type { CreateGrupoPayload, Grupo } from '@/features/groups/types/group.types';
import { Button, FormAlert, Input, Select } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { useDebounce } from '@/shared/hooks/useDebounce';

export function GroupsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [joinTarget, setJoinTarget] = useState<Grupo | null>(null);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });

  const gruposQuery = useQuery({
    queryKey: ['grupos', debouncedSearch, carreraId, page],
    queryFn: () =>
      searchGrupos({
        q: debouncedSearch || undefined,
        carreraId: carreraId || undefined,
        page,
      }),
  });

  async function handleCreate(payload: CreateGrupoPayload) {
    setError('');
    try {
      const grupo = await createGrupo(payload);
      setPage(0);
      queryClient.setQueryData(['grupo', grupo.id], grupo);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      navigate(`/grupos/${grupo.id}`, { state: { grupo } });
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    }
  }

  async function handleJoinByCode(codigo: string) {
    setError('');
    const grupo = await joinGrupoPorCodigo(codigo);
    await queryClient.invalidateQueries({ queryKey: ['grupos'] });
    navigate(`/grupos/${grupo.id}`, { state: { grupo } });
  }

  async function handleJoin(grupoId: string, codigo?: string) {
    setError('');
    try {
      const grupo = await joinGrupo(grupoId, codigo);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      navigate(`/grupos/${grupo.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    }
  }

  const grupos = gruposQuery.data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupos de estudio</h1>
          <p className="text-gray-600">Crea o únete a grupos para colaborar con tus compañeros</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowJoinByCode(true)}>
            Unirse con código
          </Button>
          <Button onClick={() => setShowCreate(true)}>Crear grupo</Button>
        </div>
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
          placeholder="Nombre o descripción..."
        />
        <Select
          label="Carrera"
          name="carreraId"
          value={carreraId}
          onChange={(e) => {
            setCarreraId(e.target.value);
            setPage(0);
          }}
          options={(carrerasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
          placeholder="Todas las carreras"
        />
      </div>

      {gruposQuery.isLoading && <p className="text-gray-500">Cargando grupos...</p>}

      {!gruposQuery.isLoading && grupos.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-600">No se encontraron grupos con esos filtros.</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            Crear el primero
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {grupos.map((grupo) => (
          <GroupCard key={grupo.id} grupo={grupo} onJoin={setJoinTarget} />
        ))}
      </div>

      {gruposQuery.data && gruposQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page + 1} de {gruposQuery.data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={gruposQuery.data.last}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      <JoinByCodeModal
        open={showJoinByCode}
        onClose={() => setShowJoinByCode(false)}
        onPreview={buscarGrupoPorCodigo}
        onJoin={handleJoinByCode}
      />

      <CreateGroupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <JoinGroupModal
        grupo={joinTarget}
        open={!!joinTarget}
        onClose={() => setJoinTarget(null)}
        onJoin={handleJoin}
      />
    </div>
  );
}

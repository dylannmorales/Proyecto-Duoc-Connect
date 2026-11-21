import { useState } from "react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { IconUsers } from "@/shared/components/ui/Icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { getCarreras } from "@/features/auth/services/authService";
import { CreateGroupModal } from "@/features/groups/components/CreateGroupModal";
import { JoinByCodeModal } from "@/features/groups/components/JoinByCodeModal";
import { GroupCard } from "@/features/groups/components/GroupCard";
import { JoinGroupModal } from "@/features/groups/components/JoinGroupModal";
import {
  createGrupo,
  invitarYResumir,
  updateGrupo,
  joinGrupo,
  joinGrupoPorCodigo,
  buscarGrupoPorCodigo,
  searchGrupos,
} from "@/features/groups/services/groupsService";
import type {
  CreateGrupoPayload,
  Grupo,
} from "@/features/groups/types/group.types";
import {
  Button,
  FormAlert,
  Input,
  Select,
} from "@/shared/components/ui/FormControls";
import { getApiErrorMessage } from "@/shared/utils/errors";
import { useDebounce } from "@/shared/hooks/useDebounce";

export function GroupsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  // Aviso que deja el detalle del grupo al salir de él.
  const aviso = (location.state as { aviso?: string } | null)?.aviso;

  const [search, setSearch] = useState("");
  const [carreraId, setCarreraId] = useState("");
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [joinTarget, setJoinTarget] = useState<Grupo | null>(null);
  const [editTarget, setEditTarget] = useState<Grupo | null>(null);
  const [editAviso, setEditAviso] = useState("");
  const [error, setError] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const carrerasQuery = useQuery({
    queryKey: ["carreras"],
    queryFn: getCarreras,
  });

  const gruposQuery = useQuery({
    queryKey: ["grupos", debouncedSearch, carreraId, page],
    queryFn: () =>
      searchGrupos({
        q: debouncedSearch || undefined,
        carreraId: carreraId || undefined,
        page,
      }),
  });

  async function handleCreate(
    payload: CreateGrupoPayload,
    invitados: string[],
  ) {
    setError("");
    const grupo = await createGrupo(payload);
    setPage(0);
    queryClient.setQueryData(["grupo", grupo.id], grupo);
    await queryClient.invalidateQueries({ queryKey: ["grupos"] });
    let aviso: string | undefined;
    try {
      aviso = await invitarYResumir(grupo.id, invitados);
    } catch (err) {
      aviso = `El grupo se creó, pero no se pudieron enviar las invitaciones: ${getApiErrorMessage(err)}`;
    }
    navigate(`/grupos/${grupo.id}`, { state: { grupo, aviso } });
  }

  async function handleEdit(payload: CreateGrupoPayload, invitados: string[]) {
    if (!editTarget) return;
    const actualizado = await updateGrupo(editTarget.id, payload);
    queryClient.setQueryData(["grupo", actualizado.id], actualizado);
    const resumen = await invitarYResumir(actualizado.id, invitados);
    await queryClient.invalidateQueries({ queryKey: ["grupos"] });
    setEditAviso(
      resumen ? `Grupo actualizado. ${resumen}` : "Grupo actualizado.",
    );
  }

  async function handleJoinByCode(codigo: string) {
    setError("");
    const grupo = await joinGrupoPorCodigo(codigo);
    await queryClient.invalidateQueries({ queryKey: ["grupos"] });
    navigate(`/grupos/${grupo.id}`, { state: { grupo } });
  }

  async function handleJoin(grupoId: string, codigo?: string) {
    setError("");
    try {
      const grupo = await joinGrupo(grupoId, codigo);
      await queryClient.invalidateQueries({ queryKey: ["grupos"] });
      navigate(`/grupos/${grupo.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    }
  }

  const grupos = gruposQuery.data?.content ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupos de estudio"
        description="Crea o únete a grupos para estudiar en equipo y coordinar por chat en tiempo real."
        icon={<IconUsers className="h-6 w-6" />}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowJoinByCode(true)}>
              Unirse con código
            </Button>
            <Button onClick={() => setShowCreate(true)}>Crear grupo</Button>
          </>
        }
      />

      {aviso && <FormAlert type="success" message={aviso} />}
      {editAviso && <FormAlert type="success" message={editAviso} />}
      {error && <FormAlert message={error} />}

      <div className="filter-bar grid gap-4 md:grid-cols-3">
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
          options={(carrerasQuery.data ?? []).map((c) => ({
            value: c.id,
            label: c.nombre,
          }))}
          placeholder="Todas las carreras"
        />
      </div>

      {gruposQuery.isLoading && (
        <p className="text-gray-500">Cargando grupos...</p>
      )}

      {!gruposQuery.isLoading && grupos.length === 0 && (
        <div className="empty-state">
          <p className="text-gray-600">
            No se encontraron grupos con esos filtros.
          </p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            Crear el primero
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {grupos.map((grupo) => (
          <GroupCard
            key={grupo.id}
            grupo={grupo}
            onJoin={setJoinTarget}
            onEdit={(g) => {
              setEditAviso("");
              setEditTarget(g);
            }}
          />
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

      {editTarget && (
        <CreateGroupModal
          grupo={editTarget}
          open
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
        />
      )}

      <JoinGroupModal
        grupo={joinTarget}
        open={!!joinTarget}
        onClose={() => setJoinTarget(null)}
        onJoin={handleJoin}
      />
    </div>
  );
}

import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminEditModal, type EditItem } from '@/features/admin/components/AdminEditModal';
import { AdminModerationCard } from '@/features/admin/components/AdminModerationCard';
import {
  deleteAdminApunte,
  downloadAdminApunte,
  deleteAdminFotoPerfil,
  deleteAdminGrupo,
  deleteAdminMensaje,
  deleteAdminPerfilProyecto,
  deleteAdminPregunta,
  deleteAdminRespuesta,
  getAdminStats,
  listAdminApuntes,
  listAdminFotosPerfil,
  listAdminGrupos,
  listAdminMensajes,
  listAdminPerfilesProyecto,
  listAdminPreguntas,
  listAdminRespuestas,
  listAdminUsuarios,
  updateAdminApunte,
  updateAdminGrupo,
  updateAdminMensaje,
  updateAdminPerfilProyecto,
  updateAdminPregunta,
  updateAdminRespuesta,
  updateUsuarioEstado,
  updateUsuarioRol,
} from '@/features/admin/services/adminService';
import type {
  AdminFotoPerfil,
  PageResponse,
} from '@/features/admin/types/admin.types';
import type { VisibilidadPerfil } from '@/features/companions/types/companion.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';
import type { RolUsuario } from '@/shared/types/api.types';

type AdminTab =
  | 'resumen'
  | 'usuarios'
  | 'apuntes'
  | 'preguntas'
  | 'respuestas'
  | 'grupos'
  | 'mensajes'
  | 'fotos'
  | 'perfiles';

type ViewItem = EditItem | { type: 'foto'; data: AdminFotoPerfil };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>('resumen');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [viewItem, setViewItem] = useState<ViewItem | null>(null);
  const [editItem, setEditItem] = useState<EditItem | null>(null);

  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats });
  const usuariosQuery = useQuery({
    queryKey: ['admin', 'usuarios', page],
    queryFn: () => listAdminUsuarios(page),
    enabled: tab === 'usuarios',
  });
  const apuntesQuery = useQuery({
    queryKey: ['admin', 'apuntes', page],
    queryFn: () => listAdminApuntes(page),
    enabled: tab === 'apuntes',
  });
  const preguntasQuery = useQuery({
    queryKey: ['admin', 'preguntas', page],
    queryFn: () => listAdminPreguntas(page),
    enabled: tab === 'preguntas',
  });
  const respuestasQuery = useQuery({
    queryKey: ['admin', 'respuestas', page],
    queryFn: () => listAdminRespuestas(page),
    enabled: tab === 'respuestas',
  });
  const gruposQuery = useQuery({
    queryKey: ['admin', 'grupos', page],
    queryFn: () => listAdminGrupos(page),
    enabled: tab === 'grupos',
  });
  const mensajesQuery = useQuery({
    queryKey: ['admin', 'mensajes', page],
    queryFn: () => listAdminMensajes(page),
    enabled: tab === 'mensajes',
  });
  const fotosQuery = useQuery({
    queryKey: ['admin', 'fotos', page],
    queryFn: () => listAdminFotosPerfil(page),
    enabled: tab === 'fotos',
  });
  const perfilesQuery = useQuery({
    queryKey: ['admin', 'perfiles', page],
    queryFn: () => listAdminPerfilesProyecto(page),
    enabled: tab === 'perfiles',
  });

  const rolMutation = useMutation({
    mutationFn: ({ id, rol }: { id: string; rol: RolUsuario }) => updateUsuarioRol(id, rol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const estadoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      updateUsuarioEstado(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  function invalidateStats() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  }

  const deleteApunteMutation = useMutation({
    mutationFn: deleteAdminApunte,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'apuntes'] });
      invalidateStats();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deletePreguntaMutation = useMutation({
    mutationFn: deleteAdminPregunta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'preguntas'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'respuestas'] });
      invalidateStats();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deleteRespuestaMutation = useMutation({
    mutationFn: deleteAdminRespuesta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'respuestas'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'preguntas'] });
      invalidateStats();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deleteGrupoMutation = useMutation({
    mutationFn: deleteAdminGrupo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'grupos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'mensajes'] });
      invalidateStats();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deleteMensajeMutation = useMutation({
    mutationFn: deleteAdminMensaje,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mensajes'] });
      invalidateStats();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deleteFotoMutation = useMutation({
    mutationFn: deleteAdminFotoPerfil,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'fotos'] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const deletePerfilMutation = useMutation({
    mutationFn: deleteAdminPerfilProyecto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'perfiles'] });
      invalidateStats();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  function changeTab(next: AdminTab) {
    setTab(next);
    setPage(0);
    setError('');
  }

  async function handleSaveEdit(payload: Record<string, string | boolean>) {
    if (!editItem) return;
    setError('');
    try {
      switch (editItem.type) {
        case 'apunte':
          await updateAdminApunte(editItem.data.id, {
            titulo: String(payload.titulo),
            descripcion: String(payload.descripcion ?? ''),
          });
          queryClient.invalidateQueries({ queryKey: ['admin', 'apuntes'] });
          break;
        case 'pregunta':
          await updateAdminPregunta(editItem.data.id, {
            titulo: String(payload.titulo),
            contenido: String(payload.contenido),
          });
          queryClient.invalidateQueries({ queryKey: ['admin', 'preguntas'] });
          break;
        case 'respuesta':
          await updateAdminRespuesta(editItem.data.id, { contenido: String(payload.contenido) });
          queryClient.invalidateQueries({ queryKey: ['admin', 'respuestas'] });
          break;
        case 'grupo':
          await updateAdminGrupo(editItem.data.id, {
            nombre: String(payload.nombre),
            descripcion: String(payload.descripcion ?? ''),
          });
          queryClient.invalidateQueries({ queryKey: ['admin', 'grupos'] });
          break;
        case 'mensaje':
          await updateAdminMensaje(editItem.data.id, { contenido: String(payload.contenido) });
          queryClient.invalidateQueries({ queryKey: ['admin', 'mensajes'] });
          break;
        case 'perfilProyecto':
          await updateAdminPerfilProyecto(editItem.data.usuarioId, {
            bio: String(payload.bio ?? ''),
            buscandoCompanero: Boolean(payload.buscandoCompanero),
            visibilidad: payload.visibilidad as VisibilidadPerfil,
          });
          queryClient.invalidateQueries({ queryKey: ['admin', 'perfiles'] });
          invalidateStats();
          break;
      }
      setEditItem(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    }
  }

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'apuntes', label: 'Apuntes' },
    { id: 'preguntas', label: 'Preguntas' },
    { id: 'respuestas', label: 'Respuestas' },
    { id: 'grupos', label: 'Grupos' },
    { id: 'mensajes', label: 'Mensajes' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'perfiles', label: 'Perfiles' },
  ];

  const currentPageData: PageResponse<unknown> | null | undefined =
    tab === 'usuarios'
      ? usuariosQuery.data
      : tab === 'apuntes'
        ? apuntesQuery.data
        : tab === 'preguntas'
          ? preguntasQuery.data
          : tab === 'respuestas'
            ? respuestasQuery.data
            : tab === 'grupos'
              ? gruposQuery.data
              : tab === 'mensajes'
                ? mensajesQuery.data
                : tab === 'fotos'
                  ? fotosQuery.data
                  : tab === 'perfiles'
                    ? perfilesQuery.data
                    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p className="mt-1 text-sm text-gray-600">
          Modera todo el contenido de la plataforma: apuntes, foro, grupos, chat, fotos y perfiles.
        </p>
      </div>

      {error && <FormAlert message={error} />}

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changeTab(item.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'bg-duoc-yellow text-duoc-black'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsQuery.isLoading && <p className="text-gray-500">Cargando estadísticas...</p>}
          {statsQuery.data && (
            <>
              <StatCard label="Usuarios" value={statsQuery.data.totalUsuarios} />
              <StatCard label="Grupos" value={statsQuery.data.totalGrupos} />
              <StatCard label="Apuntes" value={statsQuery.data.totalApuntes} />
              <StatCard label="Preguntas" value={statsQuery.data.totalPreguntas} />
              <StatCard label="Mensajes chat" value={statsQuery.data.totalMensajes} />
              <StatCard label="Buscando compañero" value={statsQuery.data.buscandoCompanero} />
            </>
          )}
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Carrera / Sede</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Registro</th>
              </tr>
            </thead>
            <tbody>
              {usuariosQuery.data?.content.map((usuario) => {
                const isSelf = usuario.id === user?.id;
                return (
                  <tr key={usuario.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{usuario.nombre}</p>
                      <p className="text-xs text-gray-500">{usuario.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {usuario.carreraNombre}
                      <br />
                      <span className="text-xs">{usuario.sedeNombre}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={usuario.rol}
                        disabled={isSelf || rolMutation.isPending}
                        onChange={(e) => {
                          setError('');
                          rolMutation.mutate({
                            id: usuario.id,
                            rol: e.target.value as RolUsuario,
                          });
                        }}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                      >
                        <option value="ESTUDIANTE">Estudiante</option>
                        <option value="ADMINISTRADOR">Administrador</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={isSelf || estadoMutation.isPending}
                        onClick={() => {
                          setError('');
                          estadoMutation.mutate({ id: usuario.id, activo: !usuario.activo });
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          usuario.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        } disabled:opacity-50`}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(usuario.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'apuntes' && (
        <ModerationList
          loading={apuntesQuery.isLoading}
          empty="No hay apuntes registrados."
          items={apuntesQuery.data?.content.map((apunte) => (
            <AdminModerationCard
              key={apunte.id}
              title={apunte.titulo}
              subtitle={`${apunte.usuarioNombre} · ${apunte.asignaturaNombre}`}
              meta={`${apunte.carreraNombre} · ${formatDate(apunte.createdAt)}`}
              onView={() => setViewItem({ type: 'apunte', data: apunte })}
              onEdit={() => setEditItem({ type: 'apunte', data: apunte })}
              onDownload={() => {
                setError('');
                downloadAdminApunte(apunte.id, apunte.nombreArchivo).catch((err) =>
                  setError(getApiErrorMessage(err, 'No se pudo descargar el PDF')),
                );
              }}
              onDelete={() => confirmDelete('¿Eliminar este apunte?', () => {
                setError('');
                deleteApunteMutation.mutate(apunte.id);
              })}
            />
          ))}
        />
      )}

      {tab === 'preguntas' && (
        <ModerationList
          loading={preguntasQuery.isLoading}
          empty="No hay preguntas en el foro."
          items={preguntasQuery.data?.content.map((pregunta) => (
            <AdminModerationCard
              key={pregunta.id}
              title={pregunta.titulo}
              subtitle={`${pregunta.usuarioNombre} · ${pregunta.asignaturaNombre}`}
              meta={`${pregunta.votos} votos · ${pregunta.totalRespuestas} respuestas · ${formatDate(pregunta.createdAt)}`}
              onView={() => setViewItem({ type: 'pregunta', data: pregunta })}
              onEdit={() => setEditItem({ type: 'pregunta', data: pregunta })}
              onDelete={() => confirmDelete('¿Eliminar esta pregunta y sus respuestas?', () => {
                setError('');
                deletePreguntaMutation.mutate(pregunta.id);
              })}
            />
          ))}
        />
      )}

      {tab === 'respuestas' && (
        <ModerationList
          loading={respuestasQuery.isLoading}
          empty="No hay respuestas en el foro."
          items={respuestasQuery.data?.content.map((respuesta) => (
            <AdminModerationCard
              key={respuesta.id}
              title={truncate(respuesta.contenido, 80)}
              subtitle={respuesta.usuarioNombre}
              meta={`Pregunta: ${respuesta.preguntaTitulo} · ${formatDate(respuesta.createdAt)}`}
              onView={() => setViewItem({ type: 'respuesta', data: respuesta })}
              onEdit={() => setEditItem({ type: 'respuesta', data: respuesta })}
              onDelete={() => confirmDelete('¿Eliminar esta respuesta?', () => {
                setError('');
                deleteRespuestaMutation.mutate(respuesta.id);
              })}
            />
          ))}
        />
      )}

      {tab === 'grupos' && (
        <ModerationList
          loading={gruposQuery.isLoading}
          empty="No hay grupos registrados."
          items={gruposQuery.data?.content.map((grupo) => (
            <AdminModerationCard
              key={grupo.id}
              title={grupo.nombre}
              subtitle={`${grupo.creadorNombre} · ${grupo.carreraNombre}`}
              meta={`${grupo.totalMiembros} miembros · ${grupo.privado ? 'Privado' : 'Público'} · ${formatDate(grupo.createdAt)}`}
              onView={() => setViewItem({ type: 'grupo', data: grupo })}
              onEdit={() => setEditItem({ type: 'grupo', data: grupo })}
              onDelete={() => confirmDelete('¿Eliminar este grupo y todos sus mensajes?', () => {
                setError('');
                deleteGrupoMutation.mutate(grupo.id);
              })}
            />
          ))}
        />
      )}

      {tab === 'mensajes' && (
        <ModerationList
          loading={mensajesQuery.isLoading}
          empty="No hay mensajes de chat."
          items={mensajesQuery.data?.content.map((mensaje) => (
            <AdminModerationCard
              key={mensaje.id}
              title={truncate(mensaje.contenido, 80)}
              subtitle={`${mensaje.usuarioNombre} en ${mensaje.grupoNombre}`}
              meta={formatDate(mensaje.createdAt)}
              onView={() => setViewItem({ type: 'mensaje', data: mensaje })}
              onEdit={() => setEditItem({ type: 'mensaje', data: mensaje })}
              onDelete={() => confirmDelete('¿Eliminar este mensaje?', () => {
                setError('');
                deleteMensajeMutation.mutate(mensaje.id);
              })}
            />
          ))}
        />
      )}

      {tab === 'fotos' && (
        <ModerationList
          loading={fotosQuery.isLoading}
          empty="No hay fotos de perfil subidas."
          items={fotosQuery.data?.content.map((foto) => (
            <div key={foto.usuarioId} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={foto.fotoUrl}
                    alt={foto.usuarioNombre}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{foto.usuarioNombre}</p>
                    <p className="text-sm text-gray-600">{foto.usuarioEmail}</p>
                    <p className="text-xs text-gray-400">
                      {foto.carreraNombre} · {formatDate(foto.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setViewItem({ type: 'foto', data: foto })}>
                    Ver
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      confirmDelete('¿Eliminar la foto de perfil de este usuario?', () => {
                        setError('');
                        deleteFotoMutation.mutate(foto.usuarioId);
                      })
                    }
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        />
      )}

      {tab === 'perfiles' && (
        <ModerationList
          loading={perfilesQuery.isLoading}
          empty="No hay perfiles de compañero."
          items={perfilesQuery.data?.content.map((perfil) => (
            <AdminModerationCard
              key={perfil.usuarioId}
              title={perfil.usuarioNombre}
              subtitle={perfil.usuarioEmail}
              meta={`${perfil.carreraNombre} · ${perfil.buscandoCompanero ? 'Buscando' : 'No busca'} · ${perfil.visibilidad} · ${formatDate(perfil.updatedAt)}`}
              onView={() => setViewItem({ type: 'perfilProyecto', data: perfil })}
              onEdit={() => setEditItem({ type: 'perfilProyecto', data: perfil })}
              onDelete={() => confirmDelete('¿Eliminar este perfil de compañero?', () => {
                setError('');
                deletePerfilMutation.mutate(perfil.usuarioId);
              })}
            />
          ))}
        />
      )}

      {currentPageData && currentPageData.totalPages > 1 && (
        <Pagination page={page} data={currentPageData} onPageChange={setPage} />
      )}

      {viewItem && <AdminViewModal item={viewItem} onClose={() => setViewItem(null)} />}

      {editItem && (
        <AdminEditModal
          key={editItem.type === 'perfilProyecto' ? editItem.data.usuarioId : editItem.data.id}
          item={editItem}
          open
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

function confirmDelete(message: string, action: () => void) {
  if (window.confirm(message)) action();
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function ModerationList({
  loading,
  empty,
  items,
}: {
  loading: boolean;
  empty: string;
  items?: ReactNode[];
}) {
  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!items?.length) return <p className="text-gray-500">{empty}</p>;
  return <div className="space-y-3">{items}</div>;
}

function Pagination({
  page,
  data,
  onPageChange,
}: {
  page: number;
  data: PageResponse<unknown>;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Página {data.page + 1} de {data.totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}>
          Anterior
        </Button>
        <Button variant="secondary" onClick={() => onPageChange(page + 1)} disabled={data.last}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}

function AdminViewModal({ item, onClose }: { item: ViewItem; onClose: () => void }) {
  const title =
    item.type === 'apunte'
      ? 'Detalle del apunte'
      : item.type === 'pregunta'
        ? 'Detalle de la pregunta'
        : item.type === 'respuesta'
          ? 'Detalle de la respuesta'
          : item.type === 'grupo'
            ? 'Detalle del grupo'
            : item.type === 'mensaje'
              ? 'Detalle del mensaje'
              : item.type === 'foto'
                ? 'Foto de perfil'
                : 'Perfil de compañero';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {item.type === 'apunte' && (
          <dl className="space-y-3 text-sm">
            <DetailRow label="Título" value={item.data.titulo} />
            <DetailRow label="Descripción" value={item.data.descripcion ?? '—'} multiline />
            <DetailRow label="Autor" value={`${item.data.usuarioNombre} (${item.data.usuarioEmail})`} />
            <DetailRow label="Archivo" value={item.data.nombreArchivo} />
            <DetailRow label="Fecha" value={formatDate(item.data.createdAt)} />
          </dl>
        )}

        {item.type === 'pregunta' && (
          <dl className="space-y-3 text-sm">
            <DetailRow label="Título" value={item.data.titulo} />
            <DetailRow label="Contenido" value={item.data.contenido} multiline />
            <DetailRow label="Autor" value={item.data.usuarioNombre} />
            <DetailRow label="Votos" value={String(item.data.votos)} />
            <DetailRow label="Fecha" value={formatDate(item.data.createdAt)} />
          </dl>
        )}

        {item.type === 'respuesta' && (
          <dl className="space-y-3 text-sm">
            <DetailRow label="Pregunta" value={item.data.preguntaTitulo} />
            <DetailRow label="Contenido" value={item.data.contenido} multiline />
            <DetailRow label="Autor" value={item.data.usuarioNombre} />
            <DetailRow label="Fecha" value={formatDate(item.data.createdAt)} />
          </dl>
        )}

        {item.type === 'grupo' && (
          <dl className="space-y-3 text-sm">
            <DetailRow label="Nombre" value={item.data.nombre} />
            <DetailRow label="Descripción" value={item.data.descripcion ?? '—'} multiline />
            <DetailRow label="Creador" value={`${item.data.creadorNombre} (${item.data.creadorEmail})`} />
            <DetailRow label="Carrera" value={item.data.carreraNombre} />
            <DetailRow label="Asignatura" value={item.data.asignaturaNombre ?? '—'} />
            <DetailRow label="Miembros" value={`${item.data.totalMiembros} / ${item.data.maxMiembros}`} />
            <DetailRow label="Privado" value={item.data.privado ? 'Sí' : 'No'} />
            <DetailRow label="Código" value={item.data.codigoInvitacion} />
            <DetailRow label="Fecha" value={formatDate(item.data.createdAt)} />
          </dl>
        )}

        {item.type === 'mensaje' && (
          <dl className="space-y-3 text-sm">
            <DetailRow label="Grupo" value={item.data.grupoNombre} />
            <DetailRow label="Autor" value={`${item.data.usuarioNombre} (${item.data.usuarioEmail})`} />
            <DetailRow label="Contenido" value={item.data.contenido} multiline />
            <DetailRow label="Fecha" value={formatDate(item.data.createdAt)} />
          </dl>
        )}

        {item.type === 'foto' && (
          <div className="space-y-4 text-sm">
            <img
              src={item.data.fotoUrl}
              alt={item.data.usuarioNombre}
              className="mx-auto max-h-64 rounded-xl object-contain"
            />
            <dl className="space-y-3">
              <DetailRow label="Usuario" value={item.data.usuarioNombre} />
              <DetailRow label="Email" value={item.data.usuarioEmail} />
              <DetailRow label="Carrera" value={item.data.carreraNombre} />
              <DetailRow label="Actualizada" value={formatDate(item.data.updatedAt)} />
            </dl>
          </div>
        )}

        {item.type === 'perfilProyecto' && (
          <dl className="space-y-3 text-sm">
            <DetailRow label="Usuario" value={`${item.data.usuarioNombre} (${item.data.usuarioEmail})`} />
            <DetailRow label="Carrera" value={item.data.carreraNombre} />
            <DetailRow label="Bio" value={item.data.bio ?? '—'} multiline />
            <DetailRow label="Buscando compañero" value={item.data.buscandoCompanero ? 'Sí' : 'No'} />
            <DetailRow label="Visibilidad" value={item.data.visibilidad} />
            <DetailRow label="Actualizado" value={formatDate(item.data.updatedAt)} />
          </dl>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className={`mt-0.5 text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</dd>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

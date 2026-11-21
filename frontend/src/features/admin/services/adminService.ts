import { apiClient } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type { VisibilidadPerfil } from '@/features/companions/types/companion.types';
import type {
  AdminApunte,
  AdminFotoPerfil,
  AdminGrupo,
  AdminMensaje,
  AdminPerfilProyecto,
  AdminPregunta,
  AdminRespuesta,
  AdminStats,
  AdminUsuario,
  PageResponse,
} from '@/features/admin/types/admin.types';
import type { RolUsuario } from '@/shared/types/api.types';

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
  return data.data;
}

export async function listAdminUsuarios(page = 0, size = 20): Promise<PageResponse<AdminUsuario>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AdminUsuario>>>('/admin/usuarios', {
    params: { page, size },
  });
  return data.data;
}

export async function updateUsuarioRol(id: string, rol: RolUsuario): Promise<AdminUsuario> {
  const { data } = await apiClient.patch<ApiResponse<AdminUsuario>>(`/admin/usuarios/${id}/rol`, {
    rol,
  });
  return data.data;
}

export async function updateUsuarioEstado(id: string, activo: boolean): Promise<AdminUsuario> {
  const { data } = await apiClient.patch<ApiResponse<AdminUsuario>>(
    `/admin/usuarios/${id}/estado`,
    { activo },
  );
  return data.data;
}

export async function listAdminApuntes(page = 0, size = 20): Promise<PageResponse<AdminApunte>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AdminApunte>>>('/admin/apuntes', {
    params: { page, size },
  });
  return data.data;
}

export async function updateAdminApunte(
  id: string,
  payload: { titulo: string; descripcion?: string },
): Promise<AdminApunte> {
  const { data } = await apiClient.patch<ApiResponse<AdminApunte>>(`/admin/apuntes/${id}`, payload);
  return data.data;
}

export async function deleteAdminApunte(id: string): Promise<void> {
  await apiClient.delete(`/admin/apuntes/${id}`);
}

export async function downloadAdminApunte(id: string, filename: string) {
  const response = await apiClient.get(`/admin/apuntes/${id}/descargar`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function listAdminPreguntas(page = 0, size = 20): Promise<PageResponse<AdminPregunta>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AdminPregunta>>>(
    '/admin/foro/preguntas',
    { params: { page, size } },
  );
  return data.data;
}

export async function updateAdminPregunta(
  id: string,
  payload: { titulo: string; contenido: string },
): Promise<AdminPregunta> {
  const { data } = await apiClient.patch<ApiResponse<AdminPregunta>>(
    `/admin/foro/preguntas/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteAdminPregunta(id: string): Promise<void> {
  await apiClient.delete(`/admin/foro/preguntas/${id}`);
}

export async function listAdminRespuestas(
  page = 0,
  size = 20,
): Promise<PageResponse<AdminRespuesta>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AdminRespuesta>>>(
    '/admin/foro/respuestas',
    { params: { page, size } },
  );
  return data.data;
}

export async function updateAdminRespuesta(
  id: string,
  payload: { contenido: string },
): Promise<AdminRespuesta> {
  const { data } = await apiClient.patch<ApiResponse<AdminRespuesta>>(
    `/admin/foro/respuestas/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteAdminRespuesta(id: string): Promise<void> {
  await apiClient.delete(`/admin/foro/respuestas/${id}`);
}

export async function listAdminGrupos(page = 0, size = 20): Promise<PageResponse<AdminGrupo>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AdminGrupo>>>('/admin/grupos', {
    params: { page, size },
  });
  return data.data;
}

export async function updateAdminGrupo(
  id: string,
  payload: { nombre: string; descripcion?: string },
): Promise<AdminGrupo> {
  const { data } = await apiClient.patch<ApiResponse<AdminGrupo>>(`/admin/grupos/${id}`, payload);
  return data.data;
}

export async function deleteAdminGrupo(id: string): Promise<void> {
  await apiClient.delete(`/admin/grupos/${id}`);
}

export async function listAdminMensajes(page = 0, size = 20): Promise<PageResponse<AdminMensaje>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AdminMensaje>>>('/admin/mensajes', {
    params: { page, size },
  });
  return data.data;
}

export async function updateAdminMensaje(
  id: string,
  payload: { contenido: string },
): Promise<AdminMensaje> {
  const { data } = await apiClient.patch<ApiResponse<AdminMensaje>>(`/admin/mensajes/${id}`, payload);
  return data.data;
}

export async function deleteAdminMensaje(id: string): Promise<void> {
  await apiClient.delete(`/admin/mensajes/${id}`);
}

export async function listAdminFotosPerfil(
  page = 0,
  size = 20,
): Promise<PageResponse<AdminFotoPerfil>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AdminFotoPerfil>>>(
    '/admin/fotos-perfil',
    { params: { page, size } },
  );
  return data.data;
}

export async function deleteAdminFotoPerfil(usuarioId: string): Promise<void> {
  await apiClient.delete(`/admin/fotos-perfil/${usuarioId}`);
}

export async function listAdminPerfilesProyecto(
  page = 0,
  size = 20,
): Promise<PageResponse<AdminPerfilProyecto>> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<AdminPerfilProyecto>>>(
    '/admin/perfiles-proyecto',
    { params: { page, size } },
  );
  return data.data;
}

export async function updateAdminPerfilProyecto(
  usuarioId: string,
  payload: { bio?: string; buscandoCompanero?: boolean; visibilidad?: VisibilidadPerfil },
): Promise<AdminPerfilProyecto> {
  const { data } = await apiClient.patch<ApiResponse<AdminPerfilProyecto>>(
    `/admin/perfiles-proyecto/${usuarioId}`,
    payload,
  );
  return data.data;
}

export async function deleteAdminPerfilProyecto(usuarioId: string): Promise<void> {
  await apiClient.delete(`/admin/perfiles-proyecto/${usuarioId}`);
}

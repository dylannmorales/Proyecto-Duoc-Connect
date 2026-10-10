import { apiClient } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  CreateGrupoPayload,
  Grupo,
  MensajeGrupo,
  MiembroGrupo,
  PageResponse,
} from '@/features/groups/types/group.types';

export async function searchGrupos(params: {
  carreraId?: string;
  q?: string;
  page?: number;
  size?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<PageResponse<Grupo>>>('/grupos', { params });
  return data.data;
}

export async function createGrupo(payload: CreateGrupoPayload) {
  const { data } = await apiClient.post<ApiResponse<Grupo>>('/grupos', payload);
  return data.data;
}

export async function getGrupo(id: string) {
  const { data } = await apiClient.get<ApiResponse<Grupo>>(`/grupos/${id}`);
  return data.data;
}

export async function joinGrupo(id: string, codigoInvitacion?: string) {
  const { data } = await apiClient.post<ApiResponse<Grupo>>(`/grupos/${id}/unirse`, {
    codigoInvitacion: codigoInvitacion || undefined,
  });
  return data.data;
}

export async function buscarGrupoPorCodigo(codigo: string) {
  const { data } = await apiClient.get<ApiResponse<Grupo>>(`/grupos/codigo/${codigo}`);
  return data.data;
}

export async function joinGrupoPorCodigo(codigo: string) {
  const { data } = await apiClient.post<ApiResponse<Grupo>>('/grupos/unirse-por-codigo', {
    codigoInvitacion: codigo,
  });
  return data.data;
}

export async function leaveGrupo(id: string) {
  await apiClient.delete(`/grupos/${id}/salir`);
}

export async function getGrupoMiembros(id: string) {
  const { data } = await apiClient.get<ApiResponse<MiembroGrupo[]>>(`/grupos/${id}/miembros`);
  return data.data;
}

export async function getGrupoMensajes(id: string, page = 0, size = 50) {
  const { data } = await apiClient.get<ApiResponse<PageResponse<MensajeGrupo>>>(
    `/grupos/${id}/mensajes`,
    { params: { page, size } },
  );
  return data.data;
}

export async function sendGrupoMensaje(id: string, contenido: string) {
  const { data } = await apiClient.post<ApiResponse<MensajeGrupo>>(`/grupos/${id}/mensajes`, {
    contenido,
  });
  return data.data;
}

export async function getAsignaturas(carreraId: string) {
  const { data } = await apiClient.get<ApiResponse<Array<{ id: string; nombre: string; codigo: string }>>>(
    '/catalogos/asignaturas',
    { params: { carreraId } },
  );
  return data.data;
}

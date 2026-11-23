import { apiClient } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  GrupoInvitable,
  InvitacionDirecta,
  RespuestaInvitacion,
} from '@/features/invitations/types/invitation.types';

export async function getGruposInvitables(usuarioId: string) {
  const { data } = await apiClient.get<ApiResponse<GrupoInvitable[]>>(
    `/companeros/${usuarioId}/grupos-invitables`,
  );
  return data.data;
}

export async function invitarCompanero(usuarioId: string, payload: { grupoId: string; mensaje?: string }) {
  await apiClient.post(`/companeros/${usuarioId}/invitaciones`, payload);
}

export async function getInvitacionesRecibidas() {
  const { data } = await apiClient.get<ApiResponse<InvitacionDirecta[]>>('/invitaciones');
  return data.data;
}

export async function aceptarInvitacion(id: string) {
  const { data } = await apiClient.post<ApiResponse<RespuestaInvitacion>>(`/invitaciones/${id}/aceptar`);
  return data.data;
}

export async function rechazarInvitacion(id: string) {
  const { data } = await apiClient.post<ApiResponse<RespuestaInvitacion>>(`/invitaciones/${id}/rechazar`);
  return data.data;
}

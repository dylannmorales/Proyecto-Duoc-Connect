import { apiClient } from '@/shared/lib/axios';
import type { PageResponse } from '@/features/groups/types/group.types';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  CrearPreguntaPayload,
  EstadoPregunta,
  OrdenPregunta,
  Pregunta,
  Respuesta,
  VotoResult,
} from '@/features/forum/types/forum.types';

export async function searchPreguntas(params: {
  carreraId?: string;
  asignaturaId?: string;
  q?: string;
  estado?: EstadoPregunta;
  orden?: OrdenPregunta;
  page?: number;
  size?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<PageResponse<Pregunta>>>('/foro/preguntas', { params });
  return data.data;
}

export async function getPregunta(id: string) {
  const { data } = await apiClient.get<ApiResponse<Pregunta>>(`/foro/preguntas/${id}`);
  return data.data;
}

export async function crearPregunta(payload: CrearPreguntaPayload) {
  const formData = new FormData();
  formData.append('titulo', payload.titulo);
  formData.append('contenido', payload.contenido);
  formData.append('carreraId', payload.carreraId);
  if (payload.asignaturaId) formData.append('asignaturaId', payload.asignaturaId);
  formData.append('tematicaGeneral', String(payload.tematicaGeneral));
  if (payload.imagen) formData.append('imagen', payload.imagen);

  const { data } = await apiClient.post<ApiResponse<Pregunta>>('/foro/preguntas', formData);
  return data.data;
}

export async function responderPregunta(preguntaId: string, contenido: string) {
  const { data } = await apiClient.post<ApiResponse<Respuesta>>(`/foro/preguntas/${preguntaId}/respuestas`, {
    contenido,
  });
  return data.data;
}

export async function votarPregunta(id: string) {
  const { data } = await apiClient.post<ApiResponse<VotoResult>>(`/foro/preguntas/${id}/votos`);
  return data.data;
}

export async function votarRespuesta(id: string) {
  const { data } = await apiClient.post<ApiResponse<VotoResult>>(`/foro/respuestas/${id}/votos`);
  return data.data;
}

export async function aceptarRespuesta(id: string) {
  const { data } = await apiClient.post<ApiResponse<Respuesta>>(`/foro/respuestas/${id}/aceptar`);
  return data.data;
}

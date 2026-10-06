import { apiClient } from '@/shared/lib/axios';
import type { PageResponse } from '@/features/groups/types/group.types';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  CreatePreguntaPayload,
  Pregunta,
  Respuesta,
  VotoResult,
} from '@/features/forum/types/forum.types';

export async function listPreguntas(params: {
  carreraId?: string;
  asignaturaId?: string;
  q?: string;
  page?: number;
  size?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<PageResponse<Pregunta>>>('/foro/preguntas', {
    params,
  });
  return data.data;
}

export async function createPregunta(payload: CreatePreguntaPayload, imagen?: File) {
  const formData = new FormData();
  formData.append('titulo', payload.titulo);
  formData.append('contenido', payload.contenido);
  formData.append('carreraId', payload.carreraId);
  if (payload.asignaturaId) {
    formData.append('asignaturaId', payload.asignaturaId);
  }
  formData.append('tematicaGeneral', String(Boolean(payload.tematicaGeneral)));
  if (imagen) {
    formData.append('imagen', imagen);
  }
  const { data } = await apiClient.post<ApiResponse<Pregunta>>('/foro/preguntas', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function getPregunta(id: string) {
  const { data } = await apiClient.get<ApiResponse<Pregunta>>(`/foro/preguntas/${id}`);
  return data.data;
}

export async function createRespuesta(preguntaId: string, contenido: string) {
  const { data } = await apiClient.post<ApiResponse<Respuesta>>(
    `/foro/preguntas/${preguntaId}/respuestas`,
    { contenido },
  );
  return data.data;
}

export async function votePregunta(preguntaId: string) {
  const { data } = await apiClient.post<ApiResponse<VotoResult>>(`/foro/preguntas/${preguntaId}/votar`);
  return data.data;
}

export async function voteRespuesta(respuestaId: string) {
  const { data } = await apiClient.post<ApiResponse<VotoResult>>(`/foro/respuestas/${respuestaId}/votar`);
  return data.data;
}

export async function acceptRespuesta(respuestaId: string) {
  const { data } = await apiClient.patch<ApiResponse<Respuesta>>(`/foro/respuestas/${respuestaId}/aceptar`);
  return data.data;
}

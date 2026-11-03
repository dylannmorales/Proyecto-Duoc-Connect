import { apiClient } from '@/shared/lib/axios';
import type { PageResponse } from '@/features/groups/types/group.types';
import type { ApiResponse } from '@/shared/types/api.types';
import type { Apunte, UploadApuntePayload } from '@/features/notes/types/note.types';

export async function searchApuntes(params: {
  carreraId?: string;
  asignaturaId?: string;
  q?: string;
  page?: number;
  size?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<PageResponse<Apunte>>>('/apuntes', { params });
  return data.data;
}

export async function getApunte(id: string) {
  const { data } = await apiClient.get<ApiResponse<Apunte>>(`/apuntes/${id}`);
  return data.data;
}

export async function uploadApunte(payload: UploadApuntePayload) {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('titulo', payload.titulo);
  if (payload.descripcion) formData.append('descripcion', payload.descripcion);
  formData.append('carreraId', payload.carreraId);
  formData.append('asignaturaId', payload.asignaturaId);

  const { data } = await apiClient.post<ApiResponse<Apunte>>('/apuntes', formData);
  return data.data;
}

export async function valorarApunte(id: string, puntuacion: number) {
  const { data } = await apiClient.put<ApiResponse<Apunte>>(`/apuntes/${id}/valoracion`, { puntuacion });
  return data.data;
}

export async function descargarApunte(apunte: Pick<Apunte, 'id' | 'nombreArchivo'>) {
  const response = await apiClient.get<Blob>(`/apuntes/${apunte.id}/descargar`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = apunte.nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

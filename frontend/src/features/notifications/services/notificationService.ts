import { apiClient } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export async function listNotificaciones(page = 0, size = 20) {
  const { data } = await apiClient.get<ApiResponse<PageResponse<Notificacion>>>('/notificaciones', {
    params: { page, size },
  });
  return data.data;
}

export async function countNotificacionesNoLeidas() {
  const { data } = await apiClient.get<ApiResponse<{ count: number }>>('/notificaciones/no-leidas');
  return data.data.count;
}

export async function marcarNotificacionLeida(id: string) {
  await apiClient.patch(`/notificaciones/${id}/leida`);
}

export async function marcarTodasLeidas() {
  await apiClient.patch('/notificaciones/leer-todas');
}

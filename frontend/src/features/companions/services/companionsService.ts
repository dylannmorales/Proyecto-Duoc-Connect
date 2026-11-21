import { apiClient } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  CompaneroRecomendacion,
  PerfilProyecto,
  UpdatePerfilProyectoPayload,
} from '@/features/companions/types/companion.types';

export async function getProjectProfile() {
  const { data } = await apiClient.get<ApiResponse<PerfilProyecto>>('/companeros/perfil');
  return data.data;
}

export async function updateProjectProfile(payload: UpdatePerfilProyectoPayload) {
  const { data } = await apiClient.put<ApiResponse<PerfilProyecto>>('/companeros/perfil', payload);
  return data.data;
}

export async function getRecommendations(limit = 10) {
  const { data } = await apiClient.get<ApiResponse<CompaneroRecomendacion[]>>(
    '/companeros/recomendaciones',
    { params: { limit } },
  );
  return data.data;
}

export async function searchCompanions(params: {
  asignaturaId?: string;
  habilidadId?: string;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<CompaneroRecomendacion[]>>('/companeros/buscar', {
    params,
  });
  return data.data;
}

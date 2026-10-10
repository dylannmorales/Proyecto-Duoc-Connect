import { apiClient } from '@/shared/lib/axios';
import type { ApiResponse, RolUsuario } from '@/shared/types/api.types';
import type { AdminStats, AdminUsuario, PageResponse } from '@/features/admin/types/admin.types';

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

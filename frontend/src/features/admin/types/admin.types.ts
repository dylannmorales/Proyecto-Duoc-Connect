import type { RolUsuario } from '@/shared/types/api.types';
import type { PageResponse } from '@/features/groups/types/group.types';

export type { PageResponse };

export interface AdminStats {
  totalUsuarios: number;
  usuariosActivos: number;
  totalGrupos: number;
  totalApuntes: number;
  totalMensajes: number;
}

export interface AdminUsuario {
  id: string;
  nombre: string;
  email: string;
  carreraNombre: string;
  sedeNombre: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt: string;
}

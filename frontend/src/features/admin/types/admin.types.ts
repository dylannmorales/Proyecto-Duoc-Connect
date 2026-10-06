import type { RolUsuario } from '@/shared/types/api.types';
import type { VisibilidadPerfil } from '@/features/companions/types/companion.types';
import type { PageResponse } from '@/features/groups/types/group.types';

export interface AdminStats {
  totalUsuarios: number;
  usuariosActivos: number;
  totalGrupos: number;
  totalApuntes: number;
  totalPreguntas: number;
  totalMensajes: number;
  buscandoCompanero: number;
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

export interface AdminApunte {
  id: string;
  titulo: string;
  descripcion: string | null;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  carreraNombre: string;
  asignaturaNombre: string;
  nombreArchivo: string;
  createdAt: string;
}

export interface AdminPregunta {
  id: string;
  titulo: string;
  contenido: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  asignaturaNombre: string;
  votos: number;
  totalRespuestas: number;
  createdAt: string;
}

export interface AdminRespuesta {
  id: string;
  preguntaId: string;
  preguntaTitulo: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  contenido: string;
  votos: number;
  aceptada: boolean;
  createdAt: string;
}

export interface AdminGrupo {
  id: string;
  nombre: string;
  descripcion: string | null;
  creadorId: string;
  creadorNombre: string;
  creadorEmail: string;
  carreraNombre: string;
  asignaturaNombre: string | null;
  privado: boolean;
  maxMiembros: number;
  totalMiembros: number;
  codigoInvitacion: string;
  createdAt: string;
}

export interface AdminMensaje {
  id: string;
  grupoId: string;
  grupoNombre: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  contenido: string;
  createdAt: string;
}

export interface AdminFotoPerfil {
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  carreraNombre: string;
  fotoUrl: string;
  updatedAt: string;
}

export interface AdminPerfilProyecto {
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  carreraNombre: string;
  bio: string | null;
  buscandoCompanero: boolean;
  visibilidad: VisibilidadPerfil;
  updatedAt: string;
}

export type { PageResponse };

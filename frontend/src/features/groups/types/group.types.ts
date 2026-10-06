export type RolGrupo = 'MIEMBRO' | 'ADMIN_GRUPO';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Grupo {
  id: string;
  nombre: string;
  descripcion: string | null;
  carreraId: string;
  carreraNombre: string;
  asignaturaId: string | null;
  asignaturaNombre: string | null;
  creadorId: string;
  creadorNombre: string;
  maxMiembros: number;
  miembrosActuales: number;
  privado: boolean;
  codigoInvitacion: string | null;
  esMiembro: boolean;
  rolEnGrupo: RolGrupo | null;
  createdAt: string;
}

export interface MiembroGrupo {
  usuarioId: string;
  nombre: string;
  fotoUrl: string | null;
  rol: RolGrupo;
  joinedAt: string;
}

export interface MensajeGrupo {
  id: string;
  grupoId: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioFotoUrl: string | null;
  contenido: string;
  createdAt: string;
}

export interface CreateGrupoPayload {
  nombre: string;
  descripcion?: string;
  carreraId: string;
  asignaturaId?: string;
  maxMiembros?: number;
  privado: boolean;
}

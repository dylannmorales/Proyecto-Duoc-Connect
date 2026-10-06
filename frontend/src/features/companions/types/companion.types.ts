export type VisibilidadPerfil = 'PUBLICO' | 'SOLO_CARRERA';
export type NivelHabilidad = 'BASICO' | 'INTERMEDIO' | 'AVANZADO';

export interface DisponibilidadItem {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export interface HabilidadPerfilItem {
  id: string;
  nombre: string;
  nivel: NivelHabilidad;
}

export interface AsignaturaPerfilItem {
  id: string;
  nombre: string;
}

export interface PerfilProyecto {
  usuarioId: string;
  nombre: string;
  fotoUrl: string | null;
  carreraNombre: string;
  sedeNombre: string;
  semestre: number;
  buscandoCompanero: boolean;
  bio: string | null;
  visibilidad: VisibilidadPerfil;
  asignaturas: AsignaturaPerfilItem[];
  habilidades: HabilidadPerfilItem[];
  disponibilidades: DisponibilidadItem[];
}

export interface CompaneroRecomendacion {
  usuarioId: string;
  nombre: string;
  fotoUrl: string | null;
  carreraNombre: string;
  sedeNombre: string;
  semestre: number;
  bio: string | null;
  matchScore: number;
  asignaturasEnComun: number;
  habilidadesDestacadas: Array<{ nombre: string; nivel: NivelHabilidad }>;
}

export interface UpdatePerfilProyectoPayload {
  bio?: string;
  buscandoCompanero: boolean;
  visibilidad: VisibilidadPerfil;
  asignaturaIds: string[];
  habilidades: Array<{ habilidadId: string; nivel: NivelHabilidad }>;
  disponibilidades: DisponibilidadItem[];
}

export interface Respuesta {
  id: string;
  preguntaId: string;
  usuarioId: string;
  usuarioNombre: string;
  contenido: string;
  votos: number;
  votado: boolean;
  aceptada: boolean;
  createdAt: string;
}

export interface Pregunta {
  id: string;
  titulo: string;
  contenido: string;
  usuarioId: string;
  usuarioNombre: string;
  carreraId: string;
  carreraNombre: string;
  asignaturaId: string | null;
  asignaturaNombre: string | null;
  tematicaGeneral: boolean;
  imagenUrl: string | null;
  votos: number;
  votado: boolean;
  totalRespuestas: number;
  resuelta: boolean;
  createdAt: string;
  respuestas: Respuesta[] | null;
}

export interface VotoResult {
  votos: number;
  votado: boolean;
}

export interface CrearPreguntaPayload {
  titulo: string;
  contenido: string;
  carreraId: string;
  asignaturaId?: string;
  tematicaGeneral: boolean;
  imagen?: File;
}

export type EstadoPregunta = 'TODAS' | 'ABIERTAS' | 'RESUELTAS';
export type OrdenPregunta = 'recientes' | 'votos';

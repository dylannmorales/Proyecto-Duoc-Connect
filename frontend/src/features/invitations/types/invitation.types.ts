/** Uno de mis grupos como opción para invitar a un compañero. */
export interface GrupoInvitable {
  grupoId: string;
  nombre: string;
  miembros: number;
  maxMiembros: number;
  disponible: boolean;
  motivo: string | null;
}

/** Invitación directa recibida (sin correos: solo nombre y foto de quien invita). */
export interface InvitacionDirecta {
  id: string;
  grupoId: string;
  grupoNombre: string;
  grupoDescripcion: string | null;
  carreraNombre: string | null;
  asignaturaNombre: string | null;
  miembros: number;
  maxMiembros: number;
  invitadorId: string;
  invitadorNombre: string;
  invitadorFotoUrl: string | null;
  mensaje: string | null;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  createdAt: string;
}

export interface RespuestaInvitacion {
  grupoId: string;
  grupoNombre: string;
  estado: 'ACEPTADA' | 'RECHAZADA';
}

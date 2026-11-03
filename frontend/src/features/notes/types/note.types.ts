export interface Apunte {
  id: string;
  titulo: string;
  descripcion: string | null;
  usuarioId: string;
  usuarioNombre: string;
  carreraId: string;
  carreraNombre: string;
  asignaturaId: string;
  asignaturaNombre: string;
  nombreArchivo: string;
  tamanoBytes: number;
  promedioValoracion: number;
  totalValoraciones: number;
  descargas: number;
  miValoracion: number | null;
  createdAt: string;
}

export interface UploadApuntePayload {
  titulo: string;
  descripcion?: string;
  carreraId: string;
  asignaturaId: string;
  file: File;
}

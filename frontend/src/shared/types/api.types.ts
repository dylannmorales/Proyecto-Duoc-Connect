export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Array<{ field: string; message: string }>;
  };
  timestamp: string;
}

export interface StatusResponse {
  application: string;
  version: string;
  status: string;
}

export interface Carrera {
  id: string;
  nombre: string;
  codigo: string;
}

export interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
}

export interface Habilidad {
  id: string;
  nombre: string;
}

export type RolUsuario = 'ESTUDIANTE' | 'ADMINISTRADOR';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  carreraId: string;
  carreraNombre: string;
  sedeId: string;
  sedeNombre: string;
  semestre: number;
  fotoUrl: string | null;
  rol: RolUsuario;
  createdAt: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: Usuario;
}

export interface LoginPayload {
  email: string;
  password: string;
  securityToken: string;
}

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
  carreraId: string;
  sedeId: string;
  semestre: number;
  securityToken: string;
}

export interface UpdateProfilePayload {
  nombre: string;
  carreraId: string;
  sedeId: string;
  semestre: number;
}

export interface MessageData {
  message: string;
}

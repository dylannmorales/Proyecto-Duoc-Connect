import { apiClient } from '@/shared/lib/axios';
import type {
  ApiResponse,
  AuthData,
  Carrera,
  LoginPayload,
  MessageData,
  RegisterPayload,
  Sede,
  UpdateProfilePayload,
  Usuario,
} from '@/shared/types/api.types';

export async function getFormSecurityToken() {
  const { data } = await apiClient.get<ApiResponse<{ token: string; expiresInSeconds: number }>>(
    '/auth/form-token',
  );
  return data.data;
}

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post<ApiResponse<AuthData>>('/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post<ApiResponse<AuthData>>('/auth/register', payload);
  return data.data;
}

export async function refreshToken(refreshTokenValue: string) {
  const { data } = await apiClient.post<ApiResponse<AuthData>>('/auth/refresh', {
    refreshToken: refreshTokenValue,
  });
  return data.data;
}

export async function forgotPassword(email: string) {
  const { data } = await apiClient.post<ApiResponse<MessageData>>('/auth/forgot-password', { email });
  return data.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const { data } = await apiClient.post<ApiResponse<MessageData>>('/auth/reset-password', {
    token,
    newPassword,
  });
  return data.data;
}

export async function getMyProfile() {
  const { data } = await apiClient.get<ApiResponse<Usuario>>('/usuarios/me');
  return data.data;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await apiClient.put<ApiResponse<Usuario>>('/usuarios/me', payload);
  return data.data;
}

export async function uploadProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<ApiResponse<Usuario>>('/usuarios/me/foto', formData);
  return data.data;
}

export async function getCarreras() {
  const { data } = await apiClient.get<ApiResponse<Carrera[]>>('/catalogos/carreras');
  return data.data;
}

export async function getSedes() {
  const { data } = await apiClient.get<ApiResponse<Sede[]>>('/catalogos/sedes');
  return data.data;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getMyProfile,
  login as loginRequest,
  register as registerRequest,
} from '@/features/auth/services/authService';
import { clearAuth } from '@/shared/lib/axios';
import { registerSessionExpiredHandler } from '@/shared/lib/auth-session';
import type { LoginPayload, RegisterPayload, Usuario } from '@/shared/types/api.types';

interface AuthContextValue {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistAuth(accessToken: string, refreshTokenValue: string, user: Usuario) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshTokenValue);
  localStorage.setItem('user', JSON.stringify(user));
}

function readStoredUser(): Usuario | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const profile = await getMyProfile();
    setUser(profile);
    localStorage.setItem('user', JSON.stringify(profile));
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(() => setUser(null));
    return () => registerSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = readStoredUser();

    if (!token || !storedUser) {
      setIsLoading(false);
      return;
    }

    setUser(storedUser);
    refreshUser()
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const authData = await loginRequest(payload);
    persistAuth(authData.accessToken, authData.refreshToken, authData.user);
    setUser(authData.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const authData = await registerRequest(payload);
    persistAuth(authData.accessToken, authData.refreshToken, authData.user);
    setUser(authData.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

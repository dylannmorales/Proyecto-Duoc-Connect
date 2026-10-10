import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.rol !== 'ADMINISTRADOR') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  countNotificacionesNoLeidas,
  listNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '@/features/notifications/services/notificationService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/FormControls';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const countQuery = useQuery({
    queryKey: ['notificaciones', 'count'],
    queryFn: countNotificacionesNoLeidas,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const listQuery = useQuery({
    queryKey: ['notificaciones', 'list'],
    queryFn: () => listNotificaciones(0, 10),
    enabled: isAuthenticated && open,
  });

  const markReadMutation = useMutation({
    mutationFn: marcarNotificacionLeida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: marcarTodasLeidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });

  if (!isAuthenticated) return null;

  const unread = countQuery.data ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notificaciones"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Cerrar notificaciones"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="font-semibold">Notificaciones</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllMutation.mutate()}
                  className="text-xs font-medium text-gray-500 hover:text-duoc-black"
                >
                  Marcar todas leídas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {listQuery.isLoading && (
                <p className="px-4 py-6 text-center text-sm text-gray-500">Cargando...</p>
              )}
              {!listQuery.isLoading && (listQuery.data?.content.length ?? 0) === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-500">Sin notificaciones</p>
              )}
              {listQuery.data?.content.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-gray-50 px-4 py-3 ${n.leida ? 'bg-white' : 'bg-yellow-50/50'}`}
                >
                  <p className="text-sm font-medium">{n.titulo}</p>
                  <p className="mt-0.5 text-xs text-gray-600">{n.mensaje}</p>
                  <div className="mt-2 flex gap-2">
                    {n.enlace && (
                      <Link
                        to={n.enlace}
                        onClick={() => {
                          if (!n.leida) markReadMutation.mutate(n.id);
                          setOpen(false);
                        }}
                        className="text-xs font-semibold text-duoc-black hover:underline"
                      >
                        Ver
                      </Link>
                    )}
                    {!n.leida && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 p-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full !py-2 !text-xs"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

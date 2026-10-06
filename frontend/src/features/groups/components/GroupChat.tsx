import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGroupChatSocket } from '@/features/groups/hooks/useGroupChatSocket';
import { getGrupoMensajes, sendGrupoMensaje } from '@/features/groups/services/groupsService';
import type { MensajeGrupo } from '@/features/groups/types/group.types';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface GroupChatProps {
  grupoId: string;
}

function sortMensajes(items: MensajeGrupo[]) {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function GroupChat({ grupoId }: GroupChatProps) {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [mensajes, setMensajes] = useState<MensajeGrupo[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleIncomingMessage = useCallback((incoming: MensajeGrupo) => {
    setMensajes((current) => {
      if (current.some((item) => item.id === incoming.id)) {
        return current;
      }
      return sortMensajes([...current, incoming]);
    });
  }, []);

  const { connected, error: socketError, sendMessage } = useGroupChatSocket({
    grupoId,
    enabled: !!user,
    onMessage: handleIncomingMessage,
  });

  const mensajesQuery = useQuery({
    queryKey: ['grupo-mensajes', grupoId],
    queryFn: () => getGrupoMensajes(grupoId),
    refetchInterval: connected ? false : 4000,
  });

  useEffect(() => {
    if (!mensajesQuery.data?.content) return;
    const fromServer = mensajesQuery.data.content;
    setMensajes((current) => {
      const merged = new Map<string, MensajeGrupo>();
      for (const item of fromServer) merged.set(item.id, item);
      for (const item of current) merged.set(item.id, item);
      return sortMensajes([...merged.values()]);
    });
  }, [mensajesQuery.data?.content]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const contenido = mensaje.trim();
    if (!contenido || sending) return;

    setError('');
    setSending(true);

    try {
      const nuevo = await sendGrupoMensaje(grupoId, contenido);
      handleIncomingMessage(nuevo);
      setMensaje('');
    } catch (restErr) {
      try {
        sendMessage(contenido);
        setMensaje('');
      } catch {
        setError(getApiErrorMessage(restErr, 'No se pudo enviar el mensaje'));
      }
    } finally {
      setSending(false);
    }
  }

  const loadError = mensajesQuery.isError
    ? getApiErrorMessage(mensajesQuery.error, 'No se pudieron cargar los mensajes')
    : '';
  const displayError = error || loadError || socketError;

  return (
    <div className="flex h-[500px] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <p className="text-xs font-medium text-gray-500">Chat del grupo</p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          {connected ? 'En vivo' : 'Sin tiempo real'}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensajesQuery.isLoading && <p className="text-sm text-gray-500">Cargando mensajes...</p>}
        {!mensajesQuery.isLoading && mensajes.length === 0 && (
          <p className="text-center text-sm text-gray-500">Sé el primero en escribir un mensaje</p>
        )}
        {mensajes.map((msg) => (
          <MessageBubble key={msg.id} mensaje={msg} isOwn={msg.usuarioId === user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4">
        {displayError && (
          <div className="mb-3">
            <FormAlert message={displayError} />
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={2000}
            disabled={sending}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-duoc-yellow focus:ring-2 focus:ring-yellow-100 disabled:bg-gray-50"
          />
          <Button type="submit" loading={sending}>
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ mensaje, isOwn }: { mensaje: MensajeGrupo; isOwn: boolean }) {
  const time = new Date(mensaje.createdAt).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const authorLabel = isOwn ? 'Tú' : mensaje.usuarioNombre;

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <MessageAvatar nombre={mensaje.usuarioNombre} fotoUrl={mensaje.usuarioFotoUrl} />
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <p className={`mb-1 text-xs font-semibold text-gray-600 ${isOwn ? 'text-right' : 'text-left'}`}>
          {authorLabel}
        </p>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn ? 'bg-duoc-yellow text-duoc-black' : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="text-sm">{mensaje.contenido}</p>
          <p className="mt-1 text-right text-[10px] opacity-60">{time}</p>
        </div>
      </div>
    </div>
  );
}

function MessageAvatar({ nombre, fotoUrl }: { nombre: string; fotoUrl: string | null }) {
  const initial = nombre.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-bold text-gray-600"
      title={nombre}
    >
      {fotoUrl ? (
        <img src={fotoUrl} alt={nombre} className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

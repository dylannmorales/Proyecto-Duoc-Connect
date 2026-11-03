import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { VoteButton } from '@/features/forum/components/VoteButton';
import {
  aceptarRespuesta,
  getPregunta,
  responderPregunta,
  votarPregunta,
  votarRespuesta,
} from '@/features/forum/services/forumService';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [contenido, setContenido] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const preguntaQuery = useQuery({
    queryKey: ['pregunta', id],
    queryFn: () => getPregunta(id!),
    enabled: !!id,
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pregunta', id] }),
      queryClient.invalidateQueries({ queryKey: ['preguntas'] }),
    ]);
  }

  async function run(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleReply(event: FormEvent) {
    event.preventDefault();
    if (!contenido.trim()) return;
    setSending(true);
    await run(async () => {
      await responderPregunta(id!, contenido.trim());
      setContenido('');
    });
    setSending(false);
  }

  if (preguntaQuery.isLoading) return <p className="text-gray-500">Cargando pregunta...</p>;

  if (preguntaQuery.isError || !preguntaQuery.data) {
    return (
      <div className="space-y-4">
        <FormAlert message={getApiErrorMessage(preguntaQuery.error, 'No se encontró la pregunta')} />
        <Link to="/foro" className="text-sm font-semibold text-yellow-700 hover:underline">
          ← Volver al foro
        </Link>
      </div>
    );
  }

  const pregunta = preguntaQuery.data;
  const respuestas = pregunta.respuestas ?? [];
  const esAutor = pregunta.usuarioId === user?.id;

  return (
    <div className="space-y-6">
      <Link to="/foro" className="text-sm font-semibold text-yellow-700 hover:underline">
        ← Volver al foro
      </Link>

      {error && <FormAlert message={error} />}

      <article className="flex gap-4 rounded-xl border border-gray-200 bg-white p-6">
        <VoteButton
          votos={pregunta.votos}
          votado={pregunta.votado}
          disabled={esAutor}
          title={esAutor ? 'No puedes votar tu propia pregunta' : undefined}
          onClick={() => run(() => votarPregunta(pregunta.id))}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{pregunta.titulo}</h1>
            {pregunta.resuelta && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                Resuelta
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {pregunta.tematicaGeneral ? 'Temática general' : pregunta.asignaturaNombre} · {pregunta.carreraNombre} ·
            por {pregunta.usuarioNombre} · {new Date(pregunta.createdAt).toLocaleDateString('es-CL')}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-gray-800">{pregunta.contenido}</p>
          {pregunta.imagenUrl && (
            <a href={pregunta.imagenUrl} target="_blank" rel="noreferrer" className="mt-4 block">
              <img
                src={pregunta.imagenUrl}
                alt={`Imagen adjunta a la pregunta ${pregunta.titulo}`}
                className="max-h-96 rounded-lg border border-gray-200 object-contain"
              />
            </a>
          )}
        </div>
      </article>

      <h2 className="text-lg font-bold">
        {respuestas.length} {respuestas.length === 1 ? 'respuesta' : 'respuestas'}
      </h2>

      <div className="space-y-3">
        {respuestas.map((respuesta) => {
          const esMia = respuesta.usuarioId === user?.id;
          return (
            <article
              key={respuesta.id}
              className={`flex gap-4 rounded-xl border bg-white p-5 ${
                respuesta.aceptada ? 'border-green-400 ring-1 ring-green-200' : 'border-gray-200'
              }`}
            >
              <VoteButton
                votos={respuesta.votos}
                votado={respuesta.votado}
                disabled={esMia}
                title={esMia ? 'No puedes votar tu propia respuesta' : undefined}
                onClick={() => run(() => votarRespuesta(respuesta.id))}
              />
              <div className="min-w-0 flex-1">
                {respuesta.aceptada && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">
                    ✓ Solución aceptada
                  </p>
                )}
                <p className="whitespace-pre-wrap text-gray-800">{respuesta.contenido}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">
                    {respuesta.usuarioNombre} · {new Date(respuesta.createdAt).toLocaleDateString('es-CL')}
                  </p>
                  {esAutor && (
                    <Button
                      variant={respuesta.aceptada ? 'secondary' : 'primary'}
                      className="!px-3 !py-1.5"
                      onClick={() => run(() => aceptarRespuesta(respuesta.id))}
                    >
                      {respuesta.aceptada ? 'Quitar como solución' : 'Aceptar como solución'}
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <form onSubmit={handleReply} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        <label htmlFor="respuesta" className="block text-sm font-medium text-gray-700">
          Tu respuesta
        </label>
        <textarea
          id="respuesta"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={4}
          maxLength={5000}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-duoc-yellow focus:ring-2 focus:ring-yellow-100"
        />
        <div className="flex justify-end">
          <Button type="submit" loading={sending}>
            Publicar respuesta
          </Button>
        </div>
      </form>
    </div>
  );
}

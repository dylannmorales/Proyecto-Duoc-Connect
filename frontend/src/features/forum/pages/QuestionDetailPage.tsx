import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AnswerForm, AnswerItem } from '@/features/forum/components/AnswerList';
import {
  acceptRespuesta,
  createRespuesta,
  getPregunta,
  votePregunta,
  voteRespuesta,
} from '@/features/forum/services/forumService';
import { FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [error, setError] = useState('');
  const [votingId, setVotingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [votingQuestion, setVotingQuestion] = useState(false);

  const preguntaQuery = useQuery({
    queryKey: ['pregunta', id],
    queryFn: () => getPregunta(id!),
    enabled: !!id,
  });

  const pregunta = preguntaQuery.data;
  const respuestas = pregunta?.respuestas ?? [];
  const isAuthor = user?.id === pregunta?.usuarioId;

  async function handleVoteQuestion() {
    if (!id) return;
    setVotingQuestion(true);
    setError('');
    try {
      await votePregunta(id);
      await queryClient.invalidateQueries({ queryKey: ['pregunta', id] });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setVotingQuestion(false);
    }
  }

  async function handleVoteAnswer(respuestaId: string) {
    setVotingId(respuestaId);
    setError('');
    try {
      await voteRespuesta(respuestaId);
      await queryClient.invalidateQueries({ queryKey: ['pregunta', id] });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setVotingId(null);
    }
  }

  async function handleAccept(respuestaId: string) {
    setAcceptingId(respuestaId);
    setError('');
    try {
      await acceptRespuesta(respuestaId);
      await queryClient.invalidateQueries({ queryKey: ['pregunta', id] });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleAnswer(contenido: string) {
    if (!id) return;
    setError('');
    await createRespuesta(id, contenido);
    await queryClient.invalidateQueries({ queryKey: ['pregunta', id] });
    await queryClient.invalidateQueries({ queryKey: ['preguntas'] });
  }

  if (preguntaQuery.isLoading) {
    return <p className="text-gray-500">Cargando pregunta...</p>;
  }

  if (!pregunta) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Pregunta no encontrada</p>
        <Link to="/foro" className="mt-4 inline-block text-sm font-semibold hover:underline">
          Volver al foro
        </Link>
      </div>
    );
  }

  const fecha = new Date(pregunta.createdAt).toLocaleString('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/foro" className="inline-block text-sm text-gray-500 hover:text-duoc-black">
        ← Volver al foro
      </Link>

      {error && <FormAlert message={error} />}

      <article className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleVoteQuestion}
              disabled={votingQuestion}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                pregunta.votadoPorMi
                  ? 'bg-duoc-yellow text-duoc-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ▲
            </button>
            <span className="text-lg font-bold">{pregunta.votos}</span>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{pregunta.titulo}</h1>
            <p className="mt-4 whitespace-pre-wrap text-gray-700">{pregunta.contenido}</p>
            {pregunta.imagenUrl && (
              <img
                src={pregunta.imagenUrl}
                alt="Imagen adjunta"
                className="mt-4 max-h-96 rounded-lg border border-gray-200 object-contain"
              />
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
              <span>{pregunta.asignaturaNombre ?? (pregunta.tematicaGeneral ? 'Otro' : 'Sin asignatura')}</span>
              <span>·</span>
              <span>{pregunta.carreraNombre}</span>
              <span>·</span>
              <span>{pregunta.usuarioNombre}</span>
              <span>·</span>
              <span>{fecha}</span>
            </div>
          </div>
        </div>
      </article>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {respuestas.length} respuesta{respuestas.length !== 1 ? 's' : ''}
        </h2>

        {respuestas.map((respuesta) => (
          <AnswerItem
            key={respuesta.id}
            respuesta={respuesta}
            isQuestionAuthor={isAuthor}
            onVote={handleVoteAnswer}
            onAccept={handleAccept}
            voting={votingId === respuesta.id}
            accepting={acceptingId === respuesta.id}
          />
        ))}
      </section>

      <AnswerForm onSubmit={handleAnswer} />
    </div>
  );
}

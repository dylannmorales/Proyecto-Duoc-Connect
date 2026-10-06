import { useState } from 'react';
import type { Respuesta } from '@/features/forum/types/forum.types';
import { Button } from '@/shared/components/ui/FormControls';

interface AnswerItemProps {
  respuesta: Respuesta;
  isQuestionAuthor: boolean;
  onVote: (id: string) => void;
  onAccept: (id: string) => void;
  voting?: boolean;
  accepting?: boolean;
}

export function AnswerItem({
  respuesta,
  isQuestionAuthor,
  onVote,
  onAccept,
  voting,
  accepting,
}: AnswerItemProps) {
  const fecha = new Date(respuesta.createdAt).toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <article
      className={`rounded-xl border p-4 ${
        respuesta.aceptada ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => onVote(respuesta.id)}
            disabled={voting}
            className={`rounded-lg px-2 py-1 text-sm font-bold transition ${
              respuesta.votadoPorMi
                ? 'bg-duoc-yellow text-duoc-black'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ▲
          </button>
          <span className="text-sm font-semibold">{respuesta.votos}</span>
        </div>

        <div className="min-w-0 flex-1">
          {respuesta.aceptada && (
            <span className="mb-2 inline-block rounded-full bg-green-200 px-2 py-0.5 text-xs font-semibold text-green-800">
              ✓ Respuesta aceptada
            </span>
          )}
          <p className="whitespace-pre-wrap text-sm text-gray-800">{respuesta.contenido}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-gray-500">
              {respuesta.usuarioNombre} · {fecha}
            </span>
            {isQuestionAuthor && !respuesta.aceptada && (
              <Button
                type="button"
                variant="secondary"
                className="!py-1.5 !text-xs"
                loading={accepting}
                onClick={() => onAccept(respuesta.id)}
              >
                Aceptar respuesta
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

interface AnswerFormProps {
  onSubmit: (contenido: string) => Promise<void>;
}

export function AnswerForm({ onSubmit }: AnswerFormProps) {
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!contenido.trim()) return;
    setLoading(true);
    try {
      await onSubmit(contenido.trim());
      setContenido('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-semibold">Tu respuesta</h3>
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={4}
        required
        placeholder="Escribe tu respuesta..."
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-duoc-yellow focus:ring-2 focus:ring-yellow-100"
      />
      <Button type="submit" loading={loading}>
        Publicar respuesta
      </Button>
    </form>
  );
}

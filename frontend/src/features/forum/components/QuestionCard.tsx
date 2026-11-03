import { Link } from 'react-router-dom';
import type { Pregunta } from '@/features/forum/types/forum.types';

interface QuestionCardProps {
  pregunta: Pregunta;
}

export function QuestionCard({ pregunta }: QuestionCardProps) {
  const fecha = new Date(pregunta.createdAt).toLocaleDateString('es-CL');

  return (
    <Link
      to={`/foro/${pregunta.id}`}
      className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-duoc-yellow hover:shadow-md"
    >
      <div className="flex w-14 shrink-0 flex-col items-center text-center text-sm">
        <span className="text-lg font-bold">{pregunta.votos}</span>
        <span className="text-xs text-gray-500">votos</span>
        <span
          className={`mt-2 w-full rounded-md px-1 py-0.5 text-xs font-semibold ${
            pregunta.resuelta
              ? 'bg-green-100 text-green-700'
              : pregunta.totalRespuestas > 0
                ? 'bg-yellow-50 text-yellow-800'
                : 'bg-gray-100 text-gray-500'
          }`}
        >
          {pregunta.totalRespuestas} resp.
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold leading-tight">{pregunta.titulo}</h3>
          {pregunta.imagenUrl && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
              Con imagen
            </span>
          )}
          {pregunta.resuelta && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              Resuelta
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{pregunta.contenido}</p>
        <p className="mt-3 text-xs text-gray-500">
          {pregunta.tematicaGeneral ? 'Temática general' : pregunta.asignaturaNombre} · {pregunta.carreraNombre} ·
          por {pregunta.usuarioNombre} · {fecha}
        </p>
      </div>
    </Link>
  );
}

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
      className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-duoc-yellow hover:shadow-md"
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-bold text-gray-700">{pregunta.votos}</span>
          <span className="text-xs text-gray-400">votos</span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">{pregunta.titulo}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{pregunta.contenido}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>{pregunta.asignaturaNombre ?? (pregunta.tematicaGeneral ? 'Otro' : 'Sin asignatura')}</span>
            <span>·</span>
            <span>{pregunta.carreraNombre}</span>
            <span>·</span>
            <span>{pregunta.totalRespuestas} respuesta{pregunta.totalRespuestas !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{pregunta.usuarioNombre}</span>
            <span>·</span>
            <span>{fecha}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

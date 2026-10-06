import type { CompaneroRecomendacion } from '@/features/companions/types/companion.types';
import { matchScoreColor } from '@/features/companions/utils/constants';

interface CompanionCardProps {
  companero: CompaneroRecomendacion;
}

export function CompanionCard({ companero }: CompanionCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-duoc-yellow hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-duoc-yellow text-lg font-bold">
          {companero.fotoUrl ? (
            <img src={companero.fotoUrl} alt={companero.nombre} className="h-full w-full object-cover" />
          ) : (
            companero.nombre.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{companero.nombre}</h3>
              <p className="text-sm text-gray-500">
                {companero.carreraNombre} · {companero.sedeNombre} · Sem. {companero.semestre}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${matchScoreColor(companero.matchScore)}`}
            >
              {companero.matchScore}% match
            </span>
          </div>

          {companero.bio && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{companero.bio}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {companero.asignaturasEnComun > 0 && (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                {companero.asignaturasEnComun} asignatura{companero.asignaturasEnComun !== 1 ? 's' : ''} en común
              </span>
            )}
            {companero.habilidadesDestacadas.map((h) => (
              <span key={h.nombre} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {h.nombre}
              </span>
            ))}
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Compatibilidad calculada según carrera, asignaturas, horarios y habilidades
          </p>
        </div>
      </div>
    </article>
  );
}

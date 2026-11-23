import type { CompaneroRecomendacion } from '@/features/companions/types/companion.types';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { IconArrowRight } from '@/shared/components/ui/Icons';
import { Link } from 'react-router-dom';

const NIVEL_LABEL = { BASICO: 'Básico', INTERMEDIO: 'Intermedio', AVANZADO: 'Avanzado' } as const;

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#E6BC00' : '#9ca3af';
  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #f3f4f6 0deg)` }}
      title="Compatibilidad según carrera, asignaturas, horarios y habilidades"
    >
      <span className="flex h-11 w-11 flex-col items-center justify-center rounded-full bg-white">
        <span className="text-sm font-bold leading-none text-gray-950">{score}%</span>
        <span className="text-[9px] font-medium uppercase tracking-wide text-gray-500">match</span>
      </span>
    </div>
  );
}

export function CompanionCard({ companero }: { companero: CompaneroRecomendacion }) {
  return (
    <article className="card card-hover relative flex flex-col p-5 focus-within:ring-4 focus-within:ring-duoc-yellow/40">
      <div className="flex items-start gap-4">
        <Avatar nombre={companero.nombre} fotoUrl={companero.fotoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-950">
            {/* El enlace cubre toda la tarjeta (::after) para que sea clicable completa. */}
            <Link
              to={`/companeros/${companero.usuarioId}`}
              className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] hover:underline focus:outline-none"
            >
              {companero.nombre}
            </Link>
          </h3>
          <p className="text-sm text-gray-500">{companero.carreraNombre}</p>
          <p className="text-xs text-gray-400">
            {companero.sedeNombre} · Semestre {companero.semestre}
          </p>
        </div>
        <ScoreRing score={companero.matchScore} />
      </div>

      {companero.bio && <p className="mt-4 line-clamp-2 text-sm text-gray-600">{companero.bio}</p>}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {companero.asignaturasEnComun > 0 && (
          <Badge tone="blue">
            {companero.asignaturasEnComun} asignatura{companero.asignaturasEnComun !== 1 ? 's' : ''} en común
          </Badge>
        )}
        {companero.habilidadesDestacadas.map((h) => (
          <Badge key={h.nombre}>
            {h.nombre} · {NIVEL_LABEL[h.nivel]}
          </Badge>
        ))}
      </div>

      <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-gray-900" aria-hidden="true">
        Ver perfil <IconArrowRight className="h-4 w-4" />
      </span>
    </article>
  );
}

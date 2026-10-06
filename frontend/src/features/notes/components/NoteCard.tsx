import type { Apunte } from '@/features/notes/types/note.types';
import { RatingStars } from '@/features/notes/components/RatingStars';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface NoteCardProps {
  apunte: Apunte;
  onDownload: (apunte: Apunte) => void;
  onRate: (apunte: Apunte, rating: number) => void;
  downloading?: boolean;
}

export function NoteCard({ apunte, onDownload, onRate, downloading }: NoteCardProps) {
  const fecha = new Date(apunte.createdAt).toLocaleDateString('es-CL');

  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition hover:border-duoc-yellow hover:shadow-md">
      <div className="mb-2 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">{apunte.titulo}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {apunte.asignaturaNombre} · {apunte.carreraNombre}
          </p>
        </div>
      </div>

      {apunte.descripcion && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-600">{apunte.descripcion}</p>
      )}

      <div className="mb-4">
        <RatingStars value={Number(apunte.promedioValoracion)} readonly size="sm" />
        <p className="mt-1 text-xs text-gray-400">
          {apunte.totalValoraciones} valoración{apunte.totalValoraciones !== 1 ? 'es' : ''}
        </p>
      </div>

      <div className="mt-auto space-y-3 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Por {apunte.usuarioNombre}</span>
          <span>{formatBytes(apunte.tamanoBytes)} · {apunte.descargas} descargas</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="mb-1 text-xs text-gray-500">Tu valoración</p>
            <RatingStars
              value={apunte.miValoracion ?? 0}
              onRate={(rating) => onRate(apunte, rating)}
              size="sm"
            />
          </div>
          <button
            type="button"
            onClick={() => onDownload(apunte)}
            disabled={downloading}
            className="rounded-lg bg-duoc-yellow px-4 py-2 text-sm font-semibold text-duoc-black hover:bg-yellow-400 disabled:opacity-60"
          >
            {downloading ? 'Descargando...' : 'Descargar'}
          </button>
        </div>

        <p className="text-right text-xs text-gray-400">{fecha}</p>
      </div>
    </article>
  );
}

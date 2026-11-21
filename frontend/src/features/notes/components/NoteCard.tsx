import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Apunte } from '@/features/notes/types/note.types';
import { Button } from '@/shared/components/ui/FormControls';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface NoteCardProps {
  apunte: Apunte;
  esPropio: boolean;
  onDownload: (apunte: Apunte) => Promise<void>;
  onRate: (apunte: Apunte, puntuacion: number) => Promise<void>;
  onShare: (apunte: Apunte) => void;
  /** En la vista de detalle se muestra la descripción completa y el título sin enlace. */
  detalle?: boolean;
}

export function NoteCard({ apunte, esPropio, onDownload, onRate, onShare, detalle = false }: NoteCardProps) {
  const fecha = new Date(apunte.createdAt).toLocaleDateString('es-CL');
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);

  const shown = hover || apunte.miValoracion || 0;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition hover:border-duoc-yellow hover:shadow-md">
      <div className="mb-2 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          {detalle ? (
            <h1 className="text-xl font-bold leading-tight">{apunte.titulo}</h1>
          ) : (
            <h3 className="font-semibold leading-tight">
              <Link to={`/apuntes/${apunte.id}`} className="hover:underline">
                {apunte.titulo}
              </Link>
            </h3>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {apunte.asignaturaNombre} · {apunte.carreraNombre}
          </p>
        </div>
      </div>

      {apunte.descripcion && (
        <p className={`mb-3 text-sm text-gray-600 ${detalle ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
          {apunte.descripcion}
        </p>
      )}

      <div className="mb-3 flex items-center justify-between gap-2">
        <div
          className="flex items-center"
          onMouseLeave={() => setHover(0)}
          aria-label={esPropio ? 'No puedes valorar tu propio apunte' : 'Valorar apunte'}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={esPropio || busy}
              onMouseEnter={() => !esPropio && setHover(n)}
              onClick={() => run(() => onRate(apunte, n))}
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              className={`text-xl leading-none transition disabled:cursor-not-allowed ${
                n <= shown ? 'text-duoc-yellow' : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {apunte.totalValoraciones > 0
            ? `${Number(apunte.promedioValoracion).toFixed(1)} (${apunte.totalValoraciones})`
            : 'Sin valoraciones'}
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={busy}
          onClick={() => run(() => onDownload(apunte))}
        >
          Descargar · {apunte.descargas}
        </Button>
        <Button variant="secondary" onClick={() => onShare(apunte)}>
          Compartir
        </Button>
      </div>

      <div className="mt-4 space-y-1 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Por {apunte.usuarioNombre}</span>
          <span>{formatBytes(apunte.tamanoBytes)}</span>
        </div>
        <p className="text-right text-xs text-gray-400">{fecha}</p>
      </div>
    </article>
  );
}

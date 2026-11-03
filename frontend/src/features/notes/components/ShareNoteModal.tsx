import type { Apunte } from '@/features/notes/types/note.types';
import { buildGmailShareUrl } from '@/features/groups/utils/shareGroup';
import { Button } from '@/shared/components/ui/FormControls';
import { CopyLinkButton } from '@/shared/components/ui/CopyLinkButton';

export function buildApunteLink(apunteId: string) {
  return `${window.location.origin}/apuntes/${apunteId}`;
}

interface ShareNoteModalProps {
  apunte: Apunte | null;
  onClose: () => void;
}

export function ShareNoteModal({ apunte, onClose }: ShareNoteModalProps) {
  if (!apunte) return null;

  const link = buildApunteLink(apunte.id);
  const gmailUrl = buildGmailShareUrl(
    `Apunte "${apunte.titulo}" - Duoc Connect`,
    [
      '¡Hola!',
      '',
      `Te comparto el apunte "${apunte.titulo}" (${apunte.asignaturaNombre}) del banco de apuntes de Duoc Connect:`,
      link,
    ].join('\n'),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-note-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="share-note-title" className="text-xl font-bold">
            Compartir “{apunte.titulo}”
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <p className="mb-2 text-sm font-medium text-gray-700">Vínculo del apunte</p>
        <input
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          aria-label="Vínculo del apunte"
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 font-mono text-xs text-gray-700"
        />
        <p className="mt-2 text-xs text-gray-500">
          Cualquier estudiante con sesión iniciada que tenga el vínculo puede ver, descargar y valorar el apunte.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <CopyLinkButton link={link} />
          <div className="flex gap-2">
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
            >
              Enviar por Gmail
            </a>
            <Button onClick={onClose}>Listo</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

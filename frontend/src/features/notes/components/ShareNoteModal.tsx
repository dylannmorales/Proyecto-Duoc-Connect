import { useState } from 'react';
import type { Apunte } from '@/features/notes/types/note.types';
import { compartirApunte, type ResultadoCompartir } from '@/features/notes/services/notesService';
import { buildGmailShareUrl } from '@/features/groups/utils/shareGroup';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { CopyLinkButton } from '@/shared/components/ui/CopyLinkButton';
import { EmailChipsInput, InvitationResults } from '@/shared/components/ui/EmailChipsInput';
import { sonCorreosValidos } from '@/shared/utils/email';
import { IconGlobe } from '@/shared/components/ui/Icons';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function buildApunteLink(apunteId: string) {
  return `${window.location.origin}/apuntes/${apunteId}`;
}

interface ShareNoteModalProps {
  apunte: Apunte | null;
  onClose: () => void;
}

export function ShareNoteModal({ apunte, onClose }: ShareNoteModalProps) {
  const [correos, setCorreos] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoCompartir[]>([]);
  const [error, setError] = useState('');

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

  async function enviar() {
    if (!apunte) return;
    setError('');
    setEnviando(true);
    try {
      setResultados(await compartirApunte(apunte.id, correos, mensaje.trim()));
      setCorreos([]);
      setMensaje('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo compartir el apunte'));
    } finally {
      setEnviando(false);
    }
  }

  function cerrar() {
    setCorreos([]);
    setMensaje('');
    setResultados([]);
    setError('');
    onClose();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="share-note-title" onClick={cerrar}>
      <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="share-note-title" className="text-xl font-bold leading-snug">
            Compartir “{apunte.titulo}”
          </h2>
          <button type="button" onClick={cerrar} className="icon-btn" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <EmailChipsInput id="compartir-apunte-correos" value={correos} onChange={setCorreos} />

        {correos.length > 0 && (
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="compartir-apunte-mensaje" className="field-label">
                Mensaje (opcional)
              </label>
              <textarea
                id="compartir-apunte-mensaje"
                rows={3}
                maxLength={500}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Ej: Te sirve para la prueba del jueves"
                className="field-input"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={enviar} loading={enviando} disabled={!sonCorreosValidos(correos)}>
                Enviar
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3">
            <FormAlert message={error} />
          </div>
        )}
        {resultados.length > 0 && (
          <div className="mt-3">
            <InvitationResults resultados={resultados} />
          </div>
        )}

        <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-900">Acceso general</h3>
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
            <IconGlobe className="h-5 w-5" />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-medium">Estudiantes de Duoc Connect</p>
            <p className="text-xs text-gray-500">
              Cualquier estudiante con sesión iniciada y el enlace puede ver, descargar y valorar el apunte.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <CopyLinkButton link={link} />
          <div className="flex gap-2">
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
            >
              Gmail
            </a>
            <Button onClick={cerrar}>Listo</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

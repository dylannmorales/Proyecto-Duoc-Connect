import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  buildGrupoInvitationLink,
  getGrupoMiembros,
  invitarAlGrupo,
} from '@/features/groups/services/groupsService';
import type { Grupo, InvitacionResultado } from '@/features/groups/types/group.types';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { CopyLinkButton } from '@/shared/components/ui/CopyLinkButton';
import { EmailChipsInput, InvitationResults } from '@/shared/components/ui/EmailChipsInput';
import { sonCorreosValidos } from '@/shared/utils/email';
import { Avatar } from '@/shared/components/ui/Avatar';
import { IconGlobe, IconLock } from '@/shared/components/ui/Icons';
import { buildGmailShareUrl } from '@/features/groups/utils/shareGroup';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface ShareGroupModalProps {
  grupo: Grupo;
  open: boolean;
  onClose: () => void;
}

export function ShareGroupModal({ grupo, open, onClose }: ShareGroupModalProps) {
  const { user } = useAuth();
  const [correos, setCorreos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resultados, setResultados] = useState<InvitacionResultado[]>([]);
  const [error, setError] = useState('');

  const miembrosQuery = useQuery({
    queryKey: ['grupo-miembros', grupo.id],
    queryFn: () => getGrupoMiembros(grupo.id),
    enabled: open,
  });

  if (!open) return null;

  const link = grupo.codigoInvitacion ? buildGrupoInvitationLink(grupo.codigoInvitacion) : '';

  async function enviar() {
    setError('');
    setEnviando(true);
    try {
      setResultados(await invitarAlGrupo(grupo.id, correos));
      setCorreos([]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron enviar las invitaciones'));
    } finally {
      setEnviando(false);
    }
  }

  function cerrar() {
    setCorreos([]);
    setResultados([]);
    setError('');
    onClose();
  }

  const miembros = miembrosQuery.data ?? [];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="share-group-title" onClick={cerrar}>
      <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="share-group-title" className="text-xl font-bold leading-snug">
            Compartir “{grupo.nombre}”
          </h2>
          <button type="button" onClick={cerrar} className="icon-btn" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <EmailChipsInput id="invitar-correos" value={correos} onChange={setCorreos} label="Invitar por correo institucional" />

        {correos.length > 0 && (
          <div className="mt-3 flex justify-end">
            <Button onClick={enviar} loading={enviando} disabled={!sonCorreosValidos(correos)}>
              Enviar invitación{correos.length > 1 ? 'es' : ''}
            </Button>
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

        <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-900">Personas con acceso</h3>
        {miembrosQuery.isLoading && <p className="text-sm text-gray-500">Cargando...</p>}
        <ul className="max-h-56 space-y-3 overflow-y-auto pr-1">
          {miembros.map((miembro) => (
            <li key={miembro.usuarioId} className="flex items-center gap-3">
              <Avatar nombre={miembro.nombre} fotoUrl={miembro.fotoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {miembro.nombre}
                  {miembro.usuarioId === user?.id && <span className="text-gray-500"> (tú)</span>}
                </p>
                <p className="truncate text-xs text-gray-500">{miembro.email}</p>
              </div>
              <span className="shrink-0 text-xs text-gray-500">
                {miembro.rol === 'ADMIN_GRUPO' ? 'Administrador' : 'Miembro'}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-900">Acceso general</h3>
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
            {grupo.privado ? <IconLock className="h-5 w-5" /> : <IconGlobe className="h-5 w-5" />}
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-medium">{grupo.privado ? 'Restringido' : 'Público en Duoc Connect'}</p>
            <p className="text-xs text-gray-500">
              {grupo.privado
                ? 'Solo pueden unirse quienes tengan el enlace o el código'
                : 'Cualquier estudiante puede encontrarlo y unirse'}
              {grupo.codigoInvitacion && (
                <>
                  {' · Código '}
                  <span className="font-mono font-semibold text-gray-700">{grupo.codigoInvitacion}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {link ? <CopyLinkButton link={link} /> : <span />}
          <div className="flex items-center gap-2">
            {link && (
              <a
                href={buildGmailShareUrl(
                  `Invitación al grupo ${grupo.nombre} - Duoc Connect`,
                  [
                    '¡Hola!',
                    '',
                    `Te invito a unirte al grupo de estudio "${grupo.nombre}" en Duoc Connect:`,
                    link,
                    '',
                    `Código de invitación: ${grupo.codigoInvitacion}`,
                  ].join('\n'),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
              >
                Gmail
              </a>
            )}
            <Button onClick={cerrar}>Listo</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

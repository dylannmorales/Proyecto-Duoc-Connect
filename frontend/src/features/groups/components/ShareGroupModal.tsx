import { useState, type KeyboardEvent } from 'react';
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
import { getApiErrorMessage } from '@/shared/utils/errors';

const CORREO_INSTITUCIONAL = /^[^@\s]+@duocuc\.cl$/i;

const estadoEstilos: Record<InvitacionResultado['estado'], string> = {
  ENVIADA: 'text-green-700',
  YA_ES_MIEMBRO: 'text-gray-500',
  INVALIDO: 'text-red-600',
};

interface ShareGroupModalProps {
  grupo: Grupo;
  open: boolean;
  onClose: () => void;
}

export function ShareGroupModal({ grupo, open, onClose }: ShareGroupModalProps) {
  const { user } = useAuth();
  const [borrador, setBorrador] = useState('');
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
  const hayInvalidos = correos.some((c) => !CORREO_INSTITUCIONAL.test(c));

  function agregar(texto: string) {
    const nuevos = texto
      .split(/[\s,;]+/)
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    if (nuevos.length === 0) return;
    setCorreos((actuales) => Array.from(new Set([...actuales, ...nuevos])));
  }

  function agregarBorrador() {
    agregar(borrador);
    setBorrador('');
  }

  // Al pegar o escribir un separador, todo lo anterior al último separador se convierte en etiquetas.
  function handleChange(value: string) {
    const corte = value.search(/[\s,;][^\s,;]*$/);
    if (corte === -1) {
      setBorrador(value);
      return;
    }
    agregar(value.slice(0, corte));
    setBorrador(value.slice(corte + 1));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (['Enter', ',', ';', ' ', 'Tab'].includes(event.key) && borrador.trim()) {
      event.preventDefault();
      agregarBorrador();
    } else if (event.key === 'Backspace' && !borrador && correos.length > 0) {
      setCorreos((actuales) => actuales.slice(0, -1));
    }
  }

  async function enviar() {
    setError('');
    setEnviando(true);
    try {
      const respuesta = await invitarAlGrupo(grupo.id, correos);
      setResultados(respuesta);
      setCorreos([]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron enviar las invitaciones'));
    } finally {
      setEnviando(false);
    }
  }

  function cerrar() {
    setBorrador('');
    setCorreos([]);
    setResultados([]);
    setError('');
    onClose();
  }

  const miembros = miembrosQuery.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-group-title"
      onClick={cerrar}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="share-group-title" className="text-xl font-bold">
            Compartir “{grupo.nombre}”
          </h2>
          <button type="button" onClick={cerrar} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="rounded-lg border-2 border-gray-300 px-3 py-2 focus-within:border-duoc-yellow">
          <label htmlFor="invitar-correos" className="block text-xs font-medium text-gray-500">
            Invitar por correo institucional
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {correos.map((correo) => {
              const valido = CORREO_INSTITUCIONAL.test(correo);
              return (
                <span
                  key={correo}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                    valido ? 'bg-gray-100 text-gray-800' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  }`}
                >
                  {correo}
                  <button
                    type="button"
                    onClick={() => setCorreos((actuales) => actuales.filter((c) => c !== correo))}
                    aria-label={`Quitar ${correo}`}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
            <input
              id="invitar-correos"
              type="text"
              inputMode="email"
              autoComplete="off"
              value={borrador}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={agregarBorrador}
              placeholder={correos.length === 0 ? 'nombre.apellido@duocuc.cl' : ''}
              className="min-w-[10rem] flex-1 border-0 py-1 text-sm outline-none"
            />
          </div>
        </div>
        {hayInvalidos && (
          <p className="mt-1 text-xs text-red-600">Solo se puede invitar a correos @duocuc.cl.</p>
        )}

        {correos.length > 0 && (
          <div className="mt-3 flex justify-end">
            <Button onClick={enviar} loading={enviando} disabled={hayInvalidos}>
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
          <ul className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm" aria-live="polite">
            {resultados.map((r) => (
              <li key={r.email} className="flex justify-between gap-3">
                <span className="truncate">{r.email}</span>
                <span className={`shrink-0 font-medium ${estadoEstilos[r.estado]}`}>{r.mensaje}</span>
              </li>
            ))}
          </ul>
        )}

        <h3 className="mb-3 mt-6 font-semibold">Personas que tienen acceso</h3>
        {miembrosQuery.isLoading && <p className="text-sm text-gray-500">Cargando...</p>}
        <ul className="space-y-3">
          {miembros.map((miembro) => (
            <li key={miembro.usuarioId} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-duoc-yellow text-xs font-bold">
                {miembro.fotoUrl ? (
                  <img src={miembro.fotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  miembro.nombre.charAt(0).toUpperCase()
                )}
              </div>
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

        <div className="mt-6 flex items-center justify-between gap-3">
          {link ? <CopyLinkButton link={link} /> : <span />}
          <Button onClick={cerrar}>Listo</Button>
        </div>
      </div>
    </div>
  );
}

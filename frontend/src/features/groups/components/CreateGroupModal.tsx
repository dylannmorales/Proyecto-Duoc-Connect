import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCarreras } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import type { CreateGrupoPayload, Grupo } from '@/features/groups/types/group.types';
import { Button, FormAlert, Input, Select } from '@/shared/components/ui/FormControls';
import { EmailChipsInput } from '@/shared/components/ui/EmailChipsInput';
import { sonCorreosValidos } from '@/shared/utils/email';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  /** Recibe los datos del grupo y los correos a invitar (pueden venir vacíos). */
  onSubmit: (payload: CreateGrupoPayload, invitados: string[]) => Promise<void>;
  /** Si se indica, el modal edita este grupo en vez de crear uno nuevo. */
  grupo?: Grupo;
}

const MAX_MIEMBROS_OPCIONES = [5, 10, 15, 20, 30, 50];

export function CreateGroupModal({ open, onClose, onSubmit, grupo }: CreateGroupModalProps) {
  const editando = !!grupo;
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [maxMiembros, setMaxMiembros] = useState('20');
  const [privado, setPrivado] = useState(false);
  const [invitados, setInvitados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !grupo) return;
    setNombre(grupo.nombre);
    setDescripcion(grupo.descripcion ?? '');
    setCarreraId(grupo.carreraId);
    setAsignaturaId(grupo.asignaturaId ?? '');
    setMaxMiembros(String(grupo.maxMiembros));
    setPrivado(grupo.privado);
  }, [open, grupo]);

  const opcionesMaxMiembros = Array.from(
    new Set([...MAX_MIEMBROS_OPCIONES, ...(grupo ? [grupo.maxMiembros] : [])]),
  )
    .sort((a, b) => a - b)
    .filter((n) => !grupo || n >= grupo.miembrosActuales);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!sonCorreosValidos(invitados)) {
      setError('Revisa los correos: solo se puede invitar a correos @duocuc.cl.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        nombre,
        descripcion: descripcion || undefined,
        carreraId,
        asignaturaId: asignaturaId || undefined,
        maxMiembros: Number(maxMiembros),
        privado,
      }, invitados);
      setInvitados([]);
      onClose();
      if (!editando) {
        setNombre('');
        setDescripcion('');
        setCarreraId('');
        setAsignaturaId('');
        setMaxMiembros('20');
        setPrivado(false);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, editando ? 'No se pudo guardar el grupo' : 'No se pudo crear el grupo'));
    } finally {
      setLoading(false);
    }
  }

  function cerrar() {
    setInvitados([]);
    setError('');
    onClose();
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="group-form-title">
      <div className="modal-panel max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="group-form-title" className="text-xl font-bold">
            {editando ? 'Editar grupo de estudio' : 'Crear grupo de estudio'}
          </h2>
          <button type="button" onClick={cerrar} className="icon-btn" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre del grupo" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

          <div className="space-y-1">
            <label htmlFor="descripcion" className="field-label">
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="field-input"
            />
          </div>

          <Select
            label="Carrera"
            name="carreraId"
            value={carreraId}
            onChange={(e) => {
              setCarreraId(e.target.value);
              setAsignaturaId('');
            }}
            options={(carrerasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            required
          />

          <Select
            label="Asignatura (opcional)"
            name="asignaturaId"
            value={asignaturaId}
            onChange={(e) => setAsignaturaId(e.target.value)}
            options={(asignaturasQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
            placeholder="Sin asignatura específica"
          />

          <Select
            label="Máximo de miembros"
            name="maxMiembros"
            value={maxMiembros}
            onChange={(e) => setMaxMiembros(e.target.value)}
            options={opcionesMaxMiembros.map((n) => ({ value: String(n), label: String(n) }))}
            required
          />
          {editando && (
            <p className="-mt-2 text-xs text-gray-500">
              No puede ser menor que los {grupo.miembrosActuales} integrantes actuales.
            </p>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={privado}
              onChange={(e) => setPrivado(e.target.checked)}
              className="checkbox"
            />
            Grupo privado (requiere código de invitación)
          </label>

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-1 text-sm font-semibold text-gray-900">
              {editando ? 'Invitar a más personas' : 'Invitar personas'}
              <span className="font-normal text-gray-500"> (opcional)</span>
            </p>
            <p className="mb-3 text-xs text-gray-500">
              {editando
                ? 'Al guardar, les llegará un correo con el enlace para unirse.'
                : 'Al crear el grupo, les llegará un correo con el enlace para unirse.'}
            </p>
            <EmailChipsInput id="grupo-invitados" value={invitados} onChange={setInvitados} />
          </div>

          {error && <FormAlert message={error} />}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {editando
                ? invitados.length > 0
                  ? 'Guardar e invitar'
                  : 'Guardar cambios'
                : invitados.length > 0
                  ? 'Crear e invitar'
                  : 'Crear grupo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

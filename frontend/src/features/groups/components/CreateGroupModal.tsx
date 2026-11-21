import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getCarreras } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import type { CreateGrupoPayload, Grupo } from '@/features/groups/types/group.types';
import { Input, Select, Textarea } from '@/shared/components/ui/FormControls';
import { ChoiceChips, FormModal, FormSection, SwitchField } from '@/shared/components/ui/FormKit';
import { EmailChipsInput } from '@/shared/components/ui/EmailChipsInput';
import { IconLock, IconUsers } from '@/shared/components/ui/Icons';
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
  const { user } = useAuth();
  const editando = !!grupo;
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [maxMiembros, setMaxMiembros] = useState(20);
  const [privado, setPrivado] = useState(false);
  const [invitados, setInvitados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [intentoEnviar, setIntentoEnviar] = useState(false);

  // Al abrir: si se edita, se cargan los datos del grupo; si se crea, se propone la carrera del usuario.
  useEffect(() => {
    if (!open) return;
    if (grupo) {
      setNombre(grupo.nombre);
      setDescripcion(grupo.descripcion ?? '');
      setCarreraId(grupo.carreraId);
      setAsignaturaId(grupo.asignaturaId ?? '');
      setMaxMiembros(grupo.maxMiembros);
      setPrivado(grupo.privado);
    } else if (!carreraId && user?.carreraId) {
      setCarreraId(user.carreraId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, grupo]);

  const opcionesMaxMiembros = Array.from(new Set([...MAX_MIEMBROS_OPCIONES, ...(grupo ? [grupo.maxMiembros] : [])])).sort(
    (a, b) => a - b,
  );

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  const nombreError = intentoEnviar && !nombre.trim() ? 'Ponle un nombre al grupo' : undefined;
  const carreraError = intentoEnviar && !carreraId ? 'Elige la carrera del grupo' : undefined;

  function limpiar() {
    setNombre('');
    setDescripcion('');
    setCarreraId(user?.carreraId ?? '');
    setAsignaturaId('');
    setMaxMiembros(20);
    setPrivado(false);
    setInvitados([]);
    setError('');
    setIntentoEnviar(false);
  }

  function cerrar() {
    if (!editando) limpiar();
    else {
      setInvitados([]);
      setError('');
      setIntentoEnviar(false);
    }
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIntentoEnviar(true);
    setError('');
    if (!nombre.trim() || !carreraId) return;
    if (!sonCorreosValidos(invitados)) {
      setError('Revisa los correos: solo se puede invitar a correos @duocuc.cl.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(
        {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          carreraId,
          asignaturaId: asignaturaId || undefined,
          maxMiembros,
          privado,
        },
        invitados,
      );
      if (editando) {
        setInvitados([]);
        setIntentoEnviar(false);
      } else {
        limpiar();
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, editando ? 'No se pudo guardar el grupo' : 'No se pudo crear el grupo'));
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = editando
    ? invitados.length > 0
      ? 'Guardar e invitar'
      : 'Guardar cambios'
    : invitados.length > 0
      ? 'Crear e invitar'
      : 'Crear grupo';

  return (
    <FormModal
      open={open}
      title={editando ? 'Editar grupo de estudio' : 'Crear grupo de estudio'}
      subtitle={editando ? 'Los cambios se verán al instante para todos los integrantes.' : 'Reúne a tus compañeros para estudiar y coordinar por chat.'}
      icon={<IconUsers className="h-5 w-5" />}
      onClose={cerrar}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
      submitting={loading}
      error={error}
    >
      <FormSection title="Información básica">
        <Input
          label="Nombre del grupo"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={150}
          placeholder="Ej: Estudio para la prueba de Bases de Datos"
          error={nombreError}
          required
          autoFocus={!editando}
        />
        <Textarea
          label="Descripción"
          id="descripcion"
          name="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          maxLength={500}
          showCount
          placeholder="¿Qué van a estudiar? ¿Cuándo se juntan?"
          hint="Opcional. Ayuda a que otros sepan si el grupo les sirve."
        />
      </FormSection>

      <FormSection title="Carrera y asignatura">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Carrera"
            name="carreraId"
            value={carreraId}
            onChange={(e) => {
              setCarreraId(e.target.value);
              setAsignaturaId('');
            }}
            options={(carrerasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            error={carreraError}
            required
          />
          <Select
            label="Asignatura"
            name="asignaturaId"
            value={asignaturaId}
            onChange={(e) => setAsignaturaId(e.target.value)}
            options={(asignaturasQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
            placeholder={carreraId ? 'Sin asignatura específica' : 'Primero elige una carrera'}
            disabled={!carreraId}
            hint="Opcional"
          />
        </div>
      </FormSection>

      <FormSection title="Integrantes y privacidad">
        <ChoiceChips
          label="Máximo de integrantes"
          value={maxMiembros}
          onChange={setMaxMiembros}
          options={opcionesMaxMiembros.map((n) => ({
            value: n,
            label: String(n),
            disabled: !!grupo && n < grupo.miembrosActuales,
          }))}
          hint={editando ? `No puede ser menor que los ${grupo.miembrosActuales} integrantes actuales.` : undefined}
          required
        />
        <SwitchField
          label="Grupo privado"
          description={
            privado
              ? 'Solo se une quien tenga el enlace o el código de invitación.'
              : 'Cualquier estudiante puede encontrarlo y unirse.'
          }
          checked={privado}
          onChange={setPrivado}
          icon={<IconLock className="h-4 w-4" />}
        />
      </FormSection>

      <FormSection
        title={editando ? 'Invitar a más personas' : 'Invitar personas'}
        description={
          editando
            ? 'Opcional. Al guardar les llegará un correo con el enlace para unirse.'
            : 'Opcional. Al crear el grupo les llegará un correo con el enlace para unirse.'
        }
      >
        <EmailChipsInput id="grupo-invitados" value={invitados} onChange={setInvitados} />
      </FormSection>
    </FormModal>
  );
}

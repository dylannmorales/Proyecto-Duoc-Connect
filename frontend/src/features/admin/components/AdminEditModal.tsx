import { useState, type FormEvent } from 'react';
import type {
  AdminApunte,
  AdminGrupo,
  AdminMensaje,
  AdminPerfilProyecto,
  AdminPregunta,
  AdminRespuesta,
} from '@/features/admin/types/admin.types';
import type { VisibilidadPerfil } from '@/features/companions/types/companion.types';
import { Button, Input, Select } from '@/shared/components/ui/FormControls';

type EditType =
  | 'apunte'
  | 'pregunta'
  | 'respuesta'
  | 'grupo'
  | 'mensaje'
  | 'perfilProyecto';

type EditItem =
  | { type: 'apunte'; data: AdminApunte }
  | { type: 'pregunta'; data: AdminPregunta }
  | { type: 'respuesta'; data: AdminRespuesta }
  | { type: 'grupo'; data: AdminGrupo }
  | { type: 'mensaje'; data: AdminMensaje }
  | { type: 'perfilProyecto'; data: AdminPerfilProyecto };

interface AdminEditModalProps {
  item: EditItem;
  open: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, string | boolean>) => Promise<void>;
}

export function AdminEditModal({ item, open, onClose, onSave }: AdminEditModalProps) {
  const [loading, setLoading] = useState(false);
  const { type, data } = item;

  const [titulo, setTitulo] = useState(
    type === 'apunte'
      ? (data as AdminApunte).titulo
      : type === 'pregunta'
        ? (data as AdminPregunta).titulo
        : '',
  );
  const [nombre, setNombre] = useState(type === 'grupo' ? (data as AdminGrupo).nombre : '');
  const [descripcion, setDescripcion] = useState(
    type === 'apunte' || type === 'grupo'
      ? ((data as AdminApunte | AdminGrupo).descripcion ?? '')
      : '',
  );
  const [contenido, setContenido] = useState(
    type === 'pregunta' || type === 'respuesta' || type === 'mensaje'
      ? (data as AdminPregunta | AdminRespuesta | AdminMensaje).contenido
      : '',
  );
  const [bio, setBio] = useState(
    type === 'perfilProyecto' ? ((data as AdminPerfilProyecto).bio ?? '') : '',
  );
  const [buscandoCompanero, setBuscandoCompanero] = useState(
    type === 'perfilProyecto' ? (data as AdminPerfilProyecto).buscandoCompanero : false,
  );
  const [visibilidad, setVisibilidad] = useState<VisibilidadPerfil>(
    type === 'perfilProyecto' ? (data as AdminPerfilProyecto).visibilidad : 'SOLO_CARRERA',
  );

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (type === 'apunte') {
        await onSave({ titulo, descripcion });
      } else if (type === 'pregunta') {
        await onSave({ titulo, contenido });
      } else if (type === 'respuesta' || type === 'mensaje') {
        await onSave({ contenido });
      } else if (type === 'grupo') {
        await onSave({ nombre, descripcion });
      } else {
        await onSave({ bio, buscandoCompanero, visibilidad });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<EditType, string> = {
    apunte: 'Editar apunte',
    pregunta: 'Editar pregunta',
    respuesta: 'Editar respuesta',
    grupo: 'Editar grupo',
    mensaje: 'Editar mensaje',
    perfilProyecto: 'Editar perfil de compañero',
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{titles[type]}</h2>
          <button type="button" onClick={onClose} className="icon-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(type === 'apunte' || type === 'pregunta') && (
            <Input
              label="Título"
              name="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          )}

          {type === 'grupo' && (
            <Input
              label="Nombre"
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          )}

          {(type === 'apunte' || type === 'grupo') && (
            <div className="space-y-1">
              <label htmlFor="descripcion" className="field-label">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                className="field-input"
              />
            </div>
          )}

          {(type === 'pregunta' || type === 'respuesta' || type === 'mensaje') && (
            <div className="space-y-1">
              <label htmlFor="contenido" className="field-label">
                Contenido
              </label>
              <textarea
                id="contenido"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                rows={6}
                required
                className="field-input"
              />
            </div>
          )}

          {type === 'perfilProyecto' && (
            <>
              <div className="space-y-1">
                <label htmlFor="bio" className="field-label">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="field-input"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={buscandoCompanero}
                  onChange={(e) => setBuscandoCompanero(e.target.checked)}
                  className="checkbox"
                />
                Buscando compañero
              </label>
              <Select
                label="Visibilidad"
                name="visibilidad"
                value={visibilidad}
                onChange={(e) => setVisibilidad(e.target.value as VisibilidadPerfil)}
                options={[
                  { value: 'PUBLICO', label: 'Público' },
                  { value: 'SOLO_CARRERA', label: 'Solo mi carrera' },
                ]}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type { EditItem };

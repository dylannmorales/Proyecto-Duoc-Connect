import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCarreras } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import type { CreateGrupoPayload } from '@/features/groups/types/group.types';
import { Button, Input, Select } from '@/shared/components/ui/FormControls';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateGrupoPayload) => Promise<void>;
}

export function CreateGroupModal({ open, onClose, onSubmit }: CreateGroupModalProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [maxMiembros, setMaxMiembros] = useState('20');
  const [privado, setPrivado] = useState(false);
  const [loading, setLoading] = useState(false);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        nombre,
        descripcion: descripcion || undefined,
        carreraId,
        asignaturaId: asignaturaId || undefined,
        maxMiembros: Number(maxMiembros),
        privado,
      });
      onClose();
      setNombre('');
      setDescripcion('');
      setCarreraId('');
      setAsignaturaId('');
      setMaxMiembros('20');
      setPrivado(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Crear grupo de estudio</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre del grupo" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

          <div className="space-y-1">
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-duoc-yellow focus:ring-2 focus:ring-yellow-100"
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
            options={[5, 10, 15, 20, 30, 50].map((n) => ({ value: String(n), label: String(n) }))}
            required
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={privado}
              onChange={(e) => setPrivado(e.target.checked)}
              className="rounded border-gray-300"
            />
            Grupo privado (requiere código de invitación)
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Crear grupo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

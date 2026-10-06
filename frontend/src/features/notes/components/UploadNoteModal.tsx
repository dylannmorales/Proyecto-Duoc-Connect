import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCarreras } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import type { UploadApuntePayload } from '@/features/notes/types/note.types';
import { Button, Input, Select } from '@/shared/components/ui/FormControls';

interface UploadNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: UploadApuntePayload) => Promise<void>;
}

export function UploadNoteModal({ open, onClose, onSubmit }: UploadNoteModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [file, setFile] = useState<File | null>(null);
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
    if (!file) return;

    setLoading(true);
    try {
      await onSubmit({
        titulo,
        descripcion: descripcion || undefined,
        carreraId,
        asignaturaId,
        file,
      });
      setTitulo('');
      setDescripcion('');
      setCarreraId('');
      setAsignaturaId('');
      setFile(null);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Subir apunte</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            name="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />

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
            label="Asignatura"
            name="asignaturaId"
            value={asignaturaId}
            onChange={(e) => setAsignaturaId(e.target.value)}
            options={(asignaturasQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
            placeholder={carreraId ? 'Seleccionar asignatura...' : 'Primero elige una carrera'}
            disabled={!carreraId || asignaturasQuery.isLoading}
            required
          />
          {carreraId && !asignaturasQuery.isLoading && (asignaturasQuery.data ?? []).length === 0 && (
            <p className="text-sm text-amber-700">
              No hay asignaturas para esta carrera. Reinicia el backend para aplicar la migración de datos.
            </p>
          )}

          <div className="space-y-1">
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">
              Archivo PDF (máx. 10 MB)
            </label>
            <input
              id="file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} disabled={!file}>
              Subir apunte
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

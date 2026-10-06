import { useState } from 'react';
import { Button, Input } from '@/shared/components/ui/FormControls';
import type { Grupo } from '@/features/groups/types/group.types';

interface JoinByCodeModalProps {
  open: boolean;
  onClose: () => void;
  onPreview: (codigo: string) => Promise<Grupo>;
  onJoin: (codigo: string) => Promise<void>;
}

export function JoinByCodeModal({ open, onClose, onPreview, onJoin }: JoinByCodeModalProps) {
  const [codigo, setCodigo] = useState('');
  const [preview, setPreview] = useState<Grupo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handlePreview() {
    setError('');
    setLoading(true);
    try {
      const grupo = await onPreview(codigo.trim().toUpperCase());
      setPreview(grupo);
    } catch {
      setError('Código inválido o grupo no encontrado');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setLoading(true);
    try {
      await onJoin(codigo.trim().toUpperCase());
      setCodigo('');
      setPreview(null);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setCodigo('');
    setPreview(null);
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-xl font-bold">Unirse con código</h2>
        <p className="mb-4 text-sm text-gray-600">
          Ingresa el código de invitación para acceder a grupos públicos o privados.
        </p>

        <Input
          label="Código de invitación"
          name="codigo"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase());
            setPreview(null);
            setError('');
          }}
          placeholder="Ej: ABC123"
          className="mb-4"
          required
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {preview && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="font-semibold">{preview.nombre}</p>
            <p className="text-sm text-gray-600">{preview.carreraNombre}</p>
            <p className="mt-1 text-xs text-gray-500">
              {preview.privado ? 'Grupo privado' : 'Grupo público'} · {preview.miembrosActuales}/
              {preview.maxMiembros} miembros
            </p>
            {preview.esMiembro && (
              <p className="mt-2 text-sm font-medium text-green-700">Ya eres miembro de este grupo</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          {!preview ? (
            <Button type="button" onClick={handlePreview} loading={loading} disabled={!codigo.trim()}>
              Buscar grupo
            </Button>
          ) : preview.esMiembro ? (
            <Button type="button" onClick={handleClose}>
              Cerrar
            </Button>
          ) : (
            <Button type="button" onClick={handleJoin} loading={loading}>
              Unirse al grupo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getCarreras } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import type { UploadApuntePayload } from '@/features/notes/types/note.types';
import { Input, Select, Textarea } from '@/shared/components/ui/FormControls';
import { FileDropzone, FormModal, FormSection } from '@/shared/components/ui/FormKit';
import { IconBook } from '@/shared/components/ui/Icons';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface UploadNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: UploadApuntePayload) => Promise<void>;
}

const MAX_PDF = 10 * 1024 * 1024;

export function UploadNoteModal({ open, onClose, onSubmit }: UploadNoteModalProps) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [intentoEnviar, setIntentoEnviar] = useState(false);

  useEffect(() => {
    if (open && !carreraId && user?.carreraId) setCarreraId(user.carreraId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  const errores = {
    titulo: intentoEnviar && !titulo.trim() ? 'Escribe un título para el apunte' : undefined,
    carrera: intentoEnviar && !carreraId ? 'Elige una carrera' : undefined,
    asignatura: intentoEnviar && !asignaturaId ? 'Elige la asignatura del apunte' : undefined,
    archivo: intentoEnviar && !file ? 'Adjunta el PDF del apunte' : undefined,
  };

  function limpiar() {
    setTitulo('');
    setDescripcion('');
    setCarreraId(user?.carreraId ?? '');
    setAsignaturaId('');
    setFile(null);
    setError('');
    setIntentoEnviar(false);
  }

  function cerrar() {
    limpiar();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIntentoEnviar(true);
    setError('');
    if (!titulo.trim() || !carreraId || !asignaturaId || !file) return;
    setLoading(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        carreraId,
        asignaturaId,
        file,
      });
      cerrar();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo subir el apunte'));
    } finally {
      setLoading(false);
    }
  }

  const sinAsignaturas = !!carreraId && !asignaturasQuery.isLoading && (asignaturasQuery.data ?? []).length === 0;

  return (
    <FormModal
      open={open}
      title="Subir apunte"
      subtitle="Comparte tu material para que otros estudiantes lo descarguen y valoren."
      icon={<IconBook className="h-5 w-5" />}
      onClose={cerrar}
      onSubmit={handleSubmit}
      submitLabel="Subir apunte"
      submitting={loading}
      error={error}
    >
      <FormSection title="Archivo">
        <div>
          <FileDropzone
            label="PDF del apunte"
            file={file}
            onChange={(f) => {
              setFile(f);
              if (f && !titulo.trim()) setTitulo(f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim());
            }}
            accept={['application/pdf', '.pdf']}
            acceptLabel="PDF"
            maxBytes={MAX_PDF}
            required
          />
          {errores.archivo && <p className="mt-1.5 text-sm text-red-600">{errores.archivo}</p>}
        </div>
      </FormSection>

      <FormSection title="Detalles">
        <Input
          label="Título"
          name="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={200}
          placeholder="Ej: Resumen Unidad 2 – Normalización"
          error={errores.titulo}
          required
        />
        <Textarea
          label="Descripción"
          id="descripcion"
          name="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          maxLength={1000}
          showCount
          placeholder="¿Qué contiene? ¿Para qué evaluación sirve?"
          hint="Opcional"
        />
      </FormSection>

      <FormSection title="Clasificación" description="Así otros lo encuentran al filtrar por carrera y asignatura.">
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
            error={errores.carrera}
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
            error={errores.asignatura ?? (sinAsignaturas ? 'Esta carrera aún no tiene asignaturas cargadas' : undefined)}
            required
          />
        </div>
      </FormSection>
    </FormModal>
  );
}

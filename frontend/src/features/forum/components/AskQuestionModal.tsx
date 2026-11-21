import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getCarreras } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import type { CrearPreguntaPayload } from '@/features/forum/types/forum.types';
import { Input, Select, Textarea } from '@/shared/components/ui/FormControls';
import { FileDropzone, FormModal, FormSection, SwitchField } from '@/shared/components/ui/FormKit';
import { IconChat, IconGlobe } from '@/shared/components/ui/Icons';
import { getApiErrorMessage } from '@/shared/utils/errors';

interface AskQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CrearPreguntaPayload) => Promise<void>;
}

const MAX_IMAGEN = 2 * 1024 * 1024;

export function AskQuestionModal({ open, onClose, onSubmit }: AskQuestionModalProps) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [tematicaGeneral, setTematicaGeneral] = useState(false);
  const [imagen, setImagen] = useState<File | null>(null);
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
    enabled: !!carreraId && !tematicaGeneral,
  });

  const errores = {
    titulo:
      intentoEnviar && titulo.trim().length < 5 ? 'Escribe un título de al menos 5 caracteres' : undefined,
    contenido:
      intentoEnviar && contenido.trim().length < 10 ? 'Explica tu duda con al menos 10 caracteres' : undefined,
    carrera: intentoEnviar && !carreraId ? 'Elige una carrera' : undefined,
    asignatura: intentoEnviar && !tematicaGeneral && !asignaturaId ? 'Elige la asignatura o marca "Temática general"' : undefined,
  };

  function limpiar() {
    setTitulo('');
    setContenido('');
    setCarreraId(user?.carreraId ?? '');
    setAsignaturaId('');
    setTematicaGeneral(false);
    setImagen(null);
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
    if (titulo.trim().length < 5 || contenido.trim().length < 10 || !carreraId || (!tematicaGeneral && !asignaturaId)) return;
    setLoading(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        carreraId,
        asignaturaId: tematicaGeneral ? undefined : asignaturaId,
        tematicaGeneral,
        imagen: imagen ?? undefined,
      });
      cerrar();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo publicar la pregunta'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal
      open={open}
      title="Hacer una pregunta"
      subtitle="Mientras más clara sea tu pregunta, más rápido te van a responder."
      icon={<IconChat className="h-5 w-5" />}
      onClose={cerrar}
      onSubmit={handleSubmit}
      submitLabel="Publicar pregunta"
      submitting={loading}
      error={error}
    >
      <FormSection title="Tu pregunta">
        <Input
          label="Título"
          name="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={200}
          placeholder="Ej: ¿Cómo configuro CORS en Spring Boot 3?"
          hint="Resume tu duda en una frase."
          error={errores.titulo}
          required
          autoFocus
        />
        <Textarea
          label="Detalle"
          id="contenido"
          name="contenido"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={6}
          maxLength={5000}
          showCount
          placeholder="Cuenta qué intentaste, qué esperabas y qué error o resultado obtuviste."
          error={errores.contenido}
          required
        />
      </FormSection>

      <FormSection title="Tema">
        <SwitchField
          label="Temática general"
          description="Actívalo si tu duda no es de una asignatura en particular (por ejemplo, práctica o titulación)."
          checked={tematicaGeneral}
          onChange={(v) => {
            setTematicaGeneral(v);
            if (v) setAsignaturaId('');
          }}
          icon={<IconGlobe className="h-4 w-4" />}
        />
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
          {!tematicaGeneral && (
            <Select
              label="Asignatura"
              name="asignaturaId"
              value={asignaturaId}
              onChange={(e) => setAsignaturaId(e.target.value)}
              options={(asignaturasQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
              placeholder={carreraId ? 'Seleccionar asignatura...' : 'Primero elige una carrera'}
              disabled={!carreraId || asignaturasQuery.isLoading}
              error={errores.asignatura}
              required
            />
          )}
        </div>
      </FormSection>

      <FormSection title="Imagen" description="Opcional. Una captura del error o del ejercicio ayuda mucho.">
        <FileDropzone
          label="Adjuntar imagen"
          file={imagen}
          onChange={setImagen}
          accept={['image/jpeg', 'image/png', 'image/webp']}
          acceptLabel="JPG, PNG o WebP"
          maxBytes={MAX_IMAGEN}
          preview="image"
        />
      </FormSection>
    </FormModal>
  );
}

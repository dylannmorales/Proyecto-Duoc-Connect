import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getCarreras,
  getSedes,
  updateProfile,
  uploadProfilePhoto,
} from '@/features/auth/services/authService';
import { Button, FormAlert, Input, Select } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [carreraId, setCarreraId] = useState(user?.carreraId ?? '');
  const [sedeId, setSedeId] = useState(user?.sedeId ?? '');
  const [semestre, setSemestre] = useState(String(user?.semestre ?? 1));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const sedesQuery = useQuery({ queryKey: ['sedes'], queryFn: getSedes });

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre);
    setCarreraId(user.carreraId);
    setSedeId(user.sedeId);
    setSemestre(String(user.semestre));
  }, [user]);

  if (!user) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile({
        nombre,
        carreraId,
        sedeId,
        semestre: Number(semestre),
      });
      await refreshUser();
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el perfil'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      await uploadProfilePhoto(file);
      await refreshUser();
      setSuccess('Foto de perfil actualizada');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo subir la foto'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const semestreOptions = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: `Semestre ${index + 1}`,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Mi perfil</h1>
        <p className="mb-6 text-sm text-gray-600">{user.email}</p>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-duoc-yellow text-xl font-bold">
            {user.fotoUrl ? (
              <img src={user.fotoUrl} alt={user.nombre} className="h-full w-full object-cover" />
            ) : (
              user.nombre.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium">{user.nombre}</p>
            <p className="text-sm text-gray-500">{user.rol}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button
              type="button"
              variant="secondary"
              className="mt-2"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Cambiar foto
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <FormAlert message={error} />}
          {success && <FormAlert message={success} type="success" />}

          <Input
            label="Nombre completo"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <Select
            label="Carrera"
            name="carreraId"
            value={carreraId}
            onChange={(e) => setCarreraId(e.target.value)}
            options={(carrerasQuery.data ?? []).map((carrera) => ({
              value: carrera.id,
              label: carrera.nombre,
            }))}
            required
          />

          <Select
            label="Sede"
            name="sedeId"
            value={sedeId}
            onChange={(e) => setSedeId(e.target.value)}
            options={(sedesQuery.data ?? []).map((sede) => ({
              value: sede.id,
              label: `${sede.nombre} (${sede.ciudad})`,
            }))}
            required
          />

          <Select
            label="Semestre"
            name="semestre"
            value={semestre}
            onChange={(e) => setSemestre(e.target.value)}
            options={semestreOptions}
            required
          />

          <Button type="submit" loading={loading}>
            Guardar cambios
          </Button>
        </form>
      </div>
    </div>
  );
}

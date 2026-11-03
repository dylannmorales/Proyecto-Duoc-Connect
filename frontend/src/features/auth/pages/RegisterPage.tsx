import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getCarreras, getFormSecurityToken, getSedes } from '@/features/auth/services/authService';
import { Button, FormAlert, Input, Select } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [semestre, setSemestre] = useState('1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [securityToken, setSecurityToken] = useState('');

  useEffect(() => {
    getFormSecurityToken().then((data) => setSecurityToken(data.token)).catch(() => {});
  }, []);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const sedesQuery = useQuery({ queryKey: ['sedes'], queryFn: getSedes });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        nombre,
        email,
        password,
        carreraId,
        sedeId,
        semestre: Number(semestre),
        securityToken,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo completar el registro'));
      getFormSecurityToken().then((data) => setSecurityToken(data.token)).catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  const semestreOptions = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: `Semestre ${index + 1}`,
  }));

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Crear cuenta</h1>
      <p className="mb-6 text-sm text-gray-600">Regístrate con tu correo @duocuc.cl</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert message={error} />}

        <Input
          label="Nombre completo"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <Input
          label="Correo institucional"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@duocuc.cl"
          required
        />

        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
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

        <Button type="submit" className="w-full" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-duoc-black hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

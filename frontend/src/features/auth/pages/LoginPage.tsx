import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getFormSecurityToken } from '@/features/auth/services/authService';
import { Button, FormAlert, Input } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [securityToken, setSecurityToken] = useState('');

  useEffect(() => {
    getFormSecurityToken().then((data) => setSecurityToken(data.token)).catch(() => {});
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password, securityToken });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo iniciar sesión'));
      getFormSecurityToken().then((data) => setSecurityToken(data.token)).catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Iniciar sesión</h1>
      <p className="mb-6 text-sm text-gray-600">Accede con tu correo institucional @duocuc.cl</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert message={error} />}

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
          required
        />

        <div className="text-right">
          <Link to="/olvide-contrasena" className="text-sm font-medium text-gray-600 hover:text-duoc-black">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-duoc-black hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}

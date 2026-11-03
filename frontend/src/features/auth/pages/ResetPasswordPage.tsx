import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/features/auth/services/authService';
import { Button, FormAlert, Input } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('El enlace de recuperación no es válido');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo restablecer la contraseña'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Nueva contraseña</h1>
      <p className="mb-6 text-sm text-gray-600">Ingresa tu nueva contraseña.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert message={error} />}
        {message && <FormAlert message={message} type="success" />}

        <Input
          label="Nueva contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <Input
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />

        <Button type="submit" className="w-full" loading={loading}>
          Guardar contraseña
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="font-semibold text-duoc-black hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}

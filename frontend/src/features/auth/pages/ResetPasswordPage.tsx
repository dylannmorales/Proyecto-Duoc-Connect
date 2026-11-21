import { useState, type FormEvent } from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
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
    <AuthCard title="Nueva contraseña" subtitle="Ingresa tu nueva contraseña.">

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

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Guardar contraseña
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="font-semibold text-gray-950 underline decoration-duoc-yellow decoration-2 underline-offset-4 hover:decoration-gray-950">
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthCard>
  );
}

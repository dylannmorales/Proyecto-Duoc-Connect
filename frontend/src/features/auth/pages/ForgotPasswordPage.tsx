import { useState, type FormEvent } from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/features/auth/services/authService';
import { Button, FormAlert, Input } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo procesar la solicitud'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Recuperar contraseña" subtitle="Te enviaremos un enlace para restablecer tu contraseña.">

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormAlert message={error} />}
        {message && <FormAlert message={message} type="success" />}

        <Input
          label="Correo institucional"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Enviar enlace
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

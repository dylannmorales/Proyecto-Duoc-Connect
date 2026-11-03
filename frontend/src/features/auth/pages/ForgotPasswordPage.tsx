import { useState, type FormEvent } from 'react';
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
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Recuperar contraseña</h1>
      <p className="mb-6 text-sm text-gray-600">
        Te enviaremos un enlace para restablecer tu contraseña.
      </p>

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

        <Button type="submit" className="w-full" loading={loading}>
          Enviar enlace
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

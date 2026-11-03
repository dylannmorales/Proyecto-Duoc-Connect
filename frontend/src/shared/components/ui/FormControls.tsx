import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
}

const variants = {
  primary: 'bg-duoc-yellow text-duoc-black hover:bg-yellow-400',
  secondary: 'border border-gray-300 bg-white hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
};

export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-duoc-yellow focus:ring-2 focus:ring-yellow-100 ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder = 'Seleccionar...',
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="space-y-1">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-duoc-yellow focus:ring-2 focus:ring-yellow-100 ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function FormAlert({ message, type = 'error' }: { message: string; type?: 'error' | 'success' }) {
  const styles = type === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-green-200 bg-green-50 text-green-700';

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
}

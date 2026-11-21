import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-duoc-yellow text-duoc-black shadow-sm hover:bg-duoc-yellow-dark active:translate-y-px',
  secondary:
    'border border-gray-300 bg-white text-gray-800 shadow-sm hover:border-gray-400 hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'border border-red-200 bg-white text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50',
  dark: 'bg-duoc-ink text-white shadow-sm hover:bg-black',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'gap-1.5 rounded-lg px-3 py-1.5 text-xs',
  md: 'gap-2 rounded-xl px-4 py-2.5 text-sm',
  lg: 'gap-2 rounded-xl px-6 py-3 text-base',
};

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

function FieldMessage({ error, hint }: { error?: string; hint?: ReactNode }) {
  if (error) {
    return (
      <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    );
  }
  if (hint) return <p className="mt-1.5 text-xs text-gray-500">{hint}</p>;
  return null;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}
        {props.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={`field-input ${error ? 'field-input-error' : ''} ${className}`}
        {...props}
      />
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function Textarea({ label, error, hint, id, className = '', rows = 4, ...props }: TextareaProps) {
  const inputId = id ?? props.name;
  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}
        {props.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={`field-input resize-y ${error ? 'field-input-error' : ''} ${className}`}
        {...props}
      />
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder = 'Seleccionar...',
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div>
      <label htmlFor={selectId} className="field-label">
        {label}
        {props.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={`field-input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%236b7280%22><path fill-rule=%22evenodd%22 d=%22M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z%22 clip-rule=%22evenodd%22/></svg>')] bg-[length:1.25rem] bg-[right_0.6rem_center] bg-no-repeat pr-10 ${error ? 'field-input-error' : ''} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

export function FormAlert({ message, type = 'error' }: { message: string; type?: 'error' | 'success' | 'info' }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-yellow-200 bg-duoc-yellow-soft text-yellow-900',
  }[type];
  const icon = {
    error: 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
    success: 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.86-9.86a.75.75 0 0 0-1.22-.88l-3.24 4.5-1.6-1.6a.75.75 0 1 0-1.06 1.06l2.22 2.22a.75.75 0 0 0 1.14-.09l3.76-5.21Z',
    info: 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.25v3a.75.75 0 0 0 1.5 0V9.75A.75.75 0 0 0 10 9H9Z',
  }[type];

  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d={icon} clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

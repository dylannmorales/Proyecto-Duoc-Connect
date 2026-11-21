import { useEffect, useId, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from 'react';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';

/* ------------------------------------------------------------------ */
/* FormModal: ventana de formulario con encabezado, cuerpo con scroll  */
/* y pie fijo con los botones, para que "Guardar" siempre esté visible. */
/* ------------------------------------------------------------------ */

interface FormModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  error?: string;
  /** Texto pequeño a la izquierda del pie (por ejemplo, "* obligatorio"). */
  footerNote?: ReactNode;
  children: ReactNode;
}

export function FormModal({
  open,
  title,
  subtitle,
  icon,
  onClose,
  onSubmit,
  submitLabel,
  submitting,
  submitDisabled,
  error,
  footerNote = (
    <>
      <span className="text-red-500">*</span> Obligatorio
    </>
  ),
  children,
}: FormModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  return (
    <div className="modal-overlay items-end p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl"
      >
        <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-7 sm:py-5">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-duoc-yellow text-duoc-ink">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold leading-tight sm:text-xl">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="icon-btn -mr-1" aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          {children}
          {error && <FormAlert message={error} />}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-3.5 sm:px-7">
          <p className="hidden text-xs text-gray-500 sm:block">{footerNote}</p>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} disabled={submitDisabled}>
              {submitLabel}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FormSection: agrupa campos con un título corto                      */
/* ------------------------------------------------------------------ */

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SwitchField: interruptor con título y explicación                   */
/* ------------------------------------------------------------------ */

interface SwitchFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
}

export function SwitchField({ label, description, checked, onChange, icon }: SwitchFieldProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
        checked ? 'border-duoc-yellow-dark bg-duoc-yellow-soft/60' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 ring-1 ring-gray-200">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-gray-500">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-gray-900 peer-focus-visible:ring-4 peer-focus-visible:ring-duoc-yellow/40" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* ChoiceChips: opciones cortas en una fila (en vez de un desplegable) */
/* ------------------------------------------------------------------ */

interface ChoiceChipsProps<T extends string | number> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
  hint?: ReactNode;
  required?: boolean;
}

export function ChoiceChips<T extends string | number>({ label, value, options, onChange, hint, required }: ChoiceChipsProps<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id}>
      <p id={id} className="field-label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const activo = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={activo}
              disabled={o.disabled}
              onClick={() => onChange(o.value)}
              className={`min-w-[3rem] rounded-xl border px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                activo
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FileDropzone: arrastrar y soltar o elegir archivo, con validación   */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileDropzoneProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  /** Tipos MIME aceptados, por ejemplo ['application/pdf']. */
  accept: string[];
  /** Extensiones visibles para el usuario, por ejemplo "PDF". */
  acceptLabel: string;
  maxBytes: number;
  required?: boolean;
  preview?: 'image';
}

export function FileDropzone({ label, file, onChange, accept, acceptLabel, maxBytes, required, preview }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState('');

  const previewUrl = useMemo(() => (preview === 'image' && file ? URL.createObjectURL(file) : null), [file, preview]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function elegir(f: File | null | undefined) {
    if (!f) return;
    const tipoOk = accept.includes(f.type) || accept.some((a) => a.startsWith('.') && f.name.toLowerCase().endsWith(a));
    if (!tipoOk) {
      setError(`Solo se aceptan archivos ${acceptLabel}.`);
      return;
    }
    if (f.size > maxBytes) {
      setError(`El archivo pesa ${formatBytes(f.size)}. El máximo es ${formatBytes(maxBytes)}.`);
      return;
    }
    setError('');
    onChange(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastrando(false);
    elegir(e.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <p className="field-label" id={`${id}-label`}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </p>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept.join(',')}
        className="sr-only"
        aria-labelledby={`${id}-label`}
        onChange={(e) => {
          elegir(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-gray-200" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-bold text-red-600 ring-1 ring-red-100">
              PDF
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white"
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Quitar
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition focus:outline-none focus-visible:ring-4 focus-visible:ring-duoc-yellow/40 ${
            arrastrando
              ? 'border-duoc-yellow-dark bg-duoc-yellow-soft'
              : error
                ? 'border-red-300 bg-red-50/40'
                : 'border-gray-300 bg-gray-50/60 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-semibold text-gray-900">
            Arrastra tu archivo aquí o <span className="underline decoration-duoc-yellow decoration-2 underline-offset-2">elígelo</span>
          </p>
          <p className="text-xs text-gray-500">
            {acceptLabel} · máximo {formatBytes(maxBytes)}
          </p>
        </div>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

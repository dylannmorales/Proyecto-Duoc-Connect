import { useState, type KeyboardEvent } from 'react';

import { CORREO_INSTITUCIONAL, sonCorreosValidos } from '@/shared/utils/email';

interface EmailChipsInputProps {
  id: string;
  label?: string;
  value: string[];
  onChange: (correos: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Campo de "Agregar personas" al estilo de Google Drive: cada correo se convierte en una
 * etiqueta al escribir coma, espacio, punto y coma, Enter o al pegar una lista.
 */
export function EmailChipsInput({
  id,
  label = 'Agregar personas',
  value,
  onChange,
  placeholder = 'nombre.apellido@duocuc.cl',
  autoFocus,
}: EmailChipsInputProps) {
  const [borrador, setBorrador] = useState('');
  const hayInvalidos = !sonCorreosValidos(value);

  function agregar(texto: string) {
    const nuevos = texto
      .split(/[\s,;]+/)
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    if (nuevos.length === 0) return;
    onChange(Array.from(new Set([...value, ...nuevos])));
  }

  function confirmarBorrador() {
    agregar(borrador);
    setBorrador('');
  }

  function handleChange(texto: string) {
    const corte = texto.search(/[\s,;][^\s,;]*$/);
    if (corte === -1) {
      setBorrador(texto);
      return;
    }
    agregar(texto.slice(0, corte));
    setBorrador(texto.slice(corte + 1));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (['Enter', ',', ';', ' ', 'Tab'].includes(event.key) && borrador.trim()) {
      event.preventDefault();
      confirmarBorrador();
    } else if (event.key === 'Backspace' && !borrador && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      <div
        className={`rounded-2xl border bg-white px-3 py-2 transition focus-within:ring-4 ${
          hayInvalidos
            ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-100'
            : 'border-gray-300 focus-within:border-duoc-yellow-dark focus-within:ring-duoc-yellow/30'
        }`}
        onClick={() => document.getElementById(id)?.focus()}
      >
        <label htmlFor={id} className="block text-xs font-medium text-gray-500">
          {label}
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {value.map((correo) => {
            const valido = CORREO_INSTITUCIONAL.test(correo);
            return (
              <span
                key={correo}
                className={`inline-flex max-w-full items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-xs ${
                  valido ? 'bg-gray-100 text-gray-800' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase ${
                    valido ? 'bg-duoc-yellow text-duoc-ink' : 'bg-red-200 text-red-800'
                  }`}
                  aria-hidden="true"
                >
                  {correo.charAt(0)}
                </span>
                <span className="truncate">{correo}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((c) => c !== correo));
                  }}
                  aria-label={`Quitar ${correo}`}
                  className="text-gray-400 hover:text-gray-800"
                >
                  ✕
                </button>
              </span>
            );
          })}
          <input
            id={id}
            type="text"
            inputMode="email"
            autoComplete="off"
            autoFocus={autoFocus}
            value={borrador}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={confirmarBorrador}
            placeholder={value.length === 0 ? placeholder : ''}
            className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
      {hayInvalidos ? (
        <p className="mt-1.5 text-xs text-red-600">Solo se puede invitar a correos institucionales @duocuc.cl.</p>
      ) : (
        <p className="mt-1.5 text-xs text-gray-500">Separa varios correos con coma o Enter.</p>
      )}
    </div>
  );
}

interface ResultadoInvitacion {
  email: string;
  estado: 'ENVIADA' | 'YA_ES_MIEMBRO' | 'INVALIDO';
  mensaje: string;
}

const estilos: Record<ResultadoInvitacion['estado'], string> = {
  ENVIADA: 'bg-green-50 text-green-700',
  YA_ES_MIEMBRO: 'bg-gray-100 text-gray-600',
  INVALIDO: 'bg-red-50 text-red-700',
};

export function InvitationResults({ resultados }: { resultados: ResultadoInvitacion[] }) {
  if (resultados.length === 0) return null;
  return (
    <ul className="space-y-1.5 rounded-2xl border border-gray-100 bg-gray-50/70 p-3 text-sm" aria-live="polite">
      {resultados.map((r) => (
        <li key={r.email} className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-gray-700">{r.email}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estilos[r.estado]}`}>{r.mensaje}</span>
        </li>
      ))}
    </ul>
  );
}

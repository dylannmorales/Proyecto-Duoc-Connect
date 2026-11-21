import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

interface Option {
  value: string;
  label: string;
}

interface ComboboxProps {
  id?: string;
  name?: string;
  value?: string;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  searchable?: boolean;
  /** Si es false no se muestra la opción vacía (placeholder) en la lista. */
  allowEmpty?: boolean;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
}

interface Position {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

const MARGEN = 8;
const ALTO_MAXIMO = 320;

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Selector propio que reemplaza al <select> nativo: la lista se dibuja en un portal
 * con posición fija, se abre hacia arriba o abajo según el espacio disponible y nunca
 * se sale de la pantalla. Incluye buscador cuando hay muchas opciones.
 */
export function Combobox({
  id,
  name,
  value = '',
  options,
  placeholder = 'Seleccionar...',
  required,
  disabled,
  invalid,
  className = '',
  searchable,
  allowEmpty = true,
  onChange,
}: ComboboxProps) {
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [activo, setActivo] = useState(0);
  const [pos, setPos] = useState<Position | null>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buscadorRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const conBuscador = searchable ?? options.length > 7;
  const seleccionada = options.find((o) => o.value === value);

  const visibles = useMemo(() => {
    const base = allowEmpty ? [{ value: '', label: placeholder }, ...options] : options;
    if (!filtro.trim()) return base;
    const f = normalizar(filtro.trim());
    return options.filter((o) => normalizar(o.label).includes(f));
  }, [options, filtro, placeholder, allowEmpty]);

  const calcularPosicion = useCallback(() => {
    const boton = botonRef.current;
    if (!boton) return;
    const r = boton.getBoundingClientRect();
    const altoVentana = window.innerHeight;
    const abajo = altoVentana - r.bottom - MARGEN;
    const arriba = r.top - MARGEN;
    const ancho = Math.min(Math.max(r.width, 220), window.innerWidth - MARGEN * 2);
    const left = Math.min(Math.max(r.left, MARGEN), window.innerWidth - ancho - MARGEN);
    if (abajo >= Math.min(ALTO_MAXIMO, 240) || abajo >= arriba) {
      setPos({ left, width: ancho, top: r.bottom + 6, maxHeight: Math.min(ALTO_MAXIMO, abajo - 6) });
    } else {
      setPos({ left, width: ancho, bottom: altoVentana - r.top + 6, maxHeight: Math.min(ALTO_MAXIMO, arriba - 6) });
    }
  }, []);

  useLayoutEffect(() => {
    if (abierto) calcularPosicion();
  }, [abierto, calcularPosicion]);

  useEffect(() => {
    if (!abierto) return;
    const cerrarFuera = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !botonRef.current?.contains(t)) setAbierto(false);
    };
    const reubicar = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      calcularPosicion();
    };
    document.addEventListener('mousedown', cerrarFuera);
    window.addEventListener('resize', calcularPosicion);
    window.addEventListener('scroll', reubicar, true);
    return () => {
      document.removeEventListener('mousedown', cerrarFuera);
      window.removeEventListener('resize', calcularPosicion);
      window.removeEventListener('scroll', reubicar, true);
    };
  }, [abierto, calcularPosicion]);

  const panelMontado = abierto && pos !== null;

  useEffect(() => {
    if (!panelMontado) return;
    if (conBuscador) buscadorRef.current?.focus({ preventScroll: true });
    else listaRef.current?.focus({ preventScroll: true });
  }, [panelMontado, conBuscador]);

  // Mantiene visible la opción activa moviendo solo la lista (scrollIntoView también movería la página).
  useEffect(() => {
    const lista = listaRef.current;
    const item = lista?.querySelector<HTMLElement>(`[data-index="${activo}"]`);
    if (!lista || !item) return;
    if (item.offsetTop < lista.scrollTop) lista.scrollTop = item.offsetTop - 6;
    else if (item.offsetTop + item.offsetHeight > lista.scrollTop + lista.clientHeight)
      lista.scrollTop = item.offsetTop + item.offsetHeight - lista.clientHeight + 6;
  }, [activo, panelMontado]);

  function abrir() {
    if (disabled) return;
    setFiltro('');
    const indice = (allowEmpty ? [{ value: '' }, ...options] : options).findIndex((o) => o.value === value);
    setActivo(Math.max(indice, 0));
    setAbierto(true);
  }

  function elegir(opcion: Option) {
    onChange?.({ target: { value: opcion.value, name } });
    setAbierto(false);
    botonRef.current?.focus({ preventScroll: true });
  }

  function teclas(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, visibles.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opcion = visibles[activo];
      if (opcion) elegir(opcion);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setAbierto(false);
      if (e.key === 'Escape') {
        e.stopPropagation();
        botonRef.current?.focus();
      }
    }
  }

  return (
    <div className="relative">
      <button
        ref={botonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={(e) => {
          if (!abierto && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            abrir();
          }
        }}
        className={`field-input flex items-center justify-between gap-2 pr-3 text-left ${
          invalid ? 'field-input-error' : ''
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <span className={`truncate ${seleccionada ? '' : 'text-gray-400'}`}>
          {seleccionada ? seleccionada.label : placeholder}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${abierto ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Permite que la validación nativa del formulario siga funcionando con "required". */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          value={value}
          required
          onChange={() => undefined}
          onFocus={() => botonRef.current?.focus()}
          className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
        />
      )}

      {abierto &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
            className="fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lift ring-1 ring-black/5"
          >
            {conBuscador && (
              <div className="border-b border-gray-100 p-2">
                <input
                  ref={buscadorRef}
                  value={filtro}
                  onChange={(e) => {
                    setFiltro(e.target.value);
                    setActivo(0);
                  }}
                  onKeyDown={teclas}
                  placeholder="Buscar..."
                  aria-label="Buscar opción"
                  aria-controls={listId}
                  className="w-full rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-duoc-yellow"
                />
              </div>
            )}
            <ul
              ref={listaRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              onKeyDown={teclas}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none"
            >
              {visibles.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">Sin resultados</li>}
              {visibles.map((opcion, i) => {
                const marcada = opcion.value === value;
                return (
                  <li
                    key={opcion.value || '__vacio'}
                    data-index={i}
                    role="option"
                    aria-selected={marcada}
                    onMouseEnter={() => setActivo(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => elegir(opcion)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${
                      i === activo ? 'bg-duoc-yellow-soft' : ''
                    } ${opcion.value === '' ? 'text-gray-500' : 'text-gray-900'} ${marcada ? 'font-semibold' : ''}`}
                  >
                    <span>{opcion.label}</span>
                    {marcada && opcion.value !== '' && (
                      <svg className="h-4 w-4 shrink-0 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}

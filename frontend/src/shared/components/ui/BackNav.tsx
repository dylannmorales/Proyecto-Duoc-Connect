import { Link } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight } from '@/shared/components/ui/Icons';

interface BackNavProps {
  /** Ruta a la que vuelve el botón (la sección padre). */
  to: string;
  /** Nombre de la sección padre, por ejemplo "Grupos de estudio". */
  parentLabel: string;
  /** Nombre de la página actual (opcional): se muestra como miga final. */
  current?: string;
}

/**
 * Barra de navegación superior para páginas de detalle: un botón "Volver" bien visible
 * y la ruta (migas de pan) para que el usuario sepa dónde está y cómo regresar.
 */
export function BackNav({ to, parentLabel, current }: BackNavProps) {
  return (
    <nav aria-label="Ruta de navegación" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-300 bg-white py-2 pl-3 pr-4 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-duoc-yellow/40"
      >
        <IconChevronLeft className="h-4 w-4" />
        Volver
      </Link>
      <ol className="hidden min-w-0 items-center gap-1.5 text-sm text-gray-500 sm:flex">
        <li className="shrink-0">
          <Link to={to} className="hover:text-gray-900 hover:underline">
            {parentLabel}
          </Link>
        </li>
        {current && (
          <>
            <li aria-hidden="true" className="shrink-0 text-gray-300">
              <IconChevronRight className="h-4 w-4" />
            </li>
            <li aria-current="page" className="min-w-0 truncate font-medium text-gray-900">
              {current}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

/** Botón grande para estados vacíos o de error ("no se encontró..."). */
export function BackButton({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-full bg-duoc-yellow px-5 py-2.5 text-sm font-semibold text-duoc-ink shadow-sm transition hover:bg-duoc-yellow-dark"
    >
      <IconChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

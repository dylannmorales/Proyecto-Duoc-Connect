import type { ReactNode } from 'react';
import { IconBook, IconChat, IconPuzzle, IconUsers } from '@/shared/components/ui/Icons';

const highlights = [
  { icon: <IconUsers className="h-5 w-5" />, text: 'Grupos de estudio con chat en tiempo real' },
  { icon: <IconBook className="h-5 w-5" />, text: 'Banco de apuntes valorados por la comunidad' },
  { icon: <IconChat className="h-5 w-5" />, text: 'Foro para resolver dudas entre estudiantes' },
  { icon: <IconPuzzle className="h-5 w-5" />, text: 'Compañeros compatibles para tus proyectos' },
];

interface AuthCardProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

/** Tarjeta dividida para las pantallas de acceso: panel de marca a la izquierda y formulario a la derecha. */
export function AuthCard({ title, subtitle, children, wide = false }: AuthCardProps) {
  return (
    <div className={`mx-auto grid overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-black/5 lg:grid-cols-5 ${wide ? 'max-w-5xl' : 'max-w-4xl'}`}>
      <aside className="relative hidden overflow-hidden bg-duoc-ink p-10 text-white lg:col-span-2 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-duoc-yellow" aria-hidden="true" />
        <div className="relative">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-duoc-yellow text-sm font-extrabold text-duoc-black">
            DC
          </span>
          <p className="mt-8 text-2xl font-bold leading-snug">
            Tu comunidad académica <span className="text-duoc-yellow">Duoc UC</span>, en un solo lugar.
          </p>
        </div>
        <ul className="relative mt-10 space-y-4 text-sm text-gray-300">
          {highlights.map((item) => (
            <li key={item.text} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-duoc-yellow">
                {item.icon}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </aside>

      <div className="p-7 sm:p-10 lg:col-span-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
        <p className="mb-7 mt-1.5 text-sm text-gray-600">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

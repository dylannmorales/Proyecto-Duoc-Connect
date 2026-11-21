import { IconPencil } from '@/shared/components/ui/Icons';
import { Link } from 'react-router-dom';
import type { Grupo } from '@/features/groups/types/group.types';

interface GroupCardProps {
  grupo: Grupo;
  onJoin?: (grupo: Grupo) => void;
  onEdit?: (grupo: Grupo) => void;
}

export function GroupCard({ grupo, onJoin, onEdit }: GroupCardProps) {
  const puedeEditar = grupo.rolEnGrupo === 'ADMIN_GRUPO' && !!onEdit;
  return (
    <article className="flex flex-col card card-hover p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{grupo.nombre}</h3>
          <p className="mt-1 text-sm text-gray-500">{grupo.carreraNombre}</p>
        </div>
        <div className="flex gap-2">
          {grupo.privado && (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              Privado
            </span>
          )}
          {grupo.esMiembro && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              Miembro
            </span>
          )}
        </div>
      </div>

      {grupo.descripcion && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">{grupo.descripcion}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="text-sm text-gray-500">
          {grupo.miembrosActuales}/{grupo.maxMiembros} miembros
          {grupo.asignaturaNombre && ` · ${grupo.asignaturaNombre}`}
        </div>

        <div className="flex shrink-0 gap-2">
          {puedeEditar && (
            <button
              type="button"
              onClick={() => onEdit?.(grupo)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
              aria-label={`Editar ${grupo.nombre}`}
            >
              <IconPencil className="h-4 w-4" />
              Editar
            </button>
          )}
          {grupo.esMiembro ? (
            <Link
              to={`/grupos/${grupo.id}`}
              className="rounded-lg bg-duoc-yellow px-3 py-1.5 text-sm font-semibold text-duoc-black hover:bg-yellow-400"
            >
              Entrar
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onJoin?.(grupo)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
            >
              Unirse
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

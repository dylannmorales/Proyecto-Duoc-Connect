import { useQuery } from '@tanstack/react-query';
import { getGrupoMiembros } from '@/features/groups/services/groupsService';

interface MemberListProps {
  grupoId: string;
}

export function MemberList({ grupoId }: MemberListProps) {
  const miembrosQuery = useQuery({
    queryKey: ['grupo-miembros', grupoId],
    queryFn: () => getGrupoMiembros(grupoId),
  });

  const miembros = miembrosQuery.data ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-4 font-semibold">Integrantes ({miembros.length})</h3>

      {miembrosQuery.isLoading && <p className="text-sm text-gray-500">Cargando...</p>}

      <ul className="space-y-3">
        {miembros.map((miembro) => (
          <li key={miembro.usuarioId} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-duoc-yellow text-xs font-bold">
              {miembro.fotoUrl ? (
                <img src={miembro.fotoUrl} alt={miembro.nombre} className="h-full w-full object-cover" />
              ) : (
                miembro.nombre.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{miembro.nombre}</p>
              <p className="text-xs text-gray-500">
                {miembro.rol === 'ADMIN_GRUPO' ? 'Administrador' : 'Miembro'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

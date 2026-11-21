import type { Grupo } from '@/features/groups/types/group.types';

/** Puede editar un grupo quien lo creó (si sigue siendo integrante) o su administrador actual. */
export function puedeEditarGrupo(grupo: Grupo, usuarioId: string | undefined) {
  if (!usuarioId || !grupo.esMiembro) return false;
  return grupo.rolEnGrupo === 'ADMIN_GRUPO' || grupo.creadorId === usuarioId;
}

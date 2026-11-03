import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { buscarGrupoPorCodigo, joinGrupoPorCodigo } from '@/features/groups/services/groupsService';
import { Button, FormAlert } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

/** Destino del vínculo de invitación que se envía por correo o se copia desde "Compartir". */
export function JoinByLinkPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const grupoQuery = useQuery({
    queryKey: ['grupo-codigo', codigo],
    queryFn: () => buscarGrupoPorCodigo(codigo!),
    enabled: !!codigo,
    retry: false,
  });

  async function handleJoin() {
    setError('');
    setJoining(true);
    try {
      const grupo = await joinGrupoPorCodigo(codigo!);
      await queryClient.invalidateQueries({ queryKey: ['grupos'] });
      navigate(`/grupos/${grupo.id}`, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo unir al grupo'));
    } finally {
      setJoining(false);
    }
  }

  const grupo = grupoQuery.data;
  const lleno = grupo ? grupo.miembrosActuales >= grupo.maxMiembros : false;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
      {grupoQuery.isLoading && <p className="text-gray-500">Buscando la invitación...</p>}

      {grupoQuery.isError && (
        <>
          <FormAlert message={getApiErrorMessage(grupoQuery.error, 'La invitación no es válida')} />
          <Link to="/grupos" className="mt-4 inline-block text-sm font-semibold hover:underline">
            Ir a grupos
          </Link>
        </>
      )}

      {grupo && (
        <>
          <p className="text-sm font-semibold uppercase tracking-wide text-yellow-700">Invitación a grupo de estudio</p>
          <h1 className="mt-2 text-2xl font-bold">{grupo.nombre}</h1>
          <p className="mt-1 text-gray-600">
            {grupo.carreraNombre}
            {grupo.asignaturaNombre && ` · ${grupo.asignaturaNombre}`}
          </p>
          {grupo.descripcion && <p className="mt-3 text-sm text-gray-500">{grupo.descripcion}</p>}
          <p className="mt-3 text-sm text-gray-500">
            {grupo.miembrosActuales} de {grupo.maxMiembros} integrantes · creado por {grupo.creadorNombre}
          </p>

          {error && (
            <div className="mt-4">
              <FormAlert message={error} />
            </div>
          )}

          <div className="mt-6">
            {grupo.esMiembro ? (
              <Button onClick={() => navigate(`/grupos/${grupo.id}`)}>Ya eres miembro · Ir al grupo</Button>
            ) : (
              <Button onClick={handleJoin} loading={joining} disabled={lleno}>
                {lleno ? 'El grupo está lleno' : 'Unirme al grupo'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

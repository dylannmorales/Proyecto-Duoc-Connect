import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  aceptarInvitacion,
  getInvitacionesRecibidas,
  rechazarInvitacion,
} from '@/features/invitations/services/invitationsService';
import type { InvitacionDirecta } from '@/features/invitations/types/invitation.types';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button, FormAlert, Spinner } from '@/shared/components/ui/FormControls';
import { IconUsers } from '@/shared/components/ui/Icons';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/errors';

function fecha(value: string) {
  return new Date(value).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
}

function InvitationCard({ invitacion, onRechazada }: { invitacion: InvitacionDirecta; onRechazada: (nombre: string) => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['invitaciones'] });
    queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
  };

  const aceptar = useMutation({
    mutationFn: () => aceptarInvitacion(invitacion.id),
    onSuccess: (r) => {
      refrescar();
      queryClient.invalidateQueries({ queryKey: ['grupos'] });
      navigate(`/grupos/${r.grupoId}`);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'No se pudo aceptar la invitación')),
  });

  const rechazar = useMutation({
    mutationFn: () => rechazarInvitacion(invitacion.id),
    onSuccess: (r) => {
      refrescar();
      onRechazada(r.grupoNombre);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'No se pudo rechazar la invitación')),
  });

  const ocupado = aceptar.isPending || rechazar.isPending;
  const lleno = invitacion.miembros >= invitacion.maxMiembros;

  return (
    <li className="card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Avatar nombre={invitacion.invitadorNombre} fotoUrl={invitacion.invitadorFotoUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{invitacion.invitadorNombre}</span> te invitó a su grupo ·{' '}
            {fecha(invitacion.createdAt)}
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">{invitacion.grupoNombre}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {invitacion.carreraNombre && <Badge>{invitacion.carreraNombre}</Badge>}
            {invitacion.asignaturaNombre && <Badge tone="blue">{invitacion.asignaturaNombre}</Badge>}
            <Badge tone={lleno ? 'yellow' : 'gray'}>
              {invitacion.miembros} de {invitacion.maxMiembros} integrantes
            </Badge>
          </div>
          {invitacion.grupoDescripcion && (
            <p className="mt-3 text-sm text-gray-700">{invitacion.grupoDescripcion}</p>
          )}
          {invitacion.mensaje && (
            <blockquote className="mt-3 whitespace-pre-wrap rounded-xl bg-yellow-50 px-4 py-3 text-sm text-gray-800">
              “{invitacion.mensaje}”
            </blockquote>
          )}
          {error && (
            <div className="mt-3">
              <FormAlert message={error} />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => aceptar.mutate()} loading={aceptar.isPending} disabled={ocupado || lleno}>
              Aceptar y unirme
            </Button>
            <Button variant="secondary" onClick={() => rechazar.mutate()} loading={rechazar.isPending} disabled={ocupado}>
              Rechazar
            </Button>
            <Link
              to={`/companeros/${invitacion.invitadorId}`}
              className="inline-flex items-center px-2 text-sm font-medium text-gray-600 hover:text-duoc-black hover:underline"
            >
              Ver perfil de {invitacion.invitadorNombre.split(' ')[0]}
            </Link>
          </div>
          {lleno && <p className="mt-2 text-xs text-gray-500">El grupo se llenó; ya no puedes unirte.</p>}
        </div>
      </div>
    </li>
  );
}

/** Invitaciones a grupos que otros estudiantes enviaron desde tu perfil de compañero. */
export function InvitationsPage() {
  const [aviso, setAviso] = useState('');
  const query = useQuery({ queryKey: ['invitaciones'], queryFn: getInvitacionesRecibidas });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitaciones"
        description="Compañeros que vieron tu perfil y te invitaron a su grupo. Tú decides si te unes."
        icon={<IconUsers className="h-6 w-6" />}
      />

      {aviso && <FormAlert type="info" message={aviso} />}

      {query.isLoading && (
        <p className="flex items-center gap-2 text-gray-500">
          <Spinner /> Cargando invitaciones...
        </p>
      )}

      {query.isError && <FormAlert message={getApiErrorMessage(query.error, 'No se pudieron cargar las invitaciones')} />}

      {query.isSuccess && query.data.length === 0 && (
        <div className="card p-8 text-center">
          <p className="font-semibold text-gray-900">No tienes invitaciones pendientes</p>
          <p className="mt-1 text-sm text-gray-500">
            Activa “Buscando compañero” en tu perfil para que otros estudiantes puedan encontrarte e invitarte.
          </p>
          <Link to="/perfil?tab=companero" className="mt-4 inline-block text-sm font-semibold hover:underline">
            Ir a mi perfil de compañero
          </Link>
        </div>
      )}

      {!!query.data?.length && (
        <ul className="space-y-4">
          {query.data.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitacion={inv}
              onRechazada={(nombre) => setAviso(`Rechazaste la invitación a ${nombre}.`)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

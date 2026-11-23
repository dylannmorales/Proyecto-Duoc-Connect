import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { InviteToGroupModal } from '@/features/companions/components/InviteToGroupModal';
import { getCompanionProfile } from '@/features/companions/services/companionsService';
import type { DisponibilidadItem } from '@/features/companions/types/companion.types';
import { DIAS_SEMANA, NIVELES_HABILIDAD } from '@/features/companions/utils/constants';
import { Avatar } from '@/shared/components/ui/Avatar';
import { BackButton, BackNav } from '@/shared/components/ui/BackNav';
import { Badge } from '@/shared/components/ui/Badge';
import { Button, FormAlert, Spinner } from '@/shared/components/ui/FormControls';
import { IconCalendar, IconGraduation, IconMapPin, IconUsers } from '@/shared/components/ui/Icons';
import { getApiErrorMessage } from '@/shared/utils/errors';

const NIVEL_LABEL = Object.fromEntries(NIVELES_HABILIDAD.map((n) => [n.value, n.label])) as Record<string, string>;
const NIVEL_TONE = { BASICO: 'gray', INTERMEDIO: 'blue', AVANZADO: 'green' } as const;

function hora(value: string) {
  return value.slice(0, 5);
}

function agruparPorDia(items: DisponibilidadItem[]) {
  const porDia = new Map<number, DisponibilidadItem[]>();
  [...items]
    .sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio))
    .forEach((d) => porDia.set(d.diaSemana, [...(porDia.get(d.diaSemana) ?? []), d]));
  return [...porDia.entries()];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-base font-bold text-gray-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Vacio({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

/** Perfil de compañero de otro estudiante, abierto desde "Buscar compañeros". */
export function CompanionProfilePage() {
  const { usuarioId } = useParams<{ usuarioId: string }>();
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [aviso, setAviso] = useState('');

  const perfilQuery = useQuery({
    queryKey: ['perfil-companero', usuarioId],
    queryFn: () => getCompanionProfile(usuarioId!),
    enabled: !!usuarioId && usuarioId !== user?.id,
    retry: false,
  });

  // Si el estudiante abre su propia tarjeta, lo llevamos a editar su perfil.
  if (usuarioId && usuarioId === user?.id) {
    return <Navigate to="/perfil?tab=companero" replace />;
  }

  if (perfilQuery.isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-500">
        <Spinner /> Cargando perfil...
      </p>
    );
  }

  if (perfilQuery.isError || !perfilQuery.data) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-semibold">
          {getApiErrorMessage(perfilQuery.error, 'Este perfil de compañero no está disponible')}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Puede que el estudiante ya no esté buscando compañero o que su perfil sea visible solo para su carrera.
        </p>
        <div className="mt-5">
          <BackButton to="/companeros" label="Buscar compañeros" />
        </div>
      </div>
    );
  }

  const perfil = perfilQuery.data;
  const score = perfil.matchScore ?? null;
  const scoreTone = score === null ? 'gray' : score >= 75 ? 'green' : score >= 50 ? 'yellow' : 'gray';
  const horarios = agruparPorDia(perfil.disponibilidades);

  return (
    <div className="space-y-6">
      <BackNav to="/companeros" parentLabel="Buscar compañeros" current={perfil.nombre} />

      <header className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar nombre={perfil.nombre} fotoUrl={perfil.fotoUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-950">{perfil.nombre}</h1>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <li className="flex items-center gap-1.5">
              <IconGraduation className="h-4 w-4 text-gray-400" /> {perfil.carreraNombre}
            </li>
            <li className="flex items-center gap-1.5">
              <IconMapPin className="h-4 w-4 text-gray-400" /> Sede {perfil.sedeNombre}
            </li>
            <li className="flex items-center gap-1.5">
              <IconCalendar className="h-4 w-4 text-gray-400" /> Semestre {perfil.semestre}
            </li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {score !== null && <Badge tone={scoreTone}>{score}% de compatibilidad contigo</Badge>}
            {!!perfil.asignaturasEnComun && (
              <Badge tone="blue">
                {perfil.asignaturasEnComun} asignatura{perfil.asignaturasEnComun !== 1 ? 's' : ''} en común
              </Badge>
            )}
            {perfil.buscandoCompanero && <Badge tone="yellow">Buscando compañero</Badge>}
          </div>
        </div>
        <div className="sm:self-start">
          <Button icon={<IconUsers className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>
            Invitar a mi grupo
          </Button>
        </div>
      </header>

      {aviso && <FormAlert type="success" message={aviso} />}

      <InviteToGroupModal
        open={inviteOpen}
        usuarioId={perfil.usuarioId}
        nombre={perfil.nombre}
        onClose={() => setInviteOpen(false)}
        onSent={(grupoNombre) => {
          setInviteOpen(false);
          setAviso(
            `Invitación enviada a ${perfil.nombre} para unirse a ${grupoNombre}. Te avisaremos cuando responda.`,
          );
        }}
      />

      <Section title="Sobre mí">
        {perfil.bio ? (
          <p className="whitespace-pre-wrap text-gray-700">{perfil.bio}</p>
        ) : (
          <Vacio>Este estudiante aún no escribió una descripción.</Vacio>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Asignaturas que cursa">
          {perfil.asignaturas.length ? (
            <div className="flex flex-wrap gap-1.5">
              {perfil.asignaturas.map((a) => (
                <Badge key={a.id}>{a.nombre}</Badge>
              ))}
            </div>
          ) : (
            <Vacio>No ha indicado asignaturas.</Vacio>
          )}
        </Section>

        <Section title="Habilidades">
          {perfil.habilidades.length ? (
            <div className="flex flex-wrap gap-1.5">
              {perfil.habilidades.map((h) => (
                <Badge key={h.id} tone={NIVEL_TONE[h.nivel]}>
                  {h.nombre} · {NIVEL_LABEL[h.nivel]}
                </Badge>
              ))}
            </div>
          ) : (
            <Vacio>No ha indicado habilidades.</Vacio>
          )}
        </Section>
      </div>

      <Section title="Disponibilidad horaria">
        {horarios.length ? (
          <ul className="divide-y divide-gray-100">
            {horarios.map(([dia, bloques]) => (
              <li key={dia} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-medium text-gray-900">{DIAS_SEMANA[dia] ?? `Día ${dia}`}</span>
                <span className="text-gray-600">
                  {bloques.map((b) => `${hora(b.horaInicio)} – ${hora(b.horaFin)}`).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Vacio>No ha indicado horarios disponibles.</Vacio>
        )}
      </Section>
    </div>
  );
}

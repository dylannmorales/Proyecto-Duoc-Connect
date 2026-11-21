import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { apiClient } from '@/shared/lib/axios';
import type { ApiResponse, Carrera, Sede, StatusResponse } from '@/shared/types/api.types';
import {
  IconActivity,
  IconArrowRight,
  IconBook,
  IconChat,
  IconPuzzle,
  IconShield,
  IconUsers,
} from '@/shared/components/ui/Icons';

async function fetchStatus() {
  const { data } = await apiClient.get<ApiResponse<StatusResponse>>('/status');
  return data.data;
}

async function fetchCarreras() {
  const { data } = await apiClient.get<ApiResponse<Carrera[]>>('/catalogos/carreras');
  return data.data;
}

async function fetchSedes() {
  const { data } = await apiClient.get<ApiResponse<Sede[]>>('/catalogos/sedes');
  return data.data;
}

const features: Array<{ title: string; description: string; to: string; icon: ReactNode }> = [
  {
    title: 'Grupos de estudio',
    description: 'Crea o únete a grupos y coordina con chat en tiempo real.',
    to: '/grupos',
    icon: <IconUsers className="h-6 w-6" />,
  },
  {
    title: 'Banco de apuntes',
    description: 'Comparte, descarga y valora material académico en PDF.',
    to: '/apuntes',
    icon: <IconBook className="h-6 w-6" />,
  },
  {
    title: 'Foro académico',
    description: 'Pregunta, responde y vota para destacar las mejores soluciones.',
    to: '/foro',
    icon: <IconChat className="h-6 w-6" />,
  },
  {
    title: 'Buscar compañeros',
    description: 'Encuentra compañeros compatibles por asignaturas, horarios y habilidades.',
    to: '/companeros',
    icon: <IconPuzzle className="h-6 w-6" />,
  },
];

export function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const nombre = user?.nombre.split(' ')[0];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-duoc-ink px-6 py-12 text-white shadow-lift sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-duoc-yellow/90 blur-0"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 right-24 h-64 w-64 rounded-full border-[28px] border-duoc-yellow/25"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-duoc-yellow ring-1 ring-white/15">
            Plataforma académica Duoc UC
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {isAuthenticated && nombre ? (
              <>
                Hola, {nombre}.<br />
                <span className="text-duoc-yellow">¿Qué estudiamos hoy?</span>
              </>
            ) : (
              <>
                Colabora, aprende y <span className="text-duoc-yellow">conecta</span> en un solo lugar
              </>
            )}
          </h1>
          <p className="mt-5 text-lg text-gray-300">
            Grupos de estudio con chat en tiempo real, banco de apuntes, foro y búsqueda de compañeros
            para tus proyectos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/grupos"
                  className="inline-flex items-center gap-2 rounded-xl bg-duoc-yellow px-6 py-3 font-semibold text-duoc-black shadow-sm hover:bg-duoc-yellow-dark"
                >
                  Ir a mis grupos <IconArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/perfil"
                  className="rounded-xl px-6 py-3 font-semibold text-white ring-1 ring-white/25 hover:bg-white/10"
                >
                  Ver mi perfil
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/registro"
                  className="inline-flex items-center gap-2 rounded-xl bg-duoc-yellow px-6 py-3 font-semibold text-duoc-black shadow-sm hover:bg-duoc-yellow-dark"
                >
                  Crear cuenta gratis <IconArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl px-6 py-3 font-semibold text-white ring-1 ring-white/25 hover:bg-white/10"
                >
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title">
        <h2 id="features-title" className="mb-4 text-lg font-bold tracking-tight">
          Todo lo que necesitas para estudiar en equipo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.to} className="card card-hover group flex flex-col p-6">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-duoc-yellow-soft text-yellow-800 transition group-hover:bg-duoc-yellow group-hover:text-duoc-black">
                {feature.icon}
              </span>
              <h3 className="font-semibold text-gray-950">{feature.title}</h3>
              <p className="mt-1 flex-1 text-sm text-gray-600">{feature.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                Abrir <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {isAdmin && <SystemStatus />}
    </div>
  );
}

/** Solo visible para administradores. */
function SystemStatus() {
  const statusQuery = useQuery({ queryKey: ['status'], queryFn: fetchStatus });
  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: fetchCarreras });
  const sedesQuery = useQuery({ queryKey: ['sedes'], queryFn: fetchSedes });
  const apiConnected = statusQuery.isSuccess && statusQuery.data?.status === 'UP';

  return (
    <section className="card p-6" aria-labelledby="status-title">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
            <IconActivity />
          </span>
          <div>
            <h2 id="status-title" className="font-semibold">Estado del sistema</h2>
            <p className="text-xs text-gray-500">Visible solo para administradores</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          <IconShield className="h-3.5 w-3.5" /> Admin
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          label="API Backend"
          value={apiConnected ? 'Conectada' : statusQuery.isLoading ? 'Verificando...' : 'Sin conexión'}
          ok={apiConnected}
        />
        <StatusCard label="Versión" value={statusQuery.data?.version ?? '—'} ok={apiConnected} />
        <StatusCard
          label="Carreras cargadas"
          value={carrerasQuery.data?.length?.toString() ?? '—'}
          ok={(carrerasQuery.data?.length ?? 0) > 0}
        />
        <StatusCard
          label="Sedes cargadas"
          value={sedesQuery.data?.length?.toString() ?? '—'}
          ok={(sedesQuery.data?.length ?? 0) > 0}
        />
      </div>
    </section>
  );
}

function StatusCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-inset ring-gray-100">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 flex items-center gap-2 font-semibold">
        <span className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-400'}`} />
        {value}
      </p>
    </div>
  );
}

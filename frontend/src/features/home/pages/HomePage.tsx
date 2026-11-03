import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';
import type { ApiResponse, Carrera, Sede, StatusResponse } from '@/shared/types/api.types';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

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

const features = [
  {
    title: 'Grupos de estudio',
    description: 'Crea o únete a grupos para coordinar con tus compañeros.',
    to: '/grupos',
  },
  {
    title: 'Banco de apuntes',
    description: 'Comparte y descarga material académico en PDF.',
    to: '/apuntes',
  },
];

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const statusQuery = useQuery({ queryKey: ['status'], queryFn: fetchStatus });
  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: fetchCarreras });
  const sedesQuery = useQuery({ queryKey: ['sedes'], queryFn: fetchSedes });

  const apiConnected = statusQuery.isSuccess && statusQuery.data?.status === 'UP';

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-white p-8 shadow-sm md:p-12">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-yellow-700">
            Plataforma académica Duoc UC
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Colabora, aprende y conecta en un solo lugar
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            Duoc Connect centraliza tus grupos de estudio con chat en tiempo real y el banco de apuntes.
          </p>
          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link
                to="/perfil"
                className="rounded-lg bg-duoc-yellow px-6 py-3 font-semibold text-duoc-black hover:bg-yellow-400"
              >
                Ir a mi perfil
              </Link>
            ) : (
              <>
                <Link
                  to="/registro"
                  className="rounded-lg bg-duoc-yellow px-6 py-3 font-semibold text-duoc-black hover:bg-yellow-400"
                >
                  Comenzar ahora
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border border-gray-300 px-6 py-3 font-semibold hover:bg-gray-50"
                >
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.to}
            className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-duoc-yellow hover:shadow-md"
          >
            <h2 className="mb-2 font-semibold">{feature.title}</h2>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Estado del sistema</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            label="API Backend"
            value={apiConnected ? 'Conectada' : statusQuery.isLoading ? 'Verificando...' : 'Sin conexión'}
            ok={apiConnected}
          />
          <StatusCard
            label="Versión"
            value={statusQuery.data?.version ?? '—'}
            ok={apiConnected}
          />
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
    </div>
  );
}

function StatusCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 flex items-center gap-2 font-medium">
        <span className={`h-2 w-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-400'}`} />
        {value}
      </p>
    </div>
  );
}

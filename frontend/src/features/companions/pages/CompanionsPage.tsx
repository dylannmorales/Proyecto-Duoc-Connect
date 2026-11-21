import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCarreras, getHabilidades } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CompanionCard } from '@/features/companions/components/CompanionCard';
import {
  getProjectProfile,
  getRecommendations,
  searchCompanions,
} from '@/features/companions/services/companionsService';
import { Button, FormAlert, Select, Spinner } from '@/shared/components/ui/FormControls';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { IconPuzzle } from '@/shared/components/ui/Icons';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function CompanionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [habilidadId, setHabilidadId] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  const perfilQuery = useQuery({
    queryKey: ['perfil-proyecto'],
    queryFn: getProjectProfile,
    enabled: isAuthenticated && !authLoading,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 1;
    },
  });

  const recomendacionesQuery = useQuery({
    queryKey: ['companeros-recomendaciones'],
    queryFn: () => getRecommendations(10),
    enabled: isAuthenticated && !authLoading && perfilQuery.isSuccess,
  });

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const habilidadesQuery = useQuery({ queryKey: ['habilidades'], queryFn: getHabilidades });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  const [searchResults, setSearchResults] = useState<typeof recomendacionesQuery.data>(undefined);

  async function handleSearch() {
    setSearching(true);
    setError('');
    try {
      const results = await searchCompanions({
        asignaturaId: asignaturaId || undefined,
        habilidadId: habilidadId || undefined,
        limit: 20,
      });
      setSearchResults(results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  const companeros = searchResults ?? recomendacionesQuery.data ?? [];
  const perfil = perfilQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Comunidad"
        title="Buscar compañeros"
        description="Encuentra estudiantes compatibles para tus proyectos según carrera, asignaturas, horarios y habilidades."
        icon={<IconPuzzle className="h-6 w-6" />}
        actions={
          <Link
            to="/perfil?tab=companero"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-gray-50"
          >
            Editar mi perfil de compañero
          </Link>
        }
      />

      {error && <FormAlert message={error} />}

      {perfilQuery.isError && (
        <FormAlert
          message={getApiErrorMessage(
            perfilQuery.error,
            'No se pudo cargar tu perfil de compañero. Intenta iniciar sesión de nuevo.',
          )}
        />
      )}

      {perfil && !perfil.buscandoCompanero && (
        <div className="flex flex-col gap-4 rounded-2xl border border-yellow-200 bg-duoc-yellow-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-yellow-950">Aún no apareces en las búsquedas</p>
            <p className="text-sm text-yellow-900">
              Activa «Estoy buscando compañero» en tu perfil para que otros estudiantes te encuentren.
            </p>
          </div>
          <Link
            to="/perfil?tab=companero"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-duoc-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            Completar perfil
          </Link>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {searchResults ? 'Resultados de búsqueda' : 'Recomendaciones para ti'}
            </h2>
            <p className="text-sm text-gray-500">
              Ordenados por compatibilidad (carrera, asignaturas, horarios y habilidades)
            </p>
          </div>
        </div>

        <div className="filter-bar grid gap-4 md:grid-cols-3">
          <Select
            label="Filtrar por carrera (asignaturas)"
            name="carreraFiltro"
            value={carreraId}
            onChange={(e) => {
              setCarreraId(e.target.value);
              setAsignaturaId('');
            }}
            options={(carrerasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            placeholder="Todas"
          />
          <Select
            label="Asignatura"
            name="asignaturaFiltro"
            value={asignaturaId}
            onChange={(e) => setAsignaturaId(e.target.value)}
            options={(asignaturasQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
            placeholder="Cualquiera"
            disabled={!carreraId}
          />
          <Select
            label="Habilidad"
            name="habilidadFiltro"
            value={habilidadId}
            onChange={(e) => setHabilidadId(e.target.value)}
            options={(habilidadesQuery.data ?? []).map((h) => ({ value: h.id, label: h.nombre }))}
            placeholder="Cualquiera"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} loading={searching}>
            Buscar compañeros
          </Button>
          {searchResults && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchResults(undefined);
                setAsignaturaId('');
                setHabilidadId('');
                setCarreraId('');
              }}
            >
              Ver recomendaciones
            </Button>
          )}
        </div>

        {recomendacionesQuery.isLoading && !searchResults && (
          <p className="flex items-center gap-2 text-gray-500"><Spinner /> Calculando compatibilidad...</p>
        )}

        {companeros.length === 0 && !recomendacionesQuery.isLoading && (
          <div className="empty-state">
            <p className="text-gray-600">
              No hay compañeros disponibles con esos criterios. Prueba ampliando los filtros.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companeros.map((companero) => (
            <CompanionCard key={companero.usuarioId} companero={companero} />
          ))}
        </div>
      </section>
    </div>
  );
}

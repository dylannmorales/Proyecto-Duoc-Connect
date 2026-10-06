import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCarreras, getHabilidades } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CompanionCard } from '@/features/companions/components/CompanionCard';
import { ProjectProfileForm } from '@/features/companions/components/ProjectProfileForm';
import {
  getProjectProfile,
  getRecommendations,
  searchCompanions,
  updateProjectProfile,
} from '@/features/companions/services/companionsService';
import type { UpdatePerfilProyectoPayload } from '@/features/companions/types/companion.types';
import { Button, FormAlert, Select } from '@/shared/components/ui/FormControls';
import { getApiErrorMessage } from '@/shared/utils/errors';

export function CompanionsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [carreraId, setCarreraId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [habilidadId, setHabilidadId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  async function handleSaveProfile(payload: UpdatePerfilProyectoPayload) {
    setError('');
    setSuccess('');
    try {
      await updateProjectProfile(payload);
      await queryClient.invalidateQueries({ queryKey: ['perfil-proyecto'] });
      await queryClient.invalidateQueries({ queryKey: ['companeros-recomendaciones'] });
      setSearchResults(undefined);
      setSuccess('Perfil actualizado. Las recomendaciones se han recalculado.');
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    }
  }

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
      <div>
        <h1 className="text-2xl font-bold">Buscar compañeros</h1>
        <p className="text-gray-600">
          Encuentra estudiantes compatibles para tus proyectos académicos
        </p>
      </div>

      {error && <FormAlert message={error} />}
      {success && <FormAlert message={success} type="success" />}

      {perfilQuery.isError && (
        <FormAlert
          message={getApiErrorMessage(
            perfilQuery.error,
            'No se pudo cargar tu perfil de compañero. Intenta iniciar sesión de nuevo.',
          )}
        />
      )}

      {perfilQuery.isLoading && <p className="text-gray-500">Cargando perfil...</p>}

      {perfil && <ProjectProfileForm perfil={perfil} onSave={handleSaveProfile} />}

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {searchResults ? 'Resultados de búsqueda' : 'Recomendaciones para ti'}
            </h2>
            <p className="text-sm text-gray-500">
              Ordenados por compatibilidad (carrera, asignaturas, horarios y habilidades)
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
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
          <p className="text-gray-500">Calculando compatibilidad...</p>
        )}

        {!perfil?.buscandoCompanero && (
          <div className="rounded-xl border border-dashed border-yellow-300 bg-yellow-50 p-6 text-center text-sm text-yellow-800">
            Activa &quot;Estoy buscando compañero&quot; en tu perfil para aparecer en las búsquedas de
            otros estudiantes.
          </div>
        )}

        {companeros.length === 0 && !recomendacionesQuery.isLoading && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-600">
              No hay compañeros disponibles con esos criterios. Prueba ampliando los filtros.
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {companeros.map((companero) => (
            <CompanionCard key={companero.usuarioId} companero={companero} />
          ))}
        </div>
      </section>
    </div>
  );
}

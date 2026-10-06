import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getCarreras, getHabilidades } from '@/features/auth/services/authService';
import { getAsignaturas } from '@/features/groups/services/groupsService';
import type {
  DisponibilidadItem,
  NivelHabilidad,
  PerfilProyecto,
  UpdatePerfilProyectoPayload,
  VisibilidadPerfil,
} from '@/features/companions/types/companion.types';
import { DIAS_SEMANA, HORARIO_PRESETS, NIVELES_HABILIDAD } from '@/features/companions/utils/constants';
import { Button, Input, Select } from '@/shared/components/ui/FormControls';

interface ProjectProfileFormProps {
  perfil: PerfilProyecto;
  onSave: (payload: UpdatePerfilProyectoPayload) => Promise<void>;
}

export function ProjectProfileForm({ perfil, onSave }: ProjectProfileFormProps) {
  const [bio, setBio] = useState(perfil.bio ?? '');
  const [buscando, setBuscando] = useState(perfil.buscandoCompanero);
  const [visibilidad, setVisibilidad] = useState<VisibilidadPerfil>(perfil.visibilidad);
  const [carreraId, setCarreraId] = useState('');
  const [selectedAsignaturas, setSelectedAsignaturas] = useState<string[]>(
    perfil.asignaturas.map((a) => a.id),
  );
  const [selectedSkills, setSelectedSkills] = useState<
    Array<{ habilidadId: string; nivel: NivelHabilidad }>
  >(perfil.habilidades.map((h) => ({ habilidadId: h.id, nivel: h.nivel })));
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadItem[]>(
    perfil.disponibilidades,
  );
  const [loading, setLoading] = useState(false);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const habilidadesQuery = useQuery({ queryKey: ['habilidades'], queryFn: getHabilidades });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  function toggleAsignatura(id: string) {
    setSelectedAsignaturas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addDisponibilidad(preset?: (typeof HORARIO_PRESETS)[number]) {
    setDisponibilidades((prev) => [
      ...prev,
      preset
        ? { diaSemana: 0, horaInicio: preset.horaInicio, horaFin: preset.horaFin }
        : { diaSemana: 0, horaInicio: '09:00', horaFin: '12:00' },
    ]);
  }

  function updateDisponibilidad(index: number, field: keyof DisponibilidadItem, value: string | number) {
    setDisponibilidades((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  }

  function removeDisponibilidad(index: number) {
    setDisponibilidades((prev) => prev.filter((_, i) => i !== index));
  }

  function addSkill(habilidadId: string) {
    if (selectedSkills.some((s) => s.habilidadId === habilidadId)) return;
    setSelectedSkills((prev) => [...prev, { habilidadId, nivel: 'BASICO' }]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await onSave({
        bio: bio || undefined,
        buscandoCompanero: buscando,
        visibilidad,
        asignaturaIds: selectedAsignaturas,
        habilidades: selectedSkills,
        disponibilidades,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Mi perfil de proyecto</h2>
        <p className="text-sm text-gray-500">
          Configura tu disponibilidad y habilidades para encontrar compañeros compatibles
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={buscando}
          onChange={(e) => setBuscando(e.target.checked)}
          className="rounded border-gray-300"
        />
        Estoy buscando compañero para proyectos
      </label>

      <div className="space-y-1">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Cuéntanos qué tipo de proyecto buscas..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-duoc-yellow focus:ring-2 focus:ring-yellow-100"
        />
      </div>

      <Select
        label="Visibilidad"
        name="visibilidad"
        value={visibilidad}
        onChange={(e) => setVisibilidad(e.target.value as VisibilidadPerfil)}
        options={[
          { value: 'SOLO_CARRERA', label: 'Solo mi carrera' },
          { value: 'PUBLICO', label: 'Público (todas las carreras)' },
        ]}
      />

      <div className="space-y-2">
        <Select
          label="Carrera para elegir asignaturas"
          name="carreraFilter"
          value={carreraId}
          onChange={(e) => setCarreraId(e.target.value)}
          options={(carrerasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
          placeholder="Seleccionar carrera..."
        />
        {carreraId && (
          <div className="flex flex-wrap gap-2">
            {(asignaturasQuery.data ?? []).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAsignatura(a.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedAsignaturas.includes(a.id)
                    ? 'bg-duoc-yellow text-duoc-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {a.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Habilidades</p>
        <div className="flex flex-wrap gap-2">
          {(habilidadesQuery.data ?? [])
            .filter((h) => !selectedSkills.some((s) => s.habilidadId === h.id))
            .map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => addSkill(h.id)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
              >
                + {h.nombre}
              </button>
            ))}
        </div>
        {selectedSkills.map((skill, index) => {
          const habilidad = habilidadesQuery.data?.find((h) => h.id === skill.habilidadId);
          return (
            <div key={skill.habilidadId} className="flex items-center gap-2">
              <span className="text-sm font-medium">{habilidad?.nombre}</span>
              <select
                value={skill.nivel}
                onChange={(e) =>
                  setSelectedSkills((prev) =>
                    prev.map((s, i) =>
                      i === index ? { ...s, nivel: e.target.value as NivelHabilidad } : s,
                    ),
                  )
                }
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                {NIVELES_HABILIDAD.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setSelectedSkills((prev) => prev.filter((s) => s.habilidadId !== skill.habilidadId))
                }
                className="text-xs text-red-500"
              >
                Quitar
              </button>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-700">Horarios disponibles</p>
          <div className="flex flex-wrap gap-2">
            {HORARIO_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => addDisponibilidad(preset)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
              >
                + {preset.label}
              </button>
            ))}
            <Button type="button" variant="secondary" className="!py-1.5 !text-xs" onClick={() => addDisponibilidad()}>
              + Horario personalizado
            </Button>
          </div>
        </div>
        {disponibilidades.length === 0 && (
          <p className="text-xs text-gray-500">Agrega al menos un bloque horario para mejorar las recomendaciones.</p>
        )}
        {disponibilidades.map((d, index) => (
          <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Día</label>
              <select
                value={d.diaSemana}
                onChange={(e) => updateDisponibilidad(index, 'diaSemana', Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                {DIAS_SEMANA.map((dia, i) => (
                  <option key={dia} value={i}>
                    {dia}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Desde"
              name={`inicio-${index}`}
              type="time"
              value={d.horaInicio}
              onChange={(e) => updateDisponibilidad(index, 'horaInicio', e.target.value)}
              className="!w-auto"
            />
            <Input
              label="Hasta"
              name={`fin-${index}`}
              type="time"
              value={d.horaFin}
              onChange={(e) => updateDisponibilidad(index, 'horaFin', e.target.value)}
              className="!w-auto"
            />
            <button
              type="button"
              onClick={() => removeDisponibilidad(index)}
              className="mb-2 text-sm text-red-500 hover:text-red-700"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <Button type="submit" loading={loading}>
        Guardar perfil de proyecto
      </Button>
    </form>
  );
}

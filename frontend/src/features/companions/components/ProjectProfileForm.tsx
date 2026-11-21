import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
import { Button, Select, Textarea } from '@/shared/components/ui/FormControls';

interface ProjectProfileFormProps {
  perfil: PerfilProyecto;
  onSave: (payload: UpdatePerfilProyectoPayload) => Promise<void>;
  /** Sin tarjeta ni título propio, para incrustarlo en otra página. */
  embedded?: boolean;
}

const BIO_MAX = 500;

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-gray-100 pt-6 first:border-t-0 first:pt-0 md:grid-cols-3 md:gap-8">
      <div>
        <h3 className="font-semibold text-gray-950">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="space-y-4 md:col-span-2">{children}</div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
        active
          ? 'bg-duoc-yellow text-duoc-black ring-yellow-400'
          : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export function ProjectProfileForm({ perfil, onSave, embedded = false }: ProjectProfileFormProps) {
  const { user } = useAuth();
  const [bio, setBio] = useState(perfil.bio ?? '');
  const [buscando, setBuscando] = useState(perfil.buscandoCompanero);
  const [visibilidad, setVisibilidad] = useState<VisibilidadPerfil>(perfil.visibilidad);
  const [carreraId, setCarreraId] = useState(user?.carreraId ?? '');
  const [selectedAsignaturas, setSelectedAsignaturas] = useState<string[]>(perfil.asignaturas.map((a) => a.id));
  const [selectedSkills, setSelectedSkills] = useState<Array<{ habilidadId: string; nivel: NivelHabilidad }>>(
    perfil.habilidades.map((h) => ({ habilidadId: h.id, nivel: h.nivel })),
  );
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadItem[]>(perfil.disponibilidades);
  const [loading, setLoading] = useState(false);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const habilidadesQuery = useQuery({ queryKey: ['habilidades'], queryFn: getHabilidades });
  const asignaturasQuery = useQuery({
    queryKey: ['asignaturas', carreraId],
    queryFn: () => getAsignaturas(carreraId),
    enabled: !!carreraId,
  });

  const asignaturaNombres = useMemo(() => {
    const map = new Map<string, string>();
    perfil.asignaturas.forEach((a) => map.set(a.id, a.nombre));
    (asignaturasQuery.data ?? []).forEach((a) => map.set(a.id, a.nombre));
    return map;
  }, [perfil.asignaturas, asignaturasQuery.data]);

  function toggleAsignatura(id: string) {
    setSelectedAsignaturas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    setDisponibilidades((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  function addSkill(habilidadId: string) {
    if (selectedSkills.some((s) => s.habilidadId === habilidadId)) return;
    setSelectedSkills((prev) => [...prev, { habilidadId, nivel: 'BASICO' }]);
  }

  async function handleSubmit(event: FormEvent) {
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
    <form onSubmit={handleSubmit} className={embedded ? 'space-y-6' : 'card space-y-6 p-6 sm:p-8'}>
      {!embedded && (
        <div>
          <h2 className="text-lg font-bold">Mi perfil de compañero</h2>
          <p className="text-sm text-gray-500">
            Tu disponibilidad, asignaturas y habilidades se usan para recomendarte compañeros compatibles.
          </p>
        </div>
      )}

      <Section title="Disponibilidad para proyectos" description="Decide si apareces en las búsquedas y quién te puede ver.">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300">
          <span>
            <span className="block text-sm font-semibold text-gray-900">Estoy buscando compañero</span>
            <span className="block text-xs text-gray-500">Otros estudiantes podrán encontrarte y verte en sus recomendaciones.</span>
          </span>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={buscando}
              onChange={(e) => setBuscando(e.target.checked)}
            />
            <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-green-500 peer-focus-visible:ring-4 peer-focus-visible:ring-duoc-yellow/40" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
        </label>

        <div>
          <p className="field-label">Visibilidad del perfil</p>
          <div className="inline-flex rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Visibilidad del perfil">
            {(
              [
                { value: 'SOLO_CARRERA', label: 'Solo mi carrera' },
                { value: 'PUBLICO', label: 'Todas las carreras' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={visibilidad === opt.value}
                onClick={() => setVisibilidad(opt.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  visibilidad === opt.value ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Sobre ti" description="Una presentación breve ayuda a que te contacten.">
        <Textarea
          label="Bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
          rows={4}
          placeholder="Ej.: Me interesa el desarrollo web y busco equipo para el proyecto de Arquitectura de Software."
          hint={`${bio.length}/${BIO_MAX} caracteres`}
        />
      </Section>

      <Section title="Asignaturas" description="Marca las asignaturas en las que buscas trabajar en equipo.">
        {selectedAsignaturas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedAsignaturas.map((id) => (
              <Chip key={id} active onClick={() => toggleAsignatura(id)} title="Quitar">
                {asignaturaNombres.get(id) ?? 'Asignatura'} ✕
              </Chip>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aún no eliges asignaturas.</p>
        )}
        <Select
          label="Buscar asignaturas por carrera"
          name="carreraFilter"
          value={carreraId}
          onChange={(e) => setCarreraId(e.target.value)}
          options={(carrerasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
          placeholder="Seleccionar carrera..."
        />
        {carreraId && (
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
            {asignaturasQuery.isLoading && <p className="text-sm text-gray-500">Cargando asignaturas...</p>}
            {(asignaturasQuery.data ?? []).map((a) => (
              <Chip key={a.id} active={selectedAsignaturas.includes(a.id)} onClick={() => toggleAsignatura(a.id)}>
                {a.nombre}
              </Chip>
            ))}
          </div>
        )}
      </Section>

      <Section title="Habilidades" description="Agrega tus habilidades e indica tu nivel en cada una.">
        {selectedSkills.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
            {selectedSkills.map((skill, index) => {
              const habilidad = habilidadesQuery.data?.find((h) => h.id === skill.habilidadId);
              return (
                <li key={skill.habilidadId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{habilidad?.nombre ?? '...'}</span>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg bg-gray-100 p-0.5" role="radiogroup" aria-label={`Nivel de ${habilidad?.nombre ?? 'habilidad'}`}>
                      {NIVELES_HABILIDAD.map((n) => (
                        <button
                          key={n.value}
                          type="button"
                          role="radio"
                          aria-checked={skill.nivel === n.value}
                          onClick={() =>
                            setSelectedSkills((prev) =>
                              prev.map((s, i) => (i === index ? { ...s, nivel: n.value as NivelHabilidad } : s)),
                            )
                          }
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                            skill.nivel === n.value ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="icon-btn h-8 w-8"
                      aria-label={`Quitar ${habilidad?.nombre ?? 'habilidad'}`}
                      onClick={() => setSelectedSkills((prev) => prev.filter((s) => s.habilidadId !== skill.habilidadId))}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Agregar habilidad</p>
          <div className="flex flex-wrap gap-2">
            {(habilidadesQuery.data ?? [])
              .filter((h) => !selectedSkills.some((s) => s.habilidadId === h.id))
              .map((h) => (
                <Chip key={h.id} onClick={() => addSkill(h.id)}>
                  + {h.nombre}
                </Chip>
              ))}
          </div>
        </div>
      </Section>

      <Section title="Horarios disponibles" description="Los bloques en común mejoran la compatibilidad.">
        <div className="flex flex-wrap gap-2">
          {HORARIO_PRESETS.map((preset) => (
            <Chip key={preset.label} onClick={() => addDisponibilidad(preset)}>
              + {preset.label}
            </Chip>
          ))}
          <Chip onClick={() => addDisponibilidad()}>+ Personalizado</Chip>
        </div>
        {disponibilidades.length === 0 && (
          <p className="rounded-xl bg-duoc-yellow-soft px-4 py-3 text-sm text-yellow-900">
            Agrega al menos un bloque horario para mejorar tus recomendaciones.
          </p>
        )}
        <ul className="space-y-2">
          {disponibilidades.map((d, index) => (
            <li key={index} className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
              <div className="min-w-[9rem] flex-1">
                <label className="field-label text-xs" htmlFor={`dia-${index}`}>Día</label>
                <select
                  id={`dia-${index}`}
                  value={d.diaSemana}
                  onChange={(e) => updateDisponibilidad(index, 'diaSemana', Number(e.target.value))}
                  className="field-input"
                >
                  {DIAS_SEMANA.map((dia, i) => (
                    <option key={dia} value={i}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label text-xs" htmlFor={`inicio-${index}`}>Desde</label>
                <input
                  id={`inicio-${index}`}
                  type="time"
                  value={d.horaInicio}
                  onChange={(e) => updateDisponibilidad(index, 'horaInicio', e.target.value)}
                  className="field-input w-32"
                />
              </div>
              <div>
                <label className="field-label text-xs" htmlFor={`fin-${index}`}>Hasta</label>
                <input
                  id={`fin-${index}`}
                  type="time"
                  value={d.horaFin}
                  onChange={(e) => updateDisponibilidad(index, 'horaFin', e.target.value)}
                  className="field-input w-32"
                />
              </div>
              <Button type="button" variant="ghost" size="sm" className="mb-1.5 text-red-600 hover:bg-red-50" onClick={() => setDisponibilidades((prev) => prev.filter((_, i) => i !== index))}>
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      </Section>

      <div className="flex justify-end border-t border-gray-100 pt-6">
        <Button type="submit" size="lg" loading={loading}>
          Guardar perfil de compañero
        </Button>
      </div>
    </form>
  );
}

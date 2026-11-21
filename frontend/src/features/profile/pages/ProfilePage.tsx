import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getCarreras, getSedes, updateProfile, uploadProfilePhoto } from '@/features/auth/services/authService';
import { ProjectProfileForm } from '@/features/companions/components/ProjectProfileForm';
import { getProjectProfile, updateProjectProfile } from '@/features/companions/services/companionsService';
import type { PerfilProyecto, UpdatePerfilProyectoPayload } from '@/features/companions/types/companion.types';
import { DIAS_SEMANA } from '@/features/companions/utils/constants';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { Button, FormAlert, Input, Select, Spinner } from '@/shared/components/ui/FormControls';
import {
  IconArrowRight,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconGraduation,
  IconMail,
  IconMapPin,
  IconPuzzle,
  IconShield,
  IconUser,
} from '@/shared/components/ui/Icons';
import { getApiErrorMessage } from '@/shared/utils/errors';

type Tab = 'datos' | 'companero';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'companero' ? 'companero' : 'datos';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [carreraId, setCarreraId] = useState(user?.carreraId ?? '');
  const [sedeId, setSedeId] = useState(user?.sedeId ?? '');
  const [semestre, setSemestre] = useState(String(user?.semestre ?? 1));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const carrerasQuery = useQuery({ queryKey: ['carreras'], queryFn: getCarreras });
  const sedesQuery = useQuery({ queryKey: ['sedes'], queryFn: getSedes });
  const perfilQuery = useQuery({ queryKey: ['perfil-proyecto'], queryFn: getProjectProfile, enabled: !!user });

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre);
    setCarreraId(user.carreraId);
    setSedeId(user.sedeId);
    setSemestre(String(user.semestre));
  }, [user]);

  if (!user) return null;

  function changeTab(next: Tab) {
    setError('');
    setSuccess('');
    setSearchParams(next === 'datos' ? {} : { tab: next }, { replace: true });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateProfile({ nombre, carreraId, sedeId, semestre: Number(semestre) });
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['perfil-proyecto'] });
      setSuccess('Tus datos se guardaron correctamente.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el perfil'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProyecto(payload: UpdatePerfilProyectoPayload) {
    setError('');
    setSuccess('');
    try {
      await updateProjectProfile(payload);
      await queryClient.invalidateQueries({ queryKey: ['perfil-proyecto'] });
      await queryClient.invalidateQueries({ queryKey: ['companeros-recomendaciones'] });
      setSuccess('Perfil de compañero guardado. Tus recomendaciones se recalcularon.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el perfil de compañero'));
      throw err;
    }
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      await uploadProfilePhoto(file);
      await refreshUser();
      setSuccess('Foto de perfil actualizada.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo subir la foto'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const semestreOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Semestre ${i + 1}` }));
  const perfil = perfilQuery.data;
  const checklist = buildChecklist(!!user.fotoUrl, perfil);
  const completed = checklist.filter((c) => c.done).length;
  const percent = Math.round((completed / checklist.length) * 100);
  const isAdmin = user.rol === 'ADMINISTRADOR';
  const memberSince = new Date(user.createdAt).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <section className="card overflow-hidden">
        <div className="relative h-32 overflow-hidden bg-duoc-ink sm:h-40">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-duoc-yellow" aria-hidden="true" />
          <div className="absolute bottom-[-60px] right-48 h-40 w-40 rounded-full border-[22px] border-duoc-yellow/30" aria-hidden="true" />
          <div className="absolute left-8 top-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Duoc Connect</div>
        </div>
        <div className="px-6 pb-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="relative -mt-14 w-fit shrink-0 sm:-mt-16">
                <Avatar nombre={user.nombre} fotoUrl={user.fotoUrl} size="xl" className="ring-4 ring-white shadow-lift" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-duoc-ink text-white shadow-lg ring-2 ring-white transition hover:bg-black disabled:opacity-70"
                  aria-label="Cambiar foto de perfil"
                  title="Cambiar foto (JPG, PNG o WebP, máx. 2 MB)"
                >
                  {uploading ? <Spinner /> : <IconCamera className="h-4 w-4" />}
                </button>
              </div>
              <div className="pt-1 sm:pt-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{user.nombre}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                  <IconMail className="h-4 w-4" /> {user.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {isAdmin ? (
                    <Badge tone="dark" icon={<IconShield className="h-3.5 w-3.5" />}>Administrador</Badge>
                  ) : (
                    <Badge tone="yellow" icon={<IconUser className="h-3.5 w-3.5" />}>Estudiante</Badge>
                  )}
                  <Badge icon={<IconGraduation className="h-3.5 w-3.5" />}>{user.carreraNombre}</Badge>
                  <Badge icon={<IconMapPin className="h-3.5 w-3.5" />}>{user.sedeNombre}</Badge>
                  <Badge icon={<IconCalendar className="h-3.5 w-3.5" />}>Semestre {user.semestre}</Badge>
                  {perfil?.buscandoCompanero && <Badge tone="green">Buscando compañero</Badge>}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 sm:pb-2">Miembro desde {memberSince}</p>
          </div>
        </div>

        <nav className="flex gap-1 border-t border-gray-100 px-4 sm:px-6" aria-label="Secciones del perfil" role="tablist">
          <TabButton active={tab === 'datos'} onClick={() => changeTab('datos')} icon={<IconUser className="h-4 w-4" />}>
            Datos personales
          </TabButton>
          <TabButton active={tab === 'companero'} onClick={() => changeTab('companero')} icon={<IconPuzzle className="h-4 w-4" />}>
            Perfil de compañero
          </TabButton>
        </nav>
      </section>

      {error && <FormAlert message={error} />}
      {success && <FormAlert message={success} type="success" />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tab === 'datos' ? (
            <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8">
              <div>
                <h2 className="text-lg font-bold">Datos personales</h2>
                <p className="text-sm text-gray-500">Esta información aparece en tus grupos, apuntes y respuestas del foro.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Nombre completo" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Correo institucional"
                    name="email"
                    value={user.email}
                    disabled
                    hint="El correo institucional no se puede cambiar."
                  />
                </div>
                <div className="sm:col-span-2">
                  <Select
                    label="Carrera"
                    name="carreraId"
                    value={carreraId}
                    onChange={(e) => setCarreraId(e.target.value)}
                    options={(carrerasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
                    required
                  />
                </div>
                <Select
                  label="Sede"
                  name="sedeId"
                  value={sedeId}
                  onChange={(e) => setSedeId(e.target.value)}
                  options={(sedesQuery.data ?? []).map((s) => ({ value: s.id, label: `${s.nombre} (${s.ciudad})` }))}
                  required
                />
                <Select
                  label="Semestre"
                  name="semestre"
                  value={semestre}
                  onChange={(e) => setSemestre(e.target.value)}
                  options={semestreOptions}
                  required
                />
              </div>
              <div className="flex justify-end border-t border-gray-100 pt-6">
                <Button type="submit" size="lg" loading={loading}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          ) : perfilQuery.isLoading ? (
            <div className="card flex items-center gap-3 p-8 text-gray-500">
              <Spinner /> Cargando tu perfil de compañero...
            </div>
          ) : perfil ? (
            <div className="card p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold">Perfil de compañero</h2>
                <p className="text-sm text-gray-500">
                  Con esto te recomendamos estudiantes compatibles en{' '}
                  <Link to="/companeros" className="font-semibold text-gray-900 underline decoration-duoc-yellow decoration-2 underline-offset-4">
                    Compañeros
                  </Link>
                  .
                </p>
              </div>
              <ProjectProfileForm key={perfil.usuarioId} perfil={perfil} onSave={handleSaveProyecto} embedded />
            </div>
          ) : (
            <FormAlert message={getApiErrorMessage(perfilQuery.error, 'No se pudo cargar tu perfil de compañero.')} />
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Completa tu perfil</h2>
              <span className="text-sm font-semibold text-gray-900">{percent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-duoc-yellow transition-all" style={{ width: `${percent}%` }} />
            </div>
            <ul className="mt-5 space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      item.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 ring-1 ring-inset ring-gray-200'
                    }`}
                  >
                    {item.done && <IconCheck className="h-3.5 w-3.5" />}
                  </span>
                  <span className={item.done ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-800'}>{item.label}</span>
                </li>
              ))}
            </ul>
            {percent < 100 && (
              <Button
                variant="secondary"
                className="mt-5 w-full"
                onClick={() => (item0(checklist) === 'foto' ? fileInputRef.current?.click() : changeTab('companero'))}
              >
                Continuar <IconArrowRight className="h-4 w-4" />
              </Button>
            )}
          </section>

          {perfil && (
            <section className="card p-6">
              <h2 className="font-bold">Resumen de compañero</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <SummaryRow label="Asignaturas">
                  {perfil.asignaturas.length ? perfil.asignaturas.map((a) => a.nombre).join(', ') : 'Sin asignaturas'}
                </SummaryRow>
                <SummaryRow label="Habilidades">
                  {perfil.habilidades.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {perfil.habilidades.map((h) => (
                        <Badge key={h.id}>{h.nombre}</Badge>
                      ))}
                    </span>
                  ) : (
                    'Sin habilidades'
                  )}
                </SummaryRow>
                <SummaryRow label="Horarios">
                  {perfil.disponibilidades.length
                    ? perfil.disponibilidades
                        .map((d) => `${DIAS_SEMANA[d.diaSemana]} ${d.horaInicio.slice(0, 5)}–${d.horaFin.slice(0, 5)}`)
                        .join(' · ')
                    : 'Sin horarios'}
                </SummaryRow>
              </dl>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function item0(list: Array<{ key: string; done: boolean }>) {
  return list.find((c) => !c.done)?.key;
}

function buildChecklist(hasPhoto: boolean, perfil?: PerfilProyecto) {
  return [
    { key: 'foto', label: 'Sube una foto de perfil', done: hasPhoto },
    { key: 'bio', label: 'Escribe una bio', done: !!perfil?.bio },
    { key: 'asig', label: 'Elige tus asignaturas', done: (perfil?.asignaturas.length ?? 0) > 0 },
    { key: 'hab', label: 'Agrega tus habilidades', done: (perfil?.habilidades.length ?? 0) > 0 },
    { key: 'hor', label: 'Indica tus horarios', done: (perfil?.disponibilidades.length ?? 0) > 0 },
  ];
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-semibold transition ${
        active ? 'border-duoc-yellow text-gray-950' : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-800">{children}</dd>
    </div>
  );
}

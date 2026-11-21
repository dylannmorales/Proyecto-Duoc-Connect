export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const HORARIO_PRESETS = [
  { label: 'Mañana', horaInicio: '08:00', horaFin: '12:00' },
  { label: 'Tarde', horaInicio: '14:00', horaFin: '18:00' },
  { label: 'Noche', horaInicio: '18:00', horaFin: '22:00' },
  { label: 'Día completo', horaInicio: '09:00', horaFin: '18:00' },
] as const;

export const NIVELES_HABILIDAD = [
  { value: 'BASICO', label: 'Básico' },
  { value: 'INTERMEDIO', label: 'Intermedio' },
  { value: 'AVANZADO', label: 'Avanzado' },
] as const;

export function matchScoreColor(score: number) {
  if (score >= 75) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-700';
}

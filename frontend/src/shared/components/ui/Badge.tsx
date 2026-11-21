import type { ReactNode } from 'react';

type Tone = 'gray' | 'yellow' | 'green' | 'red' | 'blue' | 'dark';

const tones: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  yellow: 'bg-duoc-yellow-soft text-yellow-900 ring-yellow-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  dark: 'bg-duoc-ink text-white ring-black',
};

export function Badge({ children, tone = 'gray', icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

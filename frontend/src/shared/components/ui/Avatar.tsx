interface AvatarProps {
  nombre: string;
  fotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-28 w-28 text-4xl',
};

export function initials(nombre: string) {
  const parts = nombre.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ nombre, fotoUrl, size = 'md', className = '' }: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-duoc-yellow font-bold text-duoc-black ${sizes[size]} ${className}`}
    >
      {fotoUrl ? <img src={fotoUrl} alt={nombre} className="h-full w-full object-cover" /> : initials(nombre)}
    </span>
  );
}

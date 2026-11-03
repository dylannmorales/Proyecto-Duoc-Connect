interface VoteButtonProps {
  votos: number;
  votado: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}

export function VoteButton({ votos, votado, disabled, title, onClick }: VoteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={votado}
      aria-label={votado ? 'Quitar voto' : 'Votar'}
      className={`flex w-12 shrink-0 flex-col items-center rounded-lg border py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        votado
          ? 'border-duoc-yellow bg-yellow-50 text-yellow-800'
          : 'border-gray-200 bg-white text-gray-600 hover:border-duoc-yellow'
      }`}
    >
      <span aria-hidden="true">▲</span>
      <span>{votos}</span>
    </button>
  );
}

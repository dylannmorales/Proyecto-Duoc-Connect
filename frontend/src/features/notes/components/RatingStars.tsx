interface RatingStarsProps {
  value: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export function RatingStars({ value, onRate, readonly = false, size = 'md' }: RatingStarsProps) {
  const starSize = size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          className={`${starSize} transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${
            star <= Math.round(value) ? 'text-yellow-500' : 'text-gray-300'
          }`}
          aria-label={`${star} estrellas`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-gray-500">
          {value.toFixed(1)}
          {!readonly && value > 0 ? '' : ''}
        </span>
      )}
    </div>
  );
}

interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function RatingStars({ rating, onChange, size = 'sm' }: Props) {
  const interactive = !!onChange;

  return (
    <div className={`rating-stars rating-stars-${size} ${interactive ? 'interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
          onClick={interactive ? () => onChange!(star === rating ? 0 : star) : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}

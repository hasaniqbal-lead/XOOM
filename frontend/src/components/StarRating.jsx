import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'md' }) => {
  const { t } = useTranslation();

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRatingChange && onRatingChange(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer active:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizes[size]} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;

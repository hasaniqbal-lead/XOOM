import { useState } from 'react';
import { X } from 'lucide-react';
import StarRating from './StarRating';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';

const ReviewModal = ({ isOpen, onClose, ride, reviewee, onSuccess }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/reviews', {
        ride_id: ride.id,
        reviewee_id: reviewee.id,
        rating,
        review_text: reviewText,
      });

      toast.success(t('review_submitted') || 'Review submitted!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const isDriver = reviewee.role === 'driver';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-slideUp safe-area-bottom">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {isDriver ? t('rate_driver') : t('rate_rider')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
            {reviewee.name?.charAt(0) || 'U'}
          </div>
          <h3 className="text-lg font-semibold">{reviewee.name}</h3>
          <p className="text-sm text-gray-500">{reviewee.phone}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              {t('rating')}
            </label>
            <div className="flex justify-center">
              <StarRating rating={rating} onRatingChange={setRating} size="lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('leave_review')}
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder={t('share_experience') || 'Share your experience...'}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-xl transition disabled:opacity-50 active:scale-95"
          >
            {submitting ? t('submitting') || 'Submitting...' : t('submit') || 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;

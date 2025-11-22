import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, Star, Award, LogOut, Phone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader';
import BottomNav from '../components/BottomNav';
import StarRating from '../components/StarRating';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Profile = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        api.get('/reviews/me'),
        api.get('/reviews/stats/me'),
      ]);

      setReviews(reviewsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentLang = i18n.language;

  return (
    <div className="mobile-page bg-gray-50">
      <MobileHeader title={t('profile') || 'Profile'} />

      <div className="p-4 space-y-4 pb-20">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <div className="flex items-center space-x-2 mt-1 text-primary-100">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{user?.phone}</span>
              </div>
              <div className="flex items-center space-x-2 mt-1 text-primary-100">
                <Calendar className="w-4 h-4" />
                <span className="text-sm capitalize">{t(user?.role) || user?.role}</span>
              </div>
            </div>
          </div>

          {/* Rating Summary */}
          {stats && stats.average_rating > 0 && (
            <div className="mt-6 bg-white bg-opacity-10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                  <span className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</span>
                </div>
                <div className="text-sm text-primary-100">
                  {stats.total_ratings} {t('reviews')}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats[`${['one', 'two', 'three', 'four', 'five'][star - 1]}_star`] || 0;
                  const percentage = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0;

                  return (
                    <div key={star} className="flex items-center space-x-2">
                      <span className="text-sm w-8">{star}★</span>
                      <div className="flex-1 bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-yellow-300 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 px-2">
              {t('recent_reviews') || 'Recent Reviews'}
            </h3>
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                      {review.reviewer_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{review.reviewer_name}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(review.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} readonly size="sm" />
                </div>
                {review.review_text && (
                  <p className="text-sm text-gray-600 mt-2" dir={currentLang === 'ur' ? 'rtl' : 'ltr'}>
                    {review.review_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Award className="w-16 h-16 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">{t('no_reviews_yet') || 'No reviews yet'}</p>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg active:scale-98 transition"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

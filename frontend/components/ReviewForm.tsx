'use client';

import { useState } from 'react';
import { useLanguage } from '../lib/languageContext';
import { useAuth } from '../lib/authContext';

interface ReviewFormProps {
  productId: string;
  onSubmit: (review: { rating: number; comment: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSubmit, onCancel, isLoading = false }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!comment.trim()) {
      setError(t('comment_required'));
      return;
    }

    if (rating < 1 || rating > 5) {
      setError(t('rating_required'));
      return;
    }

    onSubmit({ rating, comment: comment.trim() });
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">{t('login_to_review')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('rating')}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition-colors ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {rating === 1 && t('rating_1')}
          {rating === 2 && t('rating_2')}
          {rating === 3 && t('rating_3')}
          {rating === 4 && t('rating_4')}
          {rating === 5 && t('rating_5')}
        </p>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          {t('comment')}
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder={t('write_review_placeholder')}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('submitting') : t('submit_review')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm; 
'use client';

import { useState } from 'react';
import { Review } from '../lib/types';
import { useLanguage } from '../lib/languageContext';
import { useAuth } from '../lib/authContext';

interface ReviewListProps {
  reviews: Review[];
  onEdit: (reviewId: string, review: { rating: number; comment: string }) => void;
  onDelete: (reviewId: string) => void;
  isLoading?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, onEdit, onDelete, isLoading = false }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const handleEdit = (review: Review) => {
    setEditingReview(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleSaveEdit = () => {
    if (editingReview) {
      onEdit(editingReview, { rating: editRating, comment: editComment });
      setEditingReview(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditRating(5);
    setEditComment('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('no_reviews_yet')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
          {editingReview === review.id ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rating')}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className={`text-2xl transition-colors ${
                        star <= editRating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('comment')}
                </label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {t('save')}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{review.userName}</span>
                  <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                </div>
                {user && user.id === review.userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => onDelete(review.id)}
                      disabled={isLoading}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {t('delete')}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-500">({review.rating}/5)</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewList; 
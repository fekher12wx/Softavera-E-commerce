'use client';

import { useState, useEffect } from 'react';
import { Review } from '../lib/types';
import { useLanguage } from '../lib/languageContext';
import { useAuth } from '../lib/authContext';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

interface ReviewsSectionProps {
  productId: string;
  canReview?: boolean;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId, canReview }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (!user) {
      setShowForm(false);
    }
  }, [user]);

  const handleSubmitReview = async (reviewData: { rating: number; comment: string }) => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews(prev => [newReview, ...prev]);
        setShowForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('error_submitting_review'));
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(t('error_submitting_review'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditReview = async (reviewId: string, reviewData: { rating: number; comment: string }) => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        const updatedReview = await response.json();
        setReviews(prev => prev.map(review => 
          review.id === reviewId ? updatedReview : review
        ));
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('error_updating_review'));
      }
    } catch (error) {
      console.error('Error updating review:', error);
      setError(t('error_updating_review'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t('confirm_delete_review'))) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setReviews(prev => prev.filter(review => review.id !== reviewId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('error_deleting_review'));
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      setError(t('error_deleting_review'));
    } finally {
      setIsLoading(false);
    }
  };

  const userHasReviewed = user ? reviews.some(review => review.userId === user.id) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{t('reviews')} ({reviews.length})</h3>
        {canReview && user && !userHasReviewed && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            {t('write_review')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <ReviewForm
            productId={productId}
            onSubmit={handleSubmitReview}
            onCancel={() => setShowForm(false)}
            isLoading={isLoading}
          />
        </div>
      )}

      <ReviewList
        reviews={reviews}
        onEdit={handleEditReview}
        onDelete={handleDeleteReview}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ReviewsSection; 
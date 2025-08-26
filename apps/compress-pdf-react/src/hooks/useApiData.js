import { useState, useEffect } from 'react';
import apiService from '../services/apiService.js';

// Custom hook for managing API data
export const useApiData = () => {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch all data from API
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats and reviews in parallel
      const [statsData, reviewsData] = await Promise.all([
        apiService.getCompressPdfStats(),
        apiService.getCompressPdfReviews(),
      ]);

      setStats(statsData);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Failed to fetch API data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit a review
  const submitReview = async (rating) => {
    try {
      setError(null);
      const result = await apiService.submitReview(rating, 'compress-pdf');
      
      // Refresh reviews data after submission
      await fetchAllData();
      
      return result;
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.message);
      throw err;
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchAllData();
  };

  return {
    stats,
    reviews,
    loading,
    error,
    submitReview,
    refreshData,
  };
};

import React from 'react';
import { FiTrendingUp, FiStar, FiUsers } from 'react-icons/fi';
import './StatsDisplay.css';

const StatsDisplay = ({ stats, reviews, loading, error }) => {
  if (loading) {
    return (
      <div className="stats-container">
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Loading stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="stats-error">
          <p>Error loading stats: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!stats || !reviews) {
    return (
      <div className="stats-container">
        <p>No stats available</p>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-grid">
        {/* Compressed PDFs Count */}
        <div className="stat-card">
          <div className="stat-icon">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>Total Compressed</h3>
            <div className="stat-number">{stats.total_compressed?.toLocaleString() || '0'}</div>
            <p className="stat-label">PDF files processed</p>
          </div>
        </div>

        {/* Reviews Count */}
        <div className="stat-card">
          <div className="stat-icon">
            <FiStar />
          </div>
          <div className="stat-content">
            <h3>Total Reviews</h3>
            <div className="stat-number">{reviews.reviewCount || '0'}</div>
            <p className="stat-label">User ratings received</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="stat-card">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>Average Rating</h3>
            <div className="stat-number">
              {reviews.ratingValue ? `${reviews.ratingValue}/5` : 'N/A'}
            </div>
            <p className="stat-label">Out of 5 stars</p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {stats.updated_at && (
        <div className="stats-footer">
          <p>Last updated: {new Date(stats.updated_at).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
};

export default StatsDisplay;

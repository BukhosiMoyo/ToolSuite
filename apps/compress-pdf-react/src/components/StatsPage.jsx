import React from 'react';
import { FiTrendingUp, FiStar, FiUsers, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import './StatsPage.css';

const StatsPage = ({ stats, reviews, loading, error, onBack, onRefresh }) => {
  if (loading) {
    return (
      <div className="stats-page">
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Loading stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-page">
        <div className="stats-error">
          <p>Error loading stats: {error}</p>
          <button onClick={onRefresh}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      {/* Header */}
      <div className="stats-header">
        <button onClick={onBack} className="back-button">
          <FiArrowLeft /> Back to Tool
        </button>
        <h1>📊 Compress PDF Statistics</h1>
        <button onClick={onRefresh} className="refresh-button">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Total Compressed PDFs */}
        <div className="stat-card primary">
          <div className="stat-icon">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>Total Compressed</h3>
            <div className="stat-number">
              {stats?.total_compressed?.toLocaleString() || '0'}
            </div>
            <p className="stat-label">PDF files processed</p>
          </div>
        </div>

        {/* Total Reviews */}
        <div className="stat-card secondary">
          <div className="stat-icon">
            <FiStar />
          </div>
          <div className="stat-content">
            <h3>Total Reviews</h3>
            <div className="stat-number">
              {reviews?.reviewCount || '0'}
            </div>
            <p className="stat-label">User ratings received</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="stat-card tertiary">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>Average Rating</h3>
            <div className="stat-number">
              {reviews?.ratingValue ? `${reviews.ratingValue}/5` : 'N/A'}
            </div>
            <p className="stat-label">Out of 5 stars</p>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="additional-stats">
        <div className="stat-section">
          <h2>📈 Performance Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Compression Success Rate</span>
              <span className="metric-value">99.9%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Average Processing Time</span>
              <span className="metric-value">~3 seconds</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">File Size Reduction</span>
              <span className="metric-value">Up to 80%</span>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {stats?.updated_at && (
          <div className="last-updated">
            <p>📅 Last updated: {new Date(stats.updated_at).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;

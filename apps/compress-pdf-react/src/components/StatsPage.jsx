import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiStar, FiUsers, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import './StatsPage.css';

const StatsPage = ({ stats, reviews, loading, error, onBack, onRefresh, apiBase }) => {
  const [liveStats, setLiveStats] = useState({ ...stats });
  const [liveReviews, setLiveReviews] = useState({ ...reviews });
  const [isLive, setIsLive] = useState(true);

  // Live counter effect
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          fetch(`${apiBase}/v1/compress-pdf/stats`),
          fetch(`${apiBase}/v1/compress-pdf/reviews`)
        ]);
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setLiveStats({
            total_compressed: statsData.total_compressed || 0,
            updated_at: statsData.updated_at
          });
        }
        
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setLiveReviews({
            count: reviewsData.reviewCount || 0,
            average: reviewsData.ratingValue || 5
          });
        }
      } catch (e) {
        console.error('Live counter update failed:', e);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLive, apiBase]);

  // Update live stats when props change
  useEffect(() => {
    setLiveStats(stats);
    setLiveReviews(reviews);
  }, [stats, reviews]);

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
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            onClick={() => setIsLive(!isLive)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: isLive ? "#10b981" : "#6b7280",
              color: "white",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {isLive ? "🟢 LIVE" : "⚫ OFF"}
          </button>
          <button onClick={onRefresh} className="refresh-button">
            <FiRefreshCw /> Refresh
          </button>
        </div>
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
              {liveStats?.total_compressed?.toLocaleString() || '0'}
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
              {liveReviews?.reviewCount || '0'}
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
              {liveReviews?.ratingValue ? `${liveReviews.ratingValue}/5` : 'N/A'}
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
        {liveStats?.updated_at && (
          <div className="last-updated">
            <p>📅 Last updated: {new Date(liveStats.updated_at).toLocaleDateString()}</p>
            {isLive && <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "#10b981" }}>🟢 Live updates every 5 seconds</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;

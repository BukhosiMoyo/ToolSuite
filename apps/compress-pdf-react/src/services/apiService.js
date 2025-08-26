import API_CONFIG from '../config/api.js';

// API Service for Compress PDF React App
class ApiService {
  // Generic fetch wrapper with error handling
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Get compress PDF stats
  async getCompressPdfStats() {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.COMPRESS_PDF_STATS);
    return this.fetchWithErrorHandling(url);
  }

  // Get compress PDF reviews
  async getCompressPdfReviews() {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.COMPRESS_PDF_REVIEWS);
    return this.fetchWithErrorHandling(url);
  }

  // Get combined stats
  async getCombinedStats() {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.STATS_COMBINED);
    return this.fetchWithErrorHandling(url);
  }

  // Get combined reviews
  async getCombinedReviews() {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.REVIEWS_COMBINED);
    return this.fetchWithErrorHandling(url);
  }

  // Submit a review
  async submitReview(rating, tool = 'compress-pdf') {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SUBMIT_REVIEW);
    const data = { rating, tool };
    
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck() {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.HEALTH);
    return this.fetchWithErrorHandling(url);
  }
}

// Export singleton instance
export default new ApiService();

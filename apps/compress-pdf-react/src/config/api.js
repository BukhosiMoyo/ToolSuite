// API Configuration for Compress PDF React App
const API_CONFIG = {
  // Base URL for the API
  BASE_URL: 'https://api.compresspdf.co.za',
  
  // API Endpoints
  ENDPOINTS: {
    // Health check
    HEALTH: '/health',
    
    // Compress PDF specific endpoints
    COMPRESS_PDF_STATS: '/v1/compress-pdf/stats',
    COMPRESS_PDF_REVIEWS: '/v1/compress-pdf/reviews',
    
    // General endpoints
    REVIEWS_SUMMARY: '/v1/reviews/summary',
    STATS_COMBINED: '/v1/stats/combined',
    REVIEWS_COMBINED: '/v1/reviews/combined',
    
    // Review submission
    SUBMIT_REVIEW: '/v1/reviews',
  },
  
  // Get full URL for an endpoint
  getUrl: (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;

// src/services/api.js - PROFESSIONAL COMPLETE API SERVICE
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Base request method with error handling and timeout
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    const config = {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Handle FormData (for file uploads)
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type']; // Let browser set it
    } else if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(
          data?.error || 
          data?.message || 
          data || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('So\'rov vaqti tugadi. Internetni tekshiring.');
      }
      
      console.error(`API Request failed [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================

  /**
   * Check user authentication status
   * @param {number} tgId - Telegram user ID
   * @returns {Promise<Object>} Auth status response
   */
  async checkUserAuth(tgId) {
    try {
      return await this.request(`/auth/check/${tgId}`);
    } catch (error) {
      console.error('Auth check failed:', error);
      throw new Error('Foydalanuvchi ma\'lumotlari tekshirilmadi');
    }
  }

  /**
   * Register new user (called from bot)
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  async registerUser(userData) {
    try {
      return await this.request('/auth/register', {
        method: 'POST',
        body: userData
      });
    } catch (error) {
      console.error('User registration failed:', error);
      throw new Error('Ro\'yxatdan o\'tishda xatolik');
    }
  }

  // ==================== USER PROFILE ENDPOINTS ====================

  /**
   * Get user statistics and profile data
   * @param {number} tgId - Telegram user ID
   * @returns {Promise<Object>} User statistics
   */
  async getUserStatistics(tgId) {
    try {
      const data = await this.request(`/user/statistics/${tgId}`);
      
      // Ensure data structure consistency
      return {
        today: {
          completed: data.today?.completed || 0,
          pages_read: data.today?.pages_read || 0,
          distance_km: data.today?.distance_km || 0,
          date: data.today?.date || new Date().toISOString().split('T')[0]
        },
        all_time: {
          total_points: data.all_time?.total_points || 0,
          total_pages: data.all_time?.total_pages || 0,
          total_distance: data.all_time?.total_distance || 0,
          total_days: data.all_time?.total_days || 0
        }
      };
    } catch (error) {
      console.error('Get user statistics failed:', error);
      throw new Error('Statistika ma\'lumotlari yuklanmadi');
    }
  }

  /**
   * Get user profile by ID (for viewing other users)
   * @param {number} userId - Target user ID
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(userId) {
    try {
      return await this.request(`/user/profile/${userId}`);
    } catch (error) {
      console.error('Get user profile failed:', error);
      throw new Error('Foydalanuvchi profili topilmadi');
    }
  }

  /**
   * Upload user profile photo
   * @param {FormData} formData - Photo upload data
   * @returns {Promise<Object>} Upload response
   */
  async uploadUserPhoto(formData) {
    try {
      return await this.request('/user/upload-photo', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw new Error('Rasm yuklashda xatolik');
    }
  }

  // ==================== DAILY TASKS ENDPOINTS ====================

  /**
   * Get today's tasks for user
   * @param {number} tgId - Telegram user ID
   * @returns {Promise<Object>} Today's tasks data
   */
  async getDailyTasks(tgId) {
    try {
      const data = await this.request(`/tasks/daily/${tgId}`);
      
      return {
        date: data.date || new Date().toISOString().split('T')[0],
        tasks: data.tasks || {},
        task_inputs: data.task_inputs || {},
        pages_read: data.pages_read || 0,
        distance_km: data.distance_km || 0,
        completed_count: data.completed_count || 0,
        is_submitted_today: data.is_submitted_today || false,
        submission_time: data.submission_time || null
      };
    } catch (error) {
      console.error('Get daily tasks failed:', error);
      // Return empty state instead of throwing
      return {
        date: new Date().toISOString().split('T')[0],
        tasks: {},
        task_inputs: {},
        pages_read: 0,
        distance_km: 0,
        completed_count: 0,
        is_submitted_today: false,
        submission_time: null
      };
    }
  }

  /**
   * Submit daily progress/tasks
   * @param {Object} progressData - Daily progress data
   * @returns {Promise<Object>} Submission response
   */
  async submitDailyProgress(progressData) {
    try {
      const response = await this.request('/tasks/submit', {
        method: 'POST',
        body: {
          ...progressData,
          submission_time: new Date().toISOString()
        }
      });

      return {
        success: response.success || true,
        message: response.message || 'Ma\'lumotlar saqlandi',
        totalPoints: response.total_points || response.totalPoints || 0,
        todayData: response.today_data || {
          completed: progressData.completed_count || 0,
          pages_read: progressData.pages_read || 0,
          distance_km: progressData.distance_km || 0
        }
      };
    } catch (error) {
      console.error('Submit daily progress failed:', error);
      throw new Error('Ma\'lumotlarni saqlashda xatolik');
    }
  }

  // ==================== LEADERBOARD ENDPOINTS ====================

  /**
   * Get leaderboard data with filters
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Leaderboard data
   */
  async getLeaderboard(params = {}) {
    try {
      const queryParams = {
        period: params.period || 'all',
        type: params.type || 'overall',
        limit: params.limit || 100,
        offset: params.offset || 0
      };

      const query = new URLSearchParams(queryParams).toString();
      const data = await this.request(`/leaderboard?${query}`);

      return {
        success: true,
        total_participants: data.total_participants || 0,
        leaderboard: (data.leaderboard || []).map(participant => ({
          tg_id: participant.tg_id,
          name: participant.name || 'Unknown',
          rank: participant.rank,
          score: participant.score || 0,
          total_points: participant.total_points || 0,
          total_pages: participant.total_pages || 0,
          total_distance: participant.total_distance || 0,
          photo_url: participant.photo_url || null,
          achievements: participant.achievements || [],
          is_premium: participant.is_premium || false
        }))
      };
    } catch (error) {
      console.error('Get leaderboard failed:', error);
      throw new Error('Reyting ma\'lumotlari yuklanmadi');
    }
  }

  /**
   * Get user's position in leaderboard
   * @param {number} tgId - Telegram user ID
   * @param {string} period - Time period filter
   * @param {string} type - Leaderboard type
   * @returns {Promise<Object>} User position data
   */
  async getUserLeaderboardPosition(tgId, period = 'all', type = 'overall') {
    try {
      return await this.request(`/leaderboard/position/${tgId}?period=${period}&type=${type}`);
    } catch (error) {
      console.error('Get user position failed:', error);
      throw new Error('Foydalanuvchi pozitsiyasi topilmadi');
    }
  }

  // ==================== ACHIEVEMENTS ENDPOINTS ====================

  /**
   * Get user achievements
   * @param {number} tgId - Telegram user ID
   * @returns {Promise<Object>} User achievements
   */
  async getUserAchievements(tgId) {
    try {
      return await this.request(`/achievements/${tgId}`);
    } catch (error) {
      console.error('Get achievements failed:', error);
      throw new Error('Yutuqlar ma\'lumoti yuklanmadi');
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get pending users for approval (admin only)
   * @returns {Promise<Object>} Pending users list
   */
  async getPendingUsers() {
    try {
      return await this.request('/admin/pending-users');
    } catch (error) {
      console.error('Get pending users failed:', error);
      throw new Error('Kutilayotgan foydalanuvchilar yuklanmadi');
    }
  }

  /**
   * Approve user (admin only)
   * @param {number} tgId - User Telegram ID
   * @returns {Promise<Object>} Approval response
   */
  async approveUser(tgId) {
    try {
      return await this.request(`/admin/approve/${tgId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Approve user failed:', error);
      throw new Error('Foydalanuvchini tasdiqlashda xatolik');
    }
  }

  /**
   * Reject user (admin only)
   * @param {number} tgId - User Telegram ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Rejection response
   */
  async rejectUser(tgId, reason = '') {
    try {
      return await this.request(`/admin/reject/${tgId}`, {
        method: 'POST',
        body: { reason }
      });
    } catch (error) {
      console.error('Reject user failed:', error);
      throw new Error('Foydalanuvchini rad etishda xatolik');
    }
  }

  // ==================== UTILITY ENDPOINTS ====================

  /**
   * Health check endpoint
   * @returns {Promise<Object>} Server health status
   */
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Server bilan aloqa yo\'q');
    }
  }

  /**
   * Get server time
   * @returns {Promise<Object>} Server time info
   */
  async getServerTime() {
    try {
      return await this.request('/time');
    } catch (error) {
      console.error('Get server time failed:', error);
      throw new Error('Server vaqti olinmadi');
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Required field names
   * @throws {Error} If validation fails
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Majburiy maydonlar to'ldirilmagan: ${missing.join(', ')}`);
    }
  }

  /**
   * Format error message for user display
   * @param {Error} error - Original error
   * @returns {string} User-friendly error message
   */
  formatErrorMessage(error) {
    if (error.message.includes('fetch')) {
      return 'Internet aloqasini tekshiring';
    }
    if (error.message.includes('timeout')) {
      return 'So\'rov vaqti tugadi';
    }
    if (error.message.includes('404')) {
      return 'Ma\'lumot topilmadi';
    }
    if (error.message.includes('500')) {
      return 'Server xatosi. Keyinroq urinib ko\'ring';
    }
    
    return error.message || 'Noma\'lum xatolik yuz berdi';
  }
}

// Export singleton instance
export default new APIService();
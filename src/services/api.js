// =====================================================
// API SERVICE - LEADERBOARD TUZATILGAN VERSIYA
// =====================================================

// Environment-based API URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://yuldagilar-backend.onrender.com/api";

class APIService {
  static baseURL = API_BASE_URL;

  // Helper method for API calls with error handling
  static async apiCall(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      };

      console.log(`🌐 API Call: ${config.method || "GET"} ${url}`);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(`✅ API Response:`, data);

      return data;
    } catch (error) {
      console.error(`❌ API Error:`, error);
      throw error;
    }
  }

  // =====================================================
  // USER AUTHENTICATION & PROFILE
  // =====================================================

  static async checkUserAuth(userId) {
    return this.apiCall("/auth/check", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  static async getUserProfile(userId) {
    return this.apiCall(`/users/${userId}`);
  }

  static async getUserStatistics(userId) {
    return this.apiCall(`/users/${userId}/statistics`);
  }

  static async getUserAchievementsProgress(userId) {
    const response = await this.apiCall(
      `/users/${userId}/achievements/progress`
    );
    return response.data || [];
  }

  // =====================================================
  // ✅ YANGI: Profil rasmi yangilash
  // =====================================================

  static async updateUserPhoto(userId, photoUrl) {
    return this.apiCall(`/auth/update-photo/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ photo_url: photoUrl }),
    });
  }

  // =====================================================
  // USER PROFILE MANAGEMENT
  // =====================================================

  static async uploadUserPhoto(formData) {
    return this.apiCall("/users/upload-photo", {
      method: "POST",
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });
  }

  static async updateUserProfile(userId, profileData) {
    return this.apiCall(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // =====================================================
  // HELPER METHOD FOR FORM DATA UPLOADS
  // =====================================================

  static async apiCallFormData(endpoint, formData, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        method: "POST",
        body: formData,
        // Don't set Content-Type header for FormData
        ...options,
      };

      console.log(`🌐 API Call (FormData): ${config.method} ${url}`);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(`✅ API Response:`, data);

      return data;
    } catch (error) {
      console.error(`❌ API Error:`, error);
      throw error;
    }
  }

  // =====================================================
  // DAILY TASKS & PROGRESS
  // =====================================================

  static async getDailyTasks(userId) {
    return this.apiCall(`/tasks/daily/${userId}`);
  }

  static async getUserDailyProgress(userId, date) {
    const dateParam = date || new Date().toISOString().split("T")[0];
    return this.apiCall(`/tasks/progress/${userId}/${dateParam}`);
  }

  static async getUserProgressHistory(userId, days = 30) {
    return this.apiCall(`/tasks/history/${userId}?days=${days}`);
  }

  static async submitDailyProgress(data) {
    return this.apiCall("/tasks/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Legacy method for backward compatibility
  static async completeTask(userId, taskId) {
    // Convert to the new format expected by submitDailyProgress
    const data = {
      tg_id: userId,
      [`shart_${taskId}`]: 1,
    };

    return this.submitDailyProgress(data);
  }

  // =====================================================
  // ✅ LEADERBOARD & RANKINGS - TO'LIQ TUZATILGAN
  // =====================================================

  /**
   * ✅ ASOSIY TUZATISH: getLeaderboard with proper parameters
   * @param {Object} params - Leaderboard parameters
   * @param {string} params.period - 'daily', 'weekly', 'all'  
   * @param {string} params.type - 'overall', 'reading', 'distance'
   * @param {number} params.limit - Number of results
   * @param {number} params.tg_id - Current user's Telegram ID
   */
  static async getLeaderboard(params = {}) {
    try {
      const { 
        period = 'all', 
        type = 'overall', 
        limit = 100,
        tg_id 
      } = params;
      
      // ✅ DEBUG: Request parametrlarini log qilish
      console.log('📡 API Request - getLeaderboard:', {
        period,
        type,
        limit,
        tg_id: tg_id || 'not provided'
      });

      // ✅ TUZATISH: Query parameters to'g'ri yaratish
      const queryParams = new URLSearchParams({
        period,
        type,
        limit: limit.toString()
      });

      // Add tg_id if provided
      if (tg_id) {
        queryParams.append('tg_id', tg_id.toString());
      }

      const endpoint = `/leaderboard?${queryParams.toString()}`;
      console.log('🌐 Leaderboard API URL:', `${this.baseURL}${endpoint}`);

      const response = await this.apiCall(endpoint);
      
      // ✅ DEBUG: Response'ni log qilish
      console.log('📥 API Response - getLeaderboard:', {
        success: response.success,
        period: response.period,
        type: response.type,
        leaderboard_count: response.leaderboard?.length || 0,
        total_participants: response.total_participants,
        current_user_rank: response.current_user?.rank || 'not found',
        query_info: response.query_info || 'not provided',
        top_5_users: response.leaderboard?.slice(0, 5).map(u => ({
          rank: u.rank,
          name: u.name,
          score: u.score,
          score_breakdown: {
            total_points: u.total_points,
            total_pages: u.total_pages,
            total_distance: u.total_distance,
            weekly_points: u.weekly_points,
            weekly_pages: u.weekly_pages,
            weekly_distance: u.weekly_distance,
            daily_points: u.daily_points,
            daily_pages: u.daily_pages,
            daily_distance: u.daily_distance
          }
        })) || []
      });

      return response;
    } catch (error) {
      console.error('❌ API Error - getLeaderboard:', error);
      throw error;
    }
  }

  /**
   * ✅ YANGI: Get user rank with specific parameters
   */
  static async getUserRank(userId, period = "weekly", metric = "overall") {
    const params = new URLSearchParams({
      period,
      metric,
      tg_id: userId.toString()
    });

    return this.apiCall(`/users/${userId}/rank?${params.toString()}`);
  }

  /**
   * ✅ LEGACY SUPPORT: Old getLeaderboard call
   * @deprecated Use getLeaderboard(params) instead
   */
  static async getLeaderboardLegacy(period = "weekly") {
    console.warn('⚠️ Using deprecated getLeaderboardLegacy. Use getLeaderboard(params) instead.');
    return this.getLeaderboard({ period, type: 'overall' });
  }

  // =====================================================
  // WEEKLY & MONTHLY STATS
  // =====================================================

  static async getWeeklyStats(userId) {
    return this.apiCall(`/stats/weekly/${userId}`);
  }

  static async getMonthlyStats(userId) {
    return this.apiCall(`/stats/monthly/${userId}`);
  }

    // =====================================================
  // ✅ YANGI: OYLIK KALENDAR UCHUN STATISTIKA
  // =====================================================

  static async getUserMonthlyStatistics(userId, year, month) {
    try {
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString()
      });

      const endpoint = `/users/${userId}/statistics/monthly?${params.toString()}`;
      console.log(`📅 Getting monthly stats for ${year}-${month}`);
      
      const response = await this.apiCall(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to get monthly statistics:', error);
      
      // ✅ FALLBACK - bo'sh ma'lumot qaytarish
      return {
        daily_stats: []
      };
    }
  }
  
  // =====================================================
  // ADMIN FUNCTIONS
  // =====================================================

  static async approveUser(adminId, userId) {
    return this.apiCall("/admin/approve-user", {
      method: "POST",
      body: JSON.stringify({ adminId, userId }),
    });
  }

  static async getPendingUsers(adminId) {
    return this.apiCall(`/admin/pending-users?adminId=${adminId}`);
  }

  static async getAllUsers(adminId, page = 1, limit = 50) {
    return this.apiCall(
      `/admin/users?adminId=${adminId}&page=${page}&limit=${limit}`
    );
  }

  // =====================================================
  // HEALTH & TEST ENDPOINTS
  // =====================================================

  static async healthCheck() {
    return this.apiCall("/health");
  }

  static async testDatabase() {
    return this.apiCall("/test-db");
  }

  // =====================================================
  // ACHIEVEMENTS & BADGES
  // =====================================================

  static async getUserAchievements(userId) {
    return this.apiCall(`/users/${userId}/achievements`);
  }

  static async getAvailableBadges() {
    return this.apiCall("/badges");
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  static formatDate(date) {
    return new Date(date).toISOString().split("T")[0];
  }

  static getTodayDate() {
    return this.formatDate(new Date());
  }

  static getWeekAgoDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return this.formatDate(date);
  }

  static getMonthAgoDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return this.formatDate(date);
  }

  // =====================================================
  // ERROR HANDLING HELPERS
  // =====================================================

  static isNetworkError(error) {
    return (
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network request failed")
    );
  }

  static isServerError(error) {
    return error.message.includes("HTTP 5");
  }

  static isClientError(error) {
    return error.message.includes("HTTP 4");
  }

  static getErrorMessage(error) {
    if (this.isNetworkError(error)) {
      return "Internetga ulanishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
    }

    if (this.isServerError(error)) {
      return "Serverda xatolik yuz berdi. Iltimos, keyinroq qaytadan urinib ko'ring.";
    }

    if (this.isClientError(error)) {
      return error.message || "Ma'lumotlarni yuborishda xatolik yuz berdi.";
    }

    return error.message || "Noma'lum xatolik yuz berdi.";
  }

  // =====================================================
  // ✅ YANGI: LEADERBOARD DEBUG HELPERS
  // =====================================================

  /**
   * Debug method to test leaderboard with different parameters
   */
  static async testLeaderboard() {
    console.log('🧪 Testing leaderboard with different parameters...');
    
    const testCases = [
      { period: 'all', type: 'overall' },
      { period: 'all', type: 'reading' },
      { period: 'all', type: 'distance' },
      { period: 'weekly', type: 'overall' },
      { period: 'weekly', type: 'reading' },
      { period: 'weekly', type: 'distance' },
      { period: 'daily', type: 'overall' },
      { period: 'daily', type: 'reading' },
      { period: 'daily', type: 'distance' }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`\n🔍 Testing: ${testCase.period} - ${testCase.type}`);
        const result = await this.getLeaderboard(testCase);
        console.log(`✅ Success: ${result.leaderboard?.length || 0} users found`);
      } catch (error) {
        console.error(`❌ Failed: ${testCase.period} - ${testCase.type}:`, error.message);
      }
    }
  }

  /**
   * Get detailed leaderboard info for debugging
   */
  static async getLeaderboardDebug(params = {}) {
    const result = await this.getLeaderboard(params);
    
    return {
      ...result,
      debug_info: {
        request_params: params,
        response_structure: {
          has_leaderboard: !!result.leaderboard,
          leaderboard_length: result.leaderboard?.length || 0,
          has_current_user: !!result.current_user,
          has_query_info: !!result.query_info,
          top_user_score: result.leaderboard?.[0]?.score || 0,
          last_user_score: result.leaderboard?.[result.leaderboard?.length - 1]?.score || 0
        }
      }
    };
  }
}

export default APIService;
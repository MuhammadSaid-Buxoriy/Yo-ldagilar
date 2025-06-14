// =====================================================
// API SERVICE - PRODUCTION READY VERSION + Photo Update
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
    return this.apiCall(`/users/${userId}/achievements/progress`);
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
  // LEADERBOARD & RANKINGS
  // =====================================================

  static async getLeaderboard(period = "weekly") {
    return this.apiCall(`/leaderboard?period=${period}`);
  }

  static async getUserRank(userId, period = "weekly", metric = "overall") {
    return this.apiCall(
      `/users/${userId}/rank?period=${period}&metric=${metric}`
    );
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
}

export default APIService;

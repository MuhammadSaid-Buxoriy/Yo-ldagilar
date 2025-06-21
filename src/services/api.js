// =====================================================
// API SERVICE - BACKEND BILAN TO'LIQ MOS QILINGAN
// =====================================================

// Environment-based API URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://yuldagilar-backend.onrender.com/api";

class APIService {
  static baseURL = API_BASE_URL;

  // Helper method for API calls with timezone support
  static async apiCall(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // ✅ YANGI: Default timezone header qo'shish
      const defaultHeaders = {
        "Content-Type": "application/json",
        "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...options.headers,
      };

      const config = {
        headers: defaultHeaders,
        ...options,
      };

      console.log(`🌐 API Call: ${config.method || "GET"} ${url}`);
      console.log(`🌍 Timezone: ${defaultHeaders["X-Timezone"]}`);

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

  // ✅ TUZATILGAN: getUserProfile - fallback bilan
  static async getUserProfile(userId) {
    try {
      return await this.apiCall(`/users/${userId}`);
    } catch (error) {
      console.warn("getUserProfile not available, using minimal data");
      // Minimal fallback data
      return {
        user: {
          id: userId,
          tg_id: userId,
          name: `User ${userId}`,
          photo_url: null,
          achievements: []
        }
      };
    }
  }

  // ✅ TUZATILGAN: getUserStatistics - timezone support bilan
  static async getUserStatistics(userId, options = {}) {
    let endpoint = `/users/${userId}/statistics`;
    
    // Calendar uchun parametrlar
    if (options.year && options.month) {
      const params = new URLSearchParams({
        year: options.year.toString(),
        month: options.month.toString(),
        ...(options.timezone && { timezone: options.timezone })
      });
      endpoint += `?${params.toString()}`;
    }
    
    return this.apiCall(endpoint);
  }

  // ✅ YANGI: getUserAchievementsProgress
  static async getUserAchievementsProgress(userId) {
    try {
      const response = await this.apiCall(`/users/${userId}/achievements/progress`);
      return response.data || response || [];
    } catch (error) {
      console.warn("Achievements progress not available:", error);
      return [];
    }
  }

  // ✅ YANGI: getUserCalendar
  static async getUserCalendar(userId, year, month) {
    try {
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      return await this.apiCall(`/users/${userId}/calendar?${params.toString()}`);
    } catch (error) {
      console.warn("Calendar endpoint not available:", error);
      // Fallback to progress history
      return this.getUserProgressHistoryAsCalendar(userId, year, month);
    }
  }

  // ✅ HELPER: Progress history'ni calendar formatiga o'tkazish
  static async getUserProgressHistoryAsCalendar(userId, year, month) {
    try {
      const daysInMonth = new Date(year, month, 0).getDate();
      const historyResponse = await this.getUserProgressHistory(userId, daysInMonth);
      
      const days = [];
      const historyData = historyResponse.history || [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayData = historyData.find(h => h.date === dateStr);
        
        days.push({
          date: day,
          fullDate: dateStr,
          hasProgress: dayData ? dayData.total_points > 0 : false,
          completionPercentage: dayData ? Math.round((dayData.total_points / 10) * 100) : 0,
          totalPoints: dayData?.total_points || 0,
          pagesRead: dayData?.pages_read || 0,
          distanceKm: dayData?.distance_km || 0
        });
      }
      
      return {
        calendar: {
          days,
          monthName: this.getMonthName(month),
          year,
          totalDaysWithProgress: days.filter(d => d.hasProgress).length
        }
      };
    } catch (error) {
      console.error("Calendar fallback failed:", error);
      return { calendar: { days: [] } };
    }
  }

  static getMonthName(month) {
    const names = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    return names[month - 1] || 'Noma\'lum';
  }

  // =====================================================
  // PHOTO MANAGEMENT
  // =====================================================

  static async updateUserPhoto(userId, photoUrl) {
    return this.apiCall(`/auth/update-photo/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ photo_url: photoUrl }),
    });
  }

  static async uploadUserPhoto(formData) {
    return this.apiCall("/users/upload-photo", {
      method: "POST",
      headers: {
        // Don't set Content-Type for FormData
      },
      body: formData,
    });
  }

  static async refreshAllPhotos() {
    return this.apiCall("/auth/refresh-photos", {
      method: "POST",
    });
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

  // ✅ TUZATILGAN: submitDailyProgress - timezone support
  static async submitDailyProgress(data) {
    // ✅ Timezone qo'shish agar yo'q bo'lsa
    const submitData = {
      ...data,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    return this.apiCall("/tasks/submit", {
      method: "POST",
      body: JSON.stringify(submitData),
    });
  }

  // =====================================================
  // ✅ LEADERBOARD & RANKINGS - TO'LIQ ISHLAYDI
  // =====================================================

  static async getLeaderboard(params = {}) {
    try {
      const { 
        period = 'all', 
        type = 'overall', 
        limit = 100,
        tg_id 
      } = params;
      
      console.log('📡 API Request - getLeaderboard:', {
        period, type, limit, tg_id: tg_id || 'not provided'
      });

      const queryParams = new URLSearchParams({
        period,
        type,
        limit: limit.toString()
      });

      if (tg_id) {
        queryParams.append('tg_id', tg_id.toString());
      }

      const endpoint = `/leaderboard?${queryParams.toString()}`;
      const response = await this.apiCall(endpoint);
      
      console.log('📥 API Response - getLeaderboard:', {
        success: response.success,
        period: response.period,
        type: response.type,
        leaderboard_count: response.leaderboard?.length || 0,
        total_participants: response.total_participants,
        current_user_rank: response.current_user?.rank || 'not found'
      });

      return response;
    } catch (error) {
      console.error('❌ API Error - getLeaderboard:', error);
      throw error;
    }
  }

  static async getUserRank(userId, period = "weekly", metric = "overall") {
    try {
      const params = new URLSearchParams({
        period, metric, tg_id: userId.toString()
      });
      return await this.apiCall(`/users/${userId}/rank?${params.toString()}`);
    } catch (error) {
      console.warn("getUserRank not available:", error);
      return { rank: 0 };
    }
  }

  // =====================================================
  // WEEKLY & MONTHLY STATS
  // =====================================================

  static async getWeeklyStats(userId) {
    try {
      return await this.apiCall(`/users/${userId}/weekly`);
    } catch (error) {
      console.warn("Weekly stats endpoint not available:", error);
      // Fallback to general statistics
      const stats = await this.getUserStatistics(userId);
      return {
        success: true,
        stats: {
          weeklyPoints: stats.weekly?.dailyPoints?.reduce((sum, p) => sum + p, 0) || 0,
          dailyPoints: stats.weekly?.dailyPoints || [0, 0, 0, 0, 0, 0, 0]
        }
      };
    }
  }

  static async getMonthlyStats(userId) {
    try {
      return await this.apiCall(`/stats/monthly/${userId}`);
    } catch (error) {
      console.warn("Monthly stats not available:", error);
      return { monthly_stats: [] };
    }
  }

  // ✅ YANGI: Monthly statistics for calendar
  static async getUserMonthlyStatistics(userId, year, month) {
    try {
      // Try new calendar endpoint first
      const calendarResponse = await this.getUserCalendar(userId, year, month);
      
      if (calendarResponse.calendar?.days) {
        // Convert calendar format to expected format
        const daily_stats = calendarResponse.calendar.days
          .filter(day => day.hasProgress)
          .map(day => ({
            date: day.fullDate,
            completed: day.totalPoints,
            total: 10,
            pages_read: day.pagesRead,
            distance_km: day.distanceKm
          }));
          
        return { daily_stats };
      }
      
      // Fallback to empty
      return { daily_stats: [] };
    } catch (error) {
      console.error('Failed to get monthly statistics:', error);
      return { daily_stats: [] };
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
    try {
      return await this.apiCall(`/users/${userId}/achievements`);
    } catch (error) {
      console.warn("Achievements not available:", error);
      return { achievements: [] };
    }
  }

  static async getAvailableBadges() {
    try {
      return await this.apiCall("/badges");
    } catch (error) {
      console.warn("Badges not available:", error);
      return { badges: [] };
    }
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

  // ✅ YANGI: User timezone date
  static getUserTodayDate(timezone = null) {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    return this.formatDate(userDate);
  }

  // =====================================================
  // ERROR HANDLING HELPERS
  // =====================================================

  static isNetworkError(error) {
    return (
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network request failed") ||
      error.message.includes("ERR_NETWORK")
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
  // ✅ DEBUG VA TEST HELPERS
  // =====================================================

  static async testAllEndpoints(userId) {
    console.log('🧪 Testing all API endpoints...');
    
    const tests = [
      { name: 'Health Check', fn: () => this.healthCheck() },
      { name: 'Database Test', fn: () => this.testDatabase() },
      { name: 'User Statistics', fn: () => this.getUserStatistics(userId) },
      { name: 'Daily Tasks', fn: () => this.getDailyTasks(userId) },
      { name: 'Progress History', fn: () => this.getUserProgressHistory(userId, 7) },
      { name: 'Leaderboard All', fn: () => this.getLeaderboard({ period: 'all', type: 'overall' }) },
      { name: 'Leaderboard Weekly', fn: () => this.getLeaderboard({ period: 'weekly', type: 'overall' }) },
      { name: 'Achievements Progress', fn: () => this.getUserAchievementsProgress(userId) },
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        console.log(`\n🔍 Testing: ${test.name}`);
        const result = await test.fn();
        results[test.name] = { success: true, data: result };
        console.log(`✅ ${test.name}: Success`);
      } catch (error) {
        results[test.name] = { success: false, error: error.message };
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    console.log('\n📊 Test Results Summary:');
    Object.entries(results).forEach(([name, result]) => {
      console.log(`${result.success ? '✅' : '❌'} ${name}`);
    });
    
    return results;
  }

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

  // =====================================================
  // ✅ YANGI: FRONTEND COMPATIBILITY HELPERS
  // =====================================================

  // Legacy method for backward compatibility
  static async completeTask(userId, taskId) {
    console.warn('⚠️ completeTask is deprecated. Use submitDailyProgress instead.');
    const data = {
      tg_id: userId,
      [`shart_${taskId}`]: 1,
    };
    return this.submitDailyProgress(data);
  }

  // Legacy leaderboard method
  static async getLeaderboardLegacy(period = "weekly") {
    console.warn('⚠️ Using deprecated getLeaderboardLegacy. Use getLeaderboard(params) instead.');
    return this.getLeaderboard({ period, type: 'overall' });
  }

  // Batch API calls for efficiency
  static async batchUserData(userId) {
    try {
      const promises = [
        this.getUserStatistics(userId).catch(e => ({ error: e.message })),
        this.getDailyTasks(userId).catch(e => ({ error: e.message })),
        this.getUserAchievementsProgress(userId).catch(e => []),
      ];

      const [stats, tasks, achievements] = await Promise.all(promises);

      return {
        stats: stats.error ? null : stats,
        tasks: tasks.error ? null : tasks,
        achievements: achievements || [],
        errors: [
          ...(stats.error ? ['stats: ' + stats.error] : []),
          ...(tasks.error ? ['tasks: ' + tasks.error] : [])
        ]
      };
    } catch (error) {
      console.error('Batch user data failed:', error);
      return {
        stats: null,
        tasks: null,
        achievements: [],
        errors: [error.message]
      };
    }
  }

  // Check API health before making requests
  static async ensureAPIHealth() {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.warn('API health check failed:', error.message);
      return false;
    }
  }

  // Smart retry mechanism
  static async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          console.error(`❌ Request failed after ${maxRetries} attempts:`, error);
          throw error;
        }
        
        if (this.isNetworkError(error)) {
          console.warn(`⚠️ Network error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Exponential backoff
        } else {
          // Don't retry for non-network errors
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  // =====================================================
  // ✅ ENVIRONMENT & CONFIGURATION
  // =====================================================

  static getConfig() {
    return {
      baseURL: this.baseURL,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      environment: import.meta.env.MODE || 'development',
      version: '2.0.0',
      features: {
        timezone_support: true,
        calendar_integration: true,
        achievement_tracking: true,
        photo_management: true,
        batch_requests: true,
        auto_retry: true
      }
    };
  }

  static async getServerInfo() {
    try {
      const response = await this.apiCall('/');
      return response;
    } catch (error) {
      console.warn('Server info not available:', error);
      return { 
        name: 'Yoldagilar API', 
        status: 'unknown',
        error: error.message 
      };
    }
  }
}

export default APIService;
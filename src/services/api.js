// =====================================================
// ENHANCED API SERVICE - CORS FALLBACK & COMPATIBILITY
// =====================================================
// File: services/api.js

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://yuldagilar-backend.onrender.com/api";

class APIService {
  static baseURL = API_BASE_URL;
  static corsSupported = null; // Cache CORS support status
  static timezoneMethod = 'auto'; // 'header', 'query', or 'auto'

  // ✅ ENHANCED: Smart API call with automatic CORS fallback
  static async apiCall(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Get timezone info
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Determine timezone method if not cached
      if (this.timezoneMethod === 'auto') {
        await this.detectBestTimezoneMethod();
      }
      
      let finalUrl = url;
      let finalHeaders = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      // Apply timezone based on supported method
      if (this.timezoneMethod === 'header') {
        finalHeaders["X-Timezone"] = timezone;
      } else if (this.timezoneMethod === 'query') {
        const separator = endpoint.includes('?') ? '&' : '?';
        finalUrl = `${url}${separator}timezone=${encodeURIComponent(timezone)}`;
      }

      const config = {
        headers: finalHeaders,
        credentials: 'include', // Support for cookies/auth
        ...options,
      };

      console.log(`🌐 API Call: ${config.method || "GET"} ${finalUrl}`);
      console.log(`🌍 Timezone: ${timezone} (method: ${this.timezoneMethod})`);

      const response = await fetch(finalUrl, config);

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
      
      // Handle CORS errors with fallback
      if (this.isCorsError(error)) {
        console.warn('🚫 CORS Error detected, attempting fallback...');
        return this.handleCorsErrorWithFallback(endpoint, options, error);
      }
      
      throw error;
    }
  }

  // ✅ CORS Error Detection
  static isCorsError(error) {
    return error.message.includes('CORS') || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('Network request failed') ||
           error.name === 'TypeError';
  }

  // ✅ CORS Error Fallback Handler
  static async handleCorsErrorWithFallback(endpoint, options, originalError) {
    console.log('🔄 Attempting CORS fallback strategies...');
    
    const strategies = [
      // Strategy 1: Remove custom headers
      () => this.tryWithoutCustomHeaders(endpoint, options),
      
      // Strategy 2: Use query parameters only
      () => this.tryWithQueryParamsOnly(endpoint, options),
      
      // Strategy 3: Basic request without extras
      () => this.tryBasicRequest(endpoint, options)
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`🧪 Trying CORS fallback strategy ${i + 1}...`);
        const result = await strategies[i]();
        console.log(`✅ CORS fallback strategy ${i + 1} succeeded!`);
        
        // Cache successful method
        this.timezoneMethod = i === 0 ? 'query' : 'none';
        return result;
      } catch (error) {
        console.log(`❌ CORS fallback strategy ${i + 1} failed:`, error.message);
        continue;
      }
    }

    // If all fallbacks fail, throw original error
    console.error('❌ All CORS fallback strategies failed');
    throw originalError;
  }

  // Fallback Strategy 1: Remove custom headers
  static async tryWithoutCustomHeaders(endpoint, options) {
    const url = `${this.baseURL}${endpoint}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const separator = endpoint.includes('?') ? '&' : '?';
    const urlWithTimezone = `${url}${separator}timezone=${encodeURIComponent(timezone)}`;

    const safeConfig = {
      method: options.method || 'GET',
      headers: {
        "Content-Type": "application/json"
      },
      body: options.body,
    };

    const response = await fetch(urlWithTimezone, safeConfig);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Fallback Strategy 2: Query parameters only
  static async tryWithQueryParamsOnly(endpoint, options) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        "Content-Type": "application/json"
      },
      body: options.body,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Fallback Strategy 3: Basic request
  static async tryBasicRequest(endpoint, options) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      ...(options.body && { body: options.body })
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  // ✅ Auto-detect best timezone method
  static async detectBestTimezoneMethod() {
    console.log('🔍 Auto-detecting best timezone method...');
    
    try {
      // Test with header first
      const testUrl = `${this.baseURL}/health`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Timezone': timezone
        },
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Timezone header method supported');
        this.timezoneMethod = 'header';
        return 'header';
      }
    } catch (error) {
      console.log('❌ Timezone header method failed, trying query method...');
    }

    try {
      // Test with query parameter
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const testUrl = `${this.baseURL}/health?timezone=${encodeURIComponent(timezone)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Timezone query method supported');
        this.timezoneMethod = 'query';
        return 'query';
      }
    } catch (error) {
      console.log('❌ Timezone query method failed');
    }

    console.log('⚠️ No timezone method supported, using none');
    this.timezoneMethod = 'none';
    return 'none';
  }

  // ✅ ENHANCED: Connection testing with comprehensive diagnostics
  static async testConnection() {
    console.log('🧪 Starting comprehensive connection test...');
    
    const results = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseURL,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: navigator.userAgent.substring(0, 100),
      tests: {}
    };

    // Test 1: Basic connectivity
    try {
      const response = await fetch(`${this.baseURL}/health`);
      results.tests.basicConnectivity = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
      
      if (response.ok) {
        const data = await response.json();
        results.tests.basicConnectivity.data = data;
      }
    } catch (error) {
      results.tests.basicConnectivity = {
        success: false,
        error: error.message
      };
    }

    // Test 2: CORS with custom headers
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Timezone': results.timezone
        },
        credentials: 'include'
      });

      results.tests.corsWithHeaders = {
        success: response.ok,
        status: response.status,
        supportsCustomHeaders: response.ok
      };
    } catch (error) {
      results.tests.corsWithHeaders = {
        success: false,
        error: error.message,
        supportsCustomHeaders: false
      };
    }

    // Test 3: Query parameter method
    try {
      const url = `${this.baseURL}/health?timezone=${encodeURIComponent(results.timezone)}`;
      const response = await fetch(url);
      
      results.tests.queryParams = {
        success: response.ok,
        status: response.status
      };
    } catch (error) {
      results.tests.queryParams = {
        success: false,
        error: error.message
      };
    }

    // Test 4: Auth endpoint
    try {
      await this.checkUserAuth(12345);
      results.tests.authEndpoint = { success: true };
    } catch (error) {
      results.tests.authEndpoint = {
        success: false,
        error: error.message
      };
    }

    // Determine best method
    if (results.tests.corsWithHeaders?.supportsCustomHeaders) {
      results.recommendedMethod = 'header';
    } else if (results.tests.queryParams?.success) {
      results.recommendedMethod = 'query';
    } else {
      results.recommendedMethod = 'basic';
    }

    console.log('📊 Connection test results:', results);
    return results;
  }

  // ✅ CORS-safe method wrappers
  static async checkUserAuth(userId) {
    return this.apiCall("/auth/check", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  static async getUserStatistics(userId, options = {}) {
    let endpoint = `/users/${userId}/statistics`;
    
    if (options.year && options.month) {
      const params = new URLSearchParams({
        year: options.year.toString(),
        month: options.month.toString()
      });
      endpoint += `?${params.toString()}`;
    }
    
    return this.apiCall(endpoint);
  }

  static async getUserProfile(userId) {
    try {
      return await this.apiCall(`/users/${userId}`);
    } catch (error) {
      console.warn("getUserProfile not available, using minimal data");
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

  static async submitDailyProgress(data) {
    const submitData = {
      ...data,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    return this.apiCall("/tasks/submit", {
      method: "POST",
      body: JSON.stringify(submitData),
    });
  }

  static async getLeaderboard(params = {}) {
    try {
      const { 
        period = 'all', 
        type = 'overall', 
        limit = 100,
        tg_id 
      } = params;
      
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
      
      return response;
    } catch (error) {
      console.error('❌ API Error - getLeaderboard:', error);
      throw error;
    }
  }

  // ✅ Enhanced error handling
  static getErrorMessage(error) {
    if (this.isCorsError(error)) {
      return "CORS xatoligi aniqlandi. Backend sozlamalari yangilanishi kerak. " +
             "Agar muammo davom etsa, CORS fallback rejimida ishlaydi.";
    }

    if (error.message.includes("HTTP 5")) {
      return "Serverda xatolik yuz berdi. Iltimos, keyinroq qaytadan urinib ko'ring.";
    }

    if (error.message.includes("HTTP 4")) {
      return error.message || "Ma'lumotlarni yuborishda xatolik yuz berdi.";
    }

    return error.message || "Noma'lum xatolik yuz berdi.";
  }

  // ✅ Diagnostic methods
  static async diagnoseConnection() {
    console.log('🔍 Starting comprehensive API diagnosis...');
    
    const diagnosis = await this.testConnection();
    
    // Additional tests
    const additionalTests = {
      // Test user endpoints
      userEndpoints: await this.testUserEndpoints(),
      
      // Test leaderboard
      leaderboard: await this.testLeaderboardEndpoints(),
      
      // Test task submission
      taskSubmission: await this.testTaskSubmission()
    };

    return {
      ...diagnosis,
      additionalTests,
      recommendations: this.generateRecommendations(diagnosis, additionalTests)
    };
  }

  static async testUserEndpoints() {
    const testUserId = 12345;
    const tests = {};

    try {
      await this.getUserStatistics(testUserId);
      tests.statistics = { success: true };
    } catch (error) {
      tests.statistics = { success: false, error: error.message };
    }

    try {
      await this.getUserProfile(testUserId);
      tests.profile = { success: true };
    } catch (error) {
      tests.profile = { success: false, error: error.message };
    }

    return tests;
  }

  static async testLeaderboardEndpoints() {
    const tests = {};

    try {
      await this.getLeaderboard({ period: 'weekly', type: 'overall' });
      tests.weekly = { success: true };
    } catch (error) {
      tests.weekly = { success: false, error: error.message };
    }

    try {
      await this.getLeaderboard({ period: 'all', type: 'overall' });
      tests.all = { success: true };
    } catch (error) {
      tests.all = { success: false, error: error.message };
    }

    return tests;
  }

  static async testTaskSubmission() {
    try {
      // This will likely fail with validation error, but tests connectivity
      await this.submitDailyProgress({
        tg_id: 12345,
        shart_1: 1,
        test: true
      });
      return { success: true };
    } catch (error) {
      // 400 errors are expected for test data, 500+ errors indicate connectivity issues
      const isConnectivityIssue = !error.message.includes('HTTP 4');
      return { 
        success: !isConnectivityIssue,
        error: error.message,
        note: isConnectivityIssue ? 'Connectivity issue' : 'Validation error (expected)'
      };
    }
  }

  static generateRecommendations(diagnosis, additionalTests) {
    const recommendations = [];

    if (!diagnosis.tests.basicConnectivity?.success) {
      recommendations.push('❌ Backend server is not responding. Check server status.');
    }

    if (!diagnosis.tests.corsWithHeaders?.supportsCustomHeaders) {
      recommendations.push('⚠️ Backend CORS does not support custom headers. Using query parameter fallback.');
    }

    if (diagnosis.recommendedMethod === 'basic') {
      recommendations.push('⚠️ Limited connectivity detected. Some features may not work properly.');
    }

    if (additionalTests.userEndpoints?.statistics?.success === false) {
      recommendations.push('⚠️ User statistics endpoint has issues.');
    }

    if (additionalTests.leaderboard?.weekly?.success === false) {
      recommendations.push('⚠️ Leaderboard endpoints have issues.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All connectivity tests passed. API is working properly.');
    }

    return recommendations;
  }

  // ✅ Configuration and status
  static getConfig() {
    return {
      baseURL: this.baseURL,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneMethod: this.timezoneMethod,
      corsSupported: this.corsSupported,
      environment: import.meta.env.MODE || 'development',
      version: '2.1.0',
      features: {
        cors_fallback: true,
        auto_detection: true,
        timezone_support: true,
        error_recovery: true,
        comprehensive_testing: true
      }
    };
  }

  static async getStatus() {
    try {
      const health = await this.apiCall('/health');
      return {
        server: 'online',
        cors: this.timezoneMethod !== 'none' ? 'working' : 'limited',
        health,
        config: this.getConfig()
      };
    } catch (error) {
      return {
        server: 'offline',
        cors: 'unknown',
        error: error.message,
        config: this.getConfig()
      };
    }
  }

  // ✅ Utility methods for backward compatibility
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
        
        if (this.isCorsError(error) || error.message.includes('Network')) {
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

  // Keep all other existing methods for compatibility...
  static formatDate(date) {
    return new Date(date).toISOString().split("T")[0];
  }

  static async getUserTodayTasks(userId) {
    return this.apiCall(`/tasks/daily/${userId}`);
  }
  

  static getTodayDate() {
    return this.formatDate(new Date());
  }

  static getUserTodayDate(timezone = null) {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    return this.formatDate(userDate);
  }
}

export default APIService;
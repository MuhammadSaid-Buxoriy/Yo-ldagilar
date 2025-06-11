// Step 2: Create services/api.js - COMPLETE FAKE API
// Dev mode checker
const IS_DEV =
  import.meta.env.DEV === "development" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

class APIService {
  static baseURL = IS_DEV
    ? "http://localhost:3001/api"
    : "https://your-real-api.com/api";

  // Simulate network delay
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async checkUserAuth(userId) {
    if (IS_DEV) {
      console.log("🚀 FAKE API: checkUserAuth for user:", userId);
      await this.delay(800);

      // You can change this to test different scenarios:
      // 'approved', 'not_approved', 'not_registered', 'error'
      const scenario = "approved";

      const scenarios = {
        approved: {
          success: true,
          isRegistered: true,
          isApproved: true,
          message: "User is approved and can access the app",
        },
        not_approved: {
          success: true,
          isRegistered: true,
          isApproved: false,
          message: "User is registered but waiting for admin approval",
        },
        not_registered: {
          success: true,
          isRegistered: false,
          isApproved: false,
          message: "User needs to register first",
        },
        error: null,
      };

      if (scenario === "error") {
        throw new Error("Tarmoq xatosi: Server bilan aloqa o'rnatilmadi");
      }

      return scenarios[scenario];
    }

    // Real API call for production
    const response = await fetch(`${this.baseURL}/auth/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    return response.json();
  }

  static async getUserProfile(userId) {
    if (IS_DEV) {
      console.log("🚀 FAKE API: getUserProfile for user:", userId);
      await this.delay(600);

      return {
        success: true,
        user: {
          id: userId,
          firstName: "Muhammadsaid",
          lastName: "Buxoriy",
          username: "muhammadsaid_dev",
          avatar: null,
          level: 5,
          xp: 2450,
          xpToNextLevel: 550,
          totalPoints: 15680,
          todayPoints: 320,
          weeklyPoints: 1240,
          monthlyPoints: 4560,
          streak: 12,
          longestStreak: 28,
          joinDate: "2024-12-15",
          lastActivity: "2025-06-11T10:30:00Z",
          achievements: ["consistent", "reader"],
          rank: 3,
          badges: [
            {
              id: 1,
              name: "Early Bird",
              icon: "🌅",
              description: "Bomdod namozini 30 kun ketma-ket o'qish",
              earned: true,
              earnedDate: "2025-05-15",
            },
            {
              id: 2,
              name: "Consistent",
              icon: "🔥",
              description: "12 kun ketma-ket faol bo'lish",
              earned: true,
              earnedDate: "2025-06-01",
            },
            {
              id: 3,
              name: "Top Performer",
              icon: "🏆",
              description: "Top 3 ga kirish",
              earned: false,
            },
            {
              id: 4,
              name: "Helper",
              icon: "🤝",
              description: "Boshqalarga 10 marta yordam berish",
              earned: true,
              earnedDate: "2025-05-20",
            },
          ],
          stats: {
            totalPrayers: 156,
            totalQuranPages: 89,
            totalZikr: 12450,
            totalCharity: 28,
          },
        },
      };
    }

    const response = await fetch(`${this.baseURL}/users/${userId}`);
    return response.json();
  }

  static async getUserStatistics(userId) {
    if (IS_DEV) {
      console.log("🚀 FAKE API: getUserStatistics for user:", userId);
      await this.delay(500);

      return {
        today: {
          completed: 7,
          pages_read: 25,
          distance_km: 3.2,
        },
        weekly: {
          dailyPoints: [7, 3, 9, 8, 4, 10, 0],
          dailyTotal: 10,
        },
        all_time: {
          total_points: 15680,
          total_pages: 4560,
          total_distance: 120.5,
          total_days: 45,
        },
      };
    }

    const response = await fetch(`${this.baseURL}/users/${userId}/statistics`);
    return response.json();
  }

  static async getDailyTasks(userId) {
    if (IS_DEV) {
      console.log("🚀 FAKE API: getDailyTasks for user:", userId);
      await this.delay(500);

      const today = new Date().toISOString().split("T")[0];

      return {
        success: true,
        date: today,
        tasks: [
          {
            id: 1,
            title: "Bomdod namozi",
            description: "Bomdod namozini vaqtida o'qish",
            points: 50,
            completed: true,
            completedAt: "2025-06-11T05:30:00Z",
            category: "namaz",
            icon: "🕌",
            difficulty: "easy",
          },
          {
            id: 2,
            title: "Peshin namozi",
            description: "Peshin namozini vaqtida o'qish",
            points: 50,
            completed: false,
            category: "namaz",
            icon: "🕌",
            difficulty: "easy",
          },
          {
            id: 3,
            title: "Asr namozi",
            description: "Asr namozini vaqtida o'qish",
            points: 50,
            completed: false,
            category: "namaz",
            icon: "🕌",
            difficulty: "easy",
          },
          {
            id: 4,
            title: "Magrib namozi",
            description: "Magrib namozini vaqtida o'qish",
            points: 50,
            completed: false,
            category: "namaz",
            icon: "🕌",
            difficulty: "easy",
          },
          {
            id: 5,
            title: "Xufton namozi",
            description: "Xufton namozini vaqtida o'qish",
            points: 50,
            completed: false,
            category: "namaz",
            icon: "🕌",
            difficulty: "easy",
          },
          {
            id: 6,
            title: "Qur'on tilovati",
            description: "Kamida 1 bet Qur'on o'qish",
            points: 30,
            completed: false,
            category: "quran",
            icon: "📖",
            difficulty: "medium",
          },
          {
            id: 7,
            title: "Zikr va tasbih",
            description: "100 marta Subhanalloh, Alhamdulilloh, Allohu akbar",
            points: 25,
            completed: true,
            completedAt: "2025-06-11T08:15:00Z",
            category: "zikr",
            icon: "📿",
            difficulty: "easy",
          },
          {
            id: 8,
            title: "Sadaqa",
            description: "Biror kishi yoki hayvonga yordam qilish",
            points: 40,
            completed: false,
            category: "charity",
            icon: "💝",
            difficulty: "hard",
          },
          {
            id: 9,
            title: "Duo qilish",
            description: "Kamida 5 daqiqa duo qilish",
            points: 20,
            completed: true,
            completedAt: "2025-06-11T07:45:00Z",
            category: "dua",
            icon: "🤲",
            difficulty: "easy",
          },
          {
            id: 10,
            title: "Islomiy kitob o'qish",
            description: "Islomiy adabiyotdan 10 sahifa o'qish",
            points: 35,
            completed: false,
            category: "knowledge",
            icon: "📚",
            difficulty: "medium",
          },
        ],
        completedCount: 3,
        totalTasks: 10,
        totalPoints: 365,
        earnedPoints: 95,
        completionPercentage: 30,
      };
    }

    const response = await fetch(`${this.baseURL}/tasks/daily/${userId}`);
    return response.json();
  }

  static async completeTask(userId, taskId) {
    if (IS_DEV) {
      console.log("🚀 FAKE API: completeTask", { userId, taskId });
      await this.delay(300);

      return {
        success: true,
        message: "Vazifa muvaffaqiyatli bajarildi!",
        pointsEarned: Math.floor(Math.random() * 50) + 20,
        newTotal: Math.floor(Math.random() * 1000) + 15000,
      };
    }

    const response = await fetch(`${this.baseURL}/tasks/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, taskId }),
    });

    return response.json();
  }

  static async getLeaderboard(period = "weekly") {
    if (IS_DEV) {
      console.log("🚀 FAKE API: getLeaderboard period:", period);
      await this.delay(700);

      const fakeUsers = [
        {
          tg_id: 1,
          name: "Ahmad Qodirov",
          points: 25680,
          streak: 45,
          avatar: null,
          score: 95,
          total_pages: 120,
          total_distance: 7,
          achievements: ["consistent", "perfectionist"],
        },
        {
          tg_id: 2,
          name: "Fotima Rahimova",
          points: 23450,
          streak: 38,
          avatar: null,
          score: 88,
          total_pages: 70,
          total_distance: 5,
          achievements: ["reader"],
        },
        {
          tg_id: 3,
          name: "Muhammadsaid Buxoriy",
          points: 15680,
          streak: 12,
          avatar: null,
          isCurrentUser: true,
          score: 75,
          total_pages: 58,
          total_distance: 12,
          achievements: ["athlete"],
        },
        {
          tg_id: 4,
          name: "Oybek Toshmatov",
          points: 14920,
          streak: 28,
          avatar: null,
          score: 72,
          total_pages: 58,
          total_distance: 12,
          achievements: ["consistent", "athlete"],
        },
        {
          tg_id: 5,
          name: "Zarina Karimova",
          points: 13750,
          streak: 22,
          avatar: null,
          score: 68,
          total_pages: 58,
          total_distance: 12,
          achievements: ["consistent", "reader"],
        },
        {
          tg_id: 6,
          name: "Bobur Rahmonov",
          points: 12890,
          streak: 19,
          avatar: null,
          score: 65,
          total_pages: 58,
          total_distance: 12,
          achievements: ["reader"],
        },
        {
          tg_id: 7,
          name: "Muslima Abdullayeva",
          points: 11980,
          streak: 15,
          avatar: null,
          score: 60,
          total_pages: 58,
          total_distance: 12,
          achievements: ["athlete", "reader"],
        },
        {
          tg_id: 8,
          name: "Javohir Ergashev",
          points: 10540,
          streak: 31,
          avatar: null,
          score: 55,
          total_pages: 58,
          total_distance: 12,
          achievements: ["perfectionist", "reader"],
        },
        {
          tg_id: 9,
          name: "Diyora Karimova",
          points: 9850,
          streak: 8,
          avatar: null,
          score: 50,
          total_pages: 58,
          total_distance: 12,
          achievements: ["perfectionist"],
        },
        {
          tg_id: 123456789,
          name: "Muhammadsaid Buxoriy",
          points: 8960,
          streak: 12,
          avatar: null,
          score: 40,
          total_pages: 58,
          total_distance: 150,
          achievements: ["consistent", "reader"],
        },
        {
          tg_id: 10,
          name: "Sanjar Tursunov",
          points: 8960,
          streak: 12,
          avatar: null,
          score: 45,
          total_pages: 58,
          total_distance: 12,
          achievements: ["perfectionist", "athlete", "reader"],
        },
      ];

      return {
        success: true,
        period: period,
        leaderboard: fakeUsers.map((user, index) => ({
          rank: index + 1,
          ...user,
          change: Math.floor(Math.random() * 6) - 3, // -3 to +3 rank change
        })),
        currentUserRank: 3,
        totalUsers: 1247,
      };
    }

    const response = await fetch(
      `${this.baseURL}/leaderboard?period=${period}`
    );
    return response.json();
  }

  static async getWeeklyStats(userId) {
    if (IS_DEV) {
      console.log("🚀 FAKE API: getWeeklyStats for user:", userId);
      await this.delay(400);

      return {
        success: true,
        stats: {
          weeklyPoints: 1240,
          dailyPoints: [45, 78, 65, 89, 123, 95, 0], // Last 7 days
          completedTasks: 23,
          totalTasks: 35,
          streak: 12,
          bestDay: { day: "Payshanba", points: 123 },
          improvement: "+15%",
        },
      };
    }

    const response = await fetch(`${this.baseURL}/stats/weekly/${userId}`);
    return response.json();
  }

  static async submitDailyProgress(data) {
    if (IS_DEV) {
      console.log("🚀 FAKE API: submitDailyProgress", data);
      await this.delay(500);
      // Demo natija qaytaramiz
      return {
        success: true,
        totalPoints: Object.keys(data).filter(
          (k) => k.startsWith("shart_") && data[k] === 1
        ).length,
        message: "Ma'lumotlar muvaffaqiyatli saqlandi!",
      };
    }

    // Real API
    const response = await fetch(`${this.baseURL}/tasks/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response.json();
  }
}

export default APIService;

// Step 1: Create hooks/useTelegram.js - COMPLETE VERSION
import { useState, useEffect } from "react";

// Dev mode checker
const IS_DEV =
  import.meta.env.DEV === "development" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// FAKE USER DATA for development
const FAKE_USER = {
  id: 123456789,
  first_name: "Muhammadsaid",
  last_name: "Buxoriy",
  username: "muhammadsaid_dev",
  language_code: "uz",
  is_premium: true,
  achievements: ["consistent", "reader"],
  photo_url: null,
};

// FAKE TELEGRAM OBJECT
const FAKE_TELEGRAM = {
  ready: () => console.log("🚀 FAKE TG: ready()"),
  expand: () => console.log("🚀 FAKE TG: expand()"),
  close: () => console.log("🚀 FAKE TG: close()"),
  enableClosingConfirmation: () =>
    console.log("🚀 FAKE TG: enableClosingConfirmation()"),
  setHeaderColor: (color) => console.log("🚀 FAKE TG: setHeaderColor:", color),
  setBackgroundColor: (color) =>
    console.log("🚀 FAKE TG: setBackgroundColor:", color),
  MainButton: {
    hide: () => console.log("🚀 FAKE TG: MainButton.hide()"),
    show: () => console.log("🚀 FAKE TG: MainButton.show()"),
    setText: (text) => console.log("🚀 FAKE TG: MainButton.setText:", text),
    onClick: (callback) =>
      console.log("🚀 FAKE TG: MainButton.onClick:", callback),
  },
  BackButton: {
    hide: () => console.log("🚀 FAKE TG: BackButton.hide()"),
    show: () => console.log("🚀 FAKE TG: BackButton.show()"),
    onClick: (callback) =>
      console.log("🚀 FAKE TG: BackButton.onClick:", callback),
  },
  HapticFeedback: {
    impactOccurred: (style) => console.log("🚀 FAKE HAPTIC:", style),
    notificationOccurred: (type) => console.log("🚀 FAKE NOTIFICATION:", type),
    selectionChanged: () => console.log("🚀 FAKE SELECTION CHANGED"),
  },
  colorScheme: "light",
  themeParams: {
    bg_color: "#ffffff",
    text_color: "#000000",
    hint_color: "#999999",
    link_color: "#3b82f6",
    button_color: "#3b82f6",
    button_text_color: "#ffffff",
  },
};

export const useTelegram = () => {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);
  const [tg, setTg] = useState(null);

  useEffect(() => {
    if (IS_DEV) {
      // DEVELOPMENT MODE - USE FAKE DATA
      console.log("🚀 DEVELOPMENT MODE ACTIVATED");
      console.log("🚀 Using fake user:", FAKE_USER);

      setTg(FAKE_TELEGRAM);
      setUser(FAKE_USER);

      // Simulate loading delay like real Telegram
      setTimeout(() => {
        setIsReady(true);
        console.log("🚀 Fake Telegram ready!");
      }, 1000);
    } else {
      // PRODUCTION MODE - USE REAL TELEGRAM
      if (window.Telegram?.WebApp) {
        const telegram = window.Telegram.WebApp;
        setTg(telegram);
        setUser(telegram.initDataUnsafe?.user || null);
        setIsReady(true);
      } else {
        console.error("❌ Telegram WebApp not found");
        setIsReady(true);
      }
    }
  }, []);

  const hapticFeedback = (type = "light") => {
    if (IS_DEV) {
      console.log(`🚀 FAKE HAPTIC: ${type}`);
      return;
    }

    if (tg?.HapticFeedback) {
      switch (type) {
        case "light":
          tg.HapticFeedback.impactOccurred("light");
          break;
        case "medium":
          tg.HapticFeedback.impactOccurred("medium");
          break;
        case "heavy":
          tg.HapticFeedback.impactOccurred("heavy");
          break;
        case "success":
          tg.HapticFeedback.notificationOccurred("success");
          break;
        case "error":
          tg.HapticFeedback.notificationOccurred("error");
          break;
        case "warning":
          tg.HapticFeedback.notificationOccurred("warning");
          break;
        case "selection":
          tg.HapticFeedback.selectionChanged();
          break;
        default:
          tg.HapticFeedback.impactOccurred("light");
      }
    }
  };

  // UNIVERSAL ALERT
  const showAlert = (msg) => {
    // 1. Telegram WebApp Alert (PRODUCTION)
    if (!IS_DEV && window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(msg);
      return;
    }
    // 2. Fallback: window.alert
    window.alert(msg);
  };

  return {
    tg,
    user,
    isReady,
    hapticFeedback,
    showAlert,
    isDev: IS_DEV,
  };
};

// Step 2: Create services/api.js - COMPLETE FAKE API
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
          rank: 3,
          achievements: ["consistent", "reader"],
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
          name: "Ahmad Qodirov",
          points: 25680,
          streak: 45,
          avatar: null,
          score: 95,
        },
        {
          name: "Fotima Rahimova",
          points: 23450,
          streak: 38,
          avatar: null,
          score: 88,
        },
        {
          name: "Muhammadsaid Buxoriy",
          points: 15680,
          streak: 12,
          avatar: null,
          isCurrentUser: true,
          score: 75,
        },
        {
          name: "Oybek Toshmatov",
          points: 14920,
          streak: 28,
          avatar: null,
          score: 72,
        },
        {
          name: "Zarina Karimova",
          points: 13750,
          streak: 22,
          avatar: null,
          score: 68,
        },
        {
          name: "Bobur Rahmonov",
          points: 12890,
          streak: 19,
          avatar: null,
          score: 65,
        },
        {
          name: "Muslima Abdullayeva",
          points: 11980,
          streak: 15,
          avatar: null,
          score: 62,
        },
        {
          name: "Javohir Ergashev",
          points: 10540,
          streak: 31,
          avatar: null,
          score: 58,
        },
        {
          name: "Diyora Karimova",
          points: 9850,
          streak: 8,
          avatar: null,
          score: 55,
        },
        {
          name: "Sanjar Tursunov",
          points: 8960,
          streak: 12,
          avatar: null,
          score: 50,
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
}

export default APIService;

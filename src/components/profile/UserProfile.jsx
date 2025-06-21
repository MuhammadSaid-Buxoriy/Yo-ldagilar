// components/profile/UserProfile.jsx - TO'LIQ OPTIMALLASHTIRILGAN VERSIYA
import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import APIService from "../../services/api";
import "./UserProfile.css";
import { ACHIEVEMENT_BADGES } from "../leaderboard/Leaderboard";
import MonthlyCalendar from "./MonthlyCalendar";
import { TASKS_CONFIG } from "../tasks/DailyTasks";


const UserProfile = ({ isOwnProfile = true, userId = null }) => {
  const { hapticFeedback, showAlert, tg } = useTelegram();
  const [stats, setStats] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [achievementsProgress, setAchievementsProgress] = useState([]);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Birinchi strategiya: getUserProfile va getUserStatistics parallel chaqirish
      try {
        const [statsResponse, userResponse] = await Promise.all([
          APIService.getUserStatistics(userId),
          APIService.getUserProfile(userId),
        ]);

        setStats(statsResponse);
        setProfileUser(userResponse.user);
        
        // ✅ Achievement progress'ni user obyektidan olish
        const achievementsData = userResponse.user?.achievementProgress || [];
        console.log('🏆 Achievement progress from user:', achievementsData);
        setAchievementsProgress(achievementsData);
        
      } catch (apiError) {
        console.warn("getUserProfile endpoint not available, trying fallback approach");
        
        // ✅ Fallback strategiya: Faqat getUserStatistics + manual achievement API
        const statsResponse = await APIService.getUserStatistics(userId);
        setStats(statsResponse);
        
        // Manual user data yaratish
        setProfileUser({
          id: userId,
          tg_id: userId,
          name: `User ${userId}`,
          photo_url: `https://ui-avatars.com/api/?name=U&size=100&background=4ECDC4&color=fff&bold=true`,
          achievements: []
        });
        
        // ✅ Alohida achievement endpoint sinash
        try {
          const achievementsData = await APIService.getUserAchievementsProgress(userId);
          console.log('🏆 Achievements progress from separate API:', achievementsData);
          setAchievementsProgress(achievementsData || []);
        } catch (achievementError) {
          console.warn("Achievements endpoint not available:", achievementError);
          setAchievementsProgress([]);
        }
      }
      
    } catch (error) {
      console.error("Failed to load user data:", error);
      setError(APIService.getErrorMessage(error));

      // Minimal fallback data faqat own profile uchun
      if (isOwnProfile && userId) {
        setStats({
          today: { completed: 0, pages_read: 0, distance_km: 0 },
          weekly: { dailyPoints: [0, 0, 0, 0, 0, 0, 0] },
          all_time: {
            total_points: 0,
            total_pages: 0,
            total_distance: 0,
            total_days: 0,
            perfectionist_streak: 0,
            early_bird_streak: 0,
          },
        });
        setProfileUser({
          id: userId,
          tg_id: userId,
          name: `User ${userId}`,
          photo_url: null,
          achievements: []
        });
        setAchievementsProgress([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Optimallashtirilgan Share funksiyasi
  const shareProfile = useCallback(async () => {
    if (!stats || !profileUser) {
      showAlert("❌ Ma'lumotlar yuklanmagan");
      return;
    }

    hapticFeedback("light");

    try {
      const dailyCompleted = stats.today?.completed || 0;
      const dailyPercent = Math.round((dailyCompleted / 10) * 100);
      const userName = getUserDisplayName(profileUser);
      const totalPoints = stats.all_time?.total_points || 0;
      const totalPages = stats.all_time?.total_pages || 0;
      const totalDistance = stats.all_time?.total_distance || 0;
      const totalDays = stats.all_time?.total_days || 0;

      
      const fullNameTitle = `${getUserDisplayName(profileUser)}ning Yo'ldagilar challenge natijalari`;


// Bugungi vazifalar listi
let taskList = "";
if (stats?.today?.tasks && Array.isArray(stats.today.tasks)) {
  taskList = TASKS_CONFIG.map((task, i) => {
    const doneTask = stats.today.tasks.find((t) => t.id === task.id);
    const done = doneTask?.completed ? "✅" : "❌";
    return `${i + 1}. ${task.title} - ${done}`;
  }).join("\n");
} else {
  // Agar ma'lumot bo'lmasa, barchasini ❌ deb ko'rsat
  taskList = TASKS_CONFIG.map((task, i) => `${i + 1}. ${task.title} - ❌`).join("\n");
}

const shareText =
  `🚀 ${fullNameTitle}:\n\n` +
  
  `📈 Bugungi unumdorlik: ${dailyPercent}% (${dailyCompleted}/10 vazifa)\n` +
  `📚 Bugun o'qilgan betlar: ${stats.today?.pages_read || 0} bet\n` +
  `🏃‍♂️ Bugun yugurgan masofa: ${stats.today?.distance_km || 0} km\n\n` +
  
  `Vazifalar:\n${taskList}\n\n` +
  
  `🏆 Umumiy yutuqlar:\n` +
  `⭐ Jami ball: ${totalPoints.toLocaleString()} ball\n` +
  `📖 Jami betlar: ${totalPages.toLocaleString()} bet\n` +
  `🏃‍♂️ Umumiy masofa: ${totalDistance} km\n` +
  `📅 Faol kunlar: ${totalDays} kun\n\n` +
  
  `🔥 Yo'lga chiq-Yo'ldan chiqma!\n\n` +
  
  `👉🏻 https://t.me/yuldagilar_bot`;


      // Share strategiyalari prioritet bo'yicha
      const shareStrategies = [
        {
          name: "Telegram WebApp",
          condition: () => tg?.switchInlineQuery,
          execute: async () => {
            await tg.switchInlineQuery(shareText);
            return true;
          }
        },
        {
          name: "Native Web Share",
          condition: () => navigator.share,
          execute: async () => {
            await navigator.share({
              title: `${userName}ning Yo'ldagilar challenge natijalari`,
              text: shareText,
            });
            return true;
          }
        },
        {
          name: "Telegram Share URL", 
          condition: () => tg?.openTelegramLink,
          execute: async () => {
            const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`;
            await tg.openTelegramLink(shareUrl);
            return true;
          }
        },
        {
          name: "Clipboard",
          condition: () => navigator.clipboard,
          execute: async () => {
            await navigator.clipboard.writeText(shareText);
            showAlert("✅ Matn nusxalandi! Endi istalgan joyga ulashing.");
            return true;
          }
        }
      ];

      for (const strategy of shareStrategies) {
        if (strategy.condition()) {
          try {
            console.log(`🔄 Trying ${strategy.name}...`);
            const success = await strategy.execute();
            if (success) {
              hapticFeedback("success");
              console.log(`✅ ${strategy.name} successful`);
              return;
            }
          } catch (error) {
            console.warn(`⚠️ ${strategy.name} failed:`, error);
          }
        }
      }

      // Fallback copy
      fallbackCopyToClipboard(shareText);

    } catch (error) {
      console.error("❌ Share error:", error);
      hapticFeedback("error");
      showAlert("❌ Ulashishda xatolik yuz berdi");
    }
  }, [stats, profileUser, isOwnProfile, hapticFeedback, showAlert, tg]);

  const fallbackCopyToClipboard = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        showAlert("✅ Matn nusxalandi!");
        hapticFeedback("success");
      } else {
        showAlert("❌ Nusxalashda xatolik");
      }
    } catch (error) {
      console.error("Fallback copy failed:", error);
      showAlert("❌ Nusxalashda xatolik");
    }
  };

  const getUserDisplayName = (user) => {
    if (!user) return "Unknown User";
    if (user.name) return user.name;
    if (user.first_name) {
      return user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name;
    }
    if (user.username) return `@${user.username}`;
    return `User ${user.id || user.tg_id}`;
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !profileUser) {
    return <ErrorState error={error} onRetry={loadUserData} />;
  }

  return (
    <div className="profile-container">
      <ProfileHeader
        user={profileUser}
        stats={stats}
        onShare={shareProfile}
        isOwnProfile={isOwnProfile}
      />

      <div className="profile-content">
        <StatisticsSection stats={stats} userId={userId} />
        <AchievementsSection
          stats={stats}
          achievementsProgress={achievementsProgress}
        />
      </div>
    </div>
  );
};

const ProfileHeader = ({ user, stats, onShare }) => {
  const getUserDisplayName = () => {
    if (!user) return "Unknown User";

    const name = user.name || user.first_name || user.username || `User ${user.id}`;

    if (user.achievements && user.achievements.length > 0) {
      return (
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {name}
          {user.achievements.slice(0, 2).map((badgeKey) => {
            const badge = ACHIEVEMENT_BADGES[badgeKey];
            if (!badge) return null;
            return (
              <span
                key={badgeKey}
                className="achievement-badge"
                style={{
                  marginLeft: 4,
                  color: badge.color,
                  display: "inline-flex",
                }}
                title={badge.title}
              >
                {badge.icon}
              </span>
            );
          })}
        </span>
      );
    }
    return name;
  };

  const getAvatarContent = () => {
    const photoUrl = user?.photo_url || user?.avatar_url;

    if (photoUrl && photoUrl.includes('http')) {
      return (
        <img
          src={photoUrl}
          alt={getUserDisplayName()}
          className="avatar-image profile-avatar"
          width={80}
          height={80}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      );
    }

    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
    const colorIndex = (user?.id || 0) % colors.length;

    return (
      <div
        className="avatar-placeholder avatar-placeholder-profile"
        style={{ backgroundColor: colors[colorIndex] }}
      >
        {getUserDisplayName()?.charAt(0) || "U"}
      </div>
    );
  };

  const getUserSubtitle = () => {
    if (!user) return "Unknown";
    if (user.username) return `@${user.username}`;
    return `User ID: ${user.id}`;
  };

  return (
    <div className="profile-header">
      <div className="profile-header-content">
        <button onClick={onShare} className="share-icon-button" title="Ulashish">
          <ShareIcon />
        </button>

        <div className="profile-info">
          <div className="avatar-section">
            <div className="avatar-display profile-display">
              {getAvatarContent()}
            </div>
          </div>

          <div className="user-info">
            <h1 className="user-name">{getUserDisplayName()}</h1>
            <p className="user-subtitle">{getUserSubtitle()}</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Umumiy ball"
            value={stats?.all_time?.total_points || 0}
            icon="star"
          />
          <StatCard
            label="O'qilgan betlar"
            value={stats?.all_time?.total_pages || 0}
            icon="book"
          />
          <StatCard
            label="Yugurgan masofa"
            value={`${stats?.all_time?.total_distance || 0} km`}
            icon="activity"
          />
          <StatCard
            label="Faol kunlar"
            value={stats?.all_time?.total_days || 0}
            icon="calendar"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">
      <StatIcon type={icon} />
    </div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

// ✅ StatisticsSection - Backend ma'lumotlarini to'g'ri ishlatish
const StatisticsSection = ({ stats, userId }) => {
  const dailyCompleted = stats?.today?.completed || 0;
  const dailyPercent = Math.round((dailyCompleted / 10) * 100);

  // ✅ Haftalik ma'lumotlarni to'g'ri olish
  const getCurrentWeekData = () => {
    const backendWeeklyPoints = stats?.weekly?.dailyPoints || [0, 0, 0, 0, 0, 0, 0];
    console.log('📅 Backend weekly data:', backendWeeklyPoints);
    return backendWeeklyPoints;
  };

  const days = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  const dailyCompletedFromWeek = getCurrentWeekData();

  // ✅ Haftalik unumdorlik hisoblash - barcha 7 kun bo'yicha o'rtacha
  const calculateWeeklyProductivity = () => {
    let totalPercentage = 0;
    
    // Barcha 7 kun uchun foizlarni yig'ish
    for (let i = 0; i < 7; i++) {
      const dayPoints = dailyCompletedFromWeek[i] || 0;
      const dayPercent = Math.round((dayPoints / 10) * 100);
      totalPercentage += dayPercent;
    }
    
    // Hafta unumdorligi = umumiy foiz / 7
    const weeklyProductivity = Math.round(totalPercentage / 7);
    
    console.log('📈 Weekly productivity:', {
      dailyPoints: dailyCompletedFromWeek,
      totalPercentage,
      weeklyProductivity
    });
    
    return weeklyProductivity;
  };

  const weeklyPercent = calculateWeeklyProductivity();

  const getProgressColor = (percent) => {
    if (percent >= 90) return "#16ce40";
    if (percent >= 80) return "#FFFF00";  
    if (percent >= 50) return "#FF8000";
    return "#dc2626";
  };

  // ✅ Haftalik chart data
  const weeklyData = days.map((day, i) => {
    const today = new Date();
    const currentUzbekDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    const isDayPassed = i <= currentUzbekDayIndex;
    const isFutureDay = i > currentUzbekDayIndex;
    
    let percent = 0;
    if (isDayPassed) {
      percent = Math.round((dailyCompletedFromWeek[i] / 10) * 100);
    }
    
    return {
      day,
      percent: percent,
      isPassed: isDayPassed,
      isFuture: isFutureDay,
      isToday: i === currentUzbekDayIndex,
      points: dailyCompletedFromWeek[i] || 0
    };
  });

  return (
    <div className="statistics-section">
      <h2 className="section-title">Statistika</h2>

      {/* Bugungi natija */}
      <div className="progress-card">
        <div className="progress-header">
          <h3 className="progress-title">Bugungi natija</h3>
          <span
            className="progress-percentage"
            style={{ color: getProgressColor(dailyPercent) }}
          >
            {dailyPercent}%
          </span>
        </div>

        <ProgressBar
          percentage={dailyPercent}
          color={getProgressColor(dailyPercent)}
        />

        <div className="progress-details">
          <div className="detail-item">
            <span className="detail-label">Bajarilgan vazifalar</span>
            <span className="detail-value">{dailyCompleted}/10</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">O'qilgan betlar</span>
            <span className="detail-value">{stats?.today?.pages_read || 0}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Yugurgan masofa</span>
            <span className="detail-value">{stats?.today?.distance_km || 0} km</span>
          </div>
        </div>
      </div>

      {/* Haftalik natija */}
      <div className="progress-card">
        <div className="progress-header">
          <h3 className="progress-title">Hafta unumdorligi</h3>
          <span
            className="progress-percentage"
            style={{ color: getProgressColor(weeklyPercent) }}
          >
            {weeklyPercent}%
          </span>
        </div>

        <ProgressBar
          percentage={weeklyPercent}
          color={getProgressColor(weeklyPercent)}
        />

        <div className="weekly-chart" style={{ minHeight: "170px" }}>
          {weeklyData.map((dayData) => (
            <div
              key={dayData.day}
              className={`chart-column ${
                dayData.isFuture ? 'chart-column-future' : ''
              } ${
                dayData.isToday ? 'chart-column-today' : ''
              }`}
              style={{ height: "100%" }}
            >
              {!dayData.isFuture && (
                <div
                  className="chart-bar"
                  style={{
                    height: `${Math.max(dayData.percent || 1, 3)}px`,
                    backgroundColor: getProgressColor(dayData.percent),
                    opacity: dayData.percent === 0 ? 0.3 : 1
                  }}
                  title={`${dayData.day}: ${dayData.points}/10 vazifa (${dayData.percent}%)`}
                ></div>
              )}
              
              {dayData.isFuture && (
                <div
                  className="chart-bar-placeholder"
                  style={{
                    height: "3px",
                    backgroundColor: "#e5e7eb",
                    opacity: 0.5
                  }}
                ></div>
              )}
              
              <span className={`chart-label ${dayData.isToday ? 'chart-label-today' : ''}`}>
                {dayData.day}
              </span>
              
              {!dayData.isFuture && (
                <span
                  className="chart-value"
                  style={{ 
                    color: getProgressColor(dayData.percent),
                    opacity: dayData.percent === 0 ? 0.6 : 1
                  }}
                >
                  {dayData.percent}%
                </span>
              )}
              
              {dayData.isFuture && (
                <span className="chart-value-future">-</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Oylik kalendar */}
      <MonthlyCalendar userId={userId} stats={stats} />
    </div>
  );
};

const ProgressBar = ({ percentage, color }) => (
  <div className="progress-bar">
    <div
      className="progress-fill"
      style={{
        width: `${percentage}%`,
        backgroundColor: color,
      }}
    ></div>
  </div>
);

// ✅ AchievementsSection - Backend achievement progress bilan
const AchievementsSection = ({ stats, achievementsProgress = [] }) => {
  const achievementMap = new Map();
  achievementsProgress.forEach((a) => achievementMap.set(a.id, a));
  
  const getAchievementCurrent = (achievementId, fallbackValue) => {
    const achievement = achievementMap.get(achievementId);
    if (achievement && typeof achievement.current === 'number') {
      return achievement.current;
    }
    return fallbackValue || 0;
  };
  
  const achievements = [
    {
      id: "consistent",
      title: "Faol",
      description: "21 kun faol bo'lish",
      target: 21,
      current: getAchievementCurrent("consistent", stats?.all_time?.total_days),
      icon: "zap",
      color: "#ef4444",
    },
    {
      id: "reader", 
      title: "Kitobxon",
      description: "6,000 bet kitob o'qish",
      target: 6000,
      current: getAchievementCurrent("reader", stats?.all_time?.total_pages),
      icon: "book",
      color: "#3b82f6",
    },
    {
      id: "athlete",
      title: "Sportchi", 
      description: "100 km yugurish",
      target: 100,
      current: getAchievementCurrent("athlete", stats?.all_time?.total_distance),
      icon: "activity",
      color: "#10b981",
    },
    {
      id: "early_bird",
      title: "Uyg'oq",
      description: "21 kun ketma-ket erta turish",
      target: 21,
      current: getAchievementCurrent("early_bird", stats?.all_time?.early_bird_streak),
      icon: "moon",
      color: "#8b5cf6",
    },
    {
      id: "perfectionist",
      title: "Olov",
      description: "21 kun ketma-ket 10/10 vazifa",
      target: 21,
      current: getAchievementCurrent("perfectionist", stats?.all_time?.perfectionist_streak),
      icon: "fire",
      color: "#f59e0b",
    },
  ];

  return (
    <div className="achievements-section">
      <h2 className="section-title">Unvonlar</h2>

      <div className="achievements-grid">
        {achievements.map((achievement) => {
          const progress = Math.min((achievement.current / achievement.target) * 100, 100);
          const isCompleted = progress >= 100;

          return (
            <div
              key={achievement.id}
              className={`achievement-card ${isCompleted ? "completed" : ""}`}
            >
              <div
                className="achievement-icon"
                style={{ color: achievement.color }}
              >
                <StatIcon type={achievement.icon} />
              </div>

              <div className="achievement-content">
                <div className="achievement-header">
                  <h4 className="achievement-title">
                    {achievement.title}
                    {isCompleted && (
                      <span className="completed-badge">✓ Bajarildi</span>
                    )}
                  </h4>
                </div>
                <p className="achievement-description">
                  {achievement.description}
                </p>

                <div className="achievement-progress">
                  <div className="achievement-progress-bar">
                    <div
                      className="achievement-progress-fill"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: achievement.color,
                      }}
                    ></div>
                  </div>
                  <span className="achievement-progress-text">
                    {achievement.current.toLocaleString()} /{" "}
                    {achievement.target.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Icon va boshqa yordamchi komponentlar
const StatIcon = ({ type }) => {
  const icons = {
    star: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
    book: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    activity: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2v6h.01L8 14.01V22h8v-7.99L17.99 8H18V2" />
        <path d="M8 22v-7" />
        <path d="M16 22v-7" />
      </svg>
    ),
    calendar: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    zap: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 13 10 13 2" />
      </svg>
    ),
    moon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    fire: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  };

  return icons[type] || icons.star;
};

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const LoadingSkeleton = () => (
  <div className="profile-container">
    <div className="profile-header">
      <div className="loading-skeleton">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-stats-container">
          <div className="skeleton-stats"></div>
          <div className="skeleton-stats"></div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="error-state">
    <div className="error-content">
      <div className="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="error-title">Ma'lumot yuklanmadi</h3>
      <p className="error-message">{error}</p>
      <button onClick={onRetry} className="retry-button">
        Qayta urinish
      </button>
    </div>
  </div>
);

export default UserProfile;
// components/profile/UserProfile.jsx - API DATA FIRST VERSION + Ulashish tuzatilgan
import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import APIService from "../../services/api";
import "./UserProfile.css";
import { ACHIEVEMENT_BADGES } from "../leaderboard/Leaderboard";

const UserProfile = ({ isOwnProfile = true, userId = null }) => {
  const { hapticFeedback, showAlert, tg } = useTelegram();
  const [stats, setStats] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch user profile and stats from API
      const [statsResponse, userResponse] = await Promise.all([
        APIService.getUserStatistics(userId),
        APIService.getUserProfile(userId),
      ]);

      setStats(statsResponse);
      setProfileUser(userResponse.user);
    } catch (error) {
      console.error("Failed to load user data:", error);
      setError(APIService.getErrorMessage(error));

      // Only set fallback data if it's own profile and we have telegram data
      if (isOwnProfile && userId) {
        console.warn("Using minimal fallback data structure");
        setStats({
          today: { completed: 0, pages_read: 0, distance_km: 0 },
          weekly: { dailyPoints: [0, 0, 0, 0, 0, 0, 0] },
          all_time: {
            total_points: 0,
            total_pages: 0,
            total_distance: 0,
            total_days: 0,
          },
        });
        // Don't set profileUser - let it remain null to show error
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ TUZATILDI: Ulashish funksiyasi
  const shareProfile = useCallback(async () => {
    if (!stats || !profileUser) {
      showAlert("❌ Ma'lumotlar yuklanmagan");
      return;
    }

    hapticFeedback("light");

    try {
      // ✅ TUZATILDI: To'g'ri bot link formati
      const botUsername = "yuldagilar_bot"; // Bot username (@ belgisisiz)
      const userIdParam = profileUser.id || profileUser.tg_id;

      // ✅ To'g'ri start parameter formati
      const shareLink = isOwnProfile
        ? `https://t.me/${botUsername}/start?startapp=self`
        : `https://t.me/${botUsername}/start?startapp=profile_${userIdParam}`;

      console.log("🔗 Share link:", shareLink);

      // ✅ Ma'lumotlarni xavfsiz olish
      const dailyCompleted = stats.today?.completed || 0;
      const dailyPercent = Math.round((dailyCompleted / 10) * 100);
      const userName = getUserDisplayName(profileUser);
      const totalPoints = stats.all_time?.total_points || 0;
      const totalPages = stats.all_time?.total_pages || 0;
      const totalDistance = stats.all_time?.total_distance || 0;
      const totalDays = stats.all_time?.total_days || 0;

      // ✅ TUZATILDI: Ulashish matni
      const shareText = `🎯 ${
        isOwnProfile ? "Mening" : `${userName}ning`
      } Yoldagilar natijalarim:

📊 Bugungi unumdorlik: ${dailyPercent}% (${dailyCompleted}/10)
📚 Bugun o'qigan: ${stats.today?.pages_read || 0} bet
🏃‍♂️ Bugun yugurgan: ${stats.today?.distance_km || 0} km

🏆 Umumiy natijalar:
⭐ Jami ball: ${totalPoints}
📖 Jami o'qigan: ${totalPages} bet  
🏃‍♂️ Jami masofa: ${totalDistance} km
📅 Faol kunlar: ${totalDays}

💪 Yoldagilar jamoasida rivojlanish!

${shareLink}`;

      console.log(
        "📝 Share text prepared:",
        shareText.substring(0, 100) + "..."
      );

      // ✅ TUZATILDI: Telegram sharing usullari
      let shareSuccess = false;

      // 1-usul: Telegram WebApp sharing (eng yaxshi)
      if (tg?.switchInlineQuery) {
        try {
          console.log("🔄 Trying Telegram switchInlineQuery...");
          await tg.switchInlineQuery(shareText);
          shareSuccess = true;
          hapticFeedback("success");
          console.log("✅ Telegram switchInlineQuery successful");
        } catch (error) {
          console.warn("⚠️ switchInlineQuery failed:", error);
        }
      }

      // 2-usul: Telegram share URL (fallback)
      if (!shareSuccess && tg?.openTelegramLink) {
        try {
          console.log("🔄 Trying Telegram openTelegramLink...");
          const telegramShareUrl = `https://t.me/share/url?text=${encodeURIComponent(
            shareText
          )}`;
          await tg.openTelegramLink(telegramShareUrl);
          shareSuccess = true;
          hapticFeedback("success");
          console.log("✅ Telegram openTelegramLink successful");
        } catch (error) {
          console.warn("⚠️ openTelegramLink failed:", error);
        }
      }

      // 3-usul: Native Web Share API
      if (!shareSuccess && navigator.share) {
        try {
          console.log("🔄 Trying Web Share API...");
          await navigator.share({
            title: `${userName}ning Yoldagilar natijasi`,
            text: shareText,
            url: shareLink,
          });
          shareSuccess = true;
          hapticFeedback("success");
          console.log("✅ Web Share API successful");
        } catch (error) {
          console.warn("⚠️ Web Share API failed:", error);
        }
      }

      // 4-usul: Clipboard (oxirgi variant)
      if (!shareSuccess) {
        try {
          console.log("🔄 Trying clipboard copy...");
          await navigator.clipboard.writeText(shareText);
          showAlert("✅ Matn nusxalandi! Endi istalgan joyga ulashing.");
          hapticFeedback("success");
          console.log("✅ Clipboard copy successful");
        } catch (error) {
          console.warn("⚠️ Clipboard failed:", error);
          // Oxirgi variant - text area orqali
          fallbackCopyToClipboard(shareText);
        }
      }
    } catch (error) {
      console.error("❌ Share error:", error);
      hapticFeedback("error");
      showAlert("❌ Ulashishda xatolik yuz berdi");
    }
  }, [stats, profileUser, isOwnProfile, hapticFeedback, showAlert, tg]);

  // ✅ YANGI: Fallback copy funksiyasi
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

  // ✅ User display name helper
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
        onUserUpdate={setProfileUser}
      />

      <div className="profile-content">
        <StatisticsSection stats={stats} />
        <AchievementsSection stats={stats} />
      </div>
    </div>
  );
};

const ProfileHeader = ({ user, stats, onShare }) => {
  // ✅ User display name helper (lokalni)
  const getUserDisplayName = () => {
    if (!user) return "Unknown User";

    const name =
      user.name || user.first_name || user.username || `User ${user.id}`;

    // Add achievement badges if available
    if (user.achievements && user.achievements.length > 0) {
      return (
        <span
          className="user-display-name-badge-wrap"
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
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
                  verticalAlign: "middle",
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
    // Use photo_url from API user data only
    const photoUrl = user?.photo_url || user?.avatar_url;

    if (photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={getUserDisplayName()}
          className="avatar-image profile-avatar"
          width={80}
          height={80}
          onError={(e) => {
            // If image fails to load, hide it and show placeholder
            e.target.style.display = "none";
          }}
        />
      );
    }

    // Generate placeholder based on API user data
    const colors = [
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];
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

    // Show username from API data, fallback to ID
    if (user.username) {
      return `@${user.username}`;
    }
    return `User ID: ${user.id}`;
  };

  return (
    <div className="profile-header">
      <div className="profile-header-content">
        {/* ✅ TUZATILDI: Share tugmasi */}
        <button
          onClick={onShare}
          className="share-icon-button"
          title="Ulashish"
        >
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

// StatCard component
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

const StatisticsSection = ({ stats }) => {
  const dailyCompleted = stats?.today?.completed || 0;
  const dailyPercent = Math.round((dailyCompleted / 10) * 100);

  const days = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  const dailyCompletedFromWeek = stats?.weekly?.dailyPoints || [
    0, 0, 0, 0, 0, 0, 0,
  ];

  const weeklyCompleted =
    stats?.weekly?.dailyPoints?.reduce((sum, val) => sum + val, 0) || 0;
  const weeklyPercent = Math.round((weeklyCompleted / 70) * 100);

  const getProgressColor = (percent) => {
    if (percent >= 90) return "#16ce40";
    if (percent >= 80) return "#FFFF00";
    if (percent >= 50) return "#FF8000";
    return "#dc2626";
  };

  const weeklyData = days.map((day, i) => ({
    day,
    percent: Math.round((dailyCompletedFromWeek[i] / 10) * 100),
  }));

  return (
    <div className="statistics-section">
      <h2 className="section-title">Statistika</h2>

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
            <span className="detail-value">
              {stats?.today?.pages_read || 0}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Yugurgan masofa</span>
            <span className="detail-value">
              {stats?.today?.distance_km || 0} km
            </span>
          </div>
        </div>
      </div>

      <div className="progress-card">
        <div className="progress-header">
          <h3 className="progress-title">Haftalik natija</h3>
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
          {weeklyData.map((day) => (
            <div
              key={day.day}
              className="chart-column"
              style={{ height: "100%" }}
            >
              <div
                className="chart-bar"
                style={{
                  height: `${day.percent || 1}px`,
                  backgroundColor: getProgressColor(day.percent),
                }}
              ></div>
              <span className="chart-label">{day.day}</span>
              <span
                className="chart-value"
                style={{ color: getProgressColor(day.percent) }}
              >
                {day.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
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

const AchievementsSection = ({ stats }) => {
  const achievements = [
    {
      id: "consistent",
      title: "Doimiy faol",
      description: "30 kun har kuni faol",
      target: 30,
      current: stats?.all_time?.total_days || 0,
      icon: "flame",
      color: "#ef4444",
    },
    {
      id: "reader",
      title: "Kitobxon",
      description: "20,000 bet kitob o'qish",
      target: 20000,
      current: stats?.all_time?.total_pages || 0,
      icon: "book",
      color: "#3b82f6",
    },
    {
      id: "athlete",
      title: "Sportchi",
      description: "100 km yugurish",
      target: 100,
      current: stats?.all_time?.total_distance || 0,
      icon: "activity",
      color: "#10b981",
    },
    {
      id: "perfectionist",
      title: "Olov",
      description: "Ketma-ket 30 kun 100%",
      target: 30,
      current: 0,
      icon: "fire",
      color: "#f59e0b",
    },
  ];

  return (
    <div className="achievements-section">
      <h2 className="section-title">Yutuqlar</h2>

      <div className="achievements-grid">
        {achievements.map((achievement) => {
          const progress = Math.min(
            (achievement.current / achievement.target) * 100,
            100
          );
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

// Icon Components
const StatIcon = ({ type }) => {
  const icons = {
    star: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
    book: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    activity: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 2v6h.01L8 14.01V22h8v-7.99L17.99 8H18V2" />
        <path d="M8 22v-7" />
        <path d="M16 22v-7" />
      </svg>
    ),
    calendar: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    flame: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
    fire: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
  };

  return icons[type] || icons.star;
};

// ✅ TUZATILDI: Share icon
const ShareIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

// Loading & Error States
const LoadingSkeleton = () => (
  <div className="profile-container">
    <div className="profile-header">
      <div className="loading-skeleton">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-stats"></div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="error-state">
    <div className="error-content">
      <div className="error-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
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

// components/leaderboard/Leaderboard.jsx - Mukammal UI versiya
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import UserProfile from "../profile/UserProfile";
import APIService from "../../services/api";
import "./Leaderboard.css";
import { useAuth } from "../context/AuthContext";

/**
 * Format score value based on type
 */
const formatScoreValue = (score, scoreLabel) => {
  if (!score && score !== 0) return "0";

  if (scoreLabel === "km") {
    // Distance: 2 decimal places, but hide .00
    const formatted = parseFloat(score).toFixed(2);
    return formatted.endsWith(".00") ? parseInt(score).toString() : formatted;
  }

  // Ball va bet: integer
  return Math.floor(score).toString();
};

const PERIOD_OPTIONS = [
  {
    value: "all",
    label: "Barcha",
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    value: "weekly",
    label: "Hafta",
    icon: (
      <svg
        width="12"
        height="12"
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
  },
  {
    value: "daily",
    label: "Bugun",
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
];

const TYPE_OPTIONS = [
  {
    value: "overall",
    label: "Ball",
    color: "#3b82f6",
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
  },
  {
    value: "reading",
    label: "Kitob",
    color: "#10b981",
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    value: "distance",
    label: "Sport",
    color: "#f59e0b",
    icon: (
      <svg
        width="12"
        height="12"
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
  },
];

export const ACHIEVEMENT_BADGES = {
  consistent: {
    icon: (
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 13 10 13 2" />
      </svg>
    ),
    color: "#ef4444",
    title: "Doimiy faol",
  },
  reader: {
    icon: (
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    color: "#3b82f6",
    title: "Kitobxon",
  },
  athlete: {
    icon: (
      <svg
        width="8"
        height="8"
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
    color: "#10b981",
    title: "Sportchi",
  },
  perfectionist: {
    icon: (
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
    color: "#f59e0b",
    title: "Olov",
  },
  early_bird: {
    icon: (
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    color: "#8b5cf6",
    title: "Uyg'oq",
  },
};

const Leaderboard = () => {
  const { hapticFeedback } = useTelegram();
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedType, setSelectedType] = useState("overall");
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { user } = useAuth();

  // Real-time refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing && !selectedUserId) {
        loadLeaderboard(true);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [loading, refreshing, selectedPeriod, selectedType, selectedUserId]);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod, selectedType]);

  const loadLeaderboard = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      try {
        // ✅ ASOSIY TUZATISH: To'g'ri parametrlar bilan API call
        const leaderboardParams = {
          period: selectedPeriod,
          type: selectedType,
          limit: 100,
        };

        // Add current user ID if available
        if (user?.id) {
          leaderboardParams.tg_id = user.id;
        }

        console.log("🔍 Leaderboard request params:", leaderboardParams);

        const response = await APIService.getLeaderboard(leaderboardParams);

        // ✅ DEBUG: Response'ni tekshirish
        console.log("📥 Leaderboard response received:", {
          success: response.success,
          period: response.period,
          type: response.type,
          leaderboard_count: response.leaderboard?.length || 0,
          total_participants: response.total_participants,
          current_user: response.current_user
            ? {
                rank: response.current_user.rank,
                score: response.current_user.score,
                name: response.current_user.name,
              }
            : null,
          query_info: response.query_info,
          top_3_scores:
            response.leaderboard?.slice(0, 3).map((u) => ({
              name: u.name,
              score: u.score,
              rank: u.rank,
            })) || [],
        });

        // ✅ Validate response structure
        if (!response.success) {
          throw new Error(response.message || "API returned success: false");
        }

        setLeaderboardData(response);

        if (!silent) {
          hapticFeedback("light");
        }

        // ✅ Additional debug info
        console.log("🎯 Score calculation check:", {
          selected_period: selectedPeriod,
          selected_type: selectedType,
          sample_user_scores:
            response.leaderboard?.slice(0, 3).map((user) => ({
              name: user.name,
              displayed_score: user.score,
              all_scores: {
                total_points: user.total_points,
                total_pages: user.total_pages,
                total_distance: user.total_distance,
                weekly_points: user.weekly_points,
                weekly_pages: user.weekly_pages,
                weekly_distance: user.weekly_distance,
                daily_points: user.daily_points,
                daily_pages: user.daily_pages,
                daily_distance: user.daily_distance,
              },
            })) || [],
        });
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        console.error("Error details:", {
          message: error.message,
          selectedPeriod,
          selectedType,
          apiBaseUrl: APIService.baseURL,
        });
        setError(error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedPeriod, selectedType, hapticFeedback, user?.id]
  );

  const handlePeriodChange = useCallback(
    (period) => {
      hapticFeedback("light");
      setSelectedPeriod(period);
    },
    [hapticFeedback]
  );

  const handleTypeChange = useCallback(
    (type) => {
      hapticFeedback("light");
      setSelectedType(type);
    },
    [hapticFeedback]
  );

  const handleUserClick = useCallback(
    (userId) => {
      hapticFeedback("medium");
      setSelectedUserId(userId);
    },
    [hapticFeedback]
  );

  const handleBackFromProfile = useCallback(() => {
    hapticFeedback("light");
    setSelectedUserId(null);
  }, [hapticFeedback]);

  const manualRefresh = useCallback(() => {
    hapticFeedback("medium");
    loadLeaderboard();
  }, [loadLeaderboard, hapticFeedback]);

  const selectedTypeConfig = useMemo(
    () => TYPE_OPTIONS.find((type) => type.value === selectedType),
    [selectedType]
  );

  const getScoreLabel = useCallback(() => {
    switch (selectedType) {
      case "reading":
        return "bet";
      case "distance":
        return "km";
      default:
        return "ball";
    }
  }, [selectedType]);

  const testAllFilters = useCallback(async () => {
    console.log("🧪 Testing all filter combinations...");

    const periods = ["all", "weekly", "daily"];
    const types = ["overall", "reading", "distance"];

    for (const period of periods) {
      for (const type of types) {
        try {
          console.log(`\n🔍 Testing: ${period} - ${type}`);
          const response = await APIService.getLeaderboard({
            period,
            type,
            limit: 10,
            tg_id: user?.id,
          });

          console.log(`✅ Success: ${period}-${type}:`, {
            count: response.leaderboard?.length || 0,
            top_score: response.leaderboard?.[0]?.score || 0,
            query_info: response.query_info,
          });
        } catch (error) {
          console.error(`❌ Failed: ${period}-${type}:`, error.message);
        }

        // Delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }, [user?.id]);

  const currentUser = useMemo(
    () => leaderboardData?.leaderboard?.find((item) => item.tg_id === user?.id),
    [leaderboardData, user?.id]
  );

  if (selectedUserId) {
    return (
      <div className="leaderboard-container" style={{ paddingBottom: "40px" }}>
        <div className="profile-header-wrapper">
          <button onClick={handleBackFromProfile} className="back-button">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Orqaga
          </button>
        </div>
        <UserProfile isOwnProfile={false} userId={selectedUserId} />
      </div>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="leaderboard-container">
      <LeaderboardHeader
        leaderboardData={leaderboardData}
        onRefresh={manualRefresh}
        refreshing={refreshing}
      />
      <FiltersSection
        selectedPeriod={selectedPeriod}
        selectedType={selectedType}
        onPeriodChange={handlePeriodChange}
        onTypeChange={handleTypeChange}
      />
      <div className="leaderboard-content">
        {currentUser && (
          <CurrentUserPosition
            user={currentUser}
            scoreLabel={getScoreLabel()}
            typeConfig={selectedTypeConfig}
            onClick={() => handleUserClick(currentUser.tg_id)}
          />
        )}
        <LeaderboardList
          leaderboardData={leaderboardData}
          currentUserId={user?.id}
          scoreLabel={getScoreLabel()}
          error={error}
          onRetry={loadLeaderboard}
          typeConfig={selectedTypeConfig}
          onUserClick={handleUserClick}
        />
      </div>

      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            zIndex: 1000,
          }}
        >
          <button
            onClick={testAllFilters}
            style={{
              background: "#007bff",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            Test Filters
          </button>
        </div>
      )}
    </div>
  );
};

const LeaderboardHeader = ({ leaderboardData, onRefresh, refreshing }) => (
  <div className="leaderboard-header">
    <div className="header-content">
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className={`refresh-button ${refreshing ? "refreshing" : ""}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={refreshing ? "spinning" : ""}
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      </button>

      <div className="bot-section">
        <div className="bot-avatar">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        </div>
        <h1 className="bot-title">Yo'ldagilar</h1>
        <p className="bot-subtitle">Yo'lga chiq - Yo'ldan chiqma!</p>

        <div className="participants-count">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{leaderboardData?.total_participants || 0} ishtirokchi</span>
        </div>
      </div>
    </div>
  </div>
);

const FiltersSection = ({
  selectedPeriod,
  selectedType,
  onPeriodChange,
  onTypeChange,
}) => (
  <div className="filters-section">
    <div className="filter-row">
      <span className="filter-label">Vaqt:</span>
      <div className="filter-options">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onPeriodChange(option.value)}
            className={`filter-option ${
              selectedPeriod === option.value ? "active" : ""
            }`}
          >
            <span className="filter-icon">{option.icon}</span>
            <span className="filter-text">{option.label}</span>
          </button>
        ))}
      </div>
    </div>

    <div className="filter-row">
      <span className="filter-label">Tur:</span>
      <div className="filter-options">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onTypeChange(option.value)}
            className={`filter-option ${
              selectedType === option.value ? "active" : ""
            }`}
            style={
              selectedType === option.value
                ? {
                    borderColor: option.color,
                    backgroundColor: `${option.color}08`,
                    color: option.color,
                  }
                : {}
            }
          >
            <span className="filter-icon" style={{ color: option.color }}>
              {option.icon}
            </span>
            <span className="filter-text">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const CurrentUserPosition = ({ user, scoreLabel, onClick }) => (
  <div className="current-user-section">
    <button onClick={onClick} className="current-user-card">
      <div className="current-user-badge">
        <span>Sizning o'rningiz</span>
      </div>

      <div className="current-user-content">
        <div className="current-user-info">
          <UserAvatar user={user} size="medium" />
          <div className="current-user-data">
            <div className="current-user-name">{user.name}</div>
            <div className="current-user-rank">#{user.rank} o'rin</div>
          </div>
        </div>

        <div className="current-user-score">
          <div className="current-user-score-value">
            {formatScoreValue(user.score, scoreLabel)}
          </div>
          <div className="current-user-score-label">{scoreLabel}</div>
        </div>
      </div>
    </button>
  </div>
);

const LeaderboardList = ({
  leaderboardData,
  currentUserId,
  scoreLabel,
  error,
  onRetry,
  typeConfig,
  onUserClick,
}) => {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!leaderboardData?.leaderboard?.length) {
    return <EmptyState />;
  }

  return (
    <div className="leaderboard-list-section">
      <div className="section-header">
        <h2 className="section-title">Reyting Jadvali</h2>
      </div>

      <div className="leaderboard-list">
        {leaderboardData.leaderboard.map((participant, index) => (
          <LeaderboardItem
            key={participant.tg_id}
            participant={participant}
            index={index}
            scoreLabel={scoreLabel}
            isCurrentUser={participant.tg_id === currentUserId}
            typeConfig={typeConfig}
            onClick={() => onUserClick(participant.tg_id)}
          />
        ))}
      </div>
    </div>
  );
};

const LeaderboardItem = ({
  participant,
  index,
  scoreLabel,
  isCurrentUser,
  typeConfig,
  onClick,
}) => {
  const isTopThree = index < 3;
  const isGold = index === 0;
  const isSilver = index === 1;
  const isBronze = index === 2;
  const isWinner = index === 0;

  const getRankContent = () => {
    if (isWinner) {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    }

    if (index === 1) {
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    }

    if (index === 2) {
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.61 2.14a2 2 0 0 1 .13 2.2L16.79 15" />
          <path d="M11 12 5.12 2.2" />
          <path d="m13 12 5.88-9.8" />
          <path d="M8 7h8" />
          <circle cx="12" cy="17" r="5" />
          <path d="m9 22 3-3 3 3" />
          <path d="M9 19h6" />
        </svg>
      );
    }

    return <span className="rank-number">{participant.rank}</span>;
  };

  console.log(typeConfig);

  return (
    <button
      onClick={onClick}
      className={`participant-card ${isCurrentUser ? "current-user" : ""} ${
        isGold ? "gold" : isSilver ? "silver" : isBronze ? "bronze" : ""
      }`}
    >
      <div className="participant-content">
        <div
          className={`participant-rank ${
            isGold ? "gold" : isSilver ? "silver" : isBronze ? "bronze" : ""
          }`}
        >
          {getRankContent()}
        </div>
        <UserAvatar user={participant} size="small" />

        <div className="participant-info">
          <div className="participant-name">
            {participant.name}
            {isCurrentUser && <span className="you-badge">Sen</span>}
            {participant.achievements &&
              participant.achievements.length > 0 && (
                <div className="achievement-badges">
                  {participant.achievements.slice(0, 2).map((achievement) => {
                    const badge = ACHIEVEMENT_BADGES[achievement];
                    if (!badge) return null;

                    return (
                      <span
                        key={achievement}
                        className="achievement-badge"
                        style={{
                          backgroundColor: `${badge.color}15`,
                          color: badge.color,
                        }}
                        title={badge.title}
                      >
                        {badge.icon}
                      </span>
                    );
                  })}
                </div>
              )}
          </div>

          <div className="participant-details participant-details-leaderboard">
            <span className="detail-item detail-item-leaderboard">
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              {participant.total_points || 0}
            </span>
            <span className="detail-item detail-item-leaderboard">
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              {participant.total_pages || 0}
            </span>
            <span className="detail-item detail-item-leaderboard">
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 2v6h.01L8 14.01V22h8v-7.99L17.99 8H18V2" />
                <path d="M8 22v-7" />
                <path d="M16 22v-7" />
              </svg>
              {participant.total_distance || 0}
            </span>
          </div>
        </div>
        <div className="participant-score">
          <div className="participant-score-value">
            {formatScoreValue(participant.score, scoreLabel)}
          </div>
          <div className="participant-score-label">{scoreLabel}</div>
        </div>
      </div>
    </button>
  );
};

const UserAvatar = ({ user, size = "small" }) => {
  const sizeClasses = {
    small: "avatar-small",
    medium: "avatar-medium",
    large: "avatar-large",
  };

  const getAvatarContent = () => {
    if (user?.photo_url) {
      return (
        <img
          src={user.photo_url}
          alt={user.name || "User"}
          className="avatar-image"
        />
      );
    }

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
    const colorIndex = (user?.tg_id || 0) % colors.length;

    return (
      <div
        className="avatar-placeholder"
        style={{ backgroundColor: colors[colorIndex] }}
      >
        {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
      </div>
    );
  };

  return (
    <div className={`user-avatar ${sizeClasses[size]}`}>
      {getAvatarContent()}
    </div>
  );
};

const LoadingState = () => (
  <div className="loading-state">
    <div className="loading-content">
      <div className="loading-spinner"></div>
      <h3 className="loading-title">Reyting yuklanmoqda...</h3>
      <p className="loading-subtitle">Eng so'nggi ma'lumotlar olinmoqda</p>
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
        Qayta urinish
      </button>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-content">
      <div className="empty-icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 11l3 3l8-8" />
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c1.51 0 2.93.37 4.18 1.03" />
        </svg>
      </div>
      <h3 className="empty-title">Ma'lumot topilmadi</h3>
      <p className="empty-text">Hali hech kim ro'yxatga kirmagan</p>
    </div>
  </div>
);

export default Leaderboard;

// src/App.jsx - MAJBURIY DARK MODE VERSION
import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "./hooks/useTelegram";
import AuthCheck from "./components/auth/AuthCheck";
import UserProfile from "./components/profile/UserProfile";
import DailyTasks from "./components/tasks/DailyTasks";
import Leaderboard from "./components/leaderboard/Leaderboard";
import "./App.css";
import { useAuth } from "./components/context/AuthContext";

const NAVIGATION_ITEMS = [
  {
    id: "profile",
    label: "Profil",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Vazifalar",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 11l3 3l8-8" />
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c1.51 0 2.93.37 4.18 1.03" />
      </svg>
    ),
  },
  {
    id: "leaderboard",
    label: "Reyting",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 9h6V4H6v5zM12 9h6v7h-6V9zM6 16h6v4H6v-4z" />
      </svg>
    ),
  },
];

function App() {
  const { tg, isReady, hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState("profile");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { user, loading, error } = useAuth();

  console.log("ANA MAN :", user);

  // ✅ MAJBURIY DARK MODE - GLOBAL SETUP
  useEffect(() => {
    console.log('🌙 Forcing dark mode globally...');
    
    // Force dark mode immediately
    const forceDarkMode = () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.style.backgroundColor = '#111827';
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#f9fafb';
      
      // Force dark mode in meta tag
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }
      metaTheme.content = '#1f2937';
      
      // Disable light mode media queries
      const style = document.createElement('style');
      style.innerHTML = `
        * { color-scheme: dark !important; }
        html, body, #root { 
          background-color: #111827 !important; 
          color: #f9fafb !important; 
        }
      `;
      document.head.appendChild(style);
      
      console.log('✅ Dark mode forced successfully');
    };

    // Apply immediately
    forceDarkMode();

    // Apply on any theme change attempt
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-theme' || 
             mutation.attributeName === 'class')) {
          forceDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Mobile viewport setup
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);

    return () => window.removeEventListener("resize", setVH);
  }, []);

  useEffect(() => {
    if (tg) {
      console.log('🌙 Setting up Telegram with dark mode...');
      
      tg.ready();
      
      if (tg.requestViewport) {
        tg.requestViewport({ is_expanded: true }); // 💥 FULLSCREEN mode
      }
  
      tg.expand();
      tg.MainButton.hide();
      tg.BackButton.hide();
      tg.enableClosingConfirmation();
      
      // ✅ FORCE DARK MODE COLORS IN TELEGRAM
      tg.setHeaderColor("#1f2937"); // Dark header
      tg.setBackgroundColor("#111827"); // Dark background
      
      // ✅ ADDITIONAL DARK MODE ENFORCEMENT
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#f9fafb';
      
      // Override Telegram's theme detection
      if (tg.themeParams) {
        console.log('🌙 Overriding Telegram theme params');
        tg.themeParams.bg_color = '#111827';
        tg.themeParams.text_color = '#f9fafb';
        tg.themeParams.hint_color = '#9ca3af';
        tg.themeParams.link_color = '#60a5fa';
        tg.themeParams.button_color = '#60a5fa';
        tg.themeParams.button_text_color = '#ffffff';
      }

      console.log('✅ Telegram dark mode setup complete');
    }
  }, [tg]);

  // ✅ PREVENT LIGHT MODE ON MEDIA QUERY CHANGE
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleChange = (e) => {
      if (e.matches) {
        console.log('🌙 Light mode detected, forcing dark mode override');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
        document.body.style.backgroundColor = '#111827';
        document.body.style.color = '#f9fafb';
      }
    };

    mediaQuery.addListener(handleChange);
    
    // Check immediately
    handleChange(mediaQuery);

    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const handleTabChange = useCallback(
    (tabId) => {
      if (activeTab !== tabId && !isTransitioning) {
        setIsTransitioning(true);
        hapticFeedback("light");

        setTimeout(() => {
          setActiveTab(tabId);
          setIsTransitioning(false);
        }, 100);
      }
    },
    [activeTab, isTransitioning, hapticFeedback]
  );

  // Render the appropriate component with correct props
  const renderActiveComponent = () => {
    switch (activeTab) {
      case "profile":
        return <UserProfile isOwnProfile={true} userId={user?.id || null} />;
      case "tasks":
        return <DailyTasks />;
      case "leaderboard":
        return <Leaderboard />;
      default:
        return <UserProfile isOwnProfile={true} userId={user?.id || null} />;
    }
  };

  if (!isReady) {
    return <LoadingScreen />;
  }

  // if (loading) return <div>Yuklanmoqda...</div>;
  // if (error) return <div>Xatolik: {error}</div>;

  return (
    <AuthCheck>
      <div className="app">
        <main
          className={`main-content ${isTransitioning ? "transitioning" : ""}`}
        >
          {renderActiveComponent()}
        </main>

        <nav className="bottom-nav">
          <div className="nav-content">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  disabled={isTransitioning}
                  className={`nav-item ${isActive ? "nav-item-active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {isActive && <div className="nav-indicator"></div>}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </AuthCheck>
  );
}

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-content">
      <div className="loading-logo">
        <div className="logo-circle">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
      </div>
      <h1 className="loading-title">Yoldagilar</h1>
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
);

export default App;
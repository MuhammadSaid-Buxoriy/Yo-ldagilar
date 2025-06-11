// src/App.jsx - TOZA VA OPTIMIZATSIYA QILINGAN
import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import AuthCheck from './components/auth/AuthCheck';
import UserProfile from './components/profile/UserProfile';
import DailyTasks from './components/tasks/DailyTasks';
import Leaderboard from './components/leaderboard/Leaderboard';
import './App.css';

const NAVIGATION_ITEMS = [
  { 
    id: 'profile', 
    label: 'Profil', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    component: UserProfile
  },
  { 
    id: 'tasks', 
    label: 'Vazifalar', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3l8-8"/>
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c1.51 0 2.93.37 4.18 1.03"/>
      </svg>
    ),
    component: DailyTasks
  },
  { 
    id: 'leaderboard', 
    label: 'Reyting', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9h6V4H6v5zM12 9h6v7h-6V9zM6 16h6v4H6v-4z"/>
      </svg>
    ),
    component: Leaderboard
  }
];

function App() {
  const { tg, isReady, hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('profile');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Mobile viewport setup
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    
    return () => window.removeEventListener('resize', setVH);
  }, []);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton.hide();
      tg.BackButton.hide();
      tg.enableClosingConfirmation();
      tg.setHeaderColor('#ffffff');
      tg.setBackgroundColor('#f8fafc');
    }
  }, [tg]);

  const handleTabChange = useCallback((tabId) => {
    if (activeTab !== tabId && !isTransitioning) {
      setIsTransitioning(true);
      hapticFeedback('light');
      
      setTimeout(() => {
        setActiveTab(tabId);
        setIsTransitioning(false);
      }, 100);
    }
  }, [activeTab, isTransitioning, hapticFeedback]);

  const ActiveComponent = NAVIGATION_ITEMS.find(item => item.id === activeTab)?.component || UserProfile;

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <AuthCheck>
      <div className="app">
        {/* <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="app-title">Yoldagilar</h1>
            </div>
            <div className="header-right">
              <div className="status-indicator online">
                <span className="status-dot"></span>
                <span className="status-text">Online</span>
              </div>
            </div>
          </div>
        </header> */}

        <main className={`main-content ${isTransitioning ? 'transitioning' : ''}`}>
          <ActiveComponent />
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
                  className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
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
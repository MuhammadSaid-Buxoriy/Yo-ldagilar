// =====================================================
// TELEGRAM HOOK - PRODUCTION READY VERSION
// =====================================================
import { useState, useEffect } from 'react';

// Development mode detection
const IS_DEV = import.meta.env.DEV || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// ⚠️ DEVELOPMENT ONLY: Fake user for testing
// Remove this in production or when testing with real Telegram
const FAKE_USER_FOR_TESTING = {
  id: 1176941228, // Your real Telegram ID
  first_name: "Muhammadsaid",
  last_name: "Buxoriy", 
  username: "muhammadsaid_buxoriy",
  language_code: "uz",
  is_premium: false,
  photo_url: null,
};

export const useTelegram = () => {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);
  const [tg, setTg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeTelegram = () => {
      try {
        // Check if we're in Telegram WebApp environment
        if (window.Telegram?.WebApp) {
          const telegram = window.Telegram.WebApp;
          
          console.log('🚀 Telegram WebApp detected');
          console.log('📱 Platform:', telegram.platform);
          console.log('🎨 Color scheme:', telegram.colorScheme);
          
          if (mounted) {
            setTg(telegram);
            
            // Get user data from Telegram
            const telegramUser = telegram.initDataUnsafe?.user;
            
            if (telegramUser) {
              console.log('👤 Telegram user:', telegramUser);
              setUser(telegramUser);
            } else {
              console.warn('⚠️ No user data from Telegram');
              
              // 🚧 DEVELOPMENT FALLBACK ONLY
              if (IS_DEV) {
                console.log('🔧 Using fake user for development');
                setUser(FAKE_USER_FOR_TESTING);
              } else {
                setError('Telegram user data not available');
              }
            }
            
            // Initialize Telegram WebApp
            telegram.ready();
            telegram.expand();
            
            // Set theme colors
            telegram.setHeaderColor(telegram.themeParams.bg_color || '#ffffff');
            telegram.setBackgroundColor(telegram.themeParams.bg_color || '#ffffff');
            
            setIsReady(true);
          }
        } else {
          console.warn('❌ Telegram WebApp not detected');
          
          // 🚧 DEVELOPMENT FALLBACK ONLY  
          if (IS_DEV) {
            console.log('🔧 Development mode: Using fake Telegram object');
            
            // Create minimal fake Telegram object for development
            const fakeTelegram = {
              ready: () => console.log('🚀 Fake TG: ready()'),
              expand: () => console.log('🚀 Fake TG: expand()'),
              close: () => console.log('🚀 Fake TG: close()'),
              colorScheme: 'light',
              themeParams: {
                bg_color: '#ffffff',
                text_color: '#000000',
                hint_color: '#999999',
                link_color: '#3b82f6',
                button_color: '#3b82f6',
                button_text_color: '#ffffff',
              },
              MainButton: {
                hide: () => console.log('🚀 Fake TG: MainButton.hide()'),
                show: () => console.log('🚀 Fake TG: MainButton.show()'),
                setText: (text) => console.log('🚀 Fake TG: MainButton.setText:', text),
                onClick: (callback) => console.log('🚀 Fake TG: MainButton.onClick'),
              },
              BackButton: {
                hide: () => console.log('🚀 Fake TG: BackButton.hide()'),
                show: () => console.log('🚀 Fake TG: BackButton.show()'),
                onClick: (callback) => console.log('🚀 Fake TG: BackButton.onClick'),
              },
              HapticFeedback: {
                impactOccurred: (style) => console.log('🚀 Fake Haptic:', style),
                notificationOccurred: (type) => console.log('🚀 Fake Notification:', type),
                selectionChanged: () => console.log('🚀 Fake Selection Changed'),
              },
            };
            
            if (mounted) {
              setTg(fakeTelegram);
              setUser(FAKE_USER_FOR_TESTING);
              setIsReady(true);
            }
          } else {
            if (mounted) {
              setError('This app must be opened through Telegram');
            }
          }
        }
      } catch (err) {
        console.error('❌ Error initializing Telegram:', err);
        if (mounted) {
          setError(err.message);
        }
      }
    };

    // Small delay to ensure Telegram WebApp script is loaded
    const timer = setTimeout(initializeTelegram, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Haptic feedback helper
  const hapticFeedback = (type = 'light') => {
    if (!tg?.HapticFeedback) {
      console.log(`🚀 Haptic (${IS_DEV ? 'fake' : 'unavailable'}): ${type}`);
      return;
    }

    try {
      switch (type) {
        case 'light':
          tg.HapticFeedback.impactOccurred('light');
          break;
        case 'medium':
          tg.HapticFeedback.impactOccurred('medium');
          break;
        case 'heavy':
          tg.HapticFeedback.impactOccurred('heavy');
          break;
        case 'success':
          tg.HapticFeedback.notificationOccurred('success');
          break;
        case 'error':
          tg.HapticFeedback.notificationOccurred('error');
          break;
        case 'warning':
          tg.HapticFeedback.notificationOccurred('warning');
          break;
        case 'selection':
          tg.HapticFeedback.selectionChanged();
          break;
        default:
          tg.HapticFeedback.impactOccurred('light');
      }
    } catch (err) {
      console.warn('⚠️ Haptic feedback error:', err);
    }
  };

  // Alert helper with fallback
  const showAlert = (message) => {
    try {
      if (tg?.showAlert) {
        tg.showAlert(message);
      } else {
        // Fallback to browser alert
        alert(message);
      }
    } catch (err) {
      console.error('❌ Error showing alert:', err);
      alert(message); // Ultimate fallback
    }
  };

  // Confirm helper with fallback
  const showConfirm = (message) => {
    return new Promise((resolve) => {
      try {
        if (tg?.showConfirm) {
          tg.showConfirm(message, resolve);
        } else {
          // Fallback to browser confirm
          resolve(confirm(message));
        }
      } catch (err) {
        console.error('❌ Error showing confirm:', err);
        resolve(confirm(message)); // Ultimate fallback
      }
    });
  };

  // Close app helper
  const closeApp = () => {
    try {
      if (tg?.close) {
        tg.close();
      } else {
        console.log('🚀 Close app (not available outside Telegram)');
      }
    } catch (err) {
      console.error('❌ Error closing app:', err);
    }
  };

  // Main button helper
  const mainButton = {
    show: (text, onClick) => {
      try {
        if (tg?.MainButton) {
          tg.MainButton.setText(text);
          tg.MainButton.onClick(onClick);
          tg.MainButton.show();
        } else {
          console.log(`🚀 MainButton show: ${text}`);
        }
      } catch (err) {
        console.error('❌ Error with main button:', err);
      }
    },
    hide: () => {
      try {
        if (tg?.MainButton) {
          tg.MainButton.hide();
        } else {
          console.log('🚀 MainButton hide');
        }
      } catch (err) {
        console.error('❌ Error hiding main button:', err);
      }
    },
  };

  // Back button helper
  const backButton = {
    show: (onClick) => {
      try {
        if (tg?.BackButton) {
          tg.BackButton.onClick(onClick);
          tg.BackButton.show();
        } else {
          console.log('🚀 BackButton show');
        }
      } catch (err) {
        console.error('❌ Error with back button:', err);
      }
    },
    hide: () => {
      try {
        if (tg?.BackButton) {
          tg.BackButton.hide();
        } else {
          console.log('🚀 BackButton hide');
        }
      } catch (err) {
        console.error('❌ Error hiding back button:', err);
      }
    },
  };

  return {
    // Core Telegram data
    tg,
    user,
    isReady,
    error,
    
    // Helper methods
    hapticFeedback,
    showAlert,
    showConfirm,
    closeApp,
    mainButton,
    backButton,
    
    // Development info
    isDev: IS_DEV,
    
    // Theme data
    colorScheme: tg?.colorScheme || 'light',
    themeParams: tg?.themeParams || {},
  };
};
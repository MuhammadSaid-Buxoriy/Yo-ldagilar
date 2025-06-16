import { useState, useEffect } from 'react';

// Window objects uchun type checking
const isTelegramAvailable = () => {
  return typeof window !== 'undefined' && 
         window.Telegram && 
         window.Telegram.WebApp;
};

const IS_DEV = import.meta.env.DEV || 
  (typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  ));

const FAKE_USER_FOR_TESTING = {
  id: 1176941228,
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
    let checkInterval;

    const initializeTelegram = () => {
      console.log('🔍 Checking Telegram availability...');
      console.log('🔍 window.Telegram:', !!window.Telegram);
      console.log('🔍 window.Telegram.WebApp:', !!window.Telegram?.WebApp);
      
      if (isTelegramAvailable()) {
        const telegram = window.Telegram.WebApp;
        
        console.log('✅ Telegram WebApp detected!');
        console.log('📱 Platform:', telegram.platform);
        console.log('📱 Version:', telegram.version);
        console.log('🎨 Color scheme:', telegram.colorScheme);
        console.log('👤 Init data unsafe:', telegram.initDataUnsafe);
        
        if (mounted) {
          setTg(telegram);
          
          const telegramUser = telegram.initDataUnsafe?.user;
          
          if (telegramUser) {
            console.log('👤 Real Telegram user found:', telegramUser);
            setUser(telegramUser);
          } else {
            console.warn('⚠️ No user data in initDataUnsafe');
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
          telegram.setHeaderColor('#ffffff');
          telegram.setBackgroundColor('#f8fafc');
          
          setIsReady(true);
          
          // Clear interval once initialized
          if (checkInterval) {
            clearInterval(checkInterval);
          }
        }
      } else {
        console.warn('❌ Telegram WebApp not available');
        
        if (IS_DEV) {
          console.log('🔧 Development mode: Using fake objects');
          
          const fakeTelegram = {
            ready: () => console.log('🚀 Fake TG: ready()'),
            expand: () => console.log('🚀 Fake TG: expand()'),
            close: () => console.log('🚀 Fake TG: close()'),
            platform: 'web',
            version: '6.0',
            colorScheme: 'light',
            themeParams: {
              bg_color: '#ffffff',
              text_color: '#000000',
              hint_color: '#999999',
              link_color: '#3b82f6',
              button_color: '#3b82f6',
              button_text_color: '#ffffff',
            },
            setHeaderColor: (color) => console.log('🚀 Fake setHeaderColor:', color),
            setBackgroundColor: (color) => console.log('🚀 Fake setBackgroundColor:', color),
            MainButton: {
              hide: () => console.log('🚀 Fake MainButton.hide()'),
              show: () => console.log('🚀 Fake MainButton.show()'),
              setText: (text) => console.log('🚀 Fake MainButton.setText:', text),
              onClick: () => console.log('🚀 Fake MainButton.onClick'),
            },
            BackButton: {
              hide: () => console.log('🚀 Fake BackButton.hide()'),
              show: () => console.log('🚀 Fake BackButton.show()'),
              onClick: () => console.log('🚀 Fake BackButton.onClick'),
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
    };

    // Immediately try to initialize
    if (typeof window !== 'undefined') {
      // Wait a bit for scripts to load
      setTimeout(initializeTelegram, 2000);
      
      // Set up interval to keep checking (for slow connections)
      checkInterval = setInterval(() => {
        if (!isReady && !isTelegramAvailable()) {
          console.log('🔄 Still waiting for Telegram script...');
        } else if (isTelegramAvailable() && !isReady) {
          initializeTelegram();
        }
      }, 1000);
      
      // Stop checking after 10 seconds
      setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval);
          if (!isReady && !IS_DEV) {
            setError('Telegram WebApp script failed to load');
          }
        }
      }, 10000);
    }

    return () => {
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  // ... rest of the methods remain the same
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

  const showAlert = (message) => {
    try {
      if (tg?.showAlert) {
        tg.showAlert(message);
      } else {
        alert(message);
      }
    } catch (err) {
      console.error('❌ Error showing alert:', err);
      alert(message);
    }
  };

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      try {
        if (tg?.showConfirm) {
          tg.showConfirm(message, resolve);
        } else {
          resolve(confirm(message));
        }
      } catch (err) {
        console.error('❌ Error showing confirm:', err);
        resolve(confirm(message));
      }
    });
  };

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
    tg,
    user,
    isReady,
    error,
    hapticFeedback,
    showAlert,
    showConfirm,
    closeApp,
    mainButton,
    backButton,
    isDev: IS_DEV,
    colorScheme: tg?.colorScheme || 'light',
    themeParams: tg?.themeParams || {},
  };
};
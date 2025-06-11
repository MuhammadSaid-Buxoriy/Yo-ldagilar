// hooks/useTelegram.js - FIXED VERSION
import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    
    if (app) {
      app.ready();
      app.expand();
      
      setTg(app);
      setUser(app.initDataUnsafe?.user);
      setIsReady(true);
      
      // Debug log
      console.log('Telegram WebApp User:', app.initDataUnsafe?.user);
    } else {
      // Development mode - test uchun HAQIQIY USER ID
      const mockUser = {
        id: 6133914331,  // ✅ Haqiqiy registered user ID
        first_name: 'Soliha',
        last_name: 'Sultonova',
        username: 'muhammadsaid_buxoriy',
        photo_url: null
      };
      setUser(mockUser);
      setIsReady(true);
      
      // Debug log
      console.log('Development Mock User:', mockUser);
    }
  }, []);

  const showAlert = (message) => {
    if (tg) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  };

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      if (tg) {
        tg.showConfirm(message, resolve);
      } else {
        resolve(confirm(message));
      }
    });
  };

  const hapticFeedback = (type = 'light') => {
    if (tg?.HapticFeedback) {
      switch (type) {
        case 'light':
          tg.HapticFeedback.impactOccurred('light');
          break;
        case 'success':
          tg.HapticFeedback.notificationOccurred('success');
          break;
        case 'error':
          tg.HapticFeedback.notificationOccurred('error');
          break;
      }
    }
  };

  const close = () => {
    if (tg) {
      tg.close();
    }
  };

  return {
    tg,
    user,
    isReady,
    showAlert,
    showConfirm,
    hapticFeedback,
    close,
  };
};
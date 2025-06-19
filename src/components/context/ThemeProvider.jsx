// components/context/ThemeProvider.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useTelegram } from "../../hooks/useTelegram";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { tg } = useTelegram();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Telegram WebApp dan theme olish
    if (tg?.colorScheme) {
      const telegramTheme = tg.colorScheme;
      setTheme(telegramTheme);
      console.log(`🎨 Telegram theme detected: ${telegramTheme}`);
    } else {
      // Fallback: system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
      console.log(`🎨 System theme fallback: ${systemTheme}`);
    }

    // CSS class qo'shish
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${theme}-theme`);
  }, [tg, theme]);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // CSS class yangilash
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${newTheme}-theme`);
    
    console.log(`🎨 Theme toggled to: ${newTheme}`);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
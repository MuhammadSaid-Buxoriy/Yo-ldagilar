// components/profile/MonthlyCalendar.jsx - TO'LIQ TUZATILGAN VERSIYA
import { useState, useEffect } from "react";
import APIService from "../../services/api";
import "./MonthlyCalendar.css";

const MonthlyCalendar = ({ userId, stats }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadMonthlyData();
    }
  }, [userId, currentDate]);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // API dan ma'lumot olishga harakat qilish
      let response;
      try {
        response = await APIService.getUserMonthlyStatistics(userId, year, month);
      } catch (error) {
        console.warn("API monthly stats not available, using fallback");
        response = { daily_stats: [] };
      }
      
      // Backend ma'lumotlarini object formatiga o'tkazish
      const dataMap = {};
      if (response.daily_stats && Array.isArray(response.daily_stats)) {
        response.daily_stats.forEach(day => {
          const dayKey = new Date(day.date).getDate();
          dataMap[dayKey] = {
            completed: day.completed || 0,
            total: 10
          };
        });
      }
      
      // ✅ BUGUNGI KUN MA'LUMOTINI QO'SHISH (agar bu oy bo'lsa)
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
      
      if (isCurrentMonth && stats?.today) {
        const todayDate = today.getDate();
        dataMap[todayDate] = {
          completed: stats.today.completed || 0,
          total: 10
        };
      }
      
      setMonthlyData(dataMap);
    } catch (error) {
      console.error("Failed to load monthly data:", error);
      setMonthlyData({});
    } finally {
      setLoading(false);
    }
  };

  // ✅ TO'G'RI HAFTA KUNLARI TARTIBINI OLISH
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Oyning birinchi va oxirgi kunini topish
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // ✅ UZBEK HAFTA TARTIBIGA O'TKAZISH (Dushanba = 0, Yakshanba = 6)
    const startDayOfWeek = firstDay.getDay(); // 0=Yak, 1=Du, 2=Se...
    const uzbekStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Uzbek formatiga
    
    const daysInMonth = lastDay.getDate();
    const calendarDays = [];
    
    // Oldingi oydan bo'sh joylarni to'ldirish
    for (let i = 0; i < uzbekStartDay; i++) {
      calendarDays.push(null);
    }
    
    // Joriy oyning kunlarini qo'shish
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    return calendarDays;
  };

  // ✅ BUGUNGI KUNNI TO'G'RI ANIQLASH
  const isToday = (day) => {
    if (!day) return false;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    return (
      currentYear === currentDate.getFullYear() &&
      currentMonth === currentDate.getMonth() &&
      currentDay === day
    );
  };

  // ✅ KUN FOIZINI HISOBLASH
  const getDayPercentage = (day) => {
    if (!day || !monthlyData[day]) return 0;
    
    const dayData = monthlyData[day];
    return Math.round((dayData.completed / dayData.total) * 100);
  };

  // ✅ RANG OLISH
  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "#16ce40"; // Yashil
    if (percentage >= 80) return "#FFFF00"; // Sariq  
    if (percentage >= 50) return "#FF8000"; // To'q sariq
    if (percentage > 0) return "#dc2626";   // Qizil
    return "#e5e7eb"; // Neytral kulrang
  };

  // ✅ OYNI O'ZGARTIRISH
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // ✅ HAFTA KUNLARI (IXCHAM)
  const weekDays = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  
  // ✅ OY NOMI
  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];

  return (
    <div className="monthly-calendar">
      {/* ✅ IXCHAM HEADER */}
      <div className="calendar-header">
        <h3 className="calendar-title">📅 Oylik Natijalar</h3>
        
        <div className="month-navigation">
          <button 
            onClick={() => changeMonth(-1)}
            className="nav-button"
            disabled={loading}
          >
            ‹
          </button>
          
          <span className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          
          <button 
            onClick={() => changeMonth(1)}
            className="nav-button"  
            disabled={loading}
          >
            ›
          </button>
        </div>
      </div>

      {/* ✅ KALENDAR GRID */}
      <div className="calendar-grid">
        {/* Hafta kunlari */}
        {weekDays.map(day => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
        
        {/* Kalendar kunlari */}
        {getDaysInMonth().map((day, index) => {
          if (!day) {
            return <div key={index} className="empty-day"></div>;
          }
          
          const percentage = getDayPercentage(day);
          const color = getProgressColor(percentage);
          const todayClass = isToday(day) ? "today" : "";
          
          return (
            <div 
              key={day} 
              className={`calendar-day ${todayClass}`}
              style={{
                borderColor: color,
                borderWidth: percentage > 0 ? "2px" : "1px",
                backgroundColor: percentage > 0 ? `${color}15` : "transparent"
              }}
            >
              <span className="day-number">{day}</span>
            </div>
          );
        })}
      </div>
      
      {loading && (
        <div className="calendar-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCalendar;
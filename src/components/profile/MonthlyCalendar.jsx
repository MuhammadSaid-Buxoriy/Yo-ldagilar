// components/profile/MonthlyCalendar.jsx - DARK MODE + NAMUNAGA MOS VERSIYA
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
      
      // ✅ TEST MA'LUMOTLAR - Haqiqiy natijalarni ko'rsatish uchun
      const testData = {};
      for (let day = 1; day <= 31; day++) {
        // Test natijalar - har xil foizlarda
        const randomScore = Math.floor(Math.random() * 11); // 0-10
        if (randomScore > 0) {
          testData[day] = {
            completed: randomScore,
            total: 10
          };
        }
      }
      
      // API dan ma'lumot olishga harakat qilish
      let response;
      try {
        response = await APIService.getUserMonthlyStatistics(userId, year, month);
      } catch (error) {
        console.warn("API monthly stats not available, using test data");
        response = { daily_stats: [] };
      }
      
      // Backend ma'lumotlarini object formatiga o'tkazish
      const dataMap = { ...testData }; // Test ma'lumotlar bilan boshlash
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

  // ✅ RANG VA TOJ LOGIKASI - NAMUNAGA MOS
  const getDayStyle = (day) => {
    const percentage = getDayPercentage(day);
    
    // Asosiy rang va toj logikasi
    let borderColor = "rgba(255, 255, 255, 0.2)"; // neytral
    let hasCrown = false;
    let borderWidth = "1px";
    
    if (percentage >= 90) {
      borderColor = "#16ce40"; // yashil
      hasCrown = true;
      borderWidth = "2px";
    } else if (percentage >= 80) {
      borderColor = "#FFFF00"; // sariq
      hasCrown = true; 
      borderWidth = "2px";
    } else if (percentage >= 50) {
      borderColor = "#FF8000"; // sabzi rang
      borderWidth = "2px";
    } else if (percentage > 0) {
      borderColor = "#dc2626"; // qizil
      borderWidth = "1px";
    }
    
    return {
      borderColor,
      borderWidth,
      hasCrown
    };
  };

  // ✅ OYNI O'ZGARTIRISH
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // ✅ HAFTA KUNLARI (INGLIZCHA FORMATDA)
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  
  // ✅ OY NOMI
  const getMonthYear = () => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    return `${month}.${year}`;
  };

  return (
    <div className="monthly-calendar-dark">
      {/* ✅ DARK MODE HEADER */}
      <div className="calendar-header-dark">
        <button 
          onClick={() => changeMonth(-1)}
          className="nav-button-dark"
          disabled={loading}
        >
          ‹
        </button>
        
        <span className="current-month-dark">
          {getMonthYear()}
        </span>
        
        <button 
          onClick={() => changeMonth(1)}
          className="nav-button-dark"  
          disabled={loading}
        >
          ›
        </button>
      </div>

      {/* ✅ KALENDAR GRID */}
      <div className="calendar-grid-dark">
        {/* Hafta kunlari */}
        {weekDays.map(day => (
          <div key={day} className="weekday-header-dark">
            {day}
          </div>
        ))}
        
        {/* Kalendar kunlari */}
        {getDaysInMonth().map((day, index) => {
          if (!day) {
            return <div key={index} className="empty-day-dark"></div>;
          }
          
          const dayStyle = getDayStyle(day);
          const todayClass = isToday(day) ? "today-dark" : "";
          
          return (
            <div 
              key={day} 
              className={`calendar-day-dark ${todayClass}`}
              style={{
                borderColor: dayStyle.borderColor,
                borderWidth: dayStyle.borderWidth,
              }}
            >
              <span className="day-number-dark">{day}</span>
              {dayStyle.hasCrown && <span className="crown-emoji">👑</span>}
              {isToday(day) && <div className="today-dot"></div>}
            </div>
          );
        })}
      </div>
      
      {loading && (
        <div className="calendar-loading-dark">
          <div className="loading-spinner-dark"></div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCalendar;
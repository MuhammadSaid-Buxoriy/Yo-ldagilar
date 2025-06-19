// components/profile/MonthlyCalendar.jsx - DARK MODE + HAQIQIY MA'LUMOTLAR
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
      
      console.log(`📅 Loading data for ${year}-${month.toString().padStart(2, '0')}`);
      
      // API dan ma'lumot olishga harakat qilish
      let response;
      try {
        response = await APIService.getUserMonthlyStatistics(userId, year, month);
        console.log('📥 API Response:', response);
      } catch (error) {
        console.warn("API monthly stats not available", error);
        response = { daily_stats: [] };
      }
      
      // Backend ma'lumotlarini object formatiga o'tkazish
      const dataMap = {};
      if (response.daily_stats && Array.isArray(response.daily_stats)) {
        response.daily_stats.forEach(day => {
          try {
            const dayKey = new Date(day.date).getDate();
            dataMap[dayKey] = {
              completed: day.completed || 0,
              total: day.total || 10
            };
            console.log(`Day ${dayKey}: ${day.completed}/${day.total || 10}`);
          } catch (dateError) {
            console.warn('Date parsing error:', day.date);
          }
        });
      }
      
      // ✅ BUGUNGI KUN MA'LUMOTINI QO'SHISH (faqat joriy oy bo'lsa)
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
      
      if (isCurrentMonth && stats?.today) {
        const todayDate = today.getDate();
        dataMap[todayDate] = {
          completed: stats.today.completed || 0,
          total: 10
        };
        console.log(`Today (${todayDate}): ${stats.today.completed}/10`);
      }
      
      console.log('📊 Final data map:', dataMap);
      setMonthlyData(dataMap);
    } catch (error) {
      console.error("Failed to load monthly data:", error);
      setMonthlyData({});
    } finally {
      setLoading(false);
    }
  };

  // ✅ TO'G'RI HAFTA KUNLARI TARTIBINI OLISH - TUZATILGAN
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
    
    // ✅ TUZATISH: Oldingi oydan bo'sh joylarni to'ldirish
    for (let i = 0; i < uzbekStartDay; i++) {
      calendarDays.push(null);
    }
    
    // ✅ TUZATISH: Joriy oyning kunlarini qo'shish
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    // ✅ YANGI: Qator tugallanishi uchun keyingi oydan kunlar qo'shish
    const totalCells = calendarDays.length;
    const remainingCells = totalCells % 7;
    if (remainingCells > 0) {
      const nextMonthDays = 7 - remainingCells;
      for (let day = 1; day <= nextMonthDays; day++) {
        calendarDays.push(null); // Keyingi oy kunlari uchun null
      }
    }
    
    console.log(`📅 Calendar for ${year}-${month + 1}:`, {
      firstDay: firstDay.toDateString(),
      uzbekStartDay,
      daysInMonth,
      totalDays: calendarDays.length,
      firstWeek: calendarDays.slice(0, 7),
      lastWeek: calendarDays.slice(-7)
    });
    
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

  // ✅ RANG LOGIKASI - SIZNING BERILGAN RANGLAR BILAN
  const getProgressColor = (percent) => {
    if (percent >= 90) return "#16ce40"; // yashil
    if (percent >= 80) return "#FFFF00"; // sariq
    if (percent >= 50) return "#FF8000"; // to'q sariq
    if (percent > 0) return "#dc2626";   // qizil
    return "rgba(255, 255, 255, 0.2)";  // neytral (dark mode uchun)
  };

  // ✅ KUN STILINI OLISH - FAQAT HAQIQIY MA'LUMOTLAR UCHUN
  const getDayStyle = (day) => {
    const percentage = getDayPercentage(day);
    const borderColor = getProgressColor(percentage);
    
    return {
      borderColor,
      borderWidth: percentage > 0 ? "2px" : "1px",
      hasData: percentage > 0
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
          const percentage = getDayPercentage(day);
          
          return (
            <div 
              key={day} 
              className={`calendar-day-dark ${todayClass}`}
              style={{
                borderColor: dayStyle.borderColor,
                borderWidth: dayStyle.borderWidth,
              }}
              title={dayStyle.hasData ? `${percentage}% bajarildi` : "Ma'lumot yo'q"}
            >
              <span className="day-number-dark">{day}</span>
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
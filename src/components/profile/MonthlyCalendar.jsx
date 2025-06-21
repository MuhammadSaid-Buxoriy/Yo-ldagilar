// components/profile/MonthlyCalendar.jsx - API BILAN TO'LIQ ISHLAYDI
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
      
      console.log(`📅 Loading calendar data for ${year}-${month.toString().padStart(2, '0')}`);
      
      // ✅ TUZATISH 1: getUserStatistics'dan calendar parametri bilan ma'lumot olish
      let response;
      try {
        response = await APIService.getUserStatistics(userId, { 
          year, 
          month,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
        });
        console.log('📥 Calendar API Response:', response);
      } catch (error) {
        console.warn("Calendar API not available, using alternative approach", error);
        
        // ✅ TUZATISH 2: Progress history'dan ma'lumot olish (fallback)
        try {
          const historyResponse = await APIService.getUserProgressHistory(userId, 31);
          console.log('📥 History fallback response:', historyResponse);
          
          // History formatini calendar formatiga o'tkazish
          const historyData = historyResponse.history || [];
          response = {
            calendar: {
              days: historyData.map(day => ({
                date: new Date(day.date).getDate(),
                fullDate: day.date,
                hasProgress: day.total_points > 0,
                completionPercentage: Math.round((day.total_points / 10) * 100),
                totalPoints: day.total_points,
                pagesRead: day.pages_read,
                distanceKm: day.distance_km
              }))
            }
          };
        } catch (historyError) {
          console.warn("History API also failed", historyError);
          response = { calendar: { days: [] } };
        }
      }
      
      // ✅ TUZATISH 3: Ma'lumotlarni to'g'ri formatda object'ga o'tkazish
      const dataMap = {};
      
      // Backend calendar formatidan ma'lumot olish
      if (response.calendar && response.calendar.days) {
        response.calendar.days.forEach(day => {
          try {
            const dayKey = day.date || new Date(day.fullDate).getDate();
            dataMap[dayKey] = {
              completed: day.totalPoints || 0,
              total: 10,
              completionPercentage: day.completionPercentage || Math.round((day.totalPoints / 10) * 100)
            };
            console.log(`Day ${dayKey}: ${day.totalPoints || 0}/10 (${dataMap[dayKey].completionPercentage}%)`);
          } catch (dateError) {
            console.warn('Date parsing error:', day);
          }
        });
      }
      
      // ✅ TUZATISH 4: Bugungi kun ma'lumotini qo'shish (faqat joriy oy bo'lsa)
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
      
      if (isCurrentMonth && stats?.today) {
        const todayDate = today.getDate();
        dataMap[todayDate] = {
          completed: stats.today.completed || 0,
          total: 10,
          completionPercentage: Math.round(((stats.today.completed || 0) / 10) * 100)
        };
        console.log(`Today (${todayDate}): ${stats.today.completed}/10`);
      }
      
      console.log('📊 Final calendar data map:', dataMap);
      setMonthlyData(dataMap);
      
    } catch (error) {
      console.error("Failed to load monthly data:", error);
      setMonthlyData({});
    } finally {
      setLoading(false);
    }
  };

  // ✅ TUZATILGAN: Hafta kunlari tartibini to'g'ri olish
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // ✅ Uzbek hafta tartibiga o'tkazish (Dushanba = 0)
    const startDayOfWeek = firstDay.getDay(); // 0=Yak, 1=Du, 2=Se...
    const uzbekStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const daysInMonth = lastDay.getDate();
    const calendarDays = [];
    
    // Oldingi oydan bo'sh joylar
    for (let i = 0; i < uzbekStartDay; i++) {
      calendarDays.push(null);
    }
    
    // Joriy oyning kunlari
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    // Qator tugallanishi uchun keyingi oydan kunlar
    const totalCells = calendarDays.length;
    const remainingCells = totalCells % 7;
    if (remainingCells > 0) {
      const nextMonthDays = 7 - remainingCells;
      for (let day = 1; day <= nextMonthDays; day++) {
        calendarDays.push(null);
      }
    }
    
    console.log(`📅 Calendar structure for ${year}-${month + 1}:`, {
      firstDay: firstDay.toDateString(),
      uzbekStartDay,
      daysInMonth,
      totalDays: calendarDays.length
    });
    
    return calendarDays;
  };

  // ✅ Bugungi kunni to'g'ri aniqlash
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

  // ✅ TUZATILGAN: Kun foizini hisoblash
  const getDayPercentage = (day) => {
    if (!day || !monthlyData[day]) return 0;
    
    const dayData = monthlyData[day];
    return dayData.completionPercentage || Math.round((dayData.completed / dayData.total) * 100);
  };

  // ✅ SIZNING BERILGAN RANGLAR - TO'G'RI LOGIKA
  const getProgressColor = (percent) => {
    if (percent >= 90) return "#16ce40"; // yashil - 90%+
    if (percent >= 80) return "#FFFF00"; // sariq - 80-89%
    if (percent >= 50) return "#FF8000"; // to'q sariq - 50-79%
    if (percent > 0) return "#dc2626";   // qizil - 1-49%
    return "rgba(255, 255, 255, 0.2)";  // neytral - 0%
  };

  // ✅ Kun stilini olish
  const getDayStyle = (day) => {
    const percentage = getDayPercentage(day);
    const borderColor = getProgressColor(percentage);
    
    return {
      borderColor,
      borderWidth: percentage > 0 ? "2px" : "1px",
      hasData: percentage > 0
    };
  };

  // ✅ Oyni o'zgartirish
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // ✅ Hafta kunlari
  const weekDays = ["D", "S", "C", "P", "J", "S", "Y"]; // Du, Se, Ch, Pa, Ju, Sh, Ya
  
  // ✅ Oy nomi
  const getMonthYear = () => {
    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const monthName = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    return `${monthName} ${year}`;
  };

  return (
    <div className="monthly-calendar-dark">
      {/* Header */}
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

      {/* Kalendar Grid */}
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
              className={`calendar-day-dark ${todayClass} ${dayStyle.hasData ? 'has-data' : ''}`}
              style={{
                borderColor: dayStyle.borderColor,
                borderWidth: dayStyle.borderWidth,
              }}
              title={dayStyle.hasData ? `${percentage}% bajarildi` : "Ma'lumot yo'q"}
            >
              <span className="day-number-dark">{day}</span>
              {isToday(day) && <div className="today-dot"></div>}
              {/* ✅ YANGI: Progress indicator */}
              {dayStyle.hasData && (
                <div 
                  className="day-progress-indicator"
                  style={{
                    backgroundColor: getProgressColor(percentage),
                    opacity: 0.3
                  }}
                ></div>
              )}
            </div>
          );
        })}
      </div>
      
      {loading && (
        <div className="calendar-loading-dark">
          <div className="loading-spinner-dark"></div>
        </div>
      )}

      {/* ✅ YANGI: Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#16ce40" }}></div>
          <span>90%+</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#FFFF00" }}></div>
          <span>80-89%</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#FF8000" }}></div>
          <span>50-79%</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#dc2626" }}></div>
          <span>1-49%</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendar;
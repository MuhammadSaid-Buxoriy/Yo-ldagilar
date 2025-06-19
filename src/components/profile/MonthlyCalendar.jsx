// =====================================================
// MONTHLY CALENDAR COMPONENT
// =====================================================
// File: src/components/profile/MonthlyCalendar.jsx

import { useState, useEffect } from 'react';
import APIService from '../../services/api';

const MonthlyCalendar = ({ userId, stats }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(false);

  // Oy nomlarini o'zbek tilida
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];

  // Hafta kunlari
  const weekDays = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

  // ✅ SIZNING RANG FUNKSIYANGIZ
  const getProgressColor = (percent) => {
    if (percent >= 90) return "#16ce40";
    if (percent >= 80) return "#FFFF00";
    if (percent >= 50) return "#FF8000";
    return "#dc2626";
  };

  // Oylik ma'lumotlarni yuklash
  const loadMonthlyData = async (year, month) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      console.log(`📅 Loading monthly data for ${months[month]} ${year}...`);
      
      // Oyning barcha kunlari uchun ma'lumot olish
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthData = {};

      // Bugungi kun uchun ma'lumot
      const today = new Date();

      // Barcha kunlar uchun parallel request
      const promises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        
        // Faqat o'tgan va bugungi kunlar uchun ma'lumot olish
        if (date <= today) {
          const dateString = date.toISOString().split('T')[0];
          promises.push(
            APIService.getUserDailyProgress(userId, dateString)
              .then(response => ({
                day,
                dateString,
                data: response.exists ? response.progress : null
              }))
              .catch(error => {
                console.warn(`Ma'lumot topilmadi: ${dateString}`, error);
                return { day, dateString, data: null };
              })
          );
        }
      }

      // Barcha ma'lumotlarni olish
      const results = await Promise.all(promises);
      
      // Ma'lumotlarni formatlash
      results.forEach(({ day, data }) => {
        if (data && data.total_points !== undefined) {
          const completion = Math.round((data.total_points / 10) * 100);
          monthData[day] = {
            completion: completion,
            points: data.total_points,
            pages: data.pages_read || 0,
            distance: parseFloat(data.distance_km) || 0
          };
        }
      });

      console.log(`✅ Monthly data loaded: ${Object.keys(monthData).length} days with data`);
      setMonthlyData(monthData);
      
    } catch (error) {
      console.error('Oylik ma\'lumotlarni yuklashda xato:', error);
      setMonthlyData({});
    } finally {
      setLoading(false);
    }
  };

  // Oy o'zgarganda ma'lumotlarni yangilash
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    loadMonthlyData(year, month);
  }, [currentDate, userId]);

  // Oldingi oyga o'tish
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Keyingi oyga o'tish
  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    // Faqat joriy oygacha ruxsat berish
    if (nextMonth <= today) {
      setCurrentDate(nextMonth);
    }
  };

  // Oy kalendari yaratish
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Dushanba bilan boshlash uchun (0=Yakshanba, 1=Dushanba)
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const days = [];
    
    // Bo'sh kunlar (oyning boshida)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Oy kunlari
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dayData = monthlyData[day];
      const isToday = year === today.getFullYear() && 
                     month === today.getMonth() && 
                     day === today.getDate();
      const isFuture = dayDate > today;
      
      days.push({
        day,
        data: dayData,
        isToday,
        isFuture
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendar();
  const currentMonthName = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const canGoNext = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) <= today;

  // Oylik statistika hisoblash
  const monthlyStats = () => {
    const totalDays = Object.keys(monthlyData).length;
    const perfectDays = Object.values(monthlyData).filter(d => d.completion >= 100).length;
    const goodDays = Object.values(monthlyData).filter(d => d.completion >= 90 && d.completion < 100).length;
    const averageDays = Object.values(monthlyData).filter(d => d.completion >= 80 && d.completion < 90).length;
    const lowDays = Object.values(monthlyData).filter(d => d.completion >= 50 && d.completion < 80).length;
    const badDays = Object.values(monthlyData).filter(d => d.completion > 0 && d.completion < 50).length;
    
    return { totalDays, perfectDays, goodDays, averageDays, lowDays, badDays };
  };

  const { totalDays, perfectDays, goodDays, averageDays, lowDays, badDays } = monthlyStats();

  return (
    <div className="monthly-calendar-section">
      <h3 className="section-subtitle">📅 Oylik Natijalar</h3>
      
      {/* Oy navigatsiyasi */}
      <div className="calendar-header">
        <button 
          onClick={goToPreviousMonth}
          className="calendar-nav-btn"
          aria-label="Oldingi oy"
        >
          <ChevronLeftIcon />
        </button>
        
        <h4 className="calendar-month-year">
          {currentMonthName} {currentYear}
        </h4>
        
        <button 
          onClick={goToNextMonth}
          className={`calendar-nav-btn ${!canGoNext ? 'disabled' : ''}`}
          disabled={!canGoNext}
          aria-label="Keyingi oy"
        >
          <ChevronRightIcon />
        </button>
      </div>

      {/* Loading holati */}
      {loading && (
        <div className="calendar-loading">
          <div className="loading-spinner-small"></div>
          <span>Ma'lumotlar yuklanmoqda...</span>
        </div>
      )}

      {/* Kalendar */}
      <div className="calendar-grid">
        {/* Hafta kunlari sarlavhasi */}
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        
        {/* Kalendar kunlari */}
        {calendarDays.map((dayInfo, index) => {
          if (!dayInfo) {
            // Bo'sh kun
            return <div key={index} className="calendar-day empty"></div>;
          }

          const { day, data, isToday, isFuture } = dayInfo;
          const completion = data?.completion || 0;
          const hasData = !!data && !isFuture;

          return (
            <div 
              key={day}
              className={`calendar-day ${isToday ? 'today' : ''} ${hasData ? 'has-data' : ''} ${isFuture ? 'future' : ''}`}
              title={hasData ? 
                `${day}-kun: ${completion}% (${data.points}/10 vazifa)\n📖 ${data.pages} bet o'qildi\n🏃‍♂️ ${data.distance} km yugurdi` :
                isFuture ? 'Kelajak kun' : 'Ma\'lumot yo\'q'
              }
            >
              <span className="day-number">{day}</span>
              
              {/* Natija dumaloq - faqat ma'lumot bor va kelajak emas */}
              {hasData && (
                <div 
                  className="completion-circle"
                  style={{
                    background: `conic-gradient(${getProgressColor(completion)} ${completion * 3.6}deg, #e5e7eb 0deg)`,
                  }}
                >
                  <div className="circle-inner">
                    <span className="completion-percent">{completion}%</span>
                  </div>
                </div>
              )}
              
              {/* Bugungi kun belgisi */}
              {isToday && <div className="today-indicator"></div>}
              
              {/* Kelajak kunlar uchun lock icon */}
              {isFuture && (
                <div className="future-indicator">🔒</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Oylik statistika */}
      <div className="calendar-summary">
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-number">{totalDays}</span>
            <span className="summary-label">Faol kunlar</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{perfectDays}</span>
            <span className="summary-label">Mukammal kunlar</span>
          </div>
          <div className="summary-item">
            <span className="summary-number">{goodDays + averageDays}</span>
            <span className="summary-label">Yaxshi kunlar</span>
          </div>
        </div>
      </div>

      {/* Ranglar ma'nosi */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#16ce40' }}></div>
          <span>90%+ (Mukammal)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#FFFF00' }}></div>
          <span>80-89% (Zo'r)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#FF8000' }}></div>
          <span>50-79% (Yaxshi)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#dc2626' }}></div>
          <span>1-49% (Kam)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#e5e7eb' }}></div>
          <span>Ma'lumot yo'q</span>
        </div>
      </div>
    </div>
  );
};

// Chevron iconlar
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15,18 9,12 15,6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
);

export default MonthlyCalendar;
// components/tasks/DailyTasks.jsx - TIMEZONE VA SANA MUAMMOSI HAL QILINDI
import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import APIService from "../../services/api";
import "./DailyTasks.css";
import { useAuth } from "../context/AuthContext";

const TASKS_CONFIG = [
  {
    id: 1,
    title: "Kunlik vird",
    description: "Zikr, Qur'on tilovati, ibodat",
    icon: "prayer",
    type: "simple",
  },
  {
    id: 2,
    title: "Silai rahm",
    description: "Ota-ona va qarindoshlar bilan aloqa",
    icon: "heart",
    type: "simple",
  },
  {
    id: 3,
    title: "Qur'on tinglash",
    description: "1/114 qism",
    icon: "audio",
    type: "simple",
  },
  {
    id: 4,
    title: "Ehson qilish",
    description: "500 so'm +",
    icon: "donate",
    type: "simple",
  },
  {
    id: 5,
    title: "Kitob o'qish",
    description: "Kamida 10 bet",
    icon: "book",
    type: "input",
    inputConfig: {
      type: "number",
      placeholder: "Necha bet?",
      unit: "bet",
      min: 10,
      step: 1,
    },
  },
  {
    id: 6,
    title: "Dars/Kurs",
    description: "Ta'lim kursi yoki dars",
    icon: "education",
    type: "simple",
  },
  {
    id: 7,
    title: "Audio kitob/Podkast",
    description: "Kamida 30 daqiqa",
    icon: "headphones",
    type: "simple",
  },
  {
    id: 8,
    title: "Erta uxlash",
    description: "21:00 - 23:00 orasida",
    icon: "sleep",
    type: "simple",
  },
  {
    id: 9,
    title: "Erta turish",
    description: "03:00 - 06:00 orasida",
    icon: "sunrise",
    type: "simple",
  },
  {
    id: 10,
    title: "Sport",
    description: "Yugurish, sayr qilish yoki mashqlar",
    icon: "activity",
    type: "input",
    inputConfig: {
      type: "number",
      placeholder: "Masofa (km)",
      unit: "km",
      min: 0.1,
      step: 0.1,
    },
  },
];

const DailyTasks = () => {
  const { hapticFeedback, showAlert } = useTelegram();
  const [tasks, setTasks] = useState({});
  const [taskInputs, setTaskInputs] = useState({});
  const [todayStats, setTodayStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [dailyData, setDailyData] = useState(null);
  const { user } = useAuth();

  // ✅ TUZATISH: Sahifa ochilganda bugungi vazifalarni yuklash
  useEffect(() => {
    if (user?.id) {
      loadTodayTasks();
    }
  }, [user]);

  // ✅ YANGI: Auto-refresh har 30 soniyada
  useEffect(() => {
    if (user?.id && !loading && !submitting) {
      const interval = setInterval(() => {
        loadTodayTasks(true); // Silent refresh
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id, loading, submitting]);

  // ✅ TUZATILGAN: Timezone bilan bugungi vazifalarni yuklash
  const loadTodayTasks = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      console.log("📅 Bugungi vazifalarni yuklayapman...", user.id);

      // ✅ MUHIM: Timezone ma'lumotini yuborish
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("🌍 User timezone:", userTimezone);

      // Backend dan bugungi kun ma'lumotlarini olish
      const response = await APIService.apiCall(`/tasks/daily/${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Timezone': userTimezone // ✅ YANGI: Timezone header
        }
      });

      console.log("📊 Backend dan kelgan ma'lumot:", response);

      if (response.success) {
        setDailyData(response);
        setTodayStats(response.today || response);

        // ✅ ASOSIY TUZATISH: Backend dan kelgan vazifa holatlarini o'rnatish
        const loadedTasks = {};
        const loadedInputs = {};

        // Har bir vazifa uchun completed holatini tekshirish
        if (response.tasks && Array.isArray(response.tasks)) {
          response.tasks.forEach((task) => {
            if (task.completed) {
              loadedTasks[task.id] = true;
              console.log(`✅ Vazifa ${task.id} bajarilgan`);
            }
          });
        }

        // Pages va distance ma'lumotlarini o'rnatish
        if (response.pages_read > 0) {
          loadedTasks[5] = true; // Kitob o'qish vazifasi
          loadedInputs[5] = response.pages_read;
        }

        if (response.distance_km > 0) {
          loadedTasks[10] = true; // Sport vazifasi
          loadedInputs[10] = response.distance_km;
        }

        setTasks(loadedTasks);
        setTaskInputs(loadedInputs);
        setHasChanges(false);

        console.log("✅ Vazifalar yuklandi:", loadedTasks);
        console.log("✅ Input ma'lumotlar:", loadedInputs);
      }
    } catch (error) {
      console.error("❌ Vazifalarni yuklashda xatolik:", error);
      if (!silent) {
        // Xatolik bo'lsa minimal ma'lumot bilan davom ettirish
        setDailyData({
          success: true,
          tasks: [],
          completedCount: 0,
          pages_read: 0,
          distance_km: 0,
        });
        setTodayStats({
          completed: 0,
          pages_read: 0,
          distance_km: 0,
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ✅ Vazifa holati o'zgartirilganda
  const handleTaskToggle = useCallback(
    (taskId) => {
      hapticFeedback("light");

      setTasks((prev) => {
        const newTasks = { ...prev };
        if (newTasks[taskId]) {
          delete newTasks[taskId];
          console.log(`❌ Vazifa ${taskId} bekor qilindi`);
          // Input'ni tozalash
          setTaskInputs((prevInputs) => {
            const newInputs = { ...prevInputs };
            delete newInputs[taskId];
            return newInputs;
          });
        } else {
          newTasks[taskId] = true;
          console.log(`✅ Vazifa ${taskId} belgilandi`);
        }
        return newTasks;
      });

      setHasChanges(true);
    },
    [hapticFeedback]
  );

  const handleInputChange = useCallback((taskId, value) => {
    const numValue = parseFloat(value);

    setTaskInputs((prev) => ({
      ...prev,
      [taskId]: numValue,
    }));

    setHasChanges(true);
  }, []);

  const isSubmitEnabled = () => {
    if (!hasChanges) return false;

    // Belgilangan vazifalar uchun input tekshirish
    for (const taskId of Object.keys(tasks)) {
      const task = TASKS_CONFIG.find((t) => t.id === parseInt(taskId));
      if (task?.type === "input") {
        const inputValue = taskInputs[taskId];
        const minValue = task.inputConfig.min;

        if (!inputValue || inputValue < minValue) {
          return false;
        }
      }
    }

    return true;
  };

  // ✅ TUZATILGAN: Timezone bilan vazifa yuborish
  const handleSubmit = async () => {
    if (!isSubmitEnabled()) return;

    setSubmitting(true);
    hapticFeedback("medium");

    try {
      // ✅ MUHIM: Timezone ma'lumotini qo'shish
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const submitData = {
        tg_id: user.id,
        name: user.name || user.first_name || `User ${user.id}`,
        timezone: userTimezone, // ✅ YANGI: Timezone qo'shildi
        shart_1: tasks[1] ? 1 : 0,
        shart_2: tasks[2] ? 1 : 0,
        shart_3: tasks[3] ? 1 : 0,
        shart_4: tasks[4] ? 1 : 0,
        shart_5: tasks[5] ? 1 : 0,
        shart_6: tasks[6] ? 1 : 0,
        shart_7: tasks[7] ? 1 : 0,
        shart_8: tasks[8] ? 1 : 0,
        shart_9: tasks[9] ? 1 : 0,
        shart_10: tasks[10] ? 1 : 0,
        pages_read: tasks[5] ? taskInputs[5] || 0 : 0,
        distance_km: tasks[10] ? taskInputs[10] || 0 : 0,
      };

      console.log("📤 Yuborilayotgan ma'lumot:", submitData);

      const response = await APIService.submitDailyProgress(submitData);

      console.log("📨 Yuborish natijasi:", response);

      if (response.success !== false) {
        hapticFeedback("success");
        const totalPoints = response.totalPoints || Object.keys(tasks).length;
        
        // ✅ YAXSHILANGAN: User'ga ko'proq ma'lumot berish
        const completedTasksCount = Object.keys(tasks).length;
        const pagesRead = tasks[5] ? taskInputs[5] || 0 : 0;
        const distanceKm = tasks[10] ? taskInputs[10] || 0 : 0;
        
        let successMessage = `✅ Muvaffaqiyatli saqlandi!\n🎯 Bugungi ball: ${totalPoints}/10`;
        
        if (pagesRead > 0) {
          successMessage += `\n📖 Betlar: ${pagesRead}`;
        }
        if (distanceKm > 0) {
          successMessage += `\n🏃‍♂️ Masofa: ${distanceKm} km`;
        }
        
        showAlert(successMessage);

        // ✅ MUHIM: Yuborish muvaffaqiyatli bo'lsa, qayta yuklash
        await loadTodayTasks();
      } else {
        throw new Error(response.message || "Yuborishda xatolik");
      }
    } catch (error) {
      hapticFeedback("error");
      console.error("❌ Yuborishda xatolik:", error);
      showAlert(`❌ ${APIService.getErrorMessage(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = Object.keys(tasks).length;
  const progress = (completedCount / 10) * 100;

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="tasks-container">
      {/* Fixed Header */}
      <div className="tasks-header">
        <div className="tasks-header-content">
          <div className="header-title-section">
            <h1 className="tasks-title">Bugungi vazifalar</h1>
            <p className="tasks-subtitle">
              Har kuni o'zingizni rivojlantiring • {new Date().toLocaleDateString('uz-UZ')}
            </p>
          </div>

          <div className="progress-section">
            <div className="progress-info">
              <span className="progress-label">Bajarildi</span>
              <span className="progress-value">{completedCount}/10</span>
            </div>

            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {todayStats && (
            <div className="today-stats">
              <div className="stat-item">
                <div className="stat-icon">
                  <StarIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{todayStats.completed}</div>
                  <p className="stat-label">Ball</p>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <BookIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{todayStats.pages_read}</div>
                  <p className="stat-label">Bet</p>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">
                  <ActivityIcon />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{todayStats.distance_km}</div>
                  <p className="stat-label">KM</p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ YANGI: Changes indicator */}
          {hasChanges && (
            <div className="changes-indicator">
              <div className="changes-dot"></div>
              <span>O'zgarishlar saqlanmagan</span>
            </div>
          )}

          {/* Submit Button in Header */}
          <div className="header-submit-section">
            <button
              onClick={handleSubmit}
              disabled={!isSubmitEnabled() || submitting}
              className={`header-submit-button ${
                isSubmitEnabled() && !submitting
                  ? "submit-active"
                  : "submit-disabled"
              }`}
            >
              {submitting ? (
                <div className="submit-content">
                  <div className="loading-spinner loading-spinner__submit-content"></div>
                  <span>Saqlanmoqda...</span>
                </div>
              ) : (
                <div className="submit-content">
                  <SaveIcon />
                  <span>Ma'lumotlarni saqlash</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Tasks List */}
      <div className="tasks-content">
        <div className="tasks-list">
          {TASKS_CONFIG.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isChecked={!!tasks[task.id]}
              inputValue={taskInputs[task.id] || ""}
              onToggle={() => handleTaskToggle(task.id)}
              onInputChange={(value) => handleInputChange(task.id, value)}
            />
          ))}
        </div>

        {/* ✅ YANGI: Tips section */}
        <div className="tasks-tips">
          <h3 className="tips-title">💡 Maslahatlar</h3>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-icon">⏰</span>
              <span className="tip-text">Vazifalarni tong vaqtida belgilash yaxshiroq</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🔄</span>
              <span className="tip-text">Ma'lumotlar har 30 soniyada yangilanadi</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🌍</span>
              <span className="tip-text">Sizning timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ TUZATILGAN: TaskItem komponenti
const TaskItem = ({ task, isChecked, inputValue, onToggle, onInputChange }) => {
  const IconComponent = getTaskIcon(task.icon);

  return (
    <div className={`task-item ${isChecked ? "task-checked" : ""}`}>
      <div className="task-main">
        <div className="task-icon">
          <IconComponent />
        </div>

        <div className="task-info">
          <h3 className="task-title">{task.title}</h3>
          <p className="task-description">{task.description}</p>
        </div>

        <button
          onClick={onToggle}
          className={`task-checkbox ${isChecked ? "checkbox-checked" : ""}`}
        >
          {isChecked && <CheckIcon />}
        </button>
      </div>

      {task.type === "input" && isChecked && (
        <div className="task-input-section">
          <div className="input-container">
            <input
              type={task.inputConfig.type}
              min={task.inputConfig.min}
              step={task.inputConfig.step}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={task.inputConfig.placeholder}
              className="task-input"
              autoComplete="off"
            />
            <span className="input-unit">{task.inputConfig.unit}</span>
          </div>
          {/* ✅ YANGI: Validation hint */}
          {task.inputConfig.min && (
            <div className="input-hint">
              Minimal: {task.inputConfig.min} {task.inputConfig.unit}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Task icon'lari (o'zgarishsiz)
const getTaskIcon = (iconType) => {
  const icons = {
    prayer: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7v10c0 5.55 3.84 10 9 9 5.16-1 9-3.45 9-9V7l-10-5z" />
        <path d="M12 17.5c-2.5 0-4.5-2-4.5-4.5S9.5 8.5 12 8.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
      </svg>
    ),
    heart: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    audio: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
    donate: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    book: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    education: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    headphones: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
    sleep: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    sunrise: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 18a5 5 0 0 0-10 0" />
        <line x1="12" y1="2" x2="12" y2="9" />
        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
        <line x1="1" y1="18" x2="3" y2="18" />
        <line x1="21" y1="18" x2="23" y2="18" />
        <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
        <line x1="23" y1="22" x2="1" y2="22" />
        <polyline points="8,6 12,2 16,6" />
      </svg>
    ),
    activity: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2v6h.01L8 14.01V22h8v-7.99L17.99 8H18V2" />
        <path d="M8 22v-7" />
        <path d="M16 22v-7" />
      </svg>
    ),
  };

  return icons[iconType] || icons.book;
};

// Helper icon'lar
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2v6h.01L8 14.01V22h8v-7.99L17.99 8H18V2" />
    <path d="M8 22v-7" />
    <path d="M16 22v-7" />
  </svg>
);

const SaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

export const LoadingSkeleton = () => (
  <div className="tasks-container">
    <div className="tasks-header">
      <div className="loading-skeleton">
        <div className="skeleton-title"></div>
        <div className="skeleton-progress"></div>
        <div className="skeleton-stats-container">
          <div className="skeleton-stats"></div>
          <div className="skeleton-stats"></div>
          <div className="skeleton-stats"></div>
        </div>
      </div>
    </div>
  </div>
);

export default DailyTasks;
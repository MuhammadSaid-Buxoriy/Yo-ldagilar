// Step 3: Updated components/auth/AuthCheck.jsx - WITH DEV MODE
import { useState, useEffect } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import APIService from "../../services/api";
import "./AuthCheck.css";

const AuthCheck = ({ children }) => {
  const { user, isReady, tg, } = useTelegram();
  const [authStatus, setAuthStatus] = useState("checking");
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isReady) {
      setTimeout(() => setIsAnimating(true), 300);

      if (user) {
        checkUserAuth();
      } else {
        setAuthStatus("no_user");
      }
    }
  }, [isReady, user]);

  const checkUserAuth = async () => {
    try {
      setAuthStatus("checking");
      setError(null);

      const response = await APIService.checkUserAuth(user.id);

      if (response.success) {
        if (response.isRegistered && response.isApproved) {
          setAuthStatus("approved");
        } else if (response.isRegistered && !response.isApproved) {
          setAuthStatus("not_approved");
        } else {
          setAuthStatus("not_registered");
        }
      } else {
        setAuthStatus("not_registered");
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      setError(error.message);
      setAuthStatus("error");
    }
  };

  const handleStartBot = () => {
    if (tg) {
      tg.close();
    } else {
      window.open("https://t.me/yuldagilar_bot?start=register", "_blank");
    }
  };

  const handleBackToBot = () => {
    if (tg) {
      tg.close();
    } else {
      window.open("https://t.me/yuldagilar_bot", "_blank");
    }
  };

  const retryAuth = () => {
    if (user) {
      checkUserAuth();
    } else {
      setAuthStatus("no_user");
    }
  };

  // If approved, show main app
  if (authStatus === "approved") {
    return children;
  }

  const getStatusConfig = () => {
    switch (authStatus) {
      case "checking":
        return {
          bgClass: "auth-checking",
          icon: (
            <svg
              className="auth-spinner"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          ),
          iconColor: "#3b82f6",
          title: "Tekshirilmoqda...",
          message:
            "Iltimos, biroz kuting. Sizning ma'lumotlaringiz tekshirilmoqda.",
          buttonText: "Kuting...",
          buttonDisabled: true,
          showProgress: true,
        };

      case "no_user":
      case "not_registered":
        return {
          bgClass: "auth-not-registered",
          icon: (
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="18" y1="8" x2="23" y2="13" />
              <line x1="23" y1="8" x2="18" y2="13" />
            </svg>
          ),
          iconColor: "#ef4444",
          title: "Ro'yxatdan o'tmagan",
          message:
            "Siz hali ro'yxatdan o'tmagansiz. Iltimos, avval @yuldagilar_bot da /start buyrug'ini bosib ro'yxatdan o'ting.",
          buttonText: "@yuldagilar_bot ga o'tish",
          buttonIcon: (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          ),
          buttonAction: handleStartBot,
          showHelp: true,
        };

      case "not_approved":
        return {
          bgClass: "auth-not-approved",
          icon: (
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
          iconColor: "#f59e0b",
          title: "Tasdiq kutilmoqda",
          message:
            "Siz ro'yxatdan o'tgansiz, lekin admin tomonidan hali tasdiqlanmagan. Iltimos, kuting yoki adminga murojaat qiling.",
          buttonText: "@yuldagilar_bot ga qaytish",
          buttonIcon: (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          ),
          buttonAction: handleBackToBot,
          showHelp: true,
        };

      case "error":
        return {
          bgClass: "auth-error",
          icon: (
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
          iconColor: "#ef4444",
          title: "Xatolik yuz berdi",
          message:
            error ||
            "Tizimda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
          buttonText: "Qayta urinish",
          buttonIcon: (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          ),
          buttonAction: retryAuth,
          showHelp: true,
        };

      default:
        return {
          bgClass: "auth-approved",
          icon: (
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          ),
          iconColor: "#10b981",
          title: "Muvaffaqiyatli!",
          message: "Siz tasdiqlangansiz. Ilova ochilmoqda...",
          buttonText: "Davom etish",
          buttonAction: () => {},
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`auth-container ${config.bgClass}`}>
      <div className={`auth-content ${isAnimating ? "auth-visible" : ""}`}>
        {/* Header */}
        <div className="auth-header">
          <div className="auth-header-decoration"></div>
          <div className="auth-header-content">
            <div className="auth-logo">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <h1 className="auth-header-title">Yo'ldagilar</h1>
            <p className="auth-header-subtitle">
              Yo'lga chiq - Yo'ldan chiqma!
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="auth-main-card">
          {/* Status Section */}
          <div className="auth-status">
            <div className="auth-icon" style={{ color: config.iconColor }}>
              {config.icon}
            </div>

            <h2 className="auth-title">{config.title}</h2>
            <p className="auth-message">{config.message}</p>

            {/* Progress Bar */}
            {config.showProgress && (
              <div className="auth-progress">
                <div className="auth-progress-track">
                  <div className="auth-progress-fill"></div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={config.buttonAction}
            disabled={config.buttonDisabled}
            className={`auth-button ${config.buttonDisabled ? "disabled" : ""}`}
          >
            {config.buttonIcon && (
              <span className="auth-button-icon">{config.buttonIcon}</span>
            )}
            <span className="auth-button-text">{config.buttonText}</span>
          </button>

          {/* Help Section */}
          {config.showHelp && (
            <div className="auth-help">
              <p className="auth-help-text">
                Muammo bo'lsa, admin bilan bog'laning:{" "}
                <span className="auth-admin-link">@muhammadsaid_buxoriy</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            © 2025 Yo'ldagilar Challenge Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCheck;

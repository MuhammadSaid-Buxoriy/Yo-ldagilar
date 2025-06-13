import { createContext, useContext, useEffect, useState } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import APIService from "../../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user: tgUser } = useTelegram(); // Faqat ID uchun!
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // User yuklanyaptimi?
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tgUser?.id) {
      setLoading(true);
      setError(null);
      APIService.getUserProfile(tgUser.id)
        .then((userData) => {
          setUser(userData);
          setLoading(false);
        })
        .catch((err) => {
          setError(err?.message || "User ma’lumotini olishda xatolik.");
          setLoading(false);
        });
    }
  }, [tgUser]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => useContext(AuthContext);

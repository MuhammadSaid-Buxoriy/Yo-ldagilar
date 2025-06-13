// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useTelegram } from "../../hooks/useTelegram";
import APIService from "../../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user: tgUser } = useTelegram();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (tgUser?.id) {
      APIService.getUserProfile(tgUser.id).then(setUser);
    }
  }, [tgUser]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

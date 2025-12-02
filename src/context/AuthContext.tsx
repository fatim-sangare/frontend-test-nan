import React, { createContext, useContext, useEffect, useState } from "react";

export interface IUser { _id: string; email: string; createdAt?: string }

interface AuthCtx {
  user: IUser | null;
  token: string | null;
  login: (token: string, user: IUser) => void;
  logout: () => void;
  ready: boolean;
}

const defaultVal: AuthCtx = {
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  ready: false,
};

export const AuthContext = createContext<AuthCtx>(defaultVal);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // sync token/user with localStorage
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");

    setReady(true);
  }, [token, user]);

  const login = (t: string, u: IUser) => {
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // keep it explicit
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

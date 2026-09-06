"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getMe, login as apiLogin, register as apiRegister } from "@/services/api";
import { getToken, setToken, clearToken } from "@/services/auth";
import type { Shop, User } from "@/services/api";

type AuthContextValue = {
  user: User | null;
  shop: Shop | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    phone: string;
    password: string;
    shop_name?: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMe();
        if (cancelled) return;
        setUser(res.user);
        setShop(res.shop);
      } catch {
        clearToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await apiLogin(phone, password);
    setToken(res.token);
    setUser(res.user);
    setShop(res.shop);
  }, []);

  const register = useCallback(
    async (payload: { name: string; phone: string; password: string; shop_name?: string }) => {
      const res = await apiRegister(payload);
      setToken(res.token);
      setUser(res.user);
      setShop(res.shop);
    },
    []
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setShop(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, shop, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
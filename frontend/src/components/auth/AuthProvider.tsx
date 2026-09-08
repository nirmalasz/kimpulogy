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
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    shop_name?: string;
  }) => Promise<void>;
  logout: () => void;
  setShopName: (name: string) => void;
  setProfile: (name: string, email: string, avatar_url?: string) => void;
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.token);
    setUser(res.user);
    setShop(res.shop);
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; shop_name?: string }) => {
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

  const setShopName = useCallback((name: string) => {
    setShop((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  const setProfile = useCallback((name: string, email: string, avatar_url?: string) => {
    setUser((prev) =>
      prev ? { ...prev, name, email, avatar_url: avatar_url ?? prev.avatar_url } : prev
    );
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, shop, loading, login, register, logout, setShopName, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
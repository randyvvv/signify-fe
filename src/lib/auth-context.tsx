"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, getToken, setToken, ApiError } from "./api";
import { clearCache, readCache, writeCache } from "./cache";

const USER_CACHE_KEY = "me";

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  gender?: "male" | "female" | null;
  bio?: string | null;
  avatarUrl: string | null;
  coins: number;
  streakCount: number;
  totalLearningSeconds?: number;
  rank?: number;
  totalLearningHours?: number;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Tampilkan user ter-cache dulu supaya halaman tidak menunggu /api/me.
    const cached = readCache<User>(USER_CACHE_KEY);
    if (cached) {
      setUser(cached);
      setLoading(false);
    }
    try {
      const me = await api.get<User>("/api/me");
      writeCache(USER_CACHE_KEY, me);
      setUser(me);
    } catch (err) {
      // Token invalid/expired -> clear it.
      if (err instanceof ApiError && err.status === 401) {
        setToken(null);
        clearCache();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });
    setToken(res.token);
    clearCache();
    writeCache(USER_CACHE_KEY, res.user);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const res = await api.post<AuthResponse>("/api/auth/register", {
        email,
        password,
        ...(fullName ? { fullName } : {}),
      });
      setToken(res.token);
      clearCache();
      writeCache(USER_CACHE_KEY, res.user);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    clearCache();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

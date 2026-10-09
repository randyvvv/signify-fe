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
  /** false = akun Google yang belum punya password. */
  hasPassword?: boolean;
  googleLinked?: boolean;
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

interface GoogleAuthResponse extends AuthResponse {
  isNewUser: boolean;
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
  /** Tukar ID token Google (dari tombol Google) dengan sesi Signify. */
  loginWithGoogle: (credential: string) => Promise<{ isNewUser: boolean }>;
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

  // Simpan sesi baru dari login/register (password maupun Google).
  const startSession = useCallback((res: AuthResponse) => {
    setToken(res.token);
    clearCache();
    writeCache(USER_CACHE_KEY, res.user);
    setUser(res.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>("/api/auth/login", {
        email,
        password,
      });
      startSession(res);
    },
    [startSession],
  );

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const res = await api.post<AuthResponse>("/api/auth/register", {
        email,
        password,
        ...(fullName ? { fullName } : {}),
      });
      startSession(res);
    },
    [startSession],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const res = await api.post<GoogleAuthResponse>("/api/auth/google", { credential });
      startSession(res);
      return { isNewUser: res.isNewUser };
    },
    [startSession],
  );

  const logout = useCallback(() => {
    setToken(null);
    clearCache();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout, refresh }}
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

"use client";

// Cache respons API di localStorage (stale-while-revalidate): halaman langsung
// tampil dari data terakhir, lalu diperbarui diam-diam setelah request selesai.
import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const PREFIX = "signify_cache:";

export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage penuh / diblokir: abaikan */
  }
}

/** Hapus semua cache (dipanggil saat login/logout supaya data tidak bocor antar akun). */
export function clearCache(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    /* abaikan */
  }
}

/**
 * GET dengan cache: kembalikan data ter-cache (bila ada) sambil mengambil versi
 * terbaru. `key` null = nonaktif (mis. user belum ada).
 */
export function useCachedGet<T>(path: string, key: string | null) {
  const cached = useMemo(() => (key ? readCache<T>(key) : null), [key]);
  const [fresh, setFresh] = useState<{ key: string; data: T } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api
      .get<T>(path)
      .then((data) => {
        if (cancelled) return;
        writeCache(key, data);
        setFresh({ key, data });
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const data = fresh && fresh.key === key ? fresh.data : cached;
  return { data, error: !data && failedKey === key };
}

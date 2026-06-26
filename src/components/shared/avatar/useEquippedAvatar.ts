"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// VRM bawaan kalau shop belum termuat / user belum punya pilihan.
export const FALLBACK_VRM = "/avatar.vrm";

interface AvatarShopItem {
  imageUrl: string | null;
  isDefault: boolean;
  equipped: boolean;
}

/**
 * Mengambil URL model VRM yang sedang dipakai user dari shop (kategori "Avatar").
 * Prioritas: item ter-equip -> item default -> FALLBACK_VRM.
 * Path .vrm disimpan backend di kolom `imageUrl`.
 */
export function useEquippedAvatar(): string {
  const [vrmUrl, setVrmUrl] = useState<string>(FALLBACK_VRM);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AvatarShopItem[]>("/api/shop/items?category=Avatar")
      .then((items) => {
        if (cancelled) return;
        const chosen =
          items.find((i) => i.equipped) ??
          items.find((i) => i.isDefault) ??
          items[0];
        if (chosen?.imageUrl) setVrmUrl(chosen.imageUrl);
      })
      .catch(() => {
        /* diam: pakai FALLBACK_VRM */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return vrmUrl;
}

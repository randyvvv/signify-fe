"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Avatar bawaan (Microsoft Rocketbox Female Adult 01) kalau shop belum termuat /
// user belum punya pilihan.
export const FALLBACK_VRM = "/avatars/female-adult-01.glb";

// Path .vrm lama (anime VRoid) yang mungkin masih tersimpan di data shop backend ->
// avatar Rocketbox (realistis, berpakaian sopan) penggantinya.
const LEGACY_AVATARS: Record<string, string> = {
  "/avatar.vrm": "/avatars/female-adult-01.glb",
  "/avatar-b.vrm": "/avatars/male-adult-01.glb",
  "/avatar-c.vrm": "/avatars/female-adult-02.glb",
};

export function resolveAvatarUrl(url: string): string {
  return LEGACY_AVATARS[url] ?? url;
}

/** Gambar kecil avatar untuk Shop: file .webp bernama sama di sebelah model .glb. */
export function avatarThumbnail(url: string): string | null {
  const model = resolveAvatarUrl(url);
  return model.endsWith(".glb") ? model.replace(/\.glb$/, ".webp") : null;
}

interface ShopItemLite {
  category: string;
  name: string;
  imageUrl: string | null;
  color: string | null;
  isDefault: boolean;
  equipped: boolean;
}

export interface EquippedAvatar {
  /** Path model yang dipakai (kategori "Avatar", .glb Rocketbox atau .vrm lama). */
  vrmUrl: string;
  hairColor: string | null;
  eyeColor: string | null;
  accessory: string | null;
}

// Pilih item ter-equip; kalau tak ada, pakai default; kalau tak ada juga, item pertama.
function pick(items: ShopItemLite[], category: string): ShopItemLite | undefined {
  const inCat = items.filter((i) => i.category === category);
  return inCat.find((i) => i.equipped) ?? inCat.find((i) => i.isDefault) ?? inCat[0];
}

/**
 * Mengambil kustomisasi avatar yang sedang dipakai user dari shop, supaya avatar
 * yang berisyarat (live-translator) tampil sama dengan yang di-set di shop.
 * Path .vrm disimpan backend di kolom `imageUrl` kategori "Avatar".
 */
export function useEquippedAvatar(): EquippedAvatar {
  const [eq, setEq] = useState<EquippedAvatar>({
    vrmUrl: FALLBACK_VRM,
    hairColor: null,
    eyeColor: null,
    accessory: null,
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get<ShopItemLite[]>("/api/shop/items")
      .then((items) => {
        if (cancelled) return;
        const avatar = pick(items, "Avatar");
        const hair = pick(items, "Hair");
        const eye = pick(items, "Eye Color");
        // Aksesoris tak punya default -> hanya kalau benar-benar di-equip.
        const acc = items.find((i) => i.category === "Accessories" && i.equipped);
        setEq({
          vrmUrl: avatar?.imageUrl || FALLBACK_VRM,
          hairColor: hair?.color ?? null,
          eyeColor: eye?.color ?? null,
          accessory: acc?.name ?? null,
        });
      })
      .catch(() => {
        /* diam: pakai default */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return eq;
}

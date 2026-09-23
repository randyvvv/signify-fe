"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Coins,
  Eye,
  Glasses,
  Loader2,
  Lock,
  Palette,
  RotateCcw,
  Save,
  Scissors,
  Search,
  SearchX,
  ShoppingBag,
  Sparkles,
  Undo2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignAvatarViewer } from "@/components/shared";
import { FALLBACK_VRM } from "@/components/shared/avatar/useEquippedAvatar";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string | null;
  color: string | null;
  isDefault: boolean;
  isOwned: boolean;
  equipped: boolean;
}

const CATEGORIES = ["Avatar", "Hair", "Eye Color", "Accessories", "Background"];

const CATEGORY_META: Record<string, { icon: LucideIcon; tone: string; desc: string }> = {
  Avatar: { icon: UserRound, tone: "bg-teal-50 text-teal-600", desc: "Pick the 3D model that signs for you" },
  Hair: { icon: Scissors, tone: "bg-rose-50 text-rose-500", desc: "Recolor your avatar's hair" },
  "Eye Color": { icon: Eye, tone: "bg-sky-50 text-sky-600", desc: "Change the color of the eyes" },
  Accessories: { icon: Glasses, tone: "bg-violet-50 text-violet-600", desc: "Finish the look with glasses or a hat" },
  Background: { icon: Palette, tone: "bg-amber-50 text-amber-600", desc: "Set the stage behind your avatar" },
};

type EquippedMap = Record<string, ShopItem | null>;

function buildEquipped(list: ShopItem[]): EquippedMap {
  const map: EquippedMap = {};
  for (const c of CATEGORIES) map[c] = null;
  for (const it of list) if (it.equipped) map[it.category] = it;
  // fallback ke item default kalau kategori belum ada yang dipakai
  for (const c of CATEGORIES) {
    if (!map[c]) map[c] = list.find((i) => i.category === c && i.isDefault) ?? null;
  }
  return map;
}

function sameLook(a: EquippedMap, b: EquippedMap) {
  return CATEGORIES.every((c) => (a[c]?.id ?? null) === (b[c]?.id ?? null));
}

/** Gambar item: swatch warna, model VRM (Avatar), atau ikon cadangan. */
function ItemVisual({ item }: { item: ShopItem }) {
  if (item.color && item.category === "Background") {
    return (
      <div
        className="absolute inset-3 rounded-xl shadow-inner ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ backgroundColor: item.color }}
      >
        <UserRound className="absolute bottom-2 left-1/2 h-10 w-10 -translate-x-1/2 text-slate-900/10" />
      </div>
    );
  }
  if (item.color) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative h-20 w-20 rounded-full shadow-lg ring-4 ring-white transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundColor: item.color }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/45 via-transparent to-black/10" />
        </div>
      </div>
    );
  }
  if (item.category === "Avatar" && item.imageUrl) {
    // Preview VRM asli tiap model -> beda jelas antar avatar.
    return (
      <SignAvatarViewer
        vrmUrl={item.imageUrl}
        className="pointer-events-none absolute inset-0 h-full w-full"
        placeholder=""
      />
    );
  }
  const emoji =
    item.category === "Hair"
      ? "💇‍♀️"
      : item.category === "Accessories"
        ? item.name.toLowerCase().includes("hat")
          ? "🎩"
          : "👓"
        : "📦";
  return (
    <div className="absolute inset-0 flex items-center justify-center text-5xl transition-transform duration-500 group-hover:scale-110">
      {emoji}
    </div>
  );
}

/** Tombol aksi item: Buy / Equip / Equipped (+ Unequip) / Locked. */
function ItemAction({
  item,
  isEquipped,
  balance,
  buyingId,
  onBuy,
  onEquip,
  onUnequip,
  className,
}: {
  item: ShopItem;
  isEquipped: boolean;
  balance: number;
  buyingId: string | null;
  onBuy: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
  onUnequip?: (item: ShopItem) => void;
  className?: string;
}) {
  const base =
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed";

  if (isEquipped) {
    if (onUnequip && !item.isDefault) {
      return (
        <button
          type="button"
          onClick={() => onUnequip(item)}
          className={cn(base, "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-[#DF5D73] hover:ring-rose-200", className)}
        >
          <Undo2 className="h-4 w-4" /> Unequip
        </button>
      );
    }
    return (
      <button type="button" disabled className={cn(base, "bg-teal-50 text-[#0B7077] ring-1 ring-teal-100 disabled:cursor-default", className)}>
        <Check className="h-4 w-4" /> Equipped
      </button>
    );
  }

  if (item.isOwned) {
    return (
      <button
        type="button"
        onClick={() => onEquip(item)}
        className={cn(base, "bg-[#0B7077]/10 text-[#0B7077] hover:bg-[#0B7077] hover:text-white", className)}
      >
        Equip
      </button>
    );
  }

  const affordable = balance >= item.price;
  const buying = buyingId === item.id;
  if (!affordable) {
    return (
      <button
        type="button"
        disabled
        title={`You need ${item.price - balance} more coins`}
        className={cn(base, "bg-slate-100 text-slate-400", className)}
      >
        <Lock className="h-4 w-4" /> {item.price.toLocaleString()}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onBuy(item)}
      disabled={buyingId !== null}
      className={cn(
        base,
        "bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] text-white shadow-sm shadow-teal-900/10 hover:shadow-md hover:brightness-105 disabled:opacity-60",
        className,
      )}
    >
      {buying ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Buying…
        </>
      ) : (
        <>
          Buy <span className="text-white/60">·</span>
          <Coins className="h-4 w-4 text-[#FFE75C]" />
          {item.price.toLocaleString()}
        </>
      )}
    </button>
  );
}

function ItemSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white p-2 ring-1 ring-slate-100">
      <div className="aspect-square animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="space-y-2 px-2 py-3">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200/70" />
        <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-slate-200/70" />
      </div>
    </div>
  );
}

export default function ShopUI() {
  const { user, refresh } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipped, setEquipped] = useState<EquippedMap>({});
  // Tampilan yang terakhir tersimpan di server -> penanda "unsaved changes".
  const [saved, setSaved] = useState<EquippedMap>({});
  // Try-on: item yang sedang dipratinjau di avatar (per kategori). Bisa berisi
  // item yang BELUM dibeli — supaya user bisa lihat dulu sebelum beli.
  const [preview, setPreview] = useState<EquippedMap>({});
  // Item yang terakhir diklik -> menentukan tombol aksi (Buy/Equip).
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Avatar");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Saldo: dari user (auth). Setelah beli, saldo dari respons purchase dipakai
  // sampai refresh() user menyusul (tanpa setState di dalam effect).
  const userCoins = user?.coins ?? 0;
  const [purchased, setPurchased] = useState<{ base: number; balance: number } | null>(null);
  const balance = purchased && purchased.base === userCoins ? purchased.balance : userCoins;

  useEffect(() => {
    api
      .get<ShopItem[]>("/api/shop/items")
      .then((list) => {
        setItems(list);
        const map = buildEquipped(list);
        setEquipped(map);
        setSaved(map);
        setPreview(map);
      })
      .catch(() => toast.error("Gagal memuat shop"))
      .finally(() => setLoading(false));
  }, []);

  // Klik kartu item: pratinjau di avatar + jadikan item terpilih (belum membeli).
  const selectItem = (item: ShopItem) => {
    setSelected(item);
    setPreview((p) => ({ ...p, [item.category]: item }));
  };

  // Pasang item yang sudah dimiliki ke avatar (commit ke equipped).
  const equipItem = (item: ShopItem) => {
    setEquipped((prev) => ({ ...prev, [item.category]: item }));
    setPreview((prev) => ({ ...prev, [item.category]: item }));
    setSelected(item);
  };

  // Lepas item non-default -> kembali ke item default kategori (atau kosong).
  const unequipItem = (item: ShopItem) => {
    const fallback = items.find((i) => i.category === item.category && i.isDefault) ?? null;
    setEquipped((prev) => ({ ...prev, [item.category]: fallback }));
    setPreview((prev) => ({ ...prev, [item.category]: fallback }));
    setSelected(fallback);
  };

  // Beli item terpilih, lalu langsung dipasang.
  const buyItem = async (item: ShopItem) => {
    setBuyingId(item.id);
    try {
      const res = await api.post<{ balance: number }>(
        `/api/shop/items/${item.id}/purchase`,
      );
      const owned = { ...item, isOwned: true };
      setItems((prev) => prev.map((i) => (i.id === item.id ? owned : i)));
      setPurchased({ base: userCoins, balance: res.balance });
      refresh();
      setEquipped((prev) => ({ ...prev, [item.category]: owned }));
      setPreview((prev) => ({ ...prev, [item.category]: owned }));
      setSelected(owned);
      toast.success(`${item.name} purchased & equipped!`, {
        description: `${item.price} coins deducted.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal membeli item";
      toast.error("Gagal membeli", { description: msg });
    } finally {
      setBuyingId(null);
    }
  };

  const resetToDefault = () => {
    const def: EquippedMap = {};
    for (const c of CATEGORIES) {
      def[c] = items.find((i) => i.category === c && i.isDefault) ?? null;
    }
    setEquipped(def);
    setPreview(def);
    setSelected(null);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const map: Record<string, string | null> = {};
      for (const c of CATEGORIES) map[c] = equipped[c]?.id ?? null;
      await api.put("/api/shop/avatar", { equipped: map });
      // Pratinjau yang belum dibeli/dipasang dibuang -> avatar = yang tersimpan.
      setPreview(equipped);
      setSaved(equipped);
      toast.success("Avatar saved!");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan avatar";
      toast.error("Gagal menyimpan", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const changeCategory = (cat: string) => {
    setActiveCategory(cat);
    setSearchQuery("");
  };

  // Status item terpilih untuk menentukan tombol aksi.
  const selCategory = selected?.category ?? "";
  const selEquipped =
    !!selected && equipped[selCategory]?.id === selected.id;

  const visible = items.filter(
    (item) =>
      item.category === activeCategory &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const dirty = !loading && !sameLook(saved, equipped);
  const tryingOn = !loading && !sameLook(preview, equipped);
  const ownedCount = items.filter((i) => i.isOwned).length;
  const stageColor = preview["Background"]?.color ?? null;
  const activeMeta = CATEGORY_META[activeCategory];

  const actionProps = {
    balance,
    buyingId,
    onBuy: buyItem,
    onEquip: equipItem,
  };

  return (
    <>
      {/* ===== Hero ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2DA5A2] via-[#1c8d8a] to-[#0B7077] p-6 text-white shadow-lg shadow-teal-900/10 md:p-8">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{ backgroundImage: "url('/landing/corak.png')", backgroundSize: "cover" }}
        />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FFE75C]/25 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold md:text-3xl">Avatar Shop</h1>
              <p className="text-sm text-white/80">Spend your coins to give your signing avatar a fresh look</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {!loading && items.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold ring-1 ring-white/25 backdrop-blur">
                <ShoppingBag className="h-4 w-4" /> {ownedCount}/{items.length} owned
              </span>
            )}
            <div
              aria-live="polite"
              aria-label={`Coin balance: ${balance}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-amber-600 shadow-md"
            >
              <Coins className="h-5 w-5" />
              <span className="font-heading text-lg font-bold leading-none">{balance.toLocaleString()}</span>
              <span className="text-xs font-semibold text-amber-500/80">coins</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* ===== Avatar preview ===== */}
        <aside className="lg:sticky lg:top-8 lg:col-span-5 xl:col-span-4">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
            <div
              className={cn(
                "relative h-[320px] w-full overflow-hidden transition-colors duration-500 sm:h-[400px] lg:h-[clamp(260px,calc(100vh_-_26rem),460px)]",
                !stageColor && "bg-gradient-to-b from-[#C5FBF9] via-[#FDF5BF]/70 to-[#FAEEEF]",
              )}
              style={stageColor ? { backgroundColor: stageColor } : undefined}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.65),transparent_65%)]" />
              <div className="pointer-events-none absolute bottom-5 left-1/2 h-6 w-44 -translate-x-1/2 rounded-full bg-slate-900/10 blur-md" />
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3/4 w-2/5 animate-pulse rounded-[999px] bg-white/60" />
                </div>
              ) : (
                <SignAvatarViewer
                  vrmUrl={preview["Avatar"]?.imageUrl || FALLBACK_VRM}
                  hairColor={preview["Hair"]?.color ?? null}
                  eyeColor={preview["Eye Color"]?.color ?? null}
                  accessory={preview["Accessories"]?.name ?? null}
                  className="relative h-full w-full"
                  placeholder=""
                />
              )}
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#0B7077]" />
                {tryingOn ? "Trying on" : "Your look"}
              </span>
              {dirty && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#DF5D73] px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Unsaved
                </span>
              )}
            </div>

            {/* Tampilan per kategori (klik = buka kategori) */}
            <div className="grid grid-cols-5 gap-1 border-b border-slate-100 p-3">
              {CATEGORIES.map((c) => {
                const it = preview[c];
                const meta = CATEGORY_META[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => changeCategory(c)}
                    title={`${c}: ${it?.name ?? "None"}`}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1 rounded-2xl p-1.5 text-center transition-colors hover:bg-slate-50",
                      activeCategory === c && "bg-teal-50/70 ring-1 ring-teal-100 hover:bg-teal-50",
                    )}
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", meta.tone)}>
                      {it?.color ? (
                        <span
                          className="h-5 w-5 rounded-full shadow ring-2 ring-white"
                          style={{ backgroundColor: it.color }}
                        />
                      ) : (
                        <meta.icon className="h-4 w-4" />
                      )}
                    </span>
                    <span className="w-full truncate text-[11px] font-semibold leading-tight text-slate-700">
                      {loading ? "…" : it?.name ?? "None"}
                    </span>
                    <span className="w-full truncate text-[10px] leading-tight text-slate-400">{c}</span>
                  </button>
                );
              })}
            </div>

            {/* Aksi item terpilih: pratinjau dulu, lalu Buy/Equip. */}
            {selected && (
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">
                    {selEquipped ? "Equipped" : selected.isOwned ? "Owned" : "Previewing"} · {selected.category}
                  </p>
                  <p className="truncate font-heading font-bold text-slate-800">{selected.name}</p>
                  {!selected.isOwned && balance < selected.price && (
                    <p className="text-xs font-medium text-[#DF5D73]">
                      Need {(selected.price - balance).toLocaleString()} more coins
                    </p>
                  )}
                </div>
                <ItemAction
                  item={selected}
                  isEquipped={selEquipped}
                  onUnequip={unequipItem}
                  className="shrink-0"
                  {...actionProps}
                />
              </div>
            )}

            <div className="flex gap-3 p-4">
              <button
                type="button"
                onClick={resetToDefault}
                disabled={loading}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving || loading}
                className="relative inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2DA5A2] to-[#0B7077] text-sm font-semibold text-white shadow-sm shadow-teal-900/10 transition-all hover:shadow-md hover:brightness-105 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Changes"}
                {dirty && !saving && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#FFE75C] ring-2 ring-white" />
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* ===== Items ===== */}
        <section className="flex min-w-0 flex-col gap-5 lg:col-span-7 xl:col-span-8">
          <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <div className="inline-flex min-w-max rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Item categories">
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_META[cat].icon;
                  const count = items.filter((i) => i.category === cat).length;
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => changeCategory(cat)}
                      className={cn(
                        "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                        active ? "bg-white text-[#0B7077] shadow-sm" : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {cat}
                      {!loading && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-xs",
                            active ? "bg-teal-50 text-[#0B7077]" : "bg-white text-slate-500",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeCategory.toLowerCase()}…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-11 text-sm text-slate-800 transition-colors placeholder:text-slate-400 focus:border-[#2DA5A2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2DA5A2]/15"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", activeMeta.tone)}>
                <activeMeta.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-800">{activeCategory}</h2>
                <p className="text-xs text-slate-500">{activeMeta.desc}</p>
              </div>
            </div>
            {!loading && (
              <span className="shrink-0 text-sm text-slate-500">
                {visible.length} item{visible.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 6 }, (_, i) => (
                <ItemSkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <SearchX className="h-8 w-8" />
              </div>
              <p className="font-heading text-lg font-bold text-slate-700">No items found</p>
              <p className="max-w-sm text-sm text-slate-500">
                {searchQuery
                  ? `Nothing in ${activeCategory} matches "${searchQuery}".`
                  : `There are no ${activeCategory.toLowerCase()} items yet. Check back soon!`}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 rounded-full bg-[#0B7077] px-5 py-2 text-sm font-semibold text-white hover:bg-[#095d63]"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((item) => {
                const isEquipped = equipped[activeCategory]?.id === item.id;
                const isPreviewing = preview[activeCategory]?.id === item.id;
                const locked = !item.isOwned && balance < item.price;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                      isPreviewing
                        ? "ring-2 ring-[#2DA5A2] shadow-md shadow-teal-900/5"
                        : "ring-1 ring-slate-100 hover:ring-teal-200",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      aria-pressed={isPreviewing}
                      aria-label={`Preview ${item.name}`}
                      className="flex flex-col text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2DA5A2]/20"
                    >
                      <div className="relative m-2 mb-0 aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
                        <ItemVisual item={item} />
                        {isEquipped ? (
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#0B7077] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Equipped
                          </span>
                        ) : item.isOwned ? (
                          <span className="absolute left-2 top-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                            Owned
                          </span>
                        ) : null}
                        {locked ? (
                          <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          isPreviewing &&
                          !isEquipped && (
                            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#0B7077] shadow-sm">
                              <Eye className="h-3.5 w-3.5" /> Trying
                            </span>
                          )
                        )}
                      </div>
                      <div className="px-4 pt-3">
                        <h3 className="truncate font-heading font-semibold text-slate-800 transition-colors group-hover:text-[#0B7077]">
                          {item.name}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          {item.isOwned ? (
                            item.isDefault ? "Free · default" : "In your collection"
                          ) : (
                            <>
                              <Coins className="h-3.5 w-3.5 text-amber-500" />
                              <span className="font-bold text-amber-600">{item.price.toLocaleString()}</span>
                              coins
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                    <div className="mt-auto p-3">
                      <ItemAction item={item} isEquipped={isEquipped} className="w-full" {...actionProps} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

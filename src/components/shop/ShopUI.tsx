"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function ShopUI() {
  const { user, refresh } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [equipped, setEquipped] = useState<EquippedMap>({});
  // Try-on: item yang sedang dipratinjau di avatar (per kategori). Bisa berisi
  // item yang BELUM dibeli — supaya user bisa lihat dulu sebelum beli.
  const [preview, setPreview] = useState<EquippedMap>({});
  // Item yang terakhir diklik -> menentukan tombol aksi (Buy/Equip).
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Avatar");
  const [searchQuery, setSearchQuery] = useState("");
  const [balance, setBalance] = useState(0);
  const [saving, setSaving] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    setBalance(user?.coins ?? 0);
  }, [user]);

  useEffect(() => {
    api
      .get<ShopItem[]>("/api/shop/items")
      .then((list) => {
        setItems(list);
        const map = buildEquipped(list);
        setEquipped(map);
        setPreview(map);
      })
      .catch(() => toast.error("Gagal memuat shop"));
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

  // Beli item terpilih, lalu langsung dipasang.
  const buyItem = async (item: ShopItem) => {
    setBuying(true);
    try {
      const res = await api.post<{ balance: number }>(
        `/api/shop/items/${item.id}/purchase`,
      );
      const owned = { ...item, isOwned: true };
      setItems((prev) => prev.map((i) => (i.id === item.id ? owned : i)));
      setBalance(res.balance);
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
      setBuying(false);
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
      toast.success("Avatar saved!");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan avatar";
      toast.error("Gagal menyimpan", { description: msg });
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] gap-6 p-1">
      {/* Avatar Preview */}
      <div className="lg:w-1/3 flex flex-col gap-4">
        <div className="relative flex-1 bg-white rounded-3xl shadow-sm border border-neutral-100 p-4 min-h-[400px]">
          <div className="absolute top-6 right-6 z-10">
            <Badge
              variant="secondary"
              className="px-3 py-1.5 text-base font-bold bg-secondary text-primary shadow-sm gap-2"
            >
              {balance}
              <div className="w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center text-[10px] text-yellow-700">
                ©
              </div>
            </Badge>
          </div>
          <div
            className="h-[500px] lg:h-full w-full rounded-2xl overflow-hidden transition-colors duration-500"
            style={{ backgroundColor: preview["Background"]?.color || "#eef2ff" }}
          >
            <SignAvatarViewer
              vrmUrl={preview["Avatar"]?.imageUrl || FALLBACK_VRM}
              hairColor={preview["Hair"]?.color ?? null}
              eyeColor={preview["Eye Color"]?.color ?? null}
              accessory={preview["Accessories"]?.name ?? null}
              className="w-full h-full"
              placeholder=""
            />
          </div>
        </div>

        {/* Aksi item terpilih: pratinjau dulu, lalu Buy/Equip. */}
        {selected && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400">
                Previewing · {selected.category}
              </p>
              <p className="truncate font-semibold text-gray-800">
                {selected.name}
              </p>
            </div>
            {!selected.isOwned ? (
              <Button
                onClick={() => buyItem(selected)}
                disabled={buying}
                className="shrink-0 rounded-xl bg-quinary px-5 hover:bg-quinary/90 text-white font-semibold"
              >
                {buying ? "Buying..." : (
                  <span className="flex items-center gap-1">
                    Buy · {selected.price} <span className="text-[11px]">©</span>
                  </span>
                )}
              </Button>
            ) : selEquipped ? (
              <Button
                disabled
                className="shrink-0 rounded-xl bg-primary px-5 text-white font-semibold disabled:opacity-100"
              >
                <CheckCircle className="mr-1 h-4 w-4" /> Equipped
              </Button>
            ) : (
              <Button
                onClick={() => equipItem(selected)}
                className="shrink-0 rounded-xl bg-quinary px-5 hover:bg-quinary/90 text-white font-semibold"
              >
                Equip
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 py-6 rounded-xl border-quinary text-quinary hover:bg-quinary/5 hover:text-quinary"
            onClick={resetToDefault}
          >
            Reset to default
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving}
            className="flex-1 py-6 rounded-xl bg-quinary hover:bg-quinary/90 text-white font-semibold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Shop Interface */}
      <div className="lg:w-2/3 flex flex-col bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex p-1 bg-gray-50 rounded-xl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchQuery("");
                }}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
                  activeCategory === cat
                    ? "bg-gradient-to-r from-[#C5FBF9] via-[#FDF5BF] to-[#FAEEEF] shadow-sm text-black"
                    : "text-black hover:text-gray-700",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((item) => {
              const isEquipped = equipped[activeCategory]?.id === item.id;
              const isPreviewing = preview[activeCategory]?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all cursor-pointer hover:border-primary/50",
                    isPreviewing
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : isEquipped
                        ? "border-primary/40 bg-primary/5"
                        : "border-gray-100 bg-white",
                  )}
                  onClick={() => selectItem(item)}
                >
                  {isEquipped && (
                    <div className="absolute top-3 right-3 text-primary">
                      <CheckCircle className="h-5 w-5 fill-primary text-white" />
                    </div>
                  )}

                  <div className="w-24 h-24 mb-3 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                    {item.color ? (
                      <div
                        className="w-16 h-16 rounded-full shadow-inner"
                        style={{ backgroundColor: item.color }}
                      />
                    ) : (
                      <div className="text-4xl text-gray-300">
                        {activeCategory === "Avatar"
                          ? "🧍"
                          : activeCategory === "Hair"
                            ? "💇‍♀️"
                            : activeCategory === "Accessories"
                              ? "👓"
                              : "📦"}
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-800 mb-2">{item.name}</h3>

                  {isEquipped ? (
                    <Badge className="px-4 py-1 rounded-full bg-primary hover:bg-primary">
                      Equipped
                    </Badge>
                  ) : item.isOwned ? (
                    <Badge
                      variant="secondary"
                      className="px-4 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      Owned
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="px-4 py-1 rounded-full bg-secondary text-primary hover:bg-secondary/80 flex items-center gap-1"
                    >
                      {item.price} <span className="text-[10px]">©</span>
                    </Badge>
                  )}
                </div>
              );
            })}
            {visible.length === 0 && (
              <p className="col-span-full text-center text-gray-400 py-8">
                No items found
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

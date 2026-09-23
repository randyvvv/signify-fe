"use client";

import ShopUI from "@/components/shop/ShopUI";

export default function ShopPage() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Hero (dengan saldo koin), pratinjau avatar & daftar item */}
      <ShopUI />
    </div>
  );
}

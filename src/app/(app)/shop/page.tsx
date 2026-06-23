"use client";

import ShopUI from "@/components/shop/ShopUI";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ShopPage() {
  return (
    <>
      <div className="flex h-full flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6 text-black" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-black">
              Shop
            </h1>
            <p className="text-sm text-grey">Customize your avatar</p>
          </div>
        </div>

        {/* Content */}
        <ShopUI />
      </div>
    </>
  );
}

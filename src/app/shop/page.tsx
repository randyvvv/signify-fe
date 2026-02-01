"use client";

import { MainLayout } from "@/components/layout";
import ShopUI from "@/components/shop/ShopUI";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ShopPage() {
  return (
    <MainLayout>
      <div className="flex h-full flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard" 
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
            >
               <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 leading-none">Shop</h1>
              <p className="text-sm text-gray-500 mt-1">Customize your avatar</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ShopUI />
      </div>
    </MainLayout>
  );
}

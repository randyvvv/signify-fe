"use client";

import { useState } from "react";
import { Search, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import AvatarCanvas from "./AvatarCanvas";
import { SHOP_ITEMS, ShopItem, ShopCategory } from "./data";
import { toast } from "sonner";

export default function ShopUI() {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("Hair");
  const [searchQuery, setSearchQuery] = useState("");
  const [userBalance, setUserBalance] = useState(602); // Mock balance
  
  // Initialize equipped items (mocking what comes from DB)
  const [items, setItems] = useState<ShopItem[]>(SHOP_ITEMS);
  const [equippedItems, setEquippedItems] = useState<Record<string, ShopItem | null>>({
    "Hair": items.find(i => i.category === "Hair" && i.isOwned) || null,
    "Eye Color": items.find(i => i.category === "Eye Color" && i.isOwned) || null,
    "Accessories": null,
    "Background": items.find(i => i.category === "Background" && i.isOwned) || null,
  });

  const categories: ShopCategory[] = ["Hair", "Eye Color", "Accessories", "Background"];

  const handleEquip = (item: ShopItem) => {
    if (!item.isOwned) {
      if (userBalance >= item.price) {
        // Buy logic
        setUserBalance(prev => prev - item.price);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, isOwned: true } : i));
        // Then equip
        setEquippedItems(prev => ({ ...prev, [item.category]: item }));
        toast.success(`${item.name} purchased and equipped!`, {
          description: `${item.price} coins deducted from your balance.`
        });
      } else {
        toast.error("Not enough coins!", {
          description: `You need ${item.price - userBalance} more coins to purchase this item.`
        });
      }
    } else {
      // Just equip
      setEquippedItems(prev => ({ ...prev, [item.category]: item }));
      toast.success(`${item.name} equipped!`);
    }
  };

  const resetToDefault = () => {
     // Functional reset logic - mocked
     setEquippedItems({
        "Hair": items.find(i => i.id === "h1") || null,
        "Eye Color": items.find(i => i.id === "e1") || null,
        "Accessories": null,
        "Background": items.find(i => i.id === "b1") || null,
     });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] gap-6 p-1">
      
      {/* Left Side: Avatar Preview - Sticky on Desktop */}
      <div className="lg:w-1/3 flex flex-col gap-4">
        {/* Avatar Card */}
        <div className="relative flex-1 bg-white rounded-3xl shadow-sm border border-neutral-100 p-4 min-h-[400px]">
           
           {/* Coin Balance Badge Floating */}
           <div className="absolute top-6 right-6 z-10">
              <Badge variant="secondary" className="px-3 py-1.5 text-base font-bold bg-secondary text-primary shadow-sm gap-2">
                {userBalance} 
                <div className="w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center text-[10px] text-yellow-700">©</div>
              </Badge>
           </div>

           {/* 3D Canvas */}
           <AvatarCanvas equippedItems={equippedItems} />
           
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 py-6 rounded-xl border-quinary text-quinary hover:bg-quinary/5 hover:text-quinary" onClick={resetToDefault}>
            Reset to default
          </Button>
          <Button className="flex-1 py-6 rounded-xl bg-quinary hover:bg-quinary/90 text-white font-semibold">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Right Side: Shop Interface */}
      <div className="lg:w-2/3 flex flex-col bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-100">
           {/* Search Bar */}
           <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input 
                 type="text" 
                 placeholder="Search items" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:target focus:border-transparent transition-all"
              />
           </div>

           {/* Categories */}
           <div className="flex p-1 bg-gray-50 rounded-xl">
              {categories.map(cat => (
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
                       : "text-black hover:text-gray-700"
                   )}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>

        {/* Items Grid */}
        <ScrollArea className="flex-1 p-6">
           <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {items
                .filter(item => item.category === activeCategory && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(item => {
                   const isEquipped = equippedItems[activeCategory]?.id === item.id;
                   
                   return (
                     <div key={item.id} className={cn(
                        "group relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all cursor-pointer hover:border-primary/50",
                        isEquipped ? "border-primary bg-primary/5" : "border-gray-100 bg-white"
                     )}
                     onClick={() => handleEquip(item)}
                     >
                       
                       {/* Equipped Indicator */}
                       {isEquipped && (
                          <div className="absolute top-3 right-3 text-primary">
                             <CheckCircle className="h-5 w-5 fill-primary text-white" />
                          </div>
                       )}

                       {/* Preview Image / Placeholder */}
                       <div className="w-24 h-24 mb-3 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                          {activeCategory === "Eye Color" || activeCategory === "Background" ? (
                             <div className="w-16 h-16 rounded-full shadow-inner" style={{ backgroundColor: item.color }} />
                          ) : (
                             // TODO: Replace with real item images/thumbnails
                             <div className="text-4xl text-gray-300">
                                {activeCategory === "Hair" ? "💇‍♀️" : activeCategory === "Accessories" ? "👓" : "📦"}
                             </div>
                          )}
                       </div>

                       {/* Item Name */}
                       <h3 className="font-semibold text-gray-800 mb-2">{item.name}</h3>

                       {/* Action Button */}
                       {item.isOwned ? (
                         <Badge variant={isEquipped ? "default" : "secondary"} className={cn(
                            "px-4 py-1 rounded-full",
                            isEquipped ? "bg-primary hover:bg-primary" : "bg-green-100 text-green-700 hover:bg-green-200"
                         )}>
                            {isEquipped ? "Equipped" : "Equip"}
                         </Badge>
                       ) : (
                         <Badge variant="secondary" className="px-4 py-1 rounded-full bg-secondary text-primary hover:bg-secondary/80 flex items-center gap-1">
                            {item.price} <span className="text-[10px]">©</span>
                         </Badge>
                       )}
                     </div>
                   );
                })}
           </div>
        </ScrollArea>

      </div>
    </div>
  );
}

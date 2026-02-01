export type ShopCategory = "Hair" | "Eye Color" | "Accessories" | "Background";

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: ShopCategory;
  image?: string; // URL for placeholder image
  color?: string; // For things like eye color
  isOwned: boolean;
}

// TODO: Replace these mock items with real data or API calls
export const SHOP_ITEMS: ShopItem[] = [
  // Hair
  { id: "h1", name: "Bun", price: 0, category: "Hair", isOwned: true }, // Default
  { id: "h2", name: "Braids", price: 200, category: "Hair", isOwned: false },
  { id: "h3", name: "Sideswept Bob", price: 200, category: "Hair", isOwned: false },
  { id: "h4", name: "Ponytail", price: 200, category: "Hair", isOwned: false },
  
  // Eye Color
  { id: "e1", name: "Brown", price: 0, category: "Eye Color", color: "#634e34", isOwned: true },
  { id: "e2", name: "Blue", price: 100, category: "Eye Color", color: "#2E5090", isOwned: false },
  { id: "e3", name: "Green", price: 100, category: "Eye Color", color: "#00BA6F", isOwned: false },

  // Accessories
  { id: "a1", name: "Glasses", price: 150, category: "Accessories", isOwned: false },
  { id: "a2", name: "Hat", price: 150, category: "Accessories", isOwned: false },

  // Background
  { id: "b1", name: "Studio", price: 0, category: "Background", color: "#f0f0f0", isOwned: true },
  { id: "b2", name: "Park", price: 300, category: "Background", color: "#c1e1c1", isOwned: false },
];

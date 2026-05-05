export type Category = string; // Dynamic categories now

export interface GroceryItem {
  price?: number;
  id: number;
  marathiName: string;
  englishName: string;
  category: string;
  typicalQuantity?: string;
  suggestedQuantities?: string[]; // AI-suggested quantity options specific to this item
  confidence?: number;
}

// Get catalog from localStorage or return base items (permanent items that cannot be removed)
import { getBaseCatalog } from "./base-items";

export function getCatalog(): GroceryItem[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("ai-catalog");
    if (stored) {
      try {
        const storedCatalog = JSON.parse(stored);
        // Merge with base items, avoiding duplicates by ID
        const baseItems = getBaseCatalog();
        const baseIds = new Set(baseItems.map(item => item.id));
        // Filter out stored items that have same ID as base items (to avoid duplicates)
        const filteredStored = (storedCatalog as GroceryItem[]).filter((item: GroceryItem) => !baseIds.has(item.id));
        // Return base items + filtered stored items
        return [...baseItems, ...filteredStored];
      } catch (e) {
        console.error("Failed to parse catalog:", e);
        // Return base items if storage is corrupted
        return getBaseCatalog();
      }
    }
  }
  // Return base items if nothing in storage
  return getBaseCatalog();
}

// Save catalog to localStorage (exclude base items as they are permanent)

export function saveCatalog(catalog: GroceryItem[]) {
  if (typeof window !== "undefined") {
    const baseItems = getBaseCatalog();
    const baseIds = new Set(baseItems.map(item => item.id));
    // Only save non-base items (items that can be removed)
    const nonBaseCatalog = catalog.filter(item => !baseIds.has(item.id));
    localStorage.setItem("ai-catalog", JSON.stringify(nonBaseCatalog));
  }
}

// Get dynamic categories from catalog
export function getDynamicCategories(): string[] {
  const catalog = getCatalog();
  const cats = [...new Set(catalog.map(item => item.category))];
  // Ensure "Other" is always present
  if (!cats.includes("Other")) {
    cats.push("Other");
  }
  return cats.sort();
}

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    "Grains": "🌾",
    "Pulses": "🫘",
    "Spices": "🌶️",
    "Dairy": "🥛",
    "Snacks": "🍪",
    "Beverages": "☕",
    "Oils": "🛢️",
    "Vegetables": "🥬",
    "Fruits": "🍎",
    "Personal Care": "🧴",
    "Household": "🏠",
    "Other": "📦",
  };
  return icons[category] || "📦";
};

export const getItemsByCategory = (): Record<string, GroceryItem[]> => {
  const catalog = getCatalog();
  const grouped: Record<string, GroceryItem[]> = {};

  catalog.forEach((item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  return grouped;
};

export const findItemById = (id: number): GroceryItem | undefined => {
  const catalog = getCatalog();
  return catalog.find(item => item.id === id);
};

// NOTE: Do not use this static constant - it only computes once at import time
// Use getDynamicCategories() to get fresh categories
// export const categories = getDynamicCategories();

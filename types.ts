export type Category = string; // Dynamic categories

export interface GroceryItem {
  price?: number;
  id: number;
  marathiName: string;
  englishName: string;
  category: Category;
  typicalQuantity?: string;
}

export interface MonthlyItem {
  id: number; // unique ID for this monthly list entry
  catalogItemId: number; // reference to the catalog item
  marathiName: string;
  name: string; // englishName
  category: Category;
  quantity: string;
  price?: number;
  checked: boolean;
  addedAt: string;
}

export interface MonthData {
  items: MonthlyItem[];
  totalBudget?: number;
}

export type MonthlyLists = Record<string, MonthData>;

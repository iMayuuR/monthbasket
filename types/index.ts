export type Category = string; // Dynamic categories

export interface GroceryItem {
  id: number;
  marathiName: string;
  englishName: string;
  category: Category;
  typicalQuantity?: string;
}

export interface MonthlyItem {
  id: number;
  catalogItemId?: number; // Original catalog item ID (for price memory)
  name: string;
  marathiName: string;
  quantity?: string;
  price?: number; // Price per unit in INR/Rupees
  checked: boolean;
  addedAt: string;
}

export interface MonthlyLists {
  [monthKey: string]: MonthData;
}

export interface MonthData {
  items: MonthlyItem[];
  totalBudget?: number; // Optional total budget for the month (if not itemizing)
}

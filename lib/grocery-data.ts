export type Category = "Grains" | "Pulses" | "Spices" | "Dairy" | "Snacks" | "Beverages" | "Other";

export interface GroceryItem {
  id: number;
  marathiName: string;
  englishName: string;
  category: Category;
  typicalQuantity?: string;
}

export const groceryCatalog: GroceryItem[] = [
  // Grains & Cereals (7)
  { id: 1, marathiName: "तांदूळ", englishName: "Rice", category: "Grains", typicalQuantity: "1 kg" },
  { id: 6, marathiName: "बाजरी", englishName: "Pearl Millet (Bajra)", category: "Grains", typicalQuantity: "1 kg" },
  { id: 7, marathiName: "ज्वारी", englishName: "Sorghum (Jowar)", category: "Grains", typicalQuantity: "1 kg" },
  { id: 9, marathiName: "गहू", englishName: "Wheat Flour", category: "Grains", typicalQuantity: "1 kg" },
  { id: 10, marathiName: "ओट्स", englishName: "Oats", category: "Grains", typicalQuantity: "500 gm" },
  { id: 13, marathiName: "मैदा", englishName: "All-purpose Flour", category: "Grains", typicalQuantity: "1 kg" },
  { id: 16, marathiName: "रवा", englishName: "Semolina (Rava)", category: "Grains", typicalQuantity: "500 gm" },

  // Pulses & Lentils (4)
  { id: 2, marathiName: "तूरडाळ", englishName: "Toor Dal (Pigeon Pea)", category: "Pulses", typicalQuantity: "1 kg" },
  { id: 3, marathiName: "मुगडाळ", englishName: "Moong Dal (Green Gram)", category: "Pulses", typicalQuantity: "1 kg" },
  { id: 4, marathiName: "साल काढलेली मुगडाळ", englishName: "Split Moong Dal (Hulled)", category: "Pulses", typicalQuantity: "500 gm" },
  { id: 20, marathiName: "बेसन", englishName: "Gram Flour (Besan)", category: "Pulses", typicalQuantity: "500 gm" },

  // Spices & Seasonings (5)
  { id: 5, marathiName: "खारी", englishName: "Baking Soda", category: "Spices", typicalQuantity: "100 gm" },
  { id: 18, marathiName: "मीठ", englishName: "Salt", category: "Spices", typicalQuantity: "1 kg" },
  { id: 19, marathiName: "हिंग", englishName: "Asafoetida (Hing)", category: "Spices", typicalQuantity: "50 gm" },
  { id: 21, marathiName: "तिखट", englishName: "Red Chili Powder", category: "Spices", typicalQuantity: "200 gm" },
  { id: 31, marathiName: "हळद पावडर", englishName: "Turmeric Powder", category: "Spices", typicalQuantity: "200 gm" },

  // Dairy (4)
  { id: 8, marathiName: "मखाणे", englishName: "Butter", category: "Dairy", typicalQuantity: "200 gm" },
  { id: 22, marathiName: "तूप", englishName: "Ghee (Clarified Butter)", category: "Dairy", typicalQuantity: "1 bottle" },
  { id: 25, marathiName: "दुध पावडर", englishName: "Milk Powder", category: "Dairy", typicalQuantity: "1 kg" },
  { id: 29, marathiName: "दूध", englishName: "Milk", category: "Dairy", typicalQuantity: "1 litre" },

  // Snacks (4)
  { id: 11, marathiName: "Classic लहान पोहे", englishName: "Classic Small Poha", category: "Snacks", typicalQuantity: "500 gm" },
  { id: 12, marathiName: "पोहे", englishName: "Poha (Flattened Rice)", category: "Snacks", typicalQuantity: "500 gm" },
  { id: 17, marathiName: "शेंगदाणे", englishName: "Shingada (Flattened Rice)", category: "Snacks", typicalQuantity: "500 gm" },
  { id: 33, marathiName: "बिस्किट", englishName: "Biscuits", category: "Snacks", typicalQuantity: "1 packet" },

  // Beverages (2)
  { id: 14, marathiName: "चहापावडर", englishName: "Tea Powder", category: "Beverages", typicalQuantity: "250 gm" },
  { id: 24, marathiName: "कॉफी", englishName: "Coffee", category: "Beverages", typicalQuantity: "100 gm" },

  // Spices (powders, etc.)
  { id: 15, marathiName: "साखर", englishName: "Sugar", category: "Spices", typicalQuantity: "1 kg" },

  // Other / Miscellaneous (6)
  { id: 23, marathiName: "कोकोनट", englishName: "Coconut", category: "Other", typicalQuantity: "1 piece" },
  { id: 26, marathiName: "बिमबार", englishName: "Baking Powder", category: "Other", typicalQuantity: "100 gm" },
  { id: 27, marathiName: "मेडिमिक्स", englishName: "Medicines", category: "Other", typicalQuantity: "as needed" },
  { id: 28, marathiName: "ग्लुको", englishName: "Glucose", category: "Other", typicalQuantity: "200 gm" },
  { id: 30, marathiName: "हापुस", englishName: "Alphonso Mango", category: "Other", typicalQuantity: "1 dozen" },
  { id: 32, marathiName: "तेल", englishName: "Cooking Oil", category: "Other", typicalQuantity: "1 litre" },
];

export const categories: Category[] = ["Grains", "Pulses", "Spices", "Dairy", "Snacks", "Beverages", "Other"];

export const getCategoryIcon = (category: Category): string => {
  const icons: Record<Category, string> = {
    Grains: "🌾",
    Pulses: "🫘",
    Spices: "🌶️",
    Dairy: "🥛",
    Snacks: "🍪",
    Beverages: "☕",
    Other: "📦",
  };
  return icons[category];
};

export const getItemsByCategory = (): Record<Category, GroceryItem[]> => {
  const grouped: Record<Category, GroceryItem[]> = {
    Grains: [],
    Pulses: [],
    Spices: [],
    Dairy: [],
    Snacks: [],
    Beverages: [],
    Other: [],
  };

  groceryCatalog.forEach((item) => {
    grouped[item.category].push(item);
  });

  return grouped;
};

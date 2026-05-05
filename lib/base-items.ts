import { GroceryItem } from "./grocery-data";

/**
 * Base grocery items that are always available in the catalog.
 * These items are parsed from the permanent list.txt and should not be deletable.
 */
export const BASE_GROCERY_ITEMS: GroceryItem[] = [
  { id: 1, marathiName: "तांदूळ", englishName: "Rice", category: "Grains", typicalQuantity: "1 kg" },
  { id: 2, marathiName: "तूरडाळ", englishName: "Pigeon Pea", category: "Pulses", typicalQuantity: "500 gm" },
  { id: 3, marathiName: "मुगडाळ", englishName: "Green Gram", category: "Pulses", typicalQuantity: "500 gm" },
  { id: 4, marathiName: "साल काढलेली मुगडाळ", englishName: "Peeled Green Gram", category: "Pulses", typicalQuantity: "500 gm" },
  { id: 5, marathiName: "खारी", englishName: "Salt", category: "Spices", typicalQuantity: "1 kg" },
  { id: 6, marathiName: "बाजरी", englishName: "Pearl Millet", category: "Grains", typicalQuantity: "1 kg" },
  { id: 7, marathiName: "ज्वारी", englishName: "Sorghum", category: "Grains", typicalQuantity: "1 kg" },
  { id: 8, marathiName: "मखाणे", englishName: "Fox Nuts", category: "Snacks", typicalQuantity: "200 gm" },
  { id: 9, marathiName: "गहू", englishName: "Wheat", category: "Grains", typicalQuantity: "1 kg" },
  { id: 10, marathiName: "ओट्स", englishName: "Oats", category: "Grains", typicalQuantity: "500 gm" },
  { id: 11, marathiName: "Classic लहान पोहे", englishName: "Classic Thin Poha", category: "Snacks", typicalQuantity: "500 gm" },
  { id: 12, marathiName: "पोहे", englishName: "Poha", category: "Snacks", typicalQuantity: "500 gm" },
  { id: 13, marathiName: "मैदा", englishName: "All-Purpose Flour", category: "Grains", typicalQuantity: "1 kg" },
  { id: 14, marathiName: "चहापावडर - 2", englishName: "Tea Powder", category: "Beverages", typicalQuantity: "2" }, // assuming 2 packets
  { id: 15, marathiName: "साखर रवा - अर्धा", englishName: "Sugar Semolina", category: "Grains", typicalQuantity: "अर्धा" }, // half
  { id: 16, marathiName: "शेंगदाणे", englishName: "Peanuts", category: "Snacks", typicalQuantity: "250 gm" },
  { id: 17, marathiName: "मीठ - 1 kg", englishName: "Sweet", category: "Snacks", typicalQuantity: "1 kg" },
  { id: 18, marathiName: "हिंग - 1", englishName: "Asafoetida", category: "Spices", typicalQuantity: "1" }, // 1 small box?
  { id: 19, marathiName: "बेसन - अर्धा", englishName: "Gram Flour", category: "Grains", typicalQuantity: "अर्धा" },
  { id: 20, marathiName: "तिखट - 100 gm", englishName: "Spicy Mix", category: "Snacks", typicalQuantity: "100 gm" },
  { id: 21, marathiName: "तूप - 1", englishName: "Ghee", category: "Dairy", typicalQuantity: "1" }, // 1 kg?
  { id: 22, marathiName: "कोकोनट", englishName: "Coconut", category: "Snacks", typicalQuantity: "1" },
  { id: 23, marathiName: "कॉफी", englishName: "Coffee", category: "Beverages", typicalQuantity: "250 gm" },
  { id: 24, marathiName: "दुध पावडर - 4 kg", englishName: "Milk Powder", category: "Dairy", typicalQuantity: "4 kg" },
  { id: 25, marathiName: "बिमबार", englishName: "Bimbark", category: "Other", typicalQuantity: "" }, // unknown
  { id: 26, marathiName: "मेडिमिक्स", englishName: "Medi Mix", category: "Other", typicalQuantity: "" },
  { id: 27, marathiName: "ग्लुको - 2", englishName: "Glucose", category: "Other", typicalQuantity: "2" },
  { id: 28, marathiName: "दूध - 1", englishName: "Milk", category: "Dairy", typicalQuantity: "1" }, // 1 liter?
  { id: 29, marathiName: "हापुस", englishName: "Hapus Mango", category: "Fruits", typicalQuantity: "1 kg" },
  { id: 30, marathiName: "हळद पावडर", englishName: "Turmeric Powder", category: "Spices", typicalQuantity: "100 gm" },
  { id: 31, marathiName: "तेल कम", englishName: "Less Oil", category: "Oils", typicalQuantity: "500 ml" },
  { id: 32, marathiName: "बिस्किट", englishName: "Biscuits", category: "Snacks", typicalQuantity: "1 packet" },
];

export function getBaseCatalog(): GroceryItem[] {
  return BASE_GROCERY_ITEMS;
}
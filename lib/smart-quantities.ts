import { GroceryItem } from "./grocery-data";

/**
 * Smart quantity suggestions based on Indian household usage patterns.
 * Learns from user selections over time to provide better defaults.
 */

// Common Indian household quantities for different item categories
const INDIAN_QUANTITY_PATTERNS: Record<string, string[]> = {
  // Grains & Cereals - typically bought in larger quantities
  "Grains": [
    "1 kg", "2 kg", "5 kg", "10 kg", "25 kg", "50 kg",
    "1 पाव", "2 पाव", "4 पाव", "1 सेर", "2 सेर", "5 सेर"
  ],

  // Pulses & Lentils - medium quantities
  "Pulses": [
    "250 gm", "500 gm", "1 kg", "2 kg", "5 kg",
    "1 पाव", "2 पाव", "4 पाव", "1 सेर", "2 सेर"
  ],

  // Spices - smaller quantities
  "Spices": [
    "50 gm", "100 gm", "200 gm", "500 gm", "1 kg",
    "1 डिब्बा", "2 डिब्बे", "छोटी डिब्बी", "बड़ी डिब्बी"
  ],

  // Dairy - variable based on consumption
  "Dairy": [
    "500 ml", "1 लिटर", "2 लिटर", "3 लिटर", "4 लिटर", "पैकेट",
    "1 kg दही", "2 kg दही", "पनीर 200gm", "पनीर 500gm"
  ],

  // Snacks & Packaged foods
  "Snacks": [
    "100 gm", "200 gm", "250 gm", "500 gm", "1 kg",
    "1 पैकेट", "2 पैकेट", "5 पैकेट", "डिब्बा"
  ],

  // Beverages
  "Beverages": [
    "100 gm", "200 gm", "250 gm", "500 gm", "1 kg",
    "100 ml", "200 ml", "500 ml", "1 लिटर", "2 लिटर",
    "1 पैकेट", "2 पैकेट"
  ],

  // Oils & Ghee
  "Oils": [
    "100 ml", "200 ml", "500 ml", "1 लिटर", "2 लिटर", "5 लिटर",
    "1 छोटी तिनकी", "1 बड़ी तिनकी", "घी 250gm", "घी 500gm", "घी 1kg"
  ],

  // Fruits & Vegetables - often by count or weight
  "Fruits": [
    "1 kg", "2 kg", "5 kg", "10 kg",
    "1 डर्जन", "2 डर्जन", "500gm", "250gm",
    "केला 1 डर्जन", "सेब 1 kg", "संतरा 1 kg"
  ],

  "Vegetables": [
    "250 gm", "500 gm", "1 kg", "2 kg", "5 kg",
    "1 बंधा", "2 बंधा", "गोभी 1 pieza", "टमाटर 500gm"
  ],

  // Personal Care & Household
  "Personal Care": [
    "100 ml", "200 ml", "500 ml", "1 लिटर",
    "1 ट्यूब", "2 ट्यूब", "1 साबुन", "4 साबुन", "शेमпу"
  ],

  "Household": [
    "1 टुकड़ा", "2 टुकड़े", "5 टुकड़े", "1 पैकेट", "2 पैकेट",
    "फिनाइल 500ml", "साबुन पाउडर 1kg"
  ],

  // Default fallback
  "Other": [
    "100 gm", "250 gm", "500 gm", "1 kg", "2 kg",
    "1 टुकड़ा", "2 टुकड़े", "1 पैकेट", "2 पैकेट", "100 ml", "500 ml"
  ]
};

/**
 * Storage key for user quantity preferences
 */
const USER_QUANTITY_PREFS_KEY = "user-quantity-preferences";

/**
 * Get stored user quantity preferences
 */
export function getUserQuantityPreferences(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(USER_QUANTITY_PREFS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to parse user quantity preferences:", e);
    return {};
  }
}

/**
 * Save user quantity preference for an item
 */
export function saveUserQuantityPreference(itemName: string, quantity: string): void {
  if (typeof window === "undefined") return;
  try {
    const prefs = getUserQuantityPreferences();
    if (!prefs[itemName]) {
      prefs[itemName] = [];
    }
    // Add to front (most recent first) and deduplicate
    const updated = [quantity, ...prefs[itemName].filter(q => q !== quantity)];
    // Keep only top 10 preferences
    prefs[itemName] = updated.slice(0, 10);
    localStorage.setItem(USER_QUANTITY_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to save user quantity preference:", e);
  }
}

/**
 * Get smart quantity suggestions for an item
 * Combines AI-suggested quantities, typical quantity, user preferences, and category patterns
 */
export function getSmartQuantitySuggestions(item: GroceryItem): string[] {
  // Start with AI-suggested quantities if available
  let suggestions: string[] = item.suggestedQuantities || [];

  // Add typical quantity if not already present
  if (item.typicalQuantity && !suggestions.includes(item.typicalQuantity)) {
    suggestions.unshift(item.typicalQuantity);
  }

  // Add user preferences for this specific item (highest priority)
  const userPrefs = getUserQuantityPreferences();
  const itemName = item.marathiName || item.englishName;
  if (userPrefs[itemName]) {
    // Add user preferences at the beginning (most recent first)
    const uniqueUserPrefs = userPrefs[itemName].filter(q => !suggestions.includes(q));
    suggestions = [...uniqueUserPrefs, ...suggestions];
  }

  // Add category-based patterns if we still need more suggestions
  if (suggestions.length < 5) {
    const categoryPatterns = INDIAN_QUANTITY_PATTERNS[item.category] || INDIAN_QUANTITY_PATTERNS["Other"];
    // Add patterns that aren't already in suggestions
    const uniquePatterns = categoryPatterns.filter(p => !suggestions.includes(p));
    suggestions = [...suggestions, ...uniquePatterns];
  }

  // Remove duplicates while preserving order
  const seen = new Set<string>();
  const uniqueSuggestions: string[] = [];
  for (const suggestion of suggestions) {
    if (!seen.has(suggestion)) {
      seen.add(suggestion);
      uniqueSuggestions.push(suggestion);
    }
  }

  // Limit to reasonable number (max 12 suggestions)
  return uniqueSuggestions.slice(0, 12);
}

/**
 * Get the best default quantity for an item
 * Uses smart suggestions and returns the most likely choice
 */
export function getDefaultQuantity(item: GroceryItem): string {
  const suggestions = getSmartQuantitySuggestions(item);
  return suggestions[0] || item.typicalQuantity || "1";
}

/**
 * Special handling for rice/tandul and other staples that Indians buy in bulk
 */
export function getBulkItemDefaultQuantity(item: GroceryItem): string {
  // Special case for rice and wheat - Indians often buy 5-25kg bags
  if (item.marathiName === "तांदूळ" || item.englishName.toLowerCase().includes("rice")) {
    // Check user preferences first
    const userPrefs = getUserQuantityPreferences();
    const itemName = item.marathiName || item.englishName;
    if (userPrefs[itemName] && userPrefs[itemName].length > 0) {
      return userPrefs[itemName][0]; // Most recent preference
    }
    // Default to 5kg for rice (common Indian household size)
    return "5 kg";
  }

  if (item.marathiName === "गहू" || item.englishName.toLowerCase().includes("wheat")) {
    const userPrefs = getUserQuantityPreferences();
    const itemName = item.marathiName || item.englishName;
    if (userPrefs[itemName] && userPrefs[itemName].length > 0) {
      return userPrefs[itemName][0];
    }
    return "5 kg"; // Common for wheat flour
  }

  // For other bulk items like pulses, suggest 1-2kg
  if (item.category === "Pulses" || item.category === "Grains") {
    const userPrefs = getUserQuantityPreferences();
    const itemName = item.marathiName || item.englishName;
    if (userPrefs[itemName] && userPrefs[itemName].length > 0) {
      return userPrefs[itemName][0];
    }
    return "1 kg";
  }

  // Fallback to smart quantity
  return getDefaultQuantity(item);
}
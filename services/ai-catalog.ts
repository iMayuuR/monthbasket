import { GoogleGenerativeAI } from "@google/generative-ai";

// Safe JSON extraction utility
function extractJSON(text: string): any {
  try {
    const jsonMatch = text.match(/(?:\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("JSON extraction failed:", error, "Raw text:", text.substring(0, 200));
    throw error;
  }
}

export interface CatalogItem {
  id: number;
  marathiName: string;
  englishName: string;
  category: string;
  typicalQuantity: string;
  suggestedQuantities?: string[]; // AI-suggested quantity options for this item
  confidence?: number;
}

export interface CategoryInfo {
  name: string;
  icon: string;
  description: string;
}

const GEMINI_STORAGE_KEY = "gemini_api_key";

// Fixed set of allowed categories (consistent with app)
const ALLOWED_CATEGORIES = [
  "Grains",
  "Pulses",
  "Spices",
  "Dairy",
  "Snacks",
  "Beverages",
  "Oils",
  "Vegetables",
  "Fruits",
  "Personal Care",
  "Household"
];

// Grocery store knowledge base for Indian context
const GROCERY_KNOWLEDGE = `
You are an expert in Indian/Marathi grocery inventory with deep knowledge of:

## MAJOR RETAILERS
- Reliance Fresh: Sells by weight (kg/gm), often 1kg packs for staples, fresh produce sold loose
- JioMart: Similar to Reliance, online delivery, standard pack sizes
- Blinkit: Quick commerce, smaller packs (250gm, 500gm) for trials, ready-to-eat items
- Reliance Smart: Mixed model, some items 500gm-2kg range
- BigBasket: Wide variety, multiple pack sizes
- DMart: Bulk-oriented, larger packs (2kg, 5kg), value pricing
- Nature's Basket: Premium, organic variants

## CATEGORY DEFINITIONS (with examples)
1. Grains & Cereals: Rice (tandul/চাওল), Wheat (gahu/गहू), Flour (maida/atta), Oats, Millets (bajri/jowar), Poha, Noodles, Pasta
2. Pulses & Lentils: All dals (toor/mug/udid/masoor), Whole beans (chana), Besan, Sprouts
3. Spices: Salt (mith), Sugar (sakhar), Mirchi, Haldi, Coriander, Cumin, Garam Masala, Powdered spices, Whole spices, Asafoetida (hing)
4. Dairy: Milk (dudh), Butter (makhan), Ghee, Cheese, Paneer, Curd, Yogurt, Buttermilk
5. Snacks: Biscuits, Cookies, Chips, Namkeen, Murukku, Farsan, Ready-to-eat
6. Beverages: Tea (chai), Coffee, Cold drinks, Juice, Health drinks
7. Oils: Cooking oils (sunflower, groundnut, olive), Vanaspati, Ghee (also dairy)
8. Vegetables: All fresh vegetables (bhaji, combo)
9. Fruits: All fresh fruits (phala)
10. Personal Care: Soap, shampoo, toothpaste, cosmetics
11. Household: Detergent, dishwash, cleaners, mosquito spray, tissue

## QUANTITY PATTERNS
Typical quantities by item type:
- Rice/Wheat/Atta: 1 kg, 2 kg, 5 kg, 10 kg; traditional: 1 Gon (≈3.2kg rice), 1 Shep (≈14.5kg wheat)
- Pulses/Dals: 1 kg, 500 gm, 250 gm
- Spices: 100 gm, 250 gm, 500 gm (smaller packs)
- Milk: 1 litre, 500 ml; pouch: 500ml, 200ml
- Oil: 1 litre, 2 litre, 5 litre
- Sugar: 1 kg, 500 gm
- Salt: 1 kg, 500 gm
- Vegetables: per kg, per piece, per bunch
- Fruits: per kg, per piece, per dozen
- Biscuits: 1 packet (50-200gm), 2-3 packets
- Soap: 1 piece, 2 pieces, 3 pieces (bars)
- Shampoo: 100ml, 200ml, 500ml, 1 litre

## UNIT PREFERENCES
- Weight: kg (kilograms), gm (grams) - use "gm" not "g"
- Volume: litre, ml
- Count: piece, packet, dozen, bunch, count
- Traditional Marathi: Gon (rice), Shep (wheat)

## MARATHI NAMES
Provide accurate Marathi names in Devanagari script:
- Rice: तांदूळ
- Wheat: गहू
- Sugar: साखर
- Salt: मिण/Mith (मिण)
- Milk: दुध
- Tur Dal: तूरडाळ
- Oil: तेल
- Potato: बटाटा
- Onion: कांदा
- Tomato: टोमॅटो/Tamata (टमाटा)

## IMPORTANT
- Sugar and salt are SPICES, not staples separate
- Fresh produce goes in Vegetables or Fruits
- Oils have their own category
- Personal care and household are separate
- If unsure, use "Other" category
`;

export async function generateCatalogItems(
  apiKey: string,
  categories?: string[]
): Promise<CatalogItem[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const categoryList = categories?.join(", ") || "Grains, Pulses, Spices, Dairy, Snacks, Beverages, Oils, Vegetables, Fruits, Personal Care, Household";

  const prompt = `${GROCERY_KNOWLEDGE}

CRITICAL: Generate a comprehensive grocery catalog as would be found in Reliance Fresh, JioMart, or Blinkit.

REQUIREMENTS:
- Minimum 80 items (aim for 100-120)
- Include only items commonly found in Indian grocery stores
- Use realistic Marathi names (Devanagari) and standard English names
- For each item, specify typicalQuantity based on how it's typically sold:
  * Staples (rice, wheat, pulses): 1 kg is standard, also 500 gm, 2 kg, 5 kg
  * Spices: 100 gm, 250 gm, 500 gm
  * Milk: 1 litre, 500 ml
  * Oil: 1 litre, 2 litre, 5 litre
  * Vegetables/Fruits: per kg, per piece, per bunch
  * Snacks: 1 packet (specify typical packet weight if relevant)
  * Personal/Household: 1 piece, 1 litre, 100ml, etc.

CATEGORIES (MUST USE EXACTLY ONE OF THESE):
${categoryList}

For each item, also provide suggestedQuantities - an array of 4-8 common quantity options that a user might select for this specific item, based on how it's sold in stores. Examples:
- For rice: ["1 kg", "2 kg", "5 kg", "500 gm", "250 gm", "1 Gon", "10 kg", "3 kg"]
- For spices: ["100 gm", "250 gm", "500 gm", "50 gm"]
- For milk: ["1 litre", "500 ml", "200 ml"]
- For oil: ["1 litre", "2 litre", "5 litre", "500 ml"]
- For vegetables: ["per kg", "1 piece", "2 pieces", "1 bunch"]

FORMAT: Strict JSON array only - DO NOT include any other text:
[
  {
    "marathiName": "Devanagari string",
    "englishName": "English string",
    "category": "ONE OF: ${categoryList}",
    "typicalQuantity": "most common single quantity",
    "suggestedQuantities": ["array of 4-8 quantity strings specific to this item"]
  }
]

Focus on:
- Items that a typical Marathi/Maharashtrian household would buy
- Balanced representation across all categories
- No duplicates, unique item names
- Use the EXACT category names listed above - no custom categories

IMPORTANT: DO NOT use "Other" as a default - carefully categorize each item into the most appropriate category from the list.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const items = JSON.parse(jsonMatch[0]);

    // Add unique IDs, ensure suggestedQuantities exists, and validate categories
    return items.map((item: any, index: number) => ({
      id: index + 1,
      marathiName: item.marathiName,
      englishName: item.englishName,
      category: ALLOWED_CATEGORIES.includes(item.category)
        ? item.category
        : findClosestCategory(item.category),
      typicalQuantity: item.typicalQuantity || "1 kg",
      suggestedQuantities: item.suggestedQuantities || [item.typicalQuantity || "1 kg"],
      confidence: 0.95,
    }));
  } catch (error) {
    console.error("Failed to generate catalog:", error);
    throw error;
  }
}

export async function suggestCategories(
  apiKey: string,
  itemName: string
): Promise<{ category: string; reasoning: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `${GROCERY_KNOWLEDGE}

Given this grocery item: "${itemName}"

Suggest the MOST appropriate category from this list (or suggest a new one if needed):
- Grains
- Pulses
- Spices
- Dairy
- Snacks
- Beverages
- Oils
- Vegetables
- Fruits
- Personal Care
- Household
- Other

Respond with ONLY JSON:
{
  "category": "CategoryName",
  "reasoning": "Brief explanation"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return extractJSON(text) as { category: string; reasoning: string };
  } catch (error) {
    console.error("Failed to suggest category:", error);
    return { category: "Other", reasoning: "Fallback due to error" };
  }
}

export function saveAICatalog(catalog: CatalogItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ai-catalog", JSON.stringify(catalog));
  }
}

export function getAICatalog(): CatalogItem[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("ai-catalog");
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}

export function saveUserCategories(categories: string[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user-categories", JSON.stringify(categories));
  }
}

export function getUserCategories(): string[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("user-categories");
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [
    "Grains",
    "Pulses",
    "Spices",
    "Dairy",
    "Snacks",
    "Beverages",
    "Oils",
    "Vegetables",
    "Fruits",
    "Personal Care",
    "Household",
    "Other",
  ];
}

export async function enrichItemWithAI(
  apiKey: string,
  itemName: string,
  existingMarathi?: string,
  existingEnglish?: string
): Promise<{
  marathiName?: string;
  englishName?: string;
  category: string;
  typicalQuantity?: string;
  suggestedQuantities?: string[];
}> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `${GROCERY_KNOWLEDGE}

STORE CONTEXT: This item would be categorized as in Reliance Fresh/JioMart/DMart/Blinkit.

TASK: Given: "{itemName}"

${existingMarathi ? `Marathi provided: ${existingMarathi}` : ""}
${existingEnglish ? `English provided: ${existingEnglish}` : ""}

CRITICAL RULES:
- NEVER use "Other" as the default category. Every grocery item fits into one of the defined categories based on store layout patterns.
- If unsure, pick the MOST plausible category from the list, using reasoning from store patterns.
- For example: Sugar is a SPICE (not a standalone "Sweetener"), Salt is a SPICE.
- Fresh produce always goes to Vegetables or Fruits.
- Packaged snacks go to Snacks.
- Staples like rice/wheat/atta go to Grains.
- Dairy products go to Dairy.

For Indian grocery retailers, determine:

1. marathiName (proper Marathi Devanagari, confirm/translate if provided)
2. englishName (canonical English name)
3. category (BEST FIT from: Grains, Pulses, Spices, Dairy, Snacks, Beverages, Oils, Vegetables, Fruits, Personal Care, Household). MUST be one of these EXACT strings.
4. typicalQuantity (most common pack size)
5. suggestedQuantities (array of 4-8 common quantity options users might select, based on store patterns)

Respond ONLY with JSON:
{
  "marathiName": "string",
  "englishName": "string",
  "category": "string",
  "typicalQuantity": "string",
  "suggestedQuantities": ["string", "string", ...]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found");
    }

    return JSON.parse(jsonMatch[0]) as any; // Include suggestedQuantities if present
  } catch (error) {
    console.error("Failed to enrich item:", error);
    return {
      marathiName: existingMarathi || itemName,
      englishName: existingEnglish || itemName,
      category: "Other",
      typicalQuantity: "1 kg",
      suggestedQuantities: ["1 kg"],
    };
  }
}

export interface VerifiedItem {
  marathiName: string;
  englishName: string;
  category: string;
  typicalQuantity: string;
  storePatterns: string[];
  suggestedPackSizes: string[];
  reasoning: string;
  confidence: number;
}

export async function verifyItemWithStoreKnowledge(
  apiKey: string,
  itemName: string
): Promise<VerifiedItem> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `${GROCERY_KNOWLEDGE}

VERIFICATION TASK: Analyze this grocery item "${itemName}" against known patterns from Reliance Fresh, JioMart, Blinkit, and Reliance Smart.

Based on store catalog patterns, provide:

1. marathiName (in Devanagari)
2. englishName (canonical English name)
3. category (best fit from: Grains, Pulses, Spices, Dairy, Snacks, Beverages, Oils, Vegetables, Fruits, Personal Care, Household, Other)
4. typicalQuantity (most common quantity purchased based on store patterns)
5. storePatterns (array: which of these stores typically carry this item - choose from ["Reliance Fresh", "JioMart", "Blinkit", "Reliance Smart", "BigBasket", "DMart", "Nature's Basket", "Kirana", "All"])
6. suggestedPackSizes (array of 2-3 common pack sizes for this item, e.g., ["1 kg", "500 gm", "250 gm"])
7. reasoning (explain why this categorization and quantity make sense for Indian grocery context)
8. confidence (0.0-1.0, how confident you are)

Consider:
- What category would this item be in on Reliance Fresh/JioMart website?
- What pack sizes are commonly available?
- Is this a staple item (bigger packs) or trial item (smaller packs)?

Respond with ONLY JSON:
{
  "marathiName": "string",
  "englishName": "string",
  "category": "string",
  "typicalQuantity": "string",
  "storePatterns": ["store1", "store2"],
  "suggestedPackSizes": ["size1", "size2"],
  "reasoning": "string",
  "confidence": 0.95
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in verification response");
    }

    return JSON.parse(jsonMatch[0]) as VerifiedItem;
  } catch (error) {
    console.error("Failed to verify item:", error);
    return {
      marathiName: itemName,
      englishName: itemName,
      category: "Other",
      typicalQuantity: "1 kg",
      storePatterns: ["Unknown"],
      suggestedPackSizes: ["1 kg"],
      reasoning: `Fallback due to error: ${(error as Error).message}`,
      confidence: 0,
    };
  }
}

function findClosestCategory(category: string): string {
  const normalized = category.toLowerCase().trim();

  const closest: Record<string, string> = {
    "grains": "Grains",
    "cereal": "Grains",
    "cereals": "Grains",
    "rice": "Grains",
    "wheat": "Grains",
    "flour": "Grains",
    "atta": "Grains",
    "maida": "Grains",
    "pulses": "Pulses",
    "dal": "Pulses",
    "dals": "Pulses",
    "lentil": "Pulses",
    "lentils": "Pulses",
    "spice": "Spices",
    "spices": "Spices",
    "sugar": "Spices",
    "salt": "Spices",
    "masala": "Spices",
    "dairy": "Dairy",
    "milk": "Dairy",
    "ghee": "Dairy",
    "cheese": "Dairy",
    "paneer": "Dairy",
    "snack": "Snacks",
    "snacks": "Snacks",
    "biscuit": "Snacks",
    "biscuits": "Snacks",
    "chips": "Snacks",
    "nama": "Snacks",
    "namkeen": "Snacks",
    "beverage": "Beverages",
    "beverages": "Beverages",
    "tea": "Beverages",
    "coffee": "Beverages",
    "drink": "Beverages",
    "drinks": "Beverages",
    "oil": "Oils",
    "oils": "Oils",
    "cooking oil": "Oils",
    "vegetable": "Vegetables",
    "vegetables": "Vegetables",
    "fruit": "Fruits",
    "fruits": "Fruits",
    "personal care": "Personal Care",
    "personalcare": "Personal Care",
    "soap": "Personal Care",
    "shampoo": "Personal Care",
    "toothpaste": "Personal Care",
    "household": "Household",
    "detergent": "Household",
    "cleaner": "Household",
    "cleaning": "Household",
  };

  for (const [key, value] of Object.entries(closest)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  console.warn(`Unknown category "${category}" defaulted to Other`);
  return "Other";
}

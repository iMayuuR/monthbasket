import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_STORAGE_KEY = "gemini_api_key";

export async function getGeminiCategory(itemName: string, apiKey: string, sourceLang?: 'marathi' | 'english'): Promise<{
  category: string;
  confidence: number;
  reasoning: string;
  marathiName?: string;
  englishName?: string;
}> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const sourceLangText = sourceLang ? `The item name is in ${sourceLang}.` : 'The item name may be in Marathi script or English.';

  const prompt = `
You are a grocery product categorization expert for Indian/Marathi groceries.
You understand BOTH Marathi (Devanagari script) and English names.

${sourceLangText}

Categorize this item into ONE of these exact categories:
- Grains (rice, wheat, flour, oats, millets, cereals, anna, ghevda, etc.)
- Pulses (lentils, dal, beans, peas, pulses, chana, masoor, toor, etc.)
- Spices (powders like sugar, salt, chili powder; whole spices; seasonings; masalas; etc.)
- Dairy (milk, ghee, butter, cheese, yogurt, milk products, etc.)
- Snacks (biscuits, crackers, namkeen, ready-to-eat, farsan, etc.)
- Beverages (tea, coffee, drinks, juices, etc.)
- Other (anything not fitting above)

IMPORTANT RULES:
- Sugar, salt, and similar powdered food items go in "Spices"
- Consider the item's typical use in Indian/Marathi cooking

Item name: "${itemName}"

If the name is in English, provide the Marathi translation. If in Marathi, provide the English translation.

Respond with ONLY this JSON format (no extra text):
{
  "category": "CategoryName",
  "confidence": 0.95,
  "reasoning": "Brief explanation",
  "marathiName": "Marathi name in Devanagari (if applicable, otherwise same as input)",
  "englishName": "English name (if applicable, otherwise same as input)"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response (Gemini might add markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      category: data.category,
      confidence: data.confidence || 0.5,
      reasoning: data.reasoning || "",
      marathiName: data.marathiName,
      englishName: data.englishName,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      category: "Other",
      confidence: 0,
      reasoning: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export function saveGeminiApiKey(apiKey: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(GEMINI_STORAGE_KEY, apiKey);
  }
}

export function getGeminiApiKey(): string | null {
  if (typeof window !== "undefined") {
    // First try the new key
    let key = localStorage.getItem(GEMINI_STORAGE_KEY);
    // If not found, check for old hardcoded key (migration from buggy version)
    if (!key) {
      const oldKey = localStorage.getItem("AIzaSyC0mmUwDA_fKHEWpyJHMwJFillZfqgZEic");
      if (oldKey) {
        // Migrate to new key
        localStorage.setItem(GEMINI_STORAGE_KEY, oldKey);
        localStorage.removeItem("AIzaSyC0mmUwDA_fKHEWpyJHMwJFillZfqgZEic");
        key = oldKey;
      }
    }
    return key;
  }
  return null;
}

export function removeGeminiApiKey() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  }
}

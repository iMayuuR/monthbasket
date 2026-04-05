"use client";

import { useState, useEffect } from "react";
import { getGeminiApiKey } from "@/services/gemini";
import { getGeminiCategory } from "@/services/gemini";

export interface AICategorizationResult {
  itemId: number;
  category: string;
  confidence: number;
  reasoning: string;
  marathiName?: string;
  englishName?: string;
  timestamp: number;
}

export function useAICategorization() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<AICategorizationResult[]>([]);

  // Load cached results
  useEffect(() => {
    try {
      const cached = window.localStorage.getItem("ai-categorization-results");
      if (cached) {
        setResults(JSON.parse(cached));
      }
    } catch (error) {
      console.error("Error loading cached AI results:", error);
    }
  }, []);

  const cacheResult = (result: AICategorizationResult) => {
    setResults((prev) => {
      const updated = [...prev.filter((r) => r.itemId !== result.itemId), result];
      window.localStorage.setItem("ai-categorization-results", JSON.stringify(updated));
      return updated;
    });
  };

  const categorizeItem = async (itemName: string, itemId: number, sourceLang?: 'marathi' | 'english'): Promise<{
    category: string;
    confidence: number;
    reasoning: string;
    marathiName?: string;
    englishName?: string;
  }> => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return {
        category: "Other",
        confidence: 0,
        reasoning: "No API key configured",
      };
    }

    setIsProcessing(true);
    try {
      const result = await getGeminiCategory(itemName, apiKey, sourceLang);
      cacheResult({ ...result, itemId, timestamp: Date.now() });
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const getCachedResult = (itemId: number): AICategorizationResult | undefined => {
    return results.find((r) => r.itemId === itemId);
  };

  const clearCache = () => {
    setResults([]);
    window.localStorage.removeItem("ai-categorization-results");
  };

  return {
    categorizeItem,
    getCachedResult,
    isProcessing,
    clearCache,
    cachedResults: results,
  };
}

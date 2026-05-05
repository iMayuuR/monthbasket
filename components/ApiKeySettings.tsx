"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getGeminiApiKey, saveGeminiApiKey, removeGeminiApiKey, isSystemKey } from "@/services/gemini";
import { Sparkles } from "lucide-react";

interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeySettings({ isOpen, onClose }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isUsingSystemKey, setIsUsingSystemKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const systemKey = isSystemKey();
      setIsUsingSystemKey(systemKey);
      
      const existing = getGeminiApiKey();
      if (existing) {
        setApiKey(systemKey ? "••••••••••••••••" : existing);
        setSaved(true);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }
    if (apiKey.length < 10) {
      setError("Invalid API key format");
      return;
    }
    saveGeminiApiKey(apiKey);
    setSaved(true);
    setError("");
  };

  const handleRemove = () => {
    removeGeminiApiKey();
    setApiKey("");
    setSaved(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-[95vw] sm:max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  🤖 Gemini AI Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Gemini API key (required for AI catalog)"
                    autoComplete="off"
                    disabled={isUsingSystemKey}
                    className={`w-full px-4 py-3 border-2 rounded-2xl focus:outline-none transition-all ${
                      isUsingSystemKey 
                        ? "bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 text-primary-900 dark:text-primary-100" 
                        : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
                    }`}
                  />
                  {isUsingSystemKey ? (
                    <div className="flex items-center gap-2 mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/50">
                      <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                        System key detected! Your Vercel environment variable is being used.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Get your API key from{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline font-medium"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                {saved && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    API key saved
                  </motion.div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 sm:gap-3">
                  {!isUsingSystemKey && (
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                    >
                      Save Key
                    </button>
                  )}
                  {saved && !isUsingSystemKey && (
                    <button
                      onClick={handleRemove}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

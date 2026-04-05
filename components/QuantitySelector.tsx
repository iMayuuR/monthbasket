"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GroceryItem } from "@/lib/grocery-data";

interface QuantitySelectorProps {
  isOpen: boolean;
  item: GroceryItem | null;
  onSelect: (quantity: string) => void;
  onClose: () => void;
}

// Common quantity presets for grocery shopping
const COMMON_QUANTITIES = [
  "50 gm",
  "100 gm",
  "250 gm",
  "500 gm",
  "1 kg",
  "2 kg",
  "3 kg",
  "4 kg",
  "5 kg",
  "6 kg",
  "7 kg",
  "10 kg",
  "1 litre",
  "2 litre",
  "1 packet",
  "2 packets",
  "1 piece",
  "2 pieces",
];

// Special Marathi units for specific items
const MARATHI_UNITS: Record<string, string[]> = {
  "तांदूळ": ["1 Gon", "2 Gon", "3 Gon", "4 Gon", "5 Gon", "½ Gon", "¼ Gon"],
  "गहू": ["1 Shep", "2 Shep", "½ Shep"],
};

export default function QuantitySelector({ isOpen, item, onSelect, onClose }: QuantitySelectorProps) {
  if (!item) return null;

  const isMarathiItem = MARATHI_UNITS[item.marathiName];
  const quantities = isMarathiItem ? MARATHI_UNITS[item.marathiName] : COMMON_QUANTITIES;
  const typicalQuantity = item.typicalQuantity || "";

  // Add typical quantity to list if not present
  const allQuantities = typicalQuantity && !quantities.includes(typicalQuantity)
    ? [typicalQuantity, ...quantities]
    : quantities;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
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
            className="relative w-full max-w-[90vw] sm:max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="p-4 sm:p-6">
              <div className="text-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Select Quantity
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {item.marathiName} ({item.englishName})
                </p>
                {isMarathiItem && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">
                    🇮🇳 Marathi unit: Gon/Shep
                  </p>
                )}
              </div>

              {/* Quick quantity grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2 mb-4 max-h-48 sm:max-h-64 overflow-y-auto">
                {allQuantities.map((qty, idx) => (
                  <motion.button
                    key={qty}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => onSelect(qty)}
                    className="px-2 py-2 text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-900 dark:text-gray-200 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all"
                  >
                    {qty}
                  </motion.button>
                ))}
              </div>

              {/* Custom input */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Or enter custom quantity:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., 1 kg, a=[], 1 Gon..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          onSelect(value);
                        }
                      }
                    }}
                    className="flex-1 px-2 sm:px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        onSelect(input.value.trim());
                      }
                    }}
                    className="px-3 sm:px-4 py-2 text-sm bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-4 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

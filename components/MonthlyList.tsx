"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MonthlyItem } from "@/types";
import { listItem, fadeInUp } from "@/lib/animations";
import { PremiumCard } from "./ui/PremiumCard";
import { PremiumButton } from "./ui/PremiumButton";
import { Check, Edit2, Trash2, Package, Sparkles } from "lucide-react";

interface MonthlyListProps {
  items: MonthlyItem[];
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: string) => void;
  onUpdatePrice: (id: number, price: number | undefined) => void;
}

export default function MonthlyList({
  items,
  onToggle,
  onRemove,
  onUpdateQuantity,
  onUpdatePrice,
}: MonthlyListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const startEditing = (item: MonthlyItem) => {
    setEditingId(item.id);
    setEditQuantity(item.quantity || "");
  };

  const saveEdit = (id: number) => {
    onUpdateQuantity(id, editQuantity);
    setEditingId(null);
    setEditQuantity("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuantity("");
  };

  const startEditingPrice = (item: MonthlyItem) => {
    setEditingPriceId(item.id);
    setEditPrice(item.price ? item.price.toString() : "");
  };

  const savePriceEdit = (id: number) => {
    const priceValue = editPrice.trim() === "" ? undefined : parseFloat(editPrice);
    onUpdatePrice(id, isNaN(priceValue!) ? undefined : priceValue);
    setEditingPriceId(null);
    setEditPrice("");
  };

  const cancelPriceEdit = () => {
    setEditingPriceId(null);
    setEditPrice("");
  };

  // Calculate totals
  const pendingItemTotal = items
    .filter((item) => !item.checked && item.price && item.quantity)
    .reduce((sum, item) => {
      const qty = parseFloat(item.quantity!) || 0;
      return sum + (item.price || 0) * qty;
    }, 0);

  const completedItemTotal = items
    .filter((item) => item.checked && item.price && item.quantity)
    .reduce((sum, item) => {
      const qty = parseFloat(item.quantity!) || 0;
      return sum + (item.price || 0) * qty;
    }, 0);

  const pendingItems = items.filter((item) => !item.checked);
  const completedItems = items.filter((item) => item.checked);

  if (items.length === 0) {
    return (
      <motion.div
        data-testid="empty-monthly-list"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center py-20 px-4 text-center"
      >
        <div className="relative mb-6">
          <motion.div
            className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-3xl border border-indigo-500/20 shadow-2xl overflow-hidden flex items-center justify-center"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src="/favicon.png" alt="MonthBasket Logo" className="w-full h-full object-cover" />
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -right-2 text-4xl"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            ✨
          </motion.div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Your list is empty</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          Add items from our catalog to start planning your grocery shopping for this month.
        </p>
        <motion.div
          className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium"
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Package className="w-5 h-5" />
          <span>Click the + button to open catalog</span>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {completedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="opacity-60"
        >
          <h4 data-testid="section-completed" className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Completed ({completedItems.length})
          </h4>
          <AnimatePresence mode="popLayout">
            {completedItems.map((item, index) => (
              <PremiumCard
                key={item.id}
                data-testid={`monthly-item-${item.id}`}
                variant={item.checked ? "minimal" : "default"}
                padding="none"
                className="group"
              >
                <motion.div
                  variants={listItem}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ delay: index * 0.03 }}
                  className="p-4"
                >
                  <div className="flex items-start gap-3">
                    <motion.button
                      data-testid={`toggle-item-${item.id}`}
                      onClick={() => onToggle(item.id)}
                      className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        item.checked
                          ? "bg-gradient-to-r from-primary-600 to-violet-600 border-primary-600 shadow-lg shadow-primary-500/40"
                          : "border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <AnimatePresence mode="wait">
                        {item.checked && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          >
                            <Check className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <motion.p
                            data-testid={`item-name-${item.id}`}
                            className={`font-semibold text-gray-900 dark:text-white truncate ${
                              item.checked ? "line-through text-gray-400 dark:text-gray-500" : ""
                            }`}
                            animate={item.checked ? { opacity: 0.6 } : { opacity: 1 }}
                          >
                            {item.marathiName}
                          </motion.p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{item.name}</p>
                          {(item.quantity || item.price) && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {item.price && (
                                <motion.span
                                  data-testid={`item-price-${item.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full border border-purple-200 dark:border-violet-800"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  ₹{item.price.toFixed(0)}
                                </motion.span>
                              )}
                              {item.quantity && (
                                <motion.span
                                  data-testid={`item-quantity-${item.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  <Package className="w-3 h-3" />
                                  {item.quantity}
                                </motion.span>
                              )}
                              {item.quantity && item.price && (
                                <motion.span
                                  className="text-xs text-gray-500 dark:text-gray-400 font-medium"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  = ₹{(item.price * parseFloat(item.quantity || "0")).toFixed(0)}
                                </motion.span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {editingId === item.id ? (
                              <input
                                type="text"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                placeholder="Qty"
                                className="w-16 px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                autoFocus
                                onBlur={() => saveEdit(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(item.id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                              />
                            ) : (
                              <PremiumButton
                                data-testid={`edit-quantity-${item.id}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(item)}
                                className="h-7 text-xs"
                                icon={<Edit2 className="w-3 h-3" />}
                              >
                                {item.quantity || "Qty"}
                              </PremiumButton>
                            )}

                            {editingPriceId === item.id ? (
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                placeholder="Price (₹)"
                                className="w-16 px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                autoFocus
                                onBlur={() => savePriceEdit(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") savePriceEdit(item.id);
                                  if (e.key === "Escape") cancelPriceEdit();
                                }}
                              />
                            ) : (
                              <PremiumButton
                                data-testid={`edit-price-${item.id}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingPrice(item)}
                                className="h-7 text-xs"
                                icon={<Sparkles className="w-3 h-3" />}
                              >
                                {item.price ? `₹${item.price}` : "Price"}
                              </PremiumButton>
                            )}
                          </div>

                          <motion.button
                            data-testid={`delete-item-${item.id}`}
                            onClick={() => onRemove(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors self-end"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </PremiumCard>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {pendingItems.length > 0 && (
        <div data-testid="section-to-buy">
          <h4 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            To Buy ({pendingItems.length})
          </h4>
          <AnimatePresence mode="popLayout">
            {pendingItems.map((item, index) => (
              <PremiumCard
                key={item.id}
                data-testid={`monthly-item-${item.id}`}
                variant={item.checked ? "minimal" : "default"}
                padding="none"
                className="group"
              >
                <motion.div
                  variants={listItem}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ delay: index * 0.03 }}
                  className="p-4"
                >
                  <div className="flex items-start gap-3">
                    <motion.button
                      data-testid={`toggle-item-${item.id}`}
                      onClick={() => onToggle(item.id)}
                      className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        item.checked
                          ? "bg-gradient-to-r from-primary-600 to-violet-600 border-primary-600 shadow-lg shadow-primary-500/40"
                          : "border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <AnimatePresence mode="wait">
                        {item.checked && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          >
                            <Check className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <motion.p
                            data-testid={`item-name-${item.id}`}
                            className={`font-semibold text-gray-900 dark:text-white truncate ${
                              item.checked ? "line-through text-gray-400 dark:text-gray-500" : ""
                            }`}
                            animate={item.checked ? { opacity: 0.6 } : { opacity: 1 }}
                          >
                            {item.marathiName}
                          </motion.p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{item.name}</p>
                          {(item.quantity || item.price) && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {item.price && (
                                <motion.span
                                  data-testid={`item-price-${item.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full border border-purple-200 dark:border-violet-800"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  ₹{item.price.toFixed(0)}
                                </motion.span>
                              )}
                              {item.quantity && (
                                <motion.span
                                  data-testid={`item-quantity-${item.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  <Package className="w-3 h-3" />
                                  {item.quantity}
                                </motion.span>
                              )}
                              {item.quantity && item.price && (
                                <motion.span
                                  className="text-xs text-gray-500 dark:text-gray-400 font-medium"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  = ₹{(item.price * parseFloat(item.quantity || "0")).toFixed(0)}
                                </motion.span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {editingId === item.id ? (
                              <input
                                type="text"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                placeholder="Qty"
                                className="w-16 px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                autoFocus
                                onBlur={() => saveEdit(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(item.id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                              />
                            ) : (
                              <PremiumButton
                                data-testid={`edit-quantity-${item.id}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(item)}
                                className="h-7 text-xs"
                                icon={<Edit2 className="w-3 h-3" />}
                              >
                                {item.quantity || "Qty"}
                              </PremiumButton>
                            )}

                            {editingPriceId === item.id ? (
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                placeholder="Price (₹)"
                                className="w-16 px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                autoFocus
                                onBlur={() => savePriceEdit(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") savePriceEdit(item.id);
                                  if (e.key === "Escape") cancelPriceEdit();
                                }}
                              />
                            ) : (
                              <PremiumButton
                                data-testid={`edit-price-${item.id}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingPrice(item)}
                                className="h-7 text-xs"
                                icon={<Sparkles className="w-3 h-3" />}
                              >
                                {item.price ? `₹${item.price}` : "Price"}
                              </PremiumButton>
                            )}
                          </div>

                          <motion.button
                            data-testid={`delete-item-${item.id}`}
                            onClick={() => onRemove(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors self-end"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </PremiumCard>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Totals Summary */}
      {(pendingItemTotal > 0 || completedItemTotal > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PremiumCard data-testid="monthly-totals" variant="gradient" padding="lg" className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Estimated Cost
                  </p>
                  <div className="space-y-1">
                    {pendingItemTotal > 0 && (
                      <motion.p
                        className="text-sm text-gray-600 dark:text-gray-300"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        To buy:{" "}
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          ₹{pendingItemTotal.toFixed(0)}
                        </span>
                      </motion.p>
                    )}
                    {completedItemTotal > 0 && (
                      <motion.p
                        className="text-sm text-gray-600 dark:text-gray-300"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Completed:{" "}
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          ₹{completedItemTotal.toFixed(0)}
                        </span>
                      </motion.p>
                    )}
                  </div>
                </div>
                <motion.div
                  className="text-right"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400 bg-clip-text text-transparent">
                    ₹{(pendingItemTotal + completedItemTotal).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                </motion.div>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

interface MonthSelectorProps {
  selectedMonth: string;
  availableMonths: string[];
  onMonthChange: (month: string) => void;
  onAddMonth: () => void;
}

export default function MonthSelector({
  selectedMonth,
  availableMonths,
  onMonthChange,
  onAddMonth,
}: MonthSelectorProps) {
  const sortedMonths = useMemo(() => {
    return [...availableMonths].sort().reverse();
  }, [availableMonths]);

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <motion.div
      data-testid="month-selector"
      className="sticky top-14 sm:top-16 z-30 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 overflow-x-auto scrollbar-hide"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-2 min-w-max">
        <AnimatePresence mode="popLayout">
          {sortedMonths.map((month, index) => (
            <motion.button
              key={month}
              onClick={() => onMonthChange(month)}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: index * 0.02
              }}
              className={`relative px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-xs sm:text-sm ${
                selectedMonth === month
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100/50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              }`}
            >
              {selectedMonth === month && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30"
                  layoutId="activeTab"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{formatMonthLabel(month)}</span>
            </motion.button>
          ))}
        </AnimatePresence>

        <motion.button
          onClick={onAddMonth}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all shadow-sm text-xs sm:text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>New Month</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

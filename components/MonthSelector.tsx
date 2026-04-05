"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <motion.div
      className="sticky top-16 z-30 px-4 py-3 bg-white/30 dark:from-gray-900/40 dark:to-gray-800/30 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {sortedMonths.map((month, index) => (
            <motion.button
              key={month}
              onClick={() => onMonthChange(month)}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: index * 0.03
              }}
              className={`relative px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap overflow-hidden ${
                selectedMonth === month
                  ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30"
                  : "bg-white/80 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 dark:hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 shadow-sm hover:shadow-md"
              }`}
            >
              {selectedMonth === month && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl"
                  layoutId="activeTab"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 text-sm flex items-center gap-1.5">
                {selectedMonth === month && (
                  <motion.div
                    className="w-1 h-1 bg-white rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
                {formatMonthLabel(month)}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>

        <motion.button
          onClick={onAddMonth}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold bg-white/80 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 dark:hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all shadow-sm hover:shadow-md"
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span
            className="text-lg"
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            ➕
          </motion.span>
          <span className="text-sm">New Month</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

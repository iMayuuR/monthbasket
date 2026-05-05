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
      data-testid="month-selector"
      className="sticky top-14 sm:top-16 z-30 px-2 sm:px-4 py-2 sm:py-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 overflow-x-auto"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-1.5 sm:gap-2 min-w-max">
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
              className={`relative px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all whitespace-nowrap ${
                selectedMonth === month
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 text-xs sm:text-sm"
                  : "bg-white/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700/80 hover:border-violet-400/50 dark:hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 shadow-sm hover:shadow-md text-xs sm:text-sm"
              }`}
            >
              {selectedMonth === month && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
                  layoutId="activeTab"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
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
          className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-semibold bg-white/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700/80 hover:border-violet-400/50 dark:hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-all shadow-sm hover:shadow-md text-xs sm:text-sm"
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span
            className="text-sm"
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            ➕
          </motion.span>
          <span className="hidden xs:inline">New Month</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

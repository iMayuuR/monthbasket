"use client";

import { motion } from "framer-motion";
import { groceryCatalog } from "@/lib/grocery-data";
import ThemeToggle from "./ThemeToggle";
import { PremiumButton } from "./ui/PremiumButton";
import { Trash2, Plus, Sparkles, Settings } from "lucide-react";
import styles from "./Header.module.css";

interface HeaderProps {
  onOpenCatalog: () => void;
  totalItems: number;
  onDeleteMonth?: () => void;
  showDelete?: boolean;
  onOpenApiKeySettings?: () => void;
}

export default function Header({ onOpenCatalog, totalItems, onDeleteMonth, showDelete = false, onOpenApiKeySettings }: HeaderProps) {
  return (
    <motion.header
      className={`${styles.header} glass sticky top-0 z-40 px-4 py-3 md:px-6`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="text-2xl md:text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🛒
          </motion.div>
          <div>
            <motion.h1
              className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              MonthBasket
            </motion.h1>
            <div className="flex items-center gap-3 mt-1">
              <motion.span
                className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 dark:from-primary-900/50 dark:to-primary-800/30 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
              >
                {groceryCatalog.length} items catalog
              </motion.span>
              <motion.span
                className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900/50 dark:to-blue-800/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-help"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                title={`${totalItems} items added across all months`}
              >
                {totalItems} added
              </motion.span>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {onOpenApiKeySettings && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onOpenApiKeySettings}
              title="API Key Settings"
            >
              <Settings className="h-4 w-4" />
            </PremiumButton>
          )}

          {showDelete && onDeleteMonth && (
            <PremiumButton
              variant="danger"
              size="sm"
              onClick={onDeleteMonth}
              icon={<Trash2 className="h-4 w-4" />}
              className="hidden sm:flex"
              title="Delete this month"
            >
              Delete
            </PremiumButton>
          )}

          <PremiumButton
            variant="primary"
            size="sm"
            onClick={onOpenCatalog}
            icon={<Plus className="h-4 w-4" />}
            className="hidden sm:flex"
            showArrow
          >
            Add Items
          </PremiumButton>
        </div>

      </div>
    </motion.header>
  );
}

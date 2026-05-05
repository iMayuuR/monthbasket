"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getCatalog } from "@/lib/grocery-data";
import ThemeToggle from "./ThemeToggle";
import { PremiumButton } from "./ui/PremiumButton";
import { ShoppingBag } from "lucide-react";
import { Trash2, Settings } from "lucide-react";
import styles from "./Header.module.css";

interface HeaderProps {
  onOpenCatalog: () => void;
  totalItems: number;
  onDeleteMonth?: () => void;
  showDelete?: boolean;
  onOpenApiKeySettings?: () => void;
}

export default function Header({ onOpenCatalog, totalItems, onDeleteMonth, showDelete = false, onOpenApiKeySettings }: HeaderProps) {
  const [catalogCount, setCatalogCount] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCatalogCount(getCatalog().length);
  }, []);

  return (
    <motion.header
      data-testid="header"
      className={`${styles.header} glass sticky top-0 z-40 px-3 sm:px-4 md:px-6 py-2 sm:py-3`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        <motion.div
          className="flex items-center gap-1.5 sm:gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="text-xl sm:text-2xl md:text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🛒
          </motion.div>
          <div className="min-w-0">
            <motion.h1
              data-testid="header-title"
              className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 bg-clip-text text-transparent">
                MonthBasket
              </span>
            </motion.h1>
            <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              {mounted && (
                <motion.span
                  data-testid="catalog-count"
                  className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 dark:from-primary-900/50 dark:to-primary-800/30 dark:text-primary-300 border border-primary-200 dark:border-primary-800 whitespace-nowrap"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {catalogCount} items
                </motion.span>
              )}
              <motion.span
                data-testid="total-items"
                className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900/50 dark:to-blue-800/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-help whitespace-nowrap"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                title={`${totalItems} items added`}
              >
                {totalItems} added
              </motion.span>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle aria-label="theme toggle" />

          {onOpenApiKeySettings && (
            <PremiumButton
              variant="ghost"
              size="icon"
              onClick={onOpenApiKeySettings}
              title="API Key Settings"
              className="w-8 h-8 sm:w-9 sm:h-9"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </PremiumButton>
          )}

          {showDelete && onDeleteMonth && (
            <PremiumButton
              variant="danger"
              size="sm"
              onClick={onDeleteMonth}
              icon={<Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              className="hidden md:flex"
              title="Delete this month"
            >
              <span className="hidden lg:inline">Delete</span>
            </PremiumButton>
          )}

          <PremiumButton
            variant="primary"
            size="sm"
            onClick={onOpenCatalog}
            icon={<ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            className="hidden sm:flex"
            showArrow
            data-testid="add-items-button"
          >
            <span className="hidden lg:inline">Add Items</span>
          </PremiumButton>
        </div>
      </div>
    </motion.header>
  );
}
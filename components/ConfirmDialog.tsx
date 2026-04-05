"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PremiumCard } from "./ui/PremiumCard";
import { PremiumButton } from "./ui/PremiumButton";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "primary";
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
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
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <PremiumCard variant="glass" padding="lg" className="w-full max-w-md">
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                    variant === "danger"
                      ? "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 text-red-600 dark:text-red-400"
                      : "bg-gradient-to-br from-primary-100 to-violet-100 dark:from-primary-900/40 dark:to-violet-900/40 text-primary-600 dark:text-primary-400"
                  }`}
                >
                  {variant === "danger" ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <Info className="w-8 h-8" />
                  )}
                </motion.div>
                <motion.h3
                  className="text-xl font-bold text-gray-900 dark:text-white"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {title}
                </motion.h3>
                <motion.p
                  className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {message}
                </motion.p>
              </div>

              <div className="flex gap-3 justify-end">
                <PremiumButton
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                >
                  {cancelText}
                </PremiumButton>
                <PremiumButton
                  variant={variant === "danger" ? "danger" : "primary"}
                  size="sm"
                  onClick={onConfirm}
                  magnetic={false}
                >
                  {confirmText}
                </PremiumButton>
              </div>
            </PremiumCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { MonthlyItem } from "@/types";
import { useItemPrices } from "@/hooks/useItemPrices";
import { useAuth } from "@/hooks/useAuth";
import { useDataSync } from "@/hooks/useDataSync";
import ConfirmDialog from "@/components/ConfirmDialog";
import { GroceryItem, saveCatalog, getCatalog } from "@/lib/grocery-data";
import Header from "@/components/Header";
import ApiKeySettings from "@/components/ApiKeySettings";
import MonthSelector from "@/components/MonthSelector";
import GroceryCatalog from "@/components/GroceryCatalog";
import MonthlyList from "@/components/MonthlyList";
import LoginScreen from "@/components/LoginScreen";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import Toast from "@/components/Toast";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Trash2, Download, ShoppingBag } from "lucide-react";

import { PremiumSplashScreen } from "@/components/PremiumSplashScreen";

const MONTH_KEY = (year: number, month: number) => `${year}-${month.toString().padStart(2, "0")}`;

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Initialize with current month
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [apiKeySettingsOpen, setApiKeySettingsOpen] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0); // Used to trigger catalog refresh

  const { prices: itemPrices, setItemPrice, setPrices } = useItemPrices();
  const { 
    isSyncing, 
    syncMonthsToCloud, 
    syncPricesToCloud, 
    isCloudEnabled, 
    loadMonthsFromCloud, 
    loadPricesFromCloud,
    loadCatalogFromCloud,
    subscribeToChanges
  } = useDataSync();

  const {
    value: monthlyLists,
    addItem,
    removeItem,
    toggleChecked,
    updateItem,
    clearMonth,
    setTotalBudget,
    getMonthData,
    deleteMonth,
    setValue: setMonthlyLists,
  } = useLocalStorage("grocery-monthly-lists", {});

  const [hasInitialPullCompleted, setHasInitialPullCompleted] = useState(false);

  // Initial pull from cloud
  const refreshAllData = async () => {
    if (!isCloudEnabled || !isAuthenticated) {
      setHasInitialPullCompleted(true);
      return;
    }

    try {
      const { months, budgets } = await loadMonthsFromCloud();
      if (Object.keys(months).length > 0) {
        const newMonthlyLists: Record<string, { items: MonthlyItem[]; totalBudget: number }> = {};
        Object.entries(months).forEach(([monthKey, items]) => {
          newMonthlyLists[monthKey] = {
            items: items as MonthlyItem[],
            totalBudget: budgets[monthKey] || 0,
          };
        });
        setMonthlyLists(newMonthlyLists);
      }
      
      const cloudCatalog = await loadCatalogFromCloud();
      if (cloudCatalog.length > 0) {
        saveCatalog(cloudCatalog);
        setCatalogVersion(prev => prev + 1);
      }

      const cloudPrices = await loadPricesFromCloud();
      if (Object.keys(cloudPrices).length > 0) {
        setPrices(cloudPrices);
      }
    } catch (error) {
      console.error("Refresh data error:", error);
    } finally {
      setHasInitialPullCompleted(true);
    }
  };

  // Subscribe to changes from other devices
  useEffect(() => {
    if (isCloudEnabled && isAuthenticated) {
      const unsubscribe = subscribeToChanges((table) => {
        showToast(`Cloud update received: ${table}`);
        refreshAllData();
      });
      return unsubscribe;
    }
  }, [isCloudEnabled, isAuthenticated, subscribeToChanges]);

  useEffect(() => {
    if (isCloudEnabled && isAuthenticated) {
      refreshAllData();
    }
  }, [isCloudEnabled, isAuthenticated]);

  // Sync to cloud when data changes
  // IMPORTANT: We only sync IF the initial pull has completed to avoid overwriting cloud with empty local state
  useEffect(() => {
    if (isCloudEnabled && hasInitialPullCompleted && monthlyLists) {
      // Create a simplified structure for the cloud (just items by month)
      const itemsByMonth: Record<string, MonthlyItem[]> = {};
      const budgets: Record<string, number | undefined> = {};
      
      Object.entries(monthlyLists).forEach(([monthKey, data]) => {
        itemsByMonth[monthKey] = data.items;
        budgets[monthKey] = data.totalBudget;
      });

      syncMonthsToCloud(itemsByMonth, budgets);
    }
  }, [monthlyLists, isCloudEnabled, hasInitialPullCompleted, syncMonthsToCloud]);

  useEffect(() => {
    if (isCloudEnabled && hasInitialPullCompleted && itemPrices && Object.keys(itemPrices).length > 0) {
      syncPricesToCloud(itemPrices);
    }
  }, [itemPrices, isCloudEnabled, hasInitialPullCompleted, syncPricesToCloud]);

  // Update available months whenever monthlyLists changes
  useEffect(() => {
    const months = Object.keys(monthlyLists);
    if (months.length === 0 && selectedMonth) {
      // If no months yet but we have a selected month, include it
      setAvailableMonths([selectedMonth]);
    } else if (!months.includes(selectedMonth)) {
      // Ensure selected month is in list
      setAvailableMonths([...months, selectedMonth]);
    } else {
      setAvailableMonths(months);
    }
  }, [monthlyLists]);

  const currentMonthData = useMemo(() => {
    return getMonthData(selectedMonth);
  }, [monthlyLists, selectedMonth, getMonthData]);

  const currentMonthItems = useMemo(() => {
    return currentMonthData.items;
  }, [currentMonthData]);

  const monthTotalBudget = useMemo(() => {
    return currentMonthData.totalBudget;
  }, [currentMonthData]);

  const totalItems = useMemo(() => {
    return Object.values(monthlyLists).reduce((total, data) => {
      const items = Array.isArray(data) ? data : data.items;
      return total + items.length;
    }, 0);
  }, [monthlyLists]);

  const handleAddItem = (item: GroceryItem & { quantity?: string }) => {
    // Check if there's a last used price for this item
    const lastPrice = itemPrices[item.id];
    // Use the quantity from the item if provided (from quantity selector), otherwise fall back to typicalQuantity
    const quantity = item.quantity || item.typicalQuantity || "";
    const newItem: MonthlyItem = {
      catalogItemId: item.id,
      id: Date.now() + Math.random(), // unique ID
      name: item.englishName,
      marathiName: item.marathiName,
      category: item.category,
      quantity,
      price: lastPrice, // Pre-fill with last used price if available
      checked: false,
      addedAt: new Date().toISOString(),
    };
    addItem(selectedMonth, newItem);
    // Show feedback
    setToast({ message: `Added ${item.marathiName}`, visible: true });
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  const handleAddNewMonth = () => {
    const now = new Date();
    // Add next month (or future month)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthKey = MONTH_KEY(nextMonth.getFullYear(), nextMonth.getMonth() + 1);

    // Ensure it's added to available months
    setAvailableMonths((prev) => [...new Set([...prev, monthKey])]);
    setSelectedMonth(monthKey);
  };

  const handleDeleteMonth = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMonth = () => {
    deleteMonth(selectedMonth);
    setDeleteDialogOpen(false);
    // Switch to current month if deleted month was selected
    const now = new Date();
    const currentMonth = MONTH_KEY(now.getFullYear(), now.getMonth() + 1);
    setSelectedMonth(currentMonth);
    showToast("Month deleted successfully");
  };

  const handleSetTotalBudget = (total: number | undefined) => {
    setTotalBudget(selectedMonth, total);
  };

  const handleExportList = () => {
    const monthName = new Date(
      parseInt(selectedMonth.split("-")[0]),
      parseInt(selectedMonth.split("-")[1]) - 1
    ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const pendingItems = currentMonthItems.filter((i) => !i.checked);
    const completedItems = currentMonthItems.filter((i) => i.checked);

    const pendingTotal = pendingItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity || "0");
      return sum + (item.price || 0) * qty;
    }, 0);

    const completedTotal = completedItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity || "0");
      return sum + (item.price || 0) * qty;
    }, 0);

    const total = pendingTotal + completedTotal;

    let report = `🛒 GROCERY REPORT\n`;
    report += `📅 Month: ${monthName}\n`;
    report += `${"═".repeat(40)}\n\n`;

    report += `📊 SUMMARY\n`;
    report += `├─ To Buy: ${pendingItems.length} items\n`;
    report += `├─ Completed: ${completedItems.length} items\n`;
    report += `└─ Total: ${pendingTotal.toFixed(2)} + ${completedTotal.toFixed(2)} = ₹${total.toFixed(2)}\n`;

    if (monthTotalBudget) {
      const budgetDiff = monthTotalBudget - total;
      report += `\n💰 Monthly Budget: ₹${monthTotalBudget.toFixed(2)}\n`;
      report += `📉 Variance: ₹${budgetDiff.toFixed(2)} ${budgetDiff >= 0 ? "✅" : "❌"}\n`;
    }

    report += `\n📝 ${pendingItems.length > 0 ? "TO BUY" : "ALL DONE!"}\n`;
    report += `${"─".repeat(40)}\n`;
    pendingItems.forEach((item) => {
      const qty = item.quantity || "1";
      const price = item.price ? ` @ ₹${item.price}` : " (price not set)";
      const lineTotal = item.price ? ` = ₹${(item.price * parseFloat(qty || "0")).toFixed(2)}` : "";
      report += `• ${item.marathiName} (${item.name})\n`;
      report += `  Quantity: ${qty}${price}${lineTotal}\n`;
    });

    if (completedItems.length > 0) {
      report += `\n✅ COMPLETED (${completedItems.length})\n`;
      report += `${"─".repeat(40)}\n`;
      completedItems.forEach((item) => {
        const qty = item.quantity || "1";
        const price = item.price ? `@ ₹${item.price}` : "";
        report += `✓ ${item.marathiName} - ${qty} ${price}\n`;
      });
    }

    report += `\nGenerated: ${new Date().toLocaleString()}\n`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grocery-report-${selectedMonth}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show loading while checking auth
  if (authLoading) {
    return <PremiumSplashScreen />;
  }

  // Show login screen if not authenticated
  const handleForcePush = async () => {
    showToast("Force pushing data to cloud...");
    await syncMonthsToCloud(itemsByMonth, budgets);
    await syncPricesToCloud(itemPrices);
    const catalog = getCatalog();
    if (catalog.length > 0) {
      await syncCatalogToCloud(catalog);
    }
    showToast("Cloud push complete!");
  };

  const handleForcePull = async () => {
    showToast("Force pulling data from cloud...");
    await refreshAllData();
    showToast("Cloud pull complete!");
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen">
      <Header
        onOpenCatalog={() => setCatalogOpen(true)}
        totalItems={totalItems}
        onDeleteMonth={handleDeleteMonth}
        showDelete={availableMonths.length > 1}
        onOpenApiKeySettings={() => setApiKeySettingsOpen(true)}
        isSyncing={isSyncing}
      />

      {/* Mobile FAB with premium design */}
      <motion.div
        data-testid="mobile-fab"
        className="sm:hidden fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <PremiumButton
          variant="primary"
          size="icon"
          onClick={() => setCatalogOpen(true)}
          icon={<ShoppingBag className="h-7 w-7" />}
          className="w-14 h-14 shadow-2xl shadow-primary-500/40 rounded-full"
        />
      </motion.div>

      <MonthSelector
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onMonthChange={setSelectedMonth}
        onAddMonth={handleAddNewMonth}
      />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Monthly List Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PremiumCard variant="gradient" padding="md" className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <motion.h2
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-800 to-gray-900 dark:from-white dark:via-primary-300 dark:to-white bg-clip-text text-transparent truncate"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {new Date(
                    parseInt(selectedMonth.split("-")[0]),
                    parseInt(selectedMonth.split("-")[1]) - 1
                  ).toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric" }
                  )}
                </motion.h2>
                <motion.p
                  data-testid="monthly-stats"
                  className="text-gray-600 dark:text-gray-300 mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span data-testid="to-buy-count" className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-primary-100 to-violet-100 dark:from-primary-900/40 dark:to-violet-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                    {currentMonthItems.filter(i => !i.checked).length} to buy
                  </span>
                  <span data-testid="completed-count" className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {currentMonthItems.filter(i => i.checked).length} completed
                  </span>
                </motion.p>
                <motion.div
                  className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 flex-wrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <label className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Budget:</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="₹0"
                        value={monthTotalBudget || ""}
                        onChange={(e) =>
                          handleSetTotalBudget(e.target.value === "" ? undefined : parseFloat(e.target.value))
                        }
                        className="w-20 sm:w-28 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      {monthTotalBudget && (
                        <motion.button
                          onClick={() => handleSetTotalBudget(undefined)}
                          className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-600 p-0.5"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      )}
                    </div>
                  </div>
                  {monthTotalBudget && (
                    <motion.span
                      data-testid="budget-display"
                      className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      ₹{monthTotalBudget.toFixed(0)}
                    </motion.span>
                  )}
                </motion.div>
              </div>

              <motion.div
                className="flex gap-1.5 sm:gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {currentMonthItems.length > 0 && (
                  <>
                    <PremiumButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm("Clear all items for this month?")) {
                          clearMonth(selectedMonth);
                        }
                      }}
                      icon={<Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                      className="text-[10px] sm:text-xs"
                    >
                      <span className="hidden sm:inline">Clear All</span>
                    </PremiumButton>
                    <PremiumButton
                      variant="success"
                      size="sm"
                      onClick={handleExportList}
                      icon={<Download className="w-3 h-3 sm:w-4 sm:h-4" />}
                      className="text-[10px] sm:text-xs"
                    >
                      <span className="hidden sm:inline">Export</span>
                      <span className="sm:hidden">📋</span>
                    </PremiumButton>
                  </>
                )}
              </motion.div>
            </div>
          </PremiumCard>
        </motion.div>

        {/* Monthly List */}
        <MonthlyList
          items={currentMonthItems}
          onToggle={(id) => toggleChecked(selectedMonth, id)}
          onRemove={(id) => removeItem(selectedMonth, id)}
          onUpdateQuantity={(id, quantity) => updateItem(selectedMonth, id, { quantity })}
          onUpdatePrice={(id, price) => {
            updateItem(selectedMonth, id, { price });
            // Save price to global item prices store using catalogItemId
            if (price !== undefined) {
              const item = currentMonthItems.find((i) => i.id === id);
              if (item?.catalogItemId) {
                setItemPrice(item.catalogItemId, price);
              }
            }
          }}
        />
      </main>

      {/* Empty State for no months - handled by list component */}

      {/* Catalog Modal */}
      <GroceryCatalog
        key={catalogVersion} // Forces refresh when version changes
        isOpen={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onAddItem={handleAddItem}
        itemPrices={itemPrices}
        onUpdateItemPrice={setItemPrice}
        onOpenApiKeySettings={() => setApiKeySettingsOpen(true)}
        onSyncCatalog={syncCatalogToCloud}
      />

      {/* Toast Notification */}
      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      {/* API Key Settings Modal */}
      <ApiKeySettings
        isOpen={apiKeySettingsOpen}
        onClose={() => setApiKeySettingsOpen(false)}
        onForcePull={handleForcePull}
        onForcePush={handleForcePush}
      />

      {/* Delete Month Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Month"
        message={`Are you sure you want to delete ${new Date(
          parseInt(selectedMonth.split("-")[0]),
          parseInt(selectedMonth.split("-")[1]) - 1
        ).toLocaleDateString("en-US", { month: "long", year: "numeric" })}? This will remove all items for this month and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteMonth}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="danger"
      />
    </div>
  );
}

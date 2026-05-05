"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getCatalog, saveCatalog, getDynamicCategories, getCategoryIcon, GroceryItem, getItemsByCategory, findItemById } from "@/lib/grocery-data";
import { motionPropsForModal } from "@/lib/animations";
import QuantitySelector from "./QuantitySelector";
import { PremiumCard } from "./ui/PremiumCard";
import { PremiumButton } from "./ui/PremiumButton";
import { Search, X, Plus, Sparkles, Package, Wand2, Edit2, Trash2, RefreshCw, Star, FilePlus, Send, ArrowLeft } from "lucide-react";
import { useAICategorization } from "@/hooks/useAICategorization";
import { getGeminiApiKey } from "@/services/gemini";
import { generateCatalogItems, enrichItemWithAI, verifyItemWithStoreKnowledge, type VerifiedItem } from "@/services/ai-catalog";

interface GroceryCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: GroceryItem & { quantity?: string }) => void; // Extended to include selected quantity
  itemPrices: Record<number, number>; // Catalog item ID -> last used price
  onUpdateItemPrice?: (itemId: number, price: number) => void; // Callback to update item price
  onOpenApiKeySettings?: () => void; // Optional callback to open API key settings
}

export default function GroceryCatalog({ isOpen, onClose, onAddItem, itemPrices, onUpdateItemPrice, onOpenApiKeySettings }: GroceryCatalogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customItems, setCustomItems] = useState<GroceryItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<GroceryItem[]>([]);
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: "",
    marathiName: "",
    englishName: "",
    category: "Other",
    typicalQuantity: "",
    isProcessing: false,
  });
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedForQuantity, setSelectedForQuantity] = useState<GroceryItem | null>(null);
  const [isAIPROCESSING, setIsAIPROCESSING] = useState(false);
  const [recentlyAddedItemIds, setRecentlyAddedItemIds] = useState<Set<number>>(new Set());
  const [verificationResults, setVerificationResults] = useState<Map<number, VerifiedItem>>(new Map());
  const [verifyingItemId, setVerifyingItemId] = useState<number | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");
  const { categorizeItem, getCachedResult } = useAICategorization();

  // Load catalog on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedCustom = localStorage.getItem("custom-grocery-items");
        if (storedCustom) {
          setCustomItems(JSON.parse(storedCustom));
        }
        // Load AI catalog
        const savedCatalog = getCatalog();
        if (savedCatalog.length > 0) {
          setCatalogItems(savedCatalog);
        } else {
          // No catalog exists
          const apiKey = getGeminiApiKey();
          if (apiKey) {
            // Offer to generate catalog with AI
            if (confirm("No catalog found. Would you like to generate one with AI (100+ grocery items)?")) {
              handleGenerateCatalog(apiKey, false);
            }
          } else {
            // No API key and no catalog - show empty state
            setCatalogItems([]);
            // Prompt to set API key after a short delay
            setTimeout(() => {
              if (confirm("No catalog found and no API key set. Set your Gemini API key in settings to generate a catalog automatically?")) {
                onOpenApiKeySettings?.();
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error loading items:", error);
      }
    }
  }, [isOpen]);

  // Combine catalog and custom items
  const allItems = useMemo(() => {
    return [...catalogItems, ...customItems];
  }, [catalogItems, customItems]);

  // Get dynamic categories
  const dynamicCategories = useMemo(() => {
    const cats = getDynamicCategories();
    // Filter based on active items
    if (activeCategory === "all") return cats;
    return cats;
  }, [catalogItems, customItems, activeCategory]);

  // Generate AI catalog
  const handleGenerateCatalog = async (apiKey?: string, showAlert: boolean = true) => {
    const key = apiKey || getGeminiApiKey();
    if (!key) {
      alert("Please set your Gemini API key in settings first.");
      return;
    }

    setIsGeneratingCatalog(true);
    try {
      const items = await generateCatalogItems(key);
      // Assign IDs starting from 1
      const catalogWithIds = items.map((item, idx) => ({
        ...item,
        id: idx + 1,
      }));

      // Smart re-categorization: re-categorize items in "Other" for better accuracy
      const otherItems = catalogWithIds.filter(item => item.category === "Other");
      if (otherItems.length > 0) {
        // Process in batches to avoid overwhelming API
        const BATCH_SIZE = 5;
        const BATCH_DELAY = 500;

        for (let i = 0; i < otherItems.length; i += BATCH_SIZE) {
          const batch = otherItems.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(async (item) => {
            try {
              const result = await categorizeItem(item.marathiName || item.englishName, item.id);
              const index = catalogWithIds.findIndex(i => i.id === item.id);
              if (index !== -1) {
                catalogWithIds[index] = {
                  ...catalogWithIds[index],
                  category: result.category,
                  ...(result.marathiName && { marathiName: result.marathiName }),
                  ...(result.englishName && { englishName: result.englishName }),
                };
              }
            } catch (error) {
              console.error("Failed to re-categorize item:", item.marathiName, error);
            }
          }));
          // Delay between batches (except last batch)
          if (i + BATCH_SIZE < otherItems.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }
        }
      }

      setCatalogItems(catalogWithIds);
      saveCatalog(catalogWithIds);

      // Calculate final category distribution
      const categories = [...new Set(catalogWithIds.map(i => i.category))];
      const otherCount = catalogWithIds.filter(i => i.category === "Other").length;

      if (showAlert) {
        alert(`✅ Generated ${catalogWithIds.length} items with AI!\n\nCategories: ${categories.join(", ")}\n\nItems in 'Other': ${otherCount}${otherCount > 0 ? '\n\n(Hover over items in catalog and click ✨ Verify for better categorization)' : ''}`);
      }
    } catch (error) {
      console.error("Failed to generate catalog:", error);
      alert("Failed to generate catalog: " + (error as Error).message);
    } finally {
      setIsGeneratingCatalog(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Unified AI processing for the item name (with quantity suggestion)
  const handleAutoProcessItem = async () => {
    const nameToProcess = newItem.itemName.trim();
    if (!nameToProcess) {
      alert("Please enter an item name first");
      return;
    }
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      alert("Please set your Gemini API key in settings (click the gear icon).");
      return;
    }
    setNewItem(prev => ({ ...prev, isProcessing: true }));
    try {
      // First, enrich item with AI (translation + category + quantity)
      const enriched = await enrichItemWithAI(apiKey, nameToProcess);

      // Then get detailed categorization
      const isMarathi = /[\u0900-\u097F]/.test(nameToProcess);
      const result = await categorizeItem(nameToProcess, Date.now(), isMarathi ? 'marathi' : 'english');

      setNewItem({
        ...newItem,
        marathiName: enriched.marathiName || nameToProcess,
        englishName: enriched.englishName || nameToProcess,
        category: enriched.category || result.category,
        typicalQuantity: enriched.typicalQuantity || "",
        isProcessing: false,
      });

      // Show feedback
      alert(`✨ AI Enriched!\n\nMarathi: ${enriched.marathiName}\nEnglish: ${enriched.englishName}\nCategory: ${enriched.category}\nTypical: ${enriched.typicalQuantity || 'Not specified'}\n\nConfidence: ${(result.confidence * 100).toFixed(0)}%`);
    } catch (error) {
      setNewItem(prev => ({ ...prev, isProcessing: false }));
      alert("AI processing failed: " + (error as Error).message);
    }
  };

  const handleAICategorizeAll = async () => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      alert("Please set your Gemini API key in settings (click the gear icon).");
      return;
    }

    // Get items that are in "Other" category
    const otherItems = catalogItems.filter(item => item.category === "Other");
    if (otherItems.length === 0) {
      alert("No items in 'Other' category to recategorize!");
      return;
    }

    if (!confirm(`This will AI-categorize ${otherItems.length} item(s) currently in "Other". Continue?`)) {
      return;
    }

    setIsAIPROCESSING(true);
    try {
      const updatedCatalog = [...catalogItems];
      let recategorized = 0;

      for (const item of otherItems) {
        try {
          const result = await categorizeItem(item.marathiName || item.englishName, item.id);
          // Update the item's category
          const index = updatedCatalog.findIndex(i => i.id === item.id);
          if (index !== -1) {
            updatedCatalog[index] = {
              ...updatedCatalog[index],
              category: result.category,
              // Optionally update names if AI provided them
              ...(result.marathiName && { marathiName: result.marathiName }),
              ...(result.englishName && { englishName: result.englishName }),
            };
            recategorized++;
          }
        } catch (error) {
          console.error("Failed to categorize", item.marathiName, error);
        }
      }

      setCatalogItems(updatedCatalog);
      saveCatalog(updatedCatalog);

      alert(`Recategorized ${recategorized}/${otherItems.length} items!\n\nCheck the console for details.\n\nThese changes are saved and will persist.`);
    } catch (error) {
      alert("AI recategorization failed: " + (error as Error).message);
    } finally {
      setIsAIPROCESSING(false);
    }
  };

  const handleEditItem = (item: GroceryItem) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const updatedCatalog = catalogItems.map(item =>
      item.id === editingItem.id ? editingItem : item
    );
    setCatalogItems(updatedCatalog);
    localStorage.setItem("ai-corrected-catalog", JSON.stringify(updatedCatalog));

    setEditingItem(null);
    setShowEditModal(false);
    alert("Item updated successfully!");
  };

  const handleDeleteCatalogItem = (itemId: number) => {
    if (!confirm("Delete this item from the catalog? This cannot be undone.")) return;

    const updatedCatalog = catalogItems.filter(item => item.id !== itemId);
    setCatalogItems(updatedCatalog);
    localStorage.setItem("ai-corrected-catalog", JSON.stringify(updatedCatalog));
    alert("Item deleted from catalog.");
  };

  const handleStartPriceEdit = (item: GroceryItem) => {
    setEditingPriceId(item.id);
    setEditingPriceValue(itemPrices[item.id]?.toString() || "");
  };

  const handleSavePriceEdit = (itemId: number) => {
    const priceValue = parseFloat(editingPriceValue);
    if (!isNaN(priceValue) && priceValue >= 0) {
      onUpdateItemPrice?.(itemId, priceValue);
    }
    setEditingPriceId(null);
    setEditingPriceValue("");
  };

  const handlePriceEditCancel = () => {
    setEditingPriceId(null);
    setEditingPriceValue("");
  };

  const handleAIVerifyField = async (sourceField: 'marathi' | 'english', isNewItem = false) => {
    const target = isNewItem ? newItem : editingItem;
    if (!target) return;
    
    const name = sourceField === 'marathi' ? target.marathiName : target.englishName;
    if (!name.trim()) {
      alert(`Please enter ${sourceField === 'marathi' ? 'Marathi' : 'English'} name first`);
      return;
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      alert("Please set your Gemini API key in settings (click the gear icon).");
      return;
    }

    setIsAIPROCESSING(true);
    try {
      const sourceLang = sourceField === 'marathi' ? 'marathi' : 'english';
      const result = await categorizeItem(name, isNewItem ? Date.now() : target.id, sourceLang);
      
      if (isNewItem) {
        setNewItem(prev => ({
          ...prev,
          marathiName: result.marathiName || prev.marathiName,
          englishName: result.englishName || prev.englishName,
          category: result.category,
        }));
      } else {
        setEditingItem(prev => prev ? {
          ...prev,
          marathiName: result.marathiName || prev.marathiName,
          englishName: result.englishName || prev.englishName,
          category: result.category,
        } : null);
      }
      
      alert(`AI Verification Complete!\n\nCategory: ${result.category}\nMarathi: ${result.marathiName}\nEnglish: ${result.englishName}`);
    } catch (error) {
      alert("AI verification failed: " + (error as Error).message);
    } finally {
      setIsAIPROCESSING(false);
    }
  };

  const handleVerifyItem = async (item: GroceryItem) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      alert("Please set your Gemini API key in settings.");
      return;
    }

    setVerifyingItemId(item.id);
    try {
      const result = await verifyItemWithStoreKnowledge(apiKey, item.englishName || item.marathiName);
      setVerificationResults(prev => new Map(prev).set(item.id, result));
    } catch (error) {
      alert("Verification failed: " + (error as Error).message);
    } finally {
      setVerifyingItemId(null);
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.marathiName.trim() && !newItem.englishName.trim()) {
      alert("Please enter an item name or use AI to fill it");
      return;
    }

    // Generate unique ID (starting from 10000 to avoid conflict with fixed IDs)
    const newId = Math.max(10000, ...customItems.map((i) => i.id), Date.now());

    const custom: GroceryItem = {
      id: newId,
      marathiName: newItem.marathiName || newItem.itemName,
      englishName: newItem.englishName || newItem.marathiName || newItem.itemName,
      category: newItem.category,
      typicalQuantity: newItem.typicalQuantity || undefined,
    };

    const updated = [...customItems, custom];
    setCustomItems(updated);
    localStorage.setItem("custom-grocery-items", JSON.stringify(updated));

    // Reset form
    setNewItem({
      itemName: "",
      marathiName: "",
      englishName: "",
      category: "Other",
      typicalQuantity: "",
      isProcessing: false,
    });
    setShowAddCustom(false);
  };

  const handleItemClick = (item: GroceryItem) => {
    // Open quantity selector instead of immediately adding
    setSelectedForQuantity(item);
  };

  const handleQuantitySelect = (quantity: string) => {
    if (selectedForQuantity) {
      onAddItem({
        ...selectedForQuantity,
        quantity,
      });
      // Highlight the item for 2 seconds
      setRecentlyAddedItemIds(prev => new Set(prev).add(selectedForQuantity.id));
      setTimeout(() => {
        setRecentlyAddedItemIds(prev => {
          const next = new Set(prev);
          next.delete(selectedForQuantity.id);
          return next;
        });
      }, 2000);
      setSelectedForQuantity(null);
      // Show feedback toast will come from parent
    }
  };

  // When clicking catalog item + button (add to list) - now opens quantity selector
  const handleQuickAdd = (item: GroceryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Open quantity selector instead of immediately adding
    setSelectedForQuantity(item);
  };

  const filteredItems = useMemo(() => {
    let items = allItems;

    if (activeCategory !== "all") {
      items = items.filter((item) => item.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.marathiName.toLowerCase().includes(query) ||
          item.englishName.toLowerCase().includes(query)
      );
    }

    return items;
  }, [searchQuery, activeCategory, allItems]);

  const groupedItems = useMemo(() => {
    const grouped: Record<string, GroceryItem[]> = {};
    filteredItems.forEach((item) => {
      const categoryName = item.category;
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(item);
    });
    return grouped;
  }, [filteredItems]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <motion.div
          data-testid="grocery-catalog-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={motionPropsForModal.backdrop}
        >
          {/* Backdrop */}
          <motion.div
            data-testid="modal-backdrop"
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            variants={motionPropsForModal.backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-[98vw] xs:max-w-[95vw] sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-primary-500/10 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col"
            variants={motionPropsForModal.modal}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div data-testid="catalog-header" className="px-3 py-3 xs:px-4 xs:py-4 sm:px-6 sm:py-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white to-primary-50/30 dark:from-gray-900 dark:to-primary-900/20">
              <div className="flex items-center justify-between gap-2 mb-3 xs:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-primary-500/20 shadow-sm">
                    <img src="/logo-premium.png" alt="" className="w-full h-full object-cover" />
                  </div>
                  <motion.h2
                    data-testid="catalog-title"
                    className="text-lg xs:text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-primary-800 to-gray-900 dark:from-white dark:via-primary-300 dark:to-white bg-clip-text text-transparent truncate"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    MonthBasket
                  </motion.h2>
                </div>
                <div className="flex items-center gap-1 xs:gap-2">
                  <PremiumButton
                    variant="secondary"
                    size="sm"
                    data-testid="add-custom-item"
                    onClick={() => setShowAddCustom(true)}
                    icon={<FilePlus className="h-3 w-3 xs:h-4 xs:w-4" />}
                    className="text-[10px] xs:text-xs px-1.5 xs:px-2"
                  >
                    <span className="hidden xs:inline">Add New</span>
                  </PremiumButton>
                  <PremiumButton
                    variant="outline"
                    size="sm"
                    onClick={handleAICategorizeAll}
                    disabled={isAIPROCESSING}
                    icon={<Wand2 className="h-3 w-3 xs:h-4 xs:w-4" />}
                    title="AI recategorize"
                    className="px-1.5 xs:px-2"
                  >
                    <span className="hidden sm:inline">{isAIPROCESSING ? "..." : "AI"}</span>
                    <span className="sm:hidden">✨</span>
                  </PremiumButton>
                  <PremiumButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const apiKey = getGeminiApiKey();
                      if (apiKey && confirm("Regenerate full catalog with AI? This will replace your current catalog.")) {
                        handleGenerateCatalog(apiKey);
                      } else if (!apiKey) {
                        alert("Please set your Gemini API key in settings first.");
                      }
                    }}
                    disabled={isGeneratingCatalog}
                    icon={<RefreshCw className={`h-4 w-4 ${isGeneratingCatalog ? 'animate-spin' : ''}`} />}
                    title="AI generate full catalog"
                    className="px-2 sm:px-3"
                    data-testid="refresh-catalog"
                  >
                    <span className="hidden sm:inline">Refresh</span>
                  </PremiumButton>
                  <motion.button
                    onClick={handleClose}
                    data-testid="close-catalog-modal"
                    className="p-2 sm:p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group px-3 xs:px-4 mt-2 xs:mt-3">
                <Search className="absolute left-4 xs:left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  data-testid="catalog-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full px-3 py-2 pl-9 xs:px-4 xs:pl-11 xs:py-2.5 bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl xs:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm text-xs xs:text-sm"
                />
                {searchQuery && (
                  <motion.button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 xs:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </motion.button>
                )}
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {["all", ...dynamicCategories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${
                      activeCategory === cat
                        ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-200 dark:hover:border-primary-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Item Form */}
            {showAddCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20 border-b border-gray-200/50 dark:border-gray-700/50"
              >
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Add New Item</h3>
                <form onSubmit={handleAddCustomItem} className="space-y-3">
                  {/* Unified item name input */}
                  <div className="flex flex-col gap-2">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="Marathi Name"
                        value={newItem.marathiName}
                        onChange={(e) => setNewItem({ ...newItem, marathiName: e.target.value })}
                        className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAIVerifyField('marathi', true)}
                        disabled={isAIPROCESSING}
                        className="absolute right-1 p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors z-20"
                        title="AI Magic"
                      >
                        <Wand2 className={`h-4 w-4 ${isAIPROCESSING ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="English Name"
                        value={newItem.englishName}
                        onChange={(e) => setNewItem({ ...newItem, englishName: e.target.value })}
                        className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAIVerifyField('english', true)}
                        disabled={isAIPROCESSING}
                        className="absolute right-1 p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors z-20"
                        title="AI Magic"
                      >
                        <Wand2 className={`h-4 w-4 ${isAIPROCESSING ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
                      <select
                        name="category"
                        value={newItem.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
                      >
                        {dynamicCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Typical Quantity</label>
                      <input
                        type="text"
                        name="typicalQuantity"
                        value={newItem.typicalQuantity}
                        onChange={handleInputChange}
                        placeholder="e.g., 1 kg, 500 gm"
                        className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <PremiumButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowAddCustom(false);
                        setNewItem({
                          itemName: "",
                          marathiName: "",
                          englishName: "",
                          category: "Other",
                          typicalQuantity: "",
                          isProcessing: false,
                        });
                      }}
                    >
                      Cancel
                    </PremiumButton>
                    <PremiumButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      icon={<Send className="h-4 w-4" />}
                      disabled={!newItem.marathiName && !newItem.englishName}
                    >
                      Add Item
                    </PremiumButton>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6">
              {Object.keys(groupedItems).length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center h-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-gradient-to-br from-primary-500/10 to-violet-500/10 rounded-2xl flex items-center justify-center p-4 border border-primary-500/10"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <img src="/logo-premium.png" alt="" className="w-full h-full object-cover" />
                  </motion.div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">No items found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or category filter</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([category, items], idx) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <motion.h3
                        className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3 flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 + 0.1 }}
                      >
                        <span className="text-lg">{getCategoryIcon(category as any)}</span>
                        <span>{category}</span>
                        <motion.span
                          className="ml-auto text-xs font-normal text-gray-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 + 0.2 }}
                        >
                          {items.length} items
                        </motion.span>
                      </motion.h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                          {items.map((item) => (
                            <motion.div
                              key={item.id}
                              data-testid={`catalog-item-${item.id}`}
                              initial={{ opacity: 1 }}
                              animate={{
                                opacity: 1,
                                boxShadow: recentlyAddedItemIds.has(item.id)
                                  ? "0 0 0 3px rgba(34, 197, 94, 0.5)"
                                  : "0 0 0 0px rgba(0,0,0,0)"
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <PremiumCard
                                variant="gradient"
                                padding="none"
                                className="cursor-pointer"
                                onClick={() => handleItemClick(item)}
                                glowColor="rgba(147, 51, 234, 0.15)"
                              >
                              <div className="p-2 xs:p-3 sm:p-4">
                                <div className="flex items-start justify-between gap-1.5 xs:gap-2">
                                  <div className="flex-1 min-w-0">
                                    <motion.p
                                      className="font-bold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors text-sm xs:text-base sm:text-lg leading-tight"
                                      layout
                                    >
                                      {item.marathiName}
                                    </motion.p>
                                    <p className="text-xs xs:text-sm text-gray-700 dark:text-gray-300 mt-0.5 font-medium">{item.englishName}</p>
                                    {item.typicalQuantity && (
                                      <p className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 w-fit px-1.5 py-0.5 rounded-md">
                                        <Package className="w-3 h-3 text-primary-500" />
                                        {item.typicalQuantity}
                                      </p>
                                    )}
                                    {/* Always-visible editable price field */}
                                    <div className="mt-1.5 xs:mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <span className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">₹</span>
                                      {editingPriceId === item.id ? (
                                        <div className="flex items-center gap-0.5">
                                          <input
                                            type="number"
                                            value={editingPriceValue}
                                            onChange={(e) => setEditingPriceValue(e.target.value)}
                                            onBlur={() => handleSavePriceEdit(item.id)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") handleSavePriceEdit(item.id);
                                              if (e.key === "Escape") handlePriceEditCancel();
                                            }}
                                            className="w-12 xs:w-16 px-1.5 xs:px-2 py-0.5 xs:py-1 text-[10px] xs:text-xs bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-700 dark:text-purple-400"
                                            autoFocus
                                            placeholder="0"
                                          />
                                          <button
                                            onClick={() => handleSavePriceEdit(item.id)}
                                            className="p-0.5 xs:p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                                          >
                                            <svg className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={handlePriceEditCancel}
                                            className="p-0.5 xs:p-1 text-gray-500 hover:text-gray-600 dark:text-gray-400"
                                          >
                                            <svg className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      ) : (
                                        <motion.button
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.1 }}
                                          onClick={() => handleStartPriceEdit(item)}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                                            itemPrices[item.id]
                                              ? "bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600"
                                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600"
                                          }`}
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {itemPrices[item.id] ? `₹${itemPrices[item.id]}` : "Set Price"}
                                        </motion.button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex gap-1.5">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleEditItem(item)}
                                        className="flex-1 flex items-center justify-center p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all border border-blue-100 dark:border-blue-800/50"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleDeleteCatalogItem(item.id)}
                                        className="flex-1 flex items-center justify-center p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 transition-all border border-red-100 dark:border-red-800/50"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </motion.button>
                                    </div>
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => handleQuickAdd(item, e)}
                                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 text-white text-xs font-bold shadow-lg shadow-primary-500/20 transition-all relative ${recentlyAddedItemIds.has(item.id) ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                                      title="Add"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add</span>
                                      {recentlyAddedItemIds.has(item.id) && (
                                        <motion.div
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900"
                                        >
                                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </motion.div>
                                      )}
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                              </PremiumCard>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Quantity Selector Modal */}
      <QuantitySelector
        isOpen={!!selectedForQuantity}
        item={selectedForQuantity}
        onSelect={handleQuantitySelect}
        onClose={() => setSelectedForQuantity(null)}
      />

      {/* Edit Catalog Item Modal */}
      <AnimatePresence>
        {showEditModal && editingItem && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEditModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide z-10 mx-4"
            >
              <PremiumCard variant="glass" padding="none" className="overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">
                      Edit Product
                    </h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                        Marathi Name
                      </label>
                      <div className="relative flex items-center group">
                        <input
                          type="text"
                          autoFocus
                          value={editingItem.marathiName}
                          onChange={(e) => setEditingItem({ ...editingItem, marathiName: e.target.value })}
                          className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800/80 border-2 border-gray-100 dark:border-gray-700/50 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm xs:text-base font-medium"
                          placeholder="Marathi Name"
                        />
                        <button
                          type="button"
                          onClick={() => handleAIVerifyField('marathi')}
                          disabled={isAIPROCESSING}
                          className="absolute right-2 p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-xl transition-all z-20"
                          title="AI Magic"
                        >
                          <Wand2 className={`h-5 w-5 ${isAIPROCESSING ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                        English Name
                      </label>
                      <div className="relative flex items-center group">
                        <input
                          type="text"
                          value={editingItem.englishName}
                          onChange={(e) => setEditingItem({ ...editingItem, englishName: e.target.value })}
                          className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800/80 border-2 border-gray-100 dark:border-gray-700/50 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm xs:text-base font-medium"
                          placeholder="English Name"
                        />
                        <button
                          type="button"
                          onClick={() => handleAIVerifyField('english')}
                          disabled={isAIPROCESSING}
                          className="absolute right-2 p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-xl transition-all z-20"
                          title="AI Magic"
                        >
                          <Wand2 className={`h-5 w-5 ${isAIPROCESSING ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                          Category
                        </label>
                        <select
                          value={editingItem.category}
                          onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-2 border-gray-100 dark:border-gray-700/50 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm font-medium appearance-none"
                        >
                          {dynamicCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                          Qty Hint
                        </label>
                        <input
                          type="text"
                          value={editingItem.typicalQuantity || ""}
                          onChange={(e) => setEditingItem({ ...editingItem, typicalQuantity: e.target.value || undefined })}
                          placeholder="e.g., 1 kg"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-2 border-gray-100 dark:border-gray-700/50 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <PremiumButton
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => editingItem && handleVerifyItem(editingItem)}
                        disabled={verifyingItemId === editingItem?.id || !editingItem}
                        icon={<Sparkles className={`h-4 w-4 ${verifyingItemId === editingItem?.id ? 'animate-pulse' : ''}`} />}
                        className="w-full py-4 text-xs font-black uppercase tracking-widest"
                      >
                        {verifyingItemId === editingItem?.id ? "AI Verifying..." : "Deep Verify with AI"}
                      </PremiumButton>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-3.5 bg-gradient-to-r from-primary-600 to-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all active:scale-95"
                      >
                        Save
                      </button>
                    </div>

                    {editingItem && verificationResults.has(editingItem.id) && (() => {
                      const result = verificationResults.get(editingItem.id)!;
                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 bg-gradient-to-br from-primary-500/5 to-violet-500/5 dark:from-primary-500/10 dark:to-violet-500/10 rounded-2xl border-2 border-primary-500/20"
                        >
                          <h4 className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Wand2 className="w-4 h-4" />
                            AI Analysis
                          </h4>
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confidence</span>
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{(result.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 italic">"{result.reasoning}"</p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setEditingItem(prev => prev ? {
                                    ...prev,
                                    marathiName: result.marathiName,
                                    englishName: result.englishName,
                                    category: result.category,
                                    typicalQuantity: result.typicalQuantity,
                                  } : null);
                                }}
                                className="flex-1 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => {
                                  const newVerifications = new Map(verificationResults);
                                  newVerifications.delete(editingItem.id);
                                  setVerificationResults(newVerifications);
                                }}
                                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-lg"
                              >
                                Skip
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

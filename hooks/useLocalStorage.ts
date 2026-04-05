"use client";

import { useState, useEffect } from "react";
import { MonthlyItem, MonthData, MonthlyLists } from "@/types";

export function useLocalStorage(key: string, initialValue: MonthlyLists) {
  const [storedValue, setStoredValue] = useState<MonthlyLists>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Migrate old format (just array) to new format (MonthData)
        const migrated: MonthlyLists = {};
        Object.keys(parsed).forEach((monthKey) => {
          const value = parsed[monthKey];
          if (Array.isArray(value)) {
            migrated[monthKey] = { items: value };
          } else {
            migrated[monthKey] = value;
          }
        });
        setStoredValue(migrated);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    if (!loading) {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    }
  }, [key, storedValue, loading]);

  const getMonthData = (monthKey: string): MonthData => {
    const monthData = storedValue[monthKey];
    if (!monthData) {
      return { items: [] };
    }
    // Ensure it's always MonthData format
    if (Array.isArray(monthData)) {
      return { items: monthData };
    }
    return monthData as MonthData;
  };

  const addItem = (monthKey: string, item: MonthlyItem) => {
    setStoredValue((prev) => {
      const current = prev[monthKey] || { items: [] };
      // Ensure current is MonthData
      const items = Array.isArray(current) ? current : current.items;
      return {
        ...prev,
        [monthKey]: {
          items: [...items, item],
          totalBudget: current.totalBudget,
        },
      };
    });
  };

  const removeItem = (monthKey: string, itemId: number) => {
    setStoredValue((prev) => {
      const current = prev[monthKey] || { items: [] };
      const items = Array.isArray(current) ? current : current.items;
      return {
        ...prev,
        [monthKey]: {
          items: items.filter((item) => item.id !== itemId),
          totalBudget: current.totalBudget,
        },
      };
    });
  };

  const updateItem = (monthKey: string, itemId: number, updates: Partial<MonthlyItem>) => {
    setStoredValue((prev) => {
      const current = prev[monthKey] || { items: [] };
      const items = Array.isArray(current) ? current : current.items;
      return {
        ...prev,
        [monthKey]: {
          items: items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
          totalBudget: current.totalBudget,
        },
      };
    });
  };

  const toggleChecked = (monthKey: string, itemId: number) => {
    setStoredValue((prev) => {
      const current = prev[monthKey] || { items: [] };
      const items = Array.isArray(current) ? current : current.items;
      return {
        ...prev,
        [monthKey]: {
          items: items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
          totalBudget: current.totalBudget,
        },
      };
    });
  };

  const clearMonth = (monthKey: string) => {
    setStoredValue((prev) => ({
      ...prev,
      [monthKey]: { items: [] },
    }));
  };

  const setTotalBudget = (monthKey: string, totalBudget: number | undefined) => {
    setStoredValue((prev) => {
      const current = prev[monthKey] || { items: [] };
      const items = Array.isArray(current) ? current : current.items;
      return {
        ...prev,
        [monthKey]: {
          items,
          totalBudget,
        },
      };
    });
  };

  const deleteMonth = (monthKey: string) => {
    setStoredValue((prev) => {
      const newMonths = { ...prev };
      delete newMonths[monthKey];
      return newMonths;
    });
  };

  return {
    value: storedValue,
    loading,
    getMonthData,
    addItem,
    removeItem,
    updateItem,
    toggleChecked,
    clearMonth,
    setTotalBudget,
    deleteMonth,
  };
}

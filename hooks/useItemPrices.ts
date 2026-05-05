"use client";

import { useState, useEffect } from "react";

interface ItemPrice {
  [itemId: number]: number; // itemId -> last used price
}

export interface ItemPriceMap {
  [itemId: number]: number;
}

export function useItemPrices() {
  const [prices, setPrices] = useState<ItemPriceMap>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("grocery-item-prices");
      if (stored) {
        setPrices(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading item prices:", error);
    }
  }, []);

  const setItemPrice = (itemId: number, price: number) => {
    setPrices((prev) => {
      const next = { ...prev, [itemId]: price };
      window.localStorage.setItem("grocery-item-prices", JSON.stringify(next));
      return next;
    });
  };

  const getItemPrice = (itemId: number): number | undefined => {
    return prices[itemId];
  };

  return { prices, setItemPrice, getItemPrice, setPrices };
}

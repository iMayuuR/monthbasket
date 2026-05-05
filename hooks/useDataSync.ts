"use client";

import { useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export function useDataSync() {
  const { isAuthenticated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const userId = "default_user";

  const syncMonthsToCloud = useCallback(async (monthsData: Record<string, any[]>, budgets: Record<string, number | undefined>) => {
    if (!isAuthenticated || !isSupabaseConfigured || !supabase) return;
    setIsSyncing(true);
    try {
      for (const [monthKey, items] of Object.entries(monthsData)) {
        const { data: existing } = await supabase
          .from("months")
          .select("*")
          .eq("user_id", userId)
          .eq("month_key", monthKey)
          .single();

        const monthData = {
          user_id: userId,
          month_key: monthKey,
          items: JSON.stringify(items),
          budget: budgets[monthKey] || null,
          updated_at: new Date().toISOString(),
        };

        if (existing?.id) {
          await supabase.from("months").update(monthData).eq("id", existing.id);
        } else {
          await supabase.from("months").insert(monthData);
        }
      }
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error("Sync months error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, userId]);

  const syncCatalogToCloud = useCallback(async (catalogItems: any[]) => {
    if (!isAuthenticated || !isSupabaseConfigured || !supabase) return;
    setIsSyncing(true);
    try {
      await supabase.from("catalog").delete().eq("user_id", userId);
      if (catalogItems.length > 0) {
        const catalogData = catalogItems.map(item => ({
          user_id: userId,
          marathi_name: item.marathi_name || item.marathiName,
          english_name: item.english_name || item.englishName,
          category: item.category,
          typical_quantity: item.typical_quantity || item.typicalQuantity || "",
          created_at: new Date().toISOString(),
        }));
        await supabase.from("catalog").insert(catalogData);
      }
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error("Sync catalog error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, userId]);

  const syncPricesToCloud = useCallback(async (prices: Record<number, number>) => {
    if (!isAuthenticated || !isSupabaseConfigured || !supabase) return;
    setIsSyncing(true);
    try {
      const { data: existing } = await supabase
        .from("prices")
        .select("*")
        .eq("user_id", userId)
        .single();

      const pricesData = {
        user_id: userId,
        prices: JSON.stringify(prices),
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await supabase.from("prices").update(pricesData).eq("id", existing.id);
      } else {
        await supabase.from("prices").insert(pricesData);
      }
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error("Sync prices error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, userId]);

  const loadMonthsFromCloud = useCallback(async () => {
    if (!isAuthenticated || !isSupabaseConfigured || !supabase) return { months: {}, budgets: {} };
    try {
      const { data } = await supabase.from("months").select("*").eq("user_id", userId);
      const months: Record<string, any[]> = {};
      const budgets: Record<string, number | undefined> = {};
      if (data) {
        for (const row of data) {
          months[row.month_key] = JSON.parse(row.items || "[]");
          budgets[row.month_key] = row.budget || undefined;
        }
      }
      return { months, budgets };
    } catch (error) {
      console.error("Load months error:", error);
      return { months: {}, budgets: {} };
    }
  }, [isAuthenticated, userId]);

  const loadCatalogFromCloud = useCallback(async () => {
    if (!isAuthenticated || !isSupabaseConfigured || !supabase) return [];
    try {
      const { data } = await supabase.from("catalog").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      return data?.map((item, index) => ({
        id: item.id || Date.now() + index,
        marathiName: item.marathi_name,
        englishName: item.english_name,
        category: item.category,
        typicalQuantity: item.typical_quantity,
        isCustom: true,
      })) || [];
    } catch (error) {
      console.error("Load catalog error:", error);
      return [];
    }
  }, [isAuthenticated, userId]);

  const loadPricesFromCloud = useCallback(async () => {
    if (!isAuthenticated || !isSupabaseConfigured || !supabase) return {};
    try {
      const { data } = await supabase.from("prices").select("prices").eq("user_id", userId).single();
      return data?.prices ? JSON.parse(data.prices) : {};
    } catch (error) {
      console.error("Load prices error:", error);
      return {};
    }
  }, [isAuthenticated, userId]);

  const subscribeToChanges = useCallback((onUpdate: () => void) => {
    const client = supabase;
    if (!isAuthenticated || !isSupabaseConfigured || !client) return () => {};

    const monthsSubscription = client
      .channel('public:months')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'months', filter: `user_id=eq.${userId}` }, () => {
        onUpdate();
      })
      .subscribe();

    const pricesSubscription = client
      .channel('public:prices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prices', filter: `user_id=eq.${userId}` }, () => {
        onUpdate();
      })
      .subscribe();

    const catalogSubscription = client
      .channel('public:catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'catalog', filter: `user_id=eq.${userId}` }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      client.removeChannel(monthsSubscription);
      client.removeChannel(pricesSubscription);
      client.removeChannel(catalogSubscription);
    };
  }, [isAuthenticated, userId]);

  return {
    isSyncing,
    lastSyncTime,
    isCloudEnabled: isSupabaseConfigured,
    syncMonthsToCloud,
    syncCatalogToCloud,
    syncPricesToCloud,
    loadMonthsFromCloud,
    loadCatalogFromCloud,
    loadPricesFromCloud,
    subscribeToChanges,
  };
}
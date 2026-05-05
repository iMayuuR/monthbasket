"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { PremiumButton } from "./ui/PremiumButton";
import { AlertCircle, CheckCircle2, RefreshCw, database, Wifi, WifiOff } from "lucide-react";

interface SyncDiagnosticProps {
  userId: string;
  onForcePull?: () => Promise<void>;
  onForcePush?: () => Promise<void>;
}

export default function SyncDiagnostic({ userId, onForcePull, onForcePush }: SyncDiagnosticProps) {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [actionStatus, setActionStatus] = useState<"idle" | "busy">("idle");
  const [results, setResults] = useState<{
    connection: boolean;
    auth: boolean;
    pricesTable: boolean;
    realtime: boolean;
    writeAccess: boolean;
    error?: string;
  } | null>(null);

  const runDiagnostic = async () => {
    setStatus("testing");
    setResults(null);
    
    if (!isSupabaseConfigured || !supabase) {
      setStatus("error");
      setResults({
        connection: false,
        auth: false,
        monthsTable: false,
        catalogTable: false,
        pricesTable: false,
        realtime: false,
        writeAccess: false,
        error: "Supabase environment variables are missing! Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      });
      return;
    }

    try {
      // 1. Test connection & Tables
      const { error: monthsError } = await supabase.from('months').select('count').limit(1);
      const { error: catalogError } = await supabase.from('catalog').select('count').limit(1);
      const { error: pricesError } = await supabase.from('prices').select('count').limit(1);

      // 2. Test Realtime
      let realtimeStatus = false;
      const testChannel = supabase.channel('diag-test');
      
      const subPromise = new Promise<boolean>((resolve) => {
        testChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve(true);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            resolve(false);
          }
        });
        setTimeout(() => resolve(false), 3000);
      });

      realtimeStatus = await subPromise;
      supabase.removeChannel(testChannel);

      // 3. Test Write Access
      let writeStatus = false;
      const testKey = `diag_test_${Date.now()}`;
      const { error: insertError } = await supabase.from('months').insert({
        user_id: userId,
        month_key: testKey,
        items: '[]'
      });

      if (!insertError) {
        writeStatus = true;
        // Clean up
        await supabase.from('months').delete().eq('month_key', testKey);
      }

      setResults({
        connection: true,
        auth: true,
        monthsTable: !monthsError,
        catalogTable: !catalogError,
        pricesTable: !pricesError,
        realtime: realtimeStatus,
        writeAccess: writeStatus,
        error: (monthsError || catalogError || pricesError || insertError)?.message,
      });

      if (monthsError || catalogError || pricesError || !realtimeStatus || !writeStatus) {
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch (err) {
      setStatus("error");
      setResults({
        connection: false,
        auth: false,
        monthsTable: false,
        catalogTable: false,
        pricesTable: false,
        error: (err as Error).message,
      });
    }
  };

  return (
    <div className="mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${status === "testing" ? "animate-spin" : ""}`} />
          Cloud Sync Diagnostic
        </h3>
        <PremiumButton
          variant="secondary"
          size="sm"
          onClick={runDiagnostic}
          disabled={status === "testing"}
          className="text-[10px] h-7"
        >
          {status === "testing" ? "Testing..." : "Run Test"}
        </PremiumButton>
      </div>

      {results && (
        <div className="space-y-2">
          <DiagnosticItem label="Supabase Connection" success={results.connection} />
          <DiagnosticItem label="Months Table Access" success={results.monthsTable} />
          <DiagnosticItem label="Catalog Table Access" success={results.catalogTable} />
          <DiagnosticItem label="Prices Table Access" success={results.pricesTable} />
          <DiagnosticItem label="Realtime Subscription" success={results.realtime} />
          <DiagnosticItem label="Database Write Access" success={results.writeAccess} />
          
          {results.error && (
            <div className="mt-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-[10px] text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800">
              <p className="font-bold flex items-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3" /> Error Details:
              </p>
              <p className="font-mono">{results.error}</p>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Tip: If you see "relation does not exist", make sure you ran the SQL script in your Supabase dashboard.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Actions</p>
              <div className="flex gap-2">
                <PremiumButton
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    setActionStatus("busy");
                    await onForcePull?.();
                    setActionStatus("idle");
                  }}
                  disabled={actionStatus === "busy"}
                  className="flex-1 text-[10px] h-8"
                >
                  {actionStatus === "busy" ? "Pulling..." : "Force Pull (Load)"}
                </PremiumButton>
                <PremiumButton
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    setActionStatus("busy");
                    await onForcePush?.();
                    setActionStatus("idle");
                  }}
                  disabled={actionStatus === "busy"}
                  className="flex-1 text-[10px] h-8"
                >
                  {actionStatus === "busy" ? "Pushing..." : "Force Push (Save)"}
                </PremiumButton>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => {
                    if (confirm("Are you sure? This will delete all local grocery data and reload from cloud. Any unsynced changes will be lost.")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="text-[9px] text-red-500 hover:text-red-600 underline font-medium"
                >
                  Reset Local Data & Reload
                </button>
              </div>
              <p className="mt-2 text-[9px] text-gray-500 dark:text-gray-400">
                Use "Force Pull" to get data from other devices. Use "Force Push" to send local data to the cloud.
              </p>
            </div>
          )}
        </div>
      )}

      {!results && status === "idle" && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">
          Run the diagnostic to check your cloud connection and database permissions.
        </p>
      )}
    </div>
  );
}

function DiagnosticItem({ label, success }: { label: string; success: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-[10px] text-gray-600 dark:text-gray-400">{label}</span>
      {success ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
      )}
    </div>
  );
}

"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncResult = {
  checked?: number;
  updated?: number;
  waiting?: number;
  processing?: number;
  errored?: number;
  error?: string;
};

function syncMessage(result: SyncResult) {
  if (result.error) {
    return result.error;
  }

  if (!result.checked) {
    return "No media needs syncing.";
  }

  if (result.updated) {
    return `${result.updated} ready, ${result.processing || 0} processing, ${result.waiting || 0} waiting.`;
  }

  if (result.processing) {
    return `${result.processing} still processing in Mux.`;
  }

  if (result.waiting) {
    return `${result.waiting} upload still waiting in Mux.`;
  }

  if (result.errored) {
    return `${result.errored} upload needs attention.`;
  }

  return "Mux checked. No changes yet.";
}

export function MediaSyncButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function syncMedia() {
    if (!enabled || isSyncing) {
      return;
    }

    setIsSyncing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/mux/sync", {
        method: "POST",
        cache: "no-store",
      });
      const result = (await response.json().catch(() => ({}))) as SyncResult;

      if (!response.ok) {
        setMessage(result.error || "Could not sync Mux status.");
        return;
      }

      setMessage(syncMessage(result));
      router.refresh();
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <button
        type="button"
        disabled={!enabled || isSyncing}
        onClick={() => void syncMedia()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RefreshCw size={15} className={isSyncing ? "animate-spin" : undefined} />
        {isSyncing ? "Syncing" : "Sync Mux status"}
      </button>
      {message ? <p className="max-w-64 text-sm text-stone-500 md:text-right">{message}</p> : null}
    </div>
  );
}

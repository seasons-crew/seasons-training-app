"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MediaSyncButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  async function syncMedia() {
    if (!enabled || isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      await fetch("/api/mux/sync", { method: "POST" });
      router.refresh();
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <button
      type="button"
      disabled={!enabled || isSyncing}
      onClick={() => void syncMedia()}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <RefreshCw size={15} className={isSyncing ? "animate-spin" : undefined} />
      {isSyncing ? "Syncing" : "Sync Mux status"}
    </button>
  );
}

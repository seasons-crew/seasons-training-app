"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type MediaAddTabsProps = {
  bulk: ReactNode;
  manual: ReactNode;
};

export function MediaAddTabs({ bulk, manual }: MediaAddTabsProps) {
  const [activeTab, setActiveTab] = useState<"bulk" | "manual">("bulk");

  return (
    <section className="rounded-md bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-2 rounded-md bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("bulk")}
          className={`h-10 rounded-[4px] text-sm font-semibold transition-colors active:scale-[0.96] ${
            activeTab === "bulk"
              ? "bg-white text-stone-950 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              : "text-stone-500 hover:text-stone-950"
          }`}
        >
          Bulk upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`h-10 rounded-[4px] text-sm font-semibold transition-colors active:scale-[0.96] ${
            activeTab === "manual"
              ? "bg-white text-stone-950 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              : "text-stone-500 hover:text-stone-950"
          }`}
        >
          Manual
        </button>
      </div>

      <div className="mt-4">{activeTab === "bulk" ? bulk : manual}</div>
    </section>
  );
}

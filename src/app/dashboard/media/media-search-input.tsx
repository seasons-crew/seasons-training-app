"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export const mediaSearchEventName = "seasons:media-search";

export function MediaSearchInput({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");

  function updateQuery(value: string) {
    setQuery(value);
    window.dispatchEvent(new CustomEvent(mediaSearchEventName, { detail: value }));
  }

  return (
    <label className={`relative block w-full ${compact ? "max-w-[240px] md:w-60" : "max-w-sm md:w-80"}`}>
      <span className="sr-only">Search media</span>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
      />
      <input
        value={query}
        onChange={(event) => updateQuery(event.target.value)}
        placeholder="Search media"
        className="h-10 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-sm font-medium text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-950"
      />
    </label>
  );
}

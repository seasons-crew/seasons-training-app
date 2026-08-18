"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Tag } from "@/lib/types";

type TagPickerProps = {
  disabled: boolean;
  initialTags?: string[];
  name?: string;
  onTagsChange?: (tags: string[]) => void;
  placeholder?: string;
  tags: Tag[];
};

function normalize(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function slugify(input: string) {
  return normalize(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueTags(tags: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const tag of tags.map(normalize).filter(Boolean)) {
    const slug = slugify(tag);

    if (!slug || seen.has(slug)) {
      continue;
    }

    seen.add(slug);
    unique.push(tag);
  }

  return unique.sort((a, b) => a.localeCompare(b));
}

export function TagPicker({
  disabled,
  initialTags = [],
  name = "tags",
  onTagsChange,
  placeholder = "Search or create tags",
  tags,
}: TagPickerProps) {
  const [selectedTags, setSelectedTags] = useState(() => uniqueTags(initialTags));
  const [query, setQuery] = useState("");
  const selectedSlugs = useMemo(
    () => new Set(selectedTags.map(slugify)),
    [selectedTags],
  );
  const normalizedQuery = normalize(query);
  const querySlug = slugify(normalizedQuery);
  const suggestions = useMemo(() => {
    const available = tags.filter((tag) => !selectedSlugs.has(tag.slug));

    if (!querySlug) {
      return available.slice(0, 6);
    }

    return available
      .filter(
        (tag) =>
          tag.slug.includes(querySlug) ||
          tag.name.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
          (tag.category || "").toLowerCase().includes(normalizedQuery.toLowerCase()),
      )
      .slice(0, 6);
  }, [normalizedQuery, querySlug, selectedSlugs, tags]);
  const canCreate =
    querySlug.length > 0 &&
    !selectedSlugs.has(querySlug) &&
    !tags.some((tag) => tag.slug === querySlug);

  function addTag(tag: string) {
    setSelectedTags((current) => {
      const next = uniqueTags([...current, tag]);
      onTagsChange?.(next);
      return next;
    });
    setQuery("");
  }

  function removeTag(tag: string) {
    const slug = slugify(tag);
    setSelectedTags((current) => {
      const next = current.filter((item) => slugify(item) !== slug);
      onTagsChange?.(next);
      return next;
    });
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={selectedTags.join(",")} />
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md bg-white p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.12)] focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.72)]">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-8 items-center gap-2 rounded-md bg-stone-100 pl-3 pr-1 text-sm font-semibold normal-case tracking-normal text-stone-700"
          >
            {tag}
            <button
              type="button"
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(tag)}
              className="flex h-7 w-7 items-center justify-center rounded-[4px] text-stone-500 transition-colors hover:bg-white hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          disabled={disabled}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && normalizedQuery) {
              event.preventDefault();
              addTag(normalizedQuery);
            }
          }}
          placeholder={selectedTags.length ? "" : placeholder}
          className="h-8 min-w-32 flex-1 bg-transparent px-1 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none placeholder:text-stone-400 disabled:cursor-not-allowed"
        />
      </div>
      {suggestions.length > 0 || canCreate ? (
        <div className="grid gap-1 rounded-md bg-stone-50 p-1">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              disabled={disabled}
              onClick={() => addTag(tag.name)}
              className="flex min-h-10 items-center justify-between gap-3 rounded-[4px] px-3 text-left text-sm font-semibold normal-case tracking-normal text-stone-700 transition-colors hover:bg-white hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>{tag.name}</span>
              {tag.category ? (
                <span className="text-xs font-medium text-stone-400">
                  {tag.category}
                </span>
              ) : null}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => addTag(normalizedQuery)}
              className="flex min-h-10 items-center gap-2 rounded-[4px] px-3 text-left text-sm font-semibold normal-case tracking-normal text-stone-700 transition-colors hover:bg-white hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={15} />
              Create &quot;{normalizedQuery}&quot;
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

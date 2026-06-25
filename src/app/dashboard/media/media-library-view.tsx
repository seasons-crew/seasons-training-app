"use client";

/* eslint-disable @next/next/no-img-element */
import { Edit3, Grid2X2, List, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { updateMediaAsset } from "../actions";
import { MediaSearchInput, mediaSearchEventName } from "./media-search-input";
import { MediaSyncButton } from "./media-sync-button";
import type { MediaAsset } from "@/lib/types";

type MediaLibraryViewProps = {
  canEdit: boolean;
  mediaAssets: MediaAsset[];
  muxUploadEnabled: boolean;
};

type ViewMode = "grid" | "list";

const inputClass =
  "h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

export function MediaLibraryView({ canEdit, mediaAssets, muxUploadEnabled }: MediaLibraryViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleMediaSearch(event: Event) {
      setQuery(String((event as CustomEvent<string>).detail || ""));
    }

    window.addEventListener(mediaSearchEventName, handleMediaSearch);
    return () => window.removeEventListener(mediaSearchEventName, handleMediaSearch);
  }, []);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return mediaAssets;
    }

    return mediaAssets.filter((asset) =>
      [asset.title, asset.id, asset.status || "", ...asset.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [mediaAssets, query]);
  const hasSearch = query.trim().length > 0;

  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-stone-500 sm:min-w-20">
            {hasSearch ? `${filteredAssets.length} of ${mediaAssets.length}` : mediaAssets.length}{" "}
            {mediaAssets.length === 1 ? "video" : "videos"}
          </p>
          <MediaSearchInput compact />
        </div>
        <div className="flex flex-col gap-3 sm:items-end md:flex-row md:items-start">
          <div className="grid w-full grid-cols-2 rounded-md bg-stone-100 p-1 sm:w-auto">
            <ViewButton active={viewMode === "grid"} onClick={() => setViewMode("grid")}>
              <Grid2X2 size={16} />
              Grid
            </ViewButton>
            <ViewButton active={viewMode === "list"} onClick={() => setViewMode("list")}>
              <List size={16} />
              List
            </ViewButton>
          </div>
          <MediaSyncButton enabled={muxUploadEnabled} />
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="rounded-md border border-stone-200 bg-white px-5 py-12 text-center text-sm font-medium text-stone-500">
          No media matches that search.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredAssets.map((asset) => (
            <MediaGridCard key={asset.id} asset={asset} canEdit={canEdit} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.04)]">
          {filteredAssets.map((asset) => (
            <MediaListRow key={asset.id} asset={asset} canEdit={canEdit} />
          ))}
        </div>
      )}
    </section>
  );
}

function ViewButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-[4px] px-3 text-sm font-semibold transition-colors active:scale-[0.96] ${
        active
          ? "bg-white text-stone-950 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          : "text-stone-500 hover:text-stone-950"
      }`}
    >
      {children}
    </button>
  );
}

function MediaGridCard({ asset, canEdit }: { asset: MediaAsset; canEdit: boolean }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.04)]">
      <MediaThumbnail asset={asset} className="aspect-video w-full" />
      <div className="grid gap-3 p-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h2 className="min-w-0 truncate text-sm font-semibold" title={asset.title || "Untitled upload"}>
              {asset.title || "Untitled upload"}
            </h2>
            <StatusPill status={asset.status} />
          </div>
          <MediaMeta asset={asset} compact />
        </div>
        {canEdit ? <MediaEditModal asset={asset} canEdit={canEdit} /> : null}
      </div>
    </article>
  );
}

function MediaListRow({ asset, canEdit }: { asset: MediaAsset; canEdit: boolean }) {
  return (
    <article className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-3 border-b border-stone-100 p-2 last:border-b-0 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:items-center">
      <MediaThumbnail asset={asset} className="h-14 w-[88px] sm:h-16 sm:w-[104px]" />
      <div className="min-w-0 py-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 truncate text-sm font-semibold" title={asset.title || "Untitled upload"}>
            {asset.title || "Untitled upload"}
          </h2>
          <StatusPill status={asset.status} />
        </div>
        <MediaMeta asset={asset} compact={false} />
      </div>
      {canEdit ? (
        <div className="col-span-2 sm:col-span-1">
          <MediaEditModal asset={asset} canEdit={canEdit} compact />
        </div>
      ) : null}
    </article>
  );
}

function MediaThumbnail({ asset, className }: { asset: MediaAsset; className: string }) {
  return asset.thumbnailUrl ? (
    <img
      src={asset.thumbnailUrl}
      alt=""
      className={`${className} bg-stone-100 object-contain outline outline-1 outline-black/10`}
    />
  ) : (
    <div
      className={`${className} flex items-center justify-center bg-stone-100 text-xs font-semibold text-stone-400 outline outline-1 outline-black/10`}
    >
      Processing
    </div>
  );
}

function MediaMeta({ asset, compact }: { asset: MediaAsset; compact: boolean }) {
  return (
    <div className={`mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-stone-500 ${compact ? "text-xs" : "text-sm"}`}>
      <span className="shrink-0 tabular-nums">{asset.durationSeconds}s</span>
      <span className="min-w-0 truncate">{asset.tags.join(", ") || "untagged"}</span>
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status) {
    return null;
  }

  return (
    <span className="shrink-0 rounded-full border border-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
      {status.replaceAll("_", " ")}
    </span>
  );
}

function MediaEditModal({ asset, canEdit, compact = false }: { asset: MediaAsset; canEdit: boolean; compact?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function submitMedia(formData: FormData) {
    startTransition(async () => {
      await updateMediaAsset(formData);
      dialogRef.current?.close();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => dialogRef.current?.showModal()}
        className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40 ${
          compact ? "w-full sm:w-auto" : "w-full"
        }`}
      >
        <Edit3 size={15} />
        Edit
      </button>
      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 max-h-[calc(100dvh-32px)] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-stone-200 bg-white p-0 text-stone-950 shadow-2xl backdrop:bg-stone-950/40"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Edit media</h2>
            <p className="mt-0.5 truncate text-sm text-stone-500">{asset.title || "Untitled upload"}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dialogRef.current?.close()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:border-stone-300 hover:text-stone-950"
          >
            <X size={16} />
          </button>
        </div>
        <form action={submitMedia} className="grid max-h-[calc(100dvh-120px)] gap-4 overflow-y-auto p-5">
          <input type="hidden" name="id" value={asset.id} />
          <input type="hidden" name="playbackUrl" value={asset.playbackUrl || ""} />
          <input type="hidden" name="thumbnailUrl" value={asset.thumbnailUrl || ""} />
          <input type="hidden" name="muxPlaybackId" value={asset.muxPlaybackId || ""} />
          <input type="hidden" name="muxAssetId" value={asset.muxAssetId || ""} />
          <input type="hidden" name="sourceDriveUrl" value={asset.sourceDriveUrl || ""} />
          <Field label="Title">
            <input name="title" required disabled={!canEdit} defaultValue={asset.title} className={inputClass} />
          </Field>
          <Field label="Duration seconds">
            <input
              name="durationSeconds"
              required
              disabled={!canEdit}
              defaultValue={asset.durationSeconds}
              inputMode="numeric"
              className={inputClass}
            />
          </Field>
          <Field label="Tags">
            <input name="tags" disabled={!canEdit} defaultValue={asset.tags.join(", ")} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700"
            >
              Cancel
            </button>
            <button
              disabled={!canEdit || isPending}
              className="h-10 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? "Saving" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
      {label}
      {children}
    </label>
  );
}

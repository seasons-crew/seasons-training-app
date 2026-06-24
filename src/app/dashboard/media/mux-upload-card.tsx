"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { RefreshCw, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UploadResponse = {
  mediaAssetId?: string;
  url?: string;
  error?: string;
  detail?: string;
};

function eventDetail<T>(event: unknown) {
  if (typeof event === "object" && event !== null && "detail" in event) {
    return (event as CustomEvent<T>).detail;
  }

  return undefined;
}

export function MuxUploadCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState(
    enabled ? "Drop a video here or choose a file." : "Add Mux credentials to enable direct uploads.",
  );
  const [progress, setProgress] = useState<number | null>(null);

  async function createUpload(file?: File) {
    if (!file) {
      throw new Error("Choose a video file first.");
    }

    const cleanTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");
    setMessage("Creating Mux upload...");

    const response = await fetch("/api/mux/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: cleanTitle, tags }),
    });
    const payload = (await response.json()) as UploadResponse;

    if (!response.ok || !payload.url) {
      throw new Error(payload.error || "Could not create a Mux upload.");
    }

    setTitle(cleanTitle);
    setMessage("Uploading video...");
    return payload.url;
  }

  return (
    <section className="mt-6 rounded-md border border-stone-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <UploadCloud size={20} />
            Upload to Mux
          </div>
          <p className="mt-1 max-w-2xl text-sm text-stone-600">
            Uploaded videos appear in the library while Mux processes them, then the webhook fills in playback and thumbnail URLs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700 hover:border-stone-950 hover:text-stone-950"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={!enabled}
            placeholder="Mobility Flow"
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
          Tags
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            disabled={!enabled}
            placeholder="snow, warmup"
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          />
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-dashed border-stone-300 bg-stone-50 p-3">
        {enabled ? (
          <MuxUploader
            endpoint={createUpload}
            dynamicChunkSize
            pausable
            onUploadStart={() => {
              setProgress(0);
              setMessage("Uploading video...");
            }}
            onProgress={(event) => {
              setProgress(Math.round(Number(eventDetail<number>(event) || 0)));
            }}
            onSuccess={() => {
              setProgress(100);
              setMessage("Upload complete. Mux is processing the video.");
              router.refresh();
            }}
            onUploadError={(event) => {
              setMessage(eventDetail<{ message?: string }>(event)?.message || "Upload failed.");
            }}
            style={{
              "--progress-bar-fill-color": "#1c1917",
            }}
          />
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-md bg-white px-4 text-center text-sm font-medium text-stone-500">
            Mux uploads are disabled until credentials are configured.
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-600">
        <span>{message}</span>
        {progress !== null ? <span className="font-semibold text-stone-950">{progress}%</span> : null}
      </div>
    </section>
  );
}

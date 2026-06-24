"use client";

import { createUpload } from "@mux/upchunk";
import { RefreshCw, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UploadResponse = {
  mediaAssetId?: string;
  url?: string;
  error?: string;
  detail?: string;
};

type UploadItem = {
  id: string;
  name: string;
  progress: number;
  status: "queued" | "creating" | "uploading" | "processing" | "error";
  message?: string;
};

function eventDetail<T>(event: unknown) {
  if (typeof event === "object" && event !== null && "detail" in event) {
    return (event as CustomEvent<T>).detail;
  }

  return undefined;
}

export function MuxUploadCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState(
    enabled ? "Drop videos here or choose files." : "Add Mux credentials to enable direct uploads.",
  );
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  function updateUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((current) =>
      current.map((upload) => (upload.id === id ? { ...upload, ...patch } : upload)),
    );
  }

  async function createUploadUrl(file: File, uploadId: string) {
    updateUpload(uploadId, { status: "creating", message: "Creating Mux upload" });

    const response = await fetch("/api/mux/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, tags }),
    });
    const payload = (await response.json()) as UploadResponse;

    if (!response.ok || !payload.url) {
      throw new Error(payload.error || "Could not create a Mux upload.");
    }

    updateUpload(uploadId, { status: "uploading", message: "Uploading" });
    return payload.url;
  }

  function startUpload(file: File) {
    const id = `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
    const uploadItem: UploadItem = {
      id,
      name: file.name,
      progress: 0,
      status: "queued",
      message: "Queued",
    };

    setUploads((current) => [uploadItem, ...current]);
    setMessage("Uploading videos...");

    const upload = createUpload({
      endpoint: () => createUploadUrl(file, id),
      file,
      dynamicChunkSize: true,
      chunkSize: 30720,
    });

    upload.on("progress", (event) => {
      updateUpload(id, {
        progress: Math.round(Number(eventDetail<number>(event) || 0)),
        status: "uploading",
      });
    });

    upload.on("success", () => {
      updateUpload(id, {
        progress: 100,
        status: "processing",
        message: "Mux processing",
      });
      setMessage("Uploads complete. Mux is processing the videos.");
      router.refresh();
    });

    upload.on("error", (event) => {
      updateUpload(id, {
        status: "error",
        message: eventDetail<{ message?: string }>(event)?.message || "Upload failed",
      });
      setMessage("One or more uploads failed.");
    });
  }

  function startUploads(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("video/"));

    if (!files.length) {
      setMessage("Choose one or more video files.");
      return;
    }

    files.forEach(startUpload);
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
            Bulk uploads create blank media records. Add titles from the media list once the videos are in the library.
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

      <label className="mt-5 grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        Tags for all files
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          disabled={!enabled}
          placeholder="snow, warmup"
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        />
      </label>

      <div
        className="mt-4 flex min-h-44 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-stone-300 bg-stone-50 p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (enabled) {
            startUploads(event.dataTransfer.files);
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          disabled={!enabled}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) {
              startUploads(event.target.files);
            }
            event.currentTarget.value = "";
          }}
        />
        <div className="text-sm font-medium text-stone-600">{message}</div>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Choose videos
        </button>
      </div>

      {uploads.length ? (
        <div className="mt-4 grid gap-2">
          {uploads.map((upload) => (
            <div key={upload.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="max-w-full truncate font-semibold text-stone-800">{upload.name}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  {upload.status}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-stone-950 transition-all"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-stone-500">
                <span>{upload.message}</span>
                <span>{upload.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

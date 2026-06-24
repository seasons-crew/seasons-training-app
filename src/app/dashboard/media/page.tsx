/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { createMediaAsset, updateMediaAsset } from "../actions";
import { MediaAddTabs } from "./media-add-tabs";
import { MuxUploadCard } from "./mux-upload-card";
import { isDatabaseConfigured, listMediaAssets } from "@/lib/workout-data";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const mediaAssets = await listMediaAssets();
  const canEdit = isDatabaseConfigured();
  const muxUploadEnabled = canEdit && Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-950">
      <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <header className="mt-6 border-b border-stone-200 pb-6">
          <h1 className="text-4xl font-semibold">Media library</h1>
          <p className="mt-2 text-stone-600">
            Upload workout videos to Mux, track processing status, and keep manual URL entry as a fallback.
          </p>
        </header>

        {!canEdit ? (
          <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Media editing needs <code className="font-mono">DATABASE_URL</code> configured. Mock media is read-only.
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {mediaAssets.map((asset) => (
              <article
                key={asset.id}
                className="overflow-hidden rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.04)]"
              >
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt=""
                    className="aspect-video w-full object-cover outline outline-1 outline-black/10"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-stone-100 text-sm font-semibold text-stone-400">
                    Processing
                  </div>
                )}
                <div className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">{asset.title || "Untitled upload"}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                          <span className="tabular-nums">{asset.durationSeconds}s</span>
                          <span className="truncate">{asset.tags.join(", ") || "untagged"}</span>
                        </div>
                      </div>
                      {asset.status ? (
                        <span className="shrink-0 rounded-full border border-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                          {asset.status.replaceAll("_", " ")}
                        </span>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <details className="group mt-2 border-t border-stone-100 pt-3">
                        <summary className="flex h-10 cursor-pointer list-none items-center justify-center rounded-md border border-stone-300 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950 active:scale-[0.96]">
                          Edit
                        </summary>
                        <MediaForm asset={asset} canEdit={canEdit} mode="update" />
                      </details>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="lg:sticky lg:top-6">
            <MediaAddTabs
              bulk={<MuxUploadCard enabled={muxUploadEnabled} />}
              manual={
                <div>
                  <h2 className="text-lg font-semibold">Add media manually</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Paste playback details only when a video already lives outside the uploader.
                  </p>
                  <MediaForm canEdit={canEdit} mode="create" />
                </div>
              }
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

type MediaAsset = Awaited<ReturnType<typeof listMediaAssets>>[number];

function MediaForm({
  asset,
  canEdit,
  mode,
}: {
  asset?: MediaAsset;
  canEdit: boolean;
  mode: "create" | "update";
}) {
  const isCreate = mode === "create";

  return (
    <form
      action={isCreate ? createMediaAsset : updateMediaAsset}
      className="mt-4 grid gap-3"
    >
      {asset ? <input type="hidden" name="id" value={asset.id} /> : null}
      {!isCreate ? (
        <>
          <input type="hidden" name="playbackUrl" value={asset?.playbackUrl || ""} />
          <input type="hidden" name="thumbnailUrl" value={asset?.thumbnailUrl || ""} />
          <input type="hidden" name="muxPlaybackId" value={asset?.muxPlaybackId || ""} />
          <input type="hidden" name="muxAssetId" value={asset?.muxAssetId || ""} />
          <input type="hidden" name="sourceDriveUrl" value={asset?.sourceDriveUrl || ""} />
        </>
      ) : null}
      <Field label="Title">
        <input
          name="title"
          required
          disabled={!canEdit}
          defaultValue={asset?.title}
          placeholder="Mobility Flow"
          className={inputClass}
        />
      </Field>
      <Field label="Duration seconds">
        <input
          name="durationSeconds"
          required
          disabled={!canEdit}
          defaultValue={asset?.durationSeconds}
          inputMode="numeric"
          placeholder="30"
          className={inputClass}
        />
      </Field>
      {isCreate ? (
        <>
          <Field label="Playback URL">
            <input
              name="playbackUrl"
              required
              disabled={!canEdit}
              placeholder="https://stream.mux.com/...m3u8"
              className={inputClass}
            />
          </Field>
          <Field label="Thumbnail URL">
            <input
              name="thumbnailUrl"
              required
              disabled={!canEdit}
              placeholder="https://image.mux.com/.../thumbnail.jpg"
              className={inputClass}
            />
          </Field>
        </>
      ) : null}
      <Field label="Tags">
        <input
          name="tags"
          disabled={!canEdit}
          defaultValue={asset?.tags.join(", ")}
          placeholder="snow, mobility"
          className={inputClass}
        />
      </Field>
      <button
        disabled={!canEdit}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white transition-transform disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.96]"
      >
        <Plus size={16} />
        {isCreate ? "Add media" : "Save"}
      </button>
    </form>
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

const inputClass =
  "h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

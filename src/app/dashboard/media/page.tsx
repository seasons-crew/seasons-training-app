/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { createMediaAsset, updateMediaAsset } from "../actions";
import { isDatabaseConfigured, listMediaAssets } from "@/lib/workout-data";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const mediaAssets = await listMediaAssets();
  const canEdit = isDatabaseConfigured();

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
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
            Add Mux playback URLs now. Direct upload can slot in later.
          </p>
        </header>

        {!canEdit ? (
          <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Media editing needs <code className="font-mono">DATABASE_URL</code> configured. Mock media is read-only.
          </section>
        ) : null}

        <section className="mt-6 rounded-md border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Add media asset</h2>
          <MediaForm canEdit={canEdit} mode="create" />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {mediaAssets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-md border border-stone-200 bg-white"
            >
              <img
                src={asset.thumbnailUrl}
                alt=""
                className="aspect-video w-full object-cover"
              />
              <div className="p-4">
                <div className="flex flex-col gap-1 border-b border-stone-100 pb-4">
                  <h2 className="font-semibold">{asset.title}</h2>
                  <p className="text-sm text-stone-500">
                    {asset.durationSeconds}s - {asset.tags.join(", ") || "untagged"}
                  </p>
                </div>
                <MediaForm asset={asset} canEdit={canEdit} mode="update" />
              </div>
            </article>
          ))}
        </section>
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
  return (
    <form
      action={mode === "create" ? createMediaAsset : updateMediaAsset}
      className="mt-4 grid gap-3 lg:grid-cols-2"
    >
      {asset ? <input type="hidden" name="id" value={asset.id} /> : null}
      {mode === "create" ? (
        <Field label="URL id">
          <input
            name="id"
            disabled={!canEdit}
            placeholder="optional"
            className={inputClass}
          />
        </Field>
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
      <Field label="Playback URL">
        <input
          name="playbackUrl"
          required
          disabled={!canEdit}
          defaultValue={asset?.playbackUrl}
          placeholder="https://stream.mux.com/...m3u8"
          className={inputClass}
        />
      </Field>
      <Field label="Thumbnail URL">
        <input
          name="thumbnailUrl"
          required
          disabled={!canEdit}
          defaultValue={asset?.thumbnailUrl}
          placeholder="https://image.mux.com/.../thumbnail.jpg"
          className={inputClass}
        />
      </Field>
      <Field label="Mux playback id">
        <input
          name="muxPlaybackId"
          disabled={!canEdit}
          defaultValue={asset?.muxPlaybackId}
          placeholder="optional"
          className={inputClass}
        />
      </Field>
      <Field label="Mux asset id">
        <input
          name="muxAssetId"
          disabled={!canEdit}
          defaultValue={asset?.muxAssetId}
          placeholder="optional"
          className={inputClass}
        />
      </Field>
      <Field label="Source Drive URL">
        <input
          name="sourceDriveUrl"
          disabled={!canEdit}
          defaultValue={asset?.sourceDriveUrl}
          placeholder="optional"
          className={inputClass}
        />
      </Field>
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
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 lg:self-end"
      >
        <Plus size={16} />
        {mode === "create" ? "Add media" : "Save media"}
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

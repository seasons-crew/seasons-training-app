import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { createMediaAsset } from "../actions";
import { MediaAddTabs } from "./media-add-tabs";
import { MediaLibraryView } from "./media-library-view";
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
          <h1 className="text-2xl font-semibold">Media library</h1>
        </header>

        {!canEdit ? (
          <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Media editing needs <code className="font-mono">DATABASE_URL</code> configured. Mock media is read-only.
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <MediaLibraryView mediaAssets={mediaAssets} canEdit={canEdit} muxUploadEnabled={muxUploadEnabled} />

          <aside className="lg:sticky lg:top-6">
            <MediaAddTabs
              bulk={<MuxUploadCard enabled={muxUploadEnabled} />}
              manual={
                <div>
                  <h2 className="text-lg font-semibold">Add media manually</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Paste playback details only when a video already lives outside the uploader.
                  </p>
                  <MediaCreateForm canEdit={canEdit} />
                </div>
              }
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function MediaCreateForm({ canEdit }: { canEdit: boolean }) {
  return (
    <form action={createMediaAsset} className="mt-4 grid gap-3">
      <Field label="Title">
        <input name="title" required disabled={!canEdit} placeholder="Mobility Flow" className={inputClass} />
      </Field>
      <Field label="Duration seconds">
        <input
          name="durationSeconds"
          required
          disabled={!canEdit}
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
      <Field label="Tags">
        <input name="tags" disabled={!canEdit} placeholder="snow, mobility" className={inputClass} />
      </Field>
      <button
        disabled={!canEdit}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white transition-transform disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.96]"
      >
        <Plus size={16} />
        Add media
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

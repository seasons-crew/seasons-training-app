import Link from "next/link";
import { ArrowLeft, Archive, Plus, Save, Trash2 } from "lucide-react";
import {
  archiveTag,
  createTag,
  deleteUnusedTag,
  mergeTag,
  updateTag,
} from "../actions";
import { listTags } from "@/lib/tags";
import { isDatabaseConfigured } from "@/lib/workout-data";

export const dynamic = "force-dynamic";

const inputClass =
  "h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

const textareaClass =
  "min-h-20 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

export default async function TagsPage() {
  const canEdit = isDatabaseConfigured();
  const tags = canEdit ? await listTags(true) : [];
  const activeTags = tags.filter((tag) => !tag.archivedAt);

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

        <header className="mt-6 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tag library</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Manage the shared vocabulary used by media uploads and video edits.
            </p>
          </div>
          <Link
            href="/dashboard/media"
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-stone-950 hover:text-stone-950"
          >
            Media library
          </Link>
        </header>

        {!canEdit ? (
          <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Tag editing needs <code className="font-mono">DATABASE_URL</code>{" "}
            configured.
          </section>
        ) : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-md border border-stone-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Create tag</h2>
            <form action={createTag} className="mt-4 grid gap-3">
              <Field label="Name">
                <input
                  name="name"
                  required
                  disabled={!canEdit}
                  placeholder="Core"
                  className={inputClass}
                />
              </Field>
              <Field label="Category">
                <input
                  name="category"
                  disabled={!canEdit}
                  placeholder="Movement, Equipment, Program"
                  className={inputClass}
                />
              </Field>
              <Field label="Description">
                <textarea
                  name="description"
                  disabled={!canEdit}
                  placeholder="Optional internal note"
                  className={textareaClass}
                />
              </Field>
              <button
                disabled={!canEdit}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
                Create tag
              </button>
            </form>
          </aside>

          <section className="rounded-md border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-4">
              <h2 className="text-lg font-semibold">All tags</h2>
              <p className="mt-1 text-sm text-stone-500">
                {activeTags.length} active, {tags.length - activeTags.length} archived
              </p>
            </div>
            {tags.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {tags.map((tag) => (
                  <article key={tag.id} className="grid gap-4 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{tag.name}</h3>
                          {tag.archivedAt ? (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
                              Archived
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-stone-500">
                          {tag.category || "Uncategorized"} - {tag.usageCount}{" "}
                          {tag.usageCount === 1 ? "video" : "videos"}
                        </p>
                        {tag.description ? (
                          <p className="mt-2 text-sm text-stone-600">
                            {tag.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <form action={archiveTag}>
                          <input type="hidden" name="id" value={tag.id} />
                          <button
                            disabled={!canEdit || Boolean(tag.archivedAt)}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-stone-950 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Archive size={15} />
                            Archive
                          </button>
                        </form>
                        <form action={deleteUnusedTag}>
                          <input type="hidden" name="id" value={tag.id} />
                          <button
                            disabled={!canEdit || tag.usageCount > 0}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>

                    <details className="rounded-md bg-stone-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-stone-700">
                        Edit or merge
                      </summary>
                      <div className="mt-3 grid gap-4 lg:grid-cols-2">
                        <form action={updateTag} className="grid gap-3">
                          <input type="hidden" name="id" value={tag.id} />
                          <Field label="Name">
                            <input
                              name="name"
                              required
                              disabled={!canEdit}
                              defaultValue={tag.name}
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Category">
                            <input
                              name="category"
                              disabled={!canEdit}
                              defaultValue={tag.category || ""}
                              className={inputClass}
                            />
                          </Field>
                          <Field label="Description">
                            <textarea
                              name="description"
                              disabled={!canEdit}
                              defaultValue={tag.description || ""}
                              className={textareaClass}
                            />
                          </Field>
                          <button
                            disabled={!canEdit}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Save size={16} />
                            Save tag
                          </button>
                        </form>

                        <form action={mergeTag} className="grid content-start gap-3">
                          <input type="hidden" name="sourceId" value={tag.id} />
                          <Field label="Merge into">
                            <select
                              name="targetId"
                              required
                              disabled={!canEdit || activeTags.length < 2}
                              className={inputClass}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Choose tag
                              </option>
                              {activeTags
                                .filter((target) => target.id !== tag.id)
                                .map((target) => (
                                  <option key={target.id} value={target.id}>
                                    {target.name}
                                  </option>
                                ))}
                            </select>
                          </Field>
                          <p className="text-sm text-stone-500">
                            Moves this tag&apos;s videos to the selected tag, then archives this tag.
                          </p>
                          <button
                            disabled={!canEdit || Boolean(tag.archivedAt) || activeTags.length < 2}
                            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-stone-950 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Merge tag
                          </button>
                        </form>
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm font-medium text-stone-500">
                Create the first tag to start building the media vocabulary.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
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

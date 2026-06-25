import Image from "next/image";
import Link from "next/link";
import { Dumbbell, Film, LogOut, Plus } from "lucide-react";
import { createWorkout } from "./actions";
import { isDatabaseConfigured, listMediaAssets, listWorkouts } from "@/lib/workout-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [workouts, mediaAssets] = await Promise.all([
    listWorkouts(),
    listMediaAssets(),
  ]);
  const canEdit = isDatabaseConfigured();

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
              Seasons HQ
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal">
              Workout dashboard
            </h1>
          </div>
          <form action="/api/dashboard/logout" method="post">
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-600 transition hover:border-stone-300 hover:text-stone-950">
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Metric
            icon={<Dumbbell size={18} />}
            label="Workouts"
            value={String(workouts.length)}
          />
          <Metric
            icon={<Film size={18} />}
            label="Media assets"
            value={String(mediaAssets.length)}
          />
        </section>

        {!canEdit ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Dashboard editing is ready, but it needs a Vercel Marketplace Postgres
            database first. Add <code className="font-mono">DATABASE_URL</code>,
            then run migrations and seed data.
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-md border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Scheduled workouts</h2>
              </div>
              <form action={createWorkout} className="mt-4 grid gap-3 rounded-md bg-stone-50 p-3 md:grid-cols-[1.4fr_120px_150px_104px] md:items-end">
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Title
                  <input name="title" required disabled={!canEdit} placeholder="Snow Legs" className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950" />
                </label>
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Sport
                  <select name="sport" disabled={!canEdit} className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950">
                    <option value="snow">Snow</option>
                    <option value="earth">Earth</option>
                    <option value="water">Water</option>
                    <option value="general">General</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Active date
                  <input name="activeDate" required type="date" disabled={!canEdit} className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950" />
                </label>
                <button disabled={!canEdit} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <Plus size={16} />
                  Create
                </button>
              </form>
            </div>
            <div className="divide-y divide-stone-100">
              {workouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/dashboard/workouts/${workout.id}`}
                  className="grid gap-3 px-5 py-4 transition-colors hover:bg-stone-50 sm:grid-cols-[1fr_120px_120px] sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{workout.title}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      /workouts/{workout.id}
                    </p>
                  </div>
                  <p className="text-sm capitalize text-stone-600">
                    {workout.sport}
                  </p>
                  <p className="text-sm text-stone-600">{workout.activeDate}</p>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-md border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Media library</h2>
              <Link
                href="/dashboard/media"
                className="text-sm font-semibold text-stone-600 hover:text-stone-950"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {mediaAssets.map((asset) => (
                <div key={asset.id} className="flex gap-3">
                  <Image
                    src={asset.thumbnailUrl}
                    alt=""
                    width={80}
                    height={64}
                    className="h-16 w-20 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold">{asset.title}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {asset.durationSeconds}s - {asset.tags.join(", ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-stone-500">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

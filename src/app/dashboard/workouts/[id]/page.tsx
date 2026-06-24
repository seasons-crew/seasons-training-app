import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getWorkout } from "@/lib/workouts";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardWorkoutPage({ params }: PageProps) {
  const { id } = await params;
  const workout = getWorkout(id);

  if (!workout) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        <header className="rounded-md border border-stone-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                {workout.sport}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{workout.title}</h1>
              <p className="mt-2 text-sm text-stone-500">
                Active {workout.activeDate} - Status stored as {workout.status}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/workouts/${workout.id}?sneak=true`}
                className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold"
              >
                Preview
              </Link>
              <Link
                href={`/workouts/${workout.id}`}
                className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Public link
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-md border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <h2 className="text-lg font-semibold">Steps</h2>
            <button className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white">
              <Plus size={16} />
              Add step
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {workout.steps.map((step, index) => (
              <div
                key={step.id}
                className="grid gap-4 px-5 py-4 md:grid-cols-[32px_120px_1fr_160px_44px] md:items-center"
              >
                <button
                  aria-label="Drag step"
                  className="hidden h-9 w-8 items-center justify-center rounded-md text-stone-400 md:flex"
                >
                  <GripVertical size={18} />
                </button>
                <Image
                  src={step.media.thumbnailUrl}
                  alt=""
                  width={112}
                  height={80}
                  className="h-20 w-full rounded-md object-cover md:w-28"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {step.media.title}
                  </p>
                </div>
                <div className="rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-700">
                  {step.advanceMode}
                  {step.durationSeconds ? ` - ${step.durationSeconds}s` : ""}
                </div>
                <button
                  aria-label="Remove step"
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-500"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

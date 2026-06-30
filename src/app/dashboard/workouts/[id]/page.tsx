import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import {
  addWorkoutStep,
  deleteWorkoutStep,
  reorderWorkoutSteps,
  updateWorkout,
  updateWorkoutStep,
} from "../../actions";
import { SortableStepList } from "./sortable-step-list";
import { StepBuilderForm } from "./step-builder-form";
import { WorkoutEditModal } from "./workout-edit-modal";
import {
  getWorkout,
  isDatabaseConfigured,
  listMediaAssets,
} from "@/lib/workout-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardWorkoutPage({ params }: PageProps) {
  const { id } = await params;
  const [workout, mediaAssets] = await Promise.all([
    getWorkout(id),
    listMediaAssets(),
  ]);
  const canEdit = isDatabaseConfigured();
  const readyMediaAssets = mediaAssets.filter((asset) => asset.playbackUrl);

  if (!workout) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
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
                Scheduled {formatScheduledDates(workout.scheduledDates)} -{" "}
                {workout.steps.length} steps
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <WorkoutEditModal
                action={updateWorkout}
                activeDate={workout.activeDate}
                scheduledDates={workout.scheduledDates}
                canEdit={canEdit}
                id={workout.id}
                sport={workout.sport}
                title={workout.title}
              />
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

        {!canEdit ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Step editing is ready, but it needs
            <code className="mx-1 font-mono">DATABASE_URL</code> configured first.
            The mock workout below is read-only for now.
          </section>
        ) : null}

        <section className="rounded-md border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Build steps</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Choose media, set how it advances, then drag steps into order.
                </p>
              </div>
              <Link
                href="/dashboard/media"
                className="text-sm font-semibold text-stone-600 hover:text-stone-950"
              >
                Manage media
              </Link>
            </div>
            <div className="mt-4">
              <StepBuilderForm
                action={addWorkoutStep}
                canEdit={canEdit}
                mediaAssets={readyMediaAssets}
                submitLabel="Add step"
                workoutId={workout.id}
              />
            </div>
            {readyMediaAssets.length === 0 ? (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                Upload and process media before adding workout steps.
              </p>
            ) : null}
          </div>

          <SortableStepList
            key={workout.steps.map((step) => step.id).join(":")}
            canEdit={canEdit}
            deleteAction={deleteWorkoutStep}
            mediaAssets={readyMediaAssets}
            reorderAction={reorderWorkoutSteps}
            steps={workout.steps}
            updateAction={updateWorkoutStep}
            workoutId={workout.id}
          />
        </section>

        <section className="rounded-md border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Feedback</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Test-phase athlete ratings and comments from the completion screen.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="rounded-md bg-stone-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                    Average
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatRating(workout.feedbackSummary?.averageRating)}
                  </p>
                </div>
                <div className="rounded-md bg-stone-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                    Responses
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {workout.feedbackSummary?.responseCount ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {workout.feedback.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {workout.feedback.map((feedback) => (
                <article key={feedback.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[120px_1fr_160px] sm:items-start">
                  <p className="font-semibold text-stone-800">{feedback.rating}/5</p>
                  <div>
                    <p className="font-semibold">{feedback.name}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {feedback.comment || "No written feedback."}
                    </p>
                  </div>
                  <p className="text-sm text-stone-500">
                    {new Date(feedback.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm font-medium text-stone-500">
              No feedback has been submitted for this workout yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatScheduledDates(dates: string[]) {
  if (dates.length <= 2) {
    return dates.join(", ");
  }

  return `${dates[0]} + ${dates.length - 1} more`;
}

function formatRating(rating?: number | null) {
  return rating === null || rating === undefined ? "-" : rating.toFixed(1);
}

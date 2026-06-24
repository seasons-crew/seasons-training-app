import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import {
  addWorkoutStep,
  deleteWorkoutStep,
  moveWorkoutStep,
  updateWorkout,
  updateWorkoutStep,
} from "../../actions";
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
          <form action={updateWorkout} className="mt-5 grid gap-3 rounded-md bg-stone-50 p-3 md:grid-cols-[1fr_140px_160px_112px] md:items-end">
            <input type="hidden" name="id" value={workout.id} />
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Title
              <input
                name="title"
                required
                disabled={!canEdit}
                defaultValue={workout.title}
                className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Sport
              <select
                name="sport"
                disabled={!canEdit}
                defaultValue={workout.sport}
                className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
              >
                <option value="snow">Snow</option>
                <option value="earth">Earth</option>
                <option value="water">Water</option>
                <option value="general">General</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
              Active date
              <input
                name="activeDate"
                required
                type="date"
                disabled={!canEdit}
                defaultValue={workout.activeDate}
                className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
              />
            </label>
            <button
              disabled={!canEdit}
              className="h-10 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </form>
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
            <h2 className="text-lg font-semibold">Add step</h2>
            <StepForm
              action={addWorkoutStep}
              canEdit={canEdit}
              mediaAssets={mediaAssets}
              submitLabel="Add step"
              workoutId={workout.id}
            />
          </div>

          <div className="divide-y divide-stone-100">
            {workout.steps.map((step, index) => (
              <div key={step.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[120px_1fr]">
                <Image
                  src={step.media.thumbnailUrl}
                  alt=""
                  width={160}
                  height={112}
                  className="h-28 w-full rounded-md object-cover lg:w-28"
                />
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                        Step {index + 1}
                      </p>
                      <p className="mt-1 font-semibold">{step.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <MoveButton
                        direction="up"
                        disabled={!canEdit || index === 0}
                        id={step.id}
                        position={index}
                        workoutId={workout.id}
                      />
                      <MoveButton
                        direction="down"
                        disabled={!canEdit || index === workout.steps.length - 1}
                        id={step.id}
                        position={index}
                        workoutId={workout.id}
                      />
                      <form action={deleteWorkoutStep}>
                        <input type="hidden" name="id" value={step.id} />
                        <input type="hidden" name="workoutId" value={workout.id} />
                        <button
                          disabled={!canEdit}
                          aria-label="Remove step"
                          className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={17} />
                        </button>
                      </form>
                    </div>
                  </div>

                  <StepForm
                    action={updateWorkoutStep}
                    canEdit={canEdit}
                    mediaAssets={mediaAssets}
                    step={step}
                    submitLabel="Save step"
                    workoutId={workout.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

type StepFormProps = {
  action: (formData: FormData) => Promise<void>;
  canEdit: boolean;
  mediaAssets: Awaited<ReturnType<typeof listMediaAssets>>;
  step?: NonNullable<Awaited<ReturnType<typeof getWorkout>>>["steps"][number];
  submitLabel: string;
  workoutId: string;
};

function StepForm({
  action,
  canEdit,
  mediaAssets,
  step,
  submitLabel,
  workoutId,
}: StepFormProps) {
  return (
    <form
      action={action}
      className="mt-4 grid gap-3 rounded-md bg-stone-50 p-3 lg:grid-cols-[1fr_180px_150px_120px_1fr_110px] lg:items-end"
    >
      <input type="hidden" name="workoutId" value={workoutId} />
      {step ? <input type="hidden" name="id" value={step.id} /> : null}
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        Title
        <input
          name="title"
          required
          disabled={!canEdit}
          defaultValue={step?.title}
          placeholder="Balance hold"
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        Media
        <select
          name="mediaAssetId"
          required
          disabled={!canEdit}
          defaultValue={step?.mediaAssetId || mediaAssets[0]?.id}
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950"
        >
          {mediaAssets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.title}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        Advance
        <select
          name="advanceMode"
          disabled={!canEdit}
          defaultValue={step?.advanceMode || "video_end"}
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950"
        >
          <option value="video_end">Video end</option>
          <option value="timer">Timer</option>
          <option value="manual">Manual</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        Timer
        <select
          name="timerStartMode"
          disabled={!canEdit}
          defaultValue={step?.timerStartMode || "auto"}
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950"
        >
          <option value="auto">Auto</option>
          <option value="tap">Tap</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
        Seconds / button label
        <input
          name="durationSeconds"
          disabled={!canEdit}
          defaultValue={step?.durationSeconds}
          inputMode="numeric"
          placeholder="30"
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950"
        />
        <input
          name="manualButtonLabel"
          disabled={!canEdit}
          defaultValue={step?.manualButtonLabel}
          placeholder="Done"
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-950 outline-none focus:border-stone-950"
        />
      </label>
      <button
        disabled={!canEdit || mediaAssets.length === 0}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={16} />
        {submitLabel}
      </button>
    </form>
  );
}

function MoveButton({
  direction,
  disabled,
  id,
  position,
  workoutId,
}: {
  direction: "up" | "down";
  disabled: boolean;
  id: string;
  position: number;
  workoutId: string;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <form action={moveWorkoutStep}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="position" value={position} />
      <input type="hidden" name="direction" value={direction} />
      <button
        disabled={disabled}
        aria-label={`Move step ${direction}`}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:border-stone-300 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon size={17} />
      </button>
    </form>
  );
}

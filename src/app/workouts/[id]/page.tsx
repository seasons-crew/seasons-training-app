import { notFound } from "next/navigation";
import { getWorkoutAvailability } from "@/lib/date";
import { getWorkout } from "@/lib/workout-data";
import { WorkoutPlayer } from "./workout-player";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sneak?: string }>;
};

export const dynamic = "force-dynamic";

export default async function WorkoutPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const workout = await getWorkout(id);

  if (!workout) {
    notFound();
  }

  const availability = getWorkoutAvailability(
    workout.activeDate,
    query.sneak === "true",
  );

  if (availability === "early") {
    return <AccessMessage message="Come back when we buzz ya" />;
  }

  if (availability === "expired") {
    return <AccessMessage message="That workout expired" />;
  }

  return <WorkoutPlayer workout={workout} />;
}

function AccessMessage({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-black px-6 text-white">
      <div className="max-w-sm text-center">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/40">
          Seasons
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight">{message}</h1>
      </div>
    </main>
  );
}

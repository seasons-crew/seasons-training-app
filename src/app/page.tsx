import { redirect } from "next/navigation";
import { getTodayWorkoutId } from "@/lib/workout-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  redirect(`/workouts/${(await getTodayWorkoutId()) ?? "snow-today"}`);
}

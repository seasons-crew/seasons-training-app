import { redirect } from "next/navigation";
import { getTodayWorkoutId } from "@/lib/workout-data";

export default async function Home() {
  redirect(`/workouts/${(await getTodayWorkoutId()) ?? "snow-today"}`);
}

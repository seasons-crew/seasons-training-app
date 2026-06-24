import { redirect } from "next/navigation";
import { getTodayWorkoutId } from "@/lib/workouts";

export default function Home() {
  redirect(`/workouts/${getTodayWorkoutId() ?? "snow-today"}`);
}

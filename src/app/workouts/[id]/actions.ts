"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function requiredString(formData: FormData, name: string) {
  const value = String(formData.get(name) || "").trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export async function submitWorkoutFeedback(formData: FormData) {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
    return;
  }

  const workoutId = requiredString(formData, "workoutId");
  const name = requiredString(formData, "name");
  const rating = Number(requiredString(formData, "rating"));
  const comment = String(formData.get("comment") || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  await prisma.workoutFeedback.create({
    data: {
      id: crypto.randomUUID(),
      workoutId,
      rating,
      name,
      comment: comment || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workouts/${workoutId}`);
}

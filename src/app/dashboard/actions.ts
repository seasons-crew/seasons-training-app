"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type {
  SportCategory,
  StepAdvanceMode,
  TimerStartMode,
} from "@/lib/types";

const sports: SportCategory[] = ["snow", "earth", "water", "general"];
const advanceModes: StepAdvanceMode[] = ["video_end", "timer", "manual"];
const timerStartModes: TimerStartMode[] = ["auto", "tap"];

function requireDatabase() {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
    throw new Error("DATABASE_URL is required for dashboard edits.");
  }
}

function requiredString(formData: FormData, name: string) {
  const value = String(formData.get(name) || "").trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function optionalString(formData: FormData, name: string) {
  const value = String(formData.get(name) || "").trim();
  return value || null;
}

function optionalNumber(formData: FormData, name: string) {
  const value = String(formData.get(name) || "").trim();
  return value ? Number(value) : null;
}

function dateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function parseSport(value: string): SportCategory {
  if (sports.includes(value as SportCategory)) {
    return value as SportCategory;
  }

  throw new Error("Invalid sport category.");
}

function parseAdvanceMode(value: string): StepAdvanceMode {
  if (advanceModes.includes(value as StepAdvanceMode)) {
    return value as StepAdvanceMode;
  }

  throw new Error("Invalid step advance mode.");
}

function parseTimerStartMode(value: string | null): TimerStartMode | null {
  if (!value) {
    return null;
  }

  if (timerStartModes.includes(value as TimerStartMode)) {
    return value as TimerStartMode;
  }

  throw new Error("Invalid timer start mode.");
}

export async function createWorkout(formData: FormData) {
  requireDatabase();

  const title = requiredString(formData, "title");
  const sport = parseSport(requiredString(formData, "sport"));
  const activeDate = requiredString(formData, "activeDate");
  const id = `${sport}-${activeDate}-${crypto.randomUUID().slice(0, 8)}`;

  await prisma.workout.create({
    data: {
      id,
      title,
      sport,
      activeDate: dateOnly(activeDate),
      status: "published",
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/workouts/${id}`);
}

export async function updateWorkout(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const title = requiredString(formData, "title");
  const sport = parseSport(requiredString(formData, "sport"));
  const activeDate = requiredString(formData, "activeDate");

  await prisma.workout.update({
    where: { id },
    data: {
      title,
      sport,
      activeDate: dateOnly(activeDate),
      status: "published",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workouts/${id}`);
  revalidatePath(`/workouts/${id}`);
}

function parseTags(value: string | null) {
  return (value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function createMediaAsset(formData: FormData) {
  requireDatabase();

  const title = requiredString(formData, "title");
  const requestedId = optionalString(formData, "id");
  const playbackUrl = requiredString(formData, "playbackUrl");
  const thumbnailUrl = requiredString(formData, "thumbnailUrl");
  const durationSeconds = Number(requiredString(formData, "durationSeconds"));
  const id = requestedId || slugify(title) || crypto.randomUUID();

  await prisma.mediaAsset.create({
    data: {
      id,
      title,
      durationSeconds,
      playbackUrl,
      thumbnailUrl,
      muxPlaybackId: optionalString(formData, "muxPlaybackId"),
      muxAssetId: optionalString(formData, "muxAssetId"),
      status: "ready",
      sourceDriveUrl: optionalString(formData, "sourceDriveUrl"),
      tags: parseTags(optionalString(formData, "tags")),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");
}

export async function updateMediaAsset(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const durationSeconds = Number(requiredString(formData, "durationSeconds"));

  await prisma.mediaAsset.update({
    where: { id },
    data: {
      title: requiredString(formData, "title"),
      durationSeconds,
      playbackUrl: String(formData.get("playbackUrl") ?? ""),
      thumbnailUrl: String(formData.get("thumbnailUrl") ?? ""),
      muxPlaybackId: optionalString(formData, "muxPlaybackId"),
      muxAssetId: optionalString(formData, "muxAssetId"),
      sourceDriveUrl: optionalString(formData, "sourceDriveUrl"),
      tags: parseTags(optionalString(formData, "tags")),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");
  redirect("/dashboard/media");
}

export async function addWorkoutStep(formData: FormData) {
  requireDatabase();

  const workoutId = requiredString(formData, "workoutId");
  const mediaAssetId = requiredString(formData, "mediaAssetId");
  const mediaAsset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: { title: true, durationSeconds: true },
  });

  if (!mediaAsset) {
    throw new Error("Media asset is required.");
  }

  const title = mediaAsset.title;
  const advanceMode = parseAdvanceMode(requiredString(formData, "advanceMode"));
  const timerStartMode = parseTimerStartMode(
    optionalString(formData, "timerStartMode"),
  );
  const durationSeconds = optionalNumber(formData, "durationSeconds");
  const manualButtonLabel = optionalString(formData, "manualButtonLabel");
  const lastStep = await prisma.workoutStep.findFirst({
    where: { workoutId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.workoutStep.create({
    data: {
      id: crypto.randomUUID(),
      workoutId,
      title,
      mediaAssetId,
      position: (lastStep?.position ?? -1) + 1,
      advanceMode,
      timerStartMode: advanceMode === "timer" ? timerStartMode || "auto" : null,
      durationSeconds: advanceMode === "timer" ? durationSeconds : null,
      manualButtonLabel: advanceMode === "manual" ? manualButtonLabel : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workouts/${workoutId}`);
  revalidatePath(`/workouts/${workoutId}`);
}

export async function updateWorkoutStep(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const workoutId = requiredString(formData, "workoutId");
  const mediaAssetId = requiredString(formData, "mediaAssetId");
  const mediaAsset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: { title: true, durationSeconds: true },
  });

  if (!mediaAsset) {
    throw new Error("Media asset is required.");
  }

  const title = mediaAsset.title;
  const advanceMode = parseAdvanceMode(requiredString(formData, "advanceMode"));
  const timerStartMode = parseTimerStartMode(
    optionalString(formData, "timerStartMode"),
  );
  const durationSeconds = optionalNumber(formData, "durationSeconds");
  const manualButtonLabel = optionalString(formData, "manualButtonLabel");

  await prisma.workoutStep.update({
    where: { id },
    data: {
      title,
      mediaAssetId,
      advanceMode,
      timerStartMode: advanceMode === "timer" ? timerStartMode || "auto" : null,
      durationSeconds: advanceMode === "timer" ? durationSeconds : null,
      manualButtonLabel: advanceMode === "manual" ? manualButtonLabel : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workouts/${workoutId}`);
  revalidatePath(`/workouts/${workoutId}`);
}

export async function deleteWorkoutStep(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const workoutId = requiredString(formData, "workoutId");

  await prisma.$transaction(async (tx) => {
    await tx.workoutStep.delete({ where: { id } });
    const remaining = await tx.workoutStep.findMany({
      where: { workoutId },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    for (const [position, step] of remaining.entries()) {
      await tx.workoutStep.update({
        where: { id: step.id },
        data: { position },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workouts/${workoutId}`);
  revalidatePath(`/workouts/${workoutId}`);
}

export async function moveWorkoutStep(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const workoutId = requiredString(formData, "workoutId");
  const direction = requiredString(formData, "direction");
  const currentPosition = Number(requiredString(formData, "position"));
  const targetPosition =
    direction === "up" ? currentPosition - 1 : currentPosition + 1;

  await prisma.$transaction(async (tx) => {
    const target = await tx.workoutStep.findFirst({
      where: { workoutId, position: targetPosition },
      select: { id: true },
    });

    if (!target) {
      return;
    }

    await tx.workoutStep.update({
      where: { id },
      data: { position: -1 },
    });
    await tx.workoutStep.update({
      where: { id: target.id },
      data: { position: currentPosition },
    });
    await tx.workoutStep.update({
      where: { id },
      data: { position: targetPosition },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workouts/${workoutId}`);
  revalidatePath(`/workouts/${workoutId}`);
}


export async function reorderWorkoutSteps(formData: FormData) {
  requireDatabase();

  const workoutId = requiredString(formData, "workoutId");
  const stepIds = JSON.parse(requiredString(formData, "stepIds")) as string[];

  await prisma.$transaction(async (tx) => {
    for (const [position, stepId] of stepIds.entries()) {
      await tx.workoutStep.updateMany({
        where: { id: stepId, workoutId },
        data: { position: position + 1000 },
      });
    }

    for (const [position, stepId] of stepIds.entries()) {
      await tx.workoutStep.updateMany({
        where: { id: stepId, workoutId },
        data: { position },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workouts/${workoutId}`);
  revalidatePath(`/workouts/${workoutId}`);
}

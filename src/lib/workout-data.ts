import { getTodayInLosAngeles } from "./date";
import type {
  HydratedWorkout,
  HydratedWorkoutStep,
  MediaAsset,
  Workout,
} from "./types";
import {
  getTodayWorkoutId as getMockTodayWorkoutId,
  getWorkout as getMockWorkout,
  mediaAssets as mockMediaAssets,
  workouts as mockWorkouts,
} from "./workouts";

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function getPrisma() {
  const { prisma } = await import("./prisma");
  return prisma;
}

export async function listMediaAssets(): Promise<MediaAsset[]> {
  if (!shouldUseDatabase()) {
    return mockMediaAssets;
  }

  const prisma = await getPrisma();
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { title: "asc" },
  });

  return assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    durationSeconds: asset.durationSeconds,
    thumbnailUrl: asset.thumbnailUrl,
    playbackUrl: asset.playbackUrl,
    muxPlaybackId: asset.muxPlaybackId ?? undefined,
    muxAssetId: asset.muxAssetId ?? undefined,
    sourceDriveUrl: asset.sourceDriveUrl ?? undefined,
    tags: asset.tags,
  }));
}

export async function listWorkouts(): Promise<Workout[]> {
  if (!shouldUseDatabase()) {
    return mockWorkouts;
  }

  const prisma = await getPrisma();
  const workouts = await prisma.workout.findMany({
    include: {
      steps: {
        orderBy: { position: "asc" },
      },
    },
    orderBy: [{ activeDate: "desc" }, { sport: "asc" }],
  });

  return workouts.map((workout) => ({
    id: workout.id,
    title: workout.title,
    sport: workout.sport,
    activeDate: toDateOnly(workout.activeDate),
    status: workout.status,
    updatedAt: workout.updatedAt.toISOString(),
    steps: workout.steps.map((step) => ({
      id: step.id,
      title: step.title,
      mediaAssetId: step.mediaAssetId,
      advanceMode: step.advanceMode,
      timerStartMode: step.timerStartMode ?? undefined,
      durationSeconds: step.durationSeconds ?? undefined,
      manualButtonLabel: step.manualButtonLabel ?? undefined,
    })),
  }));
}

export async function getWorkout(id: string): Promise<HydratedWorkout | undefined> {
  if (!shouldUseDatabase()) {
    return getMockWorkout(id);
  }

  const prisma = await getPrisma();
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { position: "asc" },
        include: { mediaAsset: true },
      },
    },
  });

  if (!workout) {
    return undefined;
  }

  return {
    id: workout.id,
    title: workout.title,
    sport: workout.sport,
    activeDate: toDateOnly(workout.activeDate),
    status: workout.status,
    updatedAt: workout.updatedAt.toISOString(),
    steps: workout.steps.map(
      (step): HydratedWorkoutStep => ({
        id: step.id,
        title: step.title,
        mediaAssetId: step.mediaAssetId,
        advanceMode: step.advanceMode,
        timerStartMode: step.timerStartMode ?? undefined,
        durationSeconds: step.durationSeconds ?? undefined,
        manualButtonLabel: step.manualButtonLabel ?? undefined,
        media: {
          id: step.mediaAsset.id,
          title: step.mediaAsset.title,
          durationSeconds: step.mediaAsset.durationSeconds,
          thumbnailUrl: step.mediaAsset.thumbnailUrl,
          playbackUrl: step.mediaAsset.playbackUrl,
          muxPlaybackId: step.mediaAsset.muxPlaybackId ?? undefined,
          muxAssetId: step.mediaAsset.muxAssetId ?? undefined,
          sourceDriveUrl: step.mediaAsset.sourceDriveUrl ?? undefined,
          tags: step.mediaAsset.tags,
        },
      }),
    ),
  };
}

export async function getTodayWorkoutId() {
  if (!shouldUseDatabase()) {
    return getMockTodayWorkoutId();
  }

  const prisma = await getPrisma();
  const today = new Date(`${getTodayInLosAngeles()}T00:00:00.000Z`);
  const workout = await prisma.workout.findFirst({
    where: {
      activeDate: today,
      status: "published",
    },
    orderBy: { sport: "asc" },
    select: { id: true },
  });

  return workout?.id;
}

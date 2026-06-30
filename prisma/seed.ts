import { PrismaClient } from "@prisma/client";
import { mediaAssets, workouts } from "../src/lib/workouts";

const prisma = new PrismaClient();

function asDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

async function main() {
  for (const asset of mediaAssets) {
    await prisma.mediaAsset.upsert({
      where: { id: asset.id },
      update: {
        title: asset.title,
        durationSeconds: asset.durationSeconds,
        thumbnailUrl: asset.thumbnailUrl,
        playbackUrl: asset.playbackUrl,
        muxPlaybackId: asset.muxPlaybackId,
        muxAssetId: asset.muxAssetId,
        status: asset.status || "ready",
        sourceDriveUrl: asset.sourceDriveUrl,
        tags: asset.tags,
      },
      create: {
        id: asset.id,
        title: asset.title,
        durationSeconds: asset.durationSeconds,
        thumbnailUrl: asset.thumbnailUrl,
        playbackUrl: asset.playbackUrl,
        muxPlaybackId: asset.muxPlaybackId,
        muxAssetId: asset.muxAssetId,
        status: asset.status || "ready",
        sourceDriveUrl: asset.sourceDriveUrl,
        tags: asset.tags,
      },
    });
  }

  for (const workout of workouts) {
    await prisma.workout.upsert({
      where: { id: workout.id },
      update: {
        title: workout.title,
        sport: workout.sport,
        activeDate: asDateOnly(workout.activeDate),
        status: workout.status,
      },
      create: {
        id: workout.id,
        title: workout.title,
        sport: workout.sport,
        activeDate: asDateOnly(workout.activeDate),
        status: workout.status,
      },
    });

    await prisma.workoutStep.deleteMany({
      where: { workoutId: workout.id },
    });

    await prisma.workoutStep.createMany({
      data: workout.steps.map((step, index) => ({
        id: `${workout.id}-${step.id}`,
        workoutId: workout.id,
        mediaAssetId: step.mediaAssetId,
        position: index,
        title: step.title,
        advanceMode: step.advanceMode,
        timerStartMode: step.timerStartMode,
        durationSeconds: step.durationSeconds,
        manualButtonLabel: step.manualButtonLabel,
      })),
    });

    await prisma.workoutSchedule.deleteMany({
      where: { workoutId: workout.id },
    });

    await prisma.workoutSchedule.createMany({
      data: workout.scheduledDates.map((activeDate) => ({
        id: `${workout.id}-schedule-${activeDate}`,
        workoutId: workout.id,
        activeDate: asDateOnly(activeDate),
      })),
      skipDuplicates: true,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

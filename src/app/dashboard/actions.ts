"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseTagNames, syncMediaTags, tagSlug } from "@/lib/tags";
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

function parseScheduledDates(formData: FormData) {
  const rawDates = [
    ...formData.getAll("activeDates"),
    String(formData.get("activeDate") || ""),
  ];
  const dates = rawDates
    .flatMap((value) => String(value).split(/[\n,]+/))
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueDates = [...new Set(dates)].sort();

  if (uniqueDates.length === 0) {
    throw new Error("At least one scheduled date is required.");
  }

  return uniqueDates;
}

function scheduleId(workoutId: string, activeDate: string) {
  return `${workoutId}-schedule-${activeDate}`;
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
  const scheduledDates = parseScheduledDates(formData);
  const activeDate = scheduledDates[0];
  const id = `${sport}-${activeDate}-${crypto.randomUUID().slice(0, 8)}`;

  await prisma.$transaction(async (tx) => {
    await tx.workout.create({
      data: {
        id,
        title,
        sport,
        activeDate: dateOnly(activeDate),
        status: "published",
      },
    });

    await tx.workoutSchedule.createMany({
      data: scheduledDates.map((scheduledDate) => ({
        id: scheduleId(id, scheduledDate),
        workoutId: id,
        activeDate: dateOnly(scheduledDate),
      })),
      skipDuplicates: true,
    });
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/workouts/${id}`);
}

export async function updateWorkout(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const title = requiredString(formData, "title");
  const sport = parseSport(requiredString(formData, "sport"));
  const scheduledDates = parseScheduledDates(formData);
  const activeDate = scheduledDates[0];

  await prisma.$transaction(async (tx) => {
    await tx.workout.update({
      where: { id },
      data: {
        title,
        sport,
        activeDate: dateOnly(activeDate),
        status: "published",
      },
    });

    await tx.workoutSchedule.deleteMany({ where: { workoutId: id } });
    await tx.workoutSchedule.createMany({
      data: scheduledDates.map((scheduledDate) => ({
        id: scheduleId(id, scheduledDate),
        workoutId: id,
        activeDate: dateOnly(scheduledDate),
      })),
      skipDuplicates: true,
    });
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/workouts/${id}`);
  revalidatePath(`/workouts/${id}`);
}

export async function createMediaAsset(formData: FormData) {
  requireDatabase();

  const title = requiredString(formData, "title");
  const requestedId = optionalString(formData, "id");
  const playbackUrl = requiredString(formData, "playbackUrl");
  const thumbnailUrl = requiredString(formData, "thumbnailUrl");
  const durationSeconds = Number(requiredString(formData, "durationSeconds"));
  const id = requestedId || slugify(title) || crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.create({
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
        tags: [],
      },
    });

    await syncMediaTags(tx, id, parseTagNames(formData.get("tags")));
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/tags");
}

export async function updateMediaAsset(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const durationSeconds = Number(requiredString(formData, "durationSeconds"));

  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.update({
      where: { id },
      data: {
        title: requiredString(formData, "title"),
        durationSeconds,
        playbackUrl: String(formData.get("playbackUrl") ?? ""),
        thumbnailUrl: String(formData.get("thumbnailUrl") ?? ""),
        muxPlaybackId: optionalString(formData, "muxPlaybackId"),
        muxAssetId: optionalString(formData, "muxAssetId"),
        sourceDriveUrl: optionalString(formData, "sourceDriveUrl"),
      },
    });

    await syncMediaTags(tx, id, parseTagNames(formData.get("tags")));
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/tags");
}

export async function createTag(formData: FormData) {
  requireDatabase();

  const name = requiredString(formData, "name");
  const slug = tagSlug(name);

  if (!slug) {
    throw new Error("Tag name is required.");
  }

  await prisma.tag.upsert({
    where: { slug },
    update: {
      archivedAt: null,
      category: optionalString(formData, "category"),
      description: optionalString(formData, "description"),
      name,
    },
    create: {
      id: crypto.randomUUID(),
      category: optionalString(formData, "category"),
      description: optionalString(formData, "description"),
      name,
      slug,
    },
  });

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/tags");
}

export async function updateTag(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const name = requiredString(formData, "name");
  const slug = tagSlug(name);

  if (!slug) {
    throw new Error("Tag name is required.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tag.update({
      where: { id },
      data: {
        category: optionalString(formData, "category"),
        description: optionalString(formData, "description"),
        name,
        slug,
      },
    });

    const affectedMedia = await tx.mediaAsset.findMany({
      where: { mediaTags: { some: { tagId: id } } },
      select: {
        id: true,
        mediaTags: {
          include: { tag: true },
          where: { tag: { archivedAt: null } },
        },
      },
    });

    for (const media of affectedMedia) {
      await tx.mediaAsset.update({
        where: { id: media.id },
        data: {
          tags: media.mediaTags
            .map((mediaTag) => mediaTag.tag.name)
            .sort((a, b) => a.localeCompare(b)),
        },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/tags");
}

export async function archiveTag(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");

  await prisma.tag.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/tags");
}

export async function deleteUnusedTag(formData: FormData) {
  requireDatabase();

  const id = requiredString(formData, "id");
  const usage = await prisma.mediaAssetTag.count({ where: { tagId: id } });

  if (usage > 0) {
    throw new Error("Only unused tags can be deleted.");
  }

  await prisma.tag.delete({ where: { id } });

  revalidatePath("/dashboard/tags");
}

export async function mergeTag(formData: FormData) {
  requireDatabase();

  const sourceId = requiredString(formData, "sourceId");
  const targetId = requiredString(formData, "targetId");

  if (sourceId === targetId) {
    throw new Error("Choose two different tags to merge.");
  }

  await prisma.$transaction(async (tx) => {
    const sourceLinks = await tx.mediaAssetTag.findMany({
      where: { tagId: sourceId },
      select: { mediaAssetId: true },
    });

    if (sourceLinks.length > 0) {
      await tx.mediaAssetTag.createMany({
        data: sourceLinks.map((link) => ({
          mediaAssetId: link.mediaAssetId,
          tagId: targetId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.mediaAssetTag.deleteMany({ where: { tagId: sourceId } });
    await tx.tag.update({
      where: { id: sourceId },
      data: { archivedAt: new Date() },
    });

    const affectedIds = [...new Set(sourceLinks.map((link) => link.mediaAssetId))];

    for (const mediaAssetId of affectedIds) {
      const tags = await tx.mediaAssetTag.findMany({
        where: { mediaAssetId, tag: { archivedAt: null } },
        include: { tag: true },
      });

      await tx.mediaAsset.update({
        where: { id: mediaAssetId },
        data: {
          tags: tags
            .map((mediaTag) => mediaTag.tag.name)
            .sort((a, b) => a.localeCompare(b)),
        },
      });
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/tags");
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

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SportCategory" AS ENUM ('snow', 'earth', 'water', 'general');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "StepAdvanceMode" AS ENUM ('video_end', 'timer', 'manual');

-- CreateEnum
CREATE TYPE "TimerStartMode" AS ENUM ('auto', 'tap');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "playbackUrl" TEXT NOT NULL,
    "muxPlaybackId" TEXT,
    "muxAssetId" TEXT,
    "sourceDriveUrl" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sport" "SportCategory" NOT NULL,
    "activeDate" DATE NOT NULL,
    "status" "WorkoutStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutStep" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "advanceMode" "StepAdvanceMode" NOT NULL,
    "timerStartMode" "TimerStartMode",
    "durationSeconds" INTEGER,
    "manualButtonLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaAsset_title_idx" ON "MediaAsset"("title");

-- CreateIndex
CREATE INDEX "Workout_activeDate_idx" ON "Workout"("activeDate");

-- CreateIndex
CREATE INDEX "Workout_sport_activeDate_idx" ON "Workout"("sport", "activeDate");

-- CreateIndex
CREATE INDEX "WorkoutStep_mediaAssetId_idx" ON "WorkoutStep"("mediaAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutStep_workoutId_position_key" ON "WorkoutStep"("workoutId", "position");

-- AddForeignKey
ALTER TABLE "WorkoutStep" ADD CONSTRAINT "WorkoutStep_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutStep" ADD CONSTRAINT "WorkoutStep_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;


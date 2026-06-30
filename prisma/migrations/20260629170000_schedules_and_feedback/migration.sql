-- CreateTable
CREATE TABLE "WorkoutSchedule" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "activeDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutSchedule_pkey" PRIMARY KEY ("id")
);

-- Backfill existing workouts as one scheduled date each.
INSERT INTO "WorkoutSchedule" ("id", "workoutId", "activeDate")
SELECT "id" || '-schedule-' || to_char("activeDate", 'YYYY-MM-DD'), "id", "activeDate"
FROM "Workout"
ON CONFLICT DO NOTHING;

-- CreateTable
CREATE TABLE "WorkoutFeedback" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "workoutScheduleId" TEXT,
    "rating" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSchedule_workoutId_activeDate_key" ON "WorkoutSchedule"("workoutId", "activeDate");

-- CreateIndex
CREATE INDEX "WorkoutSchedule_activeDate_idx" ON "WorkoutSchedule"("activeDate");

-- CreateIndex
CREATE INDEX "WorkoutFeedback_workoutId_createdAt_idx" ON "WorkoutFeedback"("workoutId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkoutFeedback_workoutScheduleId_idx" ON "WorkoutFeedback"("workoutScheduleId");

-- AddForeignKey
ALTER TABLE "WorkoutSchedule" ADD CONSTRAINT "WorkoutSchedule_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutFeedback" ADD CONSTRAINT "WorkoutFeedback_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutFeedback" ADD CONSTRAINT "WorkoutFeedback_workoutScheduleId_fkey" FOREIGN KEY ("workoutScheduleId") REFERENCES "WorkoutSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

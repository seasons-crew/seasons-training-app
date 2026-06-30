export type SportCategory = "snow" | "earth" | "water" | "general";

export type WorkoutStatus = "draft" | "published" | "archived";

export type StepAdvanceMode = "video_end" | "timer" | "manual";

export type TimerStartMode = "auto" | "tap";

export type MediaAsset = {
  id: string;
  title: string;
  durationSeconds: number;
  thumbnailUrl: string;
  playbackUrl: string;
  muxPlaybackId?: string;
  muxAssetId?: string;
  muxUploadId?: string;
  status?: string;
  sourceDriveUrl?: string;
  tags: string[];
};

export type WorkoutStep = {
  id: string;
  title: string;
  mediaAssetId: string;
  advanceMode: StepAdvanceMode;
  timerStartMode?: TimerStartMode;
  durationSeconds?: number;
  manualButtonLabel?: string;
};

export type Workout = {
  id: string;
  title: string;
  sport: SportCategory;
  activeDate: string;
  scheduledDates: string[];
  status: WorkoutStatus;
  steps: WorkoutStep[];
  updatedAt: string;
  feedbackSummary?: WorkoutFeedbackSummary;
};

export type HydratedWorkoutStep = WorkoutStep & {
  media: MediaAsset;
};

export type HydratedWorkout = Omit<Workout, "steps"> & {
  steps: HydratedWorkoutStep[];
  feedback: WorkoutFeedback[];
};

export type WorkoutFeedback = {
  id: string;
  workoutId: string;
  workoutScheduleId?: string;
  rating: number;
  name: string;
  comment?: string;
  createdAt: string;
};

export type WorkoutFeedbackSummary = {
  averageRating: number | null;
  responseCount: number;
  recent: WorkoutFeedback[];
};

import { getTodayInLosAngeles } from "./date";
import type { HydratedWorkout, MediaAsset, Workout } from "./types";

const today = getTodayInLosAngeles();

export const mediaAssets: MediaAsset[] = [
  {
    id: "mobility-flow",
    title: "Mobility Flow",
    durationSeconds: 18,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=80",
    playbackUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    tags: ["warmup", "mobility", "general"],
  },
  {
    id: "single-leg-balance",
    title: "Single Leg Balance",
    durationSeconds: 12,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    playbackUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    tags: ["balance", "snow", "earth"],
  },
  {
    id: "rotational-power",
    title: "Rotational Power",
    durationSeconds: 15,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    playbackUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    tags: ["strength", "water", "power"],
  },
];

export const workouts: Workout[] = [
  {
    id: "snow-today",
    title: "Snow Legs: Control Day",
    sport: "snow",
    activeDate: today,
    scheduledDates: [today],
    status: "published",
    feedbackSummary: {
      averageRating: null,
      responseCount: 0,
      recent: [],
    },
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        title: "Wake Up the Hips",
        mediaAssetId: "mobility-flow",
        advanceMode: "video_end",
      },
      {
        id: "step-2",
        title: "Balance Hold",
        mediaAssetId: "single-leg-balance",
        advanceMode: "timer",
        timerStartMode: "tap",
        durationSeconds: 25,
      },
      {
        id: "step-3",
        title: "Finish Strong",
        mediaAssetId: "rotational-power",
        advanceMode: "manual",
        manualButtonLabel: "Done with this set",
      },
    ],
  },
  {
    id: "earth-today",
    title: "Earth Core: Trail Ready",
    sport: "earth",
    activeDate: today,
    scheduledDates: [today],
    status: "published",
    feedbackSummary: {
      averageRating: null,
      responseCount: 0,
      recent: [],
    },
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        title: "Mobility Primer",
        mediaAssetId: "mobility-flow",
        advanceMode: "timer",
        timerStartMode: "auto",
        durationSeconds: 20,
      },
      {
        id: "step-2",
        title: "Rotational Control",
        mediaAssetId: "rotational-power",
        advanceMode: "manual",
        manualButtonLabel: "Next move",
      },
    ],
  },
  {
    id: "water-tomorrow",
    title: "Water Shoulders: Paddle Prep",
    sport: "water",
    activeDate: "2999-01-01",
    scheduledDates: ["2999-01-01"],
    status: "published",
    feedbackSummary: {
      averageRating: null,
      responseCount: 0,
      recent: [],
    },
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        title: "Open the Chest",
        mediaAssetId: "mobility-flow",
        advanceMode: "video_end",
      },
    ],
  },
  {
    id: "expired-demo",
    title: "Expired Demo",
    sport: "general",
    activeDate: "2020-01-01",
    scheduledDates: ["2020-01-01"],
    status: "published",
    feedbackSummary: {
      averageRating: null,
      responseCount: 0,
      recent: [],
    },
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        title: "Old Work",
        mediaAssetId: "mobility-flow",
        advanceMode: "video_end",
      },
    ],
  },
];

export function getWorkout(id: string): HydratedWorkout | undefined {
  const workout = workouts.find((item) => item.id === id);

  if (!workout) {
    return undefined;
  }

  return {
    ...workout,
    feedback: [],
    steps: workout.steps.map((step) => {
      const media = mediaAssets.find((asset) => asset.id === step.mediaAssetId);

      if (!media) {
        throw new Error(`Missing media asset: ${step.mediaAssetId}`);
      }

      return { ...step, media };
    }),
  };
}

export function getTodayWorkoutId() {
  return workouts.find(
    (workout) => workout.activeDate === today && workout.status === "published",
  )?.id;
}

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { Check, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { HydratedWorkout } from "@/lib/types";

type SavedProgress = {
  stepIndex: number;
  videoTime: number;
  timerRemaining: number | null;
  timerRunning: boolean;
};

type Props = {
  feedbackAction: (formData: FormData) => Promise<void>;
  workout: HydratedWorkout;
};

export function WorkoutPlayer({ feedbackAction, workout }: Props) {
  const storageKey = `seasons-progress:${workout.id}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const step = workout.steps[stepIndex];

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      const progress = JSON.parse(saved) as SavedProgress;
      setStepIndex(Math.min(progress.stepIndex, workout.steps.length - 1));
      setTimerRemaining(progress.timerRemaining);
      setTimerRunning(progress.timerRemaining !== null || progress.timerRunning);

      window.requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = progress.videoTime || 0;
        }
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey, workout.steps.length]);

  useEffect(() => {
    const video = videoRef.current;
    const duration = step.durationSeconds ?? null;

    setIsComplete(false);
    setTimerRemaining(step.advanceMode === "timer" ? duration : null);
    setTimerRunning(step.advanceMode === "timer");

    if (video) {
      video.currentTime = 0;
      video.loop = step.advanceMode !== "video_end";
      void video.play().catch(() => undefined);
    }
  }, [step.id, step.advanceMode, step.durationSeconds, step.timerStartMode]);

  useEffect(() => {
    if (!step || isComplete) {
      return;
    }

    const interval = window.setInterval(() => {
      const videoTime = videoRef.current?.currentTime ?? 0;
      const payload: SavedProgress = {
        stepIndex,
        videoTime,
        timerRemaining,
        timerRunning,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 800);

    return () => window.clearInterval(interval);
  }, [isComplete, step, stepIndex, storageKey, timerRemaining, timerRunning]);

  useEffect(() => {
    if (!timerRunning || timerRemaining === null) {
      return;
    }

    if (timerRemaining <= 0) {
      goNext();
      return;
    }

    const timeout = window.setTimeout(() => {
      setTimerRemaining((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [timerRemaining, timerRunning]);

  const percent = useMemo(() => {
    if (
      step.advanceMode !== "timer" ||
      !step.durationSeconds ||
      timerRemaining === null
    ) {
      return 0;
    }

    return ((step.durationSeconds - timerRemaining) / step.durationSeconds) * 100;
  }, [step.advanceMode, step.durationSeconds, timerRemaining]);

  function goNext() {
    if (stepIndex >= workout.steps.length - 1) {
      setIsComplete(true);
      window.localStorage.removeItem(storageKey);
      videoRef.current?.pause();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function submitFeedback(formData: FormData) {
    startTransition(async () => {
      await feedbackAction(formData);
      setFeedbackSubmitted(true);
    });
  }

  if (isComplete) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-sm">
          <p className="text-sm uppercase tracking-[0.22em] text-white/45">
            Seasons
          </p>
          <h1 className="mt-4 text-4xl font-semibold">Workout complete</h1>
          {feedbackSubmitted ? (
            <div className="mt-8 rounded-md bg-white/10 p-4 text-center">
              <Check className="mx-auto" size={24} />
              <p className="mt-3 text-sm font-semibold">Thanks for the feedback.</p>
            </div>
          ) : (
            <form action={submitFeedback} className="mt-8 grid gap-4 rounded-md bg-white p-4 text-black">
              <input type="hidden" name="workoutId" value={workout.id} />
              <fieldset className="grid gap-2">
                <legend className="text-sm font-semibold">Rate this workout</legend>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="cursor-pointer">
                      <input
                        className="peer sr-only"
                        name="rating"
                        required
                        type="radio"
                        value={rating}
                      />
                      <span className="flex h-11 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition peer-checked:border-stone-950 peer-checked:bg-stone-950 peer-checked:text-white">
                        <Star size={18} />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="grid gap-1 text-sm font-semibold">
                Name
                <input
                  name="name"
                  required
                  className="h-11 rounded-md border border-stone-300 px-3 text-base outline-none focus:border-stone-950"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Short feedback
                <textarea
                  name="comment"
                  rows={3}
                  className="rounded-md border border-stone-300 px-3 py-2 text-base outline-none focus:border-stone-950"
                />
              </label>
              <button
                disabled={isPending}
                className="h-11 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isPending ? "Sending" : "Submit feedback"}
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        key={step.id}
        src={step.media.playbackUrl}
        playsInline
        autoPlay
        loop={step.advanceMode !== "video_end"}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        onEnded={() => {
          if (step.advanceMode === "video_end" || step.advanceMode === "manual") {
            goNext();
          }
        }}
      />
      {step.advanceMode === "timer" ? (
        <div className="absolute inset-x-0 bottom-0 h-52 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.72))]" />
      ) : null}

      <section className="relative z-10 flex min-h-dvh flex-col justify-end px-5 py-5 sm:px-8">
        <div className="pb-4">
          {step.advanceMode === "timer" ? (
            <div className="rounded-md bg-black/35 p-4 backdrop-blur">
              <p className="text-5xl font-semibold tabular-nums">
                {timerRemaining ?? step.durationSeconds}s
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

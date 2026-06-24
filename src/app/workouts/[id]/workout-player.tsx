/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HydratedWorkout } from "@/lib/types";

type SavedProgress = {
  stepIndex: number;
  videoTime: number;
  timerRemaining: number | null;
  timerRunning: boolean;
};

type Props = {
  workout: HydratedWorkout;
};

export function WorkoutPlayer({ workout }: Props) {
  const storageKey = `seasons-progress:${workout.id}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const step = workout.steps[stepIndex];
  const progressLabel = `${Math.min(stepIndex + 1, workout.steps.length)} / ${workout.steps.length}`;

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      const progress = JSON.parse(saved) as SavedProgress;
      setStepIndex(Math.min(progress.stepIndex, workout.steps.length - 1));
      setTimerRemaining(progress.timerRemaining);
      setTimerRunning(progress.timerRunning);

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
    setTimerRunning(
      step.advanceMode === "timer" && (step.timerStartMode ?? "auto") === "auto",
    );

    if (video) {
      video.currentTime = 0;
      video.loop = step.advanceMode !== "video_end";
      void video.play().catch(() => setIsPaused(true));
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
    if (!timerRunning || timerRemaining === null || isPaused) {
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
  }, [isPaused, timerRemaining, timerRunning]);

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

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function togglePause() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play();
      setIsPaused(false);
      return;
    }

    video.pause();
    setIsPaused(true);
  }

  function restartWorkout() {
    window.localStorage.removeItem(storageKey);
    setStepIndex(0);
    setIsComplete(false);
  }

  if (isComplete) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm uppercase tracking-[0.22em] text-white/45">
            Seasons
          </p>
          <h1 className="mt-4 text-4xl font-semibold">Workout complete</h1>
          <button
            onClick={restartWorkout}
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-black"
          >
            <RotateCcw size={18} />
            Replay
          </button>
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
        className="absolute inset-0 h-full w-full object-cover"
        onEnded={() => {
          if (step.advanceMode === "video_end") {
            goNext();
          }
        }}
        onPause={() => setIsPaused(true)}
        onPlay={() => setIsPaused(false)}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.58),rgba(0,0,0,0.08)_38%,rgba(0,0,0,0.72))]" />

      <section className="relative z-10 flex min-h-dvh flex-col justify-between px-5 py-5 sm:px-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/55">
              {workout.sport}
            </p>
            <h1 className="mt-1 max-w-[18rem] text-2xl font-semibold leading-tight">
              {step.title}
            </h1>
          </div>
          <div className="rounded-md bg-white/12 px-3 py-2 text-sm font-semibold backdrop-blur">
            {progressLabel}
          </div>
        </header>

        <div className="space-y-4 pb-4">
          {step.advanceMode === "timer" ? (
            <div className="rounded-md bg-white/12 p-4 backdrop-blur">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Timer
                  </p>
                  <p className="mt-1 text-5xl font-semibold tabular-nums">
                    {timerRemaining ?? step.durationSeconds}s
                  </p>
                </div>
                {!timerRunning ? (
                  <button
                    onClick={() => setTimerRunning(true)}
                    className="inline-flex h-12 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-black"
                  >
                    Start
                  </button>
                ) : null}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ) : null}

          {step.advanceMode === "manual" ? (
            <button
              onClick={goNext}
              className="flex h-14 w-full items-center justify-center rounded-md bg-white text-base font-semibold text-black"
            >
              {step.manualButtonLabel || "Next"}
            </button>
          ) : null}

          <div className="grid grid-cols-5 gap-2">
            <button
              aria-label="Previous step"
              onClick={goBack}
              className="flex h-12 items-center justify-center rounded-md bg-white/12 backdrop-blur disabled:opacity-35"
              disabled={stepIndex === 0}
            >
              <SkipBack size={20} />
            </button>
            <button
              aria-label="Pause or play"
              onClick={togglePause}
              className="col-span-3 flex h-12 items-center justify-center rounded-md bg-white/18 backdrop-blur"
            >
              {isPaused ? <Play size={22} /> : <Pause size={22} />}
            </button>
            <button
              aria-label="Skip step"
              onClick={goNext}
              className="flex h-12 items-center justify-center rounded-md bg-white/12 backdrop-blur"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const APP_TIME_ZONE = "America/Los_Angeles";

export function getTodayInLosAngeles(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getWorkoutAvailability(activeDate: string, sneak: boolean) {
  const today = getTodayInLosAngeles();

  if (activeDate < today) {
    return "expired" as const;
  }

  if (activeDate > today && !sneak) {
    return "early" as const;
  }

  return "available" as const;
}

export const appTimeZone = APP_TIME_ZONE;

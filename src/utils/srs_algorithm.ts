/**
 * SuperMemo-2 (SM-2) Algorithm Implementation
 */

export interface SRSStats {
  interval: number;    // Interval in days
  repetition: number;  // Number of consecutive successful reviews
  efactor: number;     // Easiness Factor (starts at 2.5)
  dueDate: number;     // Timestamp for next review
}

/**
 * Helper to calculate the next due date (timestamp)
 * This was the missing export causing your error.
 */
export function getNextDueDate(intervalInDays: number): number {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return Date.now() + (intervalInDays * ONE_DAY_MS);
}

/**
 * Helper to get initial stats for a new word
 */
export function getInitialStats(): SRSStats {
  return {
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    dueDate: Date.now()
  };
}

/**
 * Calculates the new SRS stats based on user rating.
 * @param quality 0-5 rating (5=Easy, 3=Hard, 1=Forgot)
 */
export function calculateReview(currentStats: SRSStats, quality: number): SRSStats {
  let { interval, repetition, efactor } = currentStats;

  // 1. Update Repetition Count & Interval
  if (quality >= 3) {
    // Correct response
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * efactor);
    }
    repetition += 1;
  } else {
    // Incorrect response: Reset progress
    repetition = 0;
    interval = 1;
  }

  // 2. Update Easiness Factor (E-Factor)
  // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // EF cannot go below 1.3
  const newEfactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  efactor = Math.max(newEfactor, 1.3);

  return {
    interval,
    repetition,
    efactor,
    dueDate: 0 // Placeholder, handled by getNextDueDate in App.tsx
  };
}
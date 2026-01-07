/**
 * Format a duration in milliseconds to a human-readable string.
 * Uses appropriate units (µs, ms, s) based on the magnitude.
 */
export function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format a duration for chart tooltip display.
 * Always includes the unit for clarity.
 */
export function formatDurationForChart(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

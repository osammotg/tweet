// duration.ts - Budget management for script timing

export type EnergyMode = "HYPER" | "NORMAL";

export function wordCount(s: string): number {
  return (s.trim().match(/\b[\w''-]+\b/g) ?? []).length;
}

export function computeBudgetSec(targetSec: number, mode: EnergyMode) {
  const wps = mode === "HYPER" ? 3.0 : 2.4;
  return { wps, maxWords: Math.max(18, Math.round(targetSec * wps)) };
}

export function totalWords(lines: string[]): number {
  return lines.reduce((a, l) => a + wordCount(l), 0);
}


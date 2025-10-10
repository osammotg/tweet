import crypto from "node:crypto";
import type { RoastInput } from "./types";

const wait = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export function hashInput(input: RoastInput): string {
  const payload = {
    startupName: input.startupName.trim(),
    tweetText: input.tweetText.trim(),
    angle: input.angle ?? null
  };

  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  attempts = 3,
  baseMs = 500
): Promise<T> {
  let error: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (err) {
      error = err;
      if (attempt === attempts) {
        break;
      }

      const delay = baseMs * 2 ** (attempt - 1);
      await wait(delay);
    }
  }

  throw error;
}

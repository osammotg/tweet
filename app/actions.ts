'use server';

import { makeRoastScript } from "@/lib/prompt";
import { readRoastMetadata, saveMp4AndGetUrl, writeRoastMetadata } from "@/lib/storage";
import { generateEinsteinVideo } from "@/lib/video";
import { hashInput, withRetry } from "@/lib/util";
import type { RoastInput, RoastOutput } from "@/lib/types";

function assertField(value: string | undefined, field: string): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required field: ${field}`);
  }

  return value.trim();
}

function normalizeInput(input: RoastInput): RoastInput {
  return {
    ...input,
    tweetId: assertField(input.tweetId, "tweetId"),
    startupName: assertField(input.startupName, "startupName"),
    tweetText: assertField(input.tweetText, "tweetText"),
    authorHandle: input.authorHandle?.trim() || undefined,
    website: input.website?.trim() || undefined,
    angle: input.angle?.trim() || undefined
  };
}

export async function buildRoastVideoAction(rawInput: RoastInput): Promise<RoastOutput> {
  const input = normalizeInput(rawInput);
  const checksum = hashInput(input);
  const seedHex = checksum.slice(0, 8);
  const seedValue = Number.parseInt(seedHex, 16);
  const seed = Number.isSafeInteger(seedValue) ? seedValue : 0;

  const cached = await readRoastMetadata(checksum);

  if (cached) {
    return {
      ok: true,
      tweetId: input.tweetId,
      script: cached.script,
      caption: cached.caption,
      videoUrl: cached.videoUrl,
      checksum,
      durationSec: cached.durationSec
    };
  }

  const { script, caption } = await withRetry(
    () => makeRoastScript(input),
    3,
    600
  );

  const video = await withRetry(
    () => generateEinsteinVideo({ script, seed }),
    2,
    800
  );

  const videoUrl = await saveMp4AndGetUrl(video.mp4, checksum);

  await writeRoastMetadata(checksum, {
    script,
    caption,
    durationSec: video.durationSec,
    videoUrl
  });

  return {
    ok: true,
    tweetId: input.tweetId,
    script,
    caption,
    videoUrl,
    checksum,
    durationSec: video.durationSec
  };
}

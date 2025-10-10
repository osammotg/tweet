'use server';

import { buildScriptFromTweet } from "@/lib/prompt";
import { readRoastMetadata, saveMp4AndGetUrl, writeRoastMetadata, clearAllCache } from "@/lib/storage";
import { generateEinsteinVideo } from "@/lib/video";
import { hashInput, withRetry } from "@/lib/util";
import { srtFromLines } from "@/lib/srt";
import { buildShotsAndSoraPrompt } from "@/lib/shots";
import type { RoastInput, RoastOutput } from "@/lib/types";
import { postTweet } from "@/lib/x";

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
    angle: input.angle?.trim() || undefined,
    targetSec: input.targetSec ?? 12,
    energy: input.energy ?? "HYPER"
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
    const script_lines = cached.script.split('\n').filter(l => l.trim());
    return {
      ok: true,
      tweetId: input.tweetId,
      script: cached.script,
      script_lines,
      caption: cached.caption,
      videoUrl: cached.videoUrl,
      checksum,
      durationSec: cached.durationSec,
      wps: input.energy === "HYPER" ? 3.0 : 2.4,
      maxWords: cached.script.split(/\s+/).length,
      srt: cached.srt,
      sora_prompt: cached.sora_prompt,
      fromCache: true
    };
  }

  // Build script with proper budgeting
  const { script_lines, caption, wps, maxWords, targetSec } = await withRetry(
    () => buildScriptFromTweet(input),
    3,
    600
  );

  const script = script_lines.join('\n');

  // Generate SRT
  const srt = srtFromLines(script_lines, wps);

  // Generate shot plan (optional, for future Sora integration)
  let sora_prompt: string | undefined;
  try {
    const shotPlan = await buildShotsAndSoraPrompt(script_lines, "9:16", targetSec, input.energy ?? "HYPER");
    sora_prompt = shotPlan.sora_prompt;
  } catch {
    // Shot planning is optional
    sora_prompt = undefined;
  }


  await postTweet('test', "/Users/bg/source/tweet/lib/assets/demo.mp4")
  return;
  // Generate video with Sora (or demo fallback)
  const video = await withRetry(
    () => generateEinsteinVideo({ 
      script, 
      seed,
      soraPrompt: sora_prompt,
      durationSec: targetSec,
      aspect: "9:16"
    }),
    2,
    800
  );

  const videoUrl = await saveMp4AndGetUrl(video.mp4, checksum);

  await writeRoastMetadata(checksum, {
    script,
    caption,
    durationSec: targetSec,
    videoUrl,
    srt,
    sora_prompt
  });

  return {
    ok: true,
    tweetId: input.tweetId,
    script,
    script_lines,
    caption,
    videoUrl,
    checksum,
    durationSec: targetSec,
    wps,
    maxWords,
    srt,
    sora_prompt,
    fromCache: false
  };
}

export async function clearCacheAction(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const count = await clearAllCache();
    return { success: true, count };
  } catch (error) {
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

import type { EnergyMode } from "./duration";

export type RoastInput = {
  tweetId: string;
  authorHandle?: string;
  startupName: string;
  tweetText: string;
  website?: string;
  angle?: string;
  targetSec?: number;
  energy?: EnergyMode;
};

export type RoastOutput = {
  ok: true;
  tweetId: string;
  script: string;
  script_lines: string[];
  caption: string;
  videoUrl: string;
  checksum: string;
  durationSec: number;
  wps: number;
  maxWords: number;
  srt?: string;
  sora_prompt?: string;
  fromCache?: boolean;
};

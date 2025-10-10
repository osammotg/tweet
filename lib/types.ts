export type RoastInput = {
  tweetId: string;
  authorHandle?: string;
  startupName: string;
  tweetText: string;
  website?: string;
  angle?: string;
};

export type RoastOutput = {
  ok: true;
  tweetId: string;
  script: string;
  caption: string;
  videoUrl: string;
  checksum: string;
  durationSec: number;
};

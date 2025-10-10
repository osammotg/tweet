import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type VideoRequest = {
  script: string;
  seed?: number;
};

type VideoResponse = {
  mp4: Buffer;
  durationSec: number;
  checksum: string;
};

const DEMO_MP4_PATH = path.join(process.cwd(), "lib/assets/demo.mp4");

let cachedDemo: Buffer | null = null;

function loadDemoVideo(): Buffer {
  if (cachedDemo) {
    return cachedDemo;
  }

  if (!fs.existsSync(DEMO_MP4_PATH)) {
    throw new Error(`Demo MP4 missing at ${DEMO_MP4_PATH}`);
  }

  cachedDemo = fs.readFileSync(DEMO_MP4_PATH);
  return cachedDemo;
}

function computeChecksum(script: string, seed?: number): string {
  return crypto
    .createHash("sha256")
    .update(script)
    .update(seed !== undefined ? String(seed) : "")
    .digest("hex");
}

export async function generateEinsteinVideo(request: VideoRequest): Promise<VideoResponse> {
  const checksum = computeChecksum(request.script, request.seed);

  // TODO: Replace with Sora or preferred video generation API; expects mp4 bytes in response.
  const demoBytes = Buffer.from(loadDemoVideo());

  return {
    mp4: demoBytes,
    durationSec: 12,
    checksum
  };
}

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

type VideoRequest = {
  script: string;
  seed?: number;
  soraPrompt?: string;
  durationSec?: number;
  aspect?: "9:16" | "16:9";
};

type VideoResponse = {
  mp4: Buffer;
  durationSec: number;
  checksum: string;
};

const DEMO_MP4_PATH = path.join(process.cwd(), "lib/assets/demo.mp4");
const USE_SORA = process.env.USE_SORA === "true";

let cachedDemo: Buffer | null = null;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

function getSizeFromAspect(aspect: "9:16" | "16:9" = "9:16"): string {
  // Sora Turbo supports: 1920x1080, 1080x1920
  return aspect === "16:9" ? "1920x1080" : "1080x1920";
}

async function generateWithSora(request: VideoRequest): Promise<Buffer> {
  const prompt = request.soraPrompt || buildDefaultSoraPrompt(request.script);
  
  console.log("🎬 Generating video with Sora Turbo...");
  console.log("Prompt:", prompt);

  try {
    // Call Sora API using the videos endpoint
    const response = await client.videos.generate({
      model: "sora-turbo",
      prompt: prompt,
      size: getSizeFromAspect(request.aspect),
      // Note: Sora determines duration based on content, we suggest but don't guarantee
    });

    // Download the video from the URL
    const videoUrl = response.url;
    console.log("✅ Sora video generated:", videoUrl);

    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("❌ Sora generation failed:", error);
    throw error;
  }
}

function buildDefaultSoraPrompt(script: string): string {
  return `Create a high-energy vertical video (9:16) featuring an Einstein-like character in a chalkboard laboratory setting. The presenter energetically delivers this roast script: "${script}". 

Style: Meme-friendly, dynamic camera movements with quick push-ins, chalk equations animating on the board, bright lighting, handheld documentary feel with subtle film grain. The presenter speaks with enthusiasm and comedic timing, using gestures to emphasize key points. Include quick cuts between medium shots and close-ups of the chalkboard. No logos, clean audio, professional but playful tone.`;
}

export async function generateEinsteinVideo(request: VideoRequest): Promise<VideoResponse> {
  const checksum = computeChecksum(request.script, request.seed);
  const durationSec = request.durationSec ?? 12;

  // Try Sora if enabled and API key is available
  if (USE_SORA && process.env.OPENAI_API_KEY) {
    try {
      const mp4 = await generateWithSora(request);
      
      return {
        mp4,
        durationSec,
        checksum
      };
    } catch (error) {
      console.error("Sora generation failed, falling back to demo:", error);
      // Fall through to demo video
    }
  }

  // Fallback to demo video
  console.log("📹 Using demo video (set USE_SORA=true in .env.local to enable Sora)");
  const demoBytes = Buffer.from(loadDemoVideo());

  return {
    mp4: demoBytes,
    durationSec,
    checksum
  };
}

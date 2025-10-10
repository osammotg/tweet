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
  
  console.log("🎬 Generating video with Sora 2...");
  console.log("Prompt:", prompt);

  // Sora API only supports 4, 8, or 12 seconds
  const allowedDurations = [4, 8, 12];
  const durationSec = allowedDurations.includes(request.durationSec || 12) 
    ? request.durationSec || 12 
    : 12; // Default to 12 if not supported

  console.log(`Using duration: ${durationSec} seconds (Sora API supports: 4, 8, 12)`);

  try {
    // Use the official Sora API endpoint from documentation
    const response = await fetch("https://api.openai.com/v1/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sora-2", // Use sora-2 for speed, or sora-2-pro for quality
        prompt: prompt,
        size: getSizeFromAspect(request.aspect),
        seconds: String(durationSec), // API expects string, not integer
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Sora API error (${response.status}): ${errorText}`);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Sora API access denied (${response.status}): ${errorText}. You may need to request access to the Sora API preview.`);
      }
      
      if (response.status === 400) {
        throw new Error(`Sora API parameter error (${response.status}): ${errorText}`);
      }
      
      throw new Error(`Sora API error (${response.status}): ${errorText}`);
    }

    const videoJob = await response.json() as {
      id: string;
      object: string;
      created_at: number;
      status: string;
      model: string;
      progress?: number;
      seconds: string;
      size: string;
    };

    console.log("✅ Sora video job created:", videoJob);

    // Poll for completion
    let video = videoJob;
    const maxAttempts = 30; // 5 minutes max (10s intervals)
    let attempts = 0;

    while ((video.status === "queued" || video.status === "in_progress") && attempts < maxAttempts) {
      console.log(`⏳ Video status: ${video.status} (${video.progress || 0}%)`);
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(`https://api.openai.com/v1/videos/${video.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check video status: ${statusResponse.statusText}`);
      }

      video = await statusResponse.json() as typeof videoJob;
      attempts++;
    }

    if (video.status !== "completed") {
      throw new Error(`Video generation failed or timed out. Final status: ${video.status}`);
    }

    console.log("✅ Sora video completed, downloading...");

    // Download the completed video
    const downloadResponse = await fetch(`https://api.openai.com/v1/videos/${video.id}/content`, {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download video: ${downloadResponse.statusText}`);
    }

    const arrayBuffer = await downloadResponse.arrayBuffer();
    console.log("✅ Sora video downloaded successfully");
    
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

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
    // Try multiple possible Sora API endpoints
    const possibleEndpoints = [
      "https://api.openai.com/v1/video/generations",
      "https://api.openai.com/v1/sora/generations", 
      "https://api.openai.com/v1/generations"
    ];

    let lastError: Error | null = null;

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "sora-turbo",
            prompt: prompt,
            size: getSizeFromAspect(request.aspect),
            duration: request.durationSec,
          }),
        });

        if (response.status === 404) {
          console.log(`Endpoint ${endpoint} not found, trying next...`);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`Endpoint ${endpoint} error (${response.status}): ${errorText}`);
          
          // If it's a 401/403, the endpoint exists but we don't have access
          if (response.status === 401 || response.status === 403) {
            throw new Error(`Sora API access denied (${response.status}): ${errorText}. Sora API may require special access or be in limited preview.`);
          }
          
          // If it's a 400, the endpoint exists but parameters are wrong
          if (response.status === 400) {
            throw new Error(`Sora API parameter error (${response.status}): ${errorText}`);
          }
          
          continue; // Try next endpoint
        }

        const data = await response.json() as {
          id: string;
          status: string;
          data?: Array<{ url: string }>;
          url?: string;
        };

        console.log("✅ Sora API response:", data);

        // Handle different response formats
        let videoUrl: string | undefined;
        
        if (data.url) {
          videoUrl = data.url;
        } else if (data.status === "completed" && data.data && data.data[0]) {
          videoUrl = data.data[0].url;
        } else {
          throw new Error(`Video generation incomplete. Status: ${data.status}`);
        }

        console.log("✅ Sora video generated:", videoUrl);

        // Download the video from the URL
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const arrayBuffer = await videoResponse.arrayBuffer();
        return Buffer.from(arrayBuffer);
        
      } catch (error) {
        lastError = error as Error;
        console.log(`Endpoint ${endpoint} failed:`, error);
        continue;
      }
    }

    // If all endpoints failed
    throw lastError || new Error("All Sora API endpoints failed. Sora API may not be available yet.");
    
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

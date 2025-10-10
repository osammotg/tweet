// shots.ts - Shot planning and Sora prompt generation

import OpenAI from "openai";
import type { EnergyMode } from "./duration";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

type Shot = {
  dur: number;
  visual: string;
  action: string;
  onscreen_text: string;
  sfx: string;
};

type ShotPlan = {
  shots: Shot[];
  sora_prompt: string;
};

const SHOT_SYSTEM_PROMPT = `You convert a short script into a 4–6 shot plan for a meme-style vertical video
with an Einstein-like presenter in a chalkboard lab. No real logos/faces.
Output JSON: {
  "shots": [
    { "dur": number, "visual": string, "action": string, "onscreen_text": string, "sfx": string }
  ],
  "sora_prompt": string
}`;

export async function buildShotsAndSoraPrompt(
  script_lines: string[],
  aspect: "9:16" | "16:9",
  targetSec: number,
  energy: EnergyMode
): Promise<ShotPlan> {
  const userPrompt = `Script lines:
${JSON.stringify(script_lines)}

Energy: ${energy}
Aspect: ${aspect}
Total duration target: ${targetSec}s

Rules:
- Allocate durations that sum to ${targetSec}s.
- Dynamic cuts, quick push-ins, chalk scribbles appearing, meme captions.
- Onscreen text = ≤6 words, big, uppercased, for each beat.
- "sora_prompt" must be a single coherent description including camera, setting,
  lighting, motion, and that the actor speaks the script with energetic delivery.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 800,
    messages: [
      { role: "system", content: SHOT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "shot_plan",
        schema: {
          type: "object",
          required: ["shots", "sora_prompt"],
          properties: {
            shots: {
              type: "array",
              items: {
                type: "object",
                required: ["dur", "visual", "action", "onscreen_text", "sfx"],
                properties: {
                  dur: { type: "number" },
                  visual: { type: "string" },
                  action: { type: "string" },
                  onscreen_text: { type: "string" },
                  sfx: { type: "string" }
                }
              }
            },
            sora_prompt: { type: "string" }
          },
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as ShotPlan;
  
  return parsed;
}


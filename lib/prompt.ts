import OpenAI from "openai";
import type { RoastInput } from "./types";
import { computeBudgetSec, totalWords, type EnergyMode } from "./duration";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SCRIPT_SYSTEM_PROMPT = `You write a 3–5 beat, Einstein-parody roast script. High energy, witty, SFW.
Roast the idea/claims, not people. No slurs, no accusations, no legal/medical claims.
Output strict JSON: {
  "script_lines": string[],   // each line = one sentence, fast delivery
  "caption": string           // ≤ 160 chars, tweet-ready
}`;

const SHRINK_SYSTEM_PROMPT = `Compress without losing joke density. Keep voice and beats. Output same JSON.`;

type ScriptResult = {
  script_lines: string[];
  caption: string;
};

function buildScriptUserPrompt(
  input: RoastInput,
  targetSec: number,
  energy: EnergyMode,
  wps: number,
  maxWords: number
): string {
  const lines = [
    `Tweet content:`,
    input.tweetText,
    "",
    `Startup name: ${input.startupName}`,
    `Detected angle: ${input.angle || "positioning"}`,
    `Energy mode: ${energy}`,
    `Target duration (seconds): ${targetSec}`,
    `Words-per-second: ${wps}`,
    `Max words allowed: ${maxWords}`,
    "",
    `Rules:`,
    `- Total words across all lines ≤ ${maxWords}.`,
    `- Structure: Hook, Twist, Punchline, Tag, Button. Each line punchy (8–12 words).`,
    `- Einstein voice: curious, teasing, high tempo. No personal attacks.`,
    `- Avoid: "revolutionary," "for everyone," "democratizing" unless mocking.`,
    `Return only the JSON, no commentary.`
  ];

  if (input.authorHandle) {
    lines.splice(4, 0, `Author Handle: ${input.authorHandle}`);
  }

  if (input.website) {
    lines.splice(input.authorHandle ? 5 : 4, 0, `Website: ${input.website}`);
  }

  return lines.join("\n");
}

function safeParse(text: string): ScriptResult {
  try {
    const parsed = JSON.parse(text) as Partial<ScriptResult>;
    if (
      parsed &&
      Array.isArray(parsed.script_lines) &&
      typeof parsed.caption === "string"
    ) {
      return {
        script_lines: parsed.script_lines,
        caption: parsed.caption
      };
    }
  } catch {
    // Fall through to fallback
  }

  return {
    script_lines: ["Einstein reacts to your startup with physics-based wit!"],
    caption: "Einstein reacts."
  };
}

export async function buildScriptFromTweet(input: RoastInput): Promise<{
  script_lines: string[];
  caption: string;
  wps: number;
  maxWords: number;
  targetSec: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const targetSec = input.targetSec ?? 12;
  const energy = input.energy ?? "HYPER";
  const { wps, maxWords } = computeBudgetSec(targetSec, energy);

  const userPrompt = buildScriptUserPrompt(input, targetSec, energy, wps, maxWords);

  // First pass
  const firstResponse = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    max_tokens: 600,
    messages: [
      { role: "system", content: SCRIPT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "roast_script",
        schema: {
          type: "object",
          required: ["script_lines", "caption"],
          properties: {
            script_lines: {
              type: "array",
              items: { type: "string" }
            },
            caption: {
              type: "string",
              maxLength: 160
            }
          },
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  const firstContent = firstResponse.choices[0]?.message?.content ?? "{}";
  const firstResult = safeParse(firstContent);

  // Check if within budget
  if (totalWords(firstResult.script_lines) <= maxWords) {
    return { ...firstResult, wps, maxWords, targetSec };
  }

  // Shrink pass
  const shrinkUserPrompt = `Current script (JSON):
${JSON.stringify(firstResult)}

Max words: ${maxWords}
Rules: shorten lines; prefer punchy synonyms; merge beats rather than list them.`;

  const shrinkResponse = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      { role: "system", content: SHRINK_SYSTEM_PROMPT },
      { role: "user", content: shrinkUserPrompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "roast_script_shrunk",
        schema: {
          type: "object",
          required: ["script_lines", "caption"],
          properties: {
            script_lines: {
              type: "array",
              items: { type: "string" }
            },
            caption: {
              type: "string",
              maxLength: 160
            }
          },
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  const shrunkContent = shrinkResponse.choices[0]?.message?.content ?? "{}";
  const shrunkResult = safeParse(shrunkContent);

  return { ...shrunkResult, wps, maxWords, targetSec };
}

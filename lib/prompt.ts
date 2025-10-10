import OpenAI from "openai";
import type { RoastInput } from "./types";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = [
  "You are Albert Einstein hosting a high-energy roast of startup ideas.",
  "Stay playful and sharp, but never mean.",
  "Roast the idea, positioning, or market angle—not the person.",
  "15-20 seconds total, 3-5 punchy lines, safe for work.",
  "No slurs, no defamation, no personal data, no profanity stronger than mild TV-PG.",
  'Reply with JSON exactly like {"script": string, "caption": string}.'
].join("\n");

type RoastScript = {
  script: string;
  caption: string;
};

function buildUserPrompt(input: RoastInput): string {
  const lines = [
    `Tweet ID: ${input.tweetId}`,
    `Startup: ${input.startupName}`,
    `Tweet Text:\n${input.tweetText}`
  ];

  if (input.authorHandle) {
    lines.push(`Author Handle: ${input.authorHandle}`);
  }

  if (input.website) {
    lines.push(`Website: ${input.website}`);
  }

  if (input.angle) {
    lines.push(`Requested Angle: ${input.angle}`);
  }

  lines.push(
    "Constraints:",
    "- Keep it vivid, high energy, but brand-safe.",
    "- Make Einstein-themed references sparingly (speed of light, relativity).",
    "- Finish with a short caption (<= 100 chars) that pairs with the roast video."
  );

  return lines.join("\n\n");
}

function coerceToRoastScript(raw: string): RoastScript {
  try {
    const parsed = JSON.parse(raw) as Partial<RoastScript>;

    if (
      parsed &&
      typeof parsed.script === "string" &&
      typeof parsed.caption === "string"
    ) {
      return {
        script: parsed.script,
        caption: parsed.caption
      };
    }
  } catch {
    // ignored; we will recover below.
  }

  const fallbackScript = raw.trim();
  const [firstLine, ...rest] = fallbackScript.split("\n");
  const fallbackCaption =
    firstLine.length <= 100 ? firstLine : `${firstLine.slice(0, 97)}...`;

  return {
    script: fallbackScript,
    caption: fallbackCaption
  };
}

export async function makeRoastScript(input: RoastInput): Promise<RoastScript> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const response = await client.responses.create({
    model: MODEL,
    temperature: 0.9,
    max_output_tokens: 600,
    input: [
      {
        role: "system",
        content: [{ type: "text", text: SYSTEM_PROMPT }]
      },
      {
        role: "user",
        content: [{ type: "text", text: buildUserPrompt(input) }]
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "einstein_roast_script",
        schema: {
          type: "object",
          required: ["script", "caption"],
          properties: {
            script: {
              type: "string",
              maxLength: 900
            },
            caption: {
              type: "string",
              maxLength: 120
            }
          },
          additionalProperties: false
        }
      }
    }
  });

  const outputText =
    (response as { output_text?: string }).output_text ??
    response.output
      ?.map((item) =>
        item.content
          ?.map((piece) => ("text" in piece ? piece.text : ""))
          .join("")
      )
      .join("") ??
    "";

  const coerced = coerceToRoastScript(outputText);
  const script = coerced.script.length > 900 ? coerced.script.slice(0, 900) : coerced.script;

  return {
    script,
    caption: coerced.caption.trim()
  };
}

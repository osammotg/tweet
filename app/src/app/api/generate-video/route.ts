import { NextResponse } from "next/server";
import { setTimeout as sleep } from "node:timers/promises";
import OpenAI from "openai";
import { TwitterApi } from "twitter-api-v2";

export const runtime = "nodejs";

type GenerateVideoBody = {
  prompt?: string;
  tweetText?: string;
  durationSeconds?: number;
  resolution?: "480p" | "720p" | "1080p";
};

type SoraJobStatus = "queued" | "in_progress" | "completed" | "failed";

type SoraJob = {
  id: string;
  status: SoraJobStatus;
  progress?: number;
  error?: {
    message?: string;
  };
};

const RESOLUTION_TO_SIZE: Record<
  NonNullable<GenerateVideoBody["resolution"]>,
  string
> = {
  "480p": "854x480",
  "720p": "1280x720",
  "1080p": "1920x1080",
};

const SORA_POLL_INTERVAL_MS = 5_000;
const SORA_MAX_WAIT_MS = 10 * 60 * 1_000;
const TWEET_CHAR_LIMIT = 280;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateVideoBody;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt in request body." },
        { status: 422 },
      );
    }

    const {
      OPENAI_API_KEY,
      X_API_KEY,
      X_API_KEY_SECRET,
      X_ACCESS_TOKEN,
      X_ACCESS_TOKEN_SECRET,
    } = process.env;

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error: OPENAI_API_KEY is not set." },
        { status: 500 },
      );
    }

    const appKey = X_API_KEY;
    const appSecret = X_API_KEY_SECRET;
    const accessToken = X_ACCESS_TOKEN;
    const accessSecret = X_ACCESS_TOKEN_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
      return NextResponse.json(
        {
          error:
            "Server configuration error: Missing X (Twitter) credentials. Expecting X_APP_KEY/X_APP_SECRET/X_ACCESS_TOKEN/X_ACCESS_SECRET or TWITTER_* equivalents.",
        },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const size =
      body.resolution && RESOLUTION_TO_SIZE[body.resolution]
        ? RESOLUTION_TO_SIZE[body.resolution]
        : undefined;

    const seconds =
      typeof body.durationSeconds === "number" && body.durationSeconds > 0
        ? Math.floor(body.durationSeconds)
        : undefined;

    const initialJob = await startSoraVideo({
      openai,
      prompt,
      seconds,
      size,
    });

    const completedJob = await pollSoraJobCompletion({
      openai,
      initialJob,
    });

    if (completedJob.status !== "completed") {
      const failureMessage =
        completedJob.error?.message ??
        `Video generation failed with status "${completedJob.status}".`;
      return NextResponse.json({ error: failureMessage }, { status: 502 });
    }

    const videoBuffer = await downloadSoraVideo({
      openai,
      videoId: completedJob.id,
    });

    const twitterClient = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    }).readWrite;

    const mediaId = await twitterClient.v1.uploadMedia(videoBuffer, {
      mimeType: "video/mp4",
    });

    const tweetText = truncateTweetText(body.tweetText?.trim() || prompt);

    const tweet = await twitterClient.v2.tweet({
      text: tweetText,
      media: { media_ids: [mediaId] },
    });

    console.log("Tweet posted", tweet);

    if (!tweet.data?.id) {
      return NextResponse.json(
        { error: "Tweet posted but response did not include an id." },
        { status: 502 },
      );
    }

    const me = await twitterClient.v2.me();
    const username = me.data?.username;

    const tweetUrl = username
      ? `https://x.com/${username}/status/${tweet.data.id}`
      : `https://x.com/i/web/status/${tweet.data.id}`;

    console.log("Tweet URL", tweetUrl);

    return NextResponse.json({
      tweetUrl,
      videoId: completedJob.id,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function truncateTweetText(text: string): string {
  if (text.length <= TWEET_CHAR_LIMIT) {
    return text;
  }
  return `${text.slice(0, TWEET_CHAR_LIMIT - 3)}...`;
}

async function startSoraVideo(args: {
  openai: OpenAI;
  prompt: string;
  seconds?: number;
  size?: string;
}): Promise<SoraJob> {
  const response = await args.openai.post("/videos", {
    body: {
      model: "sora-2",
      prompt: args.prompt,
      ...(typeof args.seconds === "number" ? { seconds: args.seconds } : {}),
      ...(args.size ? { size: args.size } : {}),
    },
  });

  return parseSoraJobResponse(response, "create");
}

async function pollSoraJobCompletion(args: {
  openai: OpenAI;
  initialJob: SoraJob;
}): Promise<SoraJob> {
  let job = args.initialJob;
  const startedAt = Date.now();

  while (isProcessingStatus(job.status)) {
    if (Date.now() - startedAt > SORA_MAX_WAIT_MS) {
      throw new Error(
        "Timed out while waiting for the Sora video generation to complete.",
      );
    }

    await sleep(SORA_POLL_INTERVAL_MS);
    job = await fetchSoraJob({ openai: args.openai, jobId: job.id });
  }

  return job;
}

async function fetchSoraJob(args: {
  openai: OpenAI;
  jobId: string;
}): Promise<SoraJob> {
  const response = await args.openai.get(`/videos/${args.jobId}`);
  return parseSoraJobResponse(response, "retrieve");
}

async function downloadSoraVideo(args: {
  openai: OpenAI;
  videoId: string;
}): Promise<Buffer> {
  const response = await args.openai.get(
    `/videos/${args.videoId}/content`,
    { __binaryResponse: true },
  );
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function isProcessingStatus(status: SoraJobStatus): boolean {
  return status === "queued" || status === "in_progress";
}

async function parseSoraJobResponse(
  response: unknown,
  action: "create" | "retrieve",
): Promise<SoraJob> {
  if (typeof response !== "object" || response === null) {
    throw new Error(
      `Unexpected response while trying to ${action} Sora video: ${String(
        response,
      )}`,
    );
  }

  const job = response as SoraJob & { error?: { message?: string } };

  if (!job.id || !job.status) {
    throw new Error(
      `Unexpected response while trying to ${action} Sora video: ${JSON.stringify(
        response,
      )}`,
    );
  }

  return job;
}

# Sora to X Video Poster

A Next.js app that lets you describe a video prompt, generates the clip with OpenAI Sora, uploads the result to X (Twitter) via the official API, and returns the live tweet link.

## Prerequisites
- Node.js 20+
- OpenAI account with Sora access and an API key
- X developer account with read/write permissions and OAuth1 credentials

## Setup
- `cd app`
- Update dependencies: `npm install`
- Copy `.env.example` to `.env.local` (create the file if it does not exist) and add:
  - `OPENAI_API_KEY`
  - Either `X_APP_KEY`/`X_APP_SECRET`/`X_ACCESS_TOKEN`/`X_ACCESS_SECRET` or their `TWITTER_...` aliases
- Start the dev server: `npm run dev`

## How it works
- Frontend (`app/src/app/page.tsx`) collects the Sora prompt plus optional tweet copy and video options.
- Backend route (`app/src/app/api/generate-video/route.ts`) calls `openai.responses.create` with `modalities: ["video"]`, posts the MP4 to X via `twitter-api-v2`, and returns the tweet URL.
- Errors are surfaced back to the UI so users can retry with different prompts or credentials.

Refer to:
- Sora docs: https://platform.openai.com/docs/guides/video-generation
- X API client: https://github.com/PLhery/node-twitter-api-v2

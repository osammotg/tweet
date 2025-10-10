# Einstein Roast Lab

Generate high-energy Einstein-style roast videos for startup pitches!

## Overview

Einstein Roast Lab is a Next.js application that takes startup pitch tweets and generates entertaining roast scripts with Einstein's signature flair. Perfect for analyzing and critiquing startup ideas with humor and insight.

## Features

- 🧠 AI-powered roast generation using OpenAI
- 🎬 Video output generation
- ⚡ Built with Next.js 14 and TypeScript
- 🎯 Focuses on startup positioning, market analysis, and pitch quality

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local and add your OpenAI API key
# OPENAI_API_KEY=sk-...
# 
# Optional: Enable Sora video generation (requires API access)
# USE_SORA=true
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- Next.js 14
- TypeScript
- OpenAI API (GPT-4o-mini for script generation)
- Sora Turbo for video generation (optional)
- React 18

## Video Generation

### Using Sora Turbo

⚠️ **Important:** Sora 2 API is currently in **preview** and requires special access.

**Current Status:**
- ✅ **Script Generation**: Working perfectly with GPT-4o-mini
- ⚠️ **Video Generation**: Sora API requires preview access
- 🔄 **Fallback**: Uses demo video when Sora isn't available

**To Enable Sora:**

1. **Get Sora API Access**: 
   - Request access to Sora API preview at [platform.openai.com](https://platform.openai.com)
   - The API is available but requires approval for preview access

2. **Enable in Environment**: Set `USE_SORA=true` in your `.env.local` file

3. **API Implementation**: Uses official Sora API endpoints:
   - `POST /v1/videos` - Create video job
   - `GET /v1/videos/{id}` - Check status
   - `GET /v1/videos/{id}/content` - Download MP4

**What You'll See:**
- ✅ **Success**: Real Sora-generated videos with polling progress
- ❌ **Access Denied**: "Sora API access denied" - you need preview access
- ❌ **Parameter Error**: Wrong API parameters (400 error)
- 📹 **Demo**: Falls back to demo video (current behavior)

**Sora Models Available:**
- `sora-2`: Fast generation, good for iteration
- `sora-2-pro`: High quality, production-ready

**Features:**
- 🎬 Dynamic camera movements with Einstein-like presenter
- 📐 Vertical 9:16 format optimized for social media
- ⚡ High-energy delivery with comedic timing
- 🎨 Chalkboard lab setting with animated equations
- 🎯 Generated based on your custom Sora prompts

**Fallback**: If Sora is not enabled or fails, the app uses a demo video placeholder

### Cost & Performance

- Script generation: ~$0.001-0.01 per roast (GPT-4o-mini)
- Video generation: Variable based on Sora Turbo pricing
- Caching: Identical tweets return cached results instantly

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

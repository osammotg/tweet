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

⚠️ **Important:** As of December 2024, Sora 2 API is in **limited preview** and not publicly available yet.

**Current Status:**
- ✅ **Script Generation**: Working perfectly with GPT-4o-mini
- ⚠️ **Video Generation**: Sora API requires special access (waitlist/invitation)
- 🔄 **Fallback**: Uses demo video when Sora isn't available

**To Enable Sora (when available):**

1. **Get Sora API Access**: 
   - Join OpenAI's waitlist at [platform.openai.com](https://platform.openai.com)
   - Sora 2 API is currently in limited preview (invitation-only)
   - Expected to be publicly available "in the coming weeks"

2. **Enable in Environment**: Set `USE_SORA=true` in your `.env.local` file

3. **Test Multiple Endpoints**: The app tries these endpoints:
   - `https://api.openai.com/v1/video/generations`
   - `https://api.openai.com/v1/sora/generations`
   - `https://api.openai.com/v1/generations`

**What You'll See:**
- ✅ **Success**: Real Sora-generated videos (when you have access)
- ❌ **Access Denied**: "Sora API access denied" - you need special access
- ❌ **Not Found**: "All Sora API endpoints failed" - API not available yet
- 📹 **Demo**: Falls back to demo video (current behavior)

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


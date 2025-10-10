"use client";

import { FormEvent, useMemo, useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(6);
  const [resolution, setResolution] = useState<"480p" | "720p" | "1080p">("720p");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tweetUrl, setTweetUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const tweetPreview = useMemo(() => {
    if (tweetText.trim().length > 0) {
      return tweetText.trim();
    }
    if (prompt.trim().length === 0) {
      return "AI-generated video created with Sora ✨";
    }
    return `AI-generated video from Sora: ${prompt.trim()}`;
  }, [tweetText, prompt]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a prompt before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTweetUrl(null);
    setStatusMessage("Generating video with Sora…");

    try {
      const safeDuration = Math.min(15, Math.max(2, Math.round(durationSeconds)));
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          tweetText: tweetText.trim(),
          durationSeconds: safeDuration,
          resolution,
        }),
      });

      const payload = (await response.json()) as { error?: string; tweetUrl?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate video.");
      }

      if (!payload.tweetUrl) {
        throw new Error("No tweet URL returned from the server.");
      }

      setStatusMessage("Video posted to X successfully!");
      setTweetUrl(payload.tweetUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
      setStatusMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Generate & Share Sora Videos
          </h1>
          <p className="text-sm text-slate-300 sm:text-base">
            Describe the video you want to see. We will ask Sora to create it and automatically
            publish the result to your connected X account.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
        >
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-200">Prompt for Sora</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A macro shot of a hummingbird made of glass hovering over neon flowers…"
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
              disabled={isSubmitting}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-200">Tweet copy (optional)</span>
              <textarea
                value={tweetText}
                onChange={(event) => setTweetText(event.target.value)}
                placeholder="AI-generated magic with Sora ✨"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 sm:h-full"
                disabled={isSubmitting}
              />
            </label>
            <aside className="flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wide text-slate-200">
                Tweet preview
              </span>
              <p className="whitespace-pre-line rounded-lg bg-slate-900/80 p-3 text-slate-200">
                {tweetPreview}
              </p>
            </aside>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-200">
                Duration (seconds)
              </span>
              <input
                type="number"
                min={2}
                max={15}
                step={1}
                value={durationSeconds}
                onChange={(event) => {
                  const value = event.target.valueAsNumber;
                  if (Number.isNaN(value)) {
                    setDurationSeconds(6);
                    return;
                  }
                  const clampedValue = Math.min(15, Math.max(2, Math.round(value)));
                  setDurationSeconds(clampedValue);
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                disabled={isSubmitting}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-200">Resolution</span>
              <select
                value={resolution}
                onChange={(event) =>
                  setResolution(event.target.value as "480p" | "720p" | "1080p")
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                disabled={isSubmitting}
              >
                <option value="480p">480p (Faster)</option>
                <option value="720p">720p (Balanced)</option>
                <option value="1080p">1080p (Best)</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-cyan-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-800/70"
            >
              {isSubmitting ? "Generating & Posting…" : "Generate video and post to X"}
            </button>

            {statusMessage && (
              <p className="text-sm text-cyan-300">{statusMessage}</p>
            )}
            {error && <p className="text-sm text-rose-300">{error}</p>}
          </div>
        </form>

        {tweetUrl && (
          <div className="rounded-2xl border border-cyan-500/50 bg-cyan-500/10 p-6 text-center text-sm text-cyan-100">
            <p className="mb-2 font-medium">Your video is live on X.</p>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
            >
              View the tweet ↗
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

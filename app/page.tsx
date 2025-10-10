'use client';

import { useState, useTransition } from "react";
import { buildRoastVideoAction } from "./actions";
import type { RoastInput, RoastOutput } from "@/lib/types";

const SAMPLE_INPUT: RoastInput = {
  tweetId: "182133713371331733",
  authorHandle: "@founder_dave",
  startupName: "PhotonPitch",
  tweetText:
    "We solved pitch decks forever: upload a selfie and our AI writes the story in 30 seconds. Fundraising will never be the same.",
  website: "https://photonpitch.ai",
  angle: "positioning"
};

export default function HomePage() {
  const [result, setResult] = useState<RoastOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      setError(null);

      buildRoastVideoAction(SAMPLE_INPUT)
        .then((payload) => {
          setResult(payload);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Unknown error");
        });
    });
  };

  return (
    <main style={{ padding: "3rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Einstein Roast Lab</h1>
      <p>Generate a high-energy Einstein roast for a startup pitch.</p>
      <button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? "Roasting..." : "Test Roast"}
      </button>
      {error ? <p style={{ color: "red", marginTop: "1rem" }}>{error}</p> : null}
      {result ? (
        <pre
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "0.5rem",
            maxWidth: "60ch",
            overflowX: "auto",
            background: "#f9f9f9"
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}

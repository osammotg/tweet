'use client';

import { useState, useTransition } from "react";
import { buildRoastVideoAction } from "./actions";
import type { RoastInput, RoastOutput } from "@/lib/types";
import type { EnergyMode } from "@/lib/duration";

const SAMPLE_INPUT: RoastInput = {
  tweetId: "182133713371331733",
  authorHandle: "@founder_dave",
  startupName: "PhotonPitch",
  tweetText:
    "We solved pitch decks forever: upload a selfie and our AI writes the story in 30 seconds. Fundraising will never be the same.",
  website: "https://photonpitch.ai",
  angle: "positioning",
  targetSec: 12,
  energy: "HYPER"
};

export default function HomePage() {
  const [result, setResult] = useState<RoastOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [tweetText, setTweetText] = useState(SAMPLE_INPUT.tweetText);
  const [startupName, setStartupName] = useState(SAMPLE_INPUT.startupName);
  const [authorHandle, setAuthorHandle] = useState(SAMPLE_INPUT.authorHandle || "");
  const [website, setWebsite] = useState(SAMPLE_INPUT.website || "");
  const [angle, setAngle] = useState(SAMPLE_INPUT.angle || "positioning");
  const [targetSec, setTargetSec] = useState(SAMPLE_INPUT.targetSec || 12);
  const [energy, setEnergy] = useState<EnergyMode>(SAMPLE_INPUT.energy || "HYPER");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const input: RoastInput = {
      tweetId: Date.now().toString(),
      tweetText,
      startupName,
      authorHandle: authorHandle || undefined,
      website: website || undefined,
      angle: angle || undefined,
      targetSec,
      energy
    };

    startTransition(() => {
      setError(null);
      setResult(null);

      buildRoastVideoAction(input)
        .then((payload) => {
          setResult(payload);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Unknown error");
        });
    });
  };

  return (
    <main style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "2rem",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        padding: "2rem"
      }}>
        <h1 style={{ 
          fontSize: "2.5rem",
          fontWeight: "bold",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem"
        }}>
          🧠 Einstein Roast Lab
        </h1>
        <p style={{ color: "#666", marginBottom: "2rem" }}>
          Generate high-energy Einstein-style roast videos for startup pitches with proper timing and beat structure!
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Tweet Text */}
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>
              Tweet Text *
            </label>
            <textarea
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              required
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "1rem",
                fontFamily: "inherit",
                resize: "vertical"
              }}
              placeholder="Enter the startup pitch tweet..."
            />
          </div>

          {/* Two columns for smaller fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>
                Startup Name *
              </label>
              <input
                type="text"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
                placeholder="e.g., PhotonPitch"
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>
                Author Handle
              </label>
              <input
                type="text"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
                placeholder="@handle (optional)"
              />
            </div>
          </div>

          {/* Website and Angle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem"
                }}
                placeholder="https://... (optional)"
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>
                Roast Angle
              </label>
              <select
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "white"
                }}
              >
                <option value="positioning">Positioning</option>
                <option value="pricing">Pricing</option>
                <option value="vaporware">Vaporware</option>
                <option value="metrics">Metrics</option>
                <option value="UX">UX</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>

          {/* Duration and Energy */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>
                Duration (seconds)
              </label>
              <select
                value={targetSec}
                onChange={(e) => setTargetSec(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "white"
                }}
              >
                <option value={12}>12s (meme short)</option>
                <option value={18}>18s (sweet spot)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>
                Energy Mode
              </label>
              <select
                value={energy}
                onChange={(e) => setEnergy(e.target.value as EnergyMode)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "white"
                }}
              >
                <option value="HYPER">HYPER (3.0 wps) 🚀</option>
                <option value="NORMAL">NORMAL (2.4 wps)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "white",
              background: isPending 
                ? "linear-gradient(135deg, #a0aec0 0%, #718096 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
              cursor: isPending ? "not-allowed" : "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
            }}
            onMouseEnter={(e) => {
              if (!isPending) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
            }}
          >
            {isPending ? "⚡ Roasting..." : "🔥 Generate Roast"}
          </button>
        </form>

        {/* Error Display */}
        {error ? (
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#fee",
            border: "2px solid #fcc",
            borderRadius: "8px",
            color: "#c33"
          }}>
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {/* Result Display */}
        {result ? (
          <div style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#333" }}>
              🎬 Roast Generated!
            </h2>
            
            <div style={{ 
              background: "#f7fafc",
              padding: "1.5rem",
              borderRadius: "8px",
              marginBottom: "1rem"
            }}>
              <div style={{ marginBottom: "1rem" }}>
                <strong style={{ color: "#667eea" }}>Script Lines:</strong>
                <ol style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                  {result.script_lines.map((line, idx) => (
                    <li key={idx} style={{ marginBottom: "0.5rem", color: "#333" }}>{line}</li>
                  ))}
                </ol>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <strong style={{ color: "#667eea" }}>Caption:</strong>
                <p style={{ marginTop: "0.25rem", color: "#333" }}>{result.caption}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1rem" }}>
                <div>
                  <strong style={{ color: "#667eea", fontSize: "0.875rem" }}>Duration:</strong>
                  <p style={{ margin: "0.25rem 0", color: "#333" }}>{result.durationSec}s</p>
                </div>
                <div>
                  <strong style={{ color: "#667eea", fontSize: "0.875rem" }}>Words/sec:</strong>
                  <p style={{ margin: "0.25rem 0", color: "#333" }}>{result.wps}</p>
                </div>
                <div>
                  <strong style={{ color: "#667eea", fontSize: "0.875rem" }}>Total Words:</strong>
                  <p style={{ margin: "0.25rem 0", color: "#333" }}>{result.maxWords}</p>
                </div>
              </div>

              {result.srt && (
                <details style={{ marginTop: "1rem" }}>
                  <summary style={{ cursor: "pointer", fontWeight: "600", color: "#667eea" }}>
                    View SRT Subtitles
                  </summary>
                  <pre style={{
                    marginTop: "0.5rem",
                    padding: "1rem",
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    overflow: "auto",
                    maxHeight: "200px"
                  }}>
                    {result.srt}
                  </pre>
                </details>
              )}

              {result.sora_prompt && (
                <details style={{ marginTop: "1rem" }}>
                  <summary style={{ cursor: "pointer", fontWeight: "600", color: "#667eea" }}>
                    View Sora Prompt
                  </summary>
                  <p style={{
                    marginTop: "0.5rem",
                    padding: "1rem",
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    fontSize: "0.875rem"
                  }}>
                    {result.sora_prompt}
                  </p>
                </details>
              )}
            </div>

            <div>
              <strong style={{ color: "#333" }}>Video URL:</strong>
              <a 
                href={result.videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  marginLeft: "0.5rem",
                  color: "#667eea",
                  textDecoration: "underline"
                }}
              >
                {result.videoUrl}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

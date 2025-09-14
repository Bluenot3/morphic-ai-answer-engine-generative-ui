// components/ActionBar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type ActionBarProps = {
  getTranscript?: () => string;
  onReset?: () => void;
  onToggleWeb?: (enabled: boolean) => void;
  onModelSwitch?: (id: string) => void;
  currentModelId?: string;
  models?: { id: string; label: string }[];
};

export default function ActionBar({
  getTranscript,
  onReset,
  onToggleWeb,
  onModelSwitch,
  currentModelId,
  models = [
    { id: "openai:gpt-5", label: "GPT-5" },
    { id: "anthropic:sonnet-4", label: "Claude Sonnet-4" },
    { id: "google:gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "groq:llama-3.1-405b", label: "Llama 3.1 405B" },
  ],
}: ActionBarProps) {
  const [webEnabled, setWebEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("zen:webEnabled") === "1";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zen:webEnabled", webEnabled ? "1" : "0");
    }
    onToggleWeb?.(webEnabled);
  }, [webEnabled, onToggleWeb]);

  const transcript = useMemo(() => getTranscript?.() ?? "", [getTranscript]);

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript || "");
      alert("Copied conversation to clipboard.");
    } catch {
      alert("Copy failed—your browser blocked it.");
    }
  };

  const exportMarkdown = () => {
    const blob = new Blob([transcript || ""], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `zen-chat-${new Date().toISOString().slice(0, 19)}.md`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const text = transcript?.slice(0, 5000) || "ZEN Chat";
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "ZEN Chat", text });
      } catch {
        /* user cancelled */
      }
    } else {
      copyTranscript();
    }
  };

  return (
    <div className="sticky bottom-4 mx-auto flex max-w-4xl flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900/70 px-3 py-2 backdrop-blur">
      {/* Model switcher */}
      <select
        className="rounded-lg border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm"
        value={currentModelId}
        onChange={(e) => onModelSwitch?.(e.target.value)}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Toggles */}
      <label className="ml-1 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm">
        <input
          type="checkbox"
          checked={webEnabled}
          onChange={(e) => setWebEnabled(e.target.checked)}
        />
        Web / Retrieval
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={copyTranscript}
          className="rounded-lg border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm hover:bg-neutral-700/70"
        >
          Copy
        </button>
        <button
          onClick={exportMarkdown}
          className="rounded-lg border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm hover:bg-neutral-700/70"
        >
          Export .md
        </button>
        <button
          onClick={share}
          className="rounded-lg border border-white/10 bg-neutral-800/70 px-2 py-1 text-sm hover:bg-neutral-700/70"
        >
          Share
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border border-white/10 bg-red-600/80 px-2 py-1 text-sm hover:bg-red-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// components/CommandPalette.tsx
"use client";

import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  useRegisterActions,
} from "kbar";
import React, { ReactNode, useMemo } from "react";

/** Default actions (customize freely) */
const baseActions = [
  {
    id: "new-chat",
    name: "New Chat",
    shortcut: ["n"],
    keywords: "reset clear",
    perform: () => window.location.reload(),
  },
  {
    id: "copy",
    name: "Copy Transcript",
    shortcut: ["c"],
    keywords: "clipboard",
    perform: async () => {
      try {
        const text = (window as any).__ZEN_TRANSCRIPT__ ?? "";
        await navigator.clipboard.writeText(text);
        alert("Copied transcript.");
      } catch {
        alert("Copy blocked by browser.");
      }
    },
  },
  {
    id: "export",
    name: "Export .md",
    keywords: "download markdown export",
    perform: () => {
      const btn = document.querySelector<HTMLButtonElement>("[data-export-md]");
      if (btn) {
        btn.click();
        return;
      }
      // Fallback: export whatever is on the global
      const content = (window as any).__ZEN_TRANSCRIPT__ ?? "";
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `zen-chat-${new Date().toISOString().slice(0, 19)}.md`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  },
  {
    id: "arena",
    name: "Open ZEN Arena",
    keywords: "zen arena models",
    perform: () => window.open("https://us.zenai.world", "_blank"),
  },
];

/** Renders the results list using kbar's internal matches */
function Results() {
  const { results } = useMatches();

  return (
    <KBarPositioner>
      <KBarAnimator className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 text-white shadow-xl">
        <KBarSearch
          className="w-full border-b border-white/10 bg-neutral-900 p-3 outline-none placeholder:text-white/40"
          placeholder="Type a command… (try: new, copy, export, arena)"
        />
        <KBarResults
          items={results}
          onRender={({ item, active }) => {
            if (typeof item === "string") {
              return (
                <div className="px-3 py-2 text-xs uppercase tracking-wider text-white/40">
                  {item}
                </div>
              );
            }
            const action = item as any;
            return (
              <div
                className={`px-3 py-2 text-sm ${
                  active ? "bg-neutral-800" : ""
                }`}
              >
                {action.name}
              </div>
            );
          }}
        />
      </KBarAnimator>
    </KBarPositioner>
  );
}

/** Registers actions after the provider is mounted */
function ActionsRegistrar({ actions }: { actions: any[] }) {
  useRegisterActions(actions, [actions]);
  return null;
}

/** Wrap any subtree to enable ⌘K / Ctrl-K */
export default function CommandPalette({
  children,
  actions,
}: {
  children: ReactNode;
  /** You can pass extra actions from the parent (merged with defaults) */
  actions?: any[];
}) {
  const actionsMerged = useMemo(
    () => [...baseActions, ...(actions ?? [])],
    [actions]
  );

  return (
    <KBarProvider actions={actionsMerged}>
      <KBarPortal>
        <Results />
      </KBarPortal>
      <ActionsRegistrar actions={actionsMerged} />
      {children}
    </KBarProvider>
  );
}

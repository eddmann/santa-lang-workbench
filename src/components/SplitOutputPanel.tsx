import { useState } from "react";
import {
  CommandLineIcon,
  BookOpenIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector } from "../store";
import { OutputPanel } from "./OutputPanel";
import { MultiOutputPanel } from "./MultiOutputPanel";
import { AocContextPanel } from "./AocContextPanel";
import type { ExecutionInstance } from "../lib/types";

interface SplitOutputPanelProps {
  singleExecution: ExecutionInstance | null;
  showMultiOutput: boolean;
}

type ActiveTab = "output" | "puzzle";

export function SplitOutputPanel({
  singleExecution,
  showMultiOutput,
}: SplitOutputPanelProps) {
  const { currentReference } = useAppSelector((state) => state.aoc);
  const [activeTab, setActiveTab] = useState<ActiveTab>("output");

  // If no AoC reference, just show output directly
  if (!currentReference) {
    return (
      <div className="h-full bg-[var(--color-background)]">
        {showMultiOutput ? (
          <MultiOutputPanel />
        ) : (
          <OutputPanel execution={singleExecution} />
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Tab Bar */}
      <div className="flex border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
        <button
          onClick={() => setActiveTab("output")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "output"
              ? "text-[var(--color-text-primary)] border-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <CommandLineIcon className="w-4 h-4" />
          Output
        </button>
        <button
          onClick={() => setActiveTab("puzzle")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "puzzle"
              ? "text-[var(--color-text-primary)] border-[var(--color-accent)]"
              : "text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <BookOpenIcon className="w-4 h-4" />
          Puzzle
          <span className="text-xs text-[var(--color-text-muted)]">
            Day {currentReference.day}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "output" ? (
          showMultiOutput ? (
            <MultiOutputPanel />
          ) : (
            <OutputPanel execution={singleExecution} showHeader={false} />
          )
        ) : (
          <AocContextPanel />
        )}
      </div>
    </div>
  );
}

import { SolutionOutput } from "./SolutionOutput";
import { TestOutput } from "./TestOutput";
import { ScriptOutput } from "./ScriptOutput";
import { ConsoleOutput } from "./ConsoleOutput";
import {
  CommandLineIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import type { ExecutionInstance } from "../lib/types";

interface OutputPanelProps {
  execution?: ExecutionInstance | null;
  showHeader?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

export function OutputPanel({
  execution,
  showHeader = true,
  compact = false,
  onClose,
}: OutputPanelProps) {
  // Idle state - no execution
  if (!execution || (execution.status === "idle" && !execution.result)) {
    return (
      <div className="h-full flex flex-col bg-[var(--color-background)]">
        {showHeader && (
          <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <CommandLineIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Output
              </h2>
            </div>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface)]
                          border border-[var(--color-border)] flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] font-medium">Ready to execute</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] font-mono text-xs">⌘↵</kbd> to run
              or <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] font-mono text-xs">⌘⇧↵</kbd> to test
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { status, result, consoleOutput, reindeer, command } = execution;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--color-background)]">
      {showHeader && (
        <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CommandLineIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              {compact ? `${reindeer.name} ${reindeer.version}` : "Output"}
            </h2>
            {status === "running" && (
              <div className="flex items-center gap-2 ml-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-info)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-info)]"></span>
                </span>
                <span className="text-xs text-[var(--color-info)] font-medium">Executing</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <span className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide">
                {result.type === "test" ? "Tests" : result.type === "solution" ? "Solution" : "Script"}
              </span>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`flex-1 overflow-auto ${compact ? "p-2" : "p-4"} space-y-4`}>
        {result?.type === "solution" && <SolutionOutput result={result} />}
        {result?.type === "test" && <TestOutput result={result} />}
        {result?.type === "script" && <ScriptOutput result={result} />}

        {consoleOutput.length > 0 && (
          <ConsoleOutput lines={consoleOutput} />
        )}

        {command && (
          <div className="mt-4 p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              <CommandLineIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                Command
              </p>
            </div>
            <code className="text-xs font-mono text-[var(--color-text-secondary)] break-all">
              {command}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

import type { SolutionExecutionState } from "../lib/types";
import { PartResult } from "./PartResult";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

interface Props {
  result: SolutionExecutionState;
}

export function SolutionOutput({ result }: Props) {
  return (
    <div className="space-y-3 animate-fade-in">
      <PartResult label="Part One" part={result.part_one} />
      <PartResult label="Part Two" part={result.part_two} />

      {result.error && (
        <div className="mt-4 p-4 bg-[var(--color-error-glow)] border border-[var(--color-error)]/40 rounded-lg animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-[var(--color-error)]" />
            <p className="text-[var(--color-error)] font-semibold">Execution Error</p>
          </div>
          <pre className="text-sm text-[var(--color-text-primary)] font-mono whitespace-pre-wrap
                        bg-[var(--color-background)] p-3 rounded-md border border-[var(--color-border-subtle)]">
            {result.error.message}
          </pre>
          {result.error.location && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2 font-mono">
              at line {result.error.location.line}, column {result.error.location.column}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

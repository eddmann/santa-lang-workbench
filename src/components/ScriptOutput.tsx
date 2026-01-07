import type { ScriptExecutionState } from "../lib/types";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { formatDuration } from "../lib/utils";

interface Props {
  result: ScriptExecutionState;
}

export function ScriptOutput({ result }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {result.status === "pending" && (
          <span className="w-5 h-5 rounded-full border-2 border-[var(--color-border)]" />
        )}
        {result.status === "running" && (
          <span className="w-5 h-5 rounded-full border-2 border-[var(--color-info)] border-t-transparent animate-spin" />
        )}
        {(result.status === "complete" || result.status === "error") && (
          <CheckCircleIcon
            className={`w-5 h-5 ${
              result.status === "complete"
                ? "text-[var(--color-success)]"
                : "text-[var(--color-error)]"
            }`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Result
            </span>
            {result.duration_ms !== null && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatDuration(result.duration_ms)}
              </span>
            )}
          </div>
          <div className="mt-1">
            {result.status === "pending" && (
              <span className="text-[var(--color-text-muted)]">Pending</span>
            )}
            {result.status === "running" && (
              <span className="text-[var(--color-info)]">Running...</span>
            )}
            {result.status === "complete" && result.value !== null && (
              <code className="font-mono text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] px-2 py-1 rounded break-all">
                {result.value}
              </code>
            )}
          </div>
        </div>
      </div>

      {result.error && (
        <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-md">
          <p className="text-[var(--color-error)] font-medium">Error</p>
          <p className="text-sm text-[var(--color-text-primary)] mt-1 font-mono">
            {result.error.message}
          </p>
          {result.error.location && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Line {result.error.location.line}, Column{" "}
              {result.error.location.column}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

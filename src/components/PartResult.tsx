import type { PartResult as PartResultType } from "../lib/types";
import { CheckCircleIcon, ClockIcon, CpuChipIcon } from "@heroicons/react/20/solid";
import { formatDuration } from "../lib/utils";

interface Props {
  label: string;
  part: PartResultType;
}

export function PartResult({ label, part }: Props) {
  const statusIcon = () => {
    switch (part.status) {
      case "pending":
        return (
          <div className="w-6 h-6 rounded-full bg-[var(--color-surface-elevated)] border-2 border-[var(--color-border)]
                        flex items-center justify-center">
            <ClockIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          </div>
        );
      case "running":
        return (
          <div className="w-6 h-6 rounded-full bg-[var(--color-info-glow)] border-2 border-[var(--color-info)]
                        flex items-center justify-center animate-pulse">
            <CpuChipIcon className="w-3.5 h-3.5 text-[var(--color-info)]" />
          </div>
        );
      case "complete":
        return (
          <div className="w-6 h-6 rounded-full bg-[var(--color-accent-glow)] flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 text-[var(--color-success)]" />
          </div>
        );
    }
  };

  return (
    <div className="group flex items-start gap-4 p-4 rounded-lg bg-[var(--color-surface)]
                  border border-[var(--color-border-subtle)]
                  hover:border-[var(--color-border)] transition-colors duration-200">
      <div className="flex-shrink-0 mt-0.5">{statusIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
            {label}
          </span>
          {part.duration_ms !== null && (
            <span className="text-xs font-mono text-[var(--color-text-muted)]
                          bg-[var(--color-background)] px-2 py-0.5 rounded-full">
              {formatDuration(part.duration_ms)}
            </span>
          )}
        </div>
        <div className="mt-2">
          {part.status === "pending" && (
            <span className="text-sm text-[var(--color-text-muted)] italic">Waiting...</span>
          )}
          {part.status === "running" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-info)]">Computing</span>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-[var(--color-info)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-[var(--color-info)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-[var(--color-info)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          {part.status === "complete" && part.value !== null && (
            <code className="inline-block font-mono text-sm text-[var(--color-text-primary)]
                          bg-[var(--color-background)] px-3 py-1.5 rounded-md
                          border border-[var(--color-border-subtle)]
                          break-all select-all cursor-text
                          hover:border-[var(--color-accent)] transition-colors duration-200">
              {part.value}
            </code>
          )}
        </div>
      </div>
    </div>
  );
}

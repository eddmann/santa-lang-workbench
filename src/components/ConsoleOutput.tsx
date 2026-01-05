import { ChatBubbleLeftRightIcon } from "@heroicons/react/20/solid";

interface Props {
  lines: string[];
}

export function ConsoleOutput({ lines }: Props) {
  if (lines.length === 0) return null;

  return (
    <div className="mt-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-2">
        <ChatBubbleLeftRightIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Console Output
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] px-1.5 py-0.5 rounded">
          {lines.length} {lines.length === 1 ? 'line' : 'lines'}
        </span>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
        <div className="max-h-48 overflow-auto">
          <div className="p-3 font-mono text-sm">
            {lines.map((line, i) => (
              <div
                key={i}
                className="flex gap-3 py-0.5 hover:bg-[var(--color-surface-elevated)] -mx-3 px-3
                         transition-colors duration-100"
              >
                <span className="text-[var(--color-text-faint)] select-none w-6 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-[var(--color-accent)] select-none flex-shrink-0">&gt;</span>
                <span className="text-[var(--color-text-primary)] break-all">{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

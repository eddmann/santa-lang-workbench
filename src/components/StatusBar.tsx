import { useAppSelector } from "../store";
import {
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentIcon,
} from "@heroicons/react/20/solid";

export function StatusBar() {
  const { tabs, activeTabId } = useAppSelector((state) => state.tabs);
  const { reindeer, selectedId } = useAppSelector(
    (state) => state.reindeer
  );
  const { status } = useAppSelector((state) => state.execution);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const selectedReindeer = reindeer.find((r) => r.id === selectedId);

  return (
    <div className="flex items-center justify-between h-6 px-3 bg-[var(--color-surface)]
                  border-t border-[var(--color-border-subtle)] text-xs select-none">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Reindeer */}
        <div className="flex items-center gap-1.5">
          <CpuChipIcon className="w-3.5 h-3.5 text-[var(--color-text-faint)]" />
          {selectedReindeer ? (
            <span className="text-[var(--color-text-muted)]">
              {selectedReindeer.name}
              <span className="text-[var(--color-text-faint)] ml-1">{selectedReindeer.version}</span>
            </span>
          ) : (
            <span className="text-[var(--color-warning)]">No reindeer</span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-3 bg-[var(--color-border-subtle)]" />

        {/* Status */}
        {status === "running" && (
          <div className="flex items-center gap-1.5 text-[var(--color-info)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-info)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-info)]"></span>
            </span>
            <span>Running</span>
          </div>
        )}
        {status === "complete" && (
          <div className="flex items-center gap-1.5 text-[var(--color-success)]">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            <span>Complete</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-1.5 text-[var(--color-error)]">
            <ExclamationCircleIcon className="w-3.5 h-3.5" />
            <span>Error</span>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center text-[var(--color-text-muted)] min-w-0">
        {activeTab?.path && (
          <div className="flex items-center gap-1.5 min-w-0">
            <DocumentIcon className="w-3.5 h-3.5 text-[var(--color-text-faint)] flex-shrink-0" />
            <span className="truncate">{activeTab.path}</span>
          </div>
        )}
      </div>
    </div>
  );
}

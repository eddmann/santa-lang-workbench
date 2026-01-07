import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  setActiveExecution,
  removeExecution,
  clearAllExecutions,
} from "../store/slices/executionSlice";
import { OutputPanel } from "./OutputPanel";
import {
  CommandLineIcon,
  SparklesIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TrashIcon,
  ChartBarIcon,
} from "@heroicons/react/20/solid";
import { PerformanceChart } from "./PerformanceChart";
import type { ExecutionInstance } from "../lib/types";

type ViewMode = "tabs" | "grid" | "chart";

export function MultiOutputPanel() {
  const dispatch = useAppDispatch();
  const { executions, activeExecutionId, multiSelectMode } = useAppSelector(
    (state) => state.execution
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Get executions sorted by startedAt
  const sortedExecutions = useMemo(() => {
    return Object.values(executions)
      .filter((e) => !e.id.startsWith("pending_"))
      .sort((a, b) => a.startedAt - b.startedAt);
  }, [executions]);

  const activeExecution = activeExecutionId
    ? executions[activeExecutionId]
    : sortedExecutions[0] || null;

  const handleSelectExecution = (id: string) => {
    dispatch(setActiveExecution(id));
  };

  const handleCloseExecution = (id: string) => {
    dispatch(removeExecution(id));
  };

  const handleClearAll = () => {
    dispatch(clearAllExecutions());
  };

  // Empty state
  if (sortedExecutions.length === 0) {
    return (
      <div className="h-full flex flex-col bg-[var(--color-background)]">
        <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <CommandLineIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Output
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface)]
                          border border-[var(--color-border)] flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] font-medium">
              {multiSelectMode ? "Ready to compare" : "Ready to execute"}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              {multiSelectMode
                ? "Select reindeer and click Run All to compare results"
                : (
                  <>
                    Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] font-mono text-xs">⌘↵</kbd> to run
                    or <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] font-mono text-xs">⌘⇧↵</kbd> to test
                  </>
                )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Single execution - use simple output panel
  if (sortedExecutions.length === 1 && !multiSelectMode) {
    return (
      <OutputPanel
        execution={sortedExecutions[0]}
        showHeader={true}
        onClose={() => handleCloseExecution(sortedExecutions[0].id)}
      />
    );
  }

  // Multiple executions - show tabs or grid
  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header with view toggle */}
      <div className="px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            {viewMode === "chart" ? "Performance" : "Comparison"} ({sortedExecutions.length})
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode("tabs")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "tabs"
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
            title="Tab view"
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
            title="Grid view"
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "chart"
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
            title="Performance chart"
          >
            <ChartBarIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
          <button
            onClick={handleClearAll}
            className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
            title="Clear all"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab bar for tabs mode */}
      {viewMode === "tabs" && (
        <div className="flex overflow-x-auto bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
          {sortedExecutions.map((execution) => (
            <ExecutionTab
              key={execution.id}
              execution={execution}
              isActive={execution.id === activeExecutionId}
              onSelect={() => handleSelectExecution(execution.id)}
              onClose={() => handleCloseExecution(execution.id)}
            />
          ))}
        </div>
      )}

      {/* Content area */}
      {viewMode === "tabs" && (
        <div className="flex-1 overflow-hidden">
          <OutputPanel
            execution={activeExecution}
            showHeader={false}
          />
        </div>
      )}
      {viewMode === "grid" && (
        <div className="flex-1 overflow-auto p-2">
          <div className={`grid gap-2 h-full ${
            sortedExecutions.length <= 2
              ? "grid-cols-1 md:grid-cols-2"
              : sortedExecutions.length <= 4
              ? "grid-cols-2"
              : "grid-cols-2 lg:grid-cols-3"
          }`}>
            {sortedExecutions.map((execution) => (
              <div
                key={execution.id}
                className="border border-[var(--color-border)] rounded-lg overflow-hidden min-h-[200px]"
              >
                <ExecutionCard
                  execution={execution}
                  onClose={() => handleCloseExecution(execution.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {viewMode === "chart" && (
        <div className="flex-1 overflow-auto p-4">
          <PerformanceChart executions={sortedExecutions} />
        </div>
      )}
    </div>
  );
}

interface ExecutionTabProps {
  execution: ExecutionInstance;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function ExecutionTab({ execution, isActive, onSelect, onClose }: ExecutionTabProps) {
  const { reindeer, status } = execution;

  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors whitespace-nowrap
                 ${isActive
                   ? "border-[var(--color-accent)] text-[var(--color-text-primary)] bg-[var(--color-background)]"
                   : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                 }`}
    >
      {status === "running" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-info)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-info)]"></span>
        </span>
      )}
      {status === "complete" && (
        <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
      )}
      {status === "error" && (
        <span className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
      )}
      <span className="text-sm font-medium">{reindeer.name}</span>
      <span className="text-xs font-mono text-[var(--color-text-muted)]">{reindeer.version}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-1 p-0.5 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </button>
  );
}

interface ExecutionCardProps {
  execution: ExecutionInstance;
  onClose: () => void;
}

function ExecutionCard({ execution, onClose }: ExecutionCardProps) {
  return (
    <OutputPanel
      execution={execution}
      showHeader={true}
      compact={true}
      onClose={onClose}
    />
  );
}

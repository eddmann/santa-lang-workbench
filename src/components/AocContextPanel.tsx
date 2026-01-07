import { useState } from "react";
import {
  BookOpenIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../store";
import { aocCacheKey } from "../lib/aoc-utils";
import { clearError } from "../store/slices/aocSlice";

export function AocContextPanel() {
  const dispatch = useAppDispatch();
  const { currentReference, puzzles, loading, errors } = useAppSelector(
    (state) => state.aoc
  );
  const { aoc_session_token } = useAppSelector(
    (state) => state.settings.settings
  );

  const [inputExpanded, setInputExpanded] = useState(false);

  if (!currentReference) {
    return (
      <div className="h-full flex flex-col bg-[var(--color-background)]">
        <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Puzzle
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <BookOpenIcon className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">
              No AoC puzzle detected
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Use{" "}
              <code className="text-[var(--color-accent)]">
                read("aoc://YEAR/DAY")
              </code>{" "}
              in your code
            </p>
          </div>
        </div>
      </div>
    );
  }

  const key = aocCacheKey(currentReference.year, currentReference.day);
  const puzzle = puzzles[key];
  const isLoading = loading[key];
  const error = errors[key];

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-[var(--color-background)]">
        <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Puzzle
            </h2>
            <div className="flex items-center gap-2 ml-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-info)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-info)]"></span>
              </span>
              <span className="text-xs text-[var(--color-info)] font-medium">
                Loading
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-[var(--color-accent)] border-t-transparent rounded-full"></div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Fetching Day {currentReference.day}, {currentReference.year}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-[var(--color-background)]">
        <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Puzzle
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 text-[var(--color-error)]" />
            <p className="text-sm text-[var(--color-error)] font-medium">
              Failed to load puzzle
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">
              {error}
            </p>
            <button
              onClick={() => dispatch(clearError(key))}
              className="mt-3 text-xs text-[var(--color-accent)] hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!puzzle) {
    return null;
  }

  const aocUrl = `https://adventofcode.com/${puzzle.year}/day/${puzzle.day}`;

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Puzzle
            </h2>
          </div>
          <a
            href={aocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
          >
            Open on AoC
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Title */}
        <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            {puzzle.title}
          </h3>
        </div>

        {/* Description */}
        <div
          className="px-4 py-3 prose prose-sm prose-invert max-w-none aoc-content"
          dangerouslySetInnerHTML={{ __html: puzzle.description_html }}
        />

        {/* Input Section */}
        {puzzle.input ? (
          <div className="border-t border-[var(--color-border-subtle)]">
            <button
              onClick={() => setInputExpanded(!inputExpanded)}
              className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              {inputExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              )}
              <DocumentTextIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Your Input
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                ({puzzle.input.split("\n").length} lines)
              </span>
            </button>
            {inputExpanded && (
              <div className="px-4 pb-4">
                <pre className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] text-xs font-mono text-[var(--color-text-primary)] overflow-auto max-h-64">
                  {puzzle.input}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <ExclamationTriangleIcon className="w-4 h-4" />
              {aoc_session_token ? (
                <span>
                  Could not fetch input. Your session token may have expired.
                </span>
              ) : (
                <span>
                  Configure your AoC session token in Settings to view your
                  input.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

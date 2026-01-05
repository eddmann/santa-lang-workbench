import type { TestExecutionState, TestResult } from "../lib/types";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BeakerIcon,
} from "@heroicons/react/20/solid";

interface Props {
  result: TestExecutionState;
}

export function TestOutput({ result }: Props) {
  const passedCount = result.tests.filter(
    (t) =>
      t.status === "complete" &&
      t.part_one?.passed !== false &&
      t.part_two?.passed !== false
  ).length;
  const failedCount = result.tests.filter(
    (t) =>
      t.status === "complete" &&
      (t.part_one?.passed === false || t.part_two?.passed === false)
  ).length;
  const pendingCount = result.tests.filter(
    (t) => t.status === "pending" || t.status === "running"
  ).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary Bar */}
      <div className="flex items-center gap-6 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          <BeakerIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {result.tests.length} Tests
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {passedCount > 0 && (
            <span className="flex items-center gap-1.5 text-[var(--color-success)]">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="font-medium">{passedCount}</span>
              <span className="text-[var(--color-text-muted)]">passed</span>
            </span>
          )}
          {failedCount > 0 && (
            <span className="flex items-center gap-1.5 text-[var(--color-error)]">
              <XCircleIcon className="w-4 h-4" />
              <span className="font-medium">{failedCount}</span>
              <span className="text-[var(--color-text-muted)]">failed</span>
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
              <ClockIcon className="w-4 h-4" />
              <span className="font-medium">{pendingCount}</span>
              <span>pending</span>
            </span>
          )}
        </div>
      </div>

      {/* Test Cases */}
      <div className="space-y-2">
        {result.tests.map((test, index) => (
          <TestCase key={test.index} test={test} delay={index * 50} />
        ))}
      </div>

      {result.error && (
        <div className="p-4 bg-[var(--color-error-glow)] border border-[var(--color-error)]/40 rounded-lg">
          <p className="text-[var(--color-error)] font-semibold mb-2">Error</p>
          <pre className="text-sm text-[var(--color-text-primary)] font-mono whitespace-pre-wrap
                        bg-[var(--color-background)] p-3 rounded-md border border-[var(--color-border-subtle)]">
            {result.error.message}
          </pre>
        </div>
      )}
    </div>
  );
}

function TestCase({ test, delay }: { test: TestResult; delay: number }) {
  const isPassed =
    test.status === "complete" &&
    test.part_one?.passed !== false &&
    test.part_two?.passed !== false;
  const isFailed =
    test.status === "complete" &&
    (test.part_one?.passed === false || test.part_two?.passed === false);

  const statusIcon = () => {
    if (test.status === "pending") {
      return (
        <div className="w-6 h-6 rounded-full bg-[var(--color-surface-elevated)] border-2 border-[var(--color-border)]
                      flex items-center justify-center">
          <ClockIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        </div>
      );
    }
    if (test.status === "running") {
      return (
        <div className="w-6 h-6 rounded-full border-2 border-[var(--color-info)] border-t-transparent animate-spin" />
      );
    }
    if (isPassed) {
      return (
        <div className="w-6 h-6 rounded-full bg-[var(--color-accent-glow)] flex items-center justify-center">
          <CheckCircleIcon className="w-5 h-5 text-[var(--color-success)]" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-[var(--color-error-glow)] flex items-center justify-center">
        <XCircleIcon className="w-5 h-5 text-[var(--color-error)]" />
      </div>
    );
  };

  const borderClass = isPassed
    ? "border-[var(--color-success)]/30 hover:border-[var(--color-success)]/50"
    : isFailed
    ? "border-[var(--color-error)]/30 hover:border-[var(--color-error)]/50"
    : "border-[var(--color-border-subtle)] hover:border-[var(--color-border)]";

  return (
    <div
      className={`p-4 bg-[var(--color-surface)] rounded-lg border ${borderClass} transition-colors duration-200`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        {statusIcon()}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[var(--color-text-primary)]">
            Test {test.index}
          </span>
          {test.slow && (
            <span className="text-[10px] font-medium text-[var(--color-warning)]
                          bg-[var(--color-warning-glow)] px-2 py-0.5 rounded-full
                          border border-[var(--color-warning)]/30">
              @slow
            </span>
          )}
        </div>
      </div>

      {test.status === "complete" && (
        <div className="mt-4 space-y-3 pl-9">
          {test.part_one && (
            <TestPartResult label="Part One" result={test.part_one} />
          )}
          {test.part_two && (
            <TestPartResult label="Part Two" result={test.part_two} />
          )}
        </div>
      )}

      {test.status === "running" && (
        <div className="mt-3 pl-9 flex items-center gap-2">
          <span className="text-sm text-[var(--color-info)]">Running</span>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[var(--color-info)] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-[var(--color-info)] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-[var(--color-info)] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function TestPartResult({
  label,
  result,
}: {
  label: string;
  result: { passed: boolean; expected: string; actual: string };
}) {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 mb-2">
        {result.passed ? (
          <CheckCircleIcon className="w-4 h-4 text-[var(--color-success)]" />
        ) : (
          <XCircleIcon className="w-4 h-4 text-[var(--color-error)]" />
        )}
        <span
          className={`font-medium ${
            result.passed
              ? "text-[var(--color-success)]"
              : "text-[var(--color-error)]"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="ml-6 space-y-1.5">
        <div className="flex items-baseline gap-3">
          <span className="text-xs text-[var(--color-text-muted)] w-16">Expected</span>
          <code className="font-mono text-xs text-[var(--color-text-primary)]
                        bg-[var(--color-background)] px-2 py-1 rounded border border-[var(--color-border-subtle)]">
            {result.expected}
          </code>
        </div>
        {!result.passed && (
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-[var(--color-text-muted)] w-16">Actual</span>
            <code className="font-mono text-xs text-[var(--color-error)]
                          bg-[var(--color-error-glow)] px-2 py-1 rounded border border-[var(--color-error)]/30">
              {result.actual}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

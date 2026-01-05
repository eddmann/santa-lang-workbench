export interface Implementation {
  id: string;
  name: string;
  codename: string;
  version: string;
  path: string;
}

export interface Settings {
  aoc_session_token: string | null;
  default_implementation: string | null;
  theme: string;
}

export interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  assets: Asset[];
}

export interface Asset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface ExecutionEvent {
  event_type: "initial" | "patch" | "console" | "complete" | "error";
  data: unknown;
}

export type ExecutionStatus = "idle" | "running" | "complete" | "error";
export type ExecutionMode = "run" | "test" | "test-slow" | "script";

export interface PartResult {
  status: "pending" | "running" | "complete";
  value: string | null;
  duration_ms: number | null;
}

export interface TestPartResult {
  passed: boolean;
  expected: string;
  actual: string;
}

export interface TestResult {
  index: number;
  slow: boolean;
  status: "pending" | "running" | "complete";
  part_one: TestPartResult | null;
  part_two: TestPartResult | null;
}

export interface SolutionExecutionState {
  type: "solution";
  status: "pending" | "running" | "complete" | "error";
  part_one: PartResult;
  part_two: PartResult;
  error: { message: string; location?: { line: number; column: number } } | null;
}

export interface TestExecutionState {
  type: "test";
  status: "pending" | "running" | "complete" | "error";
  tests: TestResult[];
  error: { message: string; location?: { line: number; column: number } } | null;
}

export interface ScriptExecutionState {
  type: "script";
  status: "pending" | "running" | "complete" | "error";
  value: string | null;
  duration_ms: number | null;
  error: { message: string; location?: { line: number; column: number } } | null;
}

export type ExecutionState =
  | SolutionExecutionState
  | TestExecutionState
  | ScriptExecutionState
  | null;

export interface TabFile {
  id: string;
  name: string;
  path: string | null;
  content: string;
  isDirty: boolean;
}

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { applyPatch, type Operation } from "fast-json-patch";
import type {
  ExecutionState,
  ExecutionMode,
  ExecutionEvent,
  ExecutionInstance,
  Reindeer,
} from "../../lib/types";
import type { AppDispatch, RootState } from "..";

interface ExecutionSliceState {
  executions: Record<string, ExecutionInstance>;
  activeExecutionId: string | null;
  multiSelectMode: boolean;
  selectedReindeerIds: string[];
}

const initialState: ExecutionSliceState = {
  executions: {},
  activeExecutionId: null,
  multiSelectMode: false,
  selectedReindeerIds: [],
};

// Global listener for all execution events
let globalUnlistenFn: UnlistenFn | null = null;

// Set up global event listener that routes events by execution_id
const setupGlobalListener = async (dispatch: AppDispatch) => {
  if (globalUnlistenFn) return;

  globalUnlistenFn = await listen<ExecutionEvent>("execution-event", (event) => {
    const { execution_id, event_type, data } = event.payload;

    switch (event_type) {
      case "initial":
        dispatch(setInitialResult({ executionId: execution_id, result: data as ExecutionState }));
        break;
      case "patch":
        dispatch(applyResultPatch({ executionId: execution_id, patches: data as Operation[] }));
        break;
      case "console":
        dispatch(appendConsole({ executionId: execution_id, message: (data as { message: string }).message }));
        break;
      case "complete":
        dispatch(completeExecution({ executionId: execution_id, exitCode: (data as { exit_code: number }).exit_code }));
        break;
      case "error":
        dispatch(setError({ executionId: execution_id, message: (data as { message: string }).message }));
        break;
    }
  });
};

export const startExecution = createAsyncThunk<
  void,
  { implId: string; source: string; mode: ExecutionMode; workingDir?: string },
  { dispatch: AppDispatch; state: RootState }
>(
  "execution/start",
  async ({ implId, source, mode, workingDir }, { dispatch, getState }) => {
    // Get the reindeer object
    const state = getState();
    const reindeer = state.reindeer.reindeer.find(r => r.id === implId);
    if (!reindeer) {
      throw new Error("Reindeer not found");
    }

    // Generate unique execution ID
    const executionId = `${implId}_${Date.now()}`;

    // Set up global event listener if not already set up
    await setupGlobalListener(dispatch);

    // Create the execution entry BEFORE calling invoke
    // This is critical because events will arrive during the invoke call
    dispatch(createExecution({
      executionId,
      reindeer,
      mode,
    }));

    // Start the execution - events will be handled by the listener
    await invoke("run_execution", {
      executionId,
      implId,
      source,
      mode,
      workingDir,
    });
  }
);

export const startMultiExecution = createAsyncThunk<
  void,
  { reindeerIds: string[]; source: string; mode: ExecutionMode; workingDir?: string },
  { dispatch: AppDispatch }
>(
  "execution/startMulti",
  async ({ reindeerIds, source, mode, workingDir }, { dispatch }) => {
    // Dispatch startExecution for each reindeer in parallel
    const promises = reindeerIds.map(implId =>
      dispatch(startExecution({ implId, source, mode, workingDir }))
    );
    await Promise.all(promises);
  }
);

export const cancelExecution = createAsyncThunk<
  string,
  string,
  { dispatch: AppDispatch }
>(
  "execution/cancel",
  async (executionId: string) => {
    await invoke("cancel_execution", { executionId });
    return executionId;
  }
);

export const cancelAllExecutions = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>(
  "execution/cancelAll",
  async (_, { dispatch, getState }) => {
    const state = getState();
    const runningExecutions = Object.values(state.execution.executions)
      .filter(e => e.status === "running");

    await Promise.all(
      runningExecutions.map(e => dispatch(cancelExecution(e.id)))
    );
  }
);

export const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    setMultiSelectMode: (state, action: PayloadAction<boolean>) => {
      state.multiSelectMode = action.payload;
      if (!action.payload) {
        state.selectedReindeerIds = [];
      }
    },
    setSelectedReindeerIds: (state, action: PayloadAction<string[]>) => {
      state.selectedReindeerIds = action.payload;
    },
    toggleReindeerSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.selectedReindeerIds.indexOf(id);
      if (index === -1) {
        state.selectedReindeerIds.push(id);
      } else {
        state.selectedReindeerIds.splice(index, 1);
      }
    },
    setActiveExecution: (state, action: PayloadAction<string | null>) => {
      state.activeExecutionId = action.payload;
    },
    removeExecution: (state, action: PayloadAction<string>) => {
      delete state.executions[action.payload];
      if (state.activeExecutionId === action.payload) {
        const executionIds = Object.keys(state.executions);
        state.activeExecutionId = executionIds.length > 0 ? executionIds[0] : null;
      }
    },
    clearAllExecutions: (state) => {
      state.executions = {};
      state.activeExecutionId = null;
    },
    // Create execution entry - called before invoke to ensure it exists when events arrive
    createExecution: (state, action: PayloadAction<{ executionId: string; reindeer: Reindeer; mode: ExecutionMode }>) => {
      const { executionId, reindeer, mode } = action.payload;
      state.executions[executionId] = {
        id: executionId,
        reindeer,
        status: "running",
        mode,
        result: null,
        consoleOutput: [],
        exitCode: null,
        startedAt: Date.now(),
      };
      // Set as active if we don't have one or if in single mode
      if (!state.activeExecutionId || !state.multiSelectMode) {
        state.activeExecutionId = executionId;
      }
    },
    setInitialResult: (state, action: PayloadAction<{ executionId: string; result: ExecutionState }>) => {
      const { executionId, result } = action.payload;
      const execution = state.executions[executionId];
      if (!execution) return;

      // Normalize script output format from CLI
      const payload = result as unknown as Record<string, unknown>;
      if (payload?.type === "script" && "success" in payload) {
        execution.result = {
          type: "script",
          status: payload.success ? "complete" : "error",
          value: (payload.value as string) ?? null,
          duration_ms: (payload.duration_ms as number) ?? null,
          error: (payload.error as { message: string; location?: { line: number; column: number } }) ?? null,
        };
      } else {
        execution.result = result;
      }
    },
    applyResultPatch: (state, action: PayloadAction<{ executionId: string; patches: Operation[] }>) => {
      const { executionId, patches } = action.payload;
      const execution = state.executions[executionId];
      if (!execution || !execution.result) return;

      try {
        execution.result = applyPatch(
          execution.result,
          patches,
          true,
          false
        ).newDocument;
      } catch {
        // Ignore patch errors
      }
    },
    appendConsole: (state, action: PayloadAction<{ executionId: string; message: string }>) => {
      const { executionId, message } = action.payload;
      const execution = state.executions[executionId];
      if (!execution) return;
      execution.consoleOutput.push(message);
    },
    completeExecution: (state, action: PayloadAction<{ executionId: string; exitCode: number }>) => {
      const { executionId, exitCode } = action.payload;
      const execution = state.executions[executionId];
      if (!execution) return;
      execution.status = exitCode === 0 ? "complete" : "error";
      execution.exitCode = exitCode;
    },
    setError: (state, action: PayloadAction<{ executionId: string; message: string }>) => {
      const { executionId, message } = action.payload;
      const execution = state.executions[executionId];
      if (!execution) return;
      execution.status = "error";
      execution.consoleOutput.push(`Error: ${message}`);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startExecution.rejected, (state, action) => {
        // Find and update the execution that failed (if it exists)
        // The executionId was created in the thunk before invoke was called
        const implId = action.meta.arg.implId;
        const failedExecution = Object.values(state.executions).find(
          e => e.reindeer.id === implId && e.status === "running"
        );
        if (failedExecution) {
          failedExecution.status = "error";
          failedExecution.consoleOutput.push(`Error: ${action.error.message}`);
        }
      })
      .addCase(cancelExecution.fulfilled, (state, action) => {
        const execution = state.executions[action.payload];
        if (execution) {
          execution.status = "idle";
        }
      });
  },
});

export const {
  setMultiSelectMode,
  setSelectedReindeerIds,
  toggleReindeerSelection,
  setActiveExecution,
  removeExecution,
  clearAllExecutions,
  createExecution,
  setInitialResult,
  applyResultPatch,
  appendConsole,
  completeExecution,
  setError,
} = executionSlice.actions;

export default executionSlice.reducer;

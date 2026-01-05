import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { applyPatch, type Operation } from "fast-json-patch";
import type {
  ExecutionState,
  ExecutionStatus,
  ExecutionMode,
  ExecutionEvent,
} from "../../lib/types";
import type { AppDispatch } from "..";

interface ExecutionSliceState {
  status: ExecutionStatus;
  mode: ExecutionMode | null;
  result: ExecutionState;
  consoleOutput: string[];
  exitCode: number | null;
}

const initialState: ExecutionSliceState = {
  status: "idle",
  mode: null,
  result: null,
  consoleOutput: [],
  exitCode: null,
};

let unlistenFn: UnlistenFn | null = null;

export const startExecution = createAsyncThunk<
  void,
  { implId: string; source: string; mode: ExecutionMode; workingDir?: string },
  { dispatch: AppDispatch }
>(
  "execution/start",
  async ({ implId, source, mode, workingDir }, { dispatch }) => {
    // Set up event listener
    if (unlistenFn) {
      unlistenFn();
    }

    unlistenFn = await listen<ExecutionEvent>("execution-event", (event) => {
      const { event_type, data } = event.payload;

      switch (event_type) {
        case "initial":
          dispatch(setInitialResult(data as ExecutionState));
          break;
        case "patch":
          dispatch(applyResultPatch(data as Operation[]));
          break;
        case "console":
          dispatch(appendConsole((data as { message: string }).message));
          break;
        case "complete":
          dispatch(completeExecution((data as { exit_code: number }).exit_code));
          if (unlistenFn) {
            unlistenFn();
            unlistenFn = null;
          }
          break;
        case "error":
          dispatch(setError((data as { message: string }).message));
          if (unlistenFn) {
            unlistenFn();
            unlistenFn = null;
          }
          break;
      }
    });

    // Start the execution
    await invoke("run_execution", {
      implId,
      source,
      mode,
      workingDir,
    });
  }
);

export const cancelExecution = createAsyncThunk(
  "execution/cancel",
  async (implId: string) => {
    await invoke("cancel_execution", { implId });
    if (unlistenFn) {
      unlistenFn();
      unlistenFn = null;
    }
  }
);

export const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    resetExecution: (state) => {
      state.status = "idle";
      state.mode = null;
      state.result = null;
      state.consoleOutput = [];
      state.exitCode = null;
    },
    setInitialResult: (state, action: PayloadAction<ExecutionState>) => {
      state.result = action.payload;
    },
    applyResultPatch: (state, action: PayloadAction<Operation[]>) => {
      if (state.result) {
        try {
          state.result = applyPatch(
            state.result,
            action.payload,
            true,
            false
          ).newDocument;
        } catch {
          // Ignore patch errors
        }
      }
    },
    appendConsole: (state, action: PayloadAction<string>) => {
      state.consoleOutput.push(action.payload);
    },
    completeExecution: (state, action: PayloadAction<number>) => {
      state.status = action.payload === 0 ? "complete" : "error";
      state.exitCode = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = "error";
      state.consoleOutput.push(`Error: ${action.payload}`);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startExecution.pending, (state, action) => {
        state.status = "running";
        state.mode = action.meta.arg.mode;
        state.result = null;
        state.consoleOutput = [];
        state.exitCode = null;
      })
      .addCase(startExecution.rejected, (state, action) => {
        state.status = "error";
        state.consoleOutput.push(`Error: ${action.error.message}`);
      })
      .addCase(cancelExecution.fulfilled, (state) => {
        state.status = "idle";
      });
  },
});

export const {
  resetExecution,
  setInitialResult,
  applyResultPatch,
  appendConsole,
  completeExecution,
  setError,
} = executionSlice.actions;

export default executionSlice.reducer;

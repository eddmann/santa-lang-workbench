import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import type { AocPuzzle } from "../../lib/types";
import { aocCacheKey, type AocReference } from "../../lib/aoc-utils";

interface AocState {
  puzzles: Record<string, AocPuzzle>;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  currentReference: AocReference | null;
  panelVisible: boolean;
}

const initialState: AocState = {
  puzzles: {},
  loading: {},
  errors: {},
  currentReference: null,
  panelVisible: true,
};

export const fetchAocPuzzle = createAsyncThunk(
  "aoc/fetchPuzzle",
  async ({ year, day }: AocReference, { getState, rejectWithValue }) => {
    const state = getState() as { aoc: AocState };
    const key = aocCacheKey(year, day);

    // Return cached if available
    if (state.aoc.puzzles[key]) {
      return state.aoc.puzzles[key];
    }

    try {
      const puzzle = await invoke<AocPuzzle>("fetch_aoc_puzzle", { year, day });
      return puzzle;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
);

export const aocSlice = createSlice({
  name: "aoc",
  initialState,
  reducers: {
    setCurrentReference: (
      state,
      action: PayloadAction<AocReference | null>
    ) => {
      state.currentReference = action.payload;
    },
    togglePanelVisible: (state) => {
      state.panelVisible = !state.panelVisible;
    },
    setPanelVisible: (state, action: PayloadAction<boolean>) => {
      state.panelVisible = action.payload;
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAocPuzzle.pending, (state, action) => {
        const { year, day } = action.meta.arg;
        const key = aocCacheKey(year, day);
        state.loading[key] = true;
        delete state.errors[key];
      })
      .addCase(fetchAocPuzzle.fulfilled, (state, action) => {
        const puzzle = action.payload;
        const key = aocCacheKey(puzzle.year, puzzle.day);
        state.puzzles[key] = puzzle;
        state.loading[key] = false;
      })
      .addCase(fetchAocPuzzle.rejected, (state, action) => {
        const { year, day } = action.meta.arg;
        const key = aocCacheKey(year, day);
        state.loading[key] = false;
        state.errors[key] = action.payload as string;
      });
  },
});

export const {
  setCurrentReference,
  togglePanelVisible,
  setPanelVisible,
  clearError,
} = aocSlice.actions;

export default aocSlice.reducer;

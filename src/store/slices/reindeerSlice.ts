import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import type { Reindeer, Release } from "../../lib/types";

interface ReindeerState {
  reindeer: Reindeer[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  releases: Record<string, Release[]>;
  releasesLoading: Record<string, boolean>;
}

const initialState: ReindeerState = {
  reindeer: [],
  selectedId: null,
  isLoading: false,
  error: null,
  releases: {},
  releasesLoading: {},
};

export const loadReindeer = createAsyncThunk(
  "reindeer/load",
  async () => {
    const reindeer = await invoke<Reindeer[]>("get_reindeer");
    return reindeer;
  }
);

export const addReindeer = createAsyncThunk(
  "reindeer/add",
  async (path: string) => {
    const reindeer = await invoke<Reindeer>("add_reindeer", {
      path,
    });
    return reindeer;
  }
);

export const removeReindeer = createAsyncThunk(
  "reindeer/remove",
  async (id: string) => {
    await invoke("remove_reindeer", { id });
    return id;
  }
);

export const fetchReleases = createAsyncThunk(
  "reindeer/fetchReleases",
  async (codename: string) => {
    const releases = await invoke<Release[]>("get_github_releases", { codename });
    return { codename, releases };
  }
);

export const downloadReindeer = createAsyncThunk(
  "reindeer/download",
  async ({
    codename,
    assetUrl,
    assetName,
  }: {
    codename: string;
    assetUrl: string;
    assetName: string;
  }) => {
    const path = await invoke<string>("download_reindeer", {
      codename,
      assetUrl,
      assetName,
    });
    const reindeer = await invoke<Reindeer>("add_reindeer", {
      path,
    });
    return reindeer;
  }
);

export const reindeerSlice = createSlice({
  name: "reindeer",
  initialState,
  reducers: {
    selectReindeer: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadReindeer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadReindeer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reindeer = action.payload;
        if (action.payload.length > 0 && !state.selectedId) {
          state.selectedId = action.payload[0].id;
        }
      })
      .addCase(loadReindeer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to load reindeer";
      })
      .addCase(addReindeer.fulfilled, (state, action) => {
        state.reindeer.push(action.payload);
        if (!state.selectedId) {
          state.selectedId = action.payload.id;
        }
      })
      .addCase(removeReindeer.fulfilled, (state, action) => {
        state.reindeer = state.reindeer.filter(
          (i) => i.id !== action.payload
        );
        if (state.selectedId === action.payload) {
          state.selectedId = state.reindeer[0]?.id || null;
        }
      })
      .addCase(fetchReleases.pending, (state, action) => {
        state.releasesLoading[action.meta.arg] = true;
      })
      .addCase(fetchReleases.fulfilled, (state, action) => {
        state.releasesLoading[action.payload.codename] = false;
        state.releases[action.payload.codename] = action.payload.releases;
      })
      .addCase(fetchReleases.rejected, (state, action) => {
        state.releasesLoading[action.meta.arg] = false;
      })
      .addCase(downloadReindeer.fulfilled, (state, action) => {
        state.reindeer.push(action.payload);
        if (!state.selectedId) {
          state.selectedId = action.payload.id;
        }
      });
  },
});

export const { selectReindeer } = reindeerSlice.actions;

export default reindeerSlice.reducer;

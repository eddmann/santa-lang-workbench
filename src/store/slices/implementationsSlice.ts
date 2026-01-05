import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import type { Implementation, Release } from "../../lib/types";

interface ImplementationsState {
  implementations: Implementation[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  releases: Record<string, Release[]>;
  releasesLoading: Record<string, boolean>;
}

const initialState: ImplementationsState = {
  implementations: [],
  selectedId: null,
  isLoading: false,
  error: null,
  releases: {},
  releasesLoading: {},
};

export const loadImplementations = createAsyncThunk(
  "implementations/load",
  async () => {
    const implementations = await invoke<Implementation[]>("get_implementations");
    return implementations;
  }
);

export const addImplementation = createAsyncThunk(
  "implementations/add",
  async (path: string) => {
    const implementation = await invoke<Implementation>("add_implementation", {
      path,
    });
    return implementation;
  }
);

export const removeImplementation = createAsyncThunk(
  "implementations/remove",
  async (id: string) => {
    await invoke("remove_implementation", { id });
    return id;
  }
);

export const fetchReleases = createAsyncThunk(
  "implementations/fetchReleases",
  async (codename: string) => {
    const releases = await invoke<Release[]>("get_github_releases", { codename });
    return { codename, releases };
  }
);

export const downloadImplementation = createAsyncThunk(
  "implementations/download",
  async ({
    codename,
    assetUrl,
    assetName,
  }: {
    codename: string;
    assetUrl: string;
    assetName: string;
  }) => {
    const path = await invoke<string>("download_implementation", {
      codename,
      assetUrl,
      assetName,
    });
    const implementation = await invoke<Implementation>("add_implementation", {
      path,
    });
    return implementation;
  }
);

export const implementationsSlice = createSlice({
  name: "implementations",
  initialState,
  reducers: {
    selectImplementation: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadImplementations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadImplementations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.implementations = action.payload;
        if (action.payload.length > 0 && !state.selectedId) {
          state.selectedId = action.payload[0].id;
        }
      })
      .addCase(loadImplementations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to load implementations";
      })
      .addCase(addImplementation.fulfilled, (state, action) => {
        state.implementations.push(action.payload);
        if (!state.selectedId) {
          state.selectedId = action.payload.id;
        }
      })
      .addCase(removeImplementation.fulfilled, (state, action) => {
        state.implementations = state.implementations.filter(
          (i) => i.id !== action.payload
        );
        if (state.selectedId === action.payload) {
          state.selectedId = state.implementations[0]?.id || null;
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
      .addCase(downloadImplementation.fulfilled, (state, action) => {
        state.implementations.push(action.payload);
        if (!state.selectedId) {
          state.selectedId = action.payload.id;
        }
      });
  },
});

export const { selectImplementation } = implementationsSlice.actions;

export default implementationsSlice.reducer;

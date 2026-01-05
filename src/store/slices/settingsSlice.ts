import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import type { Settings } from "../../lib/types";

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  isModalOpen: boolean;
}

const initialState: SettingsState = {
  settings: {
    aoc_session_token: null,
    default_implementation: null,
    theme: "dark",
  },
  isLoading: false,
  isModalOpen: false,
};

export const loadSettings = createAsyncThunk("settings/load", async () => {
  const settings = await invoke<Settings>("get_settings");
  return settings;
});

export const saveSettings = createAsyncThunk(
  "settings/save",
  async (settings: Settings) => {
    await invoke("save_settings", { settings });
    return settings;
  }
);

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    openSettingsModal: (state) => {
      state.isModalOpen = true;
    },
    closeSettingsModal: (state) => {
      state.isModalOpen = false;
    },
    updateSetting: <K extends keyof Settings>(
      state: SettingsState,
      action: PayloadAction<{ key: K; value: Settings[K] }>
    ) => {
      state.settings[action.payload.key] = action.payload.value;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(loadSettings.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { openSettingsModal, closeSettingsModal, updateSetting } =
  settingsSlice.actions;

export default settingsSlice.reducer;

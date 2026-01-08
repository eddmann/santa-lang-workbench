import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import type {
  FormatterStatus,
  FormatResult,
  FormatError,
  Release,
} from "../../lib/types";

interface FormatterState {
  status: FormatterStatus | null;
  isLoading: boolean;
  isFormatting: boolean;
  isDownloading: boolean;
  isCheckingUpdate: boolean;
  releases: Release[];
  releasesLoading: boolean;
  error: FormatError | null;
}

const initialState: FormatterState = {
  status: null,
  isLoading: false,
  isFormatting: false,
  isDownloading: false,
  isCheckingUpdate: false,
  releases: [],
  releasesLoading: false,
  error: null,
};

export const checkFormatterStatus = createAsyncThunk(
  "formatter/checkStatus",
  async () => {
    const status = await invoke<FormatterStatus>("get_formatter_status");
    return status;
  }
);

export const checkFormatterUpdate = createAsyncThunk(
  "formatter/checkUpdate",
  async () => {
    const status = await invoke<FormatterStatus>("check_formatter_update");
    return status;
  }
);

export const fetchFormatterReleases = createAsyncThunk(
  "formatter/fetchReleases",
  async () => {
    const releases = await invoke<Release[]>("fetch_formatter_releases");
    return releases;
  }
);

export const downloadFormatter = createAsyncThunk(
  "formatter/download",
  async ({
    assetUrl,
    assetName,
  }: {
    assetUrl: string;
    assetName: string;
  }) => {
    const path = await invoke<string>("download_formatter", {
      assetUrl,
      assetName,
    });
    // Re-check status to get version
    const status = await invoke<FormatterStatus>("get_formatter_status");
    return { path, status };
  }
);

export const formatCode = createAsyncThunk(
  "formatter/format",
  async (source: string) => {
    const result = await invoke<FormatResult>("format_code", { source });
    return result;
  }
);

export const formatterSlice = createSlice({
  name: "formatter",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFormatError: (state, action: PayloadAction<FormatError | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check status
      .addCase(checkFormatterStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkFormatterStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = action.payload;
      })
      .addCase(checkFormatterStatus.rejected, (state) => {
        state.isLoading = false;
        state.status = {
          installed: false,
          path: null,
          version: null,
          latest_version: null,
          has_update: false,
        };
      })
      // Check update
      .addCase(checkFormatterUpdate.pending, (state) => {
        state.isCheckingUpdate = true;
      })
      .addCase(checkFormatterUpdate.fulfilled, (state, action) => {
        state.isCheckingUpdate = false;
        state.status = action.payload;
      })
      .addCase(checkFormatterUpdate.rejected, (state) => {
        state.isCheckingUpdate = false;
      })
      // Fetch releases
      .addCase(fetchFormatterReleases.pending, (state) => {
        state.releasesLoading = true;
      })
      .addCase(fetchFormatterReleases.fulfilled, (state, action) => {
        state.releasesLoading = false;
        state.releases = action.payload;
      })
      .addCase(fetchFormatterReleases.rejected, (state) => {
        state.releasesLoading = false;
      })
      // Download
      .addCase(downloadFormatter.pending, (state) => {
        state.isDownloading = true;
      })
      .addCase(downloadFormatter.fulfilled, (state, action) => {
        state.isDownloading = false;
        state.status = action.payload.status;
      })
      .addCase(downloadFormatter.rejected, (state) => {
        state.isDownloading = false;
      })
      // Format
      .addCase(formatCode.pending, (state) => {
        state.isFormatting = true;
        state.error = null;
      })
      .addCase(formatCode.fulfilled, (state, action) => {
        state.isFormatting = false;
        if (!action.payload.success && action.payload.error) {
          state.error = action.payload.error;
        }
      })
      .addCase(formatCode.rejected, (state, action) => {
        state.isFormatting = false;
        state.error = {
          message: action.error.message || "Formatting failed",
        };
      });
  },
});

export const {
  clearError,
  setFormatError,
} = formatterSlice.actions;

export default formatterSlice.reducer;

import { createSlice, nanoid } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { TabFile } from "../../lib/types";

const DEFAULT_CONTENT = `input: "Hello, World!"

part_one: {
  input |> size
}

part_two: {
  input |> lines |> size
}

test: {
  input: "Hello"
  part_one: 5
}
`;

interface TabsState {
  tabs: TabFile[];
  activeTabId: string | null;
}

const initialTab: TabFile = {
  id: nanoid(),
  name: "untitled.santa",
  path: null,
  content: DEFAULT_CONTENT,
  isDirty: false,
};

const initialState: TabsState = {
  tabs: [initialTab],
  activeTabId: initialTab.id,
};

export const tabsSlice = createSlice({
  name: "tabs",
  initialState,
  reducers: {
    addTab: (
      state,
      action: PayloadAction<{ name?: string; path?: string; content?: string }>
    ) => {
      const newTab: TabFile = {
        id: nanoid(),
        name: action.payload.name || "untitled.santa",
        path: action.payload.path || null,
        content: action.payload.content || DEFAULT_CONTENT,
        isDirty: false,
      };
      state.tabs.push(newTab);
      state.activeTabId = newTab.id;
    },
    closeTab: (state, action: PayloadAction<string>) => {
      const index = state.tabs.findIndex((t) => t.id === action.payload);
      if (index !== -1) {
        state.tabs.splice(index, 1);
        if (state.activeTabId === action.payload) {
          state.activeTabId =
            state.tabs[Math.min(index, state.tabs.length - 1)]?.id || null;
        }
      }
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    updateTabContent: (
      state,
      action: PayloadAction<{ id: string; content: string }>
    ) => {
      const tab = state.tabs.find((t) => t.id === action.payload.id);
      if (tab) {
        tab.content = action.payload.content;
        tab.isDirty = true;
      }
    },
    saveTab: (
      state,
      action: PayloadAction<{ id: string; path?: string; name?: string }>
    ) => {
      const tab = state.tabs.find((t) => t.id === action.payload.id);
      if (tab) {
        if (action.payload.path) {
          tab.path = action.payload.path;
        }
        if (action.payload.name) {
          tab.name = action.payload.name;
        }
        tab.isDirty = false;
      }
    },
    renameTab: (
      state,
      action: PayloadAction<{ id: string; name: string; path: string }>
    ) => {
      const tab = state.tabs.find((t) => t.id === action.payload.id);
      if (tab) {
        tab.name = action.payload.name;
        tab.path = action.payload.path;
      }
    },
  },
});

export const {
  addTab,
  closeTab,
  setActiveTab,
  updateTabContent,
  saveTab,
  renameTab,
} = tabsSlice.actions;

export default tabsSlice.reducer;

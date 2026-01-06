import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import tabsReducer from "./slices/tabsSlice";
import reindeerReducer from "./slices/reindeerSlice";
import executionReducer from "./slices/executionSlice";
import settingsReducer from "./slices/settingsSlice";

export const store = configureStore({
  reducer: {
    tabs: tabsReducer,
    reindeer: reindeerReducer,
    execution: executionReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

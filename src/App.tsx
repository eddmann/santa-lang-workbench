import { useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch, useAppSelector } from "./store";
import { loadReindeer } from "./store/slices/reindeerSlice";
import { loadSettings } from "./store/slices/settingsSlice";
import { Toolbar } from "./components/Toolbar";
import { EditorTabs } from "./components/EditorTabs";
import { Editor } from "./components/Editor";
import { OutputPanel } from "./components/OutputPanel";
import { SettingsModal } from "./components/SettingsModal";
import { StatusBar } from "./components/StatusBar";
import { getTheme, applyTheme } from "./lib/themes";
import { useMenuEvents } from "./hooks/useMenuEvents";

function AppContent() {
  const dispatch = useAppDispatch();
  const { settings } = useAppSelector((state) => state.settings);

  useEffect(() => {
    dispatch(loadReindeer());
    dispatch(loadSettings());
  }, [dispatch]);

  // Apply theme when settings change
  useEffect(() => {
    const theme = getTheme(settings.theme);
    applyTheme(theme);
  }, [settings.theme]);

  // Handle native menu events
  useMenuEvents();

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)]">
      <Toolbar />
      <EditorTabs />
      <div className="flex-1 flex min-h-0">
        {/* Editor Panel */}
        <div className="flex-1 min-w-0 border-r border-[var(--color-border)]">
          <Editor />
        </div>
        {/* Output Panel */}
        <div className="w-[400px] min-w-[300px] max-w-[600px] bg-[var(--color-background)]">
          <OutputPanel />
        </div>
      </div>
      <StatusBar />
      <SettingsModal />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;

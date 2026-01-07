import { useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { Group, Panel, Separator } from "react-resizable-panels";
import { store, useAppDispatch, useAppSelector } from "./store";
import { loadReindeer } from "./store/slices/reindeerSlice";
import { loadSettings } from "./store/slices/settingsSlice";
import { checkFormatterStatus } from "./store/slices/formatterSlice";
import { Toolbar } from "./components/Toolbar";
import { EditorTabs } from "./components/EditorTabs";
import { Editor } from "./components/Editor";
import { SplitOutputPanel } from "./components/SplitOutputPanel";
import { SettingsModal } from "./components/SettingsModal";
import { FormatterDownloadModal } from "./components/FormatterDownloadModal";
import { StatusBar } from "./components/StatusBar";
import { getTheme, applyTheme } from "./lib/themes";
import { useMenuEvents } from "./hooks/useMenuEvents";
import { useAocDetection } from "./hooks/useAocDetection";

function AppContent() {
  const dispatch = useAppDispatch();
  const { settings } = useAppSelector((state) => state.settings);
  const { executions, multiSelectMode } = useAppSelector((state) => state.execution);

  // Determine if we should show multi-output mode
  const executionCount = useMemo(() => {
    return Object.values(executions).filter((e) => !e.id.startsWith("pending_")).length;
  }, [executions]);

  const showMultiOutput = multiSelectMode || executionCount > 1;

  useEffect(() => {
    dispatch(loadReindeer());
    dispatch(loadSettings());
    dispatch(checkFormatterStatus());
  }, [dispatch]);

  // Apply theme when settings change
  useEffect(() => {
    const theme = getTheme(settings.theme);
    applyTheme(theme);
  }, [settings.theme]);

  // Handle native menu events
  useMenuEvents();

  // Detect AoC references in source code
  useAocDetection();

  // Get the first execution for single-output mode
  const singleExecution = useMemo(() => {
    const execs = Object.values(executions).filter((e) => !e.id.startsWith("pending_"));
    return execs.length > 0 ? execs[0] : null;
  }, [executions]);

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)]">
      <Toolbar />
      <EditorTabs />
      <Group orientation="horizontal" style={{ flex: 1, minHeight: 0 }}>
        {/* Editor Panel */}
        <Panel minSize="200px">
          <div className="h-full min-w-0">
            <Editor />
          </div>
        </Panel>
        <Separator className="resize-handle" />
        {/* Output Panel */}
        <Panel defaultSize="400px" minSize="300px" maxSize="900px">
          <SplitOutputPanel
            singleExecution={singleExecution}
            showMultiOutput={showMultiOutput}
          />
        </Panel>
      </Group>
      <StatusBar />
      <SettingsModal />
      <FormatterDownloadModal />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          },
        }}
      />
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

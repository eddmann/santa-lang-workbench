import { useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "./store";
import { loadImplementations } from "./store/slices/implementationsSlice";
import { loadSettings } from "./store/slices/settingsSlice";
import { Toolbar } from "./components/Toolbar";
import { EditorTabs } from "./components/EditorTabs";
import { Editor } from "./components/Editor";
import { OutputPanel } from "./components/OutputPanel";
import { SettingsModal } from "./components/SettingsModal";
import { StatusBar } from "./components/StatusBar";

function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadImplementations());
    dispatch(loadSettings());
  }, [dispatch]);

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

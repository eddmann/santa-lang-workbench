import MonacoEditor from "@monaco-editor/react";
import { useAppDispatch, useAppSelector } from "../store";
import { updateTabContent } from "../store/slices/tabsSlice";
import { startExecution } from "../store/slices/executionSlice";
import type { editor } from "monaco-editor";
import { useRef, useCallback } from "react";

export function Editor() {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId } = useAppSelector((state) => state.tabs);
  const { selectedId } = useAppSelector((state) => state.implementations);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
      editorRef.current = editor;

      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (activeTab && selectedId) {
          dispatch(
            startExecution({
              implId: selectedId,
              source: editor.getValue(),
              mode: "run",
              workingDir: activeTab.path
                ? activeTab.path.substring(0, activeTab.path.lastIndexOf("/"))
                : undefined,
            })
          );
        }
      });

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        () => {
          if (activeTab && selectedId) {
            dispatch(
              startExecution({
                implId: selectedId,
                source: editor.getValue(),
                mode: "test",
                workingDir: activeTab.path
                  ? activeTab.path.substring(0, activeTab.path.lastIndexOf("/"))
                  : undefined,
              })
            );
          }
        }
      );
    },
    [activeTab, selectedId, dispatch]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        dispatch(updateTabContent({ id: activeTabId, content: value }));
      }
    },
    [activeTabId, dispatch]
  );

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)]">
        No file open. Press the + button to create a new file.
      </div>
    );
  }

  return (
    <MonacoEditor
      height="100%"
      language="rust"
      theme="vs-dark"
      value={activeTab.content}
      onChange={handleChange}
      onMount={handleEditorMount}
      options={{
        fontSize: 14,
        fontFamily: "var(--font-mono)",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        lineNumbers: "on",
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        smoothScrolling: true,
        padding: { top: 16 },
      }}
    />
  );
}

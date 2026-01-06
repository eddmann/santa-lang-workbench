import MonacoEditor from "@monaco-editor/react";
import { useAppDispatch, useAppSelector } from "../store";
import { updateTabContent } from "../store/slices/tabsSlice";
import { startExecution, resetExecution } from "../store/slices/executionSlice";
import { openDownloadModal, formatCode } from "../store/slices/formatterSlice";
import type { editor } from "monaco-editor";
import { useRef, useCallback, useEffect } from "react";
import type { FormatterStatus } from "../lib/types";

export function Editor() {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId } = useAppSelector((state) => state.tabs);
  const { selectedId } = useAppSelector((state) => state.reindeer);
  const { status: formatterStatus } = useAppSelector((state) => state.formatter);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Use refs to store latest values for keyboard shortcuts
  // This prevents stale closure issues since Monaco commands are only registered once
  const activeTabRef = useRef(activeTab);
  const selectedIdRef = useRef(selectedId);
  const formatterStatusRef = useRef<FormatterStatus | null>(formatterStatus);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    formatterStatusRef.current = formatterStatus;
  }, [formatterStatus]);

  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
      editorRef.current = editor;

      // Run command (Cmd+Enter)
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        const tab = activeTabRef.current;
        const implId = selectedIdRef.current;
        if (tab && implId) {
          dispatch(resetExecution());
          dispatch(
            startExecution({
              implId,
              source: editor.getValue(),
              mode: "run",
              workingDir: tab.path
                ? tab.path.substring(0, tab.path.lastIndexOf("/"))
                : undefined,
            })
          );
        }
      });

      // Test command (Cmd+Shift+Enter)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        () => {
          const tab = activeTabRef.current;
          const implId = selectedIdRef.current;
          if (tab && implId) {
            dispatch(resetExecution());
            dispatch(
              startExecution({
                implId,
                source: editor.getValue(),
                mode: "test",
                workingDir: tab.path
                  ? tab.path.substring(0, tab.path.lastIndexOf("/"))
                  : undefined,
              })
            );
          }
        }
      );

      // Format command (Cmd+Shift+F)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        async () => {
          const tab = activeTabRef.current;
          const status = formatterStatusRef.current;
          if (!tab) return;

          if (!status?.installed) {
            dispatch(openDownloadModal());
          } else {
            const result = await dispatch(formatCode(editor.getValue())).unwrap();
            if (result.success && result.formatted) {
              // Preserve cursor position
              const position = editor.getPosition();
              editor.setValue(result.formatted);
              if (position) {
                editor.setPosition(position);
              }
              dispatch(updateTabContent({ id: tab.id, content: result.formatted }));
            }
          }
        }
      );
    },
    [dispatch]
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

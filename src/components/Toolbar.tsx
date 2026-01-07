import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  startExecution,
  startMultiExecution,
  cancelAllExecutions,
  clearExecutionsForTab,
  setMultiSelectMode,
} from "../store/slices/executionSlice";
import { selectReindeer } from "../store/slices/reindeerSlice";
import { openSettingsModal } from "../store/slices/settingsSlice";
import { addTab, saveTab, updateTabContent } from "../store/slices/tabsSlice";
import {
  openDownloadModal,
  formatCode,
} from "../store/slices/formatterSlice";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  PlayIcon,
  BeakerIcon,
  StopIcon,
  FolderOpenIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  CodeBracketIcon,
  Squares2X2Icon,
} from "@heroicons/react/20/solid";
import { toast } from "sonner";
import { ReindeerMultiSelect } from "./ReindeerMultiSelect";

export function Toolbar() {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId } = useAppSelector((state) => state.tabs);
  const { reindeer, selectedId } = useAppSelector(
    (state) => state.reindeer
  );
  const { executions, multiSelectMode, selectedReindeerIds } = useAppSelector(
    (state) => state.execution
  );
  const { status: formatterStatus, isFormatting } = useAppSelector(
    (state) => state.formatter
  );
  const { format_on_save } = useAppSelector((state) => state.settings.settings);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Check if any execution is running
  const hasRunningExecution = Object.values(executions).some(
    (e) => e.status === "running"
  );

  // Derive selected reindeer and available codenames/versions
  const selectedR = reindeer.find((r) => r.id === selectedId);
  const selectedCodename = selectedR?.codename || null;

  // Group reindeer by codename
  const reindeerByCodename = useMemo(() => {
    const grouped: Record<string, typeof reindeer> = {};
    for (const r of reindeer) {
      if (!grouped[r.codename]) {
        grouped[r.codename] = [];
      }
      grouped[r.codename].push(r);
    }
    return grouped;
  }, [reindeer]);

  const codenames = Object.keys(reindeerByCodename);
  const versionsForCodename = selectedCodename ? reindeerByCodename[selectedCodename] || [] : [];

  const handleCodenameChange = (codename: string) => {
    // Select the first version for this codename
    const firstR = reindeerByCodename[codename]?.[0];
    if (firstR) {
      dispatch(selectReindeer(firstR.id));
    }
  };

  const handleRun = () => {
    if (!activeTab) return;

    if (multiSelectMode) {
      if (selectedReindeerIds.length === 0) {
        toast.error("No reindeer selected", {
          description: "Select at least one reindeer to run.",
        });
        return;
      }
      dispatch(clearExecutionsForTab(activeTab.id));
      dispatch(
        startMultiExecution({
          reindeerIds: selectedReindeerIds,
          source: activeTab.content,
          mode: "run",
          workingDir: activeTab.path
            ? activeTab.path.substring(0, activeTab.path.lastIndexOf("/"))
            : undefined,
          tabId: activeTab.id,
        })
      );
    } else {
      if (!selectedId) return;
      dispatch(clearExecutionsForTab(activeTab.id));
      dispatch(
        startExecution({
          implId: selectedId,
          source: activeTab.content,
          mode: "run",
          workingDir: activeTab.path
            ? activeTab.path.substring(0, activeTab.path.lastIndexOf("/"))
            : undefined,
          tabId: activeTab.id,
        })
      );
    }
  };

  const handleTest = () => {
    if (!activeTab) return;

    if (multiSelectMode) {
      if (selectedReindeerIds.length === 0) {
        toast.error("No reindeer selected", {
          description: "Select at least one reindeer to test.",
        });
        return;
      }
      dispatch(clearExecutionsForTab(activeTab.id));
      dispatch(
        startMultiExecution({
          reindeerIds: selectedReindeerIds,
          source: activeTab.content,
          mode: "test",
          workingDir: activeTab.path
            ? activeTab.path.substring(0, activeTab.path.lastIndexOf("/"))
            : undefined,
          tabId: activeTab.id,
        })
      );
    } else {
      if (!selectedId) return;
      dispatch(clearExecutionsForTab(activeTab.id));
      dispatch(
        startExecution({
          implId: selectedId,
          source: activeTab.content,
          mode: "test",
          workingDir: activeTab.path
            ? activeTab.path.substring(0, activeTab.path.lastIndexOf("/"))
            : undefined,
          tabId: activeTab.id,
        })
      );
    }
  };

  const handleStop = () => {
    dispatch(cancelAllExecutions());
  };

  const handleOpen = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Santa Lang", extensions: ["santa"] }],
    });

    if (selected) {
      const content = await readTextFile(selected);
      const name = selected.split("/").pop() || "untitled.santa";
      dispatch(addTab({ name, path: selected, content }));
    }
  };

  const handleFormat = async () => {
    if (!activeTab) return;

    if (!formatterStatus?.installed) {
      dispatch(openDownloadModal());
      return;
    }

    const result = await dispatch(formatCode(activeTab.content)).unwrap();
    if (result.success && result.formatted) {
      dispatch(updateTabContent({ id: activeTab.id, content: result.formatted }));
    }
  };

  const handleSave = async () => {
    if (!activeTab) return;

    let contentToSave = activeTab.content;

    // Format on save if enabled
    if (format_on_save) {
      if (!formatterStatus?.installed) {
        toast.warning("Format on save skipped", {
          description: "Formatter not installed. Click Format to download.",
        });
      } else {
        const result = await dispatch(formatCode(activeTab.content)).unwrap();
        if (result.success && result.formatted) {
          contentToSave = result.formatted;
          dispatch(updateTabContent({ id: activeTab.id, content: result.formatted }));
        }
      }
    }

    let path = activeTab.path;

    if (!path) {
      const selected = await save({
        filters: [{ name: "Santa Lang", extensions: ["santa"] }],
        defaultPath: activeTab.name,
      });

      if (!selected) return;
      path = selected;
    }

    await writeTextFile(path, contentToSave);
    const name = path.split("/").pop() || activeTab.name;
    dispatch(saveTab({ id: activeTab.id, path, name }));
  };

  const handleToggleMultiMode = () => {
    dispatch(setMultiSelectMode(!multiSelectMode));
  };

  // Determine if run/test buttons should be disabled
  const canRun = multiSelectMode
    ? activeTab && selectedReindeerIds.length > 0
    : activeTab && selectedId;

  return (
    <div className="flex items-center justify-between h-12 px-3 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]">
      {/* Left section - Primary actions */}
      <div className="flex items-center gap-1.5">
        {/* Run/Stop Button - Primary CTA */}
        {hasRunningExecution ? (
          <button
            onClick={handleStop}
            className="group relative flex items-center gap-2 h-8 px-4 rounded-md font-medium text-sm
                       bg-[var(--color-error)] text-white
                       shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.2)]
                       hover:brightness-110 active:brightness-95
                       transition-all duration-150"
          >
            <StopIcon className="w-4 h-4" />
            <span>Stop</span>
            <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          </button>
        ) : (
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="group relative flex items-center gap-2 h-8 px-4 rounded-md font-medium text-sm
                       bg-[var(--color-accent)] text-[#0f1419]
                       shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.2),var(--shadow-glow-accent)]
                       hover:brightness-110 active:brightness-95
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                       transition-all duration-150"
          >
            <PlayIcon className="w-4 h-4" />
            <span>{multiSelectMode ? "Run All" : "Run"}</span>
            <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
          </button>
        )}

        {/* Test Button - Secondary */}
        <button
          onClick={handleTest}
          disabled={!canRun || hasRunningExecution}
          className="group relative flex items-center gap-2 h-8 px-3.5 rounded-md font-medium text-sm
                     bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]
                     border border-[var(--color-border)]
                     hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-150"
        >
          <BeakerIcon className="w-4 h-4" />
          <span>{multiSelectMode ? "Test All" : "Test"}</span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)] mx-2" />

        {/* Multi-select toggle */}
        <button
          onClick={handleToggleMultiMode}
          className={`flex items-center justify-center w-8 h-8 rounded-md
                     transition-colors duration-150
                     ${multiSelectMode
                       ? "bg-[var(--color-accent)] text-[#0f1419]"
                       : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]"
                     }`}
          title={multiSelectMode ? "Switch to single mode" : "Switch to multi-compare mode"}
        >
          <Squares2X2Icon className="w-4 h-4" />
        </button>

        {/* Reindeer Selector */}
        {multiSelectMode ? (
          <ReindeerMultiSelect />
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Codename selector */}
            <div className="relative">
              <select
                value={selectedCodename || ""}
                onChange={(e) => handleCodenameChange(e.target.value)}
                className="appearance-none h-8 pl-3 pr-7 rounded-md text-sm font-medium
                           bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]
                           border border-[var(--color-border)]
                           hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 focus:ring-offset-[var(--color-surface)]
                           cursor-pointer transition-colors duration-150"
              >
                {codenames.length === 0 ? (
                  <option value="">No reindeer</option>
                ) : (
                  codenames.map((codename) => (
                    <option key={codename} value={codename}>
                      {reindeerByCodename[codename][0].name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDownIcon className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
            </div>

            {/* Version selector */}
            {versionsForCodename.length > 0 && (
              <div className="relative">
                <select
                  value={selectedId || ""}
                  onChange={(e) => dispatch(selectReindeer(e.target.value))}
                  className="appearance-none h-8 pl-2.5 pr-6 rounded-md text-sm font-mono
                             bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]
                             border border-[var(--color-border)]
                             hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 focus:ring-offset-[var(--color-surface)]
                             cursor-pointer transition-colors duration-150"
                >
                  {versionsForCodename.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.version}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)] pointer-events-none" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right section - File actions */}
      <div className="flex items-center gap-1">
        {/* Open Button */}
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-sm
                     text-[var(--color-text-muted)]
                     hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]
                     transition-colors duration-150"
        >
          <FolderOpenIcon className="w-4 h-4" />
          <span>Open</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!activeTab}
          className="flex items-center gap-2 h-8 px-3 rounded-md text-sm
                     text-[var(--color-text-muted)]
                     hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]
                     disabled:opacity-40 disabled:hover:bg-transparent
                     transition-colors duration-150"
        >
          <span>Save</span>
          <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 rounded text-[10px] font-mono font-medium
                          bg-[var(--color-background)] text-[var(--color-text-muted)]
                          border border-[var(--color-border)]">
            ⌘S
          </kbd>
        </button>

        {/* Format Button */}
        <button
          onClick={handleFormat}
          disabled={!activeTab || isFormatting}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-sm
                     text-[var(--color-text-muted)]
                     hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]
                     disabled:opacity-40 disabled:hover:bg-transparent
                     transition-colors duration-150"
        >
          <CodeBracketIcon className="w-4 h-4" />
          <span>Format</span>
          <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 rounded text-[10px] font-mono font-medium
                          bg-[var(--color-background)] text-[var(--color-text-muted)]
                          border border-[var(--color-border)]">
            {navigator.platform.includes("Mac") ? "⇧⌘F" : "Ctrl+Shift+F"}
          </kbd>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        {/* Settings Button */}
        <button
          onClick={() => dispatch(openSettingsModal())}
          className="flex items-center justify-center w-8 h-8 rounded-md
                     text-[var(--color-text-muted)]
                     hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]
                     transition-colors duration-150"
        >
          <Cog6ToothIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}

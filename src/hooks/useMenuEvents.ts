import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "../store";
import { addTab, closeTab, saveTab, updateTabContent } from "../store/slices/tabsSlice";
import {
  startExecution,
  cancelExecution,
  resetExecution,
} from "../store/slices/executionSlice";
import { openSettingsModal } from "../store/slices/settingsSlice";
import {
  openDownloadModal,
  formatCode,
} from "../store/slices/formatterSlice";

export function useMenuEvents() {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId } = useAppSelector((state) => state.tabs);
  const { selectedId } = useAppSelector((state) => state.reindeer);
  const { status } = useAppSelector((state) => state.execution);
  const { status: formatterStatus } = useAppSelector((state) => state.formatter);
  const { format_on_save } = useAppSelector((state) => state.settings.settings);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    const unlisten = listen<string>("menu-event", async (event) => {
      switch (event.payload) {
        case "new-tab":
          dispatch(addTab({}));
          break;

        case "open": {
          const selected = await openDialog({
            multiple: false,
            filters: [{ name: "Santa Lang", extensions: ["santa"] }],
          });
          if (selected) {
            const content = await readTextFile(selected);
            const name = selected.split("/").pop() || "untitled.santa";
            dispatch(addTab({ name, path: selected, content }));
          }
          break;
        }

        case "save": {
          if (!activeTab) break;
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
            if (!selected) break;
            path = selected;
          }
          await writeTextFile(path, contentToSave);
          const name = path.split("/").pop() || activeTab.name;
          dispatch(saveTab({ id: activeTab.id, path, name }));
          break;
        }

        case "save-as": {
          if (!activeTab) break;
          const selected = await save({
            filters: [{ name: "Santa Lang", extensions: ["santa"] }],
            defaultPath: activeTab.name,
          });
          if (!selected) break;
          await writeTextFile(selected, activeTab.content);
          const name = selected.split("/").pop() || activeTab.name;
          dispatch(saveTab({ id: activeTab.id, path: selected, name }));
          break;
        }

        case "close-tab":
          if (activeTabId) {
            dispatch(closeTab(activeTabId));
          }
          break;

        case "run":
          if (activeTab && selectedId && status !== "running") {
            dispatch(resetExecution());
            dispatch(
              startExecution({
                implId: selectedId,
                source: activeTab.content,
                mode: "run",
                workingDir: activeTab.path
                  ? activeTab.path.substring(0, activeTab.path.lastIndexOf("/"))
                  : undefined,
              })
            );
          }
          break;

        case "test":
          if (activeTab && selectedId && status !== "running") {
            dispatch(resetExecution());
            dispatch(
              startExecution({
                implId: selectedId,
                source: activeTab.content,
                mode: "test",
                workingDir: activeTab.path
                  ? activeTab.path.substring(0, activeTab.path.lastIndexOf("/"))
                  : undefined,
              })
            );
          }
          break;

        case "stop":
          if (selectedId && status === "running") {
            dispatch(cancelExecution(selectedId));
          }
          break;

        case "settings":
          dispatch(openSettingsModal());
          break;

        case "docs":
          openUrl("https://github.com/eddmann/santa-lang");
          break;

        case "format": {
          if (!activeTab) break;
          if (!formatterStatus?.installed) {
            dispatch(openDownloadModal());
          } else {
            const result = await dispatch(formatCode(activeTab.content)).unwrap();
            if (result.success && result.formatted) {
              dispatch(updateTabContent({ id: activeTab.id, content: result.formatted }));
            }
          }
          break;
        }
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [dispatch, activeTab, activeTabId, selectedId, status, formatterStatus, format_on_save]);
}

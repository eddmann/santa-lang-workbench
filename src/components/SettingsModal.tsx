import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { closeSettingsModal, saveSettings } from "../store/slices/settingsSlice";
import {
  loadReindeer,
  addReindeer,
  removeReindeer,
  fetchReleases,
  downloadReindeer,
} from "../store/slices/reindeerSlice";
import { open } from "@tauri-apps/plugin-dialog";
import {
  XMarkIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  FolderPlusIcon,
  CpuChipIcon,
  Cog6ToothIcon,
  CloudArrowDownIcon,
  KeyIcon,
  CheckCircleIcon,
  SwatchIcon,
} from "@heroicons/react/20/solid";
import type { Settings, Release } from "../lib/types";
import { themes, applyTheme, getTheme } from "../lib/themes";

const CODENAMES = [
  { id: "comet", name: "Comet", desc: "Rust tree-walking interpreter", color: "text-orange-400" },
  { id: "blitzen", name: "Blitzen", desc: "Rust bytecode VM", color: "text-blue-400" },
  { id: "dasher", name: "Dasher", desc: "Rust LLVM compiler", color: "text-red-400" },
  { id: "donner", name: "Donner", desc: "Kotlin JVM compiler", color: "text-purple-400" },
  { id: "prancer", name: "Prancer", desc: "TypeScript interpreter", color: "text-yellow-400" },
];

export function SettingsModal() {
  const dispatch = useAppDispatch();
  const { isModalOpen, settings } = useAppSelector((state) => state.settings);
  const { reindeer, releases, releasesLoading } = useAppSelector(
    (state) => state.reindeer
  );

  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [activeTab, setActiveTab] = useState<"reindeer" | "general">(
    "reindeer"
  );
  const [selectedCodename, setSelectedCodename] = useState<string | null>(null);
  const [downloadingRelease, setDownloadingRelease] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    dispatch(loadReindeer());
  }, [dispatch]);

  if (!isModalOpen) return null;

  const handleClose = () => {
    // Revert to saved theme if user cancels
    applyTheme(getTheme(settings.theme));
    dispatch(closeSettingsModal());
  };

  const handleSave = () => {
    dispatch(saveSettings(localSettings));
    dispatch(closeSettingsModal());
  };

  const handleAddLocal = async () => {
    const selected = await open({
      multiple: false,
      directory: false,
    });

    if (selected) {
      try {
        await dispatch(addReindeer(selected)).unwrap();
      } catch (e) {
        console.error("Failed to add reindeer:", e);
      }
    }
  };

  const handleRemove = async (id: string) => {
    await dispatch(removeReindeer(id));
  };

  const handleFetchReleases = async (codename: string) => {
    setSelectedCodename(codename);
    if (!releases[codename]) {
      dispatch(fetchReleases(codename));
    }
  };

  const handleDownload = async (
    codename: string,
    release: Release,
    assetName: string,
    assetUrl: string
  ) => {
    setDownloadingRelease(release.tag_name);
    try {
      await dispatch(
        downloadReindeer({ codename, assetUrl, assetName })
      ).unwrap();
    } catch (e) {
      console.error("Failed to download:", e);
    }
    setDownloadingRelease(null);
  };

  // Check if a release version is already installed
  const isReleaseInstalled = (codename: string, release: Release) => {
    const version = release.tag_name.replace(/^v/, "");
    return reindeer.some(
      (impl) => impl.codename === codename && impl.version === version
    );
  };

  // Get the installed reindeer for a release (for deletion)
  const getInstalledImpl = (codename: string, release: Release) => {
    const version = release.tag_name.replace(/^v/, "");
    return reindeer.find(
      (impl) => impl.codename === codename && impl.version === version
    );
  };

  const getPlatformAsset = (release: Release) => {
    const platform = navigator.platform.toLowerCase();
    const arch = navigator.userAgent.includes("arm64") ? "arm64" : "amd64";

    let os = "linux";
    if (platform.includes("mac")) os = "macos";
    else if (platform.includes("win")) os = "windows";

    // Find CLI binary for this platform (exclude checksums and non-CLI assets)
    // Allow .tar.gz since backend handles extraction (e.g., Donner)
    return release.assets.find(
      (a) =>
        a.name.includes("-cli-") &&
        a.name.includes(os) &&
        a.name.includes(arch) &&
        !a.name.endsWith(".sha256") &&
        !a.name.endsWith(".zip")
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]
                    w-[720px] max-h-[85vh] flex flex-col
                    shadow-[var(--shadow-elevated)] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-glow)] flex items-center justify-center">
              <Cog6ToothIcon className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)]
                     hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]
                     transition-colors duration-150"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border-subtle)]">
          <button
            onClick={() => setActiveTab("reindeer")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors duration-150 ${
              activeTab === "reindeer"
                ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <CpuChipIcon className="w-4 h-4" />
            Reindeer
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors duration-150 ${
              activeTab === "general"
                ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <KeyIcon className="w-4 h-4" />
            General
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "reindeer" && (
            <div className="space-y-6">
              {/* Installed */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Installed
                  </h3>
                  <button
                    onClick={handleAddLocal}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-info)]
                             hover:text-[var(--color-info)] hover:underline transition-colors"
                  >
                    <FolderPlusIcon className="w-4 h-4" />
                    Add Local Binary
                  </button>
                </div>

                {reindeer.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-lg">
                    <CloudArrowDownIcon className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-3" />
                    <p className="text-sm text-[var(--color-text-muted)]">
                      No reindeer installed
                    </p>
                    <p className="text-xs text-[var(--color-text-faint)] mt-1">
                      Download one below or add a local binary
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reindeer.map((r) => (
                      <div
                        key={r.id}
                        className="group flex items-center justify-between p-4
                                 bg-[var(--color-background)] rounded-lg
                                 border border-[var(--color-border-subtle)]
                                 hover:border-[var(--color-border)] transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)]
                                        flex items-center justify-center">
                            <CpuChipIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[var(--color-text-primary)]">
                                {r.name}
                              </span>
                              <span className="text-xs font-mono text-[var(--color-text-muted)]
                                           bg-[var(--color-surface-elevated)] px-1.5 py-0.5 rounded">
                                {r.version}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] truncate max-w-md mt-0.5 font-mono">
                              {r.path}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(r.id)}
                          className="p-2 text-[var(--color-text-muted)]
                                   hover:text-[var(--color-error)] hover:bg-[var(--color-error-glow)]
                                   rounded-lg transition-colors duration-150
                                   opacity-0 group-hover:opacity-100"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Download */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
                  Download from GitHub
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {CODENAMES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleFetchReleases(c.id)}
                      className={`p-4 text-left rounded-lg border transition-all duration-200 ${
                        selectedCodename === c.id
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)]"
                          : "border-[var(--color-border-subtle)] hover:border-[var(--color-border)] bg-[var(--color-background)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${c.color}`}>{c.name}</span>
                        {selectedCodename === c.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {c.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Releases */}
                {selectedCodename && (
                  <div className="mt-4 animate-slide-up">
                    {releasesLoading[selectedCodename] ? (
                      <div className="py-6 text-center">
                        <div className="w-6 h-6 mx-auto border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-[var(--color-text-muted)] mt-3">
                          Loading releases...
                        </p>
                      </div>
                    ) : releases[selectedCodename]?.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-auto">
                        {releases[selectedCodename].slice(0, 5).map((release) => {
                          const asset = getPlatformAsset(release);
                          const installed = isReleaseInstalled(selectedCodename, release);
                          const installedImpl = installed ? getInstalledImpl(selectedCodename, release) : null;
                          return (
                            <div
                              key={release.tag_name}
                              className="flex items-center justify-between p-4
                                       bg-[var(--color-background)] rounded-lg
                                       border border-[var(--color-border-subtle)]"
                            >
                              <div>
                                <span className="font-semibold text-[var(--color-text-primary)]">
                                  {release.tag_name}
                                </span>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                  {new Date(release.published_at).toLocaleDateString()}
                                </p>
                              </div>
                              {installed && installedImpl ? (
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1.5 text-sm text-[var(--color-success)]">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Installed
                                  </span>
                                  <button
                                    onClick={() => handleRemove(installedImpl.id)}
                                    className="p-2 text-[var(--color-text-muted)]
                                             hover:text-[var(--color-error)] hover:bg-[var(--color-error-glow)]
                                             rounded-lg transition-colors duration-150"
                                    title="Remove this version"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : asset ? (
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      selectedCodename,
                                      release,
                                      asset.name,
                                      asset.browser_download_url
                                    )
                                  }
                                  disabled={downloadingRelease !== null}
                                  className="flex items-center gap-2 px-4 py-2
                                           bg-[var(--color-accent)] text-[#0f1419] font-medium
                                           rounded-lg text-sm
                                           hover:brightness-110 active:brightness-95
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           transition-all duration-150"
                                >
                                  {downloadingRelease === release.tag_name ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                  )}
                                  Download
                                </button>
                              ) : (
                                <span className="text-xs text-[var(--color-text-muted)]
                                             bg-[var(--color-surface-elevated)] px-2 py-1 rounded">
                                  No build for your platform
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                        No releases found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                  <SwatchIcon className="w-4 h-4" />
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setLocalSettings({ ...localSettings, theme: theme.id });
                        applyTheme(theme);
                      }}
                      className={`p-4 text-left rounded-lg border transition-all duration-200 ${
                        localSettings.theme === theme.id
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)]"
                          : "border-[var(--color-border-subtle)] hover:border-[var(--color-border)] bg-[var(--color-background)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-[var(--color-border)]"
                          style={{ backgroundColor: theme.colors["--color-accent"] }}
                        />
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {theme.name}
                        </span>
                        {localSettings.theme === theme.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        <div
                          className="w-6 h-3 rounded-sm"
                          style={{ backgroundColor: theme.colors["--color-background"] }}
                        />
                        <div
                          className="w-6 h-3 rounded-sm"
                          style={{ backgroundColor: theme.colors["--color-surface"] }}
                        />
                        <div
                          className="w-6 h-3 rounded-sm"
                          style={{ backgroundColor: theme.colors["--color-surface-elevated"] }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format on Save */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                  <SwatchIcon className="w-4 h-4" />
                  Code Formatting
                </label>
                <div className="flex items-center justify-between p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border-subtle)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Format on Save</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Automatically format code when saving
                    </p>
                  </div>
                  <button
                    onClick={() => setLocalSettings({ ...localSettings, format_on_save: !localSettings.format_on_save })}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      localSettings.format_on_save ? "bg-[var(--color-accent)]" : "bg-[var(--color-surface-elevated)]"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      localSettings.format_on_save ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>
              </div>

              {/* AoC Session Token */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                  <KeyIcon className="w-4 h-4" />
                  Advent of Code Session Token
                </label>
                <input
                  type="password"
                  value={localSettings.aoc_session_token || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      aoc_session_token: e.target.value || null,
                    })
                  }
                  placeholder="Your AoC session cookie value"
                  className="w-full px-4 py-3 bg-[var(--color-background)]
                           border border-[var(--color-border-subtle)] rounded-lg text-sm
                           placeholder:text-[var(--color-text-faint)]
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent
                           transition-all duration-200"
                />
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Used for fetching puzzle inputs via <code className="text-[var(--color-accent)]">read("aoc://YEAR/DAY")</code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)]
                     hover:text-[var(--color-text-primary)]
                     transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium
                     bg-[var(--color-accent)] text-[#0f1419] rounded-lg
                     hover:brightness-110 active:brightness-95
                     transition-all duration-150"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

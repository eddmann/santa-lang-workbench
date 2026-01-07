import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  closeDownloadModal,
  fetchFormatterReleases,
  downloadFormatter,
  formatCode,
} from "../store/slices/formatterSlice";
import { updateTabContent } from "../store/slices/tabsSlice";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  CodeBracketIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import type { Release } from "../lib/types";

export function FormatterDownloadModal() {
  const dispatch = useAppDispatch();
  const { showDownloadModal, releases, releasesLoading, isDownloading, status } =
    useAppSelector((state) => state.formatter);
  const { tabs, activeTabId } = useAppSelector((state) => state.tabs);
  const [downloadingRelease, setDownloadingRelease] = useState<string | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    if (showDownloadModal && releases.length === 0) {
      dispatch(fetchFormatterReleases());
    }
  }, [showDownloadModal, releases.length, dispatch]);

  if (!showDownloadModal) return null;

  const handleClose = () => {
    dispatch(closeDownloadModal());
  };

  const getPlatformAsset = (release: Release) => {
    const platform = navigator.platform.toLowerCase();
    const arch = navigator.userAgent.includes("arm64") ? "arm64" : "amd64";

    let os = "linux";
    if (platform.includes("mac")) os = "macos";
    else if (platform.includes("win")) os = "windows";

    // Find CLI binary for this platform (exclude archives, checksums, and non-CLI assets)
    return release.assets.find(
      (a) =>
        a.name.includes("-cli-") &&
        a.name.includes(os) &&
        a.name.includes(arch) &&
        !a.name.endsWith(".sha256") &&
        !a.name.endsWith(".tar.gz") &&
        !a.name.endsWith(".zip")
    );
  };

  const handleDownload = async (release: Release, assetName: string, assetUrl: string) => {
    setDownloadingRelease(release.tag_name);
    try {
      await dispatch(
        downloadFormatter({ assetUrl, assetName })
      ).unwrap();

      // Auto-format the active tab content after download
      if (activeTab) {
        const result = await dispatch(formatCode(activeTab.content)).unwrap();
        if (result.success && result.formatted) {
          dispatch(updateTabContent({ id: activeTab.id, content: result.formatted }));
        }
      }
    } catch (e) {
      console.error("Failed to download formatter:", e);
    }
    setDownloadingRelease(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]
                    w-[480px] max-h-[85vh] flex flex-col
                    shadow-[var(--shadow-elevated)] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-glow)] flex items-center justify-center">
              <CodeBracketIcon className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Code Formatter</h2>
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {status?.installed ? (
            <div className="text-center py-6">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-[var(--color-success)] mb-3" />
              <p className="text-[var(--color-text-primary)] font-medium">
                Formatter installed
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Version: {status.version}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                The code formatter (Comet) needs to be downloaded to format your code.
              </p>

              {releasesLoading ? (
                <div className="py-6 text-center">
                  <div className="w-6 h-6 mx-auto border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[var(--color-text-muted)] mt-3">
                    Loading releases...
                  </p>
                </div>
              ) : releases.length > 0 ? (
                <div className="space-y-2">
                  {releases.slice(0, 3).map((release) => {
                    const asset = getPlatformAsset(release);
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
                        {asset ? (
                          <button
                            onClick={() =>
                              handleDownload(release, asset.name, asset.browser_download_url)
                            }
                            disabled={isDownloading}
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
            </>
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
            {status?.installed ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

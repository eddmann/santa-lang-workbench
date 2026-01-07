import { useMemo, useState, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store";
import {
  toggleReindeerSelection,
  setSelectedReindeerIds,
} from "../store/slices/executionSlice";
import {
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/20/solid";

export function ReindeerMultiSelect() {
  const dispatch = useAppDispatch();
  const { reindeer } = useAppSelector((state) => state.reindeer);
  const { selectedReindeerIds } = useAppSelector((state) => state.execution);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (id: string) => {
    dispatch(toggleReindeerSelection(id));
  };

  const handleSelectAllCodename = (codename: string) => {
    const codenameIds = reindeerByCodename[codename].map(r => r.id);
    const allSelected = codenameIds.every(id => selectedReindeerIds.includes(id));

    if (allSelected) {
      // Deselect all of this codename
      dispatch(setSelectedReindeerIds(
        selectedReindeerIds.filter(id => !codenameIds.includes(id))
      ));
    } else {
      // Select all of this codename
      const newIds = [...new Set([...selectedReindeerIds, ...codenameIds])];
      dispatch(setSelectedReindeerIds(newIds));
    }
  };

  const selectedCount = selectedReindeerIds.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 px-3 rounded-md text-sm font-medium
                   bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]
                   border border-[var(--color-border)]
                   hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 focus:ring-offset-[var(--color-surface)]
                   transition-colors duration-150"
      >
        <span>
          {selectedCount === 0
            ? "Select reindeer..."
            : `${selectedCount} selected`}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto py-1">
            {codenames.map((codename) => {
              const codenameReindeer = reindeerByCodename[codename];
              const codenameIds = codenameReindeer.map(r => r.id);
              const allSelected = codenameIds.every(id => selectedReindeerIds.includes(id));

              return (
                <div key={codename} className="py-1">
                  {/* Codename header with select all */}
                  <button
                    onClick={() => handleSelectAllCodename(codename)}
                    className="w-full flex items-center justify-between px-3 py-1.5
                               text-xs font-semibold uppercase tracking-wide
                               text-[var(--color-text-muted)]
                               hover:bg-[var(--color-surface-hover)]
                               transition-colors duration-150"
                  >
                    <span>{codenameReindeer[0].name}</span>
                    <span className="text-[10px] font-normal">
                      {allSelected ? "Deselect all" : "Select all"}
                    </span>
                  </button>

                  {/* Versions */}
                  {codenameReindeer.map((r) => {
                    const isSelected = selectedReindeerIds.includes(r.id);

                    return (
                      <button
                        key={r.id}
                        onClick={() => handleToggle(r.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5
                                   text-sm font-mono
                                   hover:bg-[var(--color-surface-hover)]
                                   transition-colors duration-150
                                   ${isSelected
                                     ? "text-[var(--color-text-primary)]"
                                     : "text-[var(--color-text-secondary)]"
                                   }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center
                                     ${isSelected
                                       ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                                       : "border-[var(--color-border)]"
                                     }`}
                        >
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 text-[#0f1419]" />
                          )}
                        </div>
                        <span className="ml-1">{r.version}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {codenames.length === 0 && (
              <div className="px-3 py-4 text-sm text-[var(--color-text-muted)] text-center">
                No reindeer installed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

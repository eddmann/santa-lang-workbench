import { useAppDispatch, useAppSelector } from "../store";
import { addTab, closeTab, setActiveTab } from "../store/slices/tabsSlice";
import { XMarkIcon, PlusIcon, DocumentTextIcon } from "@heroicons/react/20/solid";

export function EditorTabs() {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId } = useAppSelector((state) => state.tabs);

  return (
    <div className="flex items-end h-9 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)] overflow-x-auto">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`group relative flex items-center gap-2 h-[34px] px-3 cursor-pointer select-none
                        transition-colors duration-150
                        ${isActive
                          ? "bg-[var(--color-background)] text-[var(--color-text-primary)]"
                          : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                        }`}
            onClick={() => dispatch(setActiveTab(tab.id))}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Active tab indicator */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--color-accent)]" />
            )}

            {/* File icon */}
            <DocumentTextIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[var(--color-accent)]" : ""}`} />

            {/* File name */}
            <span className="text-[13px] font-medium truncate max-w-[140px]">
              {tab.name}
            </span>

            {/* Dirty indicator */}
            {tab.isDirty && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? "bg-[var(--color-warning)]" : "bg-[var(--color-text-muted)]"}`} />
            )}

            {/* Close button */}
            <button
              className={`flex items-center justify-center w-5 h-5 rounded-sm flex-shrink-0
                          opacity-0 group-hover:opacity-100
                          hover:bg-[var(--color-surface-hover)]
                          transition-all duration-150
                          ${isActive ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}`}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(closeTab(tab.id));
              }}
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>

            {/* Separator */}
            {!isActive && index < tabs.length - 1 && (
              <div className="absolute right-0 top-2 bottom-2 w-px bg-[var(--color-border-subtle)]" />
            )}
          </div>
        );
      })}

      {/* New tab button */}
      <button
        className="flex items-center justify-center w-8 h-[34px] text-[var(--color-text-muted)]
                   hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]
                   transition-colors duration-150"
        onClick={() => dispatch(addTab({}))}
      >
        <PlusIcon className="w-4 h-4" />
      </button>

      {/* Spacer to fill remaining width */}
      <div className="flex-1 min-w-4" />
    </div>
  );
}

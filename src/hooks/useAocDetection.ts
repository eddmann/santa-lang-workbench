import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { extractAocReferences, aocCacheKey } from "../lib/aoc-utils";
import {
  setCurrentReference,
  fetchAocPuzzle,
} from "../store/slices/aocSlice";

/**
 * Hook that watches the active tab's source code for aoc:// references.
 * When detected, it updates the current reference and triggers fetching.
 */
export function useAocDetection() {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId } = useAppSelector((state) => state.tabs);
  const { puzzles, loading } = useAppSelector((state) => state.aoc);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Get active tab content
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) {
      dispatch(setCurrentReference(null));
      return;
    }

    // Debounce the detection to avoid excessive parsing
    debounceRef.current = setTimeout(() => {
      const references = extractAocReferences(activeTab.content);

      if (references.length === 0) {
        dispatch(setCurrentReference(null));
        return;
      }

      // Use the first reference found
      const ref = references[0];
      dispatch(setCurrentReference(ref));

      // Fetch if not already cached or loading
      const key = aocCacheKey(ref.year, ref.day);
      if (!puzzles[key] && !loading[key]) {
        dispatch(fetchAocPuzzle(ref));
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [tabs, activeTabId, puzzles, loading, dispatch]);
}

export interface AocReference {
  year: number;
  day: number;
}

/**
 * Extract all aoc:// references from santa-lang source code.
 * Matches patterns like: read("aoc://2024/15") or read('aoc://2024/1')
 */
export function extractAocReferences(source: string): AocReference[] {
  const regex = /read\s*\(\s*["']aoc:\/\/(\d{4})\/(\d{1,2})["']\s*\)/g;
  const references: AocReference[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = regex.exec(source)) !== null) {
    const year = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const key = `${year}/${day}`;

    // Deduplicate
    if (!seen.has(key)) {
      seen.add(key);
      references.push({ year, day });
    }
  }

  return references;
}

/**
 * Format a cache key for an AoC puzzle
 */
export function aocCacheKey(year: number, day: number): string {
  return `${year}/${day}`;
}

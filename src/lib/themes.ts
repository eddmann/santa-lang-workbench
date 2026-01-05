export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export const themes: Theme[] = [
  {
    id: "nordic-dark",
    name: "Nordic Dark",
    colors: {
      "--color-background": "#0f1419",
      "--color-surface": "#151a21",
      "--color-surface-elevated": "#1c232d",
      "--color-surface-hover": "#242d3a",
      "--color-border": "#2a3544",
      "--color-border-subtle": "#1e2736",
      "--color-text-primary": "#e8eef4",
      "--color-text-secondary": "#9ba8b9",
      "--color-text-muted": "#5c6b7d",
      "--color-text-faint": "#3d4a5c",
      "--color-accent": "#4ade80",
      "--color-accent-hover": "#22c55e",
      "--color-accent-glow": "rgba(74, 222, 128, 0.15)",
      "--color-error": "#fb7185",
      "--color-error-glow": "rgba(251, 113, 133, 0.15)",
      "--color-warning": "#fbbf24",
      "--color-warning-glow": "rgba(251, 191, 36, 0.12)",
      "--color-info": "#60a5fa",
      "--color-info-glow": "rgba(96, 165, 250, 0.15)",
      "--color-success": "#4ade80",
      "--color-glass": "rgba(21, 26, 33, 0.85)",
      "--shadow-elevated": "0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)",
      "--shadow-glow-accent": "0 0 20px rgba(74, 222, 128, 0.2)",
      "--shadow-glow-error": "0 0 20px rgba(251, 113, 133, 0.2)",
    },
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    colors: {
      "--color-background": "#0a0e1a",
      "--color-surface": "#111827",
      "--color-surface-elevated": "#1e293b",
      "--color-surface-hover": "#334155",
      "--color-border": "#334155",
      "--color-border-subtle": "#1e293b",
      "--color-text-primary": "#f1f5f9",
      "--color-text-secondary": "#94a3b8",
      "--color-text-muted": "#64748b",
      "--color-text-faint": "#475569",
      "--color-accent": "#38bdf8",
      "--color-accent-hover": "#0ea5e9",
      "--color-accent-glow": "rgba(56, 189, 248, 0.15)",
      "--color-error": "#f87171",
      "--color-error-glow": "rgba(248, 113, 113, 0.15)",
      "--color-warning": "#fbbf24",
      "--color-warning-glow": "rgba(251, 191, 36, 0.12)",
      "--color-info": "#818cf8",
      "--color-info-glow": "rgba(129, 140, 248, 0.15)",
      "--color-success": "#34d399",
      "--color-glass": "rgba(17, 24, 39, 0.85)",
      "--shadow-elevated": "0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
      "--shadow-glow-accent": "0 0 20px rgba(56, 189, 248, 0.2)",
      "--shadow-glow-error": "0 0 20px rgba(248, 113, 113, 0.2)",
    },
  },
  {
    id: "nord",
    name: "Nord",
    colors: {
      "--color-background": "#2e3440",
      "--color-surface": "#3b4252",
      "--color-surface-elevated": "#434c5e",
      "--color-surface-hover": "#4c566a",
      "--color-border": "#4c566a",
      "--color-border-subtle": "#434c5e",
      "--color-text-primary": "#eceff4",
      "--color-text-secondary": "#d8dee9",
      "--color-text-muted": "#81a1c1",
      "--color-text-faint": "#5e81ac",
      "--color-accent": "#a3be8c",
      "--color-accent-hover": "#8fbcbb",
      "--color-accent-glow": "rgba(163, 190, 140, 0.15)",
      "--color-error": "#bf616a",
      "--color-error-glow": "rgba(191, 97, 106, 0.15)",
      "--color-warning": "#ebcb8b",
      "--color-warning-glow": "rgba(235, 203, 139, 0.12)",
      "--color-info": "#81a1c1",
      "--color-info-glow": "rgba(129, 161, 193, 0.15)",
      "--color-success": "#a3be8c",
      "--color-glass": "rgba(59, 66, 82, 0.85)",
      "--shadow-elevated": "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)",
      "--shadow-glow-accent": "0 0 20px rgba(163, 190, 140, 0.2)",
      "--shadow-glow-error": "0 0 20px rgba(191, 97, 106, 0.2)",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    colors: {
      "--color-background": "#282a36",
      "--color-surface": "#343746",
      "--color-surface-elevated": "#3d4056",
      "--color-surface-hover": "#464a66",
      "--color-border": "#44475a",
      "--color-border-subtle": "#3d4056",
      "--color-text-primary": "#f8f8f2",
      "--color-text-secondary": "#bfbfbf",
      "--color-text-muted": "#6272a4",
      "--color-text-faint": "#525882",
      "--color-accent": "#50fa7b",
      "--color-accent-hover": "#3dd668",
      "--color-accent-glow": "rgba(80, 250, 123, 0.15)",
      "--color-error": "#ff5555",
      "--color-error-glow": "rgba(255, 85, 85, 0.15)",
      "--color-warning": "#f1fa8c",
      "--color-warning-glow": "rgba(241, 250, 140, 0.12)",
      "--color-info": "#8be9fd",
      "--color-info-glow": "rgba(139, 233, 253, 0.15)",
      "--color-success": "#50fa7b",
      "--color-glass": "rgba(52, 55, 70, 0.85)",
      "--shadow-elevated": "0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)",
      "--shadow-glow-accent": "0 0 20px rgba(80, 250, 123, 0.2)",
      "--shadow-glow-error": "0 0 20px rgba(255, 85, 85, 0.2)",
    },
  },
];

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

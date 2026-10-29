"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted/60 border border-border flex items-center justify-center opacity-60">
        <Sun className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycleTheme}
      className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-md border border-border/80 flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors shadow-xs"
      title={`Current: ${theme}. Click to change.`}
      aria-label="Toggle theme"
    >
      {theme === "light" && <Sun className="w-4 h-4 text-amber-500" />}
      {theme === "dark" && <Moon className="w-4 h-4 text-primary" />}
      {theme === "system" && <Monitor className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

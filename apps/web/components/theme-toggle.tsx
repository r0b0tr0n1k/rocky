"use client";

import { Button } from "@rocky/ui/components/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon data-icon="inline-start" className="dark:hidden" />
      <MoonIcon data-icon="inline-start" className="hidden dark:block" />
    </Button>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { HiSun, HiMoon } from "react-icons/hi";

export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="opacity-0">
        <HiSun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "dark" ? (
        <>
          <HiSun className="h-5 w-5" />
          <span className="sr-only">Switch to light mode</span>
        </>
      ) : (
        <>
          <HiMoon className="h-5 w-5" />
          <span className="sr-only">Switch to dark mode</span>
        </>
      )}
    </Button>
  );
}
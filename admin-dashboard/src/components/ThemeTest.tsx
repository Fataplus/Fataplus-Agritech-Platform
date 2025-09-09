"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeTest() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="p-4 bg-background text-foreground rounded-lg border border-border">
      <h3 className="text-lg font-semibold mb-2">Theme Test</h3>
      <p className="mb-2">Current theme: {theme}</p>
      <div className="flex items-center mb-4">
        <div className={`w-4 h-4 rounded-full mr-2 ${theme === 'dark' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
        <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
      </div>
      <button 
        onClick={toggleTheme}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Toggle Theme
      </button>
    </div>
  );
}
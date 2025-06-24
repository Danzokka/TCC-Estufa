"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <Button
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "rounded-full h-10 w-10 lg:h-12 lg:w-12 p-1 transition-colors duration-300 bg-background hover:cursor-pointer shadow-sm dark:shadow-white/5 ", className
      )}
    >
      {isHovered ? (
        <h2 className="text-sm font-light">
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-white" />
          ) : (
            <Sun className="w-5 h-5 text-black" />
          )}
        </h2>
      ) : theme === "light" ? (
        <h2 className="text-sm font-light">
          <Sun className="w-5 h-5 text-black" />
        </h2>
      ) : (
        <h2 className="text-sm font-light">
          <Moon className="w-5 h-5 text-white" />
        </h2>
      )}
    </Button>
  );
};

export default ThemeSwitcher;

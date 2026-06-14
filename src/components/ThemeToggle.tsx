"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

/** Переключатель темы. Источник правды — класс на <html> (ставится init-скриптом в layout). */
export function ThemeToggle({ className }: { className?: string }) {
  // null до маунта — SSR не знает тему, иконку не рисуем во избежание hydration mismatch
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // client-only read so SSR markup stays deterministic
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = () => {
    if (!theme) return;
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("wc-theme", next);
    } catch {
      /* приватный режим — не сохраняем */
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
      className={cn(
        "relative grid size-9 place-items-center rounded-xl text-muted transition-colors hover:text-ink",
        "bg-white/60 ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme && (
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="grid place-items-center"
          >
            {theme === "dark" ? (
              <Sun className="size-[18px]" strokeWidth={2.2} />
            ) : (
              <Moon className="size-[18px]" strokeWidth={2.2} />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

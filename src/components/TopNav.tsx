"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Flame, Medal, LayoutGrid, GitFork, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const TABS = [
  { href: "/", label: "Сегодня", icon: Flame },
  { href: "/rating", label: "Рейтинг", icon: Medal },
  { href: "/playoff", label: "Плей-офф", icon: GitFork },
  { href: "/groups", label: "Группы", icon: LayoutGrid },
  { href: "/rules", label: "Правила", icon: BookOpen },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 mx-auto w-full max-w-[1180px] px-4 pt-3 sm:px-6">
      <nav className="glass flex items-center justify-between gap-2 px-3 py-2.5">
        <Link href="/" className="group flex items-center gap-2.5 pl-1">
          <span className="logo-mark grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0e9f6e] to-[#0a7d55] text-white shadow-sm">
            <Image
              src="/player-icon.png"
              alt=""
              width={24}
              height={24}
              className="size-6 object-contain"
              unoptimized
            />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-[15px] font-extrabold tracking-tight">
              I&rsquo;m in the game
            </span>
            <span className="text-[11px] font-medium text-muted">World Cup 2026 · прогнозы друзей</span>
          </span>
        </Link>

        <ul className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = pathname === t.href;
            const Icon = t.icon;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-label={t.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-[color,transform] active:scale-[0.96]",
                    active ? "text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-white/12 dark:ring-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="size-4 shrink-0" strokeWidth={2.2} />
                  <span className="hidden md:inline">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <ThemeToggle />
      </nav>
    </header>
  );
}

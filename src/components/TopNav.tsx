"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Trophy, LayoutGrid, GitFork } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Главная", icon: Trophy },
  { href: "/groups", label: "Групповой этап", icon: LayoutGrid },
  { href: "/playoff", label: "Плей-офф", icon: GitFork },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 mx-auto w-full max-w-[1180px] px-4 pt-3 sm:px-6">
      <nav className="glass flex items-center justify-between gap-2 px-3 py-2.5">
        <Link href="/" className="group flex items-center gap-2.5 pl-1">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-green to-green-deep text-white shadow-sm">
            <Trophy className="size-5" strokeWidth={2.2} />
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
                    "relative flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors",
                    active ? "text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-white/80 shadow-sm ring-1 ring-black/5"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="size-4 shrink-0" strokeWidth={2.2} />
                  <span className="hidden sm:inline">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

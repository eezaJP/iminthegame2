import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

/** Small emotional close-out banner. Not a dominant block. */
export function FixedBanner() {
  return (
    <section className="glass relative mt-10 overflow-hidden px-5 py-5 sm:px-7">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-green/12 via-transparent to-gold/12 opacity-80" />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/70 text-green-deep ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
            <Lock className="size-5" strokeWidth={2.3} />
          </span>
          <div>
            <div className="font-display text-[16px] font-extrabold leading-tight sm:text-[18px]">
              Прогнозы зафиксированы. Теперь только футбол.
            </div>
            <div className="mt-0.5 text-[13px] font-medium text-ink-soft">
              Следите за матчами, болейте и зарабатывайте очки.
            </div>
          </div>
        </div>
        <Link
          href="/rules"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-[13px] font-bold text-ink ring-1 ring-black/5 transition-transform active:scale-[0.97] dark:bg-white/10 dark:ring-white/10"
        >
          Правила игры
          <ArrowRight className="size-4" strokeWidth={2.6} />
        </Link>
      </div>
    </section>
  );
}

import { Globe } from "lucide-react";

/**
 * Compact tournament summary strip (replaces the oversized hero stat cards).
 * Left: identity + tagline. Middle: inline stats. Right: played-matches progress.
 */
export function SummaryBar({
  friends,
  played,
  total,
  stats,
}: {
  friends: number;
  played: number;
  total: number;
  stats: { value: string; label: string }[];
}) {
  const pct = Math.round((played / total) * 100);
  // keep the inline strip short: matches / teams / cities
  const inline = stats.filter((s) => /матч|команд|город/.test(s.label)).slice(0, 3);

  return (
    <section className="glass flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-6">
      {/* identity */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#0e9f6e] to-[#0a7d55] text-white shadow-sm">
          <Globe className="size-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-extrabold leading-tight sm:text-[17px]">
            Чемпионат мира 2026
          </div>
          <div className="mt-0.5 truncate text-[12px] font-medium text-muted">
            {friends} друзей · прогнозы зафиксированы · борьба за чемпионство
          </div>
        </div>
      </div>

      {/* inline stats */}
      <div className="flex items-center gap-5 border-black/5 dark:border-white/10 lg:ml-auto lg:border-l lg:pl-6">
        {inline.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-lg font-extrabold tabular-nums leading-none sm:text-xl">{s.value}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              {s.label.replace(" в группах", "")}
            </div>
          </div>
        ))}
      </div>

      {/* played progress */}
      <div className="min-w-[180px] border-t border-black/5 pt-3 dark:border-white/10 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="flex items-end justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Сыграно матчей</span>
          <span className="font-display text-[15px] font-extrabold tabular-nums leading-none">
            {played}
            <span className="text-muted"> из {total}</span>
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-green to-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </section>
  );
}

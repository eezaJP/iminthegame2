import { Clock4, ArrowRight } from "lucide-react";
import { Avatar } from "./Avatar";
import { plural } from "@/lib/utils";

type Row = { id: number; name: string; avatarSeed: number; rank: number; gained: number };

function Gain({ n }: { n: number }) {
  if (n > 0)
    return (
      <span className="shrink-0 rounded-md bg-green/12 px-1.5 py-0.5 font-mono text-[12px] font-bold tabular-nums text-green-deep">
        +{n}
      </span>
    );
  return <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums text-muted">0</span>;
}

export function DaySummary({
  rows,
  linkHref = "/playoff",
  linkLabel = "Сетка плей-офф",
}: {
  rows: Row[];
  linkHref?: string;
  linkLabel?: string;
}) {
  const total = rows.reduce((s, r) => s + r.gained, 0);
  const movers = rows.filter((r) => r.gained > 0).length;

  return (
    <section className="glass p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-white/70 text-green-deep ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
          <Clock4 className="size-4" strokeWidth={2.4} />
        </span>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Сводка за 24 часа</h2>
      </div>

      <p className="mt-2 text-[12.5px] leading-snug text-muted">
        {total > 0
          ? <>За сутки разыграно <b className="font-bold text-ink">{total}</b> {plural(total, "очко", "очка", "очков")} — у {movers} {plural(movers, "участника", "участников", "участников")}.</>
          : "За последние 24 часа очки ещё не начислялись — появятся после ближайших матчей."}
      </p>

      <ul className="mt-2.5 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2.5 py-2">
            <span className="w-4 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-muted">{r.rank}</span>
            <Avatar name={r.name} seed={r.avatarSeed} size={28} />
            <span className={`min-w-0 flex-1 truncate text-[13.5px] ${r.gained > 0 ? "font-bold" : "font-medium text-ink-soft"}`}>{r.name}</span>
            <Gain n={r.gained} />
          </li>
        ))}
      </ul>

      <a
        href={linkHref}
        className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-green-deep transition-colors hover:text-green"
      >
        {linkLabel}
        <ArrowRight className="size-3.5" strokeWidth={2.6} />
      </a>
    </section>
  );
}

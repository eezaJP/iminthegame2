import { Flame, TrendingUp } from "lucide-react";
import type { TodayMatch } from "@/lib/types";
import { Flag } from "./Flag";

const TOTAL = 15;

function DistRow({ label, count, color }: { label: string; count: number; color: string }) {
  const pct = Math.round((count / TOTAL) * 100);
  return (
    <div className="flex items-center gap-2 text-[12.5px]">
      <span className="w-[88px] shrink-0 truncate font-semibold text-ink-soft">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-5 shrink-0 text-right font-mono font-bold tabular-nums">{count}</span>
    </div>
  );
}

function MatchCard({ m }: { m: TodayMatch }) {
  return (
    <div className="glass glass-hover flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-md bg-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-deep">
          Группа {m.group}
        </span>
        <div className="text-right">
          <span className="font-mono text-[14px] font-bold tabular-nums">{m.time}</span>
          <span className="ml-1.5 text-[11px] text-muted">{m.city} · МСК</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[14px] font-bold">
          <Flag code={m.homeFlag} name={m.home} w={20} />
          {m.home}
        </div>
        <div className="flex items-center gap-1.5 text-[14px] font-bold">
          <Flag code={m.awayFlag} name={m.away} w={20} />
          {m.away}
        </div>
      </div>

      <div className="mt-3.5 space-y-1.5 border-t border-black/5 pt-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Прогноз большинства</div>
        <DistRow label={m.home} count={m.dist.home} color="#0e9f6e" />
        <DistRow label="Ничья" count={m.dist.draw} color="#9aa7b0" />
        <DistRow label={m.away} count={m.dist.away} color="#2f7dd1" />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2.5 text-[12px]">
        <span className="text-muted">
          Частый счёт{" "}
          <span className="ml-0.5 rounded-md bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
            {m.popularScore}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-gold">
          <Flame className="size-3.5" strokeWidth={2.4} />
          до {m.potential} очков
        </span>
      </div>

      {m.impact && (
        <div className="mt-2.5 rounded-xl bg-white/55 px-3 py-2 text-[12px] leading-snug text-ink-soft ring-1 ring-black/5">
          {m.impact}
        </div>
      )}
    </div>
  );
}

export function TodayInGame({
  matches,
  potentialTotal,
  riser,
  emptyText = "Сегодня матчей нет — отдыхаем и готовим прогнозы на следующий игровой день.",
}: {
  matches: TodayMatch[];
  potentialTotal: number;
  riser?: { name: string; condition: string };
  emptyText?: string;
}) {
  if (!matches.length) {
    return <div className="glass p-6 text-center text-[14px] text-muted">{emptyText}</div>;
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="chip bg-gold/12 text-gold">
          <Flame className="size-3.5" strokeWidth={2.6} />
          до {potentialTotal} очков в игре сегодня
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <MatchCard key={m.id} m={m} />
        ))}
      </div>
      {riser?.condition && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/55 px-4 py-3 text-[13px] ring-1 ring-black/5">
          <TrendingUp className="size-4 shrink-0 text-green-deep" strokeWidth={2.4} />
          <span>
            <span className="font-bold">{riser.name}</span> может сильнее всех подняться сегодня —{" "}
            {riser.condition}.
          </span>
        </div>
      )}
    </div>
  );
}

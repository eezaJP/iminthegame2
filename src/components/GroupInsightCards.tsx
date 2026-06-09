import Link from "next/link";
import { Flame, CheckCircle2 } from "lucide-react";
import type { GroupInsight } from "@/lib/data";
import { flagOf } from "@/lib/data";
import { Flag } from "./Flag";

function TeamPills({ names }: { names: string[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {names.map((n) => {
        const code = flagOf(n);
        return (
          <span key={n} className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-black/5">
            {code && <Flag code={code} name={n} w={15} />}
            {n}
          </span>
        );
      })}
    </div>
  );
}

export function GroupInsightCards({
  items,
  variant,
}: {
  items: GroupInsight[];
  variant: "open" | "decided";
}) {
  if (!items.length) {
    return (
      <div className="glass p-5 text-center text-[13px] text-muted">
        {variant === "open" ? "Пока всё предсказуемо — явных интриг нет." : "Решённых групп пока нет."}
      </div>
    );
  }
  const Icon = variant === "open" ? Flame : CheckCircle2;
  const tint = variant === "open" ? "text-gold" : "text-green-deep";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((g) => (
        <Link
          key={g.letter}
          href={`#group-${g.letter}`}
          className="glass glass-hover block p-4"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-green to-green-deep font-display text-sm font-extrabold text-white shadow-sm">
              {g.letter}
            </span>
            <span className="font-display text-[15px] font-extrabold">Группа {g.letter}</span>
            <Icon className={`ml-auto size-4 ${tint}`} strokeWidth={2.4} />
          </div>

          {variant === "open" ? (
            <>
              <p className="mt-2.5 text-[13px] leading-snug text-ink-soft">
                <span className="font-bold text-ink">{g.contenders.join(", ")}</span> ещё в борьбе.
              </p>
              <TeamPills names={g.contenders} />
              {g.keyMatch && (
                <div className="mt-2.5 text-[12px] text-muted">
                  Ключевой матч:{" "}
                  <span className="font-semibold text-ink">{g.keyMatch}</span>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2.5 text-[13px] leading-snug text-ink-soft">
              <span className="font-bold text-ink">{g.leader}</span> и{" "}
              <span className="font-bold text-ink">{g.second}</span> впереди.{" "}
              <span className="text-muted">{g.last} почти выбыл.</span>
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

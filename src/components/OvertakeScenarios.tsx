import { Crosshair, Check, ArrowRight } from "lucide-react";
import { Avatar } from "./Avatar";

type Scenario = {
  id: number;
  name: string;
  avatarSeed: number;
  target: string;
  place: number;
  conditions: string[];
  maxGain: number;
};

export function OvertakeScenarios({
  scenarios,
  emptyText = "Сценарии обгона появятся ближе к матчам — когда будут открытые очки дня.",
  linkHref = "/groups",
  linkLabel = "Все матчи дня",
}: {
  scenarios: Scenario[];
  emptyText?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <section className="glass p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-white/70 text-gold ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/10">
          <Crosshair className="size-4" strokeWidth={2.4} />
        </span>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Кто может обогнать кого</h2>
      </div>

      {scenarios.length ? (
        <div className="mt-3 space-y-4">
          {scenarios.map((s) => (
            <div key={s.id} className="border-b border-black/5 pb-4 last:border-0 last:pb-0 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Avatar name={s.name} seed={s.avatarSeed} size={28} />
                <p className="text-[13px] leading-snug">
                  <span className="font-bold">{s.name}</span> может обойти{" "}
                  <span className="font-bold">{s.target}</span> и выйти на {s.place}-е место, если:
                </p>
              </div>
              {s.conditions.length > 0 && (
                <ul className="mt-2.5 space-y-1.5">
                  {s.conditions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-soft">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-green-deep" strokeWidth={3} />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-2.5 inline-block rounded-lg bg-gold/12 px-2.5 py-1 text-[12px] font-bold text-gold">
                Максимум: +{s.maxGain} очков
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] leading-snug text-muted">{emptyText}</p>
      )}

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

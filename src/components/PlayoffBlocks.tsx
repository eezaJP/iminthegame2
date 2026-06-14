import { Trophy, Swords, Flame, HeartCrack, Scale, Medal } from "lucide-react";
import { playoff, championDecided } from "@/lib/playoff";
import { Flag } from "./Flag";

const { championAlive, nextStakes, liveBrackets, burned, realityVsMajority, aliveTeams } = playoff;

/* ───────── У кого чемпион ещё жив? ───────── */
export function ChampionAlive() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {championAlive.map((c) => (
        <div
          key={c.team}
          className={`glass p-4 ${c.alive ? "" : "opacity-70"}`}
        >
          <div className="flex items-center gap-2.5">
            <Flag code={c.flag} name={c.team} w={26} />
            <span className="font-display text-[15px] font-extrabold">{c.team}</span>
            <span
              className={`chip ml-auto px-2 py-0.5 text-[10.5px] ${
                c.alive ? "bg-green/12 text-green-deep" : "bg-black/[0.06] text-muted dark:bg-white/[0.07]"
              }`}
            >
              {c.status}
            </span>
          </div>
          <div className="mt-1.5 text-[12px] font-semibold text-ink-soft">
            {c.count} {c.count === 1 ? "прогноз" : c.count < 5 ? "прогноза" : "прогнозов"}
          </div>
          <div className="mt-1 text-[11.5px] leading-snug text-muted">{c.participants.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Цена следующего матча ───────── */
export function NextStakes() {
  if (!nextStakes.length) {
    return <div className="glass p-5 text-center text-[13px] text-muted">Ближайшие матчи появятся после жеребьёвки стадии.</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {nextStakes.map((s, i) => (
        <div key={i} className="glass p-4">
          <div className="flex items-center gap-2 text-[15px] font-bold">
            <Flag code={s.a?.f ?? ""} name={s.a?.n} w={20} />
            {s.a?.n}
            <span className="text-muted">—</span>
            <Flag code={s.b?.f ?? ""} name={s.b?.n} w={20} />
            {s.b?.n}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-soft">
            <span><b>{s.votesA}</b> ждут {s.a?.n}</span>
            <span><b>{s.votesB}</b> ждут {s.b?.n}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-black/5 pt-2 text-[12px] dark:border-white/10">
            <Swords className="size-4 shrink-0 text-rose" strokeWidth={2.4} />
            <span>
              Для <b>{s.critical}</b> участников это матч за финалиста · потенциальный swing{" "}
              <b className="text-gold">{s.swing}</b> очков
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Самые живые сетки ───────── */
export function LiveBrackets() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {liveBrackets.map((b) => (
        <div key={b.name} className="glass p-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-[15px] font-extrabold">{b.name}</span>
            <Flame className="size-4 text-green-deep" strokeWidth={2.4} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
            <span className="text-green-deep">живых: <b>{b.aliveCount}</b></span>
            <span>потенциал: <b>{b.potential}</b></span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-soft">
            <Flag code={b.champion?.f ?? ""} name={b.champion?.n} w={16} />
            чемпион: <b>{b.champion?.n}</b>
            <span className={b.championStatus === "жив" ? "text-green-deep" : "text-muted"}>· {b.championStatus}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Что уже сгорело ───────── */
const BURN_TITLES = ["Минус чемпион", "Ставка сгорела", "VAR не спас", "Сетка дала трещину"];
export function BurnedPredictions() {
  if (!burned.length) {
    return <div className="glass p-5 text-center text-[13px] text-muted">Пока ни у кого не сгорел чемпион — все фавориты ещё в игре.</div>;
  }
  const shown = burned.slice(0, 6);
  const more = burned.length - shown.length;
  return (
    <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((b, i) => (
        <div key={b.name} className="glass relative overflow-hidden p-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-rose">
              <HeartCrack className="size-4" strokeWidth={2.4} />
              {BURN_TITLES[i % BURN_TITLES.length]}
            </div>
            <p className="mt-2 text-[13px] leading-snug">
              <b>{b.name}</b> потерял{" "}
              <span className="inline-flex items-center gap-1 font-semibold">
                <Flag code={b.flag} name={b.team} w={15} />
                {b.team}
              </span>{" "}
              в стадии {b.stage} — минус ~<b>{b.pointsLost}</b> потенциальных очков.
            </p>
          </div>
        </div>
      ))}
    </div>
    {more > 0 && (
      <p className="mt-3 text-center text-[12.5px] text-muted">
        …и ещё у {more} участников чемпион уже вылетел. Бывает — впереди ещё много очков.
      </p>
    )}
    </>
  );
}

/* ───────── Реальность против большинства ───────── */
export function RealityVsMajority() {
  return (
    <div className="glass flex flex-wrap items-center gap-x-8 gap-y-3 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-green/12 text-green-deep">
          <Scale className="size-5" strokeWidth={2.2} />
        </span>
        <div>
          <div className="font-display text-2xl font-extrabold tabular-nums">
            {realityVsMajority.qfHit}<span className="text-muted">/{realityVsMajority.qfTotal}</span>
          </div>
          <div className="text-[12px] text-muted">четвертьфиналистов угадало большинство</div>
        </div>
      </div>
      {realityVsMajority.biggestMiss && (
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-muted">Главный промах:</span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Flag code={realityVsMajority.biggestMiss.flag} name={realityVsMajority.biggestMiss.team} w={18} />
            {realityVsMajority.biggestMiss.team}
          </span>
          <span className="text-muted">вылетела раньше прогноза</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Финальная карточка чемпиона ───────── */
export function ChampionCard() {
  const favourite = championAlive.find((c) => c.alive); // most-backed alive team
  return (
    <div className="glass relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-soft/40 to-transparent" />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3">
        <Trophy className="size-10 text-gold" strokeWidth={1.8} fill="#f6c453" />
        {championDecided && playoff.real.champion ? (
          <div className="flex items-center gap-3">
            <Flag code={playoff.real.champion.f} name={playoff.real.champion.n} w={34} />
            <div>
              <div className="font-display text-xl font-extrabold">{playoff.real.champion.n} поднимает кубок</div>
            </div>
          </div>
        ) : (
          <div>
            <div className="font-display text-xl font-extrabold">Кубок ещё ждёт победителя</div>
            <div className="mt-1 text-[13px] text-ink-soft">
              В борьбе: {aliveTeams.map((t) => t.n).join(", ")}.
            </div>
            {favourite && (
              <div className="mt-1 text-[13px] text-muted">
                Фаворит лиги — <b className="text-ink">{favourite.team}</b> ({favourite.count} из 15 верили до старта).
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Матч за 3-е место ───────── */
export function BronzeMatch() {
  const t = playoff.real.third;
  const decided = t.played && t.winner;
  return (
    <div className="glass flex flex-wrap items-center gap-x-6 gap-y-3 p-4 sm:p-5">
      <span className="grid size-10 place-items-center rounded-2xl" style={{ background: "rgba(205,127,72,0.15)" }}>
        <Medal className="size-5" style={{ color: "#cd7f48" }} strokeWidth={2.2} />
      </span>
      {decided ? (
        <div className="flex items-center gap-2 text-[15px] font-bold">
          <Flag code={t.a!.f} name={t.a!.n} w={20} />{t.a!.n}
          <span className="font-mono">{t.scoreA}:{t.scoreB}</span>
          <Flag code={t.b!.f} name={t.b!.n} w={20} />{t.b!.n}
        </div>
      ) : (
        <div>
          <div className="font-display text-[15px] font-extrabold">Бронзовый матч ещё впереди</div>
          <div className="mt-0.5 text-[13px] text-ink-soft">Сыграют команды, проигравшие в 1/2 финала.</div>
        </div>
      )}
    </div>
  );
}

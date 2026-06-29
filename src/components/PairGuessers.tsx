"use client";

import { useRef, useState } from "react";
import { Target } from "lucide-react";
import { Avatar } from "./Avatar";
import { Flag } from "./Flag";
import { Sheet } from "./Sheet";

type Guesser = { name: string; seed: number; pick: string };
type Status = "upcoming" | "live" | "finished";

function ScorePill({ gh, ga, status, time, pens }: { gh: number | null; ga: number | null; status: Status; time: string; pens: { h: number; a: number } | null }) {
  const played = status !== "upcoming" && gh !== null && ga !== null;
  if (!played) {
    return <span className="rounded-lg bg-black/[0.06] px-2.5 py-1 font-mono text-[14px] font-bold tabular-nums text-muted dark:bg-white/[0.08]">{time}</span>;
  }
  return (
    <span className="inline-flex flex-col items-center">
      <span className="rounded-lg bg-[#0a7d55] px-2.5 py-1 font-mono text-[15px] font-extrabold tabular-nums text-white shadow-sm">
        {gh}:{ga}
      </span>
      {pens && <span className="mt-0.5 text-[9.5px] font-semibold text-muted">пен. {pens.h}:{pens.a}</span>}
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose/12 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-rose">
        <span className="live-dot inline-block size-1.5 rounded-full bg-rose" />live
      </span>
    );
  if (status === "finished")
    return <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted dark:bg-white/[0.07]">завершён</span>;
  return null;
}

function Side({ team, flag, backers, align }: { team: string; flag?: string; backers: Guesser[]; align: "left" | "right" }) {
  const right = align === "right";
  return (
    <div className="min-w-0 flex-1">
      <div className={`flex items-center gap-1.5 ${right ? "flex-row-reverse" : ""}`}>
        {flag && <Flag code={flag} name={team} w={18} />}
        <span className="min-w-0 truncate text-[13px] font-extrabold">{team}</span>
        <span className="shrink-0 rounded-full bg-sky/10 px-1.5 text-[11px] font-bold tabular-nums text-sky">{backers.length}</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {backers.length === 0 ? (
          <li className={`text-[12px] font-medium text-muted ${right ? "text-right" : ""}`}>никто</li>
        ) : (
          backers.map((g) => (
            <li key={g.seed} className={`flex items-center gap-2 ${right ? "flex-row-reverse text-right" : ""}`}>
              <Avatar name={g.name} seed={g.seed} size={26} />
              <span className="min-w-0 truncate text-[13.5px] font-bold">{g.name}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function PairGuessers({
  count,
  guessers,
  home,
  away,
  homeFlag,
  awayFlag,
  stage,
  total,
  icon = false,
  gh = null,
  ga = null,
  status = "upcoming",
  time = "",
  pens = null,
}: {
  count: number;
  guessers: Guesser[];
  home: string;
  away: string;
  homeFlag?: string;
  awayFlag?: string;
  stage?: string;
  total?: number;
  icon?: boolean;
  gh?: number | null;
  ga?: number | null;
  status?: Status;
  time?: string;
  pens?: { h: number; a: number } | null;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const clickable = count > 0;

  const homeBackers = guessers.filter((g) => g.pick === home);
  const awayBackers = guessers.filter((g) => g.pick === away);
  const other = guessers.filter((g) => g.pick !== home && g.pick !== away);

  return (
    <>
      {clickable ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Кто угадал пару ${home} — ${away}`}
          className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2 py-[3px] text-[13px] font-bold tabular-nums text-sky transition-transform active:scale-90"
        >
          {icon && <Target className="size-3.5" strokeWidth={2.6} />}
          {count}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 text-[13px] font-bold tabular-nums text-muted">
          {icon && <Target className="size-3.5" strokeWidth={2.6} />}
          {count}
        </span>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} returnFocusRef={triggerRef} label={`Угадали пару ${home} — ${away}`}>
        <div className="flex items-center gap-2 pr-8 text-[10px] font-bold uppercase tracking-[0.12em] text-green-deep">
          {stage ? `${stage} · кто угадал` : "Кто угадал пару"}
          <StatusBadge status={status} />
        </div>

        {/* pair + live score */}
        <div className="mt-2 flex items-center gap-2.5">
          <span className="flex flex-1 items-center justify-end gap-1.5 truncate text-right font-display text-[15px] font-extrabold leading-tight">
            <span className="truncate">{home}</span>
            {homeFlag && <Flag code={homeFlag} name={home} w={20} />}
          </span>
          <ScorePill gh={gh} ga={ga} status={status} time={time} pens={pens} />
          <span className="flex flex-1 items-center gap-1.5 truncate font-display text-[15px] font-extrabold leading-tight">
            {awayFlag && <Flag code={awayFlag} name={away} w={20} />}
            <span className="truncate">{away}</span>
          </span>
        </div>

        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky/12 px-2.5 py-1 text-[12px] font-bold text-sky">
          <Target className="size-3.5" strokeWidth={2.6} />
          {count}
          {total ? ` из ${total}` : ""} угадали пару
        </div>

        {/* split: who backed home (left) vs away (right), thin divider between */}
        <div className="mt-3.5 flex max-h-[52vh] items-stretch gap-3 overflow-y-auto">
          <Side team={home} flag={homeFlag} backers={homeBackers} align="left" />
          <div className="w-px shrink-0 self-stretch bg-black/10 dark:bg-white/15" />
          <Side team={away} flag={awayFlag} backers={awayBackers} align="right" />
        </div>

        {other.length > 0 && (
          <div className="mt-3 border-t border-black/[0.06] pt-2 text-[12px] text-muted dark:border-white/[0.08]">
            Без указания прохода: {other.map((g) => g.name).join(", ")}
          </div>
        )}
      </Sheet>
    </>
  );
}

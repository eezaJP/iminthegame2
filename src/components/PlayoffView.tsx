"use client";

import { useState } from "react";
import { Target, Flame, Skull, CircleDot } from "lucide-react";
import { playoff } from "@/lib/playoff";
import { PlayoffBracket } from "./PlayoffBracket";
import { cn } from "@/lib/utils";

type Mode = "real" | "majority" | "participant";

const TABS: { id: Mode; label: string }[] = [
  { id: "real", label: "Реальная сетка" },
  { id: "majority", label: "Прогноз большинства" },
  { id: "participant", label: "Участник" },
];

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted">
      <span className="inline-flex items-center gap-1.5"><CircleDot className="size-3.5 text-green-deep" strokeWidth={2.4} />ещё в игре</span>
      <span className="inline-flex items-center gap-1.5"><Target className="size-3.5 text-gold" strokeWidth={2.4} />точный счёт</span>
      <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-green" />угадан проход</span>
      <span className="inline-flex items-center gap-1.5"><Skull className="size-3.5" strokeWidth={2.2} />сгорел</span>
    </div>
  );
}

export function PlayoffView() {
  const [mode, setMode] = useState<Mode>("real");
  const [pid, setPid] = useState(playoff.brackets[0]?.id ?? 0);
  const pdata = playoff.brackets.find((b) => b.id === pid) ?? playoff.brackets[0];
  const burnedCount = pdata
    ? pdata.rounds.reduce((s, r) => s + r.matches.filter((m) => m.state === "dead").length, 0)
    : 0;

  return (
    <div className="glass p-4 sm:p-5">
      {/* switcher */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full bg-black/[0.05] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                mode === t.id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {mode === "participant" && (
          <select
            value={pid}
            onChange={(e) => setPid(Number(e.target.value))}
            className="cursor-pointer rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[12.5px] font-semibold text-ink outline-none ring-green/30 focus:ring-2"
          >
            {playoff.brackets.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* participant summary */}
      {mode === "participant" && pdata && (
        <div className="mb-4 rounded-2xl bg-white/55 p-3.5 ring-1 ring-black/5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <span className="font-display text-[15px] font-extrabold">{pdata.name}</span>
            <span>Чемпион: <span className="font-bold">{pdata.champion?.n}</span>{" "}
              <span className={pdata.championStatus === "жив" ? "text-green-deep" : "text-muted"}>· {pdata.championStatus}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-green-deep">
              <Flame className="size-3.5" strokeWidth={2.4} />живых команд: <b>{pdata.aliveCount}</b>
            </span>
            <span className="text-muted">сгорело: <b className="text-ink">{burnedCount}</b></span>
            <span>потенциал: <b>{pdata.potential}</b> очков</span>
            <span className="inline-flex items-center gap-1"><Target className="size-3.5 text-gold" strokeWidth={2.4} />точные в ПО: <b>{pdata.exactPlayoff}</b></span>
          </div>
          <div className="mt-2.5 border-t border-black/5 pt-2.5"><Legend /></div>
        </div>
      )}

      {mode === "majority" && (
        <p className="mb-3 text-[12.5px] text-muted">
          Как лига видела сетку до старта. У каждого матча — кого выбрало большинство и сколько голосов.
        </p>
      )}

      {/* bracket */}
      {mode === "real" && (
        <PlayoffBracket rounds={playoff.real.rounds} champion={playoff.real.champion} mode="real" />
      )}
      {mode === "majority" && (
        <PlayoffBracket rounds={playoff.majority.rounds} champion={playoff.majority.champion} mode="majority" championStatus="прогноз большинства" />
      )}
      {mode === "participant" && pdata && (
        <PlayoffBracket rounds={pdata.rounds} champion={pdata.champion} mode="participant" championStatus={pdata.championStatus} />
      )}
    </div>
  );
}

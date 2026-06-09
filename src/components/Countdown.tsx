"use client";

import { useEffect, useState } from "react";

type Parts = { d: number; h: number; m: number; s: number; done: boolean };

function diff(target: number): Parts {
  const ms = target - Date.now();
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    done: false,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  // Render a stable placeholder on the server, hydrate live on the client.
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    // Client-only tick; server renders the "—" placeholder to avoid hydration drift.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParts(diff(targetMs));
    const id = setInterval(() => setParts(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const cells: { v: string; label: string }[] = parts
    ? [
        { v: String(parts.d), label: "дней" },
        { v: pad(parts.h), label: "часов" },
        { v: pad(parts.m), label: "минут" },
        { v: pad(parts.s), label: "секунд" },
      ]
    : [
        { v: "—", label: "дней" },
        { v: "—", label: "часов" },
        { v: "—", label: "минут" },
        { v: "—", label: "секунд" },
      ];

  if (parts?.done) {
    return (
      <div className="chip bg-green/12 text-green-deep">
        <span className="live-dot inline-block size-2 rounded-full bg-green" />
        Турнир идёт — следите за рейтингом
      </div>
    );
  }

  return (
    <div
      className="grid max-w-md grid-cols-4 gap-2 sm:flex sm:items-stretch sm:gap-3"
      role="timer"
      aria-label="До старта турнира"
    >
      {cells.map((c, i) => (
        <div key={c.label} className="flex items-center sm:gap-3.5">
          <div className="glass-soft w-full px-2 py-2.5 text-center sm:min-w-[96px] sm:px-5 sm:py-4">
            <div className="font-mono text-[28px] font-bold tabular-nums leading-none text-ink sm:text-[46px]">
              {c.v}
            </div>
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[12px]">
              {c.label}
            </div>
          </div>
          {i < cells.length - 1 && (
            <span className="hidden font-mono text-2xl font-bold text-gold/70 sm:inline sm:text-[32px]">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

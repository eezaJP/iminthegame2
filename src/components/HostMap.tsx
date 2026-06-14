"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import mapData from "@/data/map.json";
import { flagUrl, ruDate } from "@/lib/utils";

type SlimFixture = {
  cityId: number;
  date: string;
  time: string;
  group: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
};

type Country = "USA" | "CAN" | "MEX";

// colours live in globals.css (--map-*) so the dark theme can swap them;
// SVG presentation attrs не умеют var(), поэтому всё через style={{ fill/stroke }}
const COUNTRY: Record<Country, { label: string; color: string }> = {
  USA: { label: "США", color: "var(--map-us)" },
  CAN: { label: "Канада", color: "var(--map-ca)" },
  MEX: { label: "Мексика", color: "var(--map-mx)" },
};

const LABELS: { c: Country; x: number; y: number }[] = [
  { c: "CAN", x: 300, y: 150 },
  { c: "USA", x: 600, y: 360 },
  { c: "MEX", x: 470, y: 640 },
];

const START = "2026-06-24"; // demo clock — keep in sync with demo.demoToday
const { width: W, height: H, states, cities } = mapData as {
  width: number;
  height: number;
  states: { id: number; name: string; country: Country; active: boolean; d: string }[];
  cities: { id: number; city: string; country: Country; state: string; x: number; y: number }[];
};

export function HostMap({ fixtures }: { fixtures: SlimFixture[] }) {
  // demo-aware "today": before the tournament starts, pretend it's opening day
  const [today, setToday] = useState(START);
  const [hover, setHover] = useState<string | null>(null); // hovered state name

  useEffect(() => {
    const t = new Date().toISOString().slice(0, 10);
    // client-only date so SSR markup stays deterministic
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(t < START ? START : t);
  }, []);

  const spotlight = useMemo(() => {
    const dates = [...new Set(fixtures.map((f) => f.date))].sort();
    const date = dates.includes(today) ? today : dates.find((d) => d >= today) ?? dates[0];
    return { date, isToday: date === today, list: fixtures.filter((f) => f.date === date) };
  }, [fixtures, today]);

  const spotlightCityIds = useMemo(
    () => new Set(spotlight.list.map((f) => f.cityId)),
    [spotlight]
  );

  // cities grouped by state, and which states host a spotlight match
  const citiesByState = useMemo(() => {
    const m = new Map<string, typeof cities>();
    for (const c of cities) {
      if (!m.has(c.state)) m.set(c.state, []);
      m.get(c.state)!.push(c);
    }
    return m;
  }, []);

  const hoverCities = hover ? citiesByState.get(hover) ?? [] : [];
  const popoverAt = hoverCities[0];

  return (
    <div className="glass overflow-hidden p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-muted">
          16 арен в трёх странах · наведи на штат или город
        </p>
        <span className="chip bg-green/12 text-green-deep">
          <span className="live-dot inline-block size-2 rounded-full bg-green" />
          {spotlight.isToday ? "Матчи сегодня" : `Игровой день: ${ruDate(spotlight.date)}`}
        </span>
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" role="img" aria-label="Карта городов-хозяев">
          {/* country labels — black, larger, regular weight */}
          {LABELS.map((l) => (
            <text key={l.c} x={l.x} y={l.y} textAnchor="middle" fontSize="26" fontWeight="500"
              letterSpacing="2.5" style={{ fill: "var(--map-label)" }} opacity={0.82}>
              {COUNTRY[l.c].label.toUpperCase()}
            </text>
          ))}

          {/* states — hovered one rendered last so it lifts above the rest */}
          {[...states]
            .sort((a, b) => (a.name === hover ? 1 : 0) - (b.name === hover ? 1 : 0))
            .map((s) => {
              // inactive (no games) regions are static & non-interactive
              if (!s.active) {
                return (
                  <path
                    key={s.id}
                    d={s.d}
                    fillOpacity={0.28}
                    strokeWidth={0.7}
                    strokeLinejoin="round"
                    style={{
                      pointerEvents: "none",
                      fill: "var(--map-inactive)",
                      stroke: "var(--map-stroke)",
                    }}
                  />
                );
              }
              const isHover = s.name === hover;
              const color = COUNTRY[s.country].color;
              return (
                <path
                  key={s.id}
                  d={s.d}
                  fillOpacity={isHover ? 0.9 : 0.32}
                  strokeWidth={isHover ? 1.4 : 0.7}
                  strokeLinejoin="round"
                  className="cursor-pointer"
                  style={{
                    fill: color,
                    stroke: isHover ? color : "var(--map-stroke)",
                    transform: isHover ? "translateY(-9px)" : "none",
                    filter: isHover ? "drop-shadow(0 10px 9px rgba(12,26,20,0.3))" : "none",
                    transition: "transform .25s cubic-bezier(.22,1,.36,1), fill-opacity .2s, filter .25s",
                  }}
                  onMouseEnter={() => setHover(s.name)}
                  onMouseLeave={() => setHover((h) => (h === s.name ? null : h))}
                  tabIndex={0}
                  onFocus={() => setHover(s.name)}
                  aria-label={`${s.name} — арена`}
                />
              );
            })}

          {/* host city dots */}
          {cities.map((c) => {
            const hot = spotlightCityIds.has(c.id);
            const color = COUNTRY[c.country].color;
            const lifted = c.state === hover;
            return (
              <g
                key={c.id}
                transform={`translate(${c.x} ${c.y - (lifted ? 9 : 0)})`}
                className="cursor-pointer"
                style={{ transition: "transform .25s cubic-bezier(.22,1,.36,1)" }}
                onMouseEnter={() => setHover(c.state)}
                onMouseLeave={() => setHover((h) => (h === c.state ? null : h))}
                role="button"
                aria-label={`${c.city}, ${COUNTRY[c.country].label}`}
              >
                {hot && <circle r="12" className="city-glow" style={{ fill: color }} />}
                <circle r={hot ? 5.5 : 4} fill="#fff" strokeWidth={hot ? 3 : 2} style={{ stroke: color }} />
                {(hot || lifted) && (
                  <text x="0" y="-13" textAnchor="middle" fontSize="13" fontWeight="700"
                    strokeWidth="3"
                    style={{ paintOrder: "stroke", fill: "var(--map-label)", stroke: "var(--map-halo)" }}>
                    {c.city}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* popover with the state's host cities + their matches that day */}
        <AnimatePresence>
          {popoverAt && hoverCities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.16 }}
              className="pointer-events-none absolute z-10 w-[290px] max-w-[80vw] -translate-x-1/2 -translate-y-full"
              style={{ left: `${(popoverAt.x / W) * 100}%`, top: `${(popoverAt.y / H) * 100 - 3}%` }}
            >
              <div className="rounded-2xl border border-white/10 bg-[#0b1611]/95 p-3.5 text-white shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-[13px] font-bold">
                  <MapPin className="size-4 text-gold-soft" strokeWidth={2.6} />
                  {hover}
                  <span className="ml-auto text-[11px] font-semibold text-white/55">
                    {COUNTRY[popoverAt.country].label}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-gold-soft">
                  {ruDate(spotlight.date)} · время МСК
                </div>
                <div className="mt-2.5 space-y-2.5">
                  {hoverCities.map((c) => {
                    const ms = spotlight.list.filter((f) => f.cityId === c.id);
                    return (
                      <div key={c.id} className="border-t border-white/10 pt-2 first:border-0 first:pt-0">
                        <div className="text-[12.5px] font-extrabold text-white/95">{c.city}</div>
                        {ms.length ? (
                          <div className="mt-1.5 space-y-1.5">
                            {ms.map((m) => (
                              <div key={m.home + m.away} className="flex items-center gap-1.5 text-[12px]">
                                <Image src={flagUrl(m.homeFlag, 40)} alt="" width={16} height={12}
                                  className="h-3 w-4 shrink-0 rounded-[2px] object-cover" unoptimized />
                                <span className="font-semibold">{m.home}</span>
                                <span className="text-white/40">—</span>
                                <Image src={flagUrl(m.awayFlag, 40)} alt="" width={16} height={12}
                                  className="h-3 w-4 shrink-0 rounded-[2px] object-cover" unoptimized />
                                <span className="font-semibold">{m.away}</span>
                                <span className="ml-auto whitespace-nowrap font-mono text-[11px] text-white/60">
                                  {m.time} МСК
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-0.5 text-[11px] text-white/50">в этот день матчей нет</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
        {(Object.keys(COUNTRY) as Country[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: COUNTRY[k].color }} />
            {COUNTRY[k].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-muted">
          <span className="inline-block size-2.5 rounded-full bg-[#9fb0a6]/60" />
          без матчей — серым
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="live-dot inline-block size-2.5 rounded-full bg-green text-green" />
          светятся арены игрового дня
        </span>
      </div>
    </div>
  );
}

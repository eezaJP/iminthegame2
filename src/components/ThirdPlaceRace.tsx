import { Fragment } from "react";
import { Flag } from "./Flag";

type Row = {
  name: string;
  flag: string;
  group: string;
  points: number;
  gd: number;
  gf: number;
  raceRank: number;
  status: "in" | "edge" | "out";
};

const STATUS = {
  in: { label: "в зоне выхода", cls: "bg-green/12 text-green-deep" },
  edge: { label: "на грани", cls: "bg-gold/15 text-gold" },
  out: { label: "ниже линии", cls: "bg-black/[0.05] text-muted dark:bg-white/[0.07]" },
} as const;

const ROW_TINT = { in: "bg-green/[0.05]", edge: "bg-gold/[0.05]", out: "" } as const;

export function ThirdPlaceRace({ rows }: { rows: Row[] }) {
  return (
    <div className="glass overflow-hidden p-4 sm:p-5">
      <p className="mb-3 text-[13px] text-ink-soft">
        8 лучших команд с третьих мест проходят в 1/16 финала. Зелёные — в зоне выхода,
        песочные — на грани.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] border-separate border-spacing-y-1 text-[13px]">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wide text-muted">
              <th className="w-8 text-center font-bold">#</th>
              <th className="text-left font-bold">Команда</th>
              <th className="w-12 text-center font-bold">Гр</th>
              <th className="w-9 text-center font-bold">О</th>
              <th className="w-10 text-center font-bold">РМ</th>
              <th className="w-9 text-center font-bold">Заб</th>
              <th className="w-28 text-right font-bold">Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <Fragment key={r.name}>
                {i === 8 && (
                  <tr>
                    <td colSpan={7} className="py-0.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-rose">
                        <span className="h-px flex-1 bg-rose/40" />
                        линия отсечения
                        <span className="h-px flex-1 bg-rose/40" />
                      </div>
                    </td>
                  </tr>
                )}
                <tr className={ROW_TINT[r.status]}>
                  <td className="rounded-l-lg py-1.5 text-center font-mono text-[12px] font-bold tabular-nums text-muted">
                    {r.raceRank}
                  </td>
                  <td className="py-1.5">
                    <span className="flex items-center gap-2">
                      <Flag code={r.flag} name={r.name} w={20} />
                      <span className="font-semibold">{r.name}</span>
                    </span>
                  </td>
                  <td className="text-center font-semibold text-muted">{r.group}</td>
                  <td className="text-center font-display font-extrabold tabular-nums">{r.points}</td>
                  <td className="text-center font-mono tabular-nums text-ink-soft">
                    {r.gd > 0 ? `+${r.gd}` : r.gd}
                  </td>
                  <td className="text-center font-mono tabular-nums text-ink-soft">{r.gf}</td>
                  <td className="rounded-r-lg pr-1 text-right">
                    <span className={`chip ${STATUS[r.status].cls} px-2 py-0.5 text-[10.5px]`}>
                      {STATUS[r.status].label}
                    </span>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

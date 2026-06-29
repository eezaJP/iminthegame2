import { initials } from "@/lib/utils";

export const AVATAR_PAIRS = [
  ["#0e9f6e", "#0a7d55"],
  ["#e0980f", "#b9740a"],
  ["#2f7dd1", "#235fa0"],
  ["#e2486b", "#b53252"],
  ["#7c5cff", "#5b3fd6"],
  ["#0fb5ae", "#0a857f"],
  ["#f2772e", "#c75a1c"],
  ["#5b8c2a", "#436a1f"],
];

export function Avatar({
  name,
  seed,
  size = 40,
}: {
  name: string;
  seed: number;
  size?: number;
}) {
  const [from, to] = AVATAR_PAIRS[seed % AVATAR_PAIRS.length];
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-bold text-white shadow-sm ring-2 ring-white/70 dark:ring-white/25"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

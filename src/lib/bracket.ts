// Pure bracket projection: fills the real knockout tree forward from live results
// WITHOUT waiting for the API to publish the next round. As soon as a match is
// decided, its winner is propagated into the next round's slot (positional
// bracket: matches 2i & 2i+1 feed slot i). A round the API has already published
// is trusted as-is; only un-published rounds are projected. We never invent a
// future RESULT — only the pairing (who advanced) shows one round ahead.
import type { PoMatch, PoRound, PoTeam } from "./playoff";

const ORDER = ["r32", "r16", "qf", "sf", "f"] as const;
const COUNTS: Record<string, number> = { r32: 16, r16: 8, qf: 4, sf: 2, f: 1 };

const blank = (): PoMatch => ({ a: null, b: null, scoreA: null, scoreB: null, winner: undefined, played: false });
const loserOf = (m?: PoMatch): PoTeam =>
  m && m.played && m.winner ? (m.a?.n === m.winner.n ? m.b : m.a) : null;

export type RealBracket = { rounds: PoRound[]; third: PoMatch; champion: PoTeam };

/**
 * @param buckets   per-round API matches (r32/r16/qf/sf/f), in display order.
 * @param titles    round key → localized title.
 * @param apiThird  the API's own 3rd-place match, if any (else a blank match).
 */
export function projectBracket(
  buckets: Record<string, PoMatch[]>,
  titles: Record<string, string>,
  apiThird: PoMatch
): RealBracket {
  const rounds: PoRound[] = [];
  let prev: PoMatch[] | null = null;

  for (const k of ORDER) {
    const count = COUNTS[k];
    const api = buckets[k] ?? [];
    let matches: PoMatch[];
    if (!prev || api.length > 0) {
      // 1/16, or a round the API has started publishing → trust the API (padded).
      matches = Array.from({ length: count }, (_, i) => api[i] ?? blank());
    } else {
      // not yet published → project the winners forward from the previous round.
      const p = prev;
      matches = Array.from({ length: count }, (_, i) => ({
        a: p[2 * i]?.winner ?? null,
        b: p[2 * i + 1]?.winner ?? null,
        scoreA: null, scoreB: null, winner: undefined, played: false,
      }));
    }
    rounds.push({ key: k, title: titles[k], matches });
    prev = matches;
  }

  // 3rd place: the API's own match if it exists, else the two semi-final losers.
  const sf = rounds.find((r) => r.key === "sf")?.matches ?? [];
  const projThird: PoMatch = { a: loserOf(sf[0]), b: loserOf(sf[1]), scoreA: null, scoreB: null, winner: undefined, played: false };
  const third = apiThird.a || apiThird.b ? apiThird : projThird.a || projThird.b ? projThird : blank();

  const champion = rounds.find((r) => r.key === "f")?.matches[0]?.winner ?? null;
  return { rounds, third, champion };
}

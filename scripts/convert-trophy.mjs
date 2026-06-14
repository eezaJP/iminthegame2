// Cut the baked-in checkerboard "transparency" out of the stock trophy webp (v4).
//
// Сложность: белый фон-шахматка и белые ЧАСТИ РИСУНКА (полосы флага, белая
// «талия» кубка с орлом и листом) — один цвет. Различаем по периодичности
// узора шахматки, затем аккуратно доращиваем найденное и чистим артефакты.
//
// 1) fg         = насыщенные/тёмные пиксели (рисунок без белого)
// 2) checker    = строгий тест чередования клеток по обеим осям (seed)
// 3) рост seed  : серые — по соприкосновению; белые — по голосам соседей ±SQ
// 4) silhouette = close(fg, R) ∪ closeVertical(fg, RV)  ← RV добирает широкую
//                 белую талию, зажатую рисунком сверху и снизу
// 5) mask       = silhouette ∧ ¬checker; заливка микро-дыр, дроп микро-остров,
//                 эрозия 1px (анти-кромка), мягкое AA
//
// Проверять ТОЛЬКО на тёмной подложке: scripts/preview-dark.png!
import sharp from "sharp";

const SRC = "C:/Users/alexe/wc2026-dashboard/scripts/trophy-src.webp";
const OUT = "C:/Users/alexe/wc2026-dashboard/public/wc2026-logo.png";
const PREVIEW = "C:/Users/alexe/wc2026-dashboard/scripts/preview-dark.png";
const R = 40;  // замыкание силуэта (мостит полосы флага)
const RP = 30; // "защитное" замыкание: полосы флага недоступны внешней заливке

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;

const fg = new Uint8Array(N), L = new Uint8Array(N), G = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn > 28 || mx < 150) fg[i] = 1;
  else if (mx - mn < 26 && mx >= 193 && mx <= 250) G[i] = 1;
  if (!fg[i] && mx - mn < 20 && mx > 238) L[i] = 1;
}

let runs = [];
for (const y of [8, 16, 24, H - 12]) {
  let run = 0;
  for (let x = 0; x < W; x++) {
    if (G[y * W + x]) run++;
    else if (run > 6) { runs.push(run); run = 0; } else run = 0;
  }
}
runs.sort((a, b) => a - b);
const SQ = runs.length ? runs[Math.floor(runs.length / 2)] : 27;
console.log("checker square ≈", SQ, "px");

const at = (m, x, y) => (x >= 0 && x < W && y >= 0 && y < H ? m[y * W + x] : 0);
function axisPass(self, other, x, y, dx, dy) {
  return (
    (at(other, x + dx * SQ, y + dy * SQ) && at(self, x + dx * 2 * SQ, y + dy * 2 * SQ)) ||
    (at(other, x - dx * SQ, y - dy * SQ) && at(self, x - dx * 2 * SQ, y - dy * 2 * SQ)) ||
    (at(other, x + dx * SQ, y + dy * SQ) && at(other, x - dx * SQ, y - dy * SQ))
  );
}

// --- strict seed
let checker = new Uint8Array(N);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (L[i] && axisPass(L, G, x, y, 1, 0) && axisPass(L, G, x, y, 0, 1)) checker[i] = 1;
    else if (G[i] && axisPass(G, L, x, y, 1, 0) && axisPass(G, L, x, y, 0, 1)) checker[i] = 1;
  }
}

function morphDir(src, radius, isMax, horizontal, vertical, zeroPad = false) {
  let cur = src;
  const pick = isMax ? Math.max : Math.min;
  if (horizontal) {
    const out = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // при эрозии с zeroPad за границей кадра «нули» — кромка кадра не считается заполненной
      let v = isMax ? 0 : (zeroPad && (x - radius < 0 || x + radius > W - 1) ? 0 : 1);
      const lo = Math.max(0, x - radius), hi = Math.min(W - 1, x + radius);
      for (let k = lo; k <= hi; k++) v = pick(v, cur[y * W + k]);
      out[y * W + x] = v;
    }
    cur = out;
  }
  if (vertical) {
    const out = new Uint8Array(N);
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
      let v = isMax ? 0 : (zeroPad && (y - radius < 0 || y + radius > H - 1) ? 0 : 1);
      const lo = Math.max(0, y - radius), hi = Math.min(H - 1, y + radius);
      for (let k = lo; k <= hi; k++) v = pick(v, cur[k * W + x]);
      out[y * W + x] = v;
    }
    cur = out;
  }
  return cur;
}
const close = (src, r, h = true, v = true, zeroPad = false) =>
  morphDir(morphDir(src, r, true, h, v), r, false, h, v, zeroPad);

// --- рост seed: серые цепляются по соприкосновению, белые — по голосам ±SQ
for (let iter = 0; iter < 5; iter++) {
  const near = morphDir(morphDir(checker, 3, true, true, false), 3, true, false, true);
  let added = 0;
  const next = new Uint8Array(checker);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (checker[i] || fg[i]) continue;
      if (G[i] && near[i]) { next[i] = 1; added++; continue; }
      if (L[i]) {
        const votes =
          at(checker, x + SQ, y) + at(checker, x - SQ, y) +
          at(checker, x, y + SQ) + at(checker, x, y - SQ);
        if (votes >= 2 && near[i]) { next[i] = 1; added++; }
      }
    }
  }
  checker = next;
  if (!added) break;
}
checker = morphDir(checker, 2, true, true, true); // AA-швы
for (let i = 0; i < N; i++) if (fg[i]) checker[i] = 0;

// --- внешняя зона: заливка от краёв по не-рисунку, защищённое ядро недоступно.
// Добирает белый ореол-свечение вокруг кубка, который не прошёл тест шахматки.
// Защита: вертикальное замыкание (полосы флага зажаты красным сверху/снизу) +
// узкое замыкание с нулевой границей (перекрывает щели у красного клина, но
// НЕ прилипает к кромке кадра — иначе ореол у границы не вычищается).
const protectV = close(fg, RP, false, true, true);
// вертикальная защита нужна полосам (мяч) и основанию; в талии она строит
// ложные мосты «лента → орёл» и консервирует шахматку — отключаем её там
for (let y = 745; y < 1000; y++) for (let x = 0; x < W; x++) protectV[y * W + x] = 0;
const protectN = close(fg, 18, true, true, true);
const BALL_BOTTOM = 750; // ниже — талия, выше — мяч с полосами
const protect = new Uint8Array(N);
for (let i = 0; i < N; i++) protect[i] = protectV[i] || protectN[i] ? 1 : 0;

// шахматку не вычитаем в зоне мяча — тест кусает концы полос у кромки;
// в талии она обязана вычитаться, иначе остаются «колонны»
for (let y = 0; y < BALL_BOTTOM; y++) for (let x = 0; x < W; x++) checker[y * W + x] = 0;
const exterior = new Uint8Array(N);
{
  const queue = new Int32Array(N);
  let qh = 0, qt = 0;
  const push = (i) => {
    if (!exterior[i] && !fg[i] && !protect[i]) { exterior[i] = 1; queue[qt++] = i; }
  };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (qh < qt) {
    const i = queue[qh++];
    const x = i % W, y = (i / W) | 0;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
}

// --- silhouette
const sil1 = close(fg, R);
let mask = new Uint8Array(N);
for (let i = 0; i < N; i++) mask[i] = sil1[i] && !checker[i] && !exterior[i] ? 1 : 0;

// --- components: заливаем дыры <= HOLE_MAX, выкидываем острова <= ISLE_MAX
const HOLE_MAX = 1200, ISLE_MAX = 1200;
function components(bin, value) {
  const seen = new Uint8Array(N), queue = new Int32Array(N), comps = [];
  for (let s = 0; s < N; s++) {
    if (bin[s] !== value || seen[s]) continue;
    let qh = 0, qt = 0, touchesBorder = false;
    queue[qt++] = s; seen[s] = 1;
    const px = [];
    while (qh < qt) {
      const i = queue[qh++]; px.push(i);
      const x = i % W, y = (i / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesBorder = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (bin[j] === value && !seen[j]) { seen[j] = 1; queue[qt++] = j; }
      }
    }
    comps.push({ px, touchesBorder });
  }
  return comps;
}
for (const c of components(mask, 0)) {
  if (!c.touchesBorder && c.px.length <= HOLE_MAX) for (const i of c.px) mask[i] = 1;
}
for (const c of components(mask, 1)) {
  if (c.px.length <= ISLE_MAX) for (const i of c.px) mask[i] = 0;
}

// мажоритарное сглаживание 5×5 — скругляет ступеньки от вырезанных клеток
for (let pass = 0; pass < 2; pass++) {
  const sm = new Uint8Array(N);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let s = 0, c = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < H && xx >= 0 && xx < W) { s += mask[yy * W + xx]; c++; }
      }
      sm[y * W + x] = s * 2 > c ? 1 : 0;
    }
  }
  mask = sm;
}
mask = morphDir(mask, 1, false, true, true); // эрозия 1px против светлой кромки

// --- alpha + AA
const alpha = new Uint8Array(N);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let s = 0, c = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < H && xx >= 0 && xx < W) { s += mask[yy * W + xx]; c++; }
    }
    alpha[y * W + x] = Math.round((s / c) * 255);
  }
}
for (let i = 0; i < N; i++) data[i * 4 + 3] = alpha[i];

const cut = sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim();
await cut.clone().png().toFile(OUT);
await cut.clone().flatten({ background: "#0a140e" }).jpeg({ quality: 92 }).toFile(PREVIEW);
const m = await sharp(OUT).metadata();
console.log("done:", m.width, "x", m.height, "alpha:", m.hasAlpha);

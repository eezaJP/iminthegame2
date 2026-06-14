// Footballer line-art: вырезаем шахматный фон, оставляем белые линии.
// Линии — белые, как и белые клетки шахматки, поэтому цветом их не отличить.
// Подход: восстанавливаем решётку шахматки (размер клетки + фаза + какая
// чётность серая), строим ОЖИДАЕМЫЙ фон и берём в арт всё, что от него
// отличается. Разрывы линий поверх белых клеток мостим замыканием.
import sharp from "sharp";

const SRC = "C:/Users/alexe/wc2026-dashboard/scripts/player-src.jpg";
const OUT = "C:/Users/alexe/wc2026-dashboard/public/player-icon.png";
const PREVIEW = "C:/Users/alexe/wc2026-dashboard/scripts/player-preview.png";

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;

const lum = new Float32Array(N);
const G = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
  lum[i] = (r + g + b) / 3;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn < 26 && mx >= 195 && mx <= 248) G[i] = 1;
}

// период шахматки (2 клетки) — по минимуму автокорреляции яркости:
// lum(x) ≈ lum(x + period), сильнее всего отличается на полупериоде
let bestP = 36, bestScore = Infinity;
for (let p = 16; p <= 90; p++) {
  let sum = 0, n = 0;
  for (let y = 11; y < H; y += 53) {
    for (let x = 0; x + p < W; x += 7) {
      sum += Math.abs(lum[y * W + x] - lum[y * W + x + p]);
      n++;
    }
  }
  const score = sum / n;
  if (score < bestScore) { bestScore = score; bestP = p; }
}
const P = bestP; // полный период (2 клетки); сама решётка нерегулярна и ниже не используется

// ЛОКАЛЬНЫЙ тест шахматки (глобальная решётка не работает — клетка дробная,
// фаза уплывает): соседи через 2·SQ того же цвета, через SQ — другого.
// Линии ярче белых клеток (~254 против ~246) — добираем порогом яркости.
// Шахматка тут нерегулярная (картинка сгенерирована ИИ), периодичность не
// работает. Морфология: белые КЛЕТКИ толстые (~18px) и переживают эрозию,
// тонкие ЛИНИИ (≤10px) — нет. art = светлое минус восстановленные клетки.
console.log("period:", P, "(не используется, minDiff:", bestScore.toFixed(2) + ")");
const L = new Uint8Array(N);
for (let i = 0; i < N; i++) if (lum[i] > 238) L[i] = 1;

function morph(src, radius, isMax) {
  const tmp = new Uint8Array(N), out = new Uint8Array(N);
  const pick = isMax ? Math.max : Math.min;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = isMax ? 0 : 1;
    const lo = Math.max(0, x - radius), hi = Math.min(W - 1, x + radius);
    for (let k = lo; k <= hi; k++) v = pick(v, src[y * W + k]);
    tmp[y * W + x] = v;
  }
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
    let v = isMax ? 0 : 1;
    const lo = Math.max(0, y - radius), hi = Math.min(H - 1, y + radius);
    for (let k = lo; k <= hi; k++) v = pick(v, tmp[k * W + x]);
    out[y * W + x] = v;
  }
  return out;
}

// клетки = открытие светлой маски (эрозия 6 убивает линии, клетки выживают)
const cells = morph(morph(L, 6, false), 8, true);
let art = new Uint8Array(N);
for (let i = 0; i < N; i++) art[i] = L[i] && !cells[i] ? 1 : 0;

// мостим разрывы линий поверх белых клеток (там линия почти невидима)
art = morph(morph(art, 12, true), 12, false);

// компоненты: мусор выкидываем, внутренние дыры заливаем → сплошная пиктограмма
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
for (const c of components(art, 1)) {
  if (c.px.length < 400) for (const i of c.px) art[i] = 0; // мусор
}
for (const c of components(art, 0)) {
  if (!c.touchesBorder) for (const i of c.px) art[i] = 1; // внутренние дыры → залить
}
// скругление ступенек: гауссово размытие маски + порог
{
  const bytes = Buffer.alloc(N);
  for (let i = 0; i < N; i++) bytes[i] = art[i] ? 255 : 0;
  const { data: blurred, info: bi } = await sharp(bytes, { raw: { width: W, height: H, channels: 1 } })
    .blur(6).raw().toBuffer({ resolveWithObject: true });
  console.log("blur channels:", bi.channels, bi.width, bi.height);
  for (let i = 0; i < N; i++) art[i] = blurred[i * bi.channels] > 127 ? 1 : 0;
}

// белые линии + сглаженная альфа
const out = Buffer.alloc(N * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let s = 0, c = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < H && xx >= 0 && xx < W) { s += art[yy * W + xx]; c++; }
    }
    const i = y * W + x;
    out[i * 4] = 255; out[i * 4 + 1] = 255; out[i * 4 + 2] = 255;
    out[i * 4 + 3] = Math.round((s / c) * 255);
  }
}

const cut = sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim();
await cut.clone().png().toFile(OUT);
// превью на зелёном — имитация квадрата логотипа
await cut.clone().flatten({ background: "#0e9f6e" }).png().toFile(PREVIEW);
const m = await sharp(OUT).metadata();
console.log("done:", m.width, "x", m.height);

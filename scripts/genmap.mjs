// Builds src/data/map.json — real geographic SVG paths for the host countries'
// states/provinces (US/CA/MX) plus projected host-city positions.
// Run: node scripts/genmap.mjs   (after na-admin1.geojson exists)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { geoMercator, geoPath } from "d3-geo";
import rewind from "@mapbox/geojson-rewind";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const W = 1000;
const H = 680;

// drop far-flung / arctic regions so the map frames the populated band
const EXCLUDE = new Set([
  "Alaska", "Hawaii", "Nunavut", "Northwest Territories", "Yukon",
]);

const C3 = { USA: "USA", CAN: "CAN", MEX: "MEX" };

// host cities: id matches tournament HOST_CITIES, with lon/lat + the state they light up
const CITIES = [
  { id: 0, city: "Ванкувер", country: "CAN", state: "British Columbia", lon: -123.12, lat: 49.28 },
  { id: 1, city: "Сиэтл", country: "USA", state: "Washington", lon: -122.33, lat: 47.61 },
  { id: 2, city: "Сан-Франциско", country: "USA", state: "California", lon: -121.97, lat: 37.4 },
  { id: 3, city: "Лос-Анджелес", country: "USA", state: "California", lon: -118.34, lat: 33.95 },
  { id: 4, city: "Гвадалахара", country: "MEX", state: "Jalisco", lon: -103.35, lat: 20.67 },
  { id: 5, city: "Мехико", country: "MEX", state: "Distrito Federal", lon: -99.13, lat: 19.43 },
  { id: 6, city: "Монтеррей", country: "MEX", state: "Nuevo León", lon: -100.32, lat: 25.69 },
  { id: 7, city: "Хьюстон", country: "USA", state: "Texas", lon: -95.37, lat: 29.76 },
  { id: 8, city: "Даллас", country: "USA", state: "Texas", lon: -97.04, lat: 32.74 },
  { id: 9, city: "Канзас-Сити", country: "USA", state: "Missouri", lon: -94.58, lat: 39.1 },
  { id: 10, city: "Атланта", country: "USA", state: "Georgia", lon: -84.39, lat: 33.75 },
  { id: 11, city: "Майами", country: "USA", state: "Florida", lon: -80.21, lat: 25.78 },
  { id: 12, city: "Торонто", country: "CAN", state: "Ontario", lon: -79.38, lat: 43.65 },
  { id: 13, city: "Бостон", country: "USA", state: "Massachusetts", lon: -71.06, lat: 42.36 },
  { id: 14, city: "Нью-Йорк", country: "USA", state: "New Jersey", lon: -74.07, lat: 40.81 },
  { id: 15, city: "Филадельфия", country: "USA", state: "Pennsylvania", lon: -75.16, lat: 39.95 },
];

const ACTIVE_STATES = new Set(CITIES.map((c) => c.state));

const raw = JSON.parse(readFileSync(join(ROOT, "na-admin1.geojson"), "utf8"));
const kept = raw.features.filter(
  (f) => C3[f.properties.adm0_a3] && !EXCLUDE.has(f.properties.name)
);
// fix polygon winding to RFC7946 (CCW outer) so d3-geo projects correctly
const fitCollection = rewind({ type: "FeatureCollection", features: kept }, true);
const features = fitCollection.features;
const projection = geoMercator().fitExtent([[22, 22], [W - 22, H - 22]], fitCollection);
const path = geoPath(projection);

const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(1));

const states = features.map((f, i) => {
  const name = f.properties.name;
  const country = f.properties.adm0_a3;
  return {
    id: i,
    name,
    country,
    active: ACTIVE_STATES.has(name),
    d: round(path(f) || ""),
  };
});

const cities = CITIES.map((c) => {
  const [x, y] = projection([c.lon, c.lat]);
  return { ...c, x: +x.toFixed(1), y: +y.toFixed(1) };
});

writeFileSync(
  join(ROOT, "src", "data", "map.json"),
  JSON.stringify({ width: W, height: H, states, cities }, null, 0)
);

const active = states.filter((s) => s.active).length;
console.log(`✓ map.json — ${states.length} regions (${active} active), ${cities.length} cities`);

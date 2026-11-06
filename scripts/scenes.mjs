// Draws the three window scenes in the site header (fall, winter, summer) as
// flat-ink SVG, 1440×240, into src/assets/header/. This file is their source:
// to change a scene, edit it here and run `node scripts/scenes.mjs`, then
// check every season with ?season=. Don't hand-edit the SVGs, and don't export
// them from Figma (its export is about four times the size).
//
// Mont Royal sits a little left of centre, the sun/moon a little right,
// so both survive the narrowest cover crop (about x 540–900).
//
// The sticky and tape colours below are copies of --season-sticky and
// --season-tape in src/styles/global.css, so the view, the sticky note and the
// tape share colours. Change a season colour in both places.
import { writeFileSync } from 'node:fs';

const W = 1440, H = 240;
const r1 = n => Math.round(n * 10) / 10;

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Foundations inks (exact hex, so Figma can bind them back to variables).
const P = { ink: '#1A1F2B', window: '#F2F4F3', card: '#FFFFFF', oxblood: '#8C2F39', mustard: '#C99A2E' };
const SEASON = {
  fall:   { sticky: '#E8A867', tape: '#A44A3F' },
  winter: { sticky: '#C9D8E6', tape: '#7D8FA3' },
  summer: { sticky: '#C8D99A', tape: '#6E8B5E' },
};

const INKS = {
  fall: {
    sky: '#246A6B', orb: P.mustard, cloud: '#F0D9C8', far: '#1F4D3B', hill: SEASON.fall.tape,
    canopy: ['#EDB040', '#E0662A', SEASON.fall.sticky], greystone: '#B3A99A', glass: P.window,
  },
  winter: {
    sky: '#2E4F6E', orb: P.window, crater: SEASON.winter.sticky, far: '#34505F', hill: SEASON.winter.sticky,
    canopy: [SEASON.winter.tape, '#9FB3C3'], fir: '#2B4654', greystone: '#8D8A86',
    glass: '#33475E', lit: '#F2D27A', snow: P.card, beacon: '#D2493E',
  },
  summer: {
    sky: '#3E8FA0', orb: '#F2C14E', cloud: P.window, far: '#1F4D3B', hill: '#2E6B3A',
    canopy: ['#5E9A45', SEASON.summer.tape, '#9BC25A', SEASON.summer.sticky], greystone: '#B3A99A', glass: P.window,
  },
};

// Hill profiles as sums of gaussians: y = base - sum(amp * exp(-((x-c)/w)^2)).
const bell = (x, c, amp, w) => amp * Math.exp(-(((x - c) / w) ** 2));
const main = x => 184 - bell(x, 640, 122, 300) - bell(x, 900, 18, 120);
const farR = x => 196 - bell(x, 1070, 100, 210);
const farL = x => 196 - bell(x, 210, 74, 190);

// Smooth closed silhouette from a profile, via Catmull-Rom → cubic.
function silhouette(fn, x0 = -20, x1 = W + 20, step = 60) {
  const pts = [];
  for (let x = x0; x <= x1; x += step) pts.push([x, fn(x)]);
  let d = `M${x0} ${H}L${pts[0][0]} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${p2[0]} ${r1(p2[1])}`;
  }
  return d + `L${x1} ${H}Z`;
}

const ellipse = (cx, cy, rx, ry) =>
  `M${r1(cx - rx)} ${r1(cy)}a${rx} ${ry} 0 1 1 ${r1(2 * rx)} 0a${rx} ${ry} 0 1 1 ${r1(-2 * rx)} 0Z`;
const circle = (cx, cy, r) => ellipse(cx, cy, r, r);
const rect = (x, y, w, h) => `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;
const fir = (x, base, h) => {
  const w = h * 0.55, r1 = Math.round;
  return `M${r1(x)} ${r1(base - h)}L${r1(x + w * 0.32)} ${r1(base - h * 0.5)}L${r1(x + w * 0.18)} ${r1(base - h * 0.5)}` +
    `L${r1(x + w / 2)} ${r1(base)}L${r1(x - w / 2)} ${r1(base)}L${r1(x - w * 0.18)} ${r1(base - h * 0.5)}` +
    `L${r1(x - w * 0.32)} ${r1(base - h * 0.5)}Z`;
};
// A cloud: three bumps on a flat bottom.
const cloud = (x, y, s) =>
  circle(x + 18 * s, y - 6 * s, 12 * s) + circle(x + 36 * s, y - 12 * s, 16 * s) + circle(x + 56 * s, y - 5 * s, 11 * s) +
  `M${r1(x + 4 * s)} ${r1(y)}a${r1(6 * s)} ${r1(6 * s)} 0 0 1 ${r1(6 * s)} ${r1(-6 * s)}h${r1(54 * s)}a${r1(6 * s)} ${r1(6 * s)} 0 0 1 0 ${r1(12 * s)}` +
  `h${r1(-54 * s)}a${r1(6 * s)} ${r1(6 * s)} 0 0 1 ${r1(-6 * s)} ${r1(-6 * s)}Z`;
const leaf = (x, y, len, ang) => {
  const dx = r1(Math.cos(ang) * len), dy = r1(Math.sin(ang) * len), r = r1(len * 0.62);
  return `M${r1(x)} ${r1(y)}a${r} ${r} 0 0 1 ${dx} ${dy}a${r} ${r} 0 0 1 ${-dx} ${-dy}Z`;
};

function scene(season) {
  const ink = INKS[season];
  const rand = rng({ fall: 7, winter: 11, summer: 23 }[season]);
  const layers = [];
  const add = (id, d, fill, extra = '') => d && layers.push(`<path id="${id}" d="${d}" fill="${fill}"${extra}/>`);

  add('sky', rect(0, 0, W, H), ink.sky);

  // Sun or moon, right of centre, in the gap between the mullion and the Contact button on a phone.
  const orb = [762, 58, 30];
  add(season === 'winter' ? 'moon' : 'sun', circle(...orb), ink.orb);
  if (season === 'winter') {
    add('moon-craters', circle(752, 50, 6) + circle(773, 70, 4) + circle(776, 46, 3), ink.crater);
  }

  if (ink.cloud) {
    const clouds = season === 'fall'
      ? cloud(500, 44, 0.9) + cloud(1180, 64, 1.1) + cloud(90, 36, 1)
      : cloud(470, 50, 1) + cloud(920, 104, 0.8) + cloud(1210, 46, 1.2) + cloud(130, 70, 0.9);
    add('clouds', clouds, ink.cloud);
  }

  add('hill-far', silhouette(farL) + silhouette(farR), ink.far);
  add('mont-royal', silhouette(main), ink.hill);

  // The cross on the eastern face, and the transmitter mast just south of it (left, seen from the Plateau).
  const cx = 676, cb = Math.round(main(cx) + 6);
  add('cross', rect(cx - 2, cb - 44, 4, 44) + rect(cx - 12, cb - 35, 24, 4), season === 'winter' ? ink.snow : P.ink);
  const mx = 630, mb = main(mx) + 6;
  const b = Math.round(mb);
  layers.push(`<path id="mast" d="M${mx - 7} ${b}L${mx - 1.5} ${b - 46}M${mx + 7} ${b}L${mx + 1.5} ${b - 46}` +
    `M${mx - 6} ${b - 6}L${mx + 5} ${b - 17}L${mx - 4} ${b - 26}L${mx + 3} ${b - 35}L${mx - 2} ${b - 44}` +
    `M${mx - 4} ${b - 26}h8M${mx} ${b - 46}v-14" fill="none" stroke="${P.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);
  if (season === 'winter') add('mast-light', circle(mx, b - 61, 2.5), ink.beacon);

  // Trees in rows that follow the slope, back to front.
  const rows = 8;
  for (let k = 0; k < rows; k++) {
    const groups = ink.canopy.map(() => '');
    let firs = '';
    for (let x = -14 + (k % 2) * 14 + rand() * 6; x < W + 14; x += 26 + rand() * 6) {
      const y = Math.round(main(x) + 10 + k * 17 + rand() * 4);
      if (y > 198) continue;
      const rx = Math.round(10 + rand() * 4), ry = Math.round(13 + rand() * 4);
      if (season === 'winter' && rand() < 0.42) {
        firs += fir(Math.round(x), y + ry, ry * 2.4);
      } else {
        groups[Math.floor(rand() * groups.length)] += ellipse(Math.round(x), y, rx, ry);
      }
    }
    groups.forEach((d, i) => add(`trees-${k + 1}-canopy-${i + 1}`, d, ink.canopy[i]));
    add(`trees-${k + 1}-firs`, firs, ink.fir);
  }

  // A street of Plateau triplexes across the bottom.
  let brick = '', stone = '', glass = '', lit = '', inkd = '', snow = '', stairs = '', rails = '';
  let x = -8, n = 0;
  while (x < W + 8) {
    const w = Math.round(104 + rand() * 46), roof = Math.round(186 + rand() * 12);
    const isStone = n % 3 === 2;
    (isStone ? (s => (stone += s)) : (s => (brick += s)))(rect(x, roof, w, H - roof));
    inkd += rect(x - 3, roof - 7, w + 6, 7) + rect(x, roof, w, 2);
    const nWin = w > 132 ? 3 : 2, gap = (w - nWin * 18) / (nWin + 1);
    for (let i = 0; i < nWin; i++) {
      const wx = x + gap + i * (18 + gap), wy = roof + 13;
      const pane = rect(wx, wy, 18, 22);
      if (season === 'winter' && rand() < 0.6) lit += pane; else glass += pane;
      inkd += rect(wx - 2, wy - 4, 22, 3) + rect(wx - 2, wy + 22, 22, 2);
      rails += `M${r1(wx + 9)} ${wy}v22M${r1(wx)} ${wy + 10}h18`;
    }
    // Second-floor balcony railing.
    const ry = roof + 44;
    inkd += rect(x + 4, ry, w - 8, 3);
    rails += `M${x + 8} ${ry + 3}v${H - ry - 3}` + `m8 ${-(H - ry - 3)}v${H - ry - 3}`.repeat(Math.floor((w - 16) / 8));
    if (season === 'winter') snow += rect(x - 3, roof - 11, w + 6, 4) + rect(x + 4, ry - 2, w - 8, 2);
    // The outdoor staircase, curving down from every other balcony.
    if (n % 2 === 0) {
      const sx = x + w - 16;
      stairs += `M${sx} ${ry + 2}C${sx + 26} ${ry + 10} ${sx - 22} ${ry + 18} ${sx + 4} ${H + 6}` +
        `M${sx - 10} ${ry + 2}C${sx + 16} ${ry + 10} ${sx - 32} ${ry + 18} ${sx - 6} ${H + 6}`;
    }
    x += w; n++;
  }
  add('triplexes-brick', brick, P.oxblood);
  add('triplexes-greystone', stone, ink.greystone);
  add('windows', glass, ink.glass);
  add('windows-lit', lit, ink.lit);
  add('triplexes-ink', inkd, P.ink);
  layers.push(`<path id="railings" d="${rails}" fill="none" stroke="${P.ink}" stroke-width="1.5"/>`);
  stairs && layers.push(`<path id="staircases" d="${stairs}" fill="none" stroke="${P.ink}" stroke-width="3" stroke-linecap="round"/>`);
  add('roof-snow', snow, ink.snow);

  // Weather, in front of everything.
  if (season === 'fall') {
    const leaves = [[520, 92], [585, 128], [770, 104], [880, 128], [960, 86], [610, 26], [300, 96], [1120, 120], [1330, 100], [180, 140]];
    const fills = [ink.canopy[0], ink.canopy[1], ink.canopy[2]];
    const byFill = fills.map(() => '');
    leaves.forEach(([lx, ly], i) => (byFill[i % 3] += leaf(lx, ly, 15, rand() * Math.PI * 2)));
    byFill.forEach((d, i) => add(`leaves-${i + 1}`, d, fills[i]));
  }
  if (season === 'winter') {
    let d = '';
    for (let i = 0; i < 70; i++) d += circle(Math.round(rand() * W), Math.round(rand() * (H - 10)), r1(1.4 + rand() * 1.2));
    add('snowfall', d, ink.snow);
  }
  if (season === 'summer') {
    const bird = (bx, by, s) => `M${bx} ${by}q${4 * s} ${-5 * s} ${8 * s} 0q${4 * s} ${-5 * s} ${8 * s} 0`;
    layers.push(`<path id="birds" d="${bird(560, 92, 1) + bird(588, 80, 0.8) + bird(1010, 70, 0.9)}" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${layers.join('')}</svg>`;
}

for (const s of ['fall', 'winter', 'summer']) {
  const svg = scene(s);
  writeFileSync(new URL(`../src/assets/header/${s}.svg`, import.meta.url), svg);
  console.log(s, (svg.length / 1024).toFixed(1) + 'KB', (svg.match(/<path/g) || []).length, 'paths');
}

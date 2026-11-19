// Canvas decoration for the cover: sunset sky, sun disc, palm and skyline
// silhouettes, halftone dots and film grain. Everything is drawn in code —
// no external artwork. The grain uses a fixed-seed generator so every
// render of the same cover is byte-identical.

/** Deterministic pseudo-random generator (mulberry32). */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Paints the gradient sky over the rect (x, y, w, h). */
export function drawSky(ctx, x, y, w, h, sky) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, sky[0]);
  g.addColorStop(0.55, sky[1]);
  g.addColorStop(1, sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** Paints a big low sun disc with a soft halo. */
export function drawSun(ctx, cx, cy, r, color, halo) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  glow.addColorStop(0, halo);
  glow.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Paints a city skyline silhouette along `baseY`, from x0 to x1. */
export function drawSkyline(ctx, x0, x1, baseY, maxH, color, seed) {
  const rnd = seededRandom(seed);
  ctx.fillStyle = color;
  let x = x0;
  while (x < x1) {
    const bw = (0.03 + rnd() * 0.05) * (x1 - x0);
    const bh = maxH * (0.35 + rnd() * 0.65);
    ctx.fillRect(x, baseY - bh, bw, bh);
    // Rooftop antenna on some towers.
    if (rnd() > 0.6) {
      ctx.fillRect(x + bw * 0.45, baseY - bh - maxH * 0.16, Math.max(2, bw * 0.06), maxH * 0.16);
    }
    // Lit windows: tiny warm dots.
    const lit = Math.floor(rnd() * 5);
    for (let i = 0; i < lit; i++) {
      ctx.fillStyle = 'rgba(255, 214, 130, 0.85)';
      ctx.fillRect(
        x + bw * (0.15 + rnd() * 0.7),
        baseY - bh + bh * (0.15 + rnd() * 0.7),
        Math.max(2, bw * 0.08),
        Math.max(2, bw * 0.08),
      );
      ctx.fillStyle = color;
    }
    x += bw + (x1 - x0) * 0.006;
  }
}

/** Paints one palm-tree silhouette: a curved trunk and drooping fronds. */
export function drawPalm(ctx, x, baseY, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly.
  ctx.lineWidth = s * 0.055;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + s * 0.1, baseY - s * 0.55, x + s * 0.22, baseY - s * 0.92);
  ctx.stroke();
  const topX = x + s * 0.22;
  const topY = baseY - s * 0.92;
  // Fronds: arcs drooping out from the crown.
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const ang = Math.PI * (0.08 + (i / (fronds - 1)) * 0.84);
    const len = s * (0.5 + (i % 2) * 0.1);
    const ex = topX + Math.cos(ang) * len;
    const ey = topY + Math.sin(ang) * len * 0.3 + s * 0.08;
    ctx.lineWidth = s * 0.035;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(ang) * len * 0.55,
      topY - s * 0.16,
      ex,
      ey,
    );
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - s * 0.03, topY + s * 0.05, s * 0.045, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.05, topY + s * 0.06, s * 0.04, 0, Math.PI * 2);
  ctx.fill();
}

/** Paints a field of halftone dots in a corner band. */
export function drawHalftone(ctx, x, y, w, h, color, seed) {
  const rnd = seededRandom(seed);
  const step = Math.max(10, w / 26);
  for (let yy = y; yy < y + h; yy += step) {
    for (let xx = x; xx < x + w; xx += step) {
      const fade = 1 - ((yy - y) / h) * 0.7 - ((xx - x) / w) * 0.3;
      if (fade <= 0.15) continue;
      const r = step * 0.16 * fade * (0.7 + rnd() * 0.6);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(xx + step / 2, yy + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Sprinkles deterministic film grain over the whole canvas (subtle). */
export function drawGrain(ctx, w, h, amount, seed) {
  const rnd = seededRandom(seed);
  const step = Math.max(4, Math.round(w / 320));
  ctx.save();
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = rnd();
      if (v > 0.88) {
        ctx.fillStyle = v > 0.94 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  ctx.restore();
  void amount;
}

/** Soft dark vignette around the edges of a rect. */
export function drawVignette(ctx, x, y, w, h, strength) {
  const g = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.42,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.72,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

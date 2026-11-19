// Layout engine + cover renderer: the three multi-panel layouts, the
// per-panel photo pass with its colour grade, and the drawn caption band.
// One function, renderCover, draws the whole cover onto any 2D canvas at
// any size, so the live preview and the PNG exports are the same picture.

import { drawSky, drawSun, drawSkyline, drawPalm, drawHalftone, drawGrain, drawVignette } from './art.js';
import { gradeById } from './grades.js';

export const LAYOUTS = [
  { id: 'hero', name: 'Hero', blurb: 'One large panel + two small' },
  { id: 'grid', name: 'Grid', blurb: 'Four equal panels' },
  { id: 'strip', name: 'Strip', blurb: 'One wide panel over three small' },
];

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'landscape', name: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
];

/** How many panels a layout shows. */
export function panelCount(layout) {
  return layout === 'hero' ? 3 : 4;
}

/**
 * Panel rectangles for a layout, in cover coordinates. The cover is framed
 * by a white border, a slim sky strip with a skyline on top, the panels in
 * the middle, and the caption band along the bottom.
 */
export function layoutPanels(layout, w, h) {
  const m = Math.round(w * 0.018); // white frame
  const cb = Math.round(h * 0.20); // caption band
  const ts = Math.round(h * 0.045); // sky strip
  const g = Math.max(5, Math.round(w * 0.009)); // white gutter
  const x0 = m;
  const x1 = w - m;
  const y0 = m + ts;
  const y1 = h - cb;
  const pw = x1 - x0;
  const ph = y1 - y0;
  const inset = (r) => ({ x: r.x + g / 2, y: r.y + g / 2, w: r.w - g, h: r.h - g });
  if (layout === 'hero') {
    const leftW = pw * 0.6;
    const rightX = x0 + leftW + g;
    const rightW = x1 - rightX;
    const halfH = (ph - g) / 2;
    return [
      inset({ x: x0, y: y0, w: leftW, h: ph }),
      inset({ x: rightX, y: y0, w: rightW, h: halfH }),
      inset({ x: rightX, y: y0 + halfH + g, w: rightW, h: halfH }),
    ];
  }
  if (layout === 'grid') {
    const cw = (pw - g) / 2;
    const ch = (ph - g) / 2;
    return [
      inset({ x: x0, y: y0, w: cw, h: ch }),
      inset({ x: x0 + cw + g, y: y0, w: cw, h: ch }),
      inset({ x: x0, y: y0 + ch + g, w: cw, h: ch }),
      inset({ x: x0 + cw + g, y: y0 + ch + g, w: cw, h: ch }),
    ];
  }
  // strip: one wide panel over three small ones.
  const topH = ph * 0.54;
  const botY = y0 + topH + g;
  const botH = y1 - botY;
  const cw = (pw - g * 2) / 3;
  return [
    inset({ x: x0, y: y0, w: pw, h: topH }),
    inset({ x: x0, y: botY, w: cw, h: botH }),
    inset({ x: x0 + cw + g, y: botY, w: cw, h: botH }),
    inset({ x: x0 + (cw + g) * 2, y: botY, w: cw, h: botH }),
  ];
}

/** Draws one photo into a panel rect, cover-fit, with its grade applied. */
export function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!photo) {
    // Empty panel: deep grade-tinted fill with an invitation, not a hole.
    ctx.fillStyle = grade.silhouette;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = grade.accent;
    for (let x = rect.x - rect.h; x < rect.x + rect.w; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, rect.y + rect.h);
      ctx.lineTo(x + rect.h, rect.y);
      ctx.lineTo(x + rect.h + 12, rect.y);
      ctx.lineTo(x + 12, rect.y + rect.h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const fs = Math.max(14, rect.w * 0.055);
    ctx.font = `700 ${fs}px "Arial Narrow", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
    return;
  }
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (panel.oy || 0) * rect.h;
  ctx.filter = grade.filter;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.filter = 'none';
  // Grade tint overlay, then a soft vignette inside the panel.
  ctx.globalCompositeOperation = grade.overlayMode;
  ctx.fillStyle = grade.overlay;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  drawVignette(ctx, rect.x, rect.y, rect.w, rect.h, 0.28);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px "Arial Narrow", Impact, "HelveticaNeue-CondensedBold", sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px "Arial Narrow", Impact, "HelveticaNeue-CondensedBold", sans-serif`;
  }
  return size;
}

/**
 * Renders the full cover: white poster frame, drawn sky + skyline strip,
 * graded photo panels with white gutters, caption band with sun, palms,
 * halftone and grain. `state` carries layout, grade, caption, subtitle and
 * per-panel photo state; `photos` is the array of loaded images.
 */
export function renderCover(ctx, state, photos, w, h) {
  const grade = gradeById(state.grade);
  const m = Math.round(w * 0.018);
  const cb = Math.round(h * 0.20);
  const ts = Math.round(h * 0.045);

  // Poster frame + sky backdrop.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  drawSky(ctx, m, m, w - 2 * m, h - 2 * m, grade.sky);

  // Slim sky strip: skyline silhouette + a small sun.
  drawSkyline(ctx, m, w - m, m + ts, ts * 0.85, grade.silhouette, 7);
  drawSun(ctx, w - m - ts * 1.4, m + ts * 0.55, ts * 0.62, grade.sun, grade.halo);

  // Panels on a white bed, so the gutters read as white dividers.
  const y0 = m + ts;
  const y1 = h - cb;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(m, y0, w - 2 * m, y1 - y0);
  const panels = layoutPanels(state.layout, w, h);
  for (let i = 0; i < panels.length; i++) {
    const p = state.panels[i] || { photo: -1, ox: 0, oy: 0, zoom: 1 };
    const img = p.photo >= 0 ? photos[p.photo] : null;
    drawPanelPhoto(ctx, img, panels[i], p, grade);
  }

  // Caption band: sun, palms at the edges, halftone corner.
  const bandY = h - cb;
  drawSun(ctx, w - m - cb * 0.52, bandY + cb * 0.52, cb * 0.36, grade.sun, grade.halo);
  drawPalm(ctx, m + cb * 0.06, h - m, cb * 1.05, grade.silhouette);
  drawPalm(ctx, w - m - cb * 0.06, h - m, cb * 0.9, grade.silhouette);
  drawHalftone(ctx, m + cb * 0.1, bandY + cb * 0.06, cb * 1.1, cb * 0.5, 'rgba(255,255,255,0.5)', 11);

  // Title: heavy condensed caps, black outline, soft shadow, accent bar.
  const title = (state.caption || 'VICE CITY').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const titleSize = fitFont(ctx, title, w * 0.66, cb * 0.46, 900);
  try { ctx.letterSpacing = `${Math.round(titleSize * 0.02)}px`; } catch { /* older canvas */ }
  const titleY = bandY + cb * 0.58;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = Math.max(3, titleSize * 0.09);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = titleSize * 0.12;
  ctx.shadowOffsetY = titleSize * 0.04;
  ctx.strokeText(title, w / 2, titleY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, w / 2, titleY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Accent bar under the title.
  const barW = Math.min(w * 0.3, ctx.measureText(title).width * 0.5);
  ctx.fillStyle = grade.accent;
  ctx.fillRect((w - barW) / 2, titleY + cb * 0.07, barW, Math.max(3, cb * 0.028));
  // Subtitle: wide-tracked white caps with a dark outline, so it reads on
  // every grade's sky.
  if (sub) {
    const subSize = fitFont(ctx, sub, w * 0.6, cb * 0.13, 700);
    try { ctx.letterSpacing = `${Math.round(subSize * 0.25)}px`; } catch { /* older canvas */ }
    ctx.font = `700 ${subSize}px "Arial Narrow", Impact, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, subSize * 0.14);
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.strokeText(sub, w / 2, bandY + cb * 0.88);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, w / 2, bandY + cb * 0.88);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }

  // Grain over everything, then a thin inner frame line.
  drawGrain(ctx, w, h, 1, 20261119);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = Math.max(1, w * 0.0015);
  ctx.strokeRect(m + 0.5, m + 0.5, w - 2 * m - 1, h - 2 * m - 1);
}

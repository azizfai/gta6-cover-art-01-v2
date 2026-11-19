// Fixed scenes for screenshots and the PNG export helpers.
// `?shot=cover` shows the cover alone, full frame; `?shot=editor` shows the
// editor with a sample photo loaded. window.__shotReady is set once painted.
// Query params: layout, grade, photo, photo2, caption, subtitle, size.

import { EXPORT_SIZES, renderCover } from './cover.js';

/** The three export sizes, by id. */
export function exportSizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[0];
}

/** Renders the cover at w×h and resolves with a PNG blob. */
export function exportPNG(state, photos, w, h) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    renderCover(canvas.getContext('2d'), state, photos, w, h);
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/** Triggers a browser download of a blob. */
export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

/**
 * Sets up a fixed screenshot scene. `api` is the app's control surface:
 * loadSample(name), applyShot(query), renderCoverToCanvas(w, h), ready().
 */
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  api.applyShot(query);
  const photo = query.get('photo') ?? 'boulevard';
  const photo2 = query.get('photo2') ?? 'pier';
  await api.loadSample(photo);
  await api.loadSample(photo2);
  api.render();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

// App bootstrap + state: loads photos, wires every control, renders the
// live preview, and handles drag-to-position / wheel-to-zoom per panel.

import { LAYOUTS, EXPORT_SIZES, panelCount, layoutPanels, renderCover } from './cover.js';
import { GRADES } from './grades.js';
import { exportPNG, downloadBlob, runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const zoomInput = document.getElementById('zoom');
const panelLabel = document.getElementById('panelLabel');

const SAMPLES = ['boulevard', 'pier'];

const state = {
  layout: 'hero',
  grade: 'sunset',
  caption: 'VICE CITY',
  subtitle: 'A LEONIDA STORY',
  size: 'square',
  panels: [
    { photo: 0, ox: 0, oy: 0, zoom: 1 },
    { photo: 1, ox: 0, oy: 0, zoom: 1 },
    { photo: 0, ox: 0, oy: 0, zoom: 1 },
    { photo: 1, ox: 0, oy: 0, zoom: 1 },
  ],
};

const photos = []; // HTMLImageElement per slot; index matches panel.photo
let selected = 0;
let dragging = null;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads a built-in sample photo into the next free slot (or reuses it). */
export async function loadSample(name) {
  const existing = photos.findIndex((p) => p && p.dataset.sample === name);
  if (existing !== -1) return existing;
  const img = await loadImage(`samples/${name}.jpg`);
  img.dataset.sample = name;
  photos.push(img);
  return photos.length - 1;
}

function currentSize() {
  return EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
}

function sizePreviewCanvas() {
  if (document.body.classList.contains('shot-cover')) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    const s = currentSize();
    canvas.width = s.w;
    canvas.height = s.h;
  }
}

/** Renders the cover to the preview canvas, then the selection outline. */
export function render() {
  sizePreviewCanvas();
  renderCover(canvas.getContext('2d'), state, photos, canvas.width, canvas.height);
  if (!document.body.classList.contains('shot-cover')) {
    const panels = layoutPanels(state.layout, canvas.width, canvas.height);
    const n = panelCount(state.layout);
    const sel = panels[Math.min(selected, n - 1)];
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = '#37f4e4';
    ctx.lineWidth = Math.max(3, canvas.width * 0.004);
    ctx.setLineDash([18, 10]);
    ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#37f4e4';
    ctx.font = `700 ${Math.round(canvas.width * 0.016)}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`PANEL ${Math.min(selected, n - 1) + 1}`, sel.x + 10, sel.y + canvas.width * 0.024);
    ctx.restore();
  }
  panelLabel.textContent = `Panel ${selected + 1} of ${panelCount(state.layout)} selected — drag on the cover to move its photo, scroll to zoom.`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

/** Applies ?shot= query params (layout, grade, caption, subtitle, size). */
export function applyShot(query) {
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('caption')) state.caption = query.get('caption');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');
  if (query.get('size')) state.size = query.get('size');
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  syncButtons();
}

function syncButtons() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  zoomInput.value = String(state.panels[selected]?.zoom ?? 1);
}

function buildButtons() {
  const layoutBox = document.getElementById('layouts');
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = l.id;
    b.textContent = `${l.name} — ${l.blurb}`;
    b.addEventListener('click', () => { state.layout = l.id; selected = 0; syncButtons(); render(); });
    layoutBox.appendChild(b);
  }
  const gradeBox = document.getElementById('grades');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = g.id;
    b.textContent = `${g.name} — ${g.blurb}`;
    b.addEventListener('click', () => { state.grade = g.id; syncButtons(); render(); });
    gradeBox.appendChild(b);
  }
  const sizeBox = document.getElementById('sizes');
  for (const s of EXPORT_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = s.id;
    b.textContent = s.name;
    b.addEventListener('click', () => { state.size = s.id; syncButtons(); render(); });
    sizeBox.appendChild(b);
  }
}

function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return { index: i, x, y };
  }
  return null;
}

canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  selected = hit.index;
  const p = state.panels[selected];
  dragging = { startX: hit.x, startY: hit.y, ox: p.ox, oy: p.oy };
  canvas.setPointerCapture(e.pointerId);
  syncButtons();
  render();
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  const p = state.panels[selected];
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const rect = panels[selected];
  // hit.x / hit.y are already in canvas pixels, so the drag delta over the
  // panel size is the pan amount directly.
  p.ox = dragging.ox + (hit.x - dragging.startX) / rect.w;
  p.oy = dragging.oy + (hit.y - dragging.startY) / rect.h;
  p.ox = Math.max(-0.6, Math.min(0.6, p.ox));
  p.oy = Math.max(-0.6, Math.min(0.6, p.oy));
  render();
});

canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('pointercancel', () => { dragging = null; });

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const hit = panelAt(e.clientX, e.clientY);
  if (hit) selected = hit.index;
  const p = state.panels[selected];
  p.zoom = Math.max(1, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  zoomInput.value = String(p.zoom);
  render();
}, { passive: false });

captionInput.addEventListener('input', () => { state.caption = captionInput.value; render(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; render(); });
zoomInput.addEventListener('input', () => {
  state.panels[selected].zoom = Number(zoomInput.value);
  render();
});

document.getElementById('upload').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const img = await loadImage(URL.createObjectURL(file));
    photos.push(img);
    state.panels[selected].photo = photos.length - 1;
  }
  setStatus(`${e.target.files.length} photo(s) loaded into panel ${selected + 1}.`);
  render();
});

document.getElementById('replace').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  photos.push(img);
  state.panels[selected].photo = photos.length - 1;
  setStatus(`Panel ${selected + 1} replaced.`);
  render();
});

document.getElementById('samples').addEventListener('click', async (e) => {
  const name = e.target.closest('[data-sample]')?.dataset.sample;
  if (!name) return;
  const idx = await loadSample(name);
  state.panels[selected].photo = idx;
  setStatus(`Sample "${name}" loaded into panel ${selected + 1}.`);
  render();
});

document.getElementById('fillAll').addEventListener('click', () => {
  const idx = state.panels[selected].photo;
  for (const p of state.panels) p.photo = idx;
  setStatus('All panels now use the selected photo.');
  render();
});

document.getElementById('resetPanels').addEventListener('click', () => {
  state.panels.forEach((p, i) => {
    p.photo = i % photos.length;
    p.ox = 0;
    p.oy = 0;
    p.zoom = 1;
  });
  setStatus('Panel positions reset.');
  render();
});

document.getElementById('exports').addEventListener('click', async (e) => {
  const size = e.target.closest('[data-export]')?.dataset.export;
  if (!size) return;
  const s = EXPORT_SIZES.find((x) => x.id === size);
  const blob = await exportPNG(state, photos, s.w, s.h);
  downloadBlob(blob, `vice-city-cover-${s.w}x${s.h}.png`);
  setStatus(`Saved vice-city-cover-${s.w}x${s.h}.png`);
});

// Headless check hook: renders any export size and returns a PNG data URL.
window.__exportPNG = async function exportPNGDataURL(w, h) {
  const blob = await exportPNG(state, photos, w, h);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};
window.__state = state;
window.__photos = photos;

buildButtons();
syncButtons();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadSample,
    applyShot,
    render,
  });
} else {
  (async () => {
    await loadSample('boulevard');
    await loadSample('pier');
    render();
  })();
}

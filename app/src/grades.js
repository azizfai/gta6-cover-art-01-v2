// The four colour grades. Each grade is a canvas filter applied when a photo
// is drawn, plus a tinted overlay and the sky palette the cover's drawn
// backdrop uses, so the whole cover shifts with the grade.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    blurb: 'Warm golden hour',
    // Canvas 2D filter string for the photo pass.
    filter: 'saturate(1.4) contrast(1.08) brightness(1.04) sepia(0.22)',
    overlay: 'rgba(255, 110, 40, 0.10)',
    overlayMode: 'overlay',
    sky: ['#2b1055', '#ff6a3d', '#ffc46b'],
    sun: '#fff3c4',
    halo: 'rgba(255, 150, 60, 0.55)',
    silhouette: '#1c0b33',
    accent: '#ffcf5c',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    blurb: 'Cool pink / teal night',
    filter: 'saturate(1.7) contrast(1.18) brightness(0.98) hue-rotate(-14deg)',
    overlay: 'rgba(255, 45, 150, 0.12)',
    overlayMode: 'soft-light',
    sky: ['#0b0626', '#7b1e9e', '#ff2e88'],
    sun: '#7df9ff',
    halo: 'rgba(255, 46, 136, 0.5)',
    silhouette: '#0a0420',
    accent: '#37f4e4',
  },
  {
    id: 'noir',
    name: 'Noir',
    blurb: 'High-contrast B&W',
    filter: 'grayscale(1) contrast(1.42) brightness(1.06)',
    overlay: 'rgba(255, 255, 255, 0.07)',
    overlayMode: 'overlay',
    sky: ['#101010', '#4a4a4a', '#d8d8d8'],
    sun: '#ffffff',
    halo: 'rgba(255, 255, 255, 0.35)',
    silhouette: '#000000',
    accent: '#f2f2f2',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    blurb: 'Faded film stock',
    filter: 'sepia(0.55) saturate(0.85) contrast(0.92) brightness(1.08)',
    overlay: 'rgba(250, 235, 200, 0.14)',
    overlayMode: 'soft-light',
    sky: ['#5c4a3a', '#c97e4e', '#eec98f'],
    sun: '#fdf0c8',
    halo: 'rgba(230, 180, 110, 0.45)',
    silhouette: '#33241a',
    accent: '#e8b96f',
  },
];

/** Looks a grade up by id, falling back to Sunset. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

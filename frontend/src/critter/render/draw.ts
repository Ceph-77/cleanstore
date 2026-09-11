/**
 * Helpers canvas bas niveau. Aucune logique de comportement ici.
 */
import type { View } from "../core/types";

/**
 * Cale le backing store du canvas sur la taille CSS × dpr et renvoie le
 * contexte 2D déjà mis à l'échelle (1 unité = 1 px CSS).
 */
export function fitCanvas(canvas: HTMLCanvasElement, view: View): CanvasRenderingContext2D {
  const g = canvas.getContext("2d");
  if (!g) throw new Error("critter: contexte 2D indisponible");
  canvas.width = Math.round(view.width * view.dpr);
  canvas.height = Math.round(view.height * view.dpr);
  canvas.style.width = `${view.width}px`;
  canvas.style.height = `${view.height}px`;
  g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  return g;
}

export function clear(g: CanvasRenderingContext2D, view: View): void {
  g.clearRect(0, 0, view.width, view.height);
}

/** Blob arrondi centré en (0,0), rayon rx/ry (pour le squash-stretch). */
export function blobPath(g: CanvasRenderingContext2D, rx: number, ry: number): void {
  const k = 0.5522847498;
  g.beginPath();
  g.moveTo(0, -ry);
  g.bezierCurveTo(rx * k, -ry, rx, -ry * k, rx, 0);
  g.bezierCurveTo(rx, ry * k, rx * k, ry, 0, ry);
  g.bezierCurveTo(-rx * k, ry, -rx, ry * k, -rx, 0);
  g.bezierCurveTo(-rx, -ry * k, -rx * k, -ry, 0, -ry);
  g.closePath();
}

/** Étoile à `points` branches, centrée en (cx, cy). */
export function starPath(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  points = 5,
  rot = -Math.PI / 2,
): void {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = rot + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
}

/** Mélange deux couleurs hex `#rrggbb` (t ∈ [0,1]). */
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255;
  const ag = (pa >> 8) & 255;
  const ab = pa & 255;
  const br = (pb >> 16) & 255;
  const bg = (pb >> 8) & 255;
  const bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const gg = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) | (r << 16) | (gg << 8) | bl).toString(16).slice(1)}`;
}

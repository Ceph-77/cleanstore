/**
 * Maths vectorielles 2D.
 *
 * Deux styles cohabitent volontairement :
 *  - fonctions pures (`add`, `scale`, …) qui allouent un nouveau Vec2 — pratiques
 *    hors boucle chaude ;
 *  - variantes `…Mut` qui écrivent dans un `out` fourni — à utiliser dans
 *    `update()` / `render()` pour ne rien allouer par frame.
 */
import type { Vec2 } from "./types";

export const vec = (x = 0, y = 0): Vec2 => ({ x, y });
export const clone = (a: Vec2): Vec2 => ({ x: a.x, y: a.y });

export const set = (out: Vec2, x: number, y: number): Vec2 => {
  out.x = x;
  out.y = y;
  return out;
};
export const copy = (out: Vec2, a: Vec2): Vec2 => set(out, a.x, a.y);

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });

export const addMut = (out: Vec2, a: Vec2): Vec2 => set(out, out.x + a.x, out.y + a.y);
export const subMut = (out: Vec2, a: Vec2): Vec2 => set(out, out.x - a.x, out.y - a.y);
export const scaleMut = (out: Vec2, s: number): Vec2 => set(out, out.x * s, out.y * s);
/** out += a * s  — le pas d'intégration le plus courant. */
export const addScaledMut = (out: Vec2, a: Vec2, s: number): Vec2 =>
  set(out, out.x + a.x * s, out.y + a.y * s);

export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const len2 = (a: Vec2): number => a.x * a.x + a.y * a.y;
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

export const normMut = (out: Vec2): Vec2 => {
  const l = Math.hypot(out.x, out.y);
  return l > 1e-6 ? scaleMut(out, 1 / l) : set(out, 0, 0);
};

/** Borne la norme du vecteur à `max` (en place). */
export const limitMut = (out: Vec2, max: number): Vec2 => {
  const l2 = out.x * out.x + out.y * out.y;
  if (l2 > max * max) {
    const s = max / Math.sqrt(l2);
    return scaleMut(out, s);
  }
  return out;
};

/** Interpolation linéaire en place : out = out + (target - out) * t. */
export const lerpMut = (out: Vec2, target: Vec2, t: number): Vec2 =>
  set(out, out.x + (target.x - out.x) * t, out.y + (target.y - out.y) * t);

export const fromAngle = (rad: number, mag = 1): Vec2 => ({
  x: Math.cos(rad) * mag,
  y: Math.sin(rad) * mag,
});
export const angle = (a: Vec2): number => Math.atan2(a.y, a.x);

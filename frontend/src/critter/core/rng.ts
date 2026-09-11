/**
 * Générateur pseudo-aléatoire seedé et déterministe (mulberry32).
 *
 * Toute la « part de hasard » du module passe par ici : même seed => même
 * comportement, ce qui rend les états reproductibles en test et en debug.
 */

/** Hash de chaîne -> graine 32 bits (xmur3). */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export interface Rng {
  /** Réel dans [0, 1). */
  next(): number;
  /** Réel dans [min, max). */
  range(min: number, max: number): number;
  /** Entier dans [min, max]. */
  int(min: number, max: number): number;
  /** true avec la probabilité p (défaut 0.5). */
  chance(p?: number): boolean;
  /** Élément au hasard d'un tableau non vide. */
  pick<T>(items: readonly T[]): T;
  /** Tirage gaussien approx. (moyenne 0, écart-type 1) via somme de 3 uniformes. */
  gaussian(): number;
  /** Signe aléatoire : -1 ou +1. */
  sign(): number;
}

export function makeRng(seed: string | number = Date.now()): Rng {
  const seedFn = typeof seed === "number" ? () => seed >>> 0 : xmur3(seed);
  let a = seedFn();

  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p = 0.5) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    gaussian: () => (next() + next() + next() - 1.5) * 1.1547,
    sign: () => (next() < 0.5 ? -1 : 1),
  };
}

/**
 * Tirage pondéré : `entries` associe une clé à un poids relatif (>= 0).
 * Retourne `null` si tous les poids sont nuls.
 */
export function weightedPick<K extends string>(
  rng: Rng,
  entries: Partial<Record<K, number>>,
): K | null {
  const keys = Object.keys(entries) as K[];
  let total = 0;
  for (const k of keys) total += Math.max(0, entries[k] ?? 0);
  if (total <= 0) return null;

  let r = rng.next() * total;
  for (const k of keys) {
    r -= Math.max(0, entries[k] ?? 0);
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

/**
 * Bruit de Perlin (version « improved noise », Ken Perlin 2002), seedé.
 *
 * Sert à générer des trajectoires fluides et non répétitives : on échantillonne
 * le bruit le long d'un axe « temps » qui avance lentement, ce qui donne une
 * dérive organique bien plus naturelle qu'un `Math.random()` par frame.
 *
 * Sorties dans ~[-1, 1] (Perlin 2D dépasse rarement ±0.95 en pratique).
 */
import { makeRng, type Rng } from "./rng";

function buildPermutation(rng: Rng): Uint8Array {
  const p = new Uint8Array(512);
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  // Fisher–Yates seedé
  for (let i = 255; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = base[i];
    base[i] = base[j];
    base[j] = tmp;
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  return p;
}

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number): number => a + t * (b - a);

function grad2(hash: number, x: number, y: number): number {
  switch (hash & 7) {
    case 0:
      return x + y;
    case 1:
      return -x + y;
    case 2:
      return x - y;
    case 3:
      return -x - y;
    case 4:
      return x;
    case 5:
      return -x;
    case 6:
      return y;
    default:
      return -y;
  }
}

export interface Noise {
  /** Bruit 2D en (x, y). */
  noise2(x: number, y: number): number;
  /** Bruit 1D (échantillonne la ligne y=0). */
  noise1(x: number): number;
  /**
   * Bruit fractal (fBm) : somme d'octaves. `octaves` détails, `lacunarity`
   * multiplie la fréquence, `gain` réduit l'amplitude à chaque octave.
   */
  fbm2(x: number, y: number, octaves?: number, lacunarity?: number, gain?: number): number;
}

export function makeNoise(seed: string | number = "critter"): Noise {
  const perm = buildPermutation(makeRng(seed));

  const noise2 = (x: number, y: number): number => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);

    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];

    const x1 = lerp(grad2(aa, xf, yf), grad2(ba, xf - 1, yf), u);
    const x2 = lerp(grad2(ab, xf, yf - 1), grad2(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  };

  const fbm2 = (x: number, y: number, octaves = 4, lacunarity = 2, gain = 0.5): number => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise2(x * freq, y * freq);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return norm > 0 ? sum / norm : 0;
  };

  return {
    noise2,
    noise1: (x) => noise2(x, 0),
    fbm2,
  };
}

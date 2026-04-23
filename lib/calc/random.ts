// ---------------------------------------------------------------------------
// RNG-Utilities für Monte-Carlo-Simulation.
// Deterministisch seedbar (Mulberry32) für reproduzierbare Tests und Runs.
// ---------------------------------------------------------------------------

/** Mulberry32 PRNG. Seed > 0. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller Transformation für Normalverteilung. */
export function randomNormal(rand: () => number, mean = 0, sigma = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * sigma;
}

/** Truncated Normal — lehnt Werte außerhalb [min, max] ab und zieht neu. */
export function randomNormalTrunc(
  rand: () => number,
  mean: number,
  sigma: number,
  min: number,
  max: number,
): number {
  for (let i = 0; i < 64; i++) {
    const x = randomNormal(rand, mean, sigma);
    if (x >= min && x <= max) return x;
  }
  return Math.max(min, Math.min(max, mean));
}

/** Triangular-Verteilung via Inverse-CDF. */
export function randomTriangular(
  rand: () => number,
  min: number,
  mode: number,
  max: number,
): number {
  const u = rand();
  const c = (mode - min) / (max - min);
  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

/** Uniform-Verteilung. */
export function randomUniform(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** Percentil (linear interpoliert). p ∈ [0,1]. */
export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (p <= 0) return sortedValues[0];
  if (p >= 1) return sortedValues[sortedValues.length - 1];
  const idx = p * (sortedValues.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  return sortedValues[lo] * (1 - frac) + sortedValues[hi] * frac;
}

// Deterministic seeded RNG (mulberry32), ported from Gród (src/sim/rng.ts).
// The only source of randomness allowed in the simulation: never Math.random()
// in sim code, so playtest situations can be replayed exactly.
(function (CP) {
  'use strict';

  function createRng(seed) {
    return { seed: seed >>> 0 };
  }

  /** A float in [0, 1); advances the RNG state in place. */
  function nextFloat(rng) {
    rng.seed |= 0;
    rng.seed = (rng.seed + 0x6d2b79f5) | 0;
    let t = rng.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** An integer in [0, max). */
  function nextInt(rng, max) {
    return Math.floor(nextFloat(rng) * max);
  }

  /** Rolls `count` dice with `sides` sides (1k6 = roll(rng, 1, 6)). */
  function roll(rng, count, sides) {
    let sum = 0;
    for (let i = 0; i < count; i++) sum += 1 + nextInt(rng, sides);
    return sum;
  }

  CP.createRng = createRng;
  CP.nextFloat = nextFloat;
  CP.nextInt = nextInt;
  CP.roll = roll;
})(window.CP = window.CP || {});

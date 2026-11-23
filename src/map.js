// Tile map: terrain, buildings blocking tiles, and the stage-1 test map.
(function (CP) {
  'use strict';

  // Terrain kinds. Only sand kinds can be walked on.
  // Everything from ROCK up is solid: RUIN is an old stone wall, LAVA a pool in the caves.
  const T = { SAND: 0, DUNE: 1, ROCK: 2, CRACK: 3, RUIN: 4, LAVA: 5 };
  CP.T = T;

  function createMap(w, h) {
    return {
      w,
      h,
      terrain: new Uint8Array(w * h),
      blocked: new Uint8Array(w * h), // 1 where a building stands
    };
  }

  function inBounds(map, x, y) {
    return x >= 0 && y >= 0 && x < map.w && y < map.h;
  }

  function walkable(map, x, y) {
    if (!inBounds(map, x, y)) return false;
    const i = y * map.w + x;
    const t = map.terrain[i];
    return (t === T.SAND || t === T.DUNE) && map.blocked[i] === 0;
  }

  /** The walkable tile nearest to (x, y), searching outward; null if none. */
  function nearestWalkable(map, x, y) {
    x = Math.max(0, Math.min(map.w - 1, x));
    y = Math.max(0, Math.min(map.h - 1, y));
    if (walkable(map, x, y)) return { x, y };
    for (let r = 1; r < Math.max(map.w, map.h); r++) {
      let best = null, bestD = Infinity;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (!walkable(map, x + dx, y + dy)) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = { x: x + dx, y: y + dy }; }
        }
      if (best) return best;
    }
    return null;
  }

  /** Marks walkable tiles not reachable from (sx, sy) as rock, so no pocket is unreachable. */
  function sealPockets(map, sx, sy) {
    const seen = new Uint8Array(map.w * map.h);
    const stack = [sy * map.w + sx];
    seen[stack[0]] = 1;
    while (stack.length) {
      const i = stack.pop();
      const x = i % map.w, y = (i / map.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!inBounds(map, nx, ny)) continue;
        const j = ny * map.w + nx;
        if (seen[j] || map.terrain[j] >= T.ROCK) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
    for (let i = 0; i < map.terrain.length; i++) if (!seen[i] && map.terrain[i] < T.ROCK) map.terrain[i] = T.ROCK;
  }

  /**
   * The stage-1 test map: rust desert with rock clusters, a crack in the
   * ground, and a ridge across the map with one wide pass and one pass
   * exactly one tile wide (to check units don't jam in it).
   */
  function createTestMap(seed) {
    const W = 48, H = 48;
    const map = createMap(W, H);
    const rng = CP.createRng(seed);
    const set = (x, y, t) => { if (inBounds(map, x, y)) map.terrain[y * W + x] = t; };
    const get = (x, y) => map.terrain[y * W + x];

    // Dunes: soft patches of darker sand.
    for (let k = 0; k < 14; k++) {
      const cx = CP.nextInt(rng, W), cy = CP.nextInt(rng, H), r = 2 + CP.nextFloat(rng) * 4;
      for (let y = cy - r; y <= cy + r; y++)
        for (let x = cx - r; x <= cx + r; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && CP.nextFloat(rng) < 0.85) set(Math.round(x), Math.round(y), T.DUNE);
    }

    // The base corner stays clear.
    const nearBase = (x, y) => x < 12 && y > H - 13;

    // Rock clusters.
    for (let k = 0; k < 22; k++) {
      const cx = CP.nextInt(rng, W), cy = CP.nextInt(rng, H);
      if (nearBase(cx, cy) || Math.abs(cx - 24) < 3) continue;
      const r = 0.8 + CP.nextFloat(rng) * 2.2;
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && !nearBase(x, y)) set(x, y, T.ROCK);
    }

    // A crack in the ground running diagonally in the upper left.
    for (let t = 0; t < 16; t++) {
      const x = 6 + t, y = 6 + Math.round(t * 0.6 + Math.sin(t * 0.9) * 1.2);
      set(x, y, T.CRACK);
      if (t % 3 === 0) set(x, y + 1, T.CRACK);
    }

    // The ridge at x = 24..25, from top to bottom, with two passes.
    for (let y = 0; y < H; y++) {
      set(24, y, T.ROCK);
      set(25, y, T.ROCK);
    }
    for (let y = 9; y <= 11; y++) { set(24, y, T.SAND); set(25, y, T.SAND); } // wide pass
    set(24, 34, T.SAND); set(25, 34, T.SAND); // one tile wide
    for (const [x, y] of [[23, 33], [23, 34], [23, 35], [26, 33], [26, 34], [26, 35]]) if (get(x, y) >= T.ROCK) set(x, y, T.SAND);

    // Map frame of rocks so the edge reads as an edge.
    for (let i = 0; i < W; i++) { set(i, 0, T.ROCK); set(i, H - 1, T.ROCK); set(0, i, T.ROCK); set(W - 1, i, T.ROCK); }

    sealPockets(map, 6, H - 6);
    return map;
  }

  CP.createMap = createMap;
  CP.inBounds = inBounds;
  CP.walkable = walkable;
  CP.nearestWalkable = nearestWalkable;
  CP.createTestMap = createTestMap;
})(window.CP = window.CP || {});

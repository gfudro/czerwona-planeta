// Terrain painted once per map into one big bitmap. The map logic is a grid
// of tiles, but the picture is not: rock, dunes and cracks get rounded,
// noisy edges from a smoothed field, rock gets height with boulders lit
// from the top-left, and casts a shadow on the sand.
(function (CP) {
  'use strict';

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  function smooth(t) { return t * t * (3 - 2 * t); }

  /** Smooth value noise in [0, 1) with features about `scale` pixels big. */
  function vnoise(x, y, scale, seed) {
    const fx = x / scale, fy = y / scale;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = smooth(fx - ix), ty = smooth(fy - iy);
    const a = CP.hash(ix, iy, seed), b = CP.hash(ix + 1, iy, seed);
    const c = CP.hash(ix, iy + 1, seed), d = CP.hash(ix + 1, iy + 1, seed);
    return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
  }

  function fbm(x, y, seed) {
    return vnoise(x, y, 22, seed) * 0.55 + vnoise(x, y, 9, seed + 1) * 0.3 + vnoise(x, y, 4, seed + 2) * 0.15;
  }

  /**
   * A field over the whole bitmap: 1 inside tiles of `kind`, 0 outside,
   * blended smoothly between tile centres (so square tiles become round).
   */
  function makeField(map, T, test) {
    const W = map.w, H = map.h;
    const tile = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) tile[i] = test(map.terrain[i]) ? 1 : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? (test(CP.T.ROCK) ? 1 : 0) : tile[y * W + x]);
    return (px, py) => {
      const fx = (px + 0.5) / T - 0.5, fy = (py + 0.5) / T - 0.5;
      const ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = smooth(fx - ix), ty = smooth(fy - iy);
      const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    };
  }

  CP.paintTerrain = function (map) {
    const T = CP.ART_TILE;
    const W = map.w * T, H = map.h * T;
    const c = new CP.PixelCanvas(W, H);
    const data = c.data;
    const M = CP.MAT;
    const rockF = makeField(map, T, (k) => k === CP.T.ROCK);
    const duneF = makeField(map, T, (k) => k === CP.T.DUNE);

    // 1. Height of the rock: a cliff rising at the noisy edge, boulders on top.
    const rockH = new Float32Array(W * H);
    const crack = new Float32Array(W * H).fill(-1);
    const CELL = 11;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const f = rockF(x, y);
        if (f > 0.12) {
          const v = f + (vnoise(x, y, 26, 7) - 0.5) * 0.55 + (vnoise(x, y, 8, 8) - 0.5) * 0.28;
          const edge = Math.max(0, Math.min(1, (v - 0.5) * 5));
          if (edge > 0) {
            // Boulders: domes around jittered points of a grid.
            const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
            let bump = 0;
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) {
                const gx = cx + ox, gy = cy + oy;
                const px = (gx + 0.2 + CP.hash(gx, gy, 71) * 0.6) * CELL, py = (gy + 0.2 + CP.hash(gx, gy, 72) * 0.6) * CELL;
                const r = CELL * (0.55 + CP.hash(gx, gy, 73) * 0.45);
                const d2 = ((x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2) / (r * r);
                if (d2 < 1) bump = Math.max(bump, Math.sqrt(1 - d2));
              }
            rockH[i] = edge * (0.55 + bump * 0.6);
          }
        }
      }

    // Cracks: jagged lines through the centres of crack tiles (also diagonal ones),
    // of varying width. crack[i] > 0 inside, slightly below 0 on the lip.
    const isCrack = (tx, ty) => CP.inBounds(map, tx, ty) && map.terrain[ty * map.w + tx] === CP.T.CRACK;
    const centre = (tx, ty) => [tx * T + 16 + (CP.hash(tx, ty, 91) - 0.5) * 12, ty * T + 16 + (CP.hash(tx, ty, 92) - 0.5) * 12];
    const segs = [];
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (!isCrack(tx, ty)) continue;
        let linked = false;
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
          if (!isCrack(tx + dx, ty + dy)) continue;
          if (dx && dy && (isCrack(tx + dx, ty) || isCrack(tx, ty + dy))) continue; // already joined around the corner
          segs.push([...centre(tx, ty), ...centre(tx + dx, ty + dy)]);
          linked = true;
        }
        const [cx, cy] = centre(tx, ty);
        if (!linked) segs.push([cx - 8, cy, cx + 8, cy]);
      }
    for (const [ax, ay, bx, by] of segs) {
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - 12)), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx) + 12));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by) - 12)), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by) + 12));
      const vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy || 1;
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * vx + (y + 0.5 - ay) * vy) / len2));
          const d = Math.hypot(x + 0.5 - ax - vx * t, y + 0.5 - ay - vy * t);
          const w = 2.5 + vnoise(x, y, 10, 17) * 5 + (vnoise(x, y, 3, 18) - 0.5) * 2;
          const v = 1 - d / w;
          const i = y * W + x;
          if (v > crack[i]) crack[i] = v;
        }
    }

    const sandR = M.sand;
    const CRACK = CP.ramp(0x7a3420, 6, 0.85, 0.3);
    const CLIFF = CP.ramp(0x8a4630, 6, 0.8, 0.3);
    const SAND = [0xc4623a, 0xcc6c42, 0xb85a34, 0xd27a4c];
    const DUNE = [0xa84e2e, 0xb05632, 0x9c4628, 0xb85e38];
    const put = (i, col) => {
      data[i * 4] = (col >> 16) & 255; data[i * 4 + 1] = (col >> 8) & 255; data[i * 4 + 2] = col & 255; data[i * 4 + 3] = 255;
    };
    const L = CP.LIGHT;

    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        const h = rockH[i];
        if (h > 0) {
          // 2. Rock lit by its slope.
          const hx = (x + 1 < W ? rockH[i + 1] : h) - (x > 0 ? rockH[i - 1] : h);
          const hy = (y + 1 < H ? rockH[i + W] : h) - (y > 0 ? rockH[i - W] : h);
          let nx = -hx * 3.2, ny = -hy * 3.2, nz = 1;
          const n = Math.hypot(nx, ny, nz);
          nx /= n; ny /= n; nz /= n;
          let l = 0.18 + 0.82 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
          l = l * 0.78 + (h - 0.55) * 0.3 - 0.04 + (CP.hash(x, y, 77) - 0.5) * 0.08;
          // Dark seam at the foot of the cliff on the shaded sides.
          const below = y + 1 < H ? rockH[i + W] : 1, right = x + 1 < W ? rockH[i + 1] : 1;
          if (right === 0) l = Math.min(l, 0.12);
          if (below === 0) l = Math.min(l, 0.3);
          put(i, CP.tone(M.rock, l, x, y));
          continue;
        }
        const k = crack[i];
        if (k > 0) {
          // 3. Crack: a narrow jagged gash; its upper wall faces us and is lit, the bottom is dark.
          let wall = 0;
          for (let d = 1; d <= 4; d++) if (y - d < 0 || crack[i - d * W] <= 0) { wall = d; break; }
          let l = wall ? 0.62 - wall * 0.1 : 0.04;
          l += (CP.hash(x, y, 79) - 0.5) * 0.08;
          put(i, CP.tone(CRACK, l, x, y));
          continue;
        }
        // 4. Cliff face under the rock: a short wall facing us, so the rock stands up.
        const wallLen = 5 + Math.floor(vnoise(x, 0, 11, 81) * 5);
        let wd = 0;
        for (let d = 1; d <= wallLen; d++) if (y - d >= 0 && rockH[i - d * W] > 0) { wd = d; break; }
        if (wd) {
          const last = wd === wallLen;
          let l = 0.44 - wd * 0.035 + (CP.hash(x >> 1, 0, 83) - 0.5) * 0.2 + (CP.hash(x, y, 84) - 0.5) * 0.05;
          if (last) l = 0.06;
          put(i, CP.tone(CLIFF, l, x, y));
          continue;
        }
        // 5. Sand with grain, softly blended into darker dunes.
        const g = CP.hash(x >> 1, y >> 1, 3);
        const dv = duneF(x, y) + (fbm(x, y, 31) - 0.5) * 0.7;
        const dune = Math.max(0, Math.min(1, (dv - 0.35) * 2.5)) > th;
        const pal = dune ? DUNE : SAND;
        let col = g < 0.6 ? pal[0] : g < 0.8 ? pal[1] : g < 0.95 ? pal[2] : pal[3];
        // Gentle wind ripples.
        const wave = Math.sin(x * 0.05 + Math.sin(y * 0.12) * 1.5) * 4;
        if ((y + Math.round(wave)) % 11 === 0 && CP.hash(x >> 3, y >> 3, 5) < 0.6) col = CP.mix(col, 0x7a2e1a, 0.14);
        // Lip of a crack catches the light just below it.
        if (k > -0.3) col = CP.mix(col, 0xe89a6a, 0.3);
        // 5. Rock and its boulders cast a shadow to the bottom-right.
        let sh = 0;
        for (let s = 2; s <= 8; s += 2) {
          const sx = x - s, sy = y - Math.round(s * 1.1) - 6;
          if (sx >= 0 && sy >= 0 && rockH[sy * W + sx] > 0) { sh = 1 - (s - 2) / 8; break; }
        }
        if (sh > 0 && sh * 0.9 > th * 0.6) col = CP.mix(col, 0x3a1424, 0.28 * sh + 0.06);
        put(i, col);
      }

    // Pebbles on the sand.
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (map.terrain[ty * map.w + tx] > CP.T.DUNE) continue;
        for (let k = 0; k < 3; k++) {
          if (CP.hash(tx, ty, 20 + k) > 0.45) continue;
          const x = tx * T + Math.floor(CP.hash(tx, ty, 30 + k) * 28) + 2, y = ty * T + Math.floor(CP.hash(tx, ty, 40 + k) * 28) + 2;
          if (rockH[y * W + x] > 0 || crack[y * W + x] > -0.3) continue;
          c.raw(x, y, sandR[1]).raw(x + 1, y, sandR[3]).raw(x, y + 1, sandR[0]);
        }
      }
    return c;
  };
})(window.CP = window.CP || {});

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

  /**
   * Ruins: old stone walls of a creature town. Walls run as thick, ragged
   * lines between the centres of neighbouring wall tiles (so they don't
   * follow the tile grid), with a height that changes along the wall:
   * whole stretches, broken tops, and low stumps where it fell. Each wall
   * shows a lit top of stone blocks and a front face of stone courses,
   * casts a shadow, and has rubble scattered around it.
   */
  function paintRuins(c, map, T) {
    const isRuin = (tx, ty) => CP.inBounds(map, tx, ty) && map.terrain[ty * map.w + tx] === CP.T.RUIN;
    const segs = [];
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (!isRuin(tx, ty)) continue;
        const cx = tx * T + 16, cy = ty * T + 16;
        let linked = false;
        if (isRuin(tx + 1, ty)) { segs.push([cx, cy, cx + T, cy]); linked = true; }
        if (isRuin(tx, ty + 1)) { segs.push([cx, cy, cx, cy + T]); linked = true; }
        if (!linked && !isRuin(tx - 1, ty) && !isRuin(tx, ty - 1)) segs.push([cx - 6, cy, cx + 6, cy]);
      }
    if (!segs.length) return;
    const W = map.w * T, H = map.h * T;
    // Footprint and height of the walls.
    const hgt = new Float32Array(W * H);
    for (const [ax, ay, bx, by] of segs) {
      const x0 = Math.max(0, Math.min(ax, bx) - 18), x1 = Math.min(W - 1, Math.max(ax, bx) + 18);
      const y0 = Math.max(0, Math.min(ay, by) - 18), y1 = Math.min(H - 1, Math.max(ay, by) + 18);
      const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy;
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * vx + (y + 0.5 - ay) * vy) / l2));
          const d = Math.hypot(x + 0.5 - ax - vx * t, y + 0.5 - ay - vy * t);
          const half = 10 + vnoise(x, y, 9, 430) * 4 + (vnoise(x, y, 3, 431) - 0.5) * 2.5;
          if (d > half) continue;
          // Height along the wall: tall stretches, broken tops and fallen stumps.
          const along = vx ? x : y;
          const n = vnoise(along, vx ? y >> 5 : x >> 5, 20, 432);
          let h = n < 0.3 ? 2 + n * 6 : 7 + (n - 0.3) * 16;
          h += Math.floor(CP.hash(along >> 2, 0, 433) * 3) - (d > half - 2 ? 1 : 0);
          const i = y * W + x;
          if (h > hgt[i]) hgt[i] = h;
        }
    }
    const STONE = CP.ramp(0xa88a78, 7, 0.75, 0.45);
    const FACE = CP.ramp(0x7a5a4e, 6, 0.8, 0.3);
    const RUNE = 0x5ad8c8;
    // Rubble and a few worn slabs on the ground near the walls (before the walls).
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (map.terrain[ty * map.w + tx] > CP.T.DUNE) continue;
        let near = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (isRuin(tx + ox, ty + oy)) near++;
        if (!near) continue;
        for (let k = 0; k < 2 + near; k++) {
          if (CP.hash(tx, ty, 440 + k) > 0.4) continue;
          const sx = tx * T + 3 + Math.floor(CP.hash(tx, ty, 450 + k) * 24), sy = ty * T + 3 + Math.floor(CP.hash(tx, ty, 460 + k) * 24);
          const big = CP.hash(tx, ty, 470 + k) < 0.3;
          const rw = big ? 4 : 2, rh = big ? 3 : 2;
          for (let y = -rh; y <= rh; y++)
            for (let x = -rw; x <= rw; x++) {
              if (Math.abs(x) + Math.abs(y) > rw + rh - 1) continue;
              const l = 0.6 - (x + y) * 0.07;
              c.raw(sx + x, sy + y, CP.tone(STONE, l, sx + x, sy + y));
            }
          for (let x = -rw + 1; x <= rw; x++) c.raw(sx + x + 1, sy + rh + 1, CP.mix(c.get(sx + x + 1, sy + rh + 1) | 0, 0x3a1424, 0.35));
        }
      }
    // Shadow of the walls to the bottom-right.
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (hgt[y * W + x] > 0) continue;
        let sh = 0;
        for (let s = 2; s <= 6; s += 2) {
          const sx = x - s, sy = y - s;
          if (sx >= 0 && sy >= 0 && hgt[sy * W + sx] > s) { sh = 1; break; }
        }
        if (sh && ((x + y) & 1 || CP.hash(x, y, 441) < 0.6)) c.raw(x, y, CP.mix(c.get(x, y), 0x3a1424, 0.3));
      }
    // Walls, row by row from the top: a front face down from each bottom edge, then the lifted top.
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const h = Math.round(hgt[y * W + x]);
        if (!h) continue;
        const bottom = y + 1 >= H || hgt[(y + 1) * W + x] === 0;
        if (bottom) {
          for (let k = 0; k <= h; k++) {
            const yy = y - h + k;
            if (yy < 0) continue;
            const course = Math.floor(k / 3), seam = k % 3 === 2 || (x + course * 4) % 7 === 0;
            let l = 0.5 - k * 0.025 + (CP.hash(x >> 2, course + (y >> 3), 442) - 0.5) * 0.18;
            if (seam) l -= 0.18;
            c.raw(x, yy, CP.tone(FACE, l, x, yy));
          }
          if (h > 6 && CP.hash(x >> 3, y >> 3, 443) < 0.05 && x % 8 === 3) {
            const ry = y - Math.floor(h / 2);
            c.raw(x, ry - 1, RUNE).raw(x, ry, RUNE).raw(x, ry + 1, RUNE).raw(x + 1, ry, RUNE).raw(x + 2, ry - 1, RUNE).raw(x + 2, ry + 1, RUNE);
          }
        }
        const ty = y - h;
        if (ty < 0) continue;
        // Top face: blocks with seams; edges toward the light are brighter.
        const by = Math.floor(y / 5), bx = Math.floor((x + (by & 1) * 4) / 8);
        const seam = y % 5 === 4 || (x + (by & 1) * 4) % 8 === 7;
        let l = 0.62 + (CP.hash(bx, by, 444) - 0.5) * 0.22 + (CP.hash(x, y, 445) - 0.5) * 0.08 + (h - 8) * 0.012;
        if (seam) l -= 0.2;
        const up = y > 0 ? hgt[(y - 1) * W + x] : 0, lf = x > 0 ? hgt[y * W + x - 1] : 0, rt = x + 1 < W ? hgt[y * W + x + 1] : 0;
        if (up === 0 || lf === 0) l += 0.16;
        if (rt === 0) l -= 0.16;
        // Reach two rows down too, so a step in height never leaves a gap in the top.
        for (let k = 0; k < 3 && ty + k < y; k++) c.raw(x, ty + k, CP.tone(STONE, l - k * 0.04, x, ty + k));
      }
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

    paintRuins(c, map, T);

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

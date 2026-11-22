// A* over tiles in 8 directions, without cutting corners past blocked tiles.
(function (CP) {
  'use strict';

  const SQRT2 = Math.SQRT2;
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2]];

  function octile(ax, ay, bx, by) {
    const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
    return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
  }

  /** Minimal binary heap of tile indices keyed by f-score. */
  class Heap {
    constructor() { this.items = []; this.keys = []; }
    get size() { return this.items.length; }
    push(item, key) {
      const a = this.items, k = this.keys;
      let i = a.length;
      a.push(item); k.push(key);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= key) break;
        a[i] = a[p]; k[i] = k[p]; i = p;
      }
      a[i] = item; k[i] = key;
    }
    pop() {
      const a = this.items, k = this.keys;
      const top = a[0];
      const lastItem = a.pop(), lastKey = k.pop();
      if (a.length > 0) {
        let i = 0;
        const n = a.length;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i, mk = lastKey;
          if (l < n && k[l] < mk) { m = l; mk = k[l]; }
          if (r < n && k[r] < mk) { m = r; mk = k[r]; }
          if (m === i) break;
          a[i] = a[m]; k[i] = k[m]; i = m;
        }
        a[i] = lastItem; k[i] = lastKey;
      }
      return top;
    }
  }

  /**
   * Path from tile (sx, sy) to tile (gx, gy) as a list of tiles, start
   * excluded. If the goal can't be walked on, the nearest walkable tile is
   * used. Returns null if nothing is reachable.
   */
  function findPath(map, sx, sy, gx, gy) {
    const goal = CP.nearestWalkable(map, gx, gy);
    if (!goal) return null;
    gx = goal.x; gy = goal.y;
    if (sx === gx && sy === gy) return [];
    const W = map.w, N = map.w * map.h;
    const g = new Float32Array(N).fill(Infinity);
    const from = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const open = new Heap();
    const start = sy * W + sx, end = gy * W + gx;
    g[start] = 0;
    open.push(start, octile(sx, sy, gx, gy));

    // Track the closest point we reached, for when the goal is cut off.
    let best = start, bestH = Infinity;

    while (open.size) {
      const cur = open.pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (cur === end) { best = cur; break; }
      const cx = cur % W, cy = (cur / W) | 0;
      const h = octile(cx, cy, gx, gy);
      if (h < bestH) { bestH = h; best = cur; }
      for (const [dx, dy, cost] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (!CP.walkable(map, nx, ny)) continue;
        // Diagonal steps only when both side tiles are free (no corner cutting).
        if (dx && dy && (!CP.walkable(map, cx + dx, cy) || !CP.walkable(map, cx, cy + dy))) continue;
        const ni = ny * W + nx;
        if (closed[ni]) continue;
        const ng = g[cur] + cost;
        if (ng < g[ni]) {
          g[ni] = ng;
          from[ni] = cur;
          open.push(ni, ng + octile(nx, ny, gx, gy));
        }
      }
    }
    if (best === start) return [];
    const path = [];
    for (let i = best; i !== start; i = from[i]) path.push({ x: i % W, y: (i / W) | 0 });
    return path.reverse();
  }

  /** True if a unit of radius r can walk straight from point a to point b (in tiles). */
  function clearLine(map, ax, ay, bx, by, r) {
    const len = Math.hypot(bx - ax, by - ay);
    if (len === 0) return true;
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    const steps = Math.ceil(len / 0.2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
      for (const o of [-r, 0, r]) {
        if (!CP.walkable(map, Math.floor(px + nx * o), Math.floor(py + ny * o))) return false;
      }
    }
    return true;
  }

  /**
   * Turns a tile path into waypoints (tile centres), dropping every
   * waypoint that can be skipped by walking straight — so units walk
   * at natural angles instead of in 45° zigzags.
   */
  function smoothPath(map, x, y, tiles, r) {
    const pts = tiles.map((t) => ({ x: t.x + 0.5, y: t.y + 0.5 }));
    const out = [];
    let ax = x, ay = y, i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !clearLine(map, ax, ay, pts[j].x, pts[j].y, r)) j--;
      out.push(pts[j]);
      ax = pts[j].x; ay = pts[j].y;
      i = j + 1;
    }
    return out;
  }

  CP.findPath = findPath;
  CP.smoothPath = smoothPath;
  CP.clearLine = clearLine;
})(window.CP = window.CP || {});

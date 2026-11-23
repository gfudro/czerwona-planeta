// Shading toolkit for the "painted" pixel art of buildings and map objects:
// light from the top-left, colour ramps with hue shift (shadows go violet,
// highlights go warm), ordered dithering between tones, and a selective
// outline in a darker shade of the colour next to it instead of black.
(function (CP) {
  'use strict';

  const L = (() => { const x = -0.55, y = -0.62, z = 0.56; const n = Math.hypot(x, y, z); return [x / n, y / n, z / n]; })();
  CP.LIGHT = L;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const SHADOW = 0x2a1238, WARM = 0xfff2c8;

  /** A ramp of n tones from deep shadow to highlight around a base colour. */
  function ramp(base, n = 6, shadowAmt = 0.72, lightAmt = 0.55) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * 2 - 1; // -1..1
      out.push(t < 0 ? CP.mix(base, SHADOW, -t * shadowAmt) : CP.mix(base, WARM, t * t * lightAmt + t * 0.05));
    }
    return out;
  }

  /** Picks a tone from a ramp for light level l (0..1), dithered at pixel (x, y). */
  function tone(r, l, x, y) {
    const v = Math.max(0, Math.min(0.9999, l)) * (r.length - 1);
    const i = Math.floor(v);
    const f = v - i;
    const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
    return r[Math.min(r.length - 1, f > th ? i + 1 : i)];
  }

  function lightOf(nx, ny, nz, ambient = 0.22) {
    const d = nx * L[0] + ny * L[1] + nz * L[2];
    return ambient + (1 - ambient) * Math.max(0, d);
  }

  const P = CP.PixelCanvas.prototype;

  /**
   * A lit ellipsoid (boulder, dome, ball). `rough` adds per-pixel bumps;
   * `clipY` stops drawing below that row (to cut a half-sphere).
   */
  P.litBlob = function (cx, cy, rx, ry, r, opts = {}) {
    const rough = opts.rough || 0, seed = opts.seed || 0, amb = opts.ambient ?? 0.22;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      if (opts.clipY != null && y > opts.clipY) break;
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d);
        let l = lightOf(nx, ny, nz, amb);
        if (rough) l += (CP.hash(x + this.ox, y + this.oy, seed) - 0.5) * rough;
        this.px(x, y, tone(r, l, x + this.ox, y + this.oy));
      }
    }
    return this;
  };

  /** A vertical cylinder from y0 to y1 (front face only), radius per row from radiusAt(y). */
  P.litCylinder = function (cx, y0, y1, radiusAt, r, opts = {}) {
    const rough = opts.rough || 0, seed = opts.seed || 0;
    for (let y = y0; y <= y1; y++) {
      const rad = typeof radiusAt === 'function' ? radiusAt(y) : radiusAt;
      for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
        const nx = (x + 0.5 - cx) / rad;
        if (Math.abs(nx) > 1) continue;
        const nz = Math.sqrt(1 - nx * nx);
        let l = lightOf(nx, -0.15, nz);
        if (rough) l += (CP.hash(x + this.ox, y + this.oy, seed) - 0.5) * rough;
        this.px(x, y, tone(r, l, x + this.ox, y + this.oy));
      }
    }
    return this;
  };

  /** A flat face lit evenly at level l, with optional grain and a darker bottom (ambient occlusion). */
  P.litRect = function (x0, y0, w, h, r, l, opts = {}) {
    const grain = opts.grain || 0, seed = opts.seed || 0, ao = opts.ao || 0;
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        let v = l + (grain ? (CP.hash(x + this.ox, y + this.oy, seed) - 0.5) * grain : 0);
        if (ao) v -= ao * Math.max(0, (y - (y0 + h * 0.6)) / (h * 0.4));
        this.px(x, y, tone(r, v, x + this.ox, y + this.oy));
      }
    return this;
  };

  /** A filled polygon lit evenly at level l, with grain. */
  P.litPoly = function (points, r, l, opts = {}) {
    const grain = opts.grain || 0, seed = opts.seed || 0;
    const tmp = new CP.PixelCanvas(this.w, this.h);
    tmp.origin(this.ox, this.oy).poly(points, 0xffffff);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (tmp.data[(y * this.w + x) * 4 + 3] === 0) continue;
        const v = l + (grain ? (CP.hash(x, y, seed) - 0.5) * grain : 0);
        this.raw(x, y, tone(r, v, x, y));
      }
    return this;
  };

  /** Soft see-through blob of light or haze (glow, steam), dithered at the edges. */
  P.glow = function (cx, cy, rx, ry, color, alpha, onlyEmpty = false) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const a = alpha * (1 - d);
        const th = (BAYER[((y + this.oy) & 3) * 4 + ((x + this.ox) & 3)] + 0.5) / 16;
        if (a / 255 < th * 0.35) continue;
        if (onlyEmpty) {
          const bx = x + this.ox, by = y + this.oy;
          if (!this.inside(bx, by) || this.data[(by * this.w + bx) * 4 + 3] !== 0) continue;
        }
        this.px(x, y, color, Math.round(Math.min(255, a)));
      }
    return this;
  };

  /**
   * Selective outline: each edge pixel takes a darker version of the colour
   * it borders. Edges facing the light (top, left) are softer.
   */
  P.selOutline = function (strength = 0.62) {
    const edge = [];
    const dirs = [[1, 0, 1], [-1, 0, 0.75], [0, 1, 1], [0, -1, 0.7]];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) >= 0) continue;
        let best = -1, k = 0;
        for (const [dx, dy, s] of dirs) {
          const c = this.get(x + dx, y + dy);
          if (c >= 0 && s > k) { best = c; k = s; }
        }
        if (best >= 0) edge.push(x, y, CP.mix(best, 0x140810, strength * k));
      }
    for (let i = 0; i < edge.length; i += 3) this.raw(edge[i], edge[i + 1], edge[i + 2]);
    return this;
  };

  /** Darkens existing pixels by `amount`, fading out over `fade` rows upward from y1 (contact shadow). */
  P.occlude = function (x0, x1, y1, fade, amount) {
    for (let y = y1 - fade; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const bx = x + this.ox, by = y + this.oy;
        const c = this.get(bx, by);
        if (c < 0) continue;
        const t = amount * (1 - (y1 - y) / fade);
        const i = (by * this.w + bx) * 4, a = this.data[i + 3];
        this.raw(bx, by, CP.mix(c, SHADOW, t));
        this.data[i + 3] = a;
      }
    return this;
  };

  /** A rivet: highlight up-left, shadow down-right. */
  P.rivet = function (x, y, r) {
    this.px(x, y, r[r.length - 1]).px(x + 1, y + 1, r[0]).px(x + 1, y, r[3]).px(x, y + 1, r[2]);
    return this;
  };

  CP.ramp = ramp;
  CP.tone = tone;
  CP.lightOf = lightOf;

  // Material ramps shared by the buildings.
  CP.MAT = {
    brass: ramp(0xc8963a, 7),
    copper: ramp(0xb0582c, 6),
    steel: ramp(0x7c808c, 6),
    iron: ramp(0x4a4c56, 6),
    team: ramp(0xf08a1e, 6, 0.6, 0.5),
    glass: ramp(0x3aa8a0, 6),
    brick: ramp(0x9a4430, 6),
    mortar: ramp(0x8a7060, 5),
    wood: ramp(0x8a5a32, 6),
    rock: ramp(0x8a4630, 6, 0.8),
    sand: ramp(0xc4683e, 6, 0.65),
    rust: ramp(0x8e4a28, 6),
    crystal: ramp(0x9a5ad8, 7, 0.75, 0.75),
    leaf: ramp(0x4a9a3a, 6),
    soil: ramp(0x5a3020, 5),
    warm: ramp(0xf0a040, 5, 0.5, 0.7),
    cloth: ramp(0xe8781a, 6, 0.6, 0.45),
  };
})(window.CP = window.CP || {});

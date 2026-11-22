// Pixel-art drawing toolkit, ported from Gród (src/render/pixel/canvas.ts).
// Every sprite is painted pixel by pixel into a small RGBA bitmap and then
// blown up with nearest-neighbour scaling, so edges stay crisp.
(function (CP) {
  'use strict';

  /** Cheap deterministic noise in [0, 1) for texture variation (render only). */
  function hash(x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + (seed || 0) * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  /** Mixes two 0xRRGGBB colours; t = 0 gives a, t = 1 gives b. */
  function mix(a, b, t) {
    const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
    const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
    const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
    return (r << 16) | (g << 8) | bl;
  }

  function css(color, alpha) {
    const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
    return alpha === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
  }

  class PixelCanvas {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.data = new Uint8ClampedArray(w * h * 4);
      this.ox = 0;
      this.oy = 0;
    }

    inside(x, y) {
      return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }

    /** Sets where (0, 0) of the drawing calls lands on the bitmap. */
    origin(x, y) {
      this.ox = x;
      this.oy = y;
      return this;
    }

    px(x, y, color, alpha = 255) {
      return this.raw(Math.floor(x) + this.ox, Math.floor(y) + this.oy, color, alpha);
    }

    /** Like px, but in bitmap coordinates (ignores the origin). */
    raw(x, y, color, alpha = 255) {
      if (!this.inside(x, y)) return this;
      const i = (y * this.w + x) * 4;
      const d = this.data;
      if (alpha >= 255 || d[i + 3] === 0) {
        d[i] = (color >> 16) & 255;
        d[i + 1] = (color >> 8) & 255;
        d[i + 2] = color & 255;
        d[i + 3] = alpha;
        return this;
      }
      const t = alpha / 255;
      d[i] = d[i] * (1 - t) + ((color >> 16) & 255) * t;
      d[i + 1] = d[i + 1] * (1 - t) + ((color >> 8) & 255) * t;
      d[i + 2] = d[i + 2] * (1 - t) + (color & 255) * t;
      return this;
    }

    /** The colour at a bitmap pixel, or -1 where it is transparent. */
    get(x, y) {
      if (!this.inside(x, y)) return -1;
      const i = (y * this.w + x) * 4;
      if (this.data[i + 3] === 0) return -1;
      return (this.data[i] << 16) | (this.data[i + 1] << 8) | this.data[i + 2];
    }

    /** Darkens (amount > 0) or lightens (amount < 0) what is already there. */
    shade(x, y, amount) {
      const c = this.get(x, y);
      if (c < 0) return this;
      const i = (y * this.w + x) * 4;
      const alpha = this.data[i + 3];
      this.raw(x, y, amount > 0 ? mix(c, 0x10080c, amount) : mix(c, 0xffffff, -amount));
      this.data[i + 3] = alpha;
      return this;
    }

    rect(x, y, w, h, color) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.px(xx, yy, color);
      return this;
    }

    clear(x, y, w, h) {
      for (let yy = y + this.oy; yy < y + h + this.oy; yy++)
        for (let xx = x + this.ox; xx < x + w + this.ox; xx++)
          if (this.inside(xx, yy)) this.data[(yy * this.w + xx) * 4 + 3] = 0;
      return this;
    }

    /** Checkerboard dither over what is already drawn. */
    dither(x, y, w, h, color, phase = 0) {
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++)
          if ((xx + yy + phase) % 2 === 0 && this.get(Math.floor(xx) + this.ox, Math.floor(yy) + this.oy) >= 0)
            this.px(xx, yy, color);
      return this;
    }

    hline(x0, x1, y, color) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.px(x, y, color);
      return this;
    }

    vline(x, y0, y1, color) {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.px(x, y, color);
      return this;
    }

    line(x0, y0, x1, y1, color) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.px(x0, y0, color);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return this;
    }

    ellipse(cx, cy, rx, ry, color) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.px(x, y, color);
        }
      return this;
    }

    /** A round shape lit from the top-left: dark body, mid tone, highlight. */
    blob(cx, cy, rx, ry, dark, mid, light) {
      this.ellipse(cx, cy, rx, ry, dark);
      this.ellipse(cx - rx * 0.15, cy - ry * 0.18, rx * 0.8, ry * 0.75, mid);
      this.ellipse(cx - rx * 0.38, cy - ry * 0.42, Math.max(1, rx * 0.3), Math.max(1, ry * 0.28), light);
      return this;
    }

    /** Filled polygon, tested at pixel centres. Points as [x0, y0, x1, y1, ...]. */
    poly(points, color) {
      let minY = Infinity, maxY = -Infinity;
      for (let i = 1; i < points.length; i += 2) {
        minY = Math.min(minY, points[i]);
        maxY = Math.max(maxY, points[i]);
      }
      const n = points.length / 2;
      for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        const cy = y + 0.5;
        const xs = [];
        for (let i = 0; i < n; i++) {
          const x0 = points[i * 2], y0 = points[i * 2 + 1];
          const x1 = points[((i + 1) % n) * 2], y1 = points[((i + 1) % n) * 2 + 1];
          if ((y0 <= cy && y1 > cy) || (y1 <= cy && y0 > cy)) xs.push(x0 + ((cy - y0) / (y1 - y0)) * (x1 - x0));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2)
          for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.px(x, y, color);
      }
      return this;
    }

    /** Draws another PixelCanvas on top (alpha-blended). */
    blit(src, dx, dy) {
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const i = (y * src.w + x) * 4;
          const a = src.data[i + 3];
          if (a === 0) continue;
          this.raw(dx + x, dy + y, (src.data[i] << 16) | (src.data[i + 1] << 8) | src.data[i + 2], a);
        }
      return this;
    }

    /** A one-pixel dark outline around everything drawn so far. */
    outline(color = 0x1e0f0c) {
      const edge = [];
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          if (this.get(x, y) >= 0) continue;
          if (this.get(x - 1, y) >= 0 || this.get(x + 1, y) >= 0 || this.get(x, y - 1) >= 0 || this.get(x, y + 1) >= 0)
            edge.push(x, y);
        }
      for (let i = 0; i < edge.length; i += 2) this.raw(edge[i], edge[i + 1], color);
      return this;
    }

    /** A see-through ground shadow, only where nothing is drawn yet (call after outline). */
    shadow(cx, cy, rx, ry, alpha = 70) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          const bx = x + this.ox, by = y + this.oy;
          if (dx * dx + dy * dy <= 1 && this.inside(bx, by) && this.data[(by * this.w + bx) * 4 + 3] === 0)
            this.raw(bx, by, 0x140806, alpha);
        }
      return this;
    }

    /** A mirrored copy (sprites face right; left is a flip). */
    flipped() {
      const c = new PixelCanvas(this.w, this.h);
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const s = (y * this.w + x) * 4, d = (y * this.w + (this.w - 1 - x)) * 4;
          for (let k = 0; k < 4; k++) c.data[d + k] = this.data[s + k];
        }
      return c;
    }

    toCanvas() {
      const canvas = document.createElement('canvas');
      canvas.width = this.w;
      canvas.height = this.h;
      canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(this.data), this.w, this.h), 0, 0);
      return canvas;
    }
  }

  /** Memoises painted sprites by key, so each is painted once. */
  function spriteCache() {
    const cache = new Map();
    return (key, paint) => {
      let c = cache.get(key);
      if (!c) {
        c = paint().toCanvas();
        cache.set(key, c);
      }
      return c;
    };
  }

  CP.hash = hash;
  CP.mix = mix;
  CP.css = css;
  CP.PixelCanvas = PixelCanvas;
  CP.spriteCache = spriteCache;
})(window.CP = window.CP || {});

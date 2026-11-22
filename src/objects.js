// Sprites of things on the map (deposits, wrecks, nests, buildings) and
// small interface icons. Painted in code in the palette of the cards.
(function (CP) {
  'use strict';
  const PC = (w, h) => new CP.PixelCanvas(w, h);
  const T = CP.ART_TILE;
  const OUT = 0x1e0f0c;
  const P = () => CP.PAL;

  // Each map sprite: canvas plus how many art pixels it rises above its footprint.
  const RISE = { crystal: 18, wreck: 10, dome: 16, workshop: 26, lander: 24, nest: 4 };
  CP.SPRITE_RISE = RISE;

  /** Violet crystals growing out of a rock base (2×2 tiles). */
  function crystalDeposit() {
    const c = PC(T * 2, T * 2 + RISE.crystal).origin(0, RISE.crystal);
    c.blob(32, 44, 28, 16, 0x4a1e14, 0x7e3a26, 0xa85a3a);
    c.blob(16, 46, 12, 9, 0x4a1e14, 0x6e3222, 0x9a4e32);
    c.blob(50, 46, 11, 8, 0x4a1e14, 0x6e3222, 0x9a4e32);
    const shard = (x, base, h, w, dark, mid, light) => {
      c.poly([x - w, base, x, base - h, x + w, base, x, base + 3], mid);
      c.poly([x - w, base, x, base - h, x - w * 0.2, base + 1], light);
      c.poly([x + w * 0.3, base + 1, x, base - h, x + w, base], dark);
      c.px(x - 1, base - h + 3, 0xffffff);
    };
    const V = [0x5a2a9a, 0x9a5ad8, 0xd8a8ff];
    shard(22, 40, 30, 6, ...V);
    shard(36, 42, 40, 7, ...V);
    shard(46, 44, 24, 5, ...V);
    shard(14, 46, 16, 4, 0x6a3aa8, 0xb07ae8, 0xe8c8ff);
    shard(30, 50, 14, 4, 0x6a3aa8, 0xb07ae8, 0xe8c8ff);
    c.outline(OUT);
    c.shadow(34, 54, 30, 8, 60);
    return c;
  }

  /** A rusty rover of the earlier expedition, tipped over and half buried (2×2 tiles). */
  function wreck() {
    const c = PC(T * 2, T * 2 + RISE.wreck).origin(0, RISE.wreck);
    const RUST = 0x8a4a2a, RUST_D = 0x5a2a18, RUST_L = 0xb06a3e, STEEL = 0x7a7c84, STEEL_L = 0xa8aab0;
    // Wheels.
    for (const [x, y] of [[14, 48], [32, 50], [50, 46]]) {
      c.ellipse(x, y, 7, 7, 0x2a2420).ellipse(x, y, 4, 4, 0x4a423a).px(x, y, STEEL_L);
    }
    // Body, tilted.
    c.poly([4, 40, 10, 18, 56, 14, 60, 38], RUST);
    c.poly([4, 40, 10, 18, 18, 17, 12, 40], RUST_L);
    c.poly([52, 39, 56, 14, 60, 38], RUST_D);
    // Cabin with a cracked window.
    c.poly([38, 16, 42, 4, 56, 4, 56, 15], STEEL);
    c.poly([42, 14, 45, 7, 54, 7, 54, 13], 0x3a6a70).line(46, 8, 50, 13, 0x9ad0d0).line(50, 13, 53, 9, 0x9ad0d0);
    // Panels, rust spots and a bent antenna.
    c.hline(10, 54, 27, RUST_D).vline(26, 17, 38, RUST_D);
    for (let k = 0; k < 14; k++) c.px(10 + ((k * 37) % 44), 19 + ((k * 23) % 18), RUST_D);
    c.line(20, 16, 16, -6, STEEL).line(16, -6, 10, -8, STEEL).px(10, -8, 0xff6a3a);
    // Sand drift over the front.
    c.ellipse(54, 44, 10, 6, 0xc4623a).ellipse(52, 42, 7, 3, 0xd27a4c);
    c.outline(OUT);
    c.shadow(32, 54, 30, 7, 60);
    return c;
  }

  /** What's left of an emptied wreck: a few scraps in the sand. */
  function debris() {
    const c = PC(T * 2, T * 2);
    for (const [x, y, w, h] of [[14, 30, 8, 4], [34, 40, 10, 3], [42, 24, 6, 5], [22, 46, 5, 3]]) {
      c.rect(x, y, w, h, 0x6a3a22).hline(x, x + w - 1, y, 0x9a5a36);
    }
    c.ellipse(30, 30, 3, 3, 0x2a2420);
    c.outline(OUT);
    return c;
  }

  /** A worm nest: a sand mound with a dark hole and claw marks (1 tile). */
  function nest() {
    const c = PC(T, T + RISE.nest).origin(0, RISE.nest);
    c.blob(16, 18, 15, 11, 0x8a4228, 0xb05a36, 0xd07a4c);
    c.ellipse(16, 17, 8, 5.5, 0x3a140c).ellipse(16, 18, 6, 4, 0x1a0806);
    for (const [x0, y0, x1, y1] of [[4, 12, 7, 15], [26, 11, 23, 15], [6, 25, 9, 23], [25, 25, 22, 23]]) c.line(x0, y0, x1, y1, 0x6a2a18);
    c.px(13, 16, 0x5a2a18).px(19, 16, 0x5a2a18);
    c.outline(OUT);
    return c;
  }

  /** Greenhouse dome: a brass ring with a turquoise glass dome full of plants (2×2 tiles). */
  function dome() {
    const c = PC(T * 2, T * 2 + RISE.dome).origin(0, RISE.dome);
    const pal = P();
    // Brass foundation ring on the ground.
    c.ellipse(32, 46, 30, 12, pal.brassDark).ellipse(32, 44, 29, 10, pal.brass);
    // Glass half-sphere: a circle cut off at its middle, with a rounded bottom edge.
    c.ellipse(32, 36, 25, 30, 0x3aa8a0);
    c.clear(0, 36, 64, 30);
    c.ellipse(32, 36, 25, 7, 0x3aa8a0);
    c.ellipse(32, 36, 25, 30, 0x3aa8a0);
    c.clear(0, 37, 64, 30);
    c.ellipse(32, 37, 25, 6, 0x2e9890);
    // Plants inside.
    for (const [x, y, r] of [[20, 26, 6], [32, 20, 7], [44, 27, 6], [26, 34, 5], [39, 34, 5]]) c.blob(x, y, r, r * 0.8, 0x2a6a2a, 0x4a9a3a, 0x8ad05a);
    // Glass ribs and shine.
    c.line(32, 7, 32, 40, 0x9ee8e0).line(22, 10, 16, 38, 0x9ee8e0).line(42, 10, 48, 38, 0x9ee8e0);
    c.line(14, 18, 19, 11, 0xffffff).line(13, 23, 15, 20, 0xffffff);
    // Front band in team orange and a little door.
    c.rect(6, 40, 52, 5, pal.team).hline(6, 57, 40, pal.teamLight).hline(6, 57, 44, pal.teamDark);
    c.rect(28, 36, 8, 10, pal.brassDark).rect(29, 37, 6, 9, 0x2a5a5a);
    c.outline(OUT);
    c.shadow(36, 52, 30, 6, 60);
    return c;
  }

  /** Armoury workshop: brick and brass hall, a big gear, chimney and an orange banner (3×3 tiles). */
  function workshop() {
    const c = PC(T * 3, T * 3 + RISE.workshop).origin(0, RISE.workshop);
    const pal = P();
    const BRICK = 0x8a3a28, BRICK_D = 0x5a2418, BRICK_L = 0xa85a3a;
    // Chimney with steam.
    c.rect(68, -22, 10, 34, 0x4a4a52).rect(66, -24, 14, 4, 0x6a6a72);
    c.blob(74, -24, 6, 4, 0xa8a8b0, 0xd8d8e0, 0xffffff);
    // Walls.
    c.rect(6, 20, 84, 62, BRICK);
    for (let y = 22; y < 82; y += 6)
      for (let x = 6 + ((y / 6) % 2) * 6; x < 90; x += 12) c.hline(x, x + 10, y, BRICK_L).px(x + 11, y + 1, BRICK_D);
    c.vline(6, 20, 81, BRICK_D);
    // Brass roof.
    c.poly([0, 24, 14, 4, 82, 4, 96, 24], pal.brass);
    c.poly([0, 24, 14, 4, 24, 4, 12, 24], pal.brassLight);
    for (let x = 18; x < 82; x += 8) c.vline(x, 6, 22, pal.brassDark);
    c.hline(0, 95, 24, pal.brassDark);
    // Big door.
    c.rect(34, 52, 28, 30, 0x3a2418).rect(36, 54, 24, 28, 0x5a3a24);
    c.vline(48, 54, 81, 0x3a2418).hline(36, 59, 66, 0x3a2418);
    // Gear on the wall.
    c.ellipse(20, 42, 11, 11, pal.brassDark);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      c.rect(Math.round(20 + Math.cos(a) * 11) - 1, Math.round(42 + Math.sin(a) * 11) - 1, 3, 3, pal.brassDark);
    }
    c.ellipse(20, 42, 9, 9, pal.brass).ellipse(20, 42, 3, 3, pal.brassDark).px(17, 38, pal.brassLight);
    // Orange banner with a crossed sword and gun.
    c.rect(68, 32, 16, 26, pal.team).poly([68, 58, 76, 52, 84, 58], pal.team).vline(68, 32, 57, pal.teamDark);
    c.line(71, 36, 81, 50, 0xe0e0e8).line(81, 36, 71, 50, pal.copperDark);
    c.outline(OUT);
    c.shadow(52, 84, 46, 8, 60);
    return c;
  }

  const cache = new Map();
  const PAINT = { crystal: crystalDeposit, wreck, debris, nest, dome, workshop, lander: () => CP.paintLander() };

  /** Map sprite by name, painted once. */
  CP.objectSprite = function (name) {
    let s = cache.get(name);
    if (!s) {
      s = PAINT[name]().toCanvas();
      cache.set(name, s);
    }
    return s;
  };

  // ---- Interface icons (16×16 art, shown at 2× or more) --------------------

  const ICONS = {
    crystal(c) {
      c.poly([8, 1, 13, 6, 8, 15, 3, 6], 0x9a5ad8);
      c.poly([8, 1, 3, 6, 8, 15, 7, 6], 0xd8a8ff);
      c.poly([8, 1, 13, 6, 8, 15, 10, 6], 0x5a2a9a);
      c.px(6, 4, 0xffffff);
    },
    scrap(c) {
      c.ellipse(8, 8, 6.5, 6.5, 0x7a7c84);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        c.rect(Math.round(8 + Math.cos(a) * 6.5) - 1, Math.round(8 + Math.sin(a) * 6.5) - 1, 2, 2, 0x7a7c84);
      }
      c.ellipse(8, 8, 4.5, 4.5, 0xa8aab0).ellipse(8, 8, 2, 2, 0x3a3a40).px(5, 5, 0xe0e0e8);
      c.px(11, 10, 0xa85a2a).px(10, 11, 0xa85a2a);
    },
    pop(c) {
      c.ellipse(8, 5, 3.5, 3.5, 0xf0c8a0).rect(5, 2, 7, 2, 0x5a3420);
      c.poly([2, 15, 4, 9, 12, 9, 14, 15], 0xf28a1e);
    },
    heart(c) {
      c.ellipse(5, 6, 3.6, 3.6, 0xe8402a).ellipse(11, 6, 3.6, 3.6, 0xe8402a).poly([1.6, 7, 14.4, 7, 8, 14], 0xe8402a);
      c.px(4, 4, 0xffb0a0);
    },
    nest(c) {
      c.blob(8, 10, 7.5, 5, 0x8a4228, 0xb05a36, 0xd07a4c);
      c.ellipse(8, 9.5, 3.6, 2.4, 0x1a0806);
    },
    dome(c) {
      c.ellipse(8, 9, 7, 7, 0x3aa8a0).clear(0, 10, 16, 6);
      c.blob(8, 7, 3, 2.5, 0x2a6a2a, 0x4a9a3a, 0x8ad05a);
      c.rect(1, 10, 14, 3, 0xc89a3c).hline(1, 14, 10, 0xf28a1e);
      c.px(5, 4, 0xffffff);
    },
    settler(c) {
      c.ellipse(8, 5, 4, 4, 0xc89a3c).ellipse(9, 5, 2.6, 2.6, 0x4aa8a8).px(8, 4, 0x9ee8e0);
      c.poly([4, 15, 4, 9, 12, 9, 12, 15], 0xf28a1e);
    },
    check(c) {
      c.line(3, 8, 6, 11, 0x4dff6a).line(6, 11, 13, 4, 0x4dff6a).line(3, 9, 6, 12, 0x4dff6a).line(6, 12, 13, 5, 0x4dff6a);
    },
  };

  /** An icon as a canvas of 16×16 art pixels (scale it up with CSS). */
  CP.icon = function (name) {
    const key = 'icon:' + name;
    let s = cache.get(key);
    if (!s) {
      const c = PC(16, 16);
      ICONS[name](c);
      c.outline(OUT);
      s = c.toCanvas();
      cache.set(key, s);
    }
    return s;
  };
})(window.CP = window.CP || {});

// Pixel-art sprites painted in code. Stage 1: simple stand-ins for our units
// and the lander, already in the card palette. Sprites face right.
(function (CP) {
  'use strict';
  const PC = () => CP.PixelCanvas;

  // Palette from the cards: rust and ochre desert, brass and copper machines,
  // turquoise glass, violet crystals. Team colour: orange.
  const PAL = {
    outline: 0x1e0f0c,
    team: 0xf28a1e, teamDark: 0xc0620e, teamLight: 0xffb453,
    brass: 0xc89a3c, brassDark: 0x8a6420, brassLight: 0xf0cc6a,
    copper: 0xb0582c, copperDark: 0x7a3418,
    glass: 0x9ee8e0, glassDark: 0x4aa8a8,
    skin: 0xf0c8a0, leather: 0x5a3420, steel: 0x6a6e78, steelLight: 0xa8acb4,
  };
  CP.PAL = PAL;

  // Art frame of a unit: 18×24, feet on the bottom row, centred at x = 9.
  const UW = 18, UH = 24;
  CP.UNIT_ART = { w: UW, h: UH, footX: 9, footY: 23 };

  function boots(c, step) {
    // step: 0 standing, 1/2 walking frames.
    const l = step === 1 ? -1 : 0, r = step === 2 ? -1 : 0;
    c.rect(6, 18 + l, 2, 4 - l, PAL.teamDark).rect(10, 18 + r, 2, 4 - r, PAL.teamDark);
    c.rect(5 + (step === 1 ? 1 : 0), 21, 3, 2, PAL.leather).rect(10 + (step === 2 ? 1 : 0), 21, 3, 2, PAL.leather);
  }

  function settler(step) {
    const c = new (PC())(UW, UH);
    // Backpack with a brass tank.
    c.rect(4, 10, 3, 6, PAL.brassDark).px(4, 10, PAL.brass).px(5, 11, PAL.brassLight);
    boots(c, step);
    // Orange suit.
    c.poly([6, 9, 13, 9, 13, 19, 6, 19], PAL.team);
    c.vline(6, 10, 18, PAL.teamDark).hline(6, 13, 18, PAL.teamDark).px(8, 10, PAL.teamLight).px(9, 10, PAL.teamLight);
    c.hline(6, 13, 15, PAL.leather).px(10, 15, PAL.brassLight);
    // Arm with a pick.
    c.rect(11, 11, 2, 4, PAL.teamDark);
    if (step === 3) c.line(12, 12, 15, 2, PAL.leather).hline(13, 17, 2, PAL.steel).px(17, 3, PAL.steel); // pick raised
    else c.line(13, 15, 15, 9, PAL.leather).hline(14, 17, 9, PAL.steel).px(17, 10, PAL.steel);
    // Glass helmet.
    c.ellipse(9.5, 5, 4, 4, PAL.brass);
    c.ellipse(10.5, 5, 2.6, 2.6, PAL.glassDark).px(10, 4, PAL.glass).px(11, 4, PAL.glass).px(10, 3, 0xffffff);
    c.px(11, 6, PAL.skin).px(12, 5, PAL.outline);
    c.outline(PAL.outline).shadow(9, 22.5, 6, 1.6, 80);
    return c;
  }

  function infantry(step) {
    const c = new (PC())(UW, UH);
    boots(c, step);
    // Bulky brass steam armour with orange plates and a stack on the back.
    c.rect(3, 6, 2, 7, PAL.copperDark).rect(3, 5, 2, 1, PAL.steel);
    c.poly([5, 8, 14, 8, 15, 18, 4, 18], PAL.brass);
    c.rect(7, 10, 6, 5, PAL.team).hline(7, 12, 10, PAL.teamLight).hline(7, 12, 14, PAL.teamDark);
    c.vline(4, 9, 17, PAL.brassDark).hline(4, 15, 17, PAL.brassDark).px(6, 9, PAL.brassLight);
    // Pauldron and a heavy fist.
    c.blob(13, 10, 2.5, 2, PAL.brassDark, PAL.brass, PAL.brassLight);
    c.rect(14, 13, 3, 3, PAL.steel).px(14, 13, PAL.steelLight);
    // Helmet with a slit visor.
    c.rect(6, 1, 7, 7, PAL.brass).hline(6, 12, 1, PAL.brassLight).vline(6, 2, 7, PAL.brassDark);
    c.hline(9, 12, 4, PAL.outline).px(12, 4, PAL.team);
    c.outline(PAL.outline).shadow(9, 22.5, 7, 1.7, 80);
    return c;
  }

  function rifleman(step) {
    const c = new (PC())(UW, UH);
    boots(c, step);
    // Long orange coat.
    c.poly([6, 9, 12, 9, 13, 20, 5, 20], PAL.team);
    c.vline(6, 10, 19, PAL.teamDark).hline(5, 13, 19, PAL.teamDark).px(8, 10, PAL.teamLight);
    c.hline(6, 12, 14, PAL.leather).px(9, 14, PAL.brassLight);
    // Steam rifle held across the body.
    c.line(5, 15, 17, 11, PAL.copperDark).line(5, 14, 16, 11, PAL.copper).rect(9, 12, 3, 2, PAL.brass).px(17, 10, PAL.steelLight);
    // Head, hat and goggles.
    c.rect(7, 3, 5, 5, PAL.skin).vline(7, 4, 7, 0xd49e78);
    c.rect(6, 1, 7, 2, PAL.leather).hline(5, 13, 3, PAL.leather);
    c.rect(9, 4, 3, 2, PAL.brass).px(10, 4, PAL.glass).px(11, 5, PAL.glass);
    c.outline(PAL.outline).shadow(9, 22.5, 6, 1.6, 80);
    return c;
  }

  const PAINT = { settler, infantry, rifleman, cannon: infantry, hero: infantry };
  const cache = new Map();

  Object.assign((CP.SPRITE_META = CP.SPRITE_META || {}), {
    settler: { footX: 9, footY: 23, hitW: 7, hitH: 22 },
    infantry: { footX: 9, footY: 23, hitW: 8, hitH: 23 },
    rifleman: { footX: 9, footY: 23, hitW: 7, hitH: 22 },
    cannon: { footX: 9, footY: 23, hitW: 8, hitH: 23 },
    hero: { footX: 9, footY: 23, hitW: 8, hitH: 23 },
  });

  /** A unit or creature sprite as a canvas. Frame 0 standing, 1–2 walking, 3 working; flip faces left. */
  CP.unitSprite = function (type, frame, flip) {
    const key = `${type}:${frame}:${flip ? 1 : 0}`;
    let s = cache.get(key);
    if (!s) {
      const paint = PAINT[type] || CP.CREATURE_PAINT[type];
      let pc = paint(frame);
      if (flip) pc = pc.flipped();
      s = pc.toCanvas();
      cache.set(key, s);
    }
    return s;
  };

  /**
   * The whole map painted once into one big bitmap: rust sand with grain,
   * darker dunes, boulders of red rock and dark cracks in the ground.
   */
  CP.paintTerrain = function (map) {
    const T = CP.ART_TILE;
    const c = new (PC())(map.w * T, map.h * T);
    const kind = (x, y) => (CP.inBounds(map, x, y) ? map.terrain[y * map.w + x] : CP.T.ROCK);
    const SAND = [0xc4623a, 0xcc6c42, 0xb85a34, 0xd27a4c];
    const DUNE = [0xa84e2e, 0xb05632, 0x9c4628, 0xb85e38];
    for (let py = 0; py < c.h; py++) {
      const ty = (py / T) | 0;
      for (let px = 0; px < c.w; px++) {
        const tx = (px / T) | 0;
        const n = CP.hash(px >> 1, py >> 1, 3);
        // Dune edges get a little noise so tiles don't look square.
        let k = kind(tx, ty);
        if (k <= CP.T.DUNE) {
          const fx = (px % T) / T, fy = (py % T) / T;
          const jitter = CP.hash(px >> 2, py >> 2, 9) * 0.35;
          if (fx < jitter && kind(tx - 1, ty) <= CP.T.DUNE) k = kind(tx - 1, ty);
          else if (fy < jitter && kind(tx, ty - 1) <= CP.T.DUNE) k = kind(tx, ty - 1);
        }
        const pal = k === CP.T.DUNE ? DUNE : SAND;
        let col = n < 0.6 ? pal[0] : n < 0.8 ? pal[1] : n < 0.95 ? pal[2] : pal[3];
        // Ripples in the sand.
        const wave = Math.sin(px * 0.05 + Math.sin(py * 0.12) * 1.5) * 4;
        if (((py + Math.round(wave)) % 11 === 0) && CP.hash(px >> 3, py >> 3, 5) < 0.6) col = CP.mix(col, 0x7a2e1a, 0.14);
        c.raw(px, py, col);
      }
    }
    // Pebbles.
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (kind(tx, ty) > CP.T.DUNE) continue;
        for (let k = 0; k < 3; k++) {
          if (CP.hash(tx, ty, 20 + k) > 0.45) continue;
          const x = tx * T + Math.floor(CP.hash(tx, ty, 30 + k) * 28) + 2, y = ty * T + Math.floor(CP.hash(tx, ty, 40 + k) * 28) + 2;
          c.raw(x, y, 0x7a3a24).raw(x + 1, y, 0x9a4a2c).raw(x, y + 1, 0x5a2618);
        }
      }
    // Cracks: dark ground with lit upper edge.
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (kind(tx, ty) !== CP.T.CRACK) continue;
        c.origin(tx * T, ty * T);
        for (let y = 0; y < T; y++)
          for (let x = 0; x < T; x++) {
            const edge = 5 + Math.floor(CP.hash(tx * T + x, ty, 11) * 4);
            const top = kind(tx, ty - 1) !== CP.T.CRACK && y < edge;
            const bottom = kind(tx, ty + 1) !== CP.T.CRACK && y >= T - edge + 2;
            const left = kind(tx - 1, ty) !== CP.T.CRACK && x < edge - 1;
            const right = kind(tx + 1, ty) !== CP.T.CRACK && x >= T - edge + 1;
            if (top || bottom || left || right) continue;
            const depth = y < edge + 3 && kind(tx, ty - 1) !== CP.T.CRACK ? 0x5a2016 : 0x2a0e0a;
            c.px(x, y, CP.hash(x, y, tx + ty) < 0.1 ? 0x3a140e : depth);
          }
      }
    c.origin(0, 0);
    // Rocks: a base plate plus lit boulders spilling a little over the edges.
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (kind(tx, ty) !== CP.T.ROCK) continue;
        c.origin(tx * T, ty * T);
        c.rect(0, 0, T, T, 0x5a2a1c);
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (CP.hash(x + tx * T, y + ty * T, 7) < 0.25) c.px(x, y, 0x4c2216);
      }
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (kind(tx, ty) !== CP.T.ROCK) continue;
        c.origin(tx * T, ty * T);
        const n = 2 + Math.floor(CP.hash(tx, ty, 50) * 2);
        for (let k = 0; k < n; k++) {
          const bx = 6 + CP.hash(tx, ty, 60 + k) * 20, by = 6 + CP.hash(tx, ty, 70 + k) * 20;
          const r = 6 + CP.hash(tx, ty, 80 + k) * 7;
          c.blob(bx, by, r, r * 0.8, 0x4a1e14, 0x7e3a26, 0xa85a3a);
        }
      }
    c.origin(0, 0);
    // Shadow on the sand to the right of and below rocks.
    for (let ty = 0; ty < map.h; ty++)
      for (let tx = 0; tx < map.w; tx++) {
        if (kind(tx, ty) > CP.T.DUNE) continue;
        const sl = kind(tx - 1, ty) === CP.T.ROCK, su = kind(tx, ty - 1) === CP.T.ROCK;
        if (!sl && !su) continue;
        for (let y = 0; y < T; y++)
          for (let x = 0; x < T; x++)
            if ((sl && x < 5 + ((y >> 2) & 1)) || (su && y < 5 + ((x >> 2) & 1))) c.shade(tx * T + x, ty * T + y, 0.25);
      }
    return c;
  };
})(window.CP = window.CP || {});

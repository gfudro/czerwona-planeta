// Sprites of things on the map (buildings, deposits, wrecks, nests) and
// small interface icons. Painted in code with the shading toolkit
// (shading.js): light from the top-left, tone ramps, dithering and a
// coloured outline instead of a black one.
(function (CP) {
  'use strict';
  const PC = (w, h) => new CP.PixelCanvas(w, h);
  const T = CP.ART_TILE;
  const OUT = 0x1e0f0c;
  const M = () => CP.MAT;

  // How many art pixels each sprite rises above its footprint.
  const RISE = { crystal: 26, wreck: 8, dome: 22, workshop: 34, lander: 40, nest: 6, forge: 62, rocket: 52, bigCrystal: 40 };
  CP.SPRITE_RISE = RISE;

  // ---- Lander --------------------------------------------------------------

  /** The lander: a riveted brass capsule on copper legs with an orange band (3×3 tiles). */
  function lander() {
    const m = M();
    const c = PC(T * 3, T * 3 + RISE.lander).origin(0, RISE.lander);
    const cx = 48;
    // Landing legs: struts with a lit top edge, pistons, round pads.
    const strut = (x0, y0, x1, y1) => {
      c.line(x0, y0 + 1, x1, y1 + 1, m.iron[1]).line(x0, y0, x1, y1, m.steel[2]).line(x0, y0 - 1, x1, y1 - 1, m.steel[4]);
    };
    strut(30, 58, 11, 86);
    strut(66, 58, 85, 86);
    strut(40, 62, 34, 90);
    strut(56, 62, 62, 90);
    for (const [x, y] of [[11, 88], [85, 88], [34, 92], [62, 92]]) c.litBlob(x, y, 6, 2.6, m.steel);
    // Engine bell under the body.
    c.litCylinder(cx, 62, 74, (y) => 13 + (y - 62) * 0.55, m.copper, { rough: 0.05, seed: 2 });
    for (let x = cx - 18; x <= cx + 18; x++) {
      const nx = (x + 0.5 - cx) / 19.5;
      if (Math.abs(nx) <= 1) c.px(x, 74 + Math.round(Math.sqrt(1 - nx * nx) * 2), m.iron[0]);
    }
    // Body: a cone on a cylinder, brass with a little grain.
    const R = (y) => (y < 8 ? 5 + ((y + 30) * 17) / 38 : 22);
    c.litCylinder(cx, -30, 62, R, m.brass);
    // Copper rings and the orange band.
    c.litCylinder(cx, 6, 10, 22.5, m.copper);
    c.litCylinder(cx, 52, 57, 22.5, m.copper);
    c.litCylinder(cx, 29, 35, 22.4, m.team);
    c.litCylinder(cx, -31, -27, 6, m.copper);
    // Panel seams following the curve, dark with a lit edge.
    for (const f of [-0.62, 0, 0.62]) {
      const x = Math.round(cx + f * 22);
      for (let y = 11; y < 52; y++) {
        if (y >= 28 && y <= 36) continue;
        c.px(x, y, m.brass[1]).px(x + 1, y, m.brass[5]);
      }
    }
    // Rivets on the rings.
    for (let x = cx - 19; x <= cx + 18; x += 5) {
      c.rivet(x, 7, m.copper).rivet(x, 53, m.copper);
    }
    // Porthole: brass rim, dark glass with a reflection.
    const px = cx - 7, py = 19;
    c.litBlob(px, py, 7.5, 7.5, m.brass);
    c.litBlob(px, py, 5.5, 5.5, CP.ramp(0x1e5a60, 6));
    c.px(px - 3, py - 3, 0xffffff).px(px - 2, py - 3, 0xe0fff8).px(px - 3, py - 2, 0xe0fff8);
    c.line(px + 1, py + 4, px + 4, py + 1, 0x7ad8d0);
    for (const [dx, dy] of [[0, -7], [7, 0], [0, 7], [-7, 0]]) c.rivet(px + dx, py + dy, m.brass);
    // Hatch with a frame, handle and a little ladder to the ground.
    c.litRect(cx + 1, 38, 13, 18, m.iron, 0.42, { grain: 0.08, seed: 4 });
    c.hline(cx + 1, cx + 13, 38, m.brass[5]).vline(cx + 1, 38, 55, m.brass[5]).vline(cx + 13, 38, 55, m.brass[1]).hline(cx + 1, cx + 13, 55, m.brass[1]);
    c.rect(cx + 10, 46, 2, 2, m.brass[6]);
    for (let y = 57; y <= 84; y += 4) c.hline(cx + 3, cx + 11, y, m.steel[3]);
    c.vline(cx + 2, 56, 86, m.steel[2]).vline(cx + 12, 56, 86, m.steel[1]);
    // A copper pipe down the right side with a valve, and a wisp of steam.
    for (let y = 12; y <= 50; y++) c.px(cx + 19, y, m.copper[2]).px(cx + 20, y, m.copper[4]).px(cx + 21, y, m.copper[1]);
    c.litBlob(cx + 20, 24, 2.5, 2.5, m.brass);
    // Antenna with a red light.
    c.vline(cx, -39, -31, m.steel[3]).px(cx + 1, -36, m.steel[1]);
    c.px(cx, -39, 0xff5030);
    c.selOutline();
    c.shadow(cx + 6, 86, 42, 9, 70);
    // Soft things after the outline: steam and the antenna light.
    c.glow(cx + 24, 6, 6, 5, 0xffffff, 150).glow(cx + 28, 0, 5, 4, 0xffffff, 110);
    c.glow(cx, -39, 3, 3, 0xff5030, 160).px(cx, -39, 0xffd0a0);
    return c;
  }

  // ---- Greenhouse dome -----------------------------------------------------

  /** Greenhouse dome: a brass drum with a glass half-sphere full of plants (2×2 tiles). */
  function dome() {
    const m = M();
    const c = PC(T * 2, T * 2 + RISE.dome).origin(0, RISE.dome);
    const cx = 32, cy0 = 40, cy1 = 47, rx = 29, ry = 11;
    // Brass drum: front wall lit like a cylinder, with the orange band.
    for (let x = cx - rx; x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx;
      if (Math.abs(nx) > 1) continue;
      const s = Math.sqrt(1 - nx * nx);
      const yt = Math.round(cy0 + ry * s), yb = Math.round(cy1 + ry * s);
      const l = CP.lightOf(nx, 0, s);
      for (let y = yt; y <= yb; y++) {
        const band = y - yt >= 2 && y - yt <= 4;
        c.px(x, y, CP.tone(band ? m.team : m.brass, l - (y - yt) * 0.03, x, y));
      }
    }
    // Drum top: a brass rim around a bed of dark soil.
    for (let y = cy0 - ry; y <= cy0 + ry; y++)
      for (let x = cx - rx; x <= cx + rx; x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy0) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const inner = ((x + 0.5 - cx) / (rx - 4)) ** 2 + ((y + 0.5 - cy0) / (ry - 3)) ** 2 <= 1;
        c.px(x, y, inner ? CP.tone(m.soil, 0.45 + (CP.hash(x, y, 9) - 0.5) * 0.4, x, y) : CP.tone(m.brass, 0.78 - ny * 0.15, x, y));
      }
    // Plants: leafy clumps, taller at the back.
    for (const [x, y, rxl, ryl] of [[24, 30, 5, 7], [36, 26, 6, 9], [44, 34, 5, 6], [18, 37, 5, 4], [30, 38, 6, 5], [40, 41, 5, 3]]) {
      c.vline(x, y, y + ryl, m.wood[1]);
      c.litBlob(x, y, rxl, ryl, m.leaf, { rough: 0.35, seed: x * 7 + y });
    }
    for (const [x, y] of [[22, 28], [37, 21], [45, 32], [30, 36]]) c.px(x, y, 0xffd040).px(x + 1, y, 0xff8a3a); // flowers
    // Glass half-sphere over it all, see-through in the middle, denser at the rim.
    const rg = 26, hg = 32;
    for (let y = cy0 - hg; y <= cy0 + ry; y++)
      for (let x = cx - rg; x <= cx + rg; x++) {
        const nx = (x + 0.5 - cx) / rg;
        if (Math.abs(nx) > 1) continue;
        let ny;
        if (y <= cy0) {
          ny = (y + 0.5 - cy0) / hg;
          if (nx * nx + ny * ny > 1) continue;
        } else {
          if (y > cy0 + (ry - 3) * Math.sqrt(1 - nx * nx)) continue;
          ny = 0;
        }
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const l = CP.lightOf(nx, ny, nz);
        const fres = 1 - nz;
        c.px(x, y, CP.tone(m.glass, 0.3 + l * 0.6, x, y), Math.round(55 + 170 * Math.pow(fres, 1.6)));
        // A bright curved reflection on the upper left.
        if (nx > -0.72 && nx < -0.52 && ny > -0.75 && ny < -0.15) c.px(x, y, 0xffffff, 170);
        if (l > 0.97) c.px(x, y, 0xffffff, 230);
      }
    // Brass ribs: meridians and one ring.
    for (const f of [-0.66, -0.33, 0, 0.33, 0.66]) {
      for (let y = cy0 - hg; y <= cy0; y++) {
        const ny = (y + 0.5 - cy0) / hg;
        const w = rg * Math.sqrt(Math.max(0, 1 - ny * ny));
        const x = Math.round(cx + f * w);
        const nz = Math.sqrt(Math.max(0, 1 - f * f * (1 - ny * ny) - ny * ny));
        c.px(x, y, CP.tone(m.brass, CP.lightOf(f * Math.sqrt(1 - ny * ny), ny, nz), x, y));
      }
    }
    const ringY = cy0 - Math.round(hg * 0.55), ringW = rg * Math.sqrt(1 - 0.55 * 0.55);
    for (let x = Math.round(cx - ringW); x <= Math.round(cx + ringW); x++) {
      const t = (x + 0.5 - cx) / ringW;
      if (Math.abs(t) > 1) continue;
      c.px(x, ringY + Math.round(Math.sqrt(1 - t * t) * 3), CP.tone(m.brass, CP.lightOf(t * 0.8, -0.55, 0.5), x, ringY));
    }
    // Vent on top.
    c.litBlob(cx, cy0 - hg, 3.5, 2.5, m.brass);
    c.litCylinder(cx, cy0 - hg - 4, cy0 - hg - 1, 1.5, m.copper);
    // Small door in the drum.
    c.litRect(cx - 3, 50, 7, 8, m.iron, 0.4).hline(cx - 3, cx + 3, 49, m.team[4]).px(cx + 2, 54, m.brass[6]);
    c.selOutline();
    c.shadow(cx + 5, 56, 31, 7, 70);
    return c;
  }

  // ---- Workshop ------------------------------------------------------------

  function bricks(c, x0, y0, w, h, l, skew = 0) {
    const m = M();
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const yy = y - Math.round((x - x0) * skew);
        const row = Math.floor(yy / 4);
        const off = row % 2 ? 4 : 0;
        const mortar = yy % 4 === 3 || (x + off) % 8 === 7;
        const v = mortar ? l - 0.05 : l + (CP.hash(Math.floor((x + off) / 8), row, 21) - 0.5) * 0.3;
        c.px(x, y, CP.tone(mortar ? m.mortar : m.brick, v, x, y));
      }
  }

  /** Armoury workshop: brick hall with a brass roof, gear, chimney and orange banner (3×3 tiles). */
  function workshop() {
    const m = M();
    const c = PC(T * 3, T * 3 + RISE.workshop).origin(0, RISE.workshop);
    // Chimney behind the roof, with smoke.
    c.litCylinder(80, -26, 14, 5, m.iron, { rough: 0.08, seed: 6 });
    c.litCylinder(80, -30, -25, 6.5, m.copper);
    // Side wall (in shade) and front wall of bricks.
    const side = PC(c.w, c.h);
    side.origin(0, RISE.workshop).poly([84, 30, 94, 22, 94, 80, 84, 88], 0xffffff);
    for (let y = 0; y < c.h; y++)
      for (let x = 0; x < c.w; x++) {
        if (side.data[(y * c.w + x) * 4 + 3] === 0) continue;
        const wy = y - RISE.workshop, yy = wy + Math.round((x - 84) * 0.8);
        const row = Math.floor(yy / 4), mortar = yy % 4 === 3 || (x + (row % 2 ? 2 : 0)) % 5 === 4;
        c.raw(x, y, CP.tone(mortar ? m.mortar : m.brick, mortar ? 0.2 : 0.25 + (CP.hash(x >> 2, row, 3) - 0.5) * 0.2, x, y));
      }
    bricks(c, 6, 30, 78, 54, 0.55);
    // Stone foundation.
    c.litRect(4, 84, 82, 5, m.rock, 0.45, { grain: 0.3, seed: 8 });
    c.litPoly([86, 84, 94, 78, 94, 82, 86, 89], m.rock, 0.25, { grain: 0.2, seed: 8 });
    // Shade under the eaves and at the foot of the wall.
    for (let y = 30; y < 36; y++) for (let x = 6; x < 84; x++) c.shade(x, y + RISE.workshop, 0.35 - (y - 30) * 0.05);
    // Roof: brass sheets with seams, a copper ridge and rivets on the eave.
    c.litPoly([0, 31, 86, 31, 74, 6, 12, 6], m.brass, 0.72, { grain: 0.08, seed: 9 });
    c.litPoly([86, 31, 95, 23, 86, 4, 74, 6], m.brass, 0.35, { grain: 0.08, seed: 9 });
    for (let k = 0; k <= 9; k++) {
      const xb = 4 + k * 8.6, xt = 14 + k * 6.4;
      c.line(xb, 30, xt, 7, m.brass[2]).line(xb + 1, 30, xt + 1, 7, m.brass[6]);
    }
    c.hline(12, 74, 5, m.copper[4]).hline(12, 74, 6, m.copper[2]);
    c.hline(0, 86, 31, m.brass[1]).hline(0, 86, 32, m.brass[0]);
    for (let x = 3; x < 86; x += 6) c.rivet(x, 29, m.brass);
    // Big door: planks, iron bands, an arched top.
    for (let y = 54; y < 84; y++)
      for (let x = 35; x < 57; x++) {
        const ax = (x + 0.5 - 46) / 11, ay = (y + 0.5 - 60) / 7;
        if (y < 60 && ax * ax + ay * ay > 1) continue;
        const plank = Math.floor((x - 35) / 4), gap = (x - 35) % 4 === 3;
        c.px(x, y, CP.tone(m.wood, gap ? 0.1 : 0.45 + (CP.hash(plank, y >> 3, 4) - 0.5) * 0.2 - (y - 54) * 0.006, x, y));
      }
    for (const y of [64, 77]) {
      c.hline(35, 56, y, m.iron[2]).hline(35, 56, y + 1, m.iron[0]);
      for (let x = 37; x < 56; x += 5) c.rivet(x, y, m.steel);
    }
    c.rect(52, 70, 2, 3, m.brass[6]);
    // Door frame of stone.
    for (let y = 52; y < 84; y++) {
      const top = y < 60;
      if (!top) { c.px(34, y, m.rock[4]).px(57, y, m.rock[2]); }
    }
    // Windows with warm light inside.
    for (const wx of [14, 64]) {
      for (let y = 44; y < 60; y++)
        for (let x = wx; x < wx + 12; x++) {
          const ax = (x + 0.5 - wx - 6) / 6, ay = (y + 0.5 - 50) / 6;
          if (y < 50 && ax * ax + ay * ay > 1) continue;
          c.px(x, y, CP.tone(m.warm, 0.95 - (y - 44) * 0.035 + (CP.hash(x, y, 5) - 0.5) * 0.15, x, y));
        }
      c.vline(wx + 6, 44, 59, m.iron[1]).hline(wx, wx + 11, 52, m.iron[1]);
      c.hline(wx - 1, wx + 12, 60, m.rock[5]).hline(wx - 1, wx + 12, 61, m.rock[2]);
      c.glow(wx + 6, 64, 8, 3, 0xffb050, 60);
    }
    // Brass gear over the door.
    const gx = 46, gy = 41;
    for (let y = gy - 12; y <= gy + 12; y++)
      for (let x = gx - 12; x <= gx + 12; x++) {
        const dx = x + 0.5 - gx, dy = y + 0.5 - gy;
        const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        const R = 8.5 + (Math.cos(a * 10) > 0.25 ? 2.5 : 0);
        if (r > R || r < 2.2) continue;
        let l = 0.62;
        if (r > R - 1.6) l += (-(dx / r) * 0.55 - (dy / r) * 0.6) * 0.5; // bevel lit from top-left
        if (r < 4) l = 0.3;
        c.px(x, y, CP.tone(m.brass, l, x, y));
      }
    c.litBlob(gx, gy, 2.4, 2.4, m.iron);
    // Copper pipe along the left wall with a valve wheel.
    for (let y = 33; y <= 84; y++) c.px(8, y, m.copper[4]).px(9, y, m.copper[2]).px(10, y, m.copper[1]);
    for (const y of [42, 66]) c.hline(7, 11, y, m.brass[5]).hline(7, 11, y + 1, m.brass[2]);
    c.litBlob(9, 54, 3, 3, m.copper);
    // Orange banner on the side wall, with a crossed hammer and wrench.
    c.litPoly([86, 40, 92, 35, 92, 60, 89, 57, 86, 64], m.cloth, 0.45, { grain: 0.05, seed: 2 });
    for (let y = 38; y < 62; y += 1) if (y % 3 === 0) c.px(88, y + 1, m.cloth[1]);
    c.line(87, 44, 91, 52, m.steel[5]).line(91, 43, 87, 52, m.steel[4]);
    c.selOutline();
    c.shadow(52, 88, 47, 8, 70);
    c.glow(78, -32, 7, 5, 0xd8d0d0, 150).glow(72, -34, 6, 4, 0xe8e0e0, 110);
    return c;
  }

  // ---- Crystal deposit -----------------------------------------------------

  function crystal(c, x, b, h, w, lean, l0 = 0) {
    const m = M();
    const t = b - h, tip = Math.max(4, w * 1.4);
    const Lb = [x - w, b], Mb = [x - w * 0.15, b + 2], Rb = [x + w, b];
    const Lt = [x - w + lean, t], Mt = [x - w * 0.15 + lean, t + 1], Rt = [x + w + lean, t];
    const Tp = [x + lean + w * 0.1, t - tip];
    c.litPoly([...Lb, ...Lt, ...Mt, ...Mb], m.crystal, 0.82 + l0, { grain: 0.1, seed: x });
    c.litPoly([...Mb, ...Mt, ...Rt, ...Rb], m.crystal, 0.5 + l0, { grain: 0.1, seed: x + 1 });
    c.litPoly([...Lt, ...Tp, ...Mt], m.crystal, 0.97 + l0, { seed: x + 2 });
    c.litPoly([...Mt, ...Tp, ...Rt], m.crystal, 0.66 + l0, { seed: x + 3 });
    // A light streak inside and bright edges.
    c.line(Mb[0] + 2, b - 3, Mt[0] + 2, t + 4, m.crystal[5]);
    c.line(Lt[0], Lt[1], Tp[0], Tp[1], m.crystal[6]);
    c.line(Mt[0], Mt[1], Mb[0], Mb[1] - 1, m.crystal[5]);
    c.px(Tp[0], Tp[1] + 1, 0xffffff);
  }

  /** Violet crystals growing out of red rock, glowing a little (2×2 tiles). */
  function crystalDeposit() {
    const m = M();
    const c = PC(T * 2, T * 2 + RISE.crystal).origin(0, RISE.crystal);
    c.litBlob(32, 47, 25, 12, m.rock, { rough: 0.25, seed: 1 });
    c.litBlob(13, 50, 10, 7, m.rock, { rough: 0.25, seed: 2 });
    c.litBlob(52, 49, 10, 7, m.rock, { rough: 0.25, seed: 3 });
    c.litBlob(44, 55, 5, 3, m.rock, { rough: 0.2, seed: 4 });
    for (const [x, y] of [[6, 55], [58, 55], [24, 57]]) c.litBlob(x, y, 2, 1.5, m.rock);
    // Back crystals first, front ones last.
    crystal(c, 15, 46, 17, 3.5, -4, -0.05);
    crystal(c, 23, 44, 29, 5, -3);
    crystal(c, 47, 46, 24, 4.5, 4);
    crystal(c, 35, 45, 40, 6.5, 2);
    crystal(c, 27, 53, 14, 3.5, -2);
    crystal(c, 41, 54, 12, 3, 2);
    for (const [x, y] of [[33, -4], [20, 12], [50, 20], [12, 30]]) c.px(x, y, 0xffffff).px(x - 1, y, 0xd8b8ff).px(x + 1, y, 0xd8b8ff).px(x, y - 1, 0xd8b8ff).px(x, y + 1, 0xd8b8ff);
    c.selOutline(0.55);
    c.glow(32, 52, 32, 11, 0xb070ff, 90, true);
    c.shadow(36, 56, 28, 6, 60);
    return c;
  }

  // ---- Wreck ---------------------------------------------------------------

  /** A crumpled metal plate: a lit polygon with dents (dark/light line pairs) and rust spots. */
  function plate(c, pts, r, l, seed, dents = 2) {
    c.litPoly(pts, r, l, { grain: 0.12, seed });
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      minX = Math.min(minX, pts[i]); maxX = Math.max(maxX, pts[i]);
      minY = Math.min(minY, pts[i + 1]); maxY = Math.max(maxY, pts[i + 1]);
    }
    const inside = (x, y) => c.get(Math.round(x) + c.ox, Math.round(y) + c.oy) >= 0;
    for (let k = 0; k < dents; k++) {
      const x0 = minX + CP.hash(seed, k, 1) * (maxX - minX), y0 = minY + CP.hash(seed, k, 2) * (maxY - minY);
      const x1 = x0 + (CP.hash(seed, k, 3) - 0.5) * 12, y1 = y0 + (CP.hash(seed, k, 4) - 0.5) * 8;
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let s = 0; s <= steps; s++) {
        const x = x0 + ((x1 - x0) * s) / (steps || 1), y = y0 + ((y1 - y0) * s) / (steps || 1);
        if (inside(x, y)) c.px(x, y, CP.tone(r, l - 0.3, Math.round(x), Math.round(y)));
        if (inside(x, y + 1)) c.px(x, y + 1, CP.tone(r, l + 0.25, Math.round(x), Math.round(y)));
      }
    }
    // Rust spots.
    const rust = CP.MAT.rust;
    for (let y = Math.floor(minY); y <= maxY; y++)
      for (let x = Math.floor(minX); x <= maxX; x++) {
        if (!inside(x, y)) continue;
        if (CP.hash(x >> 2, y >> 2, seed + 50) * 0.7 + CP.hash(x, y, seed + 51) * 0.3 > 0.72) c.px(x, y, CP.tone(rust, l - 0.05, x, y));
      }
  }

  /**
   * A heap of scrap from the rover of the earlier expedition: a mound of
   * crumpled plates of many metals, rods and a girder sticking out, a wheel
   * standing at the front, a gear, a spring and a scrap of the old white
   * paint with its blue stripe (2×2 tiles).
   */
  function wreck() {
    const m = M();
    const c = PC(T * 2, T * 2 + RISE.wreck).origin(0, RISE.wreck);
    const PAINT = CP.ramp(0xc0c4cc, 7, 0.75, 0.35);
    const BLUE = CP.ramp(0x3a6ab8, 6);
    const CELLS = CP.ramp(0x2a3e8a, 5, 0.6, 0.6);
    // Rods and a girder sticking up out of the back of the heap.
    c.litPoly([40, 28, 54, 0, 58, 2, 45, 30], m.steel, 0.62, { grain: 0.1, seed: 5 });
    c.line(41, 28, 55, 0, m.steel[5]);
    for (let k = 0; k < 3; k++) { const x = 46 + k * 3.4, y = 17 - k * 6; c.px(x, y, m.iron[0]).px(x + 1, y, m.iron[0]); }
    c.line(20, 22, 10, 4, m.copper[1]).line(21, 22, 11, 4, m.copper[4]).line(22, 22, 12, 4, m.copper[2]);
    c.litBlob(11, 4, 2, 1.5, CP.ramp(0x3a1e14, 5));
    c.line(30, 20, 34, 2, m.iron[2]).line(31, 20, 35, 2, m.steel[3]);
    // The mound: many crumpled plates of different metals, back to front.
    const mats = [m.steel, m.rust, m.steel, m.iron, m.copper, m.steel, m.rust, PAINT];
    const plates = [];
    for (let k = 0; k < 16; k++) {
      const cx = 8 + CP.hash(k, 1, 61) * 48;
      const top = 46 - (1 - Math.abs(cx - 32) / 30) * 30;
      const cy = top + 4 + CP.hash(k, 2, 61) * (44 - top - 4);
      plates.push({ cx, cy, k });
    }
    plates.sort((p, q) => p.cy - q.cy);
    for (const { cx, cy, k } of plates) {
      const size = 5 + CP.hash(k, 3, 61) * 6, a0 = CP.hash(k, 4, 61) * Math.PI;
      const pts = [];
      for (let j = 0; j < 4; j++) {
        const a = a0 + j * (Math.PI / 2) + (CP.hash(k, 10 + j, 61) - 0.5) * 0.8;
        const r = size * (0.7 + CP.hash(k, 20 + j, 61) * 0.5);
        pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75);
      }
      plate(c, pts, mats[k % mats.length], 0.45 + CP.hash(k, 5, 61) * 0.3, 70 + k, 1);
    }
    // A scrap of the old white paint with its blue stripe, in the middle of the heap.
    plate(c, [22, 26, 36, 22, 40, 30, 26, 34], PAINT, 0.62, 3, 2);
    c.litPoly([23, 29, 38, 25, 39, 28, 24, 32], BLUE, 0.55);
    // Shard of a solar panel.
    c.litPoly([42, 34, 52, 31, 54, 37, 45, 40], CELLS, 0.55);
    c.line(46, 33, 48, 39, 0x18225a).line(43, 36, 53, 34, 0x18225a).px(45, 35, 0xffffff);
    // A gear half sunk in on the right.
    for (let y = 30; y <= 48; y++)
      for (let x = 44; x <= 62; x++) {
        const dx = x + 0.5 - 53, dy = y + 0.5 - 41, r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
        if (r < 1.5) continue;
        const R = 5.5 + (Math.cos(ang * 8) > 0.2 ? 2 : 0);
        if (r > R) continue;
        let l = 0.6 + (r > R - 1.5 ? -(dx / r) * 0.3 - (dy / r) * 0.35 : 0);
        if (r < 3) l = 0.25;
        c.px(x, y, CP.tone(m.brass, l, x, y));
      }
    // A wheel standing at the front left: dark tyre with tread, steel hub.
    for (let y = 31; y <= 49; y++)
      for (let x = 4; x <= 20; x++) {
        const dx = (x + 0.5 - 12) / 7.5, dy = (y + 0.5 - 40) / 9, d = Math.hypot(dx, dy);
        if (d > 1) continue;
        const ang = Math.atan2(dy, dx);
        let l, r = m.iron;
        if (d > 0.72) l = 0.3 + (Math.cos(ang * 9) > 0.1 ? 0.18 : 0) - dx * 0.15 - dy * 0.2;
        else if (d > 0.3) { r = m.steel; l = 0.55 + (Math.cos(ang * 5) > 0.6 ? 0.22 : -0.05) - dx * 0.15 - dy * 0.2; }
        else { r = m.steel; l = 0.8 - dx * 0.3 - dy * 0.3; }
        c.px(x, y, CP.tone(r, l, x, y));
      }
    // A coil spring at the front.
    for (let k = 0; k < 4; k++) c.line(26 + k * 2.5, 46, 27 + k * 2.5, 42, m.steel[5]).line(27 + k * 2.5, 42, 28.5 + k * 2.5, 46, m.steel[2]);
    c.selOutline(0.62);
    // Small sand drifts at the foot, a shadow, and loose bits around.
    const dune = CP.ramp(0xc4623a, 6, 0.5, 0.4);
    c.shadow(34, 50, 30, 6, 70);
    c.litBlob(38, 49, 9, 2.5, dune, { rough: 0.3, seed: 13, ambient: 0.45 });
    c.litBlob(60, 47, 5, 2, dune, { rough: 0.3, seed: 14, ambient: 0.45 });
    const bits = PC(c.w, c.h).origin(0, RISE.wreck);
    bits.litPoly([50, 52, 57, 50, 59, 54, 52, 56], m.steel, 0.75, { seed: 3 });
    bits.litPoly([24, 53, 30, 52, 31, 55, 25, 56], m.rust, 0.6, { seed: 4 });
    bits.litPoly([1, 52, 6, 51, 7, 54, 2, 55], PAINT, 0.6, { seed: 5 });
    bits.px(52, 51, 0xffffff);
    for (const [x, y] of [[16, 55], [40, 56], [46, 53]]) bits.rivet(x, y, m.steel);
    bits.selOutline(0.55);
    c.blit(bits, 0, 0);
    return c;
  }

  /** What's left of an emptied wreck: rusty plates and a wheel in the sand. */
  function debris() {
    const m = M();
    const c = PC(T * 2, T * 2);
    c.litPoly([12, 30, 24, 28, 26, 33, 13, 35], m.rust, 0.55, { grain: 0.2, seed: 1 });
    c.litPoly([34, 40, 46, 38, 47, 42, 35, 44], m.rust, 0.5, { grain: 0.2, seed: 2 });
    c.litPoly([40, 22, 47, 21, 48, 26, 41, 27], m.steel, 0.6, { grain: 0.2, seed: 3 });
    c.litBlob(24, 46, 5, 2.5, m.iron).litBlob(24, 45.5, 2, 1, m.steel);
    for (const [x, y] of [[30, 30], [18, 40], [50, 32]]) c.rivet(x, y, m.steel);
    c.selOutline(0.45);
    c.litBlob(30, 37, 6, 2, CP.ramp(0xc4623a, 6, 0.5, 0.4), { rough: 0.2, seed: 4, ambient: 0.45 });
    return c;
  }

  // ---- Worm nest -----------------------------------------------------------

  /** A worm nest: a sand mound with a deep hole and claw marks (1 tile). */
  function nest() {
    const m = M();
    const c = PC(T, T + RISE.nest).origin(0, RISE.nest);
    c.litBlob(16, 18, 15, 10.5, m.sand, { rough: 0.25, seed: 5 });
    // The hole: its far wall catches the light, the bottom is dark.
    const hx = 16, hy = 16, hrx = 8.5, hry = 5.5;
    for (let y = Math.floor(hy - hry); y <= Math.ceil(hy + hry); y++)
      for (let x = Math.floor(hx - hrx); x <= Math.ceil(hx + hrx); x++) {
        const nx = (x + 0.5 - hx) / hrx, ny = (y + 0.5 - hy) / hry, d = nx * nx + ny * ny;
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d);
        let l = CP.lightOf(-nx, -ny, nz * 0.6) * 0.75;
        if (d < 0.4) l = 0.05 + d * 0.2;
        c.px(x, y, CP.tone(m.soil, l, x + c.ox, y + c.oy));
      }
    // Lip of the hole, lit on the near side.
    for (let x = 9; x <= 23; x++) {
      const t = (x + 0.5 - hx) / hrx;
      if (Math.abs(t) > 1) continue;
      c.px(x, Math.round(hy + hry * Math.sqrt(1 - t * t)), m.sand[5]);
    }
    // Claw marks and pebbles.
    for (const [x0, y0, x1, y1] of [[3, 13, 7, 16], [28, 12, 25, 15], [5, 24, 9, 22], [27, 24, 23, 22]]) {
      c.line(x0, y0, x1, y1, m.sand[1]).line(x0 + 1, y0, x1 + 1, y1, m.sand[4]);
    }
    for (const [x, y] of [[6, 19], [26, 18], [12, 26], [21, 26]]) c.litBlob(x, y, 1.6, 1.2, m.rock);
    c.selOutline(0.3);
    return c;
  }

  // ---- Scaffolding over a building site ------------------------------------

  function scaffold(size) {
    const m = M();
    const s = size * T;
    const c = PC(s, s);
    const pole = (x) => { c.vline(x, 4, s - 2, m.wood[4]).vline(x + 1, 4, s - 2, m.wood[2]).vline(x + 2, 4, s - 2, m.wood[1]); };
    const plank = (y) => { c.hline(1, s - 2, y, m.wood[5]).hline(1, s - 2, y + 1, m.wood[3]).hline(1, s - 2, y + 2, m.wood[1]); };
    for (let k = 0; k <= size; k++) pole(Math.min(s - 4, 2 + Math.round((k * (s - 6)) / size)));
    plank(Math.round(s * 0.42));
    plank(Math.round(s * 0.78));
    c.line(4, Math.round(s * 0.78), Math.round(s * 0.5), Math.round(s * 0.42), m.wood[2]);
    c.line(5, Math.round(s * 0.78), Math.round(s * 0.5) + 1, Math.round(s * 0.42), m.wood[4]);
    for (let k = 0; k <= size; k++) {
      const x = Math.min(s - 4, 2 + Math.round((k * (s - 6)) / size));
      c.rect(x, Math.round(s * 0.42) - 1, 3, 1, 0xd8c8a0).rect(x, Math.round(s * 0.78) - 1, 3, 1, 0xd8c8a0); // rope ties
    }
    c.selOutline(0.5);
    return c;
  }


  // ---- Steam forge -----------------------------------------------------------

  /** The steam forge: a brick kiln with a glowing mouth, an iron shed, a tall chimney and an anvil (3×3 tiles). */
  function forge() {
    const m = M();
    const c = PC(T * 3, T * 3 + RISE.forge).origin(0, RISE.forge);
    // Tall chimney at the back right.
    c.litCylinder(72, -40, 20, 5.5, m.brick, { rough: 0.15, seed: 11 });
    for (let y = -36; y < 20; y += 4) for (let x = 67; x <= 77; x++) if (((x + (y >> 2)) & 3) === 0) c.shade(x, y + RISE.forge, 0.25);
    c.litCylinder(72, -44, -39, 7, m.copper);
    // Iron shed on the right: walls of riveted plates, a sloped roof.
    c.litRect(50, 30, 40, 54, m.iron, 0.48, { grain: 0.12, seed: 12, ao: 0.25 });
    for (let x = 52; x < 90; x += 9) { c.vline(x, 31, 83, m.iron[1]); c.vline(x + 1, 31, 83, m.iron[4]); }
    for (let y = 34; y < 84; y += 10) for (let x = 54; x < 90; x += 9) c.rivet(x, y, m.steel);
    c.litPoly([46, 32, 94, 32, 90, 18, 52, 18], m.copper, 0.6, { grain: 0.1, seed: 13 });
    c.hline(46, 94, 32, m.copper[1]).hline(52, 90, 18, m.copper[5]);
    // Brass gear on the shed.
    const gx = 70, gy = 50;
    for (let y = gy - 10; y <= gy + 10; y++)
      for (let x = gx - 10; x <= gx + 10; x++) {
        const dx = x + 0.5 - gx, dy = y + 0.5 - gy, rr = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        const R = 7 + (Math.cos(a * 8) > 0.2 ? 2.5 : 0);
        if (rr > R || rr < 2) continue;
        let l = 0.6;
        if (rr > R - 1.5) l += (-(dx / rr) * 0.55 - (dy / rr) * 0.6) * 0.5;
        c.px(x, y, CP.tone(m.brass, l, x, y));
      }
    // Shed door with warm light.
    c.litRect(62, 64, 16, 20, m.warm, 0.75, { grain: 0.15, seed: 14, ao: 0.3 });
    c.vline(70, 64, 83, m.iron[1]).hline(62, 77, 64, m.iron[1]);
    // Brick kiln on the left: a big half-dome with an arched, glowing mouth.
    for (let y = 18; y < 86; y++)
      for (let x = 2; x < 56; x++) {
        const nx = (x + 0.5 - 29) / 27, ny = (y + 0.5 - 58) / 40;
        if (y > 58 ? Math.abs(nx) > 1 : nx * nx + ny * ny > 1) continue;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - (y > 58 ? 0 : ny * ny)));
        const row = Math.floor(y / 4), mortar = y % 4 === 3 || (x + (row & 1) * 3) % 6 === 5;
        let l = CP.lightOf(nx, y > 58 ? 0 : ny, nz);
        if (y > 74) l -= (y - 74) * 0.02;
        c.px(x, y, CP.tone(mortar ? m.mortar : m.brick, l + (CP.hash(x >> 1, row, 15) - 0.5) * 0.12 - (mortar ? 0.1 : 0), x, y + RISE.forge));
      }
    // The mouth: fire inside, hottest in the middle.
    for (let y = 56; y < 84; y++)
      for (let x = 16; x < 42; x++) {
        const ax = (x + 0.5 - 29) / 13, ay = (y + 0.5 - 66) / 10;
        if (y < 66 && ax * ax + ay * ay > 1) continue;
        const heat = 1 - Math.min(1, Math.hypot(ax, (y + 0.5 - 78) / 12));
        c.px(x, y, CP.tone(m.warm, 0.35 + heat * 0.7 + (CP.hash(x, y, 16) - 0.5) * 0.2, x, y + RISE.forge));
      }
    for (let x = 15; x <= 43; x++) {
      const ax = (x + 0.5 - 29) / 14;
      if (Math.abs(ax) <= 1) c.px(x, Math.round(66 - Math.sqrt(1 - ax * ax) * 11), m.rock[5]);
    }
    c.litRect(14, 83, 30, 3, m.rock, 0.45, { grain: 0.3, seed: 17 });
    // Anvil in front of the kiln.
    c.litRect(44, 76, 12, 3, m.iron, 0.6);
    c.litPoly([46, 79, 54, 79, 53, 84, 47, 84], m.iron, 0.4);
    c.px(44, 76, m.steel[5]).px(45, 76, m.steel[5]);
    // Copper pipe from the kiln to the shed.
    for (let x = 40; x < 56; x++) c.px(x, 30, m.copper[4]).px(x, 31, m.copper[2]).px(x, 32, m.copper[1]);
    c.litBlob(48, 31, 2.5, 2.5, m.brass);
    c.selOutline();
    c.shadow(50, 88, 46, 8, 70);
    c.glow(29, 76, 20, 12, 0xffa040, 90);
    c.glow(72, -48, 8, 6, 0x3a3034, 140).glow(78, -54, 7, 5, 0x5a5054, 110).glow(70, -58, 6, 4, 0x7a7074, 90);
    return c;
  }

  // ---- Rocket wreck ----------------------------------------------------------

  /**
   * The rocket of the earlier expedition (mission 3): a tall silver rocket
   * that came down crooked, leaning to the right with its fins half buried
   * in a heap of sand, hull plates torn open and streaked with rust (3×3 tiles).
   */
  function rocket() {
    const m = M();
    const c = PC(T * 3, T * 3 + RISE.rocket).origin(0, RISE.rocket);
    const HULL = CP.ramp(0xc8ccd4, 7, 0.75, 0.35);
    const BAND = CP.ramp(0x2a6ab0, 6, 0.7, 0.4);
    const ax = 34, ay = 78, bx = 62, by = -48; // axis: base to tip
    const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
    const vx = -uy, vy = ux; // across the hull
    const radius = (t) => (t < 0.72 ? 13 : t < 1 ? 13 * Math.sqrt(1 - ((t - 0.72) / 0.28) ** 2) : 0);
    // Fins behind the body.
    c.litPoly([ax - 12, ay - 22, ax - 26, ay + 4, ax - 10, ay + 2], HULL, 0.35, { grain: 0.1, seed: 21 });
    for (let y = -RISE.rocket; y < T * 3; y++)
      for (let x = 0; x < T * 3; x++) {
        const px = x + 0.5 - ax, py = y + 0.5 - ay;
        const t = (px * ux + py * uy) / len, d = px * vx + py * vy;
        if (t < 0 || t > 1) continue;
        const rad = radius(t);
        if (Math.abs(d) > rad) continue;
        const n = d / rad, nz = Math.sqrt(1 - n * n);
        let l = CP.lightOf(n * vx, n * vy - 0.1, nz) + (CP.hash(x >> 1, y >> 1, 22) - 0.5) * 0.06;
        let rp = HULL;
        if ((t > 0.3 && t < 0.36) || (t > 0.7 && t < 0.73)) rp = BAND;
        if (t > 0.88) rp = m.copper;
        // Rust streaks running down from the seams.
        if (CP.hash(Math.round(d), 0, 23) < 0.18 && t < 0.6 && CP.hash(x, y, 24) < 0.6) rp = m.rust;
        // Seams around the hull.
        if (Math.abs(((t * len) % 14) - 7) < 0.5) l -= 0.25;
        c.px(x, y, CP.tone(rp, l, x, y));
      }
    // A porthole and a torn-open plate showing dark ribs inside.
    const at = (t, d) => [ax + ux * len * t + vx * d, ay + uy * len * t + vy * d];
    const [wx, wy] = at(0.58, -2);
    c.litBlob(wx, wy, 5, 5, m.brass);
    c.litBlob(wx, wy, 3.4, 3.4, CP.ramp(0x1e5a60, 6));
    c.px(Math.round(wx) - 2, Math.round(wy) - 2, 0xffffff);
    const [hx, hy] = at(0.2, 3);
    c.litPoly([hx - 6, hy - 6, hx + 5, hy - 9, hx + 7, hy + 3, hx - 4, hy + 6], m.iron, 0.1, { seed: 25 });
    for (let k = -4; k <= 4; k += 3) c.line(hx + k - 3, hy - 6, hx + k + 2, hy + 4, m.steel[2]);
    c.litPoly([hx + 7, hy + 3, hx + 14, hy + 8, hx + 9, hy - 2], HULL, 0.8, { seed: 26 });
    // Front fin.
    c.litPoly([ax + 10, ay - 18, ax + 26, ay + 6, ax + 8, ay + 4], HULL, 0.62, { grain: 0.1, seed: 27 });
    c.line(ax + 10, ay - 18, ax + 26, ay + 6, HULL[6]);
    // A heap of sand at the base, and loose plates around.
    c.litBlob(40, 86, 34, 9, m.sand, { rough: 0.3, seed: 28, clipY: 95 });
    c.litPoly([6, 70, 16, 67, 18, 72, 8, 75], m.rust, 0.5, { grain: 0.2, seed: 29 });
    c.litPoly([78, 74, 90, 72, 89, 78, 79, 79], HULL, 0.6, { grain: 0.2, seed: 30 });
    c.selOutline(0.6);
    c.shadow(56, 90, 40, 6, 60);
    return c;
  }

  // ---- Big crystal deposit ---------------------------------------------------

  /** The big deposit the Guardian keeps: a cluster of tall crystals on a rock shelf (3×3 tiles). */
  function bigCrystal() {
    const m = M();
    const c = PC(T * 3, T * 3 + RISE.bigCrystal).origin(0, RISE.bigCrystal);
    c.litBlob(48, 70, 42, 17, m.rock, { rough: 0.25, seed: 31 });
    c.litBlob(16, 76, 14, 9, m.rock, { rough: 0.25, seed: 32 });
    c.litBlob(80, 74, 14, 10, m.rock, { rough: 0.25, seed: 33 });
    for (const [x, y] of [[4, 84], [92, 84], [40, 88], [64, 88]]) c.litBlob(x, y, 2.5, 1.6, m.rock);
    crystal(c, 18, 70, 22, 4.5, -5, -0.05);
    crystal(c, 30, 66, 40, 6, -4);
    crystal(c, 72, 68, 34, 6, 5);
    crystal(c, 84, 74, 18, 4, 6, -0.05);
    crystal(c, 52, 64, 62, 8.5, 2);
    crystal(c, 40, 76, 24, 5, -3);
    crystal(c, 62, 78, 20, 4.5, 3);
    crystal(c, 26, 82, 10, 3, -2);
    for (const [x, y] of [[54, -18], [30, 14], [74, 22], [14, 42], [88, 50]]) c.px(x, y, 0xffffff).px(x - 1, y, 0xd8b8ff).px(x + 1, y, 0xd8b8ff).px(x, y - 1, 0xd8b8ff).px(x, y + 1, 0xd8b8ff);
    c.selOutline(0.55);
    c.glow(48, 74, 46, 15, 0xb070ff, 100, true);
    c.shadow(54, 84, 40, 7, 60);
    return c;
  }

  const cache = new Map();
  const PAINT = {
    forge, rocket, bigCrystal,
    crystal: crystalDeposit, wreck, debris, nest, dome, workshop, lander,
    scaffold2: () => scaffold(2), scaffold3: () => scaffold(3),
  };
  CP.paintLander = lander;

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
    star(c) {
      c.poly([8, 1, 10, 6, 15, 6, 11, 9, 13, 15, 8, 11, 3, 15, 5, 9, 1, 6, 6, 6], 0xf2c230);
      c.poly([8, 1, 10, 6, 15, 6, 11, 9, 8, 8], 0xffe680);
    },
    forge(c) {
      c.rect(2, 6, 12, 8, 0x8a3a2a).rect(2, 5, 12, 2, 0xc89a3c);
      c.rect(10, 1, 3, 5, 0x4a4c56);
      c.rect(5, 9, 5, 4, 0xffa040).px(6, 10, 0xffe080);
    },
    flag(c) {
      c.vline(4, 1, 15, 0x6a6e78).vline(5, 1, 15, 0xa8acb4);
      c.poly([6, 2, 14, 4, 6, 8], 0xf28a1e);
    },
    rocket(c) {
      c.poly([8, 1, 11, 5, 11, 12, 5, 12, 5, 5], 0xc0c4cc);
      c.poly([8, 1, 5, 5, 5, 12, 7, 12, 7, 5], 0xe8ecf0);
      c.poly([5, 9, 2, 14, 5, 13], 0xb0582c).poly([11, 9, 14, 14, 11, 13], 0xb0582c);
      c.ellipse(8, 7, 1.5, 1.5, 0x3aa8a0);
    },
    skull(c) {
      c.ellipse(8, 7, 5.5, 5, 0xe8402a);
      c.rect(5, 11, 6, 3, 0xe8402a);
      c.ellipse(6, 7, 1.5, 1.8, 0x1a0806).ellipse(10, 7, 1.5, 1.8, 0x1a0806);
      c.vline(7, 12, 13, 0x1a0806).vline(9, 12, 13, 0x1a0806);
    },
    // Upgrades.
    up_picks(c) {
      c.line(3, 14, 11, 4, 0x8a5a2a).line(4, 14, 12, 4, 0xb07a3a);
      c.poly([6, 3, 14, 2, 15, 5, 11, 4], 0xa8acb4).poly([6, 3, 11, 4, 9, 6], 0x6a6e78);
    },
    up_boots(c) {
      c.rect(4, 2, 5, 9, 0x8a4a22).rect(4, 10, 10, 4, 0x8a4a22).rect(4, 13, 11, 2, 0x3a2010);
      c.rect(5, 3, 2, 7, 0xb06a32).hline(4, 8, 6, 0xc89a3c);
    },
    up_supplies(c) {
      c.rect(2, 4, 12, 10, 0xb07a3a).rect(2, 4, 12, 2, 0xd09a4a);
      c.line(2, 6, 13, 13, 0x7a4a1a).line(13, 6, 2, 13, 0x7a4a1a).rect(2, 9, 12, 1, 0x7a4a1a);
    },
    up_infirmary(c) {
      c.ellipse(8, 8, 7, 7, 0xf0ece4);
      c.rect(6, 3, 4, 10, 0xe8402a).rect(3, 6, 10, 4, 0xe8402a);
    },
    up_swords(c) {
      c.line(3, 13, 12, 2, 0xd8dce4).line(4, 13, 13, 2, 0xa8acb4);
      c.line(13, 13, 4, 2, 0xd8dce4).line(12, 13, 3, 2, 0xa8acb4);
      c.rect(2, 12, 3, 3, 0xc89a3c).rect(11, 12, 3, 3, 0xc89a3c);
    },
    up_shields(c) {
      c.poly([2, 2, 14, 2, 14, 8, 8, 15, 2, 8], 0xc89a3c);
      c.poly([4, 4, 12, 4, 12, 8, 8, 13, 4, 8], 0x3a6aa8);
      c.vline(8, 4, 12, 0xe8ecf0).hline(4, 12, 7, 0xe8ecf0);
    },
    up_barrels(c) {
      c.rect(1, 6, 13, 4, 0x6a6e78).rect(1, 6, 13, 1, 0xa8acb4).rect(12, 5, 3, 6, 0x4a4c56);
      c.rect(3, 6, 2, 4, 0xc89a3c).rect(8, 6, 2, 4, 0xc89a3c);
    },
    up_sights(c) {
      c.ellipse(8, 8, 7, 7, 0xe8402a).ellipse(8, 8, 5, 5, 0xf0ece4).ellipse(8, 8, 3, 3, 0xe8402a).ellipse(8, 8, 1.2, 1.2, 0xf0ece4);
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

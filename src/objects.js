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
  const RISE = { crystal: 26, wreck: 18, dome: 22, workshop: 34, lander: 40, nest: 6 };
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

  /** A big rover wheel: dark tyre with tread blocks, lit steel hub with spokes. */
  function wheel(c, x, y, r) {
    const m = M();
    for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++)
      for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) {
        const dx = xx + 0.5 - x, dy = yy + 0.5 - y, d = Math.hypot(dx, dy);
        if (d > r) continue;
        const a = Math.atan2(dy, dx);
        let l;
        if (d > r - 2.2) l = 0.28 + (Math.cos(a * 8) > 0.1 ? 0.18 : 0) - (dx / r) * 0.12 - (dy / r) * 0.15; // tyre with tread
        else if (d > r * 0.45) l = 0.55 + (Math.cos(a * 5) > 0.6 ? 0.25 : 0) - (dx / r) * 0.15 - (dy / r) * 0.2; // spokes
        else l = 0.75 - (dx / r) * 0.3 - (dy / r) * 0.3; // hub
        c.px(xx, yy, CP.tone(d > r - 2.2 ? m.iron : m.steel, l, xx, yy));
      }
    c.px(Math.round(x - 1), Math.round(y - 1), 0xffffff);
  }

  /**
   * The rover of the earlier expedition: white paint with a blue stripe,
   * blue solar wings, big wheels on rocker arms and a camera head on a
   * mast. Rust in big patches, half buried, scrap lying around (2×2 tiles).
   */
  function wreck() {
    const m = M();
    const c = PC(T * 2, T * 2 + RISE.wreck).origin(0, RISE.wreck);
    const PAINT = CP.ramp(0xc8ccd4, 7, 0.75, 0.35);
    const BLUE = CP.ramp(0x3a6ab8, 6);
    const CELLS = CP.ramp(0x2a3e8a, 5, 0.6, 0.6);
    // Rust: big coherent patches, plus streaks running down.
    const rusty = (x, y) => CP.hash(x >> 3, y >> 3, 41) * 0.65 + CP.hash(x >> 1, y >> 1, 42) * 0.35 > 0.66;
    const face = (pts, l, seed) => {
      const tmp = PC(c.w, c.h).origin(0, RISE.wreck).poly(pts, 0xffffff);
      for (let y = 0; y < c.h; y++)
        for (let x = 0; x < c.w; x++) {
          if (tmp.data[(y * c.w + x) * 4 + 3] === 0) continue;
          const r = rusty(x, y) || (CP.hash(x, 0, 43) > 0.9 && CP.hash(x, y >> 2, 44) > 0.4);
          c.raw(x, y, CP.tone(r ? m.rust : PAINT, (r ? l - 0.05 : l) + (CP.hash(x, y, seed) - 0.5) * 0.08, x, y));
        }
    };

    // Left solar wing, bent down, behind the body.
    c.litPoly([2, 16, 16, 14, 18, 8, 4, 12], CELLS, 0.5);
    for (let k = 0; k < 4; k++) c.line(4 + k * 3.5, 15.5 - k * 0.5, 6 + k * 3.5, 11 - k * 0.8, 0x18225a);
    c.line(3, 14, 17, 11, 0x9ab0ff);
    // Mast with the camera head: a box with two round lenses, like eyes.
    c.litRect(37, -8, 3, 20, m.steel, 0.55);
    c.vline(37, -8, 11, m.steel[5]);
    c.litPoly([30, -10, 46, -10, 49, -14, 33, -14], PAINT, 0.85);
    c.litRect(30, -10, 16, 8, PAINT, 0.6);
    c.litPoly([46, -10, 49, -14, 49, -6, 46, -2], PAINT, 0.35);
    c.litBlob(35, -6, 2.6, 2.6, CP.ramp(0x1a1e2a, 5)).px(34, -7, 0xffffff);
    c.litBlob(41.5, -6, 2.6, 2.6, CP.ramp(0x1a1e2a, 5)).px(40.5, -7, 0xffffff);
    // Body: top, front and side faces of a box.
    face([6, 24, 50, 24, 57, 15, 13, 15], 0.82, 51);
    face([6, 24, 50, 24, 50, 37, 6, 37], 0.56, 52);
    face([50, 24, 57, 15, 57, 28, 50, 37], 0.3, 53);
    // Blue stripe of the old expedition and an edge highlight.
    c.litRect(6, 28, 44, 3, BLUE, 0.6);
    c.litPoly([50, 28, 57, 19, 57, 21, 50, 31], BLUE, 0.3);
    c.hline(6, 49, 24, PAINT[6]);
    for (let x = 9; x < 50; x += 7) c.rivet(x, 34, m.steel);
    // Top solar panel, cracked, catching the light.
    c.litPoly([16, 22, 40, 22, 45, 17, 21, 17], CELLS, 0.55);
    for (let k = 1; k < 5; k++) c.line(16 + k * 4.8, 22, 21 + k * 4.8, 17, 0x18225a);
    c.line(19, 19.5, 43, 19.5, 0x18225a);
    c.line(22, 21, 27, 18, 0xe0e8ff).line(27, 18, 30, 21, 0xe0e8ff);
    c.px(23, 18, 0xffffff).px(24, 18, 0xc8d4ff);
    // Rocker arms joining the wheels.
    c.line(10, 40, 26, 36, m.iron[2]).line(10, 39, 26, 35, m.steel[4]);
    c.line(26, 36, 44, 40, m.iron[2]).line(26, 35, 44, 39, m.steel[4]);
    // Big wheels; the back one is missing.
    wheel(c, 10, 42, 7);
    wheel(c, 27, 43, 7);
    c.litBlob(44, 41, 2.2, 2.2, m.steel); // broken axle stub
    c.selOutline(0.62);
    // Soft things after the outline: sand drift over the missing wheel, and the shadow.
    const dune = CP.ramp(0xc4623a, 6, 0.5, 0.4);
    c.shadow(34, 50, 30, 6, 70);
    c.litBlob(48, 46, 14, 5, dune, { rough: 0.2, seed: 13, ambient: 0.45 });
    // Scrap lying around: shiny plates and bolts, so it reads as a source of metal.
    const scrap = PC(c.w, c.h).origin(0, RISE.wreck);
    scrap.litPoly([50, 52, 58, 50, 60, 54, 52, 56], m.steel, 0.75, { seed: 3 });
    scrap.litPoly([2, 50, 9, 48, 10, 52, 3, 54], m.steel, 0.6, { seed: 4 });
    scrap.litPoly([38, 54, 44, 53, 44, 56, 38, 57], PAINT, 0.6, { seed: 5 });
    scrap.px(52, 51, 0xffffff).px(4, 49, 0xffffff);
    for (const [x, y] of [[16, 54], [30, 56], [47, 57]]) scrap.rivet(x, y, m.steel);
    scrap.selOutline(0.55);
    c.blit(scrap, 0, 0);
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

  const cache = new Map();
  const PAINT = {
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

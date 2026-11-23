// Creature sprites, painted after the cards in reference/karty/.
// All face right; the renderer flips them for left.
(function (CP) {
  'use strict';
  const PC = (w, h) => new CP.PixelCanvas(w, h);
  const OUT = 0x2a120c;

  /**
   * Mabmia (mabmia.jpg): a red ball with a big smile and big brown eyes,
   * a blue and a red fluffy ring below it, long jointed wooden legs and
   * stones for feet — a dark blue one and a grey one.
   */
  function mabmia(frame) {
    const c = PC(22, 36);
    const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const WOOD = 0xd8a868, WOOD_D = 0x9a6a38, JOINT = 0x7a4a22;
    // Legs: two long sticks with a knee joint, swinging when walking.
    const leg = (hipX, footX) => {
      const kneeX = (hipX + footX) / 2, kneeY = 25;
      c.line(hipX, 18, kneeX, kneeY, WOOD).line(hipX + 1, 18, kneeX + 1, kneeY, WOOD_D);
      c.line(kneeX, kneeY, footX, 31, WOOD).line(kneeX + 1, kneeY, footX + 1, 31, WOOD_D);
      c.px(kneeX, kneeY, JOINT).px(kneeX + 1, kneeY, JOINT);
    };
    leg(9, 7 + step * 2);
    leg(12, 14 - step * 2);
    // Stones for feet: dark blue on the left, grey on the right.
    c.blob(7 + step * 2, 32.5, 3.6, 2.2, 0x2a3a78, 0x3a4c9a, 0x6a7cc8);
    c.blob(15 - step * 2, 32.5, 3.6, 2.2, 0x6a6e78, 0x9a9ea8, 0xd0d4dc);
    // Red fluffy ring, then the blue one.
    c.ellipse(11, 17, 6.5, 3, 0xa82a2a).ellipse(11, 16.5, 6, 2.5, 0xd84040);
    for (let x = 6; x <= 16; x += 2) c.px(x, 15, 0xf06a5a).px(x + 1, 19, 0x8a1e1e);
    c.ellipse(11, 13, 6.5, 2.8, 0x4a90c8).ellipse(11, 12.5, 6, 2.3, 0x8ac8f0);
    for (let x = 6; x <= 16; x += 2) c.px(x, 11, 0xc8ecff).px(x + 1, 15, 0x3a78b0);
    // The red ball head, a bit bigger than the rings, like on the card.
    c.blob(11, 6, 6.4, 6, 0xb82e2a, 0xe04a40, 0xff8a78);
    // Big round eyes: white, brown iris, a spark of light; looking right.
    for (const ex of [9.5, 14]) {
      c.ellipse(ex, 5.5, 1.9, 2.2, 0xffffff);
      c.rect(Math.floor(ex), 5, 2, 2, 0x6a3a18).px(Math.floor(ex) + 1, 6, 0x2a1408).px(Math.floor(ex), 5, 0xffffff);
    }
    // Wide smile and pink cheeks.
    c.px(8, 9, 0x6a1410).hline(9, 14, 10, 0x6a1410).px(15, 9, 0x6a1410);
    c.px(7, 8, 0xff9a8a).px(16, 8, 0xff9a8a);
    c.outline(OUT).shadow(11, 34.5, 8, 1.8, 80);
    return c;
  }

  /**
   * Desert worm (robak-maly.jpg, robak-duzy.jpg): sandy, segmented, lying
   * low with its head raised, big round brown eyes and small claws along
   * the belly. The big one is twice as big and heavier.
   */
  function worm(big, frame) {
    const s = big ? 1.7 : 1;
    const segs = big ? 6 : 5;
    const w = Math.round((segs * 3 + 12) * s), h = Math.round(20 * s);
    const c = PC(w, h);
    const BODY = 0xc8a070, BODY_D = 0x8e6a42, BODY_L = 0xe8c898, CLAW = 0xf0e0c0;
    const wave = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const base = h - 4 * s;
    // Body: segments from the tail (left) to the neck (right), rippling when it crawls.
    for (let i = 0; i < segs; i++) {
      const x = (3 + i * 3) * s;
      const y = base + (i % 2 === 0 ? wave : -wave) * s * 0.7;
      const r = (2.3 + i * 0.25) * s;
      c.blob(x, y, r, r * 0.95, BODY_D, BODY, BODY_L);
      c.vline(Math.round(x + r * 0.55), Math.round(y - r * 0.7), Math.round(y + r * 0.6), BODY_D);
      // Small pointed claws along the belly.
      c.px(x - 1, h - 1.6 * s, CLAW).px(x, h - 1.2 * s, CLAW);
    }
    // Neck rising up and the round head on top.
    const nx = (3 + segs * 3) * s;
    c.blob(nx - 1 * s, base - 3 * s, 3.2 * s, 3.6 * s, BODY_D, BODY, BODY_L);
    c.hline(Math.round(nx - 3.5 * s), Math.round(nx + 1.5 * s), Math.round(base - 2 * s), BODY_D);
    const hx = nx + 2 * s, hy = base - 9 * s;
    c.blob(hx, hy, 4.6 * s, 4.4 * s, BODY_D, BODY, BODY_L);
    // A big cute eye: dark rim, brown iris, black pupil, two sparks.
    const ex = Math.round(hx + 1.2 * s), ey = Math.round(hy - 0.6 * s), er = big ? 3 : 2.1;
    c.ellipse(ex + 0.5, ey + 0.5, er + 0.8, er + 0.9, 0x2a1408);
    c.ellipse(ex + 0.5, ey + 0.5, er, er + 0.1, 0x7a4420);
    c.ellipse(ex + 0.5, ey + 1, er * 0.5, er * 0.5, 0x1a0804);
    c.px(ex - 1, ey - 1, 0xffffff).px(ex, ey - 1, 0xffffff).px(ex + 1, ey + 1, 0xffe8c8);
    // Little smile under the eye.
    const my = Math.round(hy + 2.4 * s);
    c.px(Math.round(hx + 0.5 * s), my, 0x5a3418).hline(Math.round(hx + 1.5 * s), Math.round(hx + 3 * s), my + 1, 0x5a3418);
    c.outline(OUT).shadow(w / 2, h - 0.6, w / 2 - 1, 1.6, 80);
    return c;
  }

  // ---- Shaded creatures (stage 5): MAibawu and the Guardian ------------------

  const CR = {};
  function cramps() {
    if (CR.ready) return CR;
    CR.teal = CP.ramp(0x3a9aa8, 7, 0.75, 0.5);
    CR.rust = CP.ramp(0x9a4a2a, 6, 0.75, 0.35);
    CR.claw = CP.ramp(0xb0aab0, 5, 0.7, 0.5);
    CR.shell = CP.ramp(0xb08a3a, 7, 0.75, 0.45);
    CR.skin = CP.ramp(0x9a8a5a, 6, 0.75, 0.4);
    CR.crystal = CP.ramp(0xa070e0, 7, 0.75, 0.8);
    CR.crystal2 = CP.ramp(0xd8a0d8, 6, 0.7, 0.8);
    CR.ready = true;
    return CR;
  }

  /**
   * MAibawu (maibawu.jpg): a tall, slender cyborg in turquoise plates over
   * rusty copper joints, a long pointed helmet with one red eye, long arms
   * ending in curved claws, and bird-like legs with clawed feet.
   */
  function maibawu(frame) {
    const m = CP.MAT, r = cramps();
    const c = PC(24, 34);
    const a = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    // Legs: thigh back, shin forward (bird-like), clawed feet.
    for (const [hx, d, back] of [[9, a, true], [12, -a, false]]) {
      const kx = hx + 2 + d, ky = 25, fx = hx - 1 + d * 2;
      c.line(hx, 19, kx, ky, r.rust[back ? 1 : 3]).line(hx + 1, 19, kx + 1, ky, r.rust[back ? 0 : 2]);
      c.line(kx, ky, fx, 31, r.teal[back ? 2 : 4]).line(kx + 1, ky, fx + 1, 31, r.teal[back ? 1 : 2]);
      c.px(kx, ky, r.teal[5]);
      c.hline(fx - 1, fx + 3, 32, r.claw[back ? 1 : 3]).px(fx + 4, 31, r.claw[4]).px(fx - 2, 31, r.claw[2]);
    }
    // Slim torso of turquoise plates over a rusty belly.
    c.litBlob(11, 14, 3.6, 5.6, r.teal);
    c.litRect(9, 16, 4, 4, r.rust, 0.45);
    c.hline(9, 13, 13, r.teal[2]).hline(9, 13, 17, r.rust[1]);
    // Back arm, then the front arm reaching forward with claws.
    c.line(9, 11, 6, 18, r.rust[1]).line(6, 18, 5, 23, r.teal[2]);
    c.px(4, 24, r.claw[2]).px(6, 24, r.claw[2]).px(5, 25, r.claw[1]);
    c.litBlob(13.5, 10.5, 2.4, 2, r.teal);
    c.line(14, 12, 18, 16, r.rust[3]).line(15, 12, 19, 16, r.rust[1]);
    c.line(18, 16, 20, 20, r.teal[4]).line(19, 16, 21, 20, r.teal[2]);
    c.line(20, 21, 22, 23, r.claw[4]).line(21, 20, 23, 21, r.claw[3]).line(19, 21, 20, 24, r.claw[3]);
    // Long pointed helmet bending forward, a single red eye.
    c.litBlob(12, 5.5, 3.4, 4.6, r.teal);
    c.litBlob(14, 7, 2.4, 2.4, r.teal);
    c.hline(12, 16, 7, 0x1a0c10).hline(13, 16, 8, 0x1a0c10);
    c.px(15, 7, 0xff3020).px(16, 7, 0xff8060);
    c.vline(11, 2, 8, r.teal[1]);
    c.selOutline(0.7);
    c.shadow(11, 32.5, 7, 1.6, 80);
    c.glow(15.5, 7, 2.2, 1.6, 0xff3020, 120, true);
    return c;
  }

  /** One crystal spike: a lit left face and a darker right face. */
  function spike(c, x, base, h, w, lean, rp) {
    for (let y = 0; y < h; y++) {
      const t = y / h, half = w * (1 - t * 0.85);
      const cx = x + lean * y;
      for (let xx = Math.floor(cx - half); xx <= Math.ceil(cx + half); xx++) {
        const left = xx + 0.5 < cx;
        const l = (left ? 0.75 : 0.35) + t * 0.15 + (CP.hash(xx, base - y, 9) - 0.5) * 0.08;
        c.px(xx, base - y, CP.tone(rp, l, xx, base - y));
      }
    }
    c.px(x + lean * (h - 1), base - h + 1, 0xffffff);
  }

  /**
   * Guardian of the crystal biome (straznik-krystalicznego-biomu.jpg): a big
   * tortoise in a riveted brass shell grown over with violet crystals, a
   * steam pipe with a gauge, sturdy clawed legs and a wise head with a blue eye.
   */
  function guardian(frame) {
    const m = CP.MAT, r = cramps();
    const c = PC(40, 30);
    const a = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    // Back legs, then the shell, then front legs.
    for (const [x, d] of [[9, a], [25, -a]]) {
      c.litRect(x + d, 21, 5, 6, r.skin, 0.35);
      c.hline(x + d - 1, x + d + 5, 27, r.claw[2]);
    }
    // Shell: a lit dome of brass plates with rivets.
    c.litBlob(19, 18, 14, 8.5, r.shell, { clipY: 23 });
    for (let x = 6; x <= 32; x += 5) c.vline(x + ((x / 5) & 1), 14, 23, r.shell[1]);
    c.hline(5, 33, 23, r.shell[0]).hline(6, 32, 22, r.shell[5]);
    for (let x = 7; x <= 31; x += 4) c.rivet(x, 20, m.brass);
    // Crystals growing on the shell.
    const spikes = [[11, 13, 7, 1.6, -0.15, r.crystal], [15, 12, 11, 2.2, -0.05, r.crystal], [19, 11, 13, 2.4, 0.02, r.crystal2], [23, 12, 9, 2, 0.1, r.crystal], [27, 14, 7, 1.6, 0.18, r.crystal2], [8, 15, 4, 1.2, -0.3, r.crystal2], [30, 15, 4, 1.2, 0.3, r.crystal]];
    for (const [x, b, h, w, lean, rp] of spikes) spike(c, x, b, h, w, lean, rp);
    // Steam pipe with a gauge.
    c.litCylinder(13, 6, 13, 1, m.copper);
    c.litBlob(13, 6, 2.2, 2.2, m.brass);
    c.px(13, 6, 0xffffff).px(14, 5, 0x1a0c08);
    // Front legs.
    for (const [x, d] of [[13, -a], [29, a]]) {
      c.litRect(x + d, 22, 5, 5, r.skin, 0.55);
      c.hline(x + d, x + d + 5, 27, r.claw[3]).px(x + d + 5, 26, r.claw[4]);
    }
    // Head on a short neck, looking right, with a blue eye and crystal studs.
    c.litBlob(33, 19, 3, 2.6, r.skin);
    c.litBlob(36, 16.5, 3.2, 3, r.skin);
    c.px(37, 15, 0x5ad8ff).px(37, 16, 0x1a3a6a).px(36, 15, 0xffffff);
    c.px(35, 14, r.crystal[5]).px(34, 15, r.crystal[3]);
    c.hline(36, 38, 18, r.skin[1]);
    c.selOutline(0.7);
    c.shadow(20, 27.5, 16, 2.2, 80);
    c.glow(13, 2, 2.5, 2, 0xe0dcdc, 120, true);
    return c;
  }

  /**
   * Imapia Wielka (imapia-wielka.jpg): a tall, slender queen in crimson
   * armour, a turquoise pointed helmet with one red eye, tattered grey
   * wings behind her, long mechanical legs with talons and clawed hands.
   */
  function imapia(frame) {
    const m = CP.MAT, r = cramps();
    if (!CR.crimson) {
      CR.crimson = CP.ramp(0xc03a5a, 7, 0.75, 0.45);
      CR.wing = CP.ramp(0x6a5048, 6, 0.8, 0.5);
      CR.metal = CP.ramp(0x7a7a84, 6, 0.75, 0.5);
    }
    const c = PC(36, 50);
    const a = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    // Tattered wings behind the body: a membrane spread from each shoulder,
    // with dark spars, a ragged bottom edge and holes.
    for (const dir of [-1, 1]) {
      const sx = dir < 0 ? 14 : 21;
      for (let dx = 1; dx <= 14; dx++) {
        const x = sx + dir * dx;
        const top = 13 + Math.round(dx * 0.35);
        const bottom = 36 - Math.round(dx * 0.7) + Math.round((CP.hash(dx, dir, 61) - 0.5) * 6) - (dx % 3 === 0 ? 3 : 0);
        for (let y = top; y <= bottom; y++) {
          if (y > top + 4 && CP.hash(x, y >> 1, 62) < 0.1) continue;
          const l = 0.22 + (1 - (y - top) / 24) * 0.25 + (dir > 0 ? -0.06 : 0.04) + (CP.hash(x, y, 63) - 0.5) * 0.1;
          c.px(x, y, CP.tone(CR.wing, l, x, y));
        }
      }
      // Spars: from the shoulder out and down.
      for (const [ex, ey] of [[14, 18], [11, 28], [6, 33]]) c.line(sx, 14, sx + dir * ex, ey, CR.metal[dir < 0 ? 3 : 1]);
    }
    // Long mechanical legs: crimson thighs, grey shins, big talons.
    for (const [hx, d, back] of [[15, a, true], [20, -a, false]]) {
      const kx = hx + (back ? -1 : 1) + d, ky = 35, fx = hx + (back ? -2 : 1) + d * 2;
      c.line(hx, 28, kx, ky, CR.crimson[back ? 1 : 3]).line(hx + 1, 28, kx + 1, ky, CR.crimson[back ? 0 : 2]);
      c.line(kx, ky, fx, 46, CR.metal[back ? 1 : 3]).line(kx + 1, ky, fx + 1, 46, CR.metal[back ? 0 : 2]);
      c.litBlob(kx + 0.5, ky, 1.4, 1.4, CR.metal);
      c.hline(fx - 2, fx + 3, 47, r.claw[back ? 1 : 3]);
      c.px(fx + 4, 46, r.claw[4]).px(fx - 3, 46, r.claw[2]).px(fx + 1, 48, r.claw[1]);
    }
    // Crimson armoured body with muscle plates and a green-wired waist.
    c.litBlob(17.5, 22, 4.6, 7, CR.crimson);
    c.hline(15, 20, 20, CR.crimson[2]).hline(15, 20, 24, CR.crimson[2]).vline(17, 17, 27, CR.crimson[2]);
    c.litRect(15, 27, 6, 3, CR.metal, 0.45);
    c.px(16, 28, 0x50d070).px(19, 28, 0xe0c040);
    // Arms: crimson shoulders, metal forearms, long claws.
    c.litBlob(13, 17, 2.4, 2.2, CR.crimson);
    c.line(12, 18, 9, 27, CR.crimson[1]).line(9, 27, 8, 33, CR.metal[2]);
    c.line(7, 34, 6, 37, r.claw[3]).line(8, 34, 8, 38, r.claw[3]).line(9, 34, 10, 37, r.claw[2]);
    c.litBlob(22, 17, 2.4, 2.2, CR.crimson);
    c.line(23, 18, 26, 26, CR.crimson[3]).line(24, 18, 27, 26, CR.crimson[2]);
    c.line(26, 27, 27, 32, CR.metal[3]).line(27, 27, 28, 32, CR.metal[2]);
    c.line(27, 33, 26, 37, r.claw[4]).line(28, 33, 29, 37, r.claw[3]).line(29, 33, 31, 35, r.claw[3]);
    // Neck and the tall pointed turquoise helmet with a red eye.
    c.litRect(16, 13, 3, 3, CR.metal, 0.4);
    c.litBlob(18, 8, 4.4, 6.2, r.teal);
    c.litBlob(17.5, 3.5, 2.6, 2.8, r.teal);
    c.vline(18, 2, 13, r.teal[2]);
    c.hline(16, 21, 10, 0x1a0c10).hline(17, 21, 11, 0x1a0c10).hline(18, 20, 12, 0x1a0c10);
    c.px(19, 10, 0xff3020).px(20, 10, 0xff9070).px(19, 11, 0xc01818);
    c.selOutline(0.7);
    c.shadow(17, 47.5, 10, 2, 80);
    c.glow(19.5, 10.5, 3, 2.4, 0xff3020, 140, true);
    return c;
  }

  /**
   * Władca Kryształów (wladca-krysztalow.jpg): a huge violet crystal giant
   * in brass armour, a crown of crystal spikes over a pale fanged skull, a
   * round brass chest with a pink heart, and thick crystal legs.
   */
  function crystalLord(frame) {
    const m = CP.MAT, r = cramps();
    if (!CR.bone) { CR.bone = CP.ramp(0xb898c0, 6, 0.75, 0.35); CR.deep = CP.ramp(0x7a4ac0, 7, 0.75, 0.45); }
    const c = PC(48, 54);
    const a = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    // Thick crystal legs with brass knee plates, wide apart.
    for (const [x, d] of [[15, a], [30, -a]]) {
      c.litRect(x - 3 + d, 36, 7, 14, r.crystal, 0.4);
      spike(c, x - 2 + d, 50, 6, 2, -0.2, r.crystal2);
      spike(c, x + 3 + d, 49, 5, 1.6, 0.25, r.crystal);
      c.litBlob(x + 0.5 + d, 40, 3.6, 2.6, m.brass);
      c.rivet(x + d, 40, m.brass);
      c.hline(x - 4 + d, x + 5 + d, 51, r.crystal[0]);
    }
    // Crystal growths on the back and shoulders, behind the body.
    const back = [[7, 26, 12, 2.4, -0.35, r.crystal], [11, 22, 14, 2.6, -0.2, r.crystal2], [37, 22, 14, 2.6, 0.2, r.crystal], [41, 26, 12, 2.4, 0.35, r.crystal2]];
    for (const [x, b, h, w, lean, rp] of back) spike(c, x, b, h, w, lean, rp);
    // Body: a crystal torso inside brass armour, a belt with a big crystal buckle.
    c.litBlob(24, 28, 11, 10, CR.deep);
    for (const [x, y] of [[17, 25], [30, 30], [20, 31], [29, 23]]) c.px(x, y, r.crystal2[5]).px(x + 1, y + 1, r.crystal2[3]);
    c.litRect(16, 33, 17, 4, m.brass, 0.45);
    spike(c, 24, 38, 5, 2.2, 0, r.crystal2);
    // Shoulder pauldrons of brass.
    c.litBlob(12, 21, 4.4, 3.4, m.brass);
    c.litBlob(36, 21, 4.4, 3.4, m.brass);
    c.rivet(12, 20, m.brass).rivet(36, 20, m.brass);
    // Arms of crystal with brass cuffs and heavy fists.
    c.litRect(7, 23, 5, 11, r.crystal, 0.35);
    c.litRect(37, 23, 5, 11, r.crystal, 0.55);
    c.litRect(6, 32, 7, 3, m.brass, 0.4).litRect(36, 32, 7, 3, m.brass, 0.5);
    c.litBlob(9, 37, 3.4, 3, r.crystal2);
    c.litBlob(39.5, 37, 3.4, 3, r.crystal2);
    // Round brass chest piece with a pink heart.
    c.litBlob(24, 27, 5, 5, m.brass);
    c.litBlob(24, 27, 3.4, 3.4, CP.ramp(0x3a4a6a, 6, 0.7, 0.4));
    c.px(23, 26, 0xff70b0).px(25, 26, 0xff70b0).hline(23, 25, 27, 0xff3a90).px(24, 28, 0xd01a70);
    // Skull: mauve bone, dark eye sockets with pink glowing eyes, a wide jaw of fangs.
    c.litBlob(24, 14, 4.8, 5, CR.bone);
    c.litBlob(24, 18.5, 4.4, 2, CR.bone);
    c.hline(20, 22, 13, 0x2a0c1a).hline(26, 28, 13, 0x2a0c1a).hline(21, 22, 14, 0x2a0c1a).hline(26, 27, 14, 0x2a0c1a);
    c.px(21, 13, 0xff60d0).px(27, 13, 0xff60d0);
    c.hline(20, 28, 18, 0x2a0c1a).hline(21, 27, 19, 0x2a0c1a);
    for (let x = 20; x <= 28; x += 2) c.px(x, 17, CR.bone[5]).px(x, 18, CR.bone[4]);
    for (let x = 21; x <= 27; x += 2) c.px(x, 19, CR.bone[4]);
    c.px(24, 10, 0x60c0ff).px(24, 9, 0xffffff);
    // Brass crown band and a crown of crystal spikes.
    c.litRect(18, 8, 13, 2, m.brass, 0.5);
    const crown = [[16, 9, 6, 1.4, -0.4], [19, 8, 9, 1.8, -0.2], [22, 8, 12, 2, -0.06], [26, 8, 12, 2, 0.06], [29, 8, 9, 1.8, 0.2], [32, 9, 6, 1.4, 0.4]];
    crown.forEach(([x, b, h, w, lean], i) => spike(c, x, b, h, w, lean, i & 1 ? r.crystal2 : r.crystal));
    c.selOutline(0.7);
    c.shadow(23, 51.5, 17, 2.6, 80);
    c.glow(24, 27, 4, 4, 0xff4aa0, 90, true);
    c.glow(21, 13, 2, 1.6, 0xff60d0, 120, true);
    c.glow(27, 13, 2, 1.6, 0xff60d0, 120, true);
    return c;
  }

  CP.CREATURE_PAINT = {
    mabmia: (f) => mabmia(f),
    wormSmall: (f) => worm(false, f),
    wormBig: (f) => worm(true, f),
    maibawu,
    guardian,
    imapia,
    crystalLord,
  };

  // Where each sprite stands: footX/footY is the art pixel at the feet.
  // hit: half width and height (art px) of the click box above the feet.
  Object.assign((CP.SPRITE_META = CP.SPRITE_META || {}), {
    mabmia: { footX: 11, footY: 34, hitW: 7, hitH: 33 },
    wormSmall: { footX: 13, footY: 19, hitW: 12, hitH: 18 },
    wormBig: { footX: 25, footY: 33, hitW: 22, hitH: 30 },
    maibawu: { footX: 11, footY: 32, hitW: 8, hitH: 31 },
    guardian: { footX: 20, footY: 27, hitW: 18, hitH: 25 },
    imapia: { footX: 17, footY: 47, hitW: 10, hitH: 45 },
    crystalLord: { footX: 23, footY: 51, hitW: 16, hitH: 48 },
  });
})(window.CP = window.CP || {});

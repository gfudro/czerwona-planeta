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

  CP.CREATURE_PAINT = {
    mabmia: (f) => mabmia(f),
    wormSmall: (f) => worm(false, f),
    wormBig: (f) => worm(true, f),
  };

  // Where each sprite stands: footX/footY is the art pixel at the feet.
  // hit: half width and height (art px) of the click box above the feet.
  Object.assign((CP.SPRITE_META = CP.SPRITE_META || {}), {
    mabmia: { footX: 11, footY: 34, hitW: 7, hitH: 33 },
    wormSmall: { footX: 13, footY: 19, hitW: 12, hitH: 18 },
    wormBig: { footX: 25, footY: 33, hitW: 22, hitH: 30 },
  });
})(window.CP = window.CP || {});

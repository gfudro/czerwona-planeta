// Our units, painted in the shaded style of the buildings (shading.js):
// light from the top-left, tone ramps with dithering and a coloured
// outline instead of a black one. Every unit has its own silhouette so
// Artur tells them apart at a glance:
//   settler  – glass bubble helmet, brass tank on the back, pick
//   infantry – wide brass steam armour, big fist, chimney on the back
//   rifleman – slim long coat, wide hat, long rifle
//   hero     – orange cape, brass helmet with a red plume, sword
//   cannon   – a steam cannon on two big wheels, with a boiler
// Sprites face right; frame 0 standing, 1–2 walking, 3 working.
(function (CP) {
  'use strict';
  const PC = (w, h) => new CP.PixelCanvas(w, h);
  const M = () => CP.MAT;
  const R = {};
  const ramps = () => {
    if (R.ready) return R;
    R.leather = CP.ramp(0x6a4024, 6);
    R.skin = CP.ramp(0xe8b890, 5, 0.6, 0.4);
    R.coat = CP.ramp(0xd0701a, 6, 0.65, 0.4);
    R.plume = CP.ramp(0xd82a2a, 5, 0.6, 0.5);
    R.dark = CP.ramp(0x3a3440, 5);
    R.ready = true;
    return R;
  };

  /** Two legs; step 1/2 swings them. Returns nothing, draws trousers and boots. */
  function legs(c, x, y, len, step, trouser, boot, gap = 3) {
    const a = step === 1 ? -1 : step === 2 ? 1 : 0;
    for (const [lx, d] of [[x, a], [x + gap, -a]]) {
      const lift = d < 0 ? 1 : 0;
      c.litRect(lx + d, y, 2, len - 2 - lift, trouser, 0.45, { ao: 0.2 });
      c.px(lx + d, y, trouser[4]);
      c.litRect(lx + d - (d > 0 ? 0 : 0), y + len - 2 - lift, 3, 2, boot, 0.35);
      c.px(lx + d, y + len - 2 - lift, boot[4]);
    }
  }

  // ---- Settler -------------------------------------------------------------

  function settler(step) {
    const m = M(), r = ramps();
    const c = PC(20, 25);
    // Brass air tank on the back.
    c.litCylinder(5, 9, 16, 2, m.brass);
    c.hline(4, 6, 9, m.copper[4]).px(5, 8, m.steel[3]);
    legs(c, 7, 17, 7, step, m.team, r.leather);
    // Orange suit, a round body.
    c.litBlob(9.5, 13.5, 4.2, 4.8, m.team);
    c.hline(6, 13, 15, r.leather[2]).px(10, 15, m.brass[6]).px(9, 15, m.brass[3]);
    // Arm and the pick.
    if (step === 3) {
      c.line(11, 12, 15, 3, r.leather[3]).line(12, 12, 16, 3, r.leather[1]);
      c.line(13, 2, 18, 4, m.steel[4]).px(18, 5, m.steel[2]).px(13, 3, m.steel[2]);
    } else {
      c.line(13, 15, 16, 8, r.leather[3]).line(14, 15, 17, 8, r.leather[1]);
      c.line(14, 7, 18, 9, m.steel[4]).px(18, 10, m.steel[2]).px(14, 8, m.steel[2]);
    }
    c.litBlob(12.5, 13, 1.8, 2.4, m.team);
    // Glass bubble helmet over a brass collar; a face looking out.
    c.litRect(6, 9, 7, 2, m.brass, 0.6);
    c.litBlob(10, 5.5, 4.4, 4.4, m.glass, { ambient: 0.35 });
    c.litBlob(10.8, 6, 2.2, 2.4, r.skin);
    c.px(11.5, 5.5, 0x2a1810).px(12, 7.5, r.skin[1]);
    c.px(8, 3, 0xffffff).px(9, 2, 0xe8fffa).px(7, 4, 0xc8f4ee);
    c.selOutline(0.7);
    c.shadow(9.5, 23.5, 6.5, 1.6, 80);
    return c;
  }

  // ---- Infantry ------------------------------------------------------------

  function infantry(step) {
    const m = M(), r = ramps();
    const c = PC(22, 26);
    // Chimney on the back, puffing.
    c.litCylinder(4, 3, 12, 1.6, m.iron);
    c.hline(3, 5, 3, m.copper[4]);
    legs(c, 7, 18, 8, step, m.iron, m.iron, 4);
    // Wide brass armour body.
    c.litBlob(10.5, 13.5, 6.4, 5.8, m.brass);
    c.litRect(8, 11, 6, 5, m.team, 0.55);
    c.hline(8, 13, 11, m.team[5]).hline(8, 13, 15, m.team[1]);
    c.rivet(7, 12, m.brass).rivet(14, 12, m.brass).rivet(7, 16, m.brass).rivet(14, 16, m.brass);
    // Pauldron and a heavy steel fist.
    c.litBlob(15.5, 10.5, 3, 2.4, m.brass);
    c.litRect(16, 13, 3, 3, m.copper, 0.45);
    c.litBlob(18, 16.5, 2.4, 2.2, m.steel);
    // Bucket helmet with a slit visor and an orange glow behind it.
    c.litCylinder(11, 1, 8, 3.6, m.brass);
    c.hline(8, 14, 1, m.brass[6]);
    c.hline(10, 14, 4, 0x1a0c08).px(13, 4, 0xffa040).px(14, 4, 0xffd080);
    c.selOutline(0.7);
    c.shadow(11, 24.5, 7.5, 1.7, 80);
    c.glow(4, 1, 2.5, 2, 0xd8d0d0, 130, true);
    return c;
  }

  // ---- Rifleman ------------------------------------------------------------

  function rifleman(step) {
    const m = M(), r = ramps();
    const c = PC(24, 25);
    legs(c, 7, 18, 7, step, r.leather, r.dark);
    // Long orange coat flaring out at the bottom.
    c.litPoly([7, 9, 12, 9, 14, 20, 5, 20], r.coat, 0.55, { grain: 0.06, seed: 3 });
    c.vline(6, 12, 19, r.coat[1]).vline(9, 10, 19, r.coat[2]);
    c.hline(6, 12, 14, r.leather[1]).px(9, 14, m.brass[6]);
    // Long steam rifle held across the body, barrel far forward.
    c.line(6, 16, 22, 10, m.copper[2]).line(6, 15, 22, 9, m.brass[5]);
    c.litRect(9, 13, 4, 2, m.brass, 0.6);
    c.px(22, 9, m.steel[5]).px(23, 9, m.steel[3]);
    c.litBlob(13, 13, 1.6, 1.6, r.skin);
    // Head with goggles and a wide-brimmed hat.
    c.litBlob(9.5, 6, 2.8, 3, r.skin);
    c.px(10, 6, m.brass[5]).px(11, 6, m.glass[5]).px(12, 6, m.brass[3]);
    c.litRect(4, 3, 12, 2, r.leather, 0.45);
    c.litBlob(9.5, 2, 3.2, 2.2, r.leather);
    c.hline(6, 13, 3, m.team[4]);
    c.selOutline(0.7);
    c.shadow(9.5, 23.5, 6, 1.6, 80);
    return c;
  }

  // ---- Hero ----------------------------------------------------------------

  function hero(step) {
    const m = M(), r = ramps();
    const c = PC(24, 28);
    const sway = step === 1 ? 1 : step === 2 ? -1 : 0;
    // Orange cape billowing behind.
    c.litPoly([8, 9, 12, 9, 7, 25, 2 + sway, 25, 3 + sway, 18], m.cloth, 0.5, { grain: 0.05, seed: 7 });
    c.line(5, 13, 3 + sway, 24, m.cloth[1]);
    legs(c, 8, 20, 7, step, m.steel, r.leather);
    // Steel breastplate with a brass star.
    c.litBlob(11, 15.5, 4.4, 5, m.steel);
    c.hline(7, 15, 18, r.leather[2]).px(11, 18, m.brass[6]);
    c.px(11, 13, m.brass[6]).px(10, 14, m.brass[4]).px(12, 14, m.brass[4]).px(11, 15, m.brass[3]);
    // Sword raised forward, blade catching the light.
    c.line(15, 15, 21, 3, m.steel[5]).line(16, 15, 22, 3, m.steel[2]);
    c.px(21, 2, 0xffffff).px(20, 4, 0xffffff);
    c.hline(13, 17, 15, m.brass[5]).px(14, 16, m.brass[2]);
    c.litBlob(15, 15.5, 1.8, 1.8, r.skin);
    // Shoulder plate.
    c.litBlob(14, 11.5, 2.4, 1.8, m.brass);
    // Brass helmet with a red plume and a face.
    c.litBlob(11, 6.5, 3.6, 3.8, m.brass);
    c.litRect(11, 6, 3, 3, r.skin, 0.55);
    c.px(13, 6, 0x2a1810);
    c.hline(10, 14, 5, m.brass[2]);
    c.litBlob(9, 2.5, 3.2, 2.2, r.plume);
    c.litBlob(6.5, 3.5, 2, 1.6, r.plume);
    c.selOutline(0.7);
    c.shadow(11, 26.5, 7, 1.7, 80);
    return c;
  }

  // ---- Steam cannon ----------------------------------------------------------

  function wheel(c, cx, cy, rad, spin) {
    const m = M();
    for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++)
      for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
        if (d > rad) continue;
        if (d > rad - 1.6) {
          const l = 0.45 + (-(dx / d) * 0.5 - (dy / d) * 0.55) * 0.4;
          c.px(x, y, CP.tone(m.iron, l, x, y));
          continue;
        }
        const a = Math.atan2(dy, dx) + spin;
        const spoke = Math.abs(Math.sin(a * 3)) < 0.32;
        if (spoke || d < 1.6) c.px(x, y, CP.tone(m.wood, d < 1.6 ? 0.7 : 0.5, x, y));
      }
    c.px(cx - 0.5, cy - 0.5, m.brass[6]);
  }

  function cannon(step) {
    const m = M();
    const c = PC(32, 24);
    const spin = step === 1 ? 0.5 : step === 2 ? 1 : 0;
    // Carriage of wood.
    c.litPoly([5, 14, 22, 12, 24, 17, 6, 19], m.wood, 0.5, { grain: 0.15, seed: 5 });
    // Boiler at the back with a chimney.
    c.litCylinder(8, 6, 15, 4.2, m.copper);
    c.hline(4, 12, 9, m.brass[5]).hline(4, 12, 13, m.brass[2]);
    c.litCylinder(7, 0, 6, 1.4, m.iron);
    // Barrel: a fat brass tube angled up to the right, with a dark mouth.
    for (let t = 0; t <= 14; t += 0.5) {
      const x = 12 + t, y = 12 - t * 0.35;
      c.litBlob(x, y, 2.8, 2.8, m.brass);
    }
    c.litBlob(27, 7.2, 3.2, 3.2, m.brass);
    c.ellipse(28, 7, 1.4, 1.8, 0x1a0c08);
    c.hline(16, 18, 9, m.team[4]).hline(16, 18, 13, m.team[1]);
    // Orange pennant on a stick.
    c.vline(12, 2, 10, m.steel[3]);
    c.poly([13, 2, 18, 3.5, 13, 5], m.team[4]);
    // Two big wheels.
    wheel(c, 9, 18, 5.4, spin);
    wheel(c, 21, 18.5, 4.6, spin + 0.4);
    c.selOutline(0.7);
    c.shadow(15.5, 22.5, 12, 1.8, 80);
    c.glow(7, -1, 2.5, 2, 0xd8d0d0, 130, true);
    return c;
  }

  CP.UNIT_PAINT = { settler, infantry, rifleman, hero, cannon };

  Object.assign((CP.SPRITE_META = CP.SPRITE_META || {}), {
    settler: { footX: 10, footY: 24, hitW: 7, hitH: 23 },
    infantry: { footX: 11, footY: 25, hitW: 8, hitH: 24 },
    rifleman: { footX: 10, footY: 24, hitW: 7, hitH: 23 },
    hero: { footX: 11, footY: 27, hitW: 8, hitH: 26 },
    cannon: { footX: 15, footY: 23, hitW: 13, hitH: 20 },
  });
})(window.CP = window.CP || {});

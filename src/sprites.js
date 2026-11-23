// Shared palette and the sprite cache for units and creatures (painted in
// units.js and creatures.js). Sprites face right.
(function (CP) {
  'use strict';

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

  const cache = new Map();

  /** A unit or creature sprite as a canvas. Frame 0 standing, 1–2 walking, 3 working; flip faces left. */
  CP.unitSprite = function (type, frame, flip) {
    const key = `${type}:${frame}:${flip ? 1 : 0}`;
    let s = cache.get(key);
    if (!s) {
      const paint = CP.UNIT_PAINT[type] || CP.CREATURE_PAINT[type];
      let pc = paint(frame);
      if (flip) pc = pc.flipped();
      s = pc.toCanvas();
      cache.set(key, s);
    }
    return s;
  };

})(window.CP = window.CP || {});

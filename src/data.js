// Game numbers in one place. Taken from DESIGN.md "Parametry startowe";
// if you tune a number here, write the change into DESIGN.md too.
(function (CP) {
  'use strict';

  CP.VERSION = '0.1.0';

  // Art pixels per tile, and how many screen pixels each art pixel takes.
  CP.ART_TILE = 32;
  CP.ART_SCALE = 2;
  CP.TILE_PX = CP.ART_TILE * CP.ART_SCALE; // 64 screen px per tile

  // Fixed simulation step. Speeds run more ticks per second, never bigger ticks.
  CP.SIM_HZ = 20;
  CP.SPEEDS = { slow: 0.5, normal: 1, fast: 2 };

  CP.CAMERA_SPEED = 900; // screen px per second (arrows and screen edge)
  CP.EDGE_SCROLL_PX = 14;

  // Distances in tiles, times in seconds. hearts/attack/defense from DESIGN.md.
  CP.UNIT_TYPES = {
    settler: { hearts: 5, attack: '1', defense: 0, speed: 2, range: 1, cooldown: 1.5, sight: 5, cost: [50, 0], build: 10 },
    infantry: { hearts: 12, attack: '4', defense: 2, speed: 1.8, range: 1, cooldown: 1.2, sight: 5, cost: [60, 20], build: 15 },
    rifleman: { hearts: 7, attack: '3', defense: 0, speed: 2, range: 5, cooldown: 1.5, sight: 7, cost: [50, 30], build: 15 },
    cannon: { hearts: 10, attack: '5', defense: 1, speed: 1, range: 7, cooldown: 3, sight: 8, cost: [80, 80], build: 25 },
    hero: { hearts: 15, attack: '1k6+2', defense: 2, speed: 2.2, range: 1, cooldown: 1, sight: 7 },
  };

  CP.BUILDING_TYPES = {
    lander: { size: 3, sight: 7 },
    dome: { size: 2, sight: 4, cost: [0, 60], build: 20 },
    workshop: { size: 3, sight: 4, cost: [100, 80], build: 30 },
    forge: { size: 3, sight: 4, cost: [120, 120], build: 40 },
  };

  CP.UNIT_RADIUS = 0.3; // in tiles, for picking and pushing apart
})(window.CP = window.CP || {});

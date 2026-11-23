// Game numbers in one place. Taken from DESIGN.md "Parametry startowe";
// if you tune a number here, write the change into DESIGN.md too.
(function (CP) {
  'use strict';

  CP.VERSION = '0.7.1';

  // Art pixels per tile, and how many screen pixels each art pixel takes.
  CP.ART_TILE = 32;
  CP.ART_SCALE = 2;
  CP.TILE_PX = CP.ART_TILE * CP.ART_SCALE; // 64 screen px per tile

  // Fixed simulation step. Speeds run more ticks per second, never bigger ticks.
  CP.SIM_HZ = 20;
  CP.SPEEDS = { slow: 0.5, normal: 1, fast: 2 };

  CP.CAMERA_SPEED = 900; // screen px per second (arrows and screen edge)
  CP.EDGE_SCROLL_PX = 14;

  // Distances in tiles, times in seconds. Hearts, attack and defense of
  // creatures come from the cards and never change.
  // sight: how far a unit sees (ours) or notices enemies (creatures).
  CP.UNIT_TYPES = {
    settler: { side: 'player', hearts: 5, attack: '1', defense: 0, speed: 2, range: 1, cooldown: 1.5, sight: 5, cost: [50, 0], build: 10 },
    infantry: { side: 'player', hearts: 12, attack: '4', defense: 2, speed: 1.8, range: 1, cooldown: 1.2, sight: 5, cost: [60, 20], build: 15 },
    rifleman: { side: 'player', hearts: 7, attack: '3', defense: 0, speed: 2, range: 5, cooldown: 1.5, sight: 7, cost: [50, 30], build: 15 },
    // pierce: ignores the target's defense (the cannon is the answer to the Guardian).
    cannon: { side: 'player', hearts: 10, attack: '5', defense: 1, speed: 1, range: 7, cooldown: 3, sight: 8, cost: [80, 80], build: 25, pierce: true },
    hero: { side: 'player', hearts: 15, attack: '1k6+2', defense: 2, speed: 2.2, range: 1, cooldown: 1, sight: 7 },

    mabmia: { side: 'neutral', hearts: 7, attack: '1', defense: 0, speed: 1, range: 1, cooldown: 1.5, sight: 0 },
    wormSmall: { side: 'wild', hearts: 5, attack: '1k2', defense: 2, speed: 3, range: 1, cooldown: 1, sight: 5 },
    wormBig: { side: 'wild', hearts: 15, attack: '1k2', defense: 2, speed: 1.5, range: 1, cooldown: 1.5, sight: 5 },
    // leash: how far (tiles) a creature chases from its home or patrol route.
    maibawu: { side: 'wild', hearts: 9, attack: '2', defense: 2, speed: 2, range: 1, cooldown: 1.2, sight: 6, leash: 10 },
    guardian: { side: 'wild', hearts: 12, attack: '1k2-1', defense: 4, speed: 0.5, range: 1, cooldown: 2, sight: 2, leash: 3 },
    imapia: { side: 'wild', hearts: 20, attack: '1k4', defense: 2, speed: 1.6, range: 1, cooldown: 1.2, sight: 6, leash: 8, boss: true },
    crystalLord: { side: 'wild', hearts: 25, attack: '2k4', defense: 3, speed: 1.2, range: 1, cooldown: 1.5, sight: 5, leash: 6, boss: true },
  };

  CP.BUILDING_TYPES = {
    lander: { size: 3, sight: 7, trains: ['settler'], pop: 4 },
    dome: { size: 2, sight: 4, cost: [0, 60], build: 20, pop: 4 },
    workshop: { size: 3, sight: 4, cost: [100, 80], build: 30, trains: ['infantry', 'rifleman'] },
    forge: { size: 3, sight: 4, cost: [120, 120], build: 40, trains: ['cannon'] },
  };

  // What a settler can build; a mission may allow more (the forge from mission 4).
  CP.SETTLER_BUILDS = ['dome', 'workshop'];

  // Hero: points for each creature he finishes off, and points needed for levels 2..5.
  CP.HERO = {
    xp: { wormSmall: 1, wormBig: 2, maibawu: 2, guardian: 3, imapia: 5, crystalLord: 5 },
    levels: [3, 7, 12, 18],
    heartsPerLevel: 2,
    attackPerLevel: 1,
    downTime: 20,
  };

  CP.ECON = {
    carry: 10, // crystals or scrap per trip
    mineTime: 3,
    smallDeposit: 400,
    bigDeposit: 1500,
    wreck: 200,
    popMax: 12,
    queueMax: 5,
  };

  CP.NESTS = {
    firstSpawn: 60, // the first worm comes out after this many seconds
    stagger: 10, // further nests start this much later each
    interval: 30,
    maxAlive: 3,
    fillTime: 5,
    leash: 14, // worms give up chasing this far from their nest
  };

  CP.MABMIA = { followDistance: 1.6, wanderRadius: 6 };

  CP.UNIT_RADIUS = 0.3; // in tiles, for pushing apart
})(window.CP = window.CP || {});

// Missions: maps, starting setup, goals shown as icon + counter, win and loss.
// Specs in DESIGN.md "Misje 1 i 2: specyfikacja".
(function (CP) {
  'use strict';

  const W = 48, H = 48;
  const LANDER = { x: 3, y: H - 6 }; // bottom-left corner
  const BASE = { x: LANDER.x + 1.5, y: LANDER.y + 1.5 }; // lander centre

  /**
   * A desert map with rock outcrops and cracks. `keep` lists areas
   * (x, y, r) that must stay open sand; rocks never go there.
   */
  function desertMap(seed, keep, w = W) {
    return wildMap(seed, keep, w, { dunes: 16, rocks: 26, cracks: 3 });
  }

  function wildMap(seed, keep, W, opts) {
    const map = CP.createMap(W, H);
    const rng = CP.createRng(seed);
    const set = (x, y, t) => { if (CP.inBounds(map, x, y)) map.terrain[y * W + x] = t; };
    const kept = (x, y) => keep.some((k) => (x - k.x) ** 2 + (y - k.y) ** 2 <= k.r * k.r);

    for (let k = 0; k < opts.dunes; k++) {
      const cx = CP.nextInt(rng, W), cy = CP.nextInt(rng, H), r = 2 + CP.nextFloat(rng) * 4;
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && CP.nextFloat(rng) < 0.85) set(x, y, CP.T.DUNE);
    }
    for (let k = 0; k < opts.rocks; k++) {
      const cx = CP.nextInt(rng, W), cy = CP.nextInt(rng, H);
      const r = 0.8 + CP.nextFloat(rng) * 2.4;
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && !kept(x, y)) set(x, y, CP.T.ROCK);
    }
    // A few short cracks.
    for (let k = 0; k < opts.cracks; k++) {
      let x = 8 + CP.nextInt(rng, W - 16), y = 6 + CP.nextInt(rng, H - 20);
      const dx = CP.nextFloat(rng) < 0.5 ? 1 : -1;
      for (let t = 0; t < 7 + CP.nextInt(rng, 6); t++) {
        if (!kept(x, y)) set(x, y, CP.T.CRACK);
        x += dx;
        if (CP.nextFloat(rng) < 0.5) y += CP.nextFloat(rng) < 0.5 ? 1 : -1;
      }
    }
    for (let i = 0; i < W; i++) { set(i, 0, CP.T.ROCK); set(i, H - 1, CP.T.ROCK); }
    for (let i = 0; i < H; i++) { set(0, i, CP.T.ROCK); set(W - 1, i, CP.T.ROCK); }
    return map;
  }

  /**
   * Ruins of a creature town in the rectangle (x0, y0)–(x1, y1): a grid of
   * walled yards, each wall broken by a doorway and by fallen stretches.
   * Kept areas stay open.
   */
  function addRuins(map, seed, x0, y0, x1, y1, keep, room = 8) {
    const rng = CP.createRng(seed ^ 0x2a11);
    const kept = (x, y) => keep.some((k) => (x - k.x) ** 2 + (y - k.y) ** 2 <= k.r * k.r);
    const wall = (x, y) => {
      if (x <= 1 || y <= 1 || x >= map.w - 2 || y >= map.h - 2 || kept(x, y)) return;
      const i = y * map.w + x;
      if (map.terrain[i] <= CP.T.DUNE) map.terrain[i] = CP.T.RUIN;
    };
    for (let ry = y0; ry + room <= y1 + 1; ry += room)
      for (let rx = x0; rx + room <= x1 + 1; rx += room) {
        if (CP.nextFloat(rng) < 0.2) continue; // a yard that crumbled away
        // Four sides; each has a 2-tile doorway and may have a fallen stretch.
        const sides = [
          (t) => [rx + t, ry], (t) => [rx + t, ry + room - 1],
          (t) => [rx, ry + t], (t) => [rx + room - 1, ry + t],
        ];
        for (const side of sides) {
          if (CP.nextFloat(rng) < 0.25) continue;
          const door = 2 + CP.nextInt(rng, room - 5);
          const fall = CP.nextFloat(rng) < 0.5 ? CP.nextInt(rng, room) : -9;
          for (let t = 0; t < room; t++) {
            if (t === door || t === door + 1 || Math.abs(t - fall) <= 1) continue;
            const [x, y] = side(t);
            wall(x, y);
          }
        }
      }
  }

  /** Patrols of MAibawu: `count` warriors walking the same route in a little clump. */
  function addPatrol(state, route, count, group) {
    const offs = [{ x: 0, y: 0 }, { x: 1, y: 0.6 }, { x: -0.6, y: 1 }];
    for (let i = 0; i < count; i++) {
      const p = CP.nearestWalkable(state.map, Math.floor(route[0].x + offs[i].x), Math.floor(route[0].y + offs[i].y));
      const m = CP.addUnit(state, 'maibawu', p.x + 0.5, p.y + 0.5);
      m.route = route;
      m.routeOffset = offs[i];
      m.home = route[0];
      m.group = group;
    }
  }

  function addCreature(state, type, x, y) {
    const u = CP.addUnit(state, type, x + 0.5, y + 0.5);
    u.home = { x: x + 0.5, y: y + 0.5 };
    return u;
  }

  /** Tile (x, y) at `dist` tiles from the lander centre in direction `angle` (radians, 0 = east, up is negative). */
  function at(dist, angle) {
    return { x: Math.round(BASE.x + Math.cos(angle) * dist), y: Math.round(BASE.y - Math.sin(angle) * dist) };
  }

  /** Makes sure every listed square is reachable from the lander; clears rock on the way if needed. */
  function connect(map, targets) {
    for (const t of targets) {
      let x = Math.floor(BASE.x) + 2, y = Math.floor(BASE.y);
      const tx = t.x, ty = t.y;
      // A straight-ish trench to the target; cheap and good enough for open maps.
      if (CP.findPath(map, x, y, tx, ty) && reachableNear(map, x, y, tx, ty)) continue;
      while (x !== tx || y !== ty) {
        if (x !== tx) x += Math.sign(tx - x);
        if (y !== ty) y += Math.sign(ty - y);
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1]]) {
          const i = (y + oy) * map.w + (x + ox);
          if (CP.inBounds(map, x + ox, y + oy) && map.terrain[i] >= CP.T.ROCK && map.blocked[i] === 0 && x + ox > 0 && y + oy > 0 && x + ox < map.w - 1 && y + oy < map.h - 1)
            map.terrain[i] = CP.T.SAND;
        }
      }
    }
  }

  function reachableNear(map, sx, sy, tx, ty) {
    const p = CP.findPath(map, sx, sy, tx, ty);
    if (!p || !p.length) return false;
    const e = p[p.length - 1];
    return Math.abs(e.x - tx) <= 2 && Math.abs(e.y - ty) <= 2;
  }

  /** Clears an open square of sand (for placing deposits and nests). */
  function clearArea(map, x, y, w, h) {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++)
        if (xx > 0 && yy > 0 && xx < map.w - 1 && yy < map.h - 1) map.terrain[yy * map.w + xx] = CP.T.SAND;
  }

  /** Any of our units standing within `r` tiles of a footprint. */
  function reached(state, o, r = 1.6) {
    return state.units.some((u) => u.owner === 'player' && !(u.down > 0) && CP.distToRect(u.x, u.y, o.x, o.y, o.size) <= r);
  }

  function startUnits(state, list) {
    const spots = CP.goalTiles(state.map, LANDER.x + 4, LANDER.y + 2, list.length);
    list.forEach((type, i) => CP.addUnit(state, type, spots[i].x + 0.5, spots[i].y + 0.5));
  }

  function sealFromBase(map) {
    // Turn unreachable sand pockets into rock so nothing lands where you can't walk.
    const seen = new Uint8Array(map.w * map.h);
    const sx = LANDER.x + 4, sy = LANDER.y + 1;
    const stack = [sy * map.w + sx];
    seen[stack[0]] = 1;
    while (stack.length) {
      const i = stack.pop();
      const x = i % map.w, y = (i / map.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!CP.inBounds(map, nx, ny)) continue;
        const j = ny * map.w + nx;
        if (seen[j] || map.terrain[j] >= CP.T.ROCK) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
    for (let i = 0; i < map.terrain.length; i++) if (!seen[i] && map.terrain[i] < CP.T.ROCK) map.terrain[i] = CP.T.ROCK;
  }

  // ---- Mission definitions ------------------------------------------------

  const MISSIONS = {
    1: {
      id: 1,
      name: 'Lądowanie',
      build(seed) {
        const deposit = at(6, Math.PI * 0.3); // 6 tiles up-right of the lander
        const wrecks = [at(8.5, Math.PI * 0.05), at(9.5, Math.PI * 0.55)];
        const mabmiaHome = { x: 24, y: 22 };
        const keep = [
          { x: BASE.x + 2, y: BASE.y, r: 6 },
          { x: deposit.x + 1, y: deposit.y + 1, r: 2.5 },
          ...wrecks.map((w) => ({ x: w.x + 1, y: w.y + 1, r: 2.5 })),
          { x: mabmiaHome.x, y: mabmiaHome.y, r: 4 },
        ];
        const map = desertMap(seed, keep);
        clearArea(map, LANDER.x - 1, LANDER.y - 1, 9, 6);
        connect(map, [deposit, ...wrecks, mabmiaHome]);
        sealFromBase(map);
        const state = CP.createState(map, seed);
        CP.addBuilding(state, 'lander', LANDER.x, LANDER.y);
        CP.addNode(state, 'crystal', deposit.x, deposit.y, CP.ECON.smallDeposit);
        for (const w of wrecks) CP.addNode(state, 'wreck', w.x, w.y, CP.ECON.wreck);
        startUnits(state, ['settler', 'settler']);
        const m = CP.addUnit(state, 'mabmia', mabmiaHome.x + 0.5, mabmiaHome.y + 0.5);
        m.home = { x: mabmiaHome.x + 0.5, y: mabmiaHome.y + 0.5 };
        state.res = { crystals: 50, scrap: 0 };
        return state;
      },
      // One goal at a time, in order.
      goals: [
        { icon: 'scrap', target: 60, count: (s) => s.gathered.scrap },
        { icon: 'dome', target: 1, count: (s) => s.buildings.filter((b) => b.type === 'dome' && b.built).length },
        { icon: 'settler', target: 3, count: (s) => s.units.filter((u) => u.type === 'settler').length },
        { icon: 'crystal', target: 100, count: (s) => s.gathered.crystals },
      ],
    },

    2: {
      id: 2,
      name: 'Robaki',
      build(seed) {
        const deposit = at(6.5, Math.PI * 0.42);
        const wreck = at(7.5, Math.PI * 0.08);
        // Three nests 12–25 tiles from the lander, hidden in the fog.
        const nests = [at(13, Math.PI * 0.12), at(18, Math.PI * 0.42), at(24, Math.PI * 0.22)];
        const keep = [
          { x: BASE.x + 3, y: BASE.y - 1, r: 7 },
          { x: deposit.x + 1, y: deposit.y + 1, r: 2.5 },
          { x: wreck.x + 1, y: wreck.y + 1, r: 2.5 },
          ...nests.map((n) => ({ x: n.x, y: n.y, r: 3 })),
        ];
        const map = desertMap(seed, keep);
        clearArea(map, LANDER.x - 1, LANDER.y - 5, 12, 10);
        connect(map, [deposit, wreck, ...nests]);
        sealFromBase(map);
        const state = CP.createState(map, seed);
        CP.addBuilding(state, 'lander', LANDER.x, LANDER.y);
        CP.addBuilding(state, 'dome', LANDER.x + 4, LANDER.y + 1);
        CP.addBuilding(state, 'workshop', LANDER.x, LANDER.y - 4);
        CP.addNode(state, 'crystal', deposit.x, deposit.y, CP.ECON.smallDeposit);
        CP.addNode(state, 'wreck', wreck.x, wreck.y, CP.ECON.wreck);
        nests.forEach((n, i) => CP.addNest(state, n.x, n.y, {
          firstSpawn: CP.NESTS.firstSpawn + i * CP.NESTS.stagger,
          bigAt: i === nests.length - 1 ? 2 : -1, // the farthest nest sends one big worm, as its 3rd
        }));
        startUnits(state, ['settler', 'settler', 'settler', 'infantry', 'infantry', 'rifleman']);
        state.res = { crystals: 150, scrap: 100 };
        return state;
      },
      goals: [{ icon: 'nest', target: 3, count: (s) => 3 - s.nests.length }],
    },

    3: {
      id: 3,
      name: 'Wraki',
      build(seed) {
        const MW = 64;
        const rocket = { x: 56, y: 4, size: 3 };
        const deposit = at(6.5, Math.PI * 0.42);
        const wreck = at(7.5, Math.PI * 0.08);
        const wreck2 = { x: 30, y: 40 };
        const routes = [
          [{ x: 22.5, y: 31.5 }, { x: 29.5, y: 25.5 }, { x: 22.5, y: 22.5 }],
          [{ x: 34.5, y: 18.5 }, { x: 44.5, y: 18.5 }, { x: 44.5, y: 28.5 }, { x: 34.5, y: 28.5 }],
          [{ x: 46.5, y: 9.5 }, { x: 53.5, y: 12.5 }, { x: 50.5, y: 6.5 }],
        ];
        const keep = [
          { x: BASE.x + 3, y: BASE.y - 1, r: 7 },
          { x: deposit.x + 1, y: deposit.y + 1, r: 2.5 },
          { x: wreck.x + 1, y: wreck.y + 1, r: 2.5 },
          { x: wreck2.x + 1, y: wreck2.y + 1, r: 2.5 },
          { x: rocket.x + 1.5, y: rocket.y + 1.5, r: 4 },
          ...routes.flat().map((p) => ({ x: p.x, y: p.y, r: 1.6 })),
        ];
        const map = wildMap(seed, keep, MW, { dunes: 20, rocks: 22, cracks: 2 });
        addRuins(map, seed, 18, 6, 57, 37, keep);
        clearArea(map, LANDER.x - 1, LANDER.y - 5, 12, 10);
        connect(map, [deposit, wreck, wreck2, { x: rocket.x - 1, y: rocket.y + 3 }, ...routes.flat().map((p) => ({ x: Math.floor(p.x), y: Math.floor(p.y) }))]);
        sealFromBase(map);
        const state = CP.createState(map, seed);
        state.hero = loadProgress().hero;
        CP.addBuilding(state, 'lander', LANDER.x, LANDER.y);
        CP.addBuilding(state, 'dome', LANDER.x + 4, LANDER.y + 1);
        CP.addBuilding(state, 'workshop', LANDER.x, LANDER.y - 4);
        CP.addNode(state, 'crystal', deposit.x, deposit.y, CP.ECON.smallDeposit);
        CP.addNode(state, 'wreck', wreck.x, wreck.y, CP.ECON.wreck);
        CP.addNode(state, 'wreck', wreck2.x, wreck2.y, CP.ECON.wreck);
        state.rocket = CP.addNode(state, 'rocket', rocket.x, rocket.y, 400, 3);
        routes.forEach((r, i) => addPatrol(state, r, i + 1, i));
        startUnits(state, ['hero', 'settler', 'settler', 'settler', 'infantry', 'infantry', 'rifleman', 'rifleman']);
        state.res = { crystals: 150, scrap: 100 };
        return state;
      },
      goals: [{ icon: 'rocket', target: 1, count: (s) => (s.rocketReached || (s.rocketReached = reached(s, s.rocket))) ? 1 : 0 }],
    },

    4: {
      id: 4,
      name: 'Złoże',
      build(seed) {
        const deposit = at(6.5, Math.PI * 0.45);
        const wreck = at(7.5, Math.PI * 0.08);
        const wreck2 = at(11, Math.PI * 0.52);
        const big = at(21, Math.PI * 0.3);
        const guard = { x: big.x - 1, y: big.y + 3 };
        const nest = at(13, Math.PI * 0.18);
        const keep = [
          { x: BASE.x + 3, y: BASE.y - 1, r: 7 },
          { x: deposit.x + 1, y: deposit.y + 1, r: 2.5 },
          { x: wreck.x + 1, y: wreck.y + 1, r: 2.5 },
          { x: wreck2.x + 1, y: wreck2.y + 1, r: 2.5 },
          { x: big.x + 1.5, y: big.y + 1.5, r: 5 },
          { x: nest.x, y: nest.y, r: 3 },
        ];
        const map = desertMap(seed, keep);
        clearArea(map, LANDER.x - 1, LANDER.y - 5, 12, 10);
        connect(map, [deposit, wreck, wreck2, guard, nest]);
        sealFromBase(map);
        const state = CP.createState(map, seed);
        state.hero = loadProgress().hero;
        state.builds = ['dome', 'workshop', 'forge'];
        CP.addBuilding(state, 'lander', LANDER.x, LANDER.y);
        CP.addBuilding(state, 'dome', LANDER.x + 4, LANDER.y + 1);
        CP.addBuilding(state, 'workshop', LANDER.x, LANDER.y - 4);
        CP.addNode(state, 'crystal', deposit.x, deposit.y, CP.ECON.smallDeposit);
        CP.addNode(state, 'wreck', wreck.x, wreck.y, CP.ECON.wreck);
        CP.addNode(state, 'wreck', wreck2.x, wreck2.y, CP.ECON.wreck);
        const bigNode = CP.addNode(state, 'bigCrystal', big.x, big.y, CP.ECON.bigDeposit, 3);
        const g = addCreature(state, 'guardian', guard.x, guard.y);
        bigNode.guardId = g.id;
        state.bigNode = bigNode;
        state.guardId = g.id;
        CP.addNest(state, nest.x, nest.y, { firstSpawn: 90, interval: 45 });
        startUnits(state, ['hero', 'settler', 'settler', 'settler', 'infantry', 'infantry', 'rifleman']);
        state.res = { crystals: 200, scrap: 200 };
        return state;
      },
      goals: [
        { icon: 'forge', target: 1, count: (s) => s.buildings.filter((b) => b.type === 'forge' && b.built).length },
        { icon: 'guardian', target: 1, count: (s) => (CP.unitById(s, s.guardId) ? 0 : 1) },
        { icon: 'crystal', target: 200, count: (s) => s.bigNode.max - s.bigNode.amount },
      ],
    },
  };
  CP.MISSIONS = MISSIONS;
  CP.MISSION_COUNT = 4;

  function createMission(id, seed) {
    const def = MISSIONS[id];
    const state = def.build(seed || id * 1000 + 7);
    state.mission = { id, goal: 0, result: null, goalDoneAt: -10 };
    CP.updateFog(state);
    return state;
  }

  /** Current goal with its counter, or null when all are done. */
  function currentGoal(state) {
    const m = state.mission;
    const def = MISSIONS[m.id];
    const g = def.goals[m.goal];
    if (!g) return null;
    return { icon: g.icon, value: Math.min(g.target, g.count(state)), target: g.target, index: m.goal, total: def.goals.length };
  }

  function updateMission(state) {
    const m = state.mission;
    if (m.result) return;
    const def = MISSIONS[m.id];
    // Goals advance in order; several can complete in the same moment.
    while (m.goal < def.goals.length && def.goals[m.goal].count(state) >= def.goals[m.goal].target) {
      m.goal++;
      m.goalDoneAt = state.time;
      state.events.push({ type: 'goal', index: m.goal });
    }
    if (m.goal >= def.goals.length) {
      m.result = 'win';
      state.events.push({ type: 'win' });
      return;
    }
    // Lost: nobody left and no way to make a settler.
    const anyone = state.units.some((u) => u.owner === 'player');
    const lander = state.buildings.find((b) => b.type === 'lander' && b.built);
    const training = state.buildings.some((b) => b.queue.length);
    if (!anyone && !training && (!lander || state.res.crystals < CP.UNIT_TYPES.settler.cost[0])) {
      m.result = 'lose';
      state.events.push({ type: 'lose' });
    }
  }

  // ---- Campaign progress (localStorage) -----------------------------------

  const KEY = 'czerwona-planeta-postep';

  function loadProgress() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || '{}');
      const hero = p.hero && p.hero.level >= 1 ? { level: p.hero.level | 0, xp: p.hero.xp | 0 } : { level: 1, xp: 0 };
      return { won: Array.isArray(p.won) ? p.won : [], hero };
    } catch (e) {
      return { won: [], hero: { level: 1, xp: 0 } };
    }
  }

  function saveProgress(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode: progress just isn't kept */ }
  }

  /** The hero's level stays with him, won or lost. */
  function saveHero(hero) {
    const p = loadProgress();
    if (hero.xp < p.hero.xp) return;
    p.hero = { level: hero.level, xp: hero.xp };
    saveProgress(p);
  }

  function saveWin(id) {
    const p = loadProgress();
    if (!p.won.includes(id)) p.won.push(id);
    saveProgress(p);
  }

  function isUnlocked(id) {
    const won = loadProgress().won;
    return id === 1 || won.includes(id - 1) || won.includes(id);
  }

  Object.assign(CP, { createMission, currentGoal, updateMission, loadProgress, saveWin, saveHero, isUnlocked });
})(window.CP = window.CP || {});

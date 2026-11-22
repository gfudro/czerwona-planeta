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
  function desertMap(seed, keep) {
    const map = CP.createMap(W, H);
    const rng = CP.createRng(seed);
    const set = (x, y, t) => { if (CP.inBounds(map, x, y)) map.terrain[y * W + x] = t; };
    const kept = (x, y) => keep.some((k) => (x - k.x) ** 2 + (y - k.y) ** 2 <= k.r * k.r);

    for (let k = 0; k < 16; k++) {
      const cx = CP.nextInt(rng, W), cy = CP.nextInt(rng, H), r = 2 + CP.nextFloat(rng) * 4;
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && CP.nextFloat(rng) < 0.85) set(x, y, CP.T.DUNE);
    }
    for (let k = 0; k < 26; k++) {
      const cx = CP.nextInt(rng, W), cy = CP.nextInt(rng, H);
      const r = 0.8 + CP.nextFloat(rng) * 2.4;
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && !kept(x, y)) set(x, y, CP.T.ROCK);
    }
    // A few short cracks.
    for (let k = 0; k < 3; k++) {
      let x = 8 + CP.nextInt(rng, W - 16), y = 6 + CP.nextInt(rng, H - 20);
      const dx = CP.nextFloat(rng) < 0.5 ? 1 : -1;
      for (let t = 0; t < 7 + CP.nextInt(rng, 6); t++) {
        if (!kept(x, y)) set(x, y, CP.T.CRACK);
        x += dx;
        if (CP.nextFloat(rng) < 0.5) y += CP.nextFloat(rng) < 0.5 ? 1 : -1;
      }
    }
    for (let i = 0; i < W; i++) { set(i, 0, CP.T.ROCK); set(i, H - 1, CP.T.ROCK); set(0, i, CP.T.ROCK); set(W - 1, i, CP.T.ROCK); }
    return map;
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
  };
  CP.MISSIONS = MISSIONS;
  CP.MISSION_COUNT = 2;

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
      return { won: Array.isArray(p.won) ? p.won : [] };
    } catch (e) {
      return { won: [] };
    }
  }

  function saveWin(id) {
    const p = loadProgress();
    if (!p.won.includes(id)) p.won.push(id);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode: progress just isn't kept */ }
  }

  function isUnlocked(id) {
    const won = loadProgress().won;
    return id === 1 || won.includes(id - 1) || won.includes(id);
  }

  Object.assign(CP, { createMission, currentGoal, updateMission, loadProgress, saveWin, isUnlocked });
})(window.CP = window.CP || {});

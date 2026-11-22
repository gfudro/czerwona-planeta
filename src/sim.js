// Simulation core: plain data plus tick(state). No DOM or canvas in here.
// Positions are in tiles (floats); (x, y) is where a unit's feet stand.
// Economy lives in econ.js, fighting and creatures in combat.js.
(function (CP) {
  'use strict';

  const FOG = { HIDDEN: 0, EXPLORED: 1, VISIBLE: 2 };
  CP.FOG = FOG;
  const DT = () => 1 / CP.SIM_HZ;
  CP.DT = DT;

  function createState(map, seed) {
    return {
      map,
      tick: 0,
      time: 0, // seconds of game time
      rng: CP.createRng(seed ^ 0x5eed),
      nextId: 1,
      units: [],
      buildings: [],
      nodes: [], // crystal deposits and wrecks
      nests: [],
      debris: [], // emptied wrecks, drawn only
      res: { crystals: 0, scrap: 0 },
      gathered: { crystals: 0, scrap: 0 }, // totals over the mission, for goals
      fog: new Uint8Array(map.w * map.h),
      events: [], // for the renderer and the game loop: damage numbers, deaths, spotted enemies
      mission: null,
    };
  }

  function setBlocked(map, x, y, size, value) {
    for (let yy = y; yy < y + size; yy++)
      for (let xx = x; xx < x + size; xx++) if (CP.inBounds(map, xx, yy)) map.blocked[yy * map.w + xx] = value;
  }

  function addBuilding(state, type, x, y, built = true) {
    const def = CP.BUILDING_TYPES[type];
    const b = {
      id: state.nextId++, type, x, y, size: def.size,
      built, progress: built ? 1 : 0,
      queue: [], trainT: 0, rally: null,
    };
    setBlocked(state.map, x, y, def.size, 1);
    state.buildings.push(b);
    return b;
  }

  function addNode(state, kind, x, y, amount) {
    const n = { id: state.nextId++, kind, x, y, size: 2, amount, max: amount };
    setBlocked(state.map, x, y, 2, 1);
    state.nodes.push(n);
    return n;
  }

  function removeNode(state, n) {
    setBlocked(state.map, n.x, n.y, n.size, 0);
    state.nodes = state.nodes.filter((o) => o !== n);
    if (n.kind === 'wreck') state.debris.push({ x: n.x, y: n.y, size: n.size });
  }

  function addUnit(state, type, x, y) {
    const def = CP.UNIT_TYPES[type];
    const u = {
      id: state.nextId++,
      type,
      owner: def.side,
      x, y, px: x, py: y,
      hearts: def.hearts,
      path: [],
      facing: 1,
      walk: 0,
      order: null,
      carry: null, // { kind: 'crystals' | 'scrap', amount }
      lastNode: null, // where this settler gathers, to go back after unloading
      work: 0,
      hidden: false, // inside a crystal deposit
      cd: 0, // attack cooldown
      lunge: 0, // seconds left of the attack lunge (drawing only)
      repathT: 0,
      home: { x, y },
      seen: false,
      followId: null, // Mabmia follows this settler once tamed
    };
    state.units.push(u);
    return u;
  }

  function unitById(state, id) {
    for (const u of state.units) if (u.id === id) return u;
    return null;
  }
  function buildingById(state, id) {
    for (const b of state.buildings) if (b.id === id) return b;
    return null;
  }
  function nodeById(state, id) {
    for (const n of state.nodes) if (n.id === id) return n;
    return null;
  }
  function nestById(state, id) {
    for (const n of state.nests) if (n.id === id) return n;
    return null;
  }

  /** Distance from a point to a square footprint (0 inside it). */
  function distToRect(px, py, rx, ry, size) {
    const dx = Math.max(rx - px, 0, px - (rx + size));
    const dy = Math.max(ry - py, 0, py - (ry + size));
    return Math.hypot(dx, dy);
  }

  /**
   * Picks a separate goal tile for each of n units around (tx, ty): the
   * reachable walkable tiles closest to the clicked one. Units end up in a
   * tidy clump instead of fighting over one tile.
   */
  function goalTiles(map, tx, ty, n) {
    const start = CP.nearestWalkable(map, tx, ty);
    if (!start) return [];
    const out = [];
    const seen = new Set([start.y * map.w + start.x]);
    let frontier = [start];
    while (frontier.length && out.length < n) {
      frontier.sort((a, b) => (a.x - tx) ** 2 + (a.y - ty) ** 2 - ((b.x - tx) ** 2 + (b.y - ty) ** 2));
      const next = [];
      for (const t of frontier) {
        if (out.length < n) out.push(t);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const nx = t.x + dx, ny = t.y + dy, k = ny * map.w + nx;
          if (seen.has(k) || !CP.walkable(map, nx, ny)) continue;
          if (dx && dy && (!CP.walkable(map, t.x + dx, t.y) || !CP.walkable(map, t.x, t.y + dy))) continue;
          seen.add(k);
          next.push({ x: nx, y: ny });
        }
      }
      frontier = next;
    }
    return out;
  }

  function setPath(state, u, gx, gy) {
    const tiles = CP.findPath(state.map, Math.floor(u.x), Math.floor(u.y), gx, gy);
    if (!tiles) { u.path = []; return false; }
    u.path = CP.smoothPath(state.map, u.x, u.y, tiles, CP.UNIT_RADIUS * 0.8);
    return true;
  }

  function stop(u) {
    u.path = [];
  }

  /**
   * Walks next to a square footprint (building, deposit, nest). Returns
   * true once the unit stands beside it. Picks the free side tile nearest
   * to the unit; gives up (returns null) if no side tile can be reached.
   */
  function approachRect(state, u, rx, ry, size) {
    if (distToRect(u.x, u.y, rx, ry, size) <= 0.75) { stop(u); return true; }
    if (u.path.length) return false;
    const ring = [];
    for (let y = ry - 1; y <= ry + size; y++)
      for (let x = rx - 1; x <= rx + size; x++) {
        if (x >= rx && x < rx + size && y >= ry && y < ry + size) continue;
        if (CP.walkable(state.map, x, y)) ring.push({ x, y, d: (x + 0.5 - u.x) ** 2 + (y + 0.5 - u.y) ** 2 });
      }
    ring.sort((a, b) => a.d - b.d);
    for (const t of ring.slice(0, 3)) {
      setPath(state, u, t.x, t.y);
      const end = u.path[u.path.length - 1];
      if (end && Math.floor(end.x) === t.x && Math.floor(end.y) === t.y) return false;
    }
    // Couldn't reach a side tile exactly: walk as close as possible and accept it.
    if (u.path.length) return false;
    return distToRect(u.x, u.y, rx, ry, size) <= 1.5 ? true : null;
  }

  /** Walks towards another unit until within `range`; re-aims twice a second. Returns true when in range. */
  function approachUnit(state, u, t, range) {
    const d = Math.hypot(t.x - u.x, t.y - u.y);
    if (d <= range) { stop(u); return true; }
    u.repathT -= DT();
    if (!u.path.length || u.repathT <= 0) {
      u.repathT = 0.5;
      setPath(state, u, Math.floor(t.x), Math.floor(t.y));
      // Path ends on the target's tile centre; finish with a straight step to the target itself.
      if (!u.path.length) u.path = [{ x: t.x, y: t.y }];
    }
    return false;
  }

  function moveUnits(state) {
    const dt = DT();
    for (const u of state.units) {
      u.px = u.x;
      u.py = u.y;
      if (u.lunge > 0) u.lunge -= dt;
      if (!u.path.length) { u.walk = 0; continue; }
      let step = CP.UNIT_TYPES[u.type].speed * dt;
      while (step > 0 && u.path.length) {
        const wp = u.path[0];
        const dx = wp.x - u.x, dy = wp.y - u.y;
        const d = Math.hypot(dx, dy);
        if (Math.abs(dx) > 0.01) u.facing = dx > 0 ? 1 : -1;
        if (d <= step) {
          u.x = wp.x; u.y = wp.y;
          u.path.shift();
          step -= d;
        } else {
          u.x += (dx / d) * step;
          u.y += (dy / d) * step;
          step = 0;
        }
      }
      u.walk += dt;
    }
  }

  /**
   * Keeps standing units from piling on one spot. Walking units pass
   * through everyone (so nobody ever jams in a narrow pass) and nudge
   * standing units out of the way; standing units push each other apart.
   */
  function separate(state) {
    const r2 = CP.UNIT_RADIUS * 2;
    const us = state.units;
    for (let i = 0; i < us.length; i++) {
      const a = us[i];
      if (a.hidden) continue;
      for (let j = i + 1; j < us.length; j++) {
        const b = us[j];
        if (b.hidden) continue;
        const aIdle = !a.path.length, bIdle = !b.path.length;
        if (!aIdle && !bIdle) continue;
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= r2) continue;
        if (d < 1e-4) { dx = ((a.id * 7919) % 13) / 13 - 0.5; dy = ((b.id * 104729) % 17) / 17 - 0.5; d = Math.hypot(dx, dy) || 1; }
        const push = Math.min((r2 - d) * 0.5, 0.05);
        const nx = dx / d, ny = dy / d;
        if (aIdle && bIdle) {
          nudge(state, a, -nx * push * 0.5, -ny * push * 0.5);
          nudge(state, b, nx * push * 0.5, ny * push * 0.5);
        } else if (aIdle) {
          nudge(state, a, -nx * push, -ny * push);
        } else {
          nudge(state, b, nx * push, ny * push);
        }
      }
    }
  }

  function nudge(state, u, dx, dy) {
    const nx = u.x + dx, ny = u.y + dy;
    if (CP.walkable(state.map, Math.floor(nx), Math.floor(ny))) { u.x = nx; u.y = ny; }
    else if (CP.walkable(state.map, Math.floor(nx), Math.floor(u.y))) u.x = nx;
    else if (CP.walkable(state.map, Math.floor(u.x), Math.floor(ny))) u.y = ny;
  }

  /**
   * Fog of war: what our units and buildings see now is visible, what
   * they saw before is explored. A creature seen for the first time
   * raises a "spotted" event (used for the automatic pause).
   */
  function updateFog(state) {
    const { fog, map } = state;
    for (let i = 0; i < fog.length; i++) if (fog[i] === FOG.VISIBLE) fog[i] = FOG.EXPLORED;
    const reveal = (cx, cy, r) => {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          if (!CP.inBounds(map, x, y)) continue;
          if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) fog[y * map.w + x] = FOG.VISIBLE;
        }
    };
    for (const u of state.units) if (u.owner === 'player') reveal(u.x, u.y, CP.UNIT_TYPES[u.type].sight + 0.5);
    for (const b of state.buildings) reveal(b.x + b.size / 2, b.y + b.size / 2, CP.BUILDING_TYPES[b.type].sight + b.size / 2);
    for (const u of state.units) {
      if (u.owner === 'player' || u.seen) continue;
      if (isVisible(state, u.x, u.y)) {
        u.seen = true;
        if (u.owner === 'wild') state.events.push({ type: 'spotted', id: u.id, x: u.x, y: u.y });
      }
    }
  }

  function isVisible(state, x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    return CP.inBounds(state.map, tx, ty) && state.fog[ty * state.map.w + tx] === FOG.VISIBLE;
  }

  // ---- Orders -------------------------------------------------------------

  /** Order handlers by order type: (state, unit) -> runs one tick of that order. */
  const ORDERS = {
    move(state, u) {
      if (!u.path.length) u.order = null;
    },
  };
  CP.ORDERS = ORDERS;

  function runOrders(state) {
    for (const u of state.units) {
      if (u.cd > 0) u.cd -= DT();
      if (u.order) {
        const h = ORDERS[u.order.type];
        if (h) h(state, u);
        else u.order = null;
      }
    }
  }

  /** Orders the given units to walk to the point (wx, wy) in tiles. Works in pause too. */
  function orderMove(state, units, wx, wy) {
    if (!units.length) return;
    const tx = Math.floor(wx), ty = Math.floor(wy);
    const goals = goalTiles(state.map, tx, ty, units.length);
    if (!goals.length) return;
    // Greedy: the unit farthest from the target picks first, taking the goal nearest to it.
    const order = units.slice().sort((a, b) => (b.x - wx) ** 2 + (b.y - wy) ** 2 - ((a.x - wx) ** 2 + (a.y - wy) ** 2));
    const free = goals.slice();
    for (const u of order) {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < free.length; i++) {
        const d = (free[i].x + 0.5 - u.x) ** 2 + (free[i].y + 0.5 - u.y) ** 2;
        if (d < bd) { bd = d; bi = i; }
      }
      const goal = free.length ? free.splice(bi, 1)[0] : goals[0];
      leaveWork(state, u);
      u.order = { type: 'move' };
      setPath(state, u, goal.x, goal.y);
    }
  }

  /** A settler inside a deposit steps out before doing anything else. */
  function leaveWork(state, u) {
    if (u.hidden) CP.exitDeposit(state, u);
    u.work = 0;
  }

  /** What is under the point (wx, wy) in tiles, for the right-click. */
  function thingAt(state, wx, wy) {
    // Units first (a little forgiving around the feet), nearest wins.
    let best = null, bd = 0.6;
    for (const u of state.units) {
      if (u.hidden || u.owner === 'player') continue;
      if (u.owner !== 'player' && !isVisible(state, u.x, u.y)) continue;
      const d = Math.hypot(u.x - wx, u.y - 0.35 - wy);
      if (d < bd) { bd = d; best = u; }
    }
    if (best) return { kind: 'unit', unit: best };
    const tx = Math.floor(wx), ty = Math.floor(wy);
    const inRect = (o) => tx >= o.x && tx < o.x + o.size && ty >= o.y && ty < o.y + o.size;
    for (const n of state.nodes) if (inRect(n)) return { kind: 'node', node: n };
    for (const n of state.nests) if (tx === n.x && ty === n.y) return { kind: 'nest', nest: n };
    for (const b of state.buildings) if (inRect(b)) return { kind: 'building', building: b };
    return null;
  }

  /**
   * The right-click: the game works out what to do. Settlers gather,
   * build, fill nests and tame Mabmia; everybody attacks creatures;
   * otherwise units walk there.
   */
  function orderSmart(state, ids, wx, wy, targetUnit) {
    const units = ids.map((id) => unitById(state, id)).filter((u) => u && u.owner === 'player');
    if (!units.length) return null;
    // The click box of a sprite (from input) wins over the guess from a map point.
    const hit = targetUnit && targetUnit.owner !== 'player' ? { kind: 'unit', unit: targetUnit } : thingAt(state, wx, wy);
    const settlers = units.filter((u) => u.type === 'settler');
    const others = units.filter((u) => u.type !== 'settler');
    const setAll = (list, order) => list.forEach((u) => { leaveWork(state, u); stop(u); u.order = Object.assign({}, order); });

    if (hit && hit.kind === 'unit' && hit.unit.owner === 'wild') {
      setAll(units, { type: 'attack', targetId: hit.unit.id });
      return 'attack';
    }
    if (hit && hit.kind === 'unit' && hit.unit.type === 'mabmia' && settlers.length) {
      setAll(settlers.slice(0, 1), { type: 'tame', targetId: hit.unit.id });
      orderMove(state, settlers.slice(1).concat(others), wx, wy);
      return 'tame';
    }
    if (hit && hit.kind === 'node' && settlers.length) {
      for (const s of settlers) {
        leaveWork(state, s);
        stop(s);
        s.lastNode = hit.node.id;
        s.order = s.carry && s.carry.kind !== CP.nodeResource(hit.node) ? { type: 'return', nodeId: hit.node.id } : { type: 'gather', nodeId: hit.node.id };
      }
      orderMove(state, others, wx, wy);
      return 'gather';
    }
    if (hit && hit.kind === 'nest' && settlers.length) {
      setAll(settlers, { type: 'fill', nestId: hit.nest.id });
      orderMove(state, others, wx, wy);
      return 'fill';
    }
    if (hit && hit.kind === 'building' && settlers.length) {
      const b = hit.building;
      if (!b.built) {
        setAll(settlers, { type: 'build', buildingId: b.id });
        orderMove(state, others, wx, wy);
        return 'build';
      }
      if (b.type === 'lander') {
        const carriers = settlers.filter((s) => s.carry);
        carriers.forEach((s) => { leaveWork(state, s); stop(s); s.order = { type: 'return', nodeId: s.lastNode }; });
        orderMove(state, settlers.filter((s) => !s.carry).concat(others), wx, wy);
        return carriers.length ? 'return' : 'move';
      }
    }
    orderMove(state, units, wx, wy);
    return 'move';
  }

  /** One simulation step. Events pile up in state.events until the game loop takes them. */
  function tick(state) {
    CP.updateEconomy(state);
    CP.updateCreatures(state);
    runOrders(state);
    moveUnits(state);
    separate(state);
    CP.cleanupDead(state);
    updateFog(state);
    if (state.mission) CP.updateMission(state);
    state.tick++;
    state.time += DT();
  }

  /** The stage-1 sandbox (index.html?sandbox): lander, 12 units, deposits and a nest. */
  function createSandbox(seed) {
    const map = CP.createTestMap(seed);
    const state = createState(map, seed);
    addBuilding(state, 'lander', 3, map.h - 6);
    const roster = ['settler', 'settler', 'settler', 'settler', 'settler', 'settler', 'infantry', 'infantry', 'infantry', 'rifleman', 'rifleman', 'rifleman'];
    const spots = goalTiles(map, 7, map.h - 4, roster.length);
    roster.forEach((type, i) => addUnit(state, type, spots[i].x + 0.5, spots[i].y + 0.5));
    state.res = { crystals: 500, scrap: 500 };
    updateFog(state);
    return state;
  }

  Object.assign(CP, {
    createState, addUnit, addBuilding, addNode, removeNode, setBlocked,
    unitById, buildingById, nodeById, nestById, distToRect, goalTiles,
    setPath, stop, approachRect, approachUnit, isVisible, thingAt,
    orderMove, orderSmart, leaveWork, tick, updateFog, createSandbox,
  });
})(window.CP = window.CP || {});

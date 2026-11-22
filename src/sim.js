// Simulation: plain data plus tick(state). No DOM or canvas in here.
// Positions are in tiles (floats); (x, y) is where the unit's feet stand.
(function (CP) {
  'use strict';

  const FOG = { HIDDEN: 0, EXPLORED: 1, VISIBLE: 2 };
  CP.FOG = FOG;

  function createState(map, seed) {
    return {
      map,
      tick: 0,
      rng: CP.createRng(seed ^ 0x5eed),
      nextId: 1,
      units: [],
      buildings: [],
      fog: new Uint8Array(map.w * map.h),
    };
  }

  function addBuilding(state, type, x, y) {
    const size = CP.BUILDING_TYPES[type].size;
    const b = { id: state.nextId++, type, x, y, size };
    for (let yy = y; yy < y + size; yy++)
      for (let xx = x; xx < x + size; xx++) state.map.blocked[yy * state.map.w + xx] = 1;
    state.buildings.push(b);
    return b;
  }

  function addUnit(state, type, x, y) {
    const def = CP.UNIT_TYPES[type];
    const u = {
      id: state.nextId++,
      type,
      owner: 'player',
      x, y, // feet position in tiles
      px: x, py: y, // position at the previous tick, for smooth drawing
      hearts: def.hearts,
      path: [], // waypoints still to walk
      facing: 1, // 1 right, -1 left
      walk: 0, // walk-cycle time while moving
    };
    state.units.push(u);
    return u;
  }

  function unitById(state, id) {
    return state.units.find((u) => u.id === id) || null;
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
      // Closest to the click first within each ring, so the clump stays round.
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

  /** Orders the given units to walk to the point (wx, wy) in tiles. Works in pause too. */
  function orderMove(state, ids, wx, wy) {
    const units = ids.map((id) => unitById(state, id)).filter((u) => u && u.owner === 'player');
    if (!units.length) return;
    const tx = Math.floor(wx), ty = Math.floor(wy);
    const goals = goalTiles(state.map, tx, ty, units.length);
    if (!goals.length) return;
    // Greedy: the unit farthest from the target picks first, taking the goal nearest to it,
    // which keeps paths from crossing much.
    const order = units.slice().sort((a, b) => (b.x - wx) ** 2 + (b.y - wy) ** 2 - ((a.x - wx) ** 2 + (a.y - wy) ** 2));
    const free = goals.slice();
    for (const u of order) {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < free.length; i++) {
        const d = (free[i].x + 0.5 - u.x) ** 2 + (free[i].y + 0.5 - u.y) ** 2;
        if (d < bd) { bd = d; bi = i; }
      }
      const goal = free.length ? free.splice(bi, 1)[0] : goals[0];
      setPath(state, u, goal.x, goal.y);
    }
  }

  function setPath(state, u, gx, gy) {
    const tiles = CP.findPath(state.map, Math.floor(u.x), Math.floor(u.y), gx, gy);
    if (!tiles) { u.path = []; return; }
    u.path = CP.smoothPath(state.map, u.x, u.y, tiles, CP.UNIT_RADIUS * 0.8);
  }

  const DT = () => 1 / CP.SIM_HZ;

  function moveUnits(state) {
    const dt = DT();
    for (const u of state.units) {
      u.px = u.x;
      u.py = u.y;
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
      for (let j = i + 1; j < us.length; j++) {
        const a = us[i], b = us[j];
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

  /** Fog of war: what our units and buildings see now is visible, what they saw before is explored. */
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
  }

  function tick(state) {
    moveUnits(state);
    separate(state);
    updateFog(state);
    state.tick++;
  }

  /** The stage-1 sandbox: lander in the bottom-left corner and 12 units around it. */
  function createSandbox(seed) {
    const map = CP.createTestMap(seed);
    const state = createState(map, seed);
    addBuilding(state, 'lander', 3, map.h - 6);
    const roster = ['settler', 'settler', 'settler', 'settler', 'settler', 'settler', 'infantry', 'infantry', 'infantry', 'rifleman', 'rifleman', 'rifleman'];
    const spots = goalTiles(map, 7, map.h - 4, roster.length);
    roster.forEach((type, i) => addUnit(state, type, spots[i].x + 0.5, spots[i].y + 0.5));
    updateFog(state);
    return state;
  }

  CP.createState = createState;
  CP.addUnit = addUnit;
  CP.addBuilding = addBuilding;
  CP.unitById = unitById;
  CP.orderMove = orderMove;
  CP.tick = tick;
  CP.updateFog = updateFog;
  CP.createSandbox = createSandbox;
})(window.CP = window.CP || {});

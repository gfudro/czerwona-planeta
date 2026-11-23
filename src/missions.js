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

  /**
   * The queen's palace in (x0, y0)–(x1, y1): an outer wall with three gates
   * and fallen stretches, two rows of pillars leading to the throne hall,
   * and an inner wall around the hall with a wide doorway.
   */
  function addPalace(map, x0, y0, x1, y1) {
    const set = (x, y) => { if (x > 0 && y > 0 && x < map.w - 1 && y < map.h - 1) map.terrain[y * map.w + x] = CP.T.RUIN; };
    const gap = (t, list) => list.some(([a, b]) => t >= a && t <= b);
    for (let x = x0; x <= x1; x++) {
      if (!gap(x, [[x0 + 5, x0 + 6]])) set(x, y0 + 1);
      if (!gap(x, [[x0 + 4, x0 + 6], [x1 - 6, x1 - 4]])) set(x, y1);
    }
    for (let y = y0 + 1; y <= y1; y++) {
      if (!gap(y, [[y0 + 7, y0 + 9], [y1 - 3, y1 - 3]])) set(x0, y);
    }
    // Pillars along the way in.
    for (let x = x0 + 3; x <= x1 - 8; x += 3) { set(x, y1 - 4); set(x, y1 - 8); }
    // Inner wall around the throne hall (top-right), doorway on the left and bottom.
    const hx = x1 - 9, hy = y0 + 1, hb = y0 + 11;
    for (let y = hy; y <= hb; y++) if (!gap(y, [[hy + 4, hy + 6]])) set(hx, y);
    for (let x = hx; x <= x1; x++) if (!gap(x, [[hx + 3, hx + 5]])) set(x, hb);
  }

  /** Distance from (px, py) to the segment a–b. */
  function segDist(px, py, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y, len2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / len2));
    return Math.hypot(px - a.x - vx * t, py - a.y - vy * t);
  }

  /**
   * Caves under the surface: solid rock with round caverns joined by winding
   * tunnels, darker patches of floor, and lava pools at the sides of some
   * caverns, never on a tunnel (so lava doesn't block the way).
   */
  function caveMap(seed, W, caverns, tunnels, lavaIn) {
    const map = CP.createMap(W, H);
    map.theme = 'cave';
    map.terrain.fill(CP.T.ROCK);
    const rng = CP.createRng(seed);
    const inside = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1;
    const carve = (cx, cy, r, t = CP.T.SAND) => {
      for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
        for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
          if (!inside(x, y)) continue;
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) + (CP.hash(x, y, seed & 255) - 0.5) * 1.4;
          if (d <= r) map.terrain[y * W + x] = t;
        }
    };
    for (const c of caverns) carve(c.x, c.y, c.r);
    const segs = [];
    for (const [i, j] of tunnels) {
      const a = caverns[i], b = caverns[j];
      // A wobbly tunnel: walk from a to b with a sideways sway.
      const len = Math.hypot(b.x - a.x, b.y - a.y), nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
      const sway = (CP.nextFloat(rng) - 0.5) * 6;
      let prev = { x: a.x, y: a.y };
      for (let t = 0; t <= 1.0001; t += 0.5 / len) {
        const s = Math.sin(t * Math.PI) * sway;
        const p = { x: a.x + (b.x - a.x) * t + nx * s, y: a.y + (b.y - a.y) * t + ny * s };
        carve(p.x, p.y, 1.7 + Math.sin(t * 9 + i) * 0.3);
        segs.push([prev, p]);
        prev = p;
      }
    }
    // Lava pools inside the listed caverns, away from tunnels and kept spots.
    for (const { cavern, count, keep } of lavaIn) {
      const c = caverns[cavern];
      let placed = 0;
      for (let tries = 0; tries < 60 && placed < count; tries++) {
        const ang = CP.nextFloat(rng) * Math.PI * 2, d = c.r * (0.35 + CP.nextFloat(rng) * 0.4);
        const px = c.x + Math.cos(ang) * d, py = c.y + Math.sin(ang) * d, pr = 1.4 + CP.nextFloat(rng) * 1.2;
        if (segs.some(([a, b]) => segDist(px, py, a, b) < pr + 2.2)) continue;
        if ((keep || []).some((k) => Math.hypot(px - k.x, py - k.y) < pr + k.r)) continue;
        for (let y = Math.floor(py - pr); y <= py + pr; y++)
          for (let x = Math.floor(px - pr); x <= px + pr; x++)
            if (inside(x, y) && map.terrain[y * W + x] < CP.T.ROCK && Math.hypot(x + 0.5 - px, y + 0.5 - py) <= pr) map.terrain[y * W + x] = CP.T.LAVA;
        placed++;
      }
    }
    return map;
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

  /**
   * Extra starting buildings on free ground near the lander, keeping a
   * one-tile walkway around each (placed after deposits so they don't overlap).
   */
  function startBuildings(state, types) {
    const map = state.map;
    for (const type of types) {
      const size = CP.BUILDING_TYPES[type].size;
      let done = false;
      for (let r = 4; r <= 12 && !done; r++)
        for (let y = LANDER.y - r; y <= LANDER.y + 2 && !done; y++)
          for (let x = LANDER.x; x <= LANDER.x + r && !done; x++) {
            let ok = true;
            for (let yy = y - 1; yy <= y + size && ok; yy++)
              for (let xx = x - 1; xx <= x + size && ok; xx++) ok = CP.walkable(map, xx, yy);
            if (ok) { CP.addBuilding(state, type, x, y); done = true; }
          }
    }
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
  MISSIONS[5] = {
    id: 5,
    name: 'Królowa',
    build(seed) {
      const MW = 64;
      const throne = { x: 56, y: 7 };
      const deposit = at(6.5, Math.PI * 0.42);
      const wreck = at(7.5, Math.PI * 0.08);
      const wreck2 = { x: 28, y: 38 };
      const deposit2 = { x: 30, y: 20 };
      const routes = [
        [{ x: 20.5, y: 30.5 }, { x: 30.5, y: 28.5 }, { x: 26.5, y: 22.5 }],
        [{ x: 40.5, y: 26.5 }, { x: 46.5, y: 18.5 }, { x: 38.5, y: 16.5 }],
      ];
      const keep = [
        { x: BASE.x + 3, y: BASE.y - 1, r: 7 },
        { x: deposit.x + 1, y: deposit.y + 1, r: 2.5 },
        { x: deposit2.x + 1, y: deposit2.y + 1, r: 2.5 },
        { x: wreck.x + 1, y: wreck.y + 1, r: 2.5 },
        { x: wreck2.x + 1, y: wreck2.y + 1, r: 2.5 },
        { x: throne.x, y: throne.y, r: 4 },
        ...routes.flat().map((p) => ({ x: p.x, y: p.y, r: 1.6 })),
      ];
      const map = wildMap(seed, keep, MW, { dunes: 20, rocks: 24, cracks: 3 });
      // The palace: tighter walled halls in the top-right corner, a few
      // scattered ruins on the way.
      clearArea(map, 41, 1, 22, 22);
      addPalace(map, 44, 2, 61, 18);
      addRuins(map, seed + 5, 22, 10, 37, 25, keep, 8);
      clearArea(map, LANDER.x - 1, LANDER.y - 5, 12, 10);
      connect(map, [deposit, deposit2, wreck, wreck2, { x: throne.x, y: throne.y + 2 }, ...routes.flat().map((p) => ({ x: Math.floor(p.x), y: Math.floor(p.y) }))]);
      sealFromBase(map);
      const state = CP.createState(map, seed);
      state.hero = loadProgress().hero;
      state.builds = ['dome', 'workshop', 'forge'];
      CP.addBuilding(state, 'lander', LANDER.x, LANDER.y);
      CP.addBuilding(state, 'dome', LANDER.x + 4, LANDER.y + 1);
      CP.addBuilding(state, 'workshop', LANDER.x, LANDER.y - 4);
      CP.addNode(state, 'crystal', deposit.x, deposit.y, CP.ECON.smallDeposit);
      CP.addNode(state, 'crystal', deposit2.x, deposit2.y, CP.ECON.smallDeposit);
      CP.addNode(state, 'wreck', wreck.x, wreck.y, CP.ECON.wreck);
      CP.addNode(state, 'wreck', wreck2.x, wreck2.y, CP.ECON.wreck);
      startBuildings(state, ['forge', 'dome']);
      routes.forEach((r, i) => addPatrol(state, r, i + 1, i));
      // The queen with two MAibawu at her side; they fight together.
      const q = addCreature(state, 'imapia', throne.x, throne.y);
      q.group = 'queen';
      addPatrol(state, [{ x: throne.x - 1.5, y: throne.y + 2.5 }], 2, 'queen');
      state.bossId = q.id;
      startUnits(state, ['hero', 'settler', 'settler', 'settler', 'infantry', 'infantry', 'rifleman', 'rifleman', 'cannon']);
      state.res = { crystals: 200, scrap: 200 };
      return state;
    },
    goals: [{ icon: 'imapia', target: 1, count: (s) => (CP.unitById(s, s.bossId) ? 0 : 1) }],
  };

  MISSIONS[6] = {
    id: 6,
    name: 'Jaskinie',
    build(seed) {
      const MW = 64;
      const caverns = [
        { x: 8, y: 40, r: 8 },   // 0 base
        { x: 22, y: 39, r: 5.5 }, // 1 wreck
        { x: 19, y: 24, r: 6 },  // 2 first Guardian
        { x: 34, y: 31, r: 6.5 }, // 3 nest, halfway
        { x: 50, y: 40, r: 6 },  // 4 second Guardian
        { x: 40, y: 15, r: 6 },  // 5 lava hall
        { x: 54, y: 9, r: 7.5 },  // 6 the Lord's grotto
      ];
      const tunnels = [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [2, 5], [5, 6], [4, 6]];
      const deposit = at(6, Math.PI * 0.4);
      const wreck = { x: 22, y: 40 };
      const big1 = { x: 16, y: 21 }, guard1 = { x: 19, y: 25 };
      const big2 = { x: 51, y: 40 }, guard2 = { x: 49, y: 38 };
      const nest = { x: 34, y: 31 };
      const lord = { x: 55, y: 9 };
      const keepObj = [
        { x: deposit.x + 1, y: deposit.y + 1, r: 2.5 }, { x: wreck.x + 1, y: wreck.y + 1, r: 2.5 },
        { x: big1.x + 1.5, y: big1.y + 1.5, r: 3.5 }, { x: big2.x + 1.5, y: big2.y + 1.5, r: 3.5 },
        { x: nest.x, y: nest.y, r: 2.5 }, { x: lord.x, y: lord.y, r: 3 },
      ];
      const lavaIn = [
        { cavern: 3, count: 1, keep: keepObj }, { cavern: 4, count: 1, keep: keepObj },
        { cavern: 5, count: 3, keep: keepObj }, { cavern: 6, count: 2, keep: keepObj },
      ];
      const map = caveMap(seed, MW, caverns, tunnels, lavaIn);
      clearArea(map, LANDER.x - 1, LANDER.y - 5, 12, 10);
      for (const k of keepObj) clearArea(map, Math.floor(k.x - 1.5), Math.floor(k.y - 1.5), 3, 3);
      connect(map, [deposit, wreck, guard1, guard2, nest, lord]);
      sealFromBase(map);
      const state = CP.createState(map, seed);
      state.hero = loadProgress().hero;
      state.builds = ['dome', 'workshop', 'forge'];
      CP.addBuilding(state, 'lander', LANDER.x, LANDER.y);
      CP.addBuilding(state, 'dome', LANDER.x + 4, LANDER.y + 1);
      CP.addBuilding(state, 'workshop', LANDER.x, LANDER.y - 4);
      CP.addNode(state, 'crystal', deposit.x, deposit.y, CP.ECON.smallDeposit);
      CP.addNode(state, 'wreck', wreck.x, wreck.y, CP.ECON.wreck);
      for (const [b, g] of [[big1, guard1], [big2, guard2]]) {
        const node = CP.addNode(state, 'bigCrystal', b.x, b.y, CP.ECON.bigDeposit, 3);
        node.guardId = addCreature(state, 'guardian', g.x, g.y).id;
      }
      startBuildings(state, ['forge', 'dome']);
      CP.addNest(state, nest.x, nest.y, { firstSpawn: 90, interval: 45 });
      state.bossId = addCreature(state, 'crystalLord', lord.x, lord.y).id;
      startUnits(state, ['hero', 'settler', 'settler', 'settler', 'infantry', 'infantry', 'rifleman', 'rifleman', 'cannon']);
      state.res = { crystals: 250, scrap: 250 };
      return state;
    },
    goals: [{ icon: 'crystalLord', target: 1, count: (s) => (CP.unitById(s, s.bossId) ? 0 : 1) }],
  };

  CP.MISSIONS = MISSIONS;
  CP.MISSION_COUNT = 6;

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

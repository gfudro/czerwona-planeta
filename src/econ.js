// Economy: gathering crystals and scrap, building, training units, unit limit.
(function (CP) {
  'use strict';

  const DT = () => CP.DT();

  function nodeResource(n) {
    return n.kind === 'wreck' ? 'scrap' : 'crystals';
  }

  /** The built lander nearest to a point (where settlers unload). */
  function nearestDepot(state, x, y) {
    let best = null, bd = Infinity;
    for (const b of state.buildings) {
      if (b.type !== 'lander' || !b.built) continue;
      const d = CP.distToRect(x, y, b.x, b.y, b.size);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  /** The nearest deposit or wreck of a kind within `radius` tiles, for when one runs out. */
  function nearestNode(state, kind, x, y, radius) {
    let best = null, bd = radius;
    for (const n of state.nodes) {
      if (n.kind !== kind) continue;
      const d = CP.distToRect(x, y, n.x, n.y, n.size);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  /** A settler comes out of a crystal deposit on the side facing the lander. */
  function exitDeposit(state, u) {
    u.hidden = false;
    const n = CP.nodeById(state, u.insideId);
    u.insideId = null;
    if (!n) return;
    const depot = nearestDepot(state, u.x, u.y);
    const tx = depot ? depot.x + depot.size / 2 : n.x;
    const ty = depot ? depot.y + depot.size / 2 : n.y;
    let best = null, bd = Infinity;
    for (let y = n.y - 1; y <= n.y + n.size; y++)
      for (let x = n.x - 1; x <= n.x + n.size; x++) {
        if (!CP.walkable(state.map, x, y)) continue;
        const d = (x + 0.5 - tx) ** 2 + (y + 0.5 - ty) ** 2;
        if (d < bd) { bd = d; best = { x, y }; }
      }
    if (best) { u.x = u.px = best.x + 0.5; u.y = u.py = best.y + 0.5; }
  }

  Object.assign(CP.ORDERS, {
    gather(state, u) {
      let n = CP.nodeById(state, u.order.nodeId);
      if (!n) {
        // Ran out: try the nearest one of the same kind, else stop.
        const kind = u.order.kind;
        n = kind && nearestNode(state, kind, u.x, u.y, 15);
        if (!n) { u.order = u.carry ? { type: 'return', nodeId: null } : null; return; }
        u.order.nodeId = n.id;
      }
      u.order.kind = n.kind;
      u.lastNode = n.id;
      if (u.carry) { u.order = { type: 'return', nodeId: n.id, kind: n.kind }; return; }
      if (u.work <= 0) {
        const at = CP.approachRect(state, u, n.x, n.y, n.size);
        if (at === null) { u.order = null; return; }
        if (!at) return;
        // Start working: into the deposit, or beside the wreck.
        u.work = 0.0001;
        if (n.kind === 'crystal') { u.hidden = true; u.insideId = n.id; }
        if (n.x + n.size / 2 !== u.x) u.facing = n.x + n.size / 2 > u.x ? 1 : -1;
        return;
      }
      u.work += DT();
      if (u.work < CP.ECON.mineTime) return;
      u.work = 0;
      const take = Math.min(CP.ECON.carry, n.amount);
      n.amount -= take;
      u.carry = { kind: nodeResource(n), amount: take };
      if (u.hidden) exitDeposit(state, u);
      if (n.amount <= 0) CP.removeNode(state, n);
      u.order = { type: 'return', nodeId: n.id, kind: n.kind };
    },

    return(state, u) {
      if (!u.carry) { u.order = null; return; }
      const depot = nearestDepot(state, u.x, u.y);
      if (!depot) { u.order = null; return; }
      const at = CP.approachRect(state, u, depot.x, depot.y, depot.size);
      if (at === null) { u.order = null; return; }
      if (!at) return;
      state.res[u.carry.kind] += u.carry.amount;
      state.gathered[u.carry.kind] += u.carry.amount;
      state.events.push({ type: 'unload', x: u.x, y: u.y, kind: u.carry.kind, amount: u.carry.amount });
      const kind = u.carry.kind === 'scrap' ? 'wreck' : 'crystal';
      u.carry = null;
      const nodeId = u.order.nodeId;
      u.order = { type: 'gather', nodeId, kind };
    },

    build(state, u) {
      const b = CP.buildingById(state, u.order.buildingId);
      if (!b || b.built) { u.order = null; return; }
      const at = CP.approachRect(state, u, b.x, b.y, b.size);
      if (at === null) { u.order = null; return; }
      if (!at) return;
      u.facing = b.x + b.size / 2 > u.x ? 1 : -1;
      u.work += DT(); // drives the hammering animation
      b.progress += DT() / CP.BUILDING_TYPES[b.type].build;
      if (b.progress >= 1) {
        b.progress = 1;
        b.built = true;
        state.events.push({ type: 'built', building: b.type, x: b.x + b.size / 2, y: b.y + b.size / 2 });
        for (const o of state.units) if (o.order && o.order.type === 'build' && o.order.buildingId === b.id) { o.order = null; o.work = 0; }
      }
    },
  });

  // ---- Unit limit and training ------------------------------------------

  function popCap(state) {
    let cap = 0;
    for (const b of state.buildings) if (b.built) cap += CP.BUILDING_TYPES[b.type].pop || 0;
    return Math.min(CP.ECON.popMax, cap);
  }

  /** Our units plus those waiting in training queues. */
  function popUsed(state) {
    let n = 0;
    for (const u of state.units) if (u.owner === 'player') n++;
    for (const b of state.buildings) n += b.queue.length;
    return n;
  }

  function canAfford(state, cost) {
    return state.res.crystals >= cost[0] && state.res.scrap >= cost[1];
  }

  function pay(state, cost, sign = 1) {
    state.res.crystals -= cost[0] * sign;
    state.res.scrap -= cost[1] * sign;
  }

  /** Why a unit can't be trained right now ('money', 'pop', 'queue') or null if it can. */
  function trainBlocker(state, b, type) {
    if (!b.built) return 'built';
    if (b.queue.length >= CP.ECON.queueMax) return 'queue';
    if (!canAfford(state, CP.UNIT_TYPES[type].cost)) return 'money';
    if (popUsed(state) >= popCap(state)) return 'pop';
    return null;
  }

  function train(state, b, type) {
    if (trainBlocker(state, b, type)) return false;
    pay(state, CP.UNIT_TYPES[type].cost);
    b.queue.push(type);
    return true;
  }

  /** Takes a unit out of the queue and gives the money back. */
  function cancelTrain(state, b, index) {
    const type = b.queue[index];
    if (!type) return;
    b.queue.splice(index, 1);
    if (index === 0) b.trainT = 0;
    pay(state, CP.UNIT_TYPES[type].cost, -1);
  }

  function spawnFrom(state, b, type) {
    const cx = b.x + b.size / 2, cy = b.y + b.size;
    const spots = CP.goalTiles(state.map, Math.floor(cx), Math.floor(cy), 1);
    const t = spots[0] || { x: b.x, y: b.y + b.size };
    const u = CP.addUnit(state, type, t.x + 0.5, t.y + 0.5);
    if (b.rally) CP.orderMove(state, [u], b.rally.x, b.rally.y);
    state.events.push({ type: 'trained', unit: type, x: u.x, y: u.y });
    return u;
  }

  function updateTraining(state) {
    for (const b of state.buildings) {
      if (!b.built || !b.queue.length) continue;
      b.trainT += DT();
      const type = b.queue[0];
      if (b.trainT >= CP.UNIT_TYPES[type].build) {
        b.trainT = 0;
        b.queue.shift();
        spawnFrom(state, b, type);
      }
    }
  }

  // ---- Placing buildings ------------------------------------------------

  /** Whether a building of `type` can stand with its top-left tile at (x, y). */
  function canPlace(state, type, x, y, builder) {
    const size = CP.BUILDING_TYPES[type].size;
    for (let yy = y; yy < y + size; yy++)
      for (let xx = x; xx < x + size; xx++) {
        if (!CP.walkable(state.map, xx, yy)) return false;
        if (state.fog[yy * state.map.w + xx] === CP.FOG.HIDDEN) return false;
      }
    for (const u of state.units) {
      if (u.hidden || u === builder) continue;
      if (u.x > x - 0.2 && u.x < x + size + 0.2 && u.y > y - 0.2 && u.y < y + size + 0.2) return false;
    }
    return true;
  }

  /** Lays out a building site, pays for it and sends the settlers to build it. */
  function placeBuilding(state, type, x, y, builders) {
    const def = CP.BUILDING_TYPES[type];
    if (!canAfford(state, def.cost)) return null;
    if (!canPlace(state, type, x, y, builders[0])) return null;
    pay(state, def.cost);
    const b = CP.addBuilding(state, type, x, y, false);
    // A builder standing on the site steps aside.
    for (const u of builders) {
      if (CP.distToRect(u.x, u.y, x, y, b.size) === 0) {
        const t = CP.nearestWalkable(state.map, Math.floor(u.x), Math.floor(u.y));
        if (t) { u.x = u.px = t.x + 0.5; u.y = u.py = t.y + 0.5; }
      }
      CP.leaveWork(state, u);
      CP.stop(u);
      u.order = { type: 'build', buildingId: b.id };
    }
    return b;
  }

  function updateEconomy(state) {
    updateTraining(state);
  }

  Object.assign(CP, {
    nodeResource, nearestDepot, exitDeposit, popCap, popUsed, canAfford,
    trainBlocker, train, cancelTrain, canPlace, placeBuilding, updateEconomy,
  });
})(window.CP = window.CP || {});

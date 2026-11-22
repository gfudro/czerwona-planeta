// Fighting, creatures (worms, Mabmia) and worm nests.
// Every blow lands: damage = attack roll − target defense, at least 1.
(function (CP) {
  'use strict';

  const DT = () => CP.DT();
  const diceCache = new Map();

  /** '1k2-1' -> { n: 1, sides: 2, bonus: -1 }; '4' -> { n: 0, sides: 0, bonus: 4 }. */
  function parseDice(spec) {
    let d = diceCache.get(spec);
    if (d) return d;
    const m = /^(\d+)k(\d+)([+-]\d+)?$/.exec(spec);
    d = m ? { n: +m[1], sides: +m[2], bonus: m[3] ? +m[3] : 0 } : { n: 0, sides: 0, bonus: +spec };
    diceCache.set(spec, d);
    return d;
  }

  function rollAttack(state, spec) {
    const d = parseDice(spec);
    return (d.n ? CP.roll(state.rng, d.n, d.sides) : 0) + d.bonus;
  }

  function damage(state, attacker, target) {
    const roll = rollAttack(state, CP.UNIT_TYPES[attacker.type].attack);
    const dmg = Math.max(1, roll - CP.UNIT_TYPES[target.type].defense);
    target.hearts -= dmg;
    target.hitBy = attacker.id;
    state.events.push({ type: 'dmg', id: target.id, x: target.x, y: target.y, amount: dmg, owner: target.owner });
    // A blow interrupts a settler filling a nest: the nest starts over.
    if (target.order && target.order.type === 'fill') {
      const nest = CP.nestById(state, target.order.nestId);
      if (nest) nest.progress = 0;
    }
    // A creature hit from afar turns on whoever hit it.
    if (target.owner === 'wild' && (!target.order || target.order.type !== 'attack')) {
      target.order = { type: 'attack', targetId: attacker.id };
    }
  }

  function canAttack(a, t) {
    if (!t || t.hearts <= 0 || t.hidden) return false;
    if (a.owner === 'player') return t.owner === 'wild';
    if (a.owner === 'wild') return t.owner === 'player';
    return false;
  }

  Object.assign(CP.ORDERS, {
    attack(state, u) {
      const t = CP.unitById(state, u.order.targetId);
      if (!canAttack(u, t)) { u.order = null; CP.stop(u); return; }
      // Creatures give up the chase far from their nest.
      if (u.owner === 'wild' && Math.hypot(u.x - u.home.x, u.y - u.home.y) > CP.NESTS.leash) {
        u.order = null;
        CP.setPath(state, u, Math.floor(u.home.x), Math.floor(u.home.y));
        u.order = { type: 'move' };
        return;
      }
      // Our units don't chase what they can't see.
      if (u.owner === 'player' && !CP.isVisible(state, t.x, t.y)) { u.order = null; CP.stop(u); return; }
      const def = CP.UNIT_TYPES[u.type];
      const reach = def.range <= 1 ? 0.95 : def.range + 0.4;
      if (!CP.approachUnit(state, u, t, reach)) return;
      if (Math.abs(t.x - u.x) > 0.05) u.facing = t.x > u.x ? 1 : -1;
      if (u.cd > 0) return;
      u.cd = def.cooldown;
      u.lunge = 0.2;
      if (def.range > 1) state.events.push({ type: 'shot', from: u.id, x0: u.x, y0: u.y, x1: t.x, y1: t.y });
      damage(state, u, t);
    },

    tame(state, u) {
      const m = CP.unitById(state, u.order.targetId);
      if (!m) { u.order = null; return; }
      if (!CP.approachUnit(state, u, m, 1.2)) return;
      m.followId = u.id;
      CP.stop(m);
      m.order = null;
      state.events.push({ type: 'tamed', id: m.id, x: m.x, y: m.y });
      u.order = null;
    },

    fill(state, u) {
      const nest = CP.nestById(state, u.order.nestId);
      if (!nest) { u.order = null; u.work = 0; return; }
      const at = CP.approachRect(state, u, nest.x, nest.y, 1);
      if (at === null) { u.order = null; return; }
      if (!at) return;
      u.facing = nest.x + 0.5 > u.x ? 1 : -1;
      u.work += DT();
      nest.progress += DT();
      if (nest.progress >= CP.NESTS.fillTime) {
        state.nests = state.nests.filter((n) => n !== nest);
        CP.setBlocked(state.map, nest.x, nest.y, 1, 0);
        state.events.push({ type: 'filled', x: nest.x + 0.5, y: nest.y + 0.5 });
        for (const o of state.units) if (o.order && o.order.type === 'fill' && o.order.nestId === nest.id) { o.order = null; o.work = 0; }
      }
    },
  });

  /** Nearest enemy of `u` within `radius` tiles that we may attack, or null. */
  function nearestEnemy(state, u, radius, mustSee) {
    let best = null, bd = radius;
    for (const t of state.units) {
      if (!canAttack(u, t)) continue;
      if (mustSee && !CP.isVisible(state, t.x, t.y)) continue;
      const d = Math.hypot(t.x - u.x, t.y - u.y);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  function randomTileNear(state, cx, cy, r) {
    for (let k = 0; k < 8; k++) {
      const x = Math.floor(cx + (CP.nextFloat(state.rng) * 2 - 1) * r);
      const y = Math.floor(cy + (CP.nextFloat(state.rng) * 2 - 1) * r);
      if (CP.walkable(state.map, x, y)) return { x, y };
    }
    return null;
  }

  function wanderNear(state, u, r, pauseMin, pauseMax) {
    if (u.path.length) return;
    u.wanderT = (u.wanderT || 0) - DT();
    if (u.wanderT > 0) return;
    u.wanderT = pauseMin + CP.nextFloat(state.rng) * (pauseMax - pauseMin);
    const t = randomTileNear(state, u.home.x, u.home.y, r);
    if (t) CP.setPath(state, u, t.x, t.y);
  }

  function updateWorm(state, u) {
    const busy = u.order && u.order.type === 'attack';
    // Look around twice a second.
    if (!busy && (state.tick + u.id) % 10 === 0) {
      const t = nearestEnemy(state, u, CP.UNIT_TYPES[u.type].sight, false);
      if (t && Math.hypot(u.x - u.home.x, u.y - u.home.y) < CP.NESTS.leash) {
        CP.stop(u);
        u.order = { type: 'attack', targetId: t.id };
        return;
      }
    }
    if (!u.order) wanderNear(state, u, 3, 1.5, 4);
  }

  function updateMabmia(state, u) {
    const lead = u.followId != null ? CP.unitById(state, u.followId) : null;
    if (u.followId != null && !lead) u.followId = null;
    if (lead) {
      u.home = { x: lead.x, y: lead.y };
      if (lead.hidden) return;
      const d = Math.hypot(lead.x - u.x, lead.y - u.y);
      if (d > CP.MABMIA.followDistance + 0.6) {
        u.repathT -= DT();
        if (!u.path.length || u.repathT <= 0) {
          u.repathT = 0.6;
          CP.setPath(state, u, Math.floor(lead.x), Math.floor(lead.y));
        }
      } else if (d < CP.MABMIA.followDistance) {
        CP.stop(u);
      }
      return;
    }
    wanderNear(state, u, CP.MABMIA.wanderRadius, 2, 5);
  }

  /** Our fighters standing idle attack enemies they can see. Settlers don't. */
  function autoAcquire(state, u) {
    if (u.order || u.type === 'settler' || (state.tick + u.id) % 5 !== 0) return;
    const t = nearestEnemy(state, u, CP.UNIT_TYPES[u.type].sight, true);
    if (t) u.order = { type: 'attack', targetId: t.id };
  }

  // ---- Nests --------------------------------------------------------------

  function addNest(state, x, y, opts = {}) {
    const n = { id: state.nextId++, x, y, progress: 0, spawned: [], nextSpawn: opts.firstSpawn ?? CP.NESTS.firstSpawn, spawns: 0, bigAt: opts.bigAt ?? -1 };
    CP.setBlocked(state.map, x, y, 1, 1);
    state.nests.push(n);
    return n;
  }

  function updateNests(state) {
    for (const n of state.nests) {
      if (state.time < n.nextSpawn) continue;
      n.spawned = n.spawned.filter((id) => CP.unitById(state, id));
      n.nextSpawn = state.time + CP.NESTS.interval;
      if (n.spawned.length >= CP.NESTS.maxAlive) continue;
      const big = n.spawns === n.bigAt;
      const spots = CP.goalTiles(state.map, n.x, n.y + 1, 1);
      if (!spots.length) continue;
      const w = CP.addUnit(state, big ? 'wormBig' : 'wormSmall', spots[0].x + 0.5, spots[0].y + 0.5);
      w.home = { x: n.x + 0.5, y: n.y + 1 };
      w.emerge = 0.6; // drawing: digging out of the ground
      n.spawned.push(w.id);
      n.spawns++;
      state.events.push({ type: 'spawn', id: w.id, x: w.x, y: w.y });
    }
  }

  function updateCreatures(state) {
    updateNests(state);
    for (const u of state.units) {
      if (u.emerge > 0) u.emerge -= DT();
      if (u.type === 'wormSmall' || u.type === 'wormBig') updateWorm(state, u);
      else if (u.type === 'mabmia') updateMabmia(state, u);
      else if (u.owner === 'player') autoAcquire(state, u);
    }
  }

  /** Removes units with no hearts left, leaving a puff of dust. */
  function cleanupDead(state) {
    if (!state.units.some((u) => u.hearts <= 0)) return;
    state.units = state.units.filter((u) => {
      if (u.hearts > 0) return true;
      state.events.push({ type: 'death', id: u.id, x: u.x, y: u.y, unit: u.type, owner: u.owner });
      return false;
    });
  }

  Object.assign(CP, { parseDice, rollAttack, addNest, updateCreatures, cleanupDead, nearestEnemy });
})(window.CP = window.CP || {});

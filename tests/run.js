// Headless checks of the simulation. Run: node tests/run.js
// Loads the browser scripts into a sandbox with a fake `window`.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const store = {};
const ctx = { window: {}, console, Math, JSON, localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } } };
vm.createContext(ctx);
for (const f of ['rng', 'data', 'strings', 'pixel', 'map', 'path', 'sim', 'econ', 'combat', 'missions', 'intro']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'src', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
}
const CP = ctx.window.CP;

let failed = 0;
function check(name, ok, info) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`);
  if (!ok) failed++;
}

function run(state, seconds) {
  for (let i = 0; i < seconds * CP.SIM_HZ; i++) CP.tick(state);
}

/**
 * Plays a mission like a simple player. 'march': the starting army walks to
 * the goal. 'play': settlers gather, buildings train and upgrade until
 * `attackAt` seconds, then the whole army goes; at a shielded boss it beats
 * the guard first.
 */
function playMission(id, mode, attackAt = 240) {
  store['czerwona-planeta-postep'] = JSON.stringify({ won: [1, 2, 3, 4, 5], hero: { level: 3, xp: 7 } });
  const s = CP.createMission(id);
  const routes = {
    3: [[14, 38], [22, 33], [28, 27], [36, 22], [44, 16], [50, 10], [55, 7]],
    5: [[14, 38], [22, 32], [30, 27], [38, 22], [44, 21], [50, 16], [52, 11]],
    6: [[14, 40], [22, 38], [30, 33], [36, 25], [40, 18], [47, 13], [52, 10]],
  }[id];
  const fighters = () => s.units.filter((u) => u.owner === 'player' && u.type !== 'settler' && !(u.down > 0));
  const econ = () => {
    const settlers = s.units.filter((u) => u.type === 'settler');
    const crystals = s.nodes.filter((n) => n.kind === 'crystal' && n.amount > 0), wrecks = s.nodes.filter((n) => n.kind === 'wreck' && n.amount > 0);
    settlers.forEach((u, i) => {
      if (u.order) return;
      const list = i === 0 && wrecks.length ? wrecks : crystals.length ? crystals : wrecks;
      if (!list.length) return;
      const n = list.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y))[0];
      CP.orderSmart(s, [u.id], n.x + 0.5, n.y + 0.5);
    });
    for (const [bt, up] of [['workshop', 'swords'], ['forge', 'barrels'], ['dome', 'infirmary'], ['lander', 'picks']]) {
      const b = s.buildings.find((o) => o.type === bt && o.built);
      if (b && !s.upg.chosen[bt]) CP.startUpgrade(s, b, up);
    }
    const ws = s.buildings.find((o) => o.type === 'workshop'), fg = s.buildings.find((o) => o.type === 'forge');
    for (const t of ['infantry', 'rifleman', 'cannon', 'infantry', 'rifleman']) {
      const b = t === 'cannon' ? fg : ws;
      if (b && b.built && b.queue.length < 2) CP.train(s, b, t);
    }
    const l = s.buildings.find((o) => o.type === 'lander');
    if (settlers.length < 4 && !l.queue.length) CP.train(s, l, 'settler');
  };
  const play = mode === 'play';
  const go = (sec) => { for (let i = 0; i < sec * CP.SIM_HZ && !s.mission.result; i++) { CP.tick(s); s.events.length = 0; if (play && i % 20 === 0) econ(); } };
  if (play) go(attackAt);
  for (const [x, y] of routes) { CP.orderMove(s, fighters(), x, y); go(25); }
  if (s.rocket) {
    for (let k = 0; k < 3; k++) { CP.orderMove(s, fighters(), s.rocket.x + 1, s.rocket.y + 3); go(15); }
    for (let k = 0; k < 20 && !s.mission.result; k++) {
      for (const u of s.units.filter((o) => o.type === 'settler' && !o.order)) CP.orderSmart(s, [u.id], s.rocket.x + 1, s.rocket.y + 1);
      go(10);
    }
  }
  for (let k = 0; k < 16 && !s.mission.result && s.bossId; k++) {
    const b = CP.unitById(s, s.bossId);
    if (!b) break;
    let t = b;
    if (b.shield) {
      const f = fighters()[0] || b;
      const g = s.units.filter((o) => o !== b && o.group === b.group && o.hearts > 0).sort((x, y) => Math.hypot(x.x - f.x, x.y - f.y) - Math.hypot(y.x - f.x, y.y - f.y));
      if (g[0]) t = g[0];
    }
    if (CP.isVisible(s, t.x, t.y)) CP.orderSmart(s, fighters().map((u) => u.id), t.x, t.y, t);
    else CP.orderMove(s, fighters(), Math.floor(t.x), Math.floor(t.y));
    go(10);
  }
  return s;
}

function allArrived(state) {
  return state.units.every((u) => u.path.length === 0 && !u.order);
}

// 1. Path avoids rock and never cuts a corner.
{
  const map = CP.createMap(5, 5);
  map.terrain[1 * 5 + 2] = CP.T.ROCK;
  map.terrain[2 * 5 + 2] = CP.T.ROCK;
  map.terrain[3 * 5 + 2] = CP.T.ROCK;
  const p = CP.findPath(map, 0, 2, 4, 2);
  const ok = p && p.every((t) => CP.walkable(map, t.x, t.y)) && p[p.length - 1].x === 4 && p[p.length - 1].y === 2;
  check('A* goes around a wall', ok, p && p.map((t) => `${t.x},${t.y}`).join(' '));
}

// 2. Unreachable goal: walk to the nearest reachable spot instead of nothing.
{
  const map = CP.createMap(6, 3);
  for (let y = 0; y < 3; y++) map.terrain[y * 6 + 3] = CP.T.ROCK;
  const p = CP.findPath(map, 0, 1, 5, 1);
  check('cut-off goal gives a partial path', p && p.length > 0 && p[p.length - 1].x === 2);
}

// 3. Twelve units cross the test map through the 1-tile pass, both ways at once.
{
  const state = CP.createSandbox(1);
  const map = state.map;
  check('pass is one tile wide', CP.walkable(map, 24, 34) && !CP.walkable(map, 24, 33) && !CP.walkable(map, 24, 35));
  const ids = state.units.map((u) => u.id);
  const groupA = ids.slice(0, 6), groupB = ids.slice(6);
  // Send group B to the far side first, then both groups through the pass in opposite directions.
  CP.orderMove(state, groupB.map((id) => CP.unitById(state, id)), 30, 34);
  run(state, 30);
  check('group B reached the far side', allArrived(state) && groupB.every((id) => CP.unitById(state, id).x > 26));
  CP.orderMove(state, groupA.map((id) => CP.unitById(state, id)), 30, 36);
  CP.orderMove(state, groupB.map((id) => CP.unitById(state, id)), 18, 36);
  let t = 0;
  while (!allArrived(state) && t < 60 * CP.SIM_HZ) { CP.tick(state); t++; }
  const A = groupA.map((id) => CP.unitById(state, id)), B = groupB.map((id) => CP.unitById(state, id));
  check('opposite groups cross the 1-tile pass without jamming', allArrived(state) && A.every((u) => u.x > 26) && B.every((u) => u.x < 24), `${(t / CP.SIM_HZ).toFixed(1)} s`);
  run(state, 3);
  const inRock = state.units.filter((u) => !CP.walkable(map, Math.floor(u.x), Math.floor(u.y)));
  check('nobody ends up inside rock', inRock.length === 0);
  let minD = Infinity;
  for (const a of state.units) for (const b of state.units) if (a !== b) minD = Math.min(minD, Math.hypot(a.x - b.x, a.y - b.y));
  check('standing units do not overlap', minD > CP.UNIT_RADIUS, `closest ${minD.toFixed(2)} tiles`);
}

// 4. Orders given in pause wait until the game runs.
{
  const state = CP.createSandbox(1);
  const u = state.units[0];
  const x0 = u.x;
  CP.orderMove(state, [u], 20, 40);
  check('order in pause sets a path but does not move', u.path.length > 0 && u.x === x0);
  run(state, 2);
  check('order runs after resuming', u.x !== x0);
}

// 5. Fog: starts with explored area around the base, the rest hidden.
{
  const state = CP.createSandbox(1);
  const f = state.fog;
  const vis = f.filter((v) => v === CP.FOG.VISIBLE).length;
  check('fog: base visible, far corner hidden', vis > 30 && f[1 * 48 + 46] === CP.FOG.HIDDEN);
  const u = state.units[0];
  CP.orderMove(state, [u], 40, 40);
  run(state, 30);
  const sx = Math.floor(state.units[1].x), sy = Math.floor(state.units[1].y);
  check('fog: unit far away reveals its area, base area stays visible', f[40 * 48 + 40] === CP.FOG.VISIBLE && f[sy * 48 + sx] === CP.FOG.VISIBLE);
  CP.orderMove(state, [u], 10, 40);
  run(state, 30);
  check('fog: left area becomes explored, not hidden', f[40 * 48 + 44] === CP.FOG.EXPLORED);
}

// 6. Speed of A* on the whole map.
{
  const state = CP.createSandbox(1);
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 100; i++) CP.findPath(state.map, 5, 40, 44, 3);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 100;
  check('A* across the map is fast', ms < 5, `${ms.toFixed(2)} ms`);
}


// 7. Economy: settlers gather scrap and crystals, unload at the lander, carry on by themselves.
{
  const state = CP.createMission(1);
  const [a, b] = state.units.filter((u) => u.type === 'settler');
  const wreck = state.nodes.find((n) => n.kind === 'wreck');
  const deposit = state.nodes.find((n) => n.kind === 'crystal');
  CP.orderSmart(state, [a.id], wreck.x + 1, wreck.y + 1);
  CP.orderSmart(state, [b.id], deposit.x + 1, deposit.y + 1);
  run(state, 60);
  check('settler brings scrap back from a wreck', state.gathered.scrap >= 30, `${state.gathered.scrap} scrap in 60 s`);
  check('settler brings crystals back from the deposit', state.gathered.crystals >= 30, `${state.gathered.crystals} crystals in 60 s`);
  check('resources counted', state.res.scrap === state.gathered.scrap && state.res.crystals === 50 + state.gathered.crystals);
}

// 8. Unit limit and training.
{
  const state = CP.createMission(1);
  const lander = state.buildings[0];
  check('unit limit from the lander is 4', CP.popCap(state) === 4);
  state.res.crystals = 500;
  CP.train(state, lander, 'settler');
  CP.train(state, lander, 'settler');
  check('third settler in queue is blocked by the limit', CP.trainBlocker(state, lander, 'settler') === 'pop');
  run(state, 21);
  check('two settlers trained in 20 s', state.units.filter((u) => u.type === 'settler').length === 4 && state.res.crystals === 400);
  CP.cancelTrain(state, lander, 0);
}

// 9. Building a dome raises the limit by 4.
{
  const state = CP.createMission(1);
  state.res.scrap = 60;
  const s = state.units.find((u) => u.type === 'settler');
  const spot = { x: 9, y: 44 };
  let placed = null;
  for (let dy = -4; dy <= 0 && !placed; dy++) for (let dx = 0; dx < 6 && !placed; dx++) placed = CP.placeBuilding(state, 'dome', spot.x + dx, spot.y + dy, [s]);
  check('dome placed and paid', !!placed && state.res.scrap === 0);
  run(state, 25);
  check('dome built in 20 s and limit is 8', placed && placed.built && CP.popCap(state) === 8);
}

// 10. Mission 1 can be won: play it with simple orders.
{
  const state = CP.createMission(1);
  const lander = state.buildings[0];
  const wrecks = state.nodes.filter((n) => n.kind === 'wreck');
  const deposit = state.nodes.find((n) => n.kind === 'crystal');
  const [a, b] = state.units.filter((u) => u.type === 'settler');
  CP.orderSmart(state, [a.id], wrecks[0].x, wrecks[0].y);
  CP.orderSmart(state, [b.id], wrecks[1].x, wrecks[1].y);
  let dome = null, trained = false;
  for (let t = 0; t < 600 * CP.SIM_HZ && !state.mission.result; t++) {
    CP.tick(state);
    if (!dome && state.res.scrap >= 60) {
      for (let y = 36; y < 46 && !dome; y++) for (let x = 7; x < 14 && !dome; x++) dome = CP.placeBuilding(state, 'dome', x, y, [a]);
    }
    if (dome && dome.built && !trained && state.res.crystals >= 50) { trained = CP.train(state, lander, 'settler'); }
    if (dome && dome.built && !a.order) CP.orderSmart(state, [a.id], deposit.x, deposit.y);
    if (state.units.filter((u) => u.type === 'settler').length >= 3) {
      for (const u of state.units) if (u.type === 'settler' && !u.order) CP.orderSmart(state, [u.id], deposit.x, deposit.y);
    }
    state.events.length = 0;
  }
  check('mission 1 is won', state.mission.result === 'win', `at ${state.time.toFixed(0)} s, goal ${state.mission.goal}/4`);
  check('mission 2 unlocked after winning 1', (CP.saveWin(1), CP.isUnlocked(2)));
}

// 11. Mission 2 setup and combat.
{
  const state = CP.createMission(2);
  const lander = state.buildings.find((b) => b.type === 'lander');
  const cx = lander.x + 1.5, cy = lander.y + 1.5;
  const d = state.nests.map((n) => Math.hypot(n.x - cx, n.y - cy));
  check('3 nests 12–25 tiles from the lander', state.nests.length === 3 && d.every((v) => v >= 11.5 && v <= 25.5), d.map((v) => v.toFixed(1)).join(', '));
  check('nests start hidden in the fog', state.nests.every((n) => state.fog[n.y * 48 + n.x] === CP.FOG.HIDDEN));
  check('start: 3 settlers, 2 infantry, 1 rifleman, 150/100', state.units.filter((u) => u.type === 'settler').length === 3 && state.units.filter((u) => u.type === 'infantry').length === 2 && state.units.filter((u) => u.type === 'rifleman').length === 1 && state.res.crystals === 150 && state.res.scrap === 100);
  run(state, 59);
  check('no worm before 60 s', !state.units.some((u) => u.owner === 'wild'));
  run(state, 2);
  check('first worm at 60 s', state.units.filter((u) => u.owner === 'wild').length === 1);
  // Damage rules.
  const inf = state.units.find((u) => u.type === 'infantry');
  const w = state.units.find((u) => u.owner === 'wild');
  let min = 99, max = 0;
  for (let i = 0; i < 200; i++) { const r = CP.rollAttack(state, '1k2'); min = Math.min(min, r); max = Math.max(max, r); }
  check('1k2 rolls 1..2', min === 1 && max === 2);
  check('1k2 against defense 2 always deals 1', [1, 2].every((r) => Math.max(1, r - CP.UNIT_TYPES.infantry.defense) === 1));
  // Put the worm in front of the fighters; they should notice and kill it by themselves.
  const fs = state.units.filter((u) => u.type === 'infantry' || u.type === 'rifleman');
  w.x = w.px = fs[0].x + 3; w.y = w.py = fs[0].y; w.home = { x: w.x, y: w.y };
  run(state, 20);
  check('fighters kill a small worm', !CP.unitById(state, w.id));
}

// 12. Mission 2 can be won: fighters escort settlers to each nest.
{
  const state = CP.createMission(2);
  const fighters = () => state.units.filter((u) => u.owner === 'player' && u.type !== 'settler');
  const settlers = () => state.units.filter((u) => u.type === 'settler');
  let guard = 0;
  while (state.nests.length && guard++ < 900 * CP.SIM_HZ) {
    const nest = state.nests[0];
    if (guard % 20 === 1) {
      const f = fighters().filter((u) => !u.order || u.order.type === 'move');
      if (f.length) CP.orderMove(state, f, nest.x + 0.5, nest.y + 2);
      const s = settlers()[0];
      if (s && (!s.order || s.order.type !== 'fill')) CP.orderSmart(state, [s.id], nest.x + 0.5, nest.y + 0.5);
    }
    CP.tick(state);
    state.events.length = 0;
  }
  run(state, 1);
  check('mission 2 is won', state.mission.result === 'win', `at ${state.time.toFixed(0)} s, nests left ${state.nests.length}, our units ${state.units.filter((u) => u.owner === 'player').length}`);
}

// 13. A blow on a filling settler resets the nest.
{
  const state = CP.createMission(2);
  const nest = state.nests[0];
  const s = state.units.find((u) => u.type === 'settler');
  s.x = s.px = nest.x - 0.5; s.y = s.py = nest.y + 0.5;
  CP.orderSmart(state, [s.id], nest.x + 0.5, nest.y + 0.5);
  run(state, 3);
  const before = nest.progress;
  const w = CP.addUnit(state, 'wormSmall', nest.x - 1.5, nest.y + 0.5);
  w.home = { x: nest.x, y: nest.y };
  run(state, 1.2);
  check('filling progresses, a worm bite resets it', before > 2 && nest.progress < before, `${before.toFixed(1)} -> ${nest.progress.toFixed(1)}`);
}

// 14. Mabmia: tame her and she follows.
{
  const state = CP.createMission(1);
  const m = state.units.find((u) => u.type === 'mabmia');
  const s = state.units.find((u) => u.type === 'settler');
  CP.orderMove(state, [s], m.x - 2, m.y);
  run(state, 25);
  CP.updateFog(state);
  const what = CP.orderSmart(state, [s.id], m.x, m.y - 0.3);
  run(state, 15);
  check('settler tames Mabmia', m.followId === s.id, what);
  CP.orderMove(state, [s], 8, 44);
  run(state, 30);
  check('Mabmia follows the settler', Math.hypot(m.x - s.x, m.y - s.y) < 3, Math.hypot(m.x - s.x, m.y - s.y).toFixed(1));
}


// 15. Cannon pierces armour: full 5 against the Guardian's defense 4; a rifle deals only 1.
{
  const state = CP.createSandbox(1);
  state.units = [];
  const c = CP.addUnit(state, 'cannon', 8.5, 40.5);
  const g = CP.addUnit(state, 'guardian', 12.5, 40.5);
  g.home = { x: g.x, y: g.y };
  CP.updateFog(state);
  CP.orderSmart(state, [c.id], g.x, g.y - 0.3, g);
  const dmgs = [];
  for (let i = 0; i < 6 * CP.SIM_HZ; i++) { CP.tick(state); for (const e of state.events) if (e.type === 'dmg' && e.id === g.id) dmgs.push(e.amount); state.events.length = 0; }
  check('cannon deals 5 to the Guardian', dmgs.length > 0 && dmgs.every((d) => d === 5), dmgs.join(','));
  state.units = state.units.filter((u) => u !== c);
  const r = CP.addUnit(state, 'rifleman', 8.5, 41.5);
  const g2 = CP.addUnit(state, 'guardian', 12.5, 42.5);
  g2.home = { x: g2.x, y: g2.y };
  CP.updateFog(state);
  CP.orderSmart(state, [r.id], g2.x, g2.y - 0.3, g2);
  const d2 = [];
  for (let i = 0; i < 4 * CP.SIM_HZ; i++) { CP.tick(state); for (const e of state.events) if (e.type === 'dmg' && e.id === g2.id) d2.push(e.amount); state.events.length = 0; }
  check('rifle deals 1 to the Guardian', d2.length > 0 && d2.every((d) => d === 1), d2.join(','));
}

// 16. Hero: gains levels from kills, falls instead of dying and stands up by the lander.
{
  const state = CP.createSandbox(1);
  state.units = state.units.filter((u) => u.type === 'settler');
  const h = CP.addUnit(state, 'hero', 10.5, 40.5);
  check('hero starts at level 1 with 15 hearts', h.level === 1 && h.hearts === 15);
  for (let k = 0; k < 3; k++) {
    const w = CP.addUnit(state, 'wormSmall', 11.5, 40.5);
    w.home = { x: w.x, y: w.y };
    let t = 0;
    while (CP.unitById(state, w.id) && t++ < 40 * CP.SIM_HZ) CP.tick(state);
  }
  check('hero reaches level 2 after 3 small worms', h.level === 2 && h.xp === 3 && CP.maxHearts(h) === 17, `level ${h.level}, xp ${h.xp}`);
  check('state remembers hero progress', state.hero.level === 2 && state.hero.xp === 3);
  h.hearts = 2;
  const m = CP.addUnit(state, 'crystalLord', 11.5, 40.5);
  m.home = { x: m.x, y: m.y };
  let t = 0;
  while (!(h.down > 0) && t++ < 60 * CP.SIM_HZ) CP.tick(state);
  check('hero falls, not dies', h.down > 0 && CP.unitById(state, h.id) === h);
  run(state, 2);
  check('creatures leave the fallen hero alone', !m.order || m.order.type !== 'attack' || m.order.targetId !== h.id);
  run(state, CP.HERO.downTime);
  const lander = state.buildings[0];
  check('hero stands up by the lander with full hearts', !(h.down > 0) && h.hearts === CP.maxHearts(h) && CP.distToRect(h.x, h.y, lander.x, lander.y, 3) < 3);
}

// 17. MAibawu: patrols, chases, gives up 10 tiles from its route and walks back.
{
  const state = CP.createSandbox(1);
  state.units = [];
  const route = [{ x: 30.5, y: 20.5 }, { x: 36.5, y: 20.5 }];
  const m = CP.addUnit(state, 'maibawu', 30.5, 20.5);
  m.route = route; m.home = route[0];
  run(state, 8);
  check('MAibawu walks its patrol route', m.x > 32 || m.routeAt > 0, `x ${m.x.toFixed(1)}`);
  const s = CP.addUnit(state, 'settler', m.x, 25.5);
  run(state, 1);
  check('MAibawu attacks a settler 5 tiles away', m.order && m.order.type === 'attack');
  // The settler runs far south; the MAibawu turns back.
  CP.orderMove(state, [s], 33, 44);
  run(state, 20);
  check('MAibawu gives up the chase and goes back', CP.distFromHome(m) < 3, CP.distFromHome(m).toFixed(1));
}

// 18. A Guardian by a deposit stops settlers mining it until it falls.
{
  const state = CP.createSandbox(1);
  state.units = state.units.filter((u) => u.type === 'settler').slice(0, 1);
  const n = CP.addNode(state, 'crystal', 12, 38, 1500);
  const g = CP.addUnit(state, 'guardian', 14.5, 38.5);
  g.home = { x: g.x, y: g.y };
  n.guardId = g.id;
  const s = state.units[0];
  CP.updateFog(state);
  CP.orderSmart(state, [s.id], 12.5, 38.5);
  let guarded = false;
  for (let i = 0; i < 20 * CP.SIM_HZ; i++) { CP.tick(state); if (state.events.some((e) => e.type === 'guarded')) guarded = true; state.events.length = 0; }
  check('settler cannot mine a guarded deposit', guarded && n.amount === 1500);
  g.hearts = 0;
  run(state, 0.1);
  CP.orderSmart(state, [s.id], 12.5, 38.5);
  run(state, 20);
  check('after the Guardian falls the deposit can be mined', n.amount < 1500);
}


// 19. Mission 3: the starting army can't do it alone; a built-up army clears the way and settlers take the rocket apart.
{
  const march = playMission(3, 'march');
  check('mission 3 is not won by the starting army alone', march.mission.result !== 'win');
  const play = playMission(3, 'play', 300);
  check('mission 3 is won after training and upgrades', play.mission.result === 'win', `t=${play.time | 0}`);
}

// 20. Mission 4: forge, cannon, Guardian down, crystals from the big deposit.
{
  const state = CP.createMission(4);
  const settlers = () => state.units.filter((u) => u.type === 'settler');
  const lander = state.buildings.find((b) => b.type === 'lander');
  let f = null;
  for (let y = lander.y - 6; y < lander.y + 2 && !f; y++)
    for (let x = lander.x + 4; x < lander.x + 12 && !f; x++) if (CP.canPlace(state, 'forge', x, y)) f = CP.placeBuilding(state, 'forge', x, y, settlers());
  check('forge can be placed in mission 4', !!f);
  run(state, 30);
  check('forge built', f && f.built);
  CP.train(state, f, 'cannon');
  run(state, 27);
  const cannon = state.units.find((u) => u.type === 'cannon');
  check('cannon trained', !!cannon);
  const g = CP.unitById(state, state.guardId);
  const fighters = state.units.filter((u) => u.owner === 'player' && u.type !== 'settler');
  CP.orderMove(state, fighters, g.x - 4, g.y + 2);
  run(state, 30);
  CP.orderSmart(state, fighters.map((u) => u.id), g.x, g.y - 0.3, g);
  run(state, 30);
  check('Guardian defeated', !CP.unitById(state, state.guardId));
  const big = state.bigNode;
  CP.orderSmart(state, settlers().map((u) => u.id), big.x + 1, big.y + 1);
  run(state, 200);
  check('mission 4 is won', state.mission.result === 'win', `goal ${state.mission.goal}, mined ${big.max - big.amount}`);
}

// 21. Mission 5: the queen is shielded by her guard; the starting army loses, a built-up army wins.
{
  const state = CP.createMission(5);
  const q = CP.unitById(state, state.bossId);
  run(state, 0.1);
  check('mission 5: the queen starts behind a shield', q.shield === true);
  const march = playMission(5, 'march');
  check('mission 5 is not won by the starting army alone', march.mission.result !== 'win');
  const play = playMission(5, 'play', 300);
  check('mission 5 is won after training and upgrades', play.mission.result === 'win', `t=${play.time | 0}`);
  check('the queen called her guard', play.queenCalled);
}

// 22. Mission 6: caves with lava, the Lord with Guardians and MAibawu around him.
{
  const state = CP.createMission(6);
  check('mission 6: cave map with lava, four Guardians, the Lord', state.map.theme === 'cave' && state.map.terrain.includes(CP.T.LAVA) && state.units.filter((u) => u.type === 'guardian').length === 4 && !!CP.unitById(state, state.bossId));
  const lord = CP.unitById(state, state.bossId);
  check('the Lord can be reached from the base', !!CP.findPath(state.map, 8, 43, Math.floor(lord.x) - 1, Math.floor(lord.y) + 1));
  const march = playMission(6, 'march');
  check('mission 6 is not won by the starting army alone', march.mission.result !== 'win');
  const play = playMission(6, 'play', 300);
  check('mission 6 is won after training and upgrades', play.mission.result === 'win', `t=${play.time | 0}`);
}

// 23. Upgrades: a choice locks the other one out; Swords add to the infantry's attack; a shield stops all harm.
{
  const state = CP.createMission(5);
  const ws = state.buildings.find((b) => b.type === 'workshop');
  check('Swords can be started', CP.startUpgrade(state, ws, 'swords'));
  check('then Shields are locked out', CP.upgradeBlocker(state, ws, 'shields') === 'chosen');
  run(state, CP.UPGRADES.swords.time + 1);
  check('Swords give infantry +2 attack', CP.upgradeBonus(state, 'infantry', 'attack') === 2 && CP.upgradeBonus(state, 'rifleman', 'attack') === 0);
  const q = CP.unitById(state, state.bossId);
  const inf = state.units.find((u) => u.type === 'infantry');
  const before = q.hearts;
  q.shield = true;
  for (let i = 0; i < 5; i++) CP.damage(state, inf, q);
  check('a shielded boss takes no harm', q.hearts === before);
}

// ---- Intros: every shot looks at something that is really on its map ----
{
  store['czerwona-planeta-postep'] = JSON.stringify({ won: [1, 2, 3, 4, 5], hero: { level: 1, xp: 0 } });
  for (const key of ['game', 1, 2, 3, 4, 5, 6]) {
    const def = CP.INTROS[key];
    const id = key === 'game' ? def.mission : key;
    const shots = key === 'game' ? def.shots : def;
    const s = CP.createMission(id);
    s.reveal = true;
    CP.updateFog(s);
    const missing = shots.filter((sh) => sh.at && !(
      s.buildings.some((o) => o.type === sh.at) || s.nodes.some((o) => o.kind === sh.at) ||
      (sh.at === 'nest' && s.nests.length) || (sh.at === 'lava' && s.map.terrain.includes(CP.T.LAVA)) ||
      s.units.some((o) => o.type === sh.at)));
    check(`intro ${key}: every shot finds its target`, missing.length === 0, missing.map((m) => m.at).join(','));
    check(`intro ${key}: sentences are short`, shots.every((sh) => sh.text && sh.text.split(' ').length <= 9));
    // While the intro plays the world runs; nothing may end or get hurt, and the fog stays lifted.
    const mine = s.units.filter((u) => u.owner === 'player').map((u) => u.hearts).join(',');
    const ends = [];
    for (let i = 0; i < 40 * CP.SIM_HZ; i++) { CP.tick(s); for (const e of s.events) if (e.type === 'win' || e.type === 'lose' || e.type === 'spotted') ends.push(e.type); s.events.length = 0; }
    check(`intro ${key}: 40 s of intro world is calm`, !ends.length && s.units.filter((u) => u.owner === 'player').map((u) => u.hearts).join(',') === mine && s.fog.every((f) => f === CP.FOG.VISIBLE), ends.join(','));
  }
}

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);

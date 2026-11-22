// Headless checks of the simulation. Run: node tests/run.js
// Loads the browser scripts into a sandbox with a fake `window`.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {}, console, Math };
vm.createContext(ctx);
for (const f of ['rng', 'data', 'strings', 'pixel', 'map', 'path', 'sim']) {
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

function allArrived(state) {
  return state.units.every((u) => u.path.length === 0);
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
  CP.orderMove(state, groupB, 30, 34);
  run(state, 30);
  check('group B reached the far side', allArrived(state) && groupB.every((id) => CP.unitById(state, id).x > 26));
  CP.orderMove(state, groupA, 30, 36);
  CP.orderMove(state, groupB, 18, 36);
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
  CP.orderMove(state, [u.id], 20, 40);
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
  CP.orderMove(state, [u.id], 40, 40);
  run(state, 30);
  const sx = Math.floor(state.units[1].x), sy = Math.floor(state.units[1].y);
  check('fog: unit far away reveals its area, base area stays visible', f[40 * 48 + 40] === CP.FOG.VISIBLE && f[sy * 48 + sx] === CP.FOG.VISIBLE);
  CP.orderMove(state, [u.id], 10, 40);
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

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);

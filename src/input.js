// Mouse and keyboard, Warcraft 2 style: left click and box select,
// right click does the right thing, arrows and screen edge scroll,
// space pauses, Ctrl + digit for groups. All of it works during pause.
(function (CP) {
  'use strict';

  const TP = CP.TILE_PX;
  const S = CP.ART_SCALE;
  const DRAG_PX = 6;

  function createView() {
    return {
      cam: { x: 0, y: 0 },
      w: 0, h: 0, // size of the map view in CSS pixels
      bottomPad: 0, // map can scroll this far past its bottom edge (room for the HUD)
      selected: new Set(),
      selectedBuilding: null,
      selectedThing: null, // { kind: 'node' | 'nest', id }: a deposit, wreck or nest, just to look at
      placing: null, // { type, builderId, tile } while choosing where to build
      hover: null,
      box: null,
      groups: {},
      mouse: { x: -1, y: -1, inside: false, cx: -1, cy: -1 },
      keys: new Set(),
      lastGroupKey: { key: null, t: 0 },
    };
  }

  function clampCamera(view, map) {
    const mw = map.w * TP, mh = map.h * TP;
    const maxX = mw - view.w, maxY = mh - view.h + view.bottomPad;
    view.cam.x = maxX < 0 ? maxX / 2 : Math.max(0, Math.min(maxX, view.cam.x));
    view.cam.y = maxY < 0 ? maxY / 2 : Math.max(0, Math.min(maxY, view.cam.y));
    view.cam.x = Math.round(view.cam.x);
    view.cam.y = Math.round(view.cam.y);
  }

  function centerOn(view, map, tx, ty) {
    view.cam.x = tx * TP - view.w / 2;
    view.cam.y = ty * TP - (view.h - view.bottomPad) / 2;
    clampCamera(view, map);
  }

  /** Scrolls the camera by keys and screen edge; called every frame with real time. */
  function updateCamera(view, map, dt) {
    let dx = 0, dy = 0;
    const k = view.keys;
    if (k.has('ArrowLeft')) dx -= 1;
    if (k.has('ArrowRight')) dx += 1;
    if (k.has('ArrowUp')) dy -= 1;
    if (k.has('ArrowDown')) dy += 1;
    const m = view.mouse, E = CP.EDGE_SCROLL_PX;
    if (m.inside && !view.box) {
      if (m.cx <= E) dx -= 1;
      if (m.cx >= window.innerWidth - 1 - E) dx += 1;
      if (m.cy <= E) dy -= 1;
      if (m.cy >= window.innerHeight - 1 - E) dy += 1;
    }
    if (!dx && !dy) return;
    const len = Math.hypot(dx, dy);
    view.cam.x += (dx / len) * CP.CAMERA_SPEED * dt;
    view.cam.y += (dy / len) * CP.CAMERA_SPEED * dt;
    clampCamera(view, map);
  }

  /** The unit under a screen point (the one in front wins), or null. Only what you can see. */
  function unitAt(state, view, sx, sy, alpha) {
    let best = null, bestY = -Infinity;
    for (const u of state.units) {
      if (u.hidden) continue;
      if (u.owner !== 'player' && !CP.isVisible(state, u.x, u.y)) continue;
      const meta = CP.SPRITE_META[u.type];
      const p = CP.unitScreenPos(u, alpha, view.cam);
      if (sx >= p.x - meta.hitW * S && sx <= p.x + meta.hitW * S && sy >= p.y - meta.hitH * S && sy <= p.y + 6 && p.y > bestY) {
        best = u;
        bestY = p.y;
      }
    }
    return best;
  }

  /** The building under a screen point, including the part of its picture above the footprint. */
  function buildingAt(state, view, sx, sy) {
    const t = screenToTile(view, sx, sy);
    for (const b of state.buildings) {
      const rise = (CP.SPRITE_RISE[b.type] || 0) / CP.ART_TILE;
      if (t.x >= b.x && t.x < b.x + b.size && t.y >= b.y - rise && t.y < b.y + b.size) return b;
    }
    return null;
  }

  /** A deposit, wreck or nest under a screen point (including the picture above it), if explored. */
  function thingAtScreen(state, view, sx, sy) {
    const t = screenToTile(view, sx, sy);
    const explored = (x, y, size) => {
      for (let yy = y; yy < y + size; yy++)
        for (let xx = x; xx < x + size; xx++)
          if (CP.inBounds(state.map, xx, yy) && state.fog[yy * state.map.w + xx] !== CP.FOG.HIDDEN) return true;
      return false;
    };
    const hit = (x, y, size, rise) => t.x >= x && t.x < x + size && t.y >= y - rise / CP.ART_TILE && t.y < y + size && explored(x, y, size);
    for (const n of state.nodes) if (hit(n.x, n.y, n.size, CP.SPRITE_RISE[n.kind] || 0)) return { kind: 'node', id: n.id };
    for (const n of state.nests) if (hit(n.x, n.y, 1, CP.SPRITE_RISE.nest)) return { kind: 'nest', id: n.id };
    return null;
  }

  function screenToTile(view, sx, sy) {
    return { x: (sx + view.cam.x) / TP, y: (sy + view.cam.y) / TP };
  }

  /** Top-left tile for a building of `type` centred under the mouse. */
  function placingTile(view, type) {
    const size = CP.BUILDING_TYPES[type].size;
    const t = screenToTile(view, view.mouse.x, view.mouse.y);
    return { x: Math.floor(t.x - size / 2 + 0.5), y: Math.floor(t.y - size / 2 + 0.5) };
  }

  function selectUnits(view, ids) {
    view.selected = new Set(ids);
    view.selectedBuilding = null;
    view.selectedThing = null;
    view.placing = null;
  }

  /**
   * Wires up all input. `game` gives access to the live state and actions:
   * { state, view, renderer, alpha(), togglePause(), now(), active() }.
   */
  function attachInput(canvas, game) {
    const { view } = game;
    let drag = null; // { x0, y0 } while the left button is down on the map

    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    function rightClick(sx, sy) {
      const state = game.state;
      const t = screenToTile(view, sx, sy);
      if (view.placing) { view.placing = null; return; }
      if (view.selectedBuilding != null) {
        const b = CP.buildingById(state, view.selectedBuilding);
        if (b && CP.BUILDING_TYPES[b.type].trains) {
          b.rally = { x: t.x, y: t.y };
          CP.sound.play('order');
          CP.addMarker(game.renderer, t.x, t.y, game.now());
        }
        return;
      }
      if (!view.selected.size) return;
      const what = CP.orderSmart(state, [...view.selected], t.x, t.y, unitAt(state, view, sx, sy, game.alpha()));
      if (what) CP.addMarker(game.renderer, t.x, t.y, game.now(), what === 'attack' ? '255,64,48' : undefined);
      if (what) CP.sound.play(what === 'attack' ? 'attackOrder' : 'order');
    }

    function place() {
      const g = view.placing;
      const builder = CP.unitById(game.state, g.builderId);
      const settlers = [...view.selected].map((id) => CP.unitById(game.state, id)).filter((u) => u && u.type === 'settler');
      const builders = builder ? [builder, ...settlers.filter((u) => u !== builder)] : settlers;
      if (!builders.length) { view.placing = null; return; }
      const tile = placingTile(view, g.type);
      const b = CP.placeBuilding(game.state, g.type, tile.x, tile.y, builders);
      if (b) { view.placing = null; CP.sound.play('order'); }
    }

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      if (!game.active()) return;
      const p = local(e);
      // Right button, or Ctrl + click on a Mac trackpad.
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        rightClick(p.x, p.y);
        return;
      }
      if (e.button !== 0) return;
      if (view.placing) { place(); return; }
      drag = { x0: p.x, y0: p.y, shift: e.shiftKey };
    });

    window.addEventListener('mousemove', (e) => {
      view.mouse.cx = e.clientX;
      view.mouse.cy = e.clientY;
      view.mouse.inside = true;
      const p = local(e);
      view.mouse.x = p.x;
      view.mouse.y = p.y;
      if (drag && Math.hypot(p.x - drag.x0, p.y - drag.y0) > DRAG_PX) {
        view.box = { x0: drag.x0, y0: drag.y0, x1: p.x, y1: p.y };
      }
    });

    document.addEventListener('mouseleave', () => { view.mouse.inside = false; });
    window.addEventListener('blur', () => { view.mouse.inside = false; view.keys.clear(); });

    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0 || !drag) return;
      const state = game.state;
      const p = local(e);
      const alpha = game.alpha();
      const add = drag.shift;
      if (view.box) {
        const b = view.box;
        const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
        const hit = state.units.filter((u) => {
          if (u.owner !== 'player' || u.hidden) return false;
          const q = CP.unitScreenPos(u, alpha, view.cam);
          const cy = q.y - 10 * S;
          return q.x >= x0 && q.x <= x1 && cy >= y0 && cy <= y1;
        });
        if (add) hit.forEach((u) => view.selected.add(u.id));
        else selectUnits(view, hit.map((u) => u.id));
        view.selectedBuilding = null;
      } else {
        const u = unitAt(state, view, p.x, p.y, alpha);
        if (add && u && u.owner === 'player') {
          if (view.selected.has(u.id)) view.selected.delete(u.id);
          else view.selected.add(u.id);
          view.selectedBuilding = null;
        } else if (u) {
          selectUnits(view, [u.id]);
        } else {
          const b = buildingAt(state, view, p.x, p.y);
          selectUnits(view, []);
          if (b) view.selectedBuilding = b.id;
          else view.selectedThing = thingAtScreen(state, view, p.x, p.y);
        }
      }
      // A little "yes?" when our units get selected.
      if (view.selected.size && [...view.selected].some((id) => { const s = CP.unitById(state, id); return s && s.owner === 'player'; })) CP.sound.play('select');
      else if (view.selectedBuilding != null) CP.sound.play('click');
      view.box = null;
      drag = null;
    });

    // Double click: every unit of that kind on screen.
    canvas.addEventListener('dblclick', (e) => {
      const p = local(e);
      const alpha = game.alpha();
      const u = unitAt(game.state, view, p.x, p.y, alpha);
      if (!u || u.owner !== 'player') return;
      for (const o of game.state.units) {
        if (o.type !== u.type || o.owner !== 'player' || o.hidden) continue;
        const q = CP.unitScreenPos(o, alpha, view.cam);
        if (q.x >= 0 && q.y >= 0 && q.x <= view.w && q.y <= view.h) view.selected.add(o.id);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key.startsWith('Arrow')) {
        view.keys.add(e.key);
        e.preventDefault();
        return;
      }
      if (!game.active()) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) game.togglePause();
        return;
      }
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey) {
        CP.toggleFullscreen();
        return;
      }
      if (e.key === 'Escape') {
        if (view.placing) view.placing = null;
        else selectUnits(view, []);
        return;
      }
      const digit = /^Digit([0-9])$/.exec(e.code);
      if (digit) {
        const n = digit[1];
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          view.groups[n] = [...view.selected];
          return;
        }
        const ids = (view.groups[n] || []).filter((id) => CP.unitById(game.state, id));
        if (!ids.length) return;
        const now = game.now();
        // Pressing the same group twice quickly centres the camera on it.
        if (view.lastGroupKey.key === n && now - view.lastGroupKey.t < 400) {
          const us = ids.map((id) => CP.unitById(game.state, id));
          const cx = us.reduce((s, u) => s + u.x, 0) / us.length, cy = us.reduce((s, u) => s + u.y, 0) / us.length;
          centerOn(view, game.state.map, cx, cy);
        }
        view.lastGroupKey = { key: n, t: now };
        selectUnits(view, ids);
      }
    });

    window.addEventListener('keyup', (e) => view.keys.delete(e.key));
  }

  /** Per frame: hover target, placing ghost position, and dropping dead units from the selection. */
  function updateHover(game) {
    const { view, state } = game;
    const m = view.mouse;
    const onMap = m.inside && !view.box && m.x >= 0 && m.y >= 0 && m.x < view.w && m.y < view.h;
    const u = onMap ? unitAt(state, view, m.x, m.y, game.alpha()) : null;
    view.hover = u ? u.id : null;
    if (view.placing) view.placing.tile = onMap ? placingTile(view, view.placing.type) : null;
    for (const id of view.selected) {
      const s = CP.unitById(state, id);
      if (!s || s.hidden) view.selected.delete(id);
    }
    if (view.selectedBuilding != null && !CP.buildingById(state, view.selectedBuilding)) view.selectedBuilding = null;
    const th = view.selectedThing;
    if (th && !(th.kind === 'node' ? CP.nodeById(state, th.id) : CP.nestById(state, th.id))) view.selectedThing = null;
  }

  CP.createView = createView;
  CP.clampCamera = clampCamera;
  CP.centerOn = centerOn;
  CP.updateCamera = updateCamera;
  CP.attachInput = attachInput;
  CP.updateHover = updateHover;
  CP.screenToTile = screenToTile;
})(window.CP = window.CP || {});

// Mouse and keyboard, Warcraft 2 style: left click and box select,
// right click to send, arrows and screen edge to scroll, space to pause,
// Ctrl + digit for groups. Everything here works during pause.
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

  /** Our unit under a screen point (topmost wins), or null. */
  function unitAt(state, view, sx, sy, alpha) {
    let best = null, bestY = -Infinity;
    const art = CP.UNIT_ART;
    for (const u of state.units) {
      const p = CP.unitScreenPos(u, alpha, view.cam);
      const halfW = 7 * S, top = (art.footY - 2) * S;
      if (sx >= p.x - halfW && sx <= p.x + halfW && sy >= p.y - top && sy <= p.y + 4 && p.y > bestY) {
        best = u;
        bestY = p.y;
      }
    }
    return best;
  }

  function screenToTile(view, sx, sy) {
    return { x: (sx + view.cam.x) / TP, y: (sy + view.cam.y) / TP };
  }

  /**
   * Wires up all input. `game` gives access to the live state and
   * actions: { state, view, renderer, alpha(), togglePause(), now() }.
   */
  function attachInput(canvas, game) {
    const { view } = game;
    let drag = null; // { x0, y0 } while the left button is down on the map

    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    function order(sx, sy) {
      if (!view.selected.size) return;
      const t = screenToTile(view, sx, sy);
      CP.orderMove(game.state, [...view.selected], t.x, t.y);
      CP.addMarker(game.renderer, t.x, t.y, game.now());
    }

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousedown', (e) => {
      const p = local(e);
      // Right button, or Ctrl + click on a Mac trackpad.
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        order(p.x, p.y);
        return;
      }
      if (e.button === 0) drag = { x0: p.x, y0: p.y, shift: e.shiftKey };
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
      const p = local(e);
      const alpha = game.alpha();
      const add = drag.shift;
      if (view.box) {
        const b = view.box;
        const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
        const hit = game.state.units.filter((u) => {
          if (u.owner !== 'player') return false;
          const q = CP.unitScreenPos(u, alpha, view.cam);
          const cy = q.y - 10 * S;
          return q.x >= x0 && q.x <= x1 && cy >= y0 && cy <= y1;
        });
        if (!add) view.selected.clear();
        for (const u of hit) view.selected.add(u.id);
      } else {
        const u = unitAt(game.state, view, p.x, p.y, alpha);
        if (add && u) {
          if (view.selected.has(u.id)) view.selected.delete(u.id);
          else view.selected.add(u.id);
        } else {
          view.selected.clear();
          if (u) view.selected.add(u.id);
        }
      }
      view.box = null;
      drag = null;
    });

    // Double click: every unit of that kind on screen.
    canvas.addEventListener('dblclick', (e) => {
      const p = local(e);
      const alpha = game.alpha();
      const u = unitAt(game.state, view, p.x, p.y, alpha);
      if (!u) return;
      for (const o of game.state.units) {
        if (o.type !== u.type || o.owner !== 'player') continue;
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
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) game.togglePause();
        return;
      }
      if (e.key === 'Escape') {
        view.selected.clear();
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
        view.selected = new Set(ids);
      }
    });

    window.addEventListener('keyup', (e) => view.keys.delete(e.key));
  }

  /** Hover: which of our units is under the mouse (for the hearts bar and number). */
  function updateHover(game) {
    const { view } = game;
    const m = view.mouse;
    const u = m.inside && !view.box && m.x >= 0 && m.y >= 0 && m.x < view.w && m.y < view.h ? unitAt(game.state, view, m.x, m.y, game.alpha()) : null;
    view.hover = u ? u.id : null;
  }

  CP.createView = createView;
  CP.clampCamera = clampCamera;
  CP.centerOn = centerOn;
  CP.updateCamera = updateCamera;
  CP.attachInput = attachInput;
  CP.updateHover = updateHover;
  CP.screenToTile = screenToTile;
})(window.CP = window.CP || {});

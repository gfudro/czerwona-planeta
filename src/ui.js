// HTML interface over the canvas: top bar (pause, speeds), pause badge,
// minimap, selection panel, hearts tooltip and version number.
(function (CP) {
  'use strict';

  const MM = 4; // minimap pixels per tile

  function el(id) { return document.getElementById(id); }

  function createUI(game) {
    const { state, view } = game;
    const map = state.map;
    const STR = CP.STR;

    // Top bar.
    el('pauseBtn').addEventListener('click', () => game.togglePause());
    for (const s of ['slow', 'normal', 'fast']) {
      const b = el('speed-' + s);
      b.textContent = STR[s];
      b.addEventListener('click', () => game.setSpeed(s));
    }
    el('version').textContent = 'v' + CP.VERSION;
    el('pauseBadge').textContent = STR.pause;

    // Minimap.
    const mm = el('minimap');
    const dpr = window.devicePixelRatio || 1;
    mm.width = map.w * MM * dpr;
    mm.height = map.h * MM * dpr;
    mm.style.width = map.w * MM + 'px';
    mm.style.height = map.h * MM + 'px';
    const mctx = mm.getContext('2d');
    const base = document.createElement('canvas');
    base.width = map.w;
    base.height = map.h;
    const bctx = base.getContext('2d');
    const COLORS = { [CP.T.SAND]: '#c4623a', [CP.T.DUNE]: '#a84e2e', [CP.T.ROCK]: '#4e2418', [CP.T.CRACK]: '#24100c' };
    for (let y = 0; y < map.h; y++)
      for (let x = 0; x < map.w; x++) {
        bctx.fillStyle = COLORS[map.terrain[y * map.w + x]];
        bctx.fillRect(x, y, 1, 1);
      }
    const fog = document.createElement('canvas');
    fog.width = map.w;
    fog.height = map.h;
    const fctx = fog.getContext('2d');
    const fimg = fctx.createImageData(map.w, map.h);

    function minimapTile(e) {
      const r = mm.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * map.w, y: ((e.clientY - r.top) / r.height) * map.h };
    }
    let mmDrag = false;
    mm.addEventListener('contextmenu', (e) => e.preventDefault());
    mm.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const t = minimapTile(e);
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        if (view.selected.size) {
          CP.orderMove(state, [...view.selected], t.x, t.y);
          CP.addMarker(game.renderer, t.x, t.y, game.now());
        }
        return;
      }
      if (e.button === 0) {
        mmDrag = true;
        CP.centerOn(view, map, t.x, t.y);
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (!mmDrag) return;
      const t = minimapTile(e);
      CP.centerOn(view, map, Math.max(0, Math.min(map.w, t.x)), Math.max(0, Math.min(map.h, t.y)));
    });
    window.addEventListener('mouseup', () => { mmDrag = false; });

    function drawMinimap() {
      mctx.setTransform(dpr * MM, 0, 0, dpr * MM, 0, 0);
      mctx.imageSmoothingEnabled = false;
      mctx.drawImage(base, 0, 0);
      for (const b of state.buildings) {
        mctx.fillStyle = '#e0b050';
        mctx.fillRect(b.x, b.y, b.size, b.size);
      }
      for (const u of state.units) {
        mctx.fillStyle = view.selected.has(u.id) ? '#4dff6a' : '#ff9a2a';
        mctx.fillRect(u.x - 0.6, u.y - 0.6, 1.2, 1.2);
      }
      const d = fimg.data;
      for (let i = 0; i < state.fog.length; i++) {
        const f = state.fog[i];
        d[i * 4 + 3] = f === CP.FOG.VISIBLE ? 0 : f === CP.FOG.EXPLORED ? 120 : 255;
      }
      fctx.putImageData(fimg, 0, 0);
      mctx.drawImage(fog, 0, 0);
      mctx.strokeStyle = '#ffffff';
      mctx.lineWidth = 2 / MM;
      const TP = CP.TILE_PX;
      mctx.strokeRect(view.cam.x / TP, view.cam.y / TP, view.w / TP, view.h / TP);
    }

    // Selection panel: a portrait and number per kind of unit; one unit shows its hearts.
    let lastSel = '';
    const panel = el('selPanel');
    function drawSelection() {
      const units = [...view.selected].map((id) => CP.unitById(state, id)).filter(Boolean);
      const key = units.map((u) => u.id + ':' + u.hearts).join(',');
      if (key === lastSel) return;
      lastSel = key;
      panel.innerHTML = '';
      panel.style.display = units.length ? 'flex' : 'none';
      if (!units.length) return;
      const byType = new Map();
      for (const u of units) byType.set(u.type, (byType.get(u.type) || []).concat(u));
      for (const [type, list] of byType) {
        const card = document.createElement('div');
        card.className = 'selCard';
        const img = CP.unitSprite(type, 0, false);
        const pic = document.createElement('canvas');
        pic.width = img.width;
        pic.height = img.height;
        pic.getContext('2d').drawImage(img, 0, 0);
        pic.className = 'portrait';
        card.appendChild(pic);
        const txt = document.createElement('div');
        txt.className = 'selText';
        const name = document.createElement('div');
        name.textContent = STR.units[type];
        txt.appendChild(name);
        const num = document.createElement('div');
        num.className = 'selNum';
        if (list.length === 1) num.innerHTML = `<span class="heart">♥</span> ${list[0].hearts}/${CP.UNIT_TYPES[type].hearts}`;
        else num.textContent = '× ' + list.length;
        txt.appendChild(num);
        card.appendChild(txt);
        panel.appendChild(card);
      }
    }

    // Hearts number next to the cursor when hovering a unit.
    const tip = el('tip');
    function drawTip() {
      const u = view.hover != null ? CP.unitById(state, view.hover) : null;
      if (!u) { tip.style.display = 'none'; return; }
      tip.style.display = 'block';
      tip.innerHTML = `<span class="heart">♥</span> ${u.hearts}`;
      tip.style.left = view.mouse.cx + 18 + 'px';
      tip.style.top = view.mouse.cy + 14 + 'px';
    }

    function update(paused, speed) {
      el('pauseBadge').style.display = paused ? 'block' : 'none';
      el('pauseBtn').textContent = paused ? STR.play : STR.pause;
      el('pauseBtn').classList.toggle('on', paused);
      for (const s of ['slow', 'normal', 'fast']) el('speed-' + s).classList.toggle('on', s === speed);
      drawMinimap();
      drawSelection();
      drawTip();
    }

    return { update };
  }

  CP.createUI = createUI;
})(window.CP = window.CP || {});

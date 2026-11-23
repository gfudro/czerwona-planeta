// HTML interface over the canvas: top bar (resources, goal, pause, speeds),
// minimap, selection and command panels, hearts tooltip, menu and end screens.
(function (CP) {
  'use strict';

  const MM = 4; // minimap pixels per tile
  const el = (id) => document.getElementById(id);

  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /** An icon (or a unit's portrait) as a crisp <canvas>, scaled by CSS. */
  function iconEl(canvas, cls) {
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    c.getContext('2d').drawImage(canvas, 0, 0);
    c.className = cls;
    return c;
  }

  /** Goal icon: a small icon, or a creature's portrait fitted into a square. */
  /** A sprite centred at the bottom of a square canvas, for use as an icon. */
  function squareIcon(spr) {
    const n = Math.max(spr.width, spr.height);
    const c = document.createElement('canvas');
    c.width = c.height = n;
    c.getContext('2d').drawImage(spr, Math.floor((n - spr.width) / 2), n - spr.height);
    return c;
  }

  function goalIcon(name) {
    if (name === 'bigCrystal') return squareIcon(CP.objectSprite('bigCrystal'));
    if (!CP.UNIT_TYPES[name] || name === 'settler') return CP.icon(name);
    const spr = CP.unitSprite(name, 0, false);
    const n = Math.max(spr.width, spr.height);
    const c = document.createElement('canvas');
    c.width = c.height = n;
    c.getContext('2d').drawImage(spr, Math.floor((n - spr.width) / 2), n - spr.height);
    return c;
  }

  /** Cost as coloured numbers with icons, like in Gród. */
  function costEl(cost, state) {
    const box = h('div', 'cost');
    const parts = [['crystal', cost[0], state.res.crystals], ['scrap', cost[1], state.res.scrap]];
    for (const [icon, need, have] of parts) {
      if (!need) continue;
      const item = h('span', 'costItem ' + icon + (have < need ? ' short' : ''));
      item.appendChild(iconEl(CP.icon(icon), 'icon16'));
      item.appendChild(document.createTextNode(String(need)));
      box.appendChild(item);
    }
    return box;
  }

  // ---- Full screen (Safari still needs the webkit names) ----
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  /** Must be called from a click or key press; browsers refuse it otherwise. */
  function enterFullscreen() {
    if (isFullscreen()) return;
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    try {
      const p = req.call(el);
      if (p && p.catch) p.catch(() => {}); // refused (no click): just stay in the window
    } catch (e) { /* not allowed here */ }
  }

  function toggleFullscreen() {
    if (!isFullscreen()) { enterFullscreen(); return; }
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
  }

  CP.enterFullscreen = enterFullscreen;
  CP.toggleFullscreen = toggleFullscreen;

  function createUI(game) {
    const STR = CP.STR;
    const { view } = game;

    // ---- Top bar ----
    el('pauseBtn').addEventListener('click', () => game.togglePause());
    el('menuBtn').textContent = STR.menu;
    el('menuBtn').addEventListener('click', () => game.showMenu());
    for (const s of ['slow', 'normal', 'fast']) {
      const b = el('speed-' + s);
      b.textContent = STR[s];
      b.addEventListener('click', () => game.setSpeed(s));
    }
    el('fullscreenBtn').textContent = STR.fullscreen;
    el('fullscreenBtn').addEventListener('click', toggleFullscreen);
    // Every button in the interface clicks softly.
    document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('button')) CP.sound.play('click'); }, true);
    el('autoPauseBtn').textContent = STR.autoPause;
    el('autoPauseBtn').addEventListener('click', () => game.toggleAutoPause());
    el('version').textContent = 'v' + CP.VERSION;
    el('pauseBadge').textContent = STR.pause;
    el('resCrystal').prepend(iconEl(CP.icon('crystal'), 'icon24'));
    el('resScrap').prepend(iconEl(CP.icon('scrap'), 'icon24'));
    el('resPop').prepend(iconEl(CP.icon('pop'), 'icon24'));

    // ---- Minimap ----
    const mm = el('minimap');
    const mctx = mm.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let base = null, fog = null, fctx = null, fimg = null;
    const pings = [];

    function setupMinimap() {
      const map = game.state.map;
      mm.width = map.w * MM * dpr;
      mm.height = map.h * MM * dpr;
      mm.style.width = map.w * MM + 'px';
      mm.style.height = map.h * MM + 'px';
      base = document.createElement('canvas');
      base.width = map.w;
      base.height = map.h;
      const bctx = base.getContext('2d');
      const COLORS = map.theme === 'cave'
        ? { [CP.T.SAND]: '#5a4a60', [CP.T.DUNE]: '#4a3c50', [CP.T.ROCK]: '#1e1626', [CP.T.CRACK]: '#140c18', [CP.T.RUIN]: '#9a8478', [CP.T.LAVA]: '#ff7a20' }
        : { [CP.T.SAND]: '#c4623a', [CP.T.DUNE]: '#a84e2e', [CP.T.ROCK]: '#4e2418', [CP.T.CRACK]: '#24100c', [CP.T.RUIN]: '#9a8478', [CP.T.LAVA]: '#ff7a20' };
      for (let y = 0; y < map.h; y++)
        for (let x = 0; x < map.w; x++) {
          bctx.fillStyle = COLORS[map.terrain[y * map.w + x]];
          bctx.fillRect(x, y, 1, 1);
        }
      fog = document.createElement('canvas');
      fog.width = map.w;
      fog.height = map.h;
      fctx = fog.getContext('2d');
      fimg = fctx.createImageData(map.w, map.h);
      pings.length = 0;
    }

    function minimapTile(e) {
      const r = mm.getBoundingClientRect();
      const map = game.state.map;
      return { x: ((e.clientX - r.left) / r.width) * map.w, y: ((e.clientY - r.top) / r.height) * map.h };
    }
    let mmDrag = false;
    mm.addEventListener('contextmenu', (e) => e.preventDefault());
    mm.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (!game.active()) return;
      const t = minimapTile(e);
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        if (view.selected.size) {
          const what = CP.orderSmart(game.state, [...view.selected], t.x, t.y);
          if (what) CP.addMarker(game.renderer, t.x, t.y, game.now());
        }
        return;
      }
      if (e.button === 0) {
        mmDrag = true;
        CP.centerOn(view, game.state.map, t.x, t.y);
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (!mmDrag) return;
      const t = minimapTile(e);
      const map = game.state.map;
      CP.centerOn(view, map, Math.max(0, Math.min(map.w, t.x)), Math.max(0, Math.min(map.h, t.y)));
    });
    window.addEventListener('mouseup', () => { mmDrag = false; });

    function drawMinimap(now) {
      const state = game.state;
      mctx.setTransform(dpr * MM, 0, 0, dpr * MM, 0, 0);
      mctx.imageSmoothingEnabled = false;
      mctx.drawImage(base, 0, 0);
      for (const n of state.nodes) {
        mctx.fillStyle = n.kind === 'crystal' ? '#b07ae8' : '#8a8c94';
        mctx.fillRect(n.x, n.y, n.size, n.size);
      }
      for (const n of state.nests) {
        mctx.fillStyle = '#1a0806';
        mctx.fillRect(n.x, n.y, 1, 1);
      }
      for (const b of state.buildings) {
        mctx.fillStyle = '#e0b050';
        mctx.fillRect(b.x, b.y, b.size, b.size);
      }
      const d = fimg.data;
      for (let i = 0; i < state.fog.length; i++) {
        const f = state.fog[i];
        d[i * 4 + 3] = f === CP.FOG.VISIBLE ? 0 : f === CP.FOG.EXPLORED ? 120 : 255;
      }
      fctx.putImageData(fimg, 0, 0);
      mctx.drawImage(fog, 0, 0);
      for (const u of state.units) {
        if (u.hidden) continue;
        if (u.owner !== 'player' && !CP.isVisible(state, u.x, u.y)) continue;
        mctx.fillStyle = u.owner === 'wild' ? '#ff3a2a' : u.owner === 'neutral' ? '#ff8ab0' : view.selected.has(u.id) ? '#4dff6a' : '#ff9a2a';
        mctx.fillRect(u.x - 0.7, u.y - 0.7, 1.4, 1.4);
      }
      for (let i = pings.length - 1; i >= 0; i--) {
        const k = (now - pings[i].t) / 1500;
        if (k >= 1) { pings.splice(i, 1); continue; }
        mctx.strokeStyle = `rgba(255,60,40,${1 - k})`;
        mctx.lineWidth = 0.6;
        mctx.beginPath();
        mctx.arc(pings[i].x, pings[i].y, 1 + k * 5, 0, Math.PI * 2);
        mctx.stroke();
      }
      const TP = CP.TILE_PX;
      mctx.strokeStyle = '#ffffff';
      mctx.lineWidth = 2 / MM;
      mctx.strokeRect(view.cam.x / TP, view.cam.y / TP, view.w / TP, view.h / TP);
    }

    // ---- Selection and commands ----
    const panel = el('selPanel');
    const cmd = el('cmdPanel');
    let lastKey = '';

    function selectionInfo(state) {
      const units = [...view.selected].map((id) => CP.unitById(state, id)).filter(Boolean);
      const b = view.selectedBuilding != null ? CP.buildingById(state, view.selectedBuilding) : null;
      const th = view.selectedThing;
      const node = th && th.kind === 'node' ? CP.nodeById(state, th.id) : null;
      const nest = th && th.kind === 'nest' ? CP.nestById(state, th.id) : null;
      return { units, b, node, nest };
    }

    function card(pic, name, line) {
      const c = h('div', 'selCard');
      c.appendChild(pic);
      const txt = h('div', 'selText');
      txt.appendChild(h('div', null, name));
      if (line) txt.appendChild(line);
      c.appendChild(txt);
      return c;
    }

    function heartsLine(hearts, max) {
      const n = h('div', 'selNum');
      n.appendChild(iconEl(CP.icon('heart'), 'icon20'));
      n.appendChild(document.createTextNode(` ${hearts}/${max}`));
      return n;
    }

    function buildSelection(state, { units, b, node, nest }) {
      panel.innerHTML = '';
      if (node) {
        // How much is left: crystals in a deposit, scrap in a wreck.
        const line = h('div', 'selNum');
        line.appendChild(iconEl(CP.icon(CP.nodeResource(node) === 'scrap' ? 'scrap' : 'crystal'), 'icon20'));
        line.appendChild(document.createTextNode(` ${node.amount}/${node.max}`));
        panel.appendChild(card(iconEl(CP.objectSprite(node.kind), 'bpic'), STR.things[node.kind], line));
        return;
      }
      if (nest) {
        panel.appendChild(card(iconEl(CP.objectSprite('nest'), 'bpic'), STR.things.nest, null));
        return;
      }
      if (b) {
        const pic = iconEl(CP.objectSprite(b.type), 'bpic');
        let line = null;
        if (!b.built) line = h('div', 'selNum', Math.floor(b.progress * 100) + '%');
        else if (CP.BUILDING_TYPES[b.type].pop) {
          line = h('div', 'selNum');
          line.appendChild(iconEl(CP.icon('pop'), 'icon20'));
          line.appendChild(document.createTextNode(' +' + CP.BUILDING_TYPES[b.type].pop));
        }
        panel.appendChild(card(pic, STR.buildings[b.type], line));
        return;
      }
      const byType = new Map();
      for (const u of units) byType.set(u.type, (byType.get(u.type) || []).concat(u));
      for (const [type, list] of byType) {
        const pic = iconEl(CP.unitSprite(type, 0, false), 'portrait ' + type);
        const line = list.length === 1 ? heartsLine(Math.max(0, list[0].hearts), CP.maxHearts(list[0])) : h('div', 'selNum', '× ' + list.length);
        panel.appendChild(card(pic, STR.units[type], line));
      }
    }

    function cmdButton(pic, name, cost, state, enabled, onClick, desc) {
      const btn = h('button', 'cmd' + (enabled ? '' : ' off'));
      btn.appendChild(pic);
      const txt = h('div', 'cmdText');
      txt.appendChild(h('div', 'cmdName', name));
      if (desc) txt.appendChild(h('div', 'cmdDesc', desc));
      txt.appendChild(costEl(cost, state));
      btn.appendChild(txt);
      btn.addEventListener('mousedown', (e) => e.stopPropagation());
      btn.addEventListener('click', (e) => { e.stopPropagation(); if (enabled) onClick(); });
      return btn;
    }

    function buildCommands(state, { units, b }) {
      cmd.innerHTML = '';
      const settlers = units.filter((u) => u.type === 'settler' && u.owner === 'player');
      if (settlers.length && !b) {
        for (const type of state.builds || CP.SETTLER_BUILDS) {
          const def = CP.BUILDING_TYPES[type];
          const ok = CP.canAfford(state, def.cost);
          cmd.appendChild(cmdButton(iconEl(CP.objectSprite(type), 'bicon'), STR.buildings[type], def.cost, state, ok, () => {
            view.placing = { type, builderId: settlers[0].id, tile: null };
          }));
        }
      }
      if (b && b.built && CP.BUILDING_TYPES[b.type].trains) {
        for (const type of CP.BUILDING_TYPES[b.type].trains) {
          const blocker = CP.trainBlocker(state, b, type);
          const btn = cmdButton(iconEl(CP.unitSprite(type, 0, false), 'uicon'), STR.units[type], CP.UNIT_TYPES[type].cost, state, !blocker, () => CP.train(state, b, type));
          if (blocker === 'pop') {
            const warn = h('span', 'popWarn');
            warn.appendChild(iconEl(CP.icon('pop'), 'icon20'));
            warn.appendChild(document.createTextNode(`${CP.popUsed(state)}/${CP.popCap(state)}`));
            btn.querySelector('.cmdText').appendChild(warn);
          }
          cmd.appendChild(btn);
        }
        if (b.queue.length) {
          const q = h('div', 'queue');
          b.queue.forEach((type, i) => {
            const qb = h('button', 'qItem' + (i === 0 ? ' first' : ''));
            qb.appendChild(iconEl(CP.unitSprite(type, 0, false), 'qicon'));
            qb.addEventListener('mousedown', (e) => e.stopPropagation());
            qb.addEventListener('click', () => CP.cancelTrain(state, b, i));
            q.appendChild(qb);
          });
          cmd.appendChild(q);
        }
      }
      if (b && b.built && state.upg && CP.UPGRADE_PAIRS[b.type]) upgradeCommands(state, b);
      cmd.style.display = cmd.childNodes.length ? 'flex' : 'none';
    }

    /**
     * The two upgrades of a building, side by side. Before choosing both are
     * offered; after choosing only the chosen one stays, with its progress
     * and then a tick. The other is gone for the rest of the mission.
     */
    function upgradeCommands(state, b) {
      const pair = CP.UPGRADE_PAIRS[b.type];
      const chosen = state.upg.chosen[b.type];
      const row = h('div', 'upRow');
      for (const id of pair) {
        if (chosen && chosen !== id) continue;
        const def = CP.UPGRADES[id];
        const done = state.upg.done[id];
        if (chosen) {
          // Chosen: show it with progress or as finished.
          const box = h('div', 'cmd upDone');
          box.appendChild(iconEl(CP.icon('up_' + id), 'uicon'));
          const txt = h('div', 'cmdText');
          txt.appendChild(h('div', 'cmdName', STR.upgrades[id]));
          txt.appendChild(h('div', 'cmdDesc', STR.upgradeText[id]));
          const research = state.buildings.find((o) => o.research && o.research.id === id);
          if (done) txt.appendChild(iconEl(CP.icon('check'), 'icon20'));
          else if (research) txt.appendChild(h('div', 'selNum', Math.floor((research.research.t / def.time) * 100) + '%'));
          box.appendChild(txt);
          row.appendChild(box);
          continue;
        }
        const blocker = CP.upgradeBlocker(state, b, id);
        if (row.childNodes.length) row.appendChild(h('div', 'upOr', STR.or));
        row.appendChild(cmdButton(iconEl(CP.icon('up_' + id), 'uicon'), STR.upgrades[id], def.cost, state, !blocker, () => CP.startUpgrade(state, b, id), STR.upgradeText[id]));
      }
      cmd.appendChild(row);
    }

    // Hearts number next to the cursor when hovering a unit.
    const tip = el('tip');
    function drawTip() {
      const u = view.hover != null ? CP.unitById(game.state, view.hover) : null;
      if (!u) { tip.style.display = 'none'; return; }
      tip.style.display = 'flex';
      tip.innerHTML = '';
      tip.appendChild(iconEl(CP.icon('heart'), 'icon20'));
      tip.appendChild(document.createTextNode(' ' + u.hearts));
      tip.style.left = view.mouse.cx + 18 + 'px';
      tip.style.top = view.mouse.cy + 14 + 'px';
    }

    // ---- Goal ----
    let lastGoal = '';
    function drawGoal(state) {
      const g = state.mission ? CP.currentGoal(state) : null;
      const box = el('goal');
      const key = g ? `${g.icon}:${g.value}:${g.target}` : 'none';
      if (key === lastGoal) return;
      const changedStep = lastGoal.split(':')[0] !== key.split(':')[0];
      lastGoal = key;
      box.innerHTML = '';
      if (!g) { box.style.display = 'none'; return; }
      box.style.display = 'flex';
      box.appendChild(iconEl(goalIcon(g.icon), 'icon32'));
      box.appendChild(h('span', 'goalNum', `${g.value}/${g.target}`));
      if (g.text) box.appendChild(h('span', 'goalText', g.text));
      if (changedStep && g.index > 0) {
        box.classList.remove('flash');
        void box.offsetWidth; // restart the animation
        box.classList.add('flash');
      }
    }

    function update(paused, speed, autoPause, now) {
      const state = game.state;
      el('pauseBadge').style.display = paused && game.active() ? 'block' : 'none';
      el('pauseBtn').textContent = paused ? STR.play : STR.pause;
      el('pauseBtn').classList.toggle('on', paused);
      el('autoPauseBtn').classList.toggle('on', autoPause);
      el('fullscreenBtn').classList.toggle('on', isFullscreen());
      for (const s of ['slow', 'normal', 'fast']) el('speed-' + s).classList.toggle('on', s === speed);
      el('resCrystalNum').textContent = state.res.crystals;
      el('resScrapNum').textContent = state.res.scrap;
      const used = state.units.filter((u) => u.owner === 'player').length;
      el('resPopNum').textContent = `${used}/${CP.popCap(state)}`;
      drawGoal(state);
      drawMinimap(now);
      const sel = selectionInfo(state);
      const b = sel.b;
      const key = [
        sel.units.map((u) => u.id + ':' + u.hearts).join(','),
        b ? `${b.id}:${b.built}:${Math.floor(b.progress * 100)}:${b.queue.join('.')}` : '',
        state.upg ? JSON.stringify(state.upg) + state.buildings.map((o) => (o.research ? Math.floor(o.research.t) : '')).join('') : '',
        sel.node ? `n${sel.node.id}:${sel.node.amount}` : sel.nest ? `g${sel.nest.id}` : '',
        state.res.crystals, state.res.scrap, CP.popUsed(state), CP.popCap(state), view.placing ? view.placing.type : '',
      ].join('|');
      if (key !== lastKey) {
        lastKey = key;
        buildSelection(state, sel);
        buildCommands(state, sel);
        panel.style.display = panel.childNodes.length ? 'flex' : 'none';
      }
      drawTip();
    }

    function ping(x, y, now) {
      pings.push({ x, y, t: now });
    }

    // ---- Menu and end screens ----
    function showMenu() {
      const ov = el('overlay');
      ov.innerHTML = '';
      ov.style.display = 'flex';
      const box = h('div', 'menuBox');
      box.appendChild(h('h1', null, STR.title));
      const list = h('div', 'missions');
      for (let id = 1; id <= CP.MISSION_COUNT; id++) {
        const open = CP.isUnlocked(id);
        const won = CP.loadProgress().won.includes(id);
        const b = h('button', 'mission' + (open ? '' : ' locked'));
        b.appendChild(h('div', 'mNum', String(id)));
        b.appendChild(h('div', 'mName', CP.MISSIONS[id].name));
        if (won) b.appendChild(iconEl(CP.icon('check'), 'icon32'));
        if (!open) b.appendChild(h('div', 'lock', '🔒'));
        if (open) b.addEventListener('click', () => { enterFullscreen(); game.briefMission(id); });
        list.appendChild(b);
      }
      box.appendChild(list);
      const story = h('button', 'storyBtn', STR.story);
      story.addEventListener('click', () => { enterFullscreen(); game.playStory(); });
      // Sound and music switches live here, not in the top bar (no room on a laptop).
      const sound = h('div', 'soundRow');
      sound.appendChild(story);
      const switches = [[STR.sound, CP.sound.sfxOn, CP.sound.setSfx], [STR.music, CP.sound.musicOn, CP.sound.setMusic]];
      if (window.speechSynthesis) switches.push([STR.narrator, CP.narrator.on, CP.narrator.set]);
      for (const [label, isOn, set] of switches) {
        const b = h('button', isOn() ? 'on' : '', label);
        b.addEventListener('click', () => { set(!isOn()); b.classList.toggle('on', isOn()); });
        sound.appendChild(b);
      }
      box.appendChild(sound);
      ov.appendChild(box);
    }

    /** First visit: just the name and a big Start button, which begins the story. */
    function showTitle() {
      const ov = el('overlay');
      ov.innerHTML = '';
      ov.style.display = 'flex';
      const box = h('div', 'menuBox titleBox');
      box.appendChild(h('h1', null, STR.title));
      const b = h('button', 'big', STR.start + ' ▶');
      b.addEventListener('click', () => { enterFullscreen(); game.playStory(); });
      box.appendChild(b);
      ov.appendChild(box);
    }

    function showEnd(win) {
      const ov = el('overlay');
      ov.innerHTML = '';
      ov.style.display = 'flex';
      const box = h('div', 'menuBox end');
      const final = win && game.state.mission.id === CP.MISSION_COUNT;
      box.appendChild(h('h1', null, final ? STR.theEnd : win ? STR.win : STR.lose));
      if (final) {
        // The end of the campaign: the hero standing beside both defeated bosses.
        const art = h('div', 'endArt');
        for (const type of ['imapia', 'hero', 'crystalLord']) {
          const spr = CP.unitSprite(type, 0, false);
          const c = iconEl(spr, '');
          c.style.width = spr.width * 4 + 'px';
          c.style.height = spr.height * 4 + 'px';
          art.appendChild(c);
        }
        box.appendChild(art);
      }
      const row = h('div', 'endRow');
      if (win) {
        const b = h('button', 'big', STR.next);
        b.addEventListener('click', () => game.showMenu());
        row.appendChild(b);
      } else {
        const again = h('button', 'big', STR.again);
        again.addEventListener('click', () => { enterFullscreen(); game.startMission(game.state.mission.id); });
        row.appendChild(again);
        const menu = h('button', 'big', STR.menu);
        menu.addEventListener('click', () => game.showMenu());
        row.appendChild(menu);
      }
      box.appendChild(row);
      ov.appendChild(box);
    }

    function hideOverlay() {
      el('overlay').style.display = 'none';
    }

    function reset() {
      setupMinimap();
      lastKey = '';
      lastGoal = '';
    }

    return { update, ping, showMenu, showTitle, showEnd, hideOverlay, reset };
  }

  CP.createUI = createUI;
})(window.CP = window.CP || {});

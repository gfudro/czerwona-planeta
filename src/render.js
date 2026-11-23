// Drawing the world onto the main canvas: terrain, objects, buildings,
// units, selection, effects and fog of war. Reads state, never changes it.
(function (CP) {
  'use strict';

  const S = CP.ART_SCALE;
  const TP = CP.TILE_PX;

  function createRenderer(canvas, state) {
    const ctx = canvas.getContext('2d');
    const terrain = CP.paintTerrain(state.map).toCanvas();
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = state.map.w;
    fogCanvas.height = state.map.h;
    const fogCtx = fogCanvas.getContext('2d');
    const fogImage = fogCtx.createImageData(state.map.w, state.map.h);
    return { canvas, ctx, terrain, fogCanvas, fogCtx, fogImage, markers: [], fx: [], fogTick: -1 };
  }

  /** Interpolated position of a unit in screen pixels (feet). */
  function unitScreenPos(u, alpha, cam) {
    const x = u.px + (u.x - u.px) * alpha, y = u.py + (u.y - u.py) * alpha;
    return { x: x * TP - cam.x, y: y * TP - cam.y };
  }

  function drawTerrain(r, cam, vw, vh) {
    const { ctx, terrain } = r;
    ctx.imageSmoothingEnabled = false;
    const sx = Math.floor(cam.x / S), sy = Math.floor(cam.y / S);
    const offX = cam.x - sx * S, offY = cam.y - sy * S;
    const sw = Math.ceil(vw / S) + 2, sh = Math.ceil(vh / S) + 2;
    const cx = Math.max(0, sx), cy = Math.max(0, sy);
    const cw = Math.min(terrain.width, sx + sw) - cx, ch = Math.min(terrain.height, sy + sh) - cy;
    if (cw <= 0 || ch <= 0) return;
    ctx.drawImage(terrain, cx, cy, cw, ch, (cx - sx) * S - offX, (cy - sy) * S - offY, cw * S, ch * S);
  }

  function drawFog(r, state, cam) {
    const { ctx, fogCanvas, fogCtx, fogImage } = r;
    if (r.fogTick !== state.tick) {
      const d = fogImage.data;
      for (let i = 0; i < state.fog.length; i++) {
        const f = state.fog[i];
        d[i * 4] = 8; d[i * 4 + 1] = 2; d[i * 4 + 2] = 6;
        d[i * 4 + 3] = f === CP.FOG.VISIBLE ? 0 : f === CP.FOG.EXPLORED ? 135 : 255;
      }
      fogCtx.putImageData(fogImage, 0, 0);
      r.fogTick = state.tick;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(fogCanvas, -cam.x, -cam.y, state.map.w * TP, state.map.h * TP);
    ctx.imageSmoothingEnabled = false;
  }

  function explored(state, x, y, size) {
    for (let yy = y; yy < y + size; yy++)
      for (let xx = x; xx < x + size; xx++)
        if (CP.inBounds(state.map, xx, yy) && state.fog[yy * state.map.w + xx] !== CP.FOG.HIDDEN) return true;
    return false;
  }

  function ring(ctx, x, y, rx, ry, color, width = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** A bar with a dark frame; t from 0 to 1. */
  function bar(ctx, x, y, w, t, color, h = 6) {
    ctx.fillStyle = '#1e0f0c';
    ctx.fillRect(Math.round(x - w / 2 - 1), Math.round(y - 1), w + 2, h + 2);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - w / 2), Math.round(y), w * Math.max(0, Math.min(1, t)), h);
  }

  /** Little gold stars over the hero: one per level. */
  function drawStars(ctx, x, y, n) {
    const star = CP.icon('star');
    const w = 14;
    for (let i = 0; i < n; i++) ctx.drawImage(star, Math.round(x - (n * w) / 2 + i * w), Math.round(y - 6), 14, 14);
  }

  function barWidth(type) {
    const meta = CP.SPRITE_META[type];
    return Math.max(36, Math.min(80, meta.hitW * 2 * S * 0.8));
  }

  function selRing(type) {
    const meta = CP.SPRITE_META[type];
    const rx = Math.max(22, meta.hitW * S * 1.1);
    return [rx, rx * 0.38];
  }

  function heartsColor(t) {
    return t > 0.5 ? '#4dd25a' : t > 0.25 ? '#f2c230' : '#e8402a';
  }

  /** Draws a map sprite standing on its footprint; `reveal` < 1 shows only the bottom part (being built). */
  function drawObject(ctx, name, x, y, cam, reveal = 1) {
    const spr = CP.objectSprite(name);
    const rise = (CP.SPRITE_RISE[name] || 0) * S;
    const dx = x * TP - cam.x, dy = y * TP - cam.y - rise;
    const w = spr.width * S, h = spr.height * S;
    if (dx > 4000 || dy > 4000 || dx + w < -10 || dy + h < -10) return;
    if (reveal >= 1) { ctx.drawImage(spr, dx, dy, w, h); return; }
    const shown = Math.max(1, Math.round(spr.height * (0.15 + 0.85 * reveal)));
    ctx.globalAlpha = 0.9;
    ctx.drawImage(spr, 0, spr.height - shown, spr.width, shown, dx, dy + h - shown * S, w, shown * S);
    ctx.globalAlpha = 1;
  }

  /** Wooden scaffolding over a building site (pixel-art sprite). */
  function drawScaffold(ctx, b, cam) {
    const spr = CP.objectSprite('scaffold' + b.size);
    ctx.drawImage(spr, b.x * TP - cam.x, b.y * TP - cam.y, spr.width * S, spr.height * S);
  }

  function unitFrame(u) {
    if (u.path.length) return 1 + (Math.floor(u.walk * 6) % 2);
    if (u.type === 'settler' && u.work > 0) return Math.floor(u.work * 3) % 2 ? 3 : 0;
    return 0;
  }

  function drawUnit(r, u, p) {
    const { ctx } = r;
    const meta = CP.SPRITE_META[u.type];
    if (u.down > 0) {
      // The fallen hero lies on the ground, see-through.
      const spr = CP.unitSprite(u.type, 0, u.facing < 0);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.translate(Math.round(p.x), Math.round(p.y - 8));
      ctx.rotate(u.facing < 0 ? -Math.PI / 2 : Math.PI / 2);
      ctx.drawImage(spr, -meta.footY * S * 0.5, -spr.width * S * 0.5, spr.width * S, spr.height * S);
      ctx.restore();
      return;
    }
    const frame = unitFrame(u);
    const spr = CP.unitSprite(u.type, frame, u.facing < 0);
    let ox = 0, oy = frame === 1 && u.type !== 'mabmia' ? -S : 0;
    if (u.lunge > 0) ox = u.facing * 6;
    let sh = spr.height;
    // A worm digging out of its nest rises out of the ground.
    if (u.emerge > 0) sh = Math.max(2, Math.round(spr.height * (1 - u.emerge / 0.6)));
    const dx = Math.round(p.x - meta.footX * S + ox), dy = Math.round(p.y - meta.footY * S + oy);
    ctx.drawImage(spr, 0, 0, spr.width, sh, dx, dy + (spr.height - sh) * S, spr.width * S, sh * S);
    // What a settler carries, over the head.
    if (u.carry) {
      const icon = CP.icon(u.carry.kind === 'crystals' ? 'crystal' : 'scrap');
      ctx.drawImage(icon, Math.round(p.x - 8 + u.facing * 6), Math.round(p.y - meta.footY * S - 14 + oy), 16, 16);
    }
    // A tamed Mabmia shows a small heart.
    if (u.type === 'mabmia' && u.followId != null) {
      ctx.drawImage(CP.icon('heart'), Math.round(p.x - 8), Math.round(p.y - meta.footY * S - 18), 16, 16);
    }
  }

  function drawFx(r, cam, now) {
    const { ctx } = r;
    r.fx = r.fx.filter((f) => now - f.t < f.life);
    for (const f of r.fx) {
      const k = (now - f.t) / f.life;
      if (k < 0) continue; // starts a little later (the cannonball's blast)
      const x = f.x * TP - cam.x, y = f.y * TP - cam.y;
      if (f.kind === 'text') {
        ctx.font = `800 ${f.size || 26}px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(20,6,4,' + (1 - k) + ')';
        const yy = y - 60 - k * 36;
        ctx.strokeText(f.text, x, yy);
        ctx.fillStyle = f.color.replace('A', String(1 - k * k));
        ctx.fillText(f.text, x, yy);
      } else if (f.kind === 'ball') {
        // A cannonball flying in an arc, with a puff at the muzzle.
        const x1 = f.x1 * TP - cam.x, y1 = f.y1 * TP - cam.y;
        const bx = x + (x1 - x) * k, by = (y - 24) + (y1 - 16 - (y - 24)) * k - Math.sin(k * Math.PI) * 60;
        ctx.fillStyle = 'rgba(40,30,30,1)';
        ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(180,170,170,1)';
        ctx.beginPath(); ctx.arc(bx - 2, by - 2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(230,225,215,${0.7 * (1 - k)})`;
        ctx.beginPath(); ctx.arc(x + 14, y - 30 - k * 20, 10 + k * 14, 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'boom') {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.fillStyle = `rgba(255,${180 - i * 15},80,${1 - k})`;
          ctx.beginPath(); ctx.arc(x + Math.cos(a) * k * 26, y - 16 + Math.sin(a) * k * 14, 8 * (1 - k), 0, Math.PI * 2); ctx.fill();
        }
      } else if (f.kind === 'shot') {
        const x1 = f.x1 * TP - cam.x, y1 = f.y1 * TP - cam.y;
        ctx.strokeStyle = `rgba(255,230,140,${1 - k})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 30); ctx.lineTo(x1, y1 - 16);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,240,200,${1 - k})`;
        ctx.beginPath(); ctx.arc(x, y - 30, 7 * (1 - k), 0, Math.PI * 2); ctx.fill();
      } else if (f.kind === 'dust') {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const d = 8 + k * 34;
          ctx.fillStyle = `rgba(200,150,110,${0.8 * (1 - k)})`;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * d, y - 14 + Math.sin(a) * d * 0.5 - k * 10, 9 * (1 - k * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (f.kind === 'ping') {
        ring(ctx, x, y, 20 + k * 50, 8 + k * 20, `rgba(255,70,50,${1 - k})`, 4);
      }
    }
  }

  function drawMarkers(r, cam, now) {
    const { ctx } = r;
    r.markers = r.markers.filter((m) => now - m.t < 700);
    for (const m of r.markers) {
      const k = (now - m.t) / 700;
      const x = m.x * TP - cam.x, y = m.y * TP - cam.y;
      const col = m.color || '77,255,106';
      ring(ctx, x, y, 26 * (1 - k * 0.7), 11 * (1 - k * 0.7), `rgba(${col},${1 - k})`);
      ctx.beginPath();
      ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }

  /** The building being placed: its sprite, green where it fits, red where not. */
  function drawGhost(r, state, view) {
    const g = view.placing;
    if (!g || !g.tile) return;
    const { ctx } = r;
    const size = CP.BUILDING_TYPES[g.type].size;
    const x = g.tile.x * TP - view.cam.x, y = g.tile.y * TP - view.cam.y;
    const ok = CP.canPlace(state, g.type, g.tile.x, g.tile.y, CP.unitById(state, g.builderId));
    ctx.globalAlpha = 0.6;
    drawObject(ctx, g.type, g.tile.x, g.tile.y, view.cam);
    ctx.globalAlpha = 1;
    ctx.fillStyle = ok ? 'rgba(77,255,106,0.25)' : 'rgba(255,60,40,0.35)';
    ctx.fillRect(x, y, size * TP, size * TP);
    ctx.strokeStyle = ok ? '#4dff6a' : '#ff4030';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, size * TP - 3, size * TP - 3);
  }

  /**
   * Draws a frame. `view` holds the camera, selection, hover, drag box and
   * placing ghost from input; `alpha` is how far we are between two ticks.
   */
  function draw(r, state, view, alpha, now) {
    const { ctx } = r;
    const vw = view.w, vh = view.h, cam = view.cam;
    ctx.fillStyle = '#0a0406';
    ctx.fillRect(0, 0, vw, vh);
    drawTerrain(r, cam, vw, vh);

    for (const d of state.debris) if (explored(state, d.x, d.y, d.size)) drawObject(ctx, 'debris', d.x, d.y, cam);

    // Everything standing, sorted by its bottom edge so nearer things overlap farther ones.
    const items = [];
    const th = view.selectedThing;
    const thingRing = (x, y, size) => ring(ctx, (x + size / 2) * TP - cam.x, (y + size - 0.15) * TP - cam.y, size * TP * 0.55, size * TP * 0.2, '#f2e05a');
    for (const n of state.nodes) if (explored(state, n.x, n.y, n.size)) items.push({ y: n.y + n.size, draw: () => {
      if (th && th.kind === 'node' && th.id === n.id) thingRing(n.x, n.y, n.size);
      drawObject(ctx, n.kind, n.x, n.y, cam);
    } });
    for (const n of state.nests) if (explored(state, n.x, n.y, 1)) items.push({ y: n.y + 1, draw: () => {
      if (th && th.kind === 'nest' && th.id === n.id) thingRing(n.x, n.y, 1);
      drawObject(ctx, 'nest', n.x, n.y, cam);
    } });
    for (const b of state.buildings) {
      items.push({
        y: b.y + b.size,
        draw: () => {
          if (view.selectedBuilding === b.id) ring(ctx, (b.x + b.size / 2) * TP - cam.x, (b.y + b.size - 0.2) * TP - cam.y, b.size * TP * 0.55, b.size * TP * 0.2, '#4dff6a');
          drawObject(ctx, b.type, b.x, b.y, cam, b.built ? 1 : b.progress);
          if (!b.built) drawScaffold(ctx, b, cam);
        },
      });
    }
    const sel = view.selected;
    for (const u of state.units) {
      if (u.hidden) continue;
      if (u.owner !== 'player' && !CP.isVisible(state, u.x, u.y)) continue;
      const p = unitScreenPos(u, alpha, cam);
      if (p.x < -100 || p.y < -100 || p.x > vw + 100 || p.y > vh + 100) continue;
      items.push({
        y: u.py + (u.y - u.py) * alpha,
        draw: () => {
          const [rx, ry] = selRing(u.type);
          if (sel.has(u.id)) ring(ctx, p.x, p.y - 4, rx, ry, '#4dff6a');
          if (view.hover === u.id && u.owner === 'wild') ring(ctx, p.x, p.y - 4, rx, ry, '#ff4030');
          drawUnit(r, u, p);
        },
      });
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    // Bars on top of all sprites: hearts, building progress, training, nest filling.
    for (const u of state.units) {
      if (u.hidden) continue;
      const p0 = unitScreenPos(u, alpha, cam);
      const top = p0.y - CP.SPRITE_META[u.type].footY * S - 12;
      if (u.down > 0) {
        // A fallen hero: how long until he stands up again.
        bar(ctx, p0.x, p0.y - 30, 44, 1 - u.down / CP.HERO.downTime, '#5ac8ff', 6);
        continue;
      }
      if (u.type === 'hero') drawStars(ctx, p0.x, top - 12, u.level);
      const max = CP.maxHearts(u);
      const show = sel.has(u.id) || view.hover === u.id || (u.owner === 'wild' && u.hearts < max) || (CP.UNIT_TYPES[u.type].boss && u.seen);
      if (!show || (u.owner !== 'player' && !CP.isVisible(state, u.x, u.y))) continue;
      const t = u.hearts / max;
      bar(ctx, p0.x, top, barWidth(u.type), t, heartsColor(t), CP.UNIT_TYPES[u.type].boss ? 8 : 6);
    }
    for (const b of state.buildings) {
      const cx = (b.x + b.size / 2) * TP - cam.x, top = b.y * TP - cam.y - (CP.SPRITE_RISE[b.type] || 0) * S - 4;
      if (!b.built) bar(ctx, cx, top, b.size * 30, b.progress, '#f2c230', 8);
      else if (b.queue.length) bar(ctx, cx, top, b.size * 30, b.trainT / CP.UNIT_TYPES[b.queue[0]].build, '#5ac8ff', 8);
    }
    for (const n of state.nests) {
      if (n.progress > 0) bar(ctx, (n.x + 0.5) * TP - cam.x, n.y * TP - cam.y - 12, 44, n.progress / CP.NESTS.fillTime, '#f2c230', 8);
    }
    // Rally point of the selected building.
    const sb = view.selectedBuilding != null ? CP.buildingById(state, view.selectedBuilding) : null;
    if (sb && sb.rally) {
      const x = sb.rally.x * TP - cam.x, y = sb.rally.y * TP - cam.y;
      ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 30); ctx.stroke();
      ctx.fillStyle = '#f28a1e';
      ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x + 18, y - 24); ctx.lineTo(x, y - 18); ctx.fill();
    }

    drawGhost(r, state, view);
    drawFog(r, state, cam);
    drawFx(r, cam, now);
    drawMarkers(r, cam, now); // over the fog: you can send units into the unknown

    if (view.box) {
      const b = view.box;
      ctx.strokeStyle = '#4dff6a';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(77,255,106,0.08)';
      ctx.fillRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
      ctx.strokeRect(Math.min(b.x0, b.x1) + 0.5, Math.min(b.y0, b.y1) + 0.5, Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
    }
  }

  function addMarker(r, x, y, now, color) {
    r.markers.push({ x, y, t: now, color });
  }

  /** Turns simulation events into effects on screen. */
  function takeEvents(r, state, now) {
    for (const e of state.events) {
      if (e.type === 'dmg') {
        r.fx.push({ kind: 'text', x: e.x + 0.15, y: e.y, t: now, life: 900, text: '−' + e.amount, color: e.owner === 'player' ? 'rgba(255,90,70,A)' : 'rgba(255,240,170,A)' });
      } else if (e.type === 'shot' && e.heavy) {
        r.fx.push({ kind: 'ball', x: e.x0, y: e.y0, x1: e.x1, y1: e.y1, t: now, life: 450 });
        r.fx.push({ kind: 'boom', x: e.x1, y: e.y1, t: now + 450, life: 400 });
      } else if (e.type === 'shot') {
        r.fx.push({ kind: 'shot', x: e.x0, y: e.y0, x1: e.x1, y1: e.y1, t: now, life: 160 });
      } else if (e.type === 'levelup') {
        r.fx.push({ kind: 'text', x: e.x, y: e.y - 0.4, t: now, life: 2200, text: '★ ' + e.level, size: 40, color: 'rgba(255,220,80,A)' });
      } else if (e.type === 'fell' || e.type === 'rose') {
        r.fx.push({ kind: 'dust', x: e.x, y: e.y, t: now, life: 800 });
      } else if (e.type === 'guarded') {
        r.fx.push({ kind: 'text', x: e.x, y: e.y, t: now, life: 1400, text: '!', size: 44, color: 'rgba(255,80,60,A)' });
      } else if (e.type === 'death') {
        r.fx.push({ kind: 'dust', x: e.x, y: e.y, t: now, life: 700 });
      } else if (e.type === 'unload') {
        r.fx.push({ kind: 'text', x: e.x, y: e.y, t: now, life: 1000, size: 22, text: '+' + e.amount, color: e.kind === 'crystals' ? 'rgba(216,168,255,A)' : 'rgba(210,210,220,A)' });
      } else if (e.type === 'filled' || e.type === 'built') {
        r.fx.push({ kind: 'dust', x: e.x, y: e.y + 0.4, t: now, life: 800 });
      } else if (e.type === 'spawn') {
        r.fx.push({ kind: 'dust', x: e.x, y: e.y, t: now, life: 600 });
      } else if (e.type === 'spotted') {
        r.fx.push({ kind: 'ping', x: e.x, y: e.y, t: now, life: 1200 });
      } else if (e.type === 'tamed') {
        r.fx.push({ kind: 'text', x: e.x, y: e.y, t: now, life: 1400, text: '♥', size: 34, color: 'rgba(255,90,90,A)' });
      }
    }
  }

  CP.createRenderer = createRenderer;
  CP.draw = draw;
  CP.addMarker = addMarker;
  CP.takeEvents = takeEvents;
  CP.unitScreenPos = unitScreenPos;
})(window.CP = window.CP || {});

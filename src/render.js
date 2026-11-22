// Drawing the world onto the main canvas: terrain, buildings, units,
// selection, order markers and fog of war. Reads state, never changes it.
(function (CP) {
  'use strict';

  const S = CP.ART_SCALE;
  const TP = CP.TILE_PX;

  function createRenderer(canvas, state) {
    const ctx = canvas.getContext('2d');
    const terrain = CP.paintTerrain(state.map).toCanvas();
    const lander = CP.paintLander().toCanvas();
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = state.map.w;
    fogCanvas.height = state.map.h;
    const fogCtx = fogCanvas.getContext('2d');
    const fogImage = fogCtx.createImageData(state.map.w, state.map.h);
    return { canvas, ctx, terrain, lander, fogCanvas, fogCtx, fogImage, markers: [], fogTick: -1 };
  }

  /** Interpolated draw position of a unit in screen pixels. */
  function unitScreenPos(u, alpha, cam) {
    const x = u.px + (u.x - u.px) * alpha, y = u.py + (u.y - u.py) * alpha;
    return { x: x * TP - cam.x, y: y * TP - cam.y };
  }

  function drawTerrain(r, cam, vw, vh) {
    const { ctx, terrain } = r;
    ctx.imageSmoothingEnabled = false;
    // Source rectangle in art pixels; whole art pixels only, offset the rest.
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
    // Smooth scaling gives the fog soft edges.
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(fogCanvas, -cam.x, -cam.y, state.map.w * TP, state.map.h * TP);
    ctx.imageSmoothingEnabled = false;
  }

  /** A ring at the feet: bright green for selected units. */
  function drawSelection(ctx, x, y) {
    ctx.strokeStyle = '#4dff6a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y - 4, 22, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHeartsBar(ctx, x, y, u) {
    const max = CP.UNIT_TYPES[u.type].hearts;
    const w = 36, h = 6, t = Math.max(0, u.hearts / max);
    ctx.fillStyle = '#1e0f0c';
    ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = t > 0.5 ? '#4dd25a' : t > 0.25 ? '#f2c230' : '#e8402a';
    ctx.fillRect(x - w / 2, y, w * t, h);
  }

  function drawMarkers(r, cam, now) {
    const { ctx } = r;
    r.markers = r.markers.filter((m) => now - m.t < 700);
    for (const m of r.markers) {
      const k = (now - m.t) / 700;
      const x = m.x * TP - cam.x, y = m.y * TP - cam.y;
      ctx.strokeStyle = `rgba(77,255,106,${1 - k})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y, 26 * (1 - k * 0.7), 11 * (1 - k * 0.7), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }

  /**
   * Draws a frame. `view` holds the camera, selection, hover and drag box
   * from input; `alpha` is how far we are between two simulation ticks.
   */
  function draw(r, state, view, alpha, now) {
    const { ctx } = r;
    const vw = view.w, vh = view.h, cam = view.cam;
    ctx.fillStyle = '#0a0406';
    ctx.fillRect(0, 0, vw, vh);
    drawTerrain(r, cam, vw, vh);

    // Buildings and units sorted by their bottom edge, so nearer things overlap farther ones.
    const items = [];
    for (const b of state.buildings) items.push({ y: b.y + b.size, b });
    for (const u of state.units) items.push({ y: u.py + (u.y - u.py) * alpha, u });
    items.sort((a, b) => a.y - b.y);

    const sel = view.selected;
    for (const it of items) {
      if (it.b) {
        const b = it.b;
        const x = b.x * TP - cam.x, y = b.y * TP - cam.y;
        if (x > vw || y > vh || x + b.size * TP < 0 || y + b.size * TP < -100) continue;
        ctx.drawImage(r.lander, x, y - 24 * S, r.lander.width * S, r.lander.height * S);
        continue;
      }
      const u = it.u;
      const p = unitScreenPos(u, alpha, cam);
      if (p.x < -64 || p.y < -64 || p.x > vw + 64 || p.y > vh + 64) continue;
      if (sel.has(u.id)) drawSelection(ctx, p.x, p.y);
      const moving = u.path.length > 0;
      const frame = moving ? 1 + (Math.floor(u.walk * 6) % 2) : 0;
      const bob = moving && frame === 1 ? -S : 0;
      const spr = CP.unitSprite(u.type, frame, u.facing < 0);
      const art = CP.UNIT_ART;
      ctx.drawImage(spr, Math.round(p.x - art.footX * S), Math.round(p.y - art.footY * S + bob), spr.width * S, spr.height * S);
    }

    // Hearts bars over selected and hovered units, on top of all sprites.
    for (const u of state.units) {
      if (!sel.has(u.id) && view.hover !== u.id) continue;
      const p = unitScreenPos(u, alpha, cam);
      drawHeartsBar(ctx, p.x, p.y - CP.UNIT_ART.footY * S - 10, u);
    }

    drawFog(r, state, cam);
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

  function addMarker(r, x, y, now) {
    r.markers.push({ x, y, t: now });
  }

  CP.createRenderer = createRenderer;
  CP.draw = draw;
  CP.addMarker = addMarker;
  CP.unitScreenPos = unitScreenPos;
})(window.CP = window.CP || {});

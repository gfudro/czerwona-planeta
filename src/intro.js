// Intros: the story of the game and a short briefing before every mission.
// A few shots, each with one short sentence that a narrator reads aloud
// (the browser's Polish voice), because Artur reads slowly. Map shots fly
// the camera over the real mission map with the fog lifted; space shots
// are painted here in pixel art. Data (shots and sentences) is at the top.
(function (CP) {
  'use strict';

  // Each shot: `space` (a painted scene), or `at` (what the camera looks at:
  // a building, a node kind, 'nest', 'lava', or a unit type), plus `text`.
  // `cast` shows big sprites above the sentence.
  CP.INTROS = {
    game: {
      mission: 1,
      shots: [
        { space: 'fly', text: 'Daleko w kosmosie leci rakieta.' },
        { space: 'mars', text: 'Leci na Marsa, Czerwoną Planetę.' },
        { at: 'lander', text: 'Lądujemy! Tu zbudujemy osadę.' },
        { at: 'wreck', text: 'Tu leżą stare wraki. Kto tu był przed nami?' },
        { at: 'mabmia', text: 'Na Marsie mieszkają stwory. Ta jest miła.' },
        { at: 'lander', cast: ['wormSmall', 'maibawu', 'imapia', 'crystalLord'], text: 'Inne są groźne. Bądź dzielny!' },
      ],
    },
    1: [
      { at: 'lander', text: 'Misja pierwsza. Lądowanie.' },
      { at: 'wreck', text: 'Rozbierz wraki na złom.' },
      { at: 'crystal', text: 'Zbuduj kopułę i zbierz kryształy.' },
      { at: 'mabmia', text: 'To Mabmia. Możesz się z nią zaprzyjaźnić.' },
    ],
    2: [
      { at: 'lander', text: 'Misja druga. Robaki.' },
      { at: 'nest', text: 'Z gniazd wyłażą robaki.' },
      { at: 'nest', text: 'Osadnik może zasypać gniazdo.' },
      { at: 'workshop', cast: ['infantry', 'rifleman'], text: 'Piechur i strzelec go obronią.' },
    ],
    3: [
      { at: 'hero', cast: ['hero'], text: 'Misja trzecia. Przyleciał Bohater!' },
      { at: 'maibawu', text: 'Ruin pilnują wojownicy MAibawu.' },
      { at: 'rocket', text: 'Tam leży stara rakieta. Przywieź z niej złom.' },
    ],
    4: [
      { at: 'lander', text: 'Misja czwarta. Krystaliczne złoże.' },
      { at: 'guardian', text: 'Złoża pilnuje Strażnik. Ma twardy pancerz.' },
      { at: 'lander', cast: ['cannon'], text: 'Zbuduj kuźnię. Działo przebije pancerz.' },
    ],
    5: [
      { at: 'lander', text: 'Misja piąta. Królowa.' },
      { at: 'imapia', text: 'To Imapia Wielka, królowa Marsa.' },
      { at: 'imapia', text: 'Chroni ją tarcza. Najpierw pokonaj jej straż.' },
      { at: 'lander', text: 'Uważaj! Wojownicy przyjdą też do bazy.' },
    ],
    6: [
      { at: 'lander', text: 'Misja szósta. Jaskinie.' },
      { at: 'lava', text: 'Schodzimy pod ziemię. Uwaga na lawę!' },
      { at: 'crystalLord', text: 'Tu mieszka Władca Kryształów.' },
      { at: 'crystalLord', cast: ['hero'], text: 'To ostatnia walka. Pokonaj go!' },
    ],
  };

  const PAN_TIME = 1.6; // seconds of camera flight between map shots

  // ---- Narrator (Web Speech) ---------------------------------------------

  const VOICE_KEY = 'czerwona-planeta-lektor';
  let voiceOn = (() => { try { return localStorage.getItem(VOICE_KEY) !== 'off'; } catch (e) { return true; } })();
  let voice = null;

  function pickVoice() {
    if (!window.speechSynthesis) return;
    const pl = speechSynthesis.getVoices().filter((v) => /^pl/i.test(v.lang));
    // Prefer a local voice (works offline, starts at once), then any Polish one.
    voice = pl.find((v) => v.localService) || pl[0] || null;
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }

  /** Reads a sentence aloud; calls done when finished. Returns false if there is no voice. */
  function speak(text, done) {
    if (!voiceOn || !window.speechSynthesis || !voice) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.9;
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
    return true;
  }

  function hush() {
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  CP.narrator = {
    on: () => voiceOn,
    set(on) {
      voiceOn = on;
      try { localStorage.setItem(VOICE_KEY, on ? 'on' : 'off'); } catch (e) { /* not kept */ }
      if (!on) hush();
    },
    available: () => !!voice,
  };

  // ---- Space scenes (painted once at 320×180, scaled up) ------------------

  const SW = 320, SH = 180;
  let spaceArt = null;

  /** Smooth value noise (0..1) with cells of `size` pixels: no square blocks. */
  function noise(x, y, size, seed) {
    const fx = x / size, fy = y / size;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const sx = fx - x0, sy = fy - y0;
    const u = sx * sx * (3 - 2 * sx), v = sy * sy * (3 - 2 * sy);
    const a = CP.hash(x0, y0, seed), b = CP.hash(x0 + 1, y0, seed);
    const c = CP.hash(x0, y0 + 1, seed), d = CP.hash(x0 + 1, y0 + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function paintStars(seed) {
    const c = new CP.PixelCanvas(SW, SH);
    c.rect(0, 0, SW, SH, 0x0a0410);
    // A faint violet haze across the sky.
    for (let y = 0; y < SH; y++)
      for (let x = 0; x < SW; x++) {
        const v = noise(x, y, 60, seed + 5) * 0.65 + noise(x, y, 18, seed + 6) * 0.35;
        if (v > 0.6) c.px(x, y, CP.tone([0x0a0410, 0x140920, 0x1e0e2c, 0x2a1238], (v - 0.6) * 2.6, x, y));
      }
    for (let i = 0; i < 260; i++) {
      const x = Math.floor(CP.hash(i, 1, seed) * SW), y = Math.floor(CP.hash(i, 2, seed) * SH);
      const b = CP.hash(i, 3, seed);
      c.px(x, y, b > 0.9 ? 0xffffff : b > 0.6 ? 0xc8c0e0 : 0x6a6080);
    }
    return c;
  }

  /** Mars: a lit ball of rust with dark plains, a polar cap and a thin glow. */
  function paintMars(r, cap = true) {
    const n = r * 2 + 6;
    const c = new CP.PixelCanvas(n, n);
    const cx = n / 2, cy = n / 2;
    const sand = CP.ramp(0xc4623a, 7, 0.85, 0.5);
    const dark = CP.ramp(0x7a3420, 7, 0.85, 0.4);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const nx = (x + 0.5 - cx) / r, ny = (y + 0.5 - cy) / r;
        const d = nx * nx + ny * ny;
        if (d > 1) {
          if (d < 1.18 && nx + ny < 0.6) c.px(x, y, 0xe8a070, Math.round(90 * (1.18 - d) / 0.18)); // atmosphere
          continue;
        }
        const nz = Math.sqrt(1 - d);
        const l = CP.lightOf(nx, ny, nz, 0.06);
        // Surface pattern in sphere coordinates so it bends with the ball.
        const u = (Math.atan2(nx, nz) + 2) * 40, v = (Math.asin(ny) + 2) * 40;
        const f = noise(u, v, 22, 41) * 0.65 + noise(u, v, 7, 42) * 0.35;
        let col = f > 0.62 ? CP.tone(dark, l, x, y) : CP.tone(sand, l, x, y);
        if (cap && ny * 0.9 - nx * 0.45 < -0.88) col = CP.tone([0x6a6a80, 0xa8a8c0, 0xe8e8f4, 0xffffff], l + 0.1, x, y); // polar cap
        c.px(x, y, col);
      }
    return c;
  }

  function paintMoon(r, base) {
    const n = r * 2 + 2;
    const c = new CP.PixelCanvas(n, n);
    c.litBlob(n / 2, n / 2, r, r * 0.85, CP.ramp(base, 5, 0.8, 0.4), { rough: 0.35, seed: r, ambient: 0.08 });
    return c;
  }

  /** The settlers' rocket, nose to the right: brass hull, copper nose, orange fins, a porthole. */
  function paintRocket() {
    const c = new CP.PixelCanvas(34, 18);
    const M = CP.MAT;
    // Fins first, behind the hull.
    c.poly([3, 1, 10, 6, 10, 12, 3, 17, 6, 9], M.team[3]);
    c.poly([3, 1, 10, 6, 7, 7], M.team[5]);
    // Hull: a cylinder lit from above.
    for (let x = 6; x <= 25; x++)
      for (let y = 4; y <= 13; y++) {
        const ny = (y + 0.5 - 9) / 5;
        c.px(x, y, CP.tone(M.brass, CP.lightOf(0, ny, Math.sqrt(Math.max(0, 1 - ny * ny)), 0.15), x, y));
      }
    // Nose cone.
    for (let x = 26; x <= 33; x++) {
      const half = 5 * (1 - (x - 25) / 9);
      for (let y = Math.round(9 - half); y <= Math.round(9 + half) - 1; y++) {
        const ny = (y + 0.5 - 9) / Math.max(1, half);
        c.px(x, y, CP.tone(M.copper, CP.lightOf(0.3, ny, 0.8, 0.2), x, y));
      }
    }
    // Bands, rivets and a round window.
    for (const bx of [9, 22]) for (let y = 4; y <= 13; y++) c.px(bx, y, M.copper[1 + (y < 8 ? 2 : 0)]);
    c.ellipse(16, 8.5, 2.6, 2.6, M.brass[1]).ellipse(16, 8.5, 1.8, 1.8, 0x3aa8a0).px(15, 7, 0xc8fff4);
    c.rivet(12, 6, M.brass).rivet(19, 6, M.brass);
    c.outline(0x3a1a10);
    return c;
  }

  function spaceAssets() {
    if (spaceArt) return spaceArt;
    const rocket = paintRocket().toCanvas();
    // Pointing down: the same art turned a quarter (exact for pixel art).
    const down = document.createElement('canvas');
    down.width = rocket.height;
    down.height = rocket.width;
    const d = down.getContext('2d');
    d.translate(rocket.height, 0);
    d.rotate(Math.PI / 2);
    d.drawImage(rocket, 0, 0);
    spaceArt = {
      stars: paintStars(7).toCanvas(),
      marsSmall: paintMars(34).toCanvas(),
      marsBig: paintMars(150, false).toCanvas(),
      phobos: paintMoon(5, 0x9a8a80).toCanvas(),
      deimos: paintMoon(3, 0xb0a090).toCanvas(),
      rocket,
      down,
    };
    return spaceArt;
  }

  function flame(ctx, x, y, dir, t) {
    // A flickering exhaust; dir 'left' (flying right) or 'up' (flying down).
    const len = 6 + Math.round(Math.sin(t * 40) * 2 + Math.sin(t * 23) * 1.5);
    const cols = ['#fff6c0', '#ffc040', '#f27a1e', '#c03a10'];
    for (let i = 0; i < len; i++) {
      ctx.fillStyle = cols[Math.min(3, Math.floor((i / len) * 4))];
      const w = Math.max(1, 4 - Math.floor(i / 2));
      if (dir === 'left') ctx.fillRect(x - i, y - Math.floor(w / 2), 1, w);
      else ctx.fillRect(x - Math.floor(w / 2), y - i, w, 1);
    }
  }

  /** Draws a space scene at time t (seconds into the shot) on a 320×180 context. */
  function drawSpace(ctx, kind, t, now) {
    const A = spaceAssets();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(A.stars, 0, 0);
    // A few stars twinkle.
    for (let i = 0; i < 12; i++) {
      const k = Math.sin(now / 300 + i * 1.7);
      if (k < 0.6) continue;
      const x = Math.floor(CP.hash(i, 8, 3) * SW), y = Math.floor(CP.hash(i, 9, 3) * SH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
    }
    const orbit = now / 4000;
    if (kind === 'fly') {
      const mx = 232, my = 60;
      ctx.drawImage(A.marsSmall, mx - A.marsSmall.width / 2, my - A.marsSmall.height / 2);
      ctx.drawImage(A.phobos, Math.round(mx + Math.cos(orbit) * 52) - 6, Math.round(my + Math.sin(orbit) * 18) - 6);
      ctx.drawImage(A.deimos, Math.round(mx + Math.cos(orbit * 0.6 + 2) * 70) - 4, Math.round(my + Math.sin(orbit * 0.6 + 2) * 24) - 4);
      // The rocket crosses from the left toward Mars, a little bob on the way.
      const x = Math.round(-40 + Math.min(1, t / 6) * 190), y = Math.round(118 - Math.min(1, t / 6) * 26 + Math.sin(t * 3) * 1.5);
      flame(ctx, x - 1, y + 9, 'left', t);
      ctx.drawImage(A.rocket, x, y);
    } else {
      // Close to Mars: the planet fills the bottom, the rocket comes down toward it.
      ctx.drawImage(A.phobos, 40, 30);
      ctx.drawImage(A.marsBig, SW / 2 - A.marsBig.width / 2, 92);
      const k = Math.min(1, t / 6);
      const x = 150, y = Math.round(-36 + k * 80);
      flame(ctx, x + 9, y - 1, 'up', t);
      ctx.drawImage(A.down, x, y);
    }
  }

  // ---- Finding what a map shot looks at -----------------------------------

  /** Tile coordinates of what a shot looks at, or the lander as a fallback. */
  function focusOf(state, what) {
    const b = state.buildings.find((o) => o.type === what);
    if (b) return { x: b.x + b.size / 2, y: b.y + b.size / 2 };
    const n = state.nodes.find((o) => o.kind === what);
    if (n) return { x: n.x + n.size / 2, y: n.y + n.size / 2 };
    if (what === 'nest' && state.nests.length) {
      // The nest nearest the base: that's where the first worms come from.
      const l = state.buildings[0];
      const near = [...state.nests].sort((a, c) => (a.x - l.x) ** 2 + (a.y - l.y) ** 2 - (c.x - l.x) ** 2 - (c.y - l.y) ** 2)[0];
      return { x: near.x + 0.5, y: near.y + 0.5 };
    }
    if (what === 'lava') {
      const { map } = state;
      let sx = 0, sy = 0, k = 0;
      const lander = state.buildings[0];
      // The lava pool nearest the base.
      let best = null, bestD = Infinity;
      for (let i = 0; i < map.terrain.length; i++) {
        if (map.terrain[i] !== CP.T.LAVA) continue;
        const x = i % map.w, y = (i / map.w) | 0;
        const d = (x - lander.x) ** 2 + (y - lander.y) ** 2;
        if (d < bestD) { bestD = d; best = { x, y }; }
      }
      if (best) {
        for (let i = 0; i < map.terrain.length; i++) {
          if (map.terrain[i] !== CP.T.LAVA) continue;
          const x = i % map.w, y = (i / map.w) | 0;
          if ((x - best.x) ** 2 + (y - best.y) ** 2 > 36) continue;
          sx += x; sy += y; k++;
        }
        return { x: sx / k + 0.5, y: sy / k + 0.5 };
      }
    }
    const u = state.units.find((o) => o.type === what);
    if (u) return { x: u.x, y: u.y };
    const l = state.buildings[0];
    return { x: l.x + l.size / 2, y: l.y + l.size / 2 };
  }

  // ---- The player ------------------------------------------------------------

  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

  /**
   * Plays an intro over the game screen. `game` gives the view and the state
   * (already loaded with the mission map). Calls onDone when it ends or is skipped.
   */
  function createIntroPlayer(game) {
    const root = document.getElementById('intro');
    let shots = [], i = -1, shotT = 0, minEnd = 0, spoken = false, voiceDone = true, voiceEnd = null, token = 0;
    let from = null, to = null, onDone = null, active = false, space = null, sctx = null;

    function h(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }

    function build() {
      root.innerHTML = '';
      space = h('canvas', 'introSpace');
      space.width = SW;
      space.height = SH;
      sctx = space.getContext('2d');
      root.appendChild(space);
      const box = h('div', 'introBox');
      box.appendChild(h('div', 'introCast'));
      box.appendChild(h('div', 'introText'));
      const row = h('div', 'introRow');
      const dots = h('div', 'introDots');
      row.appendChild(dots);
      const skip = h('button', 'introSkip', CP.STR.skip);
      skip.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
      row.appendChild(skip);
      const next = h('button', 'introNext', CP.STR.next + ' ▶');
      next.addEventListener('click', (e) => { e.stopPropagation(); advance(); });
      row.appendChild(next);
      box.appendChild(row);
      root.appendChild(box);
      // A click anywhere on the picture also moves on.
      root.onclick = () => advance();
    }

    function show(k) {
      i = k;
      const s = shots[i];
      shotT = 0;
      root.querySelector('.introText').textContent = s.text;
      const cast = root.querySelector('.introCast');
      cast.innerHTML = '';
      for (const type of s.cast || []) {
        const spr = CP.unitSprite(type, 0, false);
        const c = document.createElement('canvas');
        c.width = spr.width;
        c.height = spr.height;
        c.getContext('2d').drawImage(spr, 0, 0);
        c.style.width = spr.width * 4 + 'px';
        c.style.height = spr.height * 4 + 'px';
        cast.appendChild(c);
      }
      cast.style.display = s.cast ? 'flex' : 'none';
      const dots = root.querySelector('.introDots');
      dots.innerHTML = '';
      shots.forEach((_, j) => dots.appendChild(h('span', j === i ? 'on' : '')));
      space.style.display = s.space ? 'block' : 'none';
      if (!s.space) {
        const { view } = game;
        from = { x: (view.cam.x + view.w / 2) / CP.TILE_PX, y: (view.cam.y + view.h / 2) / CP.TILE_PX };
        to = s.at;
      }
      // Each shot stays until the narrator finishes, or long enough to read.
      voiceDone = false;
      voiceEnd = null;
      // Cancelling the previous sentence fires its end late: only this shot's sentence counts.
      const my = ++token;
      spoken = speak(s.text, () => { if (my === token) voiceDone = true; });
      // Space shots last until the rocket has flown; map shots give the camera time to arrive.
      minEnd = Math.max(s.space ? 6 : 3.5, spoken ? 0 : 2.5 + s.text.length * 0.08);
    }

    function advance() {
      if (!active) return;
      if (i + 1 >= shots.length) finish();
      else show(i + 1);
    }

    function finish() {
      if (!active) return;
      active = false;
      hush();
      root.style.display = 'none';
      root.innerHTML = '';
      const done = onDone;
      onDone = null;
      if (done) done();
    }

    function play(list, done) {
      shots = list;
      onDone = done;
      active = true;
      build();
      root.style.display = 'block';
      const first = list.find((s) => s.at);
      if (first) {
        const p = focusOf(game.state, first.at);
        CP.centerOn(game.view, game.state.map, p.x, p.y);
      }
      show(0);
    }

    /** Called every frame with real seconds: camera flight, space animation, auto-advance. */
    function update(dt, now) {
      if (!active) return;
      shotT += dt;
      const s = shots[i];
      if (s.space) drawSpace(sctx, s.space, shotT, now);
      else {
        const target = focusOf(game.state, to);
        const k = ease(Math.min(1, shotT / PAN_TIME));
        CP.centerOn(game.view, game.state.map, from.x + (target.x - from.x) * k, from.y + (target.y - from.y) * k);
      }
      // Without a voice, move on by the clock; with one, a beat after it ends
      // (and after 12 s anyway, in case the browser never says it finished).
      if (spoken && voiceDone && voiceEnd == null) voiceEnd = shotT;
      const end = spoken ? (voiceEnd == null ? 12 : Math.max(minEnd, voiceEnd + 1.6)) : minEnd;
      if (shotT >= end) advance();
    }

    function onKey(e) {
      if (!active) return false;
      if (e.key === 'Escape') finish();
      else if (e.code === 'Space' || e.key === 'Enter' || e.key === 'ArrowRight') advance();
      else return false;
      e.preventDefault();
      return true;
    }

    return { play, update, onKey, isActive: () => active, finish };
  }

  CP.createIntroPlayer = createIntroPlayer;
  CP.introFocus = focusOf;
})(window.CP = window.CP || {});

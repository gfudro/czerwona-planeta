// Sound, made in code like the pixel art: every effect is synthesised with
// Web Audio (oscillators and filtered noise), and the music is a gentle
// generated loop. No sound files. Sound and music each have an on/off
// switch, kept in localStorage.
(function (CP) {
  'use strict';

  const KEY = 'czerwona-planeta-dzwiek';
  // Effects clearly above the music; measured peaks: effects about 0.1–0.3, music about 0.04.
  const SFX_VOL = 1, MUSIC_VOL = 0.1;
  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  const prefs = loadPrefs();
  const lastAt = {}; // sound name -> time it last played (to keep battles from turning into noise)

  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { sfx: p.sfx !== false, music: p.music !== false };
    } catch (e) {
      return { sfx: true, music: true };
    }
  }
  function savePrefs() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* not kept */ }
  }

  /** Browsers only allow sound after the player touches the page: start on the first click or key. */
  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.8;
      // A gentle limiter so many sounds at once don't clip.
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 6;
      master.connect(comp).connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = prefs.sfx ? SFX_VOL : 0;
      sfxBus.connect(master);
      musicBus = ctx.createGain();
      musicBus.gain.value = prefs.music ? MUSIC_VOL : 0;
      musicBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    startMusic();
  }
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { capture: true });

  // ---- Building blocks ----------------------------------------------------

  /** One note: an oscillator with a quick attack and a decay, optionally sliding in pitch. */
  function tone(t, freq, dur, { type = 'sine', vol = 0.3, slide = 0, attack = 0.005, bus = sfxBus, pan = 0 } = {}) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    connectPanned(g, bus, pan);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** A burst of filtered noise: hits, shots, rumbles, steam. */
  function noise(t, dur, { freq = 1200, q = 0.8, type = 'bandpass', vol = 0.3, slide = 0, attack = 0.003, bus = sfxBus, pan = 0 } = {}) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slide) f.frequency.exponentialRampToValueAtTime(slide, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g);
    connectPanned(g, bus, pan);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }

  function connectPanned(node, bus, pan) {
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      node.connect(p).connect(bus);
    } else node.connect(bus);
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // ---- Effects ------------------------------------------------------------
  // Each takes the start time, a volume factor and a stereo pan.

  const SOUNDS = {
    click: { gap: 0.04, play: (t, v) => tone(t, 880, 0.06, { type: 'triangle', vol: 0.08 * v }) },
    // Selecting our units: a soft two-step "yes?" blip.
    select: { gap: 0.08, play: (t, v) => { tone(t, 660, 0.07, { type: 'square', vol: 0.09 * v }); tone(t + 0.06, 990, 0.08, { type: 'square', vol: 0.09 * v }); } },
    order: { gap: 0.08, play: (t, v) => { tone(t, 784, 0.06, { type: 'triangle', vol: 0.14 * v }); tone(t + 0.05, 1046, 0.09, { type: 'triangle', vol: 0.12 * v }); } },
    attackOrder: { gap: 0.08, play: (t, v) => { tone(t, 330, 0.08, { type: 'sawtooth', vol: 0.11 * v }); tone(t + 0.07, 247, 0.12, { type: 'sawtooth', vol: 0.11 * v }); } },
    // A sword or claw landing: a short thump with a metallic tick.
    hit: { gap: 0.06, play: (t, v, p) => { noise(t, 0.09, { freq: 900, q: 1.2, vol: 0.28 * v, pan: p }); tone(t, 180, 0.08, { type: 'triangle', vol: 0.2 * v, slide: 90, pan: p }); tone(t, 2400 + Math.random() * 600, 0.04, { type: 'square', vol: 0.03 * v, pan: p }); } },
    rifle: { gap: 0.05, play: (t, v, p) => { noise(t, 0.12, { freq: 2500, q: 0.6, vol: 0.32 * v, slide: 700, pan: p }); tone(t, 900, 0.05, { type: 'square', vol: 0.05 * v, slide: 300, pan: p }); } },
    // The steam cannon: a puff of steam, a deep boom, and the ball landing later.
    cannon: { gap: 0.1, play: (t, v, p) => { noise(t, 0.35, { freq: 3000, type: 'highpass', vol: 0.12 * v, pan: p }); noise(t, 0.5, { freq: 300, type: 'lowpass', vol: 0.4 * v, slide: 60, pan: p }); tone(t, 110, 0.45, { vol: 0.3 * v, slide: 40, pan: p }); } },
    deathCreature: { gap: 0.1, play: (t, v, p) => { tone(t, 420, 0.35, { type: 'sawtooth', vol: 0.09 * v, slide: 80, pan: p }); noise(t, 0.3, { freq: 500, vol: 0.18 * v, slide: 150, pan: p }); } },
    deathOurs: { gap: 0.2, play: (t, v, p) => { tone(t, 523, 0.18, { type: 'triangle', vol: 0.16 * v, pan: p }); tone(t + 0.16, 392, 0.35, { type: 'triangle', vol: 0.16 * v, slide: 330, pan: p }); } },
    crystal: { gap: 0.1, play: (t, v, p) => { for (const [i, n] of [88, 95, 100].entries()) tone(t + i * 0.05, midi(n), 0.25, { type: 'sine', vol: 0.09 * v, pan: p }); } },
    scrap: { gap: 0.1, play: (t, v, p) => { noise(t, 0.08, { freq: 3500, q: 4, vol: 0.4 * v, pan: p }); noise(t + 0.07, 0.1, { freq: 2600, q: 5, vol: 0.32 * v, pan: p }); } },
    // A building is finished: three hammer knocks, then a bright chord.
    built: { gap: 0.3, play: (t, v, p) => { for (let i = 0; i < 3; i++) noise(t + i * 0.11, 0.06, { freq: 1800, q: 3, vol: 0.5 * v, pan: p }); for (const n of [72, 76, 79]) tone(t + 0.36, midi(n), 0.5, { type: 'triangle', vol: 0.15 * v, pan: p }); } },
    trained: { gap: 0.2, play: (t, v, p) => { [67, 72, 76].forEach((n, i) => tone(t + i * 0.08, midi(n), 0.16, { type: 'square', vol: 0.11 * v, pan: p })); } },
    // A worm crawls out of its nest: a low wet rumble.
    spawn: { gap: 0.3, play: (t, v, p) => { noise(t, 0.6, { freq: 220, type: 'lowpass', vol: 0.7 * v, pan: p }); tone(t, 70, 0.5, { type: 'sawtooth', vol: 0.12 * v, slide: 50, pan: p }); } },
    // A creature seen for the first time: a two-tone steam whistle.
    spotted: { gap: 1, play: (t, v) => { tone(t, 698, 0.22, { type: 'square', vol: 0.08 * v }); tone(t + 0.22, 523, 0.32, { type: 'square', vol: 0.08 * v }); noise(t, 0.5, { freq: 4000, type: 'highpass', vol: 0.04 * v }); } },
    levelup: { gap: 0.3, play: (t, v) => { [72, 76, 79, 84].forEach((n, i) => tone(t + i * 0.09, midi(n), 0.3, { type: 'triangle', vol: 0.12 * v })); } },
    fell: { gap: 0.3, play: (t, v, p) => tone(t, 440, 0.6, { type: 'triangle', vol: 0.15 * v, slide: 160, pan: p }) },
    rose: { gap: 0.3, play: (t, v, p) => tone(t, 300, 0.4, { type: 'triangle', vol: 0.15 * v, slide: 700, pan: p }) },
    // Settler tries to dig a guarded deposit: a low "no-no".
    guarded: { gap: 0.8, play: (t, v, p) => { tone(t, 150, 0.14, { type: 'square', vol: 0.13 * v, pan: p }); tone(t + 0.18, 140, 0.18, { type: 'square', vol: 0.13 * v, pan: p }); } },
    tamed: { gap: 0.3, play: (t, v, p) => { tone(t, 900, 0.12, { vol: 0.12 * v, slide: 1400, pan: p }); tone(t + 0.12, 1200, 0.14, { vol: 0.12 * v, slide: 1800, pan: p }); } },
    filled: { gap: 0.3, play: (t, v, p) => { noise(t, 0.3, { freq: 400, type: 'lowpass', vol: 0.4 * v, pan: p }); tone(t + 0.25, midi(79), 0.3, { type: 'triangle', vol: 0.1 * v, pan: p }); } },
    goal: { gap: 0.5, play: (t, v) => { [76, 79, 84].forEach((n, i) => tone(t + i * 0.1, midi(n), 0.5, { type: 'triangle', vol: 0.13 * v })); } },
    win: { gap: 2, play: (t, v) => { [[67, 0], [72, 0.15], [76, 0.3], [79, 0.45], [84, 0.7]].forEach(([n, d]) => { tone(t + d, midi(n), d === 0.7 ? 1.2 : 0.2, { type: 'square', vol: 0.07 * v }); tone(t + d, midi(n - 12), d === 0.7 ? 1.2 : 0.2, { type: 'triangle', vol: 0.1 * v }); }); } },
    lose: { gap: 2, play: (t, v) => { [67, 66, 65, 62].forEach((n, i) => tone(t + i * 0.32, midi(n), i === 3 ? 0.9 : 0.3, { type: 'triangle', vol: 0.14 * v, slide: i === 3 ? midi(58) : 0 })); } },
  };

  /** Plays a sound now. `opts.vol` scales it, `opts.pan` places it left/right. */
  function play(name, opts = {}) {
    if (!ctx || !prefs.sfx || ctx.state !== 'running') return;
    const s = SOUNDS[name];
    if (!s) return;
    const t = ctx.currentTime;
    if (lastAt[name] != null && t - lastAt[name] < s.gap) return;
    lastAt[name] = t;
    s.play(t + 0.01, opts.vol ?? 1, opts.pan || 0);
  }

  /**
   * Where a world event is heard: full volume on screen, quieter just off
   * it, silent far away. Returns null when it shouldn't play at all.
   */
  function placeOf(view, x, y) {
    const TP = CP.TILE_PX;
    const sx = x * TP - view.cam.x, sy = y * TP - view.cam.y;
    const out = Math.max(0, -sx, sx - view.w, -sy, sy - view.h) / TP;
    if (out > 8) return null;
    return { vol: out <= 0 ? 1 : Math.max(0.15, 1 - out / 8), pan: (sx / Math.max(1, view.w) - 0.5) * 0.8 };
  }

  /** Turns simulation events into sounds. */
  function onEvents(state, view) {
    if (!ctx || !prefs.sfx) return;
    for (const e of state.events) {
      const at = e.x != null ? placeOf(view, e.x, e.y) : { vol: 1, pan: 0 };
      if (!at) continue;
      let name = null;
      switch (e.type) {
        case 'dmg': name = 'hit'; break;
        case 'shot': name = e.heavy ? 'cannon' : 'rifle'; break;
        case 'death': name = e.owner === 'player' ? 'deathOurs' : 'deathCreature'; break;
        case 'unload': name = e.kind === 'crystals' || e.kind === 'crystal' ? 'crystal' : 'scrap'; break;
        case 'built': case 'trained': case 'spawn': case 'spotted': case 'levelup':
        case 'fell': case 'rose': case 'guarded': case 'tamed': case 'filled': case 'goal':
        case 'win': case 'lose':
          name = e.type; break;
      }
      if (e.type === 'shot' && e.heavy) {
        // The ball lands a moment later with a thud.
        setTimeout(() => play('hit', { vol: at.vol * 1.4, pan: at.pan }), 420);
      }
      // Melee and shots that are already heard as a shot don't need a second hit sound.
      if (name === 'hit' && state.events.some((o) => o.type === 'shot' && Math.abs(o.x1 - e.x) < 0.6 && Math.abs(o.y1 - e.y) < 0.6)) continue;
      if (name) play(name, at);
    }
  }

  // ---- Music --------------------------------------------------------------
  // A calm generated loop: a soft bass, a music-box arpeggio and a clock tick,
  // in A minor on the surface and lower and darker in the caves.

  let musicTimer = null, nextBar = 0, bar = 0, theme = 'desert';
  const CHORDS = {
    desert: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], // Am F G Em
    cave: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], // Dm Bb C A
  };

  function scheduleBar(t) {
    const chords = CHORDS[theme];
    const ch = chords[bar % chords.length];
    const beat = theme === 'cave' ? 0.62 : 0.5;
    // Bass: root on beats 1 and 3.
    for (const b of [0, 2]) tone(t + b * beat, midi(ch[0] - 24), beat * 1.8, { type: 'triangle', vol: 0.35, attack: 0.02, bus: musicBus });
    // Music-box arpeggio, eight notes per bar, with a little variation every other bar.
    const up = [0, 1, 2, 1, 0, 1, 2, 1];
    for (let i = 0; i < 8; i++) {
      const n = ch[up[i]] + 12 + (bar % 2 && i === 6 ? 12 : 0);
      tone(t + i * beat / 2, midi(n), beat * 0.9, { type: 'sine', vol: 0.16, bus: musicBus });
    }
    // Soft pad: the whole chord, held.
    for (const n of ch) tone(t, midi(n), beat * 4, { type: 'triangle', vol: 0.05, attack: 0.4, bus: musicBus });
    // Clock tick of the steam machines.
    for (let i = 0; i < 4; i++) noise(t + i * beat, 0.03, { freq: 5000, q: 6, vol: 0.05, bus: musicBus });
    bar++;
    return beat * 4;
  }

  function startMusic() {
    if (!ctx || musicTimer) return;
    nextBar = ctx.currentTime + 0.2;
    musicTimer = setInterval(() => {
      if (!prefs.music || ctx.state !== 'running') { nextBar = Math.max(nextBar, ctx.currentTime + 0.2); return; }
      while (nextBar < ctx.currentTime + 1.5) nextBar += scheduleBar(nextBar);
    }, 400);
  }

  function setTheme(t) {
    if (t === theme) return;
    theme = t;
    bar = 0;
  }

  function setSfx(on) {
    prefs.sfx = on;
    savePrefs();
    if (sfxBus) sfxBus.gain.value = on ? SFX_VOL : 0;
  }
  function setMusic(on) {
    prefs.music = on;
    savePrefs();
    if (musicBus) musicBus.gain.setTargetAtTime(on ? MUSIC_VOL : 0, ctx.currentTime, 0.1);
  }

  CP.sound = {
    play,
    onEvents,
    setTheme,
    setSfx,
    setMusic,
    sfxOn: () => prefs.sfx,
    musicOn: () => prefs.music,
    // For checking levels from the console: the context and the master gain.
    debug: () => ({ ctx, master }),
  };
})(window.CP = window.CP || {});

// Game loop and screens: menu -> mission -> win or lose -> menu.
// Fixed-step simulation, drawing every animation frame.
(function (CP) {
  'use strict';

  function start() {
    const canvas = document.getElementById('game');
    const params = new URLSearchParams(location.search);
    const debug = params.has('debug');
    const step = 1 / CP.SIM_HZ;

    let acc = 0;
    let paused = true;
    let speed = 'normal';
    let autoPause = true;
    let screen = 'menu'; // 'menu' | 'intro' | 'play' | 'end'
    let endAt = 0;

    const view = CP.createView();
    const game = {
      state: null,
      view,
      renderer: null,
      now: () => performance.now(),
      alpha: () => Math.min(1, acc / step),
      active: () => screen === 'play',
      togglePause: () => { if (screen === 'play') paused = !paused; },
      setSpeed: (s) => { speed = s; },
      toggleAutoPause: () => { autoPause = !autoPause; },
      startMission,
      briefMission: (id) => playIntro(id),
      playStory: () => playIntro('game'),
      showMenu,
    };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      view.w = rect.width;
      view.h = rect.height;
      view.bottomPad = document.getElementById('bottomHud').offsetHeight;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (game.state) CP.clampCamera(view, game.state.map);
    }

    function load(state) {
      game.state = state;
      game.renderer = CP.createRenderer(canvas, state);
      view.selected = new Set();
      view.selectedBuilding = null;
      view.selectedThing = null;
      view.placing = null;
      view.groups = {};
      acc = 0;
      resize();
      const lander = state.buildings.find((b) => b.type === 'lander');
      if (lander) CP.centerOn(view, state.map, lander.x + 5, lander.y - 1);
      ui.reset();
      CP.sound.setTheme(state.map.theme === 'cave' ? 'cave' : 'desert');
    }

    function startMission(id) {
      leaveIntro();
      load(CP.createMission(id));
      screen = 'play';
      paused = false;
      ui.hideOverlay();
    }

    function showMenu() {
      if (intro.isActive()) intro.finish();
      leaveIntro();
      screen = 'menu';
      paused = true;
      ui.showMenu();
    }

    // ---- Intros: 'game' is the story, a number is that mission's briefing ----
    const INTRO_KEY = 'czerwona-planeta-historia';
    function storySeen() {
      try { return localStorage.getItem(INTRO_KEY) === '1' || CP.loadProgress().won.length > 0; } catch (e) { return true; }
    }

    function leaveIntro() {
      if (!document.body.classList.contains('intro')) return;
      document.body.classList.remove('intro');
      resize();
    }

    /** Shows an intro over its mission map with the fog lifted, then the mission (or the menu after the story). */
    function playIntro(key) {
      const def = CP.INTROS[key];
      const missionId = key === 'game' ? def.mission : key;
      const shots = key === 'game' ? def.shots : def;
      document.body.classList.add('intro');
      const state = CP.createMission(missionId);
      state.reveal = true;
      CP.updateFog(state);
      load(state);
      screen = 'intro';
      paused = false;
      ui.hideOverlay();
      intro.play(shots, () => {
        if (key !== 'game') { startMission(key); return; }
        try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) { /* not kept */ }
        leaveIntro();
        load(CP.createMission(1));
        showMenu();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (screen === 'intro' && intro.onKey(e)) e.stopImmediatePropagation();
    }, true);
    window.addEventListener('resize', resize);
    document.addEventListener('fullscreenchange', resize);
    document.addEventListener('webkitfullscreenchange', resize);
    CP.attachInput(canvas, game);
    const ui = CP.createUI(game);
    const intro = CP.createIntroPlayer(game);
    game.intro = intro;

    // ?sandbox opens the stage-1 test map with 12 units; ?mission=2 jumps into a mission.
    if (params.has('sandbox')) {
      load(CP.createSandbox(Number(params.get('seed')) || 1));
      screen = 'play';
      paused = false;
      ui.hideOverlay();
    } else if (params.get('mission')) {
      startMission(Number(params.get('mission')));
    } else {
      load(CP.createMission(1)); // something to show behind the menu
      // First time here: a title card whose Start click lets the narrator speak.
      if (storySeen()) showMenu();
      else { screen = 'menu'; paused = true; ui.showTitle(); }
    }

    /** Reacts to what happened in the simulation: auto-pause, minimap pings, end of mission. */
    function handleEvents(now) {
      const state = game.state;
      CP.takeEvents(game.renderer, state, now);
      if (screen === 'intro') { state.events.length = 0; return; }
      CP.sound.onEvents(state, view);
      for (const e of state.events) {
        if (e.type === 'spotted') {
          ui.ping(e.x, e.y, now);
          if (autoPause) paused = true;
        } else if (e.type === 'xp') {
          CP.saveHero(state.hero);
        } else if (e.type === 'win') {
          CP.saveWin(state.mission.id);
          endAt = now + 1500;
          screen = 'end';
          ui.endWin = true;
        } else if (e.type === 'lose') {
          endAt = now + 1500;
          screen = 'end';
          ui.endWin = false;
        }
      }
      state.events.length = 0;
    }

    const dbg = document.getElementById('debug');
    let frames = 0, fpsT = performance.now(), work = 0;
    if (debug) dbg.style.display = 'block';

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const t0 = performance.now();
      const state = game.state;
      if (screen === 'intro') intro.update(dt, now);
      else CP.updateCamera(view, state.map, dt);
      // The world keeps running a moment after the end, then the end screen shows.
      const running = (screen === 'play' && !paused) || screen === 'intro' || (screen === 'end' && endAt > 0);
      if (running) {
        acc += dt * CP.SPEEDS[speed];
        while (acc >= step) {
          CP.tick(state);
          acc -= step;
        }
      }
      handleEvents(now);
      if (screen === 'end' && endAt > 0 && now >= endAt) {
        endAt = 0;
        ui.showEnd(ui.endWin);
      }
      CP.updateHover(game);
      CP.draw(game.renderer, state, view, game.alpha(), now);
      ui.update(paused, speed, autoPause, now);
      if (debug) {
        work += performance.now() - t0;
        frames++;
        if (now - fpsT >= 1000) {
          dbg.textContent = `${frames} fps · ${(work / frames).toFixed(1)} ms`;
          frames = 0; work = 0; fpsT = now;
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.CP_GAME = game; // handy for poking at the game from the console
  }

  window.addEventListener('DOMContentLoaded', start);
})(window.CP = window.CP || {});

// Game loop: fixed-step simulation, drawing every animation frame.
(function (CP) {
  'use strict';

  function start() {
    const canvas = document.getElementById('game');
    const params = new URLSearchParams(location.search);
    const seed = Number(params.get('seed')) || 1;
    const debug = params.has('debug');

    const state = CP.createSandbox(seed);
    const view = CP.createView();
    const renderer = CP.createRenderer(canvas, state);
    const step = 1 / CP.SIM_HZ;
    let acc = 0;
    let paused = false;
    let speed = 'normal';

    const game = {
      state,
      view,
      renderer,
      now: () => performance.now(),
      alpha: () => Math.min(1, acc / step),
      togglePause: () => { paused = !paused; },
      setSpeed: (s) => { speed = s; },
    };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      view.w = rect.width;
      view.h = rect.height;
      view.bottomPad = document.getElementById('bottomHud').offsetHeight;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      renderer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderer.ctx.imageSmoothingEnabled = false;
      CP.clampCamera(view, state.map);
    }
    window.addEventListener('resize', resize);
    resize();

    const lander = state.buildings[0];
    CP.centerOn(view, state.map, lander.x + 4, lander.y);

    CP.attachInput(canvas, game);
    const ui = CP.createUI(game);

    // Debug readout (?debug in the address): frames per second and work per frame.
    const dbg = document.getElementById('debug');
    let frames = 0, fpsT = performance.now(), work = 0;
    if (debug) dbg.style.display = 'block';

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const t0 = performance.now();
      CP.updateCamera(view, state.map, dt);
      if (!paused) {
        acc += dt * CP.SPEEDS[speed];
        while (acc >= step) {
          CP.tick(state);
          acc -= step;
        }
      }
      CP.updateHover(game);
      CP.draw(renderer, state, view, game.alpha(), now);
      ui.update(paused, speed);
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

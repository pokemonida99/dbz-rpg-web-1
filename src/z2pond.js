// Z2 Namek: the pond Dragon Ball (story page 419 「池のドラゴンボール」), the original's rock-pushing mini-game on
// one of six 20×15 maps (CE 79 picks it at random). Gohan swims tile by tile like an RPG Maker VX character; the
// action button pushes the rock he faces one tile the way he faces (CE 78); the timer (20 s, CE 75) is filled up
// again on the surface row (CE 77: SE 'Z3 回復'; the surface row then turns solid until he is back on row 1); when it
// runs out he says 「從頭開始吧……」 and the map starts over (rocks back, Gohan at the start). The action button on
// the Dragon Ball ends it (CE 76: variable 41 = 420). Data: world.pond (tools/build_z2pond.py); rules: docs/z2-pond.md.
// Runs at the original's 60 frames a second whatever the display rate; window.__pond.tick(n) steps it by hand.
import { img, audio, say, input, rand } from './core.js?v=20261102-1750';
import { renderMap, tileSheetPaths } from './tiles.js?v=20261102-1750';
import { el, overlay } from './fieldmenu.js?v=20261102-1750';

const DIR = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }; // RPG Maker directions
const ROW = { 2: 0, 4: 1, 6: 2, 8: 3 }; // character sheet rows
const KEYS = { ArrowUp: 8, KeyW: 8, ArrowDown: 2, KeyS: 2, ArrowLeft: 4, KeyA: 4, ArrowRight: 6, KeyD: 6 };
const COL0 = 1, COLS = 18; // shown columns (the two outer wall columns of each side are cut to one)
const FADE = 30; // frames, like the event fade commands

// draws a B–E sheet tile (an event's tile graphic) at dx, dy
function drawTileId(c, id, dx, dy) {
  const sheet = img(tileSheetPaths[5 + (id >> 8)]);
  if (!sheet.ok) return;
  const t = id & 255;
  c.drawImage(sheet.im, ((t % 8) + (t >> 7) * 8) * 32, ((t >> 3) % 16) * 32, 32, 32, Math.round(dx), Math.round(dy), 32, 32);
}

// resolves true when Gohan has the Dragon Ball. opts.pattern: 1-6 to choose the map (testing)
export async function pondPuzzle(game, opts = {}) {
  const world = game.world, P = world.pond, s = game.state;
  s.var = s.var || {};
  s.sw = s.sw || {};
  // CE 79: variable 380 = rand(variable 379) + 1, then 376/377/378 = map, x, y
  const n = opts.pattern || rand(P.patterns.length) + 1;
  const pat = P.patterns.find((q) => q.n === n) || P.patterns[0];
  Object.assign(s.var, { 379: P.patterns.length, 380: pat.n, 376: pat.map, 377: pat.x, 378: pat.y });
  s.sw[98] = true;
  const map = P.maps[pat.map], pas = world.passages, W = map.w, H = map.h;
  await img(P.chara).p;
  const layers = renderMap(map, pas);
  const stickWas = input.stickEnabled;
  input.stickEnabled = false;
  audio.playBgm(P.bgm, 100);

  // ---------- the map's state (set up again on a restart, like re-entering the map) ----------
  const STEP = 2 ** P.speed / 256; // tiles a frame (speed 4: 16 frames a tile)
  let pl, rocks, sw99, timer, timerOn;
  const ball = { x: pat.ball[0], y: pat.ball[1] };
  const surface = new Set(pat.surface.map(([x, y]) => x + y * W));
  function setup() {
    pl = { x: pat.x, y: pat.y, rx: pat.x, ry: pat.y, dir: P.startDir, pattern: 1, anime: 0 };
    rocks = pat.rocks.map(([x, y, keep, speed]) => ({ x, y, rx: x, ry: y, keep: !!keep, step: 2 ** speed / 256, route: 0 }));
    sw99 = false;
    timer = P.timer * 60; // CE 75: timer 20 s
    timerOn = true;
  }
  setup();

  // Game_Map#passable? for the tiles (layers 2, 1, 0; ☆ tiles don't count)
  const tileOk = (x, y) => {
    for (let z = 2; z >= 0; z--) {
      const p = pas[map.layers[z][x + y * W]];
      if (p & 0x10) continue;
      return (p & 1) === 0;
    }
    return false;
  };
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const rockAt = (x, y) => rocks.find((r) => r.x === x && r.y === y);
  const ballAt = (x, y) => ball.x === x && ball.y === y;
  // the player: blocked by the tiles and by the "same as characters" events (rocks, the ball, the surface row
  // while switch 99 is on)
  const playerCan = (x, y) => inside(x, y) && tileOk(x, y) && !rockAt(x, y) && !ballAt(x, y) && !(sw99 && surface.has(x + y * W));
  // an event: blocked by every event that isn't "through" (the surface events too, whatever their page) and the player
  const rockCan = (x, y) => inside(x, y) && tileOk(x, y) && !rockAt(x, y) && !ballAt(x, y) && !surface.has(x + y * W)
    && !(pl.x === x && pl.y === y);
  const moving = (o) => o.rx !== o.x || o.ry !== o.y;
  const approach = (o, step) => {
    o.rx = o.rx < o.x ? Math.min(o.x, o.rx + step) : Math.max(o.x, o.rx - step);
    o.ry = o.ry < o.y ? Math.min(o.y, o.ry + step) : Math.max(o.y, o.ry - step);
  };
  const front = () => { const [dx, dy] = DIR[pl.dir]; return [pl.x + dx, pl.y + dy]; };

  // ---------- screen ----------
  const root = overlay('zp');
  const timerEl = el('div', 'zp-timer', '00:20');
  const help = el('button', 'zp-help', '說明');
  const top = el('div', 'zp-top', el('div', 'zp-title', '池中的龍珠'), help, timerEl);
  const cv = el('canvas', 'zp-map');
  const hint = el('div', 'zp-hint', '游到最上面一排可以換氣');
  const pad = el('div', 'zp-pad');
  const padBtns = {};
  for (const [d, label, area] of [[8, '▲', 'u'], [4, '◀', 'l'], [6, '▶', 'r'], [2, '▼', 'd']]) {
    const b = el('button', 'zp-dir', label);
    b.style.gridArea = area;
    padBtns[d] = b;
    pad.append(b);
  }
  const act = el('button', 'zp-act', '決定');
  const controls = el('div', 'zp-controls', pad, act);
  const fadeEl = el('div', 'zp-fade');
  root.append(top, cv, hint, controls, fadeEl);
  const off = document.createElement('canvas');
  off.width = W * 32; off.height = H * 32;
  const oc = off.getContext('2d');

  function fit() {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr));
    if (cv.width !== w) { cv.width = w; cv.height = Math.round((w * H) / COLS); }
  }

  function draw() {
    oc.drawImage(layers.ground, 0, 0);
    for (const r of rocks) drawTileId(oc, P.rockTile, r.rx * 32, r.ry * 32);
    drawTileId(oc, P.ballTile, ball.x * 32, ball.y * 32);
    const ch = img(P.chara);
    if (ch.ok) {
      const k = P.charaIndex, col = pl.pattern < 3 ? pl.pattern : 1;
      oc.drawImage(ch.im, ((k % 4) * 3 + col) * 32, (Math.floor(k / 4) * 4 + ROW[pl.dir]) * 32, 32, 32,
        Math.round(pl.rx * 32), Math.round(pl.ry * 32 - 4), 32, 32);
    }
    oc.drawImage(layers.upper, 0, 0);
    fit();
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(off, COL0 * 32, 0, COLS * 32, H * 32, 0, 0, cv.width, cv.height);
    // Sprite_Timer: mm:ss of the whole seconds left
    const sec = Math.floor(timer / 60);
    const t = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    if (timerEl.textContent !== t) timerEl.textContent = t;
    timerEl.style.visibility = timerOn ? 'visible' : 'hidden';
    fadeEl.style.opacity = String(fade);
    const [fx, fy] = front();
    const label = rockAt(fx, fy) ? '推岩石' : ballAt(fx, fy) ? '拿龍珠' : '決定';
    if (act.textContent !== label) { act.textContent = label; act.classList.toggle('on', label !== '決定'); }
  }

  // ---------- input: held directions (keys, d-pad, a drag on the map), single steps (taps), the action button ----------
  const capture = (t, e) => { try { t.setPointerCapture(e.pointerId); } catch (err) { /* not a live pointer */ } };
  const keyStack = [];
  let padDir = 0, dragDir = 0, queued = 0, action = 0;
  const onKey = (e) => {
    const d = KEYS[e.code];
    if (e.type === 'keydown') {
      if (d) { if (!keyStack.includes(d)) keyStack.push(d); if (!busy) queued = d; e.preventDefault(); }
      if ((e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') && !e.repeat) { action = 12; e.preventDefault(); }
    } else if (d && keyStack.includes(d)) keyStack.splice(keyStack.indexOf(d), 1);
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  for (const [d, b] of Object.entries(padBtns)) {
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); capture(b, e); padDir = +d; queued = +d; });
    const up = () => { if (padDir === +d) padDir = 0; };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
  }
  act.addEventListener('pointerdown', (e) => { e.preventDefault(); action = 12; });
  let drag = null;
  cv.addEventListener('pointerdown', (e) => { capture(cv, e); drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }; });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) < 16) { if (drag.moved) dragDir = 0; return; }
    drag.moved = true;
    dragDir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 4 : 6) : dy < 0 ? 8 : 2;
    if (!queued) queued = dragDir;
  });
  const dragEnd = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (!drag.moved) { // a tap: on the rock / ball in front (or on Gohan) → the action button; elsewhere → one step (or a turn) that way
      const r = cv.getBoundingClientRect();
      const tx = COL0 + Math.floor(((e.clientX - r.left) / r.width) * COLS), ty = Math.floor(((e.clientY - r.top) / r.height) * H);
      const [fx, fy] = front();
      if ((tx === fx && ty === fy && (rockAt(fx, fy) || ballAt(fx, fy))) || (tx === pl.x && ty === pl.y)) action = 12;
      else {
        const dx = tx - pl.x, dy = ty - pl.y;
        queued = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 4 : 6) : dy < 0 ? 8 : 2;
      }
    }
    drag = null;
    dragDir = 0;
  };
  cv.addEventListener('pointerup', dragEnd);
  cv.addEventListener('pointercancel', dragEnd);

  // ---------- the frame (Scene_Map#update order: events, player, timer, the parallel CE 77) ----------
  let busy = false, paused = false, fade = 1, fading = -1 / FADE, done = false;
  let onBall = null, onTimeUp = null;
  function frame() {
    if (fading) { fade = Math.min(1, Math.max(0, fade + fading)); if (fade === 0 || fade === 1) fading = 0; }
    // the rocks: a pushed rock moves when it stands still; one that can't keeps trying if its route isn't skippable
    for (const r of rocks) {
      if (moving(r)) approach(r, r.step);
      else if (r.route) {
        const [dx, dy] = DIR[r.route];
        if (rockCan(r.x + dx, r.y + dy)) { r.x += dx; r.y += dy; r.route = 0; approach(r, r.step); }
        else if (!r.keep) r.route = 0;
      }
    }
    // the player (Game_Player#update: move_by_input when movable, then the action button when standing still)
    if (!busy && !moving(pl)) {
      const d = dragDir || padDir || keyStack[keyStack.length - 1] || queued;
      queued = 0;
      if (d) {
        pl.dir = d;
        const [dx, dy] = DIR[d];
        if (playerCan(pl.x + dx, pl.y + dy)) { pl.x += dx; pl.y += dy; }
      }
    }
    if (moving(pl)) approach(pl, STEP);
    if (!busy && !moving(pl) && action) {
      action = 0;
      const [fx, fy] = front();
      const r = rockAt(fx, fy);
      if (r) r.route = pl.dir; // CE 78: move one tile the way the player faces
      else if (ballAt(fx, fy)) onBall();
    }
    if (action) action--;
    // step animation (always on): the pattern turns every 10 frames, 1.5× as fast while moving
    pl.anime += moving(pl) ? 1.5 : 1;
    if (pl.anime > 18 - P.speed * 2) { pl.pattern = (pl.pattern + 1) % 4; pl.anime = 0; }
    if (timerOn && !paused && timer > 0) timer--; // Game_System#update
    if (!busy) { // CE 77
      s.var[55] = pl.y;
      if (pl.y === 1) sw99 = false;
      if (pl.y === 0) {
        timer = P.timer * 60;
        if (!sw99) audio.se(P.breathSe, 100);
        sw99 = true;
      }
      if (Math.floor(timer / 60) <= 0) onTimeUp();
    }
  }

  let raf = 0, last = performance.now(), acc = 0, waiters = [], hold = false; // hold: only __pond.tick moves it (tests)
  const tick = (k) => {
    for (let i = 0; i < k && !done; i++) frame();
    draw();
    waiters = waiters.filter((w) => !w());
  };
  const loop = (now) => {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    const k = Math.floor(acc * 60);
    acc -= k / 60;
    tick(hold ? 0 : k);
    if (!done) raf = requestAnimationFrame(loop);
  };
  const until = (cond) => new Promise((res) => waiters.push(() => cond() && (res(), true)));
  const fadeTo = (v) => { fading = v ? 1 / FADE : -1 / FADE; return until(() => fade === v); };

  help.onclick = async () => {
    if (busy) return;
    busy = paused = true; // (this version's help: the clock waits while it is read)
    await say(P.rules);
    busy = paused = false;
  };

  const result = new Promise((res) => {
    onBall = async () => { // CE 76
      busy = true;
      timerOn = false;
      s.var[41] = P.var41;
      s.sw[98] = false;
      await fadeTo(1);
      res(true);
    };
  });
  onTimeUp = async () => { // CE 77: 悟飯「從頭開始吧……」 → map 19 → back to the start (the map set up again)
    busy = true;
    padDir = dragDir = queued = action = 0;
    keyStack.length = 0;
    await say(P.restart);
    await fadeTo(1);
    setup();
    await fadeTo(0); // CE 75's fade-in
    queued = action = 0; // (taps during the message don't carry over)
    busy = false;
  };

  window.__pond = {
    tick, pattern: pat.n,
    get state() { return { x: pl.x, y: pl.y, dir: pl.dir, moving: moving(pl), timer, sw99, busy, rocks: rocks.map((r) => [r.x, r.y]), rocksMoving: rocks.some((r) => moving(r) || r.route) }; },
    press(d) { queued = d; }, act() { action = 12; }, hold(v = true) { hold = v; },
  };
  draw();
  raf = requestAnimationFrame(loop);
  await result;
  done = true;
  cancelAnimationFrame(raf);
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('keyup', onKey);
  delete window.__pond;
  input.stickEnabled = stickWas;
  input.confirmQueued = false;
  root.remove();
  return true;
}

const css = document.createElement('style');
css.textContent = `
.zp { z-index: 28; background: #000; color: #fff; align-items: stretch; gap: 6px; touch-action: none; overflow: hidden; }
.zp-top { display: flex; align-items: center; gap: 8px; padding: 0 4px; }
.zp-title { flex: 1; font-size: 18px; color: var(--gold); }
.zp-help { font-size: 14px; padding: 4px 10px; color: var(--ink); background: var(--cream); border: 2px solid var(--rust); }
.zp-timer { font-family: Arial, sans-serif; font-size: 28px; font-weight: 700; min-width: 3.2em; text-align: right; }
.zp-map { width: 100%; height: auto; aspect-ratio: ${COLS} / 15; image-rendering: pixelated; touch-action: none; }
.zp-hint { font-size: 13px; color: #bbb; text-align: center; }
.zp-controls { flex: 1; display: flex; align-items: center; justify-content: space-around; min-height: 0; padding-bottom: 6px; }
.zp-pad { display: grid; grid-template: ". u ." 56px "l . r" 56px ". d ." 56px / 60px 60px 60px; gap: 2px; }
.zp-dir, .zp-act { color: var(--ink); background: var(--cream); border: 3px solid var(--rust); border-radius: 10px; font-size: 22px; touch-action: none; }
.zp-dir:active { background: var(--cream-hi); }
.zp-act { width: 104px; height: 104px; border-radius: 50%; font-size: 19px; opacity: .55; }
.zp-act.on { opacity: 1; background: var(--gold); }
.zp-fade { position: absolute; inset: 0; background: #000; pointer-events: none; opacity: 1; }
@media (max-height: 700px) { .zp-pad { grid-template: ". u ." 48px "l . r" 48px ". d ." 48px / 54px 54px 54px; } .zp-act { width: 88px; height: 88px; } }
`;
document.head.appendChild(css);

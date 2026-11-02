// The Z2 mini-game "shake off Dodoria" (the original's ボスアクション: TBoss_Scene.new(1), TBoss_Player, TBoss_Enemy1,
// TBoss_EBullet, TBoss_Ground, TBoss_Effect2), started by story page 326 (variable 41) after Frieza's men attack the
// Namekian village. The player only dodges: the shots of TBoss_Player are commented out in the original, and
// neither side ever loses HP (the `@hp -= n` lines are commented out too), so there is no game over. Dodoria stays at
// the right edge following the player's height and throws energy balls at him; after 10 × 400 frames he flies off
// to the right and the scene ends. Every hit (a ball, or touching Dodoria) while not blinking counts one.
// On leaving: variable 53 = the number of hits, variable 41 = 336, switch 1 (TBOSS::RESULT_CLEAR_ID) = true.
// Page 336 then reads variable 53: 0 → the 大長老 and 仙豆 cards; otherwise every member loses 53 × 10 HP.
//
// It runs at the original's 60 frames a second with its fixed-point (<< 10) positions, speeds and frame counts on
// its 640×480 screen, shown at the top of the portrait screen; the damage window sits under it and the rest of the
// screen is a drag pad. Dragging moves the player like the original's arrow keys (one per axis, 2500/1024 px a
// frame); with no left / right "key" held he drifts right at half speed, as in the original. Arrow keys / WASD too.
import { img, audio, input, rand } from './core.js?v=20261102-1344';
import { el, overlay } from './fieldmenu.js?v=20261102-1344';

const SHOOT = 'Graphics/Pictures/shoot1.png'; // (0,0) the player, (32,0) Dodoria
const GROUND = 'Graphics/Pictures/Z2_シューティング背景.png';
const ICONS = 'Graphics/Pictures/アイコン.PNG'; // icon (96,0) 16×16
const EBULLET = 'Graphics/System/ebullet2.png'; // index 0, 32×32
const EFFECT = 'Graphics/System/effect1.png';
export const SHOOT_PICTURES = [SHOOT, GROUND, ICONS, EBULLET, EFFECT];
const BGM = 'GBZ2 ミニゲーム2';
const SE_HIT = 'Z1 爆発1'; // TBOSS::SE_NAME[3] (100, 100)
const SE_SHOT = 'Z3 エネルギー波'; // TBOSS::SE_NAME[5], played at enemy count 35

const W = 640, H = 480;
const SHOOT_TIME = 400; // frames per progress mark; the game ends at 10 marks
const TRANSITION = 10; // Scene_Base#perform_transition: Graphics.transition(10) also advances Graphics.frame_count
const SPEED = 2500; // TBoss_Player @speed
const SKY = 'rgb(152,232,0)'; // TBoss_Ground @back_main (640×420)
const GROUND_Y = 480 - 60, SCROLL_SPEED = 6;
const DAMAGE_TEXT = '受到傷害:';

export async function shootingGame(game) {
  const s = game.state;
  s.var = s.var || {};
  s.sw = s.sw || {};
  await Promise.all(SHOOT_PICTURES.map((p) => img(p).p));
  audio.playBgm(BGM, 100);

  const root = overlay('zs');
  const stage = el('canvas', 'zs-stage');
  stage.width = W; stage.height = H;
  const win = el('div', 'win zs-win');
  const hudCv = el('canvas', 'zs-hud');
  hudCv.width = 208 * 2; hudCv.height = 48 * 2; // the window's 208×48 contents, drawn at 2× for the text
  win.append(hudCv);
  const pad = el('div', 'zs-pad', '拖曳畫面移動');
  root.append(stage, win, pad);

  // ---- the scene (names after the original's) ----
  let frameCount = 0; // Graphics.frame_count - @start_frame (the first TRANSITION frames are the fade-in)
  let state = 0, shootEnd = false, enemyState = 0, damageCount = 0;
  let drawIcon = 1, hud = { damage: 0, e: 0, blink: 1 }, hudDirty = true;
  let seHit = false;
  // TBoss_Ground: two copies of the strip scrolling right
  let groundX = 0, groundSubX = -W;
  // TBoss_Player.new(64, 200)
  const P = { sx: 64 << 10, sy: 200 << 10, x: 64, y: 200, throw: 0, visible: true };
  // TBoss_Enemy1.new(640 - 64, 200)
  const E = { sx: 576 << 10, sy: 200 << 10, x: 576, y: 200, vx: 0, vy: 0, cnt: 0 };
  let bullets = [], effects = [];

  // ---- input: the original's Input.press? of the four directions ----
  const drag = { id: null, ax: 0, ay: 0, bx: 0, by: 0, tx: 0, ty: 0 };
  const forced = { L: false, R: false, U: false, D: false }; // tests (__zs.keys)
  function pressed() {
    const k = input.keys;
    const p = {
      L: forced.L || k.has('ArrowLeft') || k.has('KeyA'), R: forced.R || k.has('ArrowRight') || k.has('KeyD'),
      U: forced.U || k.has('ArrowUp') || k.has('KeyW'), D: forced.D || k.has('ArrowDown') || k.has('KeyS'),
    };
    if (drag.id !== null) { // head for the dragged-to spot, one "key" per axis
      const dx = drag.tx - P.x, dy = drag.ty - P.y;
      if (dx < -1.5) p.L = true; else if (dx > 1.5) p.R = true;
      if (dy < -1.5) p.U = true; else if (dy > 1.5) p.D = true;
    }
    return p;
  }
  const toGame = () => W / stage.getBoundingClientRect().width;
  root.addEventListener('pointerdown', (e) => {
    if (drag.id !== null) return;
    drag.id = e.pointerId;
    drag.ax = e.clientX; drag.ay = e.clientY; drag.bx = P.x; drag.by = P.y;
    drag.tx = P.x; drag.ty = P.y;
    try { root.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ }
  });
  root.addEventListener('pointermove', (e) => {
    if (e.pointerId !== drag.id) return;
    const k = toGame();
    drag.tx = Math.max(32, Math.min(576, drag.bx + (e.clientX - drag.ax) * k));
    drag.ty = Math.max(0, Math.min(336, drag.by + (e.clientY - drag.ay) * k));
  });
  const endDrag = (e) => { if (e.pointerId === drag.id) drag.id = null; };
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);

  // ---- TBoss_Player ----
  function damagePlayer() {
    if (P.throw > 0) return false;
    damageCount++;
    seHit = true; // se_flag[3]
    P.throw = 120;
    return true;
  }
  function updatePlayer() {
    if (P.throw > 0) P.throw--;
    const k = pressed();
    let vx = 0, vy = 0;
    if (k.L) vx = -SPEED; else if (k.R) vx = SPEED;
    if (k.U) vy = -SPEED; else if (k.D) vy = SPEED;
    if (!k.L && !k.R) vx = SPEED / 2;
    P.sx = Math.max(32 << 10, Math.min((608 - 32) << 10, P.sx + vx));
    P.sy = Math.max(0, Math.min((400 - 64) << 10, P.sy + vy));
    P.x = P.sx >> 10; P.y = P.sy >> 10;
    P.visible = ((P.throw / 2) | 0) % 2 === 0;
  }

  // ---- TBoss_Enemy / TBoss_Enemy1 ----
  function shot(speed, tuibi) { // nway_shot / pursuit_shot (1, 0.2, 0.0, speed, true, 2, 0): one ball aimed at the player
    const x = E.sx + (16 << 10), y = E.sy + (16 << 10);
    const d = Math.atan2(P.sy + (16 << 10) - y, P.sx + (16 << 10) - x);
    addBullet(E.x + 16, E.y + 16, Math.trunc(Math.cos(d) * speed), Math.trunc(Math.sin(d) * speed), tuibi);
  }
  function enemyAction() {
    if (!shootEnd) {
      const v = enemyState === 0 ? 1500 : 2000;
      E.vy = P.y > E.y ? v : P.y < E.y ? -v : 0; // $shoot_player_y vs $shoot_enemy_y (last frame's)
      if (E.cnt >= 60) E.cnt = 0;
      if (enemyState === 0) {
        if (E.cnt === 15) shot(4500, 0);
        if (E.cnt === 50) shot(4500, 0);
      } else {
        if (E.cnt === 15) shot(4500, 1);
        if (E.cnt === 30 && rand(4) === 1) shot(6500, 0);
        if (E.cnt === 50) shot(4500, 1);
      }
      if (E.cnt === 35) audio.se(SE_SHOT, 100, 100);
    } else {
      E.vy = 0;
      E.vx = 1500;
    }
  }
  let ex = 576, ey = 200; // $shoot_enemy_x / _y
  function updateEnemy() {
    enemyAction();
    E.cnt++;
    E.sx = Math.max(0, Math.min((640 + 64) << 10, E.sx + E.vx));
    E.sy = Math.max(0, Math.min((400 - 64) << 10, E.sy + E.vy));
    E.x = E.sx >> 10; E.y = E.sy >> 10;
    ex = E.x; ey = E.y;
    if (P.x + 32 > E.x && P.x < E.x + 32 && P.y + 32 > E.y && P.y < E.y + 32) damagePlayer();
  }

  // ---- TBoss_EBullet (type 2, index 0) ----
  function addBullet(cx, cy, vx, vy, tuibi) {
    const x = cx - 16, y = cy - 16;
    bullets.push({ x, y, sx: x << 10, sy: y << 10, vx, vy, tuibi, gone: false });
  }
  function updateBullet(b) {
    if (b.tuibi === 0 || P.x > b.x - 64) b.sy += b.vy; // (the original adds vy twice in this case)
    else b.vy = P.y > b.y ? 700 : P.y < b.y ? -700 : 0; // homing while the player is well to its left
    b.sy += b.vy;
    b.sx += b.vx;
    b.x = b.sx >> 10; b.y = b.sy >> 10;
    if (P.x + 24 > b.x && P.x + 8 < b.x + 32 && P.y + 24 > b.y && P.y + 8 < b.y + 32) {
      damagePlayer();
      addEffect(b.x + 16, b.y + 16);
      b.x = 640;
    }
    if (b.x < -12 || b.x >= 640 || b.y < -12 || b.y >= 410 - 40) b.gone = true;
  }

  // ---- TBoss_Effect2: the hit flash ----
  function addEffect(x, y) { effects.push({ x, y, opacity: 255, zoom: 0.5, cnt: 32 }); }
  function updateEffects() {
    for (const f of effects) {
      f.opacity = Math.max(0, f.opacity - 8);
      f.zoom += 0.01;
      f.cnt--;
    }
    // at cnt 0 the original moves it to x = 640 (by then fully transparent); it is never seen again
    effects = effects.filter((f) => f.cnt > 0 && f.opacity > 0);
  }

  // ---- TBoss_Scene#update_situation: the damage window ----
  function updateSituation() {
    const e = Math.floor(frameCount / SHOOT_TIME);
    if (frameCount % 30 === 0) drawIcon = -drawIcon;
    hud = { damage: damageCount, e, blink: drawIcon };
    hudDirty = true;
    if (e === 10) {
      shootEnd = true;
      bullets = []; // clear_bullet
    }
  }

  let done = null;
  function frame() {
    frameCount++;
    // TBoss_Ground#update
    groundX += SCROLL_SPEED;
    if (groundX >= W) groundX -= W * 2;
    groundSubX += SCROLL_SPEED;
    if (groundSubX >= W) groundSubX -= W * 2;
    updateEffects();
    if (state === 0) {
      updatePlayer(); // update_game
      updateEnemy();
      for (const b of bullets) updateBullet(b);
      bullets = bullets.filter((b) => !b.gone);
      if (Math.floor(frameCount / SHOOT_TIME) === 5 && enemyState < 1) enemyState++;
      if (!shootEnd) updateSituation();
      if (ex >= 700) state = 1;
    } else if (state === 1 && !done) { // update_result
      done = { var53: damageCount };
    }
    if (seHit) { seHit = false; audio.se(SE_HIT, 100, 100); }
  }

  function draw() {
    const c = stage.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.globalAlpha = 1;
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    c.fillStyle = SKY;
    c.fillRect(0, 0, W, 420);
    const g = img(GROUND).im, sh = img(SHOOT).im, bl = img(EBULLET).im, fx = img(EFFECT).im;
    c.drawImage(g, groundX, GROUND_Y);
    c.drawImage(g, groundSubX, GROUND_Y);
    c.drawImage(sh, 32, 0, 32, 32, E.x, E.y, 32, 32); // z 90
    if (P.visible) c.drawImage(sh, 0, 0, 32, 32, P.x, P.y, 32, 32); // z 100
    for (const b of bullets) c.drawImage(bl, 0, 0, 32, 32, b.x, b.y, 32, 32); // z 110
    for (const f of effects) { // z 200; ox = oy = 16, zoomed
      c.globalAlpha = f.opacity / 255;
      const z = 32 * f.zoom;
      c.drawImage(fx, f.x - 16 * f.zoom, f.y - 16 * f.zoom, z, z);
    }
    c.globalAlpha = 1;
    if (frameCount < TRANSITION) { c.fillStyle = `rgba(0,0,0,${1 - frameCount / TRANSITION})`; c.fillRect(0, 0, W, H); }
    if (hudDirty) drawHud();
  }
  function drawHud() {
    hudDirty = false;
    const h = hudCv.getContext('2d');
    h.setTransform(2, 0, 0, 2, 0, 0);
    h.imageSmoothingEnabled = false;
    h.clearRect(0, 0, 208, 48);
    h.fillStyle = getComputedStyle(win).color || '#2a1a0c';
    h.font = '16px Cubic11, "PingFang TC", sans-serif';
    h.textBaseline = 'middle';
    h.textAlign = 'left'; h.fillText('Ｇ', 0, 8);
    h.textAlign = 'right'; h.fillText('Ｓ', 208, 8);
    const ic = img(ICONS).im;
    for (let x = 0; x <= hud.e; x++) {
      const on = x !== hud.e ? x <= 10 : hud.blink === -1 && x <= 9;
      if (on) h.drawImage(ic, 16 * 6, 0, 16, 16, 200 - x * 16 - 32, 2, 16, 16);
    }
    h.font = '18px Cubic11, "PingFang TC", sans-serif';
    h.textAlign = 'center';
    h.fillText(DAMAGE_TEXT + String(hud.damage).padStart(2, ' '), 100, 35);
  }

  // ---- 60 frames a second whatever the display rate; __zs.tick(n) steps it by hand (tests with a hidden page) ----
  let raf = 0, last = performance.now(), acc = 0, finish;
  const finished = new Promise((res) => { finish = res; });
  const tick = (n) => {
    for (let i = 0; i < n && !done; i++) {
      if (frameCount < TRANSITION) { frameCount++; continue; } // the transition: the scene stands still, frame_count runs on
      frame();
    }
    draw();
    if (done) finish();
  };
  const loop = (now) => {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    const n = Math.floor(acc * 60);
    acc -= n / 60;
    tick(n);
    if (!done) raf = requestAnimationFrame(loop);
  };
  draw();
  raf = requestAnimationFrame(loop);
  window.__zs = {
    tick, keys: forced,
    get state() { return { frameCount, state, shootEnd, enemyState, damageCount, player: [P.x, P.y, P.throw], enemy: [E.x, E.y, E.cnt], bullets: bullets.length, effects: effects.length }; },
  };
  await finished;

  // TBoss_Scene#update_result / terminate
  cancelAnimationFrame(raf);
  s.var[53] = done.var53;
  s.var[41] = 336;
  s.sw[1] = true; // TBOSS::RESULT_CLEAR_ID = (@state == 1)
  audio.stopBgm(); // $game_temp.map_bgm.play: page 326 had stopped the music before the game
  delete window.__zs;
  root.remove();
  return done;
}

const css = document.createElement('style');
css.textContent = `
.zs { background: #000; align-items: center; gap: 0; padding-left: 0; padding-right: 0; touch-action: none; overflow: hidden; }
.zs-stage { width: 100%; max-width: 640px; height: auto; aspect-ratio: 640 / 480; image-rendering: pixelated; }
.zs .zs-win { width: min(100% - 8px, 440px); margin-top: 6px; padding: 4px 6px; }
.zs-hud { display: block; width: 100%; height: auto; aspect-ratio: 208 / 48; }
.zs-pad { flex: 1; align-self: stretch; margin: 6px 4px 0; border: 2px dashed #555; border-radius: 12px; color: #888;
  display: flex; align-items: center; justify-content: center; font-size: 16px; min-height: 120px; }
`;
document.head.appendChild(css);

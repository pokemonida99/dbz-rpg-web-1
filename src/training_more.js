// 修行格：Z3 起原版四種隨機（速度・波波・界王的冷笑話・琪琪，chk_training），原版 Map007 事件 1 頁 31／33／34／35 — docs/cards-plan.md,
// docs/training-more.md. src/training.js picks one (chk_training: from Z3 on rand(4)) and runs the speed training itself;
// the other three are here, each after its scene in the original (z1field 33-35), the lines from world.trainingMore
// (tools/build_training_more.py):
//   1 Mr. Popo     117_Scene_Db_Popo_Training     20 seconds: press the direction Popo shows up in (not in the middle)
//   2 King Kai     116_Scene_Db_Dajare_Training   a pun slot machine: 3 tries to stop both halves on a matching pair
//   3 Chi-Chi      111_Scene_Db_Chi_Chi_Training  play a hand card with as many attack stars as hers or more
// All three: Z3 ミニゲーム music, the trainee is picked first (or none), the rewards are src/training.js trainingRewards
// (EXP × the EXP rate, as the speed training). Frame counts are the original's (60 a second).
import { img, audio, rand } from './core.js?v=20261102-2311';
import { newCard } from './battle.js?v=20261102-2311';
import { makeMember, applyLevel } from './party.js?v=20261102-2311';
import { el, sprite, overlay, button } from './fieldmenu.js?v=20261102-2311';
import { addTraining, trainingRewards, drawCard, zpRate } from './training.js?v=20261102-2311';
import { registerZ3 } from './z3.js?v=20261102-2311';

const FACES = 'Graphics/Pictures/Z1_顔味方.PNG', FACE_CARDS = 'Graphics/Pictures/顔カード.PNG';
const PIC = (n) => `Graphics/Pictures/Z3_修行_${n}.PNG`;
const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動', SE_HIT = 'Z3 アタリ', SE_MISS = 'Z3 ハズレ', SE_EXP = 'Z3 経験値取得';
const BGM = 'Z3 ミニゲーム';
const FRAME = 1000 / 60;
const era = (s) => (s.var || {})[40] || 0;

// step() 60 times a second until it returns false (fixed steps, whatever the display rate)
function frames(step) {
  return new Promise((res) => {
    let last = performance.now(), acc = 0;
    const loop = (t) => {
      acc += Math.min(250, Math.max(0, t - last));
      last = t;
      while (acc >= FRAME) {
        acc -= FRAME;
        if (step() === false) { res(); return; }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
const wait = (n) => frames(() => --n > 0); // Graphics.wait(n)

// the screen every training shares: a message window, buttons at the bottom; a tap outside the buttons answers
// a "tap to go on" page (input_loop_run)
function shell(cls) {
  const root = overlay(`tr trn ${cls}`);
  const msg = el('div', 'win tr-msg');
  const bar = el('div', 'tr-bar');
  let wake = null;
  root.addEventListener('click', (e) => { if (!e.target.closest('button') && wake) { const w = wake; wake = null; w(); } });
  const ui = {
    root, msg, bar,
    say(lines) { msg.textContent = lines.join('\n'); },
    buttons(...bs) { bar.innerHTML = ''; bar.append(...bs); },
    tap() { return new Promise((res) => { wake = res; }); },
    // a page that waits for 確定 (or a tap anywhere)
    async page(lines, label = '確定', se = true) {
      if (lines) ui.say(lines);
      const p = ui.tap();
      ui.buttons(button(label, () => wake && wake()));
      await p;
      ui.buttons();
      if (se) audio.se(SE_OK);
    },
    // a choice between buttons → the index picked
    ask(...labels) {
      return new Promise((res) => ui.buttons(...labels.map((l, i) => button(l, () => { ui.buttons(); res(i); }))));
    },
  };
  return ui;
}

// state 0: who trains (Scene_Db_Status mode 4) → the member, or null for 不修行
function pickTrainee(game, ui) {
  const s = game.state;
  ui.say(game.world.trainingMore.pick);
  const box = el('div', 'tr-pick');
  ui.bar.before(box);
  return new Promise((res) => {
    for (const p of s.party) {
      const b = el('button', 'tr-mem', sprite(FACES, 0, 64 * (p.id - 3), 64, 64), el('span', '', `${p.name} Lv${p.level}`));
      b.onclick = () => { audio.se(SE_OK); box.remove(); ui.buttons(); res(p); };
      box.append(b);
    }
    ui.buttons(button('不修行', () => { audio.se(SE_OK); box.remove(); ui.buttons(); res(null); }));
  });
}

function leave(game, ui) {
  audio.se('Z1 出る');
  ui.root.remove();
  game.field.enter();
}

const rewardPage = (ui) => async (lines) => { await ui.page(lines); };

// ======================================================================================================
// 1 Mr. Popo (Scene_Db_Popo_Training)
// ======================================================================================================
// Popo appears in the middle, left, right, at the front or at the back of the lookout (448×256 picture), stands
// still a moment and leaves; 0.8 s later he is somewhere again. Press his direction while he stands there (once per
// appearance): every side appearance counts, a press while he is in the middle counts as a miss. After 20 seconds
// (1200 frames) he comes back to the middle and it ends. rate = hits / appearances.
const POPO_KINDS = [0, 2, 4, 6, 8, 51, 52, 53]; // @popo_output_kind_pattern: 2 front, 8 back, 4 left, 6 right, 51-53 middle
const POPO_END = 60 * 20;
export function popoSim() {
  const P = { pfc: 4, kind: 51, prog: 1, touch: 0, hits: 0, count: 0, frame: 0, view: { kind: 51, prog: 1, bubble: false } };
  // output_popo, once a frame; false when the training is over (window state 5)
  P.step = () => {
    P.frame++;
    if (P.pfc === 0 && P.kind === 0 && POPO_END < P.frame) P.kind = 51;
    else if (P.pfc === 0 && P.kind === 0) {
      P.touch = 0;
      P.kind = POPO_KINDS[P.count === 0 && P.frame > 800 ? rand(4) + 1 : rand(7) + 1]; // (only the middle for 800 frames: a side now)
      if (P.kind < 10) P.count++;
    }
    P.view = { kind: P.kind, prog: P.prog, bubble: P.kind === 53 && P.pfc < 240 - 80 && P.pfc > 4 };
    if (P.kind !== 0) {
      if (P.prog === 0 || P.prog === 2) { if (P.pfc === 0) P.pfc = 4; } // appearing / leaving
      else if (P.prog === 1) { if (P.pfc === 0) P.pfc = P.kind === 52 ? 80 : P.kind === 53 ? 240 : 26; } // standing
      else if (P.prog === 3) { P.pfc = 48; P.kind = 0; P.prog = 0; } // gone for a while
    }
    if (P.pfc > 0) P.pfc--;
    if (P.pfc === 0 && P.kind !== 0) P.prog++;
    return !(POPO_END < P.frame && P.kind === 51 && P.prog === 2);
  };
  // chk_touch_result
  P.press = (dir) => {
    if (P.kind === dir && P.prog === 1 && P.touch === 0) { audio.se(SE_HIT); P.hits++; }
    else if (P.touch === 0) {
      audio.se(SE_MISS);
      if (P.kind >= 51) P.count++;
    }
    P.touch = 1;
  };
  return P;
}

function drawPopo(c, v) {
  c.clearRect(0, 0, 448, 256);
  const bg = img(PIC('神の神殿_背景'));
  if (bg.ok) c.drawImage(bg.im, 0, 0);
  if (!v || !v.kind) return;
  const still = v.prog === 1;
  // put_x / put_y: (320, 272) on the 640×480 screen, the picture at (96, 48)
  const at = { 2: ['手前', 192, 176], 8: ['奥', 210, 36], 4: ['中央', 64, 96], 6: ['中央', 352, 96] }[v.kind] || ['中央', 208, 96];
  const p = img(PIC(`神の神殿_ポポ${still ? '' : '移動'}_${at[0]}`));
  if (p.ok) c.drawImage(p.im, at[1], at[2]);
  if (v.bubble) { const b = img(PIC('神の神殿_ポポ停止')); if (b.ok) c.drawImage(b.im, 240, 64); }
}

async function popoTraining(game) {
  const world = game.world, s = game.state, T = world.trainingMore.popo;
  audio.playBgm(BGM);
  const ui = shell('trn-popo');
  const stage = el('canvas', 'trn-temple');
  stage.width = 448; stage.height = 256;
  const pad = el('div', 'trn-pad');
  pad.hidden = true;
  ui.root.append(ui.msg, stage, pad, ui.bar);
  let P = popoSim(), playing = false;
  drawPopo(stage.getContext('2d'), P.view); // (the lookout with Popo in the middle while the rules are shown)
  const bgReady = img(PIC('神の神殿_背景'));
  if (!bgReady.ok) bgReady.p.then(() => drawPopo(stage.getContext('2d'), P.view));
  const press = (dir) => { if (playing) P.press(dir); };
  for (const [dir, label, area] of [[8, '▲', 'u'], [4, '◀', 'l'], [6, '▶', 'r'], [2, '▼', 'd']]) {
    const b = el('button', 'trn-dir', label);
    b.style.gridArea = area;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(dir); });
    pad.append(b);
  }
  const keys = (e) => { const d = { ArrowUp: 8, ArrowLeft: 4, ArrowRight: 6, ArrowDown: 2 }[e.key]; if (d) { e.preventDefault(); press(d); } };
  window.addEventListener('keydown', keys);

  const m = await pickTrainee(game, ui);
  if (m) {
    pad.hidden = false;
    await ui.page(T.rule1); // state 2
    await ui.page(T.rule2, '開始'); // state 3
    ui.say(T.go); // state 4
    P = popoSim();
    ui.root.sim = P; // (for testing)
    playing = true;
    pad.classList.add('on');
    await frames(() => { const go = P.step(); drawPopo(stage.getContext('2d'), P.view); return go; });
    playing = false;
    pad.classList.remove('on');
    ui.say(T.end); // state 5
    audio.se(SE_EXP);
    const ratio = P.count ? P.hits / P.count : 0, rate = P.count ? Math.floor((P.hits * 100) / P.count) : 0;
    let exp = m.level * 120 * ratio; // get_exp
    const k = rate === 100 ? 2.7 : rate >= 75 ? 2.2 : rate >= 50 ? 1.9 : rate >= 25 ? 1.6 : rate >= 15 ? 1.3 : 1;
    exp = Math.trunc(exp * k) * ([1, 2][era(s)] || 4);
    await trainingRewards(game, m, {
      first: [T.rate.replace('{n}', rate)], exp, cap: Math.ceil(ratio * m.level), sp: Math.ceil(ratio * m.level),
      zp: Math.ceil(ratio * 10) * zpRate(s), tec: Math.ceil(ratio * 3), pool: 'raw', // (155606)
    }, T, rewardPage(ui));
  }
  window.removeEventListener('keydown', keys);
  leave(game, ui);
}

// ======================================================================================================
// 2 King Kai's puns (Scene_Db_Dajare_Training)
// ======================================================================================================
// Three tries. Each: both halves of the pun spin (one step a frame); 確定 stops the first half, 確定 stops the second,
// which then rolls on three more steps (10 frames each) — and half the time (rand(2), "必ずあたる") on until it
// matches. A matching pair makes King Kai laugh: one more success. EXP = level × 100 × successes (× 2 Z2, × 3 Z3 on).
const KAIO = PIC('界王ダジャレ'); // (64,0) laughing, (0,64,128,64) laughing out loud, (128,0) ○, (160,0) ✕

async function dajareTraining(game) {
  const world = game.world, s = game.state, T = world.trainingMore.dajare;
  audio.playBgm(BGM);
  const ui = shell('trn-dajare');
  const face = el('canvas', 'trn-kaio');
  face.width = 128; face.height = 64;
  const talk = el('div', 'win trn-talk');
  const rows = [0, 1, 2].map((i) => {
    const mark = el('canvas', 'trn-mark');
    mark.width = 32; mark.height = 32;
    const mae = el('span', 'trn-mae'), ato = el('span', 'trn-ato');
    const row = el('div', 'win trn-row', el('span', 'trn-no', `${'１２３'[i]}：`), mark, mae, el('span', 'trn-dots', '……'), ato);
    row.hidden = true;
    return { row, mark, mae, ato };
  });
  ui.root.append(el('div', 'trn-head', face, talk), ...rows.map((r) => r.row), ui.msg, ui.bar);
  ui.msg.classList.add('trn-low');

  let result = 0, count = 0, n = 0; // @training_result, @training_count, @roulette_count
  let maeNo = 0, atoNo = 0, spin = false, seCount = 0, laugh = false;
  const mae = [], ato = []; // @roulette_mae_result / @roulette_ato_result (1-3)
  const paint = () => { // output_character / output_tra_msg / output_roulette
    const c = face.getContext('2d');
    c.clearRect(0, 0, 128, 64);
    const k = img(KAIO), f = img(FACE_CARDS);
    if (laugh) { if (k.ok) c.drawImage(k.im, 0, 64, 128, 64, 0, 0, 128, 64); }
    else if (result === 4) { if (k.ok) c.drawImage(k.im, 64, 0, 64, 64, 64, 0, 64, 64); }
    else if (f.ok) c.drawImage(f.im, era(s) * 64, 64 * 25, 64, 64, 64, 0, 64, 64);
    talk.textContent = (T.kaio[result] || []).join('\n');
    rows.forEach((r, i) => {
      const j = i + 1;
      r.row.hidden = n < j;
      if (n < j) return;
      r.mae.textContent = T.mae[mae[j] ?? maeNo];
      r.ato.textContent = T.ato[ato[j] ?? atoNo];
      const mc = r.mark.getContext('2d');
      mc.clearRect(0, 0, 32, 32);
      if (n >= j + 1 && k.ok) mc.drawImage(k.im, mae[j] === ato[j] ? 128 : 160, 0, 32, 32, 0, 0, 32, 32);
    });
  };
  const tick = () => { // one frame of pre_update: the spinning halves move on, the slot sound every 3rd frame
    if (spin) {
      if (seCount === 2) { audio.se(SE_MOVE); seCount = 0; } else seCount++;
    }
    paint();
    if (n >= 1 && n <= 3) {
      if (mae[n] === undefined) maeNo = (maeNo + 1) % T.mae.length;
      if (ato[n] === undefined) atoNo = (atoNo + 1) % T.ato.length;
    }
  };
  let ticking = true;
  const ticker = frames(() => { tick(); return ticking; });
  const pics = [img(KAIO), img(FACE_CARDS)].filter((p) => !p.ok).map((p) => p.p);
  if (pics.length) Promise.all(pics).then(paint);

  const m = await pickTrainee(game, ui);
  if (m) {
    ui.say(T.rule); // state 2
    let label = '開始';
    for (;;) {
      await ui.page(null, label);
      if (n === 0) { // → state 3: the first try
        ui.say(T.play);
        spin = true; n = 1; result = 1; label = '停止';
        continue;
      }
      if (mae[n] === undefined) { mae[n] = maeNo; continue; } // the first half stops
      // the second half stops, rolls on 3 (and maybe more) steps
      spin = false;
      ato[n] = atoNo;
      const sure = rand(2) === 0; // rand(@roulette_surely_hit_probability - 1)
      for (let i = 1, loop = 3; i <= loop; i++) {
        await wait(10);
        ato[n] = (ato[n] + 1) % T.ato.length;
        audio.se(SE_MOVE);
        if (i === loop && sure && mae[n] !== ato[n]) loop++;
      }
      if (mae[n] === ato[n]) { // chk_training_result
        laugh = true;
        await wait(60);
        laugh = false;
        result = 4;
        count++;
      } else result = 2;
      await ui.page(null, n < 3 ? '下一個' : '確定', false); // (state 4: no 決定 sound, the hit / miss one instead)
      if (result === 2) { result = 3; audio.se(SE_MISS); } else { result = 5; audio.se(SE_HIT); }
      if (n !== 3) {
        await wait(20);
        spin = true; n++; label = '停止';
        continue;
      }
      n = 4; // state 5: the last ○ / ✕
      paint();
      await wait(60);
      break;
    }
    audio.se(SE_EXP);
    const lv = m.level;
    await trainingRewards(game, m, {
      exp: lv * 100 * count * ([1, 2][era(s)] || 3), cap: count * Math.floor(lv / 2), sp: count * Math.floor(lv / 3),
      zp: count * 8 * zpRate(s), tec: count, pool: 'raw', // (154946)
    }, T, rewardPage(ui));
  }
  ticking = false;
  await ticker;
  leave(game, ui);
}

// ======================================================================================================
// 3 Chi-Chi (Scene_Db_Chi_Chi_Training)
// ======================================================================================================
// Chi-Chi shows one of six cards (attack stars rand(8)); 45 frames later play a hand card with as many stars or more
// (her 7 also loses to a 1, her 8 to a 2). Each win flips the card played and deals the one before it anew; then
// 繼續 or 放棄. A loss ends it with half the rewards; 99 wins is 完全制霸 (and, as in the original, half too).
//   EXP level × 2.5 per win (Z1) │ × 3 + level × 10 (Z2) │ × 15 + level × 90 (Z3 on), × 1.5 / 2 / 2.5 / 3.5 from
//   25 / 50 / 75 / 99 wins;  CAP = SP = wins, ZP = ⌈wins / 2⌉, ⌈wins / 7⌉ random moves
const CHICHI_STOP = 45; // CHI_CHI_STOP_FRAME
export const chichiBeats = (her, mine) => her <= mine || (her === 6 && mine === 0) || (her === 7 && mine === 1); // (0-based stars)

async function chichiTraining(game) {
  const world = game.world, s = game.state, T = world.trainingMore.chichi;
  audio.playBgm(BGM);
  const ui = shell('trn-chichi');
  const say = el('div', 'win trn-talk');
  const tally = el('div', 'win trn-count');
  const cv = el('canvas', 'trn-table');
  cv.width = 464; cv.height = 236;
  ui.root.append(el('div', 'trn-head', say, tally), cv, ui.msg, ui.bar);
  ui.msg.classList.add('trn-low');

  const hand = s.hand;
  let m = null, msgno = 0, state = 0, count = 0, open = null, card = null, cursor = 0, stop = 0, hurt = false;
  let used = [false, false, false, false, false, false], old = null, success = false;
  const paint = () => {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, 464, 236);
    const f = img(FACE_CARDS);
    if (f.ok) c.drawImage(f.im, 64 * era(s), 64 * 19, 64, 64, 0, 16, 64, 64); // Chi-Chi
    for (let a = 0; a < 6; a++) drawCard(c, card || {}, 80 + 64 * a, 0, open !== a);
    c.fillStyle = '#000';
    c.fillRect(0, 140, 64, 64);
    if (m) { const p = img(FACES); if (p.ok) c.drawImage(p.im, hurt ? 64 : 0, 64 * (m.id - 3), 64, 64, 0, 140, 64, 64); }
    hand.forEach((cd, k) => drawCard(c, cd, 80 + 64 * k, 140, used[k]));
    if (state === 3 && Math.floor(performance.now() / 300) % 2) { // the blinking ▼ over the chosen card
      c.fillStyle = '#f83800';
      c.beginPath(); c.moveTo(80 + 64 * cursor + 25, 124); c.lineTo(80 + 64 * cursor + 39, 124); c.lineTo(80 + 64 * cursor + 32, 136); c.fill();
    }
    say.textContent = T.say[msgno] || '';
    tally.textContent = `${String(count).padStart(2, '0')}回`;
  };
  let ticking = true;
  const ticker = frames(() => { // update: Chi-Chi's 45 frames, then "你會出什麼呢？"
    if (stop > 0 && state === 3 && --stop === 0) { msgno = 2; armHand(); }
    paint();
    return ticking;
  });
  const firstFree = (from) => { for (let k = 0; k < 6; k++) { const i = (from + k) % 6; if (!used[i]) return i; } return 0; };
  let choose = null; // resolves with the hand card played
  const armHand = () => ui.buttons(button('出這張牌', () => { if (choose) { audio.se(SE_OK); const c = choose; choose = null; c(cursor); } }));
  cv.addEventListener('click', (e) => { // first tap points at a hand card, the second plays it
    if (state !== 3 || stop > 0 || !choose) return;
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 464, y = ((e.clientY - r.top) / r.height) * 236;
    const i = Math.floor((x - 80) / 64);
    if (y < 120 || i < 0 || i > 5 || used[i]) return;
    if (i !== cursor) { audio.se(SE_MOVE); cursor = i; return; }
    audio.se(SE_OK);
    const c = choose; choose = null; c(i);
  });
  const keys = (e) => {
    if (state !== 3 || stop > 0 || !choose) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      audio.se(SE_MOVE);
      const d = e.key === 'ArrowRight' ? 1 : 5;
      let i = cursor;
      do i = (i + d) % 6; while (used[i] && i !== cursor);
      cursor = i;
    }
  };
  window.addEventListener('keydown', keys);

  m = await pickTrainee(game, ui);
  if (m) {
    state = 2;
    await ui.page(T.rule1); // state 2, msgno 0 / 1
    await ui.page(T.rule2, '開始');
    let end = null; // 'stop' | 'fail' | 'master'
    for (;;) {
      // → state 3: Chi-Chi plays a card (create_card 1)
      ui.say(T.play);
      card = { ...newCard(), g: 1 };
      open = rand(6);
      state = 3; msgno = 1; stop = CHICHI_STOP;
      cursor = firstFree(0);
      ui.buttons();
      const k = await new Promise((res) => { choose = res; if (!stop) armHand(); });
      ui.buttons();
      if (chichiBeats(card.a, hand[k].a)) { // chk_training
        audio.se('Z2 アイテム取得');
        if (old != null) { hand[old] = newCard(); used[old] = false; }
        used[k] = true;
        old = k;
        count++;
        msgno = 4; state = 4; open = null;
        if (count >= 99) {
          msgno = 10; state = 6;
          await ui.page([T.master]);
          end = 'master';
          break;
        }
        if (await ui.ask('繼續', '放棄') === 1) { // B: stopped (state 6)
          success = true; msgno = 9; state = 6;
          end = 'stop';
          break;
        }
        audio.se(SE_OK);
      } else {
        audio.se('Z1 ダメージ');
        success = false; state = 7; msgno = 8; old = k; hurt = true;
        await ui.page([T.fail]);
        end = 'fail';
        break;
      }
    }
    void end;
    audio.se(SE_EXP);
    const half = (n) => (success ? n : Math.ceil(n / 2));
    const e = m.level * 2.5, v = era(s);
    let exp = v === 0 ? e * count : v === 1 ? e * count * 3 + m.level * 10 : e * count * 15 + m.level * 90;
    exp *= count >= 99 ? 3.5 : count >= 75 ? 2.5 : count >= 50 ? 2 : count >= 25 ? 1.5 : 1;
    exp = count ? Math.trunc(exp) : 0;
    await trainingRewards(game, m, {
      exp: half(exp), cap: half(count), sp: half(count), zp: half(Math.ceil(count / 2) * zpRate(s)), tec: half(Math.ceil(count / 7)), pool: 'raw',
    }, T, rewardPage(ui));
  }
  if (old != null) { hand[old] = newCard(); used[old] = false; await wait(50); } // the last card played is dealt anew
  window.removeEventListener('keydown', keys);
  ticking = false;
  await ticker;
  leave(game, ui);
}

addTraining(1, popoTraining);
addTraining(2, dajareTraining);
addTraining(3, chichiTraining);

// ?dev=trn (a Z3 party by a training square on map 33; the field picks the training as the original does),
// ?dev=trn1 / trn2 / trn3 (always Popo / King Kai / Chi-Chi there; trn0 the speed training) — src/training.js reads it
registerZ3('trn', {
  maps: [],
  start() {},
  dev(game, step) {
    if (!/^trn[0-3]?$/.test(step)) return false;
    const w = game.world, s = game.state = game.newState();
    s.var[40] = 2;
    s.flags.z3 = 'done';
    s.party = [3, 4, 5, 12].map((id) => {
      const m = makeMember(w, id);
      m.level = 40;
      m.exp = w.actors[id].exp[m.level];
      m.maxLv = m.level;
      applyLevel(w, m);
      m.hp = m.maxhp; m.ki = m.maxki;
      return m;
    });
    const poi = w.pois['33'].find((p) => p.effect === 'training');
    s.map = '33'; s.x = poi.x * 32 + 16; s.y = (poi.y + 1) * 32 + 16;
    game.startField();
    setTimeout(() => game.interact(poi), 300);
    return true;
  },
});

const css = document.createElement('style');
css.textContent = `
.trn { gap: 6px; }
.trn .tr-msg.trn-low { min-height: 4.2em; font-size: 15px; }
.trn-head { display: flex; align-items: stretch; gap: 6px; width: 100%; }
.trn-talk { flex: 1; min-height: 3.6em; font-size: 15px; line-height: 1.5; white-space: pre-wrap; }
.trn-count { flex: none; display: flex; align-items: center; font-size: 18px; }
.trn-kaio { width: 160px; height: 80px; align-self: center; }
.trn-row { display: flex; align-items: center; gap: 6px; width: 100%; min-height: 60px; font-size: min(18px, 4.3vw); white-space: nowrap; }
.trn-row[hidden] { display: none; }
.trn-mark { width: 32px; height: 32px; flex: none; }
.trn-no { flex: none; }
.trn-mae, .trn-ato { flex: 1; min-width: 0; overflow: hidden; }
.trn-ato { text-align: left; }
.trn-dots { flex: none; }
.trn-table { width: min(100%, 464px); height: auto; aspect-ratio: 464 / 236; }
.trn-temple { width: min(100%, 448px); height: auto; aspect-ratio: 448 / 256; }
.trn-pad { display: grid; grid-template: ". u ." 64px "l . r" 64px ". d ." 64px / 76px 76px 76px; gap: 4px; align-self: center; opacity: .6; }
.trn-pad.on { opacity: 1; }
.trn-pad[hidden] { display: none; }
.trn-dir { color: var(--ink); background: var(--cream, #fff0d0); border: 3px solid var(--rust, #c8642a); border-radius: 10px; font-size: 24px; touch-action: none; user-select: none; -webkit-user-select: none; }
.trn-dir:active { background: var(--gold, #f8c040); }
@media (max-height: 700px) { .trn-pad { grid-template: ". u ." 54px "l . r" 54px ". d ." 54px / 66px 66px 66px; } }
`;
document.head.appendChild(css);

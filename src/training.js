// Training squares (145_Event_Check.rb chk_training → var41 31 → 110_Scene_Db_Speed_Training.rb): in Z1 and Z2 always
// the speed training; from Z3 on (variable 40 ≥ 2) one of four at random — 0 the speed training (here), 1 Mr. Popo,
// 2 King Kai's puns, 3 Chi-Chi (src/training_more.js registers those three with addTraining). The speed training: pick
// a member, then keep playing a card from the battle hand that shares the attack stars, the guard numeral or the school
// with the training card (a 気 training card takes anything). Each hit flips the card that was played; the one before
// it is dealt anew. Stop whenever you like; a miss ends it with half rewards. get_exp, by variable 40 (Z1 / Z2 / Z3+):
//   EXP  level × 2.5 / 2 per hit │ level × 2.5 × 2.5 per hit + level × 30 │ level × 2.5 × 10 per hit + level × 150,
//        × 1.5–12 from 10 hits on;  CAP = SP = hits │ hits × 2 │ hits × 5;  ZP = ⌈hits / 2⌉, ⌈hits / 5⌉ random moves
// SP goes to the member's 追加技能 and ZP to the member (src/growth.js), as after a battle.
import { img, audio, rand } from './core.js?v=20261102-2217';
import { newCard } from './battle.js?v=20261102-2217';
import { levelUp, EXP_RATE } from './party.js?v=20261102-2217';
import { expFor, has, ensure, afterBattle } from './growth.js?v=20261102-2217';
import { el, sprite, overlay, button, bumpStat } from './fieldmenu.js?v=20261102-2217';

const CARDS = 'Graphics/Pictures/カード関係.PNG', FACES = 'Graphics/Pictures/Z1_顔味方.PNG';
const KI = 16; // the 気 school glyph (column 16 of カード関係.PNG)
const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動';
const IDLE = [0, 1, 0, 4, 0, 2, 0, 3]; // output_character: 8 frames each
const HURT = 17;

export function drawCard(c, cd, x, y, back) { // (also the Chi-Chi training, src/training_more.js)
  const s = img(CARDS);
  if (!s.ok) return;
  if (back) { c.drawImage(s.im, 64, 96, 64, 96, x, y, 64, 96); return; }
  c.drawImage(s.im, 0, 96, 64, 96, x, y, 64, 96);
  c.drawImage(s.im, 32 * cd.a, 0, 32, 32, x + 2, y + 2, 32, 32);
  c.drawImage(s.im, 32 * cd.g, 32, 32, 32, x + 30, y + 62, 32, 32);
  c.drawImage(s.im, 32 * cd.s, 64, 32, 32, x + 16, y + 32, 32, 32);
}

// the trainings src/training_more.js adds: { 1: Popo, 2: King Kai's puns, 3: Chi-Chi } (event_no of chk_training)
const more = {};
export function addTraining(kind, fn) { more[kind] = fn; }

// chk_training: Z1 / Z2 (variable 40 0 or 1) always 0; from Z3 on rand(4). (?dev=trn0 … trn3 picks one, for testing)
function chkTraining(s) {
  const dev = /^trn([0-3])$/.exec(new URLSearchParams(location.search).get('dev') || '');
  if (dev) return +dev[1];
  return ((s.var || {})[40] || 0) >= 2 ? rand(4) : 0;
}

export async function training(game) {
  const s = game.state;
  bumpStat(s, 'training'); // $game_variables[222]
  const kind = chkTraining(s);
  if (kind && more[kind]) return more[kind](game);
  return speedTraining(game);
}

async function speedTraining(game) {
  const world = game.world, s = game.state, T = world.trainingText;
  const era = (s.var || {})[40] || 0;
  if (era <= 2) audio.playBgm(['Z1 修行', 'Z2 修行', 'Z3 修行'][era]); // (past variable 40 = 2 the field music goes on)
  const root = overlay('tr');
  const msg = el('div', 'win tr-msg');
  const stage = el('canvas', 'tr-stage');
  stage.width = 260; stage.height = 120;
  const result = el('div', 'win tr-result');
  const handCv = el('canvas', 'tr-hand');
  handCv.width = 6 * 64; handCv.height = 112;
  const pick = el('div', 'tr-pick');
  const bar = el('div', 'tr-bar');
  root.append(msg, el('div', 'tr-mid', stage, result), handCv, pick, bar);

  let state = 0, count = 0, m = null, card = null, used = [false, false, false, false, false, false], old = null;
  let cursor = 0, hurt = false, anim = 0, raf = 0, success = false;
  const hand = s.hand;
  const setMsg = (lines) => { msg.textContent = lines.join('\n'); };
  const cheer = () => T.cheer.find(([max]) => count <= max)[1];
  const draw = () => {
    const c = stage.getContext('2d');
    c.clearRect(0, 0, 260, 120);
    c.fillStyle = '#000';
    c.fillRect(0, 0, 120, 120);
    if (m) {
      const sp = img(world.actors[m.id].sprite);
      const row = hurt ? HURT : IDLE[Math.floor(anim / 8) % 8];
      if (sp.ok) c.drawImage(sp.im, 0, 96 * row, 96, 96, 12, 12, 96, 96);
    }
    drawCard(c, card, 168, 12, state !== 3 && state !== 5);
    const h = handCv.getContext('2d');
    h.clearRect(0, 0, handCv.width, handCv.height);
    if (state >= 2) hand.forEach((cd, k) => drawCard(h, cd, 64 * k, 16, used[k]));
    if (state === 3 && Math.floor(performance.now() / 300) % 2) { // the blinking ▼ over the chosen card
      h.fillStyle = '#f83800';
      h.beginPath(); h.moveTo(64 * cursor + 25, 2); h.lineTo(64 * cursor + 39, 2); h.lineTo(64 * cursor + 32, 12); h.fill();
    }
    result.innerHTML = `${count}回！<br>${cheer()}`;
    anim = (anim + 1) % 64;
    raf = requestAnimationFrame(draw);
  };
  const deal = () => { // create_card 1: the training card turns 気 1 in 7 (Z1) / 5 (Z2) / 4 (Z3 on)
    card = newCard(); // rand(8) stars, rand(8) guard, a school of the era (create_card_i 0)
    if (rand([7, 5][era] || 4) === 1) card.s = KI;
  };
  const buttons = (...bs) => { bar.innerHTML = ''; bar.append(...bs); };
  let wake = null;
  const wait = () => new Promise((res) => { wake = res; });
  root.addEventListener('click', (e) => { if (!e.target.closest('button') && e.target !== handCv && wake) { const w = wake; wake = null; w(); } });

  // ---- 0/1: who trains ----
  setMsg(T.pick);
  state = 0;
  draw();
  const who = await new Promise((res) => {
    for (const p of s.party) {
      const b = el('button', 'tr-mem', sprite(FACES, 0, 64 * (p.id - 3), 64, 64), el('span', '', `${p.name} Lv${p.level}`));
      b.onclick = () => { audio.se(SE_OK); res(p); };
      pick.append(b);
    }
    buttons(button('不修行', () => { audio.se(SE_OK); res(null); }));
  });
  pick.remove();
  let rewarded = false;
  if (who) {
    m = who;
    // ---- 2: the rules (two pages), then 確定 start / 取消 end ----
    state = 2;
    setMsg(T.rule1);
    buttons(button('下一頁', () => { audio.se(SE_OK); wake && wake(); }));
    await wait();
    setMsg(T.rule2);
    let go = await new Promise((res) => buttons(button('開始', () => { audio.se(SE_OK); res(true); }), button('結束', () => { audio.se('Z1 完了'); res(false); })));
    if (!go) success = true;
    while (go) {
      // ---- 3: play a card ----
      deal();
      state = 3;
      cursor = used.indexOf(false);
      setMsg(T.play);
      buttons();
      const k = await new Promise((res) => {
        handCv.onclick = (e) => {
          const r = handCv.getBoundingClientRect();
          const i = Math.floor(((e.clientX - r.left) / r.width) * 6);
          if (i < 0 || i > 5 || used[i]) return;
          if (i !== cursor) { audio.se(SE_MOVE); cursor = i; return; } // first tap points, second plays
          audio.se(SE_OK);
          res(i);
        };
        buttons(button('出這張牌', () => { audio.se(SE_OK); res(cursor); }));
      });
      handCv.onclick = null;
      const cd = hand[k];
      if (cd.a === card.a || cd.g === card.g || cd.s === card.s || card.s === KI || cd.s === KI) {
        audio.se('Z2 アイテム取得');
        if (old != null) { hand[old] = newCard(); used[old] = false; }
        used[k] = true;
        old = k;
        count++;
        // ---- 4: 確定 continue / 取消 end ----
        state = 4;
        setMsg(T.next);
        go = await new Promise((res) => buttons(button('繼續', () => { audio.se(SE_OK); res(true); }), button('結束', () => { audio.se('Z1 完了'); res(false); })));
        if (!go) success = true;
      } else {
        audio.se('Z1 ダメージ');
        state = 7;
        hurt = true;
        old = k;
        setMsg([count ? T.failHalf : T.fail]);
        buttons();
        await wait();
        go = false;
      }
    }
    if (state !== 7 || count) { buttons(); await rewards(); rewarded = true; }
  }
  if (old != null) { hand[old] = newCard(); used[old] = false; } // the last card played is dealt anew
  if (!rewarded) buttons();
  cancelAnimationFrame(raf);
  audio.se('Z1 出る');
  root.remove();
  game.field.enter();

  // get_exp; a miss halves everything (rounded up)
  async function rewards() {
    const half = (n) => (success ? n : Math.ceil(n / 2));
    const e = m.level * 2.5;
    let exp = era === 0 ? Math.trunc((e / 2) * count) : era === 1 ? Math.trunc(e * count * 2.5) + m.level * 30 : Math.trunc(e * count * 10) + m.level * 150;
    if (era >= 2) { // 人造人間編 on: a bonus by the number of hits
      const k = [[99, 12], [90, 9], [80, 8], [70, 7], [60, 6], [50, 5], [40, 4], [30, 3], [20, 2], [10, 1.5]].find(([n]) => count >= n);
      if (k) exp = Math.trunc(exp * k[1]);
    }
    const divide = [1, 0.5][era] || 0.2;
    await trainingRewards(game, m, {
      exp: half(count ? exp : 0), cap: half(Math.ceil(count / divide)), sp: half(Math.ceil(count / divide)),
      zp: half(Math.ceil(count / 2) * zpRate(s)), tec: half(Math.ceil(count / 5)), pool: 'after',
    }, SPEED_TEXT, async (lines) => { setMsg(lines); await wait(); audio.se(SE_OK); });
  }
}

// get_zp_bairitu (all.rb 9148): the training's ZP ×2-5 by the wishes of switches 496-499 (神龍, src/sys.js)
export const zpRate = (s) => { const w = (s && s.sw) || {}; return w[499] ? 5 : w[498] ? 4 : w[497] ? 3 : w[496] ? 2 : 1; };

const SPEED_TEXT = { exp: '修行終了！　　獲得{n}經驗值！', level: '{name}升到了{n}級！', cap: '獲得CAP　{n}　！', sp: '獲得SP　{n}　！',
  zp: '獲得ZP　{n}　！', tec: '隨機必殺技的使用回數增加　{n}　回！' };

// get_sp_add: サイヤ人の血 raises the SP shown (the same table as src/growth.js, which applies it itself)
const BLOOD_SP = [[2, 1.1], [3, 1.15], [4, 1.2], [89, 1.25], [90, 1.3], [91, 1.35], [92, 1.4], [93, 1.45], [94, 1.5]];

// The rewards every training ends with (get_exp of each training scene), each on its own page:
//   r = { exp, cap, sp, zp, tec, first: [lines before the EXP line], pool: 'raw' | 'after' } — exp before the EXP rate
//   T = { exp, level, cap, sp, zp, tec }: the page texts, {n} the number ({name} the member)
//   show(lines) shows a page and waits for a tap
// EXP × the EXP rate like battles, サイヤ人の血 counts too (get_exp_add); it also goes to the shared EXP pool
// (variable 305: before サイヤ人の血 in the Z3 trainings, after it in the speed training, as the original does).
// SP: get_cha_sp_run into the 追加技能 (src/growth.js afterBattle, without the 加重衣); ZP to the member;
// add_random_skill_num: one use each to that many random moves.
export async function trainingRewards(game, m, r, T, show) {
  const world = game.world, s = game.state;
  const fill = (t, n) => t.replace('{n}', n).replace('{name}', m.name);
  s.var = s.var || {};
  const raw = Math.trunc(r.exp) * EXP_RATE;
  const exp = expFor(world, m, raw);
  s.var[305] = (s.var[305] || 0) + (r.pool === 'after' ? exp : raw);
  await show([...(r.first || []), fill(T.exp, exp)]);
  m.exp += exp;
  if (levelUp(world, m)) { audio.se('Z1 レベルアップ', 80); await show([fill(T.level, m.level)]); }
  await show([fill(T.cap, r.cap)]);
  s.zeni = (s.zeni || 0) + r.cap;
  const blood = BLOOD_SP.find(([id]) => has(world, m, id));
  await show([fill(T.sp, blood ? Math.trunc(r.sp * blood[1]) : r.sp)]);
  const heavy = s.var[313];
  s.var[313] = 0; // (加重衣 is for battles)
  afterBattle({ world, game, party: [m], foes: [], trReward: { sp: r.sp } });
  if (heavy === undefined) delete s.var[313]; else s.var[313] = heavy;
  await show([fill(T.zp, r.zp)]);
  ensure(m).zp += r.zp;
  await show([fill(T.tec, r.tec)]);
  s.skillLv = s.skillLv || {};
  for (let n = 0; n < r.tec && m.skills.length; n++) { // add_random_skill_num
    const id = m.skills[rand(m.skills.length)];
    s.skillLv[id] = Math.min(99999, (s.skillLv[id] || 0) + 1);
  }
}

const css = document.createElement('style');
css.textContent = `
.tr { align-items: center; gap: 8px; }
.tr .win { align-self: stretch; }
.tr-msg { min-height: 5.4em; font-size: 16px; line-height: 1.6; white-space: pre-wrap; }
.tr-mid { display: flex; align-items: center; gap: 6px; width: 100%; justify-content: center; }
.tr-stage { width: 260px; height: 120px; }
.tr-result { flex: 1; align-self: center !important; font-size: 16px; line-height: 1.5; max-width: 130px; }
.tr-hand { width: min(100%, 384px); height: auto; aspect-ratio: 384 / 112; }
.tr-pick { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.tr-mem { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px; font-size: 15px; color: var(--ink); background: #fff0d0; border: 2px solid #c8642a; }
.tr-mem canvas { background: #000; }
.tr-bar { display: flex; gap: 6px; width: 100%; margin-top: auto; }
.tr-bar .btn { margin: 0; text-align: center; flex: 1; }
`;
document.head.appendChild(css);

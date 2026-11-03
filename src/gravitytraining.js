// Gravity training (114 Scene_Db_Gravity_Training, Z2): the gravity machine on Kami's lookout / the space ship, and
// King Kai's 10× gravity for Piccolo. Rules (docs/z2-gravity.md):
//   The machine deals 1-3 face-down cards. You get a first card dealt for you, may add one card from the battle
//   hand, and then a third dealt one. Beat the machine's star total without going over 10 (a machine total over 10
//   always loses to you). A win gives EXP (level × 350, ×3 for Z+2, ×2 with three cards, ×1.5 for exactly 10; ×2.5
//   at King Kai's) and knocks a fifth off the machine's HP; a loss costs 2 × the level's damage of the trainee's own
//   (scene-local) HP; a tie does nothing. Machine HP 0 = training done; trainee HP 0 = game over.
// Levels (variable 43): 0 = 20倍 (23), 1 = 50倍 (25), 2 = 100倍 (27), 3 = 10倍 at King Kai's (28, Piccolo).
// The original's switch is set in `terminate`, i.e. whenever the scene is left other than by cancelling at the
// first screen — that includes leaving it to pick the trainee — so here it is set as soon as the trainee is picked.
// Frame timings (Graphics.wait 30 per card, 60 for messages when variable 38 = 0) follow the original at 60 fps.
import { img, audio, rand } from './core.js?v=20261103-0801';
import { newCard } from './battle.js?v=20261103-0801';
import { levelUp, EXP_RATE } from './party.js?v=20261103-0801';
import { el, overlay, button, sprite } from './fieldmenu.js?v=20261103-0801';

const P = (n) => `Graphics/Pictures/${n}.PNG`;
const CARDS = P('カード関係'), DIGITS = P('数字英語'), FACES = P('Z1_顔味方');
const WORDS = P('Z2_修行_重力_文字'), MACHINE = P('Z2_修行_重力_背景'), KAIO = P('Z2_修行_界王重力_背景');
const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動';
const SKN0 = '#9040f0', SKN1 = '#ffd8a0'; // set_skn_color 0 / 1 (window skin pixels (127,127) and (0,0))
const IDLE = [0, 1, 0, 4, 0, 2, 0, 3]; // output_character: rows of the 96×96 battle sprite, 8 frames each
const HURT = 17;
// [name, HP, damage] per level (start)
const LEVELS = [['20倍', 20, 20], ['50倍', 50, 30], ['100倍', 100, 50], ['10倍', 50, 25]];
const SWITCHES = [90, 91, 92, 100];
export const GRAVITY_SWITCHES = SWITCHES;

// the original's texts (s2t of the Chinese build); the second rules line is untranslated Japanese in the original
// (カードの数の合計が　重力装置より！ / 超重力より！), given here in Chinese
const T = {
  pick: ['用確定按鈕選擇修行的角色吧！', '不修行的話請按下取消按鈕！'],
  rule1: (kaio) => ['那麼！　開始修行吧！', kaio ? '卡片數字的合計　要比超重力更大！' : '卡片數字的合計　要比重力裝置更大！',
    '請讓合計值儘可能大吧！', '但是合計超過10點就會失敗！'],
  rule2: ['特殊規則如下！', '用Ｚ和２　　　勝利時…獲得經驗值為３倍', '用三張卡時　　勝利時…獲得經驗值為２倍', '合計為１點　　勝利時…獲得經驗值為1.5倍'],
  start: ['那麼　現在開始超重力的修行！'],
  deal: ['請選擇超重力的卡片！'],
  first: ['第一張卡片！'],
  second: ['第二張卡片將使用你手中的卡', '請衡量星數的總和', '需要第二張卡嗎？'],
  choose: ['那麼請選擇卡片'],
  confirm: ['選擇這張卡片嗎？'],
  third: ['第三張卡片是自動選擇的', '需要第三張卡片嗎？'],
  fail: (d) => ['修行　失敗！！', `受到！${d}點傷害！`],
  tie: ['很遺憾　修行沒有效果…'],
  over: (name) => [`終於克服了${name}重力！！`],
  dead: (name) => [`重力${name}　修行失敗！！`],
  exp: (n) => ['又進一步抓住了修行的訣竅！！', `獲得了${n}經驗值！`],
  level: (who, lv) => [`${who}升到${lv}級了！`],
};

// set_card_frame: the card face of Z1 (variable 40 = 0) or Z2 (40 ≥ 1)
function drawCard(c, cd, x, y, school, face) {
  const s = img(CARDS);
  if (!s.ok) return;
  c.drawImage(s.im, face, 96, 64, 96, x, y, 64, 96);
  c.drawImage(s.im, 32 * cd.a, 0, 32, 32, x + 2, y + 2, 32, 32);
  c.drawImage(s.im, 32 * cd.g, 32, 32, 32, x + 30, y + 62, 32, 32);
  c.drawImage(s.im, school[0], school[1], 32, 32, x + 16, y + 32, 32, 32);
}
function drawBack(c, x, y) {
  const s = img(CARDS);
  if (s.ok) c.drawImage(s.im, 64, 96, 64, 96, x, y, 64, 96);
}
function blit(c, sheet, sx, sy, w, h, x, y) {
  const im = img(sheet);
  if (im.ok) c.drawImage(im.im, sx, sy, w, h, x, y, w, h);
}
function digits(c, n, x, y) { // output_hp: right-aligned, last digit at x + 48
  const d = img(DIGITS);
  if (!d.ok) return;
  const t = String(n);
  for (let k = 1; k <= t.length; k++) c.drawImage(d.im, Number(t[t.length - k]) * 16, 0, 16, 16, x + 48 - (k - 1) * 16, y, 16, 16);
}

// The portrait stage (the original's 640×480 pieces rearranged, each piece drawn at its own size):
//   the 重力○倍 plate on top, the trainee's black box and the machine below it, the two HP boxes under them,
//   then the row of cards: yours from the left, the machine's from the right.
const SW = 400, SH = 360;
const PLATE = [92, 0], CHAR = [24, 72], MACH = [248, 72], HP_ME = [45, 208], HP_MACH = [269, 208];
const BTL = [4, 264], TRA = [332, 264];

// level 0..3; resolves 'done' (machine HP 0), 'cancel' (no trainee picked) or 'gameover' (trainee HP 0)
export async function gravityTraining(game, level = 2) {
  const world = game.world, s = game.state;
  if (!(level >= 0 && level <= 3)) level = 2;
  const [lvName, mhp, damage] = LEVELS[level];
  const z = s.var[40] || 0; // 0 Z1 / 1 Z2 / 2 Z3: file prefixes, the BGM and the card face
  const top = ['Z1_', 'Z2_', 'Z3_'][Math.min(z, 2)];
  const face = z >= 1 ? 448 : 0;
  const tapMode = (s.var[38] ?? 1) !== 0; // 戦闘メッセージ表示: 0 = messages go on by themselves after 60 frames
  audio.playBgm(`${['Z1', 'Z2', 'Z3'][Math.min(z, 2)]} 修行`);

  const root = overlay('gv');
  const msg = el('div', 'win gv-msg');
  const stage = el('canvas', 'gv-stage');
  stage.width = SW; stage.height = SH;
  const handCv = el('canvas', 'gv-hand');
  handCv.width = 6 * 64; handCv.height = 112;
  const pick = el('div', 'gv-pick');
  const bar = el('div', 'gv-bar');
  root.append(msg, stage, handCv, pick, bar);
  root.style.opacity = '0';

  // ---- the scene's state, named after the original's instance variables ----
  const hand = s.hand;
  const used = [false, false, false, false, false, false]; // @card_select
  let ws = 0; // @window_state
  let m = null, battleHp = 0, trainingHp = mhp;
  let cursor = 0, anime = 0, frozen = false;
  let battle = [], bnum = 0; // @battle_card* (0 and 2 dealt by create_card 2; 1 from the hand), @battle_card_num
  let training = [], tnum = 0; // @training_card*, @training_card_num (0..2)
  let backs = 0, faces = 0; // training cards shown face down / face up so far (the 30-frame deal)
  let lines = [], cursorOn = true; // the message, and its blinking ▼ (@msg_cursor)

  const dealBattle = () => { battle = [0, 1, 2].map(() => ({ a: rand(8), g: 0, s: 0 })); }; // create_card 2
  const dealTraining = () => { // create_card 1
    let fix = rand(2); // 0: the cards counted stay within 10
    if (tnum === 0) fix = 1;
    training = [];
    for (let x = 0; x <= 2; x++) {
      for (;;) {
        const c = { a: rand(8), g: rand(8) };
        training[x] = c;
        const sum2 = () => training[0].a + 1 + training[1].a + 1;
        if (x === 0 || fix !== 0 || (x === 2 && tnum === 1 && fix === 0)) break;
        if (x === 1 && fix === 0 && sum2() <= 10) {
          if (tnum === 2 && sum2() === 10) training[1].a -= 1;
          break;
        }
        if (x === 2 && fix === 0 && sum2() + training[2].a + 1 <= 10) break;
      }
    }
  };

  // ---- one frame of the original (the parts of pre_update that move) ----
  let fc = 0;
  function frame() {
    fc++;
    if (frozen || !m) return; // Graphics.wait: nothing is redrawn
    if (ws >= 6 && ws !== 22 && ws !== 24) {
      if (anime !== 63) { if (trainingHp !== 0) anime++; } else anime = 0;
    } else if (ws === 22) anime = 0;
  }

  function draw() {
    const c = stage.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.fillStyle = SKN0;
    c.fillRect(0, 0, SW, SH);
    c.fillStyle = '#000';
    c.fillRect(CHAR[0], CHAR[1], 128, 128);
    c.fillStyle = SKN1;
    c.fillRect(PLATE[0], PLATE[1], 216, 64);
    c.fillRect(HP_ME[0], HP_ME[1], 86, 48);
    c.fillRect(HP_MACH[0], HP_MACH[1], 86, 48);
    blit(c, WORDS, 0, 44 * level, 176, 44, PLATE[0] + 20, PLATE[1] + 10);
    blit(c, level === 3 ? KAIO : MACHINE, 0, 0, 128, 128, MACH[0], MACH[1]);
    // HP
    blit(c, DIGITS, 0, 16, 32, 16, HP_ME[0] + 8, HP_ME[1] + 6);
    blit(c, DIGITS, 0, 16, 32, 16, HP_MACH[0] + 8, HP_MACH[1] + 6);
    if (m) digits(c, battleHp, HP_ME[0] + 8, HP_ME[1] + 24);
    digits(c, trainingHp, HP_MACH[0] + 8, HP_MACH[1] + 24);
    // the trainee (Z2_戦闘_ゴクウ / ピッコロ …)
    if (m) {
      const row = ws === 22 ? HURT : IDLE[Math.floor(anime / 8)];
      blit(c, world.actors[m.id].sprite.replace('/Z1_', `/${top}`), 0, 96 * row, 96, 96, CHAR[0] + 14, CHAR[1] + 4);
    }
    // your cards: 0 and 2 dealt (school 悟, or 魔 for Piccolo at King Kai's), 1 from the hand
    if (m && ws >= 6 && ws !== 24) { // (27 = cancelled: the original leaves before drawing again)
      for (let x = 0; x <= bnum; x++) {
        const sch = x === 1 ? [32 * battle[1].s, 64] : level === 3 ? [128, 64] : [256, 0];
        drawCard(c, battle[x], BTL[0] + 64 * x, BTL[1], sch, face);
      }
    }
    // the machine's cards (school 重), dealt face down, turned over one by one
    if (m && ws >= 5 && ws !== 24) for (let x = 0; x < backs; x++) drawBack(c, TRA[0] - 64 * x, TRA[1]);
    if (m && ws >= 21 && ws !== 24) for (let x = 0; x < faces; x++) drawCard(c, training[x], TRA[0] - 64 * x, TRA[1], [288, 0], face);
    // the battle hand
    const h = handCv.getContext('2d');
    h.clearRect(0, 0, handCv.width, handCv.height);
    hand.forEach((cd, k) => (used[k] ? drawBack(h, 64 * k, 16) : drawCard(h, cd, 64 * k, 16, [32 * cd.s, 64], face)));
    if ((ws === 8 || ws === 9) && Math.floor(performance.now() / 300) % 2) { // the blinking ▼ over the chosen card
      h.fillStyle = '#f83800';
      h.beginPath(); h.moveTo(64 * cursor + 25, 2); h.lineTo(64 * cursor + 39, 2); h.lineTo(64 * cursor + 32, 12); h.fill();
    }
    msg.textContent = lines.join('\n');
    msg.classList.toggle('gv-more', cursorOn && lines.length > 0);
  }

  // 60 frames a second, whatever the display rate; __gv.tick(n) steps it by hand (tests with a hidden page)
  let raf = 0, last = performance.now(), acc = 0, waiters = [];
  const tick = (n) => {
    for (let i = 0; i < n; i++) frame();
    draw();
    waiters = waiters.filter((w) => !w());
  };
  const loop = (now) => {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    const n = Math.floor(acc * 60);
    acc -= n / 60;
    tick(n);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const until = (cond) => new Promise((res) => waiters.push(() => cond() && (res(), true)));
  const frames = (n) => { const end = fc + n; return until(() => fc >= end); };
  window.__gv = {
    tick,
    get state() { return { ws, battleHp, trainingHp, bnum, tnum, battle, training, hand, used: [...used], cursor, lines, backs, faces, level: m && m.level, exp: m && m.exp }; },
  };

  let wake = null;
  const wait = () => new Promise((res) => { wake = res; });
  root.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target === handCv || !wake) return;
    const w = wake; wake = null; audio.se(SE_OK); w();
  });
  const confirm = async () => { cursorOn = true; await wait(); };
  // the original's waits after a result: 60 frames, or a press of the confirm button (variable 38)
  const msgWait = async () => {
    frozen = true;
    if (tapMode) { cursorOn = true; await wait(); await frames(5); } else await frames(60);
    frozen = false;
  };
  const ask = (opts) => new Promise((res) => {
    bar.replaceChildren(...opts.map(([label, v]) => button(label, () => { audio.se(v === 'back' ? SE_MOVE : SE_OK); res(v); })));
  }).then((v) => { bar.replaceChildren(); return v; });
  // Graphics.fadein / fadeout, stepped with the frames (a CSS transition would stall in a hidden page)
  const fade = (to, n) => {
    const from = Number(root.style.opacity), start = fc;
    const step = () => { const k = Math.min(1, (fc - start) / n); root.style.opacity = String(from + (to - from) * k); return k >= 1; };
    return until(step);
  };

  draw();
  fade(1, 10);

  // ---- 0: who trains (the original opens the status screen; here the party is listed) ----
  lines = T.pick;
  const who = await new Promise((res) => {
    for (const p of s.party) {
      const b = el('button', 'gv-mem', sprite(FACES, 0, 64 * (p.id - 3), 64, 64), el('span', '', `${p.name} Lv${p.level}`));
      const dead = p.ko || p.hp <= 0; // $chadead: can't be picked
      b.onclick = () => { if (dead) { audio.se('Z3 エラー'); return; } audio.se(SE_OK); res(p); };
      if (dead) b.classList.add('gv-dead');
      pick.append(b);
    }
    bar.replaceChildren(button('不修行', () => { audio.se(SE_OK); res(null); }));
  });
  pick.remove();
  bar.replaceChildren();
  let result;
  if (!who) {
    ws = 27;
    lines = [];
    result = 'cancel';
  } else {
    s.sw[SWITCHES[level]] = true; // terminate: any way out but the cancel at state 0
    m = who;
    battleHp = m.hp;
    ws = 2;
    // ---- 2, 3, 4: the rules ----
    lines = T.rule1(level === 3); await confirm();
    ws = 3; lines = T.rule2; await confirm();
    ws = 4; lines = T.start; await confirm();
    dealBattle();
    tnum = rand(3);
    result = await rounds();
  }

  async function rounds() {
    for (;;) {
      // ---- 5: the machine deals 1-3 cards face down (Graphics.wait 30 each) ----
      ws = 5;
      lines = T.deal;
      cursorOn = true;
      backs = 0; faces = 0;
      frozen = true;
      for (let x = 0; x <= tnum; x++) { backs = x + 1; await frames(30); }
      frozen = false;
      await confirm();
      dealTraining();
      // ---- 6: your first card ----
      ws = 6; lines = T.first; await confirm();
      cursorOn = false;
      // ---- 7..10: the second card from the hand, then the third ----
      for (;;) {
        ws = 7; lines = T.second;
        if ((await ask([['需要', 1], ['不需要', -1]])) === -1) break;
        ws = 8; lines = T.choose;
        cursor = used.indexOf(false);
        const k = await new Promise((res) => {
          handCv.onclick = (e) => {
            const r = handCv.getBoundingClientRect();
            const i = Math.floor(((e.clientX - r.left) / r.width) * 6);
            if (i < 0 || i > 5 || used[i]) return;
            if (i !== cursor) { audio.se(SE_MOVE); cursor = i; return; } // first tap points, second plays
            audio.se(SE_OK);
            res(i);
          };
          bar.replaceChildren(button('出這張牌', () => { audio.se(SE_OK); res(cursor); }), button('返回', () => { audio.se(SE_MOVE); res(-1); }));
        });
        handCv.onclick = null;
        bar.replaceChildren();
        if (k < 0) continue; // B: back to 7
        battle[1] = { ...hand[k] };
        used[k] = true;
        bnum = 1;
        if (battle[0].a + 1 + battle[1].a + 1 > 10) break; // over 10 already: checked at once
        ws = 9; lines = T.confirm;
        if ((await ask([['是', 1], ['不是', -1]])) === -1) { used[k] = false; bnum = 0; continue; }
        ws = 10; lines = T.third;
        if ((await ask([['需要', 1], ['不需要', -1]])) === 1) bnum = 2;
        break;
      }
      const r = await chk();
      if (r) return r;
    }
  }

  // chk_training: turn the machine's cards over, compare the totals
  async function chk() {
    ws = 21;
    lines = [];
    frozen = true;
    for (let x = 0; x <= tnum; x++) { faces = x + 1; await frames(30); }
    frozen = false;
    let mine = 0, his = 0;
    for (let x = 0; x <= bnum; x++) mine += battle[x].a + 1;
    for (let x = 0; x <= tnum; x++) his += training[x].a + 1;
    let stop = false;
    if (mine > 10 || (mine < his && his < 11)) {
      ws = 22;
      audio.se('Z1 ダメージ');
      lines = T.fail(damage * 2);
      battleHp -= damage * 2;
      if (battleHp <= 0) { battleHp = 0; ws = 26; lines = T.dead(lvName); }
      stop = true;
    } else if (his > 10 || mine > his) {
      audio.se('Z2 アイテム取得');
      await getExp(mine);
      trainingHp -= Math.floor(mhp / 5);
      lines = [];
      if (trainingHp <= 0) { trainingHp = 0; ws = 25; lines = T.over(lvName); }
    } else {
      ws = 23;
      lines = T.tie;
      stop = true;
    }
    tick(0);
    if (stop) await msgWait();
    if (ws === 26) return 'gameover';
    if (ws === 25) return 'done';
    const k = used.indexOf(true);
    if (k >= 0) { hand[k] = newCard(); used[k] = false; } // create_card 0
    bnum = 0;
    dealBattle();
    tnum = rand(3);
    cursor = 0;
    return null;
  }

  // get_exp: level × 350 (×3 Z and 2 — read from slot 1 even when no hand card was added, as in the original —,
  // ×2 three cards, ×1.5 a total of 10; ×2.5 at King Kai's), times the EXP rate like the other trainings
  async function getExp(mine) {
    let exp = m.level * 350;
    const a0 = battle[0].a + 1, a1 = battle[1].a + 1;
    if ((a0 === 8 && a1 === 2) || (a0 === 2 && a1 === 8)) exp *= 3;
    else if (bnum === 2) exp *= 2;
    else if (mine === 10) exp *= 1.5;
    if (level === 3) exp *= 2.5;
    const total = Math.trunc(exp) * EXP_RATE;
    lines = T.exp(total);
    tick(0);
    await msgWait();
    m.exp += total;
    if (levelUp(world, m)) {
      audio.se('Z1 レベルアップ', 80); // common event 188 ($BGM_levelup_se)
      lines = T.level(m.name, m.level);
      tick(0);
      await msgWait();
    }
  }

  // ---- leaving ----
  tick(0);
  if (result !== 'gameover') { // the original's exit to the map (Scene_Gameover is the caller's)
    audio.stopBgm();
    audio.se('Z1 出る');
    s.var[41] = 0;
    await fade(0, 20);
  }
  cancelAnimationFrame(raf);
  delete window.__gv;
  root.remove();
  return result;
}

const css = document.createElement('style');
css.textContent = `
.gv { align-items: center; gap: 6px; background: ${SKN0}; }
.gv .win { align-self: stretch; }
.gv-msg { position: relative; min-height: calc(4 * 1.5em + 8px); font-size: 15px; line-height: 1.5; white-space: pre-wrap; }
.gv-msg.gv-more::after { content: "▼"; position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%); color: #d0480c; font-size: 12px; animation: gv-blink .6s steps(1) infinite; }
@keyframes gv-blink { 50% { opacity: 0; } }
.gv-stage { width: min(100%, 400px, calc((100dvh - 330px - var(--safe-t, 0px) - var(--safe-b, 0px)) * 400 / 360)); height: auto; aspect-ratio: 400 / 360; }
.gv-hand { width: min(100%, 384px); height: auto; aspect-ratio: 384 / 112; }
.gv-pick { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.gv-mem { display: flex; align-items: center; gap: 8px; padding: 4px 10px 4px 4px; font-size: 16px; color: var(--ink); background: #fff0d0; border: 2px solid #c8642a; }
.gv-mem canvas { width: 48px; height: 48px; }
.gv-mem.gv-dead { opacity: .5; }
.gv-bar { display: flex; gap: 6px; width: 100%; margin-top: auto; min-height: 52px; }
.gv-bar .btn { margin: 0; text-align: center; flex: 1; }
`;
document.head.appendChild(css);

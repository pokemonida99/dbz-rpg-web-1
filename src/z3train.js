// Z3's training mini-games, ported from the original (docs/z3-training.md):
//   流派一致修行  Scene_Db_Ryuha_Pair_Training (all.rb #118; Z3 z1field 1302 / 1304 / 1306: Goku, Gohan, Piccolo;
//                Z4 uses it again with variable 121 = 1 / 2 / 3). CE40 流派一致修行用カード生成 makes its cards.
//   Z3 重力修行   Scene_Db_Z3_Gravity_Training (all.rb #115; z1field 1308: Vegeta under 100 → 300× gravity)
// Chapter 4 (src/z3d.js) calls them; the story pages around them (Map007 event 5 pages 37-41) stay the caller's.
//
// ryuhaPairTraining(game, { pattern, makeCards }) → { cleared: true, counts }
//   pattern    the original's variable 121 (@chara_pattern; default state.var[121] || 0):
//              0 悟空・悟飯・比克 [3, 5, 4] (Z3)　1 超貝吉塔・超特南克斯 [19, 20]　2 超悟空・超悟飯 [3, 5]
//              3 the party as it is ($partyc: 克林、雅木茶、天津飯、餃子 …)
//   makeCards  false: keep the battle hand (default: CE40 deals 7 new cards first, as every original call does)
//   It can't be failed: it goes on until a pair of different schools (or 必) is picked. counts[k] = pairs trained
//   by the k-th trainee. EXP and move uses are given here; the 7 cards stay as the battle hand (the first 6).
// z3GravityTraining(game) → { cleared, level }
//   The trainee is the party's first member ($partyc[0]; the original's page 40 sets $partyc = [12] and recovers).
//   cleared = 300× overcome (the original then adds 1 to variable 41: 1309 → 1310 クウラ到着).
//   cleared = false: HP 0 (variable 41 stays 1309 → page 41: Vegeta's line, all_charecter_recovery, variable 41 − 1,
//   and page 40 runs the training again from 100×). EXP for 100× / 200× is kept even then, as in the original.
// Both play their BGM and leave it playing (the original's next page sets its own); they fade in 10 / out 20 frames.
import { img, audio, rand, loadImages } from './core.js?v=20261103-0319';
import { newCard } from './battle.js?v=20261103-0319';
import { levelUp, EXP_RATE, makeMember, applyLevel } from './party.js?v=20261103-0319';
import { el, overlay, button } from './fieldmenu.js?v=20261103-0319';
import { registerZ3, member, heal } from './z3.js?v=20261103-0319';
import { applyEra } from './era.js?v=20261103-0319';

const P = (n) => `Graphics/Pictures/${n}.PNG`;
const CARDS = P('カード関係'), DIGITS = P('数字英語'), ICONS = P('アイコン'), FACES = P('Z3_顔味方');
const ANIME = P('戦闘アニメ'), MACHINE = P('Z3_修行_重力装置'), CUTIN = P('Z3_味方カットイン'), FRAME = 'ui/frame.png';
const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動', SE_EXP = 'Z3 経験値取得';
const SKN0 = '#9040f0', SKN1 = '#ffc8b8'; // set_skn_color 0 / 1 of Z3_Window (pixels (127,127) and (0,0))
const sprite = (world, id) => world.actors[id] && world.actors[id].sprite.replace(/\/Z[12]_/, '/Z3_'); // Z3_戦闘_<name>

// ---------- drawing (the original's pictures, Z3 card frame = set_card_frame set 3) ----------
function blit(c, sheet, sx, sy, w, h, x, y) {
  const im = img(sheet);
  if (im.ok) c.drawImage(im.im, sx, sy, w, h, x, y, w, h);
}
// face (512,96), attack stars (32a,272) at +0 ($output_card_tyousei −2), guard (32g,32) at (+30,+62), school at (+16,+32)
function drawCard(c, cd, x, y, school) {
  blit(c, CARDS, 512, 96, 64, 96, x, y);
  blit(c, CARDS, 32 * cd.a, 272, 32, 32, x, y);
  blit(c, CARDS, 32 * cd.g, 32, 32, 32, x + 30, y + 62);
  blit(c, CARDS, school[0], school[1], 32, 32, x + 16, y + 32);
}
const drawBack = (c, x, y, z4) => blit(c, CARDS, z4 ? 384 : 576, z4 ? 272 : 96, 64, 96, x, y); // Z4 (switch 431): its own back
// 数字英語 row 0: black 16px digits, right-aligned with the last one at rx
function digits(c, n, rx, y) {
  const t = String(n);
  for (let k = 1; k <= t.length; k++) blit(c, DIGITS, Number(t[t.length - k]) * 16, 0, 16, 16, rx - (k - 1) * 16, y);
}
// set_tate_cursor_blink with the Z3 skin: ▼ cell 16, its blink frame cell 18 (every 8 frames)
const cursorAt = (c, x, y, blink, fc) => blit(c, ICONS, blink && fc % 17 > 8 ? 288 : 256, 0, 16, 16, x, y);
// a Window_Base (the remake's frame, filled with the Z3 window colour)
function windowBox(c, x, y, w, h) {
  c.fillStyle = SKN1;
  c.fillRect(x + 3, y + 3, w - 6, h - 6);
  const f = img(FRAME);
  if (!f.ok) return;
  const k = 8, im = f.im;
  c.drawImage(im, 0, 0, k, k, x, y, k, k);
  c.drawImage(im, 64 - k, 0, k, k, x + w - k, y, k, k);
  c.drawImage(im, 0, 64 - k, k, k, x, y + h - k, k, k);
  c.drawImage(im, 64 - k, 64 - k, k, k, x + w - k, y + h - k, k, k);
  c.drawImage(im, k, 0, 64 - 2 * k, k, x + k, y, w - 2 * k, k);
  c.drawImage(im, k, 64 - k, 64 - 2 * k, k, x + k, y + h - k, w - 2 * k, k);
  c.drawImage(im, 0, k, k, 64 - 2 * k, x, y + k, k, h - 2 * k);
  c.drawImage(im, 64 - k, k, k, 64 - 2 * k, x + w - k, y + k, k, h - 2 * k);
}

// ---------- the scene shell: overlay, 60-frame loop, message window, button bar, fades ----------
// onFrame = one frame of the original's update (skipped while frozen = Graphics.wait / input_loop_run);
// onDraw = paint the canvas. __z3t.tick(n) steps it by hand (tests with a hidden page).
function scene(cls, W, H, msgFirst) {
  const root = overlay('zt ' + cls);
  const msg = el('div', 'win zt-msg');
  const cv = el('canvas', 'zt-stage');
  cv.width = W; cv.height = H;
  cv.style.setProperty('--w', W);
  cv.style.setProperty('--h', H);
  const bar = el('div', 'zt-bar');
  if (msgFirst) root.append(msg, cv, bar); else root.append(cv, msg, bar);
  root.style.opacity = '0';
  const sc = { root, msg, cv, bar, fc: 0, frozen: false, onFrame: null, onDraw: null, lines: [], more: false, center: false, barKey: '' };
  let waiters = [], raf = 0, last = performance.now(), acc = 0;
  sc.tick = (n) => {
    for (let i = 0; i < n; i++) { sc.fc++; if (!sc.frozen && sc.onFrame) sc.onFrame(); }
    if (sc.onDraw) sc.onDraw();
    const t = sc.lines.join('\n');
    if (msg.textContent !== t) msg.textContent = t;
    msg.classList.toggle('zt-more', sc.more);
    msg.classList.toggle('zt-center', sc.center);
    waiters = waiters.filter((w) => !w());
  };
  const loop = (now) => {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    const n = Math.floor(acc * 60);
    acc -= n / 60;
    sc.tick(n);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  sc.until = (cond) => new Promise((res) => waiters.push(() => cond() && (res(), true)));
  sc.frames = (n) => { const end = sc.fc + n; return sc.until(() => sc.fc >= end); };
  // Graphics.fadein / fadeout, stepped with the frames (a CSS transition would stall in a hidden page)
  sc.fade = (to, n) => {
    const from = Number(root.style.opacity), start = sc.fc;
    return sc.until(() => { const k = Math.min(1, (sc.fc - start) / n); root.style.opacity = String(from + (to - from) * k); return k >= 1; });
  };
  // the buttons of the bar ([label, fn] …), rebuilt only when `key` changes
  sc.buttons = (key, list) => {
    if (sc.barKey === key) return;
    sc.barKey = key;
    bar.replaceChildren(...list.map(([label, fn]) => button(label, fn)));
  };
  // input_loop_run: a tap anywhere but on a button (no sound, as in the original)
  sc.tapWait = () => new Promise((res) => {
    const h = (e) => { if (e.target.closest('button')) return; root.removeEventListener('click', h); res(); };
    root.addEventListener('click', h);
  });
  // a result message: 60 frames, or a tap when variable 38 (戦闘メッセージ表示) isn't 0 — unset here counts as 1
  sc.msgWait = async (s, lines) => {
    sc.lines = lines;
    sc.frozen = true;
    if ((s.var[38] ?? 1) !== 0) { sc.more = true; sc.tick(0); await sc.tapWait(); sc.more = false; await sc.frames(5); } else { sc.tick(0); await sc.frames(60); }
  };
  // canvas coordinates of a tap
  sc.at = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };
  sc.close = () => { cancelAnimationFrame(raf); root.remove(); delete window.__z3t; };
  return sc;
}

// ======================================================================================================
// 流派一致修行 (Scene_Db_Ryuha_Pair_Training)
// ======================================================================================================
// the original's texts (s2t of the Chinese build)
const RT = {
  intro: ['從卡片中選出一組流派相同的', '請選擇需要組隊的兩人！', '可以一直選擇，直到沒有相同的為止！', '注意，流派“必”是不算相同流派的！'],
  first: ['組隊的人可以獲得經驗！　加油吧！'],
  // @old_msg by pattern: [first trainee, second trainee, line 1, line 2]; the pair is either way round when `both`
  pairs: {
    0: { both: true, list: [[3, 4, '悟空「比克！　你變強了呀」', '比克「我可不允許只有你這傢伙變強！」'],
      [3, 5, '悟空「怎麼了悟飯！　動作太慢了！」', '悟飯「呀ーーーーー！」'],
      [4, 5, '比克「哼…　那樣的攻擊連１只蒼蠅都打不下來！」', '悟飯「啊ーーーーー！」']] },
    1: { list: [[19, 20, '特蘭克斯「爸爸　好強的力量…」', '貝吉塔「哈ーーーーー！」'],
      [20, 19, '貝吉塔「那樣是不能超越超級賽亞人的！」', '特蘭克斯「呀啊ーーーーーっ！」']] },
    2: { list: [[3, 5, '悟空「悟飯　你的實力應該不止如此！」', '悟飯「不愧是爸爸…　但我不會輸的！」'],
      [5, 3, '悟飯「這個動作…　爸爸的目標是！！」', '悟空「觀察得很好…　但還是太天真了！」']] },
    3: { list: [[6, 7, '克林「請不要手下留情，雅木茶！」', '雅木茶「嗯，讓我們拿出真本事吧，克林！」'],
      [6, 8, '克林「這是武天老師的動作！？」', '天津飯「看來你很清楚啊，克林！」'],
      [6, 9, '克林「這讓我想起了當時的天下第一武道會」', '餃子「我不會再上當了！」'],
      [7, 6, '雅木茶「克林，你變強了！」', '克林「你也一樣！！」'],
      [7, 8, '雅木茶「以現在的實力！　就用這招！！」', '天津飯「什麼！！　你竟然變得這麼強！！」'],
      [7, 9, '雅木茶「我不會手下留情的　餃子！！」', '餃子「我也一樣！！」'],
      [8, 6, '天津飯「能跟上這個動作嗎　克林！」', '克林「沒見過的動作！　這是什麼動作！？」'],
      [8, 7, '天津飯「我們好久沒切磋過了！」', '餃子「這次我不會輸的　天津飯！！」'], // (the original's speaker, kept)
      [8, 9, '天津飯「我要認真上了　餃子！」', '餃子「我也一樣　天桑！！」'],
      [9, 6, '餃子「１６＋２７是多少！？」', '克林「４３！！　　９－１是！？」'],
      [9, 7, '餃子「你大意了吧！」', '雅木茶「那是！！　你為什麼要」'],
      [9, 8, '餃子「天桑　和我絕一勝負吧！」', '天津飯「認真來吧　餃子！！」']] },
  },
  // state 15 (lines at y 0 / 50, or 0 / 25 / 50 / 75)
  end: {
    0: ['悟空「呼…　到此為止吧　不稍微休息一下嗎？」', '', '比克「好吧…」'],
    1: ['貝吉塔「這次就到此為止吧」', '', '特蘭克斯「好…　好的…　不愧是爸爸…」'],
    2: ['悟空「你很努力啊　悟飯！　今日就休息吧！」', '', '悟飯「好的　爸爸！！」'],
    3: ['餃子「累了…」', '克林「比想象中的要辛苦呢」', '雅木茶「今天就這樣吧！」', '天津飯「是啊」'],
  },
  exp: (who, n) => [`${who}獲得${n}經驗值！`],
  level: (who, lv) => [`${who}升到${lv}級了！`],
  tec: (n) => [`全部必殺技的使用回數增加　${n}　回！`],
};
const CHARS = { 0: [3, 5, 4], 1: [19, 20], 2: [3, 5] }; // 3 = $partyc
const BONUS = { 0: 25000, 1: 250000, 2: 350000, 3: 450000 }; // get_exp (variable 40 ≥ 2)
const TECP = { 0: 3, 1: 10, 2: 10, 3: 5 }; // 熟練度: all moves' use counts +TECP + pairs / 2
// output_btl_anime 2 (戦う, 260 frames): [frame] → rows of the two 96×96 sprites, and the clash spark (null: as it was)
const FIGHT_SHOW = [0, 28, 44, 60, 76, 92, 108, 116, 132, 148, 164, 180, 196, 212];
const FIGHT = { 20: [1, 16, true], 156: [1, 16, true], 36: [2, 16, true], 172: [2, 16, true], 52: [16, 1, null], 124: [16, 1, null],
  68: [16, 2, null], 140: [16, 2, null], 84: [3, 16, true], 100: [4, 16, true], 188: [16, 3, null], 204: [16, 4, null] };

// portrait stage 448×404: the black battle window on top, the trainees with their counts, the 7 cards
const RW = 448, RH = 404;
const BX = 112, BY = 0; // battle window (224×128)
const FY = 160; // faces (the ▼ 16 above, the count box 80 below)
const CT = 280; // card row: ▼ at +8, cards at +24 (raised 22 when picked)

export async function ryuhaPairTraining(game, opts = {}) {
  const world = game.world, s = game.state;
  s.var[40] = 2; // (start)
  const pattern = opts.pattern ?? (s.var[121] || 0);
  const chars = CHARS[pattern] || s.party.map((m) => m.id);
  const n = chars.length;
  const FX0 = (RW - 64 * n) / 2;
  const z4 = !!s.sw[431];
  // CE40 流派一致修行用カード生成: cards 0..6 ($Cardmaxnum + 1), schools without 必 (create_card_i 0, true)
  const cards = [];
  for (let x = 0; x < 7; x++) {
    if (opts.makeCards === false) { cards[x] = s.hand[x] ? { ...s.hand[x] } : newCard(); continue; }
    let c;
    do c = newCard(); while (c.s === 0);
    cards[x] = c;
  }
  await loadImages([CARDS, DIGITS, ICONS, FACES, ANIME, FRAME, ...chars.map((id) => sprite(world, id)).filter(Boolean)]);
  audio.playBgm(pattern >= 1 && pattern <= 3 ? 'ZSB1 天界のテーマ(GB音源Ver)' : 'Z3 修行');
  const sc = scene('zt-pair', RW, RH, true);

  // ---- the scene's state, named after the original's instance variables ----
  let ws = 0; // @window_state
  let cardCur = 0, charaCur = 0; // @battle_card_cursor_state, @chara_cursor_state
  let sel = Array(7).fill(false), selNum = [null, null], selChara = [null, null]; // @card_select, @card_select_num, @training_select_chara
  let setRyuha = null, blink = 0, chg = 0; // @set_cardryuha, @card_ryuha_blink_count, @card_chg_count
  let animeNo = 0, animeCount = 0, animeChg = 0; // @btl_anime_no, @btl_anime_count, @btl_anime_chg_count
  const counts = chars.map(() => 0); // @training_count
  let oldMsg = ['', '']; // @old_msg
  let msgCursor = true; // @msg_cursor.visible
  const btl = [{ on: false, row: 0 }, { on: false, row: 0 }]; // @btl_chara (sprites: they stay as last set)
  let clash = false, flash = false, hi = Array(7).fill(false), backs = Array(7).fill(false);

  // chk_select_cursor_control: the first card not picked from x on (n = 0); the second trainee (n = 1, z = 1 — the
  // original passes @training_select_chara.size − 1 = 1 as the right end, kept)
  const nextFree = (x) => { for (let k = 0; k < 7; k++) { const y = (x + k) % 7; if (!sel[y]) return y; } return x; };
  const charaNext = (x) => {
    let y = x + 1;
    if (y > 1) y = 0;
    for (let k = 0; k < 3; k++) { if (selChara[0] !== y) return y; y++; if (y > 1) y = 0; }
    return y;
  };
  // chk_card_ryuha: same school, and not 必
  const pairOk = () => cards[selNum[0]].s === cards[selNum[1]].s && cards[selNum[0]].s !== 0 && cards[selNum[1]].s !== 0;
  const pairMsg = () => { // output_msg at state 6
    const a = chars[selChara[0]], b = chars[selChara[1]], p = RT.pairs[pattern];
    if (!p) return;
    const hit = p.list.find(([x, y]) => (x === a && y === b) || (p.both && x === b && y === a));
    if (hit) oldMsg = [hit[2], hit[3]];
  };

  // ---- one frame: the parts of pre_update that move (output_battle_card, output_btl_anime) ----
  sc.onFrame = () => {
    for (let a = 0; a < 7; a++) {
      if (a !== 6) blink++;
      hi[a] = false;
      backs[a] = false;
      if (ws !== 7 || chg % 2 !== 0 || !sel[a]) {
        if (setRyuha != null && blink <= 20 && ws <= 3) { if (cards[a].s === setRyuha) hi[a] = true; } // the matching schools blink
        else if (blink >= 40) blink = 0;
      } else backs[a] = true; // state 7: the pair flickers face down
    }
    if (ws === 7) chg++;
    if (chg === 40) { // the pair is used up: new cards (createcardval → create_card_i 0, 必 can come back), +1 each
      chg = 0;
      cards[selNum[0]] = newCard();
      cards[selNum[1]] = newCard();
      counts[selChara[0]]++;
      counts[selChara[1]]++;
      selNum = [null, null];
      selChara = [null, null];
      sel = Array(7).fill(false);
      setRyuha = null;
      cardCur = 0;
      ws = 2;
    }
    flash = false;
    if (animeNo === 0) return;
    let end;
    if (animeNo === 1) { // 現れる: two flashes, every other frame from 20 on
      end = 50;
      flash = animeCount % 2 === 0 && animeCount >= 20;
    } else { // 戦う
      end = 260;
      if (FIGHT_SHOW.includes(animeCount)) { btl[0] = { on: true, row: 0 }; btl[1] = { on: true, row: 0 }; clash = false; }
      const f = FIGHT[animeCount];
      if (f) { btl[0].row = f[0]; btl[1].row = f[1]; if (f[2] != null) clash = f[2]; }
      if (animeCount === end) { btl[0].on = btl[1].on = false; clash = false; }
    }
    let done = false;
    if (animeCount === end) {
      animeCount = 0;
      if (ws === 6) { if (animeChg === 0) animeNo = 2; else if (animeChg === 1) animeNo = 1; else done = true; animeChg++; }
    } else animeCount++;
    if (done) { animeNo = 0; animeChg = 0; animeCount = 0; ws++; }
  };

  sc.onDraw = () => {
    const c = sc.cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.fillStyle = SKN0;
    c.fillRect(0, 0, RW, RH);
    c.fillStyle = '#000';
    c.fillRect(BX, BY, 224, 128);
    // output_character / output_training_count
    for (let a = 0; a < n; a++) {
      const fx = FX0 + 64 * a;
      blit(c, FACES, 0, 64 * (chars[a] - 3), 64, 64, fx, FY);
      c.fillStyle = SKN1;
      c.fillRect(fx + 16, FY + 80, 32, 32);
      digits(c, counts[a], fx + 32, FY + 96);
    }
    // output_btl_anime 1: the flashes
    if (flash) { blit(c, ANIME, 0, 48, 64, 64, BX + 38, BY + 32); blit(c, ANIME, 0, 48, 64, 64, BX + 130, BY + 32); }
    // output_battle_card (school icon (32i,64); blinking: (32i,240))
    for (let a = 0; a < 7; a++) {
      const x = 64 * a, y = CT + 24 - (sel[a] ? 22 : 0);
      if (backs[a]) drawBack(c, x, y, z4);
      else drawCard(c, cards[a], x, y, [32 * cards[a].s, hi[a] ? 240 : 64]);
    }
    // output_cursor (while the message ▼ is hidden)
    if (!msgCursor) {
      if (ws < 4) cursorAt(c, 64 * cardCur + 10, CT + 8, true, sc.fc);
      else if (ws <= 6) {
        cursorAt(c, FX0 + 64 * charaCur + 24, FY - 16, true, sc.fc);
        if (ws >= 5) for (const k of selChara) if (k != null) cursorAt(c, FX0 + 64 * k + 24, FY - 16, false, sc.fc);
      }
    }
    // the two fighters (the second one mirrored) and the spark
    for (let k = 0; k < 2; k++) {
      if (!btl[k].on || selChara[k] == null) continue;
      const sh = img(sprite(world, chars[selChara[k]]) || '');
      if (!sh.ok) continue;
      const x = BX + (k ? 98 : 34), y = BY + 8;
      c.save();
      if (k) { c.translate(x + 96, y); c.scale(-1, 1); c.drawImage(sh.im, 0, 96 * btl[k].row, 96, 96, 0, 0, 96, 96); } else c.drawImage(sh.im, 0, 96 * btl[k].row, 96, 96, x, y, 96, 96);
      c.restore();
    }
    if (clash) blit(c, ANIME, 32, 16, 32, 32, BX + 98, BY + 48);
    if (ws >= 16) return; // get_exp writes its own messages
    // output_msg
    sc.more = msgCursor;
    if (ws === 0) sc.lines = RT.intro;
    else if (ws >= 1 && ws <= 6) sc.lines = counts.every((k) => k === 0) && ws !== 6 ? RT.first : [oldMsg[0], '', oldMsg[1]];
    else if (ws === 15) sc.lines = RT.end[pattern] || RT.end[0];
    else if (ws === 7) sc.lines = [];
    // the bar: 決定 = C, 返回 = B (cards and faces can also be tapped: first tap points, the second decides)
    if (ws >= 2 && ws <= 5) sc.buttons(`pick${ws === 2 ? 2 : 3}`, ws === 2 ? [['決定', C]] : [['決定', C], ['返回', B]]);
    else sc.buttons('', []);
  };

  // ---- input: Input::C / Input::B of the original's update ----
  function C() {
    if (animeNo === 0 && ws !== 7) audio.se(SE_OK);
    if (ws === 0) ws = 1;
    else if (ws === 1) { msgCursor = false; ws = 2; }
    else if (ws === 2) { ws = 3; sel[cardCur] = true; selNum[0] = cardCur; setRyuha = cards[cardCur].s; cardCur = nextFree(cardCur); }
    else if (ws === 3) {
      ws = 4;
      sel[cardCur] = true;
      charaCur = 0;
      selNum[1] = cardCur;
      if (!pairOk()) { msgCursor = true; ws = 15; audio.se('Z1 完了'); }
    } else if (ws === 4) { ws = 5; selChara[0] = charaCur; charaCur = charaNext(charaCur); }
    else if (ws === 5) { ws = 6; selChara[1] = charaCur; animeNo = 1; pairMsg(); }
    else if (ws === 15) ws = 16;
    sc.tick(0);
  }
  function B() { // (no sound in the original)
    if (ws === 3) { sel[selNum[0]] = false; selNum[0] = null; setRyuha = null; ws = 2; }
    else if (ws === 4) { sel[selNum[1]] = false; selNum[1] = null; ws = 3; charaCur = 0; selChara = [null, null]; }
    else if (ws === 5) { ws = 4; selChara = [null, null]; }
    sc.tick(0);
  }
  // touch: a card / a face — the first tap moves the ▼ there (cursor sound), a tap on the ▼ decides;
  // a tap on the card or trainee already picked takes it back (B)
  const pointCard = (i) => {
    if (i < 0 || i > 6) return;
    if (ws === 3 && i === selNum[0]) { B(); return; }
    if (sel[i]) return;
    if (i !== cardCur) { audio.se(SE_MOVE); cardCur = i; sc.tick(0); return; }
    C();
  };
  const pointChara = (i) => {
    if (i < 0 || i >= n) return;
    if (ws === 5 && i === selChara[0]) { B(); return; }
    if (i !== charaCur) { audio.se(SE_MOVE); charaCur = i; sc.tick(0); return; }
    C();
  };
  sc.root.addEventListener('click', (e) => {
    if (sc.frozen || e.target.closest('button')) return;
    if (ws === 0 || ws === 1 || ws === 15) { C(); return; }
    if (e.target !== sc.cv) return;
    const [x, y] = sc.at(e);
    if ((ws === 2 || ws === 3) && y >= CT) pointCard(Math.floor(x / 64));
    else if ((ws === 4 || ws === 5) && y >= FY - 24 && y < FY + 112) pointChara(Math.floor((x - FX0) / 64));
  });
  window.__z3t = {
    tick: sc.tick, C, B, pointCard, pointChara,
    get state() { return { ws, cardCur, charaCur, sel: [...sel], selNum: [...selNum], selChara: [...selChara], cards: cards.map((c) => ({ ...c })), counts: [...counts], animeNo, lines: sc.lines }; },
    set cards(v) { v.forEach((c, k) => { cards[k] = { ...cards[k], ...c }; }); },
  };

  sc.tick(0);
  await sc.fade(1, 10);
  await sc.until(() => ws >= 16);

  // ---- get_exp: each trainee in turn ----
  sc.frozen = true;
  msgCursor = false;
  for (let a = 0; a < n; a++) {
    if (!world.actors[chars[a]]) continue;
    const m = member(game, chars[a]); // (the Super Saiyan form if that one is active: it keeps the EXP)
    const total = Math.trunc(m.level * 250 * counts[a] * 3 + (BONUS[pattern] ?? BONUS[0])) * EXP_RATE;
    audio.se(SE_EXP);
    await sc.msgWait(s, RT.exp(m.name, total));
    m.exp += total;
    if (levelUp(world, m)) {
      audio.se('Z1 レベルアップ', 80); // common event 188 ($BGM_levelup_se)
      await sc.msgWait(s, RT.level(m.name, m.level));
    }
    const tec = (TECP[pattern] ?? 3) + Math.floor(counts[a] / 2);
    await sc.msgWait(s, RT.tec(tec));
    s.skillLv = s.skillLv || {};
    for (const id of m.skills) s.skillLv[id] = Math.min(99999, (s.skillLv[id] || 0) + tec);
  }
  s.hand = cards.slice(0, 6).map((c) => ({ ...c })); // the cards stay as the battle hand ($carda / $cardg / $cardi)
  sc.lines = [];
  sc.more = false;
  await sc.fade(0, 20);
  sc.close();
  return { cleared: true, counts };
}

// ======================================================================================================
// Z3 重力修行 (Scene_Db_Z3_Gravity_Training)
// ======================================================================================================
const GT = {
  rule0: (who) => [`${who}的重力修行！`, '請調整卡片的星數為16！'],
  rule1: ['最多能抽兩張卡　但卡片都是自動抽取的！', '比重力裝置的星數少　或者超過16都算失敗！', '並且會受到傷害！'],
  rule2: ['從100倍重力開始！', '每通過一次就提高20倍　', '最多可通過300倍重力！', 'HP為0時　會重新從100倍開始！'],
  rule3: ['一口氣全部通關吧！', '修行開始了！'],
  deal: ['重力裝置在抽卡…'],
  turn: (who) => [`到${who}的回合了！`, '要再抽一張卡嗎？'],
  stars: (k) => [`卡片上的星數是　${k}`, '要再抽一張卡嗎？'],
  duel: ['', '勝負！'],
  lose: (who, g) => [`${who}無法忍受　${g}倍的重力！`, `${who}受到　${g / 10}點傷害！`],
  again: (who) => [`${who}「可惡…　再　再來一次…！`, '　這種程度的重力我馬上就能克服…！」'],
  tie: ['修行沒獲得有效的成果…'],
  win: (who, g) => [`${who}克服了　${g}倍的重力！`],
  next: (g) => [`下次要挑戰　${g}倍的重力！`],
  faint: (who) => [`${who}因受到過多的傷害而失去知覺了……`],
  done: ['太好了！　終於克服了300倍的重量！'],
  exp: (who, n) => [`${who}獲得了　${n}　經驗值！`],
  level: (who, lv) => [`${who}升到${lv}級了！`],
};
const CARD_WAIT = 30;
// output_character: the trainee's 96×96 rows by @anime_count (0..159); 17 = hurt
const idleRow = (k) => (k < 16 || (k >= 80 && k < 96) ? 0 : k < 32 || (k >= 48 && k < 64) ? 1 : k < 80 ? 2 : (k >= 96 && k < 112) || (k >= 128 && k < 144) ? 3 : 4);
// chk_add_training_card: the chance (%) the machine adds a third card, by its two cards' stars
const ADD = (t) => (t <= 8 ? 80 : [70, 60, 40, 20, 15, 10, 5][t - 9] ?? 0);

// portrait stage 400×440: the trainee's black box and the machine on top, the HP / G windows, the two piles of
// cards (yours under the trainee, the machine's under it; each pile steps 16 left and 32 down), the cut-in strip
const GW = 400, GH = 440;
const BOX = [24, 0], MACH = [248, 0], HPW = [24, 136], GWIN = [248, 136];
const BTL = [88, 208], TRA = [312, 208], CUT_Y = 376;

export async function z3GravityTraining(game, opts = {}) {
  const world = game.world, s = game.state;
  const m = opts.member || s.party[0];
  const z = s.var[40] || 0;
  const who = m.name;
  await loadImages([CARDS, DIGITS, MACHINE, CUTIN, FRAME, sprite(world, m.id)].filter(Boolean));
  audio.playBgm(['Z1 修行', 'Z2 修行', 'Z3 修行'][Math.min(z, 2)]);
  const sc = scene('zt-grav', GW, GH, false);

  let ws = 0, wait = 0; // @window_state, @wait_count
  let hp = m.hp, level = 100; // @battle_hp (the scene's own copy), @training_level
  let se = true, msgCursor = true; // @kettei_se_flag, @msg_cursor.visible
  let anime = 0, animePlus = true, row = 0; // @anime_count, @anime_count_plus_flag
  let tra = [], traVis = [false, false, false], open = false; // @training_carda, @training_card_visible, @training_card_open
  let bat = [], batVis = [false, false, false], result = 1; // @battle_carda, @battle_card_visible, @battle_card_result (1 是 / −1 不是)
  let cutin = 0; // @cha_cutin_no: 0 normal, 1 hurt, 2 won
  let busy = false;
  const create = () => { tra = [0, 1, 2].map(() => rand(8)); bat = [0, 1, 2].map(() => rand(8)); }; // create_card 1, 0 (guard 0)
  const reset = () => { // reset_variable
    se = false; animePlus = true; msgCursor = false;
    traVis = [false, false, false]; open = false;
    batVis = [false, false, false]; result = 1; cutin = 0;
    create();
  };
  const sum = (a, k) => a.slice(0, k).reduce((t, v) => t + v + 1, 0);
  function chk() { // chk_training
    let r = 0;
    if (ws === 7) { if (sum(bat, 3) > 16) r = 2; } // the third card: over 16 at once
    else {
      const mine = sum(bat, batVis[2] ? 3 : batVis[1] ? 2 : 1), his = sum(tra, traVis[2] ? 3 : 2);
      r = his > 16 || mine > his ? 1 : mine === his ? 3 : 2;
    }
    if (r === 1) { cutin = 2; ws = 25; se = true; msgCursor = true; animePlus = false; }
    else if (r === 2) { cutin = 1; ws = 22; se = true; msgCursor = true; audio.se('Z1 ダメージ'); }
    else if (r === 3) { ws = 24; se = true; msgCursor = true; }
  }

  sc.onFrame = () => {
    // output_character
    row = idleRow(anime);
    if (animePlus) anime = anime !== 159 ? anime + 1 : 0;
    if (ws === 22 || ws === 23 || ws === 27) { row = 17; anime = 0; }
    // output_training_card: the machine's two cards face down, 30 frames apart, then your first card
    if (ws === 4 && wait === 0) {
      if (traVis[1]) { batVis[0] = true; ws = 5; se = true; }
      else if (!traVis[0]) { wait = CARD_WAIT; traVis[0] = true; } else { wait = CARD_WAIT; traVis[1] = true; }
    }
    // update
    if (wait !== 0) wait--;
    if (ws === 7 && wait === 0) {
      ws = 10; wait = CARD_WAIT * 3; result = 1;
      if (ADD(sum(tra, 2)) >= rand(100)) traVis[2] = true;
    } else if (ws === 10 && wait === 0) { open = true; wait = CARD_WAIT * 2; ws = 11; }
    else if (ws === 11 && wait === 0) chk();
  };

  sc.onDraw = () => {
    const c = sc.cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.fillStyle = SKN0;
    c.fillRect(0, 0, GW, GH);
    c.fillStyle = '#000';
    c.fillRect(BOX[0], BOX[1], 128, 128);
    blit(c, MACHINE, 0, 0, 128, 128, MACH[0], MACH[1]); // output_opponent
    // output_hp: HP (0,16) and G (336,16) of 数字英語
    windowBox(c, HPW[0], HPW[1], 128, 64);
    windowBox(c, GWIN[0], GWIN[1], 128, 64);
    blit(c, DIGITS, 0, 16, 32, 16, HPW[0] + 16, HPW[1] + 32);
    digits(c, hp, HPW[0] + 96, HPW[1] + 32);
    blit(c, DIGITS, 336, 16, 16, 16, GWIN[0] + 96, GWIN[1] + 32);
    digits(c, level, GWIN[0] + 80, GWIN[1] + 32);
    const sp = sprite(world, m.id);
    if (sp) blit(c, sp, 0, 96 * row, 96, 96, BOX[0] + 14, BOX[1] + 4);
    // output_battle_card: yours, school = the trainee's (class − 1)
    for (let x = 0; x < 3; x++) if (batVis[x]) drawCard(c, { a: bat[x], g: 0 }, BTL[0] - 16 * x, BTL[1] + 32 * x, [32 * m.school, 64]);
    // output_training_card: the machine's, face down until they open (school 重 = (352,0))
    for (let x = 0; x < 3; x++) {
      if (!traVis[x]) continue;
      if (open) drawCard(c, { a: tra[x], g: 0 }, TRA[0] - 16 * x, TRA[1] + 32 * x, [352, 0]);
      else drawBack(c, TRA[0] - 16 * x, TRA[1] + 32 * x, !!s.sw[431]);
    }
    // output_cha_cutin: 640×64 per pose, row = actor − 3 (the middle 400 here)
    blit(c, CUTIN, 640 * cutin + 120, 64 * (m.id - 3), GW, 64, 0, CUT_Y);
    if (busy) return;
    // output_msg
    sc.more = msgCursor;
    sc.center = ws === 10 || ws === 11;
    const L = {
      0: GT.rule0(who), 1: GT.rule1, 2: GT.rule2, 3: GT.rule3, 4: GT.deal,
      5: GT.turn(who), 6: GT.stars(sum(bat, 2)), 10: GT.duel, 11: GT.duel,
      22: GT.lose(who, level), 23: GT.again(who), 24: GT.tie, 25: GT.win(who, level), 26: GT.next(level + 20),
      27: GT.faint(who), 28: GT.done,
    };
    if (ws in L) sc.lines = L[ws]; // 7: the question stays as it was; 21, 30, 31: nothing new
    if (ws === 5 || ws === 6) sc.buttons(`ask${ws}`, [['是', () => { result = 1; C(); }], ['不是', () => { result = -1; C(); }]]);
    else sc.buttons('', []);
  };

  async function getExp() { // get_exp: 100000 × (level / 100), times the EXP rate like the other trainings
    busy = true;
    sc.frozen = true;
    const total = 100000 * Math.floor(level / 100) * EXP_RATE;
    await sc.msgWait(s, GT.exp(who, total));
    m.exp += total;
    if (levelUp(world, m)) {
      audio.se('Z1 レベルアップ', 80); // common event 188
      await sc.msgWait(s, GT.level(who, m.level));
    }
    sc.frozen = false;
    busy = false;
  }
  async function C() {
    if (busy) return;
    if (se) audio.se(SE_OK);
    switch (ws) {
      case 0: case 1: case 2: case 3:
        ws++;
        if (ws === 4) { se = false; msgCursor = false; wait = CARD_WAIT; create(); }
        break;
      case 5:
        if (result === 1) { ws = 6; batVis[1] = true; result = 1; } else { se = false; ws = 7; wait = CARD_WAIT * 2; }
        break;
      case 6:
        se = false; ws = 7; wait = CARD_WAIT * 2;
        if (result === 1) { batVis[2] = true; chk(); }
        break;
      case 22: // chk_damage
        ws = 23;
        hp -= Math.floor(level / 10);
        if (hp <= 0) { hp = 0; ws = 27; }
        break;
      case 23: case 24: ws = 4; reset(); wait = CARD_WAIT; break;
      case 25: ws = level === 300 ? 28 : 26; break;
      case 26:
        if (level === 100 || level === 200) { audio.se(SE_EXP); await getExp(); }
        level += 20; ws = 4; reset(); wait = CARD_WAIT;
        break;
      case 27: ws = 31; break;
      case 28: ws = 30; audio.se(SE_EXP); await getExp(); break;
      default: break;
    }
    sc.tick(0);
  }
  // a tap on the message states is the confirm button (是 / 不是 are buttons)
  sc.root.addEventListener('click', (e) => {
    if (busy || e.target.closest('button')) return;
    if (ws <= 3 || (ws >= 22 && ws <= 28)) C();
  });
  window.__z3t = {
    tick: sc.tick, C, yes: () => { result = 1; return C(); }, no: () => { result = -1; return C(); },
    get state() { return { ws, wait, hp, level, tra: [...tra], traVis: [...traVis], open, bat: [...bat], batVis: [...batVis], lines: sc.lines, exp: m.exp, lv: m.level }; },
    set hp(v) { hp = v; },
    set level(v) { level = v; },
    set cards({ mine, his }) { if (mine) bat = [...mine]; if (his) tra = [...his]; },
  };

  sc.tick(0);
  await sc.fade(1, 10);
  await sc.until(() => ws >= 30 && !busy);
  const cleared = ws === 30;
  await sc.fade(0, 20);
  sc.close();
  return { cleared, level };
}

// ======================================================================================================
// testing: index.html?dev=z3pair (流派一致修行, pattern 0) / ?dev=z3gravity (Vegeta) — &timer in a hidden pane;
// &pattern=N for the other line-ups of the pair training. A small panel shows the result and plays again.
// ======================================================================================================
const DEV_LV = { 3: 38, 4: 36, 5: 33, 6: 30, 7: 28, 8: 30, 9: 27, 12: 40 };
function devMember(w, id) {
  const m = makeMember(w, id);
  m.level = DEV_LV[id] || 30;
  m.exp = w.actors[id].exp[m.level];
  m.maxLv = m.level;
  applyLevel(w, m);
  heal(m);
  return m;
}
async function devRun(game, step) {
  const w = game.world, s = game.newState();
  game.state = s;
  game.busy = true;
  s.bench = {};
  s.var[40] = 2;
  s.var[43] = 55;
  s.cardiMax = 10;
  s.skillLv = {};
  const pattern = Number(new URLSearchParams(location.search).get('pattern') || 0);
  const ids = step === 'z3gravity' ? [12] : pattern === 3 ? [6, 7, 8, 9] : [3, 4, 5];
  s.party = ids.map((id) => devMember(w, id));
  await applyEra(game);
  for (;;) {
    const before = s.party.map((p) => `${p.name} Lv${p.level}`).join('、');
    const r = step === 'z3gravity' ? await z3GravityTraining(game) : await ryuhaPairTraining(game, { pattern });
    const after = s.party.map((p) => `${p.name} Lv${p.level}`).join('、');
    const root = overlay('zt zt-dev');
    root.append(el('div', 'win zt-msg', [`測試：${step === 'z3gravity' ? 'Z3 重力修行' : '流派一致修行'}`, `結果 ${JSON.stringify(r)}`,
      `修行前：${before}`, `修行後：${after}`].join('\n')));
    await new Promise((res) => root.append(el('div', 'zt-bar', button('再玩一次', () => { audio.se(SE_OK); res(); }))));
    root.remove();
    for (const p of s.party) heal(p); // (the original's all_charecter_recovery before the next try)
  }
}
registerZ3('z3train', {
  maps: [],
  start() {},
  dev(game, step) {
    if (step !== 'z3pair' && step !== 'z3gravity') return false;
    devRun(game, step);
    return true;
  },
});

const css = document.createElement('style');
css.textContent = `
.zt { align-items: center; gap: 6px; }
.zt .win { align-self: stretch; }
.zt-msg { position: relative; min-height: calc(4 * 1.5em + 8px); font-size: 15px; line-height: 1.5; white-space: pre-wrap; }
.zt-msg.zt-center { text-align: center; }
.zt-msg.zt-more::after { content: "▼"; position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%); color: #d0480c; font-size: 12px; animation: zt-blink .6s steps(1) infinite; }
@keyframes zt-blink { 50% { opacity: 0; } }
.zt-stage { width: min(100%, calc(var(--w) * 1px), calc((100dvh - 214px - var(--safe-t, 0px) - var(--safe-b, 0px)) * var(--w) / var(--h))); height: auto; aspect-ratio: var(--w) / var(--h); }
.zt-bar { display: flex; gap: 6px; width: 100%; margin-top: auto; min-height: 52px; }
.zt-bar .btn { margin: 0; text-align: center; flex: 1; }
`;
document.head.appendChild(css);

// King Kai's first training: catching Bubbles (113 Scene_Db_Bubbles_Training), run from the training squares of
// map 9. Bubbles shows a card; play one of the six cards of the battle hand with at least as many attack stars
// (a 1 also beats his 7, a 2 his 8). Each win brings Goku 40 px closer; the sixth catches him. A loss makes Goku
// crouch while Bubbles mocks him. When the six cards are gone without six wins the training stops, and the wins so
// far are kept (variable 431) for the next try. Catching him: 1000 EXP for Goku and +10 uses of all his moves.
// The film runs at the original's 60 frames a second with its frame counts, positions (shifted 110 px left so the
// 640-wide scene fits a 440-wide strip) and sprites.
import { img, audio, rand } from './core.js?v=20261102-1141';
import { newCard } from './battle.js?v=20261102-1141';
import { levelUp, EXP_RATE } from './party.js?v=20261102-1141';
import { el, overlay, button } from './fieldmenu.js?v=20261102-1141';

const P = (n) => `Graphics/Pictures/${n}.PNG`;
const CARDS = P('カード関係'), BACK = P('Z1_背景_スクロール_界王星');
const BUB = [P('Z1_走るバブルス'), P('Z1_走るバブルス(ジャンプ)'), P('Z1_走るバブルス(後ろ向き煽る)'), P('Z1_走るバブルス(尻書き)'),
  P('Z1_走るバブルス(普通に走る)')];
const GOKU = [P('Z1_走る悟空'), P('Z1_走る悟空(しゃがむ)'), P('Z1_走る悟空(飛びつく)')];
const SW = 440, SH = 160, OX = -110; // strip size; x shift from the original 640-wide scene
const BX = 294 + 166 + OX, BY = 160 - 66; // Bubbles (pic_baburus[0])
const GY = BY - 44; // Goku
const GOKU_WIN_X = 40;
const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動';

function drawCard(c, cd, x, y, back) {
  const s = img(CARDS);
  if (!s.ok) return;
  if (back) { c.drawImage(s.im, 64, 96, 64, 96, x, y, 64, 96); return; }
  c.drawImage(s.im, 0, 96, 64, 96, x, y, 64, 96);
  c.drawImage(s.im, 32 * cd.a, 0, 32, 32, x + 2, y + 2, 32, 32);
  c.drawImage(s.im, 32 * cd.g, 32, 32, 32, x + 30, y + 62, 32, 32);
  c.drawImage(s.im, 32 * cd.s, 64, 32, 32, x + 16, y + 32, 32, 32);
}
function blit(c, sheet, sx, sy, w, h, x, y) {
  const im = img(sheet);
  if (im.ok) c.drawImage(im.im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
}

// resolves 'won' (Bubbles caught) or 'fail' (out of cards)
export async function bubblesTraining(game) {
  const world = game.world, s = game.state, T = world.chapter3.bubbles;
  const goku = s.party.find((m) => m.id === 3) || s.party[0];
  s.var[51] = (s.var[51] || 0) + 1;
  audio.playBgm(T.bgm);

  const root = overlay('kt');
  const msg = el('div', 'win kt-msg');
  const top = el('canvas', 'kt-top');
  top.width = 160; top.height = 100;
  const stage = el('canvas', 'kt-stage');
  stage.width = SW; stage.height = SH;
  const handCv = el('canvas', 'kt-hand');
  handCv.width = 6 * 64; handCv.height = 112;
  const bar = el('div', 'kt-bar');
  root.append(msg, top, stage, handCv, bar);

  // ---- the scene's state, named after the original's instance variables ----
  const hand = s.hand;
  const used = [false, false, false, false, false, false];
  let win = s.var[431] || 0; // player_win_num
  let windowState = 0, cursor = 0, bub = newCard();
  let scrollOn = true, scrollCount = 0, scrollNo = 0, backX = 0;
  const SCROLL = [3, 3, 3, 3, 4];
  let all = false, allNo = 0, allCount = 0; // allpic_action_*
  let gx = 294 - 164 + OX + GOKU_WIN_X * win; // pic_goku[0].x
  let gAnime = 0, gFrame = 0, gAct = false, gActNo = 0, gNo = 0, gEnd = false, gCatchX = gx;
  const gCount = { 1: [16, 16, 16, 16, 16, 16], 2: [8, 16, 64] }, gChg = { 1: 0, 2: 0 };
  let bAnime = 0, bTurn = 0, bFrame = 0, bAct = false, bActNo = 0, bEnd = false, bShown = 0;
  const bCount = { 0: [16, 8, 8, 8, 16], 1: [16, 8, 8, 8, 16, 8, 8, 8, 16], 2: [16, 16, 16, 16, 16, 16],
    3: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8], 4: [8, 8, 8, 8, 8, 8], 8: Array(22).fill(4) };
  const bChg = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 8: 0 };
  const SWITCH = 4; // pic_babukirikawari: Bubbles runs normally after 4 wins
  let gokuPose = null, bubPose = null; // what to draw this frame: [sheet, sx, w, h, x, y]

  function frame() {
    // background scroll
    if (scrollOn) {
      scrollCount++;
      if (SCROLL[scrollNo] === scrollCount) {
        scrollCount = 0;
        scrollNo = (scrollNo + 1) % SCROLL.length;
        backX -= 2;
        if (backX === -1024) backX = 0;
      }
    }
    // the win / loss film (allpic_action_no)
    if (all) {
      if (allNo === 0 || allNo === 8) {
        if (allCount / 2 < 20) {
          allCount++;
          if (allCount % 2 === 0) gx += 2;
        } else {
          bAnime = 0; bFrame = 0;
          bAct = true;
          if (allNo === 0) bActNo = rand(2) + 1; // jump or turn round and mock (no 尻書き)
          else { bActNo = 8; gAct = true; gActNo = 8; gFrame = 0; gAnime = 0; }
          allNo = 99;
        }
      } else if (allNo === 9) { // a loss
        scrollOn = false;
        bAnime = 0; bFrame = 0;
        bAct = true; bActNo = rand(3) + 1;
        gAct = true; gActNo = 9; gFrame = 0; gAnime = 0;
        allNo = 99;
      }
    }
    // Goku
    if (!gAct) {
      if (gFrame === 8) { gFrame = 0; gAnime = (gAnime + 1) % 8; }
      gokuPose = [GOKU[0], 56 * gAnime, 56, 80, gx, GY];
    } else {
      if (gActNo === 8) { // the dive
        gNo = 2;
        const n = gChg[2];
        if (n === 0) { scrollOn = false; gCatchX = gx; } else if (n === 1) gCatchX = gx + 32; else if (n === 2) gCatchX = gx + 48;
        gokuPose = [GOKU[2], 72 * gAnime, 72, 92, gCatchX, GY - 12];
        if (gFrame >= gCount[2][gAnime]) {
          gFrame = 0;
          const k = ++gChg[2];
          if (k <= 2) gAnime = k; else if (k === 3) gEnd = true;
        }
      } else { // 9: crouch
        gNo = 1;
        gokuPose = [GOKU[1], 56 * gAnime, 56, 80, gx, GY];
        if (gFrame >= gCount[1][gAnime]) {
          gFrame = 0;
          const k = ++gChg[1];
          if (k <= 5) gAnime = k % 2; else gEnd = true;
        }
      }
      if (gEnd) {
        gFrame = 0; gChg[gNo] = 0;
        gAct = false; gAnime = 0; allCount = 0; gEnd = false;
        if (win === 6) gokuPose = [GOKU[2], 72 * 2, 72, 92, gCatchX, GY - 12]; // stays on him
        if (!bAct) { scrollOn = true; all = false; }
      }
    }
    if (win === 6 && !gAct && gActNo === 8) gokuPose = [GOKU[2], 72 * 2, 72, 92, gCatchX, GY - 12];
    // Bubbles
    let bNo;
    if (!bAct) {
      if (win > SWITCH - 1) { // 普通に走る
        bNo = 4;
        if (bFrame >= bCount[4][bChg[4]]) {
          bFrame = 0;
          bChg[4] = (bChg[4] + 1) % bCount[4].length;
          bAnime = [0, 1, 0, 1, 0, 2][bChg[4]];
        }
        bubPose = [BUB[4], 54 * bAnime, 54, 36, BX, BY];
      } else {
        bNo = 0;
        if (bFrame >= bCount[0][bChg[0]]) {
          bFrame = 0;
          if (bAnime === 0) bTurn = 1; else if (bAnime === 3) bTurn = -1;
          bChg[0] += bTurn;
          bAnime = [0, 2, 1, 2, 3][bChg[0]];
        }
        bubPose = [BUB[0], 50 * bAnime, 50, 36, BX, BY];
      }
    } else {
      bNo = bActNo;
      if (bActNo === 1) { // jump on the spot
        bubPose = [BUB[1], 48 * bAnime, 48, 52, BX + 2, BY - 16];
        if (bFrame >= bCount[1][bAnime]) {
          bFrame = 0;
          const k = ++bChg[1];
          if (k <= 3) bAnime = k; else if (k <= 7) bAnime = k - 4; else if (k === 8) bAnime = 0; else bEnd = true;
        }
      } else if (bActNo === 2 || bActNo === 3) { // turn round and mock / lie down and scratch his bottom
        const tall = bActNo === 2 ? 32 : 24, last = bActNo === 2 ? 6 : 12;
        bubPose = [BUB[bActNo], 48 * bAnime, 48, tall, BX + 2, BY + (bActNo === 2 ? 4 : 12)];
        if (bFrame >= bCount[bActNo][bAnime]) {
          bFrame = 0;
          const k = ++bChg[bActNo];
          if (k < last) bAnime = k % 2; else bEnd = true;
        }
      } else { // 8: caught
        bubPose = [BUB[4], 54 * bAnime, 54, 36, BX, BY];
        if (bFrame >= bCount[8][bChg[8]]) {
          bFrame = 0;
          const k = ++bChg[8];
          bAnime = [0, 1, 0, 1, 0][k % 5];
          if (k === bCount[8].length) bEnd = true;
        }
      }
      if (bEnd) {
        bFrame = 0; bChg[0] = 0; bChg[4] = 0; bChg[bNo] = 0;
        bAct = false; bAnime = 0; bEnd = false;
        if (win === 6) bShown = bubPose; // stays caught
        if (!gAct) { scrollOn = true; all = false; allCount = 0; }
      }
    }
    if (win === 6 && bShown && !bAct) bubPose = bShown;
    bFrame++;
    gFrame++;
  }

  function draw() {
    const c = stage.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, SW, SH);
    blit(c, BACK, 0, 0, 1024, 160, backX, 0);
    blit(c, BACK, 0, 0, 1024, 160, backX + 1024, 0);
    if (bubPose) blit(c, bubPose[0], bubPose[1], 0, bubPose[2], bubPose[3], bubPose[4], bubPose[5]);
    if (gokuPose) blit(c, gokuPose[0], gokuPose[1], 0, gokuPose[2], gokuPose[3], gokuPose[4], gokuPose[5]);
    // Bubbles' face and card (face down while a card is being played)
    const t = top.getContext('2d');
    t.clearRect(0, 0, 160, 100);
    blit(t, T.face[0], 0, 64 * T.face[1], 64, 64, 4, 16);
    drawCard(t, bub, 88, 2, windowState === 2 || all || windowState === 0);
    const h = handCv.getContext('2d');
    h.clearRect(0, 0, handCv.width, handCv.height);
    hand.forEach((cd, k) => drawCard(h, cd, 64 * k, 16, used[k]));
    if (windowState === 1 && !all && Math.floor(performance.now() / 300) % 2) { // the blinking ▼ over the chosen card
      h.fillStyle = '#f83800';
      h.beginPath(); h.moveTo(64 * cursor + 25, 2); h.lineTo(64 * cursor + 39, 2); h.lineTo(64 * cursor + 32, 12); h.fill();
    }
  }

  // 60 frames a second, whatever the display rate; __kt.tick(n) steps it by hand (tests with a hidden page)
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
  window.__kt = { tick, get state() { return { win, windowState, all, used: [...used], bub, cursor }; } };
  const until = (cond) => new Promise((res) => waiters.push(() => cond() && (res(), true)));

  const setMsg = (lines) => { msg.textContent = lines.join('\n'); msg.style.visibility = lines.length ? 'visible' : 'hidden'; };
  let wake = null;
  const wait = () => new Promise((res) => { wake = res; });
  root.addEventListener('click', (e) => { if (!e.target.closest('button') && e.target !== handCv && wake) { const w = wake; wake = null; audio.se(SE_OK); w(); } });

  // ---- 0: the three pages of rules ----
  draw();
  for (const page of T.intro) { setMsg(page); await wait(); }
  setMsg([]);
  windowState = 1;

  // ---- 1/2: play cards ----
  let result;
  for (;;) {
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
      bar.replaceChildren(button('出這張牌', () => { audio.se(SE_OK); res(cursor); }));
    });
    handCv.onclick = null;
    bar.replaceChildren();
    windowState = 2;
    // chk_training
    const a = bub.a, mine = hand[k].a;
    if (a <= mine || (a === 6 && mine === 0) || (a === 7 && mine === 1)) {
      audio.se(win <= 2 ? 'Z1 SE111' : win <= 4 ? 'Z1 SE112' : 'Z1 SE113');
      win++;
      allNo = win === 6 ? 8 : 0;
    } else {
      audio.se('Z1 SE110');
      allNo = 9;
    }
    used[k] = true;
    bub = newCard(); // create_card 1
    hand[k] = newCard(); // create_card 0 (stays face down until the scene ends)
    all = true;
    windowState = 1;
    await until(() => !all);
    if (win === 6) { result = 'won'; break; }
    if (!used.includes(false)) { result = 'fail'; break; }
  }
  s.var[431] = win;

  if (result === 'won') { // 修行終了 (get_exp)
    audio.se('Z1 完了');
    const exp = T.exp * EXP_RATE; // the EXP rate, like battles
    setMsg([T.caught, '', T.done.replace('{exp}', exp)]);
    await wait();
    goku.exp += exp;
    if (levelUp(world, goku)) {
      audio.se('Z1 レベルアップ', 80);
      setMsg([T.level.replace('{name}', goku.name).replace('{level}', goku.level)]);
      await wait();
    }
    setMsg([T.tecText.replace('{n}', T.tec)]);
    await wait();
    s.skillLv = s.skillLv || {};
    for (const id of goku.skills) s.skillLv[id] = Math.min(99999, (s.skillLv[id] || 0) + T.tec);
    s.var[41] = 99;
  } else {
    audio.se('Z1 出る');
    s.var[41] = 0;
  }
  cancelAnimationFrame(raf);
  delete window.__kt;
  root.remove();
  return result;
}

const css = document.createElement('style');
css.textContent = `
.kt { align-items: center; gap: 8px; }
.kt .win { align-self: stretch; }
.kt-msg { min-height: 6.6em; font-size: 16px; line-height: 1.6; white-space: pre-wrap; }
.kt-top { width: 160px; height: 100px; image-rendering: pixelated; }
.kt-stage { width: 100%; max-width: 440px; height: auto; aspect-ratio: 440 / 160; image-rendering: pixelated; }
.kt-hand { width: min(100%, 384px); height: auto; aspect-ratio: 384 / 112; }
.kt-bar { display: flex; gap: 6px; width: 100%; margin-top: auto; min-height: 52px; }
.kt-bar .btn { margin: 0; text-align: center; flex: 1; }
`;
document.head.appendChild(css);

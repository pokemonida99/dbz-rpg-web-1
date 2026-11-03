// King Kai's second training: hitting Gregory with the hammer (112 Scene_Db_Gregory_Training), run from the
// training squares of map 11. Gregory shows a card; play one of the six cards of the battle hand with at most as
// many attack stars (a 7 also beats his 1, an 8 his 2). Each win brings Goku 40 px further and he swings the hammer
// (Gregory dodges, sideways or upwards); the sixth knocks Gregory down. A loss makes Goku crouch while Gregory
// flies round him. When the six cards are gone without six wins the training stops, and the wins so far are kept
// (variable 432) for the next try. Hitting him: 1800 EXP for Goku and +15 uses of all his moves; variable 41 = 109.
// The film runs at the original's 60 frames a second with its frame counts and positions (shifted 110 px left so
// the 640-wide scene fits a 440-wide strip), like src/kaiotraining.js.
import { img, audio, rand } from './core.js?v=20261104-0727';
import { newCard } from './battle.js?v=20261104-0727';
import { levelUp, EXP_RATE } from './party.js?v=20261104-0727';
import { el, overlay, button } from './fieldmenu.js?v=20261104-0727';

const P = (n) => `Graphics/Pictures/${n}.PNG`;
const CARDS = P('カード関係'), BACK = P('Z1_背景_スクロール_界王星');
// pic_baburus[0..3]: Gregory flying, dodging a sideways swing, dodging a downward swing, flying round a crouching Goku
const GRE = [P('Z1_走るグレゴリー'), P('Z1_走るグレゴリー(横振り避け)'), P('Z1_走るグレゴリー(縦振り避け)'), P('Z1_走るグレゴリー(悟空しゃがみ中)')];
// pic_goku[0..4]: running with the hammer, crouching, the hit (= downward swing sheet), sideways swing, downward swing
const GOKU = [P('Z1_走る悟空_ハンマー持っている'), P('Z1_走る悟空_ハンマー(しゃがむ)'), P('Z1_走る悟空_ハンマー(縦振り)'),
  P('Z1_走る悟空_ハンマー(横振り)'), P('Z1_走る悟空_ハンマー(縦振り)')];
const GW = [66, 66, 84, 68, 84]; // frame widths of those sheets
const SW = 440, SH = 160, OX = -110; // strip size; x shift from the original 640-wide scene
const GOKU_X = 294 - 164 + OX, GOKU_Y = 160 - 66 - 44; // pic_goku[0]
const HANARE = 100; // Gregory flies this far ahead of Goku (@hanarex)
const GRE_Y = 60; // pic_baburus[0].y
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

// Gregory's dodges, one step per frame (the case @chara_frame_count tables): returns [dx, dy, anime] — anime null
// leaves it; 'end' when the action is over. `y0` sets y absolutely (offset from pic_baburus[0].y) where the original does.
const odd = (f) => f % 2 === 1;
function dodgeSide(f) { // 1: 横振り避け
  if (f === 0) return { at: [2, 2], anime: 0 };
  if (f <= 11) return { d: [odd(f) ? 2 : 4, -4] };
  if (f === 12) return { d: [-2, 4], anime: 1 };
  if (f <= 43) return { d: [-2, f % 4 === 3 ? -2 : 0] };
  if (f === 44) return { d: [0, 2], anime: 2 };
  if (f <= 51) return { d: [odd(f) ? 2 : 4, 4] };
  if (f === 52) return { d: [0, -4], anime: 1 };
  if (f <= 83) return { d: [2, f % 4 === 3 ? 2 : 0] };
  if (f === 84) return { d: [0, -4], anime: 0 };
  if (f <= 104) return { d: [-2, f === 85 || f === 87 || (f >= 88 && f % 2 === 0) ? 2 : 0] };
  return 'end';
}
function dodgeUp(f) { // 2: 縦振り避け
  if (f === 0) return { at: [2, 2], anime: 0 };
  if (f <= 3) return { d: [2, -2] };
  if (f === 4) return { d: [0, 0], anime: 1 };
  if (f <= 12) return { d: [2, -2] };
  if (f === 13) return { d: [4, -4] };
  if (f === 14) return { d: [-4, 4], anime: 2 };
  if (f === 17) return { d: [2, -6] };
  if (f <= 21) return { d: [2, 2] };
  if (f === 22) return { d: [0, 0], anime: 3 };
  if (f === 27) return { d: [0, 0] };
  if (f === 28) return { d: [4, 4] };
  if (f <= 29) return { d: [2, 2] };
  if (f === 30) return { d: [0, 0], anime: 4 };
  if (f <= 33) return { d: [2, 2] };
  if (f <= 37) return { d: [-2, 2] };
  if (f === 38) return { d: [0, 0], anime: 5 };
  if (f <= 45) return { d: [-2, 2] };
  if (f === 46) return { d: [0, 0], anime: 6 };
  if (f <= 49) return { d: [-2, 2] };
  if (f <= 53) return { d: [-2, -2] };
  if (f === 54) return { d: [0, 0], anime: 7 };
  if (f <= 61) return { d: [-2, -2] };
  if (f === 62) return { d: [-8, -2], anime: 0 };
  if (f <= 65) return { d: [-2, 0] };
  return 'end';
}
function flyRound(f) { // 3: 悟空が負けた時
  if (f === 0) return { at: [0, 4], anime: 0 };
  if (f <= 31) return { d: [2, 0] };
  if (f === 32) return { d: [0, 0], y0: 4, anime: 1 };
  if (f <= 47) return { d: [2, odd(f) ? -2 : 0] };
  if (f === 48) return { d: [0, 0], y0: -4, anime: 2 };
  if (f <= 51) return { d: [0, 0] };
  if (f <= 59) return { d: [-2, odd(f) ? -2 : 0] };
  if (f === 60) return { d: [0, 0], y0: -2, anime: 3 };
  if (f <= 107) return { d: [-2, 0] };
  if (f === 108) return { d: [0, 0], anime: 4 };
  if (f <= 118) return { d: [-2, f <= 115 && odd(f) ? 2 : 0] };
  if (f === 119) return { d: [0, 0], anime: 0 };
  if (f <= 134) return { d: [2, odd(f) ? 0 : 2] };
  return 'end';
}
const DODGE = { 1: [dodgeSide, 48, 22], 2: [dodgeUp, 48, 32], 3: [flyRound, 48, 22] };

// resolves 'won' (Gregory hit) or 'fail' (out of cards)
export async function gregoryTraining(game) {
  const world = game.world, s = game.state, T = world.chapter4.training;
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
  let win = s.var[432] || 0; // player_win_num
  let windowState = 0, cursor = 0, gre = newCard();
  let scrollOn = true, scrollCount = 0, backX = 0;
  let all = false, allNo = 0, allCount = 0; // allpic_action_*
  let gx = GOKU_X + GOKU_WIN_X * win; // pic_goku[0].x
  let gAnime = 0, gFrame = 0, gAct = false, gActNo = 0, gEnd = false, gStep = 0, gHeld = null;
  const G_COUNT = { 0: [8, 8, 8, 8, 8, 8, 8, 8], 1: [16, 16, 16, 16, 16, 16, 16, 16], 2: [4, 8, 64], 3: [4, 8, 8, 8, 8, 8, 8, 8], 4: [4, 8, 8, 24, 8] };
  let bx = gx + HANARE, bAnime = 0, bFrame = 0, bStep = 0, bAct = false, bActNo = 0, bEnd = false, bHeld = null;
  let dx = 0, dy = 0; // the dodging sprite's position
  let gokuPose = null, grePose = null; // what to draw this frame: [sheet, sx, w, h, x, y]

  function frame() {
    // background scroll (@pic_back_scrollcount = [2])
    if (scrollOn && ++scrollCount === 2) {
      scrollCount = 0;
      backX -= 2;
      if (backX === -1024) backX = 0;
    }
    // the win / loss film (allpic_action_no)
    if (all) {
      if (allNo === 0 || allNo === 8) {
        if (allCount / 2 < 20) {
          allCount++;
          if (allCount % 2 === 0) gx += 2;
        } else {
          bAnime = 0; bFrame = 0;
          bAct = true; gAct = true;
          bActNo = gActNo = allNo === 0 ? rand(2) + 1 : 8; // 1 sideways swing / 2 downward swing; 8 the hit
          gFrame = 0; gAnime = 0;
          allNo = 99;
        }
      } else if (allNo === 9) { // a loss
        scrollOn = false;
        bAnime = 0; bFrame = 0;
        bAct = true; bActNo = 3;
        gAct = true; gActNo = 9; gFrame = 0; gAnime = 0;
        allNo = 99;
      }
    }
    // Goku
    let gNo = 0;
    if (!gAct) {
      if (gFrame >= G_COUNT[0][gAnime]) { gFrame = 0; gAnime = (gAnime + 1) % 8; }
      gokuPose = gHeld || [GOKU[0], 66 * gAnime, 66, 80, gx, GOKU_Y];
    } else {
      gNo = { 1: 3, 2: 4, 8: 2, 9: 1 }[gActNo];
      gokuPose = [GOKU[gNo], GW[gNo] * gAnime, GW[gNo], 80, gx + (gNo === 1 ? 0 : 8), GOKU_Y];
      if (gFrame >= G_COUNT[gNo][gAnime]) {
        gFrame = 0;
        const k = ++gStep;
        if (gActNo === 1) { if (k <= 5) gAnime = k; else if (k === 6) gAnime = 2; else if (k === 7) gAnime = 6; else gEnd = true; }
        else if (gActNo === 2) { if (k <= 3) { scrollOn = false; gAnime = k; } else if (k === 4) gAnime = 1; else { scrollOn = true; gEnd = true; } }
        else if (gActNo === 8) { if (k <= 2) { scrollOn = false; gAnime = k; } else gEnd = true; }
        else { if (k <= 7) gAnime = k % 2; else gEnd = true; } // 9: crouch
      }
      if (gEnd) {
        if (win === 6) gHeld = gokuPose; // stays where the hammer came down
        gFrame = 0; gStep = 0;
        gAct = false; gAnime = 0; allCount = 0; gEnd = false;
        if (!bAct) { scrollOn = true; all = false; }
      }
    }
    // Gregory
    if (!bAct) {
      bx = gx + HANARE;
      if (bFrame >= 4) { bFrame = 0; bStep = (bStep + 1) % 2; bAnime = bStep; }
      grePose = bHeld || [GRE[0], 32 * bAnime, 32, 70, bx, GRE_Y];
    } else {
      if (bActNo === 8) { // knocked down: the downward-dodge sheet, frame 6, on the ground
        grePose = [GRE[2], 48 * 6, 48, 32, bx - 42, GRE_Y + 52];
        if (bFrame === 12) audio.se('Z1 強打');
        if (bFrame >= 76) bEnd = true;
      } else {
        const [step, w, h] = DODGE[bActNo];
        const r = step(bFrame);
        if (r === 'end') bEnd = true;
        else {
          if (r.at) { dx = bx + r.at[0]; dy = GRE_Y + r.at[1]; }
          else { dx += r.d[0]; dy = r.y0 != null ? GRE_Y + r.y0 : dy + r.d[1]; }
          if (r.anime != null) bAnime = r.anime;
        }
        grePose = [GRE[bActNo], w * bAnime, w, h, dx, dy];
      }
      if (bEnd) {
        if (win === 6) bHeld = grePose;
        bFrame = 0; bStep = 0;
        bAct = false; bAnime = 0; bEnd = false;
        if (!gAct) { scrollOn = true; all = false; allCount = 0; }
      }
    }
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
    if (grePose) blit(c, grePose[0], grePose[1], 0, grePose[2], grePose[3], grePose[4], grePose[5]);
    if (gokuPose) blit(c, gokuPose[0], gokuPose[1], 0, gokuPose[2], gokuPose[3], gokuPose[4], gokuPose[5]);
    // Gregory's face and card (face down while a card is being played)
    const t = top.getContext('2d');
    t.clearRect(0, 0, 160, 100);
    blit(t, T.face[0], 0, 64 * T.face[1], 64, 64, 4, 16);
    drawCard(t, gre, 88, 2, windowState === 2 || all);
    const h = handCv.getContext('2d');
    h.clearRect(0, 0, handCv.width, handCv.height);
    hand.forEach((cd, k) => drawCard(h, cd, 64 * k, 16, used[k]));
    if (windowState === 1 && !all && Math.floor(performance.now() / 300) % 2) { // the blinking ▼ over the chosen card
      h.fillStyle = '#f83800';
      h.beginPath(); h.moveTo(64 * cursor + 25, 2); h.lineTo(64 * cursor + 39, 2); h.lineTo(64 * cursor + 32, 12); h.fill();
    }
  }

  // 60 frames a second, whatever the display rate; __gt.tick(n) steps it by hand (tests with a hidden page)
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
  window.__gt = { tick, get state() { return { win, windowState, all, allNo, gAct, bAct, gActNo, bActNo, bFrame, used: [...used], gre, cursor }; } };
  const until = (cond) => new Promise((res) => waiters.push(() => cond() && (res(), true)));

  const setMsg = (lines) => { msg.textContent = lines.join('\n'); msg.style.visibility = lines.length ? 'visible' : 'hidden'; };
  let wake = null;
  const wait = () => new Promise((res) => { root.classList.add('tr-wait'); wake = () => { root.classList.remove('tr-wait'); res(); }; }); // (tr-wait: the ▼, src/style.css)
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
    // chk_training: Gregory's card at least as high as yours (or 1 vs your 7, 2 vs your 8)
    const a = gre.a, mine = hand[k].a;
    if (a >= mine || (a === 0 && mine === 6) || (a === 1 && mine === 7)) {
      if (win <= 2) audio.se('Z1 SE111'); else if (win <= 4) audio.se('Z1 SE112'); // (the sixth one is silent)
      win++;
      allNo = win === 6 ? 8 : 0;
    } else {
      audio.se('Z1 SE110');
      allNo = 9;
    }
    used[k] = true;
    gre = newCard(); // create_card 1
    hand[k] = newCard(); // create_card 0 (stays face down until the scene ends)
    all = true;
    windowState = 1;
    await until(() => !all);
    if (win === 6) { result = 'won'; break; }
    if (!used.includes(false)) { result = 'fail'; break; }
  }
  s.var[432] = win;

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
    s.var[41] = 109;
  } else {
    audio.se('Z1 出る');
    s.var[41] = 0;
  }
  cancelAnimationFrame(raf);
  delete window.__gt;
  root.remove();
  return result;
}

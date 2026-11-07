// The Z3 films of the first moves ($btl_progress 2, the Z3 move switch all.rb 59749-60760): in Z1 / Z2 these moves keep the films
// of src/anime.js (with the strips and cut-ins of src/anime_goku_gohan.js BASE), from Z3 on they play these, written out frame by
// frame on src/anime_zfighters.js's stage; f is @battle_anime_frame:
//   18 元気弾 2118 (91873), damage 41          19 超元気弾 2119 (92013), 42         36 魔貫光殺砲 2136 (92693), 41
//   47 魔閃光 2147 (93143), 41                 63 拡散エネルギー波 2163 (93390), 24  64 気円斬 2164 (93544), 41
//   73 繰気弾 2173 (94003), 41                 82 四身の拳 2182 (94436), 23          83 気功砲 2183 (94508), 23
//   84 四身の拳気功砲 2184 (94564), 46         92 超能力 2192 (94737), 25            123 爆発波 2223 (95039), 23
import { audio, img } from './core.js?v=20261108-0722';
import { Duel, STD_Y, CENTER_CHAX, RAY_SPEED } from './anime.js?v=20261108-0722';
import { ZfStage } from './anime_zfighters.js?v=20261108-0722';

const pic = (n) => `Graphics/Pictures/${n}`;
const BLINK = pic('Z3_必殺技_超カメハメ波(球点滅).png'); // effects 235, 259
const GENKI = pic('Z3_必殺技_元気玉(球点滅中).PNG'); // 252
const SPARKLE = pic('Z3_戦闘_必殺技_超元気玉(元気).png'); // the ki gathering: 8×10
const CHARGE = pic('Z3_戦闘_必殺技_超元気玉_溜め.png'); // 253: 246×110 rows
const SUPER_GOKU = { 0: pic('Z3_必殺技_超元気玉(ゴクウ).PNG'), 1: pic('Z3_必殺技_超元気玉(ゴクウ：ボロボロ).png'), 3: pic('Z3_必殺技_超元気玉(ゴクウ：戦闘服).png') };
const BALL = pic('Z3_戦闘_必殺技_エネルギー弾.PNG'); // 209, 211, 223: 128×128
const BIG = pic('Z3_戦闘_必殺技_エネルギー波_大.png'); // 33, 239: 400×92 rows
const HALF = pic('Z3_戦闘_必殺技_エネルギー波_半円.PNG'); // 256
const MASENKO = pic('Z3_必殺技_魔閃光(ゴハン).PNG'), MASENKO_SUIT = pic('Z3_必殺技_魔閃光(ゴハン：戦闘服).png');
const KRILLIN = pic('Z3_必殺技_気円斬(クリリン).png'), DISC = pic('Z3_戦闘_必殺技_気円斬.png'); // 126×30 rows
const YAMCHA = pic('Z3_必殺技_繰気弾(ヤムチャ).png'), SOKI = pic('Z3_必殺技_繰気弾(球点滅中).PNG'); // 261, 262
const TIEN = pic('Z3_必殺技_気功砲(テンシンハン).png'), TIEN_REV = pic('Z3_必殺技_気功砲(テンシンハン)_反転.png');
const FOUR = pic('Z3_戦闘_必殺技_テンシンハン.PNG'); // 263: 96×96 rows
const CUT_ME = pic('Z3_味方カットイン.PNG');
const DEMON = pic('Z3_戦闘_必殺技_背景_魔族系(縦).png'); // back 2: 640×356 every 480
const MKK_CUT = pic('Z3_必殺技_カットイン_魔貫光殺砲(ピッコロ).png'), MKK_POSE = pic('Z3_必殺技_魔貫光殺砲(ピッコロ).png');
const MKK_FIRE = pic('Z3_戦闘_必殺技_魔貫光殺砲(発動).PNG'), MKK_RAY = pic('Z3_戦闘_必殺技_魔貫光殺砲.PNG'); // 254, 255
const RED = { top: pic('Z3_戦闘_必殺技_背景_上(赤).png'), low: pic('Z3_戦闘_必殺技_背景_下(加工)(赤).PNG'),
  tr: pic('Z3_戦闘_必殺技_背景_右上(赤).PNG'), bl: pic('Z3_戦闘_必殺技_背景_左下(赤).PNG') }; // @tec_back_color 1
const IMAGES = [BLINK, GENKI, SPARKLE, CHARGE, ...Object.values(SUPER_GOKU), BALL, BIG, HALF, MASENKO, MASENKO_SUIT, KRILLIN, DISC, YAMCHA, SOKI, TIEN, TIEN_REV,
  FOUR, CUT_ME, DEMON, MKK_CUT, MKK_POSE, MKK_FIRE, MKK_RAY, ...Object.values(RED)];

// skill → film; the move switch before pattern 32: cut @chr_cutin_flag, no @tec_output_back_no, noBars @tec_output_back = false after it
const FILMS = {
  18: { film: 'zbGenki', cut: true, no: 1 }, 19: { film: 'zbSuperGenki', cut: true, no: 2 }, 36: { film: 'zbMakanko', cut: true, no: 3, noBars: true },
  47: { film: 'zbMasenko', cut: true }, 63: { film: 'zbScatter', cut: true }, 64: { film: 'zbKienzan', cut: true }, 73: { film: 'zbSoki', cut: true },
  82: { film: 'zbFour' }, 83: { film: 'zbKikou', cut: true }, 84: { film: 'zbFourKikou', cut: true }, 92: { film: 'zbPsychic', cut: true }, 123: { film: 'zbBlast', cut: true },
};
const OWNER = { 18: 3, 19: 3, 36: 4, 47: 5, 63: 6, 64: 6, 73: 7, 82: 8, 83: 8, 84: 8, 92: 9, 123: 12 };
const AGAIN = { 63: true, 123: true }; // a further target of the move on everyone: no 31 / 32, straight on the defender
const AGAIN_MS = 500;
const ended = {};

const v = (n) => { const s = window.__game && window.__game.state; return (s && s.var && s.var[n]) || 0; };
const sw = (n) => { const s = window.__game && window.__game.state; return !!(s && s.sw && s.sw[n]); };
const cfgOf = (d) => (d.constructor === Duel && d.p && v(40) >= 2 ? FILMS[d.skill] : null);
const seStop = () => audio.seStop();

function stageFor(d) {
  const st = d.st = new ZfStage(d), sc = window.__game && window.__game.scene;
  st.actor = (sc && sc.duel && sc.duel.m && sc.duel.m.id) || OWNER[d.skill];
  st.again = !!AGAIN[d.skill] && performance.now() - (ended[d.skill] || -1e9) < AGAIN_MS;
  d.finished.then(() => { ended[d.skill] = performance.now(); });
  // the damage films of src/anime.js (23, 24, 25) set behind() / effect() themselves: the bars and the cut-in stay through them
  const behind = Duel.prototype.behind, effect = Duel.prototype.effect;
  d.behind = (f) => behind.call(d, (c, t) => { for (const g of st.barList) g(c); for (const g of st.b) g(c); if (f) f(c, t); });
  d.effect = (f) => effect.call(d, (c, t) => { for (const g of st.e) g(c); if (f) f(c, t); st.drawCut(c); });
  d.behind(null); d.effect(null);
  return st;
}
// @tec_back_color 1: the red strips and corners of 2136 in place of the stage's (src/anime_zfighters.js tick)
function redBars(st) {
  const tick = st.tick.bind(st);
  st.tick = () => {
    tick();
    if (!st.bars) return;
    const L = st.barList = [], f = (sheet, sx, w, h, x, y) => L.push((c) => { const e = img(sheet); if (e.ok) c.drawImage(e.im, sx, 0, w, h, x, y, w, h); });
    if (st.no === 3) {
      f(RED.tr, st.corner * 238, 238, 238, 640 - 238, 0);
      f(RED.bl, st.corner * 222, 222, 222, 0, 480 - 222 - 124);
    } else {
      st.redT = ((st.redT || 0) + 8) % 648;
      for (const x of [-st.redT, 648 - st.redT]) { f(RED.top, 0, 648, 110, x, 0); f(RED.low, 0, 648, 114, x, 242); }
    }
  };
}

// ---------- effects (effect_pattern, all.rb 135031): @attackcourse 0 ----------
function ball235(st, x, y) { st.blink(BLINK, 32, x, y); }
function ball252(st, x, y) {
  st.fx((k) => {
    st.front(GENKI, 64 * k.rtype, 0, 64, 64, x, y);
    if (k.rframe >= 4 && k.rtype !== 3) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4) { k.rtype = 0; k.rframe = 0; }
  });
}
function charge253(st, x, y) {
  st.fx((k) => {
    st.front(CHARGE, 0, k.rtype * 110, 246, 110, x, y);
    if (k.rframe >= 20 && k.rtype !== 5) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4 && k.rtype === 5) { k.rtype = 4; k.rframe = 0; }
  });
}
const ballHit = (st, type) => st.fx((k) => st.front(BALL, type * 128, 0, 128, 128, -128 + k.frame * RAY_SPEED, 112)); // 209 (3), 211 (5)
function four263(st) { // 四身の拳: he splits into two, then four, and they fly off one by one (x: CENTER_CHAX + 26 ±; y: STANDARD_CHAY)
  st.fx((k) => {
    const n = k.frame, X = CENTER_CHAX + 26, Y = STD_Y, at = (row, x, y = Y) => st.front(FOUR, 0, 96 * row, 96, 96, x, y);
    if (n <= 15) { at(4, X + 4 * n); at(4, X - 4 * n); } else if (n <= 29) { at(3, X + 60); at(3, X - 60); } else if (n <= 60) {
      at(4, X + 60); at(4, X - 60); at(4, X + 4 * (n - 15)); at(4, X - 4 * (n - 15));
    } else if (n <= 75) { at(4, X + 60); at(4, X - 60); at(4, X + 180); at(4, X - 180); } else if (n <= 110) {
      at(4, X + 60); at(4, X + 180); at(4, X - 180);
      at(6, X - 60 - 2 * (n - 75), Y - 8 * (n - 75));
    } else if (n <= 145) {
      at(4, X + 180); at(4, X - 180);
      at(0, X + 60 + 2 * (n - 111), Y - 8 * (n - 111));
    } else if (n <= 180) {
      at(4, X + 180);
      at(6, X - 180 - 2 * (n - 146), Y - 8 * (n - 146));
    } else if (n <= 215) at(0, X + 180 + 2 * (n - 181), Y - 8 * (n - 181));
  });
}
// the ki flying in from around him (2118 / 2119): six or eight sparks, each starting at random
const DIRS = [[4, 2], [2, 4], [4, 4], [-2, 4], [-4, 4], [-4, 2], [4, 0], [4, -2]];
function sparks(st, cx, cy, n, spdup, f, tameEnd, frames) {
  const max = 40;
  for (let i = 0; i < n; i++) {
    if (frames[i] >= max) frames[i] = 0;
    else if (frames[i] > 0) {
      const [ix, iy] = DIRS[i], gx = ix * spdup + ix * 2 * (max - spdup - 1), gy = iy * spdup + iy * 2 * (max - spdup - 1), t = frames[i];
      const [x, y] = t <= spdup ? [cx - gx + t * ix, cy + gy - t * iy] : [cx - gx + spdup * ix + (t - spdup) * ix * 2, cy + gy - spdup * iy - (t - spdup) * iy * 2];
      st.back(SPARKLE, 0, 0, 8, 10, x, y);
      frames[i]++;
    } else if (tameEnd - f > max && Math.floor(Math.random() * 4) === 0) frames[i] = 1;
  }
}

const swoop0 = Duel.prototype.swoopIn, launch0 = Duel.prototype.launch, rain0 = Duel.prototype.rainDown;
Object.assign(Duel.prototype, {
  * swoopIn() {
    if (!cfgOf(this)) return yield* swoop0.call(this);
    IMAGES.forEach((p) => img(p)); // (loading while the swoop and the launch play)
    const st = stageFor(this);
    if (st.again) return;
    yield* swoop0.call(this);
  },
  * launch() { // 32, from frame 30 the bars and the cut-in
    const cfg = cfgOf(this), st = this.st;
    if (!cfg || !st) return yield* launch0.call(this);
    if (st.again) return;
    st.cutFlag = !!cfg.cut;
    st.no = cfg.no || 0;
    if (this.skill === 36) redBars(st);
    this.se('Z1 必殺技');
    this.pose(this.A, 0, true);
    for (let f = 1; f < 80; f++) {
      this.back.y += 4;
      if (f >= 30) { st.bars = true; if (st.cutFlag) st.cut = true; }
      yield;
    }
    if (cfg.noBars) st.bars = false;
  },
  * rainDown(start) { // src/anime.js run: a further target of 拡散エネルギー波 comes here, without 31 / 32
    if (!cfgOf(this) || this.skill !== 63) return yield* rain0.call(this, start);
    IMAGES.forEach((p) => img(p));
    const st = stageFor(this);
    st.no = 1;
    st.bars = true; st.cut = true; st.cutFlag = true; st.mirror = true;
    return yield* this.zbScatterAgain(st);
  },

  // ---------- 悟空 ----------
  * zbGenki() { // 2118 元気弾: the ki gathers over his raised hands, the ball grows and rises, it comes down on the defender
    const st = this.st, cx = 316, cy = 60, tameEnd = 250, frames = [0, 0, 0, 0, 0, 0];
    let on = 0; // @effect_anime_pattern
    this.se('Z1 気を溜める(元気弾)'); this.se('Z1 ザー');
    this.pose(this.A, 5, true);
    yield;
    for (let f = 1; f <= 320; f++) {
      if (f === tameEnd) this.se('Z1 衝撃波');
      else if (f < tameEnd) { st.back(SPARKLE, 0, 0, 8, 10, cx, cy); sparks(st, cx, cy, 6, 20, f, tameEnd, frames); }
      let d = 12, up = 0;
      if (f >= 60) {
        if (f <= 120) {
          if (f % 4 === 0) on = 235;
          else if (st.ef.frame >= 7) { on = 0; st.ef.frame = 0; }
        } else if (f <= 180) {
          if (f % 6 === 0) on = 252;
          else if (st.ef.frame >= 3) { on = 235; st.ef.frame = 0; }
          if (on === 252) d = 28;
        } else {
          on = 252; d = 28;
          if (f > tameEnd) up = (f - tameEnd) * 2;
        }
      }
      if (on === 235) ball235(st, cx - d, cy - d - up);
      else if (on === 252) ball252(st, cx - d, cy - d - up);
      yield;
    }
    st.fxReset(); this.zfOut(); st.no = 0; // 321
    yield;
    for (let f = 322; f <= 348; f++) { ballHit(st, 3); yield; }
    yield* this.zfHit(41);
    return 'none';
  },
  * zbSuperGenki() { // 2119 超元気弾: 悟空 with his arms up in the picture, the huge ball charging over him, then it comes down
    const st = this.st, cx = 484, cy = 60, tameEnd = 300, frames = [0, 0, 0, 0, 0, 0, 0, 0];
    const look = v(171), sheet = look === 1 || look === 2 ? SUPER_GOKU[1] : look === 3 ? SUPER_GOKU[3] : SUPER_GOKU[0];
    this.se('Z3 気を溜める(超元気玉)');
    this.A.y = -160;
    st.cutFlag = false; // (the cut-in ends with pattern 32)
    yield;
    for (let f = 1; f <= 350; f++) {
      st.back(sheet, 0, 0, 168, 198, 270, 90);
      if (f < tameEnd) sparks(st, cx, cy, 8, 25, f, tameEnd, frames);
      if (f >= 60) charge253(st, 640 - 246, 0);
      yield;
    }
    seStop(); this.se('Z1 衝撃波'); // 351
    st.fxReset(); this.zfOut(); st.no = 0; st.small = true;
    yield;
    for (let f = 352; f <= 378; f++) { ballHit(st, 5); yield; }
    yield* this.zfHit(42);
    return 'none';
  },

  // ---------- 比克 ----------
  * zbMakanko() { // 2136 魔貫光殺砲: the shaking cut-in and the flash, his pose, the drill beam
    const st = this.st;
    this.se('Z1 気を溜める3');
    this.A.y = -160;
    st.cutFlag = false;
    yield;
    for (let f = 1; f <= 130; f++) {
      const k = Math.floor(Math.random() * 9), sx = [-4, 0, 4, -4, 0, 4, -4, 0, 4][k], sy = [4, 4, 4, 0, 0, 0, -4, -4, -4][k]; // pic_shake_cal 4
      if (f >= 116) st.white(378);
      st.back(MKK_CUT, 0, 0, 648, 64, -4 + sx, 146 + sy);
      if (f >= 118) st.white(378);
      if (f === 130) { seStop(); st.bars = true; }
      yield;
    }
    for (let f = 131; f <= 260; f++) {
      st.back(MKK_POSE, 0, 0, 124, 172, 260, 80);
      if (f === 160) this.se('Z1 エネルギー波3');
      if (f >= 160) {
        st.fx((k) => {
          st.front(MKK_FIRE, k.rtype * 166, 0, 166, 176, 640 - 246 - 16, 180);
          if (k.rframe >= 2) { k.rtype = k.rtype === 1 ? 0 : 1; k.rframe = 0; }
        });
      }
      yield;
    }
    this.se('Z1 衝撃波'); // 261
    st.fxReset(); st.cut = true; st.cutFlag = true; this.zfOut(); st.no = 0;
    yield;
    for (let f = 262; f <= 287; f++) { st.fx((k) => st.front(MKK_RAY, 0, 0, 400, 64, -400 + k.frame * RAY_SPEED, 134)); yield; }
    yield* this.zfHit(41);
    return 'none';
  },

  // ---------- 悟飯 ----------
  * zbMasenko() { // 2147 魔閃光: the aura, his picture with the ball at his hands, the half circle of the wave pushing him left
    const st = this.st;
    this.se('Z3 変身');
    this.pose(this.A, 2, true);
    yield;
    for (let f = 1; f <= 128; f++) { st.aura(228, 88); yield; }
    const sheet = v(172) === 1 ? MASENKO_SUIT : MASENKO;
    for (let f = 129; f <= 219; f++) {
      if (f === 129) seStop();
      if (!sw(445)) {
        this.A.y = -160;
        let rx = 326, ry = 196, mx = 228;
        if (f >= 146 && f <= 149) { rx += 6 * (f - 145); ry -= 6 * (f - 145); }
        if (f >= 150) {
          rx = 336; ry = 112;
          if (f >= 170) {
            rx -= 12 * (f - 170); mx -= 12 * (f - 170);
            if (mx < 26) { mx = 26; rx = mx + 98; }
          }
        }
        st.back(sheet, 0, 0, 132, 112, mx, 130);
        if (f === 146) this.se('DB3 エネルギー波2');
        if (f >= 150) st.fx((k) => { const n = k.frame * RAY_SPEED; st.front(HALF, 0, 0, n, 128, rx, ry); });
        else if (f >= 145) ball235(st, rx, ry);
      } else { // (悟飯 with short hair: his pose and the big wave)
        this.pose(this.A, 3, true);
        if (f === 129) this.se('DB3 エネルギー波2');
        st.fx((k) => st.front(BIG, 0, 92, 144 + k.frame * RAY_SPEED, 92, 326, 120));
      }
      yield;
    }
    st.fxReset(); this.zfOut(); // 220
    yield;
    for (let f = 221; f <= 246; f++) { st.fx((k) => st.front(BIG, 0, 0, 400, 92, -400 + k.frame * RAY_SPEED, 124)); yield; }
    yield* this.zfHit(41);
    return 'none';
  },

  // ---------- 克林 ----------
  * zbScatter() { // 2163 拡散エネルギー波: the ball goes up, two flashes, it falls apart into four and they rain on the defender
    const st = this.st;
    if (st.again) return yield* this.zbScatterAgain(st);
    this.se('Z3 変身');
    yield;
    for (let f = 1; f <= 89; f++) { st.aura(228, 88); yield; }
    seStop(); this.se('Z3 エネルギー波'); // 90
    this.pose(this.A, 4, true);
    st.no = 2;
    ball252(st, 316, 102);
    yield;
    for (let f = 91; f <= 110; f++) {
      if (f < 94) this.vel(2, 2, 0, 0); else if (f < 97) this.vel(-2, -2, 0, 0);
      ball252(st, 316 + 8 * (f - 91), 102 - 8 * (f - 91));
      yield;
    }
    this.se('Z3 拡散エネルギー波拡散'); // 111
    yield;
    for (let f = 112; f <= 138; f++) { if ((f >= 112 && f <= 116) || (f >= 124 && f <= 128)) st.white(356); yield; }
    this.se('Z1 ザー'); // 139
    this.A.y = -160;
    st.no = 1;
    yield;
    const xs = [304, 304, 304, 304];
    let by = 0;
    for (let f = 140; f <= 210; f++) {
      const h = by >= 292 ? 0 : by >= 260 ? 292 - by : 32;
      if (h > 0) for (const x of xs) st.back(BLINK, 0, 0, 32, h, x, by);
      if (f < 150) by += 2; else if (f < 160) by += 4; else if (f < 170) by += 8; else if (f < 180) by += 16;
      const far = f < 160 ? 4 : 6;
      xs[0] += 2; xs[1] += far; xs[2] -= 2; xs[3] -= far;
      yield;
    }
    for (let f = 211; f <= 214; f++) yield;
    st.fxReset(); this.zfOut(); // 215
    yield;
    for (let f = 216; f <= 234; f++) { st.fx((k) => st.front(BLINK, 0, 0, 32, 32, 354, Math.floor((k.frame * RAY_SPEED) / 2))); yield; }
    return 'down'; // damage 24
  },
  * zbScatterAgain(st) { // (@all_attack_count >= 2)
    this.se('Z1 ザー');
    this.zfOut();
    yield;
    for (let f = 1; f <= 19; f++) { st.fx((k) => st.front(BLINK, 0, 0, 32, 32, 354, Math.floor((k.frame * RAY_SPEED) / 2))); yield; }
    return 'down';
  },
  * zbKienzan() { // 2164 気円斬: his picture, the disc growing and circling over his hand, up and away, across the defender
    const st = this.st, X = [0, 4, 7, 9, 10, 9, 7, 4, 0, -4, -7, -9, -10, -9, -7, -4], Y = [0, 1, 3, 6, 10, 14, 17, 19, 20, 19, 17, 14, 10, 6, 3, 1];
    this.se('Z3 変身');
    yield;
    for (let f = 1; f <= 128; f++) { st.aura(228, 88); yield; }
    for (let f = 129; f <= 249; f++) {
      st.no = 1;
      if (f === 129) seStop();
      this.A.y = -160;
      st.back(KRILLIN, 0, 0, 116, 144, 262, 130);
      const row = f >= 175 ? 4 : f >= 145 ? 1 : 0, n = f - 160;
      const turn = n >= 10 && n <= 24 ? n - 9 : n >= 26 && n <= 40 ? n - 25 : 0;
      const x = 220 + 6 * X[turn];
      let y = 80 - 2 * Y[turn];
      if (n >= 50) { if (n === 50) this.se('Z3 エネルギー波'); y = 80 - 8 * (n - 50); }
      st.back(DISC, 0, 30 * row, 126, 30, x, y);
      yield;
    }
    st.fxReset(); st.no = 0; this.zfOut(); // 250
    yield;
    for (let f = 251; f <= 281; f++) { st.fx((k) => st.front(DISC, 0, 120, 126, 30, -192 + k.frame * RAY_SPEED, 160)); yield; }
    yield* this.zfHit(41);
    return 'none';
  },

  // ---------- 雅木茶 ----------
  * zbSoki() { // 2173 繰気弾: his picture, the ball lights up over his finger, sways left and right, shoots up, then comes in low
    const st = this.st, SWAY = [0, 4, 8, 6, -4, -8, -10];
    const STEP = { 20: 1, 21: 2, 22: 3, 23: 3, 24: 2, 25: 1, 27: 4, 28: 5, 29: 6, 30: 6, 31: 5, 32: 4, 34: 1, 35: 2, 36: 3, 37: 3, 38: 2, 39: 1,
      41: 4, 42: 5, 43: 6, 44: 6, 45: 5, 46: 4, 48: 1, 49: 2, 50: 3, 51: 3, 52: 2, 53: 1 };
    this.se('Z3 変身');
    yield;
    for (let f = 1; f <= 128; f++) { st.aura(228, 88); yield; }
    for (let f = 129; f <= 259; f++) {
      if (f === 129) seStop();
      this.A.y = -160;
      st.back(YAMCHA, 0, 0, 182, 124, 228, 118);
      if (f >= 140) {
        const n = f - 175;
        let ry = 66 + SWAY[STEP[n] || 0];
        if (n >= 54) { if (n === 54) this.se('Z3 エネルギー波'); ry -= 6 * (n - 54); }
        if (f < 175) {
          const k = f === 140 ? 0 : f < 157 ? 1 : f < 173 ? 2 : 3;
          st.ef.rtype = k;
          st.fx(() => st.front(SOKI, 64 * k, 0, 64, 64, 346, ry));
        } else ball252(st, 346, ry);
      }
      yield;
    }
    st.fxReset(); st.no = 0; this.zfOut(); this.se('Z1 エネルギー波'); // 260
    yield;
    for (let f = 261; f <= 297; f++) { st.fx((k) => st.front(SOKI, 64 * 5, 0, 64, 64, -192 + k.frame * RAY_SPEED, 136)); yield; }
    yield* this.zfHit(41);
    return 'none';
  },

  // ---------- 天津飯 ----------
  * zbFour() { // 2182 四身の拳: he splits in four, the four rows of his eyes slide in, four balls converge on the defender
    const st = this.st;
    this.pose(this.A, 3, true);
    for (let f = 0; f <= 24; f++) yield;
    for (let f = 25; f <= 255; f++) {
      this.A.y = -120;
      if (f === 25) this.se('Z3 四身の拳');
      four263(st);
      yield;
    }
    st.bars = false; this.pose(this.A, 2, true); st.fxReset(); // 256
    yield;
    for (let f = 257; f <= 340; f++) {
      const row = (k, y) => {
        const s = 257 + 20 * k, dir = k % 2 ? 1 : -1;
        if (f <= s) return;
        st.back(CUT_ME, 0, 64 * 5, 640, 64, f <= s + 20 ? dir * (640 - 32 * (f - s)) : 0, y);
      };
      row(0, 26); row(1, 106); row(2, 186); row(3, 266);
      yield;
    }
    this.zfOut(); // 341
    for (let f = 341; f <= 350; f++) yield;
    for (let f = 351; f <= 381; f++) {
      st.fx((k) => {
        const n = k.frame, x = -128 + n * RAY_SPEED, Y = STD_Y - 20;
        for (const y of [Y - 90 + n * 3, Y - 30 + n, Y + 30 - n, Y + 90 - n * 3]) st.front(BALL, 2 * 128, 0, 128, 128, x, y);
      });
      yield;
    }
    return 'explode'; // damage 23
  },
  * zbKikou() { // 2183 気功砲: his picture with two flashes, the column of the shock on the defender
    const st = this.st;
    this.se('Z3 変身');
    yield;
    for (let f = 1; f <= 128; f++) { st.aura(228, 88); if (f === 128) st.no = 2; yield; }
    for (let f = 129; f <= 229; f++) {
      if (f === 129) seStop();
      this.A.y = -160;
      st.back(TIEN, 0, 0, 210, 140, 228, 118);
      if ((f >= 170 && f <= 173) || (f >= 210 && f <= 213)) st.white(296);
      if (f === 170 || f === 210) this.se('Z3 拡散エネルギー波拡散');
      yield;
    }
    st.bars = false; st.fxReset(); st.no = 0; this.zfOut(); this.se('Z1 ザー'); // 230
    for (let f = 230; f <= 240; f++) yield;
    for (let f = 241; f <= 290; f++) { st.shock(); yield; }
    return 'explode'; // damage 23
  },
  * zbFourKikou() { // 2184 四身の拳気功砲: he splits in four, four 気功砲 pictures slide in, four flashes, the column
    const st = this.st;
    this.se('Z3 変身');
    this.pose(this.A, 3, true);
    yield;
    for (let f = 1; f <= 128; f++) { st.aura(238, 88); if (f === 128) seStop(); yield; }
    for (let f = 129; f <= 138; f++) yield;
    for (let f = 139; f <= 369; f++) {
      this.A.y = -120;
      if (f === 139) this.se('Z3 四身の拳');
      four263(st);
      yield;
    }
    st.bars = false; st.cutFlag = false; // 370
    for (let f = 370; f <= 489; f++) {
      this.A.y = -160;
      const n = f - 370, row = (k, sheet, y, left) => {
        const s = 15 * k;
        if (n < s + (k ? 1 : 0)) return;
        const x = n <= s + 15 ? (left ? -210 + 14 * (n - s) : 640 - 14 * (n - s)) : (left ? 0 : 430);
        st.back(sheet, 0, 0, 210, 140, x, y);
      };
      row(0, TIEN, 28, true); row(1, TIEN_REV, 28, false); row(2, TIEN, 188, true); row(3, TIEN_REV, 188, false);
      if ((f >= 450 && f <= 453) || (f >= 460 && f <= 463) || (f >= 470 && f <= 473) || (f >= 480 && f <= 483)) st.white(356);
      if (f === 450 || f === 460 || f === 470 || f === 480) this.se('Z3 拡散エネルギー波拡散');
      yield;
    }
    st.fxReset(); st.no = 2; this.zfOut(); this.se('Z1 ザー'); this.se('Z1 ゴー'); // 490
    yield;
    for (let f = 491; f <= 540; f++) { st.kikou(); yield; }
    if (!this.hit) { yield* this.zfDodge(); return 'none'; }
    yield* this.agZd(false); // damage 46
    return 'none';
  },

  // ---------- 餃子 ----------
  * zbPsychic() { // 2192 超能力: he strains, the side bars come up on the defender
    const st = this.st;
    this.se('Z1 気を溜める');
    this.pose(this.A, 2, true);
    for (let f = 0; f <= 108; f++) yield;
    seStop(); st.fxReset(); // 109
    for (let f = 109; f <= 118; f++) yield;
    this.zfOut(); st.no = 1; // 119
    for (let f = 119; f <= 146; f++) yield;
    return 'psychic'; // damage 25
  },

  // ---------- 貝吉塔 ----------
  * zbBlast() { // 2223 爆発波: the blue aura, his arms out over the demon background, the shock on the defender
    const st = this.st;
    if (st.again) { // (@all_attack_count >= 2)
      st.bars = false; st.cut = true; st.cutFlag = true; st.mirror = true;
      this.se('Z1 エネルギー波');
      this.zfOut();
      yield;
      for (let f = 1; f <= 60; f++) { st.shock(); yield; }
      return 'explode';
    }
    this.se('Z3 変身');
    this.pose(this.A, 0, true);
    yield;
    for (let f = 1; f <= 127; f++) { st.aura(228, 88, 3); yield; }
    st.bars = false; st.cutFlag = false; this.A.x += 16; seStop(); this.se('Z1 エネルギー波'); // 128
    this.pose(this.A, 2, true);
    yield;
    for (let f = 129; f <= 208; f++) { st.back(DEMON, 0, st.ba.type * 480, 640, 356, 0, 0); st.backStep(4, 2); yield; }
    st.fxReset(); // 209
    for (let f = 209; f <= 219; f++) yield;
    st.cut = true; st.cutFlag = true; this.zfOut(); // 220
    yield;
    for (let f = 221; f <= 281; f++) { st.shock(); yield; }
    return 'explode'; // damage 23
  },
});

// the first films: from Z3 on these moves go to the films above
for (const name of ['genkidama', 'makankosappo', 'masenko', 'scatterWave', 'kienzan', 'sokidan', 'shishinFist', 'kikouhou', 'shishinKikouhou', 'psychic', 'vegetaBlast']) {
  const film0 = Duel.prototype[name];
  Duel.prototype[name] = function* film(...a) {
    const cfg = cfgOf(this);
    if (cfg && this.st) return yield* this[cfg.film]();
    return yield* film0.apply(this, a);
  };
}
export const Z3B_SOUNDS = ['Z3 変身', 'DB3 エネルギー波2', 'Z3 エネルギー波', 'Z3 四身の拳', 'Z3 拡散エネルギー波拡散', 'Z1 ザー', 'Z1 ゴー', 'Z1 衝撃波', 'Z3 気を溜める(超元気玉)',
  'Z1 気を溜める(元気弾)', 'Z1 気を溜める', 'Z1 気を溜める3', 'Z1 エネルギー波', 'Z1 エネルギー波3', 'Z1 必殺技'];

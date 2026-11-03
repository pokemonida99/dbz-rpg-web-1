// The movie and ZG enemies' move films (docs/anim-e-plan.md aen3): enemies 142-182 — ボージャック一味, ブロリー, アラレ,
// オゾット, キンカーン・アービー・グーレ, the ghosts of the 時之間 (ターレス, スラッグ, クウラ, フリーザ), ゴッドゴーガン,
// ゴーストライチー, ハッチヒャック, タード一味 and ガーリック(Z3). All of them are enemies of the Z3 move switch
// (enemy id ≥ 101), attack pattern = skill id + 10; most of their waves are the enemies' shared films
// (src/anime_foes_common.js), the rest are their own patterns, ported here frame by frame on the same stage (FeStage).
import { audio, rand } from './core.js?v=20261104-0742';
import { Duel, spark, STD_Y, CENTER_CHAX, CENTER_ENEX } from './anime.js?v=20261104-0742';
import { feRegister, feFilms, foeId, feFallback } from './anime_foes_common.js?v=20261104-0742';
import { registerZ3, party, heal } from './z3.js?v=20261104-0742';
import { applyLevel } from './party.js?v=20261104-0742';

const pic = (n) => `Graphics/Pictures/${n}`;
const STD_ENEX = 602, STD_ENEY = STD_Y;
// pictures more than one of these films use
const SPARK = pic('戦闘アニメ.PNG'); // the after-image (0,48 64×64), the hit sparks
const SWORD = pic('Z3_戦闘_必殺技_剣攻撃(左右反転).PNG'); // effect 267 (an enemy): frames of 160×96
const GENKI = { 0: pic('Z3_必殺技_元気玉(球点滅中).PNG'), 1: pic('Z3_必殺技_元気玉(球点滅中)(緑).PNG'),
  3: pic('Z3_必殺技_元気玉(球点滅中)(青).PNG') }; // effects 252 / 262: 4 frames of 64
const HALF = { 0: pic('Z3_戦闘_必殺技_エネルギー波_半円.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_半円(緑).PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'), 9: pic('Z3_戦闘_必殺技_エネルギー波_半円(紫).PNG') }; // effects 256 / 265: 700×128 ×2
const BALL4 = { 0: pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー弾4(緑).PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'), 4: pic('Z3_戦闘_必殺技_エネルギー弾4(桃).PNG') }; // effects 206 / 207 / 293 / 266: 190×126 ×2
const BEAM_BIG_BLUE = pic('ZG_必殺技_光線_大(青).PNG'); // 316×158

// ---------- the shared films (all.rb 65679-65908) ----------
feRegister({
  // 2431 (敵汎用)エネルギー波
  487: 'feWave', 492: 'feWave', 497: 'feWave', 502: 'feWave', 508: 'feWave', 514: 'feWave', 519: 'feWave', 521: 'feWave',
  526: 'feWave', 542: 'feWave', 550: 'feWave', 552: 'feWave', 555: 'feWave', 557: 'feWave', 559: 'feWave', 561: 'feWave',
  564: 'feWave', 567: 'feWave', 571: 'feWave', 579: 'feWave', 591: 'feWave', 595: 'feWave', 599: 'feWave', 603: 'feWave',
  // 2494 連続エネルギー波
  488: 'feWaves', 493: 'feWaves', 498: 'feWaves', 503: 'feWaves', 509: 'feWaves', 515: 'feWaves', 522: 'feWaves', 527: 'feWaves',
  543: 'feWaves', 562: 'feWaves', 568: 'feWaves', 572: 'feWaves', 580: 'feWaves', 592: 'feWaves', 596: 'feWaves', 600: 'feWaves',
  604: 'feWaves', 327: 'feWaves',
  // 2498 爆発波
  529: 'feBlast', 563: 'feBlast', 576: 'feBlast', 581: 'feBlast',
  // 2499 強力エネルギー波
  489: 'feBigWave', 494: 'feBigWave', 499: 'feBigWave', 504: 'feBigWave', 510: 'feBigWave', 516: 'feBigWave', 523: 'feBigWave',
  528: 'feBigWave', 544: 'feBigWave', 573: 'feBigWave', 582: 'feBigWave', 593: 'feBigWave', 597: 'feBigWave', 601: 'feBigWave',
  605: 'feBigWave',
  // 2493 フリーザカッター
  566: 'feCutter', 574: 'feCutter',
});

// ---------- ボージャック一味 (142-147) ----------
// ボージャック一味's own moves (the Z3 move switch, all.rb 60929 / 66244-66345):
//   500 刀攻撃(ゴクア) 510 → 2272 (95837), damage 22        495 ギャラテクティックタイラント 505 → 2595 (127856), 41
//   496 ギャラクティックバスター 506 → 2596 (127965), 42    501 ギャラテクアタック 511 → 2601 (128047), 71
//   505 スカイザッパー 515 → 2605 (128151), 41             512 ギャラクティッククラッシュ 522 → 2612 (128306), 41
//   518 合体超能力 528 → 2618 (128415), 22
const BUSTER = pic('Z3_必殺技_ギャラクティックバスター(ボージャック).png'); // 2596's close-up, 280×260
const BLINK = { 0: pic('Z3_必殺技_超カメハメ波(球点滅).png'), 1: pic('Z3_必殺技_超カメハメ波(球点滅)(緑).png'),
  3: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'), 4: pic('Z3_必殺技_超カメハメ波(球点滅)(赤).png') }; // effect 235: 5 frames of 32
const BIGBANG = { 0: pic('Z3_必殺技_ビッグバンアタック発動_反転.PNG'), 1: pic('Z3_必殺技_ビッグバンアタック発動(緑)_反転.PNG'),
  3: pic('Z3_必殺技_ビッグバンアタック発動(青)_反転.PNG') }; // effect 264 (an enemy): 2 frames of 302×200
const SCATTER = { 0: pic('Z3_戦闘_必殺技_拡散エネルギー波.png'), 3: pic('Z3_戦闘_必殺技_拡散エネルギー波_青_敵.png'),
  4: pic('Z3_戦闘_必殺技_拡散エネルギー波_赤_敵.png') }; // effects 231 / 232: 400×112 ×2
const ZANGYA = pic('Z3_戦闘_敵_赞佳.png'), BIDO = pic('Z3_戦闘_敵_比度.png'); // 2618: the other two of the three (Z3_戦闘_敵_ザンギャ / ビドー)

feFilms({
  aen3Sword: { pics: () => [SWORD] },
  aen3Tyrant: { cut: true, pics: () => [GENKI[1], SPARK] },
  aen3Buster: { cut: true, pics: () => [BUSTER, BLINK[1], BIGBANG[1], HALF[1]] },
  aen3GalacticAttack: { cut: true },
  aen3SkyZapper: { cut: true, small: true, pics: () => [SPARK, SCATTER[3]] },
  aen3GalacticCrush: { cut: true, small: true, pics: () => [SPARK, BLINK[3]] },
  aen3Psychic3: { cut: true, small: true, pics: () => [ZANGYA, BIDO, SPARK] },
});
feRegister({ 500: 'aen3Sword', 495: 'aen3Tyrant', 496: 'aen3Buster', 501: 'aen3GalacticAttack', 505: 'aen3SkyZapper',
  512: 'aen3GalacticCrush', 518: 'aen3Psychic3' });

// 2618's punches and kicks (frames 291-398): for each of the 12 frames of a round, ザンギャ's row and steps out, ビドー's
// row and steps out (24 / 12 px a step) and the sound; the odd rounds she hits him (rows 2 / 3), the even ones he hits her
const ROUND = [
  [[16, 1, 0, 0], [16, 2, 0, 0], [16, 3, 0, 0], [16, 4, 0, 0], [16, 4, 16, 1], [16, 4, 16, 2], [16, 2, 16, 3], [2, 0, 16, 4, 'ZG 打撃1'],
    [2, 0, 16, 4], [2, 0, 16, 4], [2, 0, 16, 2], [2, 0, 3, 0, 'ZG 打撃5']],
  [[16, 1, 3, 0], [16, 2, 3, 0], [16, 3, 3, 0], [16, 4, 3, 0], [16, 4, 16, 1], [16, 4, 16, 2], [16, 2, 16, 3], [4, 0, 16, 4, 'Z1 打撃'],
    [4, 0, 16, 4], [4, 0, 16, 4], [4, 0, 16, 2], [4, 0, 1, 0, 'ZG 打撃3']],
];

Object.assign(Duel.prototype, {
  * aen3Sword() { // 2272 剣攻撃 (an enemy: ゴクア's sword, row 4): one slash (effect 267), the cut; damage 22
    const z = this.feStage(), A = this.A, G = this.G;
    for (let f = 0; f <= 76; f++) {
      let rx = 0, ry = 0;
      if (f === 0) {
        z.se('Z3 剣攻撃');
        if (z.id === 144) z.pose(4); else { z.pose(2); G.x -= 14; A.x += 14; }
        z.color = 0;
      } else if (f <= 40) { z.efp = 267; rx = 228; ry = 134; } else if (f === 41) z.fxReset();
      else if (f === 45) z.displayOut();
      else if (f === 76) break;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(22);
  },

  * aen3Tyrant() { // 2595 ギャラテクティックタイラント(ボージャック全力): the green aura, he flies off, comes back, punches, throws, the ball
    const z = this.feStage(), A = this.A, G = this.G;
    const sp = (n, on) => { A.sp = on; this.pose(A, n, on); };
    for (let f = 0; f <= 391; f++) {
      let rx = 214, ry = 120;
      z.color = 1; // (set every frame before the case: the aura and the ball are green)
      if (f === 0) { z.se('Z3 変身'); sp(5, true); } else if (f <= 89) z.backPattern(201, 248, 88);
      else if (f === 90) { z.seStop(); z.se('Z1 飛ぶ'); sp(4, true); } else if (f <= 119) z.ax = 16;
      else if (f === 126) { z.ax = 0; z.displayOut(); A.x = STD_ENEX; A.y = STD_Y; } else if (f >= 127 && f <= 133) z.ax = 16;
      else if (f >= 134 && f <= 140) { z.ax = 16; sp(16, false); } else if (f >= 141 && f <= 147) { z.ax = 16; sp(1, false); } else if (f >= 148 && f <= 150) {
        if (f === 148) { z.se('Z1 強打'); z.fxReset(); }
        z.ax = 0; z.ay = 0; z.gx = -16;
        z.gpose(16);
        z.efp = 121;
      } else if (f >= 151 && f <= 153) z.gx = 16;
      else if (f === 154) { z.gx = 0; sp(3, true); z.efp = 0; z.se('Z1 ゴー'); } else if (f >= 155 && f <= 164) { sp(3, A.sp); z.gx = 8; } else if (f >= 165 && f <= 174) { sp(6, A.sp); z.gx = -8; } else if (f >= 175 && f <= 200) {
        sp(3, A.sp); z.gx = -16;
        if (f === 175) { z.seStop(); z.se('Z1 吹っ飛ぶ'); }
        z.gpose(17);
      } else if (f >= 201 && f <= 230) {
        if (f === 201) z.se('Z1 飛ぶ');
        z.ax = 24;
        sp(4, A.sp);
      } else if (f === 249) { z.ax = 0; z.displayOut(); G.x = STD_ENEX + 96; A.x = STD_ENEX + 96; A.y = STD_Y; z.gx = -16; } else if (f >= 260 && f <= 276) {
        z.ax = 24;
        if (f === 276) { z.ax = 0; z.gx = 0; z.gpose(16); sp(3, A.sp); z.se('ZG 打撃5'); }
      } else if (f >= 300 && f <= 390) {
        sp(1, A.sp);
        if (f === 300) z.se('Z1 気を溜める');
        z.efp = 252; rx = 336 - 88; ry = 154 - 32;
      } else if (f === 391) { z.gx = 0; A.y = -200; break; }
      yield* z.out(rx, ry);
    }
    return yield* z.damage(41);
  },

  * aen3Buster() { // 2596 ギャラクティックバスター: the green aura, the close-up with the ball, the blast, the half-circle wave
    const z = this.feStage(), A = this.A;
    for (let f = 0; f <= 337; f++) {
      let rx = -52, ry = 208;
      if (f === 0) { z.se('Z3 変身'); z.pose(0); z.color = 1; } else if (f <= 128) {
        z.backPattern(201, 248, 88);
        if (f === 128) { z.tecNo = 2; z.cut = false; }
      } else if (f <= 300) {
        if (f === 129) z.seStop();
        A.y = -160;
        let bx = 140, by = 62;
        if (f >= 231 && f <= 233) { bx += 2; by -= 2; } else if (f === 234) { bx += 4; by -= 4; } else if (f === 235) { bx += 2; by -= 2; }
        z.back(BUSTER, 0, 0, 280, 260, bx, by);
        if (f >= 140 && f <= 230) {
          if (f === 140) z.se('DB3 気を溜める2');
          rx = 196; ry = 250;
          z.efp = 235;
        } else if (f === 231) { z.se('Z1 エネルギー波'); z.se('Z1 ゴー'); z.rt = 0; z.rf = 0; z.efp = 264; }
      } else if (f === 301) { z.cut = true; z.fxReset(); z.tecNo = 0; z.displayOut(); } else if (f >= 311 && f <= 336) { ry = 112; z.efp = 265; } else if (f === 337) break;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(42);
  },

  * aen3GalacticAttack() { // 2601 ギャラテクアタック(ゴクア): the aura, he flies off, comes back with blows, throws the member, dives with the sword
    const z = this.feStage(), A = this.A, G = this.G;
    const sp = (n, on) => { A.sp = on; this.pose(A, n, on); };
    for (let f = 0; f <= 321; f++) {
      if (f === 0) { z.se('Z3 変身'); sp(0, true); z.color = 3; } else if (f <= 128) z.backPattern(201, 248, 88);
      else if (f === 129) { sp(0, true); z.color = 3; z.seStop(); z.se('Z1 飛ぶ'); } else if (f >= 131 && f <= 171) A.x -= 24;
      else if (f === 172) { z.ax = 0; G.x = CENTER_CHAX; G.y = STD_Y; A.x = STD_ENEX; A.y = STD_Y; } else if (f >= 173 && f <= 185) z.ax = 24;
      else if (f === 186) { z.ax = 0; sp(1, false); z.gpose(16); z.efp = 0; z.se('Z1 打撃'); } else if (f === 190) { sp(4, A.sp); z.se('Z1 打撃'); } else if (f === 194) { sp(3, A.sp); z.se('Z1 打撃'); } else if (f === 198) { sp(2, A.sp); z.se('Z1 打撃'); } else if (f === 206) { sp(2, true); z.se('ZG 打撃1'); z.gx = 8; } else if (f >= 208 && f <= 216) { sp(16, false); A.x += 2; } else if (f === 217) {
        z.ax = 0; A.x -= 48; z.gx = -16;
        sp(2, true);
        z.se('ZG 打撃4');
        z.gpose(17);
      } else if (f >= 250 && f <= 269) {
        if (f === 250) z.se('Z1 飛ぶ');
        sp(16, false);
        A.y -= 24;
      } else if (f === 280) { z.gx = 0; z.tecNo = 1; z.displayOut(); A.x = CENTER_ENEX - 16; A.y = -200; sp(3, true); } else if (f >= 281 && f <= 320) {
        A.y += 16;
        if (f === 295) { z.se('DB3 刀'); sp(4, A.sp); }
      } else if (f === 321) { A.y = -200; break; }
      yield* z.out();
    }
    return yield* z.damage(71);
  },

  * aen3SkyZapper() { // 2605 スカイザッパー(ザンギャ): the aura, she vanishes, a flurry of blows, a kick down, the scattering wave
    const z = this.feStage(), A = this.A, G = this.G;
    const sp = (n, on) => { A.sp = on; this.pose(A, n, on); };
    const S0 = 218, GAP = 8;
    for (let f = 0; f <= 437; f++) {
      const rx = 270, ry = 100;
      if (f === 0) { z.se('Z3 変身'); sp(0, true); z.color = 3; } else if (f <= 128) z.backPattern(201, 264, 88);
      else if (f === 129) { z.seStop(); z.se('Z1 高速移動'); A.y = -120; } else if (f <= 168) { if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, A.x + 44, 144); } else if (f === 169) { G.x = CENTER_CHAX; G.y = STD_Y; } else if (f <= 208) { if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, A.x + 48, 144); } else if (f === 209) { A.x = CENTER_ENEX - 32; A.y = STD_Y; } else if (f >= 218 && f <= 310) {
        A.sp = false;
        z.gpose(16);
        const p = f - S0, k = p / GAP;
        if (Number.isInteger(k) && k <= 11) { sp([3, 2, 4, 1][k % 4], false); z.se('Z1 打撃'); z.gx = -8; } else if (p % GAP === 2 && p <= 11 * GAP + 2) z.gx = 8;
        else if (p % GAP === 4 && p <= 11 * GAP + 4) z.gx = 0;
      } else if (f === 311) { z.se('Z1 飛ぶ'); sp(16, A.sp); A.y -= 8; A.x += 16; } else if (f >= 312 && f <= 321) { A.y -= 8; A.x += 16; } else if (f >= 332 && f <= 336) {
        A.y += 16; A.x -= 32;
        if (f === 333) { z.se('Z1 強打'); sp(4, A.sp); } else if (f === 336) { z.gx = -16; z.gpose(17); }
      } else if (f === 360) { z.fxReset(); sp(3, true); z.se('Z1 エネルギー波2'); z.efp = 231; } else if (f === 399) z.fxReset();
      else if (f === 409) { z.gx = 0; z.gpose(0); z.displayOut(); } else if (f >= 410 && f <= 436) z.efp = 232;
      else if (f === 437) break;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(41);
  },

  * aen3GalacticCrush() { // 2612 ギャラクティッククラッシュ(ビドー): he vanishes, grabs the member, a knee, the aura and the big wave
    const z = this.feStage(), A = this.A, G = this.G;
    const sp = (n, on) => { A.sp = on; this.pose(A, n, on); };
    for (let f = 0; f <= 477; f++) {
      let rx = 128, ry = 92;
      if (f === 0) { z.se('Z1 高速移動'); A.y = -120; } else if (f <= 38) { if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, A.x + 24, 144); } else if (f === 39) { G.x = CENTER_CHAX; G.y = STD_Y; } else if (f <= 78) { if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, A.x + 40, 144); } else if (f === 79) { A.x = CENTER_ENEX - 20; A.y = STD_Y; } else if (f === 100) {
        sp(5, true); z.se('Z1 強打'); z.gpose(16); A.x -= 16; z.gy = -16;
      } else if (f >= 101 && f <= 198) {
        z.gy = 0;
        if (f % 4 === 0) z.gx = 4; else if (f % 2 === 0) z.gx = -4;
      } else if (f === 199) { z.gx = 0; z.gy = 2; A.x += 16; z.se('Z1 飛ぶ'); sp(16, false); } else if (f >= 200 && f <= 212) {
        if (f === 206) z.gy = 0;
        A.x += 16;
      } else if (f >= 232 && f <= 238) {
        A.x -= 32;
        if (f === 235) sp(6, true);
        if (f === 238) { z.se('ZG 打撃4'); z.gx = -24; z.gpose(17); }
      } else if (f === 270) { z.se('Z3 変身'); sp(2, true); z.color = 3; } else if (f >= 271 && f <= 398) {
        z.backPattern(201, 248, 88);
        z.efp = 235; rx = 306; ry = 158;
      } else if (f === 399) { z.seStop(); z.fxReset(); sp(3, A.sp); z.se('Z1 エネルギー波2'); } else if (f >= 400 && f <= 438) z.efp = 239;
      else if (f === 439) { z.gpose(0); z.fxReset(); } else if (f === 449) { z.gx = 0; z.gpose(0); z.displayOut(); } else if (f >= 450 && f <= 476) z.efp = 240;
      else if (f === 477) break;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(41);
  },

  * aen3Psychic3() { // 2618 合体超能力(ブージン): ザンギャ and ビドー fly in, the barrier holds the member, they take turns at him, the finish
    const z = this.feStage(), A = this.A, G = this.G;
    const X = 640 - 416, Y = STD_Y;
    const two = (zr, zx, zy, br, bx, by) => { z.back(ZANGYA, 0, zr * 96, 96, 96, zx, zy); z.back(BIDO, 0, br * 96, 96, 96, bx, by); };
    const shake = (f) => { if (f % 4 === 0) z.gx = 4; else if (f % 2 === 0) z.gx = -4; };
    for (let f = 0; f <= 416; f++) {
      if (f === 0) z.se('Z1 飛ぶ');
      else if (f <= 26) two(0, 640 - 16 * (f - 1) - 16, Y - 60, 0, 640 - 16 * (f - 1), Y + 60);
      else if (f <= 59) two(0, X - 16, Y - 60, 0, X, Y + 60);
      else if (f === 60) z.se('Z1 高速移動');
      else if (f <= 99) { if (f % 4 === 0) { z.back(SPARK, 0, 48, 64, 64, X + 24, Y - 40); z.back(SPARK, 0, 48, 64, 64, X + 24, Y + 76); } } else if (f >= 121 && f <= 179) {
        if (f === 121) z.se('Z3 バリア');
        if (f <= 122) z.fill('#fff', 296);
        A.sp = true; this.pose(A, 4, true);
      } else if (f === 180) { A.y = -200; G.x = CENTER_CHAX; G.y = STD_Y; z.displayOut(); } else if (f >= 190 && f <= 219) {
        if (f === 190) z.se('Z3 バリア');
        if (f <= 191) z.fill('#fff', 296);
        shake(f);
      } else if (f >= 220 && f <= 258) {
        if (f === 220) z.se('Z1 高速移動');
        if (f % 4 === 0) { z.back(SPARK, 0, 48, 64, 64, X + 92, Y - 20); z.back(SPARK, 0, 48, 64, 64, X + 92, Y + 56); }
        shake(f);
      } else if (f >= 259 && f <= 290) { two(0, X + 96 - 32, Y - 40, 0, X + 96 - 16, Y + 40); shake(f); } else if (f >= 291 && f <= 398) {
        if (f === 291) z.se('Z1 飛ぶ');
        const p = f - 291, [zr, zs, br, bs, se] = ROUND[Math.floor(p / 12) % 2][p % 12];
        if (se) z.se(se);
        two(zr, X + 96 - 32 + 24 * zs, Y - 40 - 12 * zs, br, X + 96 - 16 + 24 * bs, Y + 40 + 12 * bs);
        shake(f);
      } else if (f === 399) {
        z.se('Z1 飛ぶ');
        z.gx = 0;
        two(0, X + 96 - 32, Y - 40, 0, X + 96 - 16, Y + 40);
        A.sp = false; this.pose(A, 16, false);
        A.x = 640; A.y = STD_Y - 6;
      } else if (f >= 400 && f <= 415) {
        A.x -= 24;
        if (f === 407) { A.sp = true; this.pose(A, 3, true); }
        two(0, X + 96 - 32, Y - 40 - 2 * (f - 400), 0, X + 96 - 16, Y + 40 + 2 * (f - 400));
      } else if (f === 416) { z.kyouda = true; A.y = -200; break; }
      yield* z.out();
    }
    return yield* z.damage(22);
  },
});

// ---------- ブロリー (151 / 152) ----------
// ブロリー(超) 151 / ブロリー(フルパワー) 152 — their own patterns (the Z3 move switch, all.rb 66362-66427):
//   524 イレイザーキャノン(超) 534 → 2624 (128736), damage 42   530 イレイザーブロウ 540 → 2630 (128893), damage 23
//   531 イレイザーキャノン 541 → 2631 (128939), damage 41      532 スローイングブラスター 542 → 2632 (129016), damage 41
//   533 オメガブラスター 543 → 2633 (129094), damage 42
// (src/zg_broly.js had a first reading of these without the strips, the cut-ins and the damage patterns; these
// registrations load later and take over.)
// the blinking balls by @ray_color (effects 237 16 px / 235 32 px / 252 64 px), the thrown ball (261 / 262), the
// Z3 エネルギー弾4 (293 / 266: 190×126, the lower half for an enemy), the super kamehameha's lines (back 106, mirrored)
const BLINK_S = { 0: pic('Z3_必殺技_超カメハメ波(球点滅小).png'), 1: pic('Z3_必殺技_超カメハメ波(球点滅小)(緑).png'),
  3: pic('Z3_必殺技_超カメハメ波(球点滅小)(青).png'), 4: pic('Z3_必殺技_超カメハメ波(球点滅小)(赤).png') };
const BLINK_M = { 0: pic('Z3_必殺技_超カメハメ波(球点滅).png'), 1: pic('Z3_必殺技_超カメハメ波(球点滅)(緑).png'),
  3: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'), 4: pic('Z3_必殺技_超カメハメ波(球点滅)(赤).png') };
const SOKI = pic('Z3_必殺技_繰気弾(球点滅中).PNG');
const LINES = [pic('Z3_必殺技_超カメハメ波(バック上)_反転.png'), pic('Z3_必殺技_超カメハメ波(バック下)_反転.png')];
const OMEGA = pic('Z3_必殺技_オメガブラスター(ブロリーフルパワー).png');

feFilms({
  aen3EraserCannon: { cut: true, small: true, pics: () => [BLINK_S[3], BLINK_M[3], GENKI[3]] },
  aen3EraserBlow: { cut: true, pics: () => [BLINK_S[3]] },
  aen3EraserCannonFull: { cut: true, pics: () => [BLINK_S[0], BLINK_M[0], GENKI[0], SOKI] },
  aen3ThrowingBlaster: { cut: true, pics: () => [BLINK_S[0], BLINK_M[0], GENKI[0], BALL4[0]] },
  aen3OmegaBlaster: { cut: true, pics: () => [BLINK_S[1], BLINK_M[1], GENKI[1], GENKI[3], OMEGA, ...LINES] },
});
feRegister({ 524: 'aen3EraserCannon', 530: 'aen3EraserBlow', 531: 'aen3EraserCannonFull', 532: 'aen3ThrowingBlaster', 533: 'aen3OmegaBlaster' });

// 2624's flight up and over (frames 121-133): enex / eney / the member's y (the second "when sframe + 3" is never reached)
const OVER = [[0, -16, 2], [0, -16, 2], [0, -16, 2], [16, -16, 2], [16, -8, 2], [24, 0, 2], [24, 0, 2], [16, 8, 0], [16, 8, 0],
  [16, 16, 0], [0, 16, 0], [0, 16, 0], [0, 16, 0]];

Object.assign(Duel.prototype, {
  * aen3EraserCannon() { // 2624 ブロ超)イレイザーキャノン: off and back for the member, the throw, the charge, the cannon
    const z = this.feStage(), A = this.A, G = this.G;
    for (let f = 0; f <= 387; f++) {
      let rx = 348, ry = 134;
      if (f === 0) { z.color = 3; z.pose(4); z.se('Z1 飛ぶ'); } else if (f <= 39) A.x -= 24;
      else if (f === 40) { z.ax = 0; G.x = CENTER_CHAX; G.y = STD_Y; A.x = STD_ENEX + 12; A.y = STD_Y; } else if (f <= 54) z.ax = 24;
      else if (f === 55) { z.ax = 0; z.pose(5); G.y -= 16; z.gpose(16); z.se('Z1 強打'); } else if (f <= 120) {
        if (f % 4 === 0) G.x += 4; else if (f % 2 === 0) G.x -= 4;
      } else if (f <= 140) {
        if (f === 121) { z.se('Z1 飛ぶ'); z.pose(0); }
        const p = OVER[f - 121];
        if (p) { A.x += p[0]; A.y += p[1]; G.y += p[2]; }
        if (f === 124) z.efp = 0;
        if (f === 133) z.fxReset();
      } else if (f <= 148) { A.x -= 16; z.pose(16, false); } else if (f <= 180) {
        if (f === 149) z.se('ZG 打撃2');
        G.x -= 20; z.pose(3, false); z.gpose(17);
      } else if (f <= 308) {
        if (f === 181) { z.se('Z1 気を溜める'); z.se('Z3 変身'); }
        z.pose(2); z.color = 3;
        z.efp = 237;
        if (f >= 241) { rx = 340; ry = 118; z.efp = 235; }
        z.backPattern(201, 258, 88);
      } else if (f <= 350) {
        if (f === 309) { z.seStop(); z.se('Z1 エネルギー波'); }
        rx = 230 - 16 * (f - 309); ry = 140;
        z.pose(3);
        z.efp = 261;
      } else if (f === 351) z.efp = 0;
      else if (f === 360) { z.displayOut(); z.eff = 0; z.eft = 0; A.y = -200; z.gpose(16); } else if (f >= 361 && f <= 386) { ry = 140; z.efp = 262; } else if (f === 387) { A.y = -200; break; }
      yield* z.out(rx, ry);
    }
    return yield* z.damage(42);
  },

  * aen3EraserBlow() { // 2630 ブロフル)イレイザーブロウ: off and back right in front of the member, a ball in his hand (no cut)
    const z = this.feStage(), A = this.A, G = this.G;
    for (let f = 0; f <= 131; f++) {
      let rx = 348, ry = 134;
      if (f === 0) { z.color = 3; z.pose(3); z.se('Z1 飛ぶ'); } else if (f <= 39) A.x -= 24;
      else if (f === 40) { z.ax = 0; G.x = CENTER_CHAX; G.y = STD_Y; A.x = STD_ENEX + 20; A.y = STD_Y; } else if (f <= 54) z.ax = 24;
      else if (f === 55) { z.ax = 0; z.pose(2); z.se('Z1 気を溜める'); } else if (f <= 130) { rx = 288; ry = 164; z.efp = 237; } else { A.y = -200; break; }
      yield* z.out(rx, ry);
    }
    return yield* z.damage(23);
  },

  // 2631 / 2632 frames 0-232: the charge (the ball grows: 237 → 235 at 41 → 252 at 81, the blue aura behind), then it
  // is thrown; `at` the ball's place, `p` the pose throwing, `thrown` 2632's エネルギー弾4 (293) in place of the ball
  * aen3Blaster(z, at, p, thrown) {
    const A = this.A, [x0, y0] = at;
    for (let f = 0; f <= 232; f++) {
      let rx = 348, ry = 134;
      if (f === 0) { z.color = 0; z.pose(4); z.se('Z1 気を溜める'); z.se('Z3 変身'); } else if (f <= 128) {
        z.pose(4);
        rx = x0; ry = y0; z.efp = 237;
        if (f >= 41) { rx = x0 - 8; ry = y0 - 8; z.efp = 235; }
        if (f >= 81) { if (f === 81) z.rt = 0; rx = x0 - 24; ry = y0 - 24; z.efp = 252; }
        z.color = 3; z.backPattern(201, 242, 88); z.color = 0;
      } else if (f <= 180) { rx = x0 - 24; ry = y0 - 24; z.efp = 252; } else if (f <= 222) {
        z.rt = 1;
        if (f === 181) { z.seStop(); z.se('Z1 エネルギー波'); if (thrown) z.eff = 0; }
        if (thrown) { rx = 78; ry = 110; z.efp = 293; } else { rx = x0 - 24 - 16 * (f - 181); ry = y0 - 24; z.efp = 252; }
        z.pose(p);
      } else if (f === 223) z.efp = 0;
      yield* z.out(rx, ry);
    }
    z.displayOut(); z.eff = 0; z.eft = 0; A.y = -200; // 233
  },
  * aen3EraserCannonFull() { // 2631 ブロフル)イレイザーキャノン: the charge, the ball thrown, then on the member (262)
    const z = this.feStage();
    yield* this.aen3Blaster(z, [268, 154], 5, false);
    yield* z.out(348, 134);
    for (let f = 234; f <= 259; f++) { z.efp = 262; yield* z.out(348, 140); }
    this.A.y = -200;
    return yield* z.damage(41);
  },
  * aen3ThrowingBlaster() { // 2632 ブロフル)スローイングブラスター: the charge, the エネルギー弾4 thrown (293), on the member (266)
    const z = this.feStage();
    yield* this.aen3Blaster(z, [348, 136], 6, true);
    yield* z.out(348, 134);
    for (let f = 234; f <= 259; f++) { z.efp = 266; yield* z.out(348, 110); }
    this.A.y = -200;
    return yield* z.damage(41);
  },

  * aen3OmegaBlaster() { // 2633 ブロフル)オメガブラスター: the green ball on the member, his power-up, the picture, the blaster
    const z = this.feStage(), A = this.A, G = this.G;
    for (let f = 0; f <= 631; f++) {
      let rx = 348, ry = 134;
      if (f === 0) { z.color = 0; z.pose(0); z.se('Z1 気を溜める'); } else if (f <= 128) {
        z.pose(0);
        rx = 318; ry = 154; z.efp = 237;
        if (f >= 41) { z.pose(4); rx = 340; ry = 128; z.efp = 235; }
        if (f >= 81) { if (f === 81) z.rt = 0; rx = 324; ry = 112; z.efp = 252; }
        z.color = 1;
      } else if (f <= 180) { rx = 324; ry = 112; z.efp = 252; } else if (f <= 222) {
        z.rt = 1;
        if (f === 181) { z.seStop(); z.se('Z1 エネルギー波'); }
        rx = 244 - 16 * (f - 181); ry = 130;
        z.pose(5);
        z.efp = 252;
      } else if (f === 223) z.efp = 0;
      else if (f === 233) { z.displayOut(); z.eff = 0; z.eft = 0; A.y = -200; } else if (f >= 234 && f <= 289) {
        ry = 140; z.color = 1; z.efp = 262;
        if (f === 258) z.gpose(16);
        if (f > 259) z.eff--; // (the ball stays on him)
      } else if (f <= 417) {
        z.efp = 0;
        z.pose(0);
        if (f === 290) { z.seStop(); z.se('Z3 変身'); }
        G.y = -200; A.y = STD_Y;
        z.color = 3;
        z.backPattern(201, 242, 88);
      } else if (f <= 530) {
        if (f === 418) { z.seStop(); z.se('Z1 気を溜める5'); }
        A.y = -200;
        z.efp = 0; z.tec = false; z.cut = false;
        z.back(OMEGA, 0, 0, 412, 208, 82, 88);
        z.backPattern(106);
      } else if (f <= 630) {
        z.color = 1;
        if (f === 531) z.se('Z1 エネルギー波');
        rx = 290; ry = 140;
        G.y = STD_Y;
        z.efp = 252;
        z.tec = true; z.cut = true;
        if (f % 12 === 0) z.fill('#fff', 296); // FLASH_Y_SIZE_CUTIN_ON
      } else { A.y = -200; break; }
      yield* z.out(rx, ry);
    }
    return yield* z.damage(42);
  },
});

// ---------- アラレ (153) ----------
// アラレ (enemy 153): her six moves, all.rb 129220-130030 (attack pattern = skill id + 10 → 2635-2640):
//   535 ウンチ攻撃 545 → 2635, damage 25 (DB3 SE061, the damage shown: @ene_set_action 545)
//   536 キーン 546 → 2636 (on everyone), 22      537 岩攻撃 547 → 2637, 22      538 ブンブン 548 → 2638, 22
//   539 んちゃ砲 549 → 2639, 44                  540 プロレスごっこ 550 → 2640, 44
const UNCHI = pic('Z3_必殺技_アラレ_うんち.png'); // 14×14
const ROCK = pic('Z3_必殺技_アラレ_大岩.png'); // 80×56
const NCHA = pic('Z3_必殺技_アラレ_んちゃーっ.png'); // 180×52
const SMALL0 = pic('Z3_戦闘_必殺技_エネルギー波_小.PNG'); // effects 225 / 226 with @ray_color 0: 400×48 ×2

feFilms({
  aen3Unchi: { cut: true, pics: () => [UNCHI] },
  aen3Kiin: { again: (z) => { z.tec = false; } },
  aen3Rock: { cut: true, small: true, no: 1, pics: () => [ROCK] },
  aen3Bunbun: { cut: true },
  aen3Ncha: { cut: true, small: true, pics: () => [NCHA, SMALL0] },
  aen3Wrestle: { cut: true, small: true },
});
feRegister({ 535: 'aen3Unchi', 536: 'aen3Kiin', 537: 'aen3Rock', 538: 'aen3Bunbun', 539: 'aen3Ncha', 540: 'aen3Wrestle' });

// her run: the next of four poses every 4 frames (the counter is @effect_anime_type, no effect pattern running)
function run(z, f, poses = [16, 18, 17, 18]) {
  if (f % 4 === 0) { z.pose(poses[z.eft]); z.eft++; if (z.eft === 4) z.eft = 0; }
}
// 2636 / 2638 / 2640 frames 1-99: she bobs up and down, then runs off to the left
function takeOff(z, f) {
  const A = z.d.A;
  if (f <= 15) { A.y -= 2; z.pose(7); } else if (f <= 30) A.y += 2;
  else if (f === 31) { z.seStop(); z.se('DB3 ダッシュ'); z.pose(6); } else { A.x -= 12; run(z, f); }
}

Object.assign(Duel.prototype, {
  * aen3Unchi() { // 2635 ウンチ攻撃: she squats, throws it, then it flies at the member
    const z = this.feStage();
    for (let f = 0; f <= 226; f++) {
      if (f === 0) { z.se('DB3 SE107'); z.pose(14); z.color = 0; } else if (f >= 121 && f <= 190) {
        z.pose(15);
        if (f === 121) z.se('Z1 ブン');
        z.back(UNCHI, 0, 0, 14, 14, 298 - 12 * (f - 120), 162);
      } else if (f === 191) z.fxReset();
      else if (f === 195) z.displayOut();
      else if (f >= 196 && f <= 225) z.back(UNCHI, 0, 0, 14, 14, 656 - 12 * (f - 195), 166);
      else if (f === 226) break;
      yield* z.out();
    }
    // 25 超能力ヒットキャラ揺れる with @ene_set_action 545: DB3 SE061 and the damage shown
    z.U = []; z.O = []; z.format();
    if (!this.hit) return 'miss';
    this.pose(this.G, 0, false);
    z.se('DB3 SE061');
    this.showHit();
    for (let f = 1; f <= 60; f++) { this.G.x += f % 2 === 0 ? 6 : -6; yield; }
    audio.seStop();
    return 'none';
  },

  * aen3Kiin() { // 2636 キーン: she runs off, then dashes across the member (one of three ways) on the shock-wave streaks
    const z = this.feStage(), A = this.A;
    z.color = 3;
    if (z.again) { // a further target: one dash across it
      for (let f = 0; f <= 32; f++) {
        if (f === 0) { z.tec = false; z.displayOut(); z.backPattern(1); A.y = STD_Y; A.x = 640; A.sp = true; } else if (f <= 31) {
          if (f === 1) { A.y = STD_Y; z.pose(16); A.x = 640; z.se('DB3 ダッシュ'); }
          A.x -= 12;
          z.backPattern(1);
          run(z, f);
        } else { A.y = -200; break; }
        yield* z.out();
      }
      return yield* z.damage(22);
    }
    let f = 0;
    for (;;) {
      if (f === 0) { z.se('DB3 SE109'); A.sp = true; } else if (f <= 99) takeOff(z, f);
      else if (f === 110) z.fxReset();
      else if (f === 119) { z.tec = false; z.displayOut(); } else if (f === 120) {
        z.backPattern(1);
        f = [200, 300, 500][rand(3)];
        A.y = STD_Y; A.x = 640;
      } else if (f >= 201 && f <= 231) { // straight across
        if (f === 201) { A.y = STD_Y; z.pose(16); A.x = 640; z.se('DB3 ダッシュ'); }
        A.x -= 12;
        z.backPattern(1);
        run(z, f);
        if (f === 231) f = 3100;
      } else if (f >= 301 && f <= 380) { // low to the left, then high back to the right, then across
        if (f === 301) { z.se('DB3 ダッシュ'); A.y += 108 + ((this.G.sheets.size || 96) > 96 ? 42 : 0); }
        A.x -= 12;
        z.backPattern(1);
        run(z, f);
      } else if (f >= 381 && f <= 460) {
        if (f === 381) { z.se('DB3 ダッシュ'); z.pose(20); A.y = STD_Y - 136 - ((this.G.sheets.size || 96) > 96 ? 42 : 0); A.x = -96; }
        A.x += 12;
        z.backPattern(1);
        run(z, f, [20, 22, 21, 22]);
        if (f === 460) f = 200;
      } else if (f >= 501 && f <= 580) { // high to the left, then low back to the right, then across
        if (f === 501) { z.se('DB3 ダッシュ'); A.y -= 136 + ((this.G.sheets.size || 96) > 96 ? 42 : 0); }
        A.x -= 12;
        z.backPattern(1);
        run(z, f);
      } else if (f >= 581 && f <= 660) {
        if (f === 581) { z.se('DB3 ダッシュ'); z.pose(20); A.y = STD_Y + 108 + ((this.G.sheets.size || 96) > 96 ? 42 : 0); A.x = -96; }
        A.x += 12;
        z.backPattern(1);
        run(z, f, [20, 22, 21, 22]);
        if (f === 660) f = 200;
      } else if (f === 3101) { A.y = -200; break; }
      yield* z.out();
      f++;
    }
    return yield* z.damage(22);
  },

  * aen3Rock() { // 2637 岩攻撃: the big rock falls into her hands, she staggers, throws it, then it flies at the member
    const z = this.feStage(), A = this.A;
    for (let f = 0; f <= 226; f++) {
      if (f === 0) { z.se('Z2 SE103'); z.pose(0); z.color = 0; } else if (f <= 29) {
        if (f === 18) z.pose(10);
        z.back(ROCK, 0, 0, 80, 56, 292, -118 + 8 * (f - 1));
      } else if (f <= 120) {
        if (f === 30) { z.se('Z1 強打'); A.y += 6; }
        if (f === 38) A.y -= 6;
        z.back(ROCK, 0, 0, 80, 56, 292, 106 + (f <= 37 ? 6 : 0));
      } else if (f <= 190) {
        z.pose(11);
        z.tecNo = 0;
        if (f === 121) z.se('ZG エネルギー弾1');
        const k = Math.floor((f - 121) / 4) + 1;
        z.back(ROCK, 0, 0, 80, 56, 292 - 12 * (f - 120), 106 + (k <= 9 ? 2 * k : 0));
      } else if (f === 191) z.fxReset();
      else if (f === 195) z.displayOut();
      else if (f >= 196 && f <= 225) z.back(ROCK, 0, 0, 80, 56, 656 - 12 * (f - 195), 136);
      else if (f === 226) break;
      yield* z.out();
    }
    return yield* z.damage(22);
  },

  * aen3Bunbun() { // 2638 ブンブン: she runs off, dashes into the member, skids to a stop and spins her arms
    const z = this.feStage(), A = this.A;
    for (let f = 0; f <= 381; f++) {
      if (f === 0) { z.se('DB3 SE109'); A.sp = true; z.color = 3; } else if (f <= 99) takeOff(z, f);
      else if (f === 110) z.fxReset();
      else if (f === 119) { z.tec = false; z.displayOut(); } else if (f === 120) { z.backPattern(1); A.y = STD_Y; A.x = 640; } else if (f <= 149) {
        if (f === 121) { A.y = STD_Y; z.pose(16); A.x = 640; z.se('DB3 ダッシュ'); }
        A.x -= 12;
        z.backPattern(1);
        run(z, f);
      } else if (f <= 180) {
        if (f === 150) { z.pose(7); z.se('Z1 吹っ飛ぶ止まる'); }
        if (f <= 161) A.x -= 2;
        z.backPattern(1);
      } else if (f <= 240) { z.pose(0); z.backPattern(1); } else if (f <= 350) {
        if (f === 241) z.se('Z1 パワーアップ');
        run(z, f, [3, 2, 4, 2]);
        z.backPattern(1);
      } else if (f <= 380) {
        if (f === 351) z.se('DB3 SE041');
        z.pose(5);
        z.backPattern(1);
      } else { A.y = -200; break; }
      yield* z.out();
    }
    return yield* z.damage(22);
  },

  * aen3Ncha() { // 2639 んちゃ砲: she bobs, opens her mouth — んちゃーっ! — and the small beam (225), then on the member (226)
    const z = this.feStage(), A = this.A;
    const UP = [4, 8, 12, 16, 36, 40, 44, 48], DOWN = [20, 24, 28, 32, 52, 56, 60, 64];
    for (let f = 0; f <= 221; f++) {
      if (f === 0) { z.pose(7); z.color = 0; } else if (f <= 64) {
        if (UP.includes(f)) A.y += 2;
        if (DOWN.includes(f)) A.y -= 2;
      } else if (f === 65) { z.se('DB3 SE109'); z.pose(8); } else if (f >= 120 && f <= 190) {
        z.pose(9);
        if (f === 120) z.se('DB3 エネルギー波1');
        z.efp = 225;
        z.back(NCHA, 0, 0, 180, 52, 80, 106);
      } else if (f === 191) z.fxReset();
      else if (f === 195) z.displayOut();
      else if (f >= 196 && f <= 220) z.efp = 226;
      else if (f === 221) break;
      yield* z.out(366, 168);
    }
    return yield* z.damage(44);
  },

  * aen3Wrestle() { // 2640 プロレスごっこ: she runs into the member, sends him flying, catches him, then strikes a pose — キラーン
    const z = this.feStage(), A = this.A, G = this.G, me = A.sheets.special;
    const twins = (r) => { const x = A.x, y = A.y; z.back(me, 0, r * 96, 96, 96, x + 40, y - 40); z.back(me, 0, r * 96, 96, 96, x + 10, y - 60); };
    for (let f = 0; f <= 621; f++) {
      if (f === 0) { z.se('DB3 SE109'); A.sp = true; z.color = 3; } else if (f <= 99) takeOff(z, f);
      else if (f === 110) z.fxReset();
      else if (f === 119) z.displayOut();
      else if (f === 120) { A.y = STD_Y; A.x = 640; } else if (f <= 151) { // she runs into him
        if (f === 121) { A.y = STD_Y; z.pose(16); A.x = 640; z.se('DB3 ダッシュ'); }
        A.x -= 12;
        run(z, f);
        if (f === 136) z.se('Z1 避ける');
        if (f >= 136) z.pose(12);
      } else if (f <= 180) { // he flies up and away
        if (f === 152) z.se('Z1 強打');
        z.gpose(17);
        G.x -= 12; G.y -= 8;
      } else if (f <= 240) {
        if (f === 181) { A.y = STD_Y; z.pose(18); z.se('DB3 ダッシュ'); }
        A.x -= 12;
        run(z, f);
      } else if (f <= 273) {
        if (f === 241) { A.y = STD_Y; z.pose(16); A.x = 640; z.se('DB3 ダッシュ'); }
        A.x -= 12;
        run(z, f);
      } else if (f <= 360) { // he comes down onto her, she throws him up again
        if (f === 274) { A.y = STD_Y; G.y = -96; G.x = CENTER_CHAX + 32 + 60; z.pose(7); z.se('DB3 SE109'); }
        if (f <= 288) { G.y += 8; G.x -= 4; A.y -= 4; z.pose(7); } else if (f <= 303) {
          if (f === 289) z.se('Z1 強打');
          G.y -= 8; G.x -= 8; A.y += 4;
        } else if (f === 304) z.pose(0);
      } else if (f <= 449) { // he falls to the ground and bounces
        if (f === 361) { z.se('Z1 吹っ飛ぶ'); A.y = -200; A.x = 640; G.y = -200; G.x = CENTER_CHAX + 74; }
        if (f <= 400) { G.y += 8; G.x -= 2; } else if (f <= 406) {
          z.gpose(16);
          if (f === 401) z.se('Z1 吹っ飛ぶ止まる');
          G.y -= 4;
        } else if (f <= 411) G.y += 4;
        else if (f <= 416) G.y -= 2;
        else if (f <= 421) G.y += 2;
        else if (f === 422) z.gpose(0);
      } else if (f === 450) { A.y = STD_Y; A.x = 640; z.pose(0); } else if (f <= 485) { A.x -= 6; twins(13); } else if (f <= 530) {
        z.pose(23);
        if (f === 486) z.se('DB3 キラーン');
        twins(13);
      } else if (f <= 620) {
        if (f === 531) z.se('DB3 SE075');
        twins(19);
        if (f <= 591 && f % 16 === 0) z.fill('#fff', 296);
      } else { A.y = -200; break; }
      yield* z.out();
    }
    return yield* z.damage(44);
  },
});

// ---------- オゾット (154), アービー (159) ----------
// オゾット (154): 545 ミストかめはめ波 → 2645 (all.rb 130031), damage 41; 546 ミストばくれつまこうほう → 2646 (130093), 41;
// 547 ミストませんこう → 2647 (130158), 41; 548 ミストギャリック砲 → 2648 (130212), 41; 549 ミスト剣攻撃 → 2649 (130269), 22;
// 692 イグナイトビジョン → 2789 (133443, on everyone; オゾット変身 253's 689 too), 43; 693 カオスバースト → 2793 (133703), 44.
// アービー (159): 553 パワードレイン → 2653 (130317), 22.
// The four ミスト moves start alike: frames 1-110 he flickers between rows 2 / 3 every 8 frames, 111-129 the screen goes
// white above the cut-in (FLASH_Y_SIZE_CUTIN_ON 296) on the row of the fighter he mimics, then that fighter's move.
const BALL2 = { 0: pic('Z3_戦闘_必殺技_エネルギー弾2.PNG'), 3: pic('Z3_戦闘_必殺技_エネルギー弾2(青).PNG') }; // effects 203 / 204: 96×64 ×2
const HUGE = { 0: pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_特大_緑.PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー波_特大_青.PNG') }; // effect 48: 400×192 ×2
const IGNITE = { 154: pic('Z3_必殺技_カットイン_イグナイトビジョン(オゾット).png'), 253: pic('Z3_必殺技_カットイン_イグナイトビジョン(オゾット変身).png') };
const FOE_CUT = pic('Z3_敵カットイン.PNG');
const CHAOS = pic('Z3_必殺技_カオスバースト(オゾット).png'); // 350×222

feFilms({
  aen3MistKame: { cut: true, pics: () => [BALL2[0]] },
  aen3MistBakuretsu: { cut: true, small: true, pics: () => [BALL4[1]] },
  aen3MistMasenko: { cut: true, pics: () => [BALL2[0]] },
  aen3MistGalick: { cut: true },
  aen3MistSword: { cut: true, pics: () => [SWORD] },
  aen3Ignite: { small: true, pics: () => [...Object.values(IGNITE), FOE_CUT],
    again: (z) => { z.cut = true; z.cutFlag = true; z.mirror = true; z.small = true; } },
  aen3ChaosBurst: { cut: true, small: true, pics: () => [CHAOS, BEAM_BIG_BLUE, HUGE[3]] },
  aen3PowerDrain: { cut: true, pics: () => [SPARK] },
});
feRegister({ 545: 'aen3MistKame', 546: 'aen3MistBakuretsu', 547: 'aen3MistMasenko', 548: 'aen3MistGalick', 549: 'aen3MistSword',
  692: 'aen3Ignite', 689: 'aen3Ignite', 693: 'aen3ChaosBurst', 553: 'aen3PowerDrain' }); // (689: オゾット(変身) 253, aen4's enemy)

const own = (d) => !d.p && foeId(d) >= 101; // (the Z3 switch; an earlier enemy plays the skill's film from before)
const WHITE = '#fff';
// frames 0-129 of the four ミスト moves: the flicker, then the white screen on `row`
function mistStart(z, f, row) {
  if (f === 0) { z.se('Z1 気を溜める5'); z.pose(0); } else if (f <= 110) {
    if (f % 8 === 1 && f >= 9 && f <= 97) z.pose((f - 1) / 8 % 2 ? 2 : 3);
  } else if (f <= 129) { z.fill(WHITE, 296); z.pose(row); }
}
// ax for the recoil: 3 frames back, 3 forward, then still (from `s`)
function recoil(z, f, s) { if (f >= s && f <= s + 2) z.ax = -2; else if (f >= s + 3 && f <= s + 5) z.ax = 2; else if (f === s + 6) z.ax = 0; }

Object.assign(Duel.prototype, {
  * aen3MistKame() { // 2645 ミストかめはめ波: 悟空's かめはめ波 (effects 203 / 204)
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    for (let f = 0; f < 256; f++) {
      let rx = 0, ry = 0;
      if (f <= 129) mistStart(z, f, 4);
      else if (f === 150) { z.se('Z1 気を溜める'); z.pose(5); z.color = 0; } else if (f >= 191 && f <= 195) z.pose(6);
      else if (f === 196) { z.seStop(); z.se('Z3 エネルギー波'); } else if (f >= 197 && f <= 225) { recoil(z, f, 197); z.efp = 203; rx = 184; ry = 134; } else if (f === 226) z.fxReset();
      else if (f === 230) z.displayOut();
      else if (f >= 231) z.efp = 204;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(41);
  },

  * aen3MistBakuretsu() { // 2646 ミストばくれつまこうほう: 悟飯's (Z3 エネルギー弾4 green, effects 206 / 207)
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    for (let f = 0; f < 317; f++) {
      if (f <= 129) mistStart(z, f, 7);
      else if (f === 150) { z.se('Z3 変身'); z.pose(8); z.color = 1; } else if (f === 240) { z.seStop(); z.se('Z1 エネルギー波2'); z.pose(9); z.efp = 206; } else if (f >= 241 && f <= 278) recoil(z, f, 241);
      else if (f === 279) { z.pose(9); z.fxReset(); } else if (f === 289) z.displayOut();
      else if (f >= 290) z.efp = 207;
      // (151-278: back_anime_pattern backhai_no — not set in this pattern, so nothing is drawn)
      yield* z.out(80, 96);
    }
    return yield* z.damage(41);
  },

  * aen3MistMasenko() { // 2647 ミストませんこう: 悟飯's 魔閃光 (effects 203 / 204)
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    for (let f = 0; f < 317; f++) {
      if (f <= 129) mistStart(z, f, 10);
      else if (f === 150) { z.se('Z3 変身'); z.pose(11); z.color = 0; } else if (f === 240) { z.seStop(); z.se('Z1 エネルギー波2'); z.pose(12); z.efp = 203; } else if (f === 279) { z.pose(12); z.fxReset(); } else if (f === 289) z.displayOut();
      else if (f >= 290) z.efp = 204;
      yield* z.out(204, 134);
    }
    return yield* z.damage(41);
  },

  * aen3MistGalick() { // 2648 ミストギャリック砲: ベジータ's (the blue mid beam, effects 233 / 234)
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    for (let f = 0; f < 337; f++) {
      if (f <= 129) mistStart(z, f, 13);
      else if (f === 150) { z.se('Z3 変身'); z.color = 3; z.pose(14); } else if (f === 240) { z.seStop(); z.pose(15); } else if (f === 260) { z.seStop(); z.se('Z1 エネルギー波2'); z.efp = 233; } else if (f === 299) z.fxReset();
      else if (f === 309) z.displayOut();
      else if (f >= 310) z.efp = 234;
      yield* z.out(230, 124);
    }
    return yield* z.damage(41);
  },

  * aen3MistSword() { // 2649 ミスト剣攻撃: トランクス's slash (effect 267, mirrored)
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    for (let f = 0; f < 226; f++) {
      let rx = 230, ry = 124;
      if (f <= 129) mistStart(z, f, 16);
      else if (f === 150) { z.se('Z3 剣攻撃'); z.pose(17); this.A.x += 14; z.color = 0; } else if (f >= 151 && f <= 190) { z.efp = 267; rx = 228; ry = 134; } else if (f === 191) z.fxReset();
      else if (f === 195) z.displayOut();
      yield* z.out(rx, ry);
    }
    return yield* z.damage(22);
  },

  * aen3Ignite() { // 2789 イグナイトビジョン: he slides away as his picture cut-in slides in, the screen flashes; on everyone
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage(), id = z.id;
    const flash = (f, base, n) => { for (let k = 0; k < n; k++) if (f >= base + 10 * k && f <= base + 10 * k + 2) return true; return false; };
    if (z.again) { // a further target: the flashes only
      for (let f = 0; f < 42; f++) {
        if (f === 0) { z.se('Z2 吹っ飛ぶ'); z.displayOut(); } else if (flash(f, 11, 3)) z.fill(WHITE);
        yield* z.out();
      }
      return yield* z.damage(43);
    }
    const S = 2, P = 20, Y = 146; // sisinkizyun, purasuryou, kat_haitiiti
    for (let f = 0; f < 182; f++) {
      if (f === 0) z.color = 0;
      else if (f === 1) z.fxReset();
      else if (f <= 120) {
        // (`if frame < 42..34`: in a condition a range is a flip-flop, so this is frame < 42)
        const [sheet, sy] = f < S + P + 20 ? [id === 154 ? IGNITE[154] : IGNITE[253], 0] : [FOE_CUT, 64 * (id - 101)];
        if (f <= S + P) { this.A.x += 32; z.back(sheet, 0, sy, 640, 64, -640 + 32 * (f - S), Y); } else {
          if (f === S + P + 1) { z.se('Z1 衝撃波'); z.se('Z1 怪しい気'); z.se('Z2 吹っ飛ぶ'); }
          z.back(sheet, 0, sy, 640, 64, 0, Y);
        }
        if (flash(f, S + P, 6)) z.fill(WHITE);
      } else if (f === 130) { z.cut = true; z.cutFlag = true; z.mirror = true; } else if (f === 131) z.displayOut();
      // (141-181: its flashes are at 111-133, none of them in range)
      yield* z.out();
    }
    return yield* z.damage(43);
  },

  * aen3ChaosBurst() { // 2793 カオスバースト: the aura, his close-up in the side strips, the white flash, the big beam
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    for (let f = 0; f < 427; f++) {
      z.color = 3;
      if (f === 0) { z.se('Z3 変身'); z.pose(0); } else if (f <= 128) z.backPattern(201, 250, 86);
      else if (f <= 250) {
        if (f === 129) { z.tecNo = 1; z.cut = false; this.A.x = -200; z.seStop(); z.se('Z1 気を溜める6'); z.se('Z1 気を溜める7'); z.se('Z1 怪しい気'); }
        z.back(CHAOS, 0, 0, 350, 222, 142, 50);
      } else if (f <= 270) z.fill(WHITE);
      else if (f <= 390) {
        if (f === 271) { z.seStop(); z.se('ZG 光線1'); }
        z.back(CHAOS, 0, 0, 512, 224, 142, 50);
        z.back(BEAM_BIG_BLUE, 0, 0, 316, 158, 162, 54 + 126);
      } else if (f === 399) z.tecNo = 0;
      else if (f === 400) z.displayOut();
      else if (f >= 401) {
        if (f === 401) { z.se('Z1 ザー'); z.se('Z1 ゴー'); }
        z.efp = 48;
      }
      yield* z.out(270, 96);
    }
    return yield* z.damage(44);
  },

  * aen3PowerDrain() { // 2653 パワードレイン: he vanishes, appears before the member, holds him and drains him, then flies off
    if (!own(this)) return yield* this[feFallback(this)]();
    const z = this.feStage(), A = this.A, G = this.G;
    for (let f = 0; f < 239; f++) {
      if (f === 0) { z.se('Z1 高速移動'); A.y = -120; } else if (f <= 38) { if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, A.x + 32, 144); } else if (f === 39) { G.x = CENTER_CHAX; G.y = STD_Y; } else if (f <= 78) { if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, A.x + 48, 144); } else if (f === 79) { A.x = CENTER_ENEX - 20; A.y = STD_Y; } else if (f === 100) { z.pose(5); z.se('Z1 強打'); z.gpose(16); A.x -= 28; } else if (f <= 198) {
        const k = (f - 101) / 16;
        if (k === 0) z.se('Z1 怪しい気');
        else if (k === 1 || k === 3 || k === 5) z.pose(6);
        else if (k === 2 || k === 4 || k === 6) z.pose(5);
      } else if (f === 199) { A.x += 16; z.se('Z1 飛ぶ'); z.pose(16, false); } else if (f <= 212) A.x += 16;
      else if (f >= 232) { A.x -= 32; if (f === 235) z.pose(2, false); }
      yield* z.out();
    }
    return yield* z.damage(22);
  },
});

// ---------- ゴッドゴーガン (171), ゴーストライチー (172), ハッチヒャック (173) ----------
//   ゴッドゴーガン 171: 569 テイルザンバー 579 → 2669 (all.rb 130389), damage 41 / 570 ガードンクラッシャー 580 → 2670 (130536), 42
//   ゴーストライチー 172: 575 ビッグスマッシャー 585 → 2675 (130616), 41 / 578 イレイサーショック 588 → 2678 (130649), 42
//   ハッチヒャック 173: 584 リベンジャーカノン 594 → 2684 (130770), 44 (on everyone)
// 2678 / 2684 play the original's frame-by-frame pictures (raichi_ire/raichi_ire_1-256, hatchiyack_cannon/…_1-644).
const GARDON = pic('ZG_必殺技_ガードンクラッシャー_ゴッドガードン.PNG'); // 4 rows of 328×148
const GARDON_BALL = pic('ZG_必殺技_ガードンクラッシャー_ゴッドガードン_エネルギー弾.PNG'); // 48×32
const RAICHI = pic('ZG_必殺技_イレイサーショック_ゴーストライチー.PNG'); // 124×128
const raichiFrame = (n) => `Graphics/Pictures/raichi_ire/raichi_ire_${n}.png`; // 376×160, 1-256
const HATCHI_CANNON = pic('ZG_必殺技_リベンジャーカノン_ハッチヒャック.PNG'); // 220×126
const hatchiFrame = (n) => `Graphics/Pictures/hatchiyack_cannon/hatchiyack_cannon_${n}.png`; // 288×312, 1-644

const FRAMES_HATCHI = () => {
  const a = [1, 129];
  for (let n = 137; n <= 644; n++) if (!(n > 162 && n < 185) && !(n > 201 && n < 253) && !(n > 361 && n < 423) && !(n > 602 && n < 637)) a.push(n);
  return a.map(hatchiFrame);
};
feFilms({
  aen3TailZamber: { cut: true, small: true, pics: () => [GENKI[3]] },
  aen3GardonCrusher: { cut: true, small: true, pics: () => [GARDON, GARDON_BALL, BALL4[3]] },
  aen3BigSmasher: { cut: true, pics: () => [HALF[3]] },
  aen3EraserShock: { cut: true, no: 7, pics: () => [RAICHI, HALF[3], ...Array.from({ length: 256 }, (_, i) => raichiFrame(i + 1))] },
  aen3RevengerCannon: { no: 1, pics: () => [HATCHI_CANNON, BEAM_BIG_BLUE, HALF[9], ...FRAMES_HATCHI()],
    again: (z) => { z.cut = true; z.cutFlag = true; z.mirror = true; z.tec = true; } },
});
feRegister({ 569: 'aen3TailZamber', 570: 'aen3GardonCrusher', 575: 'aen3BigSmasher', 578: 'aen3EraserShock', 584: 'aen3RevengerCannon' });

Object.assign(Duel.prototype, {
  * aen3TailZamber() { // 2669 テイルザンバー: the ki gathering in, the blue ball (effect 252) flying left, then on the member (262)
    const z = this.feStage();
    for (let f = 0; f <= 216; f++) {
      let rx = 202, ry = 108;
      if (f >= 140) { rx -= 88; ry -= 18; } // (ray_big)
      z.color = 3;
      if (f === 0) {
        z.pose(0);
        z.se('DB3 気を溜める2'); // (kitamenasi)
        z.pose(1);
        z.gatherStart(rx + 48, ry + 32);
      } else if (f <= 128) z.gather(125);
      else if (f === 129) { z.seStop(); z.pose(1); } else if (f === 130) z.ax = 0;
      else if (f >= 140 && f <= 178) {
        if (f === 140) { z.seStop(); z.se('ZG 光線1'); }
        z.pose(1);
        z.efp = 252;
        rx += 86; ry += 18;
        rx -= 16 * (f - 140);
      } else if (f === 179) z.fxReset();
      else if (f === 189) z.displayOut();
      else if (f >= 190 && f <= 215) { ry += 50; z.efp = 262; } else if (f === 216) break;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(41);
  },

  * aen3GardonCrusher() { // 2670 ガードンクラッシャー: his close-up slides in, three blows, four balls with white flashes, then the ball on the member
    const z = this.feStage(), A = this.A;
    for (let f = 0; f <= 241; f++) {
      let bx = 700;
      const by = 120;
      if (f === 0) { z.color = 3; A.y = -200; } else if (f <= 32) {
        bx -= 16 * (f - 1);
        z.back(GARDON, 0, 0, 328, 148, bx, by);
      } else if (f <= 96) {
        bx = 204;
        if (f === 33 || f === 48 || f === 64) z.se('ZG 打撃1');
        const r = f >= 48 && f <= 63 ? 2 : f >= 64 ? 3 : 1;
        z.back(GARDON, 0, 148 * r, 328, 148, bx, by);
      } else if (f <= 200) {
        const s = 97, k = 16;
        bx = 204;
        if ([s, s + k, s + k * 2, s + k * 3, s + k + 1, s + k * 2 + 1, s + k * 3 + 1].includes(f)) bx = 212;
        if ([s, s + k - 1, s + k * 2 - 1, s + k * 3 - 1].includes(f)) { z.fill('#fff', 296); z.se('ZG SE047'); }
        z.back(GARDON, 0, 148 * 3, 328, 148, bx, by);
        let rx = bx - 48 - 16 * (f - s), ry = by + 34;
        if (f >= s - 1 + k && f <= s - 1 + k * 2 - 1) { ry = by + 34 + 20; rx = bx - 48 - 16 * (f - s - k + 1); } else if (f >= s - 1 + k * 2 && f <= s - 1 + k * 3 - 1) { ry = by + 34 + 40; rx = bx - 48 - 16 * (f - s - k * 2 + 1); } else if (f >= s - 1 + k * 3 && f <= s - 1 + k * 4 - 1) { ry = by + 34 + 20; rx = bx - 48 - 16 * (f - s - k * 3 + 1); }
        z.back(GARDON_BALL, 0, 0, 48, 32, rx, ry);
      } else if (f === 211) z.fxReset();
      else if (f === 215) z.displayOut();
      else if (f >= 216 && f <= 240) { if (f === 216) z.se('ZG 光線1'); z.efp = 207; } else if (f === 241) break;
      yield* z.out(366, 168);
    }
    return yield* z.damage(42);
  },

  * aen3BigSmasher() { // 2675 ビッグスマッシャー: a long charge, the blue half-circle wave from his hands (256), then on the member (265)
    const z = this.feStage();
    for (let f = 0; f <= 197; f++) {
      z.color = 3;
      if (f === 0) { z.se('Z1 気を溜める5'); z.pose(0); z.color = 0; } else if (f === 90) { z.seStop(); z.se('ZG 光線1'); z.pose(1); z.efp = 256; } else if (f === 169) { z.fxReset(); z.displayOut(); } else if (f >= 170 && f <= 193) z.efp = 265;
      else if (f === 197) break;
      yield* z.out(284, 114);
    }
    return yield* z.damage(41);
  },

  * aen3EraserShock() { // 2678 イレイサーショック: his picture, the 256 frames of the original's animation, the white-out, the wave (256 / 265)
    const z = this.feStage(), A = this.A;
    const bx = 280, by = 112;
    for (let f = 0; f <= 491; f++) {
      if (f === 0) { z.color = 3; A.y = -200; } else if (f <= 72) z.back(RAICHI, 0, 0, 124, 128, bx, by);
      else if (f <= 328) {
        const n = f - 73 + 1;
        if (f === 73) z.se('ZG SE053');
        if (n >= 245 && n <= 248) z.fill('rgb(127,127,127)', 296);
        else if (n >= 249 && n <= 252) z.fill('rgb(188,188,188)', 296);
        else if (n >= 253 && n <= 256) z.fill('#fff', 296);
        z.back(raichiFrame(n), 0, 0, 376, 160, bx - 156, by - 14);
      } else if (f <= 369) z.fill('#fff', 296);
      else if (f === 370) { z.seStop(); z.se('ZG 光線1'); z.fill('#fff', 296); } else if (f <= 460) { z.back(RAICHI, 0, 0, 124, 128, bx + 92, by); z.efp = 256; } else if (f === 461) z.fxReset();
      else if (f === 465) z.displayOut();
      else if (f >= 466 && f <= 490) z.efp = 265;
      else if (f === 491) break;
      yield* z.out(370, by + 2);
    }
    return yield* z.damage(42);
  },

  * aen3RevengerCannon() { // 2684 リベンジャーカノン: the original's 644 frames, the white-out, his close-up and the big beam, the purple wave
    const z = this.feStage(), A = this.A, G = this.G;
    if (z.again) { // a further target: the purple wave on it
      for (let f = 0; f <= 26; f++) {
        z.color = 9; z.tecNo = 0; z.tec = true;
        if (f === 0) { z.se('ZG 光線1'); z.efp = 0; A.sp = false; G.x = CENTER_CHAX; G.y = STD_Y; } else if (f <= 25) z.efp = 265;
        else break;
        yield* z.out(370, 114);
      }
      return yield* z.damage(44);
    }
    for (let f = 0; f <= 831; f++) { // (strip 4: the stage draws it while z.tecNo is 4)
      if (f === 0) { z.color = 3; A.y = -200; } else if (f <= 644) {
        const n = f;
        if (f === 162) z.se('ZG SE053');
        let p = n;
        if (n <= 128) p = 1;
        else if (n <= 136) p = 129;
        else if (n >= 162 && n <= 184) p = 162;
        else if (n >= 201 && n <= 252) p = 201;
        else if ((n >= 361 && n <= 422) || (n >= 603 && n <= 636)) p = 361;
        else if (n >= 637 && n <= 640) z.fill('rgb(127,127,127)');
        else if (n >= 641) z.fill('rgb(188,188,188)');
        z.back(hatchiFrame(p), 0, 0, 288, 312, 176, 44);
      } else if (f <= 679) {
        z.fill('#fff');
        z.tecNo = 4;
      } else if (f <= 800) {
        if (f === 680) { z.seStop(); z.se('ZG 光線1'); }
        z.back(HATCHI_CANNON, 0, 0, 220, 126, 210, 54);
        z.back(BEAM_BIG_BLUE, 0, 0, 316, 158, 162, 54 + 126);
      } else if (f === 801) z.fxReset();
      else if (f === 805) { z.tecNo = 0; z.displayOut(); z.color = 9; } else if (f >= 806 && f <= 830) z.efp = 265;
      else if (f === 831) break;
      yield* z.out(370, 114);
    }
    return yield* z.damage(44);
  },
});

// ---------- タード一味 (177-180), ガーリック(巨大化) (182) ----------
// タード一味 (ガッシュ 177 / タード 178 / ビネガー 179 / ゾルド 180) and ガーリック(巨大化) 182 (Z3):
//   594 ガッシュ)ラッシュ → 2694 (all.rb 130876), damage 22   598 ビネガー)ラッシュ → 2698 (131028), 22
//   602 タード)ラッシュ → 2702 (131238), 22                     606 ゾルド)ラッシュ → 2706 (131376), 22
//   607 タード&ゾルド)ダブルアタック → 2707 (131451), 42       611 デッドゾーン → 1711 (131996), 75 (on everyone)
// The rushes end with @tec_kyouda_se (damage 22 sounds ZG 打撃4).
const AURA_BLUE = pic('Z3_戦闘_必殺技_気を溜める(青).png'); // back 201 (@ray_color 3)
const ZOLD = pic('Z3_戦闘_必殺技_敵_素兹.png'), TARD = pic('Z3_戦闘_必殺技_敵_塔多.png'); // 2707: the partner (96×96 rows)
const BLINK_RED = pic('Z3_必殺技_超カメハメ波(球点滅)(赤).png'), BLINK_RED_BIG = pic('Z3_必殺技_超カメハメ波(球点滅大)(赤).png');
const BALL_PINK = pic('Z3_戦闘_必殺技_エネルギー弾(桃).PNG'); // 128×128 frames
const BALL4_PINK = pic('Z3_戦闘_必殺技_エネルギー弾4(桃).PNG'); // effect 207 (@ray_color 4): 190×126, the lower half
const BLACK_HOLE = pic('Z3_戦闘_必殺技_気を溜める10.PNG'); // back 13: 3 frames of 640×356 (every 378)
const DEAD_ZONE = pic('Z3_必殺技_ガーリック_デッドゾーン2.png'); // 452×356
const KIKOU = pic('Z3_戦闘_必殺技_背景_気功砲系.png'); // back 9: 3 frames of 384×356 (every 360)

const RUSH = (more = []) => ({ cut: true, small: true, pics: () => [SPARK, AURA_BLUE, ...more] });
feFilms({
  aen3GasRush: RUSH(), aen3VinegarRush: RUSH(), aen3TardRush: RUSH(), aen3ZoldRush: RUSH([pic('Z3_戦闘_必殺技_背景_衝撃波系.png')]),
  aen3DoubleAttack: { cut: true, small: true, no: 1, pics: () => [AURA_BLUE, ZOLD, TARD, BLINK_RED, BLINK_RED_BIG, BALL_PINK, BALL4_PINK] },
  aen3DeadZone: { cut: true, small: true, no: 1, pics: () => [BLACK_HOLE, DEAD_ZONE, KIKOU], again: (z) => { z.cutFlag = true; } },
});
feRegister({ 594: 'aen3GasRush', 598: 'aen3VinegarRush', 602: 'aen3TardRush', 606: 'aen3ZoldRush', 607: 'aen3DoubleAttack', 611: 'aen3DeadZone' });

// the rushes' blows (2694 / 2698 / 2702, from strfra every akifra): the attacker's pose for blow k (0-10), and whether
// the spark is 32 lower; k 11 ends the rush
const BLOW_Y = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
// a blow frame of the rush: which of the inner case's `when`s this frame is (k, or -1), Ruby's order kept
function blow(f, s, a) {
  for (let k = 0; k <= 10; k++) {
    if (BLOW_Y[k] ? f >= s + a * k && f <= s + a * (k + 1) - 1 : f === s + a * k) return k;
  }
  if (f >= s + a * 11 && f <= s + a * 11 + 8) return 11;
  return -1;
}

Object.assign(Duel.prototype, {
  * aen3GasRush() { // 2694 ガッシュ)ラッシュ: the charge, he flies off and comes back, the rush of blows, the last one
    const z = this.feStage(), A = this.A, G = this.G;
    const POSE = [0, 0, 2, 0, 3, 0, 4, 0, 1, 0, 2];
    let sp = true;
    const P = (n) => z.pose(n, sp);
    for (let f = 0; f <= 431; f++) {
      let rx = 0, ry = 0;
      if (f === 0) { z.se('Z1 気を溜める5'); sp = true; z.color = 3; P(2); } else if (f <= 128) {
        z.backPattern(201, 248, 88);
        if (f === 128) P(0);
      } else if (f === 129) { z.seStop(); z.se('Z1 飛ぶ'); } else if (f >= 140 && f <= 169) z.ax = 24;
      else if (f === 170) { z.ax = 0; z.displayOut(); A.x = STD_ENEX; A.y = STD_ENEY; } else if (f >= 171 && f <= 180) { z.ax = 24; sp = false; P(16); } else if (f >= 181 && f <= 185) { z.ax = 16; sp = false; P(0); } else if (f >= 186 && f <= 230) {
        z.ax = 0;
        const s = 186, a = 4, k = blow(f, s, a);
        z.eff = 0;
        if (f <= s + a * 11) z.efp = 123;
        rx = 266; ry = 148;
        if (k === 0) { z.gpose(16); z.se('Z1 打撃'); } else if (k >= 1 && k <= 10) {
          P(POSE[k]);
          if (BLOW_Y[k]) ry += 32;
          if (k % 2 === 0 && f === s + a * k) z.se('Z1 打撃');
        } else if (k === 11) { z.efp = 0; z.eff = 0; P(0); z.ax = -8; } // (s + a × 16 … are past 230: never reached)
      } else if (f >= 231 && f <= 270) {
        z.ax = 0; z.efp = 0;
        if (f === 231) z.se('Z1 飛ぶ');
        A.x += 16; A.y += 2;
        sp = false; P(16);
      } else if (f >= 271 && f <= 297) {
        if (f === 271) z.se('DB3 エネルギー波2');
        sp = true; P(3);
        A.x -= 24; A.y = STD_ENEY;
        z.fxReset();
      } else if (f >= 298 && f <= 309) {
        if (f === 298) { z.seStop(); z.se('ZG 打撃6'); }
        z.gpose(16); z.gx = -16;
      } else if (f >= 310 && f <= 321) z.gx = 16;
      else if (f >= 322 && f <= 390) {
        z.gx = 0; z.gpose(0);
        if (f === 322) { z.seStop(); z.se('Z1 気を溜める5'); }
        P(2);
        A.x += 2;
        z.backPattern(201, A.x - 22, A.y - 32);
      } else if (f >= 391 && f <= 430) {
        if (f === 391) z.se('DB3 エネルギー波1');
        sp = true; P(1);
        z.backPattern(201, A.x - 22, A.y - 32);
      } else if (f === 431) { A.y = -200; z.kyouda = true; break; }
      yield* z.out(rx, ry);
    }
    return yield* z.damage(22);
  },

  * aen3VinegarRush() { // 2698 ビネガー)ラッシュ: the charge, he flies at the member and drives him off, after-images, the rush
    const z = this.feStage(), A = this.A, G = this.G;
    const POSE = [0, 0, 2, 0, 3, 0, 4, 0, 1, 0, 2];
    let sp = true;
    const P = (n) => z.pose(n, sp);
    for (let f = 0; f <= 418; f++) {
      let rx = 0, ry = 0;
      if (f === 0) { z.se('Z1 気を溜める5'); sp = true; z.color = 3; P(2); } else if (f <= 128) {
        z.backPattern(201, 248, 88);
        sp = true;
        if (f === 128) P(3);
      } else if (f === 129) { z.seStop(); z.se('Z1 飛ぶ'); z.backPattern(201, 248, 88); } else if (f <= 139) z.backPattern(201, 248, 88);
      else if (f <= 169) { z.backPattern(201, A.x - 18, 88); z.ax = 24; } else if (f === 170) {
        z.backPattern(201, A.x - 18, 88);
        z.ax = 0; z.displayOut(); A.x = STD_ENEX; A.y = STD_ENEY;
      } else if (f <= 180) { z.backPattern(201, A.x - 18, 88); z.ax = 24; } else if (f <= 185) { z.backPattern(201, A.x - 18, 88); z.ax = 16; } else if (f <= 210) {
        z.gx = -16; z.gpose(16); z.ax = 0;
        if (f === 186) z.se('Z1 強打');
        z.backPattern(201, A.x - 18, 88);
      } else if (f === 211) { z.seStop(); z.se('Z1 高速移動'); A.y = -200; } else if (f <= 230) {
        if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, A.x + 20, 144);
      } else if (f === 236) {
        z.ax = 0; z.gx = 0;
        z.displayOut(); z.gpose(0);
        A.x = CENTER_ENEX; A.y = -200;
      } else if (f >= 237 && f <= 254) {
        if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, A.x + 20, 144);
      } else if (f === 255) { A.y = STD_ENEY; sp = false; P(0); } else if (f >= 256 && f <= 350) {
        z.backPattern(201, A.x - 18, 88);
        z.ax = 0;
        const s = 256, a = 8, k = blow(f, s, a);
        z.eff = 0;
        if (f <= s + a * 11) z.efp = 123;
        rx = 266; ry = 148;
        if (k >= 0 && k <= 10) {
          if (k % 2 === 0) { z.gx = -16; z.gpose(16); } else { z.gx = 16; z.gpose(0); }
          P(POSE[k]);
          if (BLOW_Y[k]) ry += 32;
          if (k === 0 && f === s) z.se('Z1 気を溜める5');
          if (k % 2 === 0 && f === s + a * k) z.se('Z1 強打');
        } else if (k === 11) { z.gx = 16; z.gpose(0); z.efp = 0; z.eff = 0; P(0); } else if (f === s + a * 12 + 1) z.gx = 0;
        // (s + a × 16 … are past 350: never reached)
      } else if (f >= 351 && f <= 390) {
        z.ax = 0; z.gx = 0; z.efp = 0;
        if (f === 351) z.se('Z1 飛ぶ');
        A.y -= 16;
        sp = false; P(16);
        z.backPattern(201, A.x - 18, A.y - 32);
      } else if (f >= 391 && f <= 417) {
        if (f === 391) { z.se('DB3 エネルギー波2'); A.y = STD_ENEY + 4 * 26; A.x = 900; }
        sp = true; P(3);
        A.x -= 24; A.y -= 4;
        z.fxReset();
        z.backPattern(201, A.x - 18, A.y - 32);
      } else if (f === 418) { A.y = -200; z.kyouda = true; break; }
      yield* z.out(rx, ry);
    }
    return yield* z.damage(22);
  },

  * aen3TardRush() { // 2702 タード)ラッシュ: the charge, he flies off and comes back, the rush, he flies off, the charge, the dash
    const z = this.feStage(), A = this.A;
    const POSE = [0, 0, 3, 0, 4, 0, 3, 0, 4, 0, 3];
    let sp = true;
    const P = (n) => z.pose(n, sp);
    for (let f = 0; f <= 360; f++) {
      let rx = 0, ry = 0;
      if (f === 0) { z.se('Z1 気を溜める5'); sp = true; z.color = 3; P(2); } else if (f <= 128) {
        z.backPattern(201, 248, 88);
        if (f === 128) P(0);
      } else if (f === 129) { z.seStop(); z.se('Z1 飛ぶ'); } else if (f >= 140 && f <= 169) z.ax = 24;
      else if (f === 170) { z.ax = 0; z.displayOut(); A.x = STD_ENEX; A.y = STD_ENEY; } else if (f >= 171 && f <= 180) { z.ax = 24; sp = false; P(16); } else if (f >= 181 && f <= 185) { z.ax = 16; sp = false; P(0); } else if (f >= 186 && f <= 249) {
        z.ax = 0;
        const s = 186, a = 4, k = blow(f, s, a);
        z.eff = 0;
        if (f <= s + a * 11) z.efp = 123;
        rx = 266; ry = 148;
        if (k === 0) { z.gx = -8; z.gpose(16); z.se('Z1 打撃'); } else if (k >= 1 && k <= 10) {
          z.gx = k % 2 ? 8 : -8;
          P(POSE[k]);
          if (BLOW_Y[k]) ry += 32;
          if (k % 2 === 0 && f === s + a * k) z.se('Z1 打撃');
        } else if (k === 11) {
          z.gx = 8; z.efp = 0; z.eff = 0; P(0); z.ax = -24;
          if (f === s + a * 11 + 8) z.gx = 0;
          if (f === s + a * 11) z.se('Z1 飛ぶ');
        } else if (f === s + a * 16) z.ax = 0;
        else if (f >= s + a * 17 && f <= s + a * 20) A.x -= 24;
        else if (f === s + a * 21) { sp = true; P(2); z.fill('#fff', 296); z.se('DB3 刀'); } else if (f === s + a * 22) { z.ax = 0; sp = true; P(2); A.x += 14; }
      } else if (f >= 250 && f <= 350) {
        z.gx = 0; z.gpose(0);
        if (f === 250) { z.seStop(); z.se('Z1 気を溜める5'); }
        sp = true; P(2);
        z.backPattern(201, A.x - 22, A.y - 32);
      } else if (f >= 351 && f <= 359) {
        if (f === 351) { z.se('DB3 エネルギー波2'); sp = false; P(16); }
        if (f === 355) P(1);
        A.x -= 24;
      } else if (f === 360) { A.y = -200; z.kyouda = true; break; }
      yield* z.out(rx, ry);
    }
    return yield* z.damage(22);
  },

  * aen3ZoldRush() { // 2706 ゾルド)ラッシュ: the charge, then waves fired one after another (the shock behind on each), on the member
    const z = this.feStage(), A = this.A;
    const A10 = 10;
    const kind = (f, s) => ((f - s) % (A10 * 2) === 0 || f - s === 0 ? 1 : (f - s) % A10 === 0 ? 2 : 0);
    for (let f = 0; f <= 511; f++) {
      if (f === 0) { z.se('Z1 気を溜める5'); z.color = 3; z.pose(2); } else if (f <= 128) z.backPattern(201, 258, 88);
      else if (f <= 299) {
        const t = kind(f, 129);
        if (t === 1) { z.seStop(); z.se('Z1 エネルギー波'); z.pose(1); } else if (t === 2) z.pose(2);
        if (A.frame === 1) z.backPattern(1);
      } else if (f === 300) z.displayOut();
      else if (f >= 331 && f <= 510) {
        const t = kind(f, 331);
        if (t === 1) { z.seStop(); z.se('Z1 エネルギー波'); z.pose(1); z.gpose(16); z.gx = -12; } else if (t === 2) { z.pose(2); z.gx = 12; }
        if (A.frame === 1) z.backPattern(1);
      } else if (f === 511) { A.y = -200; z.kyouda = true; break; }
      yield* z.out();
    }
    return yield* z.damage(22);
  },

  * aen3DoubleAttack() { // 2707 タード&ゾルド)ダブルアタック: the partner drops in, both charge, the red balls, the pink one, on the member
    const z = this.feStage(), A = this.A, tard = z.id === 178;
    const ZX = CENTER_ENEX - 84, TX = CENTER_ENEX + 4;
    for (let f = 0; f <= 628; f++) {
      z.color = 3;
      if (f === 0) { z.se('Z1 逃げる'); z.pose(3); } else if (f <= 39) {
        if (tard) { z.ax = f <= 21 ? -2 : 0; z.back(ZOLD, 0, 3 * 96, 96, 96, ZX, -520 + 16 * (f - 1)); } else { z.ax = f <= 23 ? 2 : 0; z.back(TARD, 0, 3 * 96, 96, 96, TX, -520 + 16 * (f - 1)); }
      } else if (f <= 59) {
        A.y = -200;
        z.back(ZOLD, 0, 3 * 96, 96, 96, ZX, STD_ENEY);
        z.back(TARD, 0, 3 * 96, 96, 96, TX, STD_ENEY);
      } else if (f <= 599) {
        if (f === 60 || f === 120) z.se('DB3 SE041');
        if (f === 180) z.se('Z1 気を溜める5');
        if (f === 240) z.se('Z1 気を溜める');
        if (f === 400) { z.se('DB3 気を溜める2'); z.se('Z1 気を溜める'); }
        if (f === 520) z.se('DB3 エネルギー波2');
        if (f >= 180) { z.backPattern(201, ZX - 24, STD_ENEY - 32); z.backPattern(201, TX - 20, STD_ENEY - 32); } // (two calls: the counter twice as fast)
        z.back(ZOLD, 0, (f >= 520 ? 6 : f >= 400 ? 5 : f >= 120 ? 4 : 3) * 96, 96, 96, ZX, STD_ENEY);
        z.back(TARD, 0, (f >= 520 ? 6 : f >= 400 ? 5 : 4) * 96, 96, 96, TX, STD_ENEY);
        if (f >= 240) {
          const k = z.rt;
          if (f < 400) {
            z.back(BLINK_RED, 32 * k, 0, 32, 32, ZX + 38, STD_ENEY + 60);
            z.back(BLINK_RED, 32 * k, 0, 32, 32, TX + 36, STD_ENEY + 32);
            if (z.rf >= 4 && z.rt !== 4) { z.rt++; z.rf = 0; } else if (z.rf >= 4) { z.rt = 0; z.rf = 0; }
          } else if (f < 520) {
            z.back(BLINK_RED_BIG, 64 * k, 0, 64, 64, TX + 36 - 58, STD_ENEY + 32 - 14);
            if (z.rf >= 4 && z.rt !== 4) { z.rt++; z.rf = 0; } else if (z.rf >= 4) { z.rt = 0; z.rf = 0; }
          } else {
            if (f === 520) { z.rt = 3; z.rf = 0; }
            z.back(BALL_PINK, z.rt * 128, 0, 128, 128, TX + 36 - 58 - 32, STD_ENEY + 32 - 14 - 32);
            if (z.rf >= 16) { z.rt++; z.rf = 0; }
          }
          z.rf++;
        }
      } else if (f === 600) z.displayOut();
      else if (f <= 627) { z.color = 4; z.tecNo = 0; z.efp = 207; } else break;
      yield* z.out();
    }
    return yield* z.damage(42);
  },

  * aen3DeadZone() { // 1711 デッドゾーン: the black hole gathers while he strains, the Dead Zone picture, the 気功砲 column on each
    const z = this.feStage(), A = this.A, G = this.G;
    const toMember = () => { A.y = -200; G.x = CENTER_CHAX; G.y = STD_Y; };
    if (z.again) { // @all_attack_count >= 2: only the column on each further target
      for (let f = 0; f <= 62; f++) {
        z.tec = false;
        if (f === 0) { z.se('Z1 ゴー'); z.se('Z1 ザー'); toMember(); } else if (f <= 61) z.backPattern(9);
        else break;
        yield* z.out();
      }
      return yield* z.damage(75);
    }
    for (let f = 0; f <= 263; f++) {
      z.tec = false;
      if (f === 0) { z.se('Z1 ゴー'); z.se('Z1 ザー'); z.pose(2); z.color = 0; } else if (f <= 100) {
        z.backPattern(13);
        z.pose(f >= 71 ? 4 : Math.floor((f - 1) / 10) % 2 ? 3 : 2);
      } else if (f <= 200) {
        if (f === 101) z.se('Z1 怪しい気');
        z.tec = true; z.cut = false; z.tecNo = 1;
        A.y = -200;
        z.back(DEAD_ZONE, 0, 0, 452, 356, 96, 0);
      } else if (f === 201) { z.se('Z1 ゴー'); z.se('Z1 ザー'); z.tecNo = 0; toMember(); } else if (f <= 262) z.backPattern(9);
      else break;
      yield* z.out();
    }
    return yield* z.damage(75);
  },
});

// ---------- dev: ?dev=aen3 (a battle with the enemies of a group), then aen3Use(skill) plays an enemy's move ----------
const GROUPS = {
  aen3: [142, 144, 145], aen3bojack: [143, 146, 147], aen3broly: [151, 152, 148], aen3arale: [153, 154, 155],
  aen3ghost: [159, 162, 165], aen3spirit: [167, 169, 170], aen3god: [171, 172, 173], aen3tard: [177, 178, 179],
  aen3zold: [180, 181, 182],
};
registerZ3('aen3', {
  dev(game, step) {
    const ids = GROUPS[step] || (/^aen3e[\d_]+$/.test(step) && step.slice(5).split('_').map(Number)); // (?dev=aen3e65_120_101: any enemies)
    if (!ids) return false;
    const s = game.state = game.newState();
    s.var[40] = 2;
    s.var[43] = 60;
    s.flags.z3 = 'done';
    party(game, [3, 5, 12]);
    for (const m of s.party) { m.level = 60; m.exp = game.world.actors[m.id].exp[60]; applyLevel(game.world, m); heal(m); }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle(ids, true, { loseOk: true }), 300);
    return true;
  },
});
// the enemy who has `skill` plays it on the party (every member standing for a move on everyone), as enemyAct does
globalThis.aen3Use = async (skill, dmg = 1) => {
  const b = globalThis.__game && globalThis.__game.scene;
  if (!b || !b.foes) return 'no battle';
  const sk = b.world.skills[skill];
  const f = b.foes.find((x) => x.actions.some((a) => a.skill === skill)) || b.foes[0];
  const targets = b.party.filter((m) => !m.ko), phase = b.phase;
  b.phase = 'fight'; // (the film in place of the enemies' faces, the duel bar below)
  b.feAct = { n: 0 }; // (one enemy action: the films after the first are the further targets)
  for (const m of sk && sk.all ? targets : [targets[0]]) {
    b.duel = { m, mc: b.hand[0], f, fc: f.card || b.hand[0] };
    b.say(`${f.name} 的${sk ? sk.name : '攻擊'}！`);
    await b.play(m, f, false, skill, dmg, m);
  }
  b.phase = phase;
  b.feAct = null;
  return 'done';
};

// sounds these films play beyond src/anime_foes_common.js's, for tools/copy_assets.py
export const AEN3_SOUNDS = ['DB3 SE041', 'DB3 SE061', 'DB3 SE075', 'DB3 SE107', 'DB3 SE109', 'DB3 エネルギー波1', 'DB3 エネルギー波2', 'DB3 キラーン', 'DB3 ダッシュ', 'DB3 刀', 'DB3 気を溜める2', 'Z1 エネルギー波', 'Z1 ゴー', 'Z1 ザー', 'Z1 パワーアップ', 'Z1 ブン', 'Z1 吹っ飛ぶ', 'Z1 吹っ飛ぶ止まる', 'Z1 強打', 'Z1 怪しい気', 'Z1 打撃', 'Z1 気を溜める', 'Z1 気を溜める5', 'Z1 気を溜める6', 'Z1 気を溜める7', 'Z1 衝撃波', 'Z1 逃げる', 'Z1 避ける', 'Z1 飛ぶ', 'Z1 高速移動', 'Z2 SE103', 'Z2 吹っ飛ぶ', 'Z3 バリア', 'Z3 剣攻撃', 'Z3 変身', 'ZG SE047', 'ZG SE053', 'ZG エネルギー弾1', 'ZG 光線1', 'ZG 打撃1', 'ZG 打撃2', 'ZG 打撃3', 'ZG 打撃4', 'ZG 打撃5', 'ZG 打撃6'];

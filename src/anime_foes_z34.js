// The Z3 / Z4 enemies' own special moves (docs/anim-e-plan.md aen2), ported frame by frame from the classic version's
// Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb). The enemy's attack pattern is its skill id + 10, in the same
// Z3 move switch as the party's (all.rb 59742, $btl_progress 2 — Z3, Z4 and ZG). The films the original shares between
// all the enemies (2431 エネルギー波, 2494 連続エネルギー波, 2499 強力エネルギー波, 2498 爆発波, 2495 デスボール,
// 2493 フリーザカッター) are src/anime_foes_common.js's (the E groups' common file); this file registers its enemies'
// skills there and has the films of their own: マシーナリーレイン 2501, ネイズバインドウェーブ 2503,
// ドーレテリブルラッシュ 2505, ドレインライフ 2510, カタナ攻撃 2272, サウザーブレードスラッシュ 2552, セル's 2530 / 2531 /
// 2537 / 2544, 13・14・15號's 2573-2586.
// The strips and the cut-ins are src/anime_goku_gohan.js's stage (agStage); for an enemy the strips across scroll the
// other way (st.rev) and the cut-in starts with the enemy's row (@chr_cutin_mirror_flag false), the member's after
// set_chr_display_out. Each film runs like the original: a body per @battle_anime_frame that sets the poses, moves
// (@ax @gx …, the enemy's @ax mirrored every frame), blts under the fighters and the effect_pattern in front, with the
// original's effect / ray / back counters. Frame numbers in the comments are @battle_anime_frame.
import { audio, img } from './core.js?v=20261103-0825';
import { Duel, addMoves, moveFilm, draw, RAY_SPEED } from './anime.js?v=20261103-0825';
import { feRegister } from './anime_foes_common.js?v=20261103-0825';
import { andaAt as at, andaShake as shake } from './anime_androids.js?v=20261103-0825';
import { registerZ3, party, heal } from './z3.js?v=20261103-0825';
import { applyLevel } from './party.js?v=20261103-0825';

const STD_CHAX = -70, STD_ENEX = 602, STD_Y = 120, CENTER_CHAX = 240, CENTER_ENEX = 304, TEC_CENTER = 266; // (all.rb 52435)
const RS = RAY_SPEED, FLASH_ON = 296; // FLASH_Y_SIZE_CUTIN_ON
const pic = (n) => `Graphics/Pictures/${n}`;
const SPARK = pic('戦闘アニメ.PNG');
const BALL = { 4: pic('Z3_戦闘_必殺技_エネルギー弾(赤).PNG') }; // effect 16: 128×128 frames
const BALL2 = pic('Z3_戦闘_必殺技_エネルギー弾2.PNG'); // effects 203 / 204: 96×64 ×2
const LIQUID = { 3: pic('Z3_戦闘_必殺技_エネルギー液(青).PNG'), 4: pic('Z3_戦闘_必殺技_エネルギー液(桃).PNG') }; // 44 / 283: 400×32 ×2
const HUGE_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_特大_青.PNG'); // effect 48: 400×192 ×2
const SMALL_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG'); // effects 227 / 228: 400×48 ×2
const MID_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG'); // effects 233 / 234: 400×80 ×2
const BLINK = pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'), BLINK_SMALL = pic('Z3_必殺技_超カメハメ波(球点滅小)(青).png'); // 235 / 237
const KAME_REV = pic('Z3_必殺技_超カメハメ波_青_反転.png'); // effect 236 (the enemy's side): 500×350
const MAKANKO = pic('Z3_戦闘_必殺技_魔貫光殺砲.PNG'); // effects 255 / 272: 400×64 ×2
const BIGBANG_REV = pic('Z3_必殺技_ビッグバンアタック発動(青)_反転.PNG'); // effect 264: 2 frames of 302×200
const HALF_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'); // effect 265: 700×128 ×2
const SWORD_REV = pic('Z3_戦闘_必殺技_剣攻撃(左右反転).PNG'); // effect 267 (the enemy's side): 7 frames of 160×96
const SHOCK = pic('Z3_戦闘_必殺技_背景_衝撃波系.png'); // back 1: 3 frames of 640×180
const LINES_REV = [pic('Z3_必殺技_超カメハメ波(バック上)_反転.png'), pic('Z3_必殺技_超カメハメ波(バック下)_反転.png')]; // back 106
const AURA = { 0: pic('Z3_戦闘_必殺技_気を溜める.png'), 3: pic('Z3_戦闘_必殺技_気を溜める(青).png') }; // back 201: 2 frames of 136×142
const BOOM3 = pic('戦闘アニメ_爆発3.PNG'), BOOM4 = pic('戦闘アニメ_爆発4.PNG'); // damage 41 (effect 102) / 42 (effect 103)
// the films' own pictures
const METAL = pic('Z3_戦闘_敵_メタルクウラ.png'), METAL_SP = pic('Z3_戦闘_必殺技_敵_メタルクウラ.png'); // 2501's copies
const CELL_MAKANKO = { 127: pic('Z3_必殺技_カットイン_魔貫光殺砲(セル第１形態).png'), 130: pic('Z3_必殺技_カットイン_魔貫光殺砲(セルジュニア).png') };
const CELL2_BIGBANG = pic('Z3_必殺技_ビッグバンアタック(セル第２形態).png'); // 232×244
const CELL_KAME = pic('Z3_必殺技_超カメハメ波(セル完全体).png'); // 288×234
const RUSH13 = pic('Z3_戦闘_必殺技_突進連打(合体13号).png'), RUSH14 = pic('Z3_戦闘_必殺技_突進連打(14号).png'); // 3 frames of 140×96
const BOMBER13 = pic('Z3_必殺技_フルパワーSSデッドリィボンバー(合体13号).png'); // 312×192
const DEATH_HUGE_REV = pic('Z2_戦闘_必殺技_デスボール(極大玉)_反転.PNG'); // 900×512

// the films (only enemies have these moves; on a member they fall back to src/anime.js's foeWave): the damage pattern
// after them, pattern 32's settings (@chr_cutin_flag, @tec_back_small, @tec_back_color, @tec_output_back_no) and the
// pictures to load meanwhile
const FOE = {
  e2Rain: { dmg: 41, cut: true, small: true, pics: [METAL, METAL_SP, SPARK, SHOCK, BOOM3] }, // 2501
  e2Bind: { dmg: 73, cut: true, pics: [AURA[3], LIQUID[4]] }, // 2503
  e2Rush: { dmg: 23, cut: true, pics: [AURA[3], SPARK, MID_BLUE] }, // 2505
  e2Drain: { dmg: 22, cut: true, pics: [SPARK, SHOCK, SMALL_BLUE] }, // 2510
  e2Sword: { dmg: 22, pics: [SWORD_REV] }, // 2272
  e2Kame: { dmg: 23, pics: [BALL2] }, // 2530
  e2Makanko: { dmg: 23, pics: [CELL_MAKANKO[127], CELL_MAKANKO[130], MAKANKO] }, // 2531
  e2BigBang: { dmg: 41, cut: true, red: true, pics: [AURA[3], CELL2_BIGBANG, BLINK, BIGBANG_REV, HALF_BLUE, BOOM3] }, // 2537
  e2SuperKame: { dmg: 42, cut: true, pics: [AURA[3], BLINK_SMALL, BLINK, CELL_KAME, ...LINES_REV, KAME_REV, HUGE_BLUE, BOOM4] }, // 2544
  e2Blade: { dmg: 22, cut: true, pics: [AURA[3], SPARK] }, // 2552
  e2Assassin: { dmg: 22, cut: true, pics: [SPARK] }, // 2573
  e2Assault: { dmg: 23, cut: true, pics: [SPARK, SMALL_BLUE] }, // 2574
  e2Bomber: { dmg: 41, cut: true, tecNo: 1, pics: [BALL[4], BOOM3] }, // 2575
  e2Bomber2: { dmg: 41, cut: true, tecNo: 1, pics: [BALL[4], BOOM3] }, // 2579
  e2FullBomber: { dmg: 42, cut: true, pics: [SPARK, RUSH13, BALL[4], BOMBER13, ...LINES_REV, DEATH_HUGE_REV, BOOM4] }, // 2580
  e2Charge14: { dmg: 22, cut: true, kyouda: true, pics: [SPARK, RUSH14] }, // 2583
  e2Strike15: { dmg: 22, cut: true, kyouda: true, pics: [] }, // 2586
};
// skill → film (the enemies of docs/anim-e-plan.md aen2): their own films here, the shared ones in
// src/anime_foes_common.js (克拉斯 shares 385 / 450 with 艾爾 / 內茲)
addMoves({
  403: 'e2Bind', 405: 'e2Rush', 407: 'e2Sword', 452: 'e2Blade', 401: 'e2Rain', // Z3
  410: 'e2Drain', 414: 'e2Drain', 433: 'e2Drain', 430: 'e2Kame', 436: 'e2Kame', 441: 'e2Kame', 447: 'e2Kame',
  431: 'e2Makanko', 448: 'e2Makanko', 437: 'e2BigBang', 444: 'e2SuperKame', // 人造人・沙魯
  473: 'e2Assassin', 474: 'e2Assault', 475: 'e2Bomber', 479: 'e2Bomber2', 480: 'e2FullBomber', 483: 'e2Charge14', 486: 'e2Strike15', // 13・14・15號
});
feRegister({
  391: 'feWave', 385: 'feWave', 386: 'feWave', 387: 'feWave', 388: 'feWave', 389: 'feWave', 390: 'feWave', 396: 'feWave',
  408: 'feWave', 412: 'feWave', 416: 'feWave', 420: 'feWave', 424: 'feWave', 428: 'feWave', 434: 'feWave', 439: 'feWave',
  445: 'feWave', 471: 'feWave', 476: 'feWave', 481: 'feWave', 484: 'feWave', // 2431
  394: 'feWaves', 402: 'feWaves', 404: 'feWaves', 406: 'feWaves', 411: 'feWaves', 415: 'feWaves', 417: 'feWaves', 421: 'feWaves',
  425: 'feWaves', 429: 'feWaves', 435: 'feWaves', 440: 'feWaves', 446: 'feWaves', 456: 'feWaves', 618: 'feWaves', 619: 'feWaves',
  620: 'feWaves', // 2494
  399: 'feBigWave', 409: 'feBigWave', 413: 'feBigWave', 422: 'feBigWave', 450: 'feBigWave', 451: 'feBigWave', 453: 'feBigWave',
  454: 'feBigWave', 472: 'feBigWave', 477: 'feBigWave', 482: 'feBigWave', 485: 'feBigWave', // 2499
  398: 'feBlast', 442: 'feBlast', 478: 'feBlast', 395: 'feDeathBall', 400: 'feDeathBall', 393: 'feCutter', // 2498 / 2495 / 2493
});

const G = () => globalThis.__game;
const era = () => Math.min(2, (G() && G().state && G().state.var && G().state.var[40]) || 0);
// @enedatenum and $partyc[@chanum] of the attack being played (src/battle.js sets duel before each film)
const foeId = () => { const d = G() && G().scene && G().scene.duel; return (d && d.f && d.f.id) || 0; };
const memberId = () => { const d = G() && G().scene && G().scene.duel; return (d && d.m && d.m.id) || 0; };
const fill = (h) => (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 640, h); };
const among = (id, ...ids) => ids.includes(id);

// ---------- one film as the original runs it ----------
// the state anime_pattern keeps between frames: @battle_anime_frame (f), the effect / ray / back counters, the moves,
// the enemy's rect (battle_anime_change 0, n with @output_anime_type 0 normal / 1 special sheet) and the member's
class Run {
  constructor(d, st) {
    this.d = d; this.st = st; this.E = d.R; this.C = d.L; this.e = st.e2;
    this.f = 0; this.ef = 0; this.et = 0; this.eff = 0; this.rf = 0; this.rt = 0; this.bf = 0; this.bt = 0;
    this.ax = 0; this.ay = 0; this.gx = 0; this.gy = 0; this.color = 3; this.rx = 0; this.ry = 0;
    this.row = d.R.frame; this.ot = d.R.sp ? 1 : 0; this.grow = d.L.frame; this.U = []; this.O = [];
  }
  a(n) { this.row = n; } // battle_anime_change 0, n
  g(n) { this.grow = n; } // battle_anime_change 1, n
  se(name) { audio.se(name, 80); }
  stop() { audio.seStop(); }
  clear() { this.eff = 0; this.ef = 0; this.et = 0; }
  blt(sheet, sx, sy, w, h, x, y) { this.U.push(at(sheet, sx, sy, w, h, x, y)); }
  flash(h = FLASH_ON) { this.U.push(fill(h)); }
  afterImage(x, y) { this.blt(SPARK, 0, 48, 64, 64, x, y); }
  // set_chr_display_out (@attackcourse 1): the enemy leaves, the member stands in the middle; the member's cut-in
  out() { this.E.y = -200; this.C.x = CENTER_CHAX; this.C.y = STD_Y; if (this.e.flag) this.e.mir = true; }
  // back_anime_pattern (the enemy's side, a normal-sized member)
  back(n, bx, by) {
    const t = this.bt;
    if (n === 1) { this.blt(SHOCK, 0, t * 180, 640, 180, 0, 80); this.cyc(4, 2); }
    else if (n === 106) { this.blt(LINES_REV[0], 0, 128 * t, 384, 128, 640 - 384, 0); this.blt(LINES_REV[1], 0, 64 * t, 192, 64, 640 - 192, 292); this.cyc(4, 2); }
    else if (n === 201) { this.blt(AURA[this.color] || AURA[0], t * 136, 0, 136, 142, bx, by); this.cyc(16, 1); }
    this.bf++;
  }
  cyc(every, max) { if (this.bf >= every) { this.bt = this.bt !== max ? this.bt + 1 : 0; this.bf = 0; } }
  // the ray counter of effects 235 / 237 / 264 / 267
  rcyc(every, max) { if (this.rf >= every) { this.rt = max == null || this.rt !== max ? this.rt + 1 : 0; this.rf = 0; } }
  // effect_pattern (the enemy's side): what is in front of the fighters this frame
  effect() {
    const n = this.eff, ef = this.ef, rx = this.rx, ry = this.ry, E = this.E, C = this.C, o = (...a) => this.O.push(at(...a));
    switch (n) {
      case 16: o(BALL[this.color], this.et * 128, 0, 128, 128, rx || 249, rx ? ry : 112); if (ef >= 10) { this.et++; this.ef = 0; } break;
      case 44: o(LIQUID[this.color], 0, 32, 400, 32, 640 - ef * RS, 150); break;
      case 48: o(HUGE_BLUE, 0, 192, 400, 192, 640 - ef * RS, 76); break;
      case 121: { // 攻撃ヒット
        if (ef <= 4) { o(SPARK, 0, 16, 32, 32, E.x - 32, E.y + 32); o(SPARK, 32, 0, 32, 16, C.x + 64, C.y); }
        else if (ef <= 10) { o(SPARK, 32, 16, 32, 32, E.x - 32, C.y + 32); o(SPARK, 32, 0, 32, 16, C.x + 64, C.y); }
        break;
      }
      case 123: o(SPARK, ef <= 4 ? 0 : 32, 16, 32, 32, rx, ry); break; // キャラぶつかる自由位置
      case 203: o(BALL2, 0, 64, 96, 64, rx - ef * RS, ry); break;
      case 204: o(BALL2, 0, 64, 96, 64, 640 - ef * RS, 144); break;
      case 227: o(SMALL_BLUE, 352 - ef * RS, 0, 48 + ef * RS, 48, rx - 92 - ef * RS, ry - 10); break;
      case 228: o(SMALL_BLUE, 0, 48, 400, 48, 640 - ef * RS + 64, 148); break;
      case 233: o(MID_BLUE, 346 - ef * RS, 0, 54 + ef * RS, 80, rx - ef * RS, ry); break;
      case 234: o(MID_BLUE, 0, 80, 400, 80, 640 - ef * RS, ry); break;
      case 235: o(BLINK, 32 * this.rt, 0, 32, 32, rx, ry); this.rcyc(4, 4); break;
      case 236: o(KAME_REV, 500 - 54 - ef * RS, 0, 500 - 54 + ef * RS, 350, rx, ry); break;
      case 237: o(BLINK_SMALL, 16 * this.rt, 0, 16, 16, rx, ry); this.rcyc(4, 4); break;
      case 255: o(MAKANKO, 0, 64, 400, 64, 640 - ef * RS, ry); break;
      case 264: o(BIGBANG_REV, 302 * this.rt, 0, 302, 200, rx, ry); this.rcyc(4, 1); break;
      case 265: o(HALF_BLUE, 0, 0, 700, 128, 640 - ef * RS, ry); break;
      case 267: o(SWORD_REV, 160 * this.rt, 0, 160, 96, rx, ry); this.rcyc(2); break;
      case 272: o(MAKANKO, 400 - 64 - ef * RS, 0, 400 - 64 + ef * RS, 64, rx - ef * RS, ry); break;
      case 283: o(LIQUID[this.color], 400 - ef * RS, 0, ef * RS, 32, rx - ef * RS, ry); break;
      default: break; // (132 and the like: no such effect)
    }
    this.rf++; this.ef++;
  }
  // output_battle_anime (@attackcourse 1): the enemy's @ax is mirrored every frame, the member's moves are not
  move() {
    const E = this.E, C = this.C;
    this.ax = -this.ax;
    E.x += this.ax; E.y += this.ay; C.x += this.gx; C.y += this.gy;
    E.frame = this.row; E.sp = this.ot === 1; C.frame = this.grow; C.sp = false;
  }
  // output_cutin / output_back from the flags the film sets (@chr_cutin, @chr_cutin_flag, @chr_cutin_mirror_flag,
  // @tec_output_back, @tec_output_back_no, @tec_back_small, @tec_back_color)
  sync() { syncStage(this.st); }
}
function syncStage(st) {
  const e = st.e2;
  if (!e.flag) e.cut = false;
  st.tecFrom = e.tec ? 0 : Infinity; st.tecNo = e.tecNo; st.small = e.small; st.red = e.red;
  st.cutFrom = e.cut ? 0 : Infinity; st.mirror = !e.mir; // (the stage: mirror = the enemy's row)
}

const launch0 = Duel.prototype.launch;
const film = (d) => !d.p && d.constructor === Duel && FOE[moveFilm(d.skill)] ? moveFilm(d.skill) : null;
Object.assign(Duel.prototype, {
  // the stage of src/anime_goku_gohan.js, on the enemy's side
  e2Stage() {
    const st = this.agStage();
    if (!st.e2) {
      st.era = era(); st.rev = true;
      st.e2 = { tec: false, tecNo: 0, cut: false, flag: false, mir: false, small: false, red: false };
    }
    return st;
  },
  * launch() { // 32: from its frame 30 the strips and (@chr_cutin_flag) the enemy's cut-in
    const name = film(this);
    if (!name) return yield* launch0.call(this);
    const cfg = FOE[name], st = this.e2Stage(), e = st.e2;
    cfg.pics.forEach((p) => img(p));
    Object.assign(e, { tec: true, tecNo: cfg.tecNo || 0, cut: !!cfg.cut, flag: !!cfg.cut, mir: false, small: !!cfg.small, red: !!cfg.red });
    syncStage(st);
    st.tecFrom = this.t + 29; st.cutFrom = cfg.cut ? this.t + 29 : Infinity;
    yield* launch0.call(this);
  },
  // play a film: body(r) is the pattern's case for r.f, true on the frame it calls anime_pattern_fromat
  * e2Run(body) {
    const st = this.e2Stage(), r = new Run(this, st);
    for (;; r.f++) {
      r.U = []; r.O = [];
      const end = body(r);
      r.move();
      if (!end && r.eff) r.effect();
      r.sync();
      st.under = r.U; st.over = r.O;
      yield;
      if (end) { audio.seStop(); break; }
    }
    return r;
  },
  // the damage pattern: 23 / 22 / 73 are src/anime.js's; 41 / 42 (effects 102 / 103) on the member's side here
  * e2End(name) {
    const st = this.e2Stage(), { dmg, kyouda } = FOE[name];
    st.under = []; st.over = [];
    if (dmg === 22 && kyouda) { // @tec_kyouda_se: 22 with ZG 打撃4
      if (!this.hit) return 'miss';
      this.se('ZG 打撃4'); this.showHit(); this.pose(this.G, 17, false);
      for (let f = 0; f < 60; f++) { if (f < 20) this.vel(0, 0, -20, 0); yield; }
      return 'none';
    }
    if (dmg === 41 || dmg === 42) {
      if (!this.hit) return 'miss';
      const big = dmg === 42, [sheet, w, h, x] = big ? [BOOM4, 176, 144, 204] : [BOOM3, 112, 120, 230];
      this.se(big ? 'ZG 光線系ヒット3' : 'ZG 光線系ヒット2');
      this.showHit();
      this.pose(this.G, 17, false);
      this.effect((c, t) => { const k = t <= 10 ? 0 : t <= 20 ? 1 : -1; if (k >= 0) draw(c, sheet, k * w, 0, w, h, x, 120); });
      for (let f = 1; f < 60; f++) {
        if (f >= 21 && f <= 39) this.vel(0, 0, -20, 0);
        if (f === 40) this.effect(null);
        yield;
      }
      return 'none';
    }
    return { 22: 'shock', 73: 'numb' }[dmg]; // (23: src/anime.js's explosion)
  },
  * e2(name, body) {
    yield* this.e2Run(body);
    return yield* this.e2End(name);
  },

  // ---------- 古拉機甲戰隊 ----------
  * e2Bind() { // 2503 ネイズバインドウェーブ (125815): the aura, the pink current from his hand, then round the member (73)
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Bind', (r) => {
      const f = r.f;
      r.rx = 284; r.ry = 146;
      if (f === 0) { r.se('Z3 変身'); r.ot = 1; r.a(0); r.color = 3; }
      else if (f <= 89) r.back(201, 240, 88);
      else if (f === 90) { r.a(2); r.stop(); r.se('DB3 エネルギー波1'); r.color = 4; r.eff = 283; }
      else if (f === 129) r.clear();
      else if (f === 139) r.out();
      else if (f >= 140 && f <= 166) r.eff = 44;
      else if (f === 167) return true;
    });
  },

  * e2Rush() { // 2505 ドーレテリブルラッシュ (125859): he charges in, knocks the member about the screen, then a beam
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Rush', (r) => {
      const f = r.f, E = r.E, C = r.C;
      r.rx = 250; r.ry = 116;
      if (f === 0) { r.se('Z3 変身'); r.ot = 0; r.color = 3; r.a(0); }
      else if (f <= 128) r.back(201, 248, 88);
      else if (f === 129) { r.stop(); r.se('Z1 飛ぶ'); r.a(0); }
      else if (f >= 140 && f <= 169) { r.ax = 16; if (f === 169) r.e.flag = false; }
      else if (f === 170) { r.ax = 0; r.out(); E.x = STD_ENEX; E.y = STD_Y; }
      else if (f >= 171 && f <= 184) { r.ax = 16; r.ot = 0; r.a(16); }
      else if (f >= 185 && f <= 190) { r.ax = 16; r.ot = 0; r.a(1); }
      else if (f >= 191 && f <= 219) {
        if (f === 191) { r.se('ZG 打撃2'); r.clear(); }
        if (f >= 201) { if (f === 201) r.se('Z1 高速移動'); E.y = -160; if (f % 4 === 0) r.afterImage(E.x + 20, 144); }
        r.ax = 0; r.ay = 0; r.gx = -16; r.g(16); r.eff = 121;
      } else if (f === 230) { C.x = 640 + 16; r.clear(); }
      else if (f >= 231 && f <= 256) { if (f % 4 === 0) r.afterImage(E.x + 20 - 96, 144); }
      else if (f >= 257 && f <= 270) {
        r.e.tecNo = 2;
        if (f === 257) { E.y = STD_Y; E.x -= 96; r.se('Z1 強打'); }
        r.ot = 1; r.a(3); r.g(17);
        r.gx = 16; r.gy = -16;
        r.rx = E.x + 84; r.ry = E.y + 24;
        r.eff = 123;
      } else if (f >= 271 && f <= 296) {
        r.clear();
        if (f === 271) { r.se('Z1 高速移動'); E.y = -160; }
        if (f % 4 === 0) r.afterImage(E.x + 20, 144);
      } else if (f === 305) { r.gx = 0; r.gy = 0; r.out(); C.x -= 16 * 14; C.y += 16 * 14 + 8; }
      else if (f >= 306 && f <= 320) {
        if (f === 306) E.x = CENTER_ENEX;
        r.gx = 16; r.gy = -16;
        if (f % 4 === 0) r.afterImage(E.x + 20, 144);
        r.clear();
      } else if (f >= 321 && f <= 340) {
        r.gx = 0; r.gy = 16;
        r.e.tecNo = 1;
        if (f === 321) { E.y = STD_Y; E.x = CENTER_ENEX; r.se('ZG 打撃4'); }
        r.ot = 0; r.a(2);
        if (f === 325) E.y = -160;
        if (f === 330) r.se('Z1 高速移動');
        if (f % 4 === 0) r.afterImage(E.x + 20, 144);
        r.rx = CENTER_ENEX - 24; r.ry = STD_Y + 36;
        r.eff = 123;
      } else if (f === 341) { r.eff = 0; r.out(); C.y -= 16 * 19 + 8; C.x += 24; }
      else if (f >= 350 && f <= 360) { r.gy = 16; if (f % 4 === 0) r.afterImage(E.x + 20, 144); }
      else if (f === 361) { r.se('Z1 強打'); r.gy = 0; E.y = STD_Y; r.ot = 1; r.a(2); }
      else if (f === 371) { r.e.tecNo = 0; r.se('ZG 打撃1'); r.ot = 1; r.a(0); C.x += 16; }
      else if (f === 401) { r.se('ZG 打撃6'); r.a(1); r.gx = -16; r.ef = 0; }
      else if (f === 430) { r.stop(); r.se('Z1 エネルギー波2'); r.a(1); r.eff = 233; }
      else if (f === 469) r.clear();
      else if (f === 479) { r.out(); C.x = 600; }
      else if (f >= 480 && f <= 505) { r.gx = -12; r.eff = 234; }
      else if (f === 506) return true;
    });
  },

  * e2Sword() { // 2272 剣攻撃 (95837; サウザー 417): the sword slashes across, then the member is thrown back (22)
    if (this.p) return yield* this.foeWave();
    const id = foeId();
    return yield* this.e2('e2Sword', (r) => {
      const f = r.f;
      if (f === 0) {
        r.se('Z3 剣攻撃'); r.ot = 1;
        if (id === 144) r.a(4); else { r.a(2); r.C.x -= 14; r.E.x += 14; }
        r.color = 0;
      } else if (f <= 40) { r.eff = 267; r.rx = 228; r.ry = 134; }
      else if (f === 41) r.clear();
      else if (f === 45) r.out();
      else if (f === 76) return true;
    });
  },

  * e2Blade() { // 2552 サウザーブレードスラッシュ (126375): the aura, he dashes in, a flurry of cuts, the flash of the blade
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Blade', (r) => {
      const f = r.f, E = r.E;
      if (f === 0) { r.se('Z3 変身'); r.ot = 0; r.color = 3; r.a(0); }
      else if (f <= 128) r.back(201, 248, 88);
      else if (f === 129) { r.stop(); r.se('Z1 飛ぶ'); }
      else if (f === 139) r.a(5);
      else if (f >= 140 && f <= 169) { r.ax = 24; if (f === 169) r.e.flag = false; }
      else if (f === 170) { r.ax = 0; r.out(); E.x = STD_ENEX; E.y = STD_Y; }
      else if (f >= 171 && f <= 180) { r.ax = 24; r.ot = 0; r.a(16); }
      else if (f >= 181 && f <= 185) { r.ax = 16; r.ot = 0; r.a(1); }
      else if (f >= 186 && f <= 280) {
        r.ax = 0;
        const s = 186, k = 3;
        r.ef = 0;
        if (f <= s + k * 11) r.eff = 123;
        r.rx = 266; r.ry = 148;
        flurry(r, f - s, k, 'Z1 打撃', [0, 2, 3, 4, 1, 2]);
        if (f >= s + k * 11 && f <= s + k * 11 + 8) { r.eff = 0; r.ef = 0; r.a(0); r.ax = -8; }
        else if (f === s + k * 16) r.ax = 0;
        else if (f >= s + k * 17 && f <= s + k * 20) { E.x -= 24; if (f > s + k * 18) r.flash(); }
        else if (f === s + k * 21) { r.flash(); r.se('DB3 刀'); }
        else if (f === s + k * 22) { r.ax = 0; r.ot = 1; r.a(2); E.x += 14; }
      } else if (f >= 281 && f <= 299) {
        if (f === 281) { r.se('Z1 飛ぶ'); E.x -= 14; }
        r.a(0);
        E.x -= 24;
        r.clear();
      } else if (f === 320) return true;
    });
  },

  // ---------- 金屬古拉 ----------
  * e2Rain() { // 2501 マシーナリーレイン (125580): two more Metal Coolers fly in, the three knock the member about, a flash
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Rain', (r) => {
      const f = r.f, E = r.E, C = r.C;
      r.rx = 250; r.ry = 116;
      if (f === 0) { r.se('Z1 飛ぶ'); r.ot = 0; r.color = 3; }
      else if (f <= 57) { r.blt(METAL, 0, 0, 96, 96, 642 + 24 - 8 * f, STD_Y - 64); r.blt(METAL, 0, 0, 96, 96, 642 + 24 - 8 * f, STD_Y + 64); }
      else if (f <= 70) { r.blt(METAL, 0, 0, 96, 96, 642 + 24 - 8 * 57, STD_Y - 64); r.blt(METAL, 0, 0, 96, 96, 642 + 24 - 8 * 57, STD_Y + 64); }
      else if (f <= 139) {
        const k = f - 70;
        if (f === 71) r.se('Z1 飛ぶ');
        r.blt(METAL_SP, 0, 6 * 96, 96, 96, 642 + 24 - 8 * 57 - 16 * k, STD_Y - 64 - 4 * k);
        r.blt(METAL_SP, 0, 6 * 96, 96, 96, 642 + 24 - 8 * 57 - 16 * k, STD_Y + 64);
        r.a(16);
        E.y -= 16;
      } else if (f === 140) { C.x = CENTER_CHAX; C.y = STD_Y; }
      else if (f <= 164) { r.ot = 1; r.a(6); E.x = 640 - 16 * (f - 141); E.y = STD_Y; }
      else if (f <= 169) {
        r.rx = 270; r.ry = 156;
        r.eff = 123;
        if (f === 165) r.se('ZG 打撃3');
        E.x = 272;
        if (f <= 167) { C.x -= 8; r.g(16); } else C.x += 8;
      } else if (f <= 182) {
        r.rx = 270; r.ry = 156;
        r.g(0);
        const k = f - 170, PATH = [[null, -16], [null, -32], [null, -48], [288, -64], [320, -80], [344, null], [368, null], [384, -72], [400, -64], [416, -48], [416, -32], [416, -16], [416, 0]];
        const [x, y] = PATH[k];
        if (x != null) E.x = x;
        if (y != null) E.y = STD_Y + y;
        if (k === 3) r.eff = 0;
        if (k === 12) r.clear();
      } else if (f <= 190) {
        r.rx = 250; r.ry = 140;
        if (f === 190) { r.ot = 0; r.a(1); r.se('ZG 打撃4'); r.g(16); r.gx = -16; r.eff = 123; }
        E.x = 416 - 24 * (f - 183); E.y = STD_Y;
      } else if (f <= 229) {
        r.rx = 250; r.ry = 140;
        if (f === 198) r.eff = 0;
        E.x = 248;
      } else if (f <= 250) { r.ef = 0; r.et = 0; r.gx = 0; r.g(0); r.e.tecNo = 2; C.x = CENTER_CHAX; C.y = STD_Y; E.y = -96; }
      else if (f <= 264) {
        r.rx = 280; r.ry = 156;
        if (f === 251) { r.ot = 1; r.a(6); r.se('Z1 飛ぶ'); }
        if (f === 264) { r.g(16); r.gx = -16; r.gy = 16; r.eff = 123; r.se('Z1 強打'); }
        E.x = 500 - 16 * (f - 251); E.y = -96 + 16 * (f - 251);
      } else if (f <= 300) { r.rx = 280; r.ry = 156; if (f === 272) r.clear(); }
      else if (f <= 329) {
        if (f === 301) r.se('Z1 高速移動');
        E.y = -160;
        if (f % 4 === 0) r.afterImage(E.x + 20, 134);
        if (f === 329) { r.e.tecNo = 1; C.x = CENTER_CHAX; C.y = -96; r.gx = 0; r.gy = 16; }
      } else if (f <= 341) { if (f % 4 === 0) r.afterImage(E.x + 20 + 16, 134 + 16); }
      else if (f <= 370) {
        r.rx = 280; r.ry = 156;
        r.e.tecNo = 3;
        if (f === 342) { r.eff = 123; r.se('Z1 強打'); r.gx = -16; r.gy = -16; }
        if (f === 349) r.eff = 0;
        E.x = CENTER_ENEX; E.y = STD_Y;
        r.ot = 0; r.a(3); r.g(17);
      } else if (f === 381) { r.gx = 0; r.gy = 0; r.g(16); r.e.tecNo = 0; E.y = STD_Y; E.x = CENTER_ENEX; r.ot = 1; r.a(0); }
      else if (f === 401) { r.a(1); r.se('Z1 ザー'); }
      else if (f === 431 || f === 432) { if (f === 431) r.se('Z3 バリア'); r.flash(); }
      else if (f === 433) r.clear();
      else if (f === 440) r.out();
      else if (f >= 441 && f <= 501) { r.e.tec = false; r.back(1); }
      else if (f === 502) return true;
    });
  },
});

Object.assign(Duel.prototype, {
  // ---------- 人造人 20號・19號・沙魯 ----------
  * e2Drain() { // 2510 ドレインライフ (126044): he vanishes, grabs the member and drains it in the shock (20號 vs 雅木茶: a beam too)
    if (this.p) return yield* this.foeWave();
    const id = foeId(), yamcha = id === 122 && memberId() === 7, cell = among(id, 127, 128);
    return yield* this.e2('e2Drain', (r) => {
      const f = r.f, E = r.E, C = r.C;
      r.rx = 280; r.ry = 140;
      if (f === 0) { r.color = 0; r.se('Z1 高速移動'); E.y = -200; }
      else if (f <= 40) { if (f % 4 === 0) r.afterImage(E.x + (cell ? 30 : 40), 144); }
      else if (f === 41) { r.se('Z1 逃げる'); r.out(); r.e.tec = false; }
      else if (f <= 82) {
        if (f % 4 === 0) r.afterImage(E.x + (cell ? 50 : 40), 144);
        r.back(1);
        if (f === 82) {
          E.y = STD_Y; r.se('Z1 強打');
          r.ef += 3; r.eff = 123; r.ot = 1;
          if (yamcha) r.a(3);
          else if (id === 122) r.a(2);
          else if (id === 123) { E.x += 10; r.a(1); }
          else if (id === 127) { E.x += 36; r.a(6); }
          else if (id === 128) { E.x += 36; r.a(5); }
        }
      } else if (f <= 84) { r.gx = -4; r.back(1); }
      else if (f <= 86) { r.gx = 4; r.back(1); }
      else if (f <= 89) { r.gx = 0; r.back(1); }
      else if (f === 90) { r.eff = 0; r.se('Z1 怪しい気'); r.back(1); }
      else if (f <= 200) {
        r.back(1);
        r.gx = f % 2 === 0 ? 6 : -6;
        if (yamcha && f === 200) { r.gx = 0; C.x += 20; C.y -= 10; r.se('ZG 打撃6'); r.ot = 0; r.a(1); }
        else if (f === 200) r.f = 2000;
      } else if (f <= 239) { r.back(1); r.ot = 1; r.a(1); }
      else if (f === 240) { r.back(1); r.color = 3; r.se('Z1 怪光線'); }
      else if (f <= 280) { r.back(1); r.rx = 328; r.ry = 140; r.eff = 227; }
      else if (f === 281) { r.back(1); r.f = 2000; }
      else if (f === 2001) { E.y = -160; return true; }
    });
  },

  * e2Kame() { // 2530 カメハメ波(セル1) (126489; also 第２形態・完全體・小沙魯): the ball from the hands flies at the member
    if (this.p) return yield* this.foeWave();
    const id = foeId();
    const [x0, y0] = among(id, 128, 268) ? [206, 134] : among(id, 129, 135, 269) ? [202, 128] : id === 130 ? [202, 146] : [214, 134];
    return yield* this.e2('e2Kame', (r) => {
      const f = r.f;
      if (f === 0) { r.se('Z1 気を溜める'); r.ot = 1; r.a(2); r.color = 0; }
      else if (f >= 41 && f <= 45) r.a(3);
      else if (f === 46) { r.stop(); r.se('Z3 エネルギー波'); }
      else if (f >= 47 && f <= 75) {
        r.eff = 203; r.rx = x0; r.ry = y0;
        if (f <= 49) r.ax = 2; else if (f <= 52) r.ax = -2; else if (f === 53) r.ax = 0;
      } else if (f === 76) r.clear();
      else if (f === 80) r.out();
      else if (f >= 81 && f <= 107) r.eff = 204;
      else if (f === 108) return true;
    });
  },

  * e2Makanko() { // 2531 魔貫光殺砲(セル1・小沙魯) (126542): his close-up shakes in a white flash, the drill beam, then on the member
    if (this.p) return yield* this.foeWave();
    const id = foeId(), [x0, y0] = id === 127 ? [200, 128] : [224, 142], face = among(id, 127, 264) ? CELL_MAKANKO[127] : CELL_MAKANKO[130];
    return yield* this.e2('e2Makanko', (r) => {
      const f = r.f, E = r.E;
      r.rx = x0; r.ry = y0;
      if (f === 0) { r.se('Z1 気を溜める3'); r.color = 0; E.y = -160; r.e.flag = false; }
      else if (f <= 130) {
        const [sx, sy] = shake(4);
        if (f >= 116) r.flash(378);
        r.blt(face, 0, 0, 648, 64, -4 + sx, 146 + sy);
        if (f >= 118) r.flash(378);
        if (f === 130) { r.stop(); r.e.tec = true; }
        r.ot = 1; r.a(4);
      } else if (f <= 220) {
        r.e.cut = true; r.e.flag = true;
        E.y = STD_Y;
        if (f === 160) { r.a(5); r.se('Z1 エネルギー波3'); r.eff = 272; }
      } else if (f === 221) { r.se('Z1 衝撃波'); r.clear(); r.e.cut = true; r.e.flag = true; r.out(); r.e.tecNo = 0; }
      else if (f <= 247) { r.ry = 134; r.eff = 255; }
      else return true;
    });
  },

  * e2BigBang() { // 2537 ビッグバンアタック(セル２) (126695): the aura, his picture in the red corners, the ball, the burst, the wave
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2BigBang', (r) => {
      const f = r.f;
      r.rx = -52; r.ry = 208;
      if (f === 0) { r.se('Z3 変身'); r.ot = 1; r.a(0); r.color = 3; }
      else if (f <= 128) { r.back(201, 248, 88); if (f === 128) { r.e.tecNo = 2; r.e.cut = false; } }
      else if (f <= 300) {
        if (f === 129) r.stop();
        r.E.y = -160;
        const d = f >= 231 && f <= 233 ? 2 : f === 234 ? 4 : f === 235 ? 2 : 0;
        r.blt(CELL2_BIGBANG, 0, 0, 232, 244, 220 - d, 112 - d);
        if (f >= 140 && f <= 230) { if (f === 140) r.se('DB3 気を溜める2'); r.rx = 196; r.ry = 250; r.eff = 235; }
        else if (f === 231) { r.se('Z1 エネルギー波'); r.se('Z1 ゴー'); r.rt = 0; r.rf = 0; r.eff = 264; }
      } else if (f === 301) { r.e.cut = true; r.clear(); r.e.tecNo = 0; r.out(); }
      else if (f >= 311 && f <= 336) { r.ry = 112; r.eff = 265; }
      else if (f === 337) return true;
    });
  },

  * e2SuperKame() { // 2544 スーパーカメハメ波(セル) (126777): the ball between his hands, his picture in the lines, the huge wave
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2SuperKame', (r) => {
      const f = r.f;
      r.color = 3; r.rx = 130; r.ry = 0;
      if (f === 0) { r.se('Z3 変身'); r.se('Z1 気を溜める'); r.ot = 1; r.a(2); }
      else if (f <= 100) { r.back(201, 248, 88); r.rx = 336; r.ry = 154; r.eff = 237; }
      else if (f <= 170) {
        if (f === 170) {
          r.stop(); r.se('ZG 光線1'); r.ef = 0;
          Object.assign(r.e, { tec: false, cut: false, flag: false });
          r.E.y = -200; r.rx = -100; r.ry = -100;
        } else { r.back(201, 248, 88); r.eff = 235; r.rx = 336 - 8; r.ry = 154 - 8; }
      } else if (f <= 260) {
        const k = Math.floor((f - 141) / 2);
        r.rx += k - r.ef * RS;
        r.blt(CELL_KAME, 0, 0, 288, 234, 164 + k, 112);
        r.back(106);
        r.eff = 236;
      } else if (f === 261) {
        Object.assign(r.e, { cut: true, flag: true, tec: true });
        r.out();
        r.clear();
        r.C.x = CENTER_CHAX; r.C.y = STD_Y;
        r.e.small = true;
      } else if (f >= 263 && f <= 289) r.eff = 48;
      else if (f === 290) return true;
    });
  },

  // ---------- 13號・14號・15號 ----------
  // 2573 / 2574 / 2580 / 2583 / 2586 start alike: he flies off to the left, then rushes in from the right
  * e2Assassin() { // 2573 サイレントアサシン13 (126910): two blows, he knocks the member away, rushes after it, a flurry
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Assassin', (r) => {
      const f = r.f, E = r.E, C = r.C;
      if (rushIn(r)) return;
      if (f >= 43 && f <= 52) { r.ax = 24; r.ot = 0; if (f === 51) r.a(16); }
      else if (f <= 119) {
        r.rx = 266; r.ry = 148; r.ot = 0;
        if (f <= 56) r.ax = 16;
        else if (f === 57) { r.ax = 0; r.a(1); r.se('Z1 打撃'); r.gx = -8; r.g(16); r.eff = 123; }
        else if (f === 59) r.gx = 8;
        else if (f === 61) { r.gx = 0; r.g(0); r.eff = 0; }
        else if (f === 65) { r.a(2); r.se('Z1 打撃'); r.gx = -8; r.g(16); r.eff = 132; r.ry = 148 + 32; }
        else if (f === 66) r.ry = 148 + 32;
        else if (f === 67) { r.gx = 8; r.ry = 148 + 32; }
        else if (f <= 70) r.ry = 148 + 32;
        else if (f === 71) { r.eff = 0; r.se('ZG 打撃3'); r.gx = 16; E.x -= 24; r.a(0); }
        else if (f <= 80) { r.gx = -8; E.x -= 8; }
        else if (f === 81) { r.a(1); r.se('ZG 打撃4'); r.gx = -16; r.g(17); }
      } else if (f === 120) { r.out(); r.a(0); C.x = STD_ENEX + 192; C.y = STD_Y; E.x = STD_ENEX + 192; E.y = STD_Y; }
      else if (f <= 163) {
        r.gx = -16;
        if (f === 148) r.g(16);
        if (f >= 140) { E.x -= 24; if (E.x <= CENTER_ENEX - 32) E.x = CENTER_ENEX - 32; }
        if (C.x <= CENTER_CHAX) { C.x = CENTER_CHAX; r.gx = 0; }
      } else if (f <= 222) {
        r.ax = 0;
        const s = 164, k = 3;
        r.ef = 0;
        if (f <= s + k * 11) r.eff = 123;
        r.rx = 266; r.ry = 148;
        flurry(r, f - s, k, 'Z1 打撃', [0, 2, 3, 4, 1, 2]);
        if (f >= s + k * 11 && f <= s + k * 11 + 8) { r.eff = 0; r.ef = 0; r.a(16); r.ax = -8; }
        else if (f === s + k * 16) r.ax = 0;
        else if (f >= s + k * 17 && f <= s + k * 17 + 2) E.x -= 24;
        else if (f === s + k * 17 + 3) { r.ax = 0; r.ot = 0; r.a(3); r.se('Z1 強打'); }
      } else return true;
    });
  },

  * e2Assault() { // 2574 デッドリィアサルト (127082): a slow flurry of heavy blows, then the small beam
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Assault', (r) => {
      const f = r.f;
      if (rushIn(r)) return;
      if (f >= 43 && f <= 55) { r.ax = 24; r.ot = 0; if (f === 51) r.a(16); }
      else if (f === 56) r.ax = 0;
      else if (f >= 57 && f <= 137) {
        r.ax = 0;
        const s = 57, k = 8;
        r.ef = 0;
        if (f <= s + k * 11) r.eff = 123;
        r.rx = 266; r.ry = 148;
        flurry(r, f - s, k, 'Z1 強打', [0, 2, 3, 4, 1, null]);
        if (f >= s + k * 10 && f < s + k * 11) { r.a(3); r.ry += 32; if (f === s + k * 10) r.se('ZG 打撃2'); r.gx = -16; r.g(17); r.eff = 0; }
      } else if (f === 138) r.clear();
      else if (f >= 171 && f <= 219) { r.a(1); if (f === 171) r.se('Z1 怪光線'); r.rx = 338; r.ry = 136; r.ot = 1; r.eff = 227; }
      else if (f === 220) r.clear();
      else if (f === 225) { r.out(); r.C.x = 640; r.gx = -10; r.g(16); }
      else if (f >= 234 && f <= 263) r.eff = 228;
      else if (f === 264) return true;
    });
  },

  * e2Bomber() { // 2575 SSデッドリィボンバー (127188): the red ball grows, it carries the member off and back, then explodes
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Bomber', (r) => {
      const f = r.f, C = r.C, red = (x, y) => r.blt(BALL[4], 5 * 128, 0, 128, 128, x, y);
      if (bomberBall(r)) return;
      if (f === 141) r.clear();
      else if (f === 144) { r.e.small = true; r.e.tecNo = 0; }
      else if (f === 145) { r.E.y = -200; C.x = CENTER_CHAX; C.y = STD_Y; }
      else if (f >= 146 && f <= 172) { red(640 - 16 * (f - 146), STD_Y - 16); if (f === 163) { r.gy -= 24; r.g(16); r.se('Z1 飛ぶ'); } }
      else if (f >= 173 && f <= 180) red(224, STD_Y - 16);
      else if (f >= 181 && f <= 189) { r.e.tecNo = 1; red(224, STD_Y - 16 - 24 * (f - 181)); }
      else if (f === 200) { C.x = CENTER_CHAX; C.y = 480; }
      else if (f >= 201 && f <= 259) { if (f === 201) r.se('Z1 飛ぶ'); r.gy = -24; if (f >= 210 && f <= 230) red(224, 480 - 24 * (f - 210)); }
      else if (f === 260) { r.out(); r.e.tecNo = 0; C.x = 640; C.y = STD_Y; r.g(0); r.gx = -16; r.gy = 0; }
      else if (f >= 261 && f <= 283) { if (f >= 271) red(640 - 32 * (f - 271), STD_Y - 16); if (f === 280) r.g(16); }
      else if (f === 284) return true;
    });
  },

  * e2Bomber2() { // 2579 合体13号 SSデッドリィボンバー (127284): the red ball grows, then it flies at the member
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Bomber2', (r) => {
      const f = r.f, C = r.C;
      if (bomberBall(r)) return;
      if (f === 161) r.clear();
      else if (f === 164) { r.e.small = true; r.e.tecNo = 0; }
      else if (f === 165) { r.out(); r.E.y = -200; C.x = CENTER_CHAX; C.y = STD_Y; }
      else if (f >= 176 && f <= 198) r.blt(BALL[4], 5 * 128, 0, 128, 128, 640 - 16 * (f - 176), STD_Y - 16);
      else if (f === 199) return true;
    });
  },

  * e2FullBomber() { // 2580 合体13号 フルパワーSSデッドリィボンバー (127329): the rush, the red ball, the huge ball in the lines
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2FullBomber', (r) => {
      const f = r.f, E = r.E, C = r.C;
      if (rushIn(r)) return;
      if (f >= 43 && f <= 55) { r.ax = 24; r.ot = 0; if (f === 51) r.a(16); }
      else if (f === 56) { r.ax = 0; r.a(1); r.gx = -16; r.g(17); r.eff = 0; r.se('ZG 打撃4'); }
      else if (f >= 71 && f <= 99) { E.y = -200; if (f === 71) r.se('Z1 飛ぶ'); r.blt(RUSH13, 0, 0, 140, 96, TEC_CENTER - 32 * (f - 71), STD_Y - 16); }
      else if (f === 100) { C.x = STD_ENEX; C.y = STD_Y; }
      else if (f >= 109 && f <= 118) r.blt(RUSH13, 0, 0, 140, 96, STD_ENEX + 24 - 32 * (f - 109), STD_Y - 16);
      else if (f >= 119 && f <= 206) rushHits(r, RUSH13, 11);
      else if (f >= 207 && f <= 229) r.blt(RUSH13, 140, 0, 140, 96, 162, STD_Y - 16);
      else if (f === 230) { E.y = STD_Y; E.x = 162 + 16; r.a(0); }
      else if (f >= 231 && f <= 279) { if (f === 231) r.se('Z1 飛ぶ'); E.y -= 16; r.a(16); if (f === 279) r.e.tecNo = 1; }
      else if (f === 280) { E.x = TEC_CENTER; E.y = STD_Y; r.se('Z1 気を溜める2'); r.ot = 1; r.a(2); r.color = 4; }
      else if (f >= 281 && f <= 380) {
        r.rx = 250; r.ry = 100;
        r.eff = 16;
        if (f % 2 === 0) r.ef--;
        if (r.et === 3) r.et = 2;
        if (f === 380) { r.clear(); r.e.cut = false; r.e.tec = false; }
      } else if (f >= 381 && f <= 520) {
        E.y = -200;
        if (f === 381) r.se('Z1 エネルギー波');
        r.blt(BOMBER13, 0, 0, 312, 192, 240, 90);
        r.back(106);
        r.blt(DEATH_HUGE_REV, 900 - 640, 78, 640, 356, -400 - (f - 381) * 6, 0);
      } else if (f === 521) { r.gx = 0; r.clear(); }
      else if (f === 524) { r.e.small = true; r.e.tecNo = 0; r.g(0); }
      else if (f === 525) { r.e.cut = true; r.e.tec = true; r.out(); E.y = -200; C.x = CENTER_CHAX; C.y = STD_Y; }
      else if (f >= 536 && f <= 558) r.blt(BALL[4], 5 * 128, 0, 128, 128, 640 - 16 * (f - 536), STD_Y - 16);
      else if (f === 559) return true;
    });
  },

  * e2Charge14() { // 2583 アンドロイドチャージ14 (127521): the rush, then blow after blow
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Charge14', (r) => {
      const f = r.f, E = r.E, C = r.C;
      if (rushIn(r)) return;
      if (f >= 43 && f <= 55) { r.ax = 24; r.ot = 0; if (f === 51) r.a(16); }
      else if (f === 56) { r.ax = 0; r.a(1); r.gx = -16; r.g(17); r.eff = 0; r.se('ZG 打撃4'); }
      else if (f >= 71 && f <= 99) { E.y = -200; if (f === 71) r.se('Z1 飛ぶ'); r.blt(RUSH14, 0, 0, 140, 96, TEC_CENTER - 32 * (f - 71), STD_Y - 16); }
      else if (f === 100) { r.out(); C.x = STD_ENEX; C.y = STD_Y; }
      else if (f >= 109 && f <= 118) r.blt(RUSH14, 0, 0, 140, 96, STD_ENEX + 24 - 32 * (f - 109), STD_Y - 16);
      else if (f >= 119 && f <= 159) rushHits(r, RUSH14, 5);
      else if (f >= 160 && f <= 275) {
        const t = f - 160, k = 8, hit = (row, se) => { r.se(se); r.ot = 1; r.a(row); r.gx = -8; };
        if (t === 0) { r.se('ZG 打撃3'); E.x = CENTER_ENEX - 72; E.y = STD_Y; r.gx = 0; r.ot = 1; r.a(6); }
        else if (t === k * 2 || t === k * 6) hit(5, 'Z1 強打');
        else if (t === k * 4) { r.ot = 1; r.a(6); }
        else if (t === k * 8 || t === k * 10 || t === k * 12) { E.x = CENTER_ENEX - 48; hit(2, 'ZG 打撃6'); }
        else if (t === k * 9 || t === k * 11 || t === k * 13) hit(3, 'ZG 打撃6');
        else if (t === k * 14) { E.x = CENTER_ENEX - 48; r.se('ZG 打撃4'); r.ot = 1; r.a(2); }
        else if ([2, 6, 8, 9, 10, 11, 12, 13].some((n) => t === k * n + 2)) r.gx = 8;
        else if ([2, 6, 8, 9, 10, 11, 12, 13].some((n) => t === k * n + 4)) r.gx = 0;
      } else if (f === 276) { E.y = -200; return true; }
    });
  },

  * e2Strike15() { // 2586 アンドロイドストライク15 (127668): the rush, blows, he drives the member into the ground and back
    if (this.p) return yield* this.foeWave();
    return yield* this.e2('e2Strike15', (r) => {
      const f = r.f, E = r.E, C = r.C;
      if (f === 0) { r.ot = 1; r.color = 3; r.a(4); r.se('Z1 飛ぶ'); return; }
      if (rushIn(r)) return;
      if (f >= 43 && f <= 55) r.ax = 24;
      else if (f === 56) { r.ax = 0; r.ot = 1; r.a(2); r.gx = -16; r.g(17); r.eff = 0; r.se('ZG 打撃4'); }
      else if (f >= 71 && f <= 99) { r.ot = 1; E.x -= 32; r.a(4); if (f === 71) r.se('Z1 飛ぶ'); }
      else if (f === 100) { r.out(); C.x = STD_ENEX; C.y = STD_Y; E.x = STD_ENEX + 56; E.y = STD_Y; }
      else if (f >= 109 && f <= 118) { E.x -= 32; r.ax = 0; if (f === 118) { r.a(0); r.g(16); } }
      else if (f >= 119 && f <= 170) blows(r, f - 119);
      else if (f >= 171 && f <= 219) {
        const t = f - 171;
        r.gx = 0;
        if (t <= 1) { r.ot = 0; r.a(16); E.y -= 16; E.x -= 8; }
        else if (t === 10) { r.a(4); r.se('Z1 強打'); E.y += 12; E.x -= 12; r.e.tecNo = 2; }
        else if (t >= 11) { E.y += 12; E.x -= 12; C.y += 12; C.x -= 12; r.g(17); }
      } else if (f === 220) { C.x += 720; C.y -= 720; E.x += 720; E.y -= 720; }
      else if (f >= 221 && f <= 242) { if (f === 221) r.se('Z1 飛ぶ'); E.y += 12; E.x -= 12; C.y += 12; C.x -= 12; }
      else if (f >= 243 && f <= 250) {
        const t = f - 243;
        r.e.tecNo = 0; r.ot = 0; r.a(16); r.g(16);
        if (t === 0) { E.y -= 4; E.x += 4; } else if (t === 1) E.x += 4; else if (t <= 3) { E.y += 4; E.x += 4; } else if (t <= 5) E.y += 4;
      } else if (f >= 251 && f <= 302) blows(r, f - 251);
      else if (f >= 303 && f <= 323) { E.x += 8; r.gx = 0; r.ot = 0; r.a(16); }
      else if (f >= 324 && f <= 334) { E.x -= 16; if (f - 324 >= 5) { r.ot = 1; r.a(3); } }
      else if (f === 335) { E.y = -200; return true; }
    });
  },
});
// frames 0-42 of 2573 / 2574 / 2580 / 2583 / 2586: he flies off to the left, then both stand ready on the right
// (true while it handled the frame)
function rushIn(r) {
  const f = r.f, E = r.E, C = r.C;
  if (f === 0) { r.ot = 0; r.color = 3; r.a(0); r.se('Z1 飛ぶ'); return true; }
  if (f <= 41) { E.x -= 24; return true; }
  if (f === 42) { r.ax = 0; C.x = CENTER_CHAX; C.y = STD_Y; E.x = STD_ENEX; E.y = STD_Y; return true; }
  return false;
}
// 2580 / 2583 frames 119-: the rush picture pushes the member back, hitting it (n blows: 11 to the last strong one, 5)
function rushHits(r, sheet, n) {
  const f = r.f, t = f - 119, k = 8;
  let row = 0;
  r.gx = -2;
  r.rx = 316 - 2 * t; r.ry = 160;
  r.ef = 0;
  if (t >= k * 2 && t <= k * 9) r.eff = 123;
  if (t === 0) r.g(16);
  else if (t >= k * 2 && t < k * 3) { row = 1; if (t === k * 2) r.se('ZG 打撃5'); }
  else if (t >= k * 4 && t < k * 5) { row = 2; if (t === k * 4) r.se('ZG 打撃5'); }
  else if (n === 5 && t === k * 5) r.eff = 0;
  else if (t >= k * 6 && t < k * 7) { row = 1; if (t === k * 6) r.se('ZG 打撃5'); }
  else if (t >= k * 8 && t < k * 9) { row = 2; if (t === k * 8) r.se('ZG 打撃5'); }
  else if (t >= k * 10 && t < k * 11) { row = 1; if (t === k * 10) r.se('Z1 強打'); r.gx = -16; r.g(17); r.eff = 0; }
  r.blt(sheet, row * 140, 0, 140, 96, STD_ENEX + 24 - 288 - 2 * t, STD_Y - 16);
}
// 2575 / 2579 frames 0-101: the red ball (effect 16) grows at half speed and holds, then grows on as he throws
function bomberBall(r) {
  const f = r.f;
  r.rx = 250; r.ry = 100;
  if (f === 0) { r.se('Z1 気を溜める2'); r.ot = 1; r.a(2); r.color = 4; return true; }
  if (f <= 100) { r.eff = 16; if (f % 2 === 0) r.ef--; if (r.et === 3) r.et = 2; return true; }
  if (f === 101) { r.se('Z1 エネルギー波'); r.eff = 16; r.a(3); return true; }
  return false;
}
// 2586's blows (frames 119-170 and 251-302): rows 3 / 5 by turns, each one shaking the member
function blows(r, t) {
  const k = 8;
  if ([0, 2, 4, 6].some((n) => t === k * n)) { r.se('Z1 打撃'); r.ot = 1; r.a(3); r.gx = -8; }
  else if ([1, 3, 5].some((n) => t === k * n)) { r.se('Z1 打撃'); r.ot = 1; r.a(5); r.gx = -8; }
  else if ([0, 1, 2, 3, 4, 5, 6, 7].some((n) => t === k * n + 2)) r.gx = 8;
  else if ([0, 1, 2, 3, 4, 5, 6, 7].some((n) => t === k * n + 4)) r.gx = 0;
}

// the flurry of 2552 / 2573 (strfra, akifra): hits at k × 0 / 2 / 4 / 6 / 8 / 10 with these rows, back to 0 between
// (rows at 2, 6 and 10 a step lower: raytyouseiy); `s` the sound of each hit
function flurry(r, t, k, s, rows) {
  if (t === 0) { r.g(16); r.se(s); }
  else if (t === k) r.a(0);
  else if (t >= k * 2 && t < k * 3) { r.a(rows[1]); r.ry += 32; if (t === k * 2) r.se(s); }
  else if (t === k * 3) r.a(0);
  else if (t === k * 4) { r.a(rows[2]); r.se(s); }
  else if (t === k * 5) r.a(0);
  else if (t >= k * 6 && t < k * 7) { r.a(rows[3]); r.ry += 32; if (t === k * 6) r.se(s); }
  else if (t === k * 7) r.a(0);
  else if (t === k * 8) { r.a(rows[4]); r.se(s); }
  else if (t === k * 9) r.a(0);
  else if (t >= k * 10 && t < k * 11 && rows[5] != null) { r.a(rows[5]); r.ry += 32; if (t === k * 10) r.se(s); }
}

// ?dev=aen2: a Z3 save (悟空・雅木茶・悟飯・貝吉塔 at level 60) against 弗利薩・古拉・金屬古拉; ?dev=aen2-127-128-129
// against those enemies. In the battle, aen2Use(i, skill) makes enemy i use that move now (src/battle.js enemyAct, as
// in a turn: its card any school, every member a target) and aen2Heal() fills the party up again.
registerZ3('aen2', {
  dev(game, step) {
    const m = /^aen2(?:-([\d-]+))?$/.exec(step);
    if (!m) return false;
    const s = game.state = game.newState();
    s.var[40] = 2;
    s.var[43] = 60;
    s.flags.z3 = 'done';
    party(game, [14, 7, 5, 19]);
    for (const x of s.party) { x.level = 60; x.exp = game.world.actors[x.id].exp[60]; applyLevel(game.world, x); heal(x); }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    const foes = m[1] ? m[1].split('-').filter(Boolean).map(Number) : [101, 120, 136];
    setTimeout(() => game.startBattle(foes, true, { loseOk: true }), 300);
    return true;
  },
});
globalThis.aen2Use = async (i, skill) => {
  const b = G().scene, f = b.foes[i], keep = { actions: f.actions, card: f.card, plans: b.plans, phase: b.phase };
  f.actions = [{ skill, cond: 0, param: 0 }];
  f.card = { ...f.card, s: 0 };
  b.plans = b.party.map((x, k) => (b.plans && b.plans[k]) || { card: k % b.hand.length, target: 0 });
  b.phase = 'fight';
  b.acted = b.acted || new Set(); b.oneTurn = []; // (a once-a-turn move may come again)
  try { await b.enemyAct(f); } finally { f.actions = keep.actions; f.card = keep.card; b.plans = keep.plans; b.phase = keep.phase; }
};
globalThis.aen2Heal = () => { for (const x of G().scene.party) { heal(x); x.ko = false; } for (const f of G().scene.foes) f.hp = f.maxhp; };

export { FOE as E2_FOE, Run as E2Run }; // (for the other enemy films: docs/anim-e-plan.md)

// sounds these films play beyond src/anime.js's, for tools/copy_assets.py
export const E2_SOUNDS = ['Z1 怪光線', 'Z3 エネルギー波', 'DB3 気を溜める2', 'Z1 気円斬', 'Z1 繰気弾', 'Z3 変身', 'Z1 気を溜める5',
  'Z1 エネルギー波', 'Z1 ゴー', 'Z1 ザー', 'Z1 エネルギー波2', 'Z1 飛ぶ', 'ZG 打撃1', 'ZG 打撃2', 'ZG 打撃3', 'ZG 打撃4', 'ZG 打撃5',
  'ZG 打撃6', 'Z1 強打', 'Z1 高速移動', 'Z3 バリア', 'DB3 エネルギー波1', 'Z1 逃げる', 'Z1 怪しい気', 'Z3 剣攻撃', 'Z1 気を溜める',
  'Z1 気を溜める2', 'Z1 気を溜める3', 'Z1 エネルギー波3', 'Z1 衝撃波', 'ZG 光線1', 'Z1 打撃', 'DB3 刀', 'ZG 光線系ヒット2',
  'ZG 光線系ヒット3', 'Z3 跳ね返し', 'DB3 SE091'];

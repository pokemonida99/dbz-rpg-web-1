// The Z2 enemies' and the early films' enemies' special-move films (docs/anim-e-plan.md aen1), ported frame by frame
// from the original's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like src/anime.js. An enemy's move is
// attack pattern skill id + 10 (ene_action_set, all.rb 140149); enemies 31-100 ($ene_str_no = [1, 31, 101]) take the
// Z2 branch of the move switch (56692, $btl_progress 1, Z2_ pictures) whatever the story's part: anime_pattern 31
// (swoop in) → 32 (必殺技!) → the move's own pattern → the damage pattern. The patterns (all.rb 88478-91660):
//   基紐 345 / 346 / 347 → 1445 / 1446 / 1447            吉斯 349 / 350 → 1449 / 1450, 382 → 1482 (with 巴特)
//   巴特 351 / 352 → 1451 / 1452 (damage 22), 383 → 1482  利庫姆 353 / 354 / 355 → 1453 / 1454 / 1455
//   古爾多 356 → 1456                                     弗利薩 358-369 → 1458-1469 (each form its own), 624 → 1724 (42)
//   弗利薩(全力) 694 → 1794 (44)                           超貝吉塔 370 / 371 / 372 / 695 → 1431 / 1223 / 1224 (41) / 1795 (44)
//   達列斯 374-377 → 1474-1477 (377: 41)                   史拉格 378-381 → 1478-1481 (381: 41)
//   阿蒙德 626 / 627 → 1726 / 1727   戴耶斯 633 / 634 → 1733 / 1734   卡卡奧 630 → 1730 (80)   雷茲・拉卡塞 637 / 640 → 1740
//   安基拉 647 / 648 → 1747 / 1748   多羅達波 651 → 1751   梅達瑪茶 654 / 655 → 1754 / 1755 (25)   澤勇 658 → 1758 (22)
//   安基拉與梅達瑪茶 661 → 1761
//   the 能量波 of 達列斯一夥・魔凶星一夥・一般兵 (625 629 632 636 639 646 650 653 657 660) → 2431 (124409), the enemies'
//   common wave: for these Z2 enemies the same film as 1445, its hand's place from the table by enemy
// Only for enemies 31-100: the others (the 時之間's 強 enemies, the Z3 switch) keep their earlier films (BEFORE).
// A move on everyone (爆発波, @all_attack_count >= 2) gives the targets after the first a short film without 31 / 32.
// The strips and the cut-ins (the enemy's own row of Z2_敵カットイン, after set_chr_display_out the member's) are
// src/anime_goku_gohan.js's stage. Each film keeps the original's counters (@ax @ay @gx @gy, @effect_anime_*,
// @ray_anime_*, @back_anime_*) so it moves and blinks as the original does — an enemy's @ax flips sign every frame it
// is left unset (output_battle_anime). Frame numbers in the comments are @battle_anime_frame.
import { audio, img } from './core.js?v=20261104-0727';
import { Duel, addMoves, moveFilm, spark, BACK_Y, STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261104-0727';
import { agFilms } from './anime_goku_gohan.js?v=20261104-0727';
import { Battle } from './battle.js?v=20261104-0727';
import { registerZ3, party, heal } from './z3.js?v=20261104-0727';
import { applyLevel } from './party.js?v=20261104-0727';

const FILMS = {
  345: 'fzWave', 346: 'fzSuper', 347: 'fzBlast', // 基紐
  349: 'fzWave', 350: 'fzCrusher', 382: 'fzComet', // 吉斯
  351: 'fzWave', 352: 'fzSpeed', 383: 'fzComet', // 巴特
  353: 'fzWave', 354: 'fzScatter', 355: 'fzSuper', // 利庫姆
  356: 'fzWave', // 古爾多
  358: 'fzWave', 359: 'fzBlast', 360: 'fzSuper', // 弗利薩(第１形態)
  361: 'fzWave', 362: 'fzBlast', 363: 'fzSuper', // 弗利薩(第２形態)
  364: 'fzWave', 365: 'fzBlast', 366: 'fzSuper', // 弗利薩(第３形態)
  367: 'fzWave', 368: 'fzBlast', 369: 'fzSuper', 624: 'fzDeathBall', 694: 'fzKill', // 弗利薩(最終形態)・(全力)
  370: 'fzWave', 371: 'fzBlast', 372: 'fzSuper', 695: 'fzSuperGalick', // 超貝吉塔
  374: 'fzWave', 375: 'fzBurst', 376: 'fzSuper', 377: 'fzMeteor', // 達列斯
  378: 'fzWave', 379: 'fzBurst', 380: 'fzSuper', 381: 'fzMeteorS', // 史拉格
  625: 'fzWave', 626: 'fzKienzan', 627: 'fzPlanetBomb', // 阿蒙德
  632: 'fzWave', 633: 'fzBurst', 634: 'fzSuper', // 戴耶斯
  629: 'fzWave', 630: 'fzCosmic', // 卡卡奧
  636: 'fzWave', 637: 'fzDouble', 639: 'fzWave', 640: 'fzDouble', // 雷茲・拉卡塞
  646: 'fzWave', 647: 'fzSuper', 648: 'fzArm', 661: 'fzArmFrog', // 安基拉
  650: 'fzWave', 651: 'fzSuper', // 多羅達波
  653: 'fzWave', 654: 'fzComet2', 655: 'fzFrog', // 梅達瑪茶
  657: 'fzWave', 658: 'fzImpact', // 澤勇
  660: 'fzWave', // 一般兵
};
// the films these moves had before (the chapters' nearest Z1 films): still played by an enemy of the Z3 switch (the 時之間's
// 強 enemies 197-280 use the same moves; there the original runs the same patterns with the Z3_ pictures and its
// $btl_progress >= 2 branches — not ported here)
const BEFORE = Object.fromEntries(Object.keys(FILMS).map((k) => [k, moveFilm(Number(k))]));
addMoves(FILMS);

const pic = (n) => `Graphics/Pictures/${n}`;
const STD_CHAX = -70, STD_ENEX = 602; // STANDARD_CHAX / STANDARD_ENEX
const st0 = () => (globalThis.__game && globalThis.__game.state) || {};
const duelNow = () => { const g = globalThis.__game; return (g && g.scene && g.scene.duel) || {}; };
const foeId = () => (duelNow().f && duelNow().f.id) || 0; // @enedatenum
// the Z2_ pictures by @ray_color (0 plain, 1 green, 3 blue, 4 red)
const SMALL = { 1: pic('Z2_戦闘_必殺技_エネルギー波_小_敵_緑.PNG'), 3: pic('Z2_戦闘_必殺技_エネルギー波_小_敵_青.PNG'),
  4: pic('Z2_戦闘_必殺技_エネルギー波_小_敵_赤.PNG') }; // effects 227 / 228 / 338-340: 400×48 ×2
const MID = { 1: pic('Z2_戦闘_必殺技_エネルギー波_中_敵_緑.PNG'), 3: pic('Z2_戦闘_必殺技_エネルギー波_中_敵_青.PNG'),
  4: pic('Z2_戦闘_必殺技_エネルギー波_中_敵_赤.PNG') }; // effects 233 / 234: 400×80 ×2
const BIG = { 1: [pic('Z2_戦闘_必殺技_エネルギー波_大(緑).png'), 92], 3: [pic('Z2_戦闘_必殺技_エネルギー波_大_敵_青.PNG'), 122] }; // 239 / 240
const IMPACT = { 0: pic('Z2_戦闘_必殺技_衝撃系.PNG'), 3: pic('Z2_戦闘_必殺技_衝撃系_青.PNG'), 4: pic('Z2_戦闘_必殺技_衝撃系_赤.PNG') }; // 229 / 230: 30×116 ×2
const SCATTER = { 3: pic('Z2_戦闘_必殺技_拡散エネルギー波_青_敵.png'), 4: pic('Z2_戦闘_必殺技_拡散エネルギー波_赤_敵.png') }; // 231 / 232 / 241 / 242: 400×112 ×2
const AURA3 = { 0: pic('Z2_戦闘_必殺技_気を溜める3.png'), 1: pic('Z2_戦闘_必殺技_気を溜める3(緑).png'), 3: pic('Z2_戦闘_必殺技_気を溜める3(青).png'),
  4: pic('Z2_戦闘_必殺技_気を溜める3(赤).png') }; // back 101: 3 frames of 184×240
const AURA4 = { 0: pic('Z2_戦闘_必殺技_気を溜める4.png'), 1: pic('Z2_戦闘_必殺技_気を溜める4(緑).png'), 3: pic('Z2_戦闘_必殺技_気を溜める4(青).png'),
  4: pic('Z2_戦闘_必殺技_気を溜める4(赤).png') }; // back 102: 3 frames of 224×288
const BALL = { 3: pic('Z2_戦闘_必殺技_エネルギー弾(青).PNG'), 4: pic('Z2_戦闘_必殺技_エネルギー弾(赤).PNG') }; // 128×128 frames
const BALL2 = pic('Z2_戦闘_必殺技_エネルギー弾2(青).PNG'); // effects 203 / 204: 96×64 ×2
const SOKI = { 0: pic('Z2_戦闘_必殺技_繰気弾.PNG'), 3: pic('Z2_戦闘_必殺技_繰気弾(青).PNG') }; // effects 220 / 221 / 294: 128×128 frames
const SPEED = pic('Z2_戦闘_必殺技_スピードアタック.PNG'); // effect 205: 236×122
const KIEN = pic('Z2_戦闘_必殺技_気円斬.png'); // effects 218 / 219
const HUGE = pic('Z2_戦闘_必殺技_エネルギー波_特大_青.PNG'); // effects 48 / 295: 400×192 ×2
const BLINK = pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'), BLINK_S = pic('Z3_必殺技_超カメハメ波(球点滅小)(青).png'); // 235 / 237
const BIGBANG = pic('Z3_必殺技_ビッグバンアタック発動(青)_反転.PNG'); // effect 264: 2 frames of 302×200
const DEMON = pic('Z2_戦闘_必殺技_背景_魔族系(縦).png'), SHOCK = pic('Z2_戦闘_必殺技_背景_衝撃波系.png'); // backs 2 / 1
const ARM = pic('Z2_戦闘_必殺技_アンギラ手が伸びる.PNG'); // back 216
const MEDA = pic('Z2_戦闘_必殺技_敵_メダマッチャ.png'), ANGILA = pic('Z2_戦闘_必殺技_敵_アンギラ.png'), REZUN = pic('Z2_戦闘_必殺技_敵_レズン.png');
const JEICE = pic('Z2_戦闘_必殺技_敵_ジース.PNG'), BURTER = pic('Z2_戦闘_必殺技_敵_バータ.PNG'); // back 107
const DEATH_BALL = [pic('Z2_必殺技_デスボール(フリーザフルパワー)一枚絵.png'), pic('Z2_必殺技_デスボール(フリーザフルパワー100)一枚絵.png')];
const SOKI_Z3 = pic('Z3_戦闘_必殺技_繰気弾.PNG'); // the death ball growing over his finger
const KILL = pic('Z2_必殺技_オレに殺されるべきなんだ(フリーザ)_一枚絵.png'), SUPER_GALICK = pic('Z2_必殺技_超ベジータギャリック砲.png');
const BOOM3 = pic('戦闘アニメ_爆発3.PNG'), BOOM4 = pic('戦闘アニメ_爆発4.PNG'), BOOM6 = pic('戦闘アニメ_爆発6.PNG'); // effects 102 / 103 / 105

// a blt as RGSS does it: the source rect clipped to the picture (the destination moves with a clipped left / top)
function blt(c, sheet, sx, sy, w, h, x, y) {
  const e = img(sheet);
  if (!e.ok) return;
  if (sx < 0) { x -= sx; w += sx; sx = 0; }
  if (sy < 0) { y -= sy; h += sy; sy = 0; }
  w = Math.min(w, e.im.width - sx); h = Math.min(h, e.im.height - sy);
  if (w > 0 && h > 0) c.drawImage(e.im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
}
const at = (sheet, sx, sy, w, h, x, y) => (c) => blt(c, sheet, sx, sy, w, h, x, y);
const afterImage = (x, y) => (c) => spark(c, 0, 48, 64, 64, x, y);

// ---------- the moves' settings (each case of the move switch and its pattern) ----------
// 227 / 228 エネルギー波: the attacker's pose, @ray_color, ray_x / ray_y (弗利薩(全力) 57: his own place)
const WAVE = { 345: [1, 3, 316, 144], 349: [1, 3, 316, 144], 351: [1, 1, 308, 144], 353: [2, 4, 316, 140], 356: [1, 3, 336, 160],
  358: [1, 3, 312, 144], 361: [1, 3, 300, 142], 364: [1, 3, 300, 142], 367: [1, 3, 300, 142, 320, 146], 370: [1, 3, 328, 148],
  374: [1, 3, 314, 144], 378: [1, 1, 308, 138],
  // 2431 (敵汎用)エネルギー波: アモンド 65, ダイーズ 66, カカオ 67, レズン 68 (pose 2), ラカセイ 69, アンギラ 72, ドロダボ 73,
  // メダマッチャ 74, ゼエウン 75, スラッグ軍兵士 76
  625: [1, 3, 328, 142], 632: [1, 3, 320, 140], 629: [1, 3, 314, 138], 636: [2, 3, 340, 162], 639: [1, 3, 340, 162],
  646: [1, 3, 324, 142], 650: [1, 3, 308, 142], 653: [1, 3, 326, 154], 657: [1, 3, 310, 140], 660: [1, 3, 314, 154] };
// the aura, then a beam from the hand (effects 233 / 234, 239 / 240, 203 / 204): back, back_x, @ray_color, ray_x / ray_y,
// the poses at 0 / 90 / 110 (null: unchanged), the effects, whether 110 stops the aura's sound
const SUPER = {
  346: { back: 101, bx: 224, color: 3, x: 218, y: 114, p: [null, 1, null], fx: 233 }, // 1446
  355: { back: 101, bx: 230, color: 4, x: 220, y: 116, p: [null, 1, null], fx: 233 }, // 1455 イレイザーガン
  360: { back: 101, bx: 230, color: 3, x: 218, y: 130, p: [2, 3, 3], fx: 233 }, // 1460
  363: { back: 101, bx: 230, color: 3, x: 210, y: 120, p: [0, 1, 1], fx: 233 }, // 1463
  366: { back: 101, bx: 230, color: 3, x: 210, y: 120, p: [0, 1, 1], fx: 233 }, // 1466
  369: { back: 102, bx: 204, color: 3, x: 116, y: 96, p: [0, 1, 1], fx: 239, f57: { x: 142, y: 102, p: [0, 6, 6] } }, // 1469
  372: { back: 102, bx: 214, color: 3, x: 222, y: 124, p: [5, 6, null], fx: 233 }, // 1224 ギャリック砲 (the enemy's place)
  376: { back: 102, bx: 204, color: 3, x: 216, y: 118, p: [0, 1, 1], fx: 233 }, // 1476 キルドライバー
  380: { back: 102, bx: 208, color: 1, x: 120, y: 106, p: [0, 1, 1], fx: 239 }, // 1480 ビッグスマッシャー (@ray_color 1 set on top)
  634: { back: 102, bx: 212, color: 3, x: 170, y: 130, p: [2, 3, null], fx: 203, keep: true }, // 1734 メテオボール
  647: { back: 101, bx: 234, color: 3, x: 250, y: 120, p: [0, 2, null], fx: 233, keep: true }, // 1747 エビルクエーサー
  651: { back: 101, bx: 230, color: 3, x: 212, y: 120, p: [2, 3, null], fx: 233, keep: true }, // 1751 エビルグラビティ
};
// 229 / 230 爆発波: back_x, ray_x, the poses at 0 / 90 / 141 (弗利薩(全力) 57: 5 at 141)
const BLAST = { 347: [224, 270, 0, 0, 2], 359: [230, 270, 2, 2, 4], 362: [230, 270, 0, 0, 2], 365: [230, 270, 0, 0, 2],
  368: [230, 270, 0, 0, 2, 5], 371: [234, 262, 0, 0, 2] };
// the demon backdrop, then the shock streaks (1475 / 1479 / 1733): back_x, the sound at 101, the sounds of the short film
const BURST = { 375: [226, ['Z1 ザー'], ['Z1 ザー']], 379: [226, ['Z1 エネルギー波'], ['Z1 ザー', 'Z1 ゴー']],
  633: [226, ['Z1 エネルギー波'], ['Z1 ザー', 'Z1 ゴー']] };
// @chr_cutin_flag before pattern 32 (the enemy's cut-in from its frame 30)
const CUT = new Set([346, 347, 350, 352, 355, 356, 359, 362, 363, 365, 366, 368, 369, 371, 372, 376, 377, 379, 380, 381, 382, 383, 375, 624,
  694, 695, 626, 627, 630, 633, 634, 637, 640, 647, 648, 651, 654, 655, 658, 661]);
// the damage pattern after the film (23 unless named)
const DAMAGE = { 352: 'shock', 372: 'zd41', 377: 'zd41', 381: 'zd41', 624: 'zd42', 694: 'zd44', 695: 'zd44', 630: 'cosmic',
  655: 'psychic', 658: 'shock' };
// moves on everyone: the short film for each further target, and whether it keeps the strips (@tec_output_back)
const AGAIN = { 347: true, 359: true, 362: true, 365: true, 368: true, 371: true, 375: false, 379: false, 633: false, 654: true };
let againEnd = -1e9, againSkill = 0;

// the pictures each film shows (loaded while it swoops in)
const colorOf = (sk) => (WAVE[sk] ? WAVE[sk][1] : SUPER[sk] ? SUPER[sk].color : 3);
const FOE = { get foe() { return z2Foe(); } }; // (src/anime_goku_gohan.js launch: the stage for an enemy's film)
agFilms({
  fzWave: [() => [SMALL[colorOf(duelSkill())]], FOE],
  fzSuper: [() => { const s = SUPER[duelSkill()] || SUPER[346]; return [(s.back === 101 ? AURA3 : AURA4)[s.color],
    s.fx === 239 ? BIG[s.color][0] : s.fx === 203 ? BALL2 : MID[s.color], MID[3], BOOM3]; }, FOE],
  fzBlast: [() => [AURA3[3], IMPACT[3]], FOE],
  fzBurst: [() => [AURA3[3], DEMON, SHOCK], FOE],
  fzCrusher: [() => [AURA3[3], SOKI[3]], FOE],
  fzSpeed: [() => [AURA3[1], SPEED], FOE],
  fzScatter: [() => [AURA3[4], SCATTER[4]], FOE],
  fzComet: [() => [BALL[3], BALL[4], JEICE, BURTER, SCATTER[3], SCATTER[4]], FOE],
  fzDeathBall: [() => [AURA4[3], DEATH_BALL[0], DEATH_BALL[1], SOKI_Z3, SOKI[0], BOOM4], FOE],
  fzKill: [() => [AURA4[3], KILL, BLINK, BIGBANG, HUGE, BOOM6], FOE],
  fzSuperGalick: [() => [AURA4[3], SUPER_GALICK, BLINK, HUGE, BOOM6], FOE],
  fzMeteor: [() => [AURA4[3], BLINK, BLINK_S, BOOM3], FOE],
  fzMeteorS: [() => [AURA4[3], MID[3], BOOM3], FOE],
  fzKienzan: [() => [AURA3[3], KIEN], FOE],
  fzPlanetBomb: [() => [AURA4[3], SHOCK], FOE],
  fzCosmic: [() => [AURA4[3]], FOE],
  fzDouble: [() => [AURA3[3], REZUN, SMALL[3]], FOE],
  fzArm: [() => [AURA3[3], ARM, MID[3]], FOE],
  fzArmFrog: [() => [AURA3[3], ARM, MEDA, ANGILA, MID[3], BOOM3], FOE],
  fzComet2: [() => [AURA3[3], DEMON, BALL[3], SMALL[3]], FOE],
  fzFrog: [() => [AURA3[3], MEDA], FOE],
  fzImpact: [() => [AURA3[3], SHOCK], FOE],
});
const z2Foe = () => { const id = foeId(); return id >= 31 && id < 101; };
function duelSkill() { const g = globalThis.__game, a = g && g.scene && g.scene.anim; return (a && a.skill) || 0; }

// the short film of a move on everyone (no 31 / 32: the attacker is already gone, the ground already down)
const swoop0 = Duel.prototype.swoopIn, launch0 = Duel.prototype.launch, step0 = Duel.prototype.step;
const mine = (d) => d.constructor === Duel && !d.p && FILMS[d.skill] && z2Foe();
Object.assign(Duel.prototype, {
  * swoopIn() {
    this.fzAgain = !!mine(this) && this.skill in AGAIN && againSkill === this.skill && performance.now() - againEnd < 500;
    if (!this.fzAgain) return yield* swoop0.call(this);
    this.back.y = BACK_Y + 79 * 4;
  },
  * launch() {
    if (!mine(this)) return yield* launch0.call(this);
    const st = this.agStage();
    if (this.fzAgain) { // @tec_output_back / @chr_cutin / @chr_cutin_mirror_flag set before the film
      if (AGAIN[this.skill]) st.tec(true);
      st.cut(true, true);
      return;
    }
    if (CUT.has(this.skill) && st.era) st.cutFrom = this.t + 29; // (src/anime_goku_gohan.js launch: the strips from frame 30 too)
    yield* launch0.call(this);
  },
  step() {
    step0.call(this);
    if (this.done && !this.fzStamped && mine(this) && this.skill in AGAIN) { this.fzStamped = true; againEnd = performance.now(); againSkill = this.skill; }
  },
});

Object.assign(Duel.prototype, {
  // one film (or damage pattern) on the stage: body(f, r) is the pattern's case for frame f (r: the original's
  // counters; r.U what it blts itself, under the fighters; r.x / r.y the frame's ray_x / ray_y, unset each frame like
  // the original's locals); it may return a frame to go on from (@battle_anime_frame = n). Then output_battle_anime
  // (the moves; the enemy's @ax flips sign every frame) and effect_pattern on top. The last frame is
  // anime_pattern_fromat: the fighters move and show once more, no effect.
  * fzRun(st, last, body) {
    const A = this.A, r = { ax: 0, ay: 0, gx: 0, gy: 0, ot: 0, ep: 0, ef: 0, et: 0, rt: 0, rf: 0, bt: 0, bf: 0, x: 0, y: 0, color: 3, U: [] };
    // back_anime_pattern: the picture, then the counters (the next of `n` every `every` frames; @back_anime_frame + 1)
    r.backCyc = (draw, every, n) => {
      r.U.push(draw);
      if (r.bf >= every && r.bt !== n - 1) { r.bt++; r.bf = 0; } else if (r.bf >= every) { r.bt = 0; r.bf = 0; }
      r.bf++;
    };
    r.back101 = (x, y) => { const p = AURA3[r.color]; const k = r.bt; r.backCyc(at(p, k * 184, 0, 184, 240, x, y), 4, 3); };
    r.back102 = (x, y) => { const p = AURA4[r.color]; const k = r.bt; r.backCyc(at(p, k * 224, 0, 224, 288, x, y - 36), 4, 3); };
    r.back2 = () => { const k = r.bt; r.backCyc(at(DEMON, 0, k * 480, 640, 356, 0, 0), 4, 3); };
    r.back1 = () => { // the shock streaks (a big defender: only the top and bottom 42)
      const k = r.bt;
      if ((this.G.sheets.size || 96) === 192) r.backCyc((c) => { blt(c, SHOCK, 0, k * 180, 640, 42, 0, 32); blt(c, SHOCK, 0, 138 + k * 180, 640, 42, 0, 266); }, 4, 3);
      else r.backCyc(at(SHOCK, 0, k * 180, 640, 180, 0, 80), 4, 3);
    };
    r.back216 = (x, y) => { r.U.push(at(ARM, 0, 0, 26 + r.bf * RAY_SPEED, 24, x - r.bf * RAY_SPEED, y)); r.bf++; }; // アンギラ手が伸びる
    r.fxOff = () => { r.ep = 0; r.ef = 0; r.et = 0; };
    for (let f = 0; f <= last; f++) {
      r.U = []; r.x = 0; r.y = 0;
      const jump = body(f, r);
      A.sp = r.ot === 1;
      this.vel(r.ax, r.ay, r.gx, r.gy); r.ax = -r.ax;
      const O = [];
      if (f < last && r.ep) this.fzEffect(r, O);
      st.under = r.U; st.over = O;
      yield;
      if (typeof jump === 'number') f = jump;
    }
  },

  // set_chr_display_out (the enemy attacking): it leaves, the member stands in the middle as it is; the member's cut-in
  // from now on
  fzOut(st) {
    this.R.y = -200;
    this.L.x = CENTER_CHAX; this.L.y = STD_Y;
    if (st.cutFrom !== Infinity) st.mirror = true;
  },

  // effect_pattern with @attackcourse 1 at ray_x / ray_y = r.x / r.y; then @ray_anime_frame and @effect_anime_frame count on
  fzEffect(r, O) {
    const A = this.A, G = this.G, ef = r.ef, x = r.x, y = r.y, d = ef * RAY_SPEED;
    const ray4 = (every, n) => { if (r.rf >= every && r.rt !== n - 1) { r.rt++; r.rf = 0; } else if (r.rf >= every) { r.rt = 0; r.rf = 0; } };
    switch (r.ep) {
      case 16: case 18: { // エネルギー弾系(正面) (カイワレマン系頭 / サンショ手の位置): the picture first, then the next every 10
        const k = r.et;
        if (r.ef >= 10) { r.et++; r.ef = 0; }
        const [dx, dy] = x ? [x, y] : r.ep === 16 ? [249, 112] : [230, 104];
        O.push(at(BALL[r.color === 4 ? 4 : 3], k * 128, 0, 128, 128, dx, dy));
        break;
      }
      case 48: O.push(at(HUGE, 0, 192, 400, 192, 640 - d, 76)); break; // かめはめ波系(特大)横
      case 121: { // 攻撃ヒット: at the attacker's fist and on the defender (5-10: the original's own @chay for the first)
        if (ef > 10) break;
        const a = [A.x - 32, (ef <= 4 ? A.y : G.y) + 32], gx = G.x + 64, gy = G.y;
        O.push((c) => { spark(c, ef <= 4 ? 0 : 32, 16, 32, 32, a[0], a[1]); spark(c, 32, 0, 32, 16, gx, gy); });
        break;
      }
      case 203: O.push(at(BALL2, 0, 64, 96, 64, x - d, y)); break; // かめはめ波系(発動)
      case 204: O.push(at(BALL2, 0, 64, 96, 64, 640 - d, 144)); break; // (ヒット)
      case 205: O.push(at(SPEED, 0, 0, 236, 122, 640 - d, 120)); break; // 界王拳系(ヒット) (@ray_color 1: スピードアタック)
      case 218: O.push(at(KIEN, 0, 0, 128, 44, x - d, y)); break; // 気円斬系(発動)
      case 219: O.push(at(KIEN, 0, 0, 192, 128, 640 - d, 150)); break; // (ヒット)
      case 220: r.et = 2; O.push(at(SOKI[3], 256, 0, 128, 128, x - d, y)); break; // 繰気弾系(発動)
      case 221: r.et = 2; O.push(at(SOKI[3], 256, 0, 128, 128, 640 - d, 120)); break; // (ヒット)
      case 227: O.push(at(SMALL[r.color], 352 - d, 0, 48 + d, 48, x - 92 - d, y - 10)); break; // エネルギー波_小系(発動)敵
      case 228: O.push(at(SMALL[r.color], 0, 48, 400, 48, 640 - d + 64, 148)); break; // (ヒット敵)
      case 229: O.push(at(IMPACT[r.color] || IMPACT[0], 0, 116, 30, 116, x - d, y)); break; // 衝撃波系(発動)敵
      case 230: O.push(at(IMPACT[r.color] || IMPACT[0], 0, 116, 30, 116, 640 - d, y)); break; // (ヒット)敵
      case 231: O.push(at(SCATTER[r.color === 4 ? 4 : 3], 346 - d, 112, 54 + d, 112, x - d, y)); break; // 拡散エネルギー波系(発動)
      case 232: O.push(at(SCATTER[r.color === 4 ? 4 : 3], 0, 0, 400, 112, 640 - d, 122)); break; // (ヒット)
      case 233: O.push(at(MID[r.color === 4 ? 4 : 3], 346 - d, 0, 54 + d, 80, x - d, y)); break; // 口から怪光線ドドリア系(発動)
      case 234: O.push(at(MID[r.color === 1 ? 1 : r.color === 4 ? 4 : 3], 0, 80, 400, 80, 640 - d, y)); break; // (ヒット)
      case 235: O.push(at(BLINK, 32 * r.rt, 0, 32, 32, x, y)); ray4(4, 5); break; // スーパーカメハメ波ため
      case 237: O.push(at(BLINK_S, 16 * r.rt, 0, 16, 16, x, y)); ray4(4, 5); break; // ファイナルリベンジャーため(小)
      case 239: { const [p, h] = BIG[r.color === 1 ? 1 : 3]; O.push(at(p, 256 - d, 0, 144 + d, h, x - d, y)); break; } // エネルギーは大(発動)
      case 240: { const [p, h] = BIG[r.color === 1 ? 1 : 3]; O.push(at(p, 0, h, 400, h, 640 - d, y)); break; } // (ヒット)
      case 241: O.push(at(SCATTER[r.rt === 0 ? 3 : 4], 346 - d, 112, 54 + d, 112, x - d, y)); ray4(2, 3); break; // パープルコメット(発動)
      case 242: O.push(at(SCATTER[r.rt === 0 ? 3 : 4], 0, 0, 400, 112, 640 - d, 122)); ray4(2, 3); break; // (ヒット)
      case 264: O.push(at(BIGBANG, 302 * r.rt, 0, 302, 200, x, y)); ray4(4, 2); break; // ビッグバンアタック
      case 294: r.et = 4; O.push(at(SOKI[r.color === 3 ? 3 : 0], 512, 0, 128, 128, 640 - d, 114)); break; // 繰気弾系(ヒット)
      case 295: O.push(at(HUGE, 400 - 192 - d, 0, 400 - 192 + d, 192, x - d, y)); break; // Z3エネルギー波_特大発動
      case 338: { // ダブルエネルギー波_小系(発動)敵
        const s = at(SMALL[3], 352 - d, 0, 48 + d, 48, x - 92 + 84 - d, y - 10 - 96 + 2);
        O.push(s, at(SMALL[3], 352 - d, 0, 48 + d, 48, x - 92 + 84 - d, y - 10 - 96 + 2 + 100));
        break;
      }
      case 339: O.push(at(SMALL[3], 0, 48, 640, 48, 640 - d, y - 10 - 96 + 2 + 24), at(SMALL[3], 0, 48, 640, 48, 640 - d, y - 10 - 96 + 2 + 100 - 24)); break;
      case 340: for (const k of [-24, 24, -48, 48]) O.push(at(SMALL[3], 0, 48, 640, 48, 640 - d, y + k)); break; // エビルコメットヒット
      case 341: { // カエル攻撃ヒット: the four frogs flying in from the right
        const row = ef < 16 ? 12 : 11, t = Math.min(ef, 27), kx = t * 16, ky = -t * 2;
        for (const [dx, dy] of [[-8 + 14, -34 - 14], [-16, -42 - 14], [-32, -42 - 14], [-40 - 14, -34 - 14]]) O.push(at(MEDA, 0, 96 * row, 96, 96, 640 + dx - kx, 80 + dy - ky));
        break;
      }
      case 102: case 103: case 105: { // 爆発中 / 大 / 特大Z2 (@attackcourse 1): the picture first, the next every 10
        const k = r.et;
        if (r.ef >= 10) { r.et++; r.ef = 0; }
        const [p, w, h, px, py] = r.ep === 102 ? [BOOM3, 112, 120, 230, 120] : r.ep === 103 ? [BOOM4, 176, 144, 204, 120] : [BOOM6, 256, 256, 204 - 56, 110 - 64];
        O.push(at(p, k * w, 0, w, h, px, py));
        break;
      }
      default:
    }
    r.rf++; r.ef++;
  },

  // the film is over: the strips and the cut-in stay through the damage. 41 / 42 / 44 (爆発系ZD中 / ZD大 / Z2特大) and
  // 80 (卡卡奧's コズミックアタック) are played here; the rest by src/anime.js (23 beam, 22 shock, 25 psychic)
  * fzEnd(st, kind) {
    st.under = []; st.over = [];
    if (!['zd41', 'zd42', 'zd44', 'cosmic'].includes(kind)) return kind;
    if (!this.hit) return 'miss'; // (src/anime.js run: the defender dodges)
    const A = this.A, G = this.G;
    if (kind === 'cosmic') {
      yield* this.fzRun(st, 60, (f, r) => {
        if (f === 0) { this.showHit(); r.ot = 1; this.pose(A, 3); this.pose(G, 17); this.se('Z1 エネルギー波2'); this.se('ZG 打撃4'); }
        if (f >= 1 && f <= 29) { r.ax = 24; r.gx = -20; }
        if (f === 50) { r.gx = 0; r.ep = 0; }
      });
    } else {
      const [se, ep] = { zd41: ['ZG 光線系ヒット2', 102], zd42: ['ZG 光線系ヒット3', 103], zd44: ['DB3 大爆発', 105] }[kind];
      yield* this.fzRun(st, 60, (f, r) => {
        if (f === 0) { this.se(se); this.showHit(); r.ep = ep; this.pose(G, 17); }
        if (f >= 21 && f <= 39) r.gx = -20;
        if (f === 40) { r.gx = 0; r.ep = 0; }
      });
    }
    st.under = []; st.over = [];
    return 'none';
  },
  fzDamage(st) { return this.fzEnd(st, DAMAGE[this.skill] || 'beam'); },

  // ---------- the common films ----------
  * fzWave() { // 1445 / 1449 / 1451 / 1453 / 1456 / 1458 / 1461 / 1464 / 1467 / 1431 / 1474 / 1478: a small wave from the hand
    const st = this.agStage(), w = WAVE[this.skill], f57 = foeId() === 57 && w[4];
    yield* this.fzRun(st, 76, (f, r) => {
      r.color = w[1];
      if (f === 0) { this.se('Z1 怪光線'); r.ot = 1; this.pose(this.A, w[0]); }
      if (f >= 1 && f <= 40) { r.ep = 227; r.x = f57 ? w[4] : w[2]; r.y = f57 ? w[5] : w[3]; }
      if (f === 41) r.fxOff();
      if (f === 45) this.fzOut(st);
      if (f >= 46 && f <= 75) r.ep = 228;
    });
    return yield* this.fzDamage(st);
  },

  * fzSuper() { // the aura, then a beam from the hand: 1446 1455 1460 1463 1466 1469 1224 1476 1480 1734 1747 1751
    const st = this.agStage(), s = SUPER[this.skill], o = (foeId() === 57 && s.f57) || s;
    const [fx1, fx2] = { 233: [233, 234], 239: [239, 240], 203: [203, 204] }[s.fx];
    yield* this.fzRun(st, 187, (f, r) => {
      r.color = s.color; r.x = o.x; r.y = o.y;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; if (o.p[0] != null) this.pose(this.A, o.p[0]); }
      if (f >= 1 && f <= 89) (s.back === 101 ? r.back101 : r.back102)(s.bx, 32);
      if (f === 90) { audio.seStop(); this.pose(this.A, o.p[1]); }
      if (f === 110) { if (!s.keep) audio.seStop(); this.se('Z1 エネルギー波2'); if (o.p[2] != null) this.pose(this.A, o.p[2]); r.ep = fx1; }
      if (f === 149) r.fxOff();
      if (f === 159) this.fzOut(st);
      if (f >= 160 && f <= 186) r.ep = fx2;
    });
    return yield* this.fzDamage(st);
  },

  * fzBlast() { // 1447 / 1459 / 1462 / 1465 / 1468 / 1223 爆発波: the aura, the burst (229), the shock on the member (230)
    const st = this.agStage(), [bx, x, p0, p90, p141, p57] = BLAST[this.skill], pHit = foeId() === 57 && p57 ? p57 : p141;
    if (this.fzAgain) { // @all_attack_count >= 2
      yield* this.fzRun(st, 26, (f, r) => {
        r.x = x; r.y = 96;
        if (f === 0) { this.se('Z1 ザー'); r.ep = 230; r.ot = 0; this.L.x = CENTER_CHAX; this.L.y = STD_Y; }
        if (f >= 1 && f <= 25) r.ep = 230;
      });
      return yield* this.fzDamage(st);
    }
    yield* this.fzRun(st, 218, (f, r) => {
      r.x = x; r.y = 96;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; this.pose(this.A, p0); }
      if (f >= 1 && f <= 140) { if (f === 90) { audio.seStop(); this.pose(this.A, p90); } r.back101(bx, 32); }
      if (f === 141) { audio.seStop(); this.se('Z1 ザー'); this.pose(this.A, pHit); r.ep = 229; }
      if (f === 180) { this.pose(this.A, pHit); r.fxOff(); }
      if (f === 190) this.fzOut(st);
      if (f >= 191 && f <= 217) r.ep = 230;
    });
    return yield* this.fzDamage(st);
  },

  * fzBurst() { // 1475 / 1479 / 1733 爆発波: the aura, the demon backdrop, the shock streaks behind the member
    const st = this.agStage(), [bx, se, seAgain] = BURST[this.skill], A = this.A;
    if (this.fzAgain) {
      yield* this.fzRun(st, 62, (f, r) => {
        if (f === 0) { seAgain.forEach((n) => this.se(n)); A.y = -200; this.L.x = CENTER_CHAX; this.L.y = STD_Y; }
        if (f >= 1 && f <= 61) { r.back1(); st.cut(true, true); }
      });
      return yield* this.fzDamage(st);
    }
    yield* this.fzRun(st, 243, (f, r) => {
      if (f === 0) this.se('Z2 気を溜める');
      if (f >= 1 && f <= 100) r.back101(bx, 32);
      if (f === 101) { st.cut(false); st.tec(false); audio.seStop(); se.forEach((n) => this.se(n)); r.back2(); }
      if (f >= 102 && f <= 180) { r.back2(); r.ot = 1; this.pose(A, 4); }
      if (f === 181) { A.y = -200; this.L.x = CENTER_CHAX; this.L.y = STD_Y; }
      if (f >= 182 && f <= 242) { st.cut(true, true); r.back1(); }
    });
    return yield* this.fzDamage(st);
  },

  // ---------- ギニュー特戦隊 ----------
  * fzCrusher() { // 1450 クラッシャーボール(ジース): the aura, the poses winding up, the ball thrown
    const st = this.agStage(), A = this.A;
    yield* this.fzRun(st, 237, (f, r) => {
      r.x = 210; r.y = 120;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; }
      if (f >= 1 && f <= 89) r.back101(232, 32);
      if (f === 90) audio.seStop();
      const pose = { 90: 2, 100: 3, 110: 4, 120: 5, 130: 4, 140: 6, 150: 4 }[f];
      if (pose != null) this.pose(A, pose);
      if (f === 160) { audio.seStop(); this.se('Z1 エネルギー波'); this.pose(A, 6); r.ep = 220; }
      if (f === 199) { this.pose(A, 6); r.fxOff(); }
      if (f === 209) this.fzOut(st);
      if (f >= 210 && f <= 236) r.ep = 221;
    });
    return yield* this.fzDamage(st);
  },

  * fzSpeed() { // 1452 スピードアタック(バータ): the aura, he vanishes at high speed, the rush across the member
    const st = this.agStage(), L = this.L;
    yield* this.fzRun(st, 160, (f, r) => {
      r.color = 1;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; }
      if (f >= 1 && f <= 89) r.back101(220, 32);
      if (f === 90) { audio.seStop(); this.se('Z1 高速移動'); this.R.y = -200; L.x = CENTER_CHAX + 20; }
      if (f >= 91 && f <= 130) { r.back101(220, 32); if (f % 4 === 0) r.U.push(afterImage(L.x + 20, 144)); }
      if (f === 131) { this.fzOut(st); this.se('Z1 逃げる'); L.x = CENTER_CHAX; L.y = STD_Y; }
      if (f >= 132 && f <= 159) r.ep = 205;
    });
    return yield* this.fzDamage(st);
  },

  * fzScatter() { // 1454 (リクーム系)連続エネルギー波: the aura, the poses, the red spread of waves
    const st = this.agStage(), A = this.A;
    yield* this.fzRun(st, 197, (f, r) => {
      r.x = 226; r.y = 104;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; r.color = 4; }
      if (f >= 1 && f <= 89) r.back101(230, 32);
      if (f === 90) { audio.seStop(); this.pose(A, 3); }
      if (f === 100) this.pose(A, 4);
      if (f === 110) this.pose(A, 2);
      if (f === 120) { audio.seStop(); this.se('Z1 エネルギー波'); r.ep = 231; r.color = 4; }
      if (f === 159) r.fxOff();
      if (f === 169) this.fzOut(st);
      if (f >= 170 && f <= 196) r.ep = 232;
    });
    return yield* this.fzDamage(st);
  },

  * fzComet() { // 1482 パープルコメットクラッシュ (吉斯・巴特): both charge in turn, the two balls meet, the purple wave
    const st = this.agStage(), jeice = [49, 248].includes(foeId()), A = this.A;
    // back 107: the ball (type 0) and the partner's picture (1 / 2, 巴特 when blue) at his place, the next every 2
    const back107 = (r, bx) => {
      const k = r.bt, color = r.color;
      r.backCyc(k === 0 ? at(BALL[color], 5 * 128, 0, 128, 128, bx, 114) : at(color === 3 ? BURTER : JEICE, 0, 96 * 2, 96, 96, A.x, STD_Y), 2, 3);
    };
    yield* this.fzRun(st, 373, (f, r) => {
      r.x = 236; r.y = 122;
      if (f === 0) { A.y = -200; this.se('Z2 気を溜める'); r.ot = 1; this.pose(A, 2); }
      if (f >= 1 && f <= 89) { r.color = jeice ? 4 : 3; back107(r, jeice ? 262 : 256); }
      if (f === 90) { audio.seStop(); this.se('Z2 気を溜める'); }
      if (f >= 91 && f <= 179) { r.color = jeice ? 3 : 4; back107(r, jeice ? 256 : 262); }
      if (f === 180) { audio.seStop(); this.se('Z1 気を溜める4'); r.bf = 0; r.rt = 0; r.rf = 0; }
      if (f >= 181 && f <= 217) { // back 108: the blue ball from the left, the red one from the right
        const b = r.bf;
        r.U.push(at(BALL[3], 640, 0, 128, 128, STD_CHAX + b * 10, STD_Y), at(BALL[4], 640, 0, 128, 128, STD_ENEX - b * 10 + 60, STD_Y));
        r.bf++;
      }
      if (f >= 218 && f <= 340) { const k = r.bt; r.backCyc(at(BALL[k === 0 ? 3 : 4], 640, 0, 128, 128, CENTER_ENEX, STD_Y), 2, 3); } // back 109
      if (f === 300) this.se('Z1 エネルギー波2');
      if (f >= 301 && f <= 340) r.ep = 241;
      if (f === 341) r.fxOff();
      if (f === 345) this.fzOut(st);
      if (f >= 346 && f <= 372) r.ep = 242;
    });
    return yield* this.fzDamage(st);
  },
});

// the frogs of カエル攻撃 (1755 / 1761): four, each jumping up out of the attacker in turn (7 frames, the next every 30),
// then all four leaping left together
const FROGS = [[-8, -34, 2, -2], [-16, -42, 0, -2], [-32, -42, 0, -2], [-40, -34, -2, -2]]; // place, then how it moves a frame
function frogs(r, x, y, d, k) { // d: frames since they began (k: the jumping counter, counted here as the original does)
  const i = [1, 31, 61, 91].findIndex((s) => d >= s && d <= s + 6);
  if (i >= 0) { const [fx, fy, mx, my] = FROGS[i]; r.U.push(at(MEDA, 0, 96 * 11, 96, 96, x + fx + mx * k.n, y + fy + my * k.n)); k.n++; }
  FROGS.forEach(([fx, fy, mx, my], j) => { if (d > [7, 37, 67, 97][j]) r.U.push(at(MEDA, 0, 96 * 11, 96, 96, x + fx + mx * 7, y + fy + my * 7)); });
}
function frogsLeap(r, x, y, t) { // all four leaping left (16 a frame, rising 2)
  FROGS.forEach(([fx, fy, mx, my]) => r.U.push(at(MEDA, 0, 96 * 12, 96, 96, x + fx + mx * 7 - t * 16, y + fy + my * 7 - t * 2)));
}

Object.assign(Duel.prototype, {
  // ---------- 弗利薩 ----------
  * fzDeathBall() { // 1724 デスボール: the aura, the picture of him with the ball growing on his finger, it falls on the member
    const st = this.agStage(), A = this.A, full = [57, 279].includes(foeId());
    const s = 129, k = 30;
    yield* this.fzRun(st, 456, (f, r) => {
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; r.color = 3; this.pose(A, 0); }
      if (f >= 1 && f <= 128) r.back102(204, 32);
      if (f >= 129 && f <= 429) {
        st.cut(false); r.color = 0; st.tecNo = 1;
        let ky = 4;
        if (f === s) { audio.seStop(); this.se('Z1 気を溜める2'); this.se('Z1 ザー'); }
        A.y = -160;
        r.U.push(at(DEATH_BALL[full ? 1 : 0], 0, 0, 108, 240, 264, 78));
        const g = f - (s + 15);
        if (g >= k && g < 2 * k) r.rt = 1;
        else if (g >= 2 * k && g < 3 * k) r.rt = 2;
        else if (g >= 3 * k && g < 4 * k) r.rt = 3;
        else if (g >= 4 * k && g < 5 * k) r.rt = 4;
        else if (g >= 5 * k && g < 6 * k) { r.rt = 4; ky -= 54; } else if (g >= 6 * k && g < 11 * k) {
          if (g === 6 * k) { audio.seStop(); this.se('Z1 エネルギー波2'); }
          r.rt = 4; ky -= 54 + 4 * (g - 6 * k);
        }
        if (g < 5 * k) { // (before it is full: a size smaller every 12th frame — before 174 it is below nothing)
          if (f % 12 === 0) r.rt -= 1;
          ky -= [0, 6, 22, 38, 54][r.rt] || 0;
        }
        if (f - s > 15) r.U.push(at(SOKI_Z3, r.rt * 128, 0, 128, 128, 256, ky));
      }
      if (f === 430) { r.fxOff(); st.tecNo = 0; this.fzOut(st); this.se('Z1 エネルギー波'); }
      if (f >= 431 && f <= 455) r.ep = 294;
    });
    return yield* this.fzDamage(st);
  },

  * fzKill() { // 1794 オレに殺されるべきなんだ (弗利薩(全力)): the aura, the close-up with the ball, the big bang, the huge wave
    const st = this.agStage(), A = this.A, L = this.L;
    yield* this.fzRun(st, 337, (f, r) => {
      r.y = 158;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; r.color = 3; this.pose(A, 15); }
      if (f >= 1 && f <= 128) { r.back102(204, 32); if (f === 128) { st.tecNo = 2; A.y = -200; st.cut(false); } }
      if (f >= 129 && f <= 300) {
        if (f === 129) audio.seStop();
        L.y = -160;
        const sh = f >= 231 && f <= 233 ? 2 : f === 234 ? 4 : f === 235 ? 2 : 0; // (232 / 233 are caught by the first branch)
        r.U.push(at(KILL, 0, 0, 150, 198, 226 + sh, 80 - sh));
        if (f >= 140 && f <= 230) { if (f === 140) this.se('DB3 気を溜める2'); r.x = 260; r.y = 228; r.ep = 235; }
        if (f === 231) { this.se('Z1 エネルギー波'); this.se('Z1 ゴー'); r.rt = 0; r.rf = 0; r.ep = 264; }
      }
      if (f === 301) { st.cut(true); r.fxOff(); st.tecNo = 0; this.fzOut(st); }
      if (f >= 311 && f <= 336) { r.y = 112; r.ep = 48; }
    });
    return yield* this.fzDamage(st);
  },

  // ---------- 超貝吉塔 ----------
  * fzSuperGalick() { // 1795 スーパーギャリック砲: the aura, his picture with the ball, the huge wave
    const st = this.agStage(), A = this.A, L = this.L;
    yield* this.fzRun(st, 337, (f, r) => {
      r.y = 158;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; r.color = 3; this.pose(A, 5); }
      if (f >= 1 && f <= 128) { r.back102(204, 32); if (f === 128) { st.tecNo = 2; A.y = -200; st.cut(false); } }
      if (f >= 129 && f <= 250) {
        if (f === 129) { audio.seStop(); this.se('DB3 気を溜める2'); }
        L.y = -160;
        r.U.push(at(SUPER_GALICK, 0, 0, 360, 282, 106, 40));
        r.x = 278; r.y = 66; r.ep = 235;
        if (f === 250) { st.cut(true); st.tecNo = 0; }
      }
      if (f >= 251 && f <= 300) {
        if (f === 251) { audio.seStop(); this.se('Z1 エネルギー波2'); r.ef = 0; r.ep = 295; this.pose(A, 6); A.y = STD_Y; }
        r.x = 86; r.y = 68;
      }
      if (f === 301) { st.cut(true); r.fxOff(); st.tecNo = 0; this.fzOut(st); }
      if (f >= 311 && f <= 336) { r.y = 112; r.ep = 48; }
    });
    return yield* this.fzDamage(st);
  },

  // ---------- 達列斯・史拉格 ----------
  * fzMeteor() { // 1477 メテオバースト(ターレス): he flies in, two blows, he vanishes, then the ball from close by
    const st = this.agStage(), A = this.A, L = this.L, G = this.G;
    yield* this.fzRun(st, 401, (f, r) => {
      r.x = 210; r.y = 120;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; r.color = 3; this.pose(A, 0); }
      if (f >= 1 && f <= 89) r.back102(204, 32);
      if (f === 90) { audio.seStop(); this.se('Z1 飛ぶ'); this.pose(A, 3); }
      if (f >= 91 && f <= 119) r.ax = 16;
      if (f === 126) { r.ax = 0; this.fzOut(st); A.x = STD_ENEX; A.y = STD_Y; }
      if (f >= 127 && f <= 133) r.ax = 16;
      if (f >= 134 && f <= 140) { r.ax = 16; r.ot = 0; this.pose(A, 16); }
      if (f >= 141 && f <= 147) { r.ax = 16; r.ot = 0; this.pose(A, 3); }
      if (f >= 148 && f <= 180) {
        if (f === 148) { this.se('Z1 強打'); r.fxOff(); }
        r.ax = 0; r.ay = 0; r.gx = -16; this.pose(G, 16); r.ep = 121;
      }
      if (f === 181) { audio.seStop(); this.se('Z1 飛ぶ'); r.gx = 0; r.ot = 1; this.pose(A, 3); }
      if (f >= 182 && f <= 219) r.ax = 16;
      if (f === 226) { r.ax = 0; this.fzOut(st); L.x = STD_ENEX - 100; A.x = STD_ENEX + 40; A.y = STD_Y; }
      if (f >= 227 && f <= 233) { r.ax = 16; r.gx = -10; }
      if (f >= 234 && f <= 240) r.ax = 16;
      if (f >= 241 && f <= 247) { r.ax = 16; r.ot = 0; this.pose(A, 2); }
      if (f >= 248 && f <= 280) {
        if (f === 248) { this.se('ZG 打撃2'); r.fxOff(); }
        r.ax = 0; r.ay = 0; r.gx = -15; this.pose(G, 17); r.ep = 121;
      }
      if (f === 281) { audio.seStop(); this.se('Z1 高速移動'); A.y = -200; }
      if (f >= 282 && f <= 300 && f % 4 === 0) r.U.push(afterImage(A.x + 20, 144));
      if (f === 306) { r.ax = 0; r.gx = 0; this.fzOut(st); A.x = CENTER_ENEX; A.y = -200; }
      if (f >= 307 && f <= 325 && f % 4 === 0) r.U.push(afterImage(A.x + 20, 144));
      if (f === 326) { A.y = STD_Y; r.ot = 1; this.pose(A, 1); this.se('Z1 エネルギー波'); }
      if (f >= 327 && f <= 340) { r.x = CENTER_ENEX - 4; r.y = STD_Y + 32; r.ep = 237; }
      if (f >= 341 && f <= 400) { r.x = CENTER_ENEX - 20; r.y = STD_Y + 24; r.ep = 235; }
      if (f === 401) A.y = -200;
    });
    return yield* this.fzDamage(st);
  },

  * fzMeteorS() { // 1481 メテオバースト(スラッグ): he flies in, a blow, he shakes the member, it flies; the wave after it
    const st = this.agStage(), A = this.A, L = this.L, G = this.G;
    yield* this.fzRun(st, 336, (f, r) => {
      r.x = 214; r.y = 120; r.color = 1;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; r.color = 3; this.pose(A, 0); }
      if (f >= 1 && f <= 89) r.back102(208, 32);
      if (f === 90) { audio.seStop(); this.se('Z1 飛ぶ'); this.pose(A, 3); }
      if (f >= 91 && f <= 119) r.ax = 16;
      if (f === 126) { r.ax = 0; this.fzOut(st); A.x = STD_ENEX; A.y = STD_Y; }
      if (f >= 127 && f <= 133) r.ax = 16;
      if (f >= 134 && f <= 140) { r.ax = 16; r.ot = 0; this.pose(A, 16); }
      if (f >= 141 && f <= 147) { r.ax = 16; r.ot = 0; this.pose(A, 2); }
      if (f >= 148 && f <= 150) {
        if (f === 148) { this.se('Z1 強打'); r.fxOff(); }
        r.ax = 0; r.ay = 0; r.gx = -16; this.pose(G, 16); r.ep = 121;
      }
      if (f >= 151 && f <= 153) r.gx = 16;
      if (f === 154) { r.gx = 0; r.ot = 1; this.pose(A, 2); r.ep = 0; this.se('Z1 ゴー'); }
      if (f >= 155 && f <= 234) { const up = Math.floor((f - 155) / 10) % 2 === 0; this.pose(A, up ? 2 : 5); r.gx = up ? 8 : -8; }
      if (f === 235) { this.se('Z1 吹っ飛ぶ'); this.pose(A, 2); this.pose(G, 17); r.gx = -16; }
      if (f === 245) this.pose(A, 0);
      if (f === 260) this.se('Z1 エネルギー波2');
      if (f >= 261 && f <= 300) { r.x = 214 - 4; r.y = 120 - 10; this.pose(A, 1); r.ep = 233; }
      if (f === 301) r.fxOff();
      if (f === 305) { this.fzOut(st); L.x = STD_ENEX - 50; r.gx = -10; }
      if (f >= 306 && f <= 335) r.ep = 234;
      if (f === 336) { r.gx = 0; L.x = CENTER_CHAX; }
    });
    return yield* this.fzDamage(st);
  },

  // ---------- 達列斯一夥 ----------
  * fzKienzan() { // 1726 気円斬(アモンド): the aura, the disc held up, thrown
    const st = this.agStage(), A = this.A;
    yield* this.fzRun(st, 212, (f, r) => {
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; r.color = 3; }
      if (f >= 1 && f <= 89) r.back101(240, 32);
      if (f === 90) { audio.seStop(); this.pose(A, 0); }
      if (f >= 91 && f <= 150) { if (f === 91) this.se('Z1 ブン'); this.pose(A, 2); r.ep = 218; r.ef = 0; r.x = 290; r.y = 86; }
      if (f >= 151 && f <= 179) { if (f === 151) this.se('Z1 気円斬'); r.ep = 218; this.pose(A, 3); r.x = 184; r.y = 140; }
      if (f === 180) r.fxOff();
      if (f === 181) this.fzOut(st);
      if (f >= 182 && f <= 211) r.ep = 219;
    });
    return yield* this.fzDamage(st);
  },

  * fzPlanetBomb() { // 1727 プラネットボム(アモンド): the aura, the shock streaks
    const st = this.agStage(), A = this.A;
    yield* this.fzRun(st, 243, (f, r) => {
      r.color = 3;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; }
      if (f >= 1 && f <= 100) { r.back102(220, 32); this.pose(A, 4); }
      if (f === 101) { st.tec(false); audio.seStop(); this.se('Z1 ザー'); this.se('Z1 ゴー'); this.se('Z1 エネルギー波'); }
      if (f >= 102 && f <= 180) { r.back1(); this.pose(A, 5); }
      if (f === 181) this.fzOut(st);
      if (f >= 182 && f <= 242) { st.cut(true, true); r.back1(); }
    });
    return yield* this.fzDamage(st);
  },

  * fzCosmic() { // 1730 コズミックアタック(カカオ): he rushes, the blows, the member vanishes, he flies round, then 80 (the ram)
    const st = this.agStage(), A = this.A, L = this.L, G = this.G;
    yield* this.fzRun(st, 391, (f, r) => {
      let jump;
      r.color = 3;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; this.pose(A, 2); }
      if (f >= 1 && f <= 89) r.back102(212, 32);
      if (f === 90) { audio.seStop(); this.se('Z1 エネルギー波'); this.pose(A, 3); }
      if (f >= 91 && f <= 148) A.x -= 20;
      if (f === 149) { this.fzOut(st); A.x = 640; A.y = STD_Y; }
      if (f >= 150 && f <= 166) A.x -= 20;
      if (f >= 167 && f <= 200) {
        const d = f - 167;
        if (d === 0) audio.seStop();
        r.ot = 0; this.pose(G, 16);
        if (d === 0 || d === 16) { if (!this.hit) jump = 390; else { this.pose(A, 1); this.se('Z1 打撃'); } }
        const p = { 4: 2, 20: 2, 8: 3, 24: 3, 12: 4, 28: 4 }[d];
        if (p) { this.pose(A, p); this.se('Z1 打撃'); }
        if (d === 32) this.pose(A, 0);
        if (d < 32 && jump == null) L.x += d % 4 < 2 ? -4 : 4; // (a miss has already jumped to 390)
      }
      if (f >= 201 && f <= 240) { L.y = -200; if (f === 201) this.se('Z1 高速移動'); if (f % 4 === 0) r.U.push(afterImage(L.x, 146)); }
      if (f >= 241 && f <= 319) { if (f === 241) this.se('DB3 エネルギー波2'); r.ot = 1; this.pose(A, 5); A.x += 24; A.y -= 6; }
      if (f === 320) { A.x = -190; A.y = 240; }
      if (f >= 321 && f <= 340) { A.x += 24; A.y -= 6; }
      if (f === 341) { audio.seStop(); this.pose(A, 0); this.se('Z1 吹っ飛ぶ止まる'); }
      if (f >= 351 && f <= 380) { if (f === 351) this.se('Z1 高速移動'); if (f % 4 === 0) r.U.push(afterImage(L.x, 146)); }
      if (f === 381) { L.x = CENTER_CHAX; L.y = STD_Y; this.pose(G, 0); }
      return jump;
    });
    return yield* this.fzDamage(st);
  },

  * fzDouble() { // 1740 ダブルエネルギー波 (雷茲・拉卡塞): the partner flies in beside him, both fire
    const st = this.agStage(), A = this.A, rezun = [68, 220].includes(foeId());
    yield* this.fzRun(st, 137, (f, r) => {
      r.x = 256; r.y = 206; r.color = 3;
      if (f === 0) { this.se('Z1 逃げる'); r.ot = 1; this.pose(A, 0); }
      if (f >= 1 && f <= 59) {
        if (f <= 39) r.ay = f <= 10 ? (rezun ? -5 : 5) : 0;
        r.U.push(at(REZUN, 0, 0, 96, 96, 640 + 90 - 8 * (f - 1), STD_Y + (rezun ? 50 : -50)));
      }
      if (f === 60) { A.y = STD_Y - 50; r.U.push(at(REZUN, 0, 0, 96, 96, A.x, STD_Y + 50)); }
      if (f === 61) { this.se('Z1 怪光線'); this.pose(A, 2); }
      if (f >= 61 && f <= 109) r.U.push(at(REZUN, 0, 96, 96, 96, A.x, STD_Y + 50));
      if (f >= 62 && f <= 99) r.ep = 338;
      if (f >= 100 && f <= 109) r.fxOff();
      if (f === 110) this.fzOut(st);
      if (f >= 111 && f <= 136) r.ep = 339;
    });
    return yield* this.fzDamage(st);
  },

  // ---------- 魔凶星一夥 ----------
  * fzArm() { // 1748 手が伸びる(アンギラ): his arm reaches out, grabs the member, then the beam
    const st = this.agStage(), A = this.A, L = this.L, G = this.G;
    yield* this.fzRun(st, 295, (f, r) => {
      let jump;
      r.color = 3;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; this.pose(A, 0); }
      if (f >= 1 && f <= 89) r.back101(234, 32);
      if (f === 90) { audio.seStop(); this.pose(A, 3); r.bf = 0; }
      if (f === 110) { this.pose(A, 4); this.se('DB3 ダッシュ'); }
      if (f >= 110 && f <= 158) { if (f >= 149) r.bf--; r.back216(280, 154); }
      if (f === 159) { r.fxOff(); this.fzOut(st); r.bf = 0; }
      if (f >= 160 && f <= 186) r.back216(640, 154);
      if (f >= 187 && f <= 219) {
        r.bf--;
        if (!this.hit) jump = 294; else if (f === 187) this.se('Z1 強打');
        r.back216(640, 154);
        this.pose(G, 16);
        const d = f - 187;
        if (d <= 3) L.x -= 8; else if (d <= 7) L.x += 8;
      }
      if (f >= 220 && f <= 229) { L.x = -200; A.x = CENTER_ENEX; A.y = STD_Y; r.bf--; r.back216(318, 154); }
      if (f >= 230 && f <= 267) {
        r.bf--; r.back216(318, 154); this.pose(A, 9);
        if (f === 230) this.se('Z1 エネルギー波2');
        r.x = 292; r.y = 120; r.ep = 233;
      }
      if (f >= 268 && f <= 294) {
        if (f === 268) { r.bf--; L.x = CENTER_CHAX; L.y = STD_Y; r.ef = 0; }
        A.y = -200;
        r.back216(640, 154); this.pose(G, 16); r.bf--;
        r.x = 250; r.y = 120; r.ep = 234;
      }
      return jump;
    });
    return yield* this.fzDamage(st);
  },

  * fzImpact() { // 1758 エビルインパクト(ゼエウン): the aura, he charges across the member and through
    const st = this.agStage(), A = this.A;
    yield* this.fzRun(st, 187, (f, r) => {
      r.color = 3;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; this.pose(A, 0); }
      if (f >= 1 && f <= 89) r.back101(230, 32);
      if (f === 90) { audio.seStop(); this.pose(A, 0); }
      if (f === 110) { this.se('Z1 エネルギー波'); this.se('Z1 エネルギー波2'); this.pose(A, 2); A.x -= 20; A.y += 16; st.tec(false); r.back1(); }
      if (f >= 111 && f <= 148) { A.x -= 20; r.back1(); }
      if (f === 149) { r.fxOff(); r.back1(); }
      if (f === 159) { this.fzOut(st); A.x = 760; A.y = STD_Y + 16; }
      if (f >= 160 && f <= 186) { A.x -= 20; r.back1(); }
      if (f === 187) A.y = -200;
    });
    return yield* this.fzDamage(st);
  },

  * fzComet2() { // 1754 エビルコメット(メダマッチャ): the aura, the demon backdrop, the balls from his head and hand, the rain of waves
    const st = this.agStage(), A = this.A;
    if (this.fzAgain) {
      yield* this.fzRun(st, 28, (f, r) => {
        r.x = 326; r.y = 96; r.color = 3;
        if (f === 0) { this.se('Z1 エネルギー波'); st.tec(true); this.fzOut(st); r.ef = 0; r.et = 0; }
        if (f >= 1 && f <= 27) { r.y = 160; r.ep = 340; st.cut(true, true); }
      });
      return yield* this.fzDamage(st);
    }
    yield* this.fzRun(st, 338, (f, r) => {
      r.x = 326; r.y = 96; r.color = 3;
      if (f === 0) this.se('Z2 気を溜める');
      if (f >= 1 && f <= 100) r.back101(240, 32);
      if (f === 101) { st.tec(false); audio.seStop(); r.back2(); r.ot = 1; this.pose(A, 2); }
      if (f >= 102 && f <= 309) {
        const d = f - 102;
        r.back2();
        if (d === 19) this.pose(A, 3);
        if (d === 39) this.pose(A, 4);
        if ([47, 87, 127, 167].includes(d)) this.pose(A, 5);
        if ([55, 95, 135, 175].includes(d)) { this.pose(A, 6); audio.seStop(); this.se('Z3 エネルギー波'); r.ef = 0; r.et = 1; r.ep = 16; }
        if ([63, 103, 143, 183].includes(d)) this.pose(A, 9);
        if ([71, 111, 151, 191].includes(d)) this.pose(A, 7);
        if ([79, 119, 159, 199].includes(d)) { this.pose(A, 8); audio.seStop(); this.se('Z3 エネルギー波'); r.ef = 0; r.et = 1; r.ep = 18; }
        if (r.ep === 16) { r.x = 220; r.y = 98; }
        if (r.ep === 18) { r.x = 278; r.y = 98; }
      }
      if (f === 310) { st.tec(true); this.fzOut(st); r.ef = 0; r.et = 0; this.se('Z1 エネルギー波'); }
      if (f >= 311 && f <= 337) { r.y = 160; r.ep = 340; }
    });
    return yield* this.fzDamage(st);
  },

  * fzFrog() { // 1755 カエル攻撃(メダマッチャ): four frogs jump out of him, leap away, and come down on the member
    const st = this.agStage(), A = this.A, k = { n: 0 };
    yield* this.fzRun(st, 367, (f, r) => {
      let jump;
      r.color = 3;
      if (f === 0) { this.se('Z2 気を溜める'); r.ot = 1; this.pose(A, 0); }
      if (f >= 1 && f <= 89) r.back101(240, 32);
      if (f === 90) { audio.seStop(); this.pose(A, 0); }
      if (f >= 110 && f <= 250) {
        const d = f - 110;
        if ([0, 30, 60, 90].includes(d)) { k.n = 0; this.se('DB3 SE061'); }
        frogs(r, A.x, A.y, d, k);
      }
      if (f >= 251 && f <= 298) { if (f === 251) this.se('DB3 SE109'); frogsLeap(r, A.x, A.y, f - 251); }
      if (f === 299) r.fxOff();
      if (f === 309) this.fzOut(st);
      if (f >= 310 && f <= 366) {
        r.ep = 341;
        if (f === 310) this.se('DB3 SE109');
        if (!this.hit && f === 335) jump = 366;
        if (f === 336) this.se('DB3 SE061');
      }
      return jump;
    });
    return yield* this.fzDamage(st);
  },

  * fzArmFrog() { // 1761 安基拉與梅達瑪茶: the partner comes in, both charge, the arm grabs the member, the frogs, the beam
    const st = this.agStage(), A = this.A, L = this.L, G = this.G, id = foeId(), angila = [72, 224].includes(id), k = { n: 0 };
    const meda = (r) => r.U.push(at(MEDA, 0, 0, 96, 96, 740 - 8 * 39, STD_Y)); // 梅達瑪茶 beside him (row 0)
    yield* this.fzRun(st, 625, (f, r) => {
      let jump;
      r.color = 3;
      if (f === 0) { this.se('Z1 逃げる'); r.ot = 1; this.pose(A, 0); }
      if (f >= 1 && f <= 59) {
        const t = Math.min(f - 1, 39);
        if (angila) r.U.push(at(MEDA, 0, 0, 96, 96, 740 - 8 * t, STD_Y));
        else { r.U.push(at(ANGILA, 0, 0, 96, 96, 734 - 12 * t, STD_Y)); if (f <= 39) A.x = Math.min(428, A.x + 8); }
      }
      if (f === 60) {
        if (id === 74 || id === 226) { // 梅達瑪茶 began it: from here 安基拉 is the one attacking (@enedatenum = 72)
          const e = globalThis.__game.world.enemies[id === 74 ? 72 : 224];
          this.R.sheets = { normal: e.portrait, special: e.sprite, size: e.size };
          A.x -= 162;
        }
        meda(r); this.se('Z2 気を溜める'); r.ot = 1; this.pose(A, 0);
      }
      if (f >= 61 && f <= 149) { r.back101(234, 32); r.bf--; r.back101(234 + 170, 32); meda(r); }
      if (f === 150) { audio.seStop(); this.pose(A, 3); r.bf = 0; meda(r); }
      if (f >= 151 && f <= 169) meda(r);
      if (f === 170) { this.pose(A, 4); this.se('DB3 ダッシュ'); }
      if (f >= 170 && f <= 218) { if (f >= 209) r.bf--; r.back216(280, 154); meda(r); }
      if (f === 219) { r.fxOff(); this.fzOut(st); r.bf = 0; }
      if (f >= 220 && f <= 246) r.back216(640, 154);
      if (f >= 247 && f <= 279) {
        r.bf--;
        if (!this.hit) jump = 354; else if (f === 247) this.se('Z1 強打');
        r.back216(640, 154);
        this.pose(G, 16);
        const d = f - 247;
        if (d <= 3) L.x -= 8; else if (d <= 7) L.x += 8;
      }
      if (f >= 280 && f <= 289) { L.x = -200; A.x = TEC_CENTER; A.y = STD_Y; r.bf--; r.back216(280, 154); meda(r); }
      if (f >= 290 && f <= 430) {
        r.bf--; r.back216(280, 154); meda(r);
        const d = f - 290;
        if ([0, 30, 60, 90].includes(d)) { r.ep = 0; r.ef = 0; k.n = 0; this.se('DB3 SE061'); }
        frogs(r, A.x + 166, A.y, d, k);
      }
      if (f >= 431 && f <= 478) {
        r.bf--; r.back216(280, 154); meda(r);
        if (f === 431) this.se('DB3 SE109');
        frogsLeap(r, A.x + 166, A.y, f - 431);
      }
      if (f === 479) { r.fxOff(); this.fzOut(st); }
      if (f >= 480 && f <= 536) {
        r.ep = 341;
        if (f === 480) this.se('DB3 SE109');
        if (!this.hit && f === 505) jump = 536;
        if (f === 506) this.se('DB3 SE061');
        r.bf = 26; r.back216(640, 154);
      }
      if (f >= 537 && f <= 597) { if (f === 537) this.se('Z3 超能力'); r.gx = f % 2 === 0 ? 6 : -6; r.bf = 26; r.back216(640, 154); }
      if (f >= 598 && f <= 624) {
        if (f === 598) { this.se('Z1 エネルギー波2'); r.gx = 0; r.ef = 0; }
        r.bf = 26; r.back216(640, 154);
        r.x = 250; r.y = 120; r.ep = 234;
      }
      return jump;
    });
    return yield* this.fzDamage(st);
  },
});

// an enemy of the Z3 switch (or a member) with one of these moves: the film it had before
for (const name of new Set(Object.values(FILMS))) {
  const film = Duel.prototype[name];
  Duel.prototype[name] = function* () {
    if (!this.p && z2Foe()) return yield* film.call(this);
    const prev = BEFORE[this.skill];
    return yield* this[prev && !prev.startsWith('fz') && this[prev] ? prev : 'foeWave']();
  };
}

// sounds these films play beyond src/anime.js's, for tools/copy_assets.py
export const FZ_SOUNDS = ['Z1 怪光線', 'Z1 気を溜める2', 'Z2 気を溜める', 'Z1 エネルギー波2', 'Z1 ザー', 'Z1 エネルギー波', 'Z1 高速移動', 'Z1 逃げる',
  'Z1 ゴー', 'Z1 飛ぶ', 'Z1 強打', 'ZG 打撃2', 'ZG 打撃4', 'Z1 吹っ飛ぶ', 'Z1 吹っ飛ぶ止まる', 'Z1 気を溜める4', 'Z1 ブン', 'Z1 気円斬',
  'Z1 打撃', 'DB3 エネルギー波2', 'DB3 ダッシュ', 'Z3 エネルギー波', 'DB3 SE061', 'DB3 SE109', 'Z3 超能力', 'DB3 気を溜める2',
  'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'DB3 大爆発', 'Z3 光線系ヒット', 'Z3 跳ね返し'];

// ---------- ?dev=aen1…: the films in a battle (variable 40 = 1, 悟空・悟飯・克林・比克 at level 60, nobody falls) ----------
//   aen1&foes=48,49,50&moves=345,349,382   a battle against these enemies; each listed move is the next one an enemy
//   that has it uses (its card a special), in that order — then they pick as usual. Without foes: 基紐特戰隊.
// The films can also be played from the console: __game.scene.play(m, f, false, skill, dmg, m)
registerZ3('aen1', {
  dev(game, step) {
    if (step !== 'aen1') return false;
    const q = new URLSearchParams(location.search), list = (k, d) => (q.get(k) ? q.get(k).split(',').map(Number) : d);
    const foes = list('foes', [48, 49, 50, 51, 52]), moves = list('moves', []);
    const s = game.state = game.newState();
    s.var[40] = 1;
    s.var[43] = 60;
    s.flags.z3 = 'done';
    party(game, [3, 5, 6, 4]);
    for (const m of s.party) { m.level = 60; m.exp = game.world.actors[m.id].exp[60]; applyLevel(game.world, m); m.maxhp *= 20; heal(m); }
    const act0 = Battle.prototype.enemyAct;
    Battle.prototype.enemyAct = async function (f) {
      const k = moves.findIndex((sid) => f.actions.some((a) => a.skill === sid));
      if (k < 0) return act0.call(this, f);
      const sid = moves.splice(k, 1)[0], keep = [f.actions, f.card];
      f.actions = [{ skill: sid, cond: 0, param: 0 }];
      f.card = { ...f.card, s: 0 };
      try { return await act0.call(this, f); } finally { [f.actions, f.card] = keep; }
    };
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle(foes, true, { loseOk: true }), 300);
    return true;
  },
});

// 特蘭克斯・未來悟飯・龜仙人's special-move films (docs/anim-cd-plan.md andt), ported frame by frame from the original's
// Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like src/anime_goku_gohan.js. In the Z3 part of the move switch
// (all.rb 59742, $btl_progress 2) the attack pattern is the skill id + 10, and it runs anime_pattern 31 → 32 → the
// move's own pattern (skill id + 2100) → the damage pattern:
//   特蘭克斯 (17 / 超 20)  171 エネルギー波 181 → 1102, 23        172 剣攻撃 182 → 2272, 22         173 爆発波 183 → 2273, 23
//                          174 ませんこう 184 → 2274, 23          176 バーニングアタック 186 → 2276, 41
//                          177 シャイニングソードアタック 187 → 2277, 42                         178 ヒートドームアタック 188 → 2278, 72
//                          181 フィニッシュバスター 191 → 2281, 42  185 超サイヤ人変身 195 → 2129 (src/anime_goku_gohan.js angaSs)
//   未來悟飯 (25 / 超 26)  236 まこうほう 246 → 2336, 23          237 ませんこう 247 → 2337, 23     238 超爆力波 248 → 2338, 23
//                          240 魔貫光殺砲 250 → 2340, 41          241 スーパーカメハメ波 251 → 2341, 42
//                          242 爆裂乱舞 252 → 2342, 42            245 超サイヤ人変身 255 → 2129 (angaSs)
//   龜仙人 (24)            230 魔封波 240 → 2330, 22
// The special-move strips and the cut-in are src/anime_goku_gohan.js's stage (agStage / agFrame / agCut / agEnd,
// agRegister for the launch); this file only draws each film's own pictures. Frame numbers are @battle_anime_frame.
import { audio, img } from './core.js?v=20261107-2349';
import { Duel, addMoves, SW, SH, STD_Y, CENTER_ENEX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261107-2349';
import { agRegister } from './anime_goku_gohan.js?v=20261107-2349';
import { registerZ3, party, heal } from './z3.js?v=20261107-2349';
import { superSaiyan } from './supersaiyan.js?v=20261107-2349';
import { applyLevel } from './party.js?v=20261107-2349';

const FILMS = {
  171: 'dtWave', 172: 'dtSword', 173: 'dtBlast', 174: 'dtMasenko', 176: 'dtBurning', 177: 'dtShiningSword', 178: 'dtHeatDome',
  181: 'dtFinishBuster', // 特蘭克斯
  236: 'dtMakouhou', 237: 'dtGohanMasenko', 238: 'dtBakuriki', 240: 'dtMakanko', 241: 'dtSuperKame', 242: 'dtRanbu', // 未來悟飯
  230: 'dtMafuba', // 龜仙人
};
addMoves(FILMS);
// the films these moves had before (an enemy using one, or a combo)
const OLD = { dtWave: 'energyWave', dtSword: 'swordAttack', dtBlast: 'nappaBlast', dtMasenko: 'masenko', dtBurning: 'galickGun',
  dtShiningSword: 'swordAttack', dtHeatDome: 'galickGun', dtFinishBuster: 'energyWave', dtMakouhou: 'gohanMakouhou',
  dtGohanMasenko: 'masenko', dtBakuriki: 'nappaBlast', dtMakanko: 'makankosappo', dtSuperKame: 'kamehameha', dtRanbu: 'wolfFang',
  dtMafuba: 'maxKamehameha' };

// every picture goes through pic() (tools/copy_assets.py collects them from this file)
const pic = (n) => `Graphics/Pictures/${n}`;
const state = () => (globalThis.__game && globalThis.__game.state) || {};
const era = () => Math.min(2, (state().var && state().var[40]) || 0);
const v = (n) => (state().var && state().var[n]) || 0;
const sw = (n) => !!(state().sw && state().sw[n]);
const ss = (no) => !!(state().ss && state().ss[no]); // $super_saiyazin_flag: 3 貝吉塔, 4 特蘭克斯, 6 未來悟飯
const foeId = () => { const d = globalThis.__game && globalThis.__game.scene && globalThis.__game.scene.duel; return Number(d && d.f && d.f.id) || 0; };
const noSword = () => v(173) >= 1 && v(173) <= 3; // 特蘭克斯 without his sword (variable 173: 1 battle suit, 2 tank top, 3 long hair)
// $btl_top_file_name pictures: Z2_ / Z3_
const Z23 = (z2, z3) => () => (era() >= 2 ? z3 : z2);
const BALL = Z23(pic('Z2_戦闘_必殺技_エネルギー弾.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾.PNG')); // 6 frames of 128×128
const BALL_BLUE = Z23(pic('Z2_戦闘_必殺技_エネルギー弾(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾(青).PNG'));
const BALL2 = Z23(pic('Z2_戦闘_必殺技_エネルギー弾2.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾2.PNG')); // 96×64, the lower half mirrored
const BALL34 = Z23(pic('Z2_戦闘_必殺技_エネルギー弾3(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG')); // 222×134 (Z2) / 190×126 (Z3)
const AURA = { plain: pic('Z3_戦闘_必殺技_気を溜める.png'), blue: pic('Z3_戦闘_必殺技_気を溜める(青).png') }; // back 201: 2 frames of 136×142
const AURA2 = pic('Z2_戦闘_必殺技_気を溜める3(青).png'); // back 101 (Z2): 3 frames of 184×240
const DEMON_V = Z23(pic('Z2_戦闘_必殺技_背景_魔族系(縦).png'), pic('Z3_戦闘_必殺技_背景_魔族系(縦).png')); // back 2: 640×356 every 480
const SHOCK = pic('Z3_戦闘_必殺技_背景_衝撃波系.png'); // back 1
const KAME_LINES = [pic('Z3_必殺技_超カメハメ波(バック上).png'), pic('Z3_必殺技_超カメハメ波(バック下).png')]; // back 106
const SWORD = [pic('Z3_戦闘_必殺技_剣攻撃.PNG'), pic('Z3_戦闘_必殺技_剣攻撃(上下反転).PNG'), pic('Z3_戦闘_必殺技_剣攻撃(縦).PNG')]; // effects 267-269
const BLINK = { plain: pic('Z3_必殺技_超カメハメ波(球点滅).png'), blue: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png') }; // effect 235: 32×32 ×5
const BLINK_SMALL_BLUE = pic('Z3_必殺技_超カメハメ波(球点滅小)(青).png'); // effect 237: 16×16 ×5
const BIG_BANG_BLUE = pic('Z3_必殺技_ビッグバンアタック発動(青).PNG'); // effect 264: 2 frames of 302×200
const HALF_BLUE = Z23(pic('ZG_戦闘_必殺技_エネルギー波_半円(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG')); // effects 256 / 265: 700×128 ×2
const HUGE = Z23(pic('Z2_戦闘_必殺技_エネルギー波_特大.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG')); // effect 48: 400×192 ×2
const HUGE_DOWN = pic('Z3_戦闘_必殺技_エネルギー波_特大_縦.PNG'); // effects 291 / 292: 192×800
const SUPER_KAME = pic('Z3_必殺技_超カメハメ波.png'); // effect 236: 500×350
const MAKANKO = pic('Z3_戦闘_必殺技_魔貫光殺砲.PNG'); // effects 272 / 255: 400×64 rows
const BOOM = { 102: [pic('戦闘アニメ_爆発3.PNG'), 112, 120, 318, 120], 106: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 270, 88] };
const SPARK = pic('戦闘アニメ.PNG'); // effect 123
// the films' own pictures
const BURNING = { plain: pic('Z3_必殺技_バーニングアタック(トランクス).PNG'), super: pic('Z3_必殺技_バーニングアタック(超トランクス).PNG'),
  long: pic('Z3_必殺技_バーニングアタック(トランクス(剣持ち長髪)).PNG'), superLong: pic('Z3_必殺技_バーニングアタック(超トランクス(剣持ち長髪)).PNG') }; // 158×184
const BURNING_ZG = { // 2276 for variable 173 = 1 / 2 / 3: 4 pictures of 512×128 each, [normal, 超]
  1: [[pic('ZG_必殺技_バーニングアタック_トランクス1.PNG'), pic('ZG_必殺技_バーニングアタック_トランクス2.PNG'), pic('ZG_必殺技_バーニングアタック_トランクス3.PNG'), pic('ZG_必殺技_バーニングアタック_トランクス4.PNG')],
    [pic('ZG_必殺技_バーニングアタック_超トランクス1.PNG'), pic('ZG_必殺技_バーニングアタック_超トランクス2.PNG'), pic('ZG_必殺技_バーニングアタック_超トランクス3.PNG'), pic('ZG_必殺技_バーニングアタック_超トランクス4.PNG')]],
  2: [[pic('ZG_必殺技_バーニングアタック_トランクス(タンクトップ)1.PNG'), pic('ZG_必殺技_バーニングアタック_トランクス(タンクトップ)2.PNG'), pic('ZG_必殺技_バーニングアタック_トランクス(タンクトップ)3.PNG'), pic('ZG_必殺技_バーニングアタック_トランクス(タンクトップ)4.PNG')],
    [pic('ZG_必殺技_バーニングアタック_超トランクス(タンクトップ)1.PNG'), pic('ZG_必殺技_バーニングアタック_超トランクス(タンクトップ)2.PNG'), pic('ZG_必殺技_バーニングアタック_超トランクス(タンクトップ)3.PNG'), pic('ZG_必殺技_バーニングアタック_超トランクス(タンクトップ)4.PNG')]],
  3: [[pic('ZG_必殺技_バーニングアタック_トランクス(剣なし・タンクトップ・長髪)1.png'), pic('ZG_必殺技_バーニングアタック_トランクス(剣なし・タンクトップ・長髪)2.png'), pic('ZG_必殺技_バーニングアタック_トランクス(剣なし・タンクトップ・長髪)3.png'), pic('ZG_必殺技_バーニングアタック_トランクス(剣なし・タンクトップ・長髪)4.png')],
    [pic('ZG_必殺技_バーニングアタック_超トランクス(剣なし・タンクトップ・長髪)1.png'), pic('ZG_必殺技_バーニングアタック_超トランクス(剣なし・タンクトップ・長髪)2.png'), pic('ZG_必殺技_バーニングアタック_超トランクス(剣なし・タンクトップ・長髪)3.png'), pic('ZG_必殺技_バーニングアタック_超トランクス(剣なし・タンクトップ・長髪)4.png')]],
};
const SHINING = [pic('Z3_必殺技_シャイニングソードアタック.png'), pic('Z3_必殺技_シャイニングソードアタック(フリーザ付).png')]; // 340×346
const HEAT_DOME = { 1: pic('ZG_必殺技_ヒートドームアタック_超トランクス(バトルスーツ).png'), 3: pic('ZG_必殺技_ヒートドームアタック_超トランクス(剣なし・タンクトップ・長髪).png'),
  0: pic('ZG_必殺技_ヒートドームアタック_超トランクス(タンクトップ).png') }; // 200×284
const MAFUBA = [pic('Z3_戦闘_必殺技_魔封波(亀仙人_黒道着).png'), pic('Z3_戦闘_必殺技_魔封波(亀仙人_普段着).png')]; // 204×160
const GOHAN_MAKANKO = [pic('Z3_必殺技_カットイン_魔貫光殺砲(未来ゴハン).png'), pic('Z3_必殺技_カットイン_魔貫光殺砲(未来超ゴハン).png')]; // 648×64
const GOHAN_KAME = [pic('Z3_必殺技_超カメハメ波(未来悟飯).png'), pic('Z3_必殺技_超カメハメ波(未来悟飯超).png')]; // 250×214

// what each film shows (loaded while it swoops in), and the move switch's settings before pattern 32
const burningPics = () => (v(173) >= 1 && v(173) <= 3 ? BURNING_ZG[v(173)][ss(4) ? 1 : 0] : Object.values(BURNING));
agRegister({
  dtWave: { pics: () => [BALL()] },
  dtSword: { pics: () => [SWORD[0]] },
  dtBlast: { pics: () => [AURA.blue, DEMON_V(), SHOCK], cut: true },
  dtMasenko: { pics: () => [AURA.blue, AURA2, BALL34()], cut: true, small: true },
  dtBurning: { pics: () => [AURA.blue, ...burningPics(), BLINK.blue, BIG_BANG_BLUE, BALL_BLUE()], cut: true, red: true },
  dtShiningSword: { pics: () => [AURA.blue, BURNING.plain, BURNING.super, BURNING.superLong, BURNING.long, BLINK.blue, BIG_BANG_BLUE, BALL_BLUE(), ...SWORD, ...SHINING, HALF_BLUE()], cut: true, red: true },
  dtHeatDome: { pics: () => [AURA.blue, SPARK, ...Object.values(HEAT_DOME), HUGE_DOWN, BOOM[106][0]], cut: true, small: true },
  dtFinishBuster: { pics: () => [AURA.blue, AURA2, BLINK_SMALL_BLUE, HALF_BLUE()], cut: true, small: true },
  dtMakouhou: { pics: () => [BALL()] },
  dtGohanMasenko: { pics: () => [AURA.blue, BALL2()], cut: true },
  dtBakuriki: { pics: () => [AURA.blue, DEMON_V(), SHOCK], cut: true },
  dtMakanko: { pics: () => [...GOHAN_MAKANKO, MAKANKO, BOOM[102][0]], cut: true },
  dtSuperKame: { pics: () => [...GOHAN_KAME, ...KAME_LINES, BLINK.plain, SUPER_KAME, HUGE()], cut: true },
  dtRanbu: { pics: () => [AURA.blue, SPARK, HALF_BLUE()], cut: true, small: true },
  dtMafuba: { pics: () => [AURA.plain, ...MAFUBA], cut: true, small: true },
});

// a blt clipped to the picture the way RGSS clips it (a source rect partly outside draws only what is inside)
function blt(c, sheet, sx, sy, w, h, x, y) {
  const e = img(sheet);
  if (!e.ok) return;
  if (sx < 0) { x -= sx; w += sx; sx = 0; }
  if (sy < 0) { y -= sy; h += sy; sy = 0; }
  w = Math.min(w, e.im.width - sx); h = Math.min(h, e.im.height - sy);
  if (w > 0 && h > 0) c.drawImage(e.im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
}
const at = (sheet, sx, sy, w, h, x, y) => (c) => blt(c, sheet, sx, sy, w, h, x, y);
const fill = (color, h = SH) => (c) => { c.fillStyle = color; c.fillRect(0, 0, SW, h); };
const WHITE = '#fff';

// the original's animation counters: @back_anime_type / frame (back_anime_pattern), @effect_anime_type / frame and
// @ray_anime_type / frame (effect_pattern: draws with them as they are, then both frames count on)
class Counters {
  constructor() { this.bt = 0; this.bf = 0; this.et = 0; this.ef = 0; this.rt = 0; this.rf = 0; }
  back(every, last) { // the picture to draw now; the next every `every` calls, cycling through last + 1
    const k = this.bt;
    if (this.bf >= every && this.bt !== last) { this.bt++; this.bf = 0; } else if (this.bf >= every) { this.bt = 0; this.bf = 0; }
    this.bf++;
    return k;
  }
  fx(O, draw) { const d = draw(this); if (d) O.push(d); this.rf++; this.ef++; }
  reset() { this.et = 0; this.ef = 0; }
  ray0() { this.rt = 0; this.rf = 0; }
  blink() { const k = this.rt; if (this.rf >= 4 && this.rt !== 4) { this.rt++; this.rf = 0; } else if (this.rf >= 4) { this.rt = 0; this.rf = 0; } return k; }
  sword() { const k = this.rt; if (this.rf >= 2) { this.rt++; this.rf = 0; } return k; } // 267-270
}
// back 201 気を溜める(Z3) / 101 (Z2) / 2 魔族系(縦) / 1 衝撃波系 / 106 the super kamehameha's lines
const aura = (n, x, y, color = 'blue') => at(AURA[color], 136 * n.back(16, 1), 0, 136, 142, x, y);
const aura2 = (n, x, y) => at(AURA2, 184 * n.back(4, 2), 0, 184, 240, x, y);
const charge = (n, z3, U) => U.push(z3 ? aura(n, 228, 88) : aura2(n, 214, 32)); // ($btl_progress 2 / 1)
const demon = (n) => at(DEMON_V(), 0, n.back(4, 2) * 480, 640, 356, 0, 0);
function shock(n, d, U) {
  const k = n.back(4, 2) * 180;
  if ((d.G.sheets.size || 96) === 192) { U.push(at(SHOCK, 0, k, 640, 42, 0, 32), at(SHOCK, 0, 138 + k, 640, 42, 0, 266)); } else U.push(at(SHOCK, 0, k, 640, 180, 0, 80));
}
function lines(n, U) { const k = n.back(4, 2); U.push(at(KAME_LINES[0], 0, 128 * k, 384, 128, 0, 0), at(KAME_LINES[1], 0, 64 * k, 192, 64, 0, 292)); }
// effect 123: the hit spark at (x, y)
const hitSpark = (n, O, x, y) => n.fx(O, (k) => at(SPARK, k.ef <= 4 ? 0 : 32, 16, 32, 32, x, y));

// the targets after the first of a move on everyone (@all_attack_count >= 2): no swoop, no launch, the film starts on them
const ALL = new Set([173, 238]);
const ended = {};
const swoop0 = Duel.prototype.swoopIn, launch0 = Duel.prototype.launch;
Object.assign(Duel.prototype, {
  * swoopIn() {
    this.dtAgain = !!(this.p && this.constructor === Duel && ALL.has(this.skill) && performance.now() - (ended[this.skill] || -1e9) < 500);
    if (this.p && ALL.has(this.skill)) this.finished.then(() => { ended[this.skill] = performance.now(); });
    if (this.dtAgain) return;
    yield* swoop0.call(this);
  },
  * launch() { if (!this.dtAgain) yield* launch0.call(this); },

  // the end of a film: the damage patterns src/anime_goku_gohan.js does not have — 41 爆発系ZD中 (effect 102) and 72
  // 吹っ飛び縦 (effect 106, the defender flies up); the others go to agEnd
  * dtEnd(st, kind) {
    if (kind !== 'zd41' && kind !== 'zd72') return yield* this.agEnd(st, kind);
    st.under = []; st.over = [];
    if (this.constructor !== Duel) return 'big';
    if (kind === 'zd72') st.tecNo = 1; // (the move switch, before the damage)
    if (!this.hit) return 'miss';
    const z72 = kind === 'zd72', [sheet, w, h, x, y] = BOOM[z72 ? 106 : 102], n = new Counters();
    this.se(z72 ? 'ZG 光線系ヒット3' : 'ZG 光線系ヒット2');
    this.showHit();
    this.pose(this.G, z72 && foeId() === 127 ? 20 : 17, false);
    for (let f = 0; f < (z72 ? 25 : 60); f++) {
      const O = [];
      if (f < (z72 ? 15 : 40)) n.fx(O, (k) => { const t = k.et; if (k.ef >= 10) { k.et++; k.ef = 0; } return at(sheet, t * w, 0, w, h, x, y); });
      if (z72 && f >= 1 && f <= 14) this.G.y -= 20;
      if (!z72 && f >= 21 && f <= 39) this.G.x += 20;
      st.over = O;
      yield;
    }
    st.over = [];
    return 'none';
  },
  // a film for the party only (an enemy using the move plays the film it had before)
  dtOld(name) { return this[OLD[name]](); },
});

// ---------- 特蘭克斯 ----------
Object.assign(Duel.prototype, {
  * dtWave() { return yield* this.dtBallWave('dtWave', 300, 0); }, // 1102 エネルギー波 (all.rb 78447)
  * dtMakouhou() { return yield* this.dtBallWave('dtMakouhou', 312, 2); }, // 2336 魔光砲(未来ゴハン) (97666)
  * dtBallWave(name, rx, dx) { // the ball flies off (effect 201), the cut, it hits (202)
    if (!this.p) return yield* this.dtOld(name);
    const st = this.agStage(), A = this.A, n = new Counters();
    this.se('Z3 エネルギー波');
    this.pose(A, 1, true);
    A.x += dx;
    for (let f = 0; f < 76; f++) {
      const O = [];
      if (f >= 1 && f <= 40) n.fx(O, (k) => at(BALL(), 256, 0, 128, 128, rx + k.ef * RAY_SPEED, 96));
      if (f === 41) n.reset();
      if (f === 45) this.agCut(st);
      if (f >= 46) n.fx(O, (k) => at(BALL(), 256, 0, 128, 128, -128 + k.ef * RAY_SPEED, 96));
      yield* this.agFrame(st, [], O);
    }
    return yield* this.dtEnd(st, 'beam'); // damage 23
  },

  * dtSword() { // 2272 剣攻撃 (95837): one slash (effect 267), the cut
    if (!this.p) return yield* this.dtOld('dtSword');
    const st = this.agStage(), A = this.A, G = this.G, n = new Counters();
    this.se('Z3 剣攻撃');
    if (foeId() === 144) this.pose(A, 4, true); else { this.pose(A, 2, true); A.x -= 14; G.x += 14; }
    for (let f = 0; f < 76; f++) {
      const O = [];
      if (f >= 1 && f <= 40) n.fx(O, (k) => at(SWORD[0], 160 * k.sword(), 0, 160, 96, 228, 134));
      if (f === 41) n.reset();
      if (f === 45) this.agCut(st);
      yield* this.agFrame(st, [], O);
    }
    return yield* this.dtEnd(st, 'shock'); // damage 22
  },

  * dtBlast() { return yield* this.dtAllBlast('dtBlast'); }, // 2273 爆発波(トランクス) (95867)
  * dtBakuriki() { return yield* this.dtAllBlast('dtBakuriki'); }, // 2338 超爆力波 (97725)
  * dtAllBlast(name) { // the blue aura, the demon background, the shock streaks on the defender (later targets: only those)
    if (!this.p) return yield* this.dtOld(name);
    const st = this.agStage(), A = this.A, n = new Counters(), gohan = name === 'dtBakuriki';
    if (this.dtAgain) { // @all_attack_count >= 2
      st.tec(false); st.cut(true, true);
      this.se('Z1 エネルギー波');
      this.agCut(st);
      for (let f = 0; f < 61; f++) { const U = []; if (f >= 1) shock(n, this, U); yield* this.agFrame(st, U, []); }
      return yield* this.dtEnd(st, 'beam');
    }
    this.se('Z3 変身');
    this.pose(A, gohan ? 4 : 0, true);
    for (let f = 0; f < 282; f++) {
      const U = [];
      if (f >= 1 && f <= 127) U.push(aura(n, 228, 88));
      if (f === 128) {
        st.tec(false);
        if (!gohan) st.cut(false);
        A.x += gohan ? 8 : 16;
        audio.seStop(); this.se('Z1 エネルギー波');
        this.pose(A, gohan ? 8 : noSword() ? 2 : 9, true);
      }
      if (f >= 129 && f <= 208) U.push(demon(n));
      if (f === 220) { if (!gohan) st.cut(true); this.agCut(st); }
      if (f >= 221) shock(n, this, U);
      yield* this.agFrame(st, U, []);
    }
    return yield* this.dtEnd(st, 'beam'); // damage 23
  },

  * dtMasenko() { // 2274 ませんこう(トランクス) (95940): the charge, the big blue blast (effects 206 / 207)
    if (!this.p) return yield* this.dtOld('dtMasenko');
    const st = this.agStage(), A = this.A, n = new Counters(), z3 = era() >= 2;
    const [bw, bh] = z3 ? [190, 126] : [222, 134];
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(A, noSword() ? 3 : 10, true);
    for (let f = 0; f < 167; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 128) charge(n, z3, U);
      if (f === 90) { audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(A, noSword() ? 13 : 11, true); }
      if (f >= 90 && f <= 128) n.fx(O, (k) => at(BALL34(), 0, 0, bw, bh, 340 + k.ef * RAY_SPEED, 96));
      if (f === 129) n.reset();
      if (f === 139) this.agCut(st);
      if (f >= 140) n.fx(O, (k) => at(BALL34(), 0, 0, bw, bh, -192 + k.ef * RAY_SPEED, 96));
      yield* this.agFrame(st, U, O);
    }
    return yield* this.dtEnd(st, 'beam'); // damage 23
  },

  * dtFinishBuster() { // 2281 フィニッシュバスター (96680): the small blue ball, the half-circle wave
    if (!this.p) return yield* this.dtOld('dtFinishBuster');
    const st = this.agStage(), A = this.A, n = new Counters(), z3 = era() >= 2;
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(A, 0, true);
    for (let f = 0; f < 267; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 189) charge(n, z3, U);
      if (f === 90) { this.se('Z1 気を溜める'); this.pose(A, noSword() ? 12 : 11, true); }
      if (f >= 90 && f <= 189) n.fx(O, (k) => at(BLINK_SMALL_BLUE, 16 * k.blink(), 0, 16, 16, 276, 108));
      if (f === 190) { audio.seStop(); this.se('Z1 エネルギー波'); this.pose(A, noSword() ? 13 : 11, true); }
      // effect 256 from frame 190: its frame count kept running since 90, so it is already 100 frames long
      if (f >= 190 && f <= 228) n.fx(O, (k) => at(HALF_BLUE(), 0, 0, k.ef * RAY_SPEED, 128, 340, 96));
      if (f === 229) n.reset();
      if (f === 239) this.agCut(st);
      if (f >= 240) n.fx(O, (k) => at(HALF_BLUE(), 0, 128, 700, 128, -700 + k.ef * RAY_SPEED, 96));
      yield* this.agFrame(st, U, O);
    }
    return yield* this.dtEnd(st, 'zd42');
  },

  // 2276 バーニングアタック (95989) and the first part of 2277 (the same, then its own): the aura, 特蘭克斯 drawing the
  // shape with his hands, the blue blast, then (2276) the ball hits
  dtBurningCharge(st, n, U, O, f, longPic) {
    const A = this.A;
    if (f >= 1 && f <= 128) {
      U.push(aura(n, 228, 88));
      if (f === 128) { st.tecNo = 3; st.cut(false); }
    }
    if (f >= 129 && f <= 300) {
      if (f === 129) audio.seStop();
      A.y = -160;
      const p = longPic ? (ss(4) ? BURNING.superLong : BURNING.long) : (ss(4) ? BURNING.super : BURNING.plain);
      const d = f >= 231 && f <= 233 ? 2 : f === 234 ? 4 : f === 235 ? 2 : 0;
      U.push(at(p, 0, 0, 158, 184, 272 - d, 82 - d));
      if (f >= 140 && f <= 230) {
        if (f === 140) this.se('Z1 気を溜める');
        const [rx, ry] = ss(3) ? [368, 220] : [344, 180]; // ($super_saiyazin_flag[3], as the original has it)
        n.fx(O, (k) => at(BLINK.blue, 32 * k.blink(), 0, 32, 32, rx, ry));
      }
      if (f === 231) { if (this.dtSkip !== 2277) audio.seStop(); this.se('Z1 エネルギー波'); n.ray0(); }
      if (f >= 231) n.fx(O, (k) => { const t = k.rt; if (k.rf >= 4 && k.rt !== 1) { k.rt++; k.rf = 0; } else if (k.rf >= 4) { k.rt = 0; k.rf = 0; } return at(BIG_BANG_BLUE, 302 * t, 0, 302, 200, 338, 156); });
    }
  },
  * dtBurning() {
    if (!this.p) return yield* this.dtOld('dtBurning');
    const st = this.agStage(), A = this.A, n = new Counters(), c173 = v(173);
    const ballHit = (O) => n.fx(O, (k) => at(BALL_BLUE(), (ss(4) ? 5 : 3) * 128, 0, 128, 128, -128 + k.ef * RAY_SPEED, 112)); // 211 / 209
    this.se('Z3 変身');
    this.pose(A, 0, true);
    if (c173 === 0 || c173 === 4) {
      for (let f = 0; f < 338; f++) {
        const U = [], O = [];
        this.dtBurningCharge(st, n, U, O, f, c173 === 4);
        if (f === 301) { st.cut(true); n.reset(); st.tecNo = 0; this.agCut(st); }
        if (f >= 311) ballHit(O);
        yield* this.agFrame(st, U, O);
      }
    } else { // the ZG pictures (battle suit, tank top, long hair)
      const set = BURNING_ZG[c173][ss(4) ? 1 : 0];
      for (let f = 0; f < 398; f++) {
        const U = [], O = [];
        if (f >= 1 && f <= 128) { U.push(aura(n, 228, 88)); if (f === 128) { st.tecNo = 6; st.cut(false); } }
        if (f >= 129 && f <= 360) {
          if (f === 129 || f === 290) audio.seStop();
          if (f === 140) this.se('ZG 気をためる2');
          if (f === 290) this.se('Z1 エネルギー波');
          A.y = -160;
          const no = f >= 290 ? 4 : f >= 255 ? 2 : f >= 245 ? 3 : f >= 235 ? 1 : f >= 190 ? 2 : 1;
          U.push(at(set[no - 1], 0, 0, 512, 128, 64, 114));
          // fill_rect with a half-clear white: the window's pixels become it (over the black behind), not a blend
          if (f >= 340) { const k = Math.min(255, 15 * (f - 340) + 160); U.push(fill(`rgb(${k},${k},${k})`)); }
        }
        if (f === 361) { st.cut(true); n.reset(); st.tecNo = 0; this.agCut(st); }
        if (f >= 371) ballHit(O);
        yield* this.agFrame(st, U, O);
      }
    }
    return yield* this.dtEnd(st, 'zd41');
  },

  * dtShiningSword() { // 2277 シャイニングソードアタック (96203)
    if (!this.p) return yield* this.dtOld('dtShiningSword');
    const st = this.agStage(), A = this.A, G = this.G, n = new Counters();
    const mecha = foeId() === 102; // only against メカフリーザ the burning attack comes first
    let sp = true, ay = 0, gy = 0, fxNo = 0;
    const pa = (k, special = sp) => { sp = special; this.pose(A, k, sp); };
    this.dtSkip = 2277;
    if (mecha) { this.se('Z3 変身'); pa(0, true); }
    // the frames as the original counts them: 0-370 with メカフリーザ, else 1001-1020 then on from 371
    const order = mecha ? Array.from({ length: 700 }, (_, i) => i) : [...Array.from({ length: 20 }, (_, i) => 1001 + i), ...Array.from({ length: 329 }, (_, i) => 371 + i)];
    for (const f of order) {
      const U = [], O = [];
      if (f <= 300) this.dtBurningCharge(st, n, U, O, f, v(173) === 3);
      if (f === 301) { n.reset(); st.tecNo = 0; G.x = CENTER_ENEX; G.y = STD_Y; }
      if (f >= 311 && f <= 370) {
        n.fx(O, (k) => at(BALL_BLUE(), (ss(4) ? 5 : 3) * 128, 0, 128, 128, -128 + k.ef * RAY_SPEED, 112));
        if (f === 334) { this.se('Z1 飛ぶ'); this.pose(G, 16, false); gy = -16; }
      }
      if (f >= 1001) { // he flies up out of the picture
        if (f === 1001) this.se('Z1 飛ぶ');
        pa(16, false);
        ay = f === 1020 ? 0 : -16;
      }
      if (f === 371) { // he and the enemy come in from the corners
        st.tecNo = 3;
        pa(3, true); this.pose(G, 0, false);
        if (mecha) this.se('Z1 飛ぶ');
        A.x = CENTER_ENEX - (96 + 8 * 49); A.y = STD_Y - 8 * 49;
        G.x = CENTER_ENEX + 8 * 52; G.y = STD_Y + 8 * 52;
        gy = 0; n.reset(); fxNo = 0;
      }
      if (f >= 372 && f <= 699) {
        if (f <= 420) { A.x += 8; A.y += 8; }
        if (f <= 450) { // he trembles (the effect counters, by hand)
          if (n.et === 0 && n.ef === 0) A.x += 4; else if (n.et === 1 && n.ef === 0) A.x -= 4;
          if (n.ef >= 2) { n.et = n.et === 0 ? 1 : 0; n.ef = 0; } else n.ef++;
        }
        if (f >= 430 && f <= 455) {
          G.x -= 16; G.y -= 16;
          if (f === 455) {
            pa(4); A.x += 16; this.se('DB3 刀');
            st.cut(true);
            if (v(173) !== 0 && ss(4)) fxNo = 269;
          }
        }
        if (f >= 455 && f <= 491 && v(173) === 0 && ss(4)) { // the close-up
          A.y = -200; G.y = -200;
          if (v(96) === 1) st.cut(false);
          U.push(at(SHINING[v(96) === 1 ? 1 : 0], 0, 0, 340, 346, 100, 10));
        }
        if (f === 492) { st.cut(true, true); A.y = STD_Y; G.y = STD_Y; pa(5); A.x -= 22; }
        // the slashes: [frame, pose, dx, effect], then 6 frames later [pose, dx back]
        for (const [kf, k, dx, e, k2, dx2, back] of [[500, 4, 22, 267, 8, 22, 6], [510, 6, 22, 268, 5, 22, 6], [520, 4, 22, 267, 3, 16, 6],
          [530, 4, 16, 269, 5, 22, 6], [540, 4, 22, 267, 8, 22, 6], [550, 6, 22, 268, 5, 22, 6], [560, 4, 22, 267, 3, 16, 6], [570, 4, 16, 269, 5, 22, 20]]) {
          if (f === kf) { this.se('DB3 刀'); pa(k); A.x += dx; n.ray0(); fxNo = e; }
          if (f === kf + back) { pa(k2); A.x -= dx2; if (kf === 570) { this.se('Z1 気を溜める'); st.tecNo = 0; } }
        }
        if (f === 630) { audio.seStop(); this.se('Z1 エネルギー波'); pa(7); fxNo = 256; n.ray0(); n.reset(); }
        if (fxNo === 267 || fxNo === 268) n.fx(O, (k) => at(SWORD[fxNo - 267], 160 * k.sword(), 0, 160, 96, 228, 118));
        else if (fxNo === 269) n.fx(O, (k) => at(SWORD[2], 96 * k.sword(), 0, 96, 160, 292, 70));
        else if (fxNo === 256) n.fx(O, (k) => at(HALF_BLUE(), 0, 0, k.ef * RAY_SPEED, 128, 304, 112));
      }
      A.y += ay; G.y += gy;
      yield* this.agFrame(st, U, O);
    }
    A.y = -160;
    this.dtSkip = 0;
    return yield* this.dtEnd(st, 'zd42');
  },

  * dtHeatDome() { // 2278 ヒートドームアタック (96565): a blow knocks the enemy up, the charge, the wave straight up, it falls on him
    if (!this.p) return yield* this.dtOld('dtHeatDome');
    const st = this.agStage(), A = this.A, G = this.G, n = new Counters();
    let ax = 0;
    this.pose(A, 0, true);
    this.se('Z1 飛ぶ');
    for (let f = 0; f < 495; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 40) { ax = 24; this.pose(A, 8, true); }
      if (f >= 41 && f <= 99) {
        if (f === 41) { A.x = -120; G.x = CENTER_ENEX; G.y = STD_Y; }
        if (f === 56) { ax = 0; A.x += 16; this.pose(A, 3, false); this.se('Z1 強打'); this.pose(G, 16, false); }
        if (f >= 56) { G.x += 24; G.y -= 12; if (f < 64) hitSpark(n, O, 330, 150); }
      }
      if (f === 100) { this.se('Z3 変身'); this.pose(A, 0, true); }
      if (f >= 101 && f <= 228) {
        U.push(aura(n, 216, 88));
        if (f === 228) { st.tecNo = 1; if (ss(4)) st.cut(false); audio.seStop(); this.se('Z1 気を溜める'); }
      }
      if (f >= 229 && f <= 370) {
        if (ss(4)) { // the ZG close-up (side panels)
          A.y = -100; st.tecNo = 4;
          U.push(at(HEAT_DOME[v(173) === 1 || v(173) === 3 ? v(173) : 0], 0, 0, 200, 284, 220, 38));
          if (f === 370) st.tecNo = 1;
        } else { st.tecNo = 1; this.pose(A, 2, true); A.y = STD_Y + 72; A.x = TEC_CENTER; }
      }
      if (f >= 371 && f <= 459) { // effect 291: the wave rises from his hands
        if (f === 371) { A.y = STD_Y + 72; A.x = TEC_CENTER; st.cut(true); this.pose(A, 2, true); n.reset(); audio.seStop(); this.se('Z1 エネルギー波'); }
        n.fx(O, (k) => at(HUGE_DOWN, 0, 800 - 140 - k.ef * RAY_SPEED, 192, 140 + k.ef * RAY_SPEED, 206, 58 - k.ef * RAY_SPEED));
      }
      if (f === 460) { this.agCut(st); n.reset(); G.x = TEC_CENTER; this.pose(G, foeId() === 127 ? 21 : 0, false); }
      if (f >= 461) { // effect 292: it comes down on him
        n.fx(O, (k) => at(HUGE_DOWN, 0, 0, 192, 400, 206, 640 - k.ef * RAY_SPEED));
        if (foeId() === 127 && f === 475) this.pose(G, 19, false);
      }
      A.x += ax;
      yield* this.agFrame(st, U, O);
    }
    return yield* this.dtEnd(st, 'zd72');
  },
});

// ---------- 未來悟飯 ----------
Object.assign(Duel.prototype, {
  * dtGohanMasenko() { // 2337 魔閃光(未来ゴハン) (97689): the blue aura, the blast (effects 203 / 204)
    if (!this.p) return yield* this.dtOld('dtGohanMasenko');
    const st = this.agStage(), A = this.A, n = new Counters();
    this.se('Z3 変身');
    this.pose(A, 12, true);
    for (let f = 0; f < 167; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 89) U.push(aura(n, 228, 88));
      if (f === 90) { audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(A, 1, true); A.x += 2; }
      if (f >= 90 && f <= 128) n.fx(O, (k) => at(BALL2(), 0, 0, 96, 64, 350 + k.ef * RAY_SPEED, 130));
      if (f === 129) { this.pose(A, 1, true); n.reset(); }
      if (f === 139) this.agCut(st);
      if (f >= 140) n.fx(O, (k) => at(BALL2(), 0, 0, 96, 64, -128 + k.ef * RAY_SPEED, 144));
      yield* this.agFrame(st, U, O);
    }
    return yield* this.dtEnd(st, 'beam'); // damage 23
  },

  * dtMakanko() { // 2340 魔貫光殺砲(未来悟飯) (97797): the shaking cut-in, the white flash, the beam
    if (!this.p) return yield* this.dtOld('dtMakanko');
    const st = this.agStage(), A = this.A, n = new Counters();
    const shakes = [[-4, 4], [0, 4], [4, 4], [-4, 0], [0, 0], [4, 0], [-4, -4], [0, -4], [4, -4]]; // pic_shake_cal (all.rb 20540)
    this.se('Z1 気を溜める3');
    A.y = -160;
    st.tec(false); st.cut(false); // (@tec_output_back = false after 32, @chr_cutin_flag = false)
    for (let f = 0; f < 248; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 130) {
        const [sx, sy] = shakes[Math.floor(Math.random() * 9)];
        if (f >= 116) U.push(fill(WHITE));
        U.push(at(GOHAN_MAKANKO[ss(6) ? 1 : 0], 0, 0, 648, 64, -4 + sx, 146 + sy));
        if (f >= 118) U.push(fill(WHITE));
        if (f === 130) { audio.seStop(); st.tec(true); }
        this.pose(A, 12, true);
      }
      if (f >= 131 && f <= 220) {
        st.cut(true);
        A.y = STD_Y;
        if (f === 160) { this.pose(A, 13, true); this.se('Z1 エネルギー波3'); }
        if (f >= 160) n.fx(O, (k) => at(MAKANKO, 0, 64, 64 + k.ef * RAY_SPEED, 64, 358, 124)); // effect 272
      }
      if (f === 221) { this.se('Z1 衝撃波'); n.reset(); st.cut(true); this.agCut(st); st.tecNo = 0; }
      if (f >= 222) n.fx(O, (k) => at(MAKANKO, 0, 0, 400, 64, -400 + k.ef * RAY_SPEED, 134)); // effect 255
      yield* this.agFrame(st, U, O);
    }
    return yield* this.dtEnd(st, 'zd41');
  },

  * dtSuperKame() { // 2341 スーパーカメハメ波(未来悟飯) (97863): the picture in the lines, the ball, the super kamehameha, the huge wave
    if (!this.p) return yield* this.dtOld('dtSuperKame');
    const st = this.agStage(), A = this.A, n = new Counters(), p = GOHAN_KAME[ss(6) ? 1 : 0];
    A.y = -120; this.pose(A, 0, false);
    st.tec(false); st.cut(false);
    for (let f = 0; f < 240; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 210) {
        const dx = f >= 121 ? Math.floor((f - 121) / 2) : 0;
        U.push(at(p, 0, 0, 250, 214, 140 - dx, 100));
        lines(n, U);
        if (f === 30) this.se('Z1 気を溜める');
        if (f >= 31 && f <= 120) {
          if (f === 120) { this.se('ZG 光線1'); n.ef = 0; }
          n.fx(O, (k) => at(BLINK.plain, 32 * k.blink(), 0, 32, 32, 342, 190));
        }
        if (f >= 121) n.fx(O, (k) => at(SUPER_KAME, 0, 0, 54 + k.ef * RAY_SPEED, 350, 342 - dx, 6));
      }
      if (f === 211) {
        st.cut(true); st.tec(true); this.agCut(st); n.reset();
        if (era() >= 2) st.small = true;
      }
      if (f >= 213) n.fx(O, (k) => at(HUGE(), 0, 0, 400, 192, -400 + k.ef * RAY_SPEED, 76)); // effect 48
      yield* this.agFrame(st, U, O);
    }
    return yield* this.dtEnd(st, 'zd42');
  },

  * dtRanbu() { // 2342 爆裂乱舞 (97952): a rush of blows across the screen and down, then the half-circle wave
    if (!this.p) return yield* this.dtOld('dtRanbu');
    const st = this.agStage(), A = this.A, G = this.G, n = new Counters();
    let sp = true;
    const pa = (k, special = sp) => { sp = special; this.pose(A, k, sp); };
    this.se('Z3 変身');
    pa(4, true);
    for (let f = 0; f < 764; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 127) U.push(aura(n, 228, 88));
      if (f === 128) { audio.seStop(); this.se('Z1 飛ぶ'); pa(7); }
      if (f >= 129 && f <= 180) A.x += 20;
      if (f === 181) { G.x = CENTER_ENEX; G.y = STD_Y; sp = true; A.x = -320; A.y = STD_Y; }
      if (f >= 182 && f <= 210) A.x += 20;
      if (f === 211) { pa(11); this.se('Z1 強打'); }
      if (f >= 212 && f <= 240) { this.pose(G, 16, false); if (f < 220) hitSpark(n, O, 346, 154); G.x += 20; G.y -= 4; }
      if (f >= 241 && f <= 260) { n.reset(); if (f === 241) this.se('Z1 飛ぶ'); A.x += 24; A.y -= 4; pa(10); }
      if (f >= 261 && f <= 289) {
        if (f === 261) { G.x = -100; G.y = STD_Y + 50; A.x = -150; A.y = STD_Y + 50; }
        if (f <= 284) { G.x += 16; G.y -= 2; } else this.pose(G, 0, false);
        A.x += 28; A.y -= 4;
      }
      if (f === 290) { pa(15); A.x = 740; A.y = STD_Y; }
      if (f >= 291 && f <= 304) A.x -= 28;
      if (f >= 305 && f <= 325) {
        if (f === 305) { this.se('ZG 打撃2'); A.x -= 28; }
        if (f < 313) hitSpark(n, O, 324, 158);
        pa(17); this.pose(G, 17, false);
        G.x -= 20;
      }
      if (f >= 326 && f <= 344) { if (f === 326) this.se('Z1 飛ぶ'); pa(15); A.x -= 28; G.x -= 20; }
      if (f === 345) { n.reset(); A.x = 900; A.y = STD_Y; G.x = 640; G.y = STD_Y; }
      if (f >= 346 && f <= 364) { A.x -= 28; G.x -= 20; }
      if (f === 365) { this.se('ZG 打撃5'); A.x -= 28; pa(16); }
      if (f >= 366 && f <= 389) { if (f < 374) hitSpark(n, O, 324, 158); G.x -= 4; G.y += 16; }
      if (f === 390) { // the strips down the sides, no more cut-in: he drives the enemy down
        n.reset(); st.cut(false); st.tecNo = 1;
        A.x = 240 - 30; A.y = -184; G.x = CENTER_ENEX - 40; G.y = -140;
        pa(10); this.se('Z1 飛ぶ');
      }
      if (f >= 391 && f <= 404) { G.y += 16; A.y += 24; A.x += 4; }
      if (f === 405) { pa(18); this.se('ZG 打撃1'); }
      if (f >= 406 && f <= 439) {
        if (f % 4 === 0) G.x += 4; else if (f % 2 === 0) G.x -= 4;
        A.y -= 4; G.y -= 4;
      }
      if (f === 440) { pa(20, true); this.se('ZG 打撃4'); }
      if (f >= 441 && f <= 469) { A.y += 2; G.y += 16; }
      if (f === 470) { this.se('Z1 飛ぶ'); pa(29); }
      if (f >= 471 && f <= 489) { A.y -= 16; A.x -= 16; }
      if (f === 509) { st.small = false; st.cut(true); st.tecNo = 0; }
      if (f === 510) { A.y = STD_Y; A.x = TEC_CENTER; this.se('Z3 変身'); pa(4, true); }
      if (f >= 510 && f <= 637) { if (f >= 570) pa(5); U.push(aura(n, 228, 88)); }
      if (f === 638) { audio.seStop(); this.se('Z1 エネルギー波'); pa(2); A.x += 2; }
      if (f >= 638 && f <= 736) n.fx(O, (k) => at(HALF_BLUE(), 0, 0, k.ef * RAY_SPEED, 128, 356, 112));
      if (f === 737) { n.reset(); this.pose(G, 16, false); this.agCut(st); }
      if (f >= 738) n.fx(O, (k) => at(HALF_BLUE(), 0, 128, 700, 128, -700 + k.ef * RAY_SPEED, 112));
      yield* this.agFrame(st, U, O);
    }
    return yield* this.dtEnd(st, 'zd42');
  },
});

// ---------- 龜仙人 ----------
Object.assign(Duel.prototype, {
  * dtMafuba() { // 2330 魔封波 (97509): the ground shakes, the whirlwind takes the enemy round and round and away
    if (!this.p) return yield* this.dtOld('dtMafuba');
    const st = this.agStage(), A = this.A, G = this.G, n = new Counters();
    let bt = 0, bf = 0, tx = 0, ty = 0, rad = 0; // @back_anime_type / frame (the whirl's direction), @temp_enex / eney, @nRadian
    this.se('Z3 変身');
    this.pose(A, 6, true);
    for (let f = 0; f < 598; f++) {
      const U = [];
      const flash = () => U.push(fill(WHITE));
      if (f >= 1 && f <= 119) U.push(aura(n, 218, 88, 'plain'));
      if (f === 90) { this.pose(A, 5, true); this.se('DB3 SE041'); }
      if (f === 120) { audio.seStop(); audio.playBgs('Z1 大地が揺れる'); st.cut(false); A.y = -180; }
      if (f >= 121 && f <= 240) {
        st.tecNo = 2;
        U.push(at(MAFUBA[sw(363) ? 1 : 0], 0, 0, 204, 160, 240 + 48 - 90, STD_Y - 20));
        if (f >= 180 && f <= 183) { if (f === 180) this.se('DB3 SE103'); flash(); }
      }
      if (f === 250) { st.tecNo = 0; this.agCut(st); }
      if (f === 270) { this.se('DB3 SE103'); bf = 0; bt = 54; }
      if (f === 280 && !this.hit) break; // (the whirlwind misses: on to the dodge)
      if (f >= 281 && f <= 340) { // it shakes him left and right
        if (f <= 284) flash();
        this.pose(G, 16, false);
        if (bt === 6) G.x += 12; else if (bt === 4) G.x -= 12;
        bf++;
        if (bf >= 3) { bf = 0; bt = { 54: 6, 56: 4, 6: 56, 4: 54 }[bt]; }
        if (f === 340) { tx = G.x; ty = G.y; }
      }
      if (f >= 341 && f <= 347) G.x += 12;
      if (f >= 348 && f <= 460) { // round and round
        if (f <= 351) flash();
        if (f === 348) { audio.seStop(); this.se('Z1 エネルギー波'); }
        G.x = tx + Math.cos(rad) * 100; G.y = ty + Math.sin(rad) * 50;
        rad += 0.25;
      }
      if (f >= 461 && f <= 550) { // away to the upper right
        if (f <= 464) flash();
        if (f === 461) this.se('Z1 エネルギー波');
        this.pose(G, 17, false);
        G.x += 16; G.y -= 8;
        if (f === 550) { G.x = CENTER_ENEX; G.y = -180; audio.seStop(); }
      }
      if (f >= 551) { // and down (into the jar)
        if (f <= 554) flash();
        if (f === 551) this.se('Z1 エネルギー波2');
        st.tecNo = 1;
        G.y += 16;
      }
      yield* this.agFrame(st, U, []);
    }
    audio.stopBgs();
    return yield* this.dtEnd(st, 'shock'); // damage 22
  },
});

// sounds these films play (tools/copy_assets.py)
export const DT_SOUNDS = ['Z3 エネルギー波', 'Z3 剣攻撃', 'Z3 変身', 'Z2 気を溜める', 'Z1 エネルギー波', 'Z1 エネルギー波2', 'Z1 エネルギー波3',
  'Z1 気を溜める', 'Z1 気を溜める3', 'ZG 気をためる2', 'Z1 飛ぶ', 'Z1 強打', 'DB3 刀', 'ZG 打撃1', 'ZG 打撃2', 'ZG 打撃4', 'ZG 打撃5',
  'ZG 光線1', 'Z1 衝撃波', 'DB3 SE041', 'DB3 SE103', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'Z3 光線系ヒット', 'Z3 跳ね返し'];
export const DT_BGS = ['Z1 大地が揺れる'];

// ---------- ?dev=andt…: the films in a battle (a Z3-era save; the moves added to the members) ----------
//   andt        特蘭克斯 (171-181 185), 未來悟飯 (236-242 245), 龜仙人 (230) vs 20號 (a Z3 enemy: his cut-in)
//   andtss      超特蘭克斯・超未來悟飯 (超 pictures) and 龜仙人 in his everyday clothes vs 20號
//   andtcos1-4  特蘭克斯 in 換裝 1-4 (variable 173: battle suit, tank top, long hair, long hair with the sword) and 超特蘭克斯
//   andtmecha   特蘭克斯 vs メカフリーザ (enemy 102: 2277's whole film)     andtcell  vs 沙魯(第１形態) (enemy 127: 2278)
//   andtz2      the same as andt in Z2 (variable 40 = 1: the Z2 strips)   andtfield  the andt party on the map (normal encounters)
const ADD = { 17: [171, 172, 173, 174, 176, 177, 178, 181, 185], 20: [171, 172, 173, 174, 176, 177, 178, 181],
  25: [236, 237, 238, 240, 241, 242, 245], 26: [236, 237, 238, 240, 241, 242], 24: [230] };
registerZ3('andt', {
  dev(game, step) {
    const m = /^andt(ss|cos([1-4])|mecha|cell|z2|field)?$/.exec(step);
    if (!m) return false;
    const s = game.state = game.newState();
    s.var[40] = m[1] === 'z2' ? 1 : 2;
    s.var[43] = 60;
    s.flags.z3 = 'done';
    if (m[2]) s.var[173] = Number(m[2]);
    if (m[1] === 'ss') s.sw[363] = true;
    party(game, m[1] === 'mecha' || m[1] === 'cell' || m[2] ? [17] : [17, 25, 24]);
    if (m[1] === 'ss' || m[2]) { superSaiyan(game.world, s, 4, true); if (m[1] === 'ss') superSaiyan(game.world, s, 6, true); }
    for (const x of s.party) {
      x.level = 50; x.exp = game.world.actors[x.id].exp[50]; applyLevel(game.world, x); heal(x);
      for (const id of ADD[x.id] || []) if (!x.skills.includes(id)) x.skills.push(id);
    }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    const foes = { mecha: [102], cell: [127], z2: [52], field: null }[m[1]];
    if (foes !== null) setTimeout(() => game.startBattle(foes || [122], true, { loseOk: true }), 300);
    return true;
  },
});

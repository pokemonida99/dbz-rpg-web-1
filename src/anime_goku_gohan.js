// 悟空・悟飯's special-move films (docs/anim-ab-plan.md anga), ported frame by frame from the original's
// Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like src/anime.js: the attack pattern (skill id + 10) runs
// anime_pattern 31 (swoop in) → 32 (必殺技!) → the move's own pattern → the damage pattern:
//   26 スーパーカメハメ波 36 → 1126, damage 42        27 瞬間移動かめはめ波 (超悟空) 37 → 2127, 43
//   29 / 59 超サイヤ人変身 39 / 69 → 2129 (no attack; also 133 / 185 / 245 of 貝吉塔 / 未來悟飯 / 巴達克: the same film)
//   48 カメハメ波(悟飯) 58 → 1148, 23                52 爆裂ラッシュ 62 → 1152, 24 (Z2) / 46 (Z3)
//   53 激烈ませんこう 63 → 2153, 43                   54 スーパーかめはめ波(悟飯) (超悟飯) 64 → 2154, 43
// From Z2 on ($btl_progress = variable 40 ≥ 1) the original also draws the special-move strips (output_back:
// @tec_output_back from frame 30 of pattern 32) and the cut-in (output_cutin: the member's 味方カットイン, after the
// cut to the defender the enemy's 敵カットイン). src/anime.js has neither yet, so these films bring their own: a wrap
// of launch() and render() that only acts for them (agSt). Frame numbers in the comments are @battle_anime_frame.
import { audio, img, loadImages } from './core.js?v=20261103-0338';
import { Duel, addMoves, moveFilm, draw, spark, SW, SH, STD_Y, CENTER_ENEX, CENTER_CHAX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261103-0338';
import { battleHooks } from './battle.js?v=20261103-0338';
import { registerZ3, party, heal } from './z3.js?v=20261103-0338';
import { superSaiyan, moveTransforms } from './supersaiyan.js?v=20261103-0338';
import { applyLevel } from './party.js?v=20261103-0338';

addMoves({
  26: 'angaSuperKame', 27: 'angaShunkanKame', 29: 'angaSs', // 悟空
  48: 'angaGohanKame', 52: 'angaBurstRush', 53: 'angaGekiretsu', 54: 'angaGohanSuperKame', 59: 'angaSs', // 悟飯
  133: 'angaSs', 185: 'angaSs', 245: 'angaSs', // 貝吉塔・未來悟飯・巴達克的超サイヤ人変身 (2129 too)
});

// every picture goes through pic() (tools/copy_assets.py collects them from this file)
const pic = (n) => `Graphics/Pictures/${n}`;
const era = () => Math.min(2, (globalThis.__game && globalThis.__game.state && globalThis.__game.state.var && globalThis.__game.state.var[40]) || 0);
const v = (n) => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[n]) || 0; };
const sw = (n) => { const s = globalThis.__game && globalThis.__game.state; return !!(s && s.sw && s.sw[n]); };
// $btl_top_file_name pictures: Z2_ / Z3_ (these moves are never used in Z1)
const Z23 = (z2, z3) => () => (era() >= 2 ? z3 : z2);
const BALL = Z23(pic('Z2_戦闘_必殺技_エネルギー弾.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾.PNG')); // 6 frames of 128×128
const BALL2 = Z23(pic('Z2_戦闘_必殺技_エネルギー弾2.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾2.PNG')); // 96×64, the lower half mirrored
const HUGE = Z23(pic('Z2_戦闘_必殺技_エネルギー波_特大.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG')); // 400×192 ×2
const DOWN = Z23(pic('Z2_戦闘_必殺技_エネルギー波_中_縦.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_中_縦.PNG')); // 60×400 ×2
const HALF = pic('Z3_戦闘_必殺技_エネルギー波_半円.PNG'), HALF_GREEN = pic('Z3_戦闘_必殺技_エネルギー波_半円(緑).PNG'); // 700×128 ×2
const AURA3 = { plain: pic('Z3_戦闘_必殺技_気を溜める.png'), blue: pic('Z3_戦闘_必殺技_気を溜める(青).png'),
  green: pic('Z3_戦闘_必殺技_気を溜める(緑).png') }; // back 201: 2 frames of 136×142
const AURA2 = pic('Z2_戦闘_必殺技_気を溜める3.png'); // back 101: 3 frames of 184×240
const BLINK = pic('Z3_必殺技_超カメハメ波(球点滅).png'), BLINK_SMALL = pic('Z3_必殺技_超カメハメ波(球点滅小).png'); // effects 235 / 237
const SUPER_KAME = pic('Z3_必殺技_超カメハメ波.png'); // effect 236: 500×350
const KAME_LINES = [pic('Z3_必殺技_超カメハメ波(バック上).png'), pic('Z3_必殺技_超カメハメ波(バック下).png')]; // back 106
const GOKU_1126 = [pic('Z3_必殺技_超カメハメ波(悟空).png'), pic('Z3_必殺技_超カメハメ波(悟空_ボロボロ).png'),
  pic('Z3_必殺技_超カメハメ波(悟空_さらにボロボロ).png'), pic('Z3_必殺技_超カメハメ波(悟空_バトルスーツ).png')]; // 104×180
const GOKU_2127 = [[pic('ZG_必殺技_超カメハメ波1(悟空).PNG'), pic('ZG_必殺技_超カメハメ波2(悟空).PNG')],
  [pic('ZG_必殺技_超カメハメ波1(悟空_ボロボロ).PNG'), pic('ZG_必殺技_超カメハメ波2(悟空_ボロボロ).PNG')],
  [pic('ZG_必殺技_超カメハメ波1(悟空_さらにボロボロ).png'), pic('ZG_必殺技_超カメハメ波2(悟空_さらにボロボロ).png')],
  [pic('ZG_必殺技_超カメハメ波1(悟空_バトルスーツ).PNG'), pic('ZG_必殺技_超カメハメ波2(悟空_バトルスーツ).PNG')]]; // 122×212
const BEAM_BIG = pic('ZG_必殺技_光線_大.PNG'), BEAM_BIG_GREEN = pic('ZG_必殺技_光線_大(緑).PNG'); // 316×158
const GEKIRETSU = [[pic('ZG_必殺技_激烈魔閃光1(悟飯).PNG'), pic('ZG_必殺技_激烈魔閃光2(悟飯).PNG')],
  [pic('ZG_必殺技_激烈魔閃光1(悟飯)_赤道着.png'), pic('ZG_必殺技_激烈魔閃光2(悟飯)_赤道着.png')]]; // 80×176
const ROCK = pic('ZG_必殺技_岩.PNG');
const OYAKO = [pic('Z3_必殺技_親子カメハメ波(ゴハンのみ).png'), pic('Z3_必殺技_親子カメハメ波(ゴハンのみ)_赤道着.png')]; // 114×184
const BOOM3 = pic('戦闘アニメ_爆発3.PNG'), BOOM4 = pic('戦闘アニメ_爆発4.PNG'); // effects 102 (112×120 ×2) / 103 (176×144 ×2)
// output_back: the special-move strips (no 0 across, 1 down the sides, 4 the ZG super kamehameha's side panels)
const TEC2 = { top: pic('Z2_戦闘_必殺技_背景_上.png'), low: pic('Z2_戦闘_必殺技_背景_下.png'), left: pic('Z2_戦闘_必殺技_背景_左.png'),
  right: pic('Z2_戦闘_必殺技_背景_右.png') };
const TEC3 = { top: pic('Z3_戦闘_必殺技_背景_上.png'), low: pic('Z3_戦闘_必殺技_背景_下(加工).PNG'), left: pic('Z3_戦闘_必殺技_背景_左(加工).PNG'),
  right: pic('Z3_戦闘_必殺技_背景_右(加工).PNG') };
const KAME_SIDES = [pic('ZG_戦闘_必殺技_背景_超カメハメ波_左.PNG'), pic('ZG_戦闘_必殺技_背景_超カメハメ波_右.PNG')]; // 3 frames of 176×320
// output_cutin: 640×64 a row (味方: actor id − 3, 敵: enemy id − 31 (Z2) / − 101 (Z3))
const CUT = { 1: pic('Z2_味方カットイン.PNG'), 2: pic('Z3_味方カットイン.PNG'), zg: pic('ZG_味方カットイン.PNG') };
const FOE_CUT = { 1: pic('Z2_敵カットイン.PNG'), 2: pic('Z3_敵カットイン.PNG') };
// 2129: the aura behind the new form (3 frames, 224 high) and the form's two pictures
const SS = {
  goku: [[pic('Z3_スーパーサイヤ人_悟空_気1.PNG'), pic('Z3_スーパーサイヤ人_悟空_気2.PNG'), pic('Z3_スーパーサイヤ人_悟空_気3.PNG')], 286],
  vegeta: [[pic('Z3_スーパーサイヤ人_ベジータ_気1.PNG'), pic('Z3_スーパーサイヤ人_ベジータ_気2.PNG'), pic('Z3_スーパーサイヤ人_ベジータ_気3.PNG')], 284],
  trunks: [[pic('Z3_スーパーサイヤ人_トランクス_気1.PNG'), pic('Z3_スーパーサイヤ人_トランクス_気2.PNG'), pic('Z3_スーパーサイヤ人_トランクス_気3.PNG')], 302],
};
const SS_GOKU = [[pic('Z3_スーパーサイヤ人悟空1.PNG'), pic('Z3_スーパーサイヤ人悟空2.PNG')],
  [pic('Z3_スーパーサイヤ人悟空(道着ボロボロ)1.png'), pic('Z3_スーパーサイヤ人悟空(道着ボロボロ)2.png')],
  [pic('Z3_スーパーサイヤ人悟空(道着さらにボロボロ)1.png'), pic('Z3_スーパーサイヤ人悟空(道着さらにボロボロ)2.png')],
  [pic('Z3_スーパーサイヤ人悟空(バトルスーツ)1.png'), pic('Z3_スーパーサイヤ人悟空(バトルスーツ)2.png')]];
const SS_GOHAN = [[pic('Z3_スーパーサイヤ人_ゴハン1.png'), pic('Z3_スーパーサイヤ人_ゴハン2.png'), pic('Z3_スーパーサイヤ人_ゴハン3.png')],
  [pic('Z3_スーパーサイヤ人_ゴハン1_赤道着.png'), pic('Z3_スーパーサイヤ人_ゴハン2_赤道着.png'), pic('Z3_スーパーサイヤ人_ゴハン3_赤道着.png')]];
const SS_TRUNKS = [[pic('Z3_スーパーサイヤ人トランクス1.PNG'), pic('Z3_スーパーサイヤ人トランクス2.PNG')],
  [pic('Z3_スーパーサイヤ人トランクス（戦闘服・髪結）_01.png'), pic('Z3_スーパーサイヤ人トランクス（戦闘服・髪結）_02.png')],
  [pic('Z3_スーパーサイヤ人トランクス（剣なし・タンクトップ）_01.png'), pic('Z3_スーパーサイヤ人トランクス（剣なし・タンクトップ）_02.png')],
  [pic('Z3_スーパーサイヤ人トランクス（剣なし・タンクトップ・ロンゲ）_01.png'), pic('Z3_スーパーサイヤ人トランクス（剣なし・タンクトップ・ロンゲ）_02.png')],
  [pic('Z3_スーパーサイヤ人トランクス（剣あり・袖なし・ロンゲ）_01.png'), pic('Z3_スーパーサイヤ人トランクス（剣あり・袖なし・ロンゲ）_02.png')]];
const SS_OTHERS = { vegeta: [pic('Z3_スーパーサイヤ人ベジータ1.PNG'), pic('Z3_スーパーサイヤ人ベジータ2.PNG')],
  futureGohan: [pic('Z3_スーパーサイヤ人未来悟飯1.png'), pic('Z3_スーパーサイヤ人未来悟飯2.png')],
  bardock: [pic('Z3_スーパーサイヤ人バーダック1.png'), pic('Z3_スーパーサイヤ人バーダック2.png')] };
// the member (actor id) → { aura frames, aura width, picture x, picture width, [picture 1, picture 2] } (all.rb 92157)
function ssLook(id) {
  const g = ([ki, kw], x, w, p) => ({ ki, kw, x, w, p });
  if (id === 3) return g(SS.goku, 178, 286, SS_GOKU[[0, 1, 2, 3].includes(v(171)) ? v(171) : 0]);
  if (id === 5) { const p = SS_GOHAN[v(172) === 2 ? 1 : 0]; return g(SS.vegeta, 88, 512, [p[0], p[1]]); }
  if (id === 18) { const p = SS_GOHAN[v(172) === 2 ? 1 : 0]; return g(SS.vegeta, 88, 512, [p[1], p[2]]); } // 超2
  if (id === 12) return g(SS.vegeta, 178, 282, SS_OTHERS.vegeta);
  if (id === 17) return v(173) >= 1 && v(173) <= 4 ? g(SS.trunks, 32, 512, SS_TRUNKS[v(173)]) : g(SS.trunks, 178, 302, SS_TRUNKS[0]);
  if (id === 25) return g(SS.goku, 178, 286, SS_OTHERS.futureGohan);
  if (id === 16) return g(SS.trunks, 30, 512, SS_OTHERS.bardock);
  return null;
}
const ssPictures = (id) => { const s = ssLook(id); return s ? [...s.ki, ...s.p] : []; };

// pictures each film shows, loaded while it swoops in (img() starts them)
const FILM_PICTURES = {
  angaSuperKame: () => [GOKU_1126[0], ...GOKU_1126.slice(1), ...KAME_LINES, BLINK, SUPER_KAME, HUGE(), BOOM4],
  angaShunkanKame: () => [AURA3.blue, BLINK_SMALL, BLINK, ...GOKU_2127[0], ...GOKU_2127[[0, 1, 2, 3].includes(v(171)) ? v(171) : 0], BEAM_BIG, HALF, ...KAME_SIDES],
  angaGohanKame: () => [BALL2()],
  angaBurstRush: () => [AURA3.blue, AURA2, DOWN(), BOOM3],
  angaGekiretsu: () => [AURA3.green, ...GEKIRETSU[v(172) === 2 ? 1 : 0], ROCK, BEAM_BIG_GREEN, HALF_GREEN],
  angaGohanSuperKame: () => [AURA3.plain, BLINK_SMALL, BLINK, OYAKO[v(172) === 2 ? 1 : 0], BALL(), HUGE(), ...KAME_SIDES],
  angaSs: () => [],
};
// pattern 32 (all.rb 72525): @chr_cutin_flag (the member's cut-in from frame 30) and @tec_back_small, by attack pattern
const LAUNCH = { angaSuperKame: { cut: true }, angaShunkanKame: { cut: true, small: true }, angaSs: { cut: true },
  angaGohanKame: {}, angaBurstRush: { cut: true, small: 'z3' }, angaGekiretsu: { cut: true }, angaGohanSuperKame: { cut: true, small: true } };

// an animation counter as the original keeps one (back / ray frames): the picture first, then `>= every` moves to the
// next of n, then the counter goes up
class Cyc {
  constructor(every, n) { this.every = every; this.n = n; this.k = 0; this.f = 0; }
  next() { const k = this.k; if (this.f >= this.every) { this.k = (this.k + 1) % this.n; this.f = 0; } this.f++; return k; }
}
const at = (sheet, sx, sy, w, h, x, y) => (c) => { if (w > 0 && h > 0) draw(c, sheet, sx, sy, w, h, x, y); };
const fill = (color) => (c) => { c.fillStyle = color; c.fillRect(0, 0, SW, SH); };
const afterImage = (x, y) => (c) => spark(c, 0, 48, 64, 64, x, y);

// ---------- the strips and the cut-in ----------
// a picture `w` wide repeated across, scrolled `off` px to the left
function across(c, sheet, w, h, y, off) { const x = -(off % w); draw(c, sheet, 0, 0, w, h, x, y); draw(c, sheet, 0, 0, w, h, x + w, y); }
function down(c, sheet, w, h, x, off) { const y = -(off % h); draw(c, sheet, 0, 0, w, h, x, y); draw(c, sheet, 0, 0, w, h, x, y + h); }
function tecBack(c, d, st) {
  if (!st.era || d.t < st.tecFrom) return;
  const t = d.t;
  if (st.tecNo === 4) { const k = t % 3; draw(c, KAME_SIDES[0], k * 176, 0, 176, 320, 0, 18); draw(c, KAME_SIDES[1], k * 176, 0, 176, 320, SW - 176, 18); return; }
  if (st.era === 1) { // Z2: 640×64 strips, 12 px a frame
    if (st.tecNo === 1) { down(c, TEC2.left, 64, 640, 0, t * 12); down(c, TEC2.right, 64, 640, SW - 64, t * 12); return; }
    across(c, TEC2.top, 640, 64, 0, t * 12); across(c, TEC2.low, 640, 64, 292, t * 12);
    return;
  }
  if (st.tecNo === 1) { down(c, TEC3.left, 94, 360, 0, t * 16); down(c, TEC3.right, 92, 360, SW - 94, t * 16); return; }
  across(c, TEC3.top, 648, st.small ? 64 : 110, 0, t * 8);
  across(c, TEC3.low, 648, st.small ? 60 : 114, st.small ? 296 : 242, t * 8);
}
// set_battle_cutin_name (all.rb 19240) / the enemy's row
function cutIn(c, d, st) {
  if (!st.era || d.t < st.cutFrom) return;
  const g = globalThis.__game, b = g && g.scene, duel = b && b.duel, s = (g && g.state) || {};
  if (!duel) return;
  if (!st.mirror) {
    const id = duel.m && duel.m.id;
    if (!id) return;
    let sheet = CUT[st.era], row = id - 3;
    if (st.era === 2 && id === 14 && v(171) === 2) [sheet, row] = [CUT.zg, 10]; // Z3悟空 (さらにボロボロ)
    if (st.era === 2 && id === 5 && sw(445)) [sheet, row] = [CUT.zg, 6]; // Z3悟飯短髪
    if (st.era === 2 && id === 18 && s.ss && s.ss[5]) [sheet, row] = [CUT.zg, 2]; // 超サイヤ人2
    draw(c, sheet, 0, row * 64, 640, 64, 0, 292);
  } else {
    const id = duel.f && duel.f.id;
    if (!id || id < 31) return; // a Z1 enemy has none
    const z2 = id < 101, sheet = FOE_CUT[z2 ? 1 : 2], row = id - (z2 ? 31 : 101), im = img(sheet);
    if (im.ok && (row + 1) * 64 <= im.im.height) draw(c, sheet, 0, row * 64, 640, 64, 0, 292);
  }
}

// ---------- the Duel side ----------
const MINE = new Set(Object.keys(FILM_PICTURES));
const baseLaunch = Duel.prototype.launch, baseRender = Duel.prototype.render;
Object.assign(Duel.prototype, {
  // what these films draw besides the fighters: the strips and pictures behind them, effects in front, the cut-in on top
  agStage() {
    if (this.agSt) return this.agSt;
    const st = this.agSt = { era: this.constructor === Duel && this.p ? era() : 0, tecFrom: Infinity, cutFrom: Infinity,
      mirror: false, tecNo: 0, small: (this.G.sheets.size || 96) > 96, under: [], over: [] };
    st.tec = (on) => { st.tecFrom = on ? 0 : Infinity; };
    st.cut = (on, mirror = st.mirror) => { st.cutFrom = on ? 0 : Infinity; st.mirror = mirror; };
    st.install = () => {
      this.behind((c) => { tecBack(c, this, st); for (const f of st.under) f(c); });
      this.effect((c) => { for (const f of st.over) f(c); });
    };
    st.install();
    return st;
  },
  * launch() { // 32, plus the strips and the cut-in from its frame 30 (Z2 on)
    const film = this.constructor === Duel && this.p && moveFilm(this.skill);
    if (MINE.has(film)) {
      const st = this.agStage(), cfg = LAUNCH[film];
      FILM_PICTURES[film]().forEach((p) => img(p));
      if (st.era) {
        st.tecFrom = this.t + 29;
        if (cfg.cut) st.cutFrom = this.t + 29;
        if (cfg.small === true || (cfg.small === 'z3' && st.era >= 2)) st.small = true;
      }
    }
    yield* baseLaunch.call(this);
  },
  render() {
    const cv = baseRender.call(this);
    if (this.agSt) cutIn(this.c, this, this.agSt);
    return cv;
  },
  // set_chr_display_out: the attacker leaves, the defender stands in the middle (the enemy's cut-in from now on)
  agCut(st) {
    this.A.y = -200;
    this.G.x = CENTER_ENEX; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    if (st.cutFrom !== Infinity) st.mirror = true;
  },
  // one frame of a film: what is behind / in front, the moves (the original's @ax @ay @gx @gy), then show it
  * agFrame(st, under, over, mv) {
    st.under = under; st.over = over;
    if (mv) this.vel(mv.ax, mv.ay, mv.gx, mv.gy);
    yield;
  },
  // 42 爆発系ZD大 (effect 103) / 46 爆発系ZD中縦 (effect 102); only for a film in its own battle (not inside a combo)
  * agZd(big) {
    this.se(big ? 'ZG 光線系ヒット3' : 'ZG 光線系ヒット2');
    this.showHit();
    this.pose(this.G, 17, false);
    const [sheet, w, h, x] = big ? [BOOM4, 176, 144, 298] : [BOOM3, 112, 120, 318];
    this.effect((c, t) => { const k = t <= 10 ? 0 : t <= 20 ? 1 : -1; if (k >= 0) draw(c, sheet, k * w, 0, w, h, x, 120); });
    for (let f = 1; f < (big ? 60 : 45); f++) {
      if (big && f >= 21 && f <= 39) this.vel(0, 0, -20, 0);
      if (big && f === 40) this.effect(null);
      if (!big && f >= 21 && f <= 35) this.vel(0, 0, 0, 20);
      yield;
    }
  },
  * agEnd(st, kind) { // the film is over: the strips and the cut-in stay through the damage, the rest goes
    st.under = []; st.over = [];
    if (this.constructor !== Duel) return kind === 'zd42' || kind === 'zd46' ? 'big' : kind;
    if (kind !== 'zd42' && kind !== 'zd46') return kind;
    if (!this.hit) return 'miss'; // (src/anime.js run: the defender dodges)
    yield* this.agZd(kind === 'zd42');
    return 'none';
  },

  // ---------- 悟空 ----------
  * angaSuperKame() { // 1126 スーパーカメハメ波 (all.rb 78896): the picture of 悟空 in the lines, the ball, the huge wave
    if (!this.p) return yield* this.kamehameha();
    const st = this.agStage(), A = this.A, G = this.G;
    const e = st.era, c171 = v(171);
    const goku = GOKU_1126[c171 === 1 && e === 2 ? 1 : c171 === 2 && e >= 1 ? 2 : c171 === 3 && e === 2 ? 3 : 0];
    const lines = new Cyc(4, 3), ray = new Cyc(4, 5);
    let ef = 0;
    A.y = -120; st.tec(false); st.cut(false);
    for (let f = 0; f < 240; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 210) {
        const dx = f >= 121 ? Math.floor((f - 121) / 2) : 0, bx = 164 - dx, rx = 246 - dx;
        const k = lines.next();
        U.push(at(goku, 0, 0, 104, 180, bx, 122), at(KAME_LINES[0], 0, 128 * k, 384, 128, 0, 0), at(KAME_LINES[1], 0, 64 * k, 192, 64, 0, 292));
        if (f === 30) this.se('Z1 気を溜める');
        if (f >= 31 && f <= 120) {
          if (f === 120) { this.se('ZG 光線1'); ef = 0; }
          O.push(at(BLINK, 32 * ray.next(), 0, 32, 32, rx, 182)); ef++;
        } else if (f >= 121) { O.push(at(SUPER_KAME, 0, 0, Math.min(500, 54 + ef * RAY_SPEED), 350, rx, 6)); ef++; }
      }
      if (f === 211) { st.tec(true); st.cut(true); if (e >= 2) st.small = true; this.agCut(st); ef = 0; }
      if (f >= 213) { O.push(at(HUGE(), 0, 0, 400, 192, -400 + ef * RAY_SPEED, 76)); ef++; }
      yield* this.agFrame(st, U, O);
    }
    return yield* this.agEnd(st, 'zd42');
  },

  * angaShunkanKame() { // 2127 瞬間移動かめはめ波 (all.rb 92138): charge, vanish, appear beside the enemy, the ZG close-up, the wave
    if (!this.p) return yield* this.kamehameha();
    const st = this.agStage(), A = this.A, G = this.G;
    const c171 = [0, 1, 2, 3].includes(v(171)) ? v(171) : 0, [close1, close2] = [GOKU_2127[c171][0], GOKU_2127[c171][1]];
    const aura = new Cyc(16, 2), ray = new Cyc(4, 5);
    let ef = 0;
    this.se('Z3 変身');
    this.pose(A, 0, true);
    for (let f = 0; f < 821; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 270) U.push(at(AURA3.blue, 136 * aura.next(), 0, 136, 142, 228, 88)); // back 201 (@ray_color 3)
      if (f === 90) { this.se('Z1 気を溜める'); this.pose(A, 2, true); }
      if (f >= 151 && f <= 270) { // effect 237: the small ball
        if (f === 231) this.se('Z1 気を溜める2');
        O.push(at(BLINK_SMALL, 16 * ray.next(), 0, 16, 16, 284, 160)); ef++;
      }
      if (f >= 271 && f <= 349) { O.push(at(BLINK, 32 * ray.next(), 0, 32, 32, 276, 152)); ef++; } // effect 235
      if (f >= 351 && f <= 410) { // he vanishes at high speed
        if (f === 351) { audio.seStop(); this.se('Z1 高速移動'); A.y = -200; }
        if (f % 4 === 0) U.push(afterImage(TEC_CENTER + 12, STD_Y + 20));
      }
      if (f === 420) { G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); A.x -= 48; }
      if (f >= 451 && f <= 480) {
        if (f === 451) this.se('Z1 高速移動');
        if (f % 4 === 0) U.push(afterImage(TEC_CENTER + 12 - 48, STD_Y + 20));
      }
      if (f >= 481 && f <= 540) { // back beside the enemy, the ball in his hands
        if (f === 481) this.se('Z1 気を溜める2');
        A.y = STD_Y;
        O.push(at(BLINK, 32 * ray.next(), 0, 32, 32, 228, 152)); ef++;
        if (f === 540) st.tecNo = 4;
      }
      if (f >= 541 && f <= 650) { // the ZG close-up (the ball still in front)
        if (f === 541) { audio.seStop(); this.se('ZG SE053'); }
        st.cut(false); G.y = -200; A.y = -200;
        U.push(at(close2, 0, 0, 122, 212, 258, 46));
        O.push(at(BLINK, 32 * ray.next(), 0, 32, 32, 274, 132)); ef++;
      }
      if (f >= 651 && f <= 719) { // he fires: the close-up, the big beam, a white flash
        if (f === 651) { audio.seStop(); this.se('ZG SE040'); }
        U.push(at(close1, 0, 0, 122, 212, 258, 46), at(BEAM_BIG, 0, 0, 316, 158, 162, 46 + 134));
        if (f <= 658) U.push(fill('#fff'));
        if (f === 719) st.tecNo = 0;
      }
      if (f === 720) { st.cut(true); st.tecNo = 0; this.agCut(st); A.y = STD_Y; }
      if (f >= 721) { // the half-circle wave from his hands, already at its full length (its frame count kept running)
        if (f === 721) { audio.seStop(); this.se('ZG 光線1'); }
        G.y = -200;
        this.pose(A, 3, true);
        O.push(at(HALF, 0, 0, Math.min(700, ef * RAY_SPEED), 128, 308, 96)); ef++;
      }
      yield* this.agFrame(st, U, O);
    }
    G.y = STD_Y; A.y = -200;
    return yield* this.agEnd(st, 'big');
  },

  * angaSs() { // 2129 超サイヤ人変身 (all.rb 92287): the purple screen, the black band shaking, the aura, the new form
    const st = this.agStage();
    const g = globalThis.__game, duel = g && g.scene && g.scene.duel, id = (duel && duel.m && duel.m.id) || 3;
    const look = ssLook(id) || ssLook(3);
    st.cut(false);
    this.A.y = -200;
    let shake = false, k = 0, kf = 0;
    for (let f = 0; f < 596; f++) { // (595: Graphics.fadeout(10) — here the film's own fade-out at its end)
      if (f === 91) this.se('Z3 変身');
      if (f >= 91 && f <= 354 && (f - 90) % 4 === 0) shake = !shake;
      if (f >= 211 && f <= 274) { kf++; if (kf >= 9) { kf = 1; k ^= 1; } } else if (f >= 275 && f <= 354) { kf++; if (kf >= 5) { kf = 1; k ^= 1; } } else if (f >= 355) k = 1;
      const y = 128 - (shake ? 8 : 0), ki = f >= 92 ? Math.floor((f - 92) / 4) % 3 : -1, p = look.p[k];
      st.under = [(c) => {
        c.fillStyle = 'rgb(144,64,240)'; c.fillRect(0, 0, SW, SH); // set_skn_color 0 (the window skin's (127, 127))
        c.fillStyle = '#000'; c.fillRect(0, y, SW, 224);
        if (ki >= 0) draw(c, look.ki[ki], 0, 0, look.kw, 224, 178, y);
        draw(c, p, 0, 0, look.w, 224, look.x, y);
      }];
      st.over = [];
      yield;
    }
    return 'none'; // (the purple screen stays through the fade-out)
  },
});
// 超サイヤ人變身 in battle: the film (patterns 31, 32, 2129) first, then src/battle.js (or src/grw.js for 超2 悟飯) makes
// the change as before
const prevAct = battleHooks.act;
battleHooks.act = async (b, i, skill) => {
  const m = b.party[i], s = b.game.state;
  if (skill && skill.ss && (moveTransforms(m) || (m.id === 18 && !(s.ss && s.ss[5])))) {
    const foe = b.foes.find((f) => f.hp > 0);
    if (foe && ssLook(m.id)) {
      if (!moveFilm(skill.id)) addMoves({ [skill.id]: 'angaSs' });
      const p = b.plans && b.plans[i], cd = p && b.hand[p.card];
      if (foe.card && cd) b.duel = { m, mc: cd, f: foe, fc: foe.card };
      b.say(`${m.name} 的${skill.name}！`);
      await loadImages(ssPictures(m.id));
      await b.play(m, foe, true, skill.id, -1, foe);
    }
  }
  return prevAct ? prevAct(b, i, skill) : false;
};


// ---------- 悟飯 ----------
// 1152's rush of blows (241-274): the frames he changes pose (1 / 2, a hit sound) and the sparks between (effect 123 at y)
const RUSH_POSE = [241, 247, 251, 255, 259, 263, 267, 271];
const RUSH_HIT = [[242, 246, 154], [248, 250, 140], [252, 254, 154], [256, 258, 140], [260, 262, 154], [264, 266, 140], [268, 270, 154], [272, 274, 140]];
// 2153's rocks rising from the ground (ZG_必殺技_岩: big 28×20 at 4 px a frame, small 16×14 at 2)
const ROCKS = [[166, 560, 1], [230, 540, 0], [260, 480, 1], [364, 480, 1], [420, 480, 0], [480, 500, 1], [200, 580, 0], [440, 600, 1], [400, 520, 0]];
Object.assign(Duel.prototype, {
  * angaGohanKame() { // 1148 カメハメ波(悟飯) (all.rb 79194): the blast (effect 203), then it hits (effect 204)
    if (!this.p) return yield* this.kamehameha();
    const st = this.agStage(), A = this.A;
    const mv = { ax: 0, ay: 0, gx: 0, gy: 0 };
    let ef = 0;
    this.se('Z1 気を溜める');
    this.pose(A, 11, true);
    for (let f = 0; f < 111; f++) {
      const O = [];
      if (f >= 41 && f <= 45) this.pose(A, 12, true);
      if (f === 46) { audio.seStop(); this.se('Z3 エネルギー波'); }
      if (f >= 47 && f <= 75) {
        if (st.era !== 1) { if (f === 47) mv.ax = 2; if (f === 50) mv.ax = -2; if (f === 53) mv.ax = 0; } // ($btl_progress >= 2)
        O.push(at(BALL2(), 0, 0, 96, 64, 340 + ef * RAY_SPEED, 142)); ef++;
      }
      if (f === 76) ef = 0;
      if (f === 80) this.agCut(st);
      if (f >= 81) { O.push(at(BALL2(), 0, 0, 96, 64, -128 + ef * RAY_SPEED, 144)); ef++; }
      yield* this.agFrame(st, [], O, mv);
    }
    return yield* this.agEnd(st, 'beam'); // damage 23
  },

  * angaBurstRush() { // 1152 爆裂ラッシュ (all.rb 79225): he vanishes, a rush of blows, he flies up and the beam falls on the enemy
    if (!this.p) return yield* this.kamehameha();
    const st = this.agStage(), A = this.A, G = this.G, z3 = st.era !== 1;
    const mv = { ax: 0, ay: 0, gx: 0, gy: 0 }, back = z3 ? new Cyc(16, 2) : new Cyc(4, 3);
    const short = sw(445); // 悟飯短髪: his rows one further on
    let ef = 0;
    this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    this.pose(A, 0, false); // (@output_anime_type 0: the normal sheet)
    for (let f = 0; f < 432; f++) {
      const U = [];
      let fx = null; // this frame's effect: 123 at y, 'fist' (121), 'down' (257), 'fall' (258)
      if (f >= 1 && f <= 130) U.push(z3 ? at(AURA3.blue, 136 * back.next(), 0, 136, 142, 228, 88) : at(AURA2, 184 * back.next(), 0, 184, 240, 198, 34));
      if (f === 90) { audio.seStop(); this.se('Z1 高速移動'); A.y = -120; }
      if (f >= 91 && f <= 130 && f % 4 === 0) U.push(afterImage(A.x - 6, 146));
      if (f === 131) { // he comes in from the left
        this.se('Z1 逃げる');
        G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false);
        A.x = -200; A.y = STD_Y; this.pose(A, 16, false); mv.ax = 20;
      }
      if (f === 156 || f === 157) { // the first blow knocks the enemy back a little
        mv.ax = 0; this.pose(A, 3); mv.gx = -8; this.pose(G, 16);
        if (f === 156) { audio.seStop(); this.se('ZG 打撃4'); }
      }
      if (f >= 156 && f <= 163) fx = 154;
      if (f === 158) mv.gx = 8;
      if (f === 160) mv.gx = 0;
      if (f === 164) { ef = 0; this.pose(A, 0); mv.ax = -12; mv.ay = 6; }
      if (f === 172) { mv.ax = 0; mv.ay = 0; this.pose(A, 16); }
      if (f === 180) { mv.ax = 24; mv.ay = -12; }
      if (f >= 184 && f <= 200) { // a kick up into the sky
        mv.gx = -24; mv.gy = -6; mv.ax = 0; mv.ay = 0;
        this.pose(A, z3 ? 1 : 2); this.pose(G, 17);
        if (f === 184) this.se('ZG 打撃2');
        if (f < 200) fx = 154;
      }
      if (f >= 201 && f <= 215) { ef = 0; this.pose(A, 16); mv.ax = 24; mv.ay = -6; if (f === 201) this.se('Z1 逃げる'); }
      if (f >= 216 && f <= 225) { // the enemy flies across from the lower left, he follows
        if (f === 216) { G.x = CENTER_ENEX - 240; G.y = STD_Y + 60; this.pose(G, 17); }
        if (f === 221) this.pose(G, 16);
        mv.gx = -24; mv.gy = -6;
      }
      if (f === 226) { mv.gx = 0; mv.gy = 0; A.x = CENTER_CHAX + 16 - 240; A.y = STD_Y + 60; }
      if (f >= 227 && f <= 236) { mv.ax = 24; mv.ay = -6; }
      if (f === 237) { mv.ax = 0; mv.ay = 0; }
      const p = RUSH_POSE.indexOf(f);
      if (p >= 0) { // the rush of blows
        if (p > 0) ef = 0;
        if (p === 0) { mv.ax = 0; mv.gx = -4; }
        this.pose(A, p % 2 ? 2 : 1);
        this.se('Z1 打撃');
      }
      const h = RUSH_HIT.find(([a, b]) => f >= a && f <= b);
      if (h) fx = h[2];
      if (f >= 272 && f <= 274) { mv.gx = 0; this.pose(A, 0); mv.ax = -24; }
      if (f === 275) ef = 0;
      if (f === 276) mv.ax = 48;
      if (f === 278) { mv.ax = 0; this.pose(A, 4); this.pose(G, 17); this.se('Z1 強打'); }
      if (f >= 278 && f <= 300) fx = 'fist';
      if (f >= 279 && f <= 300) {
        mv.gx = -24;
        if (f === 289) { this.pose(A, 16); mv.ay = -24; this.se('Z1 逃げる'); this.se('DB3 気を溜める2'); }
      }
      if (f === 301) { // he comes up from below, the strips run down the sides, no more cut-in
        ef = 0; mv.gx = 0; mv.ay = -6;
        this.pose(A, short ? 18 : 17, true);
        st.tecNo = 1; A.x = CENTER_CHAX + 74; A.y = STD_Y + 142;
        st.cut(false);
      }
      if (f === 340) { audio.seStop(); this.se('Z1 エネルギー波'); this.pose(A, short ? 19 : 18, true); mv.ay = 0; }
      if (f >= 340 && f <= 399) { if (f > 340) ef = Math.min(ef, 13); fx = 'down'; }
      if (f === 400) { ef = 0; this.agCut(st); this.pose(G, 16); }
      if (f >= 401 && f <= 430) fx = 'fall';
      const e = ef, O = [];
      if (typeof fx === 'number') { const y = fx; O.push((c) => spark(c, e <= 4 ? 0 : 32, 16, 32, 32, 346, y)); }
      else if (fx === 'fist') O.push((c) => { if (e > 10) return; spark(c, e <= 4 ? 0 : 32, 16, 32, 32, A.x + 96, A.y + 32); spark(c, 32, 0, 32, 16, G.x, G.y); });
      else if (fx === 'down') O.push(at(DOWN(), 0, 0, 60, e * RAY_SPEED + 56, 330, STD_Y - 2));
      else if (fx === 'fall') O.push(at(DOWN(), 60, 0, 60, 400, 330, -600 + e * RAY_SPEED));
      if (fx != null) ef++;
      yield* this.agFrame(st, U, O, mv);
    }
    return yield* this.agEnd(st, z3 ? 'zd46' : 'down'); // damage 46 (Z3) / 24 (Z2)
  },

  * angaGekiretsu() { // 2153 激烈ませんこう (all.rb 93220): the green aura, the ZG close-up with rocks rising, the flash, the wave
    if (!this.p) return yield* this.masenko();
    const st = this.agStage(), A = this.A;
    const [close1, close2] = GEKIRETSU[v(172) === 2 ? 1 : 0], aura = new Cyc(16, 2);
    let ef = 0;
    this.se('Z3 変身');
    this.pose(A, 0, true);
    for (let f = 0; f < 457; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 127) U.push(at(AURA3.green, 136 * aura.next(), 0, 136, 142, 228, 88));
      if (f >= 128 && f <= 328) {
        if (f === 128) { st.cut(false); st.tecNo = 1; audio.seStop(); A.y = -200; }
        if (f === 158) this.se('ZG SE057');
        const r = Math.floor(Math.random() * 3), k = f - 128;
        U.push(at(close1, 0, 0, 80, 176, 280 + (r === 2 ? 2 : r === 1 ? -2 : 0), 72));
        for (const [x, y, big] of ROCKS) U.push(big ? at(ROCK, 16, 0, 28, 20, x, y - 4 * k) : at(ROCK, 0, 0, 16, 14, x, y - 2 * k));
        if (k >= 156) U.push(fill(k < 160 ? 'rgb(127,127,127)' : k < 164 ? 'rgb(188,188,188)' : '#fff'));
      }
      if (f >= 329 && f <= 428) {
        if (f === 329) { audio.seStop(); this.se('ZG SE040'); }
        U.push(at(close2, 0, 0, 80, 176, 280, 72), at(BEAM_BIG_GREEN, 0, 0, 316, 158, 162, 72 + 126));
      }
      if (f === 429) { st.cut(true); st.tecNo = 0; ef = 0; this.agCut(st); this.se('ZG 光線1'); }
      if (f >= 430) { O.push(at(HALF_GREEN, 0, 128, 700, 128, -700 + ef * RAY_SPEED, 114)); ef++; } // effect 265
      yield* this.agFrame(st, U, O);
    }
    return yield* this.agEnd(st, 'big');
  },

  * angaGohanSuperKame() { // 2154 スーパーかめはめ波(悟飯) (all.rb 93322): the charge, the 親子かめはめ波 picture, the huge wave
    if (!this.p) return yield* this.kamehameha();
    const st = this.agStage(), A = this.A;
    const aura = new Cyc(16, 2), ray = new Cyc(4, 5);
    let ef = 0, bt = 0, bf = 100; // effect 333: the ball's frame (its counter long past 10 when it starts)
    this.se('Z3 変身');
    this.pose(A, 0, true);
    for (let f = 0; f < 427; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 300) U.push(at(AURA3.plain, 136 * aura.next(), 0, 136, 142, 228, 88));
      if (f >= 128 && f <= 300) {
        if (f === 128) this.se('Z1 気を溜める');
        if (f === 218) this.se('Z1 気を溜める3');
        this.pose(A, 17, true);
        O.push(f < 218 ? at(BLINK_SMALL, 16 * ray.next(), 0, 16, 16, 276, 164) : at(BLINK, 32 * ray.next(), 0, 32, 32, 268, 156));
      }
      if (f >= 301 && f <= 398) {
        if (f === 301) { st.cut(false); st.tecNo = 4; audio.seStop(); this.se('ZG 光線1'); A.y = -200; }
        U.push(at(OYAKO[v(172) === 2 ? 1 : 0], 0, 0, 114, 184, 278, 122));
        O.push(at(BALL(), bt * 128, 0, 128, 128, 230, 118));
        if (bf >= 10) { if (bt !== 5) bt++; bf = 0; }
        bf++;
      }
      if (f === 399) { st.cut(true); st.tecNo = 0; ef = 0; this.agCut(st); }
      if (f >= 400) { O.push(at(HUGE(), 0, 0, 400, 192, -400 + ef * RAY_SPEED, 76)); ef++; } // effect 48
      yield* this.agFrame(st, U, O);
    }
    return yield* this.agEnd(st, 'big');
  },
});

// sounds these films play (tools/copy_assets.py)
export const AG_SOUNDS = ['Z1 気を溜める', 'Z1 気を溜める2', 'Z1 気を溜める3', 'ZG 光線1', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'Z3 変身',
  'Z1 高速移動', 'ZG SE053', 'ZG SE040', 'ZG SE057', 'Z3 エネルギー波', 'Z2 気を溜める', 'Z1 逃げる', 'ZG 打撃4', 'ZG 打撃2', 'Z1 打撃',
  'Z1 強打', 'DB3 気を溜める2', 'Z1 エネルギー波', 'Z1 爆発1', 'Z1 必殺技', 'Z3 光線系ヒット'];

// ---------- ?dev=anga…: the films in a battle (a Z3-era save unless noted; the moves added to the members) ----------
//   angaz3   悟空 (26 27 29) and 悟飯 (48 52 53 54 59) vs 20號 (a Z3 enemy: his cut-in)
//   angaz2   the same in Z2 (variable 40 = 1: the Z2 strips and cut-ins) vs 古爾多
//   angass   超悟空 (27) and 超悟飯 (54) vs 20號
//   angafield  the angaz3 party on the map, no battle (for a normal encounter: __game.state.nextEnc = 1; __game.onStep())
registerZ3('anga', {
  dev(game, step) {
    const cfg = { angaz3: [2, [122], false], angaz2: [1, [52], false], angass: [2, [122], true], angafield: [2, null, false] }[step];
    if (!cfg) return false;
    const s = game.state = game.newState();
    s.var[40] = cfg[0];
    s.var[43] = 60;
    s.flags.z3 = 'done';
    party(game, [3, 5]);
    if (cfg[2]) { superSaiyan(game.world, s, 1, true); superSaiyan(game.world, s, 2, true); }
    const add = { 3: [26, 27, 29], 14: [26, 27], 5: [48, 52, 53, 54, 59], 18: [48, 52, 53, 54] };
    for (const m of s.party) {
      m.level = 40; m.exp = game.world.actors[m.id].exp[40]; applyLevel(game.world, m); heal(m);
      for (const id of add[m.id] || []) if (!m.skills.includes(id)) m.skills.push(id);
    }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    if (cfg[1]) setTimeout(() => game.startBattle(cfg[1], true, { loseOk: true }), 300);
    return true;
  },
});

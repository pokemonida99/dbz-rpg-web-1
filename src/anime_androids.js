// 人造人 18號・17號・16號's special moves (docs/anim-cd-plan.md, anda), ported frame by frame from the classic
// version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb). They only exist in the Z3 part of the original's
// move switch (all.rb 59742, attack pattern = skill id + 10): their own films for 気円斬 2294, the two エネルギーウェイブ
// 2298 / 2308, ロケットパンチ 2314 and ヘルズフラッシュ 2315, and the enemies' common films for the three energy waves
// (敵汎用エネルギー波 2431, 連続エネルギー波 2494, 強力エネルギー波 2499, 65679-65924) — those pick the beam's
// place by the member (21 18號, 22 17號, 23 16號). フルパワーヘルズフラッシュ 216 (attack 226) is in no case of the
// switch: the original plays its damage 22 straight away (67446). The special-move strips, the cut-ins and pattern 32
// are src/anime_goku_gohan.js's stage (agStage / agFrame / agCut / agEnd); what a pattern blits itself goes under
// the fighters, its effect_pattern in front. Frame numbers in the comments are the original's @battle_anime_frame.
import { audio, img, rand } from './core.js?v=20261108-0039';
import { Duel, addMoves, draw, BACK_Y, STD_Y, RAY_SPEED } from './anime.js?v=20261108-0039';
import { agFilmsPL as agFilms } from './anime_goku_gohan.js?v=20261108-0039';
import { registerZ3, party, heal } from './z3.js?v=20261108-0039';
import { applyLevel } from './party.js?v=20261108-0039';

const STD_CHAX = -70, STD_ENEX = 602; // (src/anime.js)
const pic = (n) => `Graphics/Pictures/${n}`;
const SMALL_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG'); // effects 227 / 228: 400×48 ×2
const BALL_BLUE = pic('Z3_戦闘_必殺技_エネルギー弾(青).PNG'); // effects 201 / 202: 128×128 frames
const BIG_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_大_敵_青.PNG'); // effects 239 / 240: 400×122 ×2
const DOT = pic('Z3_戦闘_必殺技_超元気玉(元気).png'); // the ki gathering in: 8×10
const KIEN = pic('Z3_戦闘_必殺技_気円斬.png'); // 126×30 rows: the disc growing (0-3), thrown (4)
const BLINK = pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'), BLINK_BIG = pic('Z3_必殺技_超カメハメ波(球点滅大)(青).png'); // effects 235 / 289
const WAVE18 = [pic('Z3_必殺技_18号エネルギーウェイブ.png'), pic('Z3_必殺技_18号エネルギーウェイブ(着替).png')]; // by variable 177
const JIGOKU17 = pic('Z3_必殺技_電撃地獄玉(17号).png');
const BEAM_BIG_BLUE = pic('ZG_必殺技_光線_大(青).PNG'); // 316×158
const SOKI_BLUE = pic('Z3_戦闘_必殺技_繰気弾(青).PNG'); // effect 271: 128×128 frames
const ROCKET = pic('Z3_戦闘_必殺技_ロケットパンチ.PNG'); // effects 273 / 274: 24×14 ×2
const HELLS16 = pic('Z3_必殺技_ヘルズフラッシュ(16号).png');
const KAME_LINES = [pic('Z3_必殺技_超カメハメ波(バック上).png'), pic('Z3_必殺技_超カメハメ波(バック下).png')]; // back 106
const KAME_BLUE = pic('Z3_必殺技_超カメハメ波_青.png'); // effect 275: 500×350
const HALF_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'); // effect 265: 700×128 ×2
const KAME_SIDES = [pic('ZG_戦闘_必殺技_背景_超カメハメ波_左.PNG'), pic('ZG_戦闘_必殺技_背景_超カメハメ波_右.PNG')]; // strip 4 (the stage draws it)
const BOOM3 = pic('戦闘アニメ_爆発3.PNG'), BOOM4 = pic('戦闘アニメ_爆発4.PNG'); // damage 41 (effect 102) / 42 (effect 103)

// skill → film; the members' fallbacks on an enemy (the films these moves borrowed before, src/z4b.js / src/zg_b.js)
const FILMS = { 191: 'andaWave', 192: 'andaMulti', 193: 'andaStrong', 194: 'andaKienzan', 198: 'andaWave18', // 18號
  201: 'andaWave', 202: 'andaMulti', 203: 'andaStrong', 208: 'andaWave17', // 17號
  211: 'andaWave', 212: 'andaMulti', 213: 'andaStrong', 214: 'andaRocket', 215: 'andaHells', 216: 'andaFullHells' }; // 16號
addMoves(FILMS);
const FALLBACK = { andaWave: 'energyWave', andaMulti: 'vegetaWave', andaStrong: 'galickGun', andaKienzan: 'kienzan', andaWave18: 'galickGun',
  andaWave17: 'galickGun', andaRocket: 'pierce', andaHells: 'galickGun' };
// what the move switch sets before pattern 32 (@chr_cutin_flag, @tec_back_small) and the pictures to load meanwhile
const v177 = () => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[177]) === 1 ? 1 : 0; };
agFilms({
  andaWave: () => [SMALL_BLUE], andaMulti: () => [BALL_BLUE], andaStrong: () => [DOT, BIG_BLUE],
  andaKienzan: () => [KIEN, BOOM3], andaWave18: () => [DOT, WAVE18[v177()], BLINK, BLINK_BIG, BIG_BLUE, ...KAME_SIDES, BOOM4],
  andaWave17: () => [DOT, JIGOKU17, BLINK, BLINK_BIG, BEAM_BIG_BLUE, SOKI_BLUE, ...KAME_SIDES, BOOM4],
  andaRocket: () => [ROCKET], andaHells: () => [DOT, ...KAME_LINES, HELLS16, BLINK, KAME_BLUE, HALF_BLUE, BOOM4],
}, {
  andaWave: {}, andaMulti: { cut: true }, andaStrong: { cut: true, small: true }, andaKienzan: { cut: true, small: true },
  andaWave18: { cut: true, small: true }, andaWave17: { cut: true, small: true }, andaRocket: { cut: true }, andaHells: { cut: true },
});

// 連続エネルギー波 hits every enemy: a film started right after the last one is a further target (@all_attack_count >= 2:
// no 31 / 32, the strips and the enemy's cut-in already on, the ground gone)
const MULTI = new Set([192, 202, 212]);
let multiEnd = -1e9;
const FULL_HELLS = 216;

// whose move it is: the member whose sheets these are (in a combo the battle's pair is not this film's)
function who(d) {
  const s = String(d.A.sheets.special || '');
  return s.includes('16号') ? 23 : s.includes('17号') ? 22 : 21;
}
// a blt clipped to the picture as RGSS clips it (a source rect running past the picture draws only what is inside)
const at = (sheet, sx, sy, w, h, x, y) => (c) => {
  const e = img(sheet);
  if (!e.ok) return;
  w = Math.min(w, e.im.width - sx); h = Math.min(h, e.im.height - sy);
  if (w > 0 && h > 0) draw(c, sheet, sx, sy, w, h, x, y);
};
// an animation counter as the original keeps one (@ray_anime_* / @back_anime_*): the picture first, then `>= every`
// moves to the next of n, then the counter goes up
class Cyc {
  constructor(every, n) { this.every = every; this.n = n; this.k = 0; this.f = 0; }
  next() { const k = this.k; if (this.f >= this.every) { this.k = (this.k + 1) % this.n; this.f = 0; } this.f++; return k; }
  reset() { this.k = 0; this.f = 0; }
}
// the ki gathering in (@genkitama_kanri_*, e.g. all.rb 125471): eight dots, each starting at random (1 in 7 a frame)
// from its direction and flying to the centre, faster after 10 frames; none start in the last 15 frames before `end`
const DIRS = [[0, -2], [2, -2], [2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2]];
class Gather {
  constructor(cx, cy, end) { this.cx = cx; this.cy = cy; this.end = end; this.k = DIRS.map(() => 0); }
  draw(f, list) {
    if (f >= this.end) return;
    DIRS.forEach(([ix, iy], i) => {
      const k = this.k[i];
      if (k >= 15) this.k[i] = 0;
      else if (k > 0) {
        const x0 = this.cx - ix * 18, y0 = this.cy + iy * 18; // (idou_x_goukei = idou × 10 + idou × 2 × 4)
        list.push(k <= 10 ? at(DOT, 0, 0, 8, 10, x0 + k * ix, y0 - k * iy) : at(DOT, 0, 0, 8, 10, x0 + 10 * ix + (k - 10) * 2 * ix, y0 - 10 * iy - (k - 10) * 2 * iy));
        this.k[i]++;
      } else if (this.end - f > 15 && rand(7) === 0) this.k[i] = 1;
    });
  }
}
// pic_shake_cal 4 (all.rb 20540): one of the nine places around, as on a keypad
function shake(dot) { const d = rand(9); return [(d % 3 - 1) * dot, (d < 3 ? 1 : d < 6 ? 0 : -1) * dot]; }

Object.assign(Duel.prototype, {
  // the stage (src/anime_goku_gohan.js agStage), put back after a combo's chain cleared it between two members' moves
  andaStage() {
    const st = this.agStage();
    if (!this.bfx) st.install();
    return st;
  },

  // damage 41 爆発系ZD中 (effect 102 戦闘アニメ_爆発3); 42 / 23 / 22 are src/anime_goku_gohan.js's agEnd and src/anime.js's
  * andaEnd(st, kind) {
    if (kind !== 'zd41') return yield* this.agEnd(st, kind);
    st.under = []; st.over = [];
    if (this.constructor !== Duel) return 'big';
    if (!this.hit) return 'miss';
    this.se('ZG 光線系ヒット2');
    this.showHit();
    this.pose(this.G, 17, false);
    this.effect((c, t) => { const k = t <= 10 ? 0 : t <= 21 ? 1 : -1; if (k >= 0) draw(c, BOOM3, k * 112, 0, 112, 120, 318, 120); });
    for (let f = 1; f < 60; f++) {
      if (f >= 21 && f <= 39) this.vel(0, 0, -20, 0);
      if (f === 40) this.effect(null);
      yield;
    }
    return 'none';
  },

  // ---------- the three members' energy waves (the enemies' common films) ----------
  * andaWave() { // 2431 (敵汎用)エネルギー波 (all.rb 124409): the small blue beam from the hand, then on the enemy
    if (!this.p) return yield* this[FALLBACK.andaWave]();
    const st = this.andaStage(), A = this.A;
    const [rx, ry] = { 21: [338, 140], 22: [344, 136], 23: [358, 138] }[who(this)];
    let ef = 0;
    this.se('Z1 怪光線');
    this.pose(A, 1, true);
    for (let f = 0; f < 76; f++) {
      const O = [];
      if (f >= 1 && f <= 40) { O.push(at(SMALL_BLUE, 0, 48, 54 + ef * RAY_SPEED, 48, rx, ry)); ef++; } // effect 227
      if (f === 41) ef = 0;
      if (f === 45) this.agCut(st);
      if (f >= 46) { O.push(at(SMALL_BLUE, 0, 0, 400, 48, -450 + ef * RAY_SPEED, 148)); ef++; } // effect 228
      yield* this.agFrame(st, [], O);
    }
    return yield* this.andaEnd(st); // 23
  },

  * andaMulti() { // 2494 連続エネルギー波 (124881): four blue balls, a step back each, then the one on the enemy (on everyone)
    if (!this.p) return yield* this[FALLBACK.andaMulti]();
    const st = this.andaStage(), A = this.A;
    if (this.constructor === Duel) this.finished.then(() => { multiEnd = performance.now(); });
    let ef = 0;
    const ball = () => { const o = at(BALL_BLUE, 2 * 128, 0, 128, 128, 304 + ef * (RAY_SPEED + 6), 138); ef++; return o; }; // effect 201, @ray_spd_up_flag
    const hit = () => { const o = at(BALL_BLUE, 2 * 128, 0, 128, 128, -128 + ef * RAY_SPEED, 96); ef++; return o; }; // effect 202
    if (this.andaAgain) { // a further target: 0 set_chr_display_out, 1-29 the ball on it
      this.agCut(st);
      for (let f = 0; f < 30; f++) yield* this.agFrame(st, [], f >= 1 ? [hit()] : []);
      return yield* this.andaEnd(st); // 23
    }
    this.se('Z3 エネルギー波');
    this.pose(A, 2, true);
    let ax = 0;
    for (let f = 0; f < 110; f++) {
      const O = [];
      if (f >= 1 && f <= 61) { // four throws (1-16, 17-31, 32-46, 47-61): rows 2 / 1 / 2 / 1, a step back (2 px) and forward
        const k = f <= 16 ? 0 : Math.floor((f - 2) / 15), b = 15 * k;
        if (k > 0 && f === 2 + b) { ef = 0; this.pose(A, k % 2 ? 1 : 2, true); }
        if (f <= 4 + b) ax = -2; else if (f <= 6 + b) { this.pose(A, 0, true); ax = 2; } else if (f <= 8 + b) ax = 0;
      }
      if (f >= 1 && f <= 69) O.push(ball());
      if (f === 70) { audio.seStop(); ef = 0; }
      if (f === 80) this.agCut(st);
      if (f >= 81) O.push(hit());
      yield* this.agFrame(st, [], O, { ax, ay: 0, gx: 0, gy: 0 });
    }
    return yield* this.andaEnd(st); // 23
  },

  * andaStrong() { // 2499 強力エネルギー波 (125171): the ki gathering in, the big blue beam, then on the enemy
    if (!this.p) return yield* this[FALLBACK.andaStrong]();
    const st = this.andaStage(), A = this.A, id = who(this);
    const [x0, y0] = id === 23 ? [324, 120] : [300, 120], rx = x0 + 40, ry = y0 - 18; // ray_big: from 140 on
    const dots = new Gather(x0 + 48, y0 + 32, 125);
    let ef = 0;
    this.pose(A, 1, true); // (kitamenasi: no aura)
    this.se('DB3 気を溜める2');
    for (let f = 0; f < 216; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 128) dots.draw(f, U);
      if (f === 129) { audio.seStop(); this.pose(A, 1, true); }
      if (f === 140) { audio.seStop(); this.se('Z1 エネルギー波2'); }
      if (f >= 140 && f <= 178) { O.push(at(BIG_BLUE, 0, 122, 144 + ef * RAY_SPEED, 122, rx, ry)); ef++; } // effect 239
      if (f === 179) ef = 0;
      if (f === 189) this.agCut(st);
      if (f >= 190) { O.push(at(BIG_BLUE, 0, 0, 400, 122, -400 + ef * RAY_SPEED, ry)); ef++; } // effect 240
      yield* this.agFrame(st, U, O);
    }
    return yield* this.andaEnd(st); // 23
  },

  // ---------- 18號 ----------
  * andaKienzan() { // 2294 気円斬 (96740): the disc grows over her head, she throws it, then it flies at the enemy
    if (!this.p) return yield* this[FALLBACK.andaKienzan]();
    const st = this.andaStage(), A = this.A;
    let ef = 0, row = 0;
    this.se('DB3 気を溜める2');
    this.pose(A, 4, true);
    for (let f = 0; f < 192; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 126) { // the next of the disc's rows every 4 frames, up to the whole one (4)
        ef++;
        if (ef === 5) { if (row < 4) row++; ef = 1; }
        U.push(at(KIEN, 0, 30 * row, 126, 30, 242, 96));
        if (f === 126) { ef = 0; row = 0; audio.seStop(); this.pose(A, 1, true); this.se('DB3 エネルギー波1'); }
      }
      if (f >= 127 && f <= 155) { ef++; U.push(at(KIEN, 0, 120, 126, 30, 340 + ef * RAY_SPEED, 150)); }
      if (f === 156) ef = 0;
      if (f === 160) this.agCut(st);
      if (f >= 161) { O.push(at(KIEN, 0, 120, 126, 30, -192 + ef * RAY_SPEED, 160)); ef++; } // effect 260
      yield* this.agFrame(st, U, O);
    }
    return yield* this.andaEnd(st, 'zd41');
  },

  * andaWave18() { // 2298 エネルギーウェイブ(18号) (96790): her close-up in the ZG side strips, the ball, the big beam
    if (!this.p) return yield* this[FALLBACK.andaWave18]();
    const st = this.andaStage(), A = this.A, close = WAVE18[v177()];
    const dots = new Gather(302 + 12, 62 + 12, 360), ray = new Cyc(4, 5);
    let ef = 0;
    this.pose(A, 2, true);
    this.se('DB3 気を溜める2'); this.se('Z1 気を溜める');
    st.cut(false, false); // @chr_cutin = false (the flag stays)
    for (let f = 0; f < 428; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 350) {
        st.tecNo = 4;
        A.y = -160;
        U.push(at(close, 0, 0, 296, 220, 138, 96));
        dots.draw(f, U);
        if (f === 91 || f === 181) { this.se('DB3 気を溜める2'); this.se('Z1 気を溜める'); }
        if (f >= 91) { const k = ray.next(); O.push(f > 241 ? at(BLINK_BIG, 64 * k, 0, 64, 64, 286, 46) : at(BLINK, 32 * k, 0, 32, 32, 302, 62)); ef++; } // 235 → 289
        if (f === 350) { st.cut(true, false); st.tecNo = 0; }
      }
      if (f >= 351 && f <= 390) {
        if (f === 351) { this.se('Z1 エネルギー波2'); ef = 0; }
        A.y = STD_Y;
        this.pose(A, 10, true);
        O.push(at(BIG_BLUE, 0, 122, 144 + ef * RAY_SPEED, 122, 338, 104)); ef++; // effect 239
      }
      if (f === 391) { st.tec(true); st.cut(true); ef = 0; st.tecNo = 0; this.agCut(st); }
      if (f >= 401) { O.push(at(BIG_BLUE, 0, 0, 400, 122, -400 + ef * RAY_SPEED, 106)); ef++; } // effect 240
      yield* this.agFrame(st, U, O);
    }
    return yield* this.andaEnd(st, 'zd42');
  },

  // ---------- 17號 ----------
  * andaWave17() { // 2308 エネルギーウェイブ(17号) (96969): the ki gathering in, his close-up (電撃地獄玉), the ball of ki on the enemy
    if (!this.p) return yield* this[FALLBACK.andaWave17]();
    const st = this.andaStage(), A = this.A;
    const dots = new Gather(338 - 14, 156 + 12, 128), ray = new Cyc(4, 5);
    let ef = 0;
    this.pose(A, 2, true);
    this.se('DB3 気を溜める2');
    for (let f = 0; f < 368; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 128) {
        dots.draw(f, U);
        if (f === 128) st.cut(false); // (@chr_cutin, @chr_cutin_flag)
      }
      if (f >= 129 && f <= 330) {
        st.tecNo = 4;
        A.y = -160;
        U.push(at(JIGOKU17, 0, 0, 296, 220, 170, 66));
        if (f >= 140 && f <= 260) {
          if (f === 140) this.se('Z1 気を溜める');
          const k = ray.next();
          O.push(f > 200 ? at(BLINK_BIG, 64 * k, 0, 64, 64, 286, 208) : at(BLINK, 32 * k, 0, 32, 32, 302, 224)); ef++; // 235 → 289
        }
        if (f >= 261) {
          if (f === 261) { audio.seStop(); this.se('Z1 エネルギー波'); }
          ray.reset();
          U.push(at(BEAM_BIG_BLUE, 0, 0, 316, 158, 162, 220));
        }
      }
      if (f === 331) { st.tec(true); st.cut(true); ef = 0; st.tecNo = 0; this.agCut(st); }
      if (f >= 341) { O.push(at(SOKI_BLUE, 4 * 128, 0, 128, 128, -128 + ef * RAY_SPEED, 112)); ef++; } // effect 271 (@effect_anime_type 4)
      yield* this.agFrame(st, U, O);
    }
    return yield* this.andaEnd(st, 'zd42');
  },

  // ---------- 16號 ----------
  * andaRocket() { // 2314 ロケットパンチ (97150): his fist shakes, flies off, then hits the enemy
    if (!this.p) return yield* this[FALLBACK.andaRocket]();
    const st = this.andaStage(), A = this.A;
    let ef = 0;
    this.se('DB3 気を溜める2'); this.se('Z1 ゴー');
    this.pose(A, 3, true);
    for (let f = 0; f < 112; f++) {
      const O = [];
      if (f >= 1 && f <= 40) ef = 0;
      if (f >= 41 && f <= 45) this.pose(A, 3, true);
      if (f === 46) { audio.seStop(); this.se('DB3 エネルギー波1'); }
      if (f <= 75) { const [sx, sy] = ef === 0 ? shake(4) : [0, 0]; O.push(at(ROCKET, 0, 0, 24, 14, 340 + ef * RAY_SPEED + sx, 156 + sy)); ef++; } // effect 273
      if (f === 76) ef = 0;
      if (f === 80) this.agCut(st);
      if (f >= 81) { O.push(at(ROCKET, 0, 0, 24, 14, -128 + ef * RAY_SPEED, 144)); ef++; } // effect 274
      yield* this.agFrame(st, [], O);
    }
    return yield* this.andaEnd(st, 'shock'); // 22
  },

  * andaHells() { // 2315 ヘルズフラッシュ (97189): the ki gathering in, his close-up in the lines, the huge blue wave, then on the enemy
    if (!this.p) return yield* this[FALLBACK.andaHells]();
    const st = this.andaStage(), A = this.A;
    const dots = new Gather(338 - 14, 156 + 2, 128), ray = new Cyc(4, 5), lines = new Cyc(4, 3);
    let ef = 0;
    this.pose(A, 4, true);
    this.se('DB3 気を溜める2');
    for (let f = 0; f < 338; f++) {
      const U = [], O = [];
      if (f >= 1 && f <= 128) {
        dots.draw(f, U);
        if (f === 128) { st.tec(false); st.cut(false); }
      }
      if (f >= 129 && f <= 300) {
        const k = lines.next(); // back 106
        U.push(at(KAME_LINES[0], 0, 128 * k, 384, 128, 0, 0), at(KAME_LINES[1], 0, 64 * k, 192, 64, 0, 292));
        A.y = -160;
        const d = { 231: 2, 232: 2, 233: 2, 234: 4, 235: 2 }[f] || 0; // (the original's checks: 231-233 all −2)
        U.push(at(HELLS16, 0, 0, 302, 220, 56 - d, 96 - d));
        if (f >= 140 && f <= 230) { if (f === 140) this.se('Z1 気を溜める'); O.push(at(BLINK, 32 * ray.next(), 0, 32, 32, 362, 244)); ef++; } // effect 235
        if (f === 231) { audio.seStop(); this.se('Z1 エネルギー波'); ray.reset(); }
        if (f >= 231) { O.push(at(KAME_BLUE, 0, 0, Math.min(500, 54 + ef * RAY_SPEED), 350, 348, 60)); ef++; } // effect 275 (its frame count kept running)
      }
      if (f === 301) { st.tec(true); st.cut(true); ef = 0; st.tecNo = 0; this.agCut(st); }
      if (f >= 311) { O.push(at(HALF_BLUE, 0, 128, 700, 128, -700 + ef * RAY_SPEED, 114)); ef++; } // effect 265
      yield* this.agFrame(st, U, O);
    }
    return yield* this.andaEnd(st, 'zd42');
  },

  * andaFullHells() { return 'shock'; }, // (216 has no film: see run below)
});

// 連続エネルギー波 on the enemies after the first: no swoop-in and no 必殺技!, the ground already gone; the strips and
// the cut-in (the enemy's) on from the start
const swoop0 = Duel.prototype.swoopIn, launch0 = Duel.prototype.launch;
Object.assign(Duel.prototype, {
  * swoopIn() {
    this.andaAgain = this.constructor === Duel && this.p && MULTI.has(this.skill) && performance.now() - multiEnd < 500;
    if (!this.andaAgain) return yield* swoop0.call(this);
    this.back.y = BACK_Y + 79 * 4;
  },
  * launch() {
    if (!this.andaAgain) return yield* launch0.call(this);
    img(BALL_BLUE);
    const st = this.agStage();
    st.tec(true); st.cut(true, true);
  },
});
// フルパワーヘルズフラッシュ: attack 226 falls through the Z3 move switch to its else (all.rb 67446) — no 31 / 32 and no
// film, just damage 22 with the two where every film starts (STANDARD_CHAX / STANDARD_ENEX)
const run0 = Duel.prototype.run;
Duel.prototype.run = function* run() {
  if (this.skill !== FULL_HELLS || !this.p || this.constructor !== Duel) return yield* run0.call(this);
  this.L.x = STD_CHAX; this.R.x = STD_ENEX; this.L.y = this.R.y = STD_Y;
  this.pose(this.L, 0, false); this.pose(this.R, 0, false);
  yield;
  if (this.hit) yield* this.blownAway(); else yield* this.dodge();
  audio.seStop();
  this.ending = true;
  for (let i = 0; i < 10; i++) { this.fade = (i + 1) / 10; yield; }
};

// ?dev=anda: a Z3 save, 18號・17號・16號 at level 40 with all fifteen moves, against three Z3 enemies (連続エネルギー波
// hits all three); anda177: the same with 18號 in her other clothes (variable 177 = 1). The films can also be played
// from the console: __game.scene.play(m, f, true, skill, dmg, f)
registerZ3('anda', {
  dev(game, step) {
    if (step !== 'anda' && step !== 'anda177') return false;
    const s = game.state = game.newState();
    s.var[40] = 2;
    s.var[43] = 60;
    if (step === 'anda177') s.var[177] = 1;
    s.flags.z3 = 'done';
    party(game, [21, 22, 23]);
    const MORE = { 21: [191, 192, 193, 194, 198], 22: [201, 202, 203, 208], 23: [211, 212, 213, 214, 215, 216] };
    for (const m of s.party) {
      m.level = 40; m.exp = game.world.actors[m.id].exp[40]; applyLevel(game.world, m); heal(m);
      for (const id of MORE[m.id] || []) if (!m.skills.includes(id)) m.skills.push(id);
    }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle([116, 113, 119], true, { loseOk: true }), 300);
    return true;
  },
});

// sounds these films play beyond src/anime.js's, for tools/copy_assets.py
export const ANDA_SOUNDS = ['Z1 怪光線', 'Z3 エネルギー波', 'DB3 気を溜める2', 'Z1 エネルギー波2', 'DB3 エネルギー波1', 'Z1 気を溜める',
  'Z1 ゴー', 'Z1 エネルギー波', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'Z3 光線系ヒット', 'Z3 跳ね返し'];
export { at as andaAt, Gather as AndaGather, shake as andaShake }; // (src/anime_foes_z34.js: the enemies' films use the same blt / ki dots / shake)

// バーダック一味 (托馬 27, 賽莉帕 28, 托特波 29, 龐布金 30)'s special moves (docs/anim-cd-plan.md, ancc), ported frame
// by frame from the classic version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb). The crew fight in Z2 and
// Z3 ($btl_progress 1 / 2: variable 40); their attack pattern is the skill id + 10 in both move switches (Z2 all.rb
// 57600, Z3 61344), and the films are shared by the four:
//   246 / 255 / 265 / 273 エネルギー波 → 2431 (all.rb 124409), damage 23 (42 as the Great Ape)
//   247 / 256 / 266 / 274 複数エネルギー波 → 2494 (124881, on everyone), damage 23
//   248 / 257 / 267 / 275 強力エネルギー波 → 2499 (125171), damage 23 (44 as the Great Ape)
//   251 / 262 / 270 / 278 大猿変身 → 1351 (81771): the full moon, the flicker into the ape (src/cards_a.js turns them)
//   托馬 249 フレイムバレット → 1349 (81656), damage 24 / 250 フルパワーフレイムバレット → 2350 (98161), damage 44
//   賽莉帕 259 ヒステリックサイヤンレディ → 1359 (81892), damage 22 / 260 ハンティングアロー → 2360 (98278), damage 44
//   托特波 268 アングリーアタック → 1368 (81984), damage 22 / 269 アングリーキャノン → 2369 (98346), damage 44
//   龐布金 276 マッシブカタパルト → 1376 (82083), damage 22 / 277 マッシブキャノン → 2377 (98438), damage 44
// The Z2 switch has no 260 / 270 / 279 / 287: there the four full-power moves play only damage 41 (its else).
// The bars and the cut-ins are src/anime_zfighters.js's stage (its swoopIn / launch build it); what that stage lacks
// is set on it here: the Z2 era, the moves without @chr_cutin_flag, @tec_output_back_no 4 and the Great Ape's cut-in.
// The Great Ape is drawn by src/anime.js 48 px right / 96 up of where it stands, the original 96 left / 48 up, so its
// positions are moved by (-48, +48) here. Frame numbers in the comments are the original's @battle_anime_frame.
import { audio, img, rand } from './core.js?v=20261108-0950';
import { addMoves, Duel, spark, STD_Y, CENTER_ENEX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261108-0950';
import { ZfStage, ZF_FILMS, ZF_ALL, ZF_ACTOR, ZF_SMALL, ZF_AGAIN, zfBlt } from './anime_zfighters.js?v=20261108-0950';
import { isSuper } from './supersaiyan.js?v=20261108-0950';
import { registerZ3, party, heal } from './z3.js?v=20261108-0950';
import { applyLevel } from './party.js?v=20261108-0950';

const pic = (n) => `Graphics/Pictures/${n}`;
// $btl_top_file_name pictures: [Z2, Z3]
const RAY_S = [pic('Z2_戦闘_必殺技_エネルギー波_小_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG')]; // effects 227 / 228
const RAY_M = [pic('Z2_戦闘_必殺技_エネルギー波_中_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG')]; // 233 / 234
const RAY_L = [pic('Z2_戦闘_必殺技_エネルギー波_大_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_大_敵_青.PNG')]; // 239 / 240
const BALL = [pic('Z2_戦闘_必殺技_エネルギー弾(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾(青).PNG')]; // 201 / 202 (1349: always Z2's)
const KIKOU = [pic('Z2_戦闘_必殺技_背景_気功砲系.png'), pic('Z3_戦闘_必殺技_背景_気功砲系.png')]; // back 9
const AURA3 = pic('Z2_戦闘_必殺技_気を溜める3(青).png'); // back 101 (Z2)
const GENKI = pic('Z3_戦闘_必殺技_超元気玉(元気).png'); // 2499: the specks of ki gathering, 8×10
const SOKI = pic('Z3_戦闘_必殺技_繰気弾(青).PNG'); // 2350: 128×128 frames
const BALL4 = pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'); // effects 293 / 266: 190×126
const HALF = pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'); // effect 265: 700×128, the lower half
const BLINK = pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'); // effect 235: 32×32 frames
const BLINK_BIG = pic('Z3_必殺技_超カメハメ波(球点滅大)(青).png'); // effect 289: 64×64 frames
const BIGBANG = pic('Z3_必殺技_ビッグバンアタック発動(青).PNG'); // effect 264: 302×200 frames
const KAME_BARS = [pic('ZG_戦闘_必殺技_背景_超カメハメ波_左.PNG'), pic('ZG_戦闘_必殺技_背景_超カメハメ波_右.PNG')]; // output_back 4
const APE_CUT = [pic('Z2_バーダック一味大猿カットイン.png'), pic('Z3_バーダック一味大猿カットイン.png')]; // the Great Ape's cut-in, row 0
const MOON = pic('Z1_戦闘_必殺技_満月.PNG'); // 11 frames of 48×48
const BOOM = { 101: [pic('戦闘アニメ_爆発1.PNG'), 96, 96, 320, 120], 102: [pic('戦闘アニメ_爆発3.PNG'), 112, 120, 318, 120],
  103: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 298, 120], 105: [pic('戦闘アニメ_爆発6.PNG'), 256, 256, 234, 46] };
const CLOSE = { 27: pic('Z3_必殺技_フレイムバレット(トーマ).png'), 28: pic('Z3_必殺技_ハンティングアロー(セリパ).png'),
  29: pic('Z3_必殺技_アングリーランチャー(トテッポ).png'), 30: pic('Z3_必殺技_マッシブカタパルト(パンブーキン).png') };
const CR_IMAGES = [...RAY_S, ...RAY_M, ...RAY_L, ...BALL, ...KIKOU, AURA3, GENKI, SOKI, BALL4, HALF, BLINK, BLINK_BIG, BIGBANG, ...KAME_BARS,
  ...APE_CUT, MOON, ...Object.values(BOOM).map((b) => b[0]), ...Object.values(CLOSE)];
const JP = { 27: 'トーマ', 28: 'セリパ', 29: 'トテッポ', 30: 'パンブーキン' };

// skill → film; whose; the moves with @tec_back_small, without @chr_cutin_flag, on everyone; the Z3-only ones
const FILMS = {
  246: 'crWave', 255: 'crWave', 265: 'crWave', 273: 'crWave',
  247: 'crMultiWave', 256: 'crMultiWave', 266: 'crMultiWave', 274: 'crMultiWave',
  248: 'crStrongWave', 257: 'crStrongWave', 267: 'crStrongWave', 275: 'crStrongWave',
  251: 'crApe', 262: 'crApe', 270: 'crApe', 278: 'crApe',
  249: 'crFlameBullet', 250: 'crFullFlameBullet', 259: 'crHysteric', 260: 'crHuntingArrow',
  268: 'crAngryAttack', 269: 'crAngryCannon', 276: 'crCatapult', 277: 'crMassiveCannon',
};
addMoves(FILMS);
Object.assign(ZF_FILMS, FILMS);
for (const id of Object.keys(FILMS)) ZF_ACTOR[id] = id < 255 ? 27 : id < 265 ? 28 : id < 273 ? 29 : 30;
for (const id of [248, 257, 267, 275, 249, 250, 259, 260, 268, 269, 276, 277]) ZF_SMALL.add(id);
const NO_CUT = new Set([246, 255, 265, 273]);
for (const id of [247, 256, 266, 274]) { ZF_ALL.add(id); ZF_AGAIN[id] = { bars: true, cut: true }; }
const Z3_ONLY = new Set([250, 260, 269, 277]);
// 2431 / 2499: where the beam leaves the hand (the Great Ape's in the second pair)
const WAVE = { 27: [352, 136, 310, 112], 28: [340, 138, 304, 102], 29: [358, 124, 310, 112], 30: [346, 134, 304, 98] };
const STRONG = { 27: [318, 122, 316, 98], 28: [306, 124, 304, 86], 29: [324, 110, 314, 96], 30: [312, 120, 310, 86] };

const era = () => { const s = window.__game && window.__game.state; return (s && s.var && s.var[40]) || 0; };
const z3 = () => era() >= 2;
const big = (o) => (o.sheets.size || 96) === 192;
const noFilm = (d) => Z3_ONLY.has(d.skill) && !z3();

// what zf's stage lacks, set before 必殺技! (anime_pattern 32) starts its bars and cut-in
function fit(d, st) {
  st.era = z3() ? 2 : 1;
  if (NO_CUT.has(d.skill)) st.cutFlag = false;
  const ape = big(d.A), drawCut = st.drawCut.bind(st), tick = st.tick.bind(st);
  st.drawCut = (c) => { // set_battle_cutin_name: the Great Ape's own row ($oozaru_flag)
    if (ape && st.cut && st.cutFlag && !st.mirror) zfBlt(c, APE_CUT[st.era - 1], 0, 0, 640, 64, 0, 292);
    else drawCut(c);
  };
  st.tick = () => { // output_back 4: ZG's super kamehameha bars at both sides, the next of three every frame
    if (st.no !== 4 || st.era !== 2) return tick();
    st.b = []; st.e = [];
    if (!st.cutFlag) st.cut = false;
    const L = st.barList = [], k = st.corner;
    if (!st.bars) return;
    L.push((c) => { zfBlt(c, KAME_BARS[0], k * 176, 0, 176, 320, 0, 18); zfBlt(c, KAME_BARS[1], k * 176, 0, 176, 320, 640 - 176, 18); });
    st.corner = k === 2 ? 0 : k + 1;
  };
}

const swoop1 = Duel.prototype.swoopIn, launch1 = Duel.prototype.launch;
Object.assign(Duel.prototype, {
  * swoopIn() {
    if (!FILMS[this.skill] || !this.p) return yield* swoop1.call(this);
    for (const p of CR_IMAGES) img(p);
    if (noFilm(this)) { this.st = new ZfStage(this); return; } // (only the damage: no swoop, no 必殺技!)
    yield* swoop1.call(this);
  },
  * launch() {
    const st = this.st;
    if (!FILMS[this.skill] || !st || !this.p) return yield* launch1.call(this);
    if (noFilm(this)) return;
    fit(this, st);
    if (st.again) return yield* launch1.call(this);
    yield* launch1.call(this);
    if (big(this.A)) { this.A.x -= 48; this.A.y += 48; } // (the original's place for the 192×192 ape)
  },

  // the attacker standing at the original's (x, y)
  crAt(x, y) { const o = big(this.A) ? 48 : 0; this.A.x = x - o; this.A.y = y + o; },
  crStand() { this.A.y = STD_Y + (big(this.A) ? 48 : 0); },
  // back 9 (Z2 / Z3): the 気功砲 column on the defender
  crKikou(st) {
    const k = st.ba.type * 360, sheet = KIKOU[st.era - 1];
    if (big(this.G)) { st.back(sheet, 0, k, 142, 356, 156, 0); st.back(sheet, 242, k, 142, 356, 498, 0); } else st.back(sheet, 0, k, 384, 356, 170, 0);
    st.backStep(4, 2);
  },
  // back 48 師弟の絆_高速移動: an after-image every fourth call
  crAfter(st, x, y) { if (st.ba.frame % 4 === 0) st.b.push((c) => spark(c, 0, 48, 64, 64, x, y)); st.ba.frame++; },
  // the charge (Z3 back 201 blue, Z2 back 101 気を溜める3 blue)
  crCharge(st) {
    if (st.era === 2) return st.aura(213, 88, 3);
    st.back(AURA3, st.ba.type * 184, 0, 184, 240, 198, 32);
    st.backStep(4, 2);
  },

  // ---------- the damage films (anime_pattern 22 / 23 / 24 / 41 / 42 / 44), or the dodge (20) ----------
  * crHit(kind, kyouda = false) {
    if (!this.hit) return yield* this.zfDodge();
    const st = this.st, G = this.G;
    if (kind === 22) { // 衝撃波系 (@tec_kyouda_se: ZG 打撃4)
      this.se(kyouda ? 'ZG 打撃4' : 'Z3 跳ね返し');
      this.showHit();
      this.pose(G, 17, false);
      for (let f = 0; f <= 60; f++) { if (f <= 19) G.x += 20; yield; }
      return;
    }
    const [se, eff, end, last] = { 23: ['Z3 光線系ヒット', 101, 50, 39], 24: ['Z3 光線系ヒット', 101, 45, 34], 41: ['ZG 光線系ヒット2', 102, 60, 39],
      42: ['ZG 光線系ヒット3', 103, 60, 39], 44: ['DB3 大爆発', 105, 60, 39] }[kind];
    const [sheet, w, h, x, y] = BOOM[eff];
    this.se(se);
    this.showHit();
    this.pose(G, 17, false);
    let type = 0, frame = 0;
    for (let f = 0; f <= end; f++) {
      if (f >= 21 && f <= last) { if (kind === 24) G.y += 20; else G.x += 20; }
      if (f <= last) {
        st.front(sheet, type * w, 0, w, h, x, y);
        if (frame >= 10) { type++; frame = 0; }
        frame++;
      }
      yield;
    }
  },

  // ---------- the four ----------
  * crWave() { // 2431 (敵汎用)エネルギー波: the thin blue beam from the hand, then across to the defender
    if (!this.st) return yield* this.energyWave();
    const st = this.st, A = this.A, ape = big(A), e = st.era - 1;
    const [rx, ry] = ape ? WAVE[st.actor].slice(2) : WAVE[st.actor];
    this.se('Z1 怪光線');
    this.pose(A, 1, true);
    yield; // 0
    for (let f = 1; f <= 76; f++) {
      if (f <= 40) st.fx((k) => st.front(RAY_S[e], 0, 48, 54 + k.frame * RAY_SPEED, 48, rx, ry)); // 227
      if (f === 41) st.fxReset();
      if (f === 45) this.zfOut();
      if (f >= 46 && f <= 75) { // 228 (234 by the Great Ape)
        if (ape) st.fx((k) => st.front(RAY_M[e], 0, 0, 400, 80, -400 + k.frame * RAY_SPEED, 136));
        else st.fx((k) => st.front(RAY_S[e], 0, 0, 400, 48, -450 + k.frame * RAY_SPEED, 148));
      }
      yield;
    }
    yield* this.crHit(ape ? 42 : 23);
    return 'none';
  },

  * crMultiWave() { // 2494 連続エネルギー波: four blue balls from alternating hands, the recoil after each; one falls on each target
    if (!this.st) return yield* this.scatterWave();
    const st = this.st, A = this.A, e = st.era - 1;
    if (!st.again) {
      this.se('Z3 エネルギー波');
      this.pose(A, 1, true); // (the crew: @output_anime_type 1, row 1)
      let ax = 0, ry = 138;
      yield; // 0
      for (let f = 1; f <= 79; f++) {
        if (f <= 69) {
          const n = Math.max(0, Math.min(3, Math.floor((f - 2) / 15))), s = 1 + 15 * n; // the shot from frame s + 1
          if (f > 1 + 15 * 4) ry = 138; // (after the fourth: the default again)
          else ry = [138, 78, 138, 98][n];
          if (n > 0 && f === s + 1) { st.ef.frame = 0; this.pose(A, 1, true); }
          if (f <= 1 + 15 * 4) {
            if (f <= s + 3) ax = -2; else if (f <= s + 5) { this.pose(A, 0, true); ax = 2; } else if (f <= s + 7) ax = 0;
          }
          st.fx((k) => st.front(BALL[e], 2 * 128, 0, 128, 128, 304 + k.frame * (RAY_SPEED + 6), ry)); // 201, @ray_spd_up_flag
        }
        if (f === 70) { audio.seStop(); st.fxReset(); }
        A.x += ax;
        yield;
      }
      this.zfOut(); // 80
      yield;
      for (let f = 81; f <= 109; f++) { st.fx((k) => st.front(BALL[e], 2 * 128, 0, 128, 128, -128 + k.frame * RAY_SPEED, 96)); yield; } // 202
    } else { // a further target: 0 set_chr_display_out, 1-29 the ball
      this.zfOut();
      yield;
      for (let f = 1; f <= 29; f++) { st.fx((k) => st.front(BALL[e], 2 * 128, 0, 128, 128, -128 + k.frame * RAY_SPEED, 96)); yield; }
    }
    yield;
    yield* this.crHit(23);
    return 'none';
  },

  * crStrongWave() { // 2499 強力エネルギー波: specks of ki gather on the hand (きためなし), then the big blue beam
    if (!this.st) return yield* this.kamehameha();
    const st = this.st, A = this.A, ape = big(A), e = st.era - 1;
    let [rx, ry] = ape ? STRONG[st.actor].slice(2) : STRONG[st.actor];
    const wide = !ape; // ray_big
    const cx = rx + 48 - (ape ? 44 : 0), cy = ry + 32 + (ape ? 4 : 0), specks = [0, 0, 0, 0, 0, 0, 0, 0];
    const DIRS = [[0, -2], [2, -2], [2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2]];
    this.se('DB3 気を溜める2');
    this.pose(A, 1, true);
    yield; // 0
    for (let f = 1; f <= 216; f++) {
      if (f === 140 && wide) { rx += 40; ry -= 18; }
      if (f <= 124) { // the specks: each flies 15 frames toward the hand, slow for 10 then fast
        DIRS.forEach(([ix, iy], i) => {
          const n = specks[i];
          if (n >= 15) specks[i] = 0;
          else if (n > 0) {
            const gx = 18 * ix, gy = 18 * iy;
            const x = n <= 10 ? cx - gx + n * ix : cx - gx + 10 * ix + (n - 10) * 2 * ix;
            const y = n <= 10 ? cy + gy - n * iy : cy + gy - 10 * iy - (n - 10) * 2 * iy;
            st.back(GENKI, 0, 0, 8, 10, x, y);
            specks[i]++;
          } else if (125 - f > 15 && rand(7) === 0) specks[i] = 1;
        });
      }
      if (f === 129) { audio.seStop(); this.pose(A, 1, true); }
      if (f === 140) { audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(A, 1, true); }
      if (f >= 140 && f <= 178) { // 239 (233 by the Great Ape)
        if (wide) st.fx((k) => st.front(RAY_L[e], 0, 122, 144 + k.frame * RAY_SPEED, 122, rx, ry));
        else st.fx((k) => st.front(RAY_M[e], 0, 80, 54 + k.frame * RAY_SPEED, 80, rx, ry));
      }
      if (f === 179) st.fxReset();
      if (f === 189) this.zfOut();
      if (f >= 190 && f <= 215) { // 240 (the Great Ape too)
        st.fx((k) => st.front(RAY_L[e], 0, 0, 400, 122, -400 + k.frame * RAY_SPEED, ry)); // (ray_y: 18 up for the wide beam)
      }
      yield;
    }
    yield* this.crHit(ape ? 44 : 23);
    return 'none';
  },

  * crApe() { // 1351 大猿変身: the full moon rises, he flickers into the Great Ape and roars (no damage)
    const st = this.st, A = this.A;
    if (!st) return 'none';
    st.bars = false; st.cut = false;
    const s = window.__game && window.__game.state, z = s && s.var && s.var[40] >= 2 ? 'Z3' : 'Z2', jp = JP[st.actor];
    const self = A.sheets, ape = { normal: pic(`${z}_戦闘_${jp}(大猿)96×96.png`), special: pic(`${z}_戦闘_必殺技_${jp}(大猿)96×96.png`), size: 192 };
    img(ape.normal); img(ape.special);
    const as = (on) => { A.sheets = on ? ape : self; if (on) this.crAt(TEC_CENTER + 48, STD_Y); else { A.x = TEC_CENTER; A.y = STD_Y; } };
    this.se('Z1 満月');
    this.pose(A, 0, true);
    yield; // 0
    for (let f = 1; f <= 390; f++) {
      if (f <= 200) {
        A.y = -200;
        const k = Math.min(10, Math.floor(f / 8)), h = Math.min(48, f * 2), hk = f > 150 ? 300 : f * 2;
        st.back(MOON, 48 * k, 0, 48, h, 596 - hk, 354 - hk);
      } else {
        if (f === 201) this.se('Z1 パワーアップ');
        if (f <= 265) { as(f === 201 || Math.floor((f - 202) / 8) % 2 === 1); this.pose(A, 0, true); } // eight frames each
        else if (f === 266) { this.se('Z1 大猿'); this.pose(A, 1, true); }
        else this.pose(A, f <= 330 ? 1 : 0, true);
      }
      yield;
    }
    A.y = -200; // 391
    yield;
    return 'none';
  },

  // ---------- 托馬 ----------
  * crFlameBullet() { // 1349 エネルギーボール: he vanishes and strikes, charges, the blue ball rises over him, flies off and falls on it
    if (!this.st) return yield* this.energyWave();
    const st = this.st, A = this.A, G = this.G;
    this.se('Z1 高速移動');
    A.y = -200;
    yield; // 0
    for (let f = 1; f <= 613; f++) {
      if (f <= 60) this.crAfter(st, TEC_CENTER + 10, STD_Y + 28);
      if (f >= 70 && f <= 84) { G.x = CENTER_ENEX; G.y = STD_Y; }
      if (f === 85) this.se('Z1 高速移動');
      if (f >= 86 && f <= 146) this.crAfter(st, TEC_CENTER, STD_Y + 28);
      if (f === 147) { A.y = STD_Y; A.x -= 10; }
      if (f >= 157 && f <= 569) {
        const k = f - 157;
        if (k === 0) { this.se('Z1 打撃'); this.pose(A, 2, true); this.pose(G, 16, false); }
        if (k === 7) { this.se('Z1 打撃'); this.pose(A, 1, true); }
        if (k === 15) { this.se('Z1 強打'); this.pose(A, 4, true); this.pose(G, 17, false); }
        if (k === 53) { this.pose(A, 2, true); this.se(st.era === 2 ? 'Z3 変身' : 'Z2 気を溜める'); }
        if (k >= 54 && k <= 182) { this.crCharge(st); st.fxReset(); }
        if (k >= 183 && k <= 273) { // the ball over his head, a size bigger every 8 frames
          if (k === 183) { audio.seStop(); this.se('Z1 気を溜める'); }
          this.pose(A, 3, true);
          const o = st.ef;
          o.frame++;
          if (o.frame >= 9) { o.frame = 1; if (o.type < 3) o.type++; }
          st.back(BALL[0], 128 * o.type, 0, 128, 128, A.x - 4, A.y - 84);
        }
        if (k >= 274 && k <= 393) { // thrown up and away
          if (k === 274) { audio.seStop(); this.se('Z1 エネルギー波2'); }
          this.pose(A, 5, true);
          const n = k - 274;
          st.back(BALL[0], 128 * st.ef.type, 0, 128, 128, A.x - 4 + 12 * n, A.y - 84 - 2 * n);
        }
        if (k === 394) { this.pose(A, 1, true); this.se('Z1 ブン'); }
        if (k >= 15) G.x += 16;
      }
      if (f === 570) { st.fxReset(); this.zfOut(); st.bars = false; this.pose(G, 16, false); }
      if (f >= 581 && f <= 612) { // it comes down on the defender in the 気功砲 column
        if (f === 581) this.se('Z1 エネルギー波');
        this.crKikou(st);
        st.back(BALL[0], 128 * 3, 0, 128, 128, G.x - 8, -128 + 6 * (f - 581));
      }
      yield;
    }
    yield* this.crHit(24);
    return 'none';
  },

  * crFullFlameBullet() { // 2350 フルパワーフレイムバレット: his close-up, the ball swelling as it rises, then he fires it
    if (noFilm(this)) { this.zfOut(); yield; yield* this.crHit(41); return 'none'; }
    if (!this.st) return yield* this.galickGun();
    const st = this.st, A = this.A;
    this.se('Z3 変身');
    this.pose(A, 0, true);
    yield; // 0
    let rt = 0; // @ray_anime_type, counted by the film itself (below 0 before the ball shows)
    for (let f = 1; f <= 426; f++) {
      if (f <= 128) st.aura(228, 88, 3);
      if (f >= 129 && f <= 353) {
        st.no = 1;
        if (f === 129) { audio.seStop(); this.se('Z1 気を溜める'); this.se('DB3 気を溜める2'); }
        A.y = -160;
        st.back(CLOSE[27], 0, 0, 272, 254, 168, 76);
        st.cut = false; st.cutFlag = false;
        const b = 129 + 45;
        let y = 30;
        for (let n = 1; n <= 4; n++) if (f >= b + 30 * n && f <= b + 30 * (n + 1) - 1) rt = n;
        if (f >= b + 150 && f <= b + 179) { rt = 4; y -= 54; }
        if (f < b + 150) {
          if (f % 12 === 0) rt--;
          y -= [0, 6, 22, 38, 54][rt] || 0;
        }
        if (f - 129 > 45) st.back(SOKI, rt * 128, 0, 128, 128, 320, y);
        if (f === 353) st.no = 0;
      }
      if (f === 354) {
        this.se('Z1 エネルギー波'); this.se('DB3 エネルギー波2');
        this.crStand(); this.pose(A, 1, true);
        st.fxReset(); st.cut = true; st.cutFlag = true;
      }
      if (f >= 354 && f <= 399) st.fx((k) => st.front(BALL4, 0, 0, 190, 126, 352 + k.frame * RAY_SPEED, 98)); // 293
      if (f === 400) { st.small = true; st.fxReset(); st.no = 0; this.zfOut(); this.se('Z1 エネルギー波'); this.se('DB3 エネルギー波2'); }
      if (f >= 401 && f <= 425) st.fx((k) => st.front(BALL4, 0, 0, 190, 126, -162 + k.frame * RAY_SPEED, 98)); // 266
      yield;
    }
    yield* this.crHit(44);
    return 'none';
  },
});

Object.assign(Duel.prototype, {
  // ---------- 賽莉帕 ----------
  * crHysteric() { // 1359 ヒステリックサイヤンレディ: she flies off and back in, seven blows, up and over, the kick that carries both away
    if (!this.st) { yield* this.shockwave(); return 'shock'; }
    const A = this.A, G = this.G;
    this.pose(A, 0, true);
    this.se('Z1 飛ぶ');
    let ax = 0;
    yield; // 0
    for (let f = 1; f <= 209; f++) {
      if (f <= 40) { ax = 24; this.pose(A, 6, true); }
      if (f === 41) { A.x = -120; G.x = CENTER_ENEX; G.y = STD_Y; }
      if (f >= 57 && f <= 150) {
        const k = f - 57, n = Math.floor(k / 12), r = k % 12;
        if (r === 0 && n <= 6) { if (n % 2 === 0) { ax = 0; this.pose(A, 2, true); } else this.pose(A, 3, true); this.se('Z1 強打'); }
        if (n <= 6 && r <= 1) { G.x += 12; this.pose(G, 16, false); } else if (n <= 6 && r <= 3) G.x -= 12;
      }
      if (f >= 151 && f <= 169) { // up, over and down onto it
        if (f === 151) { this.pose(A, 6, true); this.se('Z1 飛ぶ'); }
        if (f <= 154) A.y -= 12;
        else if (f <= 156) { A.y -= 8; A.x += 8; } else if (f <= 162) A.x += 12; else if (f <= 164) { A.y += 8; A.x += 8; } else if (f <= 168) A.y += 12;
        else { this.pose(A, 7, true); this.se('ZG 打撃5'); this.se('Z1 飛ぶ'); }
      }
      if (f >= 170 && f <= 189) { A.x += 24; G.x += 24; this.pose(G, 17, false); }
      if (f === 190) { A.x = -120; G.x = -184; }
      if (f >= 191 && f <= 208) { A.x += 24; G.x += 24; }
      if (f === 209) A.y = -200;
      A.x += ax;
      yield;
    }
    yield* this.crHit(22);
    return 'none';
  },

  * crHuntingArrow() { // 2360 ハンティングアロー: her close-up with the blinking ball, then she fires it
    if (noFilm(this)) { this.zfOut(); yield; yield* this.crHit(41); return 'none'; }
    if (!this.st) return yield* this.pierce();
    yield* this.crCannon(28, (st, f) => {
      st.fx((k) => { // 289
        st.front(BLINK_BIG, 64 * k.rtype, 0, 64, 64, 372, 116);
        if (k.rframe >= 4 && k.rtype !== 4) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4) { k.rtype = 0; k.rframe = 0; }
      });
    }, 'Z1 気を溜める3', 2, 1, 303);
    yield* this.crHit(44);
    return 'none';
  },

  // 2360 / 2377: the charge, her / his close-up (st.no `no`), the ball fired (293) and hitting (266)
  * crCannon(who, during, se, row, no, end) {
    const st = this.st, A = this.A;
    this.se('Z3 変身');
    this.pose(A, 0, true);
    yield; // 0
    const [w, h, x] = { 28: [248, 254, 208], 30: [250, 200, 192] }[who];
    for (let f = 1; f <= 376; f++) {
      if (f <= 128) st.aura(228, 88, 3);
      if (f >= 129 && f <= end) {
        st.no = no;
        if (f === 129) { audio.seStop(); this.se(se); this.se('DB3 気を溜める2'); }
        A.y = -160;
        st.back(CLOSE[who], 0, 0, w, h, x, 76);
        if (during) during(st);
        st.cut = false; st.cutFlag = false;
        if (f === end) st.no = 0;
      }
      if (f === 304) {
        this.se('Z1 エネルギー波'); this.se('DB3 エネルギー波2');
        this.crStand(); this.pose(A, row, true);
        st.fxReset(); st.cut = true; st.cutFlag = true;
      }
      if (f >= 304 && f <= 349) st.fx((k) => st.front(BALL4, 0, 0, 190, 126, 352 + k.frame * RAY_SPEED, 98)); // 293
      if (f === 350) { st.small = true; st.fxReset(); st.no = 0; this.zfOut(); this.se('Z1 エネルギー波'); this.se('DB3 エネルギー波2'); }
      if (f >= 351 && f <= 375) st.fx((k) => st.front(BALL4, 0, 0, 190, 126, -162 + k.frame * RAY_SPEED, 98)); // 266
      yield;
    }
  },

  // ---------- 托特波 ----------
  * crAngryAttack() { // 1368 アングリーアタック: he vanishes and strikes eight times, charges, and rams the defender twice
    if (!this.st) { yield* this.zanzouken(); return 'shock'; }
    const st = this.st, A = this.A, G = this.G;
    this.se('Z1 高速移動');
    A.y = -200;
    yield; // 0
    for (let f = 1; f <= 494; f++) {
      if (f <= 60) this.crAfter(st, TEC_CENTER + 10, STD_Y + 28);
      if (f >= 70 && f <= 84) { G.x = CENTER_ENEX; G.y = STD_Y; }
      if (f === 85) this.se('Z1 高速移動');
      if (f >= 86 && f <= 146) this.crAfter(st, TEC_CENTER, STD_Y + 28);
      if (f === 147) { A.y = STD_Y; A.x -= 10; }
      if (f >= 157 && f <= 279) {
        const k = f - 157, n = Math.floor(k / 12), r = k % 12;
        if (r === 0 && n <= 7) {
          this.se(n === 7 ? 'ZG 打撃4' : 'Z1 強打');
          this.pose(A, [2, 1, 4, 3, 1, 4, 3, 2][n], true);
          if (n === 0) this.pose(G, 16, false);
          if (n === 7) this.pose(G, 17, false);
        }
        if (n <= 6 && r <= 1) { G.x += 12; this.pose(G, 16, false); } else if (n <= 6 && r <= 3) G.x -= 12;
        else if (k >= 84 && k <= 120) G.x += 16;
      }
      if (f === 280) { this.pose(A, 2, true); this.se(st.era === 2 ? 'Z3 変身' : 'Z2 気を溜める'); }
      if (f >= 281 && f <= 408) {
        this.crCharge(st);
        if (f === 408) { audio.seStop(); this.se('DB3 エネルギー波2'); }
      }
      if (f >= 409 && f <= 450) { this.pose(A, 4, true); A.x += 16; }
      if (f === 460) { st.fxReset(); this.zfOut(); A.x = -120; A.y = STD_Y; this.pose(A, 4, true); this.pose(G, 0, false); }
      if (f >= 471 && f <= 493) A.x += 16;
      if (f === 494) A.y = -200;
      yield;
    }
    yield* this.crHit(22, true);
    return 'none';
  },

  * crAngryCannon() { // 2369 アングリーキャノン: his close-up, the ball blinking low in front, the blast; the ball flies in
    if (noFilm(this)) { this.zfOut(); yield; yield* this.crHit(41); return 'none'; }
    if (!this.st) return yield* this.kikouhou();
    const st = this.st, A = this.A;
    this.se('Z3 変身');
    this.pose(A, 0, true);
    yield; // 0
    for (let f = 1; f <= 337; f++) {
      if (f <= 128) {
        st.aura(228, 88, 3);
        if (f === 128) { st.no = 3; st.cut = false; }
      }
      if (f >= 129 && f <= 300) {
        if (f === 129) audio.seStop();
        A.y = -160;
        let bx = 140, by = 20; // (the original's shake: 231-233 -2, 234 -4, 235 -2)
        if (f >= 231 && f <= 233) { bx -= 2; by -= 2; } else if (f === 234) { bx -= 4; by -= 4; } else if (f === 235) { bx -= 2; by -= 2; }
        st.back(CLOSE[29], 0, 0, 274, 264, bx, by);
        if (f >= 140 && f <= 230) {
          if (f === 140) this.se('DB3 気を溜める2');
          st.fx((k) => { // 235
            st.front(BLINK, 32 * k.rtype, 0, 32, 32, 370, 290);
            if (k.rframe >= 4 && k.rtype !== 4) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4) { k.rtype = 0; k.rframe = 0; }
          });
        }
        if (f === 231) { this.se('Z1 エネルギー波'); this.se('Z1 ゴー'); st.ef.rtype = 0; st.ef.rframe = 0; }
        if (f >= 231) {
          st.fx((k) => { // 264
            st.front(BIGBANG, 302 * k.rtype, 0, 302, 200, 338, 156);
            if (k.rframe >= 4 && k.rtype !== 1) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4) { k.rtype = 0; k.rframe = 0; }
          });
        }
      }
      if (f === 301) { st.cut = true; st.fxReset(); st.no = 0; this.zfOut(); }
      if (f >= 311 && f <= 336) { // 265 if 貝吉塔 ($super_saiyazin_flag[3]) is a Super Saiyan, else 266 (as the original has it)
        const s = window.__game && window.__game.state;
        if (s && isSuper(s, 3)) st.fx((k) => st.front(HALF, 0, 128, 700, 128, -700 + k.frame * RAY_SPEED, 112));
        else st.fx((k) => st.front(BALL4, 0, 0, 190, 126, -162 + k.frame * RAY_SPEED, 112));
      }
      yield;
    }
    yield* this.crHit(44);
    return 'none';
  },

  // ---------- 龐布金 ----------
  * crCatapult() { // 1376 マッシブカタパルト: he vanishes, a flurry of fifteen blows, backs off and rams in
    if (!this.st) { yield* this.wolfFang(); return 'shock'; }
    const st = this.st, A = this.A, G = this.G;
    this.se('Z1 高速移動');
    A.y = -200;
    let ax = 0;
    yield; // 0
    for (let f = 1; f <= 266; f++) {
      if (f <= 60) this.crAfter(st, TEC_CENTER + 10, STD_Y + 28);
      if (f >= 70 && f <= 84) { G.x = CENTER_ENEX; G.y = STD_Y; }
      if (f === 85) this.se('Z1 高速移動');
      if (f >= 86 && f <= 146) this.crAfter(st, TEC_CENTER, STD_Y + 28);
      if (f === 147) { A.y = STD_Y; A.x -= 10; }
      if (f >= 157 && f <= 229) {
        const k = f - 157, n = Math.floor(k / 4), r = k % 4;
        if (r === 0 && n <= 14) {
          if (n === 0) { this.se('ZG 打撃3'); this.pose(A, 3, true); this.pose(G, 16, false); }
          else if (n % 2 === 0) { this.se('ZG 打撃3'); this.pose(A, 3, true); A.x += 12; }
          else { this.pose(A, 6, true); A.x -= 12; }
        }
        if (k === 60) { ax = -16; this.se('Z1 飛ぶ'); this.pose(A, 16, false); }
        const m = Math.floor(k / 8), q = k % 8; // the defender rocks with every second blow
        if (m <= 7 && q <= 1) { G.x += 12; this.pose(G, 16, false); } else if (m <= 7 && q <= 3) G.x -= 12;
      }
      if (f === 230) ax = 0;
      if (f === 258) { ax = 24; this.pose(A, 4, true); }
      if (f === 262) this.pose(A, 2, false);
      if (f === 266) A.y = -200;
      A.x += ax;
      yield;
    }
    yield* this.crHit(22, true);
    return 'none';
  },

  * crMassiveCannon() { // 2377 マッシブキャノン: his close-up between ZG's side bars, then he fires the ball
    if (noFilm(this)) { this.zfOut(); yield; yield* this.crHit(41); return 'none'; }
    if (!this.st) return yield* this.galickGun();
    yield* this.crCannon(30, null, 'Z1 気を溜める3', 7, 4, 303);
    yield* this.crHit(44);
    return 'none';
  },
});

// ?dev=ancc<skill id>: a Z3 save in the 時之間 hall with the four (level 50) against 19號・20號 (their cut-ins);
// ancc<skill>z2 the same in Z2 (variable 40 = 1) against Frieza soldiers; ancc<skill>ape with the move's user already
// the Great Ape. The film is played from the console: __game.scene.play(m, f, true, 246, 123, f) (src/battle.js play)
registerZ3('ancc', {
  dev(game, step) {
    const m = /^ancc(\d+)(z2)?(ape)?$/.exec(step), id = m && ZF_ACTOR[m[1]];
    if (!id) return false;
    const s = game.state = game.newState();
    s.var[40] = m[2] ? 1 : 2;
    s.var[43] = 60;
    s.flags.z3 = 'done';
    party(game, [id, ...[27, 28, 29, 30].filter((x) => x !== id)]);
    for (const x of s.party) { x.level = 50; x.exp = game.world.actors[x.id].exp[50]; applyLevel(game.world, x); heal(x); }
    if (m[3]) { // (as src/cards_a.js apeOn does)
      const x = s.party[0], z = m[2] ? 'Z2' : 'Z3';
      x.cdaApe = { sprite: x.sprite, special: x.special, size: x.spriteSize };
      x.sprite = pic(`${z}_戦闘_${JP[id]}(大猿)96×96.png`); x.special = pic(`${z}_戦闘_必殺技_${JP[id]}(大猿)96×96.png`); x.spriteSize = 192;
    }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle(m[2] ? [31, 32] : [123, 122], true, { loseOk: true }), 300);
    return true;
  },
});

// sounds these films play, for tools/copy_assets.py
export const CR_SOUNDS = ['Z1 怪光線', 'Z3 エネルギー波', 'DB3 気を溜める2', 'Z1 エネルギー波2', 'Z3 変身', 'Z1 高速移動', 'Z1 打撃', 'Z1 強打',
  'Z2 気を溜める', 'Z1 気を溜める', 'Z1 ブン', 'Z1 エネルギー波', 'Z1 満月', 'Z1 パワーアップ', 'Z1 大猿', 'Z1 飛ぶ', 'ZG 打撃5', 'ZG 打撃4',
  'ZG 打撃3', 'DB3 エネルギー波2', 'Z1 気を溜める3', 'Z1 ゴー', 'Z3 跳ね返し', 'Z3 光線系ヒット', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3',
  'DB3 大爆発', 'Z3 避ける'];

// 巴達克・超巴達克's special-move films (docs/anim-cd-plan.md ancb), ported frame by frame from the original's
// Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like src/anime.js. The move switch (attack pattern = skill id + 10)
// sends them to the same films in every part of the story — Z1 (the 時之間's Bardock part, its own moves 159-163:
// all.rb 55620), Z2 (57424) and Z3 (60806) — after anime_pattern 31 / 32, followed by the damage pattern:
//   147 / 159 エネルギー波          157 / 169 → 1221 (79974), damage 23
//   148 / 160 強力エネルギー波      158 / 170 → 1248 (80487), 23
//   149 / 161 爆発波 (everyone)     159 / 171 → 1249 (80541), 23; the targets after the first skip 31 / 32 and the charge
//   151 / 163 ファイナルリベンジャー 161 / 173 → 1251 (80631), 22
//   152 スピリッツキャノン          162 → 1252 (80844), 41 (Z1 174: 23)
//   155 スーパーファイナルリベンジャー (超巴達克, Z3) 165 → 2255 (95494), 44
//   158 超サイヤ人変身              168 → 2129: src/anime_goku_gohan.js angaSs (the same film as 29 / 59 / 133 …)
//   (150 / 162 スピリットオブサイヤン: no attack 160 / 172 in any part, and no event ever teaches them — no film)
// The pictures are the part's own ($btl_top_file_name Z1_ / Z2_ / Z3_), @ray_color 3 (blue). From Z2 on the strips,
// the cut-in and 必殺技! are src/anime_goku_gohan.js's (agFilms). Each film keeps the original's own counters
// (@ax @ay @gx @gy, @effect_anime_*, @ray_anime_*, @back_anime_*) so it moves and blinks as the original does —
// @gx even flips sign every frame it is left unset (output_battle_anime). Frame numbers are @battle_anime_frame.
import { audio, img } from './core.js?v=20261104-0709';
import { Duel, addMoves, spark, BACK_Y, STD_Y, CENTER_ENEX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261104-0709';
import { agFilms } from './anime_goku_gohan.js?v=20261104-0709';
import { registerZ3, party, heal } from './z3.js?v=20261104-0709';
import { superSaiyan } from './supersaiyan.js?v=20261104-0709';
import { applyLevel } from './party.js?v=20261104-0709';

addMoves({
  147: 'ancbWave', 148: 'ancbBigWave', 149: 'ancbBlast', 151: 'ancbRevenger', 152: 'ancbCannon', 155: 'ancbSuperRevenger',
  159: 'ancbWave', 160: 'ancbBigWave', 161: 'ancbBlast', 163: 'ancbRevenger', // the Z1 Bardock part's own
  158: 'angaSs',
});

const pic = (n) => `Graphics/Pictures/${n}`;
const STD_CHAX = -70; // STANDARD_CHAX
const st0 = () => (globalThis.__game && globalThis.__game.state) || {};
const era = () => Math.min(2, (st0().var && st0().var[40]) || 0); // $btl_progress (the party's: variable 40)
const v = (n) => (st0().var && st0().var[n]) || 0;
const sw = (n) => !!(st0().sw && st0().sw[n]);
// $btl_top_file_name pictures, Z1_ / Z2_ / Z3_
const P = (z1, z2, z3) => () => [z1, z2, z3][era()];
const SMALL = P(pic('Z1_戦闘_必殺技_エネルギー波_小_敵_青.PNG'), pic('Z2_戦闘_必殺技_エネルギー波_小_敵_青.PNG'),
  pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG')); // effects 225 / 226: 400×48, the lower half launched
const MID = P(pic('Z1_戦闘_必殺技_エネルギー波_中_敵_青.PNG'), pic('Z2_戦闘_必殺技_エネルギー波_中_敵_青.PNG'),
  pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG')); // effects 233 / 234: 400×80
const AURA3 = P(pic('Z1_戦闘_必殺技_気を溜める3(青).png'), pic('Z2_戦闘_必殺技_気を溜める3(青).png'),
  pic('Z3_戦闘_必殺技_気を溜める3(青).png')); // back 101: 3 frames of 184×240
const AURA4 = P(pic('Z1_戦闘_必殺技_気を溜める4(青).png'), pic('Z2_戦闘_必殺技_気を溜める4(青).png'),
  pic('Z3_戦闘_必殺技_気を溜める4(青).png')); // back 102: 3 frames of 224×288
const AURA_Z3 = pic('Z3_戦闘_必殺技_気を溜める(青).png'); // back 201 (only from Z3): 2 frames of 136×142
const DEMON = P(pic('Z1_戦闘_必殺技_背景_魔族系(縦).png'), pic('Z2_戦闘_必殺技_背景_魔族系(縦).png'),
  pic('Z3_戦闘_必殺技_背景_魔族系(縦).png')); // back 2: 640×356 every 480
const SHOCK = P(pic('Z1_戦闘_必殺技_背景_衝撃波系.png'), pic('Z2_戦闘_必殺技_背景_衝撃波系.png'),
  pic('Z3_戦闘_必殺技_背景_衝撃波系.png')); // back 1: 640×180
const REVENGER = [P(pic('Z1_戦闘_必殺技_ファイナルリベンジャー.PNG'), pic('Z2_戦闘_必殺技_ファイナルリベンジャー.PNG'),
  pic('Z3_戦闘_必殺技_ファイナルリベンジャー.PNG')), P(pic('Z1_戦闘_必殺技_ファイナルリベンジャー_超.png'),
  pic('Z2_戦闘_必殺技_ファイナルリベンジャー_超.png'), pic('Z3_戦闘_必殺技_ファイナルリベンジャー_超.png'))]; // effect 238: 2 frames of 236×122
// effects 206 / 207: エネルギー弾3 (222×134) before Z3, エネルギー弾4 (190×126) in Z3 (there is no Z1_ エネルギー弾3(青):
// 1252 is never met in Z1 — its 174 is taught to no one there)
const BALL = () => (era() >= 2 ? [pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'), 190, 126] : [pic('Z2_戦闘_必殺技_エネルギー弾3(青).PNG'), 222, 134]);
const BLINK = { 16: pic('Z3_必殺技_超カメハメ波(球点滅小)(青).png'), 32: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'),
  64: pic('Z3_必殺技_超カメハメ波(球点滅大)(青).png') }; // effects 237 / 235 / 289: 5 frames, the next every 4
const CANNON = pic('Z2_必殺技_スピリッツキャノン(バーダック)スカウター有り.png'); // 1252 with switch 504 (its cut-in picture)
const CANNON_SS = [pic('Z3_必殺技_スピリッツキャノン(バーダック超)スカウター有り.png'), pic('Z3_必殺技_スピリッツキャノン(バーダック超).png')]; // 2255 by variable 175
const BOOM3 = pic('戦闘アニメ_爆発3.PNG'), BOOM6 = pic('戦闘アニメ_爆発6.PNG'); // effects 102 (112×120) / 105 (256×256)

// a blt clipped to the picture as RGSS clips it (the beams' source rects grow past the picture's edge)
function blt(c, sheet, sx, sy, w, h, x, y) {
  const e = img(sheet);
  if (!e.ok) return;
  w = Math.min(w, e.im.width - sx); h = Math.min(h, e.im.height - sy);
  if (w > 0 && h > 0) c.drawImage(e.im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
}
const at = (sheet, sx, sy, w, h, x, y) => (c) => blt(c, sheet, sx, sy, w, h, x, y);

// the pictures each film shows (loaded while it swoops in), and its LAUNCH entry (pattern 32: the cut-in from frame 30
// (@chr_cutin_flag), the small strips in Z3 (@tec_back_small))
agFilms({
  ancbWave: [() => [SMALL()], {}],
  ancbBigWave: [() => [era() >= 2 ? AURA_Z3 : AURA3(), MID()], { cut: true, small: 'z3' }],
  ancbBlast: [() => [era() >= 2 ? AURA_Z3 : AURA3(), DEMON(), SHOCK()], { cut: true }],
  ancbRevenger: [() => [era() >= 2 ? AURA_Z3 : AURA4(), REVENGER[0](), REVENGER[1]()], { cut: true, small: 'z3' }],
  ancbCannon: [() => [AURA4(), BLINK[16], BLINK[32], BLINK[64], CANNON, BALL()[0], BOOM3], { cut: true, small: 'z3' }],
  ancbSuperRevenger: [() => [AURA_Z3, ...CANNON_SS, BLINK[32], BLINK[64], BALL()[0], BOOM6], { cut: true, small: true }],
});

Object.assign(Duel.prototype, {
  // one film on src/anime_goku_gohan.js's stage: body(f, r) is the pattern's case for frame f (r: the original's
  // counters; r.U the pictures it blts behind the fighters); then output_battle_anime (the moves) and effect_pattern.
  // The last frame is anime_pattern_fromat: the fighters move and show once more, no effect.
  * cbRun(st, last, body) {
    const A = this.A, r = { ax: 0, ay: 0, gx: 0, gy: 0, ot: 0, ep: 0, ef: 0, et: 0, rt: 0, rf: 0, bt: 0, bf: 0, x: 0, y: 0, U: [] };
    // back_anime_pattern: blt with the picture it is on, then count (the next of last + 1 every `every` frames)
    r.back = (sheet, sx, sy, w, h, x, y, every, lastPic) => {
      r.U.push(at(sheet, sx, sy, w, h, x, y));
      if (r.bf >= every && r.bt !== lastPic) { r.bt++; r.bf = 0; } else if (r.bf >= every) { r.bt = 0; r.bf = 0; }
      r.bf++;
    };
    r.back101 = (x, y) => r.back(AURA3(), r.bt * 184, 0, 184, 240, x, y, 4, 2);
    r.back102 = (x, y) => r.back(AURA4(), r.bt * 224, 0, 224, 288, x, y - 36, 4, 2);
    r.back201 = (x, y) => r.back(AURA_Z3, r.bt * 136, 0, 136, 142, x, y, 16, 1);
    r.back2 = () => r.back(DEMON(), 0, r.bt * 480, 640, 356, 0, 0, 4, 2);
    r.back1 = () => { // the shock streaks (a big defender only gets the top and bottom 42)
      if ((this.G.sheets.size || 96) === 192) { r.U.push(at(SHOCK(), 0, r.bt * 180, 640, 42, 0, 32)); r.back(SHOCK(), 0, 138 + r.bt * 180, 640, 42, 0, 266, 4, 2); }
      else r.back(SHOCK(), 0, r.bt * 180, 640, 180, 0, 80, 4, 2);
    };
    r.fxOff = () => { r.ep = 0; r.ef = 0; r.et = 0; };
    for (let f = 0; f <= last; f++) {
      r.U = [];
      body(f, r);
      A.sp = r.ot === 1;
      this.vel(r.ax, r.ay, r.gx, r.gy); r.gx = -r.gx; // (@gx = -@gx; @enex += @gx)
      const O = [];
      if (f < last && r.ep) this.cbEffect(r, O);
      st.under = r.U; st.over = O;
      yield;
    }
  },

  // set_chr_display_out: the attacker leaves, the defender stands in the middle as it is (its picture unchanged), the
  // enemy's cut-in from now on
  cbOut(st) {
    this.A.y = -200;
    this.G.x = CENTER_ENEX; this.G.y = STD_Y;
    if (st.cutFrom !== Infinity) st.mirror = true;
  },

  // effect_pattern (the party attacking, @ray_color 3) at ray_x / ray_y = r.x / r.y; then @ray_anime_frame and
  // @effect_anime_frame count on
  cbEffect(r, O) {
    const A = this.A, G = this.G, ef = r.ef;
    const blink = (z) => {
      O.push(at(BLINK[z], z * r.rt, 0, z, z, r.x, r.y));
      if (r.rf >= 4 && r.rt !== 4) { r.rt++; r.rf = 0; } else if (r.rf >= 4) { r.rt = 0; r.rf = 0; }
    };
    switch (r.ep) {
      case 121: { // 攻撃ヒット: at his fist and on the defender
        if (ef > 10) break;
        const ax = A.x + 96, ay = A.y + 32, gx = G.x, gy = G.y - ((G.sheets.size || 96) === 192 ? 48 : 0);
        O.push((c) => { spark(c, ef <= 4 ? 0 : 32, 16, 32, 32, ax, ay); spark(c, 32, 0, 32, 16, gx, gy); });
        break;
      }
      case 206: { const [b, w, h] = BALL(); O.push(at(b, 0, 0, w, h, r.x + ef * RAY_SPEED, r.y)); break; } // 界王拳かめはめ波系(発動)
      case 207: { const [b, w, h] = BALL(); O.push(at(b, 0, 0, w, h, -192 + ef * RAY_SPEED, 96)); break; } // (ヒット)
      case 225: O.push(at(SMALL(), 0, 48, 54 + ef * RAY_SPEED, 48, r.x, r.y)); break; // エネルギー波_小系(発動)
      case 226: O.push(at(SMALL(), 0, 0, 400, 48, -400 + ef * RAY_SPEED, 148)); break; // (ヒット)
      case 233: O.push(at(MID(), 0, 80, 54 + ef * RAY_SPEED, 80, r.x, r.y)); break; // 口から怪光線ドドリア系(発動)
      case 234: O.push(at(MID(), 0, 0, 400, 80, -400 + ef * RAY_SPEED, r.y)); break; // (ヒット)
      case 235: blink(32); break; // スーパーカメハメ波ため
      case 237: blink(16); break; // ファイナルリベンジャーため(小)
      case 289: blink(64); break; // スピリッツキャノン一枚絵用
      case 238: { // the javelin ($super_saiyazin_flag[7]: 超巴達克's)
        const s = st0();
        O.push(at(REVENGER[s.ss && s.ss[7] ? 1 : 0](), 236 * r.rt, 0, 236, 122, r.x, r.y));
        if (r.rf >= 8 && r.rt === 0) { r.rt = 1; r.rf = 0; } else if (r.rf >= 8) { r.rt = 0; r.rf = 0; }
        break;
      }
      default:
    }
    r.rf++; r.ef++;
  },

  // the film is over: the strips and the cut-in stay through the damage; 41 爆発系ZD中 / 44 爆発系Z2特大 are played here
  // (only in a film's own battle, not inside a combo)
  * cbEnd(st, kind) {
    st.under = []; st.over = [];
    const zd = kind === 'zd41' || kind === 'zd44';
    if (this.constructor !== Duel) return zd ? 'big' : kind;
    if (!zd) return kind;
    if (!this.hit) return 'miss'; // (src/anime.js run: the defender dodges)
    const [se, sheet, w, x, y] = kind === 'zd44' ? ['DB3 大爆発', BOOM6, 256, 298 - 64, 110 - 64] : ['ZG 光線系ヒット2', BOOM3, 112, 318, 120];
    this.se(se);
    this.showHit();
    this.pose(this.G, 17, false);
    // (the explosion's counter: its rect is taken before the frame moves it on, so each picture shows 11 frames)
    this.effect((c, t) => { const k = Math.floor(t / 11); if (w * (k + 1) <= (kind === 'zd44' ? 1024 : 224)) blt(c, sheet, k * w, 0, w, w === 256 ? 256 : 120, x, y); });
    for (let f = 1; f < 60; f++) {
      if (f >= 21 && f <= 39) this.vel(0, 0, -20, 0);
      if (f === 40) this.effect(null);
      yield;
    }
    return 'none';
  },

  * ancbWave() { // 1221 (ベジータ)エネルギー波, Bardock's place: the small blue wave grows from his hand
    if (!this.p) return yield* this.energyWave();
    const st = this.agStage();
    yield* this.cbRun(st, 73, (f, r) => {
      if (f === 0) { this.se('Z1 怪光線'); r.ot = 1; this.pose(this.A, 1); }
      if (f >= 1 && f <= 40) { r.ep = 225; r.x = 358; r.y = 132; }
      if (f === 41) r.fxOff();
      if (f === 45) this.cbOut(st);
      if (f >= 46 && f <= 72) r.ep = 226;
    });
    return yield* this.cbEnd(st, 'beam');
  },

  * ancbBigWave() { // 1248 (バーダック)強力エネルギーは: the aura, the wave from his hand
    if (!this.p) return yield* this.energyWave();
    const st = this.agStage(), z3 = era() >= 2;
    yield* this.cbRun(st, 187, (f, r) => {
      r.x = 350; r.y = 124;
      if (f === 0) { this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める'); r.ot = 1; this.pose(this.A, 4); }
      if (f >= 1 && f <= 109) { if (z3) r.back201(232, 86); else r.back101(218, 32); }
      if (f >= 110 && f <= 148) {
        if (f === 110) { audio.seStop(); this.se('Z1 エネルギー波2'); }
        this.pose(this.A, 1); r.ep = 233; r.x = 358; r.y = 118;
      }
      if (f === 149) r.fxOff();
      if (f === 159) this.cbOut(st);
      if (f >= 160 && f <= 186) r.ep = 234;
    });
    return yield* this.cbEnd(st, 'beam');
  },

  * ancbBlast() { // 1249 爆発波(バーダック): the aura, the burst over the demon backdrop, the shock on the enemy
    if (!this.p) return yield* this.vegetaBlast();
    const st = this.agStage(), z3 = era() >= 2, A = this.A, G = this.G;
    yield* this.cbRun(st, 243, (f, r) => {
      if (f === 0) { this.se(z3 ? 'Z3 変身' : 'Z1 気を溜める3'); r.ot = 1; this.pose(A, 4); }
      if (f >= 1 && f <= 100) { if (z3) r.back201(232, 86); else r.back101(218, 32); this.pose(A, 4); }
      if (f === 101) { st.cut(false); st.tec(false); audio.seStop(); this.se('Z1 エネルギー波'); r.back2(); }
      if (f >= 102 && f <= 180) { r.back2(); this.pose(A, 5); }
      if (f === 181) { r.ot = 0; A.y = -120; G.x = CENTER_ENEX; G.y = STD_Y; this.se('Z1 ザー'); }
      if (f >= 182 && f <= 242) { st.cut(true, true); r.back1(); }
    });
    return yield* this.cbEnd(st, 'beam');
  },
  * ancbBlastAgain() { // 1249, @all_attack_count >= 2: no strips, the enemy's cut-in, the shock on each further enemy
    const st = this.agStage(), A = this.A, G = this.G;
    st.tec(false); st.cut(true, true);
    yield* this.cbRun(st, 62, (f, r) => {
      if (f === 0) { this.se('Z1 ザー'); r.ot = 0; A.y = -120; G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); }
      if (f >= 1 && f <= 61) r.back1();
    });
    return yield* this.cbEnd(st, 'beam');
  },

  * ancbRevenger() { // 1251 (バーダック)ファイナルリベンジャー: he flies at the enemy, a rush of blows, the javelin of ki
    if (!this.p) return yield* this.galickGun();
    const st = this.agStage(), z3 = era() >= 2, A = this.A, G = this.G;
    const pa = (n) => this.pose(A, n), pg = (n) => this.pose(G, n, false);
    yield* this.cbRun(st, 356, (f, r) => {
      r.x = 300; r.y = 162;
      if (f === 0) { this.se(z3 ? 'Z3 変身' : 'Z2 気を溜める'); r.ot = 1; pa(4); }
      else if (f <= 80) { if (z3) r.back201(232, 86); else r.back102(200, 32); }
      else if (f <= 120) { if (f === 81) { audio.seStop(); this.se('Z1 飛ぶ'); } pa(3); r.ax = 20; r.ay = -2; }
      else if (f <= 126) { /* (still flying) */ }
      else if (f === 127) { this.cbOut(st); A.x = STD_CHAX - 40; A.y = STD_Y - 26; r.ot = 1; pa(3); }
      else if (f <= 144) { if (f === 143) { this.se('Z1 強打'); pg(16); } r.ax = 20; r.ay = 2; }
      else if (f <= 147) { r.ax = 0; r.ay = 0; r.gx = -20; r.ep = 121; }
      else if (f <= 150) { pg(0); r.gx = 20; }
      else if (f <= 160) r.gx = 0;
      else if (f <= 170) { r.ot = 0; pa(16); r.ax = -20; r.ay = -4; }
      else if (f <= 175) { r.ax = 20; r.ay = 4; }
      else if (f <= 180) { pa(2); r.ax = 20; r.ay = 4; }
      else if (f <= 183) { if (f === 181) { this.se('Z1 打撃'); r.fxOff(); r.ep = 121; r.gx = -16; } r.ax = 0; r.ay = 0; pg(16); }
      else if (f <= 186) { if (f === 184) r.gx = 16; pg(0); }
      else if (f <= 190) r.gx = 0;
      else if (f <= 200) { r.ot = 0; pa(16); r.ax = -20; r.ay = 4; }
      else if (f <= 205) { r.ax = 20; r.ay = -4; }
      else if (f <= 210) { pa(3); r.ax = 20; r.ay = -4; }
      else if (f <= 220) { if (f === 211) { this.se('Z1 強打'); r.fxOff(); r.ep = 121; } r.ax = 0; r.ay = 0; }
      else if (f <= 240) { pg(16); r.gx = -20; r.gy = -4; }
      else if (f <= 259) { if (f === 241) { r.ot = 1; audio.seStop(); this.se('Z1 飛ぶ'); } pa(3); r.ax = 20; r.ay = -4; }
      else if (f === 260) { A.x = STD_CHAX - 120; A.y = STD_Y + 70; G.x = STD_CHAX - 40; G.y = STD_Y + 46; r.ot = 1; pa(3); }
      else if (f <= 275) { r.gx = -20; r.gy = -2; }
      else if (f <= 280) { r.gx = -10; r.gy = -2; r.ax = 40; r.ay = -2; }
      else if (f === 281) { A.y = STD_Y; G.y = STD_Y; r.ax = 0; r.ay = 0; r.gx = 0; r.gy = 0; pa(7); this.se('ZG 打撃4'); }
      else if (f <= 290) { /* (no case) */ }
      else if (f <= 300) r.gx = -4;
      else if (f <= 311) { pa(2); pg(17); r.gx = -20; r.gy = 2; }
      else if (f <= 320) { r.gx = -20; r.gy = 2; r.ef = 0; r.x = 240; r.y = 104; } // (the hit sparks show again)
      else if (f <= 339) { if (f === 321) { A.y = -120; this.se('Z1 大猿'); } r.ep = 238; r.x = 190 + r.ef * 20; r.y = 104 + r.ef * 2; }
      else if (f === 340) {
        this.cbOut(st);
        r.gx = 0; r.gy = 0; r.ax = 0; r.ay = 0; r.x = STD_CHAX - 40; r.y = STD_Y - 26; r.ef = 0;
        pg(16); G.x = CENTER_ENEX - 150; G.y = STD_Y - 20;
      } else if (f <= 355) { r.x = STD_CHAX - 40 + r.ef * 20; r.y = STD_Y - 26 + r.ef * 2; r.gx = -10; r.gy = 2; }
      else { r.gx = 0; r.gy = 0; G.x = CENTER_ENEX; G.y = STD_Y; }
    });
    return yield* this.cbEnd(st, 'shock');
  },

  * ancbCannon() { // 1252 (バーダック)スピリッツキャノン: the charge (switch 504: his close-up), the ball fired off and hitting
    if (!this.p) return yield* this.galickGun();
    const st = this.agStage(), A = this.A;
    const g = globalThis.__game, duel = g && g.scene && g.scene.duel;
    const close = sw(504) && !(duel && duel.m && duel.m.id === 32); // ($game_switches[504] == false || $partyc == 32: no close-up)
    const shot = era() >= 2 ? 96 : 92;
    yield* this.cbRun(st, 289, (f, r) => {
      r.x = 300; r.y = 162;
      const closeUp = () => r.U.push(at(CANNON, 0, 26, 274, 228, 180, 64));
      if (f === 0) {
        this.se('Z1 気を溜める3'); r.ot = 1;
        if (!close) this.pose(A, 4);
        else { st.cut(false); A.x = -100; closeUp(); r.x = 202; r.y = 236; r.ep = 235; }
      } else if (f <= 60) {
        if (!close) { r.back102(200, 32); r.ep = 237; } else { closeUp(); r.x = 202; r.y = 236; r.ep = 235; }
      } else if (f <= 120) {
        if (!close) { r.back102(200, 32); r.x = 300; r.y = 156; r.ep = 235; }
        else { closeUp(); if (f === 120) st.cut(true); r.x = 186; r.y = 220; r.ep = 289; }
      } else if (f <= 170) { A.x = TEC_CENTER; r.x = 276; r.y = 140; this.pose(A, 6); r.ep = 235; }
      else if (f === 171) { audio.seStop(); this.pose(A, 2); r.x = -360; r.y = -96; }
      else if (f === 172) { audio.seStop(); this.se('Z1 エネルギー波'); r.ep = 206; r.ef = 0; r.x = -360; r.y = -96; }
      else if (f <= 210) { r.ep = 206; r.x = 360; r.y = shot; }
      else if (f === 211) r.fxOff();
      else if (f === 241) this.cbOut(st);
      else if (f >= 262 && f <= 288) r.ep = 207;
    });
    return yield* this.cbEnd(st, era() ? 'zd41' : 'beam'); // damage 41 (Z1's 174: 23)
  },

  * ancbSuperRevenger() { // 2255 (バーダック)スーパーファイナルリベンジャー: he vanishes, the rush round the enemy, the close-up
    if (!this.p) return yield* this.galickGun();
    const st = this.agStage(), A = this.A, G = this.G, e = era();
    const pa = (n) => this.pose(A, n), pg = (n) => this.pose(G, n, false);
    const closeUp = (r) => r.U.push(at(CANNON_SS[v(175) === 0 ? 0 : 1], 0, 26, 274, 228, 180, 64));
    const after = (r) => { const x = A.x + (e === 0 ? 20 : e === 1 ? 4 : 16); r.U.push((c) => spark(c, 0, 48, 64, 64, x, 144)); };
    yield* this.cbRun(st, 639, (f, r) => {
      if (f === 0) { this.se('Z3 変身'); r.ot = 1; pa(4); }
      else if (f <= 80) r.back201(232, 86);
      else if (f <= 99) { // he vanishes at high speed
        if (f === 81) { audio.seStop(); this.se('Z1 高速移動'); A.y = -200; }
        if (f % 4 === 0) after(r);
      } else if (f === 100) { A.y = -200; G.x = CENTER_ENEX; G.y = STD_Y; r.ot = 1; A.x -= 16; }
      else if (f <= 119) { if (f % 4 === 0) after(r); }
      else if (f <= 124) A.y = STD_Y;
      else if (f <= 130) { // the first blow
        pg(16); if (f === 125) this.se('Z1 強打'); pa(12);
        if (f >= 126 && f <= 127) G.x += 8; else if (f >= 128 && f <= 129) G.x -= 8;
      } else if (f <= 190) { // the enemy knocked up and down
        const k = f - 131;
        if (k >= 1 && k <= 8) { pa(12); G.y -= 8; }
        else if (k >= 9 && k <= 12) { if (k === 9) this.se('ZG 打撃4'); if (k === 11) pa(13); pg(17); G.y += 16; G.x -= 30; }
        else if (k >= 23 && k <= 30) { pa(13); pg(16); G.y -= 8; }
        else if (k >= 31 && k <= 34) { if (k === 31) this.se('ZG 打撃4'); if (k === 33) pa(12); pg(17); G.y += 12; G.x += 30; }
        else if (k >= 35) {
          pg(17); G.x += 20; G.y += 2;
          if (k >= 46) { A.x += 30; A.y += 2; }
          if (k === 46) { pa(3); this.se('Z1 飛ぶ'); }
        }
      } else if (f === 191) { A.y = STD_Y; G.y = STD_Y; G.x = -100; A.x = -300; }
      else if (f <= 235) { // he chases it across from the left, the kick down
        const k = f - 192;
        if (k === 0) this.se('Z1 飛ぶ');
        if (k >= 1 && k <= 17) { G.x += 20; A.x += 30; if (k === 13) pa(8); }
        else if (k >= 18 && k <= 21) { pa(8); if (k === 18) this.se('ZG 打撃5'); G.x += 30; }
        else if (k >= 22 && k <= 25) { G.x -= 30; A.y -= 16; A.x += 12; pa(3); }
        else if (k >= 26 && k <= 27) { pa(9); A.y += 24; if (k === 27) this.se('Z1 強打'); }
        else if (k >= 28 && k <= 35) { A.y += 16; G.y += 16; }
        else if (k >= 36 && k <= 43) { A.y -= 16; G.y -= 18; G.x += 8; }
      } else if (f <= 289) { // the ground shakes, blows faster and faster, the enemy sent flying
        const k = f - 236;
        if (k === 0) { audio.playBgs('Z1 大地が揺れる'); pa(12); pg(16); }
        else if (k <= 10) { pa(13); pg(16); G.x -= 8; }
        else if (k <= 20) { pa(12); G.x += 8; }
        else if (k <= 25) { pa(13); G.x -= 16; }
        else if (k <= 30) { pa(12); G.x += 16; }
        else if (k <= 33) { pa(13); G.x -= 32; }
        else if (k <= 36) { pa(12); G.x += 32; }
        else if (k <= 38) { pa(13); G.x -= 48; }
        else if (k <= 40) { pa(12); G.x += 48; }
        else if (k === 41) { pa(13); G.x -= 96; }
        else if (k === 42) { pa(2); pg(17); G.x += 96; audio.stopBgs(); this.se('Z1 吹っ飛ぶ'); }
        else G.x += 48;
      } else if (f <= 349) { // it flies back in from the left, he meets it with the last blow
        const k = f - 291;
        if (k === 0) { A.y = STD_Y; G.y = STD_Y; G.x = -100; A.x = 680; pg(16); }
        else if (k >= 1 && k <= 10) G.x += 32;
        else if (k >= 11 && k <= 18) { G.x += 32; A.x -= 24; pa(11); if (k === 18) this.se('Z1 強打'); }
        else if (k >= 19 && k <= 29) {
          G.x -= 32; pg(17);
          if (k >= 25) { pa(14); A.x -= 72; A.y -= 16; if (k === 25) this.se('Z1 高速移動'); }
        } else if (k === 30) { A.y = STD_Y; A.x = G.x - 40; pa(10); this.se('ZG 打撃2'); }
        else if (k >= 31) { G.x += 32; G.y -= 16; }
      } else if (f === 350) { // the close-up (variable 175: the scouter), the ball
        this.se('Z1 気を溜める3'); r.ot = 1; st.cut(false); A.x = -200;
        closeUp(r); r.x = 202; r.y = 236; r.ep = 235;
      } else if (f <= 410) { closeUp(r); r.x = 202; r.y = 236; r.ep = 235; }
      else if (f <= 470) { closeUp(r); if (f === 470) st.cut(true); r.x = 186; r.y = 220; r.ep = 289; }
      else if (f <= 520) { A.x = TEC_CENTER; r.x = 276; r.y = 140; pa(6); r.ep = 235; }
      else if (f === 521) { audio.seStop(); pa(2); r.x = -360; r.y = -96; }
      else if (f === 522) { audio.seStop(); this.se('Z1 エネルギー波'); r.ep = 206; r.ef = 0; r.x = -360; r.y = -96; }
      else if (f <= 560) { r.ep = 206; r.x = 360; r.y = e >= 2 ? 96 : 92; }
      else if (f === 561) r.fxOff();
      else if (f === 591) this.cbOut(st);
      else if (f >= 612 && f <= 638) r.ep = 207;
    });
    audio.stopBgs();
    return yield* this.cbEnd(st, 'zd44');
  },
});

// 爆発波 on the enemies after the first (@all_attack_count >= 2): no swoop-in and no 必殺技!, the ground already gone
// (as src/anime.js 拡散エネルギー波); a film started right after the last one ended belongs to the same attack
const BLAST = new Set([149, 161]);
let blastEnd = -1e9;
const baseRun = Duel.prototype.run;
Duel.prototype.run = function* run() {
  if (BLAST.has(this.skill) && this.p && this.constructor === Duel && performance.now() - blastEnd < 500) {
    this.back.y = BACK_Y + 79 * 4;
    const kind = yield* this.ancbBlastAgain();
    audio.seStop();
    if (!this.hit || kind === 'miss') yield* this.dodge();
    else yield* this.explode(17, 50); // 23
    audio.seStop();
    this.ending = true;
    for (let i = 0; i < 10; i++) { this.fade = (i + 1) / 10; yield; }
  } else yield* baseRun.call(this);
  if (BLAST.has(this.skill)) blastEnd = performance.now();
};

// ---------- ?dev=ancb…: the films in a battle (the moves added to the member; level 50) ----------
//   ancbz3     巴達克 (147 148 149 151 152 158) vs 19號・20號 (Z3: the strips, their cut-ins; 149 hits both)
//   ancbz3off  the same with switch 504 off (1252 without the close-up)
//   ancbss     超巴達克 (147 148 149 151 152 155) vs 19號・20號        ancbssn  the same without the scouter (variable 175 = 1)
//   ancbz2     巴達克 in Z2 (variable 40 = 1) vs 羅梅・克蘭博
//   ancbz1     the Z1 Bardock part's moves (159 160 161 163; variable 40 = 0) vs 甜菜人・球根人
// The films can also be played from the console: __game.scene.play(m, f, true, skill, dmg, f) (src/battle.js play)
registerZ3('ancb', {
  dev(game, step) {
    const cfg = { ancbz3: [2, [123, 122]], ancbz3off: [2, [123, 122]], ancbss: [2, [123, 122]], ancbssn: [2, [123, 122]],
      ancbz2: [1, [31, 32]], ancbz1: [0, [1, 2]] }[step];
    if (!cfg) return false;
    const s = game.state = game.newState();
    s.var[40] = cfg[0];
    s.var[43] = cfg[0] === 2 ? 60 : cfg[0] === 1 ? 41 : 101;
    s.flags.z3 = 'done';
    s.sw[504] = step !== 'ancbz3off';
    if (step === 'ancbssn') s.var[175] = 1;
    party(game, [16]);
    if (step === 'ancbss' || step === 'ancbssn') superSaiyan(game.world, s, 7, true);
    const add = cfg[0] === 0 ? [159, 160, 161, 163] : s.party[0].id === 32 ? [147, 148, 149, 151, 152, 155] : [147, 148, 149, 151, 152, 158];
    for (const m of s.party) {
      m.level = 50; m.exp = game.world.actors[m.id].exp[50]; applyLevel(game.world, m); heal(m);
      m.skills = m.skills.filter((id) => !add.includes(id)).concat(add);
    }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle(cfg[1], true, { loseOk: true }), 300);
    return true;
  },
});

// sounds these films play, for tools/copy_assets.py (and the BGS of 2255)
export const CB_SOUNDS = ['Z1 怪光線', 'Z3 変身', 'Z2 気を溜める', 'Z1 エネルギー波2', 'Z1 気を溜める3', 'Z1 エネルギー波', 'Z1 ザー', 'Z1 飛ぶ',
  'Z1 強打', 'Z1 打撃', 'ZG 打撃4', 'Z1 大猿', 'Z1 高速移動', 'ZG 打撃5', 'Z1 吹っ飛ぶ', 'ZG 打撃2', 'ZG 光線系ヒット2', 'DB3 大爆発',
  'Z3 光線系ヒット', 'Z3 跳ね返し', 'Z1 必殺技'];
export const CB_BGS = ['Z1 大地が揺れる'];

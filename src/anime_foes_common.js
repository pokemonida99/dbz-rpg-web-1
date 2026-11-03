// The enemies' move films (docs/anim-e-plan.md): the stage every E group's films run on, and the films the original
// shares between all the enemies. An enemy's move goes through the move switch of its own part (all.rb 54627: enemy
// id < 31 → $btl_progress 0 Z1, < 101 → 1 Z2, otherwise 2 Z3) with attack pattern = skill id + 10 (140149); in the Z3
// switch many enemies' moves share one pattern (all.rb 65679-65908), told apart only by a table of where each enemy's
// hand is:
//   2431 (敵汎用)エネルギー波 (124409) feWave      2494 連続エネルギー波 (124881) feWaves (on everyone)
//   2498 爆発波 (125074) feBlast (on everyone)     2499 強力エネルギー波 (125171) feBigWave   2493 フリーザカッター (124742) feCutter
//   2495 デスボール (125014) feDeathBall
// 2431 is in the Z2 switch too (59478: the ターレス / スラッグ crews' 635 … 670, enemies 65-76): there with the Z2_
// pictures, strips and cut-ins ($btl_top_file_name follows $btl_progress).
// The four E groups each register their skills (feRegister) and copy this file unchanged; their own films use feStage.
//
// FeStage keeps the original's instance variables (@battle_anime_frame, @effect_anime_*, @ray_anime_*, @back_anime_*,
// @ax …, @tec_output_back*, @chr_cutin*) so a film is the Ruby case statement written out frame by frame: each frame
// the film sets what it sets, pushes what it blits straight away (behind the fighters), and z.out() moves the fighters
// the way output_battle_anime does for an enemy (@ax flips sign every frame, all.rb 140037), draws
// @effect_anime_pattern in front and counts its frames on. The strips (output_back, 67772: an enemy's scroll the other
// way) are drawn here; the cut-in is src/anime_goku_gohan.js's (its render draws this.agSt: the enemy's 敵カットイン
// row, after set_chr_display_out the member's).
import { audio, img, rand } from './core.js?v=20261103-0825';
import { Duel, addMoves, moveFilm, draw, spark, STD_Y, CENTER_CHAX, CENTER_ENEX, RAY_SPEED, BACK_Y } from './anime.js?v=20261103-0825';
import { Battle } from './battle.js?v=20261103-0825';

const pic = (n) => `Graphics/Pictures/${n}`;
const STD_ENEX = 602;
// output_back's strips for $btl_progress 2 (no 0 across, 1 down the sides, 2 / 3 the corners, 4 the ZG super kamehameha's
// side panels, 7 イレイサーショック)
const BAR = {
  top: pic('Z3_戦闘_必殺技_背景_上.png'), low: pic('Z3_戦闘_必殺技_背景_下(加工).PNG'),
  topRed: pic('Z3_戦闘_必殺技_背景_上(赤).png'), lowRed: pic('Z3_戦闘_必殺技_背景_下(加工)(赤).PNG'),
  left: pic('Z3_戦闘_必殺技_背景_左(加工).PNG'), right: pic('Z3_戦闘_必殺技_背景_右(加工).PNG'),
  tl: pic('Z3_戦闘_必殺技_背景_左上.PNG'), br: pic('Z3_戦闘_必殺技_背景_右下.PNG'), tr: pic('Z3_戦闘_必殺技_背景_右上.PNG'),
  bl: pic('Z3_戦闘_必殺技_背景_左下.PNG'), tlRed: pic('Z3_戦闘_必殺技_背景_左上(赤).PNG'), brRed: pic('Z3_戦闘_必殺技_背景_右下(赤).PNG'),
  trRed: pic('Z3_戦闘_必殺技_背景_右上(赤).PNG'), blRed: pic('Z3_戦闘_必殺技_背景_左下(赤).PNG'),
  erase: pic('ZG_戦闘_必殺技_背景(赤)_イレイサーショック上.PNG'),
  sideL: pic('ZG_戦闘_必殺技_背景_超カメハメ波_左.PNG'), sideR: pic('ZG_戦闘_必殺技_背景_超カメハメ波_右.PNG'), // no 4: 3 frames of 176×320
  z2top: pic('Z2_戦闘_必殺技_背景_上.png'), z2low: pic('Z2_戦闘_必殺技_背景_下.png'),
};
// the pictures of the shared effects (Z3_: $btl_top_file_name for an enemy of the Z3 switch), by @ray_color
const SMALL = { 0: pic('Z3_戦闘_必殺技_エネルギー波_小.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_小_敵_緑.PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG'), 4: pic('Z3_戦闘_必殺技_エネルギー波_小_敵_赤.PNG') }; // 227 / 228: 400×48 ×2
const SMALL2 = { 0: pic('Z2_戦闘_必殺技_エネルギー波_小.PNG'), 1: pic('Z2_戦闘_必殺技_エネルギー波_小_敵_緑.PNG'),
  3: pic('Z2_戦闘_必殺技_エネルギー波_小_敵_青.PNG'), 4: pic('Z2_戦闘_必殺技_エネルギー波_小_敵_赤.PNG') }; // (Z2 switch)
const small = (z) => { const t = z.era === 1 ? SMALL2 : SMALL; return t[z.color] || t[0]; };
const SOKI = { 0: pic('Z3_戦闘_必殺技_繰気弾.PNG'), 3: pic('Z3_戦闘_必殺技_繰気弾(青).PNG'), 4: pic('Z3_戦闘_必殺技_繰気弾(桃).PNG') }; // effects 10 / 271
const MID = { 0: pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG'), 4: pic('Z3_戦闘_必殺技_エネルギー波_中_敵_赤.PNG') }; // 233: 400×80 ×2
const MID_HIT = { ...MID, 1: pic('Z3_戦闘_必殺技_エネルギー波_中_敵_緑.PNG') }; // 234
const BIG = { 0: pic('Z3_戦闘_必殺技_エネルギー波_大.png'), 1: pic('Z3_戦闘_必殺技_エネルギー波_大(緑).png'),
  3: pic('Z3_戦闘_必殺技_エネルギー波_大_敵_青.PNG'), 4: pic('Z3_戦闘_必殺技_エネルギー波_大_敵_赤.PNG') }; // 239 / 240
const BALL = { 0: pic('Z3_戦闘_必殺技_エネルギー弾.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー弾(緑).PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー弾(青).PNG') }; // 201 / 202: 128×128 frames
const AURA = { 0: pic('Z3_戦闘_必殺技_気を溜める.png'), 1: pic('Z3_戦闘_必殺技_気を溜める(緑).png'),
  3: pic('Z3_戦闘_必殺技_気を溜める(青).png') }; // back 201: 2 frames of 136×142
const SHOCK = pic('Z3_戦闘_必殺技_背景_衝撃波系.png'); // back 1
const DEMON = pic('Z3_戦闘_必殺技_背景_魔族系(縦).png'); // back 2: 3 frames of 640×356 (every 480)
const KIEN = pic('Z3_戦闘_必殺技_気円斬.png'); // 126×30 rows (2493 / effect 260)
const DOT = pic('Z3_戦闘_必殺技_超元気玉(元気).png'); // the ki gathering in: 8×10
const BOOM = { 101: [pic('戦闘アニメ_爆発1.PNG'), 96, 96, 230, 120], 102: [pic('戦闘アニメ_爆発3.PNG'), 112, 120, 230, 120],
  103: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 204, 120], 104: [pic('戦闘アニメ_爆発5.PNG'), 158, 160, 188, 104],
  105: [pic('戦闘アニメ_爆発6.PNG'), 256, 256, 148, 46], 106: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 200, 88] }; // effects 101-106, an enemy attacking
// the cut-ins src/anime_goku_gohan.js draws (loaded with the film: the enemy's row, then the member's)
const CUTS = [pic('Z3_敵カットイン.PNG'), pic('Z2_敵カットイン.PNG'), pic('Z3_味方カットイン.PNG'), pic('Z2_味方カットイン.PNG'), pic('ZG_味方カットイン.PNG')];
export const FE_IMAGES = [...CUTS, ...Object.values(BAR), ...Object.values(SMALL), ...Object.values(SMALL2), ...Object.values(SOKI), ...Object.values(MID_HIT), MID[4], ...Object.values(BIG),
  ...Object.values(BALL), ...Object.values(AURA), SHOCK, DEMON, KIEN, DOT, ...Object.values(BOOM).map((b) => b[0])];

// the enemy whose move this is (the battle's duel; a film inside some other scene: the foe with these sheets)
export function foeId(d) {
  const sc = globalThis.__game && globalThis.__game.scene;
  const f = (sc && sc.duel && sc.duel.f) || (sc && sc.foes && sc.foes.find((x) => x.sprite === d.R.sheets.special));
  return f ? Number(f.id) : 0;
}
const v = (n) => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[n]) || 0; };

// a blt clipped to the picture the way RGSS clips it (a source rect partly or wholly outside draws only what is inside)
export function blt(c, sheet, sx, sy, w, h, x, y) {
  const e = img(sheet);
  if (!e.ok) return;
  if (sx < 0) { x -= sx; w += sx; sx = 0; }
  if (sy < 0) { y -= sy; h += sy; sy = 0; }
  w = Math.min(w, e.im.width - sx); h = Math.min(h, e.im.height - sy);
  if (w > 0 && h > 0) c.drawImage(e.im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
}
// the two copies of a scrolling strip (output_back): offset `tb` within a strip `w` long
function tiles(tb, w) {
  if (tb <= w / 2 && tb >= -w / 2) return [tb - w / 2, tb + w / 2];
  if (tb >= w / 2) return [tb - w / 2, tb - (w + w / 2)];
  return [tb + w / 2, tb + w + w / 2];
}

// ---------- the stage ----------
export class FeStage {
  constructor(d) {
    this.d = d;
    this.id = foeId(d);
    this.era = this.id >= 31 && this.id < 101 ? 1 : 2; // $btl_progress (an enemy of the Z2 switch: Z2_ pictures)
    this.f = 0; // @battle_anime_frame of the move's own pattern
    this.efp = 0; this.eft = 0; this.eff = 0; this.rt = 0; this.rf = 0; this.mirrorFx = null; // @effect_anime_* / @ray_anime_*
    this.bt = 0; this.bf = 0; // @back_anime_type / frame
    this.color = 0; this.spd = false; // @ray_color, @ray_spd_up_flag
    this.ax = 0; this.ay = 0; this.gx = 0; this.gy = 0; this.flipY = false; // (@output_anime_type_y: @ay flips too)
    this.tec = false; this.tecNo = 0; this.small = (d.A.sheets.size || 96) > 96 || (d.G.sheets.size || 96) > 96; this.red = false;
    this.tb = 0; this.corner = 0; // @tec_back, @tec_back_anime_type
    this.cut = false; this.cutFlag = false; this.mirror = false; // @chr_cutin, @chr_cutin_flag, @chr_cutin_mirror_flag
    this.U = []; this.O = [];
    this.install();
    // src/anime_goku_gohan.js render → cutIn, after the frame's film code as output_cutin is: @chr_cutin goes off with
    // @chr_cutin_flag, no member's cut-in while variable 40 is 0; cutIn's mirror is the enemy's row; the member's
    // row is on the story's sheet (set_battle_cutin_name: $top_file_name, variable 40)
    const z = this;
    d.agSt = { get era() { return z.mirror ? Math.min(2, v(40)) : z.era; },
      get cutFrom() { if (!z.cutFlag) z.cut = false; return z.cut && !(z.mirror && v(40) === 0) ? 0 : Infinity; },
      get mirror() { return !z.mirror; } };
    const step = d.step.bind(d);
    d.step = () => { if (!d.done) this.tick(); step(); };
  }
  install() {
    this.d.behind((c) => { this.bars(c); for (const f of this.U) f(c); });
    this.d.effect((c) => { for (const f of this.O) f(c); });
  }

  // the start of a frame: the film draws afresh; output_back draws the strips and moves them on
  tick() {
    this.U = []; this.O = [];
    this.tbAt = this.tb; this.cornerAt = this.corner; // (output_back draws, then moves on)
    if (this.tec) this.scroll();
  }
  scroll() {
    const no = this.tecNo;
    if (no === 2 || no === 3 || no === 4) { this.corner = this.corner === 2 ? 0 : this.corner + 1; return; } // (@tec_back_anime_type)
    const [w, d] = this.era === 1 ? [640, 12] : no === 1 ? [360, -16] : no === 7 ? [672, 8] : [648, 8]; // (an enemy's strips go right, the sides down)
    this.tb += d;
    if (this.tb >= w) this.tb -= w; else if (this.tb <= -w) this.tb += w;
  }
  bars(c) {
    if (!this.tec) return;
    const no = this.tecNo, tb = this.tbAt || 0;
    if (this.era === 1) { // Z2: 640×64 strips, 12 a frame
      for (const x of tiles(tb, 640)) { blt(c, BAR.z2top, 0, 0, 640, 64, x, 0); blt(c, BAR.z2low, 0, 0, 640, 64, x, 292); }
    } else if (no === 0) {
      const top = this.small ? 64 : 110, lh = this.small ? 60 : 114, ly = 292 - (this.small ? -4 : 50);
      for (const x of tiles(tb, 648)) { blt(c, this.red ? BAR.topRed : BAR.top, 0, 0, 648, top, x, 0); blt(c, this.red ? BAR.lowRed : BAR.low, 0, 0, 648, lh, x, ly); }
    } else if (no === 1) {
      for (const y of tiles(tb, 360)) { blt(c, BAR.left, 0, 0, 94, 360, 0, y); blt(c, BAR.right, 0, 0, 92, 360, 640 - 94, y); }
    } else if (no === 2 || no === 3) {
      const k = this.cornerAt || 0, r = this.red ? 'Red' : '';
      const [a, b] = no === 2 ? [BAR['tl' + r], BAR['br' + r]] : [BAR['tr' + r], BAR['bl' + r]];
      blt(c, a, k * 238, 0, 238, 238, no === 2 ? 0 : 640 - 238, 0);
      blt(c, b, k * 222, 0, 222, 222, no === 2 ? 640 - 222 : 0, 480 - 222 - 124);
    } else if (no === 4) {
      const k = this.cornerAt || 0;
      blt(c, BAR.sideL, k * 176, 0, 176, 320, 0, 18); blt(c, BAR.sideR, k * 176, 0, 176, 320, 640 - 176, 18);
    } else if (no === 7) {
      for (const x of tiles(tb, 672)) { blt(c, BAR.erase, 0, 0, 672, 110, x, 4); blt(c, BAR.erase, 0, 0, 672, 110, x, 258); }
    }
  }

  // what the film blits straight away (behind the fighters) / in front of them this frame
  back(sheet, sx, sy, w, h, x, y) { this.U.push((c) => blt(c, sheet, sx, sy, w, h, x, y)); }
  front(sheet, sx, sy, w, h, x, y) { this.O.push((c) => blt(c, sheet, sx, sy, w, h, x, y)); }
  fill(color, h = 356, list = this.U) { list.push((c) => { c.fillStyle = color; c.fillRect(0, 0, 640, h); }); }
  under(f) { this.U.push(f); }
  over(f) { this.O.push(f); }

  // battle_anime_change 0,n (the attacker, @output_anime_type 1: its 必殺技 sheet) / 1,n (the defender)
  pose(n, sp = true) { this.d.pose(this.d.A, n, sp); }
  gpose(n) { this.d.pose(this.d.G, n, false); }
  se(name) { audio.se(name, 80); }
  seStop() { audio.seStop(); }
  // set_chr_display_out: the enemy leaves, the member stands in the middle (and the member's cut-in from now on)
  displayOut() {
    const d = this.d;
    d.A.y = -200;
    d.G.x = CENTER_CHAX; d.G.y = STD_Y;
    if (this.cutFlag) this.mirror = true;
  }
  fxReset() { this.efp = 0; this.eff = 0; this.eft = 0; }
  // anime_pattern_fromat: the counters back to 0 (the bars and the cut-in stay)
  format() { this.fxReset(); this.bt = 0; this.bf = 0; this.rt = 0; this.rf = 0; this.ax = this.ay = this.gx = this.gy = 0; this.d.A.sp = false; }

  // the end of a frame: output_battle_anime (an enemy: @ax flips, the member moves by @gx / @gy as they are), then the
  // effect pattern with this frame's ray_x / ray_y, then the frame shows
  * out(rx = 0, ry = 0) {
    const d = this.d;
    this.ax = -this.ax;
    if (this.flipY) this.ay = -this.ay;
    d.A.x += this.ax; d.A.y += this.ay; d.G.x += this.gx; d.G.y += this.gy;
    if (this.efp) {
      const e = EFFECTS[this.efp];
      if (e) e(this, rx, ry);
      this.rf++; this.eff++;
    }
    this.f++;
    yield;
  }

  // back_anime_pattern n (the counter: next picture every `every` calls, cycling through `last` + 1)
  bstep(every, last) {
    if (this.bf >= every && this.bt !== last) { this.bt++; this.bf = 0; } else if (this.bf >= every) { this.bt = 0; this.bf = 0; }
  }
  backPattern(n, x = 0, y = 0) {
    if (n === 1) { // 衝撃波系横 (a big member only gets the top and bottom 42)
      if ((this.d.G.sheets.size || 96) > 96) { this.back(SHOCK, 0, this.bt * 180, 640, 42, 0, 32); this.back(SHOCK, 0, 138 + this.bt * 180, 640, 42, 0, 266); } else this.back(SHOCK, 0, this.bt * 180, 640, 180, 0, 80);
      this.bstep(4, 2);
    } else if (n === 2) { // 必殺技発動時縦: the demon backdrop
      this.back(DEMON, 0, this.bt * 480, 640, 356, 0, 0);
      this.bstep(4, 2);
    } else if (n === 201) { // 気を溜める(Z3)
      this.back(AURA[this.color] || AURA[0], this.bt * 136, 0, 136, 142, x, y);
      this.bstep(16, 1);
    } else if (BACKS[n]) BACKS[n](this, x, y);
    this.bf++;
  }

  // the ki gathering in (@genkitama_kanri_*, e.g. all.rb 125471): eight dots each starting at random (1 in 7 a frame)
  // from its direction and flying to (cx, cy), faster after `spd` frames; none start in the last `max` frames before `end`
  gatherStart(cx, cy, max = 15, spd = 10) { this.gk = { cx, cy, max, spd, k: [0, 0, 0, 0, 0, 0, 0, 0] }; }
  gather(end) {
    const g = this.gk;
    if (!g || this.f >= end) return;
    GATHER_DIRS.forEach(([ix, iy], i) => {
      const k = g.k[i];
      if (k >= g.max) g.k[i] = 0;
      else if (k > 0) {
        const tx = ix * g.spd + ix * 2 * (g.max - g.spd - 1), ty = iy * g.spd + iy * 2 * (g.max - g.spd - 1);
        if (k <= g.spd) this.back(DOT, 0, 0, 8, 10, g.cx - tx + k * ix, g.cy + ty - k * iy);
        else this.back(DOT, 0, 0, 8, 10, g.cx - tx + g.spd * ix + (k - g.spd) * ix * 2, g.cy + ty - g.spd * iy - (k - g.spd) * iy * 2);
        g.k[i]++;
      } else if (end - this.f > g.max && rand(7) === 0) g.k[i] = 1;
    });
  }

  // ---------- the damage patterns, an enemy attacking (the strips and the cut-in stay on) ----------
  // 23 爆発系 / 41 ZD中 / 42 ZD大 / 43 Z2大 / 44 Z2特大: the explosion, the member blown away (frames 21-39); 22 衝撃波系;
  // 25 超能力 (shaken); 75 デッドゾーン (shaken upwards); 71 縦 (src/anime.js crushed). Returns what src/anime.js run()
  // still has to play: 'miss' (a dodge) or 'none'.
  * damage(n) {
    const d = this.d;
    this.U = []; this.O = []; this.format();
    if (!d.hit) return 'miss';
    if (n === 71) { yield* d.crushed(); return 'none'; }
    if (n === 25) { yield* d.tremble(false); return 'none'; }
    const BOOMS = { 23: [101, 'Z3 光線系ヒット', 50], 41: [102, 'ZG 光線系ヒット2', 60], 42: [103, 'ZG 光線系ヒット3', 60],
      43: [104, 'Z1 爆発1', 60], 44: [105, 'DB3 大爆発', 60], 75: [106, 'ZG 光線系ヒット3', 25], 22: [0, null, 60] };
    const [fx, sound, end] = BOOMS[n] || BOOMS[23];
    this.se(sound || (this.kyouda ? 'ZG 打撃4' : 'Z3 跳ね返し'));
    d.showHit();
    this.gpose(17);
    let et = 0, ef = 0;
    for (let f = 0; f < end; f++) {
      this.U = []; this.O = [];
      if (n === 22) d.G.x += f <= 19 ? -20 : 0;
      else if (n === 75) {
        if (f >= 1 && f <= 23) { d.G.y += -16; d.G.x += f % 2 === 0 ? 6 : -6; }
      } else if (f >= 21 && f <= 39) d.G.x += -20;
      if (fx && f < (n === 75 ? 24 : 40)) { // effects 101-106: the next of the frames every 10 (the third is off the picture)
        const [sheet, w, h, x, y] = BOOM[fx], k = et;
        if (ef >= 10) { et++; ef = 0; }
        this.front(sheet, k * w, 0, w, h, x, y);
        ef++;
      }
      yield;
    }
    return 'none';
  }
}
const GATHER_DIRS = [[0, -2], [2, -2], [2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2]];

// effect_pattern n for an enemy attacking (z = the stage, rx / ry = the frame's ray_x / ray_y); more below, and a file
// can add its own
export const EFFECTS = {
  201: (z, rx, ry) => { // エネルギー弾系(発動)
    z.eft = 2;
    z.front(BALL[z.color] || BALL[0], z.eft * 128, 0, 128, 128, rx - z.eff * (z.spd ? RAY_SPEED + 6 : RAY_SPEED), ry);
  },
  202: (z) => { z.eft = 2; z.front(BALL[z.color] || BALL[0], z.eft * 128, 0, 128, 128, 640 - z.eff * RAY_SPEED, 96); }, // (ヒット)
  227: (z, rx, ry) => { const n = z.eff * RAY_SPEED; z.front(small(z), 352 - n, 0, 48 + n, 48, rx - 92 - n, ry - 10); }, // エネルギー波_小系(発動)敵
  228: (z) => z.front(small(z), 0, 48, 400, 48, 640 - z.eff * RAY_SPEED + 64, 148), // (ヒット敵)
  10: (z, rx, ry) => { // 繰気弾: the ball grows (the next frame at 51, 71, 91, and 111 from Z3 on)
    z.front(SOKI[z.color] || SOKI[0], z.eft * 128, 0, 128, 128, rx, ry);
    if (z.eff === 51 || z.eff === 71 || z.eff === 91 || (z.eff === 111 && z.era >= 2)) z.eft++;
  },
  271: (z) => z.front(z.color === 1 ? BALL[1] : SOKI[z.color] || SOKI[0], z.eft * 128, 0, 128, 128, 640 - z.eff * RAY_SPEED, 112), // デスボール系(ヒット)
  233: (z, rx, ry) => { const n = z.eff * RAY_SPEED; z.front(MID[z.color] || MID[0], 346 - n, 0, 54 + n, 80, rx - n, ry); }, // 口から怪光線(発動)
  234: (z, rx, ry) => z.front(MID_HIT[z.color] || MID_HIT[0], 0, 80, 400, 80, 640 - z.eff * RAY_SPEED, ry), // (ヒット)
  239: (z, rx, ry) => { // エネルギーは大(発動)
    const n = z.eff * RAY_SPEED, h = z.color === 0 || z.color === 1 ? 92 : 122;
    z.front(BIG[z.color] || BIG[0], 256 - n, 0, 144 + n, h, rx - n, ry);
  },
  240: (z, rx, ry) => { const h = z.color === 0 || z.color === 1 ? 92 : 122; z.front(BIG[z.color] || BIG[0], 0, h, 400, h, 640 - z.eff * RAY_SPEED, ry); }, // (ヒット)
  260: (z) => z.front(KIEN, 0, 30 * 4, 192, 30, 640 - z.eff * RAY_SPEED, 160), // Z3気円斬系(ヒット)
};
// back_anime_pattern n beyond 1 / 2 / 201 (a file adds its own: (z, x, y) => …, counting with z.bstep)
export const BACKS = {};

// ---------- more of effect_pattern / back_anime_pattern, an enemy attacking (the E groups' own films use them) ----------
const SPARK = pic('戦闘アニメ.PNG'); // hit sparks (y 0-48), the after-image (0,48 64×64)
const BALL2 = { 0: pic('Z3_戦闘_必殺技_エネルギー弾2.PNG'), 3: pic('Z3_戦闘_必殺技_エネルギー弾2(青).PNG') }; // 203 / 204: 96×64 ×2
const BALL4 = { 0: pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー弾4(緑).PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'), 4: pic('Z3_戦闘_必殺技_エネルギー弾4(桃).PNG') }; // 206 / 207 / 293 / 266: 190×126 ×2
const BLINK_S = { 0: pic('Z3_必殺技_超カメハメ波(球点滅小).png'), 1: pic('Z3_必殺技_超カメハメ波(球点滅小)(緑).png'),
  3: pic('Z3_必殺技_超カメハメ波(球点滅小)(青).png'), 4: pic('Z3_必殺技_超カメハメ波(球点滅小)(赤).png') }; // 237: 5 frames of 16
const BLINK_M = { 0: pic('Z3_必殺技_超カメハメ波(球点滅).png'), 1: pic('Z3_必殺技_超カメハメ波(球点滅)(緑).png'),
  3: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'), 4: pic('Z3_必殺技_超カメハメ波(球点滅)(赤).png') }; // 235: 5 frames of 32
const GENKI = { 0: pic('Z3_必殺技_元気玉(球点滅中).PNG'), 1: pic('Z3_必殺技_元気玉(球点滅中)(緑).PNG'),
  3: pic('Z3_必殺技_元気玉(球点滅中)(青).PNG') }; // 252 / 261 / 262: 4 frames of 64
const SOKI_BLINK = pic('Z3_必殺技_繰気弾(球点滅中).PNG'); // 261 / 262 at the other colours: 6 frames of 64
const HALF = { 0: pic('Z3_戦闘_必殺技_エネルギー波_半円.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_半円(緑).PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'), 9: pic('Z3_戦闘_必殺技_エネルギー波_半円(紫).PNG') }; // 256 / 265: 700×128 ×2
const HUGE = { 0: pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_特大_緑.PNG'),
  3: pic('Z3_戦闘_必殺技_エネルギー波_特大_青.PNG') }; // 48: 400×192 ×2
const SCATTER = { 0: pic('Z3_戦闘_必殺技_拡散エネルギー波.png'), 3: pic('Z3_戦闘_必殺技_拡散エネルギー波_青_敵.png'),
  4: pic('Z3_戦闘_必殺技_拡散エネルギー波_赤_敵.png') }; // 231 / 232: 400×112 ×2
const BIGBANG = { 0: pic('Z3_必殺技_ビッグバンアタック発動_反転.PNG'), 1: pic('Z3_必殺技_ビッグバンアタック発動(緑)_反転.PNG'),
  3: pic('Z3_必殺技_ビッグバンアタック発動(青)_反転.PNG') }; // 264 (an enemy): 2 frames of 302×200
const SWORD = pic('Z3_戦闘_必殺技_剣攻撃(左右反転).PNG'); // 267 (an enemy): frames of 160×96
const LINES = [pic('Z3_必殺技_超カメハメ波(バック上)_反転.png'), pic('Z3_必殺技_超カメハメ波(バック下)_反転.png')]; // back 106 (an enemy: mirrored)
const KIKOU = pic('Z3_戦闘_必殺技_背景_気功砲系.png'); // back 9: 3 frames of 384×356 (every 360)
const BLACK_HOLE = pic('Z3_戦闘_必殺技_気を溜める10.PNG'); // back 13: 3 frames of 640×356 (every 378)
FE_IMAGES.push(SPARK, ...Object.values(BALL2), ...Object.values(BALL4), ...Object.values(BLINK_S), ...Object.values(BLINK_M),
  ...Object.values(GENKI), SOKI_BLINK, ...Object.values(HALF), ...Object.values(HUGE), ...Object.values(SCATTER), ...Object.values(BIGBANG),
  SWORD, ...LINES, KIKOU, BLACK_HOLE);
const by = (t, z, d = 0) => t[z.color] || t[d];
// @ray_anime_type: the picture with the counter as it is, then the next every `every` frames, back to 0 after `last`
function ray(z, every, last) {
  const k = z.rt;
  if (z.rf >= every && z.rt !== last) { z.rt++; z.rf = 0; } else if (z.rf >= every) { z.rt = 0; z.rf = 0; }
  return k;
}
Object.assign(EFFECTS, {
  48: (z) => z.front(by(HUGE, z, 3), 0, 192, 400, 192, 640 - z.eff * RAY_SPEED, 76), // かめはめ波系(特大)横
  121: (z) => { // 攻撃ヒット: the spark at the fist, the small flash on the member (frames 0-10)
    const A = z.d.A, G = z.d.G;
    if (z.eff <= 4) { z.front(SPARK, 0, 16, 32, 32, A.x - 32, A.y + 32); z.front(SPARK, 32, 0, 32, 16, G.x + 64, G.y); } else if (z.eff <= 10) { z.front(SPARK, 32, 16, 32, 32, A.x - 32, G.y + 32); z.front(SPARK, 32, 0, 32, 16, G.x + 64, G.y); }
  },
  123: (z, rx, ry) => z.front(SPARK, z.eff <= 4 ? 0 : 32, 16, 32, 32, rx, ry), // キャラぶつかる自由位置
  203: (z, rx, ry) => z.front(by(BALL2, z), 0, 64, 96, 64, rx - z.eff * RAY_SPEED, ry), // かめはめ波系(発動)
  204: (z) => z.front(by(BALL2, z), 0, 64, 96, 64, 640 - z.eff * RAY_SPEED, 144), // (ヒット)
  206: (z, rx, ry) => z.front(by(BALL4, z), 0, 126, 190, 126, rx - z.eff * RAY_SPEED, ry), // 界王拳かめはめ波系(発動)
  207: (z) => z.front(by(BALL4, z), 0, 126, 190, 126, 640 - z.eff * RAY_SPEED, 96), // (ヒット)
  225: (z, rx, ry) => { const n = z.eff * RAY_SPEED; z.front(z.color === 3 ? SMALL[3] : SMALL[0], 352 - n, 0, 48 + n, 48, rx - 92 - n, ry - 10); }, // エネルギー波_小系(発動)
  226: (z) => z.front(z.color === 3 ? SMALL[3] : SMALL[0], 0, 48, 400, 48, 640 - z.eff * RAY_SPEED, 148), // (ヒット)
  231: (z, rx, ry) => { const n = z.eff * RAY_SPEED; z.front(by(SCATTER, z), 346 - n, 112, 54 + n, 112, rx - n, ry); }, // 拡散エネルギー波系(発動)
  232: (z) => z.front(by(SCATTER, z), 0, 0, 400, 112, 640 - z.eff * RAY_SPEED, 122), // (ヒット)
  235: (z, rx, ry) => { const k = ray(z, 4, 4); z.front(by(BLINK_M, z), 32 * k, 0, 32, 32, rx, ry); }, // スーパーカメハメ波ため
  237: (z, rx, ry) => { const k = ray(z, 4, 4); z.front(by(BLINK_S, z), 16 * k, 0, 16, 16, rx, ry); }, // ファイナルリベンジャーため(小)
  252: (z, rx, ry) => { const k = ray(z, 4, 3); z.front(by(GENKI, z), 64 * k, 0, 64, 64, rx, ry); }, // 元気玉ため
  256: (z, rx, ry) => { const n = z.eff * RAY_SPEED; z.front(by(HALF, z), 700 - n, 128, n, 128, rx - n, ry); }, // Z3エネルギー波半円発動
  261: (z, rx, ry) => z.front(z.color === 3 ? GENKI[3] : SOKI_BLINK, 64 * z.rt, 0, 64, 64, rx, ry), // そうきだんため
  262: (z, rx, ry) => { // そうきだん(ヒット)
    const [sheet, k] = z.color === 3 || z.color === 1 ? [GENKI[z.color], 3] : [SOKI_BLINK, 5];
    z.front(sheet, 64 * k, 0, 64, 64, 640 - z.eff * RAY_SPEED, ry);
  },
  264: (z, rx, ry) => { const k = ray(z, 4, 1); z.front(by(BIGBANG, z), 302 * k, 0, 302, 200, rx, ry); }, // ビッグバンアタック
  265: (z, rx, ry) => z.front(by(HALF, z), 0, 0, 700, 128, 640 - z.eff * RAY_SPEED, ry), // Z3エネルギー波半円ヒット
  266: (z, rx, ry) => z.front(by(BALL4, z), 0, 126, 190, 126, 640 - z.eff * RAY_SPEED, ry), // Z3エネルギー弾(ヒット)
  267: (z, rx, ry) => { const k = ray(z, 2, Infinity); z.front(SWORD, 160 * k, 0, 160, 96, rx, ry); }, // Z3_戦闘_必殺技_剣攻撃
  293: (z, rx, ry) => z.front(by(BALL4, z), 0, 126, 190, 126, rx - z.eff * RAY_SPEED, ry), // Z3エネルギー弾発動
});
Object.assign(BACKS, {
  9: (z) => { // 四身の拳気功砲系縦 (a big member: the two edges only)
    if ((z.d.G.sheets.size || 96) > 96) { z.back(KIKOU, 0, z.bt * 360, 142, 356, -20, 0); z.back(KIKOU, 242, z.bt * 360, 142, 356, -20 + 142 + 200, 0); } else z.back(KIKOU, 0, z.bt * 360, 384, 356, 90, 0);
    z.bstep(4, 2);
  },
  13: (z) => { z.back(BLACK_HOLE, 0, z.bt * 378, 640, 356, 0, 0); z.bstep(4, 2); }, // 気を溜める(ブラックホール波) Z3
  106: (z) => { // 背景スーパーカメハメ波: the mirrored lines on the right
    z.back(LINES[0], 0, 128 * z.bt, 384, 128, 640 - 384, 0);
    z.back(LINES[1], 0, 64 * z.bt, 192, 64, 640 - 192, 292);
    z.bstep(4, 2);
  },
});

// ---------- registering, 31 / 32, the further targets of a move on everyone ----------
const FILMS = new Set(); // the films run on this stage
const CFG = {}; // film → { cut: @chr_cutin_flag, small: @tec_back_small, no: @tec_output_back_no, again: (z) => … for @all_attack_count >= 2, pics }
const PREV = {}; // skill → the film it had before (for a party member or an enemy of an earlier part using the same skill)
// @all_attack_count: the films of one enemy action are counted (a move on everyone plays one film per member, and only
// the first has 31 / 32 and the charge); a film played some other way falls back to "the same skill just ended"
const ended = {}; // skill → when its last film ended
const AGAIN_MS = 500;
const enemyAct0 = Battle.prototype.enemyAct;
Battle.prototype.enemyAct = async function (...a) {
  this.feAct = { n: 0 };
  try { return await enemyAct0.apply(this, a); } finally { this.feAct = null; }
};
function againNow(d) {
  const sc = globalThis.__game && globalThis.__game.scene, act = sc && sc.feAct;
  if (act) return ++act.n > 1;
  return performance.now() - (ended[d.skill] || -1e9) < AGAIN_MS;
}
// films: { film: { cut, small, no, again, pics: () => [pictures] } }; skills: { skill: film }
export function feFilms(films) { for (const [k, cfg] of Object.entries(films)) { FILMS.add(k); CFG[k] = cfg; } }
export function feRegister(skills) {
  for (const [id, film] of Object.entries(skills)) {
    const prev = moveFilm(id);
    if (prev && !FILMS.has(prev)) PREV[id] = prev;
    addMoves({ [id]: film });
  }
}
// whether this film plays here: an enemy of the Z3 switch (enemy id ≥ 101); otherwise the film the skill had before
function mine(d) {
  const film = moveFilm(d.skill), id = foeId(d);
  return !d.p && FILMS.has(film) && (id >= 101 || (id >= 31 && !!(CFG[film] || {}).z2 && Z2_SKILLS.has(Number(d.skill))));
}
const Z2_SKILLS = new Set([625, 629, 632, 636, 639, 646, 650, 653, 657, 660]); // (the Z2 switch's 2431: attack patterns 635 … 670)
export function feFallback(d) { return PREV[d.skill] || (d.p ? 'energyWave' : 'foeWave'); }

const swoop0 = Duel.prototype.swoopIn, launch0 = Duel.prototype.launch;
Object.assign(Duel.prototype, {
  * swoopIn() {
    if (!mine(this)) return yield* swoop0.call(this);
    const film = moveFilm(this.skill), cfg = CFG[film] || {};
    for (const p of [...FE_IMAGES, ...(cfg.pics ? cfg.pics(this) : [])]) img(p); // (loading while the swoop and the launch play)
    const z = this.fe = new FeStage(this);
    z.cutFlag = !!cfg.cut;
    if (cfg.small) z.small = true;
    if (cfg.no != null) z.tecNo = cfg.no;
    const again = againNow(this);
    z.again = !!cfg.again && again;
    this.finished.then(() => { ended[this.skill] = performance.now(); });
    if (z.again) { // the case block's settings, no 31 / 32: the ground already gone
      this.back.y = BACK_Y + 79 * 4;
      cfg.again(z);
      return;
    }
    yield* swoop0.call(this);
  },
  * launch() { // 32: from its frame 30 the strips, and the cut-in when the move has one
    const z = this.fe;
    if (!z || !mine(this)) return yield* launch0.call(this);
    if (z.again) return;
    this.se('Z1 必殺技');
    this.pose(this.A, 0, true);
    for (let f = 1; f < 80; f++) {
      if (f >= 30) { if (z.cutFlag) z.cut = true; z.tec = true; }
      this.back.y += 4;
      yield;
    }
  },
  // the film's stage (made by swoopIn; a film started some other way gets one here)
  feStage() { return this.fe || (this.fe = new FeStage(this)); },
});

// ---------- the shared films ----------
// 2431's table (124459): where each enemy's hand is (enerugi_anime_no 2: リクーム系 / レズン系 use row 2)
const WAVE_AT = [
  [[65, 217], 328, 142], [[66, 218], 320, 140], [[67, 219], 314, 138], [[68, 220], 340, 162, 2], [[69, 221], 340, 162],
  [[72, 224], 324, 142], [[73, 225], 308, 142], [[74, 226], 326, 154], [[75, 227], 310, 140], [[76, 228], 314, 154],
  [[101, 102, 117, 118, 119, 170, 230, 240, 243, 260], 314, 156], [[103, 104, 105, 131, 109, 110, 133], 308, 146],
  [[111, 112, 113, 114, 115, 116, 231, 232, 241, 242], 310, 142], [[106, 107, 108, 132], 314, 144],
  [[120, 123, 169, 234, 239, 265], 320, 146], [[121, 261], 306, 142], [[122, 262], 328, 140], [[125, 236], 324, 144],
  [[126, 127, 128, 237, 264, 268], 306, 144], [[129, 135, 269], 314, 134], [[130], 344, 158], [[138], 320, 136],
  [[139, 267], 310, 136], [[140], 308, 136], [[141], 344, 160], [[142], 310, 136], [[143], 310, 136], [[144], 312, 138],
  [[145], 342, 142], [[146], 312, 142], [[147], 342, 160], [[148], 312, 154], [[151], 308, 142], [[152, 270], 308, 126],
  [[154, 275], 308, 134], [[155, 156, 157, 158], 308, 148], [[159, 160, 161], 312, 144], [[162, 163, 164], 312, 144],
  [[165, 166, 233], 312, 144], [[167, 168, 255], 308, 138], [[171], 308, 130], [[172, 273], 326, 144], [[173, 274], 314, 138],
  [[177], 310, 142], [[178], 318, 144], [[179], 310, 142], [[180], 340, 160], [[189, 190, 246], 324, 140],
  [[191, 192, 245], 328, 142], [[193, 194], 314, 142], [[195, 196, 244], 326, 154], [[197, 198, 251], 340, 162],
  [[199, 200, 250], 320, 138, 2], [[201, 202, 249], 308, 142], [[203, 204, 248], 322, 142], [[205, 206, 247], 316, 142],
  [[213], 308, 132], [[215, 277], 316, 142], [[216], 328, 146], [[70, 222], 316, 124, 1, true], [[71, 223, 259], 260, 120, 1, true, 1],
  [[238, 252, 272], 314, 144], [[253, 276], 282, 152], [[254, 278], 326, 142], [[279], 320, 146],
];
// 2499's table (125220): ray_x / ray_y, kitamenasi (no aura: the ki gathers in instead), ray_big
const BIG_AT = [
  [[111, 112, 113, 114, 115, 116, 241, 242], 210, 116, 0, 0], [[117, 118, 119, 240], 216, 126, 0, 0],
  [[120, 136, 169, 239], 222, 120, 0, 1], [[121, 261], 208, 116, 0, 1], [[122, 262], 230, 112, 1, 1], [[123, 263], 222, 120, 1, 1],
  [[124, 125], 230, 120, 1, 1], [[126], 208, 120, 1, 1], [[138], 210, 112, 1, 1], [[139], 200, 112, 1, 1], [[140], 198, 112, 1, 1],
  [[141], 234, 136, 1, 1], [[142], 200, 112, 1, 1], [[143, 271], 200, 112, 0, 1], [[144], 202, 114, 0, 1], [[145], 232, 118, 1, 0],
  [[146], 202, 116, 1, 0], [[147], 232, 134, 0, 0], [[151], 202, 116, 0, 1], [[152, 270], 202, 100, 0, 1], [[154, 275], 202, 108, 1, 1],
  [[172, 273], 224, 118, 1, 1], [[173, 274], 212, 112, 1, 1], [[177], 210, 116, 0, 1], [[178], 218, 118, 0, 1], [[179], 210, 116, 0, 1],
  [[180], 240, 134, 0, 1], [[213], 206, 108, 1, 1], [[215, 277], 216, 116, 0, 1], [[216], 228, 120, 1, 1], [[70, 222], 216, 98, 1, 1],
  [[71, 223, 259], 160, 102, 1, 1, 1], [[238, 252, 272], 220, 130, 0, 1], [[253, 276], 180, 124, 1, 1], [[254, 278], 222, 118, 1, 1],
];
const row = (table, id) => table.find((r) => r[0].includes(id));

feFilms({
  feWave: { z2: true, pics: () => [...Object.values(SMALL), ...Object.values(SMALL2)] },
  feDeathBall: { cut: true, no: 1, pics: () => [...Object.values(SOKI), BALL[1]] },
  feWaves: { cut: true, pics: () => Object.values(BALL), again: (z) => { z.tec = true; z.cut = true; z.cutFlag = true; z.mirror = true; } },
  feBlast: { cut: true, pics: () => [DEMON, SHOCK, AURA[3]], again: (z) => { z.tec = false; z.cut = true; z.cutFlag = true; z.mirror = true; } },
  feBigWave: { cut: true, small: true, pics: () => [DOT, AURA[3], ...Object.values(BIG), ...Object.values(MID_HIT)] },
  feCutter: { cut: true, no: 3, pics: () => [KIEN] },
});

Object.assign(Duel.prototype, {
  * feWave() { // 2431 (敵汎用)エネルギー波: the small beam from the hand (effect 227), then on the member (228); damage 23
    if (!mine(this)) return yield* this[feFallback(this)]();
    const z = this.feStage(), id = z.id, r = row(WAVE_AT, id) || [null, 328, 148];
    const [, x0, y0, anime = 1, big = false, color = 3] = r;
    for (let f = 0; f <= 76; f++) {
      let rx = x0, ry = y0;
      if (f === 0) {
        z.se('Z1 怪光線');
        z.pose(anime);
        z.color = color;
        if (id === 121 || id === 126 || id === 140) z.ax = 2;
      } else if (f <= 40) {
        z.efp = 227;
        if (f === 1 && (id === 121 || id === 126 || id === 140)) z.ax = 0;
      } else if (f === 41) z.fxReset();
      else if (f === 45) z.displayOut();
      else if (f >= 46 && f <= 75) { z.efp = big ? 234 : 228; ry = 136; }
      else if (f === 76) break;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(23);
  },

  * feWaves() { // 2494 連続エネルギー波: four balls, a step back and forward each, then the one on the member; damage 23
    if (!mine(this)) return yield* this[feFallback(this)]();
    const z = this.feStage(), id = z.id;
    z.color = 3;
    if (z.again) { // a further target: 0 set_chr_display_out, 1-29 the ball on it
      for (let f = 0; f < 30; f++) {
        if (f === 0) z.displayOut(); else z.efp = 202;
        yield* z.out();
      }
      return yield* z.damage(23);
    }
    const ghost = id === 172; // ゴーストライチー: rows 10 / 1
    for (let f = 0; f < 110; f++) {
      let ry = 138;
      if (f === 0) {
        z.se('Z3 エネルギー波');
        z.pose(2);
        if (ghost) z.pose(10);
        z.spd = true;
      } else if (f <= 69) {
        z.efp = 201;
        const k = f <= 16 ? 0 : f <= 31 ? 1 : f <= 46 ? 2 : f <= 61 ? 3 : -1, c = 1 + 15 * k; // hatudoukaisi 1, 15 a throw
        if (k >= 0) {
          ry = [138, 78, 138, 98][k];
          if (k > 0 && f === c + 1) { // the next throw: the ball back at the hand, the pose
            z.eff = 0;
            z.pose(k === 2 ? (ghost ? 10 : 2) : 1);
            if (ghost && k < 3) z.eff = 1;
          }
          if (f <= c + 3) z.ax = -2; else if (f <= c + 5) { z.pose(0); z.ax = 2; } else if (f <= c + 7) z.ax = 0;
        }
      } else if (f === 70) { z.seStop(); z.fxReset(); } else if (f === 80) { z.displayOut(); z.spd = false; } else if (f >= 81) z.efp = 202;
      yield* z.out(180, ry);
    }
    return yield* z.damage(23);
  },

  * feBlast() { // 2498 爆発波: the aura (back 201), the demon backdrop as he bursts, then the shock behind the member; damage 23
    if (!mine(this)) return yield* this[feFallback(this)]();
    const z = this.feStage(), id = z.id, quiet = [172, 173, 71, 223].includes(id);
    z.color = 3;
    if (z.again) { // a further target: the shock behind each one
      for (let f = 0; f <= 61; f++) {
        if (f === 0) {
          if (id === 152) z.se('Z1 ゴー');
          z.se('Z1 ザー');
          this.A.y = -200; this.G.x = CENTER_CHAX; this.G.y = STD_Y;
        } else { z.backPattern(1); z.cut = true; z.mirror = true; }
        yield* z.out();
      }
      return yield* z.damage(23);
    }
    const BURST = { 129: [5], 135: [5], 269: [5], 139: [4], 267: [4], 152: [7, 0, -2], 270: [7, 0, -2], 165: [4], 166: [4],
      167: [4, 8], 168: [4, 8], 172: [2, 10], 273: [2, 10], 173: [2, 8], 274: [2, 8], 71: [4, 8], 223: [4, 8], 259: [4, 8] };
    const [p, dx = 0, dy = 0] = BURST[id] || [3];
    for (let f = 0; f <= 272; f++) {
      if (f === 0) z.se(quiet ? 'Z1 気を溜める5' : 'Z3 変身');
      else if (f <= 128) { if (!quiet) z.backPattern(201, 248, 88); } else if (f === 129) { z.tec = false; z.seStop(); z.se('Z1 エネルギー波'); } else if (f <= 210) {
        z.backPattern(2);
        z.pose(p);
        if (f === 130) { this.A.x += dx; this.A.y += dy; }
      } else if (f === 211) { this.A.y = -200; this.G.x = CENTER_CHAX; this.G.y = STD_Y; } else { z.cut = true; z.mirror = true; z.backPattern(1); }
      yield* z.out();
    }
    return yield* z.damage(23);
  },

  * feBigWave() { // 2499 強力エネルギー波: the aura or the ki gathering in, the big beam (239 / 233), then on the member; damage 23
    if (!mine(this)) return yield* this[feFallback(this)]();
    const z = this.feStage(), id = z.id, r = row(BIG_AT, id) || [null, 210, 120, 0, 0];
    const [, x0, y0, noAura, big, green] = r;
    const two = id === 143 || id === 145; // ボージャック(フルパワー) / ザンギャ: row 2
    for (let f = 0; f <= 216; f++) {
      let rx = x0, ry = y0;
      if (big && f >= 140) { rx -= 88; ry -= 18; }
      if (f === 0) {
        z.pose(0);
        if (!noAura) {
          z.se([177, 178, 179, 180].includes(id) ? 'Z1 気を溜める5' : 'Z3 変身');
          if (id === 238 || id === 252) z.pose(2);
        } else {
          z.se('DB3 気を溜める2');
          z.pose(1);
          if (id === 145) z.pose(2);
          if (id === 191 || id === 192) z.pose(4);
          if (id === 195 || id === 196) z.pose(3);
          if (id === 126) z.ax = 2;
        }
        z.color = green ? 1 : 3;
        z.gatherStart(x0 + 48, y0 + 32);
      } else if (f <= 128) {
        if (id === 126) z.ax = 0;
        if (!noAura) z.backPattern(201, 248, 88); else z.gather(125);
      } else if (f === 129 || f === 140) {
        z.seStop();
        if (f === 140) z.se('Z1 エネルギー波2');
        z.pose(1);
        if (two) z.pose(2);
        if (id === 238 || id === 252) z.pose(3);
        if (f === 129 && id === 121) z.ax = 2;
        if (f === 140) z.efp = big ? 239 : 233;
      } else if (f === 130) z.ax = 0;
      else if (f === 179) z.fxReset();
      else if (f === 189) z.displayOut();
      else if (f >= 190 && f <= 215) z.efp = big ? 240 : 234;
      else if (f === 216) break;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(23);
  },

  * feDeathBall() { // 2495 デスボールとスーパーノヴァ: the ball grows over his hand (effect 10), he throws it, then on the member (271); damage 41
    if (!mine(this)) return yield* this[feFallback(this)]();
    const z = this.feStage(), id = z.id, chilled = id === 238 || id === 252, cooler = id === 120 || id === 239;
    const [x0, y0] = chilled ? [262, 64] : cooler ? [250, 10] : [242, 20];
    for (let f = 0; f <= 208; f++) {
      let rx = x0, ry = y0;
      if (f === 0) {
        z.se('DB3 気を溜める2');
        z.pose(cooler ? 11 : id === 121 ? 4 : id === 136 || chilled ? 5 : 3);
        z.color = 0;
      } else if (f <= 130) {
        z.efp = 10;
        if (f % 3 === 0 && id === 121) z.eff++;
        const cap = id === 121 || chilled ? 4 : 3;
        if (z.eft > cap) z.eft = cap;
      } else if (f <= 170) {
        z.pose(chilled ? 6 : 1);
        if (f === 131) { z.tecNo = 0; z.se('Z1 繰気弾'); }
        rx -= 12 * (f - 131); ry += 2 * (f - 131);
      } else if (f === 171) z.fxReset();
      else if (f === 180) z.displayOut();
      else if (f >= 181 && f <= 207) { z.efp = 271; z.eft = id === 121 || chilled ? 4 : 3; } else if (f === 208) break;
      yield* z.out(rx, ry);
    }
    return yield* z.damage(41);
  },

  * feCutter() { // 2493 フリーザカッター: the disc swings round above his hand, then it is thrown (effect 260); damage 23
    if (!mine(this)) return yield* this[feFallback(this)]();
    const z = this.feStage();
    const SWING = [[0, 0], [4, -1], [7, -3], [9, -6], [10, -10], [9, -14], [7, -17], [4, -19], [0, -20], [-4, -19], [-7, -17],
      [-9, -14], [-10, -10], [-9, -6], [-7, -3], [-4, -1]]; // kien_mawarikata 0-15 (× 6 / × 2)
    const K0 = 20; // kienkizyunframe
    for (let f = 0; f <= 166; f++) {
      if (f === 0) { z.se('DB3 気を溜める2'); z.pose(3); z.color = 0; } else if (f <= 121) {
        let x = 244, y = 80;
        if (f >= K0) {
          const k = f - K0 >= 10 && f - K0 <= 24 ? f - K0 - 9 : f - K0 >= 26 && f - K0 <= 40 ? f - K0 - 25 : 0;
          x += SWING[k][0] * 6; y += SWING[k][1] * 2;
        }
        if (f >= K0 + 50) {
          if (f === K0 + 50) { z.seStop(); z.se('Z1 気円斬'); }
          y -= 8 * (f - (K0 + 50)); x -= 8 * (f - (K0 + 50));
          z.pose(4);
        }
        z.back(KIEN, 0, 30 * 4, 126, 30, x, y);
      } else if (f === 130) { z.fxReset(); z.tecNo = 0; z.displayOut(); } else if (f >= 141 && f <= 165) z.efp = 260;
      else if (f === 166) break;
      yield* z.out();
    }
    return yield* z.damage(23);
  },
});

// sounds these films play, for tools/copy_assets.py
export const FE_SOUNDS = ['Z1 怪光線', 'Z3 エネルギー波', 'Z3 変身', 'Z1 気を溜める5', 'Z1 エネルギー波', 'Z1 ゴー', 'Z1 ザー',
  'DB3 気を溜める2', 'Z1 エネルギー波2', 'Z1 気円斬', 'Z1 繰気弾', 'Z1 必殺技', 'Z3 光線系ヒット', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3',
  'Z1 爆発1', 'DB3 大爆発', 'Z3 跳ね返し', 'ZG 打撃4'];

// S-combo films of the Z3 switch, anime_pattern 29xx (docs/anim-f-plan.md cmd), ported frame by frame from the
// classic version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb). In the Z3 part of the move switch
// (all.rb 59742, $btl_progress 2) a combo's attack pattern is its id + 10 (813 …), which runs anime_pattern 31 (swoop
// in) → 32 (必殺技!, with @chr_cutin_flag and @tec_back_small: the strips and the lead's cut-in from its frame 30) →
// its own 29xx pattern → the damage pattern.
//
// The films are the Ruby case statements written out frame by frame on a stage that keeps the original's instance
// variables for a member attacking (@attackcourse 0): `z.f` is @battle_anime_frame, z.ax … z.gy the moves
// (output_battle_anime: @gx flips sign every frame), z.efp the effect pattern drawn in front at the end of the frame
// with that frame's ray_x / ray_y, z.back(n, x, y) a back_anime_pattern behind the fighters, z.blt / z.fill what the
// pattern blits straight away, z.chg @btl_ani_cha_chg_no (the member drawn as somebody else), z.c1 … z.c4 / z.t1 … z.t4
// the @scombo_cha* and their anime types. The strips and pattern 32 are src/anime_zfighters.js's stage (ZfStage, this
// class extends it), the cut-in src/anime_goku_gohan.js's (its render draws d.agSt). Frame numbers in the comments
// are the original's.
import { audio, img, rand, view } from './core.js?v=20261108-0709';
import { RAY_SPEED, ANIME_IMAGES, SW } from './anime.js?v=20261108-0709';
import { ComboDuel, addComboFilms } from './combo-anime.js?v=20261108-0709';
import { ZfStage, ZF_IMAGES, zfBlt } from './anime_zfighters.js?v=20261108-0709';
import { registerZ3, party, heal } from './z3.js?v=20261108-0709';
import { applyLevel } from './party.js?v=20261108-0709';
import { superSaiyan } from './supersaiyan.js?v=20261108-0709';
import { comboData } from './combo.js?v=20261108-0709';

const pic = (n) => `Graphics/Pictures/${n}`;
const STANDARD_CHAX = -70, STANDARD_CHAY = 120, STANDARD_ENEX = 602, STANDARD_ENEY = 120, CENTER_CHAX = 240, CENTER_ENEX = 304,
  TEC_CENTER_CHAX = 266, FLASH_Y_SIZE_CUTIN_ON = 296, FLASH_Y_SIZE_CUTIN_OFF = 356;
const v = (n) => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[n]) || 0; };

// ---------- pictures ($btl_top_file_name Z3_; the Z2 switch's 1976 uses Z2_) ----------
const SPARK = pic('戦闘アニメ.PNG'), KIRAN = pic('戦闘アニメ_キラーン.PNG');
const BOOM = { 101: [pic('戦闘アニメ_爆発1.PNG'), 96, 96, 320, 120], 102: [pic('戦闘アニメ_爆発3.PNG'), 112, 120, 318, 120],
  103: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 298, 120], 104: [pic('戦闘アニメ_爆発5.PNG'), 158, 160, 282, 104],
  105: [pic('戦闘アニメ_爆発6.PNG'), 256, 256, 234, 46], 106: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 270, 88] }; // effects 101-106, a member attacking
const Z3 = {
  ball: { 0: pic('Z3_戦闘_必殺技_エネルギー弾.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー弾(緑).PNG'), 3: pic('Z3_戦闘_必殺技_エネルギー弾(青).PNG') },
  ball2: { 0: pic('Z3_戦闘_必殺技_エネルギー弾2.PNG'), 3: pic('Z3_戦闘_必殺技_エネルギー弾2(青).PNG') },
  ball4: { 0: pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー弾4(緑).PNG'), 3: pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'),
    4: pic('Z3_戦闘_必殺技_エネルギー弾4(桃).PNG') },
  liquid: { 0: pic('Z3_戦闘_必殺技_エネルギー液.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー液(緑).PNG'), 2: pic('Z3_戦闘_必殺技_エネルギー液(水色).PNG'),
    3: pic('Z3_戦闘_必殺技_エネルギー液(青).PNG'), 4: pic('Z3_戦闘_必殺技_エネルギー液(桃).PNG') },
  huge: { 0: pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_特大_緑.PNG'), 3: pic('Z3_戦闘_必殺技_エネルギー波_特大_青.PNG') },
  hugeK: { 0: pic('Z3_戦闘_必殺技_エネルギー波_特大_加工.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_特大_緑_加工.PNG'),
    3: pic('Z3_戦闘_必殺技_エネルギー波_特大_青_加工.PNG') },
  half: { 0: pic('Z3_戦闘_必殺技_エネルギー波_半円.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_半円(緑).PNG'), 3: pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'),
    9: pic('Z3_戦闘_必殺技_エネルギー波_半円(紫).PNG') },
  mid: pic('Z3_戦闘_必殺技_エネルギー波_中.PNG'), midFoeBlue: pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG'),
  big: pic('Z3_戦闘_必殺技_エネルギー波_大.png'),
  makanko: pic('Z3_戦闘_必殺技_魔貫光殺砲.PNG'), kien: pic('Z3_戦闘_必殺技_気円斬.png'), punch: pic('Z3_戦闘_必殺技_ロケットパンチ.PNG'),
  sword: { 267: pic('Z3_戦闘_必殺技_剣攻撃.PNG'), 268: pic('Z3_戦闘_必殺技_剣攻撃(上下反転).PNG'), 269: pic('Z3_戦闘_必殺技_剣攻撃(縦).PNG') },
  revenger: pic('Z3_戦闘_必殺技_ファイナルリベンジャー.PNG'), revengerSs: pic('Z3_戦闘_必殺技_ファイナルリベンジャー_超.png'),
  spirits: pic('Z3_戦闘_必殺技_エネルギー波_特大_加工(スピリッツかめはめ波).PNG'), spiritsFire: pic('Z3_戦闘_必殺技_エネルギー波_特大_加工(スピリッツかめはめ波)_発動.PNG'),
  shock: pic('Z3_戦闘_必殺技_背景_衝撃波系.png'), demon: pic('Z3_戦闘_必殺技_背景_魔族系(縦).png'), kikou: pic('Z3_戦闘_必殺技_背景_気功砲系.png'),
  aura: { 0: pic('Z3_戦闘_必殺技_気を溜める.png'), 1: pic('Z3_戦闘_必殺技_気を溜める(緑).png'), 3: pic('Z3_戦闘_必殺技_気を溜める(青).png') },
  aura2: { 0: pic('Z3_戦闘_必殺技_気を溜める2.png'), 1: pic('Z3_戦闘_必殺技_気を溜める2(緑).png'), 3: pic('Z3_戦闘_必殺技_気を溜める2(青).png'),
    4: pic('Z3_戦闘_必殺技_気を溜める2(赤).png') },
  aura3: { 0: pic('Z3_戦闘_必殺技_気を溜める3.png'), 1: pic('Z3_戦闘_必殺技_気を溜める3(緑).png'), 3: pic('Z3_戦闘_必殺技_気を溜める3(青).png'),
    4: pic('Z3_戦闘_必殺技_気を溜める3(赤).png') },
};
// the Z2 pictures 1976 needs (Z2 switch: $btl_top_file_name Z2_)
const Z2 = {
  huge: { 0: pic('Z2_戦闘_必殺技_エネルギー波_特大.PNG'), 3: pic('Z2_戦闘_必殺技_エネルギー波_特大_青.PNG') },
  mid: pic('Z2_戦闘_必殺技_エネルギー波_中.PNG'), midFoeBlue: pic('Z2_戦闘_必殺技_エネルギー波_中_敵_青.PNG'),
};
// (Z3_戦闘_必殺技_気を溜める(四身の拳気功砲) is not among the original's pictures; back 8 shows the Z1 one)
const KAME_SIDES = [pic('ZG_戦闘_必殺技_背景_超カメハメ波_左.PNG'), pic('ZG_戦闘_必殺技_背景_超カメハメ波_右.PNG')]; // strips no 4: 3 frames of 176×320
const BURNING_BAR = pic('ZG_戦闘_必殺技_背景(赤)_バーニングアタック上.PNG'); // strips no 6: 672×110, at the top and lower down
const SHISHIN_AURA = pic('Z1_戦闘_必殺技_気を溜める(四身の拳気功砲).PNG');
const GENKI_FULL = pic('Z2_戦闘_必殺技_気を溜める(超元気玉全開).PNG'); // back 129: 3 frames of 816×320
const BLINK = {
  235: { 0: pic('Z3_必殺技_超カメハメ波(球点滅).png'), 1: pic('Z3_必殺技_超カメハメ波(球点滅)(緑).png'), 3: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'),
    4: pic('Z3_必殺技_超カメハメ波(球点滅)(赤).png') },
  237: { 0: pic('Z3_必殺技_超カメハメ波(球点滅小).png'), 1: pic('Z3_必殺技_超カメハメ波(球点滅小)(緑).png'),
    3: pic('Z3_必殺技_超カメハメ波(球点滅小)(青).png'), 4: pic('Z3_必殺技_超カメハメ波(球点滅小)(赤).png') },
  // 289: (球点滅大) — the plain one is not among the original's pictures (the blue one stands in)
  289: { 0: pic('Z3_必殺技_超カメハメ波(球点滅大)(青).png'), 3: pic('Z3_必殺技_超カメハメ波(球点滅大)(青).png') },
  252: { 0: pic('Z3_必殺技_元気玉(球点滅中).PNG'), 1: pic('Z3_必殺技_元気玉(球点滅中)(緑).PNG'), 3: pic('Z3_必殺技_元気玉(球点滅中)(青).PNG') },
};
const by = (t, c, d = 0) => t[c] || t[d];

// ---------- the stage ----------
const SS_NO = { 14: 1, 18: 2, 19: 3, 20: 4, 26: 6, 32: 7 }; // a Super Saiyan's form number (src/supersaiyan.js FORMS)
class CmdStage extends ZfStage {
  constructor(d) {
    super(d);
    this.era = Math.min(2, v(40)) === 1 ? 1 : 2; // $btl_progress (the strips' Z2_ / Z3_)
    this.small = true; // @tec_back_small (every 29xx combo sets it before 32)
    this.f = 0;
    this.ax = 0; this.ay = 0; this.gx = 0; this.gy = 0; this.otype = 0; this.oty = 0;
    this.efp = 0; this.eft = 0; this.eff = 0; this.rt = 0; this.rf = 0;
    this.bt = 0; this.bf = 0; this.color = 0; this.spd = false; this.spdNum = 0;
    this.c1 = 0; this.c2 = 0; this.c3 = 0; this.c4 = 0; this.t1 = 0; this.t2 = 0; this.t3 = 0; this.t4 = 0; this.cf = 0;
    this.tok = false; this._chg = 0;
    const z = this; // the cut-in: src/anime_goku_gohan.js render (the lead's row, after set_chr_display_out the enemy's)
    d.agSt = { foe: false, get era() { return z.era; }, get cutFrom() { return z.cut && z.cutFlag ? 0 : Infinity; }, get mirror() { return z.mirror; } };
  }
  drawCut() {} // (drawn by src/anime_goku_gohan.js)
  tick() { // ZfStage's strips, and no 4 (the ZG super kamehameha's side panels, on @tec_back_anime_type like the corners) / 6
    const k = this.corner;
    super.tick();
    if (this.bars && this.no === 4) {
      this.barList = [(c) => { zfBlt(c, KAME_SIDES[0], k * 176, 0, 176, 320, 0, 18); zfBlt(c, KAME_SIDES[1], k * 176, 0, 176, 320, 640 - 176, 18); }];
    } else if (this.bars && this.no === 6) { // (バーニングアタック's red strip, 8 a frame)
      const x = -(((this.tb6 || 0) % 672) + 672) % 672;
      this.tb6 = (this.tb6 || 0) + 8;
      this.barList = [(c) => { for (const y of [4, 242]) { zfBlt(c, BURNING_BAR, 0, 0, 672, 110, x, y); zfBlt(c, BURNING_BAR, 0, 0, 672, 110, x + 672, y); } }];
    }
  }

  // the sprite sheets of any member (set_battle_character_name): the combo's own crew, or the actor's
  sheets(id) {
    const d = this.d;
    if (d.crew[id]) return d.crew[id];
    const w = globalThis.__game && globalThis.__game.world, a = w && w.actors[id];
    return a ? { normal: a.sprite, special: a.special } : d.crew[d.lead];
  }
  sheet(id, sp) { const s = this.sheets(id); return sp ? s.special : s.normal; }
  get lead() { return this.d.lead; } // $partyc[@chanum]
  get chg() { return this._chg; }
  set chg(id) { this._chg = id; this.d.L.sheets = this.sheets(id || this.d.lead); } // @btl_ani_cha_chg_no
  who() { return this._chg || this.d.lead; }

  // the top of anime_pattern: at frame 0 the moves and @output_anime_type start again
  top() { if (this.f === 0) { this.ax = this.ay = this.gx = this.gy = 0; this.otype = 0; } return this.f; }
  pose(n) { this.d.pose(this.d.A, n); } // battle_anime_change 0,n
  gpose(n) { this.d.pose(this.d.G, n, false); } // battle_anime_change 1,n
  se(name) { audio.se(name, 80); }
  seStop() { audio.seStop(); }
  blt(sheet, sx, sy, w, h, x, y) { this.back(sheet, sx, sy, w, h, x, y); } // straight into the window (behind the fighters)
  fill(x, y, w, h, color = '#fff') { this.b.push((c) => { c.fillStyle = color; c.fillRect(x, y, w, h); }); }
  flash(h = FLASH_Y_SIZE_CUTIN_OFF) { this.fill(0, 0, 640, h); }
  fxReset() { this.efp = 0; this.eff = 0; this.eft = 0; }
  displayOut() { // set_chr_display_out
    const d = this.d;
    this.otype = 0;
    d.A.y = -200;
    d.G.x = CENTER_ENEX; d.G.y = STANDARD_ENEY;
    if (this.cutFlag) this.mirror = true;
  }
  format() { // anime_pattern_fromat
    this.seStop();
    this.otype = 0; this.oty = 0; this.bt = 0; this.bf = 0; this.rt = 0; this.rf = 0; this.fxReset();
    this.ax = this.ay = this.gx = this.gy = 0;
  }
  // the end of a frame: output_battle_anime (the member's sheet by @output_anime_type, @gx flips), then the effect
  // pattern with this frame's ray_x / ray_y in front, then the frame shows
  * out(rx = 0, ry = 0) {
    const d = this.d;
    this.gx = -this.gx;
    if (this.oty) this.gy = -this.gy;
    d.A.x += this.ax; d.A.y += this.ay; d.G.x += this.gx; d.G.y += this.gy;
    d.A.sp = this.otype === 1;
    if (this.efp) {
      const e = EFFECTS[this.efp];
      if (e) e(this, rx, ry);
      this.rf++; this.eff++;
    }
    this.f++;
    yield;
  }
  // frame 9999: anime_pattern_fromat (the fighters drawn once more) and on to the damage pattern
  * finish() {
    const d = this.d;
    this.gx = -this.gx;
    d.A.x += this.ax; d.A.y += this.ay; d.G.x += this.gx; d.G.y += this.gy;
    d.A.sp = this.otype === 1;
    this.format();
    yield;
    this.f = 0;
  }

  // back_anime_pattern n (back_x / back_y), drawn behind the fighters; the counter goes on afterwards
  back(n, x, y, ...rest) {
    if (typeof n !== 'number') return super.back(n, x, y, ...rest); // (ZfStage.back: a blit)
    const B = BACKS[n];
    if (B) B(this, x || 0, y || 0);
    this.bf++;
  }
  bstep(every, last) { // @back_anime_type: the next picture after `every` calls, back to 0 after `last`
    if (this.bf >= every && this.bt !== last) { this.bt++; this.bf = 0; } else if (this.bf >= every) { this.bt = 0; this.bf = 0; }
  }
  rstep(every, last) { // @ray_anime_type the same way
    if (this.rf >= every && this.rt !== last) { this.rt++; this.rf = 0; } else if (this.rf >= every) { this.rt = 0; this.rf = 0; }
  }
  rtoggle(every) { // 0 → 1 → 0 … every `every` frames (effects 238 / 365 / 366 / 372)
    if (this.rf >= every && this.rt === 0) { this.rt++; this.rf = 0; } else if (this.rf >= every) { this.rt = 0; this.rf = 0; }
  }
  big() { return (this.d.G.sheets.size || 96) > 96; } // element 23: a giant enemy

  // the ki gathering into the ball (@genkitama_kanri_*): see the films that use it
}

// ---------- effect_pattern n, a member attacking (z = the stage, rx / ry = the frame's ray_x / ray_y) ----------
const RS = RAY_SPEED;
function wolf(z, chaozu) { // 39 狼牙風風拳 / 315 地球人ストライク (餃子 clinging to the enemy as well)
  if (chaozu) z.front(z.sheet(9, true), 0, 5 * 96, 96, 96, STANDARD_ENEX + 74 - 21 * RS, STANDARD_CHAY - 8);
  const e = z.eff, id = z.who();
  let sheet = z.sheet(id, false), row;
  if (e <= 10) row = 14; else if (e <= 20) row = 13; else if (e <= 30) row = 12; else if (e <= 35) row = 0; else if (e <= 39) row = 3;
  else if (e <= 43) row = 1; else if (e <= 46) row = 2; else if (e <= 50) row = 4; else if (e <= 53) row = 2; else if (e <= 56) row = 1;
  else if (e <= 60) row = 2; else if (e <= 80) row = 16; else { sheet = z.sheet(id, true); row = 3; } // ($btl_progress 2)
  if (e >= 36 && e % 5 === 0 && e < 85) z.se('Z3 打撃');
  const x = e >= 61 && e <= 80 ? CENTER_CHAX - (e - 60) * 8 : e >= 81 && e <= 84 ? 80 + (e - 80) * 16 : CENTER_CHAX;
  z.front(sheet, 0, row * 96, 96, 96, x, STANDARD_CHAY);
}
export const EFFECTS = {
  2: (z, rx, ry) => { // カメハメ波系(正面)
    if (!rx) { rx = 240; ry = 110; }
    z.front(by(Z3.ball, z.color), z.eft * 128, 0, 128, 128, rx, ry);
    if (z.eff >= 10) { z.eft++; z.eff = 0; }
  },
  39: (z) => wolf(z, false),
  44: (z) => z.front(by(Z3.liquid, z.color), 0, 0, 400, 32, -400 + z.eff * RS, 150), // エネルギー液横
  48: (z) => z.front(by(z.era === 1 ? Z2.huge : Z3.huge, z.color, 3), 0, 0, 400, 192, -400 + z.eff * RS, 76), // かめはめ波系(特大)横 ($btl_top_file_name)
  85: (z) => { // 師弟の絆(Z2)_キャラ現れる(放置): 比克 below, 悟飯 above
    z.front(z.sheet(4, true), 0, 0, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
    z.front(z.sheet(z.d.crew[18] ? 18 : 5, true), 0, 0, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY - 50);
  },
  86: (z) => z.front(z.sheet(z.d.crew[18] ? 18 : 5, true), 0, 0, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY - 50),
  88: (z) => { // サイコアタック
    const s = z.sheet(z.who(), true);
    if (z.eff <= 21) z.front(s, 0, 4 * 96, 96, 96, STANDARD_ENEX + 60 - z.eff * RS, STANDARD_CHAY - 24);
    else z.front(s, 0, 5 * 96, 96, 96, STANDARD_ENEX + 74 - 21 * RS, STANDARD_CHAY - 8);
  },
  89: (z) => z.front(z.sheet(z.c2, true), 0, 0, 96, 96, STANDARD_CHAX + z.eff * 8 + 30, STANDARD_CHAY - 50), // 2人目上
  90: (z) => z.front(z.sheet(z.c2, true), 0, 0, 96, 96, STANDARD_CHAX + z.eff * 8 + 30, STANDARD_CHAY + 50), // 2人目下
  92: (z) => z.front(z.sheet(z.c2, true), 0, 0, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY + 50), // 2人目放置(下)
  96: (z, rx, ry) => z.front(by(Z3.huge, 0), 0, 192, 192 + z.eff * RS, 192, rx, ry), // 亀仙流かめはめは_発動
  121: (z) => { // 攻撃ヒット
    const A = z.d.A, G = z.d.G, gy = z.big() ? G.y - 48 : G.y;
    if (z.eff <= 4) { z.front(SPARK, 0, 16, 32, 32, A.x + 96, A.y + 32); z.front(SPARK, 32, 0, 32, 16, G.x, gy); } else if (z.eff <= 10) { z.front(SPARK, 32, 16, 32, 32, A.x + 96, A.y + 32); z.front(SPARK, 32, 0, 32, 16, G.x, gy); }
  },
  123: (z, rx, ry) => z.front(SPARK, z.eff <= 4 ? 0 : 32, 16, 32, 32, rx, ry), // キャラぶつかる自由位置
  124: (z, rx, ry) => { // キラーン自由位置
    const e = z.eff, k = e <= 7 ? 0 : e <= 15 ? 1 : e <= 23 ? 2 : e <= 31 ? 1 : e <= 39 ? 0 : -1;
    if (k >= 0) z.front(KIRAN, 32 * k, 0, 32, 32, rx, ry);
  },
  201: (z, rx, ry) => { z.eft = 2; z.front(by(Z3.ball, z.color), z.eft * 128, 0, 128, 128, rx + z.eff * (z.spd ? RS + z.spdNum : RS), ry); }, // エネルギー弾系(発動)
  203: (z, rx, ry) => z.front(by(Z3.ball2, z.color), 0, 0, 96, 64, rx + z.eff * RS, ry), // かめはめ波系(発動)
  204: (z) => z.front(by(Z3.ball2, z.color), 0, 0, 96, 64, -128 + z.eff * RS, 144), // (ヒット)
  206: (z, rx, ry) => z.front(by(Z3.ball4, z.color), 0, 0, 190, 126, rx + z.eff * RS, ry), // 界王拳かめはめ波系(発動)
  207: (z) => z.front(by(Z3.ball4, z.color), 0, 0, 190, 126, -192 + z.eff * RS, 96), // (ヒット)
  235: (z, rx, ry) => { z.front(by(BLINK[235], z.color), 32 * z.rt, 0, 32, 32, rx, ry); z.rstep(4, 4); }, // スーパーカメハメ波ため
  237: (z, rx, ry) => { z.front(by(BLINK[237], z.color), 16 * z.rt, 0, 16, 16, rx, ry); z.rstep(4, 4); }, // ファイナルリベンジャーため(小)
  238: (z, rx, ry) => { z.front(z.d.crew[32] ? Z3.revengerSs : Z3.revenger, 236 * z.rt, 0, 236, 122, rx, ry); z.rtoggle(8); }, // ファイナルリベンジャー
  249: (z) => { // ギャリックカメハメは(発動)Z2
    const e = Math.min(5, z.eff);
    z.front(Z3.mid, 0, 80, 80 + e * (RS + 2), 80, 160, 118);
    z.front(Z3.midFoeBlue, 314 - e * RS, 0, 86 + e * RS, 80, 396 - e * RS, 118);
  },
  252: (z, rx, ry) => { z.front(by(BLINK[252], z.color), 64 * z.rt, 0, 64, 64, rx, ry); z.rstep(4, 3); }, // 元気玉ため
  255: (z, rx, ry) => z.front(Z3.makanko, 0, 0, 400, 64, -400 + z.eff * RS, ry), // Z3まかんこうさっぽう(ヒット)
  256: (z, rx, ry) => z.front(by(Z3.half, z.color), 0, 0, z.eff * RS, 128, rx, ry), // Z3エネルギー波半円発動
  260: (z) => z.front(Z3.kien, 0, 30 * 4, 126, 30, -192 + z.eff * RS, 160), // Z3気円斬系(ヒット)
  265: (z, rx, ry) => z.front(by(Z3.half, z.color), 0, 128, 700, 128, -700 + z.eff * RS, ry), // Z3エネルギー波半円ヒット
  267: (z, rx, ry) => { z.front(Z3.sword[267], 160 * z.rt, 0, 160, 96, rx, ry); if (z.rf >= 2) { z.rt++; z.rf = 0; } }, // 剣攻撃
  268: (z, rx, ry) => { z.front(Z3.sword[268], 160 * z.rt, 0, 160, 96, rx, ry); if (z.rf >= 2) { z.rt++; z.rf = 0; } }, // 剣攻撃上下反転
  269: (z, rx, ry) => { z.front(Z3.sword[269], 96 * z.rt, 0, 96, 160, rx, ry); if (z.rf >= 2) { z.rt++; z.rf = 0; } }, // 剣攻撃縦
  272: (z, rx, ry) => z.front(Z3.makanko, 0, 64, 64 + z.eff * RS, 64, rx, ry), // Z3まかんこうさっぽう(発動横)
  273: (z, rx, ry) => { // ロケットパンチ(発動): it shakes on its first frame
    const [sx, sy] = z.eff === 0 ? shake(4) : [0, 0];
    z.front(Z3.punch, 0, 0, 24, 14, rx + z.eff * RS + sx, ry + sy);
  },
  283: (z, rx, ry) => z.front(by(Z3.liquid, z.color), 0, 32, 24 + z.eff * RS, 32, rx, ry), // Z2_エネルギー液発動
  289: (z, rx, ry) => { z.front(by(BLINK[289], z.color), 64 * z.rt, 0, 64, 64, rx, ry); z.rstep(4, 4); }, // スピリッツキャノン一枚絵用
  290: (z) => { const s = by(BLINK[235], z.color); z.front(s, 32 * z.rt, 0, 32, 32, 270, 164); z.front(s, 32 * z.rt, 0, 32, 32, 340, 164); z.rstep(4, 4); }, // アクセルダンス
  295: (z, rx, ry) => z.front(by(Z3.huge, z.color, 3), 0, 192, 192 + z.eff * RS, 192, rx, ry), // Z3エネルギー波_特大発動
  297: (z, rx, ry) => z.front(Z3.mid, 0, 0, 400, 80, -400 + z.eff * RS, ry), // エネルギー波_中Z2以降(ヒット)
  315: (z) => wolf(z, true),
  331: (z) => { const w = 54 + z.eff * RS; z.front(Z3.mid, 0, 80, w, 80, 326, 116); z.front(Z3.mid, 0, 80, w, 80, 282, 42); z.front(Z3.mid, 0, 80, w, 80, 282, 172); }, // ナメック戦士発動
  332: (z) => { // 狼牙風風拳 ヤムチャとわかもの
    const e = z.eff;
    const R = [[10, 14, 26], [20, 13, 25], [30, 12, 24], [35, 0, 19], [39, 3, 22], [43, 1, 20], [46, 2, 21], [50, 4, 23], [53, 2, 21], [56, 1, 20],
      [60, 2, 21], [80, 16, 18]].find(([n]) => e <= n);
    const [r1, r2] = R ? [R[1], R[2]] : [3, 21];
    const s1 = z.sheet(7, !R), s2 = z.sheet(15, true);
    if (e >= 36 && e % 5 === 0 && e < 85) z.se('Z3 打撃');
    const y = e >= 61 && e <= 80 ? STANDARD_CHAY - (e - 60) * 4 : e >= 81 && e <= 85 ? STANDARD_CHAY - 80 + (e - 80) * 16 : STANDARD_CHAY;
    z.front(s1, 0, r1 * 96, 96, 96, CENTER_CHAX + 10, y);
    z.front(s2, 0, r2 * 96, 96, 96, CENTER_CHAX + 154, y);
  },
  333: (z, rx, ry) => { // エネルギー弾系(正面), stopping at its sixth picture
    if (!rx) { rx = 240; ry = 100; }
    z.front(by(Z3.ball, z.color), z.eft * 128, 0, 128, 128, rx, ry);
    if (z.eff >= 10) { if (z.eft !== 5) z.eft++; z.eff = 0; }
  },
  353: (z) => z.front(by(Z3.hugeK, z.color, 3), 0, 0, 400, 192, -400 + z.eff * RS, 76), // かめはめ波系(特大_加工)横 ヒット
  358: (z, rx, ry) => z.front(by(Z3.hugeK, z.color, 3), 0, 192, 54 + z.eff * RS, 192, rx, ry), // (特大_加工)横 発動
  363: (z) => z.front(z.sheet(z.c2, true), 0, 0, 96, 96, STANDARD_CHAX + z.eff * 12 - 30 + 12, STANDARD_CHAY), // 2人目右
  364: (z) => z.front(z.sheet(z.c2, true), 0, 0, 96, 96, STANDARD_CHAX + z.eff * 8 - 48, STANDARD_CHAY), // 2人目左
  365: (z) => { z.front(Z3.spirits, 0, z.rt * 192, 400, 192, -400 + z.eff * RS, 76); z.rtoggle(8); }, // スピリッツかめはめ波 ヒット
  366: (z, rx, ry) => { // エネルギー弾系(正面:スピリッツかめはめ波系)
    if (!rx) { rx = 240; ry = 100; }
    z.front(z.rt === 0 ? Z3.ball[0] : Z3.ball[3], z.eft * 128, 0, 128, 128, rx, ry);
    if (z.eff >= 10) { if (z.eft !== 5) z.eft++; z.eff = 0; }
    z.rtoggle(8);
  },
  367: (z, rx, ry) => { const w = 54 + z.eff * RS; z.front(Z3.big, 0, 92, w, 92, rx - 14, ry - 128); z.front(Z3.big, 0, 92, w, 92, rx - 10, ry - 22); }, // 絶好のチャンス
  369: (z, rx, ry) => { // Z3エネルギー波半円ヒット(赤、青斑点)
    if (z.rf >= 4 && z.eft === 0) { z.eft++; z.rf = 0; } else if (z.rf >= 4 && z.eft === 1) { z.eft = 0; z.rf = 0; }
    z.front(z.eft === 1 ? Z3.half[3] : Z3.half[0], 0, 128, 700, 128, -700 + z.eff * RS, ry);
  },
  372: (z, rx, ry) => { z.front(Z3.spiritsFire, 0, z.rt * 192, z.eff * RS, 192, rx, ry); z.rtoggle(8); }, // ファイナルかめはめ波 発動
};
for (const [n, [sheet, w, h, x, y]] of Object.entries(BOOM)) { // 101-106: the explosions, the next picture every 10 frames
  EFFECTS[n] = (z) => { const k = z.eft; if (z.eff >= 10) { z.eft++; z.eff = 0; } z.front(sheet, k * w, 0, w, h, x, y); };
}
function shake(dot) { // pic_shake_cal: one of the eight directions or none
  const k = rand(9) + 1;
  return [[-dot, dot], [0, dot], [dot, dot], [-dot, 0], [0, 0], [dot, 0], [-dot, -dot], [0, -dot], [dot, -dot]][k - 1];
}

// ---------- back_anime_pattern n, a member attacking ----------
export const BACKS = {
  1: (z) => { // 衝撃波系横
    if (z.big()) { z.blt(Z3.shock, 0, z.bt * 180, 640, 42, 0, 80 - 48); z.blt(Z3.shock, 0, 138 + z.bt * 180, 640, 42, 0, 80 + 180 - 42 + 48); } else z.blt(Z3.shock, 0, z.bt * 180, 640, 180, 0, 80);
    z.bstep(4, 2);
  },
  2: (z) => { z.blt(Z3.demon, 0, z.bt * 480, 640, 356, 0, 0); z.bstep(4, 2); }, // 必殺技発動時縦
  8: (z) => { z.blt(SHISHIN_AURA, 0, z.bt * 360, 640, 360, 0, 0); z.bstep(4, 2); }, // 気を溜める(四身の拳気功砲)
  9: (z) => { // 四身の拳気功砲系縦
    if (z.big()) { z.blt(Z3.kikou, 0, z.bt * 360, 142, 356, 170 - 14, 0); z.blt(Z3.kikou, 242, z.bt * 360, 142, 356, 170 - 14 + 142 + 200, 0); } else z.blt(Z3.kikou, 0, z.bt * 360, 384, 356, 170, 0);
    z.bstep(4, 2);
  },
  39: (z) => { // ダブルどどんぱ(Z2)_キャラ現れる: the other one of 天津飯 / 餃子 flying in
    const tien = z.lead === 8, s = z.sheet(tien ? 9 : 8, true);
    z.blt(s, 0, 0, 96, 96, STANDARD_CHAX + z.bf * 8 + 30, STANDARD_CHAY + (tien ? -50 : 50));
  },
  40: (z) => { z.blt(z.sheet(8, true), 0, 0, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY + 50); z.blt(z.sheet(9, true), 0, 0, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY - 50); }, // (放置)
  41: (z) => { z.blt(z.sheet(8, true), 0, 5 * 96, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY + 50); z.blt(z.sheet(9, true), 0, 96, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY - 50); }, // _放つ
  44: (z) => { // Z2超能力きこうほう
    z.blt(z.sheet(8, true), 0, 0, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
    z.blt(z.sheet(9, true), 0, (z.era === 2 ? 6 : 2) * 96, 96, 96, TEC_CENTER_CHAX, STANDARD_CHAY - 50);
  },
  48: (z, x, y) => { if (z.bf % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, x, y); }, // 師弟の絆_高速移動
  55: (z) => { // 師弟の絆_キャラ現れる: 比克 leads → 克林 (6) flickers in, otherwise 比克
    const p = z.lead === 4, id = p ? 6 : 4, s = z.sheet(id, z.bf >= 31);
    const row = z.bf <= 10 ? 14 : z.bf <= 20 ? 13 : z.bf <= 30 ? 12 : 0;
    z.blt(s, 0, row * 96, 96, 96, p ? CENTER_CHAX + 120 : CENTER_CHAX - 66, STANDARD_CHAY);
  },
  101: (z, x, y) => { z.blt(by(Z3.aura3, z.color), z.bt * 184, 0, 184, 240, x, y); z.bstep(4, 2); }, // 気を溜める(大)
  105: (z, x, y) => { z.blt(by(Z3.aura2, z.color), z.bt * 152, 0, 152, 192, x, y); z.bstep(4, 2); }, // 気を溜める(中)
  115: (z, x, y) => z.blt(z.sheet(z.c1, false), 0, z.t1 * 96, 96, 96, x, y), // スパーキング用1人目
  116: (z, x, y) => z.blt(z.sheet(z.c1, true), 0, z.t1 * 96, 96, 96, x, y), // 1人目必殺技
  117: (z, x, y) => z.blt(z.sheet(z.c2, false), 0, z.t2 * 96, 96, 96, x, y), // 2人目
  118: (z, x, y) => z.blt(z.sheet(z.c2, true), 0, z.t2 * 96, 96, 96, x, y), // 2人目必殺技
  120: (z, x, y) => z.blt(z.sheet(z.c3, true), 0, z.t3 * 96, 96, 96, x, y), // 3人目必殺技
  122: (z, x, y) => z.blt(z.sheet(z.c4, true), 0, z.t4 * 96, 96, 96, x, y), // 4人目必殺技
  128: (z) => z.blt(z.sheet(z.c1, true), 0, z.t1 * 96, 96, 96, STANDARD_CHAX + z.cf * 16, STANDARD_CHAY), // 発動キャラ前に現れる(汎用)
  129: (z, x, y) => { // 気を溜める(超元気弾)溜め続ける
    z.blt(GENKI_FULL, 0, z.bt * 320, 816, 320, x, y);
    if (z.bf >= 2) { z.bt++; z.bf = 0; if (z.bt === 3) z.bt = 0; }
  },
  201: (z, x, y) => { z.blt(by(Z3.aura, z.color), z.bt * 136, 0, 136, 142, x, y); z.bstep(16, 1); }, // 気を溜める(Z3)
};

// ---------- the damage patterns after a film (the strips and the cut-in stay on) ----------
// 21 通常攻撃吹っ飛び / 22 衝撃波系 / 41 爆発系ZD中 / 43 爆発系Z2大 / 44 / 48 爆発系Z2特大 (48 downwards) / 82 超能力ヒット揺れながら爆発
const DAMAGE = { 21: ['Z3 打撃', 0, 51], 22: ['Z3 跳ね返し', 0, 60], 41: ['ZG 光線系ヒット2', 102, 60], 43: ['Z1 爆発1', 104, 60],
  44: ['DB3 大爆発', 105, 60], 48: ['DB3 大爆発', 105, 45], 82: ['DB3 大爆発', 105, 85] };
function* damage(d, n) {
  const z = d.cmd, [sound, fx, end] = DAMAGE[n], G = d.G;
  z.f = 0;
  for (;;) {
    const f = z.top();
    if (n === 82) {
      if (f === 0) { z.gpose(0); z.se('Z3 超能力'); } else if (f % 2 === 0 && f <= 60) z.gx = 6; else if (f % 2 === 1 && f <= 60) z.gx = -6;
      if (f === 40) { z.seStop(); z.gx = 0; z.se(sound); d.showHit(); z.efp = fx; z.gpose(17); } else if (f >= 61 && f <= 74) z.gy = 20;
      else if (f === 75) { z.gy = 0; z.efp = 0; }
    } else if (f === 0) {
      z.se(n === 22 && z.kyouda ? 'ZG 打撃4' : sound);
      d.showHit();
      if (n === 21) z.gpose(16); else { z.gpose(17); if (fx) z.efp = fx; }
      if (n === 22) z.gx = -20;
    } else if (n === 21) {
      if (f <= 12) { z.gx = -18; if (z.big() && f >= 8) z.gx = 0; z.efp = 121; } else z.gx = 0;
    } else if (n === 22) {
      if (f <= 19) z.gx = -20; else if (f === 20) z.gx = 0;
    } else if (n === 48) {
      if (f >= 21 && f <= 34) z.gy = 20; else if (f === 35) { z.gy = 0; z.efp = 0; }
    } else if (f >= 21 && f <= 39) z.gx = -20; else if (f === 40) { z.gx = 0; z.efp = 0; }
    if (f === end) { z.format(); return; }
    yield* z.out();
  }
}
// (G is moved by z.out through @gx / @gy; the defender's sheet is the enemy's 戦闘_敵_ one throughout)

// ---------- registering ----------
const MINE = {}; // film → its pictures (loaded while it swoops in)
const swoop0 = ComboDuel.prototype.swoopIn;
Object.assign(ComboDuel.prototype, {
  * swoopIn() {
    const film = this.cmdFilm;
    if (!film) return yield* swoop0.call(this);
    for (const p of [...MINE[film](), ...ZF_IMAGES, pic('Z2_味方カットイン.PNG'), pic('ZG_味方カットイン.PNG')]) img(p); // (the strips, the cut-ins)
    // the stage from the start, so that pattern 32 (src/anime_zfighters.js launch) brings the strips and the cut-in
    this.st = this.cmd = new CmdStage(this);
    yield* swoop0.call(this);
  },
  * cmdDamage21() { yield* damage(this, 21); },
  * cmdDamage22() { yield* damage(this, 22); },
  * cmdDamage41() { yield* damage(this, 41); },
  * cmdDamage43() { yield* damage(this, 43); },
  * cmdDamage44() { yield* damage(this, 44); },
  * cmdDamage48() { yield* damage(this, 48); },
  * cmdDamage82() { yield* damage(this, 82); },
});
Object.defineProperty(ComboDuel.prototype, 'cmdFilm', { get() { return FILM_OF[this.combo]; } });
const FILM_OF = {};
// { combo: [film, damage pattern] }; pics: film → () => [pictures]
function films(table, pics) {
  for (const [combo, [film, dmg]] of Object.entries(table)) { FILM_OF[combo] = film; addComboFilms({ [combo]: [film, `cmdDamage${dmg}`] }); }
  Object.assign(MINE, pics);
}

// the pictures every film may use (the stage's effects and backs)
const COMMON = [SPARK, KIRAN, ...Object.values(BOOM).map((b) => b[0]), ...Object.values(Z3).flatMap((x) => (typeof x === 'string' ? [x] : Object.values(x))),
  ...Object.values(Z2).flatMap((x) => (typeof x === 'string' ? [x] : Object.values(x))), SHISHIN_AURA, GENKI_FULL, ...KAME_SIDES, BURNING_BAR,
  ...Object.values(BLINK).flatMap((x) => Object.values(x))];


// ======================================================================================================
// 801 / 802 ダブル魔封波 (2901 比克＋龜仙人 / 2902 青年＋龜仙人, all.rb 110138 / 110529: one film, the partner and
// his colours told apart). The partner steps aside for 龜仙人 (back 128); 龜仙人 charges and dashes off, the
// partner flies in charging from the right; the camera swings back to both of them with the line between; they cast
// it; the enemy is caught in the whirl and thrown about, then sealed (damage 22).
// ======================================================================================================
const MAFUBA = { 801: [4, 1, 21, 24, 3], 802: [15, 3, 31, 29, null] }; // partner, his aura colour, his two poses, @ray_color at 521
Object.assign(ComboDuel.prototype, {
  * cmdMafuba() {
    const z = this.cmd, A = this.A, G = this.G, [partner, pc, t2a, t2b, c521] = MAFUBA[this.combo];
    const wake = 'rgb(188,188,188)';
    let tx = 0, ty = 0, rad = 0;
    for (;;) {
      const f = z.top();
      if (!z.tok && z.lead === partner) { // the partner steps aside, 龜仙人 comes on (back 128)
        if (f === 0) z.se('Z1 逃げる');
        if (f <= 60) { z.c1 = 24; if (z.cf <= 20) z.cf++; z.ax = -16; z.back(128); }
        if (f === 60) { z.ax = 0; z.chg = 24; A.x = TEC_CENTER_CHAX; z.tok = true; z.f = -1; }
      } else if (z.tok) {
        const bx = 228, by_ = 86;
        if (f === 0) { z.bf = 0; z.se('Z3 変身'); z.color = 0; z.otype = 1; z.pose(6); } else if (f <= 89) z.back(201, bx, by_);
        else if (f === 90) { z.seStop(); z.se('Z1 気を溜める'); z.pose(6); z.back(201, bx, by_); } else if (f <= 140) z.back(201, bx, by_);
        else if (f <= 180) { // he dashes off to the left, the line of his wake behind him
          z.ax = -12;
          z.back(201, bx - 12 * (f - 140), by_);
          z.fill(640 - 16 * (f - 140), 64, 6, 228, wake);
        } else if (f <= 220) { // the partner comes in from the right, charging
          if (f === 181) { z.seStop(); z.se('Z3 変身'); z.color = pc; }
          z.ax = 0;
          z.back(201, 708 - 12 * (f - 180), by_);
          z.c1 = 24; z.t1 = 6; z.c2 = partner; z.t2 = t2a;
          z.back(118, 730 - 12 * (f - 180), STANDARD_ENEY);
        } else if (f <= 360) {
          if (f === 271) { z.seStop(); z.se('Z1 気を溜める'); }
          z.back(201, 198 + 30, by_); z.bf--;
          z.back(118, 250, STANDARD_ENEY);
        } else if (f <= 469) { // the camera swings: 龜仙人 back from the left, the line between them
          if (f === 361) { z.seStop(); z.se('Z3 変身'); z.color = pc; z.se('Z1 気を溜める'); }
          const k = (f - 360) * 2;
          z.back(201, 228 + k, by_); z.bf--;
          z.back(118, 250 + k, STANDARD_ENEY); z.bf--;
          z.color = 0;
          z.back(201, -190 + k, 32 + 54); z.bf--;
          z.color = pc;
          z.back(116, -154 + k, STANDARD_ENEY);
          const nx = Math.min(320, f < 412 ? 4 * (f - 360) : 2 * (f - 412) + 4 * 52);
          z.fill(nx, 64, 6, 228, wake);
        } else if (f <= 520) {
          z.color = pc;
          z.back(201, 418 + 30, by_); z.bf--;
          z.back(118, 470, STANDARD_ENEY); z.bf--;
          z.color = 0;
          z.back(201, 30, 32 + 54); z.bf--;
          z.back(116, 66, STANDARD_ENEY);
          z.fill(320, 64, 6, 228, wake);
        } else if (f <= 610) { // 魔封波!
          if (f === 521) { z.eff = 0; z.seStop(); z.se('DB3 SE041'); }
          if (f === 551) { z.eff = 0; z.seStop(); z.se('DB3 SE103'); z.se('Z1 エネルギー波'); }
          if (f >= 551 && (f - 551 === 0 || f - 551 === 3)) z.flash();
          z.t1 = 5; z.t2 = t2b;
          if (f <= 550 && c521 != null) z.color = c521;
          z.back(118, 470, STANDARD_ENEY); z.bf--;
          z.color = 0;
          z.back(116, 66, STANDARD_ENEY);
          z.fill(320, 64, 6, 228, wake);
        } else { // 611-: the enemy in the whirl
          const g = f - 611 + 250;
          if (g === 250) { rad = 0; z.no = 0; z.displayOut(); }
          if (g === 270) { z.se('DB3 SE103'); z.bf = 0; z.bt = 54; }
          if (g >= 281 && g <= 340) { // swaying left and right
            if (g <= 284) z.flash();
            z.gpose(16);
            if (z.bt === 6) G.x += 12; else if (z.bt === 4) G.x -= 12;
            z.bf++;
            if (z.bf >= 3) { z.bf = 0; z.bt = { 54: 6, 56: 4, 6: 56, 4: 54 }[z.bt]; }
            if (g === 340) { tx = G.x; ty = G.y; }
          } else if (g >= 341 && g <= 347) G.x += 12;
          else if (g >= 348 && g <= 573) { // whirled round, one way then the other
            const s = g <= 460 ? 348 : 461;
            if (g <= s + 3) z.flash();
            if (g === s) { z.seStop(); z.se('Z1 エネルギー波'); }
            G.x = tx + Math.cos(rad) * 100; G.y = ty + Math.sin(rad) * 50;
            rad += g <= 460 ? 0.35 : -0.45;
          } else if (g >= 574 && g <= 753) { // thrown up to the left, then up to the right
            const s = g <= 663 ? 574 : 664, e = s === 574 ? 663 : 753;
            z.no = s === 574 ? 3 : 2;
            if (g <= s + 3) z.flash();
            if (g === s) { z.se('Z1 エネルギー波'); z.se('Z1 ゴー'); }
            z.gpose(17);
            if (s === 574) { G.x -= 16; G.y -= 16; } else { G.x += 24; G.y -= 24; }
            if (g === e) { if (s === 574) { G.x = 0; G.y = 360; } else { G.x = CENTER_ENEX; G.y = -180; } z.seStop(); }
          } else if (g >= 754 && g <= 800) { // down into the seal
            if (g <= 757) z.flash();
            if (g === 754) { z.se('Z1 エネルギー波2'); z.se('ZG 光線1'); }
            if (g === 800) z.f = 9998;
            z.no = 1;
            G.y += 24;
          }
        }
        if (f === 9999) return yield* z.finish();
      } else { z.tok = true; z.f = -1; }
      yield* z.out();
    }
  },
});
films({ 801: ['cmdMafuba', 22], 802: ['cmdMafuba', 22] }, { cmdMafuba: () => COMMON });

// ======================================================================================================
// 876 決死の超元気玉 (悟空・比克・悟飯・克林; 2976 all.rb 123856, and the Z2 switch's 1976 at 87752 for variable 40 = 1).
// (Somebody else leads: 悟空 walks in to take his place, back 115.) 悟空 raises his hands into the full 超元気玉 aura
// (back 129); the enemy charges in and 比克 drops in to knock it away (back 115); 悟飯 and 克林 fire two beams (effect
// 367); the enemy is hit (48, 104); 悟空 charges again — the ball goes up (Z3: his 超元気弾 picture, 1976: his own
// sprite) and comes down on the enemy (damage 48).
// ======================================================================================================
const BALL_DOWN = pic('Z2_戦闘_必殺技_デスボール(極大玉縦)(超元気玉).PNG'); // 640×250
const GENKI_THROW = [pic('FC風_GBZ2 超元気弾発動.PNG'), pic('FC風_GBZ2 超元気弾発動(ゴクウ：ボロボロ).png'), pic('FC風_GBZ2 超元気弾発動(悟空_バトルスーツ).png')]; // 256×124
Object.assign(ComboDuel.prototype, {
  * cmdGenkiKesshi() {
    const z = this.cmd, A = this.A, G = this.G, z2 = z.era === 1;
    const charge = () => { // 1 / 421: 悟空 with his hands up (1976: at TEC_CENTER_CHAX)
      z.color = 0; z.c1 = 4; z.c2 = 5; z.c3 = 6; z.chg = 3; z.otype = 1; z.pose(5);
      A.x = TEC_CENTER_CHAX - (z2 ? 0 : 10); A.y = STANDARD_CHAY;
    };
    for (;;) {
      const f = z.top();
      let rx = 340, ry = 200;
      const bx = 180 - 302, by_ = -4;
      if (!z.tok && z.lead !== 3) { // 悟空 walks in to take the lead's place
        z.c1 = 3;
        if (f === 0) z.se('Z1 逃げる');
        if (f <= 60) { if (z.cf <= 20) z.cf++; z.ax = -16; z.back(115, STANDARD_CHAX + Math.min(f, 21) * 16, STANDARD_CHAY); }
        if (f === 60) { z.ax = 0; z.chg = 3; A.x = TEC_CENTER_CHAX; z.tok = true; z.f = 0; }
      } else {
        if (f <= 1) {
          if (f === 1) z.se('Z2 気を溜める_元気弾');
          if (f === 1 || z2) charge();
        } else if (f <= 160) z.back(129, bx, by_);
        else if (f <= 250) { // the enemy rushes in, 比克 drops in from the top left and knocks it away
          const s = 161, k = f - (s + 5);
          if (f === s) { z.se('Z1 逃げる'); G.x = 640 + 32; G.y = STANDARD_CHAY; }
          if (k >= 0 && k <= 15) z.t1 = 16; else if (k >= 16 && k <= 20) z.t1 = 4; else if (k >= 41) z.t1 = 0;
          if (k >= 0) z.back(115, 24 * Math.min(k, 20), STANDARD_CHAY - 160 + 8 * Math.min(k, 20));
          if (f - s <= 20) G.x -= 12; else if (f - s <= 50) { G.x += 24; z.gpose(17); }
          if (f - s === 21) z.se('Z1 強打');
        } else if (f <= 280) { // 悟飯 above, 克林 below
          if (f === 251) { z.se(z.era >= 2 ? 'Z3 変身' : 'Z2 気を溜める'); z.color = 0; z.chg = 5; z.c2 = 6; }
          z.t2 = 2; z.pose(2);
          A.y = STANDARD_CHAY - 50;
          z.back(118, A.x, STANDARD_CHAY + 50);
        } else if (f <= 362) { // their two beams
          if (f === 281) { z.seStop(); z.se('DB3 エネルギー波2'); z.se('Z1 エネルギー波2'); }
          z.efp = 367; z.pose(3); z.t2 = 3;
          z.back(118, A.x, STANDARD_CHAY + 50);
        } else if (f === 363) { A.y = -120; z.fxReset(); }
        else if (f === 373) { G.y = STANDARD_ENEY; G.x = CENTER_ENEX; z.gpose(0); }
        else if (f >= 374 && f <= 398) { ry = 110; z.color = 0; z.efp = 48; }
        else if (f >= 399 && f <= 420) {
          if (f === 399) { z.eff = 0; z.eft = 0; z.efp = 104; z.se('Z1 爆発1'); z.gpose(16); }
          G.x += 16;
        } else if (f === 421) { // 悟空 again
          z.se('Z2 気を溜める_元気弾'); z.se('Z1 気を溜める4');
          z.efp = 0; z.bf = 0; z.bt = 0;
          charge();
        } else if (f >= 422 && f <= 580) z.back(129, bx, by_);
        else if (f >= 581 && f <= 750) { // the ball goes up
          const s = z2 ? 611 : 581;
          if (z2 && f === 581) z.pose(6);
          if (f === s) {
            if (z2) z.pose(1); else A.y = -200;
            z.se('Z1 ザー'); z.se('Z1 ゴー'); z.se('Z1 エネルギー波');
          }
          if (!z2) { const c = v(171); z.blt(GENKI_THROW[c === 1 || c === 2 ? 1 : c === 3 ? 2 : 0], 0, 0, 256, 124, 176, 112); }
          if (f >= s) z.blt(BALL_DOWN, 0, 0, 640, 250, (f - s) * RS / 2, -220 + Math.floor((f - s) * RS / 6));
        } else if (f === 751) z.fxReset();
        else if (f === 754) z.no = 1;
        else if (f === 755) { z.gpose(0); z.displayOut(); }
        else if (f >= 756 && f <= 820) { // and comes down on the enemy
          if (f === 756) { z.se('Z1 ザー'); z.se('Z1 ゴー'); z.se('Z1 エネルギー波'); }
          z.blt(BALL_DOWN, 0, 0, 640, 250, 0, -250 + Math.floor((f - 756) * RS / 6));
        } else if (f === 821) return yield* z.finish();
      }
      yield* z.out(rx, ry);
    }
  },
});
films({ 876: ['cmdGenkiKesshi', 48] }, { cmdGenkiKesshi: () => [...COMMON, BALL_DOWN, ...GENKI_THROW] });

// ======================================================================================================
// 877 自然を愛する者 (悟飯＋16號, 2977 all.rb 124081). 16號 flies in below 悟飯 (or 悟飯 above 16號: effects 89 / 90 / 92);
// 16號 vanishes — "!" over 悟飯 — and reappears holding the enemy on the shock-wave backdrop (back 1); 悟飯 charges
// (back 201, effects 237 / 235) and fires from his close-up (effect 333, the ZG side panels); the wave hits the enemy
// with 16號 still holding it (48), damage 44.
// ======================================================================================================
const SURPRISE = pic('戦闘アニメ_ビックリマーク.PNG');
const OYAKO_GOHAN = [pic('Z3_必殺技_親子カメハメ波(ゴハンのみ).png'), pic('Z3_必殺技_親子カメハメ波(ゴハンのみ)_赤道着.png')]; // 114×184
Object.assign(ComboDuel.prototype, {
  * cmdNature() {
    const z = this.cmd, A = this.A, G = this.G;
    const hold = () => { z.gx = z.f % 2 === 0 ? 4 : -4; }; // (the enemy shakes in 16號's grip)
    for (;;) {
      const f = z.top();
      let rx = 230, ry = 118;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 39) { // the other one flies in (16號 below / 悟飯 above)
        const g = z.lead === 18;
        z.c2 = g ? 23 : 18; z.efp = g ? 90 : 89;
        z.ay = f <= 10 ? (g ? -5 : 5) : 0;
      } else if (f <= 59) {
        if (z.lead === 23 && f === 40) A.y -= 100;
        z.chg = 18; z.c2 = 23; z.efp = 92;
      } else if (f <= 150) { // 16號 is gone at high speed; 悟飯 is surprised
        z.color = 0;
        if (f === 60) { z.efp = 0; z.se('Z1 高速移動'); }
        if (f === 90) { z.efp = 0; z.se('Z1 吹っ飛ぶ'); }
        if (f >= 90) z.blt(SURPRISE, 0, 0, 16, 16, A.x + 48, STANDARD_CHAY - 40);
        if (f <= 109 && f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, TEC_CENTER_CHAX + 6, STANDARD_CHAY + 76);
      } else if (f === 151) {
        G.y = STANDARD_ENEY; G.x = CENTER_ENEX; z.eff = 0; z.bars = false; z.se('Z1 高速移動'); A.y = -200; z.back(1);
      } else if (f <= 190) {
        if (f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, A.x + 10 + 110, 140);
        z.back(1);
      } else if (f <= 250) { // 16號 behind the enemy, holding it
        if (f === 191) z.chg = 23;
        z.back(1);
        z.otype = 1; z.pose(6);
        if (f === 193) { z.se('Z1 強打'); A.y = STANDARD_CHAY; }
        A.x = CENTER_ENEX + 16;
        hold();
      } else if (f <= 329) {
        if (f === 251) z.se('Z1 気を溜める2');
        z.back(1);
        z.pose(7);
        if (f === 329) z.bars = true;
      } else if (f === 330) { // 悟飯 charges
        A.y = STANDARD_CHAY; A.x = TEC_CENTER_CHAX; G.y = -200;
        z.chg = 18; z.se('Z3 変身'); z.otype = 1; z.pose(0); z.color = 0;
      } else if (f <= 457) z.back(201, 228, 88);
      else if (f <= 630) {
        const s = 458;
        if (f === s) z.se('Z1 気を溜める');
        if (f === s + 90) z.se('Z1 気を溜める3');
        z.otype = 1; z.pose(17);
        z.back(201, 228, 88);
        if (f === s) z.efp = 237;
        if (f < s + 90) { rx = 276; ry = 164; }
        if (f === s + 90) z.efp = 235;
        if (f >= s + 90) { rx = 268; ry = 156; }
      } else if (f <= 728) { // his close-up, the wave from his hands
        z.color = 0;
        z.cut = false; z.no = 4;
        if (f === 631) { z.seStop(); z.se('ZG 光線1'); }
        A.y = -200;
        z.blt(OYAKO_GOHAN[v(172) === 2 ? 1 : 0], 0, 0, 114, 184, 278, 122);
        z.efp = 333;
      } else if (f === 729) { z.cut = true; z.fxReset(); z.no = 0; z.displayOut(); }
      else if (f <= 756) { // the wave on the enemy, 16號 still holding it
        if (f === 730) { z.chg = 23; A.y = STANDARD_CHAY; A.x = CENTER_ENEX + 16; z.otype = 1; z.pose(6); }
        hold();
        z.efp = 48;
      } else if (f === 757) { A.y = -200; return yield* z.finish(); }
      yield* z.out(rx, ry);
    }
  },
});
films({ 877: ['cmdNature', 44] }, { cmdNature: () => [...COMMON, SURPRISE, ...OYAKO_GOHAN] });

// ======================================================================================================
// 879 スーパーどどはめは (雅木茶・天津飯・餃子, 2979 all.rb 124280). The other two fly in (backs 116 / 118: 雅木茶 in
// front, 天津飯 above or 餃子 below as the lead moves out of their way), 雅木茶 in the middle with 天津飯 above and 餃子
// below, three auras (back 201), one huge wave (effect 295), then on the enemy (48), damage 44.
// ======================================================================================================
Object.assign(ComboDuel.prototype, {
  * cmdSuperDodohame() {
    const z = this.cmd, A = this.A;
    const go = 212 + 24, bx = TEC_CENTER_CHAX - 34, by_ = STANDARD_CHAY - 24;
    const trio = (auras) => { // 雅木茶 (the member) in the middle, 天津飯 above, 餃子 below, each with an aura
      if (auras) { z.back(201, bx, by_); z.bf--; z.back(201, bx - 44, by_ - 64); z.bf--; }
      z.back(116, go, STANDARD_CHAY - 64);
      if (auras) { z.bf--; z.back(201, bx - 44, by_ + 64); z.bf--; }
      z.back(118, go, STANDARD_CHAY + 64);
    };
    for (;;) {
      const f = z.top();
      z.color = 0;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 39) { // the other two fly in; the lead makes way (餃子 down, 天津飯 up)
        const x = STANDARD_CHAX + f * 8;
        if (z.lead === 9 || z.lead === 8) {
          if (f < 16) { z.ax = -2; z.ay = z.lead === 9 ? 4 : -4; } else { z.ax = 0; if (f > 16) z.ay = 0; }
          z.c1 = 7; z.c2 = z.lead === 9 ? 8 : 9;
          z.back(116, x + 16, STANDARD_CHAY);
          z.back(118, x - 14, STANDARD_CHAY + (z.lead === 9 ? -64 : 64));
        } else {
          z.c1 = 8; z.c2 = 9;
          z.back(116, x - 14, STANDARD_CHAY - 64);
          z.back(118, x - 14, STANDARD_CHAY + 64);
        }
      } else if (f <= 59) {
        z.ax = 0; z.ay = 0; z.chg = 7; z.c1 = 8; z.c2 = 9; A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY;
        trio(false);
      } else if (f <= 189) {
        if (f === 60) { z.se('Z1 気を溜める'); z.otype = 1; z.pose(2); }
        trio(true);
      } else if (f <= 299) { // the wave
        if (f === 190) { z.seStop(); z.se('Z1 エネルギー波'); z.se('Z1 怪光線'); z.pose(3); z.t1 = 5; z.t2 = 1; z.efp = 295; }
        trio(false);
      } else if (f === 300) { z.efp = 0; z.displayOut(); }
      else if (f === 301) { z.eff = 0; z.efp = 0; }
      else if (f <= 328) z.efp = 48;
      else if (f === 329) return yield* z.finish();
      yield* z.out(348, 70);
    }
  },
});
films({ 879: ['cmdSuperDodohame', 44] }, { cmdSuperDodohame: () => COMMON });

// the lead's intro in many films (0-60): he steps aside to the left while `id` comes on in front of him (back 128,
// @scombo_cha1), then the member is drawn as `id` in the middle and the film starts again from frame 0
function aside(z, f, id) {
  if (f === 0) z.se('Z1 逃げる');
  if (f <= 60) { z.c1 = id; if (z.cf <= 20) z.cf++; z.ax = -16; z.back(128); }
  if (f === 60) { z.ax = 0; z.chg = id; z.d.A.x = TEC_CENTER_CHAX; z.tok = true; z.f = -1; }
}

// ======================================================================================================
// 800 流派を超えた連携 (2900 餃子＋龜仙人, all.rb 63230). 餃子 leading steps aside for 龜仙人. 龜仙人 charges and
// throws the energy liquid (effect 283 / 44), the enemy is held and shaken (超能力); 餃子 charges a どどん波 ball
// (237 → 235), fires it (his picture, effect 295), and it hits (297; damage 43).
// ======================================================================================================
const DODON_CHAOZU = pic('Z3_必殺技_どどん波(チャオズ1).png');
Object.assign(ComboDuel.prototype, {
  * cmdRyuha() {
    const z = this.cmd, A = this.A, G = this.G;
    for (;;) {
      const f = z.top();
      let rx = 340, ry = 150;
      if (!z.tok && z.lead === 9) aside(z, f, 24);
      else if (z.tok) {
        const bx = 218, by_ = 88; // ($btl_progress 2: back 201)
        if (f === 0) { z.se('Z3 変身'); z.bf = 0; z.otype = 1; z.pose(4); z.color = 1; } else if (f <= 89) z.back(201, bx, by_);
        else if (f === 90) { z.pose(5); z.seStop(); z.se('DB3 エネルギー波1'); z.efp = 283; } else if (f <= 128) { /* the liquid flies */ } else if (f === 129) z.fxReset();
        else if (f === 139) { z.fxReset(); G.x = CENTER_ENEX; G.y = STANDARD_ENEY; A.y = -200; } else if (f >= 140 && f <= 166) z.efp = 44;
        else if (f >= 167 && f <= 266) { // 餃子's 超能力 holds the enemy
          if (f === 167) { z.se('DB3 SE091'); z.efp = 0; }
          z.gx = (f - 167) % 2 === 0 ? 6 : -6;
          if (f === 266) { z.gx = 0; z.f = 300; }
        } else if (f >= 301 && f <= 9000) {
          const g = f - 301;
          rx = 306; ry = 94;
          if (g === 0) { A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY; G.y = -200; z.chg = 9; z.se('Z3 変身'); z.otype = 1; z.pose(0); z.color = 0; } else if (g <= 199) {
            z.back(201, 228, 88);
            rx = 290; ry = 132;
            const h = g - 1;
            if (h >= 30 && h <= 74) { if (h === 30) z.se('Z1 気を溜める'); z.pose(7); z.efp = 237; } else if (h >= 75) { rx -= 8; ry -= 16; z.efp = 235; }
          } else if (g === 200) { z.seStop(); z.fxReset(); A.y = -200; z.se('Z1 エネルギー波2'); } else if (g <= 310) { z.blt(DODON_CHAOZU, 0, 0, 192, 168, 120, 90); z.efp = 295; }
          else if (g === 311) { z.fxReset(); z.displayOut(); } else if (g >= 321 && g <= 347) { ry = 132; z.efp = 297; if (g === 347) z.f = 9998; }
        }
        if (f === 9999) return yield* z.finish();
      } else { z.tok = true; z.f = -1; }
      yield* z.out(rx, ry);
    }
  },
});
films({ 800: ['cmdRyuha', 43] }, { cmdRyuha: () => [...COMMON, DODON_CHAOZU] });

// `g` in any of the inclusive ranges [a, b, a, b, …]
const inR = (g, ...r) => { for (let i = 0; i < r.length; i += 2) if (g >= r[i] && g <= r[i + 1]) return true; return false; };

// ======================================================================================================
// 803 勇氣龜派氣功 / スピリッツかめはめ波 (2903 超悟空＋超巴達克, all.rb 63281). The other one flies in beside the
// lead (effect 90 / 89), both charge blue (back 201 ×2, back 118); 悟空 flies off, 巴達克 punches the enemy away,
// 悟空 strikes it back, 巴達克 drives it down and up (vertical strips); both charge again, the one-picture
// kamehameha (by variable 171: 悟空's clothes, strips 4) and the hit (365; damage 44).
// ======================================================================================================
const OYAKO = [pic('Z3_必殺技_親子カメハメ波_悟空通常、バーダック.png'), pic('Z3_必殺技_親子カメハメ波_悟空ボロボロ、バーダック.png'),
  pic('Z3_必殺技_親子カメハメ波_悟空さらにボロボロ、バーダック.png'), pic('Z3_必殺技_親子カメハメ波_悟空バトルスーツ、バーダック.png')];
Object.assign(ComboDuel.prototype, {
  * cmdSpirits() {
    const z = this.cmd, A = this.A, G = this.G;
    let tx = 0, ty = 0;
    const charge = () => { // both charging (back 201 above and below on one counter, the partner on back 118)
      z.color = 3;
      z.back(201, 234, 146); z.bf--;
      z.back(201, 234, 46); z.bf--;
      z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
    };
    const held = () => { // the enemy shaking as it is driven down (@temp_enex / @temp_eney)
      if (tx !== 0) { G.y = ty; G.x = tx; }
      const [sx, sy] = shake(4);
      G.y += 16; ty = G.y; tx = G.x; G.x += sx; G.y += sy;
      z.gpose(16);
    };
    for (;;) {
      const f = z.top();
      let rx = 340, ry = 200;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); } else if (f <= 39) {
        if (z.lead === 14) { z.c2 = 32; z.efp = 90; z.ay = f <= 10 ? -5 : 0; } else if (z.lead === 32) { z.c2 = 14; z.efp = 89; z.ay = f <= 10 ? 5 : 0; }
      } else if (f <= 59) {
        if (z.lead === 32 && f === 40) A.y -= 100;
        z.chg = 14; z.c2 = 32; z.efp = 92;
      } else if (f === 60) { z.se('Z3 変身'); z.se('Z1 気を溜める'); z.color = 3; } else if (f <= 187) {
        z.efp = 0; z.eff = 0; z.pose(0); z.t2 = 4;
        charge();
      } else if (f <= 240) { // 悟空 flies off up, 巴達克 off to the right
        const g = f - 188;
        if (g === 0) { z.seStop(); z.se('Z1 飛ぶ'); }
        z.otype = 0; z.pose(16); z.t2 = 3;
        A.y -= 16;
        z.back(118, TEC_CENTER_CHAX + g * 24, STANDARD_CHAY + 50 - g * 4);
      } else if (f <= 259) { // 巴達克 flies in at the enemy
        const g = f - 241;
        if (g === 0) { z.se('Z1 飛ぶ'); G.x = CENTER_ENEX; G.y = STANDARD_ENEY; z.chg = 32; z.otype = 1; z.pose(3); A.x = -176; A.y = STANDARD_CHAY + 72; }
        A.x += 24; A.y -= 4;
        if (g === 18) z.otype = 0;
      } else if (f <= 298) { // the punches
        const g = f - 260;
        if (g === 0) z.se('Z1 強打');
        if (inR(g, 7, 10, 15, 18, 23, 26, 31, 34)) { A.x += 2; z.pose(1); } else if (inR(g, 11, 14, 19, 22, 27, 30, 35, 38)) { A.x += 2; z.pose(2); }
        if (g <= 3) { G.x += 16; G.y -= 4; z.gpose(16); } else if (g <= 6) { G.x -= 16; G.y += 4; } else G.x += 2;
        if (g >= 7 && g <= 35 && (g - 7) % 4 === 0) z.se('Z1 打撃');
      } else if (f <= 329) { // 巴達克 knocks it away to the right
        const g = f - 299;
        if (g === 0) z.se('Z1 飛ぶ');
        if (g <= 8) { A.x -= 16; z.pose(16); } else if (g <= 12) { A.x += 24; z.otype = 1; z.pose(8); } else if (g === 13) { A.x += 24; z.se('ZG 打撃4'); }
        if (g >= 13 && g <= 30) { G.x += 24; z.gpose(17); }
      } else if (f <= 388) { // 悟空 comes in from the right and strikes it back
        const g = f - 330;
        if (g === 0) { G.x = -200; A.x = 640; A.y = STANDARD_CHAY; z.otype = 1; z.chg = 14; }
        if (g >= 16 && g <= 23) { A.x -= 18; z.pose(10); } else if (g >= 24 && g <= 25) { A.x -= 18; z.pose(11); } else if (inR(g, 34, 37, 42, 45, 50, 53)) { A.x -= 2; z.pose(14); } else if (inR(g, 30, 33, 38, 41, 46, 49, 54, 58)) { A.x -= 2; z.pose(15); }
        if (g <= 24) G.x += 24; else if (g === 25) { G.x += 24; z.gpose(16); } else G.x -= 2;
        if (g === 25) z.se('Z1 強打'); else if (g >= 30 && g <= 54 && (g - 30) % 4 === 0) z.se('Z1 打撃');
      } else if (f <= 439) { // …and up, off to the top left
        const g = f - 389;
        if (g === 0) z.se('Z1 飛ぶ');
        if (g <= 8) { A.x += 16; A.y += 8; z.pose(16); } else if (g <= 12) { A.x -= 24; A.y -= 14; z.pose(12); } else if (g === 13) { A.x -= 24; A.y -= 16; z.se('ZG 打撃4'); } else if (g >= 29) { A.y -= 24; z.pose(16); }
        if (g >= 13) { G.x -= 24; G.y -= 8; z.gpose(17); }
        if (g === 13) z.se('ZG 打撃4'); else if (g === 29) z.se('Z1 飛ぶ');
      } else if (f <= 500) { // vertical strips: 巴達克 from the top, the enemy driven down
        const g = f - 440;
        if (g === 0) { z.no = 1; G.x = 640; G.y = 100; A.x = TEC_CENTER_CHAX; A.y = -100; z.otype = 1; z.chg = 32; z.pose(9); }
        if (g >= 16) A.y += 16;
        if (g <= 15) { G.x -= 24; G.y -= 8; ty = 0; tx = 0; } else held();
        if (g === 16) { z.se('Z1 飛ぶ'); z.se('Z1 強打'); }
      } else if (f <= 550) {
        const g = f - 501;
        if (g === 0) { z.no = 1; G.y = -20; G.x = tx; tx = 0; ty = 0; A.x = TEC_CENTER_CHAX; A.y = -100; z.otype = 1; z.chg = 32; z.pose(9); }
        if (g <= 4) A.y += 16; else if (g <= 8) { A.y += 48; A.x -= 24; z.otype = 0; z.pose(16); } else if (g === 9) A.x += 32;
        else if (g === 10) { A.x += 32; z.otype = 1; z.pose(10); } else if (g >= 26) { A.y -= 32; A.x -= 8; z.otype = 0; z.pose(16); }
        if (g <= 9) held(); else if (g <= 30) { z.gpose(17); G.x += 16; G.y -= 24; }
        if (g === 5) z.se('Z1 飛ぶ'); else if (g === 10) z.se('ZG 打撃2'); else if (g === 26) z.se('Z1 飛ぶ');
        if (f === 550) z.no = 0;
      } else if (f <= 677) { // both charge again
        if (f === 551) { G.y = -200; A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY - 50; z.otype = 1; z.chg = 14; z.pose(0); z.c2 = 32; z.t2 = 4; z.se('Z3 変身'); z.se('Z1 気を溜める'); }
        charge();
      } else if (f <= 794) { // the one-picture kamehameha
        if (f === 678) { A.y -= 200; z.eff = 0; z.eft = 0; z.cut = false; z.rt = 0; z.rf = 0; z.no = 4; z.color = 3; z.se('Z1 大猿'); z.se('ZG 光線1'); z.se('Z1 エネルギー波'); }
        const n = v(171);
        z.blt(OYAKO[n >= 0 && n <= 3 ? n : 0], 0, 0, 326, 352, 140, -6);
        z.efp = 366; rx = 266; ry = 60;
      } else if (f === 795) { z.cut = true; z.fxReset(); z.no = 0; z.displayOut(); } else if (f <= 822) z.efp = 365;
      else if (f === 823) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 803: ['cmdSpirits', 44] }, { cmdSpirits: () => [...COMMON, ...OYAKO] });

// the 気円斬 disc wobbling round on its frame `g` from the base frame (kien_mawarikata: 10-24 and 26-40 one turn each)
const KIEN_X = [0, 4, 7, 9, 10, 9, 7, 4, 0, -4, -7, -9, -10, -9, -7, -4], KIEN_Y = [0, 1, 3, 6, 10, 14, 17, 19, 20, 19, 17, 14, 10, 6, 3, 1];
function kienSpin(g, kx = -6, ky = 2) {
  const k = g >= 10 && g <= 24 ? g - 9 : g >= 26 && g <= 40 ? g - 25 : 0;
  return [kx * KIEN_X[k], -ky * KIEN_Y[k]];
}
const BOOM3 = pic('戦闘アニメ_爆発3.PNG');

// ======================================================================================================
// 807 俺たちに不可能はない (2907 超悟空＋超貝吉塔, all.rb 63349). 貝吉塔 leading steps aside for 悟空. 悟空 charges a
// ball (237 → 235); the enemy dashes in; 貝吉塔 (corner strips) spins a 気円斬 and throws it, it cuts the enemy
// (爆発3); 悟空's ball flies after it, the screen flashes white / skin / orange and the enemy twinkles away (124;
// damage 44).
// ======================================================================================================
Object.assign(ComboDuel.prototype, {
  * cmdImpossible() {
    const z = this.cmd, A = this.A, G = this.G;
    const C1 = '#fff', C2 = 'rgb(255,216,160)', C3 = 'rgb(255,120,48)';
    for (;;) {
      const f = z.top();
      let rx = 300, ry = 162;
      if (!z.tok && z.lead === 19) aside(z, f, 14);
      else if (z.tok) {
        rx = 340; ry = 96;
        if (f === 0) { z.bf = 0; z.se('Z3 変身'); z.color = 0; z.otype = 1; } else if (f <= 129) z.back(201, 228, 86);
        else if (f === 130) { z.seStop(); z.se('Z1 気を溜める2'); z.pose(18); } else if (f <= 210) { rx = 280; ry = 132; z.color = 0; z.efp = 237; }
        else if (f <= 290) { rx = 272; ry = 124; z.efp = 235; } else if (f <= 305) { // the enemy dashes in
          const g = f - 291;
          rx = 272; ry = 124;
          if (g === 0) { G.x = 640; G.y = STANDARD_ENEY; z.se('DB3 ダッシュ'); } else if (g === 14) z.efp = 0;
          G.x -= 12;
        } else if (f <= 335) { // 貝吉塔
          if (f === 306) { z.c1 = 19; z.t1 = 3; G.y = -200; A.y = -200; z.no = 2; }
          z.back(116, TEC_CENTER_CHAX, STANDARD_CHAY);
        } else if (f <= 430) { // his 気円斬, spinning, then thrown up to the right
          const g = f - 336;
          if (g === 0) z.se('ZG 気円斬');
          let [kx, ky] = kienSpin(g);
          kx += 244; ky += 80;
          if (g >= 50) {
            if (g === 50) { z.seStop(); z.se('Z1 気円斬'); }
            ky -= 16 * (g - 50); kx += 16 * (g - 50);
            z.t1 = 10;
          }
          z.back(116, TEC_CENTER_CHAX, STANDARD_CHAY);
          z.blt(Z3.kien, 0, 30 * 4, 126, 30, kx, ky);
          if (f === 430) z.no = 0;
        } else if (f <= 490) { // the disc cuts the enemy
          const g = f - 431;
          if (g === 0) { z.efp = 235; G.y = STANDARD_ENEY; A.y = STANDARD_CHAY; }
          rx = 272; ry = 124;
          z.blt(Z3.kien, 0, 30 * 4, 126, 30, 16 * g + 234, -16 * g + 300);
          if (g <= 7) G.x -= 12;
          else {
            if (g === 8) { z.seStop(); z.se('ZG SE040'); z.bf = 0; z.bt = 0; }
            G.x += 16;
            z.gpose(16);
            const k = z.bt;
            if (z.bf >= 10) { z.bt++; z.bf = 0; } else z.bf++;
            z.blt(BOOM3, k * 112, 0, 112, 120, 402, 112);
          }
        } else if (f <= 560) { // 悟空 throws his ball
          const g = f - 491;
          if (g === 0) { z.seStop(); z.se('Z1 エネルギー波'); }
          z.pose(7);
          rx = 350 + g * 12; ry = 144;
        } else if (f === 561) z.efp = 0;
        else if (f === 570) { z.fxReset(); z.no = 0; z.displayOut(); } else if (f >= 571 && f <= 606) {
          if (f === 571) z.se('Z1 エネルギー波');
          z.efp = 235; rx = -64 + (f - 571) * 12; ry = 144;
        } else if (f >= 607 && f <= 636) { rx = 356; ry = 144; } else if (f >= 637 && f <= 666) {
          if (f === 637) { z.seStop(); z.se('Z1 SE102'); }
          rx = 364; ry = 152; z.efp = 237;
        } else if (f >= 667 && f <= 696) z.efp = 0;
        else if (f >= 697 && f <= 757) { // the flashes
          const g = f - 697;
          if (g === 0) { z.seStop(); z.se('DB3 気を溜める2'); }
          if (inR(g, 1, 4, 17, 20, 33, 36, 50, 53)) z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_ON, C1);
          else if (inR(g, 5, 8, 21, 24, 37, 37, 54, 57)) z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_ON, C2);
          else if (inR(g, 9, 12, 25, 28, 42, 45, 58, 61)) z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_ON, C3);
        } else if (f >= 758 && f <= 787) {
          if (f === 758) { z.seStop(); z.se('DB3 キラーン'); z.efp = 124; z.eff = 0; z.eft = 0; }
          rx = CENTER_ENEX + 48; ry = STANDARD_CHAY + 24;
        } else if (f === 788) return yield* z.finish();
      } else { z.tok = true; z.f = -1; }
      yield* z.out(rx, ry);
    }
  },
});
films({ 807: ['cmdImpossible', 44] }, { cmdImpossible: () => COMMON });

// the two-member intro of many films (1-59): `main` ends up the member, up there, `other` below him (effects 90 / 89 /
// 92: whichever of them leads rises or sinks while the other flies in)
function pairIn(z, f, main, other) {
  const A = z.d.A;
  if (f <= 39) {
    const m = z.lead !== other;
    z.c2 = m ? other : main; z.efp = m ? 90 : 89;
    z.ay = f <= 10 ? (m ? -5 : 5) : 0;
  } else {
    if (z.lead === other && f === 40) A.y -= 100;
    z.chg = main; z.c2 = other; z.efp = 92;
  }
}

// ======================================================================================================
// 808 ダブルロイヤルアタック (2908 超貝吉塔＋餃子, all.rb 111760). 餃子 below 貝吉塔 (pairIn); both charge (back 201 blue /
// white, 餃子 on back 118, his ball 237 → 235); their close-ups slide in (ファイナルフラッシュ and どどん波) and fire the
// two half-round waves; on the enemy (369), damage 44.
// ======================================================================================================
const FF_VEGETA = pic('ZG_必殺技_ファイナルフラッシュ(発動)_ベジータ.PNG'), DODON1 = pic('Z3_必殺技_どどん波(チャオズ1).png');
const HALF_ZG = pic('ZG_戦闘_必殺技_エネルギー波_半円.PNG'), HALF_ZG_BLUE = pic('ZG_戦闘_必殺技_エネルギー波_半円(青).PNG');
Object.assign(ComboDuel.prototype, {
  * cmdRoyalAttack() {
    const z = this.cmd, A = this.A, wake = 'rgb(188,188,188)';
    for (;;) {
      const f = z.top();
      let rx = 340, ry = 200;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 19, 9);
      else if (f <= 259) { // both charge
        const g = f - 60;
        if (g === 0) { z.se('Z3 変身'); z.otype = 1; z.pose(12); }
        z.color = 3; z.back(201, 228, 88 - 50); z.bf--;
        z.color = 0; z.back(201, 228, 88 + 50); z.bf--;
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
        rx = 290; ry = 132 + 50;
        if (g >= 30 && g <= 74) { if (g === 30) { z.se('Z1 気を溜める'); z.se('Z1 気を溜める6'); } z.t2 = 7; z.efp = 237; }
        else if (g >= 75) { rx -= 8; ry -= 16; z.efp = 235; }
      } else if (f <= 290) { // their close-ups slide in
        const g = f - 260, x = 16 * g;
        if (g === 0) { z.seStop(); z.efp = 0; A.y = -200; }
        z.blt(FF_VEGETA, 0, 8, 232, 116, 640 - x, 62);
        z.blt(DODON1, 24, 28, 160, 112, 640 + 72 - x - 50, 60 + 134 - 14);
        z.fill(0, 62 + 116, 640, 4, wake);
      } else if (f <= 380) { // and fire
        const g = f - 291;
        if (g === 0) { z.seStop(); z.se('ZG 光線1'); z.se('Z1 エネルギー波2'); }
        z.blt(FF_VEGETA, 0, 8, 232, 116, 160, 62);
        z.blt(DODON1, 24, 28, 160, 112, 232 - 50, 60 + 134 - 14);
        z.blt(HALF_ZG_BLUE, 0, 0, g * 16, 116, 232 + 160 - 48, 62);
        z.blt(HALF_ZG, 0, 0, g * 16, 102, 232 + 160 - 48, 128 + 62);
        z.fill(0, 62 + 116, 640, 4, wake);
      } else if (f === 390) { z.displayOut(); z.eff = 0; z.eft = 0; }
      else if (f >= 391 && f <= 415) { ry = 110; z.efp = 369; }
      else if (f === 416) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 808: ['cmdRoyalAttack', 44] }, { cmdRoyalAttack: () => [...COMMON, FF_VEGETA, DODON1, HALF_ZG, HALF_ZG_BLUE] });

// ======================================================================================================
// 810 やっぱり息の合う二人 (2910 雅木茶＋青年, all.rb 111920). 青年 below 雅木茶 (pairIn); both vanish (back 48); the
// double 狼牙風風拳 on the enemy (effect 332) knocks it down; they leap at it from both sides (back 118) and fire the two
// half-round waves at each other through it (damage 44).
// ======================================================================================================
Object.assign(ComboDuel.prototype, {
  * cmdIkiGaau() {
    const z = this.cmd, A = this.A, G = this.G, wake = 'rgb(188,188,188)';
    let x2 = 0; // @scom2x
    for (;;) {
      const f = z.top();
      let [rx, ry] = f <= 500 ? [325, 70] : [340, 200];
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 7, 15);
      else if (f <= 100) { // both gone at high speed
        A.y = -120; z.efp = 0;
        if (f === 60) z.se('Z1 高速移動');
        z.back(48, TEC_CENTER_CHAX + 6, STANDARD_CHAY + 76); z.bf--;
        z.back(48, TEC_CENTER_CHAX + 6, STANDARD_CHAY + 76 - 100);
      } else if (f === 110) {
        z.eff = 0; G.x = CENTER_ENEX; G.y = STANDARD_ENEY; z.chg = 7; A.x = CENTER_CHAX + 16; z.otype = 0; z.pose(0);
        z.c2 = 15; z.t2 = 19; z.se('Z1 逃げる'); z.displayOut();
      } else if (f >= 111 && f <= 202) z.efp = 332;
      else if (f >= 203 && f <= 220) { if (f === 203) z.se('ZG 打撃4'); G.y += 16; z.gpose(17); }
      else if (f >= 221 && f <= 274) { // they leap in from both sides
        if (f === 221) { x2 = A.x + 134; A.y = STANDARD_CHAY; z.se('Z1 飛ぶ'); }
        if (f === 261) { z.t2 = 32; z.otype = 1; z.pose(14); A.y = -104; A.x = 294 - 72; x2 = 320; }
        z.efp = 0;
        A.x += 20; A.y += 16; x2 -= 20;
        if (f <= 260) z.t2 = 19;
        z.back(118, x2, A.y);
        if (f >= 261) z.fill(320, 64, 6, 228, wake);
      } else if (f >= 275 && f <= 339) { // the two waves
        const g = f - 275, t = Math.min(12, g);
        if (g === 0) { z.t2 = 33; z.otype = 1; z.pose(15); z.se('DB3 SE041'); z.se('DB3 SE041'); z.se('Z1 エネルギー波2'); z.se('DB3 エネルギー波2'); }
        z.back(118, x2, A.y);
        z.blt(HALF_ZG_BLUE, 0, 0, t * 16, 128, 128, 98);
        z.blt(HALF_ZG, 700 - t * 16, 128, t * 16, 128, 640 - 124 - t * 16, 98);
        z.fill(320, 64, 6, 228, wake);
      } else if (f === 340) { z.displayOut(); G.x = CENTER_ENEX - 56; z.eff = 0; z.eft = 0; }
      else if (f >= 341 && f <= 361) {
        const t = f - 341;
        z.blt(HALF_ZG_BLUE, 0, 128, 700, 128, -700 + t * 16, 98);
        z.blt(HALF_ZG, 0, 0, t * 16, 128, 640 - t * 16, 98);
      } else if (f === 362) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 810: ['cmdIkiGaau', 44] }, { cmdIkiGaau: () => [...COMMON, HALF_ZG, HALF_ZG_BLUE] });

// ======================================================================================================
// 811 足元がお留守だぜ！ (2911 比克＋雅木茶, all.rb 112088). 雅木茶 below 比克 (pairIn); 雅木茶 vanishes while 比克 charges
// green; 比克's 激烈光弾 close-up (235 → 252); 雅木茶's 狼牙風風拳 on the shock-wave backdrop (effect 39), the flurry,
// the kick up; 比克 and 雅木茶 fire half-round waves at the enemy from both sides (damage 44).
// ======================================================================================================
const GEKIRETSU_P = pic('Z3_必殺技_激烈光弾(ピッコロ).png'), YAMCHA_CLOSE = pic('DB3_ヤムチャ(Z3化).PNG');
const HALF_ZG_GREEN = pic('ZG_戦闘_必殺技_エネルギー波_半円(緑).PNG');

// 2911 / 2913 (frames 404 / 244 on, `g` from there): 雅木茶 hits the enemy back and forth, flickers in his close-up,
// then the flurry (poses 1-4 every 4 frames, the enemy jolted by @gx) and `last(g)` for the final blow (g 180-204)
function yamchaRush(z, g, f, last) {
  const A = z.d.A, R = 124, K = 4, hit = (...ks) => ks.some((k) => g === R + K * k);
  if (g === 0) { z.se('Z1 強打'); z.gpose(16); }
  if (g <= 9) z.gx = -16; else if (g <= 19) z.gx = 16; else if (g === 20) { z.gx = 0; z.gpose(0); }
  else if (g === 50) { z.efp = 0; z.se('DB3 狼牙風風拳'); z.pose(0); }
  else if (g >= 51 && g <= 120) { if (f % 2 === 0) { z.blt(YAMCHA_CLOSE, 0, 0, 64, 64, A.x + 16, STANDARD_CHAY + 24); A.y = -200; } else A.y = STANDARD_CHAY; }
  else if (g === 121) A.y = STANDARD_CHAY;
  else if (hit(0, 6, 8)) { z.otype = 0; z.gpose(16); z.pose(1); z.se('Z1 打撃'); }
  else if (hit(1, 5, 10, 12)) { z.pose(4); z.se('Z1 打撃'); }
  else if (hit(2, 4, 9, 13)) { z.pose(3); z.se('Z1 打撃'); }
  else if (hit(3, 7, 11)) { z.pose(2); z.se('Z1 打撃'); }
  else if (g >= R + K * 14 && g <= R + K * 20) last(g);
  if (g >= R && g <= R + K * 13 + 3) z.gx = (g - R) % K <= 1 ? -8 : 8;
}
Object.assign(ComboDuel.prototype, {
  * cmdAshimoto() {
    const z = this.cmd, A = this.A, G = this.G, wake = 'rgb(188,188,188)';
    for (;;) {
      const f = z.top();
      let [rx, ry] = f <= 500 ? [325, 70] : [340, 200];
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 4, 7);
      else if (f <= 149) { // 雅木茶 gone, 比克 charges
        if (f === 60) { z.efp = 0; z.se('Z1 高速移動'); z.se('Z3 変身'); z.color = 1; z.otype = 1; z.pose(13); }
        z.back(201, 234, -18 + 54 + 50 - 50);
        if (f <= 109 && f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, TEC_CENTER_CHAX + 6, STANDARD_CHAY + 76);
      } else if (f <= 310) { // 比克's close-up, the ball
        const s = 150;
        z.blt(GEKIRETSU_P, 0, 0, 218, 230, 190, 66);
        if (f === s) { A.y = -160; z.small = true; z.seStop(); }
        if (f >= s + 90) { z.efp = 252; rx = 322 - 16; ry = 164 - 16; if (f === s + 90) z.rt = 0; }
        else if (f >= s + 30) { z.efp = 235; rx = 322; ry = 164; if (f === s + 30) z.se('Z1 気を溜める2'); }
      } else if (f === 311) {
        z.fxReset(); z.chg = 7; A.y = -200; A.x -= 26; z.bars = false; z.se('Z1 逃げる'); G.x = CENTER_ENEX; G.y = STANDARD_ENEY;
      } else if (f <= 403) { z.back(1); z.efp = 39; }
      else if (f <= 584) { // the flurry on the enemy, then the kick
        z.back(1);
        yamchaRush(z, f - 404, f, (g) => { z.otype = 0; z.pose(4); if (g === 124 + 4 * 14) z.se('ZG 打撃3'); z.gpose(17); });
      } else if (f <= 589) { z.gx = 0; A.x += 20; }
      else if (f <= 593) { if (f === 592) { z.otype = 1; z.pose(12); } if (f >= 592) A.x += 16; }
      else if (f <= 605) { if (f === 594) { z.se('ZG 打撃6'); z.otype = 1; z.pose(15); } G.x -= 12; G.y -= 16; }
      else if (f <= 629) { if (f === 606) { z.se('Z1 飛ぶ'); z.otype = 1; z.pose(12); } A.x += 8; A.y -= 24; G.x -= 12; G.y -= 16; }
      else if (f <= 694) { // the two waves
        const g = f - 630, t = Math.min(12, g);
        if (g === 0) { z.chg = 4; z.t2 = 15; z.otype = 1; z.pose(14); A.x = 40; A.y = STANDARD_CHAY; z.se('Z1 エネルギー波2'); z.se('DB3 エネルギー波2'); }
        z.back(118, 640 - 138, A.y);
        z.blt(HALF_ZG_GREEN, 0, 0, t * 16, 128, 128, 98);
        z.blt(HALF_ZG, 700 - t * 16, 128, t * 16, 128, 640 - 124 - t * 16, 98);
        z.fill(320, 64, 6, 228, wake);
      } else if (f === 695) { z.displayOut(); G.x = CENTER_ENEX - 56; z.eff = 0; z.eft = 0; }
      else if (f <= 716) {
        const t = f - 696;
        z.blt(HALF_ZG_GREEN, 0, 128, 700, 128, -700 + t * 16, 98);
        z.blt(HALF_ZG, 0, 0, t * 16, 128, 640 - t * 16, 98);
      } else if (f === 717) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 811: ['cmdAshimoto', 44] }, { cmdAshimoto: () => [...COMMON, GEKIRETSU_P, YAMCHA_CLOSE, HALF_ZG, HALF_ZG_GREEN] });

// ======================================================================================================
// 812 熱戦・烈戦・超激戦 (the move switch's 822 オラにパワーをくれ！ → 2912, all.rb 112374; damage 21). The original's film
// is 悟空 with 雅木茶・天津飯・克林・餃子 (not the combo's members): the four fly in round him (backs 116-122, the lead
// moving out of the way), all five charge, and one great wave (effect 96, then 48).
// ($super_saiyazin_flag[1]: 超悟空 when he is in the combo's crew.)
// ======================================================================================================
Object.assign(ComboDuel.prototype, {
  * cmdOraPower() {
    const z = this.cmd, A = this.A, go = 212 - 18, goku = this.crew[14] ? 14 : 3;
    const four = () => {
      z.back(116, A.x + 92, STANDARD_CHAY - 48); z.back(118, A.x + 92, STANDARD_CHAY + 48);
      z.back(120, go, STANDARD_CHAY - 72); z.back(122, go, STANDARD_CHAY + 72);
    };
    // the lead → [@ax, @ay before frame 24 / 25, cha1-4, their offsets from STANDARD_CHAX + f * 8]
    const IN = {
      goku: [-4, 0, 24, [7, 8, 6, 9], [[24, -48], [24, 48], [-48, -72], [-48, 72]]],
      7: [0, -2, 25, [goku, 8, 6, 9], [[-68, 0], [24, 48], [-48, -72], [-48, 72]]],
      8: [0, 2, 25, [goku, 7, 6, 9], [[-68, 0], [24, -48], [-48, -72], [-48, 72]]],
      6: [-3, -3, 25, [goku, 7, 8, 9], [[-68, 0], [24, -48], [24, 48], [-48, 72]]],
      9: [-3, 3, 25, [goku, 7, 8, 6], [[-68, 0], [24, -48], [24, 48], [-48, -72]]],
    };
    for (;;) {
      const f = z.top();
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 39) { // the others fly in
        const [ax, ay, until, cs, at] = IN[z.lead === 3 || z.lead === 14 ? 'goku' : [7, 8, 6].includes(z.lead) ? z.lead : 9];
        if (f < until) { if (ax) z.ax = ax; if (ay) z.ay = ay; } else { z.ax = 0; z.ay = 0; }
        [z.c1, z.c2, z.c3, z.c4] = cs;
        [116, 118, 120, 122].forEach((n, i) => z.back(n, STANDARD_CHAX + f * 8 + at[i][0], STANDARD_CHAY + at[i][1]));
      } else if (f <= 59) {
        z.ax = 0; z.ay = 0; A.x = TEC_CENTER_CHAX - 92; A.y = STANDARD_CHAY; z.chg = goku;
        z.c1 = 7; z.c2 = 8; z.c3 = 6; z.c4 = 9;
        four();
      } else if (f <= 189) { // all charge
        if (f === 60) {
          z.se('Z1 ザー'); z.se('Z1 ゴー'); z.se('DB3 気を溜める2'); z.se('Z1 気を溜める'); z.se('Z1 気を溜める7');
          z.otype = 1; z.pose(2); z.t1 = 2; z.t2 = 0; z.t3 = 2; z.t4 = 0;
        }
        four();
      } else if (f <= 299) { // the wave
        if (f === 190) {
          z.seStop(); z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2'); z.se('Z1 怪光線'); z.se('Z1 ゴー');
          z.pose(3); z.t1 = 3; z.t2 = 2; z.t3 = 3; z.t4 = 1; z.efp = 96;
        }
        four();
      } else if (f === 300) { z.eff = 0; z.efp = 0; z.displayOut(); }
      else if (f >= 302 && f <= 326) z.efp = 48;
      else if (f === 327) return yield* z.finish();
      yield* z.out(346, 84);
    }
  },
});
films({ 812: ['cmdOraPower', 21] }, { cmdOraPower: () => COMMON });

// ======================================================================================================
// 813 新狼鶴相打陣 (2913 雅木茶＋天津飯, all.rb 112558). 天津飯 below 雅木茶 (pairIn); 雅木茶 vanishes, 天津飯 charges; the
// 狼牙風風拳 on the shock-wave backdrop (39) and the flurry knock the enemy up and away; 天津飯's 新気功砲 close-up with
// four flashes, the 気功砲 column on the enemy (back 9) with four more, the explosion; 雅木茶 flies in and fires the
// huge wave (damage 44).
// ======================================================================================================
const KIKOU_TIEN = pic('Z3_必殺技_新気功砲(テンシンハン・服あり).png');
const HUGE3 = pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG');
Object.assign(ComboDuel.prototype, {
  * cmdShinRokaku() {
    const z = this.cmd, A = this.A, G = this.G;
    const flashAt = (g, ...at) => { if (at.some((a) => g >= a && g <= a + 3)) { z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_ON); if (at.includes(g)) z.se('Z1 エネルギー波'); } };
    for (;;) {
      const f = z.top();
      let [rx, ry] = f <= 500 ? [325, 70] : [340, 200];
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 7, 8);
      else if (f <= 150) { // 雅木茶 gone, 天津飯 charges below
        if (f === 60) { z.efp = 0; z.se('Z1 高速移動'); z.se('Z3 変身'); z.color = 0; A.y = -200; }
        z.back(201, 234, -18 + 54 + 50 + 50); z.bf--;
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
        if (f <= 109 && f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, TEC_CENTER_CHAX + 6, STANDARD_CHAY + 76 - 100);
      } else if (f === 151) {
        z.fxReset(); z.chg = 7; A.y = -200; A.x -= 26; z.bars = false; z.seStop(); z.se('Z1 逃げる'); G.x = CENTER_ENEX; G.y = STANDARD_ENEY;
      } else if (f <= 243) { z.back(1); z.efp = 39; }
      else if (f <= 424) {
        z.back(1);
        yamchaRush(z, f - 244, f, (g) => { z.otype = 1; z.pose(3); if (g === 124 + 4 * 14) z.se('ZG 打撃4'); z.gx = -16; z.gy = -8; z.gpose(17); });
      } else if (f <= 459) { z.gx = -24; z.gy = -16; z.back(1); if (f === 459) { z.no = 3; z.bars = true; } }
      else if (f <= 660) { // 天津飯's close-up, four flashes
        const s = 460;
        if (f === s) { z.gx = 0; z.gy = 0; z.seStop(); z.se('Z1 気を溜める4'); }
        A.y = -200;
        z.blt(KIKOU_TIEN, 0, 0, 170, 160, 208, 98);
        flashAt(f, s + 40, s + 80, s + 120, s + 160);
      } else if (f === 670) {
        z.seStop(); z.bars = false; z.fxReset(); z.no = 0; z.displayOut(); z.gpose(16); z.se('Z1 ザー'); z.se('Z1 ゴー');
      } else if (f >= 681 && f <= 890) { // the 気功砲 on the enemy
        z.back(9);
        flashAt(f, 711, 751, 791, 831);
      } else if (f >= 891 && f <= 910) {
        if (f === 891) { z.eff = 0; z.eft = 0; z.efp = 105; z.se('DB3 大爆発'); z.gpose(17); }
        G.y += 16;
      } else if (f >= 911 && f <= 930) { // 雅木茶 flies in
        if (f === 911) { z.otype = 1; z.fxReset(); A.x = -96; A.y = STANDARD_CHAY; G.y = -200; z.se('DB3 気を溜める2'); z.pose(2); z.gpose(16); }
        A.x += 16; G.y += 16;
      } else if (f >= 931 && f <= 1020) { // and fires
        if (f === 931) { z.seStop(); z.se('DB3 エネルギー波1'); z.se('DB3 エネルギー波2'); z.pose(3); }
        z.blt(HUGE3, 0, 192, (f - 931) * 16, 192, 306, 66);
      } else if (f === 1021) { A.y = -200; return yield* z.finish(); }
      yield* z.out(rx, ry);
    }
  },
});
films({ 813: ['cmdShinRokaku', 44] }, { cmdShinRokaku: () => [...COMMON, YAMCHA_CLOSE, KIKOU_TIEN] });

// ======================================================================================================
// 814 超操気円裂斬 (2914 克林＋雅木茶, all.rb 112838). 雅木茶 comes in beside 克林 (effects 363 / 364), both charge (side
// strips, two auras); their close-ups pass each other with the 気円斬 and the 繰気弾; then the two fly across the
// enemy, each along one of three paths picked at random (@kienrand / @soukirand, never the same), damage 44.
// (The original's further targets of a move on everyone — @all_attack_count ≥ 2 — only get that last part; a combo
// here hits one target.)
// ======================================================================================================
const KIEN_KRILLIN = pic('Z3_必殺技_気円烈斬(クリリン).png'), SOKI_YAMCHA = pic('FC風_ZSSD_必殺技_繰気弾(ヤムチャ)2.png');
const GENKI_BALL = pic('Z3_戦闘_必殺技_超元気玉_弾.PNG');
Object.assign(ComboDuel.prototype, {
  * cmdChoSokiEnretsu() {
    const z = this.cmd, A = this.A, wake = 'rgb(188,188,188)';
    let kien = 0, soki = 0;
    const bx = TEC_CENTER_CHAX - 80 + 40, by_ = STANDARD_CHAY - 30;
    const closeUps = (t) => {
      z.blt(KIEN_KRILLIN, 0, 0, 130, 168, 320 - 190, 342 - t * 4);
      z.blt(SOKI_YAMCHA, 0, 0, 124, 156, 320 + 52, -156 + t * 4);
      z.fill(320 - 2, 0, 6, 228 + 64, wake);
      z.blt(Z3.kien, 0, 150, 126, 30, 320 - 190 + 38, 342 - t * 4 - 46);
      z.blt(GENKI_BALL, 126, 0, 126, 126, 320 + 52 - 40, -156 + t * 4 - 130);
    };
    for (;;) {
      const f = z.top();
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 39) {
        if (z.lead === 6) { z.c2 = 7; z.efp = 363; z.ax = f <= 10 ? -8 : 0; } else if (z.lead === 7) { z.c2 = 6; z.efp = 364; z.ax = f <= 13 ? 8 : 0; }
      } else if (f <= 59) {
        if (z.lead === 7 && f === 40) A.x -= 184;
        z.chg = 6; z.c2 = 7; z.back(118, TEC_CENTER_CHAX + 80 + 24, STANDARD_CHAY); z.efp = 0;
      } else if (f === 60) {
        z.no = 1; z.se('Z3 変身'); z.se('Z1 気を溜める'); z.back(118, TEC_CENTER_CHAX + 80 + 24, STANDARD_CHAY); z.bf = 0;
      } else if (f <= 187) { // both charge
        z.efp = 0; z.eff = 0; z.pose(5); z.t2 = 9; z.color = 0;
        z.back(201, bx - 80, by_); z.bf--;
        z.back(201, bx + 80 + 24, by_); z.bf--;
        z.back(118, TEC_CENTER_CHAX + 80 + 24, STANDARD_CHAY);
      } else if (f <= 250) { // their close-ups pass each other
        if (f === 188) { A.y = -200; z.seStop(); z.se('Z1 飛ぶ'); }
        closeUps(f - 188);
      } else if (f <= 299) {
        if (f === 251) { z.seStop(); z.se('DB3 刀'); z.se('DB3 気を溜める2'); z.se('Z1 気を溜める7'); }
        closeUps(62);
      } else if (f === 300) { z.no = 0; z.eff = 0; z.efp = 0; z.displayOut(); }
      else if (f === 301) {
        soki = rand(3) + 1;
        z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2');
        do kien = rand(3) + 1; while (soki === kien);
      } else if (f <= 333) { // across the enemy, each on its path
        const t = f - 302, [ky, kd] = { 1: [-60, 6], 2: [158, 0], 3: [386, -6] }[kien], [sy, sd] = { 1: [-126, 6], 2: [108, 0], 3: [366, -6] }[soki];
        z.blt(Z3.kien, 0, 150, 126, 30, -126 + 12 * t, ky + t * kd);
        z.blt(GENKI_BALL, 126, 0, 126, 126, -126 + 12 * t, sy + t * sd);
      } else if (f === 334) return yield* z.finish();
      yield* z.out(340, 200);
    }
  },
});
films({ 814: ['cmdChoSokiEnretsu', 44] }, { cmdChoSokiEnretsu: () => [...COMMON, KIEN_KRILLIN, SOKI_YAMCHA, GENKI_BALL] });

// the white / skin / orange flashes of 2907 / 2915 (frame `g` of the run)
function flash3(z, g) {
  if (inR(g, 1, 4, 17, 20, 33, 36, 50, 53)) z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_ON, '#fff');
  else if (inR(g, 5, 8, 21, 24, 37, 37, 54, 57)) z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_ON, 'rgb(255,216,160)');
  else if (inR(g, 9, 12, 25, 28, 42, 45, 58, 61)) z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_ON, 'rgb(255,120,48)');
}

// ======================================================================================================
// 815 烈戦人造人間 (2915 16號・18號・17號, all.rb 113088). The other two fly in round the lead (backs 116 / 118: 16號 in
// the middle, 18號 above, 17號 below); 18號 and 17號 fly off, 16號 rams the enemy away; 18號 and 17號 come in from
// both sides and fire their balls (290) — the flashes, the explosion; 16號 flies in on the shock-wave backdrop, grabs
// it and blows up with flashes (damage 44).
// ======================================================================================================
Object.assign(ComboDuel.prototype, {
  * cmdRessen() {
    const z = this.cmd, A = this.A, G = this.G, go = 212 + 24;
    for (;;) {
      const f = z.top();
      z.color = 0;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 39) { // the other two fly in (the lead moves out of the way: 18號 up, 17號 down)
        const x = STANDARD_CHAX + f * 8;
        if (z.lead === 21 || z.lead === 22) {
          if (f < 16) { z.ax = -2; z.ay = z.lead === 21 ? -4 : 4; } else { z.ax = 0; if (f > 16) z.ay = 0; }
          z.c1 = 23; z.c2 = z.lead === 21 ? 22 : 21;
          z.back(116, x + 16, STANDARD_CHAY);
          z.back(118, x - 14, STANDARD_CHAY + (z.lead === 21 ? 64 : -64));
        } else {
          z.c1 = 21; z.c2 = 22;
          z.back(116, x - 14, STANDARD_CHAY - 64); z.back(118, x - 14, STANDARD_CHAY + 64);
        }
      } else if (f <= 59) {
        z.ax = 0; z.ay = 0; z.chg = 23; z.c1 = 21; z.c2 = 22; A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY;
        z.back(116, go, STANDARD_CHAY - 64); z.back(118, go, STANDARD_CHAY + 64);
      } else if (f === 60) {
        z.se('Z1 飛ぶ'); z.se('DB3 ダッシュ'); z.otype = 1; z.pose(8); z.t1 = 16; z.t2 = 16;
        z.back(115, go, STANDARD_CHAY - 64); z.back(117, go, STANDARD_CHAY + 64);
      } else if (f <= 119) { // 16號 dashes off, the others up and away
        const t = f - 61;
        A.x += 16;
        z.back(115, go - t * 8, STANDARD_CHAY - 64 - t * 16); z.back(117, go + t * 8, STANDARD_CHAY + 64 - t * 16);
      } else if (f === 120) { G.x = CENTER_ENEX; G.y = STANDARD_ENEY; A.x = -96 - 8 * 24; z.se('DB3 ダッシュ'); }
      else if (f <= 144) A.x += 24;
      else if (f <= 190) { if (f === 145) { z.seStop(); z.se('Z1 強打'); } G.x += 28; G.y -= 8; z.gpose(16); }
      else if (f <= 233) { // 18號 and 17號 from both sides
        if (f === 191) { z.se('Z1 飛ぶ'); A.y = -200; }
        z.t1 = 2; z.t2 = 5;
        z.back(116, -96 + (f - 191) * 8, STANDARD_CHAY); z.back(118, 640 - (f - 191) * 8, STANDARD_CHAY);
      } else if (f <= 360) {
        if (f === 235) z.se('DB3 気を溜める2');
        z.back(116, -96 + 43 * 8 - 8, STANDARD_CHAY); z.back(118, 640 - 43 * 8 + 8, STANDARD_CHAY);
        z.efp = 290;
      } else if (f === 361) { z.efp = 0; G.x = CENTER_ENEX; G.y = STANDARD_ENEY; z.gpose(0); z.no = 1; }
      else if (f >= 371 && f <= 428) { if (f === 371) z.se('Z1 エネルギー波'); flash3(z, f - 371); }
      else if (f >= 429 && f <= 450) {
        if (f === 429) { z.eff = 0; z.eft = 0; z.efp = 104; z.se('Z1 爆発1'); z.gpose(17); }
        G.y += 16;
      } else if (f >= 451 && f <= 470) { // 16號 flies in
        if (f === 451) { z.efp = 0; z.bars = false; G.y = -200; A.y = STANDARD_CHAY; A.x = 640; z.pose(9); }
        G.y += 16; A.x -= 16;
        z.back(1);
      } else if (f >= 471 && f <= 500) {
        if (f === 471) { z.pose(6); z.gpose(16); z.se('Z1 強打'); }
        G.x += f % 2 === 1 ? 8 : -8;
        z.back(1);
      } else if (f >= 501 && f <= 560) {
        if (f === 501) { z.pose(7); z.se('Z1 気を溜める'); z.se('Z1 気を溜める2'); }
        G.x += f % 2 === 1 ? 12 : -12;
        flash3(z, f - 501);
        z.back(1);
      } else if (f === 561) { A.y = -200; return yield* z.finish(); }
      yield* z.out(356, 70);
    }
  },
});
films({ 815: ['cmdRessen', 44] }, { cmdRessen: () => COMMON });

// ======================================================================================================
// 818 Dポコペンダーレガツツイタ / ダブルポコペン (2918 比克＋青年, all.rb 113328). 青年 below 比克 (pairIn); both fire a
// green ball (the Z3 green ball's second picture), which flies on at the enemy (damage 41).
// ======================================================================================================
const BALL_GREEN = pic('Z3_戦闘_必殺技_エネルギー弾(緑).PNG');
Object.assign(ComboDuel.prototype, {
  * cmdPokopen() {
    const z = this.cmd, A = this.A;
    for (;;) {
      const f = z.top();
      z.color = 0;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 4, 15);
      else if (f === 60) {
        z.se('Z1 怪光線'); z.otype = 1; z.pose(4); z.efp = 0; z.t2 = 12;
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50); z.eff = 0;
      } else if (f <= 104) {
        const x = A.x + 2 + (f - 61) * RS;
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
        z.blt(BALL_GREEN, 128, 0, 128, 128, x, STANDARD_CHAY - 84);
        z.blt(BALL_GREEN, 128, 0, 128, 128, x, STANDARD_CHAY + 16);
      } else if (f === 105) { z.displayOut(); z.eff = 0; }
      else if (f <= 127) {
        const x = -16 + (f - 106) * RS;
        z.blt(BALL_GREEN, 128, 0, 128, 128, x, STANDARD_CHAY - 30);
        z.blt(BALL_GREEN, 128, 0, 128, 128, x, STANDARD_CHAY - 4);
      } else if (f === 128) return yield* z.finish();
      yield* z.out(328, 148);
    }
  },
});
films({ 818: ['cmdPokopen', 41] }, { cmdPokopen: () => COMMON });

// ======================================================================================================
// 820 超能力きこうほう改 (2920 天津飯＋餃子, all.rb 113402). The other one flies in (back 39, 天津飯 below and 餃子 above,
// back 40), both charge (back 105 ×2) — 餃子 holding the enemy with his mind (back 44); 天津飯's 新気功砲 close-up with
// four flashes, the 気功砲 column on the enemy (back 9) with four more; the enemy shakes and blows up (damage 82).
// ======================================================================================================
Object.assign(ComboDuel.prototype, {
  * cmdPsychoKikouKai() {
    const z = this.cmd, A = this.A;
    const flashAt = (g, ...at) => { if (at.some((a) => g >= a && g <= a + 3)) { z.flash(); if (at.includes(g)) z.se('Z1 エネルギー波'); } };
    for (;;) {
      const f = z.top();
      if (f === 0) { z.color = 0; z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 39) {
        z.back(39);
        if (z.lead === 8) z.ay = f <= 10 ? 5 : 0; else if (z.lead === 9) z.ay = f <= 10 ? -5 : 0;
      } else if (f <= 59) { A.y = -120; z.ax = 0; z.ay = 0; z.back(40); }
      else if (f === 60) { z.back(40); z.se('Z2 気を溜める'); }
      else if (f <= 149) { z.back(105, 222, 60 - 50); z.bf--; z.back(105, 218, 60 + 50); z.bf--; z.back(44); }
      else if (f === 150) { z.seStop(); A.y = -200; z.no = 3; z.bars = true; }
      else if (f <= 359) { z.blt(KIKOU_TIEN, 0, 0, 170, 160, 208, 98); flashAt(f, 191, 231, 271, 311); }
      else if (f === 360) { z.seStop(); z.bars = false; z.fxReset(); z.no = 0; z.displayOut(); z.se('Z1 ザー'); z.se('Z1 ゴー'); }
      else if (f <= 561) { z.back(9); flashAt(f, 391, 431, 471, 511); }
      else if (f === 562) return yield* z.finish();
      yield* z.out(328, 148);
    }
  },
});
films({ 820: ['cmdPsychoKikouKai', 82] }, { cmdPsychoKikouKai: () => [...COMMON, KIKOU_TIEN] });

// ======================================================================================================
// 821 激烈魔閃光弾 (2921 比克＋超悟飯, all.rb 113496). 悟飯 below 比克 (pairIn); both charge green; 比克's 激烈光弾
// close-up (235 → 252); 悟飯's 激烈魔閃光 close-up with the rocks rising, grey / light / white flashes; both fire (295
// green) and the huge green wave on the enemy (48), damage 44.
// ======================================================================================================
const GEKIRETSU_G = [pic('ZG_必殺技_激烈魔閃光1(悟飯).PNG'), pic('ZG_必殺技_激烈魔閃光1(悟飯)_赤道着.png')]; // 80×176
const ROCK = pic('ZG_必殺技_岩.PNG');
const ROCKS = { x: [166, 230, 260, 364, 420, 480, 200, 440, 400], y: [560, 540, 480, 480, 480, 500, 580, 600, 520], big: [1, 0, 1, 1, 0, 1, 0, 1, 0] };
Object.assign(ComboDuel.prototype, {
  * cmdGekiretsuKoudan() {
    const z = this.cmd, A = this.A, gohan = this.crew[18] ? 18 : 5, bx = 234, by_ = -18 + 54 + 50;
    for (;;) {
      const f = z.top();
      let rx = 324, ry = 80;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 4, gohan);
      else if (f === 60) { z.se('Z3 変身'); z.se('Z1 気を溜める'); z.color = 3; }
      else if (f <= 187) { // both charge green
        z.efp = 0; z.eff = 0; z.pose(13); z.color = 1;
        z.back(201, bx - 18, by_ + 50); z.bf--;
        z.back(201, bx - 12, by_ - 50); z.bf--;
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
      } else if (f <= 348) { // 比克's close-up
        const s = 188;
        z.blt(GEKIRETSU_P, 0, 0, 218, 230, 190, 66);
        if (f === s) { A.y = -200; z.small = true; z.seStop(); }
        if (f >= s + 90) { z.efp = 252; rx = 322 - 16; ry = 164 - 16; if (f === s + 90) z.rt = 0; }
        else if (f >= s + 30) { z.efp = 235; rx = 322; ry = 164; if (f === s + 30) z.se('Z1 気を溜める2'); }
      } else if (f <= 549) { // 悟飯's close-up, the rocks rising, the flashes
        const s = 349, g = f - s;
        if (g === 0) { z.efp = 0; z.seStop(); }
        z.cut = false; z.no = 1;
        if (g === 30) z.se('ZG SE057');
        A.y = -200;
        const k = rand(3);
        z.blt(GEKIRETSU_G[v(172) === 2 ? 1 : 0], 0, 0, 80, 176, 280 + (k === 2 ? 2 : k === 1 ? -2 : 0), 72);
        ROCKS.x.forEach((x, i) => {
          if (ROCKS.big[i]) z.blt(ROCK, 16, 0, 28, 20, x, ROCKS.y[i] - 4 * g); else z.blt(ROCK, 0, 0, 16, 14, x, ROCKS.y[i] - 2 * g);
        });
        if (g >= 156 && g <= 159) z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_OFF, 'rgb(127,127,127)');
        else if (g >= 160 && g <= 163) z.fill(0, 0, 640, FLASH_Y_SIZE_CUTIN_OFF, 'rgb(188,188,188)');
        else if (g >= 164 && g <= 200) z.flash();
        if (f === 549) z.no = 0;
      } else if (f <= 659) { // both fire
        if (f === 550) {
          A.y = STANDARD_CHAY - 50; z.seStop(); z.cut = true; z.pose(14); z.t2 = 3;
          z.se('ZG 光線1'); z.se('Z1 ゴー'); z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2'); z.color = 1;
        }
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
        z.efp = 295;
      } else if (f === 660) { z.eff = 0; z.efp = 0; z.displayOut(); }
      else if (f >= 662 && f <= 687) z.efp = 48;
      else if (f === 688) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 821: ['cmdGekiretsuKoudan', 44] }, { cmdGekiretsuKoudan: () => [...COMMON, GEKIRETSU_P, ...GEKIRETSU_G, ROCK] });

// ======================================================================================================
// 822 ファイナルバスター (2922 超貝吉塔＋超特蘭克斯, all.rb 113699). 特蘭克斯 below 貝吉塔 (pairIn); both charge blue
// (特蘭克斯's poses by his clothes, variable 173); both fire (295 blue) and the huge wave (48), damage 44.
// ======================================================================================================
Object.assign(ComboDuel.prototype, {
  * cmdFinalBuster() {
    const z = this.cmd, A = this.A, bx = 234, by_ = -18 + 54 + 50, suit = [1, 2, 3].includes(v(173));
    for (;;) {
      const f = z.top();
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 19, 20);
      else if (f === 60) { z.se('Z3 変身'); z.se('Z1 気を溜める'); z.se('Z1 気を溜める6'); z.color = 3; }
      else if (f <= 187) {
        z.efp = 0; z.eff = 0; z.pose(12); z.t2 = suit ? 12 : 10; z.color = 3;
        z.back(201, bx - 18, by_ + 50); z.bf--;
        z.back(201, bx - 18, by_ - 50); z.bf--;
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
      } else if (f <= 299) {
        if (f === 188) {
          A.y = STANDARD_CHAY - 50; z.seStop(); z.cut = true;
          z.se('ZG 光線1'); z.se('Z1 ゴー'); z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2');
          z.color = 3; z.pose(13); z.t2 = suit ? 13 : 11;
        }
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
        z.efp = 295;
      } else if (f === 300) { z.eff = 0; z.efp = 0; z.displayOut(); }
      else if (f >= 302 && f <= 327) z.efp = 48;
      else if (f === 328) return yield* z.finish();
      yield* z.out(324, 80);
    }
  },
});
films({ 822: ['cmdFinalBuster', 44] }, { cmdFinalBuster: () => COMMON });

// ======================================================================================================
// 823 ファイナルかめはめ波 (2923 超悟空＋超貝吉塔, all.rb 113836). 貝吉塔 below 悟空 (pairIn); both charge blue; 悟空's ZG
// kamehameha close-up with the ball (235; the side panels), 貝吉塔's ファイナルフラッシュ close-up shaking (the red
// strip); both fire the final kamehameha (372) and it hits (365), damage 44.
// ======================================================================================================
const KAME2_GOKU = [pic('ZG_必殺技_超カメハメ波2(悟空).PNG'), pic('ZG_必殺技_超カメハメ波2(悟空_ボロボロ).PNG'),
  pic('ZG_必殺技_超カメハメ波2(悟空_さらにボロボロ).png'), pic('ZG_必殺技_超カメハメ波2(悟空_バトルスーツ).PNG')]; // 122×212
const FF_CHARGE = [pic('ZG_必殺技_ファイナルフラッシュ(溜め)_ベジータ.PNG'), pic('ZG_必殺技_ファイナルフラッシュ(溜め)_ベジータ(気).PNG')]; // 382×96
Object.assign(ComboDuel.prototype, {
  * cmdFinalKame() {
    const z = this.cmd, A = this.A, bx = 234, by_ = -18 + 54 + 50;
    for (;;) {
      const f = z.top();
      let rx = 324, ry = 80;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 14, 19);
      else if (f === 60) { z.se('Z3 変身'); z.se('Z1 気を溜める'); z.color = 3; }
      else if (f <= 187) {
        z.efp = 0; z.eff = 0; z.pose(2); z.t2 = 12; z.color = 3;
        z.back(201, bx - 18, by_ + 50); z.bf--;
        z.back(201, bx - 12, by_ - 50); z.bf--;
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
        if (f === 187) z.no = 4;
      } else if (f <= 297) { // 悟空's close-up
        z.efp = 235;
        if (f === 188) { z.seStop(); z.se('ZG SE053'); z.cut = false; A.y = -200; z.color = 0; }
        if (f === 297) z.no = 6;
        rx = 258 + 16; ry = 46 + 86;
        const c = v(171);
        z.blt(KAME2_GOKU[[1, 2, 3].includes(c) ? c : 0], 0, 0, 122, 212, 258, 46);
      } else if (f <= 399) { // 貝吉塔's close-up
        const s = 298;
        if (f === s) { z.seStop(); z.se('Z1 気を溜める6'); z.efp = 0; }
        if (f === 399) z.no = 0;
        let x = 130;
        if (f > s + 10) z.blt(FF_CHARGE[1], 0, 0, 382, 96, x, 130);
        if (f >= s + 10 && f <= s + 70) x += f % 2 === 1 ? -2 : 2;
        z.blt(FF_CHARGE[0], 0, 0, 382, 96, x, 130);
      } else if (f <= 509) { // both fire
        if (f === 400) {
          A.y = STANDARD_CHAY - 50; z.seStop(); z.cut = true; z.pose(3); z.t2 = 13;
          z.se('ZG 光線1'); z.se('Z1 ゴー'); z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2'); z.color = 0; z.eff = 0;
        }
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
        z.efp = 372; rx = 328; ry = 84;
      } else if (f === 510) { z.eff = 0; z.efp = 0; z.displayOut(); }
      else if (f >= 512 && f <= 537) z.efp = 365;
      else if (f === 538) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 823: ['cmdFinalKame', 44] }, { cmdFinalKame: () => [...COMMON, ...KAME2_GOKU, ...FF_CHARGE] });

// ======================================================================================================
// 825 サイコ気円裂斬 (2925 克林＋餃子, all.rb 114966). 餃子 below 克林 (pairIn); 餃子 vanishes, 克林 charges; 克林's 気円烈斬
// close-up spins the disc and throws it (corner strips); 餃子 clings to the enemy (effect 88) on the shock-wave
// backdrop and holds it shaking; the disc cuts through it (260), damage 44. (Further targets of a move on everyone:
// see 814.)
// ======================================================================================================
Object.assign(ComboDuel.prototype, {
  * cmdPsychoKienretsu() {
    const z = this.cmd, A = this.A, G = this.G, bx = TEC_CENTER_CHAX - 80 + 40, by_ = STANDARD_CHAY - 30;
    for (;;) {
      const f = z.top();
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 6, 9);
      else if (f <= 150) { // 餃子 gone, 克林 charges
        z.color = 0;
        if (f === 60) { z.efp = 0; z.se('Z1 高速移動'); z.se('Z3 変身'); z.otype = 1; z.pose(5); }
        z.back(201, bx, by_ - 50);
        if (f <= 109 && f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, TEC_CENTER_CHAX + 6, STANDARD_CHAY + 76);
      } else if (f <= 271) { // his close-up, the disc spinning, then thrown
        const k0 = 31 + 151;
        if (f === 271) z.cutFlag = true;
        z.no = 2;
        if (f === 151) z.seStop();
        A.y = -160;
        z.blt(KIEN_KRILLIN, 0, 0, 130, 168, 182, 130);
        const row = f >= k0 + 15 ? 4 : f >= k0 - 15 ? 1 : 0;
        let [kx, ky] = [250, 80];
        if (f >= k0) { const [dx, dy] = kienSpin(f - k0, 6, 2); kx += dx; ky += dy; }
        if (f >= k0 + 50) { if (f === k0 + 50) z.se('Z3 エネルギー波'); ky = 80 - 8 * (f - (k0 + 50)); kx += 12 * (f - (k0 + 50)); }
        z.blt(Z3.kien, 0, 30 * row, 126, 30, kx, ky);
      } else if (f === 272) {
        z.displayOut(); z.chg = 9; A.x = -200; z.eff = 0; z.efp = 0; z.bars = false; z.se('Z1 逃げる'); G.x = CENTER_ENEX; G.y = STANDARD_ENEY;
      } else if (f <= 334) { // 餃子 clings to it
        z.back(1); z.efp = 88;
        if (f === 294) { z.se('Z1 強打'); z.gx = 2; } else if (f === 296) z.gx = -2; else if (f === 298) z.gx = 0;
      } else if (f <= 395) { // and holds it shaking
        z.back(1);
        if (f === 335) { z.efp = 88; z.se('Z3 超能力'); }
        z.gx = (f - 335) % 2 === 0 ? 6 : -6;
      } else if (f <= 426) { // the disc through it
        if (f === 396) { z.se('Z1 エネルギー波2'); z.eff = 0; }
        z.efp = 260;
        if (f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, G.x + 86, STANDARD_ENEY + 28);
      } else if (f === 427) return yield* z.finish();
      yield* z.out(340, 200);
    }
  },
});
films({ 825: ['cmdPsychoKienretsu', 44] }, { cmdPsychoKienretsu: () => [...COMMON, KIEN_KRILLIN] });

// ======================================================================================================
// 841 信じる心 (2941 克林＋16號, all.rb 117681). 16號 below 克林 (pairIn); 克林 fires a kamehameha ball (203) and vanishes;
// it hits (204) and 克林 appears behind the enemy (back 48), the explosion (102); 16號's rocket-punch close-up, then his
// fist flies (273), damage 22.
// ======================================================================================================
const PUNCH_16 = pic('Z3_必殺技_ロケットパンチ(16号・左手).png'); // 382×314
Object.assign(ComboDuel.prototype, {
  * cmdShinjiru() {
    const z = this.cmd, A = this.A, G = this.G;
    for (;;) {
      const f = z.top();
      let rx = 0, ry = 0;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 6, 23);
      else if (f <= 140) {
        if (f === 60) { z.se('Z1 気を溜める'); z.otype = 1; z.pose(2); z.color = 0; }
        if (f >= 101 && f <= 105) z.pose(3);
        if (f === 106) { z.seStop(); z.se('Z3 エネルギー波'); z.eff = 0; }
        if (f >= 107) { // the ball
          z.efp = 203; rx = 340 - 8; ry = 142 - 50;
          if (f === 107) z.ax = 2; else if (f === 110) z.ax = -2; else if (f === 113) z.ax = 0;
        }
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
      } else if (f <= 170) { z.efp = 0; if (f === 141) z.se('Z1 高速移動'); z.back(48, TEC_CENTER_CHAX + 12, STANDARD_CHAY + 76); }
      else if (f === 180) { z.fxReset(); z.displayOut(); }
      else if (f >= 181 && f <= 209) { // it hits; 克林 behind the enemy
        z.efp = 204;
        if (f >= 195) { if (f === 195) z.se('Z1 高速移動'); z.back(48, TEC_CENTER_CHAX - 200, STANDARD_CHAY + 24); }
      } else if (f >= 210 && f <= 260) {
        if (f === 210) { z.fxReset(); z.se('ZG 光線系ヒット2'); }
        z.gx = -8;
        z.back(48, TEC_CENTER_CHAX - 200, STANDARD_CHAY + 24);
        z.efp = 102; z.gpose(16);
        if (f >= 235) { z.gx = 0; z.gpose(0); }
      } else if (f >= 261 && f <= 320) { // 16號's close-up
        z.efp = 0; z.eff = 0; G.y = -200;
        if (f === 261) z.se('DB3 気を溜める2');
        z.blt(PUNCH_16, 0, 0, 382, 314, TEC_CENTER_CHAX - 148, STANDARD_CHAY - 106);
      } else if (f >= 321 && f <= 378) { // the fist flies
        if (f === 321) { z.se('Z1 ゴー'); z.t2 = 3; z.efp = 273; }
        if (f <= 350) { rx = 138 - 16; ry = 156; z.eff = 0; G.y = STANDARD_CHAY; } else {
          if (f === 351) { z.seStop(); z.se('DB3 エネルギー波1'); z.se('DB3 エネルギー波2'); }
          z.t2 = 3; z.efp = 273; rx = 138; ry = 156;
        }
        z.back(118, TEC_CENTER_CHAX - 216, STANDARD_CHAY);
      } else if (f === 379) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 841: ['cmdShinjiru', 22] }, { cmdShinjiru: () => [...COMMON, PUNCH_16] });

// ======================================================================================================
// 842 月を破壊する者 (2942 龜仙人＋比克, all.rb 117821). 比克 below 龜仙人 (pairIn); the full moon rises (no strips, no
// cut-in); both fire half-round waves (white / green) that blow the moon away and go on to the enemy (damage 43).
// ======================================================================================================
const MOON = pic('Z1_戦闘_必殺技_満月.PNG'); // 11 frames of 48×48
Object.assign(ComboDuel.prototype, {
  * cmdMoonBreaker() {
    const z = this.cmd, A = this.A;
    for (;;) {
      const f = z.top();
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 24, 4);
      else if (f <= 199) { // the full moon rises
        if (f === 60) { A.y = -200; z.se('Z1 満月'); z.otype = 1; z.pose(0); z.color = 0; z.bars = false; z.cut = false; z.efp = 0; }
        const k = Math.min(10, Math.floor(f / 8)), h = Math.min(48, f * 2), up = f > 150 ? 300 : f * 2;
        z.blt(MOON, 48 * k, 0, 48, h, 596 - up, 354 - up);
      } else if (f <= 320) { // both charge
        if (f === 200) {
          z.seStop(); z.se('Z1 気を溜める'); z.se('Z1 気を溜める2'); z.otype = 1; z.pose(2); z.t2 = 2; z.color = 0;
          A.y = STANDARD_CHAY - 50; z.bars = true; z.cut = true;
        }
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
      } else if (f <= 440) { // and fire
        const t = f - 321, rx = TEC_CENTER_CHAX + 84, ry = STANDARD_CHAY - 8;
        if (t === 0) { z.pose(3); z.t2 = 3; z.seStop(); z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2'); z.fxReset(); }
        z.blt(Z3.half[0], 0, 0, t * RS, 128, rx - 20, ry - 50);
        z.blt(Z3.half[1], 0, 0, t * RS, 128, rx - 8, ry + 50 - 20);
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
      } else if (f <= 509) { // through the moon
        const t = f - 441, ry = STANDARD_CHAY - 8;
        if (t === 0) A.y = -200;
        z.blt(MOON, 48 * 10, 0, 48, 48, 280, 144);
        z.blt(Z3.half[0], 60, 0, t * RS, 128, 0, ry - 50);
        z.blt(Z3.half[1], 60, 0, t * RS, 128, 0, ry + 50 + 2);
        if (t === 20) { z.se('ZG 光線系ヒット2'); z.se('ZG 光線系ヒット3'); z.se('ZG 光線系ヒット3'); }
      } else if (f === 510) { z.seStop(); z.fxReset(); z.displayOut(); z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2'); }
      else if (f <= 537) { // on the enemy
        const x = -700 + (f - 511) * RS, ry = STANDARD_CHAY - 8;
        z.blt(Z3.half[0], 0, 128, 700, 128, x, ry - 50);
        z.blt(Z3.half[1], 0, 128, 700, 128, x, ry + 50 + 2);
      } else if (f === 538) return yield* z.finish();
      yield* z.out();
    }
  },
});
films({ 842: ['cmdMoonBreaker', 43] }, { cmdMoonBreaker: () => [...COMMON, MOON] });

// ======================================================================================================
// 868 大丈夫かチチ！？ (2968 超悟空＋琪琪, all.rb 122208). (悟空 leading: 琪琪 walks in to take his place.) 琪琪 dashes at
// the enemy and is knocked back; 悟空 catches her (back 115), she goes up out of the way; 悟空 charges blue, vanishes,
// reappears beside the enemy with the ball (235; the side panels), his ZG kamehameha close-ups and the beam, then the
// half-round wave on the enemy (256), damage 44.
// ======================================================================================================
const KAME1_GOKU = [pic('ZG_必殺技_超カメハメ波1(悟空).PNG'), pic('ZG_必殺技_超カメハメ波1(悟空_ボロボロ).PNG'),
  pic('ZG_必殺技_超カメハメ波1(悟空_さらにボロボロ).png'), pic('ZG_必殺技_超カメハメ波1(悟空_バトルスーツ).PNG')];
const BEAM_BIG = pic('ZG_必殺技_光線_大.PNG'); // 316×158
Object.assign(ComboDuel.prototype, {
  * cmdDaijoubuChichi() {
    const z = this.cmd, A = this.A, G = this.G, gx0 = -96 + 16 * 25 - 8 * 12, shift = TEC_CENTER_CHAX - gx0;
    const c171 = () => { const c = v(171); return [1, 2, 3].includes(c) ? c : 0; };
    for (;;) {
      const f = z.top();
      let rx = 356, ry = 112;
      z.color = 3;
      if (!z.tok && z.lead === 14) { // 琪琪 walks in
        if (f === 0) z.se('Z1 逃げる');
        if (f <= 60) { z.c1 = 10; z.ax = -16; z.back(115, STANDARD_CHAX + Math.min(f, 21) * 16, STANDARD_CHAY); }
        if (f === 60) { z.ax = 0; z.chg = 10; A.x = TEC_CENTER_CHAX; z.tok = true; z.f = 0; }
      } else if (z.tok) {
        if (f <= 1) { z.c1 = 14; z.chg = 10; z.otype = 1; z.pose(6); A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY; }
        else if (f <= 59) { if (f === 2) z.se('Z1 逃げる'); A.x += 16; }
        else if (f === 60) { G.x = CENTER_ENEX; G.y = STANDARD_CHAY; A.x = -96; }
        else if (f <= 82) A.x += 16;
        else if (f === 83) { z.otype = 0; z.pose(17); z.gpose(1); z.se('ZG 打撃4'); } // she is knocked back
        else if (f <= 119) A.x -= 20;
        else if (f === 120) { G.y = -200; A.x = 840; z.se('Z1 逃げる'); }
        else if (f <= 146) { A.x -= 20; z.back(115, -96 + 16 * (f - 121), STANDARD_CHAY); } // 悟空 comes to catch her
        else if (f <= 159) { if (f === 147) z.se('Z1 強打'); z.t1 = 16; z.back(115, gx0 + 96 - 8 * (f - 147), STANDARD_CHAY); A.x -= 8; }
        else if (f === 160) { z.back(115, gx0, STANDARD_CHAY); z.t1 = 0; z.pose(0); }
        else if (f <= 180) { z.back(115, gx0, STANDARD_CHAY); A.x += 4; }
        else if (f <= 240) { z.back(115, gx0, STANDARD_CHAY); z.otype = 1; z.pose(7); }
        else if (f <= 270) { z.pose(8); A.y -= 16; if (f === 241) z.se('Z1 逃げる'); z.back(115, gx0, STANDARD_CHAY); }
        else if (f <= 359) { if (f === 271) z.se('Z3 変身'); z.back(201, 176, 88); z.bf--; z.back(115, gx0, STANDARD_CHAY); }
        else if (f === 360) { z.chg = 14; A.x = gx0; A.y = STANDARD_CHAY; z.se('Z1 気を溜める'); z.pose(2); z.back(201, 176, 88); }
        else if (f <= 420) z.back(201, 176, 88);
        else if (f <= 540) { z.back(201, 176, 88); rx = 284 - shift; ry = 160; z.color = 0; z.efp = 237; if (f === 501) z.se('Z1 気を溜める2'); }
        else if (f <= 620) { z.color = 0; rx = 284 - 8 - shift; ry = 160 - 8; z.efp = f === 620 ? 0 : 235; }
        else if (f <= 680) { // he vanishes
          A.y = -200;
          if (f === 621) { z.seStop(); z.se('Z1 高速移動'); }
          if (f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, TEC_CENTER_CHAX + 12 - shift, STANDARD_CHAY + 20);
        } else if (f === 690) { G.x = CENTER_ENEX; G.y = STANDARD_ENEY; z.gpose(0); A.x = TEC_CENTER_CHAX - 48; }
        else if (f >= 721 && f <= 750) { if (f === 721) z.se('Z1 高速移動'); if (f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, TEC_CENTER_CHAX + 12 - 48, STANDARD_CHAY + 20); }
        else if (f >= 751 && f <= 810) { // beside the enemy with the ball
          rx = 284 - 8 - 48; ry = 160 - 8; z.color = 0; z.efp = 235;
          if (f === 751) z.se('Z1 気を溜める2');
          A.y = STANDARD_CHAY;
          if (f === 810) z.no = 4;
        } else if (f >= 811 && f <= 920) { // his close-up, the ball
          if (f === 811) { z.seStop(); z.se('ZG SE053'); }
          z.cut = false; G.y = -200; A.y = -200; z.color = 0; rx = 258 + 16; ry = 46 + 86;
          z.blt(KAME2_GOKU[c171()], 0, 0, 122, 212, 258, 46);
        } else if (f >= 921 && f <= 989) { // and the beam
          rx = 258 + 16; ry = 46 + 86; z.efp = 0;
          if (f === 921) { z.seStop(); z.se('ZG SE040'); }
          z.blt(KAME1_GOKU[c171()], 0, 0, 122, 212, 258, 46);
          z.blt(BEAM_BIG, 0, 0, 316, 158, 162, 46 + 134);
          if (f <= 928) z.flash();
        } else if (f === 990) { z.cut = true; z.displayOut(); z.no = 0; z.otype = 1; A.y = STANDARD_CHAY; }
        else if (f >= 991 && f <= 1090) { // the wave on the enemy
          G.y = -200; rx = 308; ry = 96; z.color = 0;
          if (f === 991) { z.seStop(); z.se('ZG 光線1'); }
          z.pose(3); z.efp = 256;
        } else if (f === 1091) { G.y = STANDARD_ENEY; A.y = -200; return yield* z.finish(); }
      } else z.tok = true;
      yield* z.out(rx, ry);
    }
  },
});
films({ 868: ['cmdDaijoubuChichi', 44] }, { cmdDaijoubuChichi: () => [...COMMON, ...KAME1_GOKU, ...KAME2_GOKU, BEAM_BIG] });

// ======================================================================================================
// 869 チチさんはやらせねえ！ / 世話焼かせるんじゃねえ (2969 超巴達克＋琪琪, all.rb 122455) and 870 カカロットが世話になった
// らしいな！ (2970 龜仙人＋超巴達克, 122897): 巴達克's onslaught (2969 frames 405-909, 2970 535-1039: the same code 130
// frames later) — the blows up and down, the rush across, the ground shaking (BGS), the strike — then his スピリッツ
// キャノン close-up (235 → 289), the ball (206) and the hit (207), damage 44.
// ======================================================================================================
const SPIRITS_CANNON = [pic('Z3_必殺技_スピリッツキャノン(バーダック超)スカウター有り.png'), pic('Z3_必殺技_スピリッツキャノン(バーダック超).png')];
const ROSHI_KAME = pic('DB3_亀仙人カメハメは.PNG'); // 3 frames of 64×96
// one frame of the onslaught: `k` in 2969's numbering (405-909); returns [ray_x, ray_y], or true at 909
function bardockRush(z, k, rays) {
  const A = z.d.A, G = z.d.G;
  if (k <= 410) {
    z.gpose(16); if (k === 405) z.se('Z1 強打'); z.pose(12);
    if (k >= 406 && k <= 407) G.x += 8; else if (k >= 408 && k <= 409) G.x -= 8;
  } else if (k <= 460) { // knocked up and down, then away
    const g = k - 411;
    if (g >= 1 && g <= 8) { z.pose(12); G.y -= 8; }
    else if (g >= 9 && g <= 12) { if (g === 9) z.se('ZG 打撃4'); if (g === 11) z.pose(13); z.gpose(17); G.y += 16; G.x -= 30; }
    else if (g >= 23 && g <= 30) { z.pose(13); z.gpose(16); G.y -= 8; }
    else if (g >= 31 && g <= 34) { if (g === 31) z.se('ZG 打撃4'); if (g === 33) z.pose(12); z.gpose(17); G.y += 12; G.x += 30; }
    else if (g >= 35) {
      z.gpose(17); G.x += 20; G.y += 2;
      if (g >= 46) { A.x += 30; A.y += 2; }
      if (g === 46) { z.pose(3); z.se('Z1 飛ぶ'); }
    }
  } else if (k === 461) { A.y = STANDARD_CHAY; G.y = STANDARD_CHAY; G.x = -100; A.x = -300; }
  else if (k <= 505) { // the rush across
    const g = k - 462;
    if (g === 0) z.se('Z1 飛ぶ');
    if (g >= 1 && g <= 17) { G.x += 20; A.x += 30; if (g === 13) z.pose(8); }
    else if (g >= 18 && g <= 21) { z.pose(8); if (g === 18) z.se('ZG 打撃5'); G.x += 30; }
    else if (g >= 22 && g <= 25) { G.x -= 30; A.y -= 16; A.x += 12; z.pose(3); }
    else if (g >= 26 && g <= 27) { z.pose(9); A.y += 24; if (g === 27) z.se('Z1 強打'); }
    else if (g >= 28 && g <= 35) { A.y += 16; G.y += 16; }
    else if (g >= 36 && g <= 43) { A.y -= 16; G.y -= 18; G.x += 8; }
  } else if (k <= 559) { // the ground shakes
    const g = k - 506;
    if (g === 0) { audio.playBgs('Z1 大地が揺れる'); z.pose(12); z.gpose(16); }
    else if (g <= 42) {
      const steps = [[10, 13, -8], [20, 12, 8], [25, 13, -16], [30, 12, 16], [33, 13, -32], [36, 12, 32], [38, 13, -48], [40, 12, 48], [41, 13, -96]];
      const st = steps.find(([n]) => g <= n);
      if (st) { z.pose(st[1]); if (g <= 10) z.gpose(16); G.x += st[2]; } else { z.pose(2); z.gpose(17); G.x += 96; audio.stopBgs(); z.se('Z1 吹っ飛ぶ'); }
    } else G.x += 48;
  } else if (k <= 619) { // the strike
    const g = k - 561;
    if (g === 0) { A.y = STANDARD_CHAY; G.y = STANDARD_CHAY; G.x = -100; A.x = 680; z.gpose(16); }
    else if (g >= 1 && g <= 10) G.x += 32;
    else if (g >= 11 && g <= 18) { G.x += 32; A.x -= 24; z.pose(11); if (g === 18) z.se('Z1 強打'); }
    else if (g >= 19 && g <= 29) { G.x -= 32; z.gpose(17); if (g >= 25) { z.pose(14); A.x -= 72; A.y -= 16; if (g === 25) z.se('Z1 高速移動'); } }
    else if (g === 30) { A.y = STANDARD_CHAY; A.x = G.x - 40; z.pose(10); z.se('ZG 打撃2'); }
    else if (g >= 31) { G.x += 32; G.y -= 16; }
  } else if (k <= 740) { // his スピリッツキャノン close-up
    if (k === 620) { z.se('Z1 気を溜める3'); z.otype = 1; z.color = 3; z.cut = false; A.x = -200; }
    z.blt(SPIRITS_CANNON[v(175) === 0 ? 0 : 1], 0, 26, 274, 228, 180, 64);
    if (k <= 680) { rays[0] = 202; rays[1] = 236; z.efp = 235; } else { if (k === 740) z.cut = true; rays[0] = 186; rays[1] = 220; z.efp = 289; }
  } else if (k <= 790) { A.x = TEC_CENTER_CHAX; rays[0] = 276; rays[1] = 140; z.pose(6); z.efp = 235; }
  else if (k === 791) { z.seStop(); z.pose(2); rays[0] = -360; rays[1] = -96; }
  else if (k === 792) { z.seStop(); z.se('Z1 エネルギー波'); z.efp = 206; z.eff = 0; rays[0] = -360; rays[1] = -96; }
  else if (k <= 830) { z.efp = 206; rays[0] = 360; rays[1] = 96; }
  else if (k === 831) z.fxReset();
  else if (k === 861) z.displayOut();
  else if (k >= 882 && k <= 908) z.efp = 207;
  else if (k === 909) return true;
  return false;
}
// the member's after-image as he vanishes (2969 361-399 / 2970 511-529: by $btl_progress, 2 here)
function vanishing(z) { if (z.f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, z.d.A.x + 16, 144); }
// 琪琪 (or 龜仙人) walks in to take 巴達克's place when he leads (2969 / 2970 0-60)
function walkIn(z, f, id) {
  if (f === 0) z.se('Z1 逃げる');
  if (f <= 60) { z.c1 = id; z.ax = -16; z.back(115, STANDARD_CHAX + Math.min(f, 21) * 16, STANDARD_CHAY); }
  if (f === 60) { z.ax = 0; z.chg = id; z.d.A.x = TEC_CENTER_CHAX; z.tok = true; z.f = 0; }
}
Object.assign(ComboDuel.prototype, {
  * cmdSewayaku() { // 2969: 琪琪 dashes in and is knocked back, 巴達克 catches her, she goes up out of the way, he charges
    const z = this.cmd, A = this.A, G = this.G, gx0 = -96 + 16 * 25 - 8 * 12;
    for (;;) {
      const f = z.top();
      const rays = [356, 112];
      z.color = 3;
      if (!z.tok && z.lead === 32) walkIn(z, f, 10);
      else if (z.tok) {
        if (f <= 1) { z.c1 = 32; z.chg = 10; z.otype = 1; z.pose(6); A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY; }
        else if (f <= 59) { if (f === 2) z.se('Z1 逃げる'); A.x += 16; }
        else if (f === 60) { G.x = CENTER_ENEX; G.y = STANDARD_CHAY; A.x = -96; }
        else if (f <= 82) A.x += 16;
        else if (f === 83) { z.otype = 0; z.pose(17); z.gpose(1); z.se('ZG 打撃4'); }
        else if (f <= 119) A.x -= 20;
        else if (f === 120) { G.y = -200; A.x = 840; z.se('Z1 逃げる'); }
        else if (f <= 146) { A.x -= 20; z.back(115, -96 + 16 * (f - 121), STANDARD_CHAY); }
        else if (f <= 159) { if (f === 147) z.se('Z1 強打'); z.t1 = 16; z.back(115, gx0 + 96 - 8 * (f - 147), STANDARD_CHAY); A.x -= 8; }
        else if (f === 160) { z.back(115, gx0, STANDARD_CHAY); z.t1 = 0; z.pose(0); }
        else if (f <= 180) { z.back(115, gx0, STANDARD_CHAY); A.x += 4; }
        else if (f <= 240) { z.back(115, gx0, STANDARD_CHAY); z.otype = 1; z.pose(7); }
        else if (f <= 270) { z.pose(8); A.y -= 16; if (f === 241) z.se('Z1 逃げる'); z.back(115, gx0, STANDARD_CHAY); }
        else if (f <= 360) {
          if (f === 271) { z.otype = 1; z.color = 3; z.pose(4); z.se('Z3 変身'); z.chg = 32; A.x = gx0; A.y = STANDARD_CHAY; }
          z.back(201, 176, 88);
        } else if (f <= 379) { if (f === 361) { z.seStop(); z.se('Z1 高速移動'); A.y = -200; } vanishing(z); }
        else if (f === 380) { A.y = -200; G.x = CENTER_ENEX; G.y = STANDARD_ENEY; z.otype = 1; A.x -= 16; z.gpose(0); }
        else if (f <= 399) { if (f === 381) { A.y = -200; A.x = TEC_CENTER_CHAX; } vanishing(z); }
        else if (f <= 404) A.y = STANDARD_CHAY;
        else if (bardockRush(z, f, rays)) return yield* z.finish();
      } else z.tok = true;
      yield* z.out(rays[0], rays[1]);
    }
  },
  * cmdKakarotto() { // 2970: 龜仙人's MAX kamehameha (his DB3 picture, effect 2), the half-round wave (256); the enemy dashes in,
    // "!", 龜仙人 is knocked away; 巴達克 comes in with his Final Revenger (238), then the onslaught
    const z = this.cmd, A = this.A, G = this.G;
    for (;;) {
      const f = z.top();
      const rays = [356, 112];
      z.color = 3;
      if (!z.tok && z.lead === 32) walkIn(z, f, 24);
      else if (z.tok) {
        if (f >= 1 && f <= 89) {
          if (f === 1) { z.se('Z3 変身'); z.otype = 1; z.pose(6); z.chg = 24; }
          z.color = 0; z.back(201, 218, 88);
        } else if (f === 90) { z.no = 1; z.seStop(); z.se('Z1 気を溜める'); A.y = -100; z.cut = false; }
        else if (f <= 240) z.blt(ROSHI_KAME, (f <= 140 ? 0 : f <= 190 ? 1 : 2) * 64, 0, 64, 96, CENTER_CHAX + 48, STANDARD_CHAY);
        else if (f <= 279) {
          if (f === 241) { z.seStop(); z.se('Z1 エネルギー波2'); z.pose(3); z.efp = 2; }
          z.color = 0; rays[0] = 242; rays[1] = 120;
          z.blt(ROSHI_KAME, 2 * 64, 0, 64, 96, CENTER_CHAX + 48, STANDARD_CHAY);
        } else if (f <= 440) {
          const g = f - 280;
          if (g === 0) { z.cut = true; z.no = 0; z.pose(3); z.fxReset(); A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY; z.efp = 256; }
          rays[0] = 308 + 22; rays[1] = 96 + 16; z.color = 0;
          if (g >= 115 && g <= 143) { if (g === 115) z.se('Z1 吹っ飛ぶ'); z.blt(SURPRISE, 0, 0, 16, 16, A.x + 24, STANDARD_CHAY - 16); }
          else if (g === 144) { z.pose(16); z.efp = 0; } else if (g >= 145 && g <= 154) A.x -= 16; else if (g === 155) z.pose(0);
          if (g === 70) { G.x = 640; G.y = STANDARD_CHAY; z.se('DB3 ダッシュ'); } else if (g >= 71 && g <= 114) G.x -= 8;
          else if (g === 145) { G.x -= 8; z.seStop(); z.gpose(1); z.se('DB3 SE041'); z.se('Z1 飛ぶ'); }
        } else if (f <= 509) { // 巴達克's Final Revenger
          const g = f - 441;
          if (g === 0) { z.t1 = 0; z.se('Z1 大猿'); z.efp = 238; }
          rays[0] = -100 + g * 24; rays[1] = STANDARD_CHAY + 50 - g * 2;
          if (g === 9) z.gpose(17); else if (g >= 10 && g <= 50) { if (f % 6 === 0) z.se('Z2 SE058'); G.x += 24; G.y -= 2; }
        } else if (f === 510) { A.y = -200; G.x = -200; G.y = STANDARD_ENEY; z.otype = 1; A.x = CENTER_CHAX; z.gpose(17); z.efp = 0; z.chg = 32; }
        else if (f <= 529) {
          if (f === 511) { A.y = -200; A.x = CENTER_CHAX; }
          G.x = G.x < CENTER_ENEX ? G.x + 28 : CENTER_ENEX;
          vanishing(z);
        } else if (f <= 534) { A.y = STANDARD_CHAY; z.gpose(0); }
        else if (bardockRush(z, f - 130, rays)) return yield* z.finish();
      } else z.tok = true;
      yield* z.out(rays[0], rays[1]);
    }
  },
});
films({ 869: ['cmdSewayaku', 44], 870: ['cmdKakarotto', 44] },
  { cmdSewayaku: () => [...COMMON, ...SPIRITS_CANNON], cmdKakarotto: () => [...COMMON, ...SPIRITS_CANNON, ROSHI_KAME, SURPRISE] });

// ======================================================================================================
// 860 師弟アタック改 (2960 比克＋超未來悟飯, all.rb 120328) and 861 ナメックウォーリアーズ (2961 比克＋青年, 120868): one film,
// the partner and what he does told apart. The partner below 比克 (pairIn) vanishes (2960) / flies off (2961); 比克
// fires eight balls round the stage (201); the partner's blows (2961: 青年 kicks it to and fro, back on the
// screen-blits); the 魔空包囲弾 balls appear round the enemy one by one, sway and close in; the explosion (104); then
// 2960: 未來悟飯's 魔貫光殺砲 cut-in until all goes white, the drill beam (272 → 255); 2961: two 青年 fire the three
// waves (331) and the huge one hits (48). Damage 44.
// ======================================================================================================
const MAKUU = pic('ZG_戦闘_必殺技_魔空包囲弾.PNG'); // 32×32
const MAKANKO_FG = [pic('Z3_必殺技_カットイン_魔貫光殺砲(未来ゴハン).png'), pic('Z3_必殺技_カットイン_魔貫光殺砲(未来超ゴハン).png')]; // 648×64
const MAKUU_AT = { 0: [220, 90], 20: [360, 280], 37: [472, 90], 59: [190, 164], 81: [520, 170], 99: [224, 260], 117: [360, 60], 139: [470, 274] };
const MAKUU_DIR = [[8, -8], [0, 8], [-8, -8], [8, 0], [-8, 0], [8, 8], [0, -8], [-8, 8]];
const idiv = (a, b) => Math.floor(a / b); // (Ruby's integer division)
Object.assign(ComboDuel.prototype, {
  * cmdShiteiKai() {
    const z = this.cmd, A = this.A, G = this.G, namek = this.combo === 861;
    const p2 = namek ? 15 : this.crew[26] ? 26 : 25, youth = () => z.sheet(15, true);
    const balls = []; // { x, y, k, wx, wy }: @genkityuushin_x / _y, @genkitama_kanri_frame / _x / _y
    const shift = namek ? 30 : 0; // (2961: everything from 591 on is 30 frames later)
    for (;;) {
      const f = z.top();
      let rx = 342, ry = 68;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 4, p2);
      else if (f <= 149) { // the partner goes; 比克 charges green
        const g = f - 60;
        if (g === 0) { z.efp = 0; z.se(namek ? 'Z1 飛ぶ' : 'Z1 高速移動'); z.spd = true; z.se('Z3 変身'); z.color = 1; if (namek) z.t2 = 10; }
        if (!namek && f % 4 === 0 && g <= 20) z.blt(SPARK, 0, 48, 64, 64, TEC_CENTER_CHAX + 16, STANDARD_CHAY + 50 + 20);
        z.back(201, 228, 88 - 50);
        if (namek) z.back(118, TEC_CENTER_CHAX + g * 20, STANDARD_CHAY + 50 - g * 2);
      } else if (f <= 419) { // eight balls round the stage
        const SHOTS = [[181, 80, 9], [196, 104], [241, 140, 11], [256, 116], [301, 80, 9], [316, 104], [361, 140, 11], [376, 116]];
        if (!namek && f === 150) { z.seStop(); z.pose(8); }
        if (f === 211 || f === 331) z.pose(10);
        if (f === 271) { z.seStop(); z.pose(8); }
        const sh = SHOTS.find(([s]) => f >= s && f < s + 15);
        if (sh) {
          if (f === sh[0]) { z.se('ZG エネルギー弾1'); z.eff = 0; }
          if (sh[2]) z.pose(sh[2]);
          z.efp = 201; rx = 320; ry = sh[1] - 50;
        }
      } else if (f === 420) {
        z.chg = p2; z.se('Z1 高速移動'); G.x = CENTER_ENEX; G.y = STANDARD_ENEY;
        if (namek) { A.x = -140; A.y = STANDARD_CHAY; z.otype = 1; z.pose(10); } else A.y = -200;
      } else if (f <= 440) {
        if (namek) A.x += 20;
        else if (f % 4 === 0) z.blt(SPARK, 0, 48, 64, 64, TEC_CENTER_CHAX + 16, STANDARD_CHAY + 20);
      } else if (f <= 590 + shift) { // the partner's blows
        const g = f - 441, x = g - 80;
        if (g === 0) { A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY; z.otype = 0; }
        if (inR(g, 0, 3, 8, 11, 16, 19, 24, 27)) z.pose(1);
        else if (inR(g, 4, 7, 12, 15, 20, 23, 28, 31)) z.pose(2);
        else if (g === 35) { A.x += 48; z.otype = namek ? 0 : 1; z.pose(namek ? 3 : 11); z.se('Z1 強打'); }
        else if (g === 51) z.pose(0);
        else if (g === 60) { z.se('Z1 飛ぶ'); z.otype = 0; z.pose(16); A.x -= 20; A.y -= 6; }
        else if (g >= 61 && g <= 89) { A.x -= 20; if (!namek) A.y -= 6; }
        else if (!namek && g === 90) { z.otype = 1; A.x = -96; A.y = STANDARD_CHAY + 70; z.pose(10); }
        else if (!namek && g >= 91 && g <= 126) { A.x += 24; A.y -= 4; }
        if (namek) { // the other 青年 kicks it to and fro
          if (g === 79) z.se('Z1 飛ぶ');
          else if (g >= 80 && g <= 94) { if (x === 11) z.se('ZG 打撃4'); z.blt(youth(), 0, (x < 11 ? 4 : 8) * 96, 96, 96, -96 + x * 24, STANDARD_CHAY + 60 - x * 4); }
          else if (g >= 95 && g <= 110) z.blt(youth(), 0, 8 * 96, 96, 96, -96 + 15 * 24, STANDARD_CHAY + 60 - 15 * 4);
          else if (g >= 111) z.blt(youth(), 0, 4 * 96, 96, 96, -96 + 15 * 24 - (g - 111) * 16, STANDARD_CHAY + 60 - 15 * 4);
          if (g === 119) z.se('Z1 飛ぶ');
          else if (g >= 120 && g <= 250) { z.blt(youth(), 0, 9 * 96, 96, 96, -96 + (x - 40) * 24, STANDARD_CHAY - 60 + (x - 40) * 2); if (g === 140) z.se('ZG 打撃2'); }
        }
        if ([1, 9, 17, 25].includes(g)) { G.x += 8; z.gpose(16); } else if ([3, 11, 19, 27].includes(g)) G.x -= 8;
        else if ([4, 12, 20, 28].includes(g)) G.x += 8; else if ([6, 14, 22, 30].includes(g)) G.x -= 8;
        else if (g >= 36 && g <= 44) { G.x += 16; z.gpose(17); } else if (g === 45) z.gpose(16);
        else if (g >= 61 && g <= (namek ? 90 : 75)) { z.gpose(0); G.x -= 8; }
        else if (namek && g >= 91 && g <= 105) { G.x += 20; z.gpose(16); }
        else if (namek && g >= 121 && g <= 140) { z.gpose(0); G.x -= 8; }
        else if (namek && g >= 141 && g <= 230) { G.x += 30; z.gpose(17); }
        else if (!namek && g === 107) { z.se('ZG 打撃4'); z.gpose(17); } else if (!namek && g >= 108 && g <= 130) G.x += 32;
        if (g <= 28 && g % 4 === 0) z.se('Z1 打撃');
      } else if (f <= 861 + shift) { // the 魔空包囲弾
        const s = 591 + shift, g = f - s;
        if (g === 0) { z.fxReset(); z.bars = false; z.cutFlag = false; G.x = -100; }
        G.x += 16;
        if (G.x >= CENTER_ENEX) { G.x = CENTER_ENEX; z.gpose(0); }
        const max = 28;
        if (f === s + 170) z.se('Z1 怪しい気');
        balls.forEach((b, i) => {
          const [dx, dy] = MAKUU_DIR[i];
          if (f > s + 169 && f < s + 259 && f % 2 === 0) { // the sway
            if (b.wx === 0) { if (rand(2) === 1) { b.wy = 2; b.wx = 1; } else { b.wy = -2; b.wx = -1; } }
            else if (b.wy === 0) b.wy = b.wx === 1 ? 2 : -2;
            else if (b.wy === 2) { if (b.wx === 1) b.wy = 4; else b.wy = 0; }
            else if (b.wy === 4) { b.wy = 2; b.wx = -b.wx; }
            else if (b.wy === -2) { if (b.wx === 1) b.wy = 0; else b.wy = -4; }
            else if (b.wy === -4) { b.wy = -2; b.wx = -b.wx; }
          }
          const bx = b.x - dx * max + b.k * dx, top = b.y + dy * max - b.k * dy;
          if (top < 356) {
            const h = 356 - top >= 32 ? 32 : 356 - top, by_ = top + b.wy;
            if (f < s + 259) z.blt(MAKUU, 0, 0, 32, h, bx, by_);
            else { // closing in on the enemy over 16 frames
              const n = f - (s + 259);
              z.blt(MAKUU, 0, 0, 32, h, bx + idiv(CENTER_ENEX + 48 - bx, 16) * n, by_ + idiv(STANDARD_ENEY + 48 - by_, 16) * n);
            }
          }
          if (b.k < max) b.k++;
        });
        if (MAKUU_AT[g]) { z.se('ZG 打撃2'); const [x, y] = MAKUU_AT[g]; balls.push({ x, y, k: 1, wx: 0, wy: 0 }); }
      } else if (f <= 900 + shift) { if (f === 862 + shift) { z.eff = 0; z.eft = 0; z.efp = 104; z.se('Z1 爆発1'); z.gpose(17); } }
      else if (!namek) { // 未來悟飯's 魔貫光殺砲
        if (f <= 1030) {
          const s = 901;
          if (f === s) { z.otype = 0; z.se('Z1 気を溜める3'); A.x = TEC_CENTER_CHAX; A.y = -200; G.y = -200; z.gpose(16); }
          const [sx, sy] = shake(4);
          if (f >= s + 115) z.fill(0, 0, 640, 378);
          z.blt(MAKANKO_FG[this.crew[26] ? 1 : 0], 0, 0, 648, 64, -4 + sx, 146 + sy);
          if (f >= s + 117) z.fill(0, 0, 640, 378);
          if (f === s + 129) { z.otype = 1; z.seStop(); z.bars = true; A.y = STANDARD_CHAY; z.cut = true; z.cutFlag = true; z.pose(9); }
        } else if (f <= 1120) {
          A.y = STANDARD_CHAY; rx = 334; ry = 128;
          if (f === 1041) { z.pose(9); z.se('Z1 エネルギー波3'); z.efp = 272; }
        } else if (f === 1121) { z.se('Z1 衝撃波'); z.fxReset(); z.cut = true; z.cutFlag = true; z.displayOut(); z.no = 0; }
        else if (f <= 1147) { ry = 134; z.efp = 255; }
        else if (f === 1148) return yield* z.finish();
      } else { // two 青年 and the three waves
        if (f <= 960) {
          if (f === 931) { G.y = -200; A.x = CENTER_CHAX; A.y = STANDARD_CHAY; z.bars = true; z.cutFlag = true; }
          z.pose(0);
          z.blt(youth(), 0, 96 * 4, 96, 96, 188, STANDARD_CHAY - 64);
          z.blt(youth(), 0, 96 * 5, 96, 96, 188, STANDARD_CHAY + 64);
        } else if (f <= 1059) {
          if (f === 961) z.se('Z1 エネルギー波2');
          z.pose(1);
          z.blt(youth(), 0, 96 * 6, 96, 96, 188, STANDARD_CHAY - 64);
          z.blt(youth(), 0, 96 * 7, 96, 96, 188, STANDARD_CHAY + 64);
          z.efp = 331;
        } else if (f === 1060) { z.fxReset(); z.displayOut(); z.color = 0; }
        else if (f <= 1087) z.efp = 48;
        else if (f === 1088) return yield* z.finish();
      }
      yield* z.out(rx, ry);
    }
  },
});
films({ 860: ['cmdShiteiKai', 44], 861: ['cmdShiteiKai', 44] }, { cmdShiteiKai: () => [...COMMON, MAKUU, ...MAKANKO_FG] });

// ======================================================================================================
// 824 未来のZ戦士 (2924 超未來悟飯＋超特蘭克斯, all.rb 114026). Two versions by 特蘭克斯's clothes (variable 173): 0 / 4 —
// 特蘭克斯 flies up, comes down at the enemy and cuts it (the sword effects 267-269; with 0 the シャイニングソード
// アタック picture), then dashes and strikes; 1-3 — 悟飯 dashes in and strikes, later 特蘭克斯 kicks it. Both: 悟飯
// knocks it across and back and down and up (the shared middle, 2924's 680-899 / 350-569), both charge and fire (295,
// then 48), damage 44.
// ======================================================================================================
const SHINING = [pic('Z3_必殺技_シャイニングソードアタック.png'), pic('Z3_必殺技_シャイニングソードアタック(フリーザ付).png')]; // 340×346
// the shared middle, `k` in the 0 / 4 version's numbering (680-899); `cutOn`: when the spark of 756 goes (the 0 / 4
// version clears it at once — its `>= 374` is always true)
function futureMiddle(z, k, s756cut, rays) {
  const A = z.d.A, G = z.d.G;
  if (k === 680) { z.pose(15); A.x = 740; A.y = STANDARD_ENEY; }
  else if (k <= 694) A.x -= 28;
  else if (k <= 715) {
    if (k === 695) { z.se('ZG 打撃2'); A.x -= 28; }
    z.efp = k >= 703 ? 0 : 123; rays[0] = 324; rays[1] = 158;
    z.pose(17); z.gpose(17); G.x -= 20;
  } else if (k <= 734) { if (k === 716) z.se('Z1 飛ぶ'); z.pose(15); A.x -= 28; G.x -= 20; }
  else if (k === 735) { z.fxReset(); A.x = 900; A.y = STANDARD_ENEY; G.x = 640; G.y = STANDARD_ENEY; }
  else if (k <= 754) { A.x -= 28; G.x -= 20; }
  else if (k === 755) { z.se('ZG 打撃5'); A.x -= 28; z.pose(16); }
  else if (k <= 779) { z.efp = k >= s756cut ? 0 : 123; rays[0] = 324; rays[1] = 158; G.x -= 4; G.y += 16; }
  else if (k === 780) {
    z.fxReset(); z.cut = false; z.cutFlag = false; z.no = 1;
    A.x = CENTER_CHAX - 30; A.y = -184; G.x = CENTER_ENEX - 40; G.y = -140; z.pose(10); z.se('Z1 飛ぶ');
  } else if (k <= 794) { G.y += 16; A.y += 24; A.x += 4; }
  else if (k === 795) { z.pose(18); z.se('ZG 打撃1'); }
  else if (k <= 829) { if (k % 4 === 0) G.x += 4; else if (k % 2 === 0) G.x -= 4; A.y -= 4; G.y -= 4; }
  else if (k === 830) { z.otype = 1; z.pose(20); z.se('ZG 打撃4'); }
  else if (k <= 859) { A.y += 2; G.y += 16; }
  else if (k === 860) { z.se('Z1 飛ぶ'); z.pose(29); }
  else if (k <= 879) { A.y -= 16; A.x -= 16; }
}
// the end, `k` in the 0 / 4 version's numbering (900-1154); true when it is over
function futureFinal(z, k, suit) {
  const A = z.d.A, bx = 234, by_ = -18 + 54 + 50;
  if (k === 900) {
    z.cut = true; z.cutFlag = true; z.no = 0; z.otype = 1; z.chg = 26; z.c2 = 20; z.efp = 92;
    z.se('Z3 変身'); z.se('Z1 気を溜める'); z.se('Z1 気を溜める4'); z.se('Z1 気を溜める6');
    z.color = 3; A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY - 50;
    z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
  } else if (k <= 1027) {
    if (k === 901) { z.efp = 0; z.eff = 0; z.pose(4); z.t2 = suit ? 12 : 10; z.color = 3; }
    if (k === 961) z.pose(5);
    z.back(201, bx - 8, by_ + 50); z.bf--;
    z.back(201, bx - 8, by_ - 50); z.bf--;
    z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
  } else if (k <= 1126) {
    if (k === 1028) { z.seStop(); z.se('Z1 エネルギー波'); z.se('Z1 大猿'); z.se('ZG 光線1'); A.x += 2; z.pose(2); z.t2 = suit ? 13 : 11; z.efp = 295; }
    z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
  } else if (k === 1127) { z.fxReset(); z.gpose(16); z.displayOut(); }
  else if (k <= 1153) z.efp = 48;
  else if (k === 1154) return true;
  return false;
}
Object.assign(ComboDuel.prototype, {
  * cmdFutureZ() {
    const z = this.cmd, A = this.A, G = this.G, c173 = v(173), suit = [1, 2, 3].includes(c173), bx = 234, by_ = -18 + 54 + 50;
    const ss4 = !!this.crew[20], cuts = [[500, 4, 22, 267, 8, -22], [510, 6, 22, 268, 5, -22], [520, 4, 22, 267, 3, -16], [530, 4, 16, 269, 5, -22],
      [540, 4, 22, 267, 8, -22], [550, 6, 22, 268, 5, -22], [560, 4, 22, 267, 3, -16], [570, 4, 16, 269]]; // the sword strokes
    for (;;) {
      const f = z.top();
      const rays = [324, 80];
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
      else if (f <= 59) pairIn(z, f, 26, 20);
      else if (f === 60) { z.se('Z3 変身'); z.se('Z1 気を溜める'); z.color = 3; }
      else if (f <= 187) {
        z.efp = 0; z.eff = 0; z.pose(4); z.t2 = 0; z.color = 3;
        z.back(201, bx - 8, by_ + 50); z.bf--;
        z.back(201, bx - 8, by_ - 50); z.bf--;
        z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
      } else if (!suit) { // ---- 0 / 4: the sword ----
        if (f <= 247) { // 特蘭克斯 flies up
          if (f === 188) { z.t2 = 16; z.se('Z1 飛ぶ'); }
          z.back(201, bx - 8, by_ - 50);
          z.back(117, TEC_CENTER_CHAX, STANDARD_CHAY + 50 - (f - 188) * 24); z.bf--;
          if (f === 247) { z.f = 370; z.seStop(); }
        } else if (f === 371) { // and comes down at the enemy
          z.chg = 20; z.no = 3; z.otype = 1; z.pose(3); z.gpose(0);
          A.x = CENTER_ENEX - (96 + 8 * 49); A.y = STANDARD_ENEY - 8 * 49;
          G.x = CENTER_ENEX + 8 * 52; G.y = STANDARD_ENEY + 8 * 52;
          z.gy = 0; z.fxReset();
        } else if (f <= 590) {
          if (f <= 420) { A.x += 8; A.y += 8; }
          if (f <= 450) { // (@effect_anime_* as a 3-frame timer: he wobbles)
            if (z.eft === 0 && z.eff === 0) A.x += 4; else if (z.eft === 1 && z.eff === 0) A.x -= 4;
            if (z.eff >= 2) { z.eft = z.eft === 0 ? 1 : 0; z.eff = 0; } else z.eff++;
          }
          if (f >= 430 && f <= 455) {
            G.x -= 16; G.y -= 16;
            if (f === 455) { z.pose(4); A.x += 16; z.se('DB3 刀'); z.cut = true; if (c173 !== 0 && ss4) z.efp = 269; }
          }
          if (f >= 455 && f <= 491 && c173 === 0 && ss4) { // the シャイニングソードアタック picture
            A.y = -200; G.y = -200;
            if (v(96) === 1) z.cut = false;
            z.blt(SHINING[v(96) === 1 ? 1 : 0], 0, 0, 340, 346, 100, 10);
          }
          if (f === 492) { z.cut = true; A.y = 120; G.y = 120; z.pose(5); A.x -= 22; }
          for (const [at, p1, dx, fx, p2, dx2] of cuts) {
            if (f === at) { z.se('DB3 刀'); z.pose(p1); A.x += dx; z.rt = 0; z.rf = 0; z.efp = fx; }
            else if (p2 != null && f === at + 6) { z.pose(p2); A.x += dx2; }
          }
          if (z.efp === 267 || z.efp === 268) { rays[0] = 228; rays[1] = 134 - 16; }
          else if (z.efp === 269 || z.efp === 270) { rays[0] = 292; rays[1] = 70; }
          else if (z.efp === 256) { rays[0] = 336 - 32; rays[1] = 112; }
        } else if (f <= 622) { // he dashes back and in
          const g = f - 591;
          if (g === 0) { z.no = 0; z.seStop(); z.se('Z1 飛ぶ'); z.pose(16); z.otype = 0; }
          if (g <= 15) A.x -= 8; else if (g >= 24) { A.x += 24; if (g === 27) z.pose(3); }
        } else if (f <= 650) { if (f === 623) { z.se('Z1 強打'); z.gpose(16); } G.x += 24; G.y -= 16; }
        else if (f <= 679) { // 悟飯 brings it back
          const s = 651;
          if (f === s) { G.x = -100; G.y = STANDARD_ENEY + 50; A.x = -150; A.y = STANDARD_ENEY + 50; z.se('Z1 飛ぶ'); z.chg = 26; z.otype = 1; z.pose(10); }
          if (f <= s + 23) { G.x += 16; G.y -= 2; } else z.gpose(0);
          A.x += 28; A.y -= 4;
        } else if (f <= 899) futureMiddle(z, f, 374, rays);
        else if (futureFinal(z, f, suit)) return yield* z.finish();
      } else { // ---- 1-3: 悟飯 first ----
        if (f <= 240) { // 悟飯 flies off
          if (f === 188) { z.se('Z1 飛ぶ'); z.pose(7); } else A.x += 20;
          z.back(201, bx - 8, by_ + 50); z.bf--;
          z.back(118, TEC_CENTER_CHAX, STANDARD_CHAY + 50);
        } else if (f === 241) { z.seStop(); G.x = CENTER_ENEX; G.y = STANDARD_ENEY; z.otype = 1; A.x = -320; A.y = STANDARD_CHAY; }
        else if (f <= 270) A.x += 20;
        else if (f === 271) { z.pose(11); z.se('Z1 強打'); }
        else if (f <= 300) { z.gpose(16); z.efp = 0; G.x += 20; G.y -= 4; } // (the spark of 123 goes at once: `>= 220`)
        else if (f <= 320) { z.fxReset(); A.x += 24; A.y -= 4; z.pose(10); }
        else if (f <= 349) {
          const s = 321;
          if (f === s) { G.x = -100; G.y = STANDARD_ENEY + 50; A.x = -150; A.y = STANDARD_ENEY + 50; }
          if (f <= s + 23) { G.x += 16; G.y -= 2; } else z.gpose(0);
          A.x += 28; A.y -= 4;
        } else if (f <= 569) futureMiddle(z, f + 330, 434 + 330, rays);
        else if (f <= 583) { // 特蘭克斯 flies in
          if (f === 570) { z.se('Z1 飛ぶ'); A.x = -96; A.y = STANDARD_CHAY; G.y = -100; z.chg = 20; z.otype = 1; z.pose(8); }
          else { A.x += 24; G.y = Math.min(STANDARD_CHAY, G.y + 18); }
        } else if (f <= 612) { // his blows
          const g = f - 584;
          if (g === 0) z.se('Z1 強打');
          if (inR(g, 7, 10, 15, 18, 23, 26, 31, 34)) { z.otype = 0; A.x += 2; z.pose(1); } else if (inR(g, 11, 14, 19, 22, 27, 30, 35, 38)) { A.x += 2; z.pose(2); }
          if (g <= 3) { G.x += 16; G.y -= 4; z.gpose(16); } else if (g <= 6) { G.x -= 16; G.y += 4; } else G.x += 2;
          if (g >= 7 && (g - 7) % 4 === 0 && g <= 35) z.se('Z1 打撃');
        } else if (f <= 630) { if (f === 613) { z.se('Z1 強打'); z.pose(3); z.gpose(17); } G.x += 24; G.y -= 24; }
        else if (f <= 659) { if (f === 631) { z.se('Z1 飛ぶ'); z.pose(16); } A.x -= 16; A.y -= 24; }
        else if (futureFinal(z, f + 240, suit)) return yield* z.finish();
      }
      yield* z.out(rays[0], rays[1]);
    }
  },
});
films({ 824: ['cmdFutureZ', 44] }, { cmdFutureZ: () => [...COMMON, ...SHINING] });

// ======================================================================================================
// 836 / 837 ロイヤルガード (2936 超貝吉塔 / 2937 超特蘭克斯 with 巴達克's crew, all.rb: one film, the prince told
// apart). Whoever starts it drifts in with the other four behind (backs 116-122), the prince takes the front, all
// five charge and fire one huge blue wave (effect 358), the enemy is hit (353, damage 44).
// ======================================================================================================
// the lead's drift at 1-24 and where the four others are (the four of 27 28 29 30 / the prince not leading)
const ROYAL_LEAD = { // [ax, ay, frames, [dx, dy] of backs 116 118 120 122]
  prince: [-4, 0, 24, [[24, -48], [24, 48], [-48, -72], [-48, 72]]],
  27: [0, -2, 25, [[-68, 0], [24, 48], [-48, -72], [-48, 72]]],
  28: [0, 2, 25, [[-68, 0], [24, -48], [-48, -72], [-48, 72]]],
  29: [-3, -3, 25, [[-68, 0], [24, -48], [24, 48], [-48, 72]]],
  30: [-3, 3, 25, [[-68, 0], [24, -48], [24, 48], [-48, -72]]],
};
Object.assign(ComboDuel.prototype, {
  * cmdRoyalGuard() {
    const z = this.cmd, A = this.A;
    const trunks = this.combo === 837, prince = trunks ? (this.crew[20] ? 20 : 17) : 19; // ($super_saiyazin_flag[4])
    const suit = v(173); // トランクスの衣装No
    const idougo = 212 - 18, idouryou = 8, rx = 346, ry = 84;
    const four = () => { // 40-299: the crew round the prince
      z.back(116, A.x + 92, STANDARD_CHAY - 48); // トーマ
      z.back(118, A.x + 92, STANDARD_CHAY + 48); // セリパ
      z.back(120, idougo, STANDARD_CHAY - 72); // トテッポ
      z.back(122, idougo, STANDARD_CHAY + 72); // パンブーキン
    };
    for (;;) {
      const f = z.top();
      z.color = 3;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); } else if (f <= 39) {
        const lp = z.lead === 19 || z.lead === 17 || z.lead === 20, [ax, ay, n, at] = ROYAL_LEAD[lp ? 'prince' : z.lead] || ROYAL_LEAD[30];
        if (f < n) { z.ax = ax; z.ay = ay; } else { z.ax = 0; z.ay = 0; }
        [z.c1, z.c2, z.c3, z.c4] = lp ? [27, 28, 29, 30] : [prince, ...[27, 28, 29, 30].filter((c) => c !== z.lead)];
        [116, 118, 120, 122].forEach((b, i) => z.back(b, STANDARD_CHAX + f * idouryou + at[i][0], STANDARD_CHAY + at[i][1]));
      } else if (f <= 59) {
        z.ax = 0; z.ay = 0;
        A.x = TEC_CENTER_CHAX - 92; A.y = STANDARD_CHAY;
        z.chg = prince;
        z.c1 = 27; z.c2 = 28; z.c3 = 29; z.c4 = 30;
        four();
      } else if (f === 60) {
        z.se('Z1 ザー'); z.se('Z1 ゴー'); z.se('DB3 気を溜める2'); z.se('Z1 気を溜める6');
        z.otype = 1;
        z.pose(trunks && (suit === 0 || suit === 4) ? 10 : 12);
        z.t1 = 2; z.t2 = 0; z.t3 = 2; z.t4 = 4;
        four();
      } else if (f <= 189) four();
      else if (f === 190) {
        z.seStop(); z.se('Z1 エネルギー波2'); z.se('Z1 ゴー'); z.se('DB3 大猿'); z.se('ZG 光線1');
        z.pose(trunks && (suit === 0 || suit === 4) ? 11 : 13);
        z.t1 = 4; z.t2 = 4; z.t3 = 3; z.t4 = 2;
        z.efp = 358;
        four();
      } else if (f <= 299) four();
      else if (f === 300) { z.eff = 0; z.efp = 0; z.displayOut(); } else if (f >= 302 && f <= 326) z.efp = 353;
      else if (f === 327) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 836: ['cmdRoyalGuard', 44], 837: ['cmdRoyalGuard', 44] }, { cmdRoyalGuard: () => COMMON });

// ======================================================================================================
// 839 / 840 親子乱舞 (2939 超悟空・超悟飯・琪琪 / 2940 超悟空・超未來悟飯・琪琪: one film, the son told apart).
// The three gather; 悟空 and the son charge, 琪琪 is startled; 悟空 flies up, the son dashes off, 琪琪 pummels the
// enemy and sends him flying, the son kicks him back, 悟空 lands a flurry, kicks him up; the three charge and fire
// the huge wave (295 → 48, damage 44).
// ======================================================================================================
const BIKKURI = pic('戦闘アニメ_ビックリマーク.PNG');
const OYAKO_SON = { 839: [18, 7, 0, 11, 12, 3], 840: [26, 10, 36, 4, 1, 1] }; // the son, his types at 91 / 441 / 508 (t2), x shift at 148-266, his aura colour
Object.assign(ComboDuel.prototype, {
  * cmdOyakoRanbu() {
    const z = this.cmd, A = this.A, G = this.G, [son, t2a, sx, t2b, t2c, sc] = OYAKO_SON[this.combo];
    const idougo = 212 + 24, idouryou = 8, bx = TEC_CENTER_CHAX - 34, by_ = STANDARD_CHAY - 24;
    for (;;) {
      const f = z.top();
      let rx = 302, ry = 64;
      z.color = 0;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); } else if (f <= 39) {
        if (z.lead === son || z.lead === 10) { // 悟飯 / 琪琪 drift in, the other two behind
          const chichi = z.lead === 10;
          if (f < 16) { z.ax = -2; z.ay = chichi ? -4 : 4; } else if (f === 16) z.ax = 0; else { z.ax = 0; z.ay = 0; }
          z.c1 = 14; z.c2 = chichi ? son : 10;
          z.back(116, STANDARD_CHAX + f * idouryou + 16, STANDARD_CHAY);
          z.back(118, STANDARD_CHAX + f * idouryou - 14, STANDARD_CHAY + (chichi ? 64 : -64));
        } else { // 悟空
          z.c1 = 10; z.c2 = son;
          z.back(116, STANDARD_CHAX + f * idouryou - 14, STANDARD_CHAY - 64);
          z.back(118, STANDARD_CHAX + f * idouryou - 14, STANDARD_CHAY + 64);
        }
      } else if (f <= 59) {
        z.ax = 0; z.ay = 0;
        z.chg = 14; z.c1 = 10; z.c2 = son;
        A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY;
        z.back(116, idougo, STANDARD_CHAY - 64);
        z.back(118, idougo, STANDARD_CHAY + 64);
      } else if (f === 60) {
        z.se('Z1 気を溜める'); z.se('Z1 飛ぶ');
        z.otype = 1; z.pose(0);
        z.t1 = 6; z.t2 = 0;
        z.back(116, idougo, STANDARD_CHAY - 64);
        z.back(118, idougo, STANDARD_CHAY + 64);
      } else if (f <= 90) { // 61-90: 悟空 and the son charge, 琪琪 is pushed aside
        const x = f - 61;
        z.color = 3;
        z.back(201, bx, by_);
        z.color = sc; z.bf--;
        z.back(201, bx - 44, by_ + 64); z.bf--;
        z.back(116, idougo + x * 24, STANDARD_CHAY - 64); z.bf--;
        z.back(118, idougo, STANDARD_CHAY + 64);
        if (f >= 71) {
          if (f === 71) z.se('Z1 吹っ飛ぶ');
          z.blt(BIKKURI, 0, 0, 16, 16, idougo + 104, STANDARD_CHAY + 64 - 66);
          z.blt(BIKKURI, 0, 0, 16, 16, idougo + 54, STANDARD_CHAY + 64 + 32);
        }
      } else if (f <= 130) { // 91-130: 悟空 flies up, the son dashes off
        const x = f - 91;
        if (f === 91) { z.seStop(); z.otype = 0; z.pose(16); z.t2 = t2a; z.se('Z1 飛ぶ'); z.se('DB3 ダッシュ'); }
        A.y -= 20;
        z.back(118, idougo + x * 24, STANDARD_CHAY + 64);
      } else if (f <= 147) { // 131-147: 琪琪 flies in
        const x = f - 131;
        if (f === 131) { G.x = CENTER_ENEX; G.y = STANDARD_ENEY; z.se('Z1 飛ぶ'); }
        z.back(116, -96 + x * 24, STANDARD_CHAY - 64 + 32 + x * 2);
      } else if (f <= 250) { // 148-250: 琪琪's flurry, the enemy sent up to the right, the son after him
        const k = f - 148, y = f - (148 + 53);
        if (k <= 31) { A.x += 2; z.t1 = (k >> 2) & 1 ? 2 : 1; } else if (k === 35) { z.t1 = 4; z.se('Z1 強打'); } else if (k === 51) z.t1 = 0;
        else if (k === 53) z.se('DB3 ダッシュ'); else if (k === 73) z.se('Z1 強打');
        if (k <= 31) {
          const m = k % 8;
          if (m === 1) { G.x += 8; z.gpose(16); } else if (m === 3 || m === 6) G.x -= 8; else if (m === 4) G.x += 8;
        } else if (k >= 36 && k <= 44) { G.x += 16; z.gpose(17); } else if (k === 45) z.gpose(16);
        else if (k >= 61 && k <= 71) { z.gpose(0); G.x -= 8; } else if (k >= 73 && k <= 100) { z.gpose(16); G.y -= 4; G.x += 24; }
        if (k <= 28 && k % 4 === 0) z.se('Z1 打撃');
        z.back(115, TEC_CENTER_CHAX, STANDARD_CHAY); // 琪琪
        z.back(118, -96 + y * 24 - sx, STANDARD_CHAY + 64 - y * 4); // 悟飯
      } else if (f <= 266) { // 251-266: the enemy comes up from the left, the son behind him
        const x = f - 251;
        if (f === 251) { G.y = STANDARD_CHAY + 64 + 18; G.x = -200; }
        z.back(118, -176 + x * 24 - sx, STANDARD_CHAY + 64 - x * 4);
        z.gpose(16); G.y -= 4; G.x += 24;
      } else if (f <= 329) { // 267-329: the son (the member now) catches him and kicks him away
        const x = f - 267;
        if (f === 267) { A.x = G.x; A.y = G.y - 18; z.chg = son; z.otype = 1; z.pose(0); }
        if (x === 4) { z.otype = 0; z.pose(0); z.se('DB3 気を溜める2'); } else if (x === 20) { z.otype = 1; z.pose(1); z.seStop(); z.se('Z1 高速移動'); }
        if (x <= 3) { z.gpose(16); G.y -= 4; G.x += 24; } else if (x === 4) z.gpose(0); else if (x >= 12 && x <= 19) G.x -= 8;
        else if (x === 21) z.se('Z3 跳ね返し'); else if (x >= 22 && x <= 50) { z.gpose(17); G.x += 24; }
      } else if (f <= 388) { // 330-388: 悟空 comes in from the right, his flurry
        const x = f - 330;
        if (f === 330) { G.x = -200; A.x = 640; A.y = STANDARD_CHAY; z.otype = 1; z.chg = 14; }
        if (x >= 16 && x <= 23) { A.x -= 18; z.pose(10); } else if (x >= 24 && x <= 25) { A.x -= 18; z.pose(11); } else if (x >= 30 && x <= 58) {
          A.x -= 2; z.pose(x < 54 && ((x - 30) >> 2) & 1 ? 12 : 13);
        }
        if (x <= 24) G.x += 24; else if (x === 25) { G.x += 24; z.gpose(16); } else if (x <= 58) G.x -= 2;
        if (x === 25) z.se('Z1 強打'); else if (x >= 30 && x <= 54 && x % 4 === 2) z.se('Z1 打撃');
      } else if (f <= 440) { // 389-440: the kick up
        const x = f - 389;
        if (f === 389) z.se('Z1 飛ぶ');
        if (x <= 8) { A.x += 16; A.y += 8; z.pose(16); } else if (x <= 12) { A.x -= 24; A.y -= 14; z.pose(14); } else if (x === 13) { A.x -= 24; A.y -= 16; z.se('ZG 打撃4'); }
        else if (x >= 29 && x <= 50) { A.y -= 24; z.pose(16); }
        if (x >= 13 && x <= 50) { G.x -= 24; G.y -= 8; z.gpose(17); }
        if (x === 13) z.se('ZG 打撃4'); else if (x === 29) z.se('Z1 飛ぶ');
      } else if (f <= 507) { // 441-507: the three charge
        if (f === 441) {
          z.chg = 14; z.c1 = 10; z.c2 = son;
          A.x = TEC_CENTER_CHAX; A.y = STANDARD_CHAY;
          z.otype = 1; z.pose(2);
          z.t1 = 5; z.t2 = t2b;
          z.se('Z1 気を溜める'); z.se('Z1 気を溜める2');
        }
        z.color = 0;
        z.back(201, bx - 44, by_ - 64); z.bf--;
        z.color = 3;
        z.back(201, bx, by_); z.bf--;
        z.color = sc;
        z.back(201, bx - 44, by_ + 64); z.bf--;
        z.back(116, idougo, STANDARD_CHAY - 64); z.bf--;
        z.back(118, idougo, STANDARD_CHAY + 64);
      } else if (f <= 619) { // 508-619: fire
        if (f === 508) {
          z.seStop(); z.pose(3); z.t1 = 4; z.t2 = t2c;
          z.se('Z1 大猿'); z.se('ZG 光線1'); z.se('Z1 ゴー'); z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2');
          z.color = 0;
        }
        rx = 356; ry = 68;
        z.back(116, idougo, STANDARD_CHAY - 64); z.bf--;
        z.back(118, idougo, STANDARD_CHAY + 64);
        z.efp = 295;
      } else if (f === 620) { z.eff = 0; z.efp = 0; z.displayOut(); } else if (f >= 622 && f <= 647) z.efp = 48;
      else if (f === 648) return yield* z.finish();
      yield* z.out(rx, ry);
    }
  },
});
films({ 839: ['cmdOyakoRanbu', 44], 840: ['cmdOyakoRanbu', 44] }, { cmdOyakoRanbu: () => [...COMMON, BIKKURI] });

// ======================================================================================================
// 863 オメエもピッコロとおなじけ！ (2963 琪琪＆青年) / 865 866 867 悟空さに近寄るでねえ！ (2965 2966 2967 琪琪＆
// 18 / 17 / 16號): one film, the partner (cha2no) told apart. 琪琪 (back 116, left of the partner) powers up, the
// partner vanishes (afterimages), 琪琪 charges off to the right; she runs in from the left and knocks the enemy
// down (damage 22 with @tec_kyouda_se).
// ======================================================================================================
const CHICHI_PAL = { 863: 15, 865: 21, 866: 22, 867: 23 };
Object.assign(ComboDuel.prototype, {
  * cmdChichiPal() {
    const z = this.cmd, A = this.A, G = this.G, pal = CHICHI_PAL[this.combo];
    const idouryou = 8, bx = 224 - 160, by_ = 88;
    for (;;) {
      const f = z.top();
      z.color = 0;
      if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); } else if (f <= 39) {
        if (z.lead === pal) { z.c1 = 10; z.back(116, STANDARD_CHAX + f * idouryou + 16 - 160, STANDARD_CHAY); } else if (z.lead === 10) {
          z.c1 = pal;
          z.ax = f <= 20 ? -8 : 0;
          z.back(116, STANDARD_CHAX + f * idouryou + 16, STANDARD_CHAY);
        }
      } else if (f <= 59) {
        if (f === 40 && z.lead === 10) A.x += 160;
        z.ax = 0; z.ay = 0;
        z.chg = pal; z.c1 = 10;
        z.back(116, A.x - 160, STANDARD_CHAY);
      } else if (f === 60) {
        z.otype = 1; z.t1 = 5;
        z.back(116, A.x - 160, STANDARD_CHAY);
        z.se('Z3 変身');
      } else if (f <= 200) { // 61-200: 琪琪 powers up
        if (f === 150) { z.seStop(); z.se('Z1 気を溜める'); }
        z.back(201, bx, by_); z.bf--;
        z.back(116, A.x - 160, STANDARD_CHAY);
      } else if (f === 201) {
        z.seStop(); z.t1 = 6; z.se('Z1 飛ぶ');
        z.back(201, bx, by_); z.bf--;
        z.back(116, A.x - 160 + 24, STANDARD_CHAY);
        A.y = -200;
      } else if (f <= 239) { // 202-239: his afterimages, 琪琪 dashes off
        const k = f - 202;
        if (k === 0) z.se('Z3 避ける');
        if (f % 4 === 0) z.blt(pic('戦闘アニメ.PNG'), 0, 48, 64, 64, A.x, STANDARD_CHAY + 30);
        z.bf--;
        z.back(116, A.x - 160 + (k + 1) * 24, STANDARD_CHAY);
        if (k >= 4) z.blt(BIKKURI, 0, 0, 16, 16, A.x - 160 + (k + 1) * 24 + 20, STANDARD_CHAY);
      } else if (f === 240) { z.t1 = 6; z.fxReset(); } else if (f === 250) {
        z.displayOut();
        A.y = STANDARD_CHAY; A.x = -146;
        z.chg = 10; z.otype = 1; z.pose(6);
        z.se('Z1 飛ぶ');
      } else if (f >= 251 && f <= 277) { // 琪琪 runs in from the left
        A.x += 16;
        if (f - 251 >= 4) z.blt(BIKKURI, 0, 0, 16, 16, A.x + 20, STANDARD_CHAY);
      } else if (f >= 278 && f <= 297) { // the blow
        const k = f - 278, d = 24;
        if (k <= 3) { G.x += 36; z.gpose(16); if (k === 0) z.se('Z1 強打'); } else if (k <= 7) { G.x -= 36; z.gpose(0); }
        if (k <= 1) { z.otype = 0; z.pose(16); A.y -= d; } else if (k === 2) { A.y -= d / 2; A.x -= d; } else if (k <= 4) A.x -= d / 2;
        else if (k === 5) { A.y += d / 2; A.x -= d; } else if (k <= 7) A.y += d;
        else if (k >= 16 && k <= 18) { if (k === 16) z.se('Z1 飛ぶ'); A.x += 24; } else if (k === 19) z.pose(3);
      } else if (f === 298) { z.kyouda = true; return yield* z.finish(); }
      yield* z.out();
    }
  },
});
films({ 863: ['cmdChichiPal', 22], 865: ['cmdChichiPal', 22], 866: ['cmdChichiPal', 22], 867: ['cmdChichiPal', 22] }, { cmdChichiPal: () => [...COMMON, BIKKURI] });

// ======================================================================================================
// ?dev=cmd<combo> (e.g. ?dev=cmd801; cmd876z2 with variable 40 = 1): variable 40 = 2, the combo's members in the party (Super Saiyans turned), every
// combo switch on, Lv 60, a fight with 甜菜人 ×3 (high HP). In the console: __cmbx(combo) fires it through the rules
// (src/combo_dev.js), __cmdPlay(combo, lead) plays its film straight away with `lead` as the one whose turn it is.
// ======================================================================================================
registerZ3('cmd', {
  dev(game, step) {
    const m = /^cmd(\d+)(z2)?$/.exec(step);
    if (!m) return false;
    const id = Number(m[1]), s = game.state = game.newState(), w = game.world;
    s.var[40] = m[2] ? 1 : 2; // (cmd876z2: the Z2 switch's 1976)
    s.flags.z3 = 'done';
    comboData.then((d) => {
      for (const c of d.combos) if (c.sw) s.sw[c.sw] = true;
      const row = d.combos.find((c) => c.id === id) || d.combos[0];
      const base = { 14: 3, 18: 5, 19: 12, 20: 17, 26: 25, 32: 16 };
      const ids = [...new Set(row.cha.map((a) => base[a] || a))];
      for (const filler of [3, 4, 5, 6, 7, 8]) if (ids.length < 4 && !ids.includes(filler)) ids.push(filler);
      party(game, ids);
      for (const a of row.cha) if (SS_NO[a]) superSaiyan(w, s, SS_NO[a], true);
      for (const p of s.party) { p.level = 60; p.exp = w.actors[p.id].exp[60]; applyLevel(w, p); heal(p); }
      for (const p of s.party) {
        for (const c of d.combos) c.cha.forEach((a, x) => { if (a === p.id && !p.skills.includes(c.tec[x])) p.skills.push(c.tec[x]); });
        p.skills.sort((x, y) => x - y);
      }
      s.skillLv = {};
      for (const c of d.combos) for (const t of c.tec) s.skillLv[t] = 999;
      s.combos = [];
      s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
      game.startField();
      setTimeout(() => game.startBattle([1, 1, 1], false, { loseOk: true }), 300);
      const tough = () => { const b = game.scene; if (b && b.constructor.name === 'Battle' && b.foes[0]) for (const f of b.foes) f.hp = f.maxhp = 999999; else setTimeout(tough, 100); };
      setTimeout(tough, 400);
      window.__cmdPlay = (combo, lead) => play(game, d, combo || id, lead);
      window.__cmdSheet = (combo, lead, every, from, to) => contactSheet(game, d, combo || id, lead, every, from, to);
    });
    return true;
  },
});
function play(game, d, combo, lead) {
  const b = game.scene, w = game.world;
  const row = d.combos.find((c) => c.id === combo);
  if (!b || !b.foes || !row) return 'no battle / combo';
  lead = lead || row.cha[0];
  const foe = b.foes.find((f) => f.hp > 0) || b.foes[0], crew = {};
  for (const a of row.cha) {
    const mm = b.party.find((p) => p.id === a), act = w.actors[a];
    crew[a] = { normal: (mm && mm.sprite) || act.sprite, special: (mm && mm.special) || act.special, size: mm && mm.spriteSize };
  }
  b.duel = { m: { id: lead }, f: foe };
  b.anim = new ComboDuel({ party: crew[lead], foe: { normal: foe.portrait, special: foe.sprite, size: foe.size }, combo, crew, lead,
    tecs: {}, damage: 1234, margin: Math.max(0, (SW - view.w) / 2), onHit: () => {} });
  b.anim.finished.then(() => { b.anim = null; });
  return row.name;
}
// __cmdSheet(combo, lead, every = 20): the whole film stepped at once (its pictures loaded first) and every `every`-th
// frame laid out on a sheet over the page (click it away); returns the number of frames and any error
async function contactSheet(game, d, combo, lead, every = 20, from = 0, to = 1e9) {
  play(game, d, combo, lead);
  const b = game.scene, an = b.anim;
  b.anim = null; // (stepped here, not by the battle)
  await Promise.all([...MINE[an.cmdFilm](), ...Object.values(an.crew).flatMap((s) => [s.normal, s.special]), an.R.sheets.normal,
    ...ZF_IMAGES, pic('Z2_味方カットイン.PNG')].map((p) => img(p).p));
  const shots = [];
  let err = null;
  try {
    for (let n = 0; !an.done && n < 20000; n++) {
      an.step();
      if (an.t >= from && an.t <= to && an.t % every === 0) {
        const cv = document.createElement('canvas'); cv.width = 320; cv.height = 178;
        const c = cv.getContext('2d'); c.fillStyle = '#226'; c.fillRect(0, 0, 320, 178); c.drawImage(an.render(), 0, 0, 320, 178);
        c.fillStyle = '#ff0'; c.font = '14px monospace'; c.fillText(String(an.t), 4, 14);
        shots.push(cv);
      }
    }
  } catch (e) { err = String(e && e.stack || e); }
  const cols = 4, rows = Math.ceil(shots.length / cols), sheet = document.createElement('canvas');
  sheet.width = cols * 322; sheet.height = rows * 180;
  const c = sheet.getContext('2d');
  shots.forEach((s, i) => c.drawImage(s, (i % cols) * 322, Math.floor(i / cols) * 180));
  let el = document.getElementById('cmdsheet');
  if (!el) { el = document.createElement('img'); el.id = 'cmdsheet'; el.style.cssText = 'position:fixed;left:0;top:0;width:100%;z-index:99999;background:#000'; el.onclick = () => el.remove(); document.body.append(el); }
  el.src = sheet.toDataURL();
  return { frames: an.t, shots: shots.length, err };
}

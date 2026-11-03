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
import { audio, img, rand, view } from './core.js?v=20261103-1518';
import { RAY_SPEED, ANIME_IMAGES, SW } from './anime.js?v=20261103-1518';
import { ComboDuel, addComboFilms } from './combo-anime.js?v=20261103-1518';
import { ZfStage, ZF_IMAGES, zfBlt } from './anime_zfighters.js?v=20261103-1518';
import { registerZ3, party, heal } from './z3.js?v=20261103-1518';
import { applyLevel } from './party.js?v=20261103-1518';
import { superSaiyan } from './supersaiyan.js?v=20261103-1518';
import { comboData } from './combo.js?v=20261103-1518';

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

export { CmdStage, films, COMMON, pic, STANDARD_CHAX, STANDARD_CHAY, STANDARD_ENEX, STANDARD_ENEY, CENTER_CHAX, CENTER_ENEX, TEC_CENTER_CHAX,
  FLASH_Y_SIZE_CUTIN_ON, FLASH_Y_SIZE_CUTIN_OFF, by, Z3, Z2, BLINK, v };

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
// (the helpers' parts while they are written; merged into this file at the end)
import('./combo_z3b_a.js?v=20261103-1518');
import('./combo_z3b_b.js?v=20261103-1518');

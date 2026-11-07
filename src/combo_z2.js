// S-combo films of Z2 and later, part cmb (docs/anim-f-plan.md, docs/anim-f-cmb.md): the 18xx / 19xx patterns of the
// original's Scene_Db_Battle_Anime, ported frame by frame. A combo's attack pattern is its skill id + 10; from Z2 on
// ($btl_progress = variable 40 ≥ 1) the move switch sends it to 18xx / 19xx (all.rb 56692 Z2, 59742 Z3 and later) after
// anime_pattern 31 / 32, then to its damage pattern. The eight combos of Z1 (701 706 708 739 748 751 752 819) keep their
// Z1 films (src/combo-anime.js) while variable 40 is 0 and play 1801 1806 1808 1839 / 2839 1848 1851 1852 1919 after.
//
// From Z2 on the original also draws the special-move strips (output_back) and the cut-ins (output_cutin): those are
// src/anime_goku_gohan.js's agStage, set up here for a ComboDuel (whose cut-in is the lead's, $partyc[@chanum]).
// A film is the Ruby case statement written out frame by frame on a Cz: it keeps the original's instance variables
// (@battle_anime_frame, @effect_anime_*, @ray_anime_*, @back_anime_*, @ax … with @gx flipping every frame as
// output_battle_anime does, @btl_ani_cha_chg_no, @scombo_cha*), blits straight away what the pattern blits (behind
// the fighters), and Cz.out() moves the fighters and draws @effect_anime_pattern in front.
import { audio, img } from './core.js?v=20261108-0722';
import { draw, spark, STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED, ANIME_IMAGES } from './anime.js?v=20261108-0722';
import { ComboDuel, addComboFilms } from './combo-anime.js?v=20261108-0722';
import { blt } from './anime_foes_common.js?v=20261108-0722';
import './anime_goku_gohan.js?v=20261108-0722'; // (agStage)
import { registerZ3, party, heal } from './z3.js?v=20261108-0722';
import { applyLevel } from './party.js?v=20261108-0722';
import { superSaiyan } from './supersaiyan.js?v=20261108-0722';
import { comboData } from './combo.js?v=20261108-0722';

const pic = (n) => `Graphics/Pictures/${n}`;
const STD_CHAX = -70, STD_ENEX = 602;
const v = (n) => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[n]) || 0; };
const era = () => Math.min(2, v(40)); // $btl_progress of a member's move
const SS = { 3: 14, 5: 18, 12: 19, 17: 20, 25: 26, 16: 32 };

// the pictures, Z2_ / Z3_ ($btl_top_file_name) where the original picks by it
const P = {
  spark: pic('戦闘アニメ.PNG'),
  ball: [pic('Z2_戦闘_必殺技_エネルギー弾.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾.PNG')], // 128×128 frames
  ballGreen: [pic('Z2_戦闘_必殺技_エネルギー弾(緑).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾(緑).PNG')],
  ballBlue: [pic('Z2_戦闘_必殺技_エネルギー弾(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾(青).PNG')],
  soki: [pic('Z2_戦闘_必殺技_繰気弾.PNG'), pic('Z3_戦闘_必殺技_繰気弾.PNG')],
  // effect 206 / 207 / 246 / 320: Z2 エネルギー弾3 (222×134; 246 192×128), Z3 エネルギー弾4 (190×126)
  ball3: pic('Z2_戦闘_必殺技_エネルギー弾3.PNG'), ball3Green: pic('Z2_戦闘_必殺技_エネルギー弾3(緑).PNG'), ball3Blue: pic('Z2_戦闘_必殺技_エネルギー弾3(青).PNG'),
  ball4: pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'), ball4Green: pic('Z3_戦闘_必殺技_エネルギー弾4(緑).PNG'), ball4Blue: pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'),
  shitei: [pic('Z2_戦闘_必殺技_エネルギー弾3(師弟の絆).PNG'), pic('Z3_戦闘_必殺技_エネルギー弾4(師弟の絆).PNG')], // effect 247
  aura: [pic('Z2_戦闘_必殺技_気を溜める.png'), pic('Z3_戦闘_必殺技_気を溜める.png')], // back 201: 136×142 ×2
  aura2: [pic('Z2_戦闘_必殺技_気を溜める2.png'), pic('Z3_戦闘_必殺技_気を溜める2.png')], // back 105: 152×192 ×3
  aura3: [pic('Z2_戦闘_必殺技_気を溜める3.png'), pic('Z3_戦闘_必殺技_気を溜める3.png')], // back 101: 184×240 ×3
  aura3Blue: [pic('Z2_戦闘_必殺技_気を溜める3(青).png'), pic('Z3_戦闘_必殺技_気を溜める3(青).png')],
  aura4: [pic('Z2_戦闘_必殺技_気を溜める4.png'), pic('Z3_戦闘_必殺技_気を溜める4.png')], // back 102: 224×288 ×3
  aura4Blue: [pic('Z2_戦闘_必殺技_気を溜める4(青).png'), pic('Z3_戦闘_必殺技_気を溜める4(青).png')],
  aura5: [pic('Z2_戦闘_必殺技_気を溜める5.png'), pic('Z3_戦闘_必殺技_気を溜める5.png')], // back 103: 236×254 ×12
  aura3Z3Blue: pic('Z3_戦闘_必殺技_気を溜める(青).png'),
  kaioken: [pic('Z2_戦闘_必殺技_界王拳.PNG'), pic('Z3_戦闘_必殺技_界王拳.PNG')], // effects 205 / 248 / 368: 236×122
  kaiokenSS: [pic('Z2_戦闘_必殺技_界王拳(超悟空).PNG'), pic('Z3_戦闘_必殺技_界王拳(超悟空).PNG')],
  speed: [pic('Z2_戦闘_必殺技_スピードアタック.PNG'), pic('Z3_戦闘_必殺技_スピードアタック.PNG')],
  blink: pic('Z3_必殺技_超カメハメ波(球点滅).png'), blinkBlue: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png'), // effect 235: 5 of 32
  blinkS: pic('Z3_必殺技_超カメハメ波(球点滅小).png'), blinkSBlue: pic('Z3_必殺技_超カメハメ波(球点滅小)(青).png'), // 237: 5 of 16
  ranbu: [pic('Z2_戦闘_必殺技_カメハメ乱舞エネルギー波.png'), pic('Z3_戦闘_必殺技_カメハメ乱舞エネルギー波.png')], // effect 65: 400×204
  ranbuHit: pic('Z1_戦闘_必殺技_カメハメ乱舞エネルギー波.png'), // effect 66 (Z1_ in every part)
  huge: [pic('Z2_戦闘_必殺技_エネルギー波_特大.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG')], // effect 48: 400×192 ×2
  mid: [pic('Z2_戦闘_必殺技_エネルギー波_中.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_中.PNG')], // 400×80 ×2
  midBlue: [pic('Z2_戦闘_必殺技_エネルギー波_中_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG')],
  vegetaGalick: pic('FC風_GBZ1 戦闘_ベジータ_ギャリック砲.PNG'), gokuKame: pic('FC風_GBZ1 戦闘_ゴクウ_カメハメは.png'), // 1813 Z3: 128×96
  dodohame: pic('Z3_戦闘_必殺技_どどはめはエネルギー波.png'), dodohameHit: pic('Z3_戦闘_必殺技_どどはめはエネルギー波_ヒット.png'), // 281 / 282
  small: [pic('Z2_戦闘_必殺技_エネルギー波_小.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_小.PNG')], // effect 226: 400×48 ×2
  smallBlue: [pic('Z2_戦闘_必殺技_エネルギー波_小_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG')],
  aura2Green: [pic('Z2_戦闘_必殺技_気を溜める2(緑).png'), pic('Z3_戦闘_必殺技_気を溜める2(緑).png')],
  aura3Green: [pic('Z2_戦闘_必殺技_気を溜める3(緑).png'), pic('Z3_戦闘_必殺技_気を溜める3(緑).png')],
  aura4Green: [pic('Z2_戦闘_必殺技_気を溜める4(緑).png'), pic('Z3_戦闘_必殺技_気を溜める4(緑).png')],
  aura9: [pic('Z2_戦闘_必殺技_気を溜める9.PNG'), pic('Z3_戦闘_必殺技_気を溜める9.PNG')], // back 213: 3 frames of 640×378
  big: pic('Z3_戦闘_必殺技_エネルギー波_大.png'), // effect 367 (Z3_ in every part)
  bubble: pic('戦闘アニメ_吹き出し.PNG'), mark: pic('戦闘アニメ_ビックリマーク.PNG'), // 1905
  shock: [pic('Z2_戦闘_必殺技_背景_衝撃波系.png'), pic('Z3_戦闘_必殺技_背景_衝撃波系.png')], // back 1: 3 frames of 640×180
  ball2: [pic('Z2_戦闘_必殺技_エネルギー弾2.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾2.PNG')], // effects 203 / 204: 96×64
  half: pic('Z3_戦闘_必殺技_エネルギー波_半円.PNG'), // effects 256 / 265: 700×128 ×2 (1850 is only in the Z3 part)
  genkiDot: pic('Z3_戦闘_必殺技_超元気玉(元気).png'), genkiBlink: pic('Z3_必殺技_元気玉(球点滅中).PNG'), // 2839, effect 252
  boom: { 101: [pic('戦闘アニメ_爆発1.PNG'), 96, 96, 320, 120, -64], 102: [pic('戦闘アニメ_爆発3.PNG'), 112, 120, 318, 120, -64],
    103: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 298, 120, -64], 104: [pic('戦闘アニメ_爆発5.PNG'), 158, 160, 282, 104, -64],
    105: [pic('戦闘アニメ_爆発6.PNG'), 256, 256, 234, 46, -64] }, // effects 101-105, the party attacking: size, where, @damage_center
};
// the strips and cut-ins agStage draws (src/anime_goku_gohan.js), loaded with the rest so the first combo has them
const STAGE = [pic('Z2_戦闘_必殺技_背景_上.png'), pic('Z2_戦闘_必殺技_背景_下.png'), pic('Z3_戦闘_必殺技_背景_上.png'),
  pic('Z3_戦闘_必殺技_背景_下(加工).PNG'), pic('Z2_戦闘_必殺技_背景_左.png'), pic('Z2_戦闘_必殺技_背景_右.png'),
  pic('Z3_戦闘_必殺技_背景_左(加工).PNG'), pic('Z3_戦闘_必殺技_背景_右(加工).PNG'), pic('Z2_味方カットイン.PNG'), pic('Z3_味方カットイン.PNG'), pic('ZG_味方カットイン.PNG'),
  pic('Z2_敵カットイン.PNG'), pic('Z3_敵カットイン.PNG')];
const ALL_PICTURES = [...STAGE, ...Object.values(P).flatMap((p) => (typeof p === 'string' ? [p] : Array.isArray(p) ? p : Object.values(p).map((b) => b[0])))];

// ---------- the stage ----------
class Cz {
  constructor(d) {
    this.d = d;
    this.era = era();
    const st = this.st = d.agStage(); // (the strips behind everything, the cut-in on top: src/anime_goku_gohan.js)
    st.era = this.era;
    this.f = 0; // @battle_anime_frame of the combo's own pattern
    this.efp = 0; this.eff = 0; this.eft = 0; this.rt = 0; this.rf = 0; // @effect_anime_pattern / frame / type, @ray_anime_*
    this.bt = 0; this.bf = 0; // @back_anime_type / frame
    this.ax = 0; this.ay = 0; this.gx = 0; this.gy = 0; this.otype = 1; this.chg = 0; // @output_anime_type, @btl_ani_cha_chg_no
    this.color = 0; this.spd = false; // @ray_color, @ray_spd_up_flag
    this.flag = false; this.scf = 0; this.sc = [0, 0, 0, 0, 0]; this.sct = [0, 0, 0, 0, 0]; // @btl_ani_tokusyu_flag, @scombo_cha*
    this.huttobi = true; this.center = false; // @damage_huttobi, @damage_center
    this.rx = 0; this.ry = 0;
    this.U = []; this.O = [];
  }
  get lead() { return this.d.lead; } // $partyc[@chanum]
  P(k) { const p = P[k]; return Array.isArray(p) ? p[this.era >= 2 ? 1 : 0] : p; } // by $btl_top_file_name
  // set_battle_character_name id, n: the crew member's sheet (his Super Saiyan form if that is who is here)
  sheet(id, sp = true) {
    const d = this.d, c = d.crew[id] || d.crew[SS[id]] || d.crew[Object.keys(SS).find((k) => SS[k] === id)];
    if (c) return sp ? c.special : c.normal;
    const a = globalThis.__game.world.actors[id];
    return sp ? a.special : a.sprite;
  }
  ss(id) { return !!this.d.crew[SS[id]]; } // $super_saiyazin_flag of that member
  who3() { return this.ss(3) ? 14 : 3; } // 悟空 (超 14)
  who5() { return this.ss(5) ? 18 : 5; } // 悟飯 (超 18)
  se(n) { audio.se(n, 80); }
  seStop() { audio.seStop(); }
  blt(sheet, sx, sy, w, h, x, y) { this.U.push((c) => blt(c, sheet, sx, sy, w, h, x, y)); } // @back_window.contents.blt
  front(sheet, sx, sy, w, h, x, y) { this.O.push((c) => blt(c, sheet, sx, sy, w, h, x, y)); } // (from an effect pattern)
  // output_mozi into a speech bubble: 16 px a character (the remake's font; the original's own font bitmap)
  say(text, x, y) { this.U.push((c) => { c.save(); c.font = '16px Cubic11, sans-serif'; c.fillStyle = '#000'; c.textBaseline = 'top'; [...text].forEach((ch, i) => c.fillText(ch, x + 16 * i, y + 6)); c.restore(); }); }
  fill(x, y, w, h, color) { this.U.push((c) => { c.fillStyle = color; c.fillRect(x, y, w, h); }); }
  pose(n) { this.d.A.frame = n; } // battle_anime_change 0,n
  gpose(n) { this.d.G.frame = n; } // battle_anime_change 1,n
  get chax() { return this.d.A.x; } set chax(x) { this.d.A.x = x; }
  get chay() { return this.d.A.y; } set chay(y) { this.d.A.y = y; }
  get enex() { return this.d.G.x; } set enex(x) { this.d.G.x = x; }
  get eney() { return this.d.G.y; } set eney(y) { this.d.G.y = y; }
  tec(on) { this.st.tecFrom = on ? 0 : Infinity; } // @tec_output_back
  tecNo(n) { this.st.tecNo = n; } // @tec_output_back_no
  cutOff() { this.st.cutFrom = Infinity; } // @chr_cutin = false
  displayOut() { // set_chr_display_out
    this.otype = 0;
    this.chay = -200;
    this.enex = CENTER_ENEX; this.eney = STD_Y;
    if (this.st.cutFrom !== Infinity) this.st.mirror = true;
  }
  fxReset() { this.efp = 0; this.eff = 0; this.eft = 0; }
  // a face-off at the stage's edges (悟空 at x 66 … 貝吉塔 at 470 + 96): on a phone both sides come in by what the
  // crop would hide (× k while they move apart); [left side's shift, right side's shift]
  apart(k) { const m = this.d.margin || 0; return [Math.round(Math.max(0, m - 62) * k), Math.round(Math.max(0, m - 70) * k)]; }
  back(n, x = 0, y = 0) { const b = BACKS[n]; if (b) b(this, x, y); this.bf++; } // back_anime_pattern n, x, y
  bstep(every, last) { // the back counter: the next picture every `every` calls, cycling through `last` + 1
    if (this.bf >= every && this.bt !== last) { this.bt++; this.bf = 0; } else if (this.bf >= every) { this.bt = 0; this.bf = 0; }
  }
  rstep(every, last) { // @ray_anime_type the same way
    if (this.rf >= every && this.rt !== last) { this.rt++; this.rf = 0; } else if (this.rf >= every) { this.rt = 0; this.rf = 0; }
  }

  // output_battle_anime (the party attacking: @gx flips every frame, the others move as they are), then the effect
  // pattern with this frame's ray_x / ray_y, then the frame shows
  * out(fx = true) {
    const d = this.d;
    d.L.sheets = d.crew[this.chg] || d.crew[d.who(this.chg)] || (this.chg ? { normal: this.sheet(this.chg, false), special: this.sheet(this.chg) } : d.crew[d.lead]);
    d.A.sp = this.otype === 1;
    d.G.sp = false;
    this.gx = -this.gx;
    d.A.x += this.ax; d.A.y += this.ay; d.G.x += this.gx; d.G.y += this.gy;
    if (fx && this.efp) {
      const e = EFFECTS[this.efp];
      if (e) e(this, this.rx, this.ry);
      this.rf++; this.eff++;
    }
    this.st.under = this.U; this.st.over = this.O;
    yield;
    this.U = []; this.O = [];
  }
  // the pattern, frame by frame: body(z, f) is the case statement; it returns true at its anime_pattern_fromat
  * play(body) {
    for (;;) {
      if (this.f === 0) { this.ax = this.ay = this.gx = this.gy = 0; this.otype = 0; }
      const f = this.f, end = body(this, f);
      if (end === 'next') { yield* this.format(); continue; } // (and the move switch's next pattern)
      if (end) { yield* this.format(); return; }
      yield* this.out();
      this.f++;
    }
  }
  * format() { // anime_pattern_fromat: the fighters drawn once more, everything back to 0
    yield* this.out(false);
    this.seStop();
    this.otype = 0; this.bt = this.bf = this.rt = this.rf = 0; this.fxReset();
    this.ax = this.ay = this.gx = this.gy = 0;
    this.f = 0;
  }

  // ---------- the damage patterns (the strips and the cut-in stay on) ----------
  // 41 爆発系ZD中 / 42 ZD大 / 43 Z2大 / 44 Z2特大: the explosion, the enemy blown off to the right (frames 21-39);
  // 22 衝撃波系 / 78 (縦): knocked off to the right / down (ZG 打撃4 after @tec_kyouda_se); 23 爆発系 / 27 (左斜め上) are src/anime.js's
  * damage(n) {
    const d = this.d;
    this.U = []; this.O = []; this.st.under = []; this.st.over = [];
    if (n === 23) return yield* d.explode(17, 50);
    if (n === 27) return yield* d.blownUpLeft();
    yield* this.play((z, f) => {
      if (n === 22) {
        if (f === 0) { z.se(z.kyouda ? 'ZG 打撃4' : 'Z3 跳ね返し'); d.showHit(); z.gpose(17); z.gx = -20; }
        else if (f <= 19) z.gx = -20;
        else if (f === 20) z.gx = 0;
        else if (f === 60) return true;
        return false;
      }
      if (n === 78) {
        if (f === 0) { z.se(z.kyouda ? 'ZG 打撃4' : 'Z3 跳ね返し'); d.showHit(); z.gpose(17); z.gy = 20; }
        else if (f <= 19) z.gy = 20;
        else if (f === 20) z.gx = 0;
        else if (f === 60) return true;
        return false;
      }
      if (f === 0) {
        z.se({ 41: 'ZG 光線系ヒット2', 42: 'ZG 光線系ヒット3', 43: 'Z1 爆発1', 44: 'DB3 大爆発' }[n]);
        d.showHit();
        z.efp = { 41: 102, 42: 103, 43: 104, 44: 105 }[n];
        z.gpose(17);
      } else if (f >= 21 && f <= 39) { if (z.huttobi) z.gx = -20; } else if (f === 40) { z.gx = 0; z.efp = 0; } else if (f === 60) return true;
      return false;
    });
  }
}

// ---------- back_anime_pattern (z = the stage, x / y = back_x / back_y) ----------
const BACKS = {
  1: (z) => { // 衝撃波系横 (a big enemy: only the top and bottom 42)
    if ((z.d.G.sheets.size || 96) > 96) { z.blt(z.P('shock'), 0, z.bt * 180, 640, 42, 0, 32); z.blt(z.P('shock'), 0, 138 + z.bt * 180, 640, 42, 0, 266); } else z.blt(z.P('shock'), 0, z.bt * 180, 640, 180, 0, 80);
    z.bstep(4, 2);
  },
  48: (z, x, y) => { if (z.bf % 4 === 0) z.blt(P.spark, 0, 48, 64, 64, x, y); }, // 師弟の絆_高速移動
  52: (z) => { z.blt(z.sheet(4), 0, 2 * 96, 96, 96, TEC_CENTER, STD_Y + 50); z.blt(z.sheet(5), 0, 2 * 96, 96, 96, TEC_CENTER, STD_Y - 50); }, // Z2師弟の絆_気を溜める
  53: (z) => { z.blt(z.sheet(4), 0, 3 * 96, 96, 96, TEC_CENTER, STD_Y + 50); z.blt(z.sheet(5), 0, 3 * 96, 96, 96, TEC_CENTER, STD_Y - 50); }, // _発動
  101: (z, x, y) => { z.blt(z.P(z.color === 3 ? 'aura3Blue' : z.color === 1 ? 'aura3Green' : 'aura3'), z.bt * 184, 0, 184, 240, x, y); z.bstep(4, 2); }, // 気を溜める(大)
  102: (z, x, y) => { z.blt(z.P(z.color === 3 ? 'aura4Blue' : z.color === 1 ? 'aura4Green' : 'aura4'), z.bt * 224, 0, 224, 288, x, y - 36); z.bstep(4, 2); }, // (特大)
  103: (z, x, y) => { z.blt(z.P('aura5'), z.bt * 236, 0, 236, 254, x, y); if (z.bf >= 8 && z.bt !== 11) { z.bt++; z.bf = 0; } }, // (元気弾)
  105: (z, x, y) => { z.blt(z.P(z.color === 1 ? 'aura2Green' : 'aura2'), z.bt * 152, 0, 152, 192, x, y); z.bstep(4, 2); }, // 気を溜める(中)
  213: (z, x, y) => { z.blt(z.P('aura9'), 0, z.bt * 378, 640, 378, x, y); z.bstep(4, 2); }, // 気を溜める(超元気玉吸収)
  112: (z) => z.blt(z.sheet(3), 0, z.sct[2] * 96, 96, 96, STD_CHAX + z.scf * 16, STD_Y), // 悟空前に現れる
  114: (z) => z.blt(z.sheet(7), 0, z.sct[2] * 96, 96, 96, STD_CHAX + z.scf * 16, STD_Y), // ヤムチャ前に現れる
  115: (z, x, y) => z.blt(z.sheet(z.sc[1], false), 0, z.sct[1] * 96, 96, 96, x, y), // スパーキング用1人目
  116: (z, x, y) => z.blt(z.sheet(z.sc[1]), 0, z.sct[1] * 96, 96, 96, x, y), // (必殺技)
  117: (z, x, y) => z.blt(z.sheet(z.sc[2], false), 0, z.sct[2] * 96, 96, 96, x, y),
  118: (z, x, y) => z.blt(z.sheet(z.sc[2]), 0, z.sct[2] * 96, 96, 96, x, y),
  119: (z, x, y) => z.blt(z.sheet(z.sc[3], false), 0, z.sct[3] * 96, 96, 96, x, y),
  120: (z, x, y) => z.blt(z.sheet(z.sc[3]), 0, z.sct[3] * 96, 96, 96, x, y),
  122: (z, x, y) => z.blt(z.sheet(z.sc[4]), 0, z.sct[4] * 96, 96, 96, x, y),
  201: (z, x, y) => { z.blt(z.color === 3 ? P.aura3Z3Blue : z.P('aura'), z.bt * 136, 0, 136, 142, x, y); z.bstep(16, 1); }, // 気を溜める(Z3)
};

// ---------- effect_pattern (z = the stage, rx / ry = ray_x / ray_y), the party attacking ----------
const balls = (z) => (z.color === 1 ? z.P('ballGreen') : z.color === 3 ? z.P('ballBlue') : z.P('ball'));
const EFFECTS = {
  39: (z) => { // 狼牙風風拳 (the member's normal sheet; in this combo ($cha_set_action 758) the last row is 3)
    const e = z.eff, sheet = z.sheet(z.chg || z.lead, false);
    const row = e <= 10 ? 14 : e <= 20 ? 13 : e <= 30 ? 12 : e <= 35 ? 0 : e <= 39 ? 3 : e <= 43 ? 1 : e <= 46 ? 2 : e <= 50 ? 4 : e <= 53 ? 2 : e <= 56 ? 1 : e <= 60 ? 2 : e <= 80 ? 16 : 3;
    if (e >= 36 && e % 5 === 0 && e < 85) z.se('Z3 打撃');
    const x = e >= 61 && e <= 80 ? CENTER_CHAX - (e - 60) * 8 : e >= 81 && e <= 84 ? 80 + (e - 80) * 16 : CENTER_CHAX;
    z.front(sheet, 0, row * 96, 96, 96, x, STD_Y);
  },
  48: (z) => z.front(z.P('huge'), 0, 0, 400, 192, -400 + z.eff * RAY_SPEED, 76), // かめはめ波系(特大)横
  63: (z) => { // かめはめ乱舞(Z2)_キャラ現れる: the other two fly in
    const l = z.lead, x = STD_CHAX + z.eff * 8;
    const [a, b] = l === 3 || l === 14 ? [6, 7] : l === 6 ? [3, 7] : [3, 6];
    if (l === 3 || l === 14) z.front(z.sheet(a), 0, 0, 96, 96, x, STD_Y + 64);
    if (l === 6 || l === 7) z.front(z.sheet(a), 0, 0, 96, 96, x + 30, STD_Y);
    if (l === 7) z.front(z.sheet(b), 0, 0, 96, 96, x, STD_Y + 64); else z.front(z.sheet(b), 0, 0, 96, 96, x, STD_Y - 64);
  },
  64: (z) => { const ig = 212 + 24; z.front(z.sheet(3), 0, 0, 96, 96, TEC_CENTER, STD_Y); z.front(z.sheet(6), 0, 0, 96, 96, ig, STD_Y + 64); z.front(z.sheet(7), 0, 0, 96, 96, ig, STD_Y - 64); },
  65: (z, rx, ry) => { // _発動: the three charge (120), then the wave grows
    const ig = 212 + 24, row = z.eff <= 120 ? 2 : 3;
    z.front(z.sheet(3), 0, row * 96, 96, 96, TEC_CENTER, STD_Y); z.front(z.sheet(6), 0, row * 96, 96, 96, ig, STD_Y + 64); z.front(z.sheet(7), 0, row * 96, 96, 96, ig, STD_Y - 64);
    if (z.eff > 120) z.front(z.P('ranbu'), 0, 0, 168 + (z.eff - 120) * RAY_SPEED, 204, rx, ry);
  },
  66: (z) => z.front(P.ranbuHit, 0, 0, 400, 152, -400 + z.eff * RAY_SPEED, 100), // _ヒット
  69: (z, rx, ry) => { // 元気玉はじく(ヒット)
    z.eft = 2;
    z.front(z.color === 1 ? z.P('ballGreen') : z.P('soki'), z.eft * 128, 0, 128, 128, rx - z.eff * RAY_SPEED, ry - z.eff * 4);
  },
  84: (z) => { // 師弟の絆(Z2)_キャラ現れる: the other one flies in (悟飯 above / 比克 below)
    const p = z.lead === 4;
    z.front(z.sheet(p ? 5 : 4), 0, 0, 96, 96, STD_CHAX + z.eff * 8 + 30, STD_Y + (p ? -50 : 50));
  },
  85: (z) => { z.front(z.sheet(4), 0, 0, 96, 96, TEC_CENTER, STD_Y + 50); z.front(z.sheet(5), 0, 0, 96, 96, TEC_CENTER, STD_Y - 50); },
  86: (z) => z.front(z.sheet(5), 0, 0, 96, 96, TEC_CENTER, STD_Y - 50),
  87: (z) => { // 界王拳: the lead's flurry (his normal sheet)
    const e = z.eff, s = z.ss(3) ? 4 : 0;
    const row = e <= 4 ? 7 : e <= 8 ? 9 : e <= 12 ? 10 : e <= 16 ? 9 : e <= 20 ? 10 : e <= 23 ? 11 : e <= 26 ? 12 : e <= 30 ? 11 : e <= 33 ? 9 : e <= 36 ? 10 : e <= 40 ? 12 : e <= 43 ? 11 : 10;
    z.pose(row + s);
    if (e % 4 === 0 && e < 41) z.se('Z1 打撃');
  },
  89: (z) => z.front(z.sheet(z.sc[2]), 0, 0, 96, 96, STD_CHAX + z.eff * 8 + 30, STD_Y - 50), // スパーキングコンボキャラ現れる2人目上
  90: (z) => z.front(z.sheet(z.sc[2]), 0, 0, 96, 96, STD_CHAX + z.eff * 8 + 30, STD_Y + 50), // 下
  92: (z) => z.front(z.sheet(z.sc[2]), 0, 0, 96, 96, TEC_CENTER, STD_Y + 50), // 放置(下)
  96: (z, rx, ry) => z.front(z.P('huge'), 0, 192, 192 + z.eff * RAY_SPEED, 192, rx, ry), // 亀仙流かめはめは_発動Z2
  101: (z) => boom(z, 101), 102: (z) => boom(z, 102), 103: (z) => boom(z, 103), 104: (z) => boom(z, 104), 105: (z) => boom(z, 105),
  121: (z) => { // 攻撃ヒット
    if (z.eff > 10) return;
    const sx = z.eff <= 4 ? 0 : 32, big = (z.d.G.sheets.size || 96) > 96;
    z.front(P.spark, sx, 16, 32, 32, z.chax + 96, z.chay + 32);
    z.front(P.spark, 32, 0, 32, 16, z.enex, z.eney - (big ? 48 : 0));
  },
  125: (z, rx, ry) => { if (z.eff <= 10) z.front(P.spark, z.eff <= 4 ? 0 : 32, 16, 32, 32, rx, ry); }, // 攻撃ヒット自由位置
  201: (z, rx, ry) => { z.eft = 2; z.front(balls(z), 256, 0, 128, 128, rx + z.eff * (z.spd ? RAY_SPEED + 6 : RAY_SPEED), ry); }, // エネルギー弾系(発動)
  202: (z) => { z.eft = 2; z.front(balls(z), 256, 0, 128, 128, -128 + z.eff * RAY_SPEED, 96); }, // (ヒット)
  203: (z, rx, ry) => z.front(z.P('ball2'), 0, 0, 96, 64, rx + z.eff * RAY_SPEED, ry), // かめはめ波系(発動)
  204: (z) => z.front(z.P('ball2'), 0, 0, 96, 64, -128 + z.eff * RAY_SPEED, 144), // (ヒット)
  205: (z) => z.front(z.color === 0 ? z.P(z.ss(3) ? 'kaiokenSS' : 'kaioken') : z.P('speed'), 0, 0, 236, 122, -236 + z.eff * RAY_SPEED, 120), // 界王拳系(ヒット)
  206: (z, rx, ry) => { const [s, w, h] = ball34(z); z.front(s, 0, 0, w, h, rx + z.eff * RAY_SPEED, ry); }, // 界王拳かめはめ波系(発動)
  207: (z) => { const [s, w, h] = ball34(z); z.front(s, 0, 0, w, h, -192 + z.eff * RAY_SPEED, 96); }, // (ヒット)
  208: (z, rx, ry) => { z.eft = 3; z.front(balls(z), 384, 0, 128, 128, rx + z.eff * RAY_SPEED, ry); }, // 元気弾系(発動)
  209: (z) => { z.eft = 3; z.front(balls(z), 384, 0, 128, 128, -128 + z.eff * RAY_SPEED, 112); }, // (ヒット)
  225: (z, rx, ry) => z.front(z.color === 3 ? z.P('smallBlue') : z.P('small'), 0, 48, 54 + z.eff * RAY_SPEED, 48, rx, ry), // エネルギー波_小系(発動)
  226: (z) => z.front(z.color === 3 ? z.P('smallBlue') : z.P('small'), 0, 0, 400, 48, -400 + z.eff * RAY_SPEED, 148), // エネルギー波_小系(ヒット)
  233: (z, rx, ry) => z.front(z.P('midBlue'), 0, 80, 54 + z.eff * RAY_SPEED, 80, rx, ry), // 口から怪光線(発動) (@ray_color 0 / 1 / 3: 青)
  234: (z, rx, ry) => z.front(z.P('midBlue'), 0, 0, 400, 80, -400 + z.eff * RAY_SPEED, ry), // (ヒット) (@ray_color 3)
  235: (z, rx, ry) => { z.front(z.color === 3 ? P.blinkBlue : P.blink, 32 * z.rt, 0, 32, 32, rx, ry); z.rstep(4, 4); }, // スーパーカメハメ波ため
  237: (z, rx, ry) => { z.front(z.color === 3 ? P.blinkSBlue : P.blinkS, 16 * z.rt, 0, 16, 16, rx, ry); z.rstep(4, 4); }, // (小)
  252: (z, rx, ry) => { z.front(P.genkiBlink, 64 * z.rt, 0, 64, 64, rx, ry); z.rstep(4, 3); }, // 元気玉ため
  256: (z, rx, ry) => z.front(P.half, 0, 0, z.eff * RAY_SPEED, 128, rx, ry), // Z3エネルギー波半円発動
  265: (z, rx, ry) => z.front(P.half, 0, 128, 700, 128, -700 + z.eff * RAY_SPEED, ry), // (ヒット)
  246: (z) => { // 師弟の絆(発動): the orange and the green ball, closing in
    const e = z.eff, x = 340 + e * RAY_SPEED;
    if (z.era < 2) { z.front(P.ball3, 0, 0, 192, 128, x, 96 - 46 + e); z.front(P.ball3Green, 0, 0, 192, 128, x, 96 + 42 - e); }
    else { z.front(P.ball4, 0, 0, 190, 126, x, 98 - 46 + e); z.front(P.ball4Green, 0, 0, 190, 126, x, 98 + 50 - e); }
  },
  247: (z) => { // 師弟の絆(ヒット)
    if (z.era < 2) z.front(z.P('shitei'), 0, z.rt * 134, 222, 134, -192 + z.eff * RAY_SPEED, 104);
    else z.front(z.P('shitei'), 0, z.rt * 126, 190, 126, -192 + z.eff * RAY_SPEED, 126);
    z.rstep(8, 1);
  },
  248: (z) => z.front(z.color === 0 ? z.P('kaioken') : z.P('speed'), 0, 0, 236, 122, -236 + z.eff * RAY_SPEED * 3, 120 - 20 - z.eff * 2), // サイヤンアタック界王拳系(追いかけ)
  249: (z) => { // ギャリックカメハメは(発動)Z2: the two beams meet in the middle (on a phone they start closer in: Cz.apart)
    const e = Math.min(5, z.eff), [l, r] = z.apart(1);
    const lw = Math.min(80 + e * (RAY_SPEED + 2), 320 - 160 - l), rx = Math.max(320, 396 - e * RAY_SPEED - r), rw = 482 - r - rx;
    z.front(z.P('mid'), 0, 80, lw, 80, 160 + l, 118);
    z.front(z.P('midBlue'), 400 - rw, 0, rw, 80, rx, 118);
  },
  250: (z) => { // (発動2): pushing past each other
    const e = z.eff * RAY_SPEED, m = z.P('mid'), b = z.P('midBlue');
    z.front(m, 0, 0, 400, 80, -400 + e, 76);
    for (const x of [-720, -1040, -1360]) z.front(m, 80, 80, 320, 80, x + e, 76);
    z.front(b, 0, 80, 400, 80, 640 - e, 160);
    for (const x of [928, 1216, 1504]) z.front(b, 112, 80, 288, 80, x - e, 160);
  },
  251: (z) => { const e = z.eff * RAY_SPEED; z.front(z.P('mid'), 0, 0, 400, 80, -400 + e, 134); z.front(z.P('midBlue'), 0, 80, 400, 80, 640 - e, 134); }, // (ヒット)
  367: (z, rx, ry) => { const w = 54 + z.eff * RAY_SPEED; z.front(P.big, 0, 92, w, 92, rx - 14, ry - 128); z.front(P.big, 0, 92, w, 92, rx - 10, ry - 22); }, // 絶好のチャンス
  368: (z, rx, ry) => { // 界王拳系(自由): the next of two frames every 10
    if (z.eff >= 10) { z.eft = z.eft === 0 ? 1 : 0; z.eff = 0; }
    z.front(z.P(z.ss(3) ? 'kaiokenSS' : 'kaioken'), 236 * z.eft, 0, 236, 122, rx, ry);
  },
  332: (z) => { // 狼牙風風拳 ヤムチャとわかもの: the two side by side (雅木茶's normal sheet, the young one's special sheet)
    const e = z.eff;
    const R = e <= 10 ? [14, 26] : e <= 20 ? [13, 25] : e <= 30 ? [12, 24] : e <= 35 ? [0, 19] : e <= 39 ? [3, 22] : e <= 43 ? [1, 20]
      : e <= 46 ? [2, 21] : e <= 50 ? [4, 23] : e <= 53 ? [2, 21] : e <= 56 ? [1, 20] : e <= 60 ? [2, 21] : e <= 80 ? [16, 18] : null;
    let a = z.sheet(7, false), b = z.sheet(15), r = R;
    if (!r) { if (z.era >= 2) { a = z.sheet(7); r = [3, 21]; } else r = [2, 21]; }
    if (e >= 36 && e % 5 === 0 && e < 85) z.se('Z3 打撃');
    const y = e >= 61 && e <= 80 ? STD_Y - (e - 60) * 4 : e >= 81 && e <= 85 ? STD_Y - 80 + (e - 80) * 16 : STD_Y;
    z.front(a, 0, r[0] * 96, 96, 96, CENTER_CHAX + 10, y);
    z.front(b, 0, r[1] * 96, 96, 96, CENTER_CHAX + 154, y);
  },
  320: (z) => { // 行くぞクリリン(発動): the green and the orange ball, closing in
    const e = z.eff, x = 340 + e * RAY_SPEED;
    if (z.era < 2) { z.front(P.ball3Green, 0, 0, 222, 134, x, 96 - 58 + e); z.front(P.ball3, 0, 0, 222, 134, x, 96 + 60 - e); }
    else { z.front(P.ball4Green, 0, 0, 190, 126, x, 98 - 56 + e); z.front(P.ball4, 0, 0, 190, 126, x, 98 + 60 - e); }
  },
  279: (z, rx, ry) => { // 気の開放エネルギー弾(発動): two balls
    z.eft = 2;
    const x = rx + z.eff * (z.spd ? RAY_SPEED + 6 : RAY_SPEED);
    z.front(balls(z), 256, 0, 128, 128, x, ry); z.front(balls(z), 256, 0, 128, 128, x, ry + 64);
  },
  280: (z) => { z.eft = 2; const x = -128 + z.eff * RAY_SPEED; z.front(balls(z), 256, 0, 128, 128, x, 32 + 54); z.front(balls(z), 256, 0, 128, 128, x, 32 + 40 + 54); },
  281: (z, rx, ry) => z.front(P.dodohame, 0, 0, 144 + z.eff * RAY_SPEED, 204, rx, ry), // どどはめは(発動)
  282: (z) => z.front(P.dodohameHit, 0, 0, 400, 128, -20 - 400 + z.eff * RAY_SPEED, 32 + 54 + 24), // (ヒット)
};
function ball34(z) { // effects 206 / 207: エネルギー弾3 (Z2, 222×134) / 4 (Z3, 190×126) by @ray_color
  if (z.era < 2) return [z.color === 1 ? P.ball3Green : z.color === 3 ? P.ball3Blue : P.ball3, 222, 134];
  return [z.color === 1 ? P.ball4Green : z.color === 3 ? P.ball4Blue : P.ball4, 190, 126];
}
function boom(z, n) { // effects 101-105: the explosion, the next of its frames every 10
  const [sheet, w, h, x, y, cx] = P.boom[n], k = z.eft;
  if (z.eff >= 10) { z.eft++; z.eff = 0; }
  z.front(sheet, k * w, 0, w, h, z.center ? x + cx : x, y);
}

// ---------- the films ----------
// 1801 師弟の絆 (all.rb 82164): the lead rises (比克) / sinks (悟飯) while the other flies in (effect 84), both stand (85),
// vanish (back 48), come out of nowhere in turn and knock the enemy off the stage (effect 121), charge (back 52),
// fire (back 53, effect 246), and the two balls hit as one (247)
function p1801(z, f) {
  const pl = z.lead === 4;
  z.rx = f <= 500 ? 325 : 340; z.ry = f <= 500 ? 70 : 200;
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) { z.efp = 84; if (pl) z.ay = f <= 10 ? 5 : 0; else z.ay = f <= 10 ? -5 : 0; }
  else if (f <= 59) z.efp = 85;
  else if (f <= 100) { z.efp = 86; z.chay = -120; if (f === 60) z.se('Z1 高速移動'); z.back(48, TEC_CENTER + 10, STD_Y + 76); }
  else if (f <= 140) { z.efp = 0; if (f === 101) z.se('Z1 高速移動'); z.back(48, TEC_CENTER, STD_Y + 76 - 100); }
  else if (f === 150) { z.eff = 0; z.enex = CENTER_ENEX; z.eney = STD_Y; z.chg = 4; z.chax = CENTER_CHAX; z.otype = 0; z.pose(0); }
  else if (f >= 160 && f <= 180) { if (f === 160) z.se('Z1 高速移動'); z.back(48, CENTER_CHAX + 16, STD_Y + 26); if (f === 180) z.chay = STD_Y; }
  else if (f === 186) { z.se('Z1 打撃'); z.pose(2); }
  else if (f === 191) { z.se('Z1 打撃'); z.pose(1); }
  else if (f === 201) { z.se('Z3 打撃'); z.pose(4); z.gpose(16); }
  else if (f >= 207 && f <= 225) {
    z.gx = -18; z.efp = 121;
    if (f === 225) { z.chay = -120; z.enex = -96; z.pose(0); z.chg = 5; }
  } else if (f >= 226 && f <= 246) {
    z.gx = -18;
    if (f === 226) z.se('Z1 高速移動');
    if (f === 235) z.gpose(0);
    z.back(48, CENTER_CHAX + 16, STD_Y + 26);
    if (f === 246) { z.chay = STD_Y; z.gx = 0; }
  } else if (f === 252) { z.se('Z1 打撃'); z.pose(4); }
  else if (f === 258) { z.se('Z1 打撃'); z.pose(3); }
  else if (f === 268) { z.se('Z3 打撃'); z.pose(1); z.gpose(16); z.eff = 0; }
  else if (f >= 274 && f <= 293) {
    z.gx = -18; z.efp = 121;
    if (f === 293) { z.gx = 0; z.eney = -200; z.chay = -120; z.gpose(0); }
    z.bt = 0; z.bf = 0;
  } else if (f >= 294 && f <= 353) { z.efp = 0; z.eff = 0; if (f === 294) z.se('Z1 気を溜める2'); z.back(52); }
  else if (f >= 354 && f <= 414) { if (f === 354) { z.seStop(); z.se('Z1 エネルギー波2'); } z.back(53); z.efp = 246; }
  else if (f === 415) { z.efp = 0; z.displayOut(); z.eff = 0; }
  else if (f >= 416 && f <= 442) z.efp = 247;
  else if (f === 443) return true;
  return false;
}

// the one who isn't the lead runs in from the left first (back 112 悟空 / 114 雅木茶): @btl_ani_tokusyu_flag
// 1803 / 1813 / 1808 / 1848 (to = what @battle_anime_frame becomes at 60: -1, or 0 for 1808)
function runIn(z, f, back, chg, to = -1) {
  if (f === 0) z.se('Z1 逃げる');
  if (f <= 60) { if (z.scf <= 20) z.scf++; z.ax = -16; z.back(back); }
  if (f === 60) { z.ax = 0; z.chg = chg; z.chax = TEC_CENTER; z.flag = true; z.f = to; }
}

// 1803 サイヤンアタック(悟空＆巴達克) (all.rb 82291): 悟空 charges (back 101) and vanishes, hits the enemy flying
// (effects 205 / 248) and from the right, a kaioken flurry (effect 87); 巴達克 charges a blue ball (back 102, 237 /
// 235) and throws it (206 / 207)
function p1803(z, f) {
  z.rx = 300; z.ry = 162;
  if (!z.flag && (z.lead === 16 || z.lead === 32)) { runIn(z, f, 112, z.ss(3) ? 14 : 3); return false; }
  if (!z.flag) { z.flag = true; z.f = -1; return false; }
  const bx = 200, by = 32, ss = z.ss(3);
  if (f === 0) { z.se('Z2 気を溜める'); z.otype = 1; z.pose(ss ? 0 : 4); z.color = 0; }
  else if (f <= 89) z.back(101, 220, 32);
  else if (f === 90) { z.seStop(); z.se('Z1 高速移動'); z.chay = -120; z.back(101, 220, 32); }
  else if (f <= 130) { z.back(101, 220, 32); if (f % 4 === 0) z.blt(P.spark, 0, 48, 64, 64, z.chax + 20, 144); }
  else if (f === 131) { z.se('Z1 逃げる'); z.enex = CENTER_ENEX; z.eney = STD_Y; }
  else if (f <= 159) z.efp = 205;
  else if (f <= 178) {
    if (f === 160) z.se('Z3 跳ね返し');
    z.gpose(16); z.gx = -18; z.efp = 205;
    if (f === 178) { z.eff = 0; z.enex = -120; }
  } else if (f <= 198) { if (f === 179) z.se('Z1 逃げる'); z.gx = -18; z.gpose(17); z.efp = 248; }
  else if (f <= 200) { z.efp = 0; z.otype = 1; z.gx = -18; }
  else if (f <= 207) {
    if (f === 201) { z.pose(ss ? 11 : 8); z.chax = STD_ENEX + 10; z.chay = STD_Y; }
    z.ax = -18; z.gx = -18;
  } else if (f === 208) { z.ax = 0; z.gx = 4; z.gpose(16); z.se('Z1 強打'); }
  else if (f === 209) { z.gx = 0; z.eff = 0; z.otype = 1; }
  else if (f >= 220 && f <= 270) { z.efp = 87; if (f === 270) z.se('Z3 跳ね返し'); }
  else if (f >= 271 && f <= 298) { z.gpose(17); z.efp = 0; z.gx = 18; }
  else if (f === 299) { z.chay = -120; z.eney = -200; z.eff = 0; z.otype = 1; z.chg = z.d.crew[32] ? 32 : 16; z.pose(4); z.gx = 0; }
  else if (f === 300) { z.se('Z1 気を溜める3'); z.otype = 1; z.color = 3; z.chay = STD_Y; z.chax = TEC_CENTER; z.pose(4); }
  else if (f >= 301 && f <= 360) { z.back(102, bx, by); z.efp = 237; }
  else if (f >= 361 && f <= 420) { z.back(102, bx, by); z.rx = 300; z.ry = 156; z.efp = 235; }
  else if (f >= 421 && f <= 470) { z.rx = 276; z.ry = 140; z.pose(6); z.efp = 235; }
  else if (f === 471) { z.seStop(); z.pose(2); z.rx = -360; z.ry = -96; }
  else if (f === 472) { z.seStop(); z.se('Z1 エネルギー波'); z.efp = 206; z.eff = 0; z.rx = -360; z.ry = -96; }
  else if (f >= 473 && f <= 510) { z.efp = 206; z.rx = 360; z.ry = z.era >= 2 ? 96 : 90; }
  else if (f === 511) { z.efp = 0; z.eff = 0; z.eft = 0; }
  else if (f === 541) { z.displayOut(); z.enex = (STD_ENEX - 8) + 18 * 11; }
  else if (f >= 562 && f <= 588) { z.gx = 18; z.efp = 207; }
  else if (f === 589) { z.gx = 0; return true; }
  return false;
}

// 1806 カメハメ乱舞 (all.rb 82753): 克林 sinks / 雅木茶 rises while the other two fly in (effect 63), the three stand
// (64), charge and fire the one great wave (65), which hits (66)
function p1806(z, f) {
  z.rx = 302; z.ry = 64; z.color = 0;
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    z.efp = 63;
    const k = z.lead === 6 ? 1 : z.lead === 7 ? -1 : 0;
    if (k) { if (f < 16) { z.ax = -2; z.ay = 4 * k; } else { z.ax = 0; if (f > 16) z.ay = 0; } }
  } else if (f === 40) { z.ax = 0; z.ay = 0; z.efp = 64; }
  else if (f === 60) { z.chay = -120; z.se('Z1 ザー'); z.se('Z1 ゴー'); z.se('DB3 気を溜める2'); z.eff = 0; z.efp = 65; }
  else if (f === 190) { z.seStop(); z.se('Z1 エネルギー波2'); }
  else if (f === 300) { z.efp = 0; z.displayOut(); }
  else if (f === 301) { z.eff = 0; z.efp = 0; }
  else if (f >= 302 && f <= 328) z.efp = 66;
  else if (f === 329) return true;
  return false;
}

// 1808 願いを込めた元気弾 (all.rb 83043): (悟飯 leading: 悟空 runs in first) 悟空 gathers the 元気玉 (back 103) and
// throws it (effect 208), the enemy jumps clear; 悟飯 hits it back (69) into the enemy
function p1808(z, f) {
  z.rx = 340; z.ry = 112; z.color = 0;
  const bx = 190, by = 36;
  if (!z.flag && z.lead === 5) { runIn(z, f, 112, 3, 0); return false; }
  if (f === 1) { z.se('Z2 気を溜める_元気弾'); z.otype = 1; z.pose(5); z.color = 0; z.ax = -8; z.chg = 3; }
  else if (f >= 2 && f <= 89) { z.ax = 0; z.back(103, bx, by); }
  else if (f === 90) { z.seStop(); z.pose(6); }
  else if (f === 111) { z.se('Z1 エネルギー波'); z.pose(z.era === 2 ? 13 : 1); z.efp = 208; }
  else if (f === 150) { z.pose(z.era === 2 ? 13 : 1); z.efp = 0; z.eff = 0; z.eft = 0; }
  else if (f === 160) z.displayOut();
  else if (f === 161) z.efp = 209;
  else if (f === 180) z.se('Z1 飛ぶ');
  else if (f === 181) { z.gpose(16); z.gy = -12; }
  else if (f === 188) { z.gpose(0); z.gy = 0; z.efp = 209; z.chg = 5; z.otype = 1; z.pose(4); }
  else if (f === 231) { z.cutOff(); z.tec(false); z.eney = -200; z.chay = STD_Y; z.eff = 0; z.efp = 209; }
  else if (f === 246) z.pose(4);
  else if (f === 252) z.pose(5);
  else if (f === 254) { z.eft = 0; z.eff = 0; z.se('Z1 吹っ飛ぶ'); z.pose(5); z.rx = CENTER_ENEX - 92; z.ry = 112; z.efp = 69; z.ax = 8; }
  else if (f >= 255 && f <= 279) { z.rx = CENTER_ENEX - 92; z.ry = 112; z.pose(6); }
  else if (f === 280) { z.efp = 0; z.eff = 0; }
  else if (f >= 281 && f <= 303) { z.displayOut(); z.eft = 0; z.rx = 640; z.ry = 228; z.efp = 69; }
  else if (f === 304) return true;
  return false;
}

// 1813 ギャリックかめはめは(悟空＆貝吉塔) (all.rb 83327): (貝吉塔 leading: 悟空 runs in first) 悟空 charges (back
// 102 / Z3 201) and slides off to the left; 貝吉塔 slides in on the right; both charge facing each other across the
// line, fire (effect 249: 1813 Z3 the FC-style close-ups), the two beams push past each other (250) and hit (251)
const WAKE = 'rgb(188,188,188)';
function p1813(z, f) {
  if (!z.flag && (z.lead === 12 || z.lead === 19)) { runIn(z, f, 112, z.ss(3) ? 14 : 3); return false; }
  if (!z.flag) { z.flag = true; z.f = -1; return false; }
  const z3 = z.era === 2, bn = z3 ? 201 : 102, by = z3 ? 86 : 32, o = z3 ? 30 : 0;
  let bx = z3 ? 228 : 198;
  z.rx = 340; z.ry = 96;
  const pair = () => { z.sc[1] = z.ss(3) ? 14 : 3; z.sc[2] = z.ss(12) ? 19 : 12; };
  if (f === 0) {
    if (z3) { z.se('Z3 変身'); z.color = 3; } else { z.se('Z2 気を溜める'); z.color = 0; }
    z.otype = 1;
    if (!z.ss(3)) z.pose(4);
  } else if (f <= 89) z.back(bn, bx, by);
  else if (f === 90) { z.seStop(); z.se('Z1 気を溜める'); z.pose(2); z.back(bn, bx, by); }
  else if (f <= 140) z.back(bn, bx, by);
  else if (f <= 180) {
    bx -= 12 * (f - 140); z.ax = -12;
    z.back(bn, bx, by);
    z.fill(640 - 16 * (f - 140), 64, 6, 228, WAKE);
  } else if (f <= 220) {
    if (f === 181) { z.seStop(); z.se(z3 ? 'Z3 変身' : 'Z2 気を溜める'); z.color = 3; }
    z.ax = 0;
    z.back(bn, 678 + o - 12 * (f - 180), by);
    pair(); z.sct[1] = 2; z.sct[2] = 7;
    z.back(118, 730 - 12 * (f - 180), STD_Y);
  } else if (f <= 360) {
    if (f === 271) { z.seStop(); z.se('Z1 気を溜める'); }
    z.back(bn, 198 + o, by); z.bf--;
    z.back(118, 250, STD_Y);
  } else if (f <= 469) {
    if (f === 361) { z.seStop(); z.se(z3 ? 'Z3 変身' : 'Z2 気を溜める'); z.color = 3; z.se('Z1 気を溜める'); }
    const k = (f - 360) * 2, [l, r] = z.apart(k / 218);
    z.back(bn, 198 + o + k - r, by); z.bf--;
    z.back(118, 250 + k - r, STD_Y); z.bf--;
    z.color = z3 ? 3 : 0;
    z.back(bn, -220 + o + k + l, z3 ? 32 + 54 : 32); z.bf--;
    z.color = 3;
    z.back(116, -154 + k + l, STD_Y);
    const nx = Math.min(320, f < 412 ? 4 * (f - 360) : 2 * (f - 412) + 4 * 52);
    z.fill(nx, 64, 6, 228, WAKE);
  } else if (f <= 520) {
    const [l, r] = z.apart(1);
    z.color = 3;
    z.back(bn, 418 + o - r, by); z.bf--;
    z.back(118, 470 - r, STD_Y); z.bf--;
    z.color = z3 ? 3 : 0;
    z.back(bn, 0 + o + l, z3 ? 32 + 54 : 32); z.bf--;
    z.back(116, 66 + l, STD_Y);
    z.fill(320, 64, 6, 228, WAKE);
  } else if (f <= 600) {
    if (f === 521) { z.eff = 0; z.seStop(); z.se('DB3 エネルギー波2'); z.se('Z1 エネルギー波'); }
    const [l, r] = z.apart(1);
    z.sct[1] = 3; z.sct[2] = 8;
    z.color = 3;
    if (z3 && !z.ss(12)) z.blt(P.vegetaGalick, 0, 0, 128, 96, 470 - 30 - r, STD_Y); else z.back(118, 470 - r, STD_Y);
    z.bf--;
    z.color = 0;
    if (z3 && !z.ss(3)) z.blt(P.gokuKame, 0, 0, 128, 96, 66 - 20 + l, STD_Y); else z.back(116, 66 + l, STD_Y);
    z.efp = 249;
    z.fill(320, 64, 6, 228, WAKE);
  } else if (f <= 679) {
    if (f === 601) z.eff = 0;
    z.efp = 250;
    z.fill(0, 156, 640, 4, WAKE);
  } else if (f === 680) { z.displayOut(); z.efp = 0; z.enex = CENTER_ENEX - 56; z.eff = 0; }
  else if (f <= 703) z.efp = 251;
  else if (f === 704) return true;
  return false;
}

// 1814 どどはめは(雅木茶・天津飯・餃子) (all.rb 83615): the other two fly in (backs 116 / 118), the three in a row
// charge and fire the one wave (effect 281), which hits (282)
function p1814(z, f) {
  z.rx = 302; z.ry = 64; z.color = 0;
  const ig = 212 + 24, k = 8;
  const two = () => { z.back(116, ig, STD_Y - 64); z.back(118, ig, STD_Y + 64); };
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    const x = STD_CHAX + f * k;
    if (z.lead === 9 || z.lead === 8) {
      const c = z.lead === 9;
      if (f < 16) { z.ax = -2; z.ay = c ? 4 : -4; } else { z.ax = 0; if (f > 16) z.ay = 0; }
      z.sc[1] = 7; z.sc[2] = c ? 8 : 9;
      z.back(116, x + 16, STD_Y); z.back(118, x - 14, STD_Y + (c ? -64 : 64));
    } else { z.sc[1] = 8; z.sc[2] = 9; z.back(116, x - 14, STD_Y - 64); z.back(118, x - 14, STD_Y + 64); }
  } else if (f <= 59) { z.ax = 0; z.ay = 0; z.chg = 7; z.sc[1] = 8; z.sc[2] = 9; z.chax = TEC_CENTER; z.chay = STD_Y; two(); }
  else if (f === 60) { z.se('Z1 気を溜める'); z.otype = 1; z.pose(2); two(); }
  else if (f <= 189) two();
  else if (f === 190) { z.seStop(); z.se('Z1 エネルギー波'); z.se('Z1 怪光線'); z.pose(3); z.sct[1] = 5; z.sct[2] = 1; two(); z.efp = 281; }
  else if (f <= 299) two();
  else if (f === 300) { z.efp = 0; z.displayOut(); }
  else if (f === 301) { z.eff = 0; z.efp = 0; }
  else if (f <= 328) z.efp = 282;
  else if (f === 329) return true;
  return false;
}

// 1822 気の開放(悟飯＆克林) (all.rb 83725): the other one flies in (effects 89 / 90), both charge (back 105 / Z3 201)
// and vanish (back 48); 悟飯 and 克林 come out of nowhere side by side, rush the enemy (back 117) and fire two balls
// (back 118, effect 279) that hit (280)
function p1822(z, f) {
  const z3 = z.era >= 2, bn = z3 ? 201 : 105, bx = z3 ? 234 : 218, by = z3 ? -18 + 54 + 50 : 60;
  z.rx = f <= 500 ? 325 : 340; z.ry = f <= 500 ? 70 : 200;
  const gohan = z.ss(5) ? 18 : 5;
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    if (z.lead === 5 || z.lead === 18) { z.sc[2] = 6; z.efp = 90; z.ay = f <= 10 ? -5 : 0; }
    else if (z.lead === 6) { z.sc[2] = gohan; z.efp = 89; z.ay = f <= 10 ? 5 : 0; }
  } else if (f <= 59) {
    if (z.lead === 6 && f === 40) z.chay -= 100;
    z.chg = gohan; z.sc[2] = 6; z.efp = 92;
  } else if (f === 60) { z.se(z3 ? 'Z3 変身' : 'Z2 気を溜める'); z.color = 0; }
  else if (f <= 150) { z.back(bn, bx, by - 50); z.bf--; z.back(bn, bx, by + 50); }
  else if (f <= 191) {
    z.chay = -120; z.efp = 0;
    if (f === 151) { z.seStop(); z.se('Z1 高速移動'); }
    z.back(48, TEC_CENTER, STD_Y + 76); z.bf--; z.back(48, TEC_CENTER, STD_Y + 76 - 100);
  } else if (f === 200) { z.eff = 0; z.enex = CENTER_ENEX; z.eney = STD_Y; z.chg = gohan; z.chax = CENTER_CHAX - 128; z.otype = 0; z.pose(0); z.sc[2] = 6; }
  else if (f >= 210 && f <= 230) {
    if (f === 210) z.se('Z1 高速移動');
    z.back(48, TEC_CENTER - 160, STD_Y + 76 - 16); z.bf--; z.back(48, TEC_CENTER - 160, STD_Y + 76 - 100 + 16);
    if (f === 230) { z.chay = STD_Y - 32; z.back(117, z.chax, STD_Y + 32); }
  } else if (f >= 231 && f <= 238) { z.pose(16); z.sct[2] = 16; z.chax += 24; z.back(117, z.chax, STD_Y + 32); }
  else if (f === 239) { z.pose(2); z.sct[2] = 3; z.back(117, z.chax, STD_Y + 32); z.se('ZG 打撃4'); }
  else if (f >= 240 && f <= 270) { if (f === 255) { z.pose(0); z.sct[2] = 0; } z.back(117, z.chax, STD_Y + 32); z.gpose(16); z.enex += 24; }
  else if (f === 271) { z.otype = 1; z.pose(1); z.sct[2] = 1; z.back(118, z.chax, STD_Y + 32); z.se('Z3 エネルギー波'); z.spd = true; }
  else if (f >= 272 && f <= 299) { z.efp = 279; z.back(118, z.chax, STD_Y + 32); }
  else if (f === 300) { z.efp = 0; z.gpose(0); z.displayOut(); z.eff = 0; }
  else if (f >= 301 && f <= 328) z.efp = 280;
  else if (f === 329) return true;
  return false;
}

// 1839 / 2839 この世で一番強いヤツ (all.rb 84910 Z2, 100584 Z3): 悟空・悟飯・比克・克林 line up (backs 116 / 118 / 120),
// the three vanish (back 48), 悟空 gathers the 元気玉 (Z2 back 103; Z3 the ki flying in to his hands, the blinking ball
// 252); 比克 and 悟飯 rush the enemy (backs 115 / 117), 比克's mouth ball (237) knocks it back (effect 101), 克林 kicks it
// away (back 119); 悟空 throws the 元気玉 up (208), the three watch it rise past (the strips down the sides) and it falls on
// the enemy (209). 2839 is 1839 with the longer gathering: from 1839's frame 231 on it runs 160 frames later.
function p1839(z, f) {
  const z3 = z.era >= 2, ig = 212 - 18, k = 8;
  z.rx = 340; z.ry = 112; z.color = 0;
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); return false; }
  if (f <= 39) {
    const L = z.lead, x = STD_CHAX + f * k;
    const set = (a, b, c) => { z.sc[1] = a; z.sc[2] = b; z.sc[3] = c; };
    if (L === 3 || L === 14) {
      if (f < 25) z.ay = -2; else { z.ax = 0; z.ay = 0; }
      set(z.who5(), 4, 6);
      z.back(116, x - 48, STD_Y - 72); z.back(118, x + 24, STD_Y + 48); z.back(120, x - 48, STD_Y + 72);
    } else if (L === 5 || L === 18) {
      if (f < 25) { z.ax = -3; z.ay = -3; } else { z.ax = 0; z.ay = 0; }
      set(z.who3(), 4, 6);
      z.back(116, x + 24, STD_Y - 48); z.back(118, x + 24, STD_Y + 48); z.back(120, x - 48, STD_Y + 72);
    } else if (L === 4) {
      if (f < 25) z.ay = 2; else { z.ax = 0; z.ay = 0; }
      set(z.who3(), z.who5(), 6);
      z.back(116, x + 24, STD_Y - 48); z.back(118, x - 48, STD_Y - 72); z.back(120, x - 48, STD_Y + 72);
    } else {
      set(z.who3(), z.who5(), 4);
      if (f < 25) { z.ax = -3; z.ay = 3; } else { z.ax = 0; z.ay = 0; }
      z.back(116, x + 24, STD_Y - 48); z.back(118, x - 48, STD_Y - 72); z.back(120, x + 24, STD_Y + 48);
    }
    return false;
  }
  const three = () => { z.back(116, ig, STD_Y - 72); z.back(118, z.chax, STD_Y + 48); z.back(120, ig, STD_Y + 72); };
  if (f <= 59) {
    z.ax = 0; z.ay = 0; z.chax = TEC_CENTER; z.chay = STD_Y - 48; z.chg = z.who3();
    z.sc[1] = z.who5(); z.sc[2] = 4; z.sc[3] = 6;
    three();
  } else if (f === 60) { z.se('Z1 高速移動'); three(); }
  else if (f <= 120) { z.back(48, ig, STD_Y - 72 + 24); z.back(48, z.chax + 8, STD_Y + 48 + 16); z.back(48, ig, STD_Y + 72 + 24); }
  else if (f <= 132) z.chay += 4;
  else if (f <= 139) { z.chay = STD_Y; if (z3 && f === 139) z.tecNo(1); }
  else if (f === 140) {
    if (z3) { z.se('Z1 気を溜める(元気弾)'); z.se('Z1 ザー'); z.gather = [0, 0, 0, 0, 0, 0]; } else z.se('Z2 気を溜める_元気弾');
    z.otype = 1; z.pose(5); z.color = 0;
  } else if (!z3 && f <= 228) { z.ax = 0; z.back(103, 190, 36); }
  else if (!z3 && f === 229) z.seStop();
  else if (z3 && f <= 388) genkiGather(z, f);
  else if (z3 && f === 389) { z.seStop(); z.fxReset(); z.tecNo(0); }
  else if (f >= (z3 ? 391 : 231)) return rest1839(z, z3 ? f - 160 : f, z3);
  return false;
}
// 2839 141-388: the ki flies in from six sides to (316, 60) (@genkitama_kanri_*), the blinking ball over his hands
function genkiGather(z, f) {
  const cx = 316, cy = 60, max = 40, spd = 20, end = 390;
  z.rx = cx - 12; z.ry = cy - 12;
  z.blt(P.genkiDot, 0, 0, 8, 10, cx, cy);
  [[4, 2], [2, 4], [4, 4], [-2, 4], [-4, 4], [-4, 2]].forEach(([ix, iy], i) => {
    const g = z.gather[i];
    if (g >= max) z.gather[i] = 0;
    else if (g > 0) {
      const tx = ix * spd + ix * 2 * (max - spd - 1), ty = iy * spd + iy * 2 * (max - spd - 1);
      if (g <= spd) z.blt(P.genkiDot, 0, 0, 8, 10, cx - tx + g * ix, cy + ty - g * iy);
      else z.blt(P.genkiDot, 0, 0, 8, 10, cx - tx + spd * ix + (g - spd) * ix * 2, cy + ty - spd * iy - (g - spd) * iy * 2);
      z.gather[i]++;
    } else if (end - f > max && Math.random() < 0.25) z.gather[i] = 1;
  });
  if (f < 200) return;
  // 200-320: effects 375 / 392, which the original's effect_pattern doesn't have (nothing drawn, the counters still run)
  if (f <= 260) { if (f % 4 === 0) z.efp = 375; else if (z.eff >= 7) { z.efp = 0; z.eff = 0; } }
  else if (f <= 320) { if (f % 6 === 0) z.efp = 392; else if (z.eff >= 3) { z.efp = 375; z.eff = 0; } }
  else { z.rx = cx - 28; z.ry = cy - 28; z.efp = 252; }
}
function rest1839(z, f, z3) { // 1839 from frame 231 (2839: 391)
  const X = STD_CHAX + 12 * 27; // (idoux * 27)
  if (f >= 231 && f <= 240) { z.chay = -200; z.enex = CENTER_ENEX; z.eney = STD_Y; z.sc[1] = 4; z.sc[2] = z.who5(); }
  else if (f === 241) { z.seStop(); z.se('Z1 逃げる'); }
  else if (f >= 242 && f <= 268) {
    const t = f <= 255 ? [0, 0] : f <= 261 ? [16, 16] : [4, z3 ? 1 : 2];
    z.sct[1] = t[0]; z.sct[2] = t[1];
    z.back(115, STD_CHAX - 108 + 16 * (f - 242), STD_Y - 30); z.back(117, STD_CHAX - 108 + 26 + 16 * (f - 242), STD_Y + 34);
  } else if (f >= 269 && f <= 272) {
    z.back(115, STD_CHAX - 108 + 16 * 27, STD_Y - 30); z.back(117, STD_CHAX - 108 + 26 + 16 * 27, STD_Y + 34);
    if (f === 269) z.se('Z1 強打');
    z.gpose(16); z.enex += 8;
  } else if (f >= 273 && f <= 276) { z.back(115, X, STD_Y - 30); z.back(117, X + 26, STD_Y + 34); z.enex -= 8; }
  else if (f >= 277 && f <= 329) {
    const t = f - 277;
    if (t < 30) z.back(117, X + 26, STD_Y + 34);
    else { z.sct[1] = 0; z.sct[2] = 0; z.back(117, X + 26 - 4 * (t - 30), STD_Y + 34 + (t - 30)); }
    if (t < 40) z.back(115, X, STD_Y - 30); else z.back(115, X, STD_Y - 30 + 2 * (t - 40));
  } else if (f === 330) { z.se('Z1 気を溜める2'); z.sct[1] = 4; z.back(116, X, STD_Y - 30 + 24); z.back(117, 192, 176); }
  else if (f >= 331 && f <= 425) {
    if (f <= 420) z.efp = 237;
    z.color = 1;
    z.rx = X + 58 + (f >= 422 ? 2 * (f - 422 + 1) : 0); z.ry = STD_Y - 8 + 24;
    z.back(116, X, STD_Y - 30 + 24); z.back(117, 192, 176);
  } else if (f >= 426 && f <= 435) {
    if (f === 426) { z.chg = z.who3(); z.otype = 1; z.pose(7); z.chay = -200; z.seStop(); z.se('Z3 光線系ヒット'); z.eff = 0; z.eft = 0; z.efp = 101; z.gpose(16); }
    z.sct[1] = 16; z.eney = STD_Y;
    z.back(115, X - 12 * (f - 426), STD_Y - 30 + 24); z.back(117, 192, 176);
  } else if (f >= 436 && f <= 475) {
    if (f === 436) { z.sct[1] = 0; z.sct[2] = 0; z.efp = 0; }
    z.back(115, X - 120, STD_Y - 30 + 24); z.back(117, 192, 176);
  } else if (f >= 476 && f <= 505) {
    if (f === 476) { z.se('Z1 逃げる'); z.sct[1] = 16; z.sct[2] = 16; z.gpose(0); }
    z.back(115, X - 120, STD_Y - 30 + 24 - 16 * (f - 476)); z.back(117, 192, 176 - 16 * (f - 476));
  } else if (f >= 506 && f <= 525) {
    if (f === 506) { z.se('Z1 逃げる'); z.sct[3] = 0; } else if (f === 518) z.sct[3] = 16; else if (f === 523) z.sct[3] = 1;
    z.back(119, STD_CHAX + 16 * (f - 506), STD_Y);
  } else if (f >= 526 && f <= 530) {
    if (f === 526) { z.seStop(); z.se('DB3 SE041'); z.gpose(1); z.sct[3] = 16; }
    z.back(119, STD_CHAX + 320 - 24 * (f - 526), STD_Y);
  } else if (f >= 531 && f <= 565) z.back(119, STD_CHAX + 200, STD_Y);
  else if (f >= 566 && f <= 570) { z.sct[3] = 1; z.back(119, STD_CHAX + 200 + 24 * (f - 566), STD_Y); }
  else if (f >= 571 && f <= 615) {
    if (f === 571) { z.seStop(); z.se('ZG 打撃2'); z.gpose(16); }
    z.back(119, STD_CHAX + 320, STD_Y); z.enex += 20;
  } else if (f >= 616 && f <= 665) { if (f === 616) { z.chay = STD_Y; z.seStop(); } z.pose(6); }
  else if (f >= 666 && f <= 704) { if (f === 666) { z.seStop(); z.se('Z1 エネルギー波'); z.pose(z3 ? 13 : 1); z.efp = 208; z.eff = 0; z.eft = 0; } }
  else if (f === 705) { z.pose(z3 ? 13 : 1); z.fxReset(); z.tecNo(1); }
  else if (f >= 706 && f <= 805) {
    if (f === 706) { z.chay = -200; z.sct[1] = 8; z.sct[2] = 5; z.sct[3] = 8; z.fxReset(); }
    const tx = 2 * Math.min(34, f - 706);
    z.back(115, CENTER_CHAX - 90 + tx, STD_Y - 86); z.back(117, CENTER_CHAX - 100 + tx, STD_Y + 36); z.back(119, CENTER_CHAX + 200 - tx, STD_Y + 70);
    z.eft = 3;
    z.blt(z.P('ball'), 3 * 128, 0, 128, 128, 254, 390 - z.eff * RAY_SPEED / 2);
    z.eff++;
  } else if (f === 806) { z.displayOut(); z.fxReset(); z.bt = 0; z.bf = 0; z.gpose(0); z.tecNo(0); }
  else if (f >= 807 && f <= 832) z.efp = 209;
  else if (f === 833) return true;
  return false;
}

// 1848 もしもヤムチャに (all.rb 85407) with the move switch around it (58146): (悟空 leading: 雅木茶 runs in first,
// back 114) → 雅木茶's 狼牙風風拳 (anime 171: he vanishes, the flurry on the shock-wave backdrop, effect 39) → 1848 again
// (the enemy knocked off the stage, effect 121) → 悟空's かめはめ波 (anime 1105, effects 203 / 204)
function p1848(z, f) {
  z.color = 0;
  const ph = z.ph || 'a';
  if (ph === 'a') {
    if (!z.flag && (z.lead === 3 || z.lead === 14)) {
      if (f === 0) z.se('Z1 逃げる');
      if (f <= 60) { if (z.scf <= 20) z.scf++; z.ax = -16; z.back(114); }
      if (f === 60) { z.ax = 0; z.chg = 7; z.chax = TEC_CENTER; z.flag = true; z.ph = 'w'; z.f = 0; }
    } else { z.otype = 1; z.pose(0); z.ph = 'w'; z.flag = true; }
    return false;
  }
  if (ph === 'w') { // anime 171 狼牙風風拳 (@btl_ani_cha_chg_no 7)
    z.chg = 7;
    if (f === 0) { z.otype = 1; z.pose(0); }
    else if (f === 30) { z.se('Z1 高速移動'); z.chay = -120; }
    else if (f >= 31 && f <= 70) { if (f % 4 === 0) z.blt(P.spark, 0, 48, 64, 64, z.chax + (z.era >= 2 ? 16 : 4), 144); }
    else if (f === 71) { z.displayOut(); z.tec(false); z.se('Z1 逃げる'); }
    else if (f >= 72 && f <= 163) { z.back(1); z.efp = 39; }
    else if (f === 164) { z.ph = 'b'; z.tec(true); return 'next'; }
    return false;
  }
  if (ph === 'b') { // 1848 again (@btl_ani_tokusyu_flag now true)
    if (f <= 18) {
      if (f === 0) z.se('Z3 跳ね返し');
      z.gpose(16); z.gx = -18; z.efp = 121; z.chg = 8;
      if (f === 18) {
        z.gx = 0; z.eney = -200; z.otype = 1; z.pose(0); z.otype = 0; z.gpose(0); z.chg = 5;
        z.efp = 0; z.bf = 0; z.eft = 0; z.eff = 0; z.f = -1; z.ph = 'k';
      }
    }
    return false;
  }
  // the switch (result 5) before each frame of 1105, then anime 1105 カメハメ波(悟空)
  const goku = z.ss(3) ? 14 : 3;
  if (z.chg !== goku) { z.chay = STD_Y; z.chax = TEC_CENTER; }
  z.chg = goku;
  if (f === 0) { z.se('Z1 気を溜める'); z.otype = 1; z.pose(2); z.color = 0; }
  else if (f >= 41 && f <= 45) z.pose(3);
  else if (f === 46) { z.seStop(); z.se('Z3 エネルギー波'); }
  else if (f >= 47 && f <= 75) {
    if (z.era >= 2) { if (f === 47) z.ax = 2; if (f === 50) z.ax = -2; if (f === 53) z.ax = 0; }
    z.efp = 203; z.rx = 340; z.ry = z.ss(3) || z.era === 2 ? 132 : 124;
  } else if (f === 76) z.fxReset();
  else if (f === 80) z.displayOut();
  else if (f >= 81 && f <= 110) z.efp = 204;
  else if (f === 111) return true;
  return false;
}

// 1850 打て！悟飯 (all.rb 85457; Z3 only): the other two fly in (backs 116 / 118), 比克 and 克林 vanish (back 48) and come
// out of nowhere, rush the enemy (back 115) and kick it up; 比克 and 克林 come down on it from the right (backs 116 / 118),
// 悟飯 charges (back 201) and fires the half-moon wave (effects 256 / 265)
function p1850(z, f) {
  z.rx = 302; z.ry = 64; z.color = 0;
  const ig = 212 + 24, k = 8, gohan = z.who5();
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    const x = STD_CHAX + f * k, L = z.lead;
    if (L === 5 || L === 18 || L === 6) {
      const g = L !== 6;
      if (f < 16) { z.ax = -2; z.ay = g ? 4 : -4; } else { z.ax = 0; if (f > 16) z.ay = 0; }
      z.sc[1] = 4; z.sc[2] = g ? 6 : gohan;
      z.back(116, x + 16, STD_Y); z.back(118, x - 14, STD_Y + (g ? -64 : 64));
    } else { z.sc[1] = 6; z.sc[2] = gohan; z.back(116, x - 14, STD_Y - 64); z.back(118, x - 14, STD_Y + 64); }
  } else if (f <= 59) {
    z.ax = 0; z.ay = 0; z.chg = 4; z.sc[1] = 6; z.sc[2] = gohan; z.chax = TEC_CENTER; z.chay = STD_Y;
    z.back(116, ig, STD_Y - 64); z.back(118, ig, STD_Y + 64);
  } else if (f === 60) { z.back(116, ig, STD_Y - 64); z.back(118, ig, STD_Y + 64); }
  else if (f <= 109) {
    z.chay = -200;
    z.back(118, ig, STD_Y + 64); z.bf--;
    if (f === 61) z.se('Z1 高速移動');
    z.back(48, TEC_CENTER + 16, STD_Y + 32); z.bf--; z.back(48, TEC_CENTER - 32, STD_Y - 32);
  } else if (f === 110) { z.eff = 0; z.enex = CENTER_ENEX; z.eney = STD_Y; z.chg = 4; z.chax = CENTER_CHAX - 128; z.otype = 0; z.pose(0); z.sc[2] = 6; }
  else if (f >= 120 && f <= 140) {
    if (f === 120) z.se('Z1 高速移動');
    z.back(48, TEC_CENTER - 160, STD_Y + 76 - 16); z.bf--; z.back(48, TEC_CENTER - 160, STD_Y + 76 - 100 + 16);
    if (f === 140) { z.chay = STD_Y - 32; z.back(115, z.chax, STD_Y + 32); }
  } else if (f >= 141 && f <= 148) { z.pose(16); z.sct[1] = 16; z.chax += 24; z.back(115, z.chax, STD_Y + 32); }
  else if (f === 149) { z.pose(2); z.sct[1] = 3; z.back(115, z.chax, STD_Y + 32); z.se('ZG 打撃4'); }
  else if (f >= 150 && f <= 180) { z.back(115, z.chax, STD_Y + 32); z.gpose(16); z.enex += 24; }
  else if (f >= 181 && f <= 239) {
    if (f === 181) z.se('Z1 飛ぶ');
    z.back(115, z.chax, STD_Y + 32 - 16 * (f - 181)); z.chay -= 16; z.sct[1] = 16; z.pose(16);
  } else if (f === 240) { z.enex = -100; z.eney = STD_Y; z.chax = 788; z.sct[1] = 14; z.sc[2] = 4; z.sct[2] = 21; z.otype = 1; z.pose(21); }
  else if (f >= 241 && f <= 264) {
    if (f === 241) z.se('Z1 飛ぶ');
    z.chax -= 16; z.back(116, z.chax, STD_Y + 10); z.back(118, z.chax - 16, STD_Y - 10); z.enex += 20;
  } else if (f >= 265 && f <= 319) {
    if (f === 265) z.se('Z1 強打');
    z.sct[1] = 15; z.sct[2] = 22;
    z.back(116, z.chax, STD_Y + 10); z.back(118, z.chax - 16, STD_Y - 10);
    z.gpose(0);
    if (f === 265 || f === 266) z.gx = -4; else if (f === 267 || f === 268) z.gx = 4;
  } else if (f === 320) { z.chg = gohan; z.chax = TEC_CENTER; z.chay = STD_Y; z.eney = -200; z.otype = 1; z.pose(2); z.se('Z3 変身'); }
  else if (f >= 321 && f <= 447) z.back(201, 228, 88);
  else if (f >= 448 && f <= 549) {
    if (f === 448) { z.seStop(); z.se('DB3 エネルギー波2'); }
    z.pose(3); z.efp = 256; z.rx = z.chax + 64; z.ry = z.chay - 18;
  } else if (f === 550) { z.fxReset(); z.displayOut(); }
  else if (f >= 551 && f <= 576) { z.efp = 265; z.ry = 102; z.back(116, 338, STD_Y + 10); z.back(118, 338 - 16, STD_Y - 10); }
  else if (f === 577) return true;
  return false;
}

// 1851 ありがとうピッコロさん！ (all.rb 85660) / 1857 ピッコロさん！？ (86017, the young Namekian 15 in 比克's place,
// his mouth-ball row 12): (比克 / 青年 leading: 悟飯 runs in first, back 115) the enemy charges in from the right and
// knocks 悟飯 back, the other runs in between (back 115), knocks it away and fires his mouth ball (back 116, 201 / 202)
const p1857 = (z, f) => p1851(z, f, 15, 12);
function p1851(z, f, who = 4, row = 4) {
  const gohan = z.who5();
  if (!z.flag && z.lead === who) {
    z.sc[1] = gohan;
    if (f === 0) z.se('Z1 逃げる');
    if (f <= 60) { if (z.scf <= 20) z.scf++; z.ax = -16; z.back(115, STD_CHAX + Math.min(f, 21) * 16, STD_Y); }
    if (f === 60) { z.ax = 0; z.chg = 5; z.chax = TEC_CENTER; z.flag = true; z.f = 0; }
    return false;
  }
  if (f <= 1) { z.sc[1] = who; z.chg = gohan; z.otype = 0; z.pose(0); z.chax = TEC_CENTER; z.chay = STD_Y; z.enex = 640 + 32; z.eney = STD_Y; }
  else if (f <= 24) {
    if (f === 2) z.se('Z1 逃げる');
    if (f === 24) z.se('Z1 強打');
    if (f === 19) z.pose(16);
    if (f >= 19) z.chax -= 20;
    if (f === 14) z.gpose(16);
    if (f === 19) z.gpose(1);
    z.enex -= 16;
    z.back(115, -102 + 16 * (f - 2), STD_Y);
  } else if (f <= 89) {
    if (f <= 35) z.enex += 2;
    if (f === 25) { z.gpose(0); z.se('Z1 気を溜める2'); }
    z.pose(0);
    if (f === 70) z.sct[1] = 16;
    z.back(115, CENTER_CHAX, STD_Y);
  } else if (f <= 99) z.back(115, CENTER_CHAX + 4 * (f - 90), STD_Y);
  else if (f <= 159) {
    z.sct[1] = 1;
    if (f === 100) { z.seStop(); z.se('ZG 打撃4'); }
    z.back(115, CENTER_CHAX + 40, STD_Y); z.enex += 20; z.gpose(16);
  } else if (f === 160) { z.se('Z1 怪光線'); z.color = 1; z.sct[1] = row; z.back(116, CENTER_CHAX + 40, STD_Y); }
  else if (f <= 200) { z.back(116, CENTER_CHAX + 40, STD_Y); z.efp = 201; z.rx = 340; z.ry = 96; }
  else if (f === 201) z.fxReset();
  else if (f === 205) { z.gpose(0); z.displayOut(); }
  else if (f >= 206 && f <= 235) z.efp = 202;
  else if (f === 236) return true;
  return false;
}

// 1852 行くぞクリリン (all.rb 85753) / 1858 地球の方 (86109, the young Namekian 15 in 比克's place, charging in row 11):
// 1801 with 克林: the other one flies in (effects 89 / 90), both vanish (back 48), 比克 knocks the enemy off the stage
// (121), 克林 comes from behind and kicks it down (effect 125), both charge (back 118) and fire (320), the balls hit as one (247)
const p1858 = (z, f) => p1852(z, f, 15, 11);
function p1852(z, f, who = 4, row = 2) {
  z.rx = f <= 500 ? 325 : 340; z.ry = f <= 500 ? 70 : 200;
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    if (z.lead === who) { z.sc[2] = 6; z.efp = 90; z.ay = f <= 10 ? -5 : 0; }
    else if (z.lead === 6) { z.sc[2] = who; z.efp = 89; z.ay = f <= 10 ? 5 : 0; }
  } else if (f <= 59) { if (z.lead === 6 && f === 40) z.chay -= 100; z.chg = who; z.sc[2] = 6; z.efp = 92; }
  else if (f <= 100) { z.efp = 92; z.chay = -200; if (f === 60) z.se('Z1 高速移動'); z.back(48, TEC_CENTER + 10, STD_Y + 76 - 100); }
  else if (f <= 140) { z.efp = 0; if (f === 101) z.se('Z1 高速移動'); z.back(48, TEC_CENTER, STD_Y + 76); }
  else if (f === 150) { z.eff = 0; z.enex = CENTER_ENEX; z.eney = STD_Y; z.chg = who; z.chax = CENTER_CHAX; z.otype = 0; z.pose(0); }
  else if (f >= 160 && f <= 180) { if (f === 160) z.se('Z1 高速移動'); z.back(48, CENTER_CHAX + 16, STD_Y + 26); if (f === 180) z.chay = STD_Y; }
  else if (f === 186) { z.se('Z1 打撃'); z.pose(3); }
  else if (f === 191) { z.se('Z1 打撃'); z.pose(4); }
  else if (f === 201) { z.se('Z3 打撃'); z.pose(1); z.gpose(16); }
  else if (f >= 207 && f <= 225) {
    z.gx = -18; z.efp = 121;
    if (f === 225) { z.chay = -200; z.enex = -96; z.pose(0); z.chg = 6; }
  } else if (f >= 226 && f <= 246) {
    z.gx = -18;
    if (f === 226) z.se('Z1 高速移動');
    if (f === 235) z.gpose(0);
    z.back(48, CENTER_CHAX + 16 + 96, STD_Y + 26);
    if (f === 246) { z.chax += 96; z.gx = 0; }
    z.eff = 0; z.eft = 0;
  } else if (f >= 252 && f <= 293) {
    z.efp = 125; z.rx = 350; z.ry = 158; z.chay = STD_Y; z.otype = 1;
    if (f === 252) z.se('Z1 強打');
    z.pose(z.era === 1 ? 9 : 16); z.gpose(16); z.gx = 18; z.gy = 4;
  } else if (f >= 294 && f <= 353) {
    z.efp = 0; z.eff = 0;
    if (f === 294) z.se('Z1 気を溜める2');
    z.chax = TEC_CENTER; z.chay = STD_Y - 50; z.pose(row); z.chg = who; z.sct[2] = 2;
    z.back(118, TEC_CENTER, STD_Y + 50);
  } else if (f >= 354 && f <= 414) {
    if (f === 354) { z.seStop(); z.se('Z1 エネルギー波2'); }
    z.pose(3); z.sct[2] = 3; z.back(118, TEC_CENTER, STD_Y + 50); z.efp = 320;
  } else if (f === 415) { z.gy = 0; z.gx = 0; z.efp = 0; z.displayOut(); z.eff = 0; }
  else if (f >= 416 && f <= 442) z.efp = 247;
  else if (f === 443) return true;
  return false;
}

// 1919 ダブルアイビーム(比克＆天津飯) (all.rb 87668): the other one flies in (effects 89 / 90), 比克 above and 天津飯
// below fire a green and an orange ball from their eyes, which fly off and come back on the enemy
function p1919(z, f) {
  z.rx = 340; z.ry = 200;
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    if (z.lead === 4) { z.sc[2] = 8; z.efp = 90; z.ay = f <= 10 ? -5 : 0; }
    else if (z.lead === 8) { z.sc[2] = 4; z.efp = 89; z.ay = f <= 10 ? 5 : 0; }
  } else if (f <= 59) { if (f === 40 && z.lead === 8) z.chay -= 100; z.chg = 4; z.sc[2] = 8; z.efp = 92; }
  else if (f <= 120) {
    if (f === 60) { z.se('Z1 怪光線'); z.efp = 0; z.eft = 1; z.eff = 0; z.pose(4); z.sct[2] = 0; }
    z.back(118, TEC_CENTER, STD_Y + 50);
    z.blt(z.P('ballGreen'), z.eft * 128, 0, 128, 128, 270 + (f - 60) * RAY_SPEED, 28);
    z.blt(z.P('ball'), z.eft * 128, 0, 128, 128, 250 + (f - 60) * RAY_SPEED, 128);
  } else if (f === 121) z.displayOut();
  else if (f >= 131 && f <= 159) {
    z.blt(z.P('ballGreen'), z.eft * 128, 0, 128, 128, -128 + (f - 131) * RAY_SPEED, 96);
    z.blt(z.P('ball'), z.eft * 128, 0, 128, 128, -128 + (f - 131) * RAY_SPEED, 120);
  } else if (f === 160) return true;
  return false;
}

// 1856 油断してやがったな(悟飯＆貝吉塔) (all.rb 85896): (貝吉塔 leading: 悟飯 runs in first, back 115) the enemy charges in
// and knocks 悟飯 back, 貝吉塔's beam hits it from the left (effect 226, explosion 101); 貝吉塔 charges (back 102 / Z3
// 201, blue) and fires from his mouth (233), which hits (234)
function p1856(z, f) {
  const z3 = z.era >= 2, [bn, bx, by] = z3 ? [201, 220, 86] : [102, 190, 32];
  z.rx = 350; z.ry = 124;
  if (!z.flag && (z.lead === 12 || z.lead === 19)) {
    if (f === 0) z.se('Z1 逃げる');
    if (f <= 60) { z.sc[1] = z.who5(); z.ax = -16; z.back(115, STD_CHAX + Math.min(f, 21) * 16, STD_Y); }
    if (f === 60) { z.ax = 0; z.chg = 5; z.chax = TEC_CENTER; z.flag = true; z.f = 0; }
    return false;
  }
  if (!z.flag) { z.flag = true; return false; }
  if (f <= 1) { z.sc[1] = z.ss(12) ? 19 : 12; z.chg = z.who5(); z.otype = 0; z.pose(0); z.chax = TEC_CENTER; z.chay = STD_Y; z.enex = 640 + 32; z.eney = STD_Y; }
  else if (f <= 24) {
    if (f === 2) z.se('Z1 逃げる');
    if (f === 24) z.se('ZG 打撃4');
    if (f === 14) z.gpose(16);
    if (f === 19) z.gpose(1);
    z.enex -= 16;
  } else if (f <= 59) { z.chax -= 16; z.pose(17); }
  else if (f === 60) { z.color = 3; z.se('Z1 怪光線'); }
  else if (f <= 86) z.efp = 226;
  else if (f === 87) { z.eff = 0; z.eft = 0; z.efp = 101; z.seStop(); z.se('Z3 光線系ヒット'); z.gpose(16); }
  else if (f <= 119) z.enex += 16;
  else if (f === 120) {
    z.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    z.chg = z.ss(12) ? 19 : 12; z.chax = TEC_CENTER; z.chay = STD_Y; z.otype = 1; z.color = 3; z.pose(5);
  } else if (f <= 209) z.back(bn, bx, by);
  else if (f === 210) { z.seStop(); z.pose(6); }
  else if (f === 230) { z.seStop(); z.se('Z1 エネルギー波2'); z.efp = 233; }
  else if (f === 269) z.fxReset();
  else if (f === 279) z.displayOut();
  else if (f >= 280 && f <= 306) z.efp = 234;
  else if (f === 307) return true;
  return false;
}

// 1859 何故か息の合う(雅木茶＆青年) (all.rb 86252): the other one flies in (effects 89 / 90), both vanish (back 48),
// then the two together give the enemy a 狼牙風風拳 (effect 332); the enemy is knocked down out of the stage (damage 78,
// ZG 打撃4)
function p1859(z, f) {
  z.rx = f <= 500 ? 325 : 340; z.ry = f <= 500 ? 70 : 200;
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    if (z.lead === 7) { z.sc[2] = 15; z.efp = 90; z.ay = f <= 10 ? -5 : 0; }
    else if (z.lead === 15) { z.sc[2] = 7; z.efp = 89; z.ay = f <= 10 ? 5 : 0; }
  } else if (f <= 59) { if (z.lead === 15 && f === 40) z.chay -= 100; z.chg = 7; z.sc[2] = 15; z.efp = 92; }
  else if (f <= 100) {
    z.chay = -120; z.efp = 0;
    if (f === 60) z.se('Z1 高速移動');
    z.back(48, TEC_CENTER + 6, STD_Y + 76); z.bf--; z.back(48, TEC_CENTER + 6, STD_Y + 76 - 100);
  } else if (f === 110) {
    z.eff = 0; z.enex = CENTER_ENEX; z.eney = STD_Y; z.chg = 7; z.chax = CENTER_CHAX + 16; z.otype = 0; z.pose(0);
    z.sc[2] = 15; z.sct[2] = 19; z.se('Z1 逃げる'); z.displayOut();
  } else if (f >= 111 && f <= 202) z.efp = 332;
  else if (f === 203) { z.chay = -160; z.kyouda = true; return true; }
  return false;
}

// 1904 絶好のチャンス(悟飯・克林・貝吉塔) (all.rb 86769): 悟飯 above and 克林 below (effects 89 / 90 / 92; 貝吉塔 leading:
// both fly in, backs 116 / 118) charge (back 105 / Z3 201), vanish (back 48), charge again and fire two big beams
// (effect 367), the huge wave (48) blows the enemy up (104) and it comes back in from the left; 貝吉塔 swoops in with a
// flash and fires his small blue beam (225)
function p1904(z, f) {
  const z3 = z.era >= 2, [bn, bx, by] = z3 ? [201, 234, -18 + 54 + 50] : [105, 218, 60], gohan = z.who5(), vegeta = z.ss(12) ? 19 : 12;
  z.rx = 340; z.ry = 200;
  const two = () => { z.back(bn, bx, by - 50); z.bf--; z.back(bn, bx, by + 50); };
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    const L = z.lead;
    if (L === 5 || L === 18) { z.sc[2] = 6; z.efp = 90; z.ay = f <= 10 ? -5 : 0; }
    else if (L === 6) { z.sc[2] = gohan; z.efp = 89; z.ay = f <= 10 ? 5 : 0; }
    else if (L === 12 || L === 19) {
      z.sc[3] = vegeta; z.ax = -16; z.sc[1] = gohan; z.sc[2] = 6;
      z.back(116, STD_CHAX + f * 8 + 16, STD_Y - 50); z.back(118, STD_CHAX + f * 8 + 16, STD_Y + 50);
    }
  } else if (f <= 59) {
    z.ax = 0;
    if (z.lead === 6 && f === 40) z.chay -= 100;
    z.chax = TEC_CENTER; z.chay = STD_Y - 50; z.chg = gohan; z.sc[2] = 6; z.efp = 92;
  } else if (f === 60) { z.se(z3 ? 'Z3 変身' : 'Z2 気を溜める'); z.color = 0; }
  else if (f <= 150) two();
  else if (f <= 191) {
    z.chay = -120; z.efp = 0;
    if (f === 151) { z.seStop(); z.se('Z1 高速移動'); }
    z.back(48, TEC_CENTER, STD_Y + 76); z.bf--; z.back(48, TEC_CENTER, STD_Y + 76 - 100);
  } else if (f === 200) z.eff = 0;
  else if (f >= 210 && f <= 230) {
    if (f === 210) z.se('Z1 高速移動');
    z.back(48, TEC_CENTER, STD_Y + 76); z.bf--; z.back(48, TEC_CENTER, STD_Y + 76 - 100);
  } else if (f >= 231 && f <= 260) {
    if (f === 231) { z.se(z3 ? 'Z3 変身' : 'Z2 気を溜める'); z.color = 0; }
    z.sct[2] = 2; z.pose(2);
    two(); z.bf--;
    z.chay = STD_Y - 50;
    z.back(118, z.chax, STD_Y + 50);
  } else if (f >= 261 && f <= 342) {
    if (f === 261) { z.seStop(); z.se('DB3 エネルギー波2'); z.se('Z1 エネルギー波2'); }
    z.efp = 367; z.pose(3); z.sct[2] = 3; z.back(118, z.chax, STD_Y + 50);
  } else if (f === 343) { z.chay = -120; z.fxReset(); }
  else if (f === 353) z.displayOut();
  else if (f >= 354 && f <= 378) { z.ry = 110; z.color = 0; z.efp = 48; }
  else if (f >= 379 && f <= 400) {
    if (f === 379) { z.eff = 0; z.eft = 0; z.efp = 104; z.se('Z1 爆発1'); z.gpose(17); }
    z.enex += 16;
  } else if (f >= 401 && f <= 432) { if (f === 401) { z.enex = -208; z.efp = 0; } z.enex += 16; }
  else if (f >= 433 && f <= 440) { if (f === 433) { z.se('Z1 吹っ飛ぶ止まる'); z.gpose(16); } else if (f === 437) z.gpose(0); }
  else if (f >= 460 && f <= 480) {
    const t = f - 460;
    if (t === 0) { z.chg = vegeta; z.se('Z1 飛ぶ'); z.chax = 830; z.chay = STD_Y - 42; z.otype = 1; z.pose(z3 ? 22 : 13); }
    if (t === 16) { z.se('DB3 刀'); z.pose(z3 ? 23 : 10); z.fill(0, 0, 640, 296, '#fff'); }
    if (t === 17) { z.fill(0, 0, 640, 296, '#fff'); z.gpose(16); }
    z.chax -= 28; z.chay += 2;
  } else if (f >= 481 && f <= 490) { if (f === 487) { z.pose(0); z.chax += z3 ? 12 : 6; } }
  else if (f >= 491 && f <= 530) {
    if (f === 491) { z.se('Z1 怪光線'); z.otype = 1; z.pose(1); z.color = 3; z.efp = 225; }
    if (z3) { z.rx = 330; z.ry = 136; } else { z.rx = 334; z.ry = 132; }
  } else if (f === 531) { z.chay = -200; return true; }
  return false;
}

// 1905 オレを半殺しにしろ(克林＆貝吉塔) (all.rb 87021): 克林 stands to the left of 貝吉塔, who shouts in a speech bubble
// (「快把我打個半死！」, 克林's 「！」); 克林 charges (back 105 / Z3 201) and shoots 貝吉塔 with a small beam (effect 225) —
// 貝吉塔 flies in from the left with it (226)
const SHOUT = '　快把我打個半死！'; // chg_fc_mozi_tikan / output_mozi (the original's text, in the remake's script)
function p1905(z, f) {
  const z3 = z.era >= 2, [bn, bx, by] = z3 ? [201, 234 - 176, -18 + 54 + 50] : [105, 218 - 160, 60], vegeta = z.ss(12) ? 19 : 12;
  if (z3) { z.rx = 182 + 9 * 8; z.ry = 142; } else { z.rx = 174 + 9 * 8; z.ry = 148; }
  z.color = 0;
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    if (z.lead === 12 || z.lead === 19) { z.sc[1] = 6; z.back(116, STD_CHAX + f * 8 + 16 - 160, STD_Y); }
    else if (z.lead === 6) { z.sc[1] = vegeta; z.ax = f <= 20 ? -8 : 0; z.back(116, STD_CHAX + f * 8 + 16, STD_Y); }
  } else if (f <= 59) {
    if (z.lead === 6 && f === 40) z.chax += 160;
    z.ax = 0; z.ay = 0; z.chg = vegeta; z.sc[1] = 6; z.back(116, z.chax - 160, STD_Y);
  } else if (f === 60) z.back(116, z.chax - 160, STD_Y);
  else if (f <= 150) {
    if (f === 61) { z.chax -= 16; z.se('Z1 吹っ飛ぶ'); z.otype = 1; z.pose(z3 ? 22 : 13); }
    z.back(116, z.chax - 144, STD_Y);
    const x = z.chax - 96 + 168, y = STD_Y - 48 + 28;
    z.blt(P.bubble, 256, 96, 224, 32, x, y);
    z.say(SHOUT, x, y);
    if (f >= 91) z.blt(P.mark, 0, 0, 16, 16, z.chax - 144 + 40, STD_Y - 16 + 28);
  } else if (f <= 240) {
    if (f === 151) z.se(z3 ? 'Z3 変身' : 'Z2 気を溜める');
    z.back(bn, bx, by); z.bf--; z.back(116, z.chax - 144, STD_Y);
  } else if (f <= 250) z.back(116, z.chax - 144 + (f - 241) * 8, STD_Y);
  else if (f <= 340) {
    if (f === 251) { z.se('Z1 怪光線'); z.otype = 1; z.sct[1] = 1; z.pose(z3 ? 28 : 15); z.efp = 225; }
    z.back(116, 178, STD_Y); z.chax += 14;
  } else if (f === 341) z.fxReset();
  else if (f === 350) { z.displayOut(); z.chax = -96; z.chay = STD_Y; z.otype = 1; z.pose(z3 ? 28 : 15); }
  else if (f >= 351 && f <= 377) { z.chax += 14; z.efp = 226; }
  else if (f === 378) { z.chay = -200; return true; }
  return false;
}

// 1906 超サイヤ人だ孫悟空(悟空＆比克) (all.rb 87184): 比克 stands to the left of 悟空, both power up in green auras (backs
// 105 → 101 → 102), 比克 falls back, 悟空 flares (back 213) and rushes the enemy as a ball of ki (effect 368), shaking
// the screen, and smashes it away (damage 22, ZG 打撃4)
function shake(d) { return [[-d, d], [0, d], [d, d], [-d, 0], [0, 0], [d, 0], [-d, -d], [0, -d], [d, -d]][Math.floor(Math.random() * 9)]; } // pic_shake_cal
function p1906(z, f) {
  const bx = 218 - 156, by = 60, goku = z.who3();
  z.rx = 0; z.ry = 118;
  const pic = () => { z.bf--; z.back(116, z.chax - 160, STD_Y); };
  const ki = (rx, ry) => { z.rx = rx; z.ry = ry; z.back(213, rx - 152, ry - 138); };
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    if (z.lead === 3 || z.lead === 14) { z.sc[1] = 4; z.back(116, STD_CHAX + f * 8 + 16 - 160, STD_Y); }
    else if (z.lead === 4) { z.sc[1] = goku; z.ax = f <= 20 ? -8 : 0; z.back(116, STD_CHAX + f * 8 + 16, STD_Y); }
  } else if (f <= 59) {
    if (z.lead === 4 && f === 40) z.chax += 160;
    z.ax = 0; z.ay = 0; z.chg = goku; z.sc[1] = 4; z.back(116, z.chax - 160, STD_Y);
  } else if (f === 60) z.back(116, z.chax - 160, STD_Y);
  else if (f <= 240) {
    const t = f - 61;
    if (t === 0) z.se(z.era >= 2 ? 'Z3 変身' : 'Z2 気を溜める');
    z.color = 1; z.sct[1] = 0;
    if (t <= 60) z.back(105, bx, by); else if (t <= 120) z.back(101, bx - 16, by - 32); else z.back(102, bx - 36, by - 32);
    pic();
  } else if (f <= 270) {
    if (f === 241) z.se('DB3 SE041');
    z.sct[1] = 1; z.color = 1;
    z.back(102, bx - 36, by - 32); pic();
  } else if (f <= 480) {
    const t = f - 271;
    if (t === 0) { z.seStop(); z.se('Z1 気を溜める4'); }
    z.color = 1;
    if (t <= 60) { z.back(102, bx - 36, by - 32); z.bf--; z.back(105, bx + 166, by); }
    else if (t <= 120) { z.back(101, bx - 16, by - 32); z.bf--; z.back(101, bx - 16 + 166, by - 32); }
    else if (t <= 180) { z.back(105, bx, by); z.bf--; z.back(102, bx - 36 + 166, by - 32); }
    else z.back(102, bx - 36 + 166, by - 32);
    pic();
  } else if (f <= 540) {
    const t = f - 481;
    z.back(102, bx - 36 + 166, by - 32); z.bf--;
    if (t === 0) { z.seStop(); z.sct[1] = 16; z.se('Z1 死亡1'); }
    if (t <= 20) z.back(115, z.chax - 160 - 4 * t, STD_Y + 4 * t);
    else { z.sct[1] = 17; z.back(115, z.chax - 160 - 2 * t, STD_Y + 4 * t); }
  } else if (f <= 660) { if (f === 541) { z.seStop(); z.se('Z1 気を溜める7'); } z.back(213, z.chax - 276, STD_Y - 140); }
  else if (f <= 780) {
    const t = f - 661;
    if (t === 0) { z.seStop(); z.se('Z1 飛ぶ'); z.se('Z1 エネルギー波2'); z.se('Z1 大猿'); z.efp = 368; z.chay = -200; }
    const [sx, sy] = shake(8);
    ki((t <= 60 ? 148 + 24 * t : -200 + 36 * (t - 60)) + sx, 108 + sy);
  } else if (f === 781) z.fxReset();
  else if (f === 790) z.displayOut();
  else if (f >= 791 && f <= 804) {
    if (f === 791) { z.seStop(); z.se('Z1 エネルギー波'); z.efp = 368; }
    const [sx, sy] = shake(8);
    ki(-200 + 24 * (f - 791) + sx, 108 + sy);
  } else if (f >= 805 && f <= 864) {
    if (f === 805) { z.se('Z1 ゴー'); z.efp = 368; z.gpose(16); }
    if (f % 8 === 0) z.se('Z2 SE058');
    const [sx, sy] = shake(16);
    ki(136 + sx, 108 + sy);
    z.enex = CENTER_ENEX + sx; z.eney = STD_Y + sy;
  } else if (f >= 865 && f <= 895) {
    if (f === 865) { z.seStop(); z.se('Z1 エネルギー波3'); z.se('DB3 大猿'); z.se('ZG 打撃4'); z.se('Z2 SE058'); z.efp = 368; z.gpose(17); }
    const [sx, sy] = shake(16);
    ki(152 + 72 * (f - 865) + sx, 108 + sy);
    z.enex = CENTER_ENEX; z.eney = STD_Y;
  } else if (f === 896) { z.chay = -200; z.kyouda = true; return true; }
  return false;
}

// 1909 地球丸ごと超決戦(悟空・克林・雅木茶・天津飯・餃子) (all.rb 87484): the other four fly in (backs 116 / 118 / 120 /
// 122), the five in two rows charge and fire together (effect 96), the huge wave hits (48)
function p1909(z, f) {
  const ig = 212 - 18, k = 8, goku = z.who3();
  z.rx = 346; z.ry = 84; z.color = 0;
  const five = () => { z.back(116, z.chax + 92, STD_Y - 48); z.back(118, z.chax + 92, STD_Y + 48); z.back(120, ig, STD_Y - 72); z.back(122, ig, STD_Y + 72); };
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    const L = z.lead, x = STD_CHAX + f * k;
    const set = (a, b, c, d) => { z.sc[1] = a; z.sc[2] = b; z.sc[3] = c; z.sc[4] = d; };
    if (L === 3 || L === 14) {
      if (f < 24) z.ax = -4; else { z.ax = 0; z.ay = 0; }
      set(7, 8, 6, 9);
      z.back(116, x + 24, STD_Y - 48); z.back(118, x + 24, STD_Y + 48); z.back(120, x - 48, STD_Y - 72); z.back(122, x - 48, STD_Y + 72);
    } else {
      const M = { 7: [[0, -2], [goku, 8, 6, 9], [24, 48], [-48, -72], [-48, 72]], 8: [[0, 2], [goku, 7, 6, 9], [24, -48], [-48, -72], [-48, 72]],
        6: [[-3, -3], [goku, 7, 8, 9], [24, -48], [24, 48], [-48, 72]], 9: [[-3, 3], [goku, 7, 8, 6], [24, -48], [24, 48], [-48, -72]] }[L];
      if (!M) return false;
      if (f < 25) { z.ax = M[0][0]; z.ay = M[0][1]; } else { z.ax = 0; z.ay = 0; }
      set(...M[1]);
      z.back(116, x - 68, STD_Y); z.back(118, x + M[2][0], STD_Y + M[2][1]); z.back(120, x + M[3][0], STD_Y + M[3][1]); z.back(122, x + M[4][0], STD_Y + M[4][1]);
    }
  } else if (f <= 59) {
    z.ax = 0; z.ay = 0; z.chax = TEC_CENTER - 92; z.chay = STD_Y; z.chg = goku;
    z.sc[1] = 7; z.sc[2] = 8; z.sc[3] = 6; z.sc[4] = 9;
    five();
  } else if (f === 60) {
    z.se('Z1 ザー'); z.se('Z1 ゴー'); z.se('DB3 気を溜める2'); z.se('Z1 気を溜める'); z.se('Z1 気を溜める7');
    z.otype = 1; z.pose(2); z.sct[1] = 2; z.sct[2] = 0; z.sct[3] = 2; z.sct[4] = 0;
    five();
  } else if (f <= 189) five();
  else if (f === 190) {
    z.seStop(); z.se('Z1 エネルギー波'); z.se('Z1 エネルギー波2'); z.se('Z1 怪光線'); z.se('Z1 ゴー');
    z.pose(3); z.sct[1] = 3; z.sct[2] = 2; z.sct[3] = 3; z.sct[4] = 1; z.efp = 96;
    five();
  } else if (f <= 299) five();
  else if (f === 300) { z.eff = 0; z.efp = 0; z.displayOut(); }
  else if (f >= 302 && f <= 326) z.efp = 48;
  else if (f === 327) return true;
  return false;
}

// 1828 答えは8だ(克林＆餃子) (all.rb 83868; Z3 only): the other one flies in (effects 89 / 90), both vanish (back 48)
// and come out of nowhere beside the enemy; 餃子 asks 「9-1是！？」 (speech bubble), both count 「回答就是…」 and, with a
// charge, 「8！！」 — the enemy is knocked away (damage 22, ZG 打撃4)
function p1828(z, f) {
  z.rx = f <= 500 ? 325 : 340; z.ry = f <= 500 ? 70 : 200;
  // on a phone the two step back only to the edge of what shows, and the bubbles stay on screen (the rush ends where it does)
  const m = Math.round(z.d.margin || 0), bx = () => Math.max(z.chax - 96, m);
  const both = (text) => {
    z.blt(P.bubble, 128, 0, 128, 32, bx(), STD_Y - 48); z.blt(P.bubble, 128, 32, 128, 32, bx(), STD_Y + 48 + 74);
    z.say(text, bx(), STD_Y - 48); z.say(text, bx(), STD_Y + 48 + 74);
  };
  if (f === 0) { z.se('Z1 逃げる'); z.otype = 1; z.pose(0); }
  else if (f <= 39) {
    if (z.lead === 6) { z.sc[2] = 9; z.efp = 90; z.ay = f <= 10 ? -5 : 0; }
    else if (z.lead === 9) { z.sc[2] = 6; z.efp = 89; z.ay = f <= 10 ? 5 : 0; }
  } else if (f <= 59) { if (z.lead === 9 && f === 40) z.chay -= 100; z.chg = 6; z.sc[2] = 9; z.efp = 92; }
  else if (f <= 100) {
    z.chay = -120; z.efp = 0;
    if (f === 60) z.se('Z1 高速移動');
    z.back(48, TEC_CENTER, STD_Y + 76); z.bf--; z.back(48, TEC_CENTER, STD_Y + 76 - 100);
  } else if (f === 110) { z.eff = 0; z.enex = CENTER_ENEX; z.eney = STD_Y; z.chg = 6; z.chax = CENTER_CHAX + 16; z.otype = 0; z.pose(0); z.sc[2] = 9; }
  else if (f >= 120 && f <= 180) {
    if (f === 120) z.se('Z1 高速移動');
    z.back(48, TEC_CENTER, STD_Y + 76 - 16); z.bf--; z.back(48, TEC_CENTER, STD_Y + 76 - 100 + 16);
    if (f === 180) { z.chay = STD_Y - 32; z.back(117, z.chax, STD_Y + 32); }
  } else if (f >= 181 && f <= 260) {
    z.back(117, z.chax, STD_Y + 32);
    if (f >= 220) {
      if (f === 220) z.se('Z1 吹っ飛ぶ');
      z.blt(P.bubble, 128, 0, 128, 32, bx(), STD_Y - 48);
      z.say('　9-1是！？', bx(), STD_Y - 48);
      z.blt(P.mark, 0, 0, 16, 16, CENTER_ENEX + 40, STD_Y - 16);
      if (f === 221) z.enex += 4;
      if (f === 222) z.enex -= 4;
    }
  } else if (f >= 261 && f <= 320) {
    z.otype = 0; z.pose(16); z.sct[2] = 16;
    if (f <= 290 && z.chax - 6 >= Math.min(76 + 6 * 30, m)) z.chax -= 6;
    z.back(117, z.chax, STD_Y + 32);
    both('　回答就是…');
  } else if (f >= 321 && f <= 327) {
    if (f === 321) z.c0 = z.chax; // (76: 24 a frame to 244)
    z.chax = z.c0 + Math.round((244 - z.c0) * (f - 320) / 7); z.pose(2); z.sct[2] = 1;
    z.back(117, z.chax, STD_Y + 32);
    both('　　8　！！');
  } else if (f === 328) { z.chay = -160; z.kyouda = true; return true; }
  return false;
}

// ---------- the combos ----------
// combo → [Z2 film, damage, Z3 film, damage] (the Z2 / Z3 parts of the move switch: all.rb 56692 / 59742), and its Z1 film
// for the eight that Z1 has (src/combo-anime.js); `small`: @tec_back_small in the Z3 part (every one but 748)
const CMB = {
  701: { z1: ['shitei', 23], z2: [p1801, 41], z3: [p1801, 41] }, // 711 → 1801
  703: { z2: [p1803, 23], z3: [p1803, 23] }, // 713
  706: { z1: ['kameRanbu', 23], z2: [p1806, 23], z3: [p1806, 23] }, // 716
  708: { z1: ['genkiWish', 27], z2: [p1808, 27], z3: [p1808, 27] }, // 718
  713: { z2: [p1813, 41], z3: [p1813, 41], nohit: true }, // 723 (@damage_huttobi false, @damage_center)
  714: { z2: [p1814, 41], z3: [p1814, 41] }, // 724
  722: { z2: [p1822, 23], z3: [p1822, 41] }, // 732
  739: { z1: ['strongest', 23], z2: [p1839, 42], z3: [p1839, 42] }, // 749 → 1839 / 2839
  748: { z1: ['yamchaThanks', 23], z2: [p1848, 41], z3: [p1848, 41] }, // 758 → 1848, 171, 1848, 1105
  750: { z2: [p1850, 41], z3: [p1850, 41] }, // 760 (the Z3 part only)
  751: { z1: ['thanksPiccolo', 23], z2: [p1851, 41], z3: [p1851, 41] }, // 761
  752: { z1: ['krillinToo', 23], z2: [p1852, 41], z3: [p1852, 41] }, // 762
  819: { z1: ['doubleEyeBeam', 23], z2: [p1919, 23], z3: [p1919, 23] }, // 829
  756: { z2: [p1856, 42], z3: [p1856, 42] }, // 766
  757: { z2: [p1857, 41], z3: [p1857, 41] }, // 767
  758: { z2: [p1858, 41], z3: [p1858, 41] }, // 768
  759: { z2: [p1859, 78], z3: [p1859, 78] }, // 769
  728: { z2: [p1828, 22], z3: [p1828, 22] }, // 738 (the Z3 part only)
  804: { z2: [p1904, 41], z3: [p1904, 41] }, // 814
  805: { z2: [p1905, 41], z3: [p1905, 41] }, // 815
  806: { z2: [p1906, 22], z3: [p1906, 22] }, // 816
  809: { z2: [p1909, 44], z3: [p1909, 44] }, // 819
};
const SMALL_NOT = new Set([748]);
const films = {};
for (const id of Object.keys(CMB)) films[id] = ['cmbFilm', 'cmbDamage'];
addComboFilms(films);

const launch0 = ComboDuel.prototype.launch;
Object.assign(ComboDuel.prototype, {
  * launch() { // 32: from frame 30 the strips and the lead's cut-in (from Z2 on)
    const c = CMB[this.combo];
    if (c && (era() >= 1 || !c.z1)) {
      const z = this.cz = new Cz(this);
      if (z.era >= 1) {
        z.st.tecFrom = this.t + 29; z.st.cutFrom = this.t + 29;
        if (z.era >= 2 && !SMALL_NOT.has(this.combo)) z.st.small = true;
      }
      if (c.nohit) { z.huttobi = false; z.center = true; }
      ALL_PICTURES.forEach((p) => img(p));
    }
    yield* launch0.call(this);
  },
  * cmbFilm() {
    const c = CMB[this.combo];
    if (!this.cz) return yield* this[c.z1[0]]();
    const [body] = this.cz.era >= 2 ? c.z3 : c.z2;
    yield* this.cz.play(body);
  },
  * cmbDamage() {
    const c = CMB[this.combo];
    if (!this.cz) { if (c.z1[1] === 27) return yield* this.blownUpLeft(); return yield* this.explode(17, 50); }
    yield* this.cz.damage((this.cz.era >= 2 ? c.z3 : c.z2)[1]);
  },
});

// ?dev=cmbxb<variable 40>_<actor ids>[_s<Super Saiyan form numbers>], e.g. cmbxb1_3.16.7, cmbxb2_5.6.12_s3: like ?dev=cmbx…
// (src/combo_dev.js, whose cmb / cmbx jumps let this prefix through) with the party you name — every combo switch on, Lv 60, the moves used 999 times, a fight with
// 甜菜人 ×3 of high HP. In the console __cmbz(combo) deals the cards and picks the moves of the first open row of that
// combo whose members are all in the party, then runs the turn; __cmbz(combo, lead) makes `lead` the one who starts it.
registerZ3('cmbxb', {
  dev(game, step) {
    const m = /^cmbxb(\d)_([\d.]+)(?:_s([\d.]+))?$/.exec(step);
    if (!m) return false;
    const s = game.state = game.newState(), w = game.world;
    s.var[40] = Number(m[1]);
    s.flags.z3 = 'done';
    comboData.then((d) => {
      for (const c of d.combos) if (c.sw) s.sw[c.sw] = true;
      party(game, m[2].split('.').map(Number));
      for (const no of m[3] ? m[3].split('.').map(Number) : []) superSaiyan(w, s, no, true);
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
      window.__cmbz = (id, lead) => fire(game, d, id, lead);
    });
    return true;
  },
});
function fire(game, d, id, lead) {
  const b = game.scene, w = game.world;
  if (!b || b.phase !== 'plan') return 'not planning';
  const row = d.combos.find((c) => c.id === id && c.cha.every((a) => b.party.some((m) => m.id === a)) && (!c.sw || game.state.sw[c.sw]) && (c.era || 0) <= game.state.var[40]);
  if (!row) return 'no row with this party';
  b.plans = b.party.map(() => null);
  let k = 0;
  row.cha.forEach((a, x) => { // (the turn order goes by the card's attack + guard: the lead's card is the best one)
    const i = b.party.findIndex((p) => p.id === a), p = b.party[i];
    const best = lead ? a === lead || a === SS[lead] : false;
    b.hand[k] = { a: best ? 7 : lead ? row.atk[x] : Math.min(7, row.atk[x] + 1), g: best ? 7 : lead ? row.grd[x] : Math.min(7, row.grd[x] + 1), s: p.school };
    b.plans[i] = { card: k++, skill: w.skills[row.tec[x]], target: 0 };
  });
  b.resolveTurn();
  return row.name;
}

export const CMB_SOUNDS = ['Z2 気を溜める', 'Z2 気を溜める_元気弾', 'Z3 変身', 'DB3 エネルギー波2', 'Z3 跳ね返し', 'Z1 吹っ飛ぶ', 'ZG 打撃4',
  'Z3 エネルギー波', 'DB3 大爆発', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'DB3 気を溜める2', 'Z1 ゴー', 'Z1 ザー', 'Z1 強打', 'Z1 怪光線',
  'Z1 気を溜める(元気弾)', 'DB3 SE041', 'ZG 打撃2', 'Z3 光線系ヒット', 'Z1 衝撃波', 'Z3 打撃', 'Z1 吹っ飛ぶ止まる', 'DB3 刀', 'Z1 爆発1',
  'Z1 死亡1', 'Z1 気を溜める7', 'Z1 気を溜める4', 'Z1 大猿', 'Z2 SE058', 'Z1 エネルギー波3', 'DB3 大猿', 'Z1 飛ぶ', 'Z1 エネルギー波', 'Z1 エネルギー波2'];
ANIME_IMAGES.push(...ALL_PICTURES); // (loaded with the battle pictures at start, src/main.js battleImages)

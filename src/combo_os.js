// S-combo films F group cma (docs/anim-f-plan.md): アウトサイダーショット (OS射擊), フルパワーアウトサイダーショット (FOS射擊),
// ダブルエクスプロージョン (雙重爆裂), サイヤンアタック (賽亞攻擊) and 強襲サイヤ人 (賽亞人強襲), ported frame by frame from the
// original's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like src/combo-anime.js. The combo's attack pattern
// (combo + 10) runs anime_pattern 31 → 32 (@chr_cutin_flag, @tec_back_small) → its own pattern → the damage pattern; the
// Z2 and the Z3 move switches (all.rb 56692 / 59742) send these to the same patterns (only 強襲サイヤ人's damage differs):
//   OS     725 2825 · 743 2843 · 755 2855 · 774-779 2874-2879 (Z3)  ·  733 735-737 1833 1835-1837 · 765-768 1865-1868
//          (the 18xx ones and 2825 have a Z2 branch: $btl_progress < 2 charges in back 105 instead of 201)   damage 42 / 41
//   FOS    843-859 2943-2959 · 871-874 2971-2974                                                             damage 44
//   ダブルエクスプロージョン 827-835 2927-2935                                                               damage 43
//   サイヤンアタック 732 1832 · 734 1834 (two films of their own)                                             damage 41
//   強襲サイヤ人 742 1842 (the crew as Great Apes)                                                            damage 43 (Z2) / 44 (Z3)
// Each family is one piece of code in the original with the members and a few numbers changed: here one film per
// family with those numbers in a table. The stage is src/anime_zfighters.js's (the strips, the cut-in, the original's
// back / effect counters). Frame numbers in the comments are the original's @battle_anime_frame.
import { img, audio } from './core.js?v=20261108-1000';
import { Duel, spark, STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261108-1000';
import { ComboDuel, addComboFilms } from './combo-anime.js?v=20261108-1000';
import { ZfStage, zfBlt } from './anime_zfighters.js?v=20261108-1000';
import { AndaGather } from './anime_androids.js?v=20261108-1000';
import { registerZ3, party, heal } from './z3.js?v=20261108-1000';
import { applyLevel } from './party.js?v=20261108-1000';
import { superSaiyan } from './supersaiyan.js?v=20261108-1000';
import { comboData } from './combo.js?v=20261108-1000';

const pic = (n) => `Graphics/Pictures/${n}`;
const STD_CHAX = -70; // STANDARD_CHAX (src/anime.js)
const v = (n) => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[n]) || 0; };
const sw = (n) => { const s = globalThis.__game && globalThis.__game.state; return !!(s && s.sw && s.sw[n]); };
// $btl_progress for the party: variable 40 (1 Z2, 2 Z3 and later); $btl_top_file_name follows it
const era = () => Math.min(2, v(40));
const Z23 = (z2, z3) => () => (era() >= 2 ? z3 : z2);
const MID = Z23(pic('Z2_戦闘_必殺技_エネルギー波_中_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG')); // 400×80 ×2
const BIG = Z23(pic('Z2_戦闘_必殺技_エネルギー波_大_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_大_敵_青.PNG')); // 400×122 ×2
const HUGE = Z23(pic('Z2_戦闘_必殺技_エネルギー波_特大_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_特大_青.PNG')); // 400×192 ×2
const SMALL = Z23(pic('Z2_戦闘_必殺技_エネルギー波_小_敵_青.PNG'), pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG')); // 400×48 ×2
// back 105 気を溜める(中) by @ray_color (0 / 1 green / 3 blue): 3 frames of 152×192 (only in Z2: Z3 has back 201)
const AURA105 = { 0: pic('Z2_戦闘_必殺技_気を溜める2.png'), 1: pic('Z2_戦闘_必殺技_気を溜める2(緑).png'), 3: pic('Z2_戦闘_必殺技_気を溜める2(青).png') };
// 1842: the four Great Apes (192 wide, the second picture 192 lower)
const APES = [
  Z23(pic('Z2_戦闘_必殺技_トーマ(大猿)96×96.png'), pic('Z3_戦闘_必殺技_トーマ(大猿)96×96.png')),
  Z23(pic('Z2_戦闘_必殺技_セリパ(大猿)96×96.png'), pic('Z3_戦闘_必殺技_セリパ(大猿)96×96.png')),
  Z23(pic('Z2_戦闘_必殺技_トテッポ(大猿)96×96.png'), pic('Z3_戦闘_必殺技_トテッポ(大猿)96×96.png')),
  Z23(pic('Z2_戦闘_必殺技_パンブーキン(大猿)96×96.png'), pic('Z3_戦闘_必殺技_パンブーキン(大猿)96×96.png')),
];
const BOOM6 = pic('戦闘アニメ_爆発6.PNG'); // effect 105 (damage 44): 4 frames of 256×256
// set_battle_cutin_name (all.rb 19240): the rows these members get from another picture
const CUT_ZG = pic('ZG_味方カットイン.PNG'), CUT_Z3 = pic('Z3_味方カットイン.PNG');
const CUT_APE = Z23(pic('Z2_バーダック一味大猿カットイン.png'), pic('Z3_バーダック一味大猿カットイン.png'));
const CMA_IMAGES = () => [MID(), BIG(), HUGE(), SMALL(), ...Object.values(AURA105), ...APES.map((a) => a()), BOOM6, CUT_ZG, CUT_APE()];

// ---------- the films' tables ----------
// OS / FOS (2825 …): the one on top (@btl_ani_cha_chg_no: the main sprite) and the one below (@scombo_cha2, drawn by
// back 118); their rows while charging (61-187) and firing (188-269); the auras of 61-187 in the order drawn ([dy from
// back_y, @ray_color]); the androids' ki dots (@genkitama_kanri_*); the beam they fire ([dx, dy] of its two halves from
// (ray_x, ray_y), or 295 the huge one); ray_y; the sounds at 60 (Z3 / Z2) and at 188; the hit (240 OS / 48 FOS)
const OS_SE = [['Z3 変身', 'Z1 気を溜める'], ['Z2 気を溜める', 'Z1 気を溜める']]; // 2825 2855 2879 (2843 … : Z3 only)
const CREW_SE = [['Z3 変身'], ['Z2 気を溜める']]; // 1833 …
const FOS_SE = [['Z3 変身', 'Z1 気を溜める', 'Z1 気を溜める2'], ['Z2 気を溜める']]; // 2943 …
const BLUE2 = [[-50, 3], [50, 3]], GB = [[-50, 3], [50, 1]], BG = [[50, 3], [-50, 1]], G1 = [[-50, 1]];
const os = (top, bot, tame, aura, fire, frow, o = {}) => ({ top, bot, tame, aura, fire, frow, ry: 200, se: OS_SE, fse: ['Z1 エネルギー波2'], hit: 240, dmg: 42, ...o });
const crew = (top, bot, tame, fire, frow) => ({ top, bot, tame, aura: BLUE2, fire, frow, ry: 200, se: CREW_SE, fse: ['Z1 エネルギー波'], hit: 240, dmg: 41 });
const fos = (top, bot, tame, frow, droid) => ({ top, bot, tame, frow, fire: 295, ry: 68, rx: 342, hit: 48, dmg: 44, aura: droid ? G1 : BLUE2, gather: droid,
  se: droid ? [FOS_SE[0], FOS_SE[0]] : FOS_SE, fse: droid ? ['Z1 エネルギー波', 'ZG 光線1'] : ['Z1 エネルギー波', 'ZG 光線1', 'Z1 大猿'] });
const PAIR = {
  725: os(16, 4, [4, 2], GB, [[18, -134], [2, -36]], [1, 3]), // 2825 (303)
  743: os(4, 22, [2, 1], G1, [[2, -138], [6, -34]], [3, 1], { gather: true, se: [OS_SE[0], OS_SE[0]] }), // 2843 (304)
  755: os(4, 12, [2, 5], BG, [[2, -136], [2, -28]], [3, 6]), // 2855 (321)
  774: os(4, 21, [2, 1], G1, [[2, -138], [6, -34]], [3, 1], { gather: true, se: [OS_SE[0], OS_SE[0]], ry: 202 }), // 2874 (304)
  775: os(4, 23, [2, 1], G1, [[2, -138], [26, -34]], [3, 1], { gather: true, se: [OS_SE[0], OS_SE[0]], ry: 202 }), // 2875 (346)
  776: os(25, 21, [12, 1], G1, [[24, -132], [6, -36]], [1, 1], { gather: true, se: [OS_SE[0], OS_SE[0]], ry: 202 }), // 2876 (347)
  777: os(25, 22, [12, 1], G1, [[24, -132], [6, -36]], [1, 1], { gather: true, se: [OS_SE[0], OS_SE[0]], ry: 202 }), // 2877 (347)
  778: os(25, 23, [12, 1], G1, [[24, -132], [26, -34]], [1, 1], { gather: true, se: [OS_SE[0], OS_SE[0]], ry: 202 }), // 2878 (348)
  779: os(25, 12, [12, 5], BG, [[24, -132], [2, -28]], [1, 6]), // 2879 (349)
  733: crew(16, 27, [4, 2], [[18, -134], [14, -32]], [1, 1]), // 1833 (310)
  735: crew(16, 28, [4, 0], [[18, -134], [0, -28]], [1, 1]), // 1835 (311)
  736: crew(16, 29, [4, 2], [[18, -134], [12, -40]], [1, 3]), // 1836 (312)
  737: crew(16, 30, [4, 4], [[18, -134], [14, -20]], [1, 2]), // 1837 (313)
  765: crew(27, 28, [2, 0], [[12, -130], [0, -28]], [1, 1]), // 1865 (334)
  766: crew(27, 29, [2, 2], [[12, -130], [18, -40]], [1, 1]), // 1866 (335)
  767: crew(28, 30, [0, 4], [[0, -128], [6, -32]], [1, 1]), // 1867 (336)
  768: crew(29, 30, [2, 4], [[18, -142], [6, -32]], [1, 1]), // 1868 (337)
  843: fos(16, 27, [4, 2], [1, 1]), 844: fos(16, 28, [4, 0], [1, 1]), 845: fos(16, 29, [4, 2], [1, 3]), 846: fos(16, 30, [4, 4], [1, 2]), // 2943-2946
  847: fos(27, 28, [2, 0], [1, 1]), 848: fos(27, 29, [2, 2], [1, 3]), 849: fos(27, 30, [2, 4], [1, 2]), // 2947-2949
  850: fos(28, 29, [0, 2], [1, 3]), 851: fos(28, 30, [0, 4], [1, 2]), 852: fos(29, 30, [2, 4], [3, 2]), // 2950-2952
  853: fos(4, 21, [2, 1], [3, 1], true), 854: fos(4, 22, [2, 1], [3, 1], true), 855: fos(4, 23, [2, 1], [3, 1], true), // 2953-2955
  856: fos(25, 21, [4, 1], [1, 1], true), 857: fos(25, 22, [4, 1], [1, 1], true), 858: fos(25, 23, [4, 1], [1, 1], true), // 2956-2958
  859: fos(25, 12, [4, 0], [1, 1]), // 2959
  871: fos(25, 27, [4, 2], [1, 1]), 872: fos(25, 28, [4, 0], [1, 1]), 873: fos(25, 29, [4, 2], [1, 3]), 874: fos(25, 30, [4, 4], [1, 2]), // 2971-2974
};
// ダブルエクスプロージョン (2927 …): the one on the left (the main sprite) and the one on the right (back 118); rows while
// charging and firing; the two auras' @ray_color (left, right); where back 118 draws the right one at frame 60 (x from TEC_CENTER)
const DOUBLE = {
  827: [12, 17, [0, 0], [3, 3], [2, 2], -80], 828: [25, 17, [4, 0], [3, 3], [8, 2], -80], 829: [4, 17, [0, 0], [1, 3], [23, 2], -80],
  830: [4, 12, [0, 0], [1, 3], [23, 2], -80], 831: [12, 25, [0, 4], [3, 3], [2, 8], -80], 832: [16, 4, [4, 0], [3, 1], [5, 23], 104],
  833: [16, 12, [4, 0], [3, 3], [5, 2], -80], 834: [16, 17, [4, 0], [3, 3], [5, 2], -80], 835: [16, 25, [4, 4], [3, 3], [5, 8], -80],
};
// サイヤンアタック: [the one on top, the one below]; the beam's ray_x before frame 300
const SAIYAN = { 732: [27, 30, 325], 734: [28, 29, 330] };

addComboFilms({
  ...Object.fromEntries(Object.entries(PAIR).map(([id, c]) => [id, ['cmaPair', `cmaHit${c.dmg}`]])),
  ...Object.fromEntries(Object.keys(DOUBLE).map((id) => [id, ['cmaDouble', 'cmaHit43']])),
  732: ['cmaSaiyanTP', 'cmaHit41'], 734: ['cmaSaiyanST', 'cmaHit41'],
  742: ['cmaApes', 'cmaHitApes'],
});

// ---------- the stage ----------
// src/anime_zfighters.js's stage on a combo: the lead's cut-in (as the original: $partyc[@chanum]), the Z2 strips in Z2
class CmaStage extends ZfStage {
  constructor(d) {
    super(d);
    this.era = era() >= 2 ? 2 : 1;
    this.actor = d.lead;
    this.small = true; // (every one of these: @tec_back_small)
    this.combo = d.combo;
  }
  drawCut(c) {
    if (this.cut && this.cutFlag && !this.mirror) {
      const id = this.actor, v173 = v(173);
      let r = null;
      if (this.combo === 742) r = [CUT_APE(), 0, 0]; // (742 is played by the four as Great Apes only)
      else if (id === 24 && sw(363)) r = [CUT_Z3, 2 * 640, 21];
      else if (id === 16 && v(175) === 1) r = [CUT_ZG, 0, 8];
      else if (id === 32 && v(175) === 1) r = [CUT_ZG, 0, 9];
      else if (id === 17 && v173 === 1) r = [CUT_ZG, 0, 5];
      else if (id === 17 && (v173 === 3 || v173 === 4)) r = [CUT_ZG, 0, 7];
      else if (id === 20 && (v173 === 1 || v173 === 3 || v173 === 4)) r = [CUT_ZG, 0, 4];
      if (r) { zfBlt(c, r[0], r[1], 64 * r[2], 640, 64, 0, 292); return; }
    }
    super.drawCut(c);
  }
  // back_anime_pattern's own counter step (@back_anime_frame += 1 at its end) for a pattern that never changes picture
  tickBack() { this.ba.frame++; }
}
const MINE = (d) => PAIR[d.combo] || DOUBLE[d.combo] || SAIYAN[d.combo] || d.combo === 742;
const own = Object.prototype.hasOwnProperty.call(ComboDuel.prototype, 'swoopIn') ? ComboDuel.prototype.swoopIn : null;
Object.assign(ComboDuel.prototype, {
  // 31: the stage is made here, so 32 (src/anime_zfighters.js launch) brings the strips and the cut-in from its frame 30
  * swoopIn() {
    if (MINE(this)) {
      for (const p of CMA_IMAGES()) img(p);
      this.st = new CmaStage(this);
    }
    yield* (own || Duel.prototype.swoopIn).call(this);
  },

  // the second one's picture (set_battle_character_name @scombo_cha2: 1 the special sheet, 0 the normal one)
  cmaMate(id, row, x, y, sp = true, list = this.st.b) {
    const sheet = sp ? this.crew[id].special : this.crew[id].normal;
    list.push((c) => zfBlt(c, sheet, 0, row * 96, 96, 96, x, y));
  },
  cmaAura201(x, y, color) { this.st.aura(x, y, color); }, // back 201 (Z3): 2 frames of 136×142, the next every 16
  cmaAura105(x, y, color) { // back 105 (Z2): 3 frames of 152×192, the next every 4
    const st = this.st;
    st.back(AURA105[color] || AURA105[0], st.ba.type * 152, 0, 152, 192, x, y);
    st.backStep(4, 2);
  },
  cmaAfter(x, y) { // back 48: the after-image, when the back counter is a multiple of 4
    const st = this.st;
    if (st.ba.frame % 4 === 0) st.b.push((c) => spark(c, 0, 48, 64, 64, x, y));
    st.tickBack();
  },
  // set_chr_display_out: the attacker off, the enemy in the middle, the enemy's cut-in from now on
  cmaOut() { this.zfOut(); },

  // ---------- OS / FOS (2825 2843 2855 2874-2879 1833 1835-1837 1865-1868 2943-2959 2971-2974) ----------
  // The lead rises (or sinks) while the other flies in below (effect 90) / above (89); from 40 the one on top is the
  // main sprite and the other waits below (effect 92); both charge with an aura each (back 201 / Z2 105; the androids
  // have none, their ki dots gather instead) and fire together (two 中 beams, or FOS's huge one), then the cut to the
  // enemy and the beam on it (effect 240 / 48)
  * cmaPair() {
    const cfg = PAIR[this.combo], st = this.st, A = this.A, z3 = st.era >= 2;
    const top = this.who(cfg.top), bot = this.who(cfg.bot), leadTop = this.lead === top;
    const rx = cfg.rx || 340, ry = cfg.ry;
    const [ax, ay] = z3 ? [234, -18 + 54 + 50] : [218, 60]; // backhai_no 201 / 105
    const gather = cfg.gather && new AndaGather(TEC_CENTER + 86, STD_Y + 84, 187);
    for (let f = 0; f <= 305; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) { // effect 90 / 89
        const mate = leadTop ? bot : top, my = leadTop ? 50 : -50;
        st.fx((k) => this.cmaMate(mate, 0, STD_CHAX + k.frame * 8 + 30, STD_Y + my, true, st.e));
        if (f <= 10) A.y += leadTop ? -5 : 5;
      }
      if (f >= 40 && f <= 60) { // effect 92 (still on at 60)
        if (f === 40) { if (!leadTop) A.y -= 100; this.L.sheets = this.crew[top]; }
        st.fx(() => this.cmaMate(bot, 0, TEC_CENTER, STD_Y + 50, true, st.e));
      }
      if (f === 60) for (const n of cfg.se[z3 ? 0 : 1]) this.se(n);
      if (f >= 61 && f <= 187) {
        st.fxReset();
        this.pose(A, cfg.tame[0], true);
        for (const [dy, color] of cfg.aura) {
          if (z3) this.cmaAura201(ax, ay + dy, color); else this.cmaAura105(ax, ay + dy, color);
          st.ba.frame--;
        }
        this.cmaMate(bot, cfg.tame[1], TEC_CENTER, STD_Y + 50); st.tickBack(); // back 118
        if (gather) gather.draw(f, st.b);
      }
      if (f >= 188 && f <= 269) {
        if (f === 188) { audio.seStop(); for (const n of cfg.fse) this.se(n); }
        this.pose(A, cfg.frow[0], true);
        if (cfg.fire === 295) st.fx((k) => st.front(HUGE(), 0, 192, 192 + k.frame * RAY_SPEED, 192, rx, ry)); // effect 295
        else st.fx((k) => { for (const [dx, dy] of cfg.fire) st.front(MID(), 0, 80, 54 + k.frame * RAY_SPEED, 80, rx + dx, ry + dy); });
        this.cmaMate(bot, cfg.frow[1], TEC_CENTER, STD_Y + 50); st.tickBack();
      }
      if (f === 270) { A.y = -120; st.fxReset(); }
      if (f === 280) this.cmaOut();
      if (f >= 281) {
        if (cfg.hit === 48) st.fx((k) => st.front(HUGE(), 0, 0, 400, 192, -400 + k.frame * RAY_SPEED, 76)); // effect 48
        else st.fx((k) => st.front(BIG(), 0, 0, 400, 122, -400 + k.frame * RAY_SPEED, 110)); // effect 240
      }
      yield;
    }
  },

  // ---------- ダブルエクスプロージョン (2927-2935) ----------
  // The lead steps aside (left −8 / right +8) while the other comes in from the left (effect 363 fast / 364); the left
  // one is the main sprite, the right one waits (back 118); the strips turn to the sides (@tec_output_back_no 1), both
  // charge in an aura (back 201 ×2), fire with a white flash every 20 frames, then the strips go and the shock-wave
  // streaks (back 1) flash on the enemy
  * cmaDouble() {
    const [l, r, tame, color, fire, f60] = DOUBLE[this.combo], st = this.st, A = this.A;
    const left = this.who(l), right = this.who(r), leadLeft = this.lead === left;
    const bx = TEC_CENTER - 80 + 40, by = STD_Y - 30, rightX = TEC_CENTER + 80 + 24;
    const flash = (f) => { if (f % 20 === 0) st.white(296); }; // FLASH_Y_SIZE_CUTIN_ON
    for (let f = 0; f <= 331; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        if (leadLeft) { // effect 363
          st.fx((k) => this.cmaMate(right, 0, STD_CHAX + k.frame * 12 - 30 + 12, STD_Y, true, st.e));
          if (f <= 10) A.x -= 8;
        } else { // effect 364
          st.fx((k) => this.cmaMate(left, 0, STD_CHAX + k.frame * 8 - 48, STD_Y, true, st.e));
          if (f <= 13) A.x += 8;
        }
      }
      if (f >= 40 && f <= 59) {
        if (f === 40) { if (!leadLeft) A.x -= 160 + 24; this.L.sheets = this.crew[left]; st.fxReset(); }
        this.cmaMate(right, 0, rightX, STD_Y); st.tickBack();
      }
      if (f === 60) {
        st.no = 1;
        this.se('Z3 変身'); this.se('Z1 気を溜める');
        this.cmaMate(right, 0, TEC_CENTER + f60, STD_Y);
        st.ba.frame = 0;
      }
      if (f >= 61 && f <= 187) {
        this.pose(A, tame[0], true);
        this.cmaAura201(bx - 80, by, color[0]); st.ba.frame--;
        this.cmaAura201(bx + 80 + 24, by, color[1]); st.ba.frame--;
        this.cmaMate(right, tame[1], rightX, STD_Y); st.tickBack();
      }
      if (f >= 188 && f <= 269) {
        if (f === 188) { audio.seStop(); this.se('Z1 エネルギー波'); this.se('Z1 ザー'); this.se('Z1 ゴー'); }
        this.pose(A, fire[0], true);
        this.cmaMate(right, fire[1], rightX, STD_Y);
        flash(f);
      }
      if (f === 270) {
        st.bars = false; // @tec_output_back = false
        st.fxReset();
        this.cmaOut();
        audio.seStop(); this.se('Z1 ザー'); this.se('Z1 ゴー');
      }
      if (f >= 271) { st.shock(); flash(f); } // back 1
      yield;
    }
  },

  // ---------- サイヤンアタック (1832 托馬＆潘布金): both charge, 潘布金 vanishes (back 48), comes out of the left and rams the
  // enemy off the stage; 托馬 fires the big wave (effect 239) and it hits (240) ----------
  * cmaSaiyanTP() {
    const [t, b, rx0] = SAIYAN[this.combo], st = this.st, A = this.A, G = this.G, z3 = st.era >= 2;
    const top = this.who(t), bot = this.who(b), leadTop = this.lead === top;
    const [ax, ay] = z3 ? [234, -18 + 54 + 50] : [218, 60];
    const aura = (dy) => { if (z3) this.cmaAura201(ax, ay + dy, 3); else this.cmaAura105(ax, ay + dy, 3); };
    let mateRow = 0, x = 0; // @scombo_cha2_anime_type, @chax
    for (let f = 0; f <= 388; f++) {
      const [rx, ry] = f <= 300 ? [rx0, 70] : [348, 96];
      this.cmaOpen(f, top, bot, leadTop, 150); // 0-60 (effect 92 stays on until 150: the one below in its row 0)
      if (f >= 61 && f <= 150) {
        this.pose(A, 2, true);
        aura(-50); st.ba.frame--; aura(50);
      }
      if (f >= 151 && f <= 199) {
        if (f === 151) { st.fxReset(); audio.seStop(); this.se('Z1 高速移動'); }
        aura(-50); st.ba.frame--;
        this.cmaAfter(TEC_CENTER, STD_Y + 76);
      }
      if (f === 200) { st.fxReset(); G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); A.y = -200; x = CENTER_CHAX - 160; A.x = x; }
      if (f >= 210 && f <= 230) {
        if (f === 210) this.se('Z1 高速移動');
        this.cmaAfter(TEC_CENTER - 144, STD_Y + 30);
        if (f === 230) { this.cmaMate(bot, mateRow, x, STD_Y, false); st.tickBack(); } // back 117
      }
      if (f >= 231 && f <= 238) {
        this.pose(A, 16, true); mateRow = 16;
        x += 24; A.x = x;
        this.cmaMate(bot, mateRow, x, STD_Y, false); st.tickBack();
      }
      if (f === 239) { mateRow = 5; this.cmaMate(bot, mateRow, x, STD_Y); st.tickBack(); this.se('ZG 打撃4'); }
      if (f >= 240 && f <= 269) { this.cmaMate(bot, mateRow, x, STD_Y); st.tickBack(); G.x += 24; this.pose(G, 16, false); }
      if (f === 270) { A.x = TEC_CENTER; A.y = STD_Y; }
      if (f === 301) { this.pose(A, 4, true); this.se('Z1 エネルギー波2'); st.fxReset(); }
      if (f >= 301 && f <= 359) st.fx((k) => st.front(BIG(), 0, 122, 144 + k.frame * RAY_SPEED, 122, rx, ry)); // effect 239
      if (f === 360) { st.fxReset(); this.pose(G, 16, false); this.cmaOut(); }
      if (f >= 361) st.fx((k) => st.front(BIG(), 0, 0, 400, 122, -400 + k.frame * RAY_SPEED, ry)); // effect 240
      yield;
    }
  },

  // ---------- サイヤンアタック (1834 賽莉帕＆托特波): both charge, fly off to the right, come back in from the left and ram
  // the enemy away, then both fire small waves (effect 309) and they hit (299) ----------
  * cmaSaiyanST() {
    const [t, b] = SAIYAN[this.combo], st = this.st, A = this.A, G = this.G, z3 = st.era >= 2;
    const top = this.who(t), bot = this.who(b), leadTop = this.lead === top;
    const [ax, ay] = z3 ? [234, -18 + 54 + 50] : [218, 60];
    const aura = (dx, dy) => { if (z3) this.cmaAura201(ax + dx, ay + dy, 3); else this.cmaAura105(ax + dx, ay + dy, 3); };
    for (let f = 0; f <= 388; f++) {
      this.cmaOpen(f, top, bot, leadTop, 60); // 0-60
      if (f === 61) st.fxReset();
      if (f >= 61 && f <= 150) {
        aura(0, -50); st.ba.frame--;
        this.cmaMate(bot, 2, A.x, A.y + 100); st.tickBack(); st.ba.frame--;
        aura(10, 50);
      }
      if (f >= 151 && f <= 199) {
        if (f === 151) { audio.seStop(); this.se('Z1 飛ぶ'); }
        this.pose(A, 6, true);
        A.x += 20;
        this.cmaMate(bot, 4, A.x, A.y + 100); st.tickBack(); st.ba.frame--;
      }
      if (f === 200) { G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); A.y += 14; A.x = -300; this.se('Z1 飛ぶ'); }
      if (f >= 210 && f <= 269) {
        if (f <= 238) A.x += 20;
        this.cmaMate(bot, 4, A.x - 40, A.y + 72); st.tickBack();
        if (f === 239) this.se('ZG 打撃4');
        if (f >= 240) { G.x += 24; this.pose(G, 16, false); }
      }
      if (f >= 270 && f <= 359) {
        const row = f <= 300 ? 0 : 1;
        this.pose(A, row, true);
        this.cmaMate(bot, row, A.x, A.y + 80); st.tickBack();
        if (f === 301) { this.se('Z1 怪光線'); st.fxReset(); }
        if (f >= 301) { // effect 309 (from @chax / @chay)
          const x = A.x, y = A.y;
          st.fx((k) => { const w = 54 + k.frame * RAY_SPEED; st.front(SMALL(), 0, 48, w, 48, x + 74, y + 18); st.front(SMALL(), 0, 48, w, 48, x + 92, y + 86); });
        }
      }
      if (f === 360) { st.fxReset(); this.pose(G, 16, false); this.cmaOut(); }
      if (f >= 361) st.fx((k) => { for (const y of [148 - 24, 148 + 24]) st.front(SMALL(), 0, 0, 400, 48, -400 + k.frame * RAY_SPEED, y); }); // effect 299
      yield;
    }
  },
  // 0-60 of the two サイヤンアタック: the lead rises (or sinks), the other flies in (effect 90 / 89), then waits below (92)
  cmaOpen(f, top, bot, leadTop, last) {
    const st = this.st, A = this.A;
    if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
    if (f >= 1 && f <= 39) {
      st.fx((k) => this.cmaMate(leadTop ? bot : top, 0, STD_CHAX + k.frame * 8 + 30, STD_Y + (leadTop ? 50 : -50), true, st.e));
      if (f <= 10) A.y += leadTop ? -5 : 5;
    }
    if (f === 40) { if (!leadTop) A.y -= 100; this.L.sheets = this.crew[top]; }
    if (f >= 40 && f <= last) st.fx(() => this.cmaMate(bot, 0, TEC_CENTER, STD_Y + 50, true, st.e));
    if (f === 60) this.se(st.era >= 2 ? 'Z3 変身' : 'Z2 気を溜める');
  },

  // ---------- 強襲サイヤ人 (1842): the four Great Apes come in from the right one above the other, stand, open their mouths
  // and fire four small waves (the effect counter counted by the film itself), then the big wave on the enemy (240) ----------
  * cmaApes() {
    const st = this.st, A = this.A;
    const SRC = [24, 22, 24, 24], H = [56, 56, 56, 54], Y = [64, 122, 180, 238];
    const apes = (x, k) => {
      APES.forEach((a, i) => st.back(a(), 0, k * 192 + SRC[i], 192, H[i], x, Y[i]));
      st.b.push((c) => { c.fillStyle = 'rgb(188,188,188)'; for (const y of [120, 178, 236]) c.fillRect(0, y, 672, 2); });
    };
    let ef = 0;
    for (let f = 0; f <= 226; f++) {
      if (f === 0) { this.se('Z1 大猿'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 40) { A.y = -200; apes(640 - (f - 1) * 12, 0); }
      if (f >= 41 && f <= 100) apes(172, 0);
      if (f >= 101 && f <= 199) {
        if (f === 101) { this.se('Z1 エネルギー波2'); this.se('Z1 ゴー'); this.se('DB3 大猿'); }
        apes(172, 1);
        const w = 54 + ef * RAY_SPEED;
        st.back(SMALL(), 0, 48, w, 40, 310, 80); st.back(SMALL(), 0, 48, w, 48, 306, 130);
        st.back(SMALL(), 0, 48, w, 38, 310, 198); st.back(SMALL(), 0, 48, w, 48, 306, 242);
        ef++;
      }
      if (f === 200) { this.cmaOut(); st.fxReset(); }
      if (f >= 201) st.fx((k) => st.front(BIG(), 0, 0, 400, 122, -400 + k.frame * RAY_SPEED, 120)); // effect 240
      yield;
    }
  },

  // ---------- the damage (anime_pattern 41 / 42 / 43 / 44) ----------
  * cmaHit41() { yield* this.zfHit(41); },
  * cmaHit42() { yield* this.zfHit(42); },
  * cmaHit43() { yield* this.zfHit(43); },
  * cmaHit44() { // 44 爆発系Z2特大: DB3 大爆発 and effect 105, the enemy blown away (frames 21-39)
    if (!this.hit) return yield* this.zfDodge();
    const st = this.st;
    this.se('DB3 大爆発');
    this.showHit();
    this.pose(this.G, 17, false);
    let type = 0, frame = 0;
    for (let f = 0; f <= 60; f++) {
      if (f >= 21 && f <= 39) this.G.x -= 20;
      if (f < 40) {
        st.front(BOOM6, type * 256, 0, 256, 256, 298 - 64, 110 - 64);
        if (frame >= 10) { type++; frame = 0; }
        frame++;
      }
      yield;
    }
  },
  * cmaHitApes() { yield* (era() >= 2 ? this.cmaHit44() : this.cmaHit43()); }, // 752: Z2 damage 43, Z3 44
});

export const CMA_SOUNDS = ['Z1 逃げる', 'Z3 変身', 'Z2 気を溜める', 'Z1 気を溜める', 'Z1 気を溜める2', 'Z1 エネルギー波', 'Z1 エネルギー波2',
  'ZG 光線1', 'Z1 大猿', 'Z1 高速移動', 'ZG 打撃4', 'Z1 飛ぶ', 'Z1 怪光線', 'DB3 大猿', 'Z1 ゴー', 'Z1 ザー', 'DB3 大爆発',
  'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'Z1 爆発1', 'Z3 避ける'];

// ---------- ?dev=cma…: the parties for these combos (like ?dev=cmbx…, src/combo_dev.js) ----------
// Every combo switch on, Lv 60, every combo move used 999 times and known, a fight with 甜菜人 ×3 (high HP).
// In the console __cma(id) deals the cards and picks the moves of the first open row of combo `id`, then runs the turn.
//   cmaz2   巴達克・托馬・賽莉帕・托特波・潘布金・比克 (variable 40 = 1): 725 (Z2) 732 734 765-768 742
//   cmaz3   the same in Z3 (2): 733 735-737 765-768 843-852 732 734 742          cmaz3ss  巴達克 as 超巴達克: 725 733-737 843-846
//   cmaand  比克・18 號・17 號・16 號・未來悟飯・貝吉塔 (2): 743 755 774-779 853-858   cmaandss 超未來悟飯・超貝吉塔
//   cmade   貝吉塔・特蘭克斯・未來悟飯・比克・巴達克 (2): 827-835                       cmadess  all four Super Saiyans
//   cmafg   超未來悟飯・托馬・賽莉帕・托特波・潘布金・貝吉塔 (2): 871-874 859
const DEV = {
  cmaz2: [1, [16, 27, 28, 29, 30, 4]], cmaz3: [2, [16, 27, 28, 29, 30, 4]], cmaz3ss: [2, [16, 27, 28, 29, 30, 4], [7]],
  cmaand: [2, [4, 21, 22, 23, 25, 12]], cmaandss: [2, [4, 21, 22, 23, 25, 12], [3, 6]],
  cmade: [2, [12, 17, 25, 4, 16]], cmadess: [2, [12, 17, 25, 4, 16], [3, 4, 6, 7]],
  cmafg: [2, [25, 27, 28, 29, 30, 12], [6]],
};
registerZ3('cma', {
  dev(game, step) {
    const cfg = DEV[step];
    if (!cfg) return false;
    const s = game.state = game.newState(), w = game.world;
    s.var[40] = cfg[0];
    s.flags.z3 = 'done';
    comboData.then((d) => {
      for (const c of d.combos) if (c.sw) s.sw[c.sw] = true;
      s.sw[585] = true; // (CE34 closes 514, OS射擊 巴達克＆托馬一夥, without it)
      party(game, cfg[1]);
      for (const no of cfg[2] || []) superSaiyan(w, s, no, true);
      for (const m of s.party) { m.level = 60; m.exp = w.actors[m.id].exp[60]; applyLevel(w, m); heal(m); }
      for (const m of s.party) {
        for (const c of d.combos) c.cha.forEach((a, x) => { if (a === m.id && !m.skills.includes(c.tec[x])) m.skills.push(c.tec[x]); });
        m.skills.sort((x, y) => x - y);
      }
      s.skillLv = {};
      for (const c of d.combos) for (const t of c.tec) s.skillLv[t] = 999;
      s.combos = [];
      s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
      game.startField();
      setTimeout(() => game.startBattle([1, 1, 1], false, { loseOk: true }), 300);
      const tough = () => { const b = game.scene; if (b && b.constructor.name === 'Battle' && b.foes[0]) for (const f of b.foes) f.hp = f.maxhp = 999999; else setTimeout(tough, 100); };
      setTimeout(tough, 400);
      // __cma(id, leadId): the combo with `leadId` (a member's actor id) as the one whose turn starts it
      window.__cma = (id, lead) => fire(game, d, id, lead);
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
  const order = lead ? [lead, ...row.cha.filter((a) => a !== lead)] : row.cha;
  let k = 0;
  for (const a of order) {
    const x = row.cha.indexOf(a), i = b.party.findIndex((m) => m.id === a), m = b.party[i];
    b.hand[k] = { a: Math.min(7, row.atk[x] + 1), g: Math.min(7, row.grd[x] + 1), s: m.school };
    b.plans[i] = { card: k++, skill: w.skills[row.tec[x]], target: 0 };
  }
  b.resolveTurn();
  return row.name;
}

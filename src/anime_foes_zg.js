// The enemies' special moves of the time room's 「強」 rematches and the later ZG fights (docs/anim-e-plan.md aen4),
// ported frame by frame from the classic version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb). An enemy's
// attack pattern is its skill id + 10 (ene_action_set, all.rb 140149), and since $btl_progress follows the enemy's
// number when an enemy attacks (101 and on: 2, all.rb 54627) these all run in the Z3 part of the move switch
// (all.rb 59742): anime_pattern 31 → 32 → the move's own pattern → the damage pattern. They run on the E groups'
// shared stage (src/anime_foes_common.js FeStage: the strips the other way round, the enemy's cut-in until the film
// cuts to the member, then the member's), whose counters are the original's (@back_anime_*, @effect_anime_*,
// @ray_anime_*, @ax … @gy), so each frame below is the original's frame.
//   608 刀攻撃(強) 吉加(強) → 618 → 1708 (all.rb 131603), damage 22   609 尼奇(強) → 619 → 1709 (131738), 22
//   610 連続強力エネルギー波 桑修(強) → 620 → 1710 (131892), 23   461 氷結攻撃(全体) 艾比略(強) → 471 → 561 (77858), 70
//   613 バルカン砲 機器人士兵 → 623 → 2713 (132093), 42
//   金屬古拉・核心 614 エネルギー波 → 624 → 2714 (132169), 42   615 口からエネルギー波 → 625 → 2715 (132201), 43
//     616 エネルギー吸収 → 626 → 2716 (132332), 77   617 スーパービッグノヴァ → 627 → 2717 (132399), 44
//   排骨飯 673 超体当たり → 683 → 2773 (132787), 22   675 サンダーフラッシュ → 685 → 2775 (132834), 44
//   桃白白 623 カタナ攻撃 → 633 → 2723 (132562), 22
//   齊爾德 663 爆発波 → 673 → 2763 (132715), 23
//   布歐 679 かめはめ波 → 689 → 2779 (132897), 23   680 巻きつき攻撃 → 690 → 2780 (132935), 71
//     681 お菓子光線 → 691 → 2781 (133075), 81   682 超爆発波 → 692 → 2782 (133108), 44
//   奧佐特(變身) 688 ラッシュ → 698 → 2788 (133211), 22   690 カオスバースト → 700 → 2790 (133546), 44
// The rest share the enemies' common patterns (src/anime_foes_common.js): 2431 エネルギー波, 2494 連続エネルギー波,
// 2495 デスボール, 2498 爆発波, 2499 強力エネルギー波 — some with their own damage pattern (the move switch's case).
// 689 イグナイトビジョン (奧佐特(變身)) is 2789, オゾット's 692 too: src/aen3_ozotto.js aen3Ignite (aen3).
// The giants (element 23: 金屬古拉・核心, 達列斯(大猿), 史拉格(巨大化), 奧佐特(變身)) have 192×192 frames, drawn at
// (x - 48, y - 48) when they attack (output_battle_anime, all.rb 140062): these films draw them there.
import { audio, img, rand } from './core.js?v=20261104-0520';
import { Duel, moveFilm, STD_Y, CENTER_CHAX, CENTER_ENEX, RAY_SPEED } from './anime.js?v=20261104-0520';
import { feRegister, feFilms, foeId, EFFECTS, BACKS } from './anime_foes_common.js?v=20261104-0520';
import { registerZ3, party, heal } from './z3.js?v=20261104-0520';
import { applyLevel } from './party.js?v=20261104-0520';

const pic = (n) => `Graphics/Pictures/${n}`;
const STD_ENEX = 602;

// ---------- the pictures ----------
const AURA1 = [pic('Z1_戦闘_必殺技_気を溜める.PNG'), pic('Z1_戦闘_必殺技_気を溜める(緑).PNG'), null, pic('Z1_戦闘_必殺技_気を溜める(青).PNG'),
  pic('Z1_戦闘_必殺技_気を溜める.PNG')]; // back 4, by @ray_color: 3 frames of 160×222
const SWORD = [pic('Z3_戦闘_必殺技_剣攻撃(左右反転).PNG'), pic('Z3_戦闘_必殺技_剣攻撃(上下左右反転).PNG')]; // effects 267 / 268 (an enemy's): 7 frames of 160×96
const BALL = [pic('Z3_戦闘_必殺技_エネルギー弾.PNG'), pic('Z3_戦闘_必殺技_エネルギー弾(緑).PNG'), null, pic('Z3_戦闘_必殺技_エネルギー弾(青).PNG')]; // 6 frames of 128×128
const BALL_RED = pic('Z3_戦闘_必殺技_エネルギー弾(赤).PNG'), BALL_PINK = pic('Z3_戦闘_必殺技_エネルギー弾(桃).PNG');
const LIQUID = [pic('Z3_戦闘_必殺技_エネルギー液.PNG'), pic('Z3_戦闘_必殺技_エネルギー液(緑).PNG'), pic('Z3_戦闘_必殺技_エネルギー液(水色).PNG'),
  pic('Z3_戦闘_必殺技_エネルギー液(青).PNG'), pic('Z3_戦闘_必殺技_エネルギー液(桃).PNG')]; // effect 44: 400×32, the lower half an enemy's
const MID = [pic('Z3_戦闘_必殺技_エネルギー波_中.PNG'), null, null, null,
  pic('Z3_戦闘_必殺技_エネルギー波_円_中(桃).PNG')]; // effect 47: 400×60
const ICE = pic('Z3_戦闘_必殺技_氷(FF3).PNG'); // damage 70 (effect 94): 3 frames of 96×96
const BOOM5 = pic('戦闘アニメ_爆発5.PNG'); // damage 81 (effect 104): 4 frames of 158×160
const ARM = [pic('Z3_戦闘_必殺技_ロボット兵腕1.PNG'), pic('Z3_戦闘_必殺技_ロボット兵腕2.PNG'), pic('Z3_戦闘_必殺技_ロボット兵腕3.PNG')]; // back 214 / 215, effects 322 / 323
const SPARK_BOOM = pic('Z3_必殺技_爆発.png'); // 32×32
const SPARK = pic('戦闘アニメ.PNG'); // the hit sparks (effect 123) and the after-image (0,48 64×64)
const SHOCK_BLUE = pic('Z3_戦闘_必殺技_衝撃系_青.PNG'); // effects 229 / 230: 30×116 ×2
const HUGE_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_特大_青_加工.PNG'); // effect 353: 400×192 ×2
const GENKI = pic('Z3_戦闘_必殺技_超元気玉(元気).png'); // 8×10: the specks of ki drawn in
const CABLE = pic('Z3_戦闘_必殺技_メタルクウラ・コア_ケーブル.png'); // 1400×80 rows (effects 327-329, damage 77)
const WRAP = [pic('Z3_戦闘_必殺技_メタルクウラ・コア_ケーブル_巻きつく.png'), pic('Z3_戦闘_必殺技_メタルクウラ・コア_ケーブル_巻きつく(大).png')];
const NOVA = { core: pic('Z3_必殺技_スーパービッグノヴァ(メタルクウラ・コア).png'), charge: pic('Z3_戦闘_必殺技_超元気玉_溜め(逆).png'),
  up: pic('Z3_戦闘_必殺技_デスボール(極大玉縦)(オレンジ).PNG'), ball: pic('Z3_戦闘_必殺技_デスボール(極大玉)(オレンジ).PNG') };
const TACKLE = pic('Z3_必殺技_超体当たり(パイクーハン).png'); // effect 350: 2 frames of 190×126
const BUU = { wrap: pic('Z3_戦闘_必殺技_ブウ_巻きつく.PNG'), wrapBig: pic('Z3_戦闘_必殺技_ブウ_巻きつく(巨大).PNG'), // effects 351 / 354
  beam: pic('Z3_戦闘_必殺技_お菓子光線_前中後繋ぎ.png'), candy: pic('Z3_戦闘_必殺技_お菓子.png'), // 2781 / effect 352, damage 81
  aura: pic('Z3_必殺技_超爆発波_気を溜める.PNG'), charge: pic('Z3_必殺技_超爆発波_1_ブウ溜め.png'), rock: pic('Z3_必殺技_超爆発波_岩.PNG'),
  fire: pic('Z3_必殺技_超爆発波_2_ブウ発動.png'), back: pic('Z3_戦闘_必殺技_背景_ブウ_超爆発波.PNG') }; // 2782, backs 219 / 220
const RED_AURA = [pic('Z3_戦闘_必殺技_気を溜める11(赤).png'), pic('Z3_戦闘_必殺技_気を溜める12(赤).png')]; // backs 218 (156×144 ×2) / 221 (300×300 ×2)
const CHAOS = pic('Z3_必殺技_カオスバースト(オゾット変身).png'), BEAM_BIG_BLUE = pic('ZG_必殺技_光線_大(青).PNG'); // 2790

// ---------- the moves ----------
// film → the move switch before pattern 32 (cut: @chr_cutin_flag, small: @tec_back_small, no: @tec_output_back_no)
// and, for a move on everyone, what a further target (@all_attack_count >= 2) starts with: the case block's settings,
// on top of what the last target's film left (chr_battle_anime_end clears nothing while @all_attack_flag is on)
feFilms({
  aenGingerSword: { cut: true, small: true, no: 1, pics: () => [AURA1[0], ...SWORD] },
  aenNikkiSword: { cut: true, small: true, no: 1, pics: () => [AURA1[0], ...SWORD] },
  aenSanshoMulti: { cut: true, no: 1, pics: () => [AURA1[4], BALL_PINK, MID[4]],
    again: (z) => { z.tec = true; z.tecNo = 0; z.cut = true; z.cutFlag = true; z.mirror = false; } }, // (1710 cuts to the member inline)
  aenEbiIce: { cut: true, pics: () => [AURA1[3], BALL[3], LIQUID[3], ICE],
    again: (z) => { z.tec = true; z.cut = true; z.cutFlag = true; z.mirror = true; } },
  aenRobotVulcan: { cut: true, small: true, pics: () => [...ARM, SPARK_BOOM] },
  aenCoreWave: { cut: true, small: true },
  aenCoreMouth: { cut: true, small: true, pics: () => [GENKI] },
  aenCoreDrain: { pics: () => [CABLE, ...WRAP], again: (z) => { z.tec = false; } },
  aenCoreNova: { no: 3, pics: () => [GENKI, ...Object.values(NOVA)], again: (z) => { z.tec = false; } },
  aenPikkuTackle: { cut: true, small: true, pics: () => [TACKLE, SPARK] },
  aenPikkuThunder: { cut: true, small: true },
  aenTaoSword: { cut: true, small: true, pics: () => [SPARK] },
  aenChilledBlast: { cut: true, small: true, pics: () => [SHOCK_BLUE],
    again: (z) => { z.tec = false; z.cut = true; z.cutFlag = true; z.mirror = true; z.small = true; } },
  aenBuuKame: { cut: true, small: true },
  aenBuuWrap: { cut: true, small: true, pics: () => [BUU.wrap, BUU.wrapBig] },
  aenBuuCandy: { cut: true, small: true, pics: () => [BUU.beam, BUU.candy, ...RED_AURA, BOOM5] },
  aenBuuBlast: { cut: true, small: true, pics: () => [BUU.aura, BUU.charge, BUU.rock, BUU.fire, BUU.back],
    again: (z) => { z.tec = false; z.cut = true; z.cutFlag = true; z.mirror = true; z.small = true; } },
  aenOzottoRush: { cut: true, small: true, pics: () => [RED_AURA[1]] },
  aenOzottoChaos: { cut: true, small: true, pics: () => [RED_AURA[1], CHAOS, BEAM_BIG_BLUE, GENKI, HUGE_BLUE] },
  // the common patterns with the damage of this move's case (652 / 677: 42; 678: 42; 679: 44; 632: 42) or a cut-in (631)
  aenWave42: {}, aenWaveCut: { cut: true }, aenBigWave42: { cut: true, small: true }, aenBigWave44: { cut: true, small: true },
  aenBlast42: { cut: true, small: true, again: (z) => { z.tec = false; z.cut = true; z.cutFlag = true; z.mirror = true; z.small = true; } },
});
const SKILLS = {
  608: 'aenGingerSword', 609: 'aenNikkiSword', 610: 'aenSanshoMulti', 461: 'aenEbiIce', // 吉加・尼奇・桑修・艾比略(強)
  612: 'feBigWave', 613: 'aenRobotVulcan', // 機器人士兵
  614: 'aenCoreWave', 615: 'aenCoreMouth', 616: 'aenCoreDrain', 617: 'aenCoreNova', // 金屬古拉・核心
  671: 'feWave', 676: 'feBigWave', 672: 'feWaves', 673: 'aenPikkuTackle', 675: 'aenPikkuThunder', // 排骨飯
  621: 'aenWaveCut', 623: 'aenTaoSword', 622: 'aenBigWave42', // 桃白白
  642: 'aenWave42', // 達列斯(大猿)
  667: 'aenWave42', 668: 'aenBlast42', 669: 'aenBigWave44', // 史拉格(巨大化)
  662: 'feWave', 664: 'feBigWave', 663: 'aenChilledBlast', 665: 'feDeathBall', // 齊爾德
  685: 'feWave', 686: 'feWaves', 687: 'feBigWave', 688: 'aenOzottoRush', 690: 'aenOzottoChaos', // 奧佐特(變身)
  677: 'feWave', 683: 'feBigWave', 679: 'aenBuuKame', 678: 'feWaves', 680: 'aenBuuWrap', 681: 'aenBuuCandy', 682: 'aenBuuBlast', // 布歐
};
feRegister(SKILLS);
// the giants (element 23): the data leaves 214 / 253 at 96, their sheets have 192×192 frames
const GIANT = { 214: true, 222: true, 223: true, 253: true };
const MISSING_SIZE = [214, 253];

const swoop0 = Duel.prototype.swoopIn, render0 = Duel.prototype.render;
Object.assign(Duel.prototype, {
  * swoopIn() { // (31) a giant of these moves: its 192×192 frames, drawn where the original draws them
    const id = !this.p && SKILLS[this.skill] && moveFilm(this.skill) === SKILLS[this.skill] ? foeId(this) : 0;
    if (GIANT[id]) {
      const g = globalThis.__game;
      if (MISSING_SIZE.includes(id)) { this.R.sheets.size = 192; if (g && g.world && g.world.enemies[id]) g.world.enemies[id].size = 192; }
      this.aenGiantDy = 48; // (src/anime.js stands a giant on the ground: y - 96)
    }
    return yield* swoop0.call(this);
  },
  render() {
    const dy = this.aenGiantDy || 0;
    if (dy) this.A.y += dy;
    const cv = render0.call(this);
    if (dy) this.A.y -= dy;
    return cv;
  },

  // ---------- the original's machinery, for an enemy attacking ----------
  // battle_anime_change: 0 the attacker (the enemy; its sheet by @output_anime_type when shown), 1 the defender
  aenPose(who, n) { this.pose(who ? this.G : this.A, n, false); },
  // a film: frames 0 … end of the original's anime_pattern; body(f, ray) does the frame (ray: its ray_x / ray_y) and
  // may return the next frame (a jump of @battle_anime_frame); at `end` anime_pattern_fromat shows the last one
  * aenRun(end, ray, body) {
    const z = this.feStage();
    z.ax = z.ay = z.gx = z.gy = 0; z.otype = 0;
    for (let f = 0; f < end; f++) {
      z.f = f;
      const r = { x: ray[0], y: ray[1] }, j = body(f, r);
      this.A.sp = z.otype === 1;
      yield* z.out(r.x, r.y);
      if (j != null) f = j - 1;
    }
    z.f = end;
    body(end, { x: ray[0], y: ray[1] });
    this.A.sp = z.otype === 1;
    z.ax = -z.ax; this.A.x += z.ax; this.A.y += z.ay; this.G.x += z.gx; this.G.y += z.gy;
    audio.seStop();
    yield;
    z.format(); z.otype = 0;
  },
  aenEffOff() { const z = this.feStage(); z.efp = 0; z.eff = 0; z.eft = 0; },
  // back_anime_pattern 4 気を溜める(小): three frames of 160×222, by @ray_color
  aenBack4(x = 0, y = 0) {
    const z = this.feStage();
    if (!x) { x = 234; y = 70; }
    z.back(AURA1[z.color] || AURA1[0], 0, z.bt * 222, 160, 222, x, y);
    z.bstep(4, 2); z.bf++;
  },
  // back 214 ロボット兵手先発動 (the arm growing 12 a call) / 215 (the whole arm sliding left 12 a call)
  aenArm(n, x, y) {
    const z = this.feStage(), k = z.bf;
    if (n === 214) z.back(ARM[0], 0, 0, k * 12, 24, x, y); else z.back(ARM[0], 0, 0, 1280, 24, x - k * 12, y);
    z.bf++;
  },
  // @genkitama_kanri_*: specks of ki drawn in towards (cx, cy) from eight sides, each starting at random while more
  // than `max` frames are left before `end`; `dirs` their steps, faster after `up` frames
  aenSpecks(P, f, end, odds, dirs) {
    const z = this.feStage();
    for (let i = 0; i < P.n.length; i++) {
      if (P.n[i] >= P.max) P.n[i] = 0;
      else if (P.n[i] > 0) {
        const [dx, dy] = dirs[i], k = P.n[i], up = P.up;
        const gx = dx * up + dx * 2 * (P.max - up - 1), gy = dy * up + dy * 2 * (P.max - up - 1);
        if (k <= up) z.back(GENKI, 0, 0, 8, 10, P.cx - gx + k * dx, P.cy + gy - k * dy);
        else z.back(GENKI, 0, 0, 8, 10, P.cx - gx + up * dx + (k - up) * dx * 2, P.cy + gy - up * dy - (k - up) * dy * 2);
        P.n[i]++;
      } else if (end - f > P.max && rand(odds) === 0) P.n[i] = 1;
    }
  },

  // ---------- the damage films (anime_pattern 22-81): the shared stage's, and these moves' own ----------
  * aenHit(kind) {
    const z = this.feStage(), G = this.G;
    if (![70, 77, 81].includes(kind)) return yield* z.damage(kind);
    z.format();
    if (!this.hit) return 'miss';
    if (kind === 70) { // 氷結: the ice closes round the member (effect 94)
      z.se('DB3 キラーン');
      this.showHit();
      z.gpose(16);
      for (let f = 0; f <= 100; f++) { const k = f < 8 ? 0 : f < 16 ? 1 : 2; z.front(ICE, k * 96, 0, 96, 96, 230, 120); yield; }
      return 'none';
    }
    if (kind === 77) { // ヒットキャラ揺れる(巻きつく): the cable round the member (effect 107), it shakes
      this.showHit();
      z.gpose(17);
      z.se('DB3 SE091');
      const big = (G.sheets.size || 96) > 96;
      for (let f = 0; f <= 101; f++) {
        if (f >= 1 && f <= 100) G.x += f % 2 ? -6 : 6;
        if (f === 101) audio.seStop();
        if (big) { z.front(CABLE, 146, 38, 640, 26, 244 + 48, 154 + 6); z.front(WRAP[1], 0, 0, 128, 80, 244 - 72, 154 - 12); }
        else { z.front(CABLE, 146, 38, 640, 26, 244 + 56, 154 + 6); z.front(WRAP[0], 0, 0, 64, 40, 244, 154); }
        yield;
      }
      return 'none';
    }
    // 81 お菓子光線ヒット: the red aura round the member (back 218 / 221), the blast (effect 104), then it is a sweet
    z.gpose(16);
    z.se('Z1 気を溜める5');
    const big = (G.sheets.size || 96) > 96;
    let type = 0, frame = 0;
    for (let f = 0; f <= 191; f++) {
      if (f >= 1 && f <= 89) {
        if (!big) { z.back(RED_AURA[0], z.bt * 156, 0, 156, 144, 200, 100); z.bstep(8, 1); } else { z.back(RED_AURA[1], z.bt * 300, 0, 300, 300, 84, 16); z.bstep(8, 1); }
        z.bf++;
      }
      if (f === 90) { audio.seStop(); z.se('Z1 爆発1'); this.showHit(); }
      if (f >= 90 && f < 191) { z.front(BOOM5, type * 158, 0, 158, 160, 188, 104); if (frame >= 10) { type++; frame = 0; } frame++; }
      if (f >= 131 && f <= 190) { G.y -= 400; z.back(BUU.candy, 0, 0, 44, 44, CENTER_CHAX + 16, STD_Y + 16); } // (@gy -400 from 131: the member is gone)
      yield;
    }
    return 'none';
  },

  // ---------- 吉加(強)・尼奇(強) ----------
  // 1708 / 1709 刀攻撃強: the aura (back 4), the sword drawn, the dash; then on the member, the shock-wave streaks
  // (back 1) and twelve cuts back and forth (effects 267 / 268), the aura again, the last cut through him and a flash
  * aenGingerSword() { return yield* this.aenSword(false); },
  * aenNikkiSword() { return yield* this.aenSword(true); },
  * aenSword(nikki) {
    const st = this.feStage(), A = this.A, G = this.G;
    yield* this.aenRun(409, [210, 118], (f) => {
      if (f === 0) { this.se('Z1 気を溜める2'); st.otype = 1; this.aenPose(0, 0); st.color = 0; }
      if (f >= 1 && f <= 60) { this.aenPose(0, 11); this.aenBack4(); }
      if (f === 61) { audio.seStop(); this.se('Z1 刀'); this.aenBack4(); }
      if (f >= 62 && f <= 89) { this.aenPose(0, 3); this.aenBack4(); }
      if (f === 90) this.se('Z1 高速移動');
      if (f >= 91 && f <= 120) this.aenPose(0, f <= 100 ? 4 : f <= 110 ? 5 : 6);
      if (f === 125) this.aenEffOff();
      if (f === 126) { st.tec = false; st.tecNo = 0; A.y = -200; G.x = CENTER_CHAX; G.y = STD_Y; }
      if (f >= 127 && f <= 408) {
        st.backPattern(1);
        const s = f - 127;
        st.otype = 1;
        const cut = (n, eff) => { // one cut: the sword's flash, the member knocked back and forth
          this.aenPose(0, n);
          if ((s - 1) % 10 === 0) { this.se('Z1 刀'); st.efp = eff; st.rt = 0; st.rf = 0; }
          if ((s - 1) % 10 === 0 || (s - 2) % 10 === 0) G.x -= 12;
          if ((s - 3) % 10 === 0 || (s - 4) % 10 === 0) G.x += 12;
        };
        const odd = Math.floor((s - 51) / 10) % 2 === 0; // 51-60, 71-80, … / 61-70, 81-90, …
        if (s <= 10) { A.x = CENTER_ENEX; A.y = STD_Y; this.aenPose(0, 4); }
        else if (s <= 50) this.aenPose(0, 4 + Math.ceil((s - 10) / 10));
        else if (s <= 170 && odd) {
          const first = s <= 60;
          cut(nikki && !first ? 8 : 9, nikki ? 268 : 267); // (尼奇: 268 on these, 267 on the others)
          if ((s - 1) % 10 === 0 || (s - 2) % 10 === 0) this.aenPose(1, 16);
        } else if (s <= 170) {
          cut(10, nikki ? 267 : 268);
          if ((s - 5) % 10 === 0) this.aenPose(1, 0);
        } else if (s <= 250) {
          this.aenBack4(A.x - 20, A.y - 62);
          if (s === 171) { this.aenPose(0, 7); this.se('Z1 気を溜める2'); }
        } else if (s <= 260) {
          if (s === 251) this.se('DB3 刀');
          A.x -= 20;
          st.fill('#fff', 296);
          this.aenPose(0, 10);
        }
      }
      if (f === 409) A.y = -200;
    });
    return yield* this.aenHit(22);
  },

  // ---------- 桑修(強) ----------
  // 1710 連続強力エネルギー波: the aura (back 4), four pink balls from one hand and the other (effect 18), the cut to
  // the member, the ringed beam (effect 47); a further target only gets the beam
  * aenSanshoMulti() {
    const st = this.feStage(), A = this.A, G = this.G;
    st.color = 4;
    if (!st.again) {
      yield* this.aenRun(346, [0, 0], (f, r) => {
        const shot = (pose, right) => { audio.seStop(); this.se('Z1 エネルギー波2'); this.aenPose(0, pose); st.eff = 0; st.eft = 0; st.efp = 18; if (right) { r.x = 268; r.y = 104; } };
        if (f === 0) { this.se('Z1 気を溜める2'); st.otype = 1; this.aenPose(0, 2); st.color = 4; }
        if (f >= 1 && f <= 316) this.aenBack4();
        if (f === 61) { this.se('Z1 エネルギー波2'); this.aenPose(0, 1); st.efp = 18; }
        if (f === 125) shot(6, true);
        if (f >= 126 && f <= 188) { r.x = 268; r.y = 104; }
        if (f === 189) shot(1, false);
        if (f === 253) shot(6, true);
        if (f >= 254 && f <= 316) { r.x = 268; r.y = 104; }
        if (f === 317) this.aenEffOff();
        if (f === 318) { st.tecNo = 0; A.y = -200; G.x = CENTER_CHAX; G.y = STD_Y; }
        if (f >= 319 && f <= 345) st.efp = 47;
      });
    } else {
      yield* this.aenRun(27, [0, 0], (f) => {
        if (f === 0) { st.tecNo = 0; A.y = -200; G.x = CENTER_CHAX; G.y = STD_Y; }
        if (f >= 1 && f <= 26) st.efp = 47;
      });
    }
    return yield* this.aenHit(23);
  },

  // ---------- 艾比略(強) ----------
  // 561 エビ氷結攻撃(全体): the blue aura (back 4), two blue balls (effect 16), the cut to the member, the freezing
  // liquid (effect 44); a further target only gets the ball's sound and the liquid
  * aenEbiIce() {
    const st = this.feStage();
    st.color = 3;
    if (!st.again) {
      yield* this.aenRun(337, [246, 120], (f, r) => {
        if (f === 0) { this.se('Z1 怪しい気'); st.otype = 1; st.color = 3; }
        const aura = (n) => { this.aenBack4(234, 70); this.aenPose(0, n); };
        if (f >= 1 && f <= 109) aura(f <= 44 ? 1 : f <= 89 ? 2 : 3);
        if (f === 110) { audio.seStop(); this.se('Z1 エネルギー波'); st.efp = 16; }
        if (f >= 151 && f <= 259) aura(f <= 194 ? 4 : f <= 239 ? 5 : 6);
        if (f === 260) { st.eff = 0; st.eft = 0; st.efp = 16; audio.seStop(); this.se('Z1 エネルギー波'); }
        if (f >= 261 && f <= 298) { r.x = 252; r.y = 120; }
        if (f === 299) this.aenEffOff();
        if (f === 309) st.displayOut();
        if (f >= 310 && f <= 336) st.efp = 44;
      });
    } else {
      yield* this.aenRun(28, [246, 120], (f) => {
        if (f === 0) { st.displayOut(); this.se('Z1 エネルギー波'); st.efp = 16; }
        if (f >= 1 && f <= 27) st.efp = 44;
      });
    }
    return yield* this.aenHit(70);
  },

  // ---------- 機器人士兵 ----------
  // 2713 バルカン砲: the arm shoots out as he backs away and draws back; on the member it comes in from the right and
  // grabs him, the gun barrel slides along it, the shots (random little blasts on him)
  * aenRobotVulcan() {
    const st = this.feStage(), A = this.A;
    yield* this.aenRun(501, [210, 118], (f, r) => {
      if (f === 0) { this.se('Z1 刀'); st.otype = 1; this.aenPose(0, 1); }
      if (f === 61) { this.se('DB3 エネルギー波1'); this.aenPose(0, 2); }
      if (f >= 61 && f <= 110) { this.aenArm(214, 282, 134); A.x += 12; }
      if (f >= 111 && f <= 179) { if (f === 111) st.bf = 0; this.aenArm(215, 282, 134); }
      if (f === 180) { this.aenEffOff(); st.bf = 0; }
      if (f === 181) st.displayOut();
      if (f >= 182 && f <= 500) {
        if (f === 182) this.se('DB3 エネルギー波1');
        this.aenArm(215, 720, 134);
        if (st.bf >= 36) st.bf = 36;
        if (f === 217 && !this.hit) return 501; // (missed: straight to the end)
        if (f === 217) { this.se('Z1 強打'); this.aenPose(1, 16); st.gx = 2; }
        if (f === 220) st.gx = -2;
        if (f === 223) st.gx = 0;
        if (f === 285) { this.se('DB3 エネルギー波2'); st.efp = 322; }
        r.x = 800 - (Math.min(f, 349) - 285) * 8; r.y = 134;
        if (f === 349) { st.efp = 323; this.se('DB3 刀'); }
        if (f === 379) { this.se('DB3 SE059'); this.se('Z3 ダイナマイト爆発(最後なし)'); }
      }
      if (f === 501) A.y = -200;
      return null;
    });
    return yield* this.aenHit(42);
  },

  // ---------- 金屬古拉・核心 ----------
  * aenCoreWave() { // 2714 エネルギー波: a blue beam from him (effect 227), then onto the member (234)
    const st = this.feStage();
    yield* this.aenRun(174, [260, 116], (f, r) => {
      if (f === 0) { st.otype = 1; this.aenPose(0, 1); this.se('Z1 高速移動'); }
      if (f === 60) { this.se('Z1 怪光線'); st.otype = 1; this.aenPose(0, 2); st.color = 3; }
      if (f >= 61 && f <= 100) st.efp = 227;
      if (f === 141) this.aenEffOff();
      if (f === 145) st.displayOut();
      if (f >= 146 && f <= 173) { st.efp = 234; r.y = 136; }
    });
    return yield* this.aenHit(42);
  },
  * aenCoreMouth() { // 2715 口からエネルギー波: specks of ki drawn into his mouth, the beam (233), on the member (240)
    const st = this.feStage(), P = { n: [0, 0, 0, 0, 0, 0, 0, 0], max: 15, up: 10, cx: 286, cy: 102 };
    const dirs = [[0, -2], [2, -2], [2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2]];
    yield* this.aenRun(276, [180, 90], (f) => {
      if (f === 0) { st.otype = 1; this.aenPose(0, 1); this.se('Z1 高速移動'); }
      if (f === 60) { st.otype = 1; this.aenPose(0, 1); this.se('Z1 気を溜める5'); st.color = 3; }
      if (f >= 61 && f <= 188 && f < 185) this.aenSpecks(P, f, 185, 7, dirs);
      if (f === 189) audio.seStop();
      if (f === 190) st.ax = 0;
      if (f === 200) { audio.seStop(); this.se('Z1 エネルギー波2'); this.aenPose(0, 3); st.efp = 233; }
      if (f === 239) this.aenEffOff();
      if (f === 249) st.displayOut();
      if (f >= 250 && f <= 275) st.efp = 240;
    });
    return yield* this.aenHit(43);
  },
  * aenCoreDrain() { // 2716 エネルギー吸収: the cable from him (327), out across the stage (328), round the member (329)
    const st = this.feStage(), A = this.A;
    const sounds = () => { this.se('DB3 SE096'); this.se('DB3 エネルギー波1'); this.se('Z1 ザー'); };
    if (!st.again) {
      yield* this.aenRun(233, [178, 84], (f, r) => {
        if (f === 0) { sounds(); st.otype = 1; this.aenPose(0, 2); }
        if (f >= 1 && f <= 60) { st.efp = 327; A.x += 8; }
        if (f >= 61 && f <= 159) { if (f === 61) st.eff = 1; st.efp = 328; }
        if (f === 160) { this.aenEffOff(); st.bf = 0; }
        if (f === 161) { audio.seStop(); sounds(); this.aenEffOff(); st.displayOut(); }
        if (f >= 162 && f <= 232) { r.x = 780; r.y = 116; st.efp = 329; }
      });
    } else {
      yield* this.aenRun(72, [0, 0], (f, r) => {
        if (f === 0) { audio.seStop(); sounds(); this.aenEffOff(); st.displayOut(); st.tec = true; }
        if (f >= 1 && f <= 71) { r.x = 780; r.y = 116; st.efp = 329; }
      });
    }
    return yield* this.aenHit(77);
  },
  // 2717 スーパービッグノヴァ: he is above the stage, his picture with the specks of ki and the ball gathering
  // (324); he comes down, the huge ball goes down (325), then onto the member (326)
  * aenCoreNova() {
    const st = this.feStage(), A = this.A, P = { n: [0, 0, 0, 0, 0, 0, 0, 0], max: 40, up: 25, cx: 180, cy: 70 };
    const dirs = [[4, 2], [2, 4], [4, 4], [-2, 4], [-4, 4], [-4, 2], [4, 0], [4, -2]];
    const out = () => { this.se('Z1 衝撃波'); this.se('Z1 ゴー'); this.aenEffOff(); st.displayOut(); st.tecNo = 0; st.small = true; };
    if (!st.again) {
      yield* this.aenRun(335, [0, 0], (f, r) => {
        if (f === 0) { this.se('Z1 気を溜める5(長い)'); st.color = 0; A.y = -160; st.cutFlag = false; }
        if (f >= 1 && f <= 220) {
          st.back(NOVA.core, 0, 0, 242, 222, 200, 100);
          this.aenSpecks(P, f, 300, 4, dirs);
          if (f === 60) st.efp = 324;
        }
        if (f >= 221 && f <= 286) {
          if (f === 221) {
            st.eff = 0;
            audio.seStop(); this.se('Z1 ゴー'); this.se('Z1 エネルギー波2'); this.se('Z1 衝撃波');
            st.tecNo = 0; A.y = STD_Y; st.otype = 1; this.aenPose(0, 4); st.efp = 325;
          }
          r.x = 62; r.y = -276;
          if (f === 286) st.efp = 0;
        }
        if (f === 287) out();
        if (f >= 288 && f <= 334) { r.x = 640; r.y = -200; st.efp = 326; }
      });
    } else {
      yield* this.aenRun(47, [0, 0], (f, r) => {
        if (f === 0) { out(); st.tec = true; }
        if (f >= 1 && f <= 46) { r.x = 640; r.y = -200; st.efp = 326; }
      });
    }
    return yield* this.aenHit(44);
  },

  // ---------- 排骨飯 ----------
  * aenPikkuTackle() { // 2773 超体当たり: the blue aura, he vanishes at speed, then rams the member (effect 350)
    const z = this.feStage(), A = this.A, G = this.G;
    yield* this.aenRun(160, [0, 0], (f) => {
      z.color = 3;
      if (f === 0) { z.se('Z3 変身'); z.otype = 1; this.aenPose(0, 2); }
      if (f >= 1 && f <= 89) z.backPattern(201, 242, 86);
      if (f === 90) { audio.seStop(); z.se('Z1 高速移動'); A.y = -200; G.x = CENTER_CHAX + 20; }
      if (f >= 91 && f <= 130) { z.backPattern(201, 242, 86); if (f % 4 === 0) z.back(SPARK, 0, 48, 64, 64, G.x + 20, 144); }
      if (f === 131) { z.displayOut(); z.se('Z1 逃げる'); z.se('DB3 エネルギー波2'); G.x = CENTER_CHAX; G.y = STD_Y; }
      if (f >= 132 && f <= 159) z.efp = 350;
    });
    return yield* this.aenHit(22);
  },
  * aenPikkuThunder() { // 2775 サンダーフラッシュ: the blue aura, four poses, the half-circle beam (256), on the member (265)
    const z = this.feStage();
    yield* this.aenRun(290, [0, 0], (f, r) => {
      if (f === 0) { z.color = 3; z.se('Z3 変身'); z.otype = 1; this.aenPose(0, 2); }
      if (f >= 1 && f <= 89) z.backPattern(201, 242, 86);
      if (f >= 90 && f <= 190) {
        const p = { 0: 3, 16: 4, 32: 5, 48: 6, 64: 7 }[f - 90];
        if (p) { if (p === 3) audio.seStop(); this.aenPose(0, p); z.se(p === 7 ? 'DB3 刀' : 'DB3 SE041'); }
      }
      if (f >= 191 && f <= 260) {
        if (f === 191) { z.se('DB3 SE103'); z.se('DB3 エネルギー波2'); }
        z.color = 0; r.x = 288; r.y = 102; z.efp = 256;
      }
      if (f === 261) { z.efp = 0; z.eff = 0; z.displayOut(); }
      if (f >= 262 && f <= 289) { r.x = 288; r.y = 102; z.efp = 265; }
    });
    return yield* this.aenHit(44);
  },

  // ---------- 桃白白 ----------
  // 2723 カタナ攻撃: the blue aura, he flies off, comes back in from the right, six blows (effect 123 sparks), steps
  // back, draws, and cuts through the member in a flash
  * aenTaoSword() {
    const z = this.feStage(), A = this.A;
    yield* this.aenRun(340, [0, 0], (f, r) => {
      if (f === 0) { z.se('Z3 変身'); z.otype = 0; z.color = 3; this.aenPose(0, 0); }
      if (f >= 1 && f <= 128) z.backPattern(201, 248, 88);
      if (f === 129) audio.seStop();
      if (f === 139) this.aenPose(0, 16);
      if (f >= 140 && f <= 169) { if (f === 140) z.se('Z1 飛ぶ'); z.ax = 24; if (f === 169) z.cutFlag = false; }
      if (f === 170) { z.ax = 0; z.displayOut(); A.x = STD_ENEX; A.y = STD_Y; }
      if (f >= 171 && f <= 180) { z.ax = 24; z.otype = 0; this.aenPose(0, 16); }
      if (f >= 181 && f <= 185) { z.ax = 16; z.otype = 0; this.aenPose(0, 1); }
      if (f >= 186 && f <= 310) {
        z.ax = 0;
        const s = f - 186; // (akifra 3)
        z.eff = 0;
        if (s <= 33) z.efp = 123;
        r.x = 266; r.y = 148;
        const blow = (p, low) => { this.aenPose(0, p); if (low) r.y += 32; };
        if (s === 0) { this.aenPose(1, 16); z.se('Z1 打撃'); }
        else if ([3, 9, 15, 21, 27].includes(s)) this.aenPose(0, 0);
        else if (s >= 6 && s <= 8) { blow(2, true); if (s === 6) z.se('Z1 打撃'); }
        else if (s === 12) { blow(3); z.se('Z1 打撃'); }
        else if (s >= 18 && s <= 20) { blow(4, true); if (s === 18) z.se('Z1 打撃'); }
        else if (s === 24) { blow(1); z.se('Z1 打撃'); }
        else if (s >= 30 && s <= 32) { blow(2, true); if (s === 30) z.se('Z1 打撃'); }
        else if (s >= 33 && s <= 41) { z.efp = 0; z.eff = 0; this.aenPose(0, 0); z.ax = -8; }
        else if (s === 48) { z.ax = 0; z.otype = 1; this.aenPose(0, 2); A.x += 12; }
        else if (s === 60) { z.se('DB3 SE041'); this.aenPose(0, 3); }
        else if (s >= 81 && s <= 87) { A.x -= 24; z.fill('#fff', 296); if (s === 81) z.se('DB3 刀'); this.aenPose(0, 4); A.x -= 12; }
        else if (s === 90) z.ax = 0;
      }
      if (f >= 311 && f <= 339) {
        if (f === 311) { z.se('Z1 飛ぶ'); A.x -= 14; }
        this.aenPose(0, 0); A.x -= 24;
        z.efp = 0; z.eff = 0; z.eft = 0;
      }
    });
    return yield* this.aenHit(22);
  },

  // ---------- 齊爾德 ----------
  * aenChilledBlast() { // 2763 爆発波: the blue aura, the shock wave from him (229), on the member (230); on everyone
    const z = this.feStage(), G = this.G;
    z.color = 3;
    if (!z.again) {
      yield* this.aenRun(218, [270, 96], (f) => {
        z.color = 3;
        if (f === 0) { z.se('Z3 変身'); z.otype = 1; this.aenPose(0, 2); }
        if (f >= 1 && f <= 140) { if (f === 90) { audio.seStop(); this.aenPose(0, 2); } z.backPattern(201, 246, 86); }
        if (f === 141) { audio.seStop(); z.se('Z1 ザー'); this.aenPose(0, 4); z.efp = 229; }
        if (f === 180) this.aenEffOff();
        if (f === 190) z.displayOut();
        if (f >= 191 && f <= 217) z.efp = 230;
      });
    } else {
      yield* this.aenRun(26, [270, 96], (f) => {
        if (f === 0) { z.se('Z1 ザー'); z.efp = 230; z.otype = 0; G.x = CENTER_CHAX; G.y = STD_Y; }
        if (f >= 1 && f <= 25) z.efp = 230;
      });
    }
    return yield* this.aenHit(23);
  },

  // ---------- 布歐 ----------
  * aenBuuKame() { // 2779 かめはめ波: the charge, the wave (203) with a recoil, on the member (204)
    const z = this.feStage();
    yield* this.aenRun(108, [200, 134], (f) => {
      if (f === 0) { z.se('Z1 気を溜める'); z.otype = 1; this.aenPose(0, 5); z.color = 0; }
      else if (f >= 41 && f <= 45) this.aenPose(0, 6);
      else if (f === 46) { audio.seStop(); z.se('Z3 エネルギー波'); }
      else if (f >= 47 && f <= 75) { z.efp = 203; if (f <= 49) z.ax = 2; else if (f <= 52) z.ax = -2; else if (f === 53) z.ax = 0; }
      else if (f === 76) this.aenEffOff();
      else if (f === 80) z.displayOut();
      else if (f >= 81 && f <= 107) z.efp = 204;
    });
    return yield* this.aenHit(23);
  },
  // 2780 巻きつき攻撃: his arm stretches out (351) and flies in round the member, he follows, swings him up out of the
  // stage and comes down on him (damage 71 presses him down); missed, it ends as the arm arrives
  * aenBuuWrap() {
    const z = this.feStage(), A = this.A, G = this.G, big = (G.sheets.size || 96) > 96;
    yield* this.aenRun(265, [274, 118], (f, r) => {
      if (f === 0) { z.se('DB3 SE041'); z.otype = 1; this.aenPose(0, 7); z.color = 0; }
      if (f >= 31 && f <= 90) {
        const s = f - 31;
        if (s === 0) z.se('DB3 SE061');
        this.aenPose(0, 2);
        z.eff = 0;
        if (s === 0) z.efp = 351;
        const t = { 16: 1, 24: 2, 32: 3 }[s];
        if (t) z.eft = t;
      }
      if (f >= 91 && f <= 120) { if (f === 91) z.se('Z1 ブン'); this.aenPose(0, 8); z.eft = 4; r.x = 274; r.y = 120; }
      if (f >= 121 && f <= 159) { if (f === 121) z.se('Z1 飛ぶ'); this.aenPose(0, 9); A.x -= 16; }
      if (f === 160) { this.aenEffOff(); z.displayOut(); z.eft = 4; z.se('DB3 SE096'); }
      if (f >= 161 && f <= 187) { z.efp = 351; r.x = 640; r.y = 120; }
      let jump = null;
      if (f === 188) {
        if (!this.hit) { jump = 265; z.efp = 0; } else z.se('DB3 SE041');
        this.aenPose(1, 16); A.y = STD_Y; A.x = 640;
        r.x = G.x; r.y = G.y; z.eft = 5; z.eff = 0;
        if (big) { r.x -= 96; r.y -= 32; z.eft = 0; z.efp = 354; }
      }
      if (f >= 189 && f <= 208) {
        z.eff = 0; r.x = 240; r.y = 120;
        if (f === 189) z.se('Z1 飛ぶ');
        A.x -= 16; this.aenPose(0, 9);
        if (big) { r.x -= 96; r.y -= 32; z.eft = 0; z.efp = 354; }
      }
      if (f >= 209 && f <= 250) {
        const s = f - 209;
        this.aenPose(0, 10);
        if (s === 0) z.se('ZG 打撃2');
        G.y = -300;
        r.x = 240 - 16 * s; r.y = 120 - 8 * s;
        z.eft = 6; z.eff = 0;
        this.aenPose(1, 16);
        if (big) { r.x -= 128; r.y -= 48; z.efp = 354; z.eft = 1; }
      }
      if (f >= 251 && f <= 264) {
        const s = f - 251;
        r.x = 640 - 16 * s; r.y = 240 - 8 * s;
        if (s === 0) { A.y = -88; A.x = CENTER_CHAX; this.aenPose(0, 11); }
        if (big) { r.x -= 240; r.y -= 48; }
        A.y += 12;
      }
      if (f === 265) { G.y = STD_Y; A.y = -200; this.aenPose(1, 17); }
      return jump;
    });
    return yield* this.aenHit(71);
  },
  * aenBuuCandy() { // 2781 お菓子光線: the beam out of his antenna, then onto the member (352); it turns him into a sweet (81)
    const z = this.feStage();
    yield* this.aenRun(65, [192, 110], (f, r) => {
      if (f === 0) { z.se('DB3 SE075'); z.otype = 1; this.aenPose(0, 12); z.color = 0; }
      if (f >= 1 && f <= 36) { // its end, its tip and the middle growing between them (@effect_anime_frame counted here)
        const n = RAY_SPEED * z.eff;
        z.back(BUU.beam, 608 - 48, 0, 48, 52, r.x + 48, r.y);
        z.back(BUU.beam, 0, 0, 48, 52, r.x - n, r.y);
        z.back(BUU.beam, 48, 0, n, 52, r.x + 48 - n, r.y);
        z.eff++;
      }
      if (f === 37) { this.aenEffOff(); z.displayOut(); }
      if (f >= 38 && f <= 64) { r.y = 124; z.efp = 352; }
    });
    return yield* this.aenHit(81);
  },
  // 2782 超爆発波: the blue aura; he is gone, his picture gathering ki as rocks rise and the screen whitens; his picture
  // bursting over the explosion backdrop (back 220); then the shock behind the member (back 1); on everyone
  * aenBuuBlast() {
    const z = this.feStage(), A = this.A, G = this.G;
    z.color = 3;
    if (!z.again) {
      yield* this.aenRun(398, [270, 96], (f) => {
        z.color = 3;
        if (f === 0) { z.se('Z3 変身'); z.otype = 1; this.aenPose(0, 4); }
        if (f >= 1 && f <= 89) z.backPattern(201, 254, 86);
        if (f === 90) { audio.seStop(); z.se('Z1 気を溜める5'); A.x = -200; z.tec = false; }
        if (f >= 91 && f <= 210) {
          const s = f - 91;
          z.back(BUU.aura, 0, z.bt * 300, 300, 300, 176, 0); z.bstep(8, 1); z.bf++; // back 219
          z.back(BUU.charge, 0, 0, 300, 300, 176, 0);
          z.back(BUU.rock, 0, 0, 300, 160, 130, 240 - s * 6);
          z.back(BUU.rock, 0, 0, 300, 160, 160, 240 - s * 4);
          if (s >= 92) z.fill(s <= 99 ? '#404040' : s <= 107 ? '#808080' : s <= 115 ? '#c0c0c0' : '#fff', 296);
        }
        if (f >= 211 && f <= 349) {
          if (f === 211) { z.se('ZG 光線1'); z.se('Z1 エネルギー波'); }
          z.back(BUU.fire, 0, 0, 300, 300, 176, 0);
          z.back(BUU.back, 0, z.bt * 356, 640, 356, 0, 0); z.bstep(4, 2); z.bf++; // back 220
        }
        if (f === 350) z.displayOut();
        if (f >= 351 && f <= 397) { if (f === 351) { z.se('Z1 ザー'); z.se('Z1 ゴー'); } z.backPattern(1); }
      });
    } else {
      yield* this.aenRun(48, [270, 96], (f) => {
        if (f === 0) { z.se('Z1 エネルギー波'); z.se('Z1 ザー'); z.se('Z1 ゴー'); z.efp = 0; z.otype = 0; G.x = CENTER_CHAX; G.y = STD_Y; }
        if (f >= 1 && f <= 47) z.backPattern(1);
      });
    }
    return yield* this.aenHit(44);
  },

  // ---------- 奧佐特(變身) ----------
  // 2788 ラッシュ: the red aura (back 221), he flies off, comes back in, sixteen blows faster and faster, the member
  // knocked back each time; the aura again as he backs off, and he charges in (damage 22 with the blow sound)
  * aenOzottoRush() {
    const z = this.feStage(), A = this.A, G = this.G;
    const aura = (x) => { z.back(RED_AURA[1], z.bt * 300, 0, 300, 300, x, 30); z.bstep(8, 1); z.bf++; };
    // the blows: [frame from 181, pose]; the member's knocks [from, to, dx] (the first that matches, as the case does)
    const BLOWS = [], KNOCK = [];
    let s = 0;
    for (const [gap, poses, back] of [[24, [2, 1, 2, 1], 3], [16, [3, 4, 3, 4], 3], [8, [1, 2, 1, 2], 3], [4, [3, 4, 3, 4], 1]]) {
      poses.forEach((p, i) => {
        if (i || gap !== 24) s += gap;
        BLOWS.push([s, p]);
        KNOCK.push([s, s + back, -16], [s + back + 1, s + back * 2 + 1, 16]);
      });
    }
    yield* this.aenRun(441, [274, 118], (f) => {
      if (f === 0) { z.se('ZG 気をためる'); z.otype = 1; z.color = 3; this.aenPose(0, 2); }
      if (f >= 1 && f <= 128) aura(172);
      if (f === 129) audio.seStop();
      if (f === 139) { z.otype = 0; this.aenPose(0, 16); }
      if (f >= 140 && f <= 169) { if (f === 140) z.se('Z1 飛ぶ'); z.ax = 28; }
      if (f === 170) { z.ax = 0; z.displayOut(); A.x = STD_ENEX; A.y = STD_Y; }
      if (f >= 171 && f <= 180) { z.ax = 28; z.otype = 0; this.aenPose(0, 16); }
      if (f >= 181 && f <= 368) {
        z.ax = 0;
        const k = f - 181;
        z.eff = 0;
        const b = BLOWS.find((x) => x[0] === k);
        if (b) { this.aenPose(0, b[1]); z.se('Z1 強打'); }
        const n = KNOCK.find((x) => k >= x[0] && k <= x[1]);
        if (n) { this.aenPose(1, 16); G.x += n[2]; }
      }
      if (f >= 369 && f <= 388) {
        if (f === 369) z.se('ZG 気をためる');
        z.otype = 1; z.color = 3; this.aenPose(0, 16);
        A.x += 8;
        aura(172 + 8 * (1 + f - 369) + 40);
      }
      if (f >= 389 && f <= 432) aura(172 + 160 + 40);
      if (f >= 433 && f <= 440) {
        if (f === 433) z.se('Z1 飛ぶ');
        A.x -= 24;
        aura(172 + 160 - 24 * (1 + f - 433) + 40);
      }
      if (f === 441) { this.aenPose(0, 4); z.kyouda = true; }
    });
    return yield* this.aenHit(22);
  },
  // 2790 カオスバースト: the red aura; his picture (the strips down the sides, no cut-in) with ki drawn in, a white
  // flash, the blue beam over his picture, then the huge wave onto the member (353)
  * aenOzottoChaos() {
    const z = this.feStage(), A = this.A;
    const P = { n: [0, 0, 0, 0, 0, 0, 0, 0], max: 15, up: 10, cx: 274 + 40, cy: 118 + 76 };
    const dirs = [[0, -2], [2, -2], [2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2]];
    yield* this.aenRun(507, [274, 118], (f) => {
      z.color = 3;
      if (f === 0) { z.se('ZG 気をためる'); z.otype = 1; this.aenPose(0, 2); }
      if (f >= 1 && f <= 128) { z.back(RED_AURA[1], z.bt * 300, 0, 300, 300, 172, 30); z.bstep(8, 1); z.bf++; }
      if (f >= 129 && f <= 330) {
        if (f === 129) {
          z.tecNo = 1; z.cut = false; z.cutFlag = false; A.x = -200;
          audio.seStop(); z.se('Z1 気を溜める6'); z.se('Z1 気を溜める7'); z.se('ZG 気をためる2');
        }
        z.back(CHAOS, 0, 0, 512, 224, 66, 50);
        this.aenSpecks(P, f, 350, 7, dirs);
      }
      if (f >= 331 && f <= 350) z.fill('#fff', 356);
      if (f >= 351 && f <= 470) {
        if (f === 351) { audio.seStop(); z.se('ZG 光線1'); }
        z.back(CHAOS, 0, 0, 512, 224, 66, 50);
        z.back(BEAM_BIG_BLUE, 0, 0, 316, 158, 162, 54 + 126);
      }
      if (f === 479) z.tecNo = 0;
      if (f === 480) z.displayOut();
      if (f >= 481 && f <= 506) { if (f === 481) { z.se('Z1 ザー'); z.se('Z1 ゴー'); } z.efp = 353; }
    });
    return yield* this.aenHit(44);
  },

  // ---------- the common patterns with this move's own damage pattern / cut-in ----------
  aenDamageAs(n) { const z = this.feStage(), d0 = z.damage; z.damage = function* () { return yield* d0.call(z, n); }; },
  * aenWave42() { this.aenDamageAs(42); return yield* this.feWave(); }, // 652 / 677: 2431, damage 42
  * aenWaveCut() { return yield* this.feWave(); }, // 631 どどんぱ: 2431 with the cut-in
  * aenBigWave42() { this.aenDamageAs(42); return yield* this.feBigWave(); }, // 632 スーパーどどんぱ: 2499, damage 42
  * aenBigWave44() { this.aenDamageAs(44); return yield* this.feBigWave(); }, // 679 ビッグスマッシャー: 2499, damage 44
  * aenBlast42() { this.aenDamageAs(42); return yield* this.feBlast(); }, // 678 爆発波(スラッグ巨大化): 2498 small, damage 42
});

// ---------- effect_pattern (all.rb 135031) for an enemy attacking: the ones src/anime_foes_common.js doesn't have
// (z.eff / z.eft / z.rf / z.rt the counters, counted on after each call) ----------
const fx = (n, f) => { if (!EFFECTS[n]) EFFECTS[n] = f; };
fx(16, (z, x, y) => { // エネルギー弾系(正面)(頭): the ball growing, the next every 10 frames
  if (!x) { x = 249; y = 112; }
  z.front(z.color === 4 ? BALL_RED : BALL[z.color] || BALL[0], z.eft * 128, 0, 128, 128, x, y);
  if (z.eff >= 10) { z.eft++; z.eff = 0; }
});
fx(18, (z, x, y) => { // エネルギー弾系(正面)(サンショ手の位置)
  if (!x) { x = 230; y = 104; }
  z.front(z.color === 4 ? BALL_PINK : BALL[z.color] || BALL[0], z.eft * 128, 0, 128, 128, x, y);
  if (z.eff >= 10) { z.eft++; z.eff = 0; }
});
fx(44, (z) => z.front(LIQUID[z.color] || LIQUID[0], 0, 32, 400, 32, 640 - z.eff * RAY_SPEED, 150)); // エネルギー液横(敵)
fx(47, (z) => z.front(MID[z.color] || MID[0], 0, 60, 400, 60, 640 - z.eff * RAY_SPEED, 140)); // かめはめ波系(中)円つき横
fx(229, (z, x, y) => z.front(SHOCK_BLUE, 0, 116, 30, 116, x - z.eff * RAY_SPEED, y)); // 衝撃波系(発動)敵 (@ray_color 3)
fx(230, (z, x, y) => z.front(SHOCK_BLUE, 0, 116, 30, 116, 640 - z.eff * RAY_SPEED, y)); // (ヒット)
fx(268, (z, x, y) => { z.front(SWORD[1], 160 * z.rt, 0, 160, 96, x, y); if (z.rf >= 2) { z.rt++; z.rf = 0; } }); // upside down
fx(322, (z, x, y) => z.front(ARM[1], 0, 0, 32, 18, x, y)); // the gun barrel sliding along the arm
fx(323, (z, x, y) => { // the barrel at the end; from frame 379 the shots: a little blast somewhere on the member
  z.front(ARM[2], 0, 0, 30, 24, x, y);
  if (z.f >= 379) z.front(SPARK_BOOM, 0, 0, 32, 32, z.d.G.x + rand(18) * 2, z.d.G.y + rand(16) * 2);
});
fx(324, (z, x, y) => { // 超元気玉ため(逆): the ball gathering, then pulsing between its last two pictures
  z.front(NOVA.charge, 0, z.rt * 110, 246, 110, x, y);
  if (z.rf >= 20 && z.rt !== 5) { z.rt++; z.rf = 0; } else if (z.rf >= 4 && z.rt === 5) { z.rt = 4; z.rf = 0; }
});
fx(325, (z, x, y) => z.front(NOVA.up, 0, 0, 512, 250, x - z.eff * 8, y + z.eff * 2)); // スーパービッグノヴァ発動
fx(326, (z, x, y) => z.front(NOVA.ball, 0, 0, 900, 512, x - z.eff * 8, y + z.eff * 2)); // (ヒット)
const cable = (grow) => (z, x, y) => { // メタルクウラコア(ケーブル): 327 coming out of him, 328 / 329 reaching out
  if (grow) z.front(CABLE, 0, 80 * z.rt, 64 + z.eff * 8, 80, x, y); else z.front(CABLE, 0, 80 * z.rt, 1400, 80, x - z.eff * 8, y);
  if (z.rf >= 4) { z.rt++; z.rf = 0; }
  if (z.rt >= 3) { z.rt = 0; z.rf = 0; }
};
fx(327, cable(true)); fx(328, cable(false)); fx(329, cable(false));
fx(350, (z) => { // 超体当たり(ヒット)
  z.front(TACKLE, 190 * z.rt, 0, 190, 126, 640 - z.eff * RAY_SPEED, 100);
  if (z.rf >= 8 && z.rt === 0) { z.rt++; z.rf = 0; } else if (z.rf >= 8) { z.rt = 0; z.rf = 0; }
});
fx(351, (z, x, y) => z.front(BUU.wrap, 0, z.eft * 96, 96, 96, x - z.eff * RAY_SPEED, y)); // 巻きつき攻撃 引き抜く
fx(352, (z, x, y) => z.front(BUU.beam, 0, 0, 608, 52, 640 - z.eff * RAY_SPEED, y)); // 光線 (お菓子光線)
fx(353, (z) => z.front(HUGE_BLUE, 0, 192, 400, 192, 640 - z.eff * RAY_SPEED, 76)); // かめはめ波系(特大_加工)横 ヒット (@ray_color 3)
fx(354, (z, x, y) => z.front(BUU.wrapBig, 192 * z.eft, 0, 192, 192, x, y)); // ブウ巻きつきヒット (a big member)

// ?dev=aen4: a Z3 save, 悟空・悟飯・比克・貝吉塔 at level 60, against 吉加(強)・尼奇(強)・桑修(強); aen4<enemy ids
// joined by _> against those (aen4210_213_214, aen4215_216_238, aen4222_223, aen4253_254 …). Any of the films from the console:
// __game.scene.aen4(skill[, member index, foe index, dmg]) — the enemy plays the move on that member
registerZ3('aen4', {
  dev(game, step) {
    const m = /^aen4([\d_]*)$/.exec(step);
    if (!m) return false;
    const foes = m[1] ? m[1].split('_').filter(Boolean).map(Number) : [186, 187, 188];
    const s = game.state = game.newState();
    s.var[40] = 3;
    s.var[43] = 60;
    s.flags.z3 = 'done';
    party(game, [3, 5, 4, 12]);
    for (const p of s.party) { p.level = 60; p.exp = game.world.actors[p.id].exp[60]; applyLevel(game.world, p); heal(p); }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle(foes, true, { loseOk: true }), 300);
    return true;
  },
});
// (the console helper: the battle scene plays one of these films the way enemyAct does)
Object.defineProperty(globalThis, '__aen4', { configurable: true, value: (skill, mi = 0, fi = 0, dmg = 10) => {
  const b = globalThis.__game && globalThis.__game.scene;
  if (!b || !b.play) return null;
  const m = b.party[mi], f = b.foes[fi];
  b.duel = { m, mc: b.hand[0], f, fc: f.card || {} };
  return b.play(m, f, false, skill, dmg, m);
} });

// sounds these films play beyond src/anime.js's, for tools/copy_assets.py
export const AEN4_SOUNDS = ['Z1 気を溜める2', 'Z1 刀', 'Z1 高速移動', 'DB3 刀', 'Z1 エネルギー波2', 'Z1 怪しい気', 'Z1 エネルギー波',
  'Z3 避ける', 'Z3 跳ね返し', 'DB3 キラーン', 'Z3 光線系ヒット', 'ZG 光線系ヒット2', 'ZG 光線系ヒット3', 'Z1 爆発1', 'DB3 大爆発',
  'DB3 SE091', 'DB3 エネルギー波1', 'DB3 エネルギー波2', 'Z1 強打', 'DB3 SE059', 'Z3 ダイナマイト爆発(最後なし)', 'Z1 怪光線', 'Z1 気を溜める5',
  'DB3 SE096', 'Z1 ザー', 'Z1 気を溜める5(長い)', 'Z1 ゴー', 'Z1 衝撃波', 'DB3 SE041', 'DB3 SE061', 'DB3 SE075', 'DB3 SE103', 'Z1 ブン',
  'Z1 打撃', 'Z1 気を溜める', 'Z1 気を溜める6', 'Z1 気を溜める7', 'Z1 逃げる', 'Z1 飛ぶ', 'Z3 エネルギー波', 'Z3 変身', 'ZG 光線1', 'ZG 打撃2',
  'ZG 気をためる', 'ZG 気をためる2', 'ZG 打撃4'];

// S-combo films of the original's anime_pattern 28xx, part 3 (docs/anim-f-plan.md cmc; the stage: src/combo_z3a_stage.js):
//   780 超爆力魔波 2880 (all.rb 105449)              781 / 782 ダブルアタック 2881 / 2882 (105578 / 105747)
//   783 / 784 悟飯ちゃん / 悟空さを巻き込むでねえ 2883 / 2884 (105916 / 106112)    785 バーダック一味 2885 (106310)
//   791 かめはめ乱舞(親子) 2891 (107007)            792 アンドロイドストライク 2892 (107122)
//   793-798 あの時の借りを返すよ！… 2893-2898 (107479-109803)     799 流派を超えた連携 2899 (109804)
// Frame numbers in the comments are the original's @battle_anime_frame; every frame: the film's own drawing (behind the
// fighters), then mv() (output_battle_anime's movement), then the effect (@effect_anime_pattern, in front).
import { audio, rand } from './core.js?v=20261108-0709';
import { STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261108-0709';
import { ComboDuel } from './combo-anime.js?v=20261108-0709';
import { pic, blt, cmcFilms, cmcPictures, STD_CHAX, SPARK } from './combo_z3a_stage.js?v=20261108-0709';

const FLASH_ON = 296, FLASH_OFF = 356; // FLASH_Y_SIZE_CUTIN_ON / _OFF: the white flash above the cut-in, or all of it
const v = (n) => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[n]) || 0; };
// the effects' pictures by @ray_color (0 white, 1 green, 3 blue)
const C = {
  ball4: pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'), ball4Blue: pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'), // effects 355-357: 190×126
  hugeCut: { 0: pic('Z3_戦闘_必殺技_エネルギー波_特大_加工.PNG'), 1: pic('Z3_戦闘_必殺技_エネルギー波_特大_緑_加工.PNG'),
    3: pic('Z3_戦闘_必殺技_エネルギー波_特大_青_加工.PNG') }, // effects 358 / 353: 400×192 ×2
  huge: pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG'), // effect 295
  mid: pic('Z3_戦闘_必殺技_エネルギー波_中.PNG'), // effect 297: 400×80
  bigBlue: pic('Z3_戦闘_必殺技_エネルギー波_大_敵_青.PNG'), // effects 239 / 240 (@ray_color 3): 400×122 ×2
  halfBlue: pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'), // effect 265: 700×128 ×2
  sokiBlue: pic('Z3_戦闘_必殺技_繰気弾(青).PNG'), // effect 271: 128×128 frames
  kameBlue: pic('Z3_必殺技_超カメハメ波_青.png'), // effect 275: 500×350
  liquidGreen: pic('Z3_戦闘_必殺技_エネルギー液(緑).PNG'), // effects 283 / 44: 400×32 ×2
  blink: { 0: pic('Z3_必殺技_超カメハメ波(球点滅).png'), 3: pic('Z3_必殺技_超カメハメ波(球点滅)(青).png') }, // effect 235: 32×32 ×5
  blinkSmall: pic('Z3_必殺技_超カメハメ波(球点滅小).png'), // effect 237: 16×16 ×5
  blinkBig: pic('Z3_必殺技_超カメハメ波(球点滅大)(青).png'), // effect 289: 64×64 ×5
};
const P = {
  surprise: pic('戦闘アニメ_ビックリマーク.PNG'), // 16×16
  strike18: [pic('Z3_必殺技_アンドロイドストライク(18号).png'), pic('Z3_必殺技_アンドロイドストライク(18号 着せ替え).png')], // 250×356
  strike17: pic('Z3_必殺技_アンドロイドストライク(17号).png'),
  kikou: pic('Z3_必殺技_新気功砲(テンシンハン・服あり).png'), // 170×160
  wave18: [pic('Z3_必殺技_18号エネルギーウェイブ.png'), pic('Z3_必殺技_18号エネルギーウェイブ(着替).png')], // 296×220
  hells: pic('Z3_必殺技_ヘルズフラッシュ(16号).png'), // 302×220
  thunder: pic('Z3_必殺技_電撃地獄玉(17号).png'), // 296×220
  beamBlue: pic('ZG_必殺技_光線_大(青).PNG'), // 316×158
  dodonpa: pic('Z3_必殺技_どどん波(チャオズ1).png'), // 192×168
  spark: pic('Z3_戦闘_必殺技_超元気玉(元気).png'), // 8×10
  lines: [pic('Z3_必殺技_超カメハメ波(バック上).png'), pic('Z3_必殺技_超カメハメ波(バック下).png')], // back 106
};
cmcPictures([C.ball4, C.ball4Blue, ...Object.values(C.hugeCut), C.huge, C.mid, C.bigBlue, C.halfBlue, C.sokiBlue, C.kameBlue, C.liquidGreen,
  ...Object.values(C.blink), C.blinkSmall, C.blinkBig, P.surprise, ...P.strike18, P.strike17, P.kikou, ...P.wave18, P.hells, P.thunder,
  P.beamBlue, P.dodonpa, P.spark, ...P.lines]);

// pic_shake_cal 4 (all.rb 20540): one of nine directions
const shake = () => [(rand(3) - 1) * 4, (rand(3) - 1) * 4];

Object.assign(ComboDuel.prototype, {
  chg(id) { this.L.sheets = this.crew[this.who(id)]; }, // @btl_ani_cha_chg_no
  // the effects these films use (effect_pattern, the party attacking); rx / ry are the film's ray_x / ray_y
  cmcCFx(n, rx = 0, ry = 0, color = 0) {
    const st = this.st, F = (s, sx, sy, w, h, x, y) => st.front(s, sx, sy, w, h, x, y);
    const blinkStep = (k, z) => { if (k.rframe >= 4 && k.rtype !== 4) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4) { k.rtype = 0; k.rframe = 0; } };
    st.fxStep((k) => {
      const f = k.frame;
      switch (n) {
        case 44: F(C.liquidGreen, 0, 0, 400, 32, -400 + f * RAY_SPEED, 150); break; // エネルギー液横
        case 125: if (f <= 10) F(SPARK, f <= 4 ? 0 : 32, 16, 32, 32, rx, ry); break; // 攻撃ヒット自由位置
        case 235: F(C.blink[color] || C.blink[0], 32 * k.rtype, 0, 32, 32, rx, ry); blinkStep(k); break; // スーパーカメハメ波ため
        case 237: F(C.blinkSmall, 16 * k.rtype, 0, 16, 16, rx, ry); blinkStep(k); break;
        case 289: F(C.blinkBig, 64 * k.rtype, 0, 64, 64, rx, ry); blinkStep(k); break; // (@ray_color 3)
        case 239: F(C.bigBlue, 0, 122, 144 + f * RAY_SPEED, 122, rx, ry); break; // エネルギーは大(発動) (@ray_color 3)
        case 240: F(C.bigBlue, 0, 0, 400, 122, -400 + f * RAY_SPEED, ry); break; // (ヒット)
        case 265: F(C.halfBlue, 0, 128, 700, 128, -700 + f * RAY_SPEED, ry); break; // 半円ヒット (青)
        case 271: F(C.sokiBlue, k.type * 128, 0, 128, 128, -128 + f * RAY_SPEED, 112); break; // デスボール系(ヒット) (青)
        case 275: F(C.kameBlue, 0, 0, 54 + f * RAY_SPEED, 350, rx, ry); break; // ヘルズフラッシュ発動 (青)
        case 283: F(C.liquidGreen, 0, 32, 24 + f * RAY_SPEED, 32, rx, ry); break; // エネルギー液発動 (緑)
        case 295: F(C.huge, 0, 192, 192 + f * RAY_SPEED, 192, rx, ry); break; // エネルギー波_特大発動
        case 297: F(C.mid, 0, 0, 400, 80, -400 + f * RAY_SPEED, ry); break; // エネルギー波_中(ヒット)
        case 353: F(C.hugeCut[color] || C.hugeCut[3], 0, 0, 400, 192, -400 + f * RAY_SPEED, 76); break; // 特大_加工 ヒット
        case 358: F(C.hugeCut[color] || C.hugeCut[3], 0, 192, 54 + f * RAY_SPEED, 192, rx, ry); break; // 特大_加工 発動
        case 355: case 357: // ダブルアタック(発動): an orange and a blue ball
          F(C.ball4, 0, 0, 190, 126, 340 + f * RAY_SPEED, 98 - (n === 355 ? 56 : 46) + f);
          F(C.ball4Blue, 0, 0, 190, 126, 340 + f * RAY_SPEED, 98 + 50 - f);
          break;
        case 356: // (ヒット): the two in turn, every 8
          F(k.rtype === 0 ? C.ball4 : C.ball4Blue, 0, 0, 190, 126, -192 + f * RAY_SPEED, 126);
          if (k.rframe >= 8 && k.rtype === 0) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 8) { k.rtype = 0; k.rframe = 0; }
          break;
        default:
      }
    });
  },
  // effects 363 / 364 スパーキングコンボキャラ現れる2人目右 / 左: the second one coming in from the left (12 / 8 a frame)
  cmcCFx363(id, right) {
    const st = this.st;
    st.fxStep((k) => st.chr(id, true, 0, right ? STD_CHAX + k.frame * 12 - 30 + 12 : STD_CHAX + k.frame * 8 - 48, STD_Y, st.e));
  },
  // back 106 背景スーパーカメハメ波 (not mirrored: on the left)
  cmcCLines() {
    const st = this.st, t = st.ba.type;
    st.back(P.lines[0], 0, 128 * t, 384, 128, 0, 0);
    st.back(P.lines[1], 0, 64 * t, 192, 64, 0, 292);
    st.backStep(4, 2);
  },
  // back 128 発動キャラ前に現れる(汎用): the first one, special sheet, 16 a step
  cmcCComeIn(id, step, row = 0) { this.st.chrBack(id, true, row, STD_CHAX + step * 16, STD_Y); },
});

// ---------- 2880 超爆力魔波 (780 比克＆未來悟飯): the other comes in (effect 363 / 364), side by side, two green auras
// (back 201 ×2) on the vertical bars, 未來悟飯's 超爆力波 and 比克's (row 23) with white flashes, the shock behind the
// enemy (back 1) ----
Object.assign(ComboDuel.prototype, {
  * cmcCBakuryoku() {
    const st = this.st, A = this.A, gohanLead = this.who(this.lead) === this.who(25);
    let eff = 0, row2 = 0; // (@scombo_cha2 = 比克 from 40; @scombo_cha2_anime_type)
    for (let f = 0; f <= 332; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        eff = gohanLead ? 364 : 363;
        st.v.ax = gohanLead ? (f <= 13 ? 8 : 0) : (f <= 10 ? -8 : 0);
      }
      if (f >= 40 && f <= 59) {
        if (!gohanLead && f === 40) A.x += 160 + 24;
        st.v.ax = 0;
        this.chg(25);
        st.chrBack(4, true, row2, TEC_CENTER - 80, STD_Y);
        eff = 0;
      }
      if (f === 60) {
        st.no = 1;
        this.se('Z3 変身'); this.se('Z1 気を溜める');
        st.chrBack(4, true, row2, TEC_CENTER - 80, STD_Y);
        st.ba.frame = 0;
      }
      if (f >= 61 && f <= 187) {
        eff = 0; st.ef.frame = 0;
        this.pose(A, 4);
        st.aura(226 - 80, 90, 1); st.ba.frame--;
        st.aura(226 + 80 + 24, 90, 1); st.ba.frame--;
        st.chrBack(4, true, row2, TEC_CENTER - 80, STD_Y);
      }
      if (f >= 188 && f <= 269) {
        this.pose(A, 8);
        row2 = 23;
        if (f === 188) { audio.seStop(); this.se('Z1 エネルギー波'); this.se('Z1 ザー'); this.se('Z1 ゴー'); }
        st.chrBack(4, true, row2, TEC_CENTER - 80, STD_Y); st.ba.frame--;
        if (f % 20 === 0) st.white(FLASH_ON);
      }
      if (f === 270) {
        st.bars = false;
        A.y = -200;
        eff = 0; st.ef.frame = 0; st.ef.type = 0;
        this.out();
        audio.seStop(); this.se('Z1 ザー'); this.se('Z1 ゴー');
      }
      if (f >= 271 && f <= 331) { st.shock(); if (f % 20 === 0) st.white(FLASH_ON); }
      if (f === 332) { this.fromat(); yield; break; }
      this.mv();
      if (eff) this.cmcCFx363(gohanLead ? 4 : 25, eff === 363);
      yield;
    }
  },
});

// ---------- 2881 / 2882 ダブルアタック (781 天津飯 / 782 餃子＆特蘭克斯): the other one flies in below (effect 90) / above
// (89), both vanish (back 48), the fighter strikes the enemy off the stage (effect 121), 特蘭克斯 behind it kicks it down
// to the left (effect 125), the two side by side fire an orange and a blue ball (effect 355 / 357), then the two hit
// (356) ----
Object.assign(ComboDuel.prototype, {
  * cmcCDoubleAttack() {
    const st = this.st, A = this.A, G = this.G, fighter = this.combo === 781 ? 8 : 9, tLead = this.who(this.lead) === this.who(17);
    const [x48, row354, fire] = fighter === 8 ? [TEC_CENTER + 10, 1, 355] : [TEC_CENTER, 3, 357];
    let eff = 0, row2 = 0, rx = 325, ry = 70;
    for (let f = 0; f <= 443; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) { eff = tLead ? 89 : 90; st.v.ay = f <= 10 ? (tLead ? 5 : -5) : 0; }
      if (f >= 40 && f <= 59) { if (tLead && f === 40) A.y -= 100; st.v.ay = 0; this.chg(fighter); eff = 92; }
      if (f >= 60 && f <= 100) {
        eff = 92; A.y = -200;
        if (f === 60) this.se('Z1 高速移動');
        st.after(x48, STD_Y + 76 - 100);
      }
      if (f >= 101 && f <= 140) { eff = 0; if (f === 101) this.se('Z1 高速移動'); st.after(TEC_CENTER + 10, STD_Y + 76); }
      if (f === 150) {
        st.ef.frame = 0;
        G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false);
        this.chg(fighter); A.x = CENTER_CHAX; this.pose(A, 0, false);
      }
      if (f >= 160 && f <= 180) { if (f === 160) this.se('Z1 高速移動'); st.after(CENTER_CHAX + 16, STD_Y + 26); if (f === 180) A.y = STD_Y; }
      if (f === 186) { this.se('Z1 打撃'); this.pose(A, 3); }
      if (f === 191) { this.se('Z1 打撃'); this.pose(A, 4); }
      if (f === 201) { this.se('Z3 打撃'); this.pose(A, 1); this.pose(G, 16, false); }
      if (f >= 207 && f <= 225) {
        st.v.gx = -18; eff = 121;
        if (f === 225) { A.y = -200; G.x = -96; this.pose(A, 0); this.chg(17); }
      }
      if (f >= 226 && f <= 246) {
        st.v.gx = -18;
        if (f === 226) this.se('Z1 高速移動');
        if (f === 235) this.pose(G, 0, false);
        if (f === 238) { st.after(CENTER_CHAX + 16 + 96, STD_Y + 26); A.x += 96 + 24 * 4; A.y = STD_Y; eff = 0; }
        if (f === 246) st.v.gx = 0;
        st.ef.frame = 0; st.ef.type = 0;
      }
      if (f >= 247 && f <= 251) A.x -= 24;
      if (f >= 252 && f <= 293) {
        eff = 125; rx = 350; ry = 158;
        A.y = STD_Y;
        if (f === 252) this.se('Z1 強打');
        this.pose(A, [0, 4].includes(v(173)) || v(173) > 4 ? 12 : 17, true); // (variable 173: 特蘭克斯's look)
        this.pose(G, 16, false);
        st.v.gx = 18; st.v.gy = 4;
      } else { rx = 325; ry = 70; }
      if (f >= 294 && f <= 353) {
        eff = 0; st.ef.frame = 0;
        if (f === 294) this.se('Z1 気を溜める2');
        A.x = TEC_CENTER; A.y = STD_Y - 50;
        this.pose(A, 0);
        this.chg(fighter);
        row2 = 0;
        st.chrBack(17, true, row2, TEC_CENTER, STD_Y + 50);
      }
      if (f >= 354 && f <= 414) {
        if (f === 354) { audio.seStop(); this.se('Z1 エネルギー波2'); }
        this.pose(A, row354);
        row2 = 1;
        st.chrBack(17, true, row2, TEC_CENTER, STD_Y + 50);
        eff = fire;
      }
      if (f === 415) { st.v.gy = 0; st.v.gx = 0; eff = 0; this.out(); st.ef.frame = 0; }
      if (f >= 416 && f <= 442) eff = 356;
      if (f === 443) { this.fromat(); yield; break; }
      this.mv();
      if (eff === 89 || eff === 90) this.fx8990(tLead ? fighter : 17, eff === 89);
      else if (eff === 92) this.fx92(17);
      else if (eff === 121) this.fx121();
      else if (eff) this.cmcCFx(eff, rx, ry);
      yield;
    }
  },
});

// ---------- 2883 / 2884 悟飯ちゃん / 悟空さを巻き込むでねえ (783 琪琪＆比克 / 784 琪琪＆貝吉塔): the other one charges (back
// 201) beside 琪琪 (back 116), who rushes off with a "!" (DB3-style after-image), comes back in from the left and
// headbutts the enemy, then is knocked back (damage 22 with ZG 打撃4) ----
Object.assign(ComboDuel.prototype, {
  * cmcCChichi() {
    const st = this.st, A = this.A, G = this.G, other = this.combo === 783 ? 4 : 12, chichiLead = this.lead === 10;
    let row1 = 0; // @scombo_cha1_anime_type (琪琪 from 40)
    for (let f = 0; f <= 298; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        if (!chichiLead) st.chrBack(10, true, row1, STD_CHAX + f * 8 + 16 - 160, STD_Y);
        else { st.v.ax = f <= 20 ? -8 : 0; st.chrBack(other, true, row1, STD_CHAX + f * 8 + 16, STD_Y); }
      }
      if (f >= 40 && f <= 59) {
        if (chichiLead && f === 40) A.x += 160;
        st.v.ax = 0; st.v.ay = 0;
        this.chg(other);
        st.chrBack(10, true, row1, A.x - 160, STD_Y);
      }
      if (f === 60) { A.sp = true; row1 = 5; st.chrBack(10, true, row1, A.x - 160, STD_Y); this.se('Z3 変身'); }
      if (f >= 61 && f <= 200) {
        if (f === 150) { audio.seStop(); this.se('Z1 気を溜める'); }
        st.aura(224 - 160, 88); st.ba.frame--;
        st.chrBack(10, true, row1, A.x - 160, STD_Y);
      }
      if (f === 201) {
        audio.seStop();
        row1 = 6;
        this.se('Z1 飛ぶ');
        st.aura(224 - 160, 88); st.ba.frame--;
        st.chrBack(10, true, row1, A.x - 160 + 24, STD_Y);
        A.y = -200;
      }
      if (f >= 202 && f <= 239) {
        if (f === 202) this.se('Z3 避ける');
        if (f % 4 === 0) st.back(SPARK, 0, 48, 64, 64, A.x, STD_Y + 30);
        st.ba.frame--;
        const x = A.x - 160 + (f - 202 + 1) * 24;
        st.chrBack(10, true, row1, x, STD_Y);
        if (f - 202 >= 4) st.back(P.surprise, 0, 0, 16, 16, x + 20, STD_Y);
      }
      if (f === 240) { row1 = 6; st.ef.frame = 0; st.ef.type = 0; }
      if (f === 250) {
        this.out();
        A.y = STD_Y; A.x = -146;
        this.chg(10); this.pose(A, 6, true);
        this.se('Z1 飛ぶ');
      }
      if (f >= 251 && f <= 277) { A.x += 16; if (f - 251 >= 4) st.back(P.surprise, 0, 0, 16, 16, A.x + 20, STD_Y); }
      if (f >= 278 && f <= 297) {
        const k = f - 278;
        if (k <= 3) { G.x += 36; this.pose(G, 16, false); if (k === 0) this.se('Z1 強打'); } else if (k <= 7) { G.x -= 36; this.pose(G, 0, false); }
        if (k <= 1) { this.pose(A, 16, false); A.y -= 24; } else if (k === 2) { A.y -= 12; A.x -= 24; } else if (k <= 4) A.x -= 12;
        else if (k === 5) { A.y += 12; A.x -= 24; } else if (k <= 7) A.y += 24;
        else if (k >= 16 && k <= 18) { if (k === 16) this.se('Z1 飛ぶ'); A.x += 24; } else if (k === 19) this.pose(A, this.combo === 783 ? 3 : 1);
      }
      if (f === 298) { this.fromat(); yield; break; } // (@tec_kyouda_se: damage 22 with ZG 打撃4)
      this.mv();
      yield;
    }
  },
});

// ---------- 2885 バーダック一味 (785): the five come in, 巴達克 in the middle with 托馬・賽莉帕 beside him and 托特波・
// 潘布金 behind, all charge, then the huge blue wave (effect 358) and on the enemy (353) ----
Object.assign(ComboDuel.prototype, {
  * cmcCBardockCrew() {
    const st = this.st, A = this.A, lead = this.who(this.lead) === this.who(16) ? 16 : this.lead;
    // 1-39 by the lead: his movement [ax, ay, until], then the other four [id, dx, y] (x = STANDARD_CHAX + 8f + dx)
    const ENTER = {
      16: [-4, 0, 24, [[27, 24, -48], [28, 24, 48], [29, -48, -72], [30, -48, 72]]],
      27: [0, -2, 25, [[16, -68, 0], [28, 24, 48], [29, -48, -72], [30, -48, 72]]],
      28: [0, 2, 25, [[16, -68, 0], [27, 24, -48], [29, -48, -72], [30, -48, 72]]],
      29: [-3, -3, 25, [[16, -68, 0], [27, 24, -48], [28, 24, 48], [30, -48, 72]]],
      30: [-3, 3, 25, [[16, -68, 0], [27, 24, -48], [28, 24, 48], [29, -48, -72]]],
    }[lead];
    const rows = { 27: 0, 28: 0, 29: 0, 30: 0 }; // @scombo_cha1..4_anime_type
    const four = () => { // 40 on: 托馬 / 賽莉帕 beside him, 托特波 / 潘布金 behind (back 116-122)
      st.chrBack(27, true, rows[27], A.x + 92, STD_Y - 48);
      st.chrBack(28, true, rows[28], A.x + 92, STD_Y + 48);
      st.chrBack(29, true, rows[29], 194, STD_Y - 72);
      st.chrBack(30, true, rows[30], 194, STD_Y + 72);
    };
    let eff = 0;
    for (let f = 0; f <= 327; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        const [ax, ay, until, others] = ENTER;
        st.v.ax = f < until ? ax : 0; st.v.ay = f < until ? ay : 0;
        for (const [id, dx, dy] of others) st.chrBack(id, true, 0, STD_CHAX + f * 8 + dx, STD_Y + dy);
      }
      if (f >= 40 && f <= 59) { st.v.ax = 0; st.v.ay = 0; A.x = TEC_CENTER - 92; A.y = STD_Y; this.chg(16); four(); }
      if (f === 60) {
        this.se('Z1 ザー'); this.se('Z1 ゴー'); this.se('DB3 気を溜める2'); this.se('Z1 気を溜める6');
        this.pose(A, 4, true);
        Object.assign(rows, { 27: 2, 28: 0, 29: 2, 30: 4 });
        four();
      }
      if (f >= 61 && f <= 189) four();
      if (f === 190) {
        audio.seStop();
        this.se('Z1 エネルギー波2'); this.se('Z1 ゴー'); this.se('DB3 大猿'); this.se('ZG 光線1');
        this.pose(A, 1);
        Object.assign(rows, { 27: 4, 28: 4, 29: 3, 30: 2 });
        eff = 358;
        four();
      }
      if (f >= 191 && f <= 299) four();
      if (f === 300) { st.ef.frame = 0; eff = 0; this.out(); }
      if (f >= 302 && f <= 326) eff = 353;
      if (f === 327) { this.fromat(); yield; break; }
      this.mv();
      if (eff) this.cmcCFx(eff, 346, 84, 3);
      yield;
    }
  },
});

// ---------- 2891 かめはめ乱舞(親子) (791 超悟空・超悟飯・超未來悟飯): the three line up (悟空 in front, the two 悟飯
// above and below), charge, then the huge wave (effect 358) and on the enemy (353) ----
Object.assign(ComboDuel.prototype, {
  * cmcCOyakoRanbu() {
    const st = this.st, A = this.A, lead = this.who(this.lead) === this.who(18) ? 18 : this.who(this.lead) === this.who(26) ? 26 : 14;
    let r1 = 0, r2 = 0, eff = 0, effFrame0 = false;
    for (let f = 0; f <= 329; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        const x = STD_CHAX + f * 8;
        if (lead !== 14) {
          if (f < 16) { st.v.ax = -2; st.v.ay = lead === 18 ? 4 : -4; } else if (f === 16) st.v.ax = 0; else { st.v.ax = 0; st.v.ay = 0; }
          st.chrBack(14, true, r1, x + 16, STD_Y);
          st.chrBack(lead === 18 ? 26 : 18, true, r2, x - 14, STD_Y + (lead === 18 ? -64 : 64));
        } else {
          st.chrBack(26, true, r1, x - 14, STD_Y - 64);
          st.chrBack(18, true, r2, x - 14, STD_Y + 64);
        }
      }
      const two = () => { st.chrBack(26, true, r1, 236, STD_Y - 64); st.chrBack(18, true, r2, 236, STD_Y + 64); };
      if (f >= 40 && f <= 59) { st.v.ax = 0; st.v.ay = 0; this.chg(14); A.x = TEC_CENTER; A.y = STD_Y; two(); }
      if (f === 60) { this.se('Z1 気を溜める'); this.se('Z1 気を溜める2'); this.se('Z1 気を溜める7'); this.pose(A, 2, true); r1 = 5; r2 = 11; two(); }
      if (f >= 61 && f <= 189) two();
      if (f === 190) {
        audio.seStop(); this.se('Z1 エネルギー波'); this.se('ZG 光線1'); this.se('DB3 大猿');
        this.pose(A, 3); r1 = 1; r2 = 12; two(); eff = 358;
      }
      if (f >= 191 && f <= 299) two();
      if (f === 300) { eff = 0; this.out(); }
      if (f === 301) { st.ef.frame = 0; eff = 0; }
      if (f >= 302 && f <= 328) eff = 353;
      if (f === 329) { this.fromat(); yield; break; }
      this.mv();
      if (eff) this.cmcCFx(eff, 356, 70, 0);
      yield;
    }
  },
});

// ---------- 2892 アンドロイドストライク (792 18 號＆17 號): the other flies in, the close-up of the two shaking on the
// vertical bars, flying apart, then 18 號 and 17 號 each pummel the enemy and send it flying, and together the blue
// wave (effect 358) and on the enemy (353) ----
Object.assign(ComboDuel.prototype, {
  * cmcCAndroidStrike() {
    const st = this.st, A = this.A, G = this.G, lead17 = this.lead === 22, p18 = P.strike18[v(177) === 0 ? 0 : 1];
    const AX = [0, 0, -8, -8, -8, -8, -8, -8, -16, -16, -16], AY = [16, 16, 8, 8, 8, 8, 8, 8, 0, 0, 0, -8, -8]; // (then −8 / −16)
    let eff = 0, row2 = 0, color = 0, x18 = 0, y18 = 0, x17 = 0, y17 = 0;
    const flurry = (k, r1, r2) => { // 211-264 / 361-414: blows every 6 frames, the enemy pushed back and forth
      if (k % 12 === 0) { this.pose(A, r1); this.se('Z1 打撃'); } else if (k % 12 === 6) { this.pose(A, r2); this.se('Z1 打撃'); }
      if (k % 6 <= 1) { this.pose(G, 16, false); G.x += 12; } else if (k % 6 <= 3) { this.pose(G, 0, false); G.x -= 12; }
    };
    for (let f = 0; f <= 646; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) { eff = lead17 ? 89 : 90; st.v.ay = f <= 10 ? (lead17 ? 5 : -5) : 0; }
      if (f >= 40 && f <= 59) {
        if (lead17 && f === 40) A.y -= 100;
        st.v.ay = 0;
        this.chg(21); eff = 92;
        if (f === 59) { st.no = 1; eff = 0; st.cut = false; }
      }
      if (f >= 60 && f <= 120) {
        if (f === 60) this.se('DB3 ダッシュ');
        A.y -= 100;
        const [sx, sy] = shake();
        st.back(p18, 0, 0, 250, 356, 98 + sx, sy);
        st.back(P.strike17, 0, 0, 250, 356, 98 + 200 + sx, sy);
      }
      if (f >= 121 && f <= 180) {
        const k = f - 121;
        if (k === 0) { this.se('Z1 飛ぶ'); x18 = 98; y18 = 0; x17 = 298; y17 = 0; }
        const dx = k < AX.length ? AX[k] : -8, dy = k < AY.length ? AY[k] : -16;
        x18 += dx * 1.5; y18 += dy * 1.5; x17 -= dx * 1.5; y17 -= dy * 1.5;
        st.back(p18, 0, 0, 250, 356, x18, y18);
        st.back(P.strike17, 0, 0, 250, 356, x17, y17);
        if (f === 180) { st.no = 0; eff = 0; st.cut = true; }
      }
      if (f >= 181 && f <= 210) {
        if (f === 181) { this.se('Z1 高速移動'); G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); }
        st.after(CENTER_ENEX - 48, STD_Y + 26);
      }
      if (f >= 211 && f <= 264) {
        if (f === 211) { A.x = CENTER_ENEX - 48; A.y = STD_Y; A.sp = false; }
        flurry(f - 211, 1, 2);
      }
      if (f >= 265 && f <= 330) { // 18 號 backs off and kicks it up and away
        const k = f - 265;
        this.pose(G, 0, false);
        if (k <= 7) { if (k === 0) { this.se('Z1 飛ぶ'); this.pose(A, 0); } A.x -= 16; A.y += 4; }
        else if (k <= 25 && k >= 24) { this.pose(A, 16); A.x += 32; A.y -= 8; }
        else if (k >= 26 && k <= 27) { this.pose(A, 3); A.x += 32; A.y -= 8; if (k === 27) this.se('Z1 強打'); }
        if (k >= 27) { G.x += 24; G.y -= 8; this.pose(G, 17, false); }
      }
      if (f >= 331 && f <= 360) { // it comes back down from the lower left (after-image)
        if (f === 331) { A.x = 32; A.y = -200; this.se('Z1 高速移動'); }
        st.after(CENTER_ENEX - 48, STD_Y + 26);
        G.x = CENTER_ENEX - 32 * (360 - f); G.y = STD_Y + 8 * (360 - f);
        if (f - 331 === 12) this.pose(G, 16, false);
        if (f - 331 === 25) this.pose(G, 0, false);
      }
      if (f >= 361 && f <= 414) {
        if (f === 361) { A.x = CENTER_ENEX - 48; A.y = STD_Y; A.sp = false; this.chg(22); }
        flurry(f - 361, 3, 4);
      }
      if (f >= 415 && f <= 480) { // 17 號 kicks it down and away
        const k = f - 415;
        this.pose(G, 0, false);
        if (k <= 7) { if (k === 0) { this.se('Z1 飛ぶ'); this.pose(A, 0); } A.x -= 16; A.y -= 4; }
        else if (k <= 25 && k >= 24) { this.pose(A, 16); A.x += 32; A.y += 8; }
        else if (k >= 26 && k <= 27) { this.pose(A, 2); A.x += 32; A.y += 8; if (k === 27) this.se('ZG 打撃4'); }
        if (k >= 27) { G.x += 24; G.y += 8; this.pose(G, 17, false); }
      }
      if (f >= 481 && f <= 530) { if (f === 481) { this.se('Z1 飛ぶ'); this.pose(A, 16); } A.y -= 20; }
      if (f >= 531 && f <= 619) {
        if (f === 531) {
          A.x = TEC_CENTER; A.y = STD_Y - 50;
          this.chg(21); this.pose(A, 0, true);
          row2 = 0; eff = 0; st.ef.frame = 0; st.ef.type = 0;
          this.pose(G, 0, false);
        }
        if (f === 541) { this.pose(A, 1); row2 = 1; this.se('ZG 光線1'); this.se('Z1 エネルギー波2'); color = 3; eff = 358; }
        st.chrBack(22, true, row2, TEC_CENTER, STD_Y + 50);
      }
      if (f === 620) { A.y = -200; eff = 0; st.ef.frame = 0; st.ef.type = 0; this.out(); }
      if (f >= 621 && f <= 645) eff = 353;
      if (f === 646) { this.fromat(); yield; break; }
      this.mv();
      if (eff === 89 || eff === 90) this.fx8990(lead17 ? 21 : 22, eff === 89);
      else if (eff === 92) this.fx92(22);
      else if (eff) this.cmcCFx(eff, 340, 74, color);
      yield;
    }
  },
});

// ---------- 2893-2898 あの時の借りを返すよ！… (793-795 天津飯 / 796-798 餃子 ＆ 18 / 16 / 17 號) and 2899 流派を超えた連携
// (799 天津飯＆龜仙人): one program for the six (all.rb 107479-109803: the fighter's half, then the same rescue, then
// each android's own finisher). If the android (龜仙人 for 2899) started it, he walks off and the fighter comes in
// first (back 128); 天津飯's 新気功砲 (his close-up with white flashes, the 気功砲 column, back 9) or 餃子's どどん波
// (effects 237 / 235, his close-up, the huge wave 295, the middle wave 297); he falls exhausted; the android flies in
// and kicks the enemy away, catches him, then fires: 18 號 the blue energy wave (her close-up, the sparks gathering,
// effects 235 / 289, then 239 / 240), 16 號 the ヘルズフラッシュ (the lines, back 106; his close-up, 235 / 275, then the
// blue half circle 265), 17 號 the 電撃地獄玉 (his close-up, 235 / 289, the blue beam, then the blue ball 271) ----
Object.assign(ComboDuel.prototype, {
  // the first one (the android / 龜仙人 who started it) walks off left while `id` comes in (all.rb 107486)
  * cmcCSwapIn(id) {
    const st = this.st, A = this.A;
    let step = 0;
    for (let f = 0; f <= 60; f++) {
      if (f === 0) this.se('Z1 逃げる');
      if (step <= 20) step++;
      st.v.ax = -16;
      this.cmcCComeIn(id, step);
      if (f === 60) { st.v.ax = 0; this.chg(id); A.x = TEC_CENTER; }
      this.mv();
      yield;
    }
  },
  // the sparks gathering at (cx, cy) (@genkitama_kanri_*: eight directions, each starts at random, 15 frames, faster
  // after 10)
  cmcCGather(parts, cx, cy, k, end) {
    const D = [[0, -2], [2, -2], [2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2]];
    if (k >= end) return;
    parts.forEach((fr, i) => {
      if (fr >= 15) { parts[i] = 0; return; }
      if (fr > 0) {
        const [ix, iy] = D[i], gx = 18 * ix, gy = 18 * iy;
        const [x, y] = fr <= 10 ? [cx - gx + fr * ix, cy + gy - fr * iy] : [cx - gx + 10 * ix + (fr - 10) * 2 * ix, cy + gy - 10 * iy - (fr - 10) * 2 * iy];
        this.st.back(P.spark, 0, 0, 8, 10, x, y);
        parts[i]++;
      } else if (end - k > 15 && rand(7) === 0) parts[i] = 1;
    });
  },
  // 天津飯's 新気功砲 (2893 0-550 / 2899 301-851): `school` 2899 (the cut to the enemy with set_chr_display_out)
  * cmcCKikou(school) {
    const st = this.st, A = this.A, G = this.G;
    for (let k = 0; k <= 550; k++) {
      if (k === 0) {
        if (school) { A.x = TEC_CENTER; A.y = STD_Y; G.y = -200; } else st.ba.frame = 0;
        this.chg(8);
        this.se('Z3 変身');
        this.pose(A, 0, true);
      }
      if (k >= 1 && k <= 128) { st.aura(228, 88); if (k === 128) st.no = 3; }
      if (k >= 129 && k <= 329) {
        if (k === 129 || k === 170) audio.seStop();
        if (k === 129) this.se('Z1 気を溜める4');
        A.y = -160;
        st.back(P.kikou, 0, 0, 170, 160, 208, 98);
        if ([170, 210, 250, 290].some((s) => k >= s && k <= s + 3)) { st.white(FLASH_ON); if ([170, 210, 250, 290].includes(k)) this.se('Z1 エネルギー波'); }
      }
      if (k === 330) {
        audio.seStop();
        st.bars = false; st.ef.frame = 0; st.ef.type = 0; st.no = 0;
        if (school) this.out();
        else { st.cutFlag = false; G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); }
        this.se('Z1 ザー'); this.se('Z1 ゴー');
      }
      if (k >= 341) {
        st.kikou();
        if ([370, 410, 450, 490].some((s) => k >= s && k <= s + 3)) { st.white(school ? FLASH_ON : FLASH_OFF); if ([370, 410, 450, 490].includes(k)) this.se('Z1 エネルギー波'); }
      }
      this.mv();
      yield;
    }
  },
  // 餃子's どどん波 (2896 0-347)
  * cmcCDodonpa() {
    const st = this.st, A = this.A, G = this.G;
    let eff = 0, rx = 306, ry = 94;
    for (let f = 0; f <= 347; f++) {
      rx = 306; ry = 94;
      if (f === 0) { this.chg(9); this.se('Z3 変身'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 199) {
        st.aura(228, 88);
        rx = 290; ry = 132;
        const k = f - 1;
        if (k >= 30 && k <= 74) { if (k === 30) this.se('Z1 気を溜める'); this.pose(A, 7); eff = 237; }
        if (k >= 75) { rx -= 8; ry -= 16; eff = 235; }
      }
      if (f === 200) { audio.seStop(); eff = 0; st.ef.frame = 0; st.ef.type = 0; A.y = -200; this.se('Z1 エネルギー波2'); }
      if (f >= 201 && f <= 310) { st.back(P.dodonpa, 0, 0, 192, 168, 120, 90); eff = 295; }
      if (f === 311) { eff = 0; st.ef.frame = 0; st.ef.type = 0; G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); }
      if (f >= 321) { ry = 132; eff = 297; if (f === 347) eff = 0; }
      this.mv();
      if (eff) this.cmcCFx(eff, rx, ry, 0);
      yield;
    }
  },
  * cmcCOwe() {
    const st = this.st, A = this.A, G = this.G;
    const fighter = this.combo <= 795 ? 8 : 9, android = { 793: 21, 794: 23, 795: 22, 796: 21, 797: 23, 798: 22 }[this.combo];
    if (this.lead === android) yield* this.cmcCSwapIn(fighter); else { this.mv(); yield; } // (the frame that turns @btl_ani_tokusyu_flag on)
    if (fighter === 8) yield* this.cmcCKikou(false); else yield* this.cmcCDodonpa();
    // 551-670: the fighter falls, spent
    for (let f = 551; f <= 670; f++) {
      if (f === 551) { A.x = TEC_CENTER; A.y = STD_Y - 96; audio.seStop(); this.se('Z1 死亡1'); A.sp = false; this.pose(A, 16); G.y = -200; }
      if (f - 551 <= 20) { A.x -= 4; A.y += 4; } else { this.pose(A, 17); A.x -= 2; A.y += 4; }
      this.mv(); yield;
    }
    // 671-710: the bars and the cut-in again, the enemy comes in from the right
    for (let f = 671; f <= 710; f++) {
      if (f === 671) { st.cutFlag = true; st.cut = true; st.bars = true; G.x = 720; G.y = STD_Y; this.se('Z1 飛ぶ'); }
      if (f - 671 <= 36) G.x -= 12;
      this.mv(); yield;
    }
    // 711-750: the android flies in from the lower left and kicks it away
    const kick = { 21: [9, 3], 23: [8, 0], 22: [4, 1] }[android]; // @scombo_cha1_anime_type flying, then after the kick
    let ax = 0, ay = 0, row = kick[0];
    for (let f = 711; f <= 750; f++) {
      const k = f - 711;
      if (k === 0) { this.se('Z1 飛ぶ'); ax = -184; ay = 204; }
      if (k <= 20) { ax += 24; ay -= 4; } else if (k === 21) {
        ay = STD_Y; row = kick[1];
        G.x += 20; G.y -= 8; this.se('Z1 強打'); this.pose(G, 16, false);
      } else { G.x += 20; G.y -= 8; }
      st.chrBack(android, k <= 20, row, ax, ay);
      this.mv(); yield;
    }
    // 751-820: the fighter comes down beside the android, who stands; 821-850: he walks off, the android steps up
    for (let f = 751; f <= 850; f++) {
      const k = f - 751;
      if (k === 0) { row = 0; A.x = TEC_CENTER; A.y = -124; this.pose(A, 17); }
      if (f <= 820) {
        if (k <= 60) {
          A.x -= 2; A.y = Math.min(STD_Y, A.y + 4);
          if (k === 57) { this.pose(A, 16); this.se('Z1 吹っ飛ぶ止まる'); }
        }
        if (k === 65) this.pose(A, 0);
      } else {
        if (f === 821) this.se('Z1 飛ぶ');
        A.x -= 16;
        ax = Math.max(TEC_CENTER, ax - 4);
      }
      st.chrBack(android, false, row, ax, ay);
      this.mv(); yield;
    }
    // 851 on: the android's finisher
    yield* this[{ 21: 'cmcCWave18', 23: 'cmcCHells16', 22: 'cmcCThunder17' }[android]](ax, ay);
  },
  // 851: the android in the attacker's place (@btl_ani_cha_chg_no = @scombo_cha1, where it stands)
  cmcCAndroidAt(id, x, y, row) {
    this.chg(id);
    this.A.x = x; this.A.y = y;
    this.pose(this.A, row, true);
  },
  * cmcCWave18(x, y) { // 2893 / 2896 851-: 18 號's energy wave
    const st = this.st, A = this.A, parts = [0, 0, 0, 0, 0, 0, 0, 0];
    let eff = 0, rx = 302, ry = 62;
    for (let k = 0; k <= 428; k++) {
      rx = 302; ry = 62;
      if (k === 0) { this.cmcCAndroidAt(21, x, y, 2); eff = 0; st.ef.frame = 0; st.ef.type = 0; this.se('DB3 気を溜める2'); this.se('Z1 気を溜める'); st.cut = false; }
      if (k >= 1 && k <= 350) {
        st.no = 4; A.y = -160;
        st.back(P.wave18[v(177) === 1 ? 1 : 0], 0, 0, 296, 220, 138, 96);
        this.cmcCGather(parts, 302 + 12, 62 + 12, k, 360);
        if (k === 91) eff = 235;
        if (k === 91 || k === 181) { this.se('DB3 気を溜める2'); this.se('Z1 気を溜める'); }
        if (k > 241) { eff = 289; rx -= 16; ry -= 16; }
        if (k === 350) { st.cut = true; st.no = 0; }
      }
      if (k >= 351 && k <= 390) {
        if (k === 351) { this.se('Z1 エネルギー波2'); st.ef.frame = 0; st.ef.type = 0; }
        A.y = STD_Y; this.pose(A, 10, true);
        eff = 239; rx = 338; ry = 104;
      }
      if (k === 391) { st.bars = true; st.cut = true; st.cutFlag = true; eff = 0; st.ef.frame = 0; st.ef.type = 0; st.no = 0; this.out(); }
      if (k >= 401 && k <= 427) { ry = 106; eff = 240; }
      if (k === 428) { this.fromat(); yield; break; }
      this.mv();
      if (eff) this.cmcCFx(eff, rx, ry, 3);
      yield;
    }
  },
  * cmcCHells16(x, y) { // 2894 / 2897 851-: 16 號's ヘルズフラッシュ
    const st = this.st, A = this.A, parts = [0, 0, 0, 0, 0, 0, 0, 0];
    let eff = 0, rx = 348, ry = 60;
    for (let k = 0; k <= 338; k++) {
      rx = 348; ry = 60;
      if (k === 0) { this.cmcCAndroidAt(23, x, y, 4); this.se('DB3 気を溜める2'); }
      if (k >= 1 && k <= 128) {
        this.cmcCGather(parts, 338 - 14, 156 + 2, k, 128);
        if (k === 128) { st.bars = false; st.cut = false; st.cutFlag = false; }
      }
      if (k >= 129 && k <= 300) {
        this.cmcCLines();
        A.y = -160;
        const d = k >= 231 && k <= 233 ? 2 : k === 234 ? 4 : k === 235 ? 2 : 0; // (the original's own shake: 2, 2, 2, 4, 2)
        st.back(P.hells, 0, 0, 302, 220, 56 - d, 96 - d);
        if (k >= 140 && k <= 230) { if (k === 140) this.se('Z1 気を溜める'); rx = 362; ry = 244; eff = 235; }
        if (k === 231) { audio.seStop(); this.se('Z1 エネルギー波'); st.ef.rtype = 0; st.ef.rframe = 0; eff = 275; }
      }
      if (k === 301) { st.bars = true; st.cut = true; st.cutFlag = true; eff = 0; st.ef.frame = 0; st.ef.type = 0; st.no = 0; this.out(); }
      if (k >= 311 && k <= 337) { ry = 114; eff = 265; }
      if (k === 338) { this.fromat(); yield; break; }
      this.mv();
      if (eff) this.cmcCFx(eff, rx, ry, 3);
      yield;
    }
  },
  * cmcCThunder17(x, y) { // 2895 / 2898 851-: 17 號's 電撃地獄玉
    const st = this.st, A = this.A, parts = [0, 0, 0, 0, 0, 0, 0, 0];
    let eff = 0, rx = 348, ry = 60;
    for (let k = 0; k <= 368; k++) {
      rx = 348; ry = 60;
      if (k === 0) { this.cmcCAndroidAt(22, x, y, 2); this.se('DB3 気を溜める2'); }
      if (k >= 1 && k <= 128) {
        this.cmcCGather(parts, 338 - 14, 156 + 2 + 10, k, 128);
        if (k === 128) { st.cut = false; st.cutFlag = false; }
      }
      if (k >= 129 && k <= 330) {
        st.no = 4; A.y = -160;
        st.back(P.thunder, 0, 0, 296, 220, 170, 66);
        if (k >= 140 && k <= 260) {
          if (k === 140) this.se('Z1 気を溜める');
          rx = 302; ry = 224; eff = 235;
          if (k > 200) { eff = 289; rx -= 16; ry -= 16; }
        }
        if (k >= 261) {
          if (k === 261) { eff = 0; audio.seStop(); this.se('Z1 エネルギー波'); }
          st.ef.rtype = 0; st.ef.rframe = 0;
          st.back(P.beamBlue, 0, 0, 316, 158, 162, 220);
        }
      }
      if (k === 331) { st.bars = true; st.cut = true; st.cutFlag = true; eff = 0; st.ef.frame = 0; st.ef.type = 0; st.no = 0; this.out(); }
      if (k >= 341 && k <= 367) { ry = 106; st.ef.type = 4; eff = 271; }
      if (k === 368) { this.fromat(); yield; break; }
      this.mv();
      if (eff) this.cmcCFx(eff, rx, ry, 3);
      yield;
    }
  },

  // 2899 流派を超えた連携 (799): 龜仙人's 萬國驚天掌 (green aura, the green current 283 / 44) holds the enemy shaking, then
  // 天津飯's 新気功砲
  * cmcCSchool() {
    const st = this.st, A = this.A, G = this.G;
    if (this.lead === 8) yield* this.cmcCSwapIn(24); else { this.mv(); yield; }
    let eff = 0;
    for (let f = 0; f <= 266; f++) {
      if (f === 0) { this.chg(24); this.se('Z3 変身'); st.ba.frame = 0; this.pose(A, 4, true); }
      if (f >= 1 && f <= 89) st.aura(218, 88, 1);
      if (f === 90) { this.pose(A, 5); audio.seStop(); this.se('DB3 エネルギー波1'); eff = 283; }
      if (f === 129) { eff = 0; st.ef.frame = 0; st.ef.type = 0; }
      if (f === 139) { eff = 0; st.ef.frame = 0; st.ef.type = 0; G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); A.y = -200; }
      if (f >= 140 && f <= 166) eff = 44;
      if (f >= 167) {
        if (f === 167) { this.se('DB3 SE091'); eff = 0; }
        st.v.gx = (f - 167) % 2 === 0 ? 6 : -6;
        if (f === 266) st.v.gx = 0;
      }
      this.mv();
      if (eff) this.cmcCFx(eff, 340, 150, 1);
      yield;
    }
    yield* this.cmcCKikou(true);
    this.fromat(); // 9999
    yield;
  },
});

cmcFilms({
  780: ['cmcCBakuryoku', 'cmcD43'], 781: ['cmcCDoubleAttack', 'cmcD42'], 782: ['cmcCDoubleAttack', 'cmcD42'],
  783: ['cmcCChichi', 'cmcD22k'], 784: ['cmcCChichi', 'cmcD22k'], 785: ['cmcCBardockCrew', 'cmcD44'], 791: ['cmcCOyakoRanbu', 'cmcD44'],
  792: ['cmcCAndroidStrike', 'cmcD43'], 793: ['cmcCOwe', 'cmcD43'], 794: ['cmcCOwe', 'cmcD44'], 795: ['cmcCOwe', 'cmcD43'],
  796: ['cmcCOwe', 'cmcD43'], 797: ['cmcCOwe', 'cmcD44'], 798: ['cmcCOwe', 'cmcD43'], 799: ['cmcCSchool', 'cmcD47'],
});

export const CMC3_SOUNDS = ['Z1 逃げる', 'Z3 変身', 'Z1 気を溜める', 'Z1 エネルギー波', 'Z1 ザー', 'Z1 ゴー', 'Z1 高速移動', 'Z1 打撃', 'Z3 打撃',
  'Z1 強打', 'Z1 気を溜める2', 'Z1 エネルギー波2', 'Z1 飛ぶ', 'Z3 避ける', 'DB3 気を溜める2', 'Z1 気を溜める6', 'DB3 大猿', 'ZG 光線1',
  'Z1 気を溜める7', 'DB3 ダッシュ', 'ZG 打撃4', 'Z1 気を溜める4', 'Z1 死亡1', 'Z1 吹っ飛ぶ止まる', 'DB3 エネルギー波1', 'DB3 SE091'];

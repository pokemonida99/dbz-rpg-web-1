// (cmd part b: films ported by a helper, merged into src/combo_z3b.js at the end)
import { ComboDuel } from './combo-anime.js?v=20261103-1518';
import { films, COMMON, pic, STANDARD_CHAX, STANDARD_CHAY, STANDARD_ENEX, STANDARD_ENEY, CENTER_CHAX, CENTER_ENEX, TEC_CENTER_CHAX,
  FLASH_Y_SIZE_CUTIN_ON, FLASH_Y_SIZE_CUTIN_OFF, by, Z3, BLINK, v } from './combo_z3b.js?v=20261103-1518';

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
const OYAKO = { 839: [18, 7, 0, 11, 12, 3], 840: [26, 10, 36, 4, 1, 1] }; // the son, his types at 91 / 441 / 508 (t2), x shift at 148-266, his aura colour
Object.assign(ComboDuel.prototype, {
  * cmdOyakoRanbu() {
    const z = this.cmd, A = this.A, G = this.G, [son, t2a, sx, t2b, t2c, sc] = OYAKO[this.combo];
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

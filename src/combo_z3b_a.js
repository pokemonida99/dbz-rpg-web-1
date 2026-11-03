// (cmd part a: films ported by a helper, merged into src/combo_z3b.js at the end)
import { ComboDuel } from './combo-anime.js?v=20261103-1518';
import { rand } from './core.js?v=20261103-1518';
import { RAY_SPEED as RS } from './anime.js?v=20261103-1518';
import { films, COMMON, pic, STANDARD_CHAX, STANDARD_CHAY, STANDARD_ENEX, STANDARD_ENEY, CENTER_CHAX, CENTER_ENEX, TEC_CENTER_CHAX,
  FLASH_Y_SIZE_CUTIN_ON, FLASH_Y_SIZE_CUTIN_OFF, by, Z3, BLINK, v } from './combo_z3b.js?v=20261103-1518';

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

// helpers: `g` in any of the inclusive ranges [a, b, a, b, …]; pic_shake_cal (one of the eight directions or none)
const inR = (g, ...r) => { for (let i = 0; i < r.length; i += 2) if (g >= r[i] && g <= r[i + 1]) return true; return false; };
function shake(dot) {
  const k = rand(9) + 1;
  return [[-dot, dot], [0, dot], [dot, dot], [-dot, 0], [0, 0], [dot, 0], [-dot, -dot], [0, -dot], [dot, -dot]][k - 1];
}

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
const BOOM3 = pic('戦闘アニメ_爆発3.PNG'), SPARK = pic('戦闘アニメ.PNG');

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

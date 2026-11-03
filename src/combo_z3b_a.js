// (cmd part a: films ported by a helper, merged into src/combo_z3b.js at the end)
import { ComboDuel } from './combo-anime.js?v=20261103-1518';
import { rand } from './core.js?v=20261103-1518';
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

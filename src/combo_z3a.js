// S-combo films of the original's anime_pattern 28xx (docs/anim-f-plan.md cmc), ported frame by frame from
// Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) on the stage of src/combo_z3a_stage.js (read its header first).
// The other films of this group are in src/combo_z3a2.js and src/combo_z3a3.js (imported at the end).
import { audio, rand } from './core.js?v=20261108-0722';
import { STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261108-0722';
import { ComboDuel } from './combo-anime.js?v=20261108-0722';
import { pic, blt, cmcFilms, cmcPictures, STD_CHAX, SPARK } from './combo_z3a_stage.js?v=20261108-0722';

// ---------- 2846 ダブル残像拳 (746 悟空＆克林 / 749 克林＆龜仙人, all.rb 101893) ----------
// the lead rises (or sinks) while the other flies in below (effect 90) / above (89); the two side by side (back 116),
// both vanish (back 48 ×2), then after-images all round the enemy (DB3 残像拳: the one and the other at random places
// every frame), and one of them strikes (damage 22 with ZG 打撃4)
Object.assign(ComboDuel.prototype, {
  * cmcZanzou() {
    const st = this.st, A = this.A, kg = this.combo === 746;
    const [top, low] = kg ? [3, 6] : [6, 24]; // (@btl_ani_cha_chg_no / @scombo_cha1)
    const leadLow = this.who(this.lead) === this.who(low); // the one below started it: he sinks, the other flies in above
    for (let f = 0; f <= 231; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        this.fx8990(leadLow ? top : low, leadLow);
        st.v.ay = f <= 10 ? (leadLow ? 5 : -5) : 0;
      }
      if (f >= 40 && f <= 60) {
        if (f === 40) { st.v.ay = 0; if (leadLow) A.y -= 100; this.as(top, 0); }
        if (f === 60) this.pose(A, 0, true);
        st.chrBack(low, true, 0, A.x, A.y + 100);
      }
      if (f >= 61 && f <= 100) {
        A.y = -200;
        if (f === 61) this.se('Z1 高速移動');
        st.after(TEC_CENTER, STD_Y + 76); st.ba.frame--;
        st.after(TEC_CENTER, STD_Y + 76 - 100);
      }
      if (f === 110) { this.out(); st.bars = true; }
      if (f >= 121 && f <= 229) {
        if (f === 121) this.se('DB3 残像拳');
        const at = () => { let x = rand(224 - 40) + 40, y = rand(198 - 64) + 64; if (x % 2) x++; if (y % 2) y++; return [x, y]; };
        [A.x, A.y] = at();
        const [x, y] = at();
        st.chrBack(low, true, 0, x, y);
      }
      if (f === 230) {
        A.x = TEC_CENTER - 16; A.y = STD_Y;
        this.pose(A, 1, true);
        if (rand(2) === 1) this.as(low, 1); // (one of the two at random)
      }
      if (f === 231) { this.fromat(); yield; break; }
      this.mv();
      yield;
    }
  },
});
cmcFilms({ 746: ['cmcZanzou', 'cmcD22k', false], 749: ['cmcZanzou', 'cmcD22k', false] }); // (756 / 759: @tec_back_small only in Z3 — on)


// ---------- the ませんこう / 魔貫光殺砲 pairs and triples ----------
const v = (n) => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[n]) || 0; };
const noSword = () => [1, 2, 3].includes(v(173)); // 特蘭克斯 without his sword: other rows (変数 173)
const MAKANKO_CUT = { 4: pic('Z3_必殺技_カットイン_魔貫光殺砲(ピッコロ).png'), 25: pic('Z3_必殺技_カットイン_魔貫光殺砲(未来ゴハン).png'),
  26: pic('Z3_必殺技_カットイン_魔貫光殺砲(未来超ゴハン).png'), 15: pic('Z3_必殺技_カットイン_魔貫光殺砲(若者).png') }; // 648×64
const BALL4 = pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'), BALL4_BLUE = pic('Z3_戦闘_必殺技_エネルギー弾4(青).PNG'); // effect 305: 190×126
const MASENKO2 = pic('Z3_戦闘_必殺技_エネルギー弾4(ダブルませんこう_ゴハン_トランクス).PNG'); // effect 306: 2 rows of 190×126
const MASENKO3 = pic('Z3_戦闘_必殺技_トリプル魔閃光.png'); // effect 343: 204 high
const DODOHAME_HIT = pic('Z3_戦闘_必殺技_どどはめはエネルギー波_ヒット.png'); // effect 282: 400×128
const MID_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG'); // effect 302: 400×80, the lower half
const BIG_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_大_敵_青.PNG'); // effect 240 (@ray_color 3): 400×122
const MAKANKO = pic('Z3_戦闘_必殺技_魔貫光殺砲.PNG'); // effects 307 / 308 / 342 / 344 / 345: rows of 400×64 (0 → right, 1 the head)
const SHAKE = [[-4, 4], [0, 4], [4, 4], [-4, 0], [0, 0], [4, 0], [-4, -4], [0, -4], [4, -4]]; // pic_shake_cal 4 (all.rb 20540)
cmcPictures([...Object.values(MAKANKO_CUT), BALL4, BALL4_BLUE, MASENKO2, MASENKO3, DODOHAME_HIT, MAKANKO, MID_BLUE, BIG_BLUE]);

Object.assign(ComboDuel.prototype, {
  // frames 0-59 of a pair (2826 / 2827 / 2860 / 2869 / 2871): the lead rises (or, the lower one, sinks) while the other
  // flies in below (effect 90) / above (89); from 40 the upper one in the lead's place, the lower one waiting below (92)
  pairIn(f, top, low) {
    const st = this.st, A = this.A, leadLow = this.who(this.lead) === this.who(low);
    if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
    if (f >= 1 && f <= 39) {
      this.fx8990(leadLow ? top : low, leadLow);
      st.v.ay = f <= 10 ? (leadLow ? 5 : -5) : 0;
    }
    if (f >= 40 && f <= 59) {
      if (f === 40) { if (leadLow) A.y -= 100; this.as(top, 0); }
      this.fx92(low);
    }
  },
  // frames 0-59 of a triple (2872 / 2873): the lead moves to his place while the other two fly in from the left (back
  // 116 / 118); from 40 the middle one in the lead's place, the other two above and below him (x 236)
  tripleIn(f, mid, top, low) {
    const st = this.st, A = this.A, lead = this.who(this.lead), X = (d) => STD_CHAX + f * 8 + d;
    if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
    if (f >= 1 && f <= 39) {
      if (lead === this.who(low) || lead === this.who(top)) {
        st.v.ax = f < 16 ? -2 : 0; st.v.ay = f < 16 ? (lead === this.who(low) ? 4 : -4) : 0;
        const other = lead === this.who(low) ? top : low;
        st.chrBack(mid, true, 0, X(16), STD_Y);
        st.chrBack(other, true, 0, X(-14), STD_Y + (other === top ? -64 : 64));
      } else {
        st.chrBack(top, true, 0, X(-14), STD_Y - 64);
        st.chrBack(low, true, 0, X(-14), STD_Y + 64);
      }
    }
    if (f >= 40 && f <= 59) {
      st.v.ax = 0; st.v.ay = 0;
      this.as(mid, 0);
      A.x = TEC_CENTER; A.y = STD_Y;
    }
  },
  // the two (or three) who stand by the lead (back 116 / 118 at x 236)
  flank(top, topRow, low, lowRow) { const st = this.st; st.chrBack(top, true, topRow, 236, STD_Y - 64); st.chrBack(low, true, lowRow, 236, STD_Y + 64); },
  // pic_shake_cal 4: the close-ups shaking; white from 177 behind them, from 179 over everything (61-191)
  makankoCuts(f, list) {
    const st = this.st, [sx, sy] = SHAKE[rand(9)];
    if (f >= 177) st.white(356);
    for (const [id, y] of list) st.back(MAKANKO_CUT[id], 0, 0, 648, 64, -4 + sx, y + sy);
    if (f >= 179) st.white(356);
  },

  // ---- 2826 ダブルませんこう (726 悟飯＆特蘭克斯, all.rb 99545) / 2871 (771 未來悟飯＆特蘭克斯, 104087) / 2820 ギャリックバスター
  // (720 貝吉塔＆特蘭克斯, 99212): the other one above, 特蘭克斯 below, each in a blue aura (back 201 ×2), two blasts fly
  // off (effect 305 balls / 302 beams), then the joined one on the enemy (306 / the big blue beam 240) ----
  * cmcPairBlast() {
    const st = this.st, A = this.A, tr = noSword() ? [3, 13] : [10, 11];
    const [top, [charge, fire], se1, se2, garlic] = { 726: [5, [2, 3], 'Z1 気を溜める3', 'Z1 エネルギー波'], 771: [25, [12, 1], 'Z1 気を溜める3', 'Z1 エネルギー波'],
      720: [12, [5, 6], 'Z1 気を溜める', 'Z1 エネルギー波2', true] }[this.combo];
    let eff = 0;
    for (let f = 0; f <= 306; f++) {
      this.pairIn(f, top, 17);
      if (f === 60) { this.se('Z3 変身'); this.se(se1); this.fx92(17); } // (92 still on)
      if (f >= 61 && f <= 187) {
        st.ef.frame = 0;
        this.pose(A, charge, true);
        st.aura(234, 36, 3); st.ba.frame--;
        st.aura(234, 136, 3); st.ba.frame--;
        st.chrBack(17, true, tr[0], TEC_CENTER, STD_Y + 50);
      }
      if (f >= 188 && f <= 269) {
        if (f === 188) { audio.seStop(); this.se(se2); eff = garlic ? 302 : 305; }
        this.pose(A, fire, true);
        st.chrBack(17, true, tr[1], TEC_CENTER, STD_Y + 50);
      }
      if (f === 270) { A.y = -120; eff = 0; st.ef.frame = 0; st.ef.type = 0; }
      if (f === 280) this.out();
      if (f >= 281 && f <= 305) eff = garlic ? 240 : 306;
      if (f === 306) { this.fromat(); yield; break; }
      if (eff === 305) st.fxStep((k) => { st.front(BALL4, 0, 0, 190, 126, 330 + k.frame * RAY_SPEED, 54); st.front(BALL4_BLUE, 0, 0, 190, 126, 344 + k.frame * RAY_SPEED, 146); });
      if (eff === 302) st.fxStep((k) => { const w = 54 + k.frame * RAY_SPEED; st.front(MID_BLUE, 0, 80, w, 80, 342, 76); st.front(MID_BLUE, 0, 80, w, 80, 344, 168); });
      if (eff === 306) {
        st.fxStep((k) => {
          st.front(MASENKO2, 0, k.rtype * 126, 190, 126, -192 + k.frame * RAY_SPEED, 126);
          if (k.rframe >= 8 && k.rtype === 0) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 8) { k.rtype = 0; k.rframe = 0; }
        });
      }
      if (eff === 240) st.fxStep((k) => st.front(BIG_BLUE, 0, 0, 400, 122, -400 + k.frame * RAY_SPEED, 110));
      this.mv();
      yield;
    }
  },

  // ---- 2827 ダブルまかんこうさっぽう (727 比克＆未來悟飯, all.rb 99640) / 2860 (760 比克＆青年, 102724) / 2869 (769 未來悟飯＆
  // 青年, 103668): the pair, then their 魔貫光殺砲 close-ups shaking (the bars and the cut-in off, the screen going white),
  // the two beams (effect 307 / 342) and the two on the enemy (308) ----
  * cmcMakanko2() {
    const st = this.st, A = this.A;
    const [top, low, rows, lowRows, ray, two] = { 727: [4, 25, [5, 6], [12, 13], [340, 200], [18, -28]], 760: [4, 15, [5, 6], [13, 14], [340, 200], [18, -28]],
      769: [25, 15, [12, 13], [13, 14], [338, 204], [22, -36]] }[this.combo];
    let eff = 0, lowRow = 0;
    for (let f = 0; f <= 309; f++) {
      this.pairIn(f, top, low);
      if (f === 60) {
        this.se('Z3 変身'); this.se('Z1 気を溜める3');
        this.pose(A, rows[0], true);
        lowRow = lowRows[0];
        A.y = -200;
        st.cutFlag = false; st.bars = false;
      }
      if (f >= 61 && f <= 191) {
        this.makankoCuts(f, [[top === 4 ? 4 : this.who(top), 106], [low === 15 ? 15 : this.who(low), 186]]);
        if (f === 191) { audio.seStop(); st.bars = true; }
      }
      if (f >= 192 && f <= 281) {
        st.cut = true; st.cutFlag = true;
        A.y = STD_Y - 50;
        if (f === 221) { this.pose(A, rows[1], true); lowRow = lowRows[1]; this.se('Z1 エネルギー波3'); eff = 307; }
        st.chrBack(low, true, lowRow, TEC_CENTER, STD_Y + 50);
      }
      if (f === 282) { this.se('Z1 衝撃波'); eff = 0; st.ef.frame = 0; st.ef.type = 0; st.cut = true; st.cutFlag = true; this.out(); st.no = 0; }
      if (f >= 283 && f <= 308) eff = 308;
      if (f === 309) { this.fromat(); yield; break; }
      if (eff === 307) {
        st.fxStep((k) => {
          const w = 64 + k.frame * RAY_SPEED;
          st.front(MAKANKO, 0, 64, w, 64, ray[0] + 20, ray[1] - 132);
          st.front(MAKANKO, 0, 64, w, 64, ray[0] + two[0], ray[1] + two[1]);
        });
      }
      if (eff === 308) st.fxStep((k) => { for (const y of [102, 166]) st.front(MAKANKO, 0, 0, 400, 64, -400 + k.frame * RAY_SPEED, y); });
      this.mv();
      yield;
    }
  },

  // ---- 2872 トリプルませんこう (772 悟飯・未來悟飯・特蘭克斯, all.rb 104182): 未來悟飯 in the middle, 悟飯 above, 特蘭克斯 below,
  // three blue auras (back 201 ×3), the three-headed beam (effect 343), then the どどはめは hit on the enemy (282) ----
  * cmcMasenko3() {
    const st = this.st, A = this.A, tr = noSword() ? [3, 13] : [10, 11];
    let eff = 0, rows = [0, 0];
    for (let f = 0; f <= 329; f++) {
      this.tripleIn(f, 25, 5, 17);
      if (f >= 40 && f <= 59) this.flank(5, 0, 17, 0);
      if (f === 60) {
        this.se('Z1 気を溜める'); this.se('Z3 変身');
        this.pose(A, 12, true);
        rows = [2, tr[0]];
        this.flank(5, rows[0], 17, rows[1]);
      }
      if (f >= 61 && f <= 189) {
        const x = A.x - 32, y = A.y - 24;
        st.aura(x, y, 3); st.ba.frame--;
        st.aura(x - 40, y - 66, 3); st.ba.frame--;
        st.aura(x - 40, y + 66, 3); st.ba.frame--;
        st.chrBack(5, true, rows[0], 236, STD_Y - 64); st.ba.frame--;
        st.chrBack(17, true, rows[1], 236, STD_Y + 64);
      }
      if (f === 190) {
        audio.seStop(); this.se('Z1 エネルギー波'); this.se('Z1 怪光線');
        this.pose(A, 1, true);
        rows = [3, tr[1]];
        eff = 343;
      }
      if (f >= 190 && f <= 299) this.flank(5, rows[0], 17, rows[1]);
      if (f === 300) { eff = 0; this.out(); }
      if (f === 301) { st.ef.frame = 0; eff = 0; }
      if (f >= 302 && f <= 328) eff = 282;
      if (f === 329) { this.fromat(); yield; break; }
      if (eff === 343) st.fxStep((k) => st.front(MASENKO3, 0, 0, 64 + k.frame * RAY_SPEED, 204, 302 - 8, 64 - 10));
      if (eff === 282) st.fxStep((k) => st.front(DODOHAME_HIT, 0, 0, 400, 128, -420 + k.frame * RAY_SPEED, 110));
      this.mv();
      yield;
    }
  },

  // ---- 2873 トリプル魔貫光殺法 (773 比克・未來悟飯・青年, all.rb 104324): 比克 in the middle, 未來悟飯 above, 青年 below, their
  // three close-ups shaking, the three beams (effect 344) and the three on the enemy (345) ----
  * cmcMakanko3() {
    const st = this.st, A = this.A;
    let eff = 0, rows = [12, 13];
    for (let f = 0; f <= 309; f++) {
      this.tripleIn(f, 4, 25, 15);
      if (f >= 40 && f <= 59) this.flank(25, 0, 15, 0);
      if (f === 60) {
        this.se('Z3 変身'); this.se('Z1 気を溜める3');
        st.ef.frame = 0;
        this.pose(A, 5, true);
        A.y -= 400;
        st.cutFlag = false; st.bars = false;
      }
      if (f >= 61 && f <= 191) {
        this.makankoCuts(f, [[4, 146], [this.who(25), 42], [15, 250]]);
        if (f === 191) { audio.seStop(); st.bars = true; }
      }
      if (f >= 192 && f <= 281) {
        st.cut = true; st.cutFlag = true;
        if (f === 192) A.y += 400;
        if (f === 221) { this.pose(A, 6, true); rows = [13, 14]; this.se('Z1 エネルギー波3'); eff = 344; }
        this.flank(25, rows[0], 15, rows[1]);
      }
      if (f === 282) { this.se('Z1 衝撃波'); eff = 0; st.ef.frame = 0; st.ef.type = 0; st.cut = true; st.cutFlag = true; this.out(); st.no = 0; }
      if (f >= 283 && f <= 308) eff = 345;
      if (f === 309) { this.fromat(); yield; break; }
      if (eff === 344) st.fxStep((k) => { const w = 64 + k.frame * RAY_SPEED; for (const [x, y] of [[328, 60], [360, 118], [330, 184]]) st.front(MAKANKO, 0, 64, w, 64, x, y); });
      if (eff === 345) st.fxStep((k) => { const x = -400 + k.frame * RAY_SPEED; st.front(MAKANKO, 0, 0, 400, 64, x, 78); st.front(MAKANKO, 0, 0, 400, 64, x + 60, 134); st.front(MAKANKO, 0, 0, 400, 64, x, 190); });
      this.mv();
      yield;
    }
  },
});
cmcFilms({
  726: ['cmcPairBlast', 'cmcD42'], 771: ['cmcPairBlast', 'cmcD42'], 720: ['cmcPairBlast', 'cmcD42'],
  727: ['cmcMakanko2', 'cmcD43'], 760: ['cmcMakanko2', 'cmcD43'], 769: ['cmcMakanko2', 'cmcD43'],
  772: ['cmcMasenko3', 'cmcD43'], 773: ['cmcMakanko3', 'cmcD43'],
});

// ---------- the androids' and their friends' pairs (716 / 718 / 719 / 723) ----------
const SMALL_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_小_敵_青.PNG'); // effects 298 / 299 (@ray_color 3): 400×48, the lower half the head
const KIEN = pic('Z3_戦闘_必殺技_気円斬.png'); // effects 300 / 301: rows of 126×30 (4: thrown)
const BALL = pic('Z3_戦闘_必殺技_エネルギー弾.PNG'); // effects 201 / 202: 128×128 frames (@effect_anime_type 2)
const BOOM3 = pic('戦闘アニメ_爆発3.PNG'); // effect 102: 2 frames of 112×120
const ROCKET_CLOSE = pic('Z3_必殺技_ロケットパンチ(16号・左手).png'); // 382×314
const ROCKET = pic('Z3_戦闘_必殺技_ロケットパンチ.PNG'); // effect 273: 24×14
cmcPictures([SMALL_BLUE, KIEN, BALL, ROCKET_CLOSE, ROCKET]);

Object.assign(ComboDuel.prototype, {
  // ---- 2816 ノンステップバイオレンス (716 18號＆17號, all.rb 98855): 18 above, 17 below; 18 vanishes, flies in from the right
  // and strikes, 17 runs in from the left, 18 kicks the enemy down off the stage, both fly up, then their two blue beams
  // (effect 298) and the two on the enemy (299) ----
  * cmcNonStep() {
    const st = this.st, A = this.A, G = this.G;
    let eff = 0, r17 = 0;
    for (let f = 0; f <= 438; f++) {
      this.pairIn(f, 21, 22);
      if (f >= 60 && f <= 109) this.fx92(22); // (92 still on until 110)
      if (f >= 60 && f <= 100) { A.y = -200; if (f === 60) this.se('Z1 高速移動'); st.after(TEC_CENTER, STD_Y + 76 - 100); }
      if (f === 110) { st.ef.frame = 0; G.x = CENTER_ENEX; G.y = STD_Y; A.x = 640 + 16; A.y = STD_Y; this.pose(A, 8, true); r17 = 16; }
      if (f >= 120 && f <= 160) {
        if (f === 120) this.se('Z1 飛ぶ');
        if (f <= 137) A.x -= 16;
        else if (f <= 141) { this.pose(A, 6, true); if (f === 141) { this.se('Z1 強打'); this.pose(G, 16, false); } } else if (f <= 143) G.x -= 8;
        else if (f <= 145) G.x += 8;
        else if (f === 160) this.pose(G, 0, false);
      }
      if (f >= 161 && f <= 184) {
        this.pose(A, 5, true);
        if (f === 161) this.se('Z1 飛ぶ');
        st.chrBack(22, false, r17, -96 + 16 * (f - 161), STD_Y);
        if (f === 182) r17 = 1;
      }
      if (f >= 185 && f <= 240) {
        if (f === 185) this.se('Z1 強打');
        st.chrBack(22, false, r17, 272, STD_Y);
        if (f <= 186) { this.pose(G, 16, false); G.x += 8; } else if (f <= 188) G.x -= 8;
        else if (f === 203) { this.pose(G, 0, false); r17 = 0; this.pose(A, 8, true); A.y -= 12; this.se('Z1 飛ぶ'); } else if (f >= 204 && f <= 208) A.y -= 12;
        else if (f >= 209 && f <= 211) { A.y += 24; this.pose(A, 7, true); if (f === 211) this.se('ZG 打撃2'); } else if (f >= 212) { this.pose(G, 17, false); G.y += 16; if (f === 227) this.pose(A, 5, true); }
      }
      if (f >= 241 && f <= 280) {
        if (f === 241) this.se('Z1 飛ぶ');
        A.y -= 16;
        this.pose(A, 8, true);
        st.chrBack(22, false, 16, 272, A.y);
      }
      if (f >= 281 && f <= 310) { A.x = TEC_CENTER; A.y = STD_Y - 50; this.pose(A, 0, true); st.chrBack(22, true, 0, A.x, A.y + 100); eff = 0; }
      if (f >= 311 && f <= 409) { if (f === 311) this.se('Z1 怪光線'); this.pose(A, 1, true); st.chrBack(22, true, 1, A.x, A.y + 100); eff = 298; }
      if (f === 410) { st.ef.type = 0; st.ef.frame = 0; eff = 0; this.pose(G, 16, false); this.out(); }
      if (f >= 411 && f <= 437) eff = 299;
      if (f === 438) { this.fromat(); yield; break; }
      if (eff === 298) st.fxStep((k) => { const w = 54 + k.frame * RAY_SPEED; st.front(SMALL_BLUE, 0, 48, w, 48, A.x + 72, A.y + 16); st.front(SMALL_BLUE, 0, 48, w, 48, A.x + 80, A.y + 112); });
      if (eff === 299) st.fxStep((k) => { for (const y of [124, 172]) st.front(SMALL_BLUE, 0, 0, 400, 48, -400 + k.frame * RAY_SPEED, y); });
      this.mv();
      yield;
    }
  },

  // ---- 2818 ヘルズスパイラル (718 18號・17號・16號, all.rb 99002): the other two fly in (back 117 / 119; when 18 starts it the
  // original draws 18 and 16 flying in — 18 twice), 16 above with 18 and 17 below him, all three charging with white
  // flashes (the side bars), then the shock-wave streaks on the enemy (back 1). (Only the first target's film: in the
  // remake a combo has one target.) ----
  * cmcHells() {
    const st = this.st, A = this.A, G = this.G, lead = this.lead;
    for (let f = 0; f <= 298; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        const early = f <= 10;
        if (lead === 21) { st.chrBack(21, false, 0, -142 + 12 * f, STD_Y + 50); st.chrBack(23, false, 0, -124 + 10 * f, STD_Y - 50); st.v.ax = early ? -5 : 0; st.v.ay = early ? 5 : 0; } else if (lead === 22) { st.chrBack(21, false, 0, -96 + 8 * f, STD_Y + 50); st.chrBack(23, false, 0, -124 + 10 * f, STD_Y - 50); st.v.ax = early ? 6 : 0; st.v.ay = early ? 5 : 0; } else { st.chrBack(21, false, 0, -96 + 8 * f, STD_Y + 50); st.chrBack(22, false, 0, -142 + 12 * f, STD_Y + 50); st.v.ay = early ? -5 : 0; }
      }
      if (f >= 40 && f <= 59) {
        if (f === 40) { if (lead === 21) { A.y -= 100; A.x += 50; } else if (lead === 22) { A.y -= 100; A.x -= 60; } this.as(23, 0); }
        st.chrBack(21, false, 0, 216, STD_Y + 50); st.chrBack(22, false, 0, 326, STD_Y + 50);
      }
      if (f >= 60 && f <= 229) {
        if (f === 60) { this.se('Z1 エネルギー波2'); this.se('Z1 ザー'); this.se('Z1 ゴー'); }
        this.pose(A, 5, true);
        st.no = 1;
        st.chrBack(21, true, 3, 216, STD_Y + 50); st.chrBack(22, true, 3, 326, STD_Y + 50);
        if (f % 20 === 0) st.white(296);
      }
      if (f === 230) { st.bars = false; st.fxZero(); this.pose(G, 0, false); this.out(); audio.seStop(); this.se('Z1 ザー'); this.se('Z1 ゴー'); }
      if (f >= 231 && f <= 297) { st.shock(); if (f % 20 === 0) st.white(296); }
      if (f === 298) { this.fromat(); yield; break; }
      this.mv();
      yield;
    }
  },

  // ---- 2819 ダブル気円斬 (719 克林＆18號, all.rb 99119): 克林 above, 18 below, both raise a disc, two discs fly off (effect
  // 300) and come at the enemy (301) ----
  * cmcKienzan2() {
    const st = this.st, A = this.A;
    let eff = 0;
    for (let f = 0; f <= 320; f++) {
      this.pairIn(f, 6, 21);
      if (f >= 60 && f <= 180) {
        A.y = -200;
        if (f === 60) this.se('Z1 気を溜める');
        st.chrBack(6, true, 5, TEC_CENTER, STD_Y - 50); st.chrBack(21, true, 4, TEC_CENTER, STD_Y + 50);
        st.ef.frame = 0;
      }
      if (f >= 181 && f <= 280) {
        if (f === 181) this.se('Z1 気円斬');
        st.chrBack(6, true, 9, TEC_CENTER, STD_Y - 50); st.chrBack(21, true, 1, TEC_CENTER, STD_Y + 50);
        eff = 300;
      }
      if (f === 290) { st.ef.type = 0; st.ef.frame = 0; eff = 0; this.out(); }
      if (f >= 291 && f <= 319) eff = 301;
      if (f === 320) { this.fromat(); yield; break; }
      if (eff === 300) st.fxStep((k) => { for (const y of [94, 194]) st.front(KIEN, 0, 120, 126, 30, 338 + k.frame * RAY_SPEED, y); });
      if (eff === 301) st.fxStep((k) => { for (const y of [120, 200]) st.front(KIEN, 0, 120, 126, 30, -192 + k.frame * RAY_SPEED, y); });
      this.mv();
      yield;
    }
  },

  // ---- 2823 眠れる力 (723 悟飯＆16號, all.rb 99307): 悟飯 above, 16 below; 悟飯's ball (effect 201), 16 vanishes, the ball
  // on the enemy (202), 16's after-image beside it as it blows up (102) and is pushed right; 16's rocket punch close-up,
  // then he fires it from the left (effect 273: it is off the stage by 451, where the original moves it back but keeps
  // its counter) ----
  * cmcSleeping() {
    const st = this.st, A = this.A, G = this.G;
    let eff = 0, ray = [0, 0];
    for (let f = 0; f <= 479; f++) {
      this.pairIn(f, 5, 23);
      if (f >= 60 && f <= 100) {
        if (f === 60) { st.ef.frame = 0; this.se('Z3 エネルギー波'); }
        eff = 201; ray = [282, 58];
        this.pose(A, 1, true);
        st.chrBack(23, true, 0, TEC_CENTER, STD_Y + 50);
      }
      if (f >= 101 && f <= 180) { eff = 0; if (f === 101) this.se('Z1 高速移動'); st.after(TEC_CENTER + 12, STD_Y + 76); }
      if (f === 190) { st.ef.type = 0; st.ef.frame = 0; eff = 0; this.out(); }
      if (f >= 201 && f <= 229) { eff = 202; if (f >= 215) { if (f === 215) this.se('Z1 高速移動'); st.after(TEC_CENTER - 200, STD_Y + 24); } }
      if (f >= 230 && f <= 280) {
        if (f === 230) { st.ef.type = 0; st.ef.frame = 0; eff = 0; this.se('ZG 光線系ヒット2'); }
        st.v.gx = -8;
        st.after(TEC_CENTER - 200, STD_Y + 24);
        eff = 102;
        this.pose(G, 16, false);
        if (f >= 255) { st.v.gx = 0; this.pose(G, 0, false); }
      }
      if (f >= 281 && f <= 400) {
        eff = 0; st.ef.frame = 0;
        G.y = -200;
        if (f === 281) this.se('DB3 気を溜める2');
        st.back(ROCKET_CLOSE, 0, 0, 382, 314, TEC_CENTER - 148, STD_Y - 106);
      }
      if (f >= 401 && f <= 450) {
        if (f === 401) { this.se('DB3 気を溜める2'); this.se('Z1 ゴー'); eff = 273; }
        st.chrBack(23, true, 3, TEC_CENTER - 216, STD_Y);
        G.y = STD_Y;
        ray = [340 - 80, 156];
      }
      if (f >= 451 && f <= 478) {
        if (f === 451) { audio.seStop(); this.se('DB3 エネルギー波1'); this.se('DB3 エネルギー波2'); }
        st.chrBack(23, true, 3, TEC_CENTER - 216, STD_Y);
        eff = 273; ray = [138, 156];
      }
      if (f === 479) { this.fromat(); yield; break; }
      if (eff === 201) st.fxStep((k) => { k.type = 2; st.front(BALL, 256, 0, 128, 128, ray[0] + k.frame * RAY_SPEED, ray[1]); });
      if (eff === 202) st.fxStep((k) => { k.type = 2; st.front(BALL, 256, 0, 128, 128, -128 + k.frame * RAY_SPEED, 96); });
      if (eff === 102) st.fxStep((k) => { st.front(BOOM3, k.type * 112, 0, 112, 120, 318, 120); if (k.frame >= 10) { k.type++; k.frame = 0; } });
      if (eff === 273) {
        st.fxStep((k) => {
          const [sx, sy] = k.frame === 0 ? SHAKE[rand(9)] : [0, 0];
          st.front(ROCKET, 0, 0, 24, 14, ray[0] + k.frame * RAY_SPEED + sx, ray[1] + sy);
        });
      }
      this.mv();
      yield;
    }
  },
});
cmcFilms({ 716: ['cmcNonStep', 'cmcD41'], 718: ['cmcHells', 'cmcD42'], 719: ['cmcKienzan2', 'cmcD42'], 723: ['cmcSleeping', 'cmcD22'] });

// ---------- 729 / 745 / 740 / 761 / 747 ----------
const CUTIN = pic('Z3_味方カットイン.PNG'); // set_battle_cutin_name: 640×64 rows by actor id − 3
const BALL2 = pic('Z3_戦闘_必殺技_エネルギー弾2.PNG'); // effect 319: 96×64, the upper half
const ROSHI_KAME = pic('DB3_亀仙人カメハメは.PNG'); // 3 frames of 64×96
const SMALL = pic('Z3_戦闘_必殺技_エネルギー波_小.PNG'); // effects 316 / 317: 400×48 rows
const BALL4_GREEN = pic('Z3_戦闘_必殺技_エネルギー弾4(緑).PNG'); // effect 246
const SHITEI4 = pic('Z3_戦闘_必殺技_エネルギー弾4(師弟の絆).PNG'); // effect 247: 2 rows of 190×126
cmcPictures([CUTIN, BALL2, ROSHI_KAME, SMALL, BALL4_GREEN, SHITEI4]);

Object.assign(ComboDuel.prototype, {
  // ---- 2829 四身の拳・かめはめは (729 悟空＆天津飯, all.rb 99755): 天津飯 behind 悟空, he splits into four (effect 318) while
  // 悟空 flickers among them; their two cut-ins slide in by turns over the whole screen; then four balls and a wave at the
  // enemy (319). (Only the first target's film.) ----
  * cmcShishinKame() {
    const st = this.st, A = this.A, goku = this.who(3), tienLead = this.lead === 8;
    const tien = this.sheet(8, true), gokuSp = this.sheet(goku, true), rowG = (goku - 3) * 64, rowT = (8 - 3) * 64;
    let eff = 0;
    for (let f = 0; f <= 430; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        if (!tienLead) st.chrBack(8, true, 0, STD_CHAX + f * 8 + 16 - 160, STD_Y);
        else { st.v.ax = f <= 20 ? -8 : 0; st.chrBack(goku, true, 0, STD_CHAX + f * 8 + 16, STD_Y); }
      }
      if (f >= 40 && f <= 60) {
        if (f === 40) { if (tienLead) A.x += 160; st.v.ax = 0; st.v.ay = 0; this.as(goku, 0); }
        if (f === 60) { this.pose(A, 0, true); this.se('Z1 分身'); this.se('DB3 残像拳'); }
        st.chrBack(8, true, 0, A.x - 160, STD_Y);
      }
      if (f >= 61 && f <= 240) { A.y = -200; eff = 318; if (f === 240) st.cut = false; }
      if (f >= 241 && f <= 399) {
        if (f === 241) { audio.seStop(); this.se('Z3 四身の拳'); st.ef.frame = 0; eff = 0; st.bars = false; }
        const two = (x, y) => { st.back(CUTIN, 0, rowG, 640, 64, x, y); st.back(CUTIN, 0, rowT, 640, 64, x, y + 60); }, s = 241;
        two(f <= s + 20 ? -640 + 32 * (f - s) : 0, 0);
        if (f >= s + 21 && f <= s + 40) two(640 - 32 * (f - (s + 20)), 120); else if (f >= s + 40) two(0, 120);
        if (f >= s + 41 && f <= s + 60) two(-640 + 32 * (f - (s + 40)), 240); else if (f >= s + 60) two(0, 240);
        // (a fourth pair at y 360 / 420 is below the stage)
      }
      if (f === 400) { this.out(); st.bars = true; st.shock(); this.se('Z1 ゴー'); this.se('Z1 衝撃波'); this.se('Z3 エネルギー波'); }
      if (f >= 401 && f <= 429) eff = 319;
      if (f === 430) { this.fromat(); yield; break; }
      if (eff === 318) {
        const x0 = 88 + 26, y0 = 118, P = (sh, row, x, y) => st.front(sh, 0, row * 96, 96, 96, Math.trunc(x), Math.trunc(y));
        st.fxStep((k) => {
          const e = k.frame, g = (n) => { const [dx, dy] = [[15, -30], [-15, 30], [-45, 90], [45, -90]][n === 2 ? f % 2 : f % 4]; P(gokuSp, 0, x0 + dx + 160, y0 + dy); };
          if (e <= 30) { P(tien, 4, x0 + 0.5 * e, y0 - e); P(tien, 4, x0 - 0.5 * e, y0 + e); g(2); } else if (e <= 59) {
            P(tien, 3, x0 + 15, y0 - 30); P(tien, 3, x0 - 15, y0 + 30); g(2);
            if (e === 59) this.se('Z1 分身');
          } else if (e <= 120) {
            P(tien, 4, x0 + 15, y0 - 30); P(tien, 4, x0 - 15, y0 + 30); P(tien, 4, x0 + 0.5 * (e - 30), y0 - (e - 30)); P(tien, 4, x0 - 0.5 * (e - 30), y0 + (e - 30)); g(4);
          } else {
            const row = e <= 150 ? 4 : 0;
            for (const [dx, dy] of [[15, -30], [-15, 30], [45, -90], [-45, 90]]) P(tien, row, x0 + dx, y0 + dy);
            g(4);
          }
        });
      }
      if (eff === 319) {
        st.fxStep((k) => {
          const e = k.frame, x = -128 + e * RAY_SPEED;
          k.type = 2;
          for (const y of [100 - 90 + 3 * e, 100 - 30 + e, 100 + 30 - e, 100 + 90 - 3 * e]) st.front(BALL, 256, 0, 128, 128, x, y);
          st.front(BALL2, 0, 0, 96, 64, x, 144);
        });
      }
      this.mv();
      yield;
    }
  },

  // ---- 2845 うごきをとめろ (745 龜仙人・天津飯・餃子, all.rb 101679): 龜仙人 in the middle; 天津飯 flies off up, 餃子 holds
  // the enemy with his mind (it shakes from then on), 天津飯 drops in and pounds it away, 龜仙人 charges (back 201), his
  // DB3 kamehameha close-up, the ball (effect 2), then the ball on the enemy (207) ----
  * cmcStopMoving() {
    const st = this.st, A = this.A, G = this.G;
    let eff = 0;
    for (let f = 0; f <= 638; f++) {
      this.tripleIn(f, 24, 8, 9);
      if (f >= 40 && f <= 60) { this.flank(8, 0, 9, 0); if (f === 60) this.se('Z1 気を溜める'); }
      if (f >= 61 && f <= 159) {
        if (f === 61) this.se('Z1 逃げる');
        this.pose(A, 16, false);
        A.y -= 12;
        st.chrBack(8, false, 16, 236, STD_Y - 64 - 12 * (f - 60));
        st.chrBack(9, true, 6, 236, STD_Y + 64);
      }
      if (f === 160) { A.sp = true; audio.seStop(); this.se('Z3 超能力'); A.x = CENTER_CHAX; G.x = CENTER_ENEX; G.y = STD_Y; st.v.gx = 6; this.se('Z1 高速移動'); }
      if (f >= 161 && f <= 209 && f % 4 === 0) st.back(SPARK, 0, 48, 64, 64, A.x + 8, STD_Y + 24);
      if (f >= 210 && f <= 269) {
        const k = f - 210;
        this.L.sheets = this.crew[8]; A.sp = false;
        if (f === 210) A.y = STD_Y;
        if (k % 12 === 0) { this.pose(G, 16, false); this.pose(A, 3, false); this.se('Z1 打撃'); } else if (k % 6 === 0) { this.pose(G, 16, false); this.pose(A, 4, false); this.se('Z1 打撃'); } else this.pose(G, 0, false);
      }
      if (f === 270) { this.pose(A, 1, false); this.se('Z1 強打'); }
      if (f >= 271 && f <= 319) { this.pose(G, 17, false); G.x += 16; }
      if (f === 320) { this.se('Z3 変身'); this.as(24, 6, true); }
      if (f >= 321 && f <= 409) st.aura(200, 88, 0);
      if (f === 410) { st.no = 1; audio.seStop(); this.se('Z1 気を溜める'); A.y = -100; st.cutFlag = false; }
      if (f >= 411 && f <= 599) st.back(ROSHI_KAME, (f <= 460 ? 0 : f <= 510 ? 1 : 2) * 64, 0, 64, 96, CENTER_CHAX + 48, STD_Y);
      if (f === 561) { audio.seStop(); this.se('Z1 エネルギー波2'); this.pose(A, 3, true); eff = 2; }
      if (f === 600) { this.pose(A, 3, true); eff = 0; st.ef.frame = 0; st.ef.type = 0; }
      if (f === 610) { st.no = 0; st.cutFlag = true; st.cut = true; this.pose(G, 16, false); this.out(); }
      if (f >= 611 && f <= 637) eff = 207;
      if (f === 638) { this.fromat(); yield; break; }
      if (eff === 2) st.fxStep((k) => { st.front(BALL, k.type * 128, 0, 128, 128, 242, 120); if (k.frame >= 10) { k.type++; k.frame = 0; } });
      if (eff === 207) st.fxStep((k) => st.front(BALL4, 0, 0, 190, 126, -192 + k.frame * RAY_SPEED, 96));
      this.mv();
      yield;
    }
  },

  // ---- 2840 メタルクラッシュ (740 超悟空＆超貝吉塔, all.rb 101071): side by side in blue auras, they dash off right, come
  // in from the left and ram the enemy, sweep back in from the right as it flies left, and fire two small beams after it
  // (effect 316 / 317; damage 74 blows it away to the left) ----
  * cmcMetalCrush() {
    const st = this.st, A = this.A, G = this.G;
    let eff = 0;
    for (let f = 0; f <= 604; f++) {
      this.pairIn(f, 14, 19);
      if (f === 60) { this.se('Z3 変身'); this.se('Z1 気を溜める3'); this.fx92(19); } // (92 still on)
      if (f >= 61 && f <= 187) {
        st.ef.frame = 0;
        this.pose(A, 0, true);
        st.aura(234, 36, 3); st.ba.frame--;
        st.aura(234, 136, 3); st.ba.frame--;
        st.chrBack(19, true, 0, TEC_CENTER, STD_Y + 50);
      }
      if (f >= 188 && f <= 269) {
        if (f === 188) { audio.seStop(); this.se('Z1 飛ぶ'); }
        if (f === 203) { this.se('Z1 飛ぶ'); this.pose(A, 8, true); }
        if (f > 203) st.v.ax = 16;
        st.chrBack(19, true, 16, TEC_CENTER + (f - 188) * 16, STD_Y + 50);
      }
      if (f >= 270 && f <= 340) {
        if (f === 270) { A.x = -420; A.y += 12; this.se('Z1 飛ぶ'); }
        if (f === 285) this.se('Z1 飛ぶ');
        if (f > 285) st.v.ax = 22;
        st.chrBack(19, true, 16, -180 + (f - 270) * 16, STD_Y + 50 - 12);
      }
      if (f === 350) { st.ef.type = 0; st.ef.frame = 0; eff = 0; this.out(); A.y = 82; this.pose(A, 8, true); }
      if (f >= 361 && f <= 425) {
        if (f === 361) { A.x = -240; this.se('Z1 飛ぶ'); }
        st.v.ax = 16;
        if (f >= 390) {
          this.pose(A, 2, false);
          st.chrBack(19, false, 1, A.x + 28, STD_Y + 38);
          if (f === 390) { this.pose(G, 17, false); G.x += 24; this.se('Z1 強打'); this.se('ZG 打撃4'); } else if (f <= 392) G.x += 24;
          else if (f <= 395) G.x -= 24;
        } else if (f >= 378) { this.pose(A, 16, false); st.chrBack(19, false, 16, A.x + 28, STD_Y + 38); } else { this.pose(A, 8, true); st.chrBack(19, true, 16, A.x + 28, STD_Y + 38); }
      }
      if (f >= 426 && f <= 495) {
        G.x -= 12;
        if (f === 426) { this.pose(A, 10, true); A.x = 840; }
        if (f === 430) st.v.ax = -8;
        st.chrBack(19, true, 22, A.x - 8, STD_Y + 38);
      }
      if (f >= 496 && f <= 580) {
        st.v.ax = 0;
        if (f === 496) { this.se('Z1 エネルギー波'); this.se('Z1 怪光線'); }
        this.pose(A, 11, true);
        st.chrBack(19, true, 21, A.x, STD_Y + 38);
        eff = 316;
      }
      if (f >= 581 && f <= 603) {
        if (f === 581) { st.ef.frame = 0; this.pose(G, 16, false); }
        A.y = -200;
        G.x = TEC_CENTER + 48;
        eff = 317;
      }
      if (f === 604) { this.fromat(); yield; break; }
      if (eff === 316) {
        st.fxStep((k) => {
          const d = k.frame * RAY_SPEED;
          st.front(SMALL, 352 - d, 0, 48 + d, 48, 332 - d, 94);
          st.front(SMALL_BLUE, 352 - d, 0, 48 + d, 48, 348 - d, 174);
        });
      }
      if (eff === 317) st.fxStep((k) => { const x = 640 - k.frame * RAY_SPEED + 64; st.front(SMALL, 0, 48, 400, 48, x, 124); st.front(SMALL_BLUE, 0, 48, 400, 48, x, 172); });
      this.mv();
      yield;
    }
  },

  // ---- 2861 大師匠と孫弟子 (761 特蘭克斯＆比克, all.rb 102830) / 2847 師弟アタック (747 未來悟飯＆特蘭克斯, 102111): 特蘭克斯
  // above, the other below; both vanish, 特蘭克斯 then the other appear in front of the enemy and knock it off the stage
  // (effect 121), both charge and fire a ball each (effect 246), then the 師弟の絆 ball (247) ----
  * cmcMasterPupil() {
    const st = this.st, A = this.A, G = this.G, other = this.combo === 761 ? 4 : 25, types = this.combo === 761 ? [2, 3] : [12, 2];
    const [charge, fire] = noSword() ? [3, 13] : [10, 11];
    let eff = 0;
    for (let f = 0; f <= 443; f++) {
      this.pairIn(f, 17, other);
      if (f >= 60 && f <= 100) { this.fx92(other); A.y = -120; if (f === 60) this.se('Z1 高速移動'); st.after(TEC_CENTER + 10, STD_Y + 76 - 100); } // (92 still on)
      if (f >= 101 && f <= 140) { if (f === 101) this.se('Z1 高速移動'); st.after(TEC_CENTER + 10, STD_Y + 76); }
      if (f === 150) { st.ef.frame = 0; G.x = CENTER_ENEX; G.y = STD_Y; this.as(17, 0, false); A.x = CENTER_CHAX; }
      if (f >= 160 && f <= 180) { if (f === 160) this.se('Z1 高速移動'); st.after(CENTER_CHAX + 16, STD_Y + 26); if (f === 180) A.y = STD_Y; }
      if (f === 186) { this.se('Z1 打撃'); this.pose(A, 2, false); }
      if (f === 191) { this.se('Z1 打撃'); this.pose(A, 1, false); }
      if (f === 201) { this.se('Z3 打撃'); this.pose(A, 4, false); this.pose(G, 16, false); }
      if (f >= 207 && f <= 225) {
        st.v.gx = -18; eff = 121;
        if (f === 225) { A.y = -120; G.x = -96; this.as(other, 0, false); }
      }
      if (f >= 226 && f <= 246) {
        st.v.gx = -18;
        if (f === 226) this.se('Z1 高速移動');
        if (f === 235) this.pose(G, 0, false);
        st.after(CENTER_CHAX + 16, STD_Y + 26);
        if (f === 246) { A.y = STD_Y; st.v.gx = 0; }
      }
      if (f === 252) { this.se('Z1 打撃'); this.pose(A, 4, false); }
      if (f === 258) { this.se('Z1 打撃'); this.pose(A, 3, false); }
      if (f === 268) { this.se('Z3 打撃'); this.pose(A, 1, false); this.pose(G, 16, false); st.ef.frame = 0; }
      if (f >= 274 && f <= 293) {
        st.v.gx = -18; eff = 121;
        if (f === 293) { st.v.gx = 0; G.y = -200; A.y = -120; this.pose(G, 0, false); A.x = TEC_CENTER; }
        st.ba.type = 0; st.ba.frame = 0;
      }
      if (f >= 294 && f <= 353) {
        this.as(17, charge, true);
        eff = 0; st.ef.frame = 0;
        if (f === 294) this.se('Z1 気を溜める2');
        A.y = STD_Y - 50;
        st.chrBack(other, true, types[0], TEC_CENTER, STD_Y + 50);
      }
      if (f >= 354 && f <= 414) {
        if (f === 354) { audio.seStop(); this.se('Z1 エネルギー波2'); }
        this.pose(A, fire, true);
        st.chrBack(other, true, types[1], TEC_CENTER, STD_Y + 50);
        eff = 246;
      }
      if (f === 415) { eff = 0; this.out(); st.ef.frame = 0; }
      if (f >= 416 && f <= 442) eff = 247;
      if (f === 443) { this.fromat(); yield; break; }
      if (eff === 121) this.fx121();
      if (eff === 246) st.fxStep((k) => { const x = 340 + k.frame * RAY_SPEED; st.front(BALL4, 0, 0, 190, 126, x, 98 - 46 + k.frame); st.front(BALL4_GREEN, 0, 0, 190, 126, x, 98 + 50 - k.frame); });
      if (eff === 247) {
        st.fxStep((k) => {
          st.front(SHITEI4, 0, k.rtype * 126, 190, 126, -192 + k.frame * RAY_SPEED, 126);
          if (k.rframe >= 8 && k.rtype === 0) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 8) { k.rtype = 0; k.rframe = 0; }
        });
      }
      this.mv();
      yield;
    }
  },
});
cmcFilms({ 729: ['cmcShishinKame', 'cmcD41'], 745: ['cmcStopMoving', 'cmcD44'], 740: ['cmcMetalCrush', 'cmcD74'],
  761: ['cmcMasterPupil', 'cmcD41'], 747: ['cmcMasterPupil', 'cmcD41'] });

export const CMC1_SOUNDS = ['Z1 逃げる', 'Z1 高速移動', 'DB3 残像拳', 'Z3 変身', 'Z1 気を溜める', 'Z1 気を溜める3', 'Z1 エネルギー波', 'Z1 エネルギー波3',
  'Z1 衝撃波', 'Z1 怪光線', 'Z1 エネルギー波2', 'Z1 飛ぶ', 'Z1 強打', 'ZG 打撃2', 'Z1 ザー', 'Z1 ゴー', 'Z1 気円斬', 'Z3 エネルギー波',
  'ZG 光線系ヒット2', 'DB3 気を溜める2', 'DB3 エネルギー波1', 'DB3 エネルギー波2', 'Z1 分身', 'Z3 四身の拳', 'Z3 超能力', 'Z1 打撃',
  'Z3 打撃', 'Z1 気を溜める2', 'ZG 打撃4'];
import './combo_z3a2.js?v=20261108-0722';
import './combo_z3a3.js?v=20261108-0722';

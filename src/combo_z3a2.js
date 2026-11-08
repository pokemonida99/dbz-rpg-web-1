// S-combo films of the original's anime_pattern 28xx, part 2 (docs/anim-f-plan.md cmc; the stage: src/combo_z3a_stage.js,
// read its header first): 712 地球人ストライク 2812, 738 3大超サイヤ人 2838, 741 あっち行ってけろ 2841, 744 よけられるハズだべ
// 2844, 754 お母さんをいじめるなーっ！ 2854, 762 ダブルスラッシュ 2862, 763 ギャリックかめはめは 2863, 764 親子かめはめ波 2864,
// 770 母さんは俺が守る 2870. Frame numbers in the comments are the original's @battle_anime_frame; `eff` is the film's
// @effect_anime_pattern, drawn after the fighters every frame it is set (st.ef counting on, as effect_pattern does).
import { audio, rand } from './core.js?v=20261108-1000';
import { STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED } from './anime.js?v=20261108-1000';
import { ComboDuel } from './combo-anime.js?v=20261108-1000';
import { pic, blt, cmcFilms, cmcPictures, STD_CHAX, SPARK } from './combo_z3a_stage.js?v=20261108-1000';

const STD_ENEX = 602;
const P = {
  ball: pic('Z3_戦闘_必殺技_エネルギー弾.PNG'), // effects 201 / 333: 6 frames of 128×128
  ball2: pic('Z3_戦闘_必殺技_エネルギー弾2.PNG'), // effect 203: 96×64
  ball4: pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'), // effects 206 / 207: 190×126
  small: pic('Z3_戦闘_必殺技_エネルギー波_小.PNG'), // effects 225 / 226
  mid: pic('Z3_戦闘_必殺技_エネルギー波_中.PNG'), midBlue: pic('Z3_戦闘_必殺技_エネルギー波_中_敵_青.PNG'), // effects 249-251: 400×80 rows
  down: pic('Z3_戦闘_必殺技_エネルギー波_中_縦.PNG'), // effects 257 / 258: 60×400 ×2
  half: pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'), // effects 256 / 265: 700×128 ×2
  huge: pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG'), // effect 48: 400×192
  kien: pic('Z3_戦闘_必殺技_気円斬.png'), // effects 330 / 260: 126×30 rows
  blinkS: pic('Z3_必殺技_超カメハメ波(球点滅小).png'), blink: pic('Z3_必殺技_超カメハメ波(球点滅).png'), // effects 237 / 235
  boom1: pic('戦闘アニメ_爆発1.PNG'), boom3: pic('戦闘アニメ_爆発3.PNG'), // effects 101 (96×96 ×2) / 102 (112×120 ×2)
  bang: pic('戦闘アニメ_ビックリマーク.PNG'), // 16×16
  sword: [pic('Z3_戦闘_必殺技_剣攻撃.PNG'), pic('Z3_戦闘_必殺技_剣攻撃(上下反転).PNG'), pic('Z3_戦闘_必殺技_剣攻撃(縦).PNG')], // effects 267 / 268 / 269
  // 3大超サイヤ人 (2838)
  gather: pic('Z3_戦闘_必殺技_超元気玉_溜め.png'), // effect 253: 246×110 rows
  genki: pic('Z3_戦闘_必殺技_超元気玉(元気).png'), // 8×10, the bits of energy flying to him
  genkiBall: pic('Z3_戦闘_必殺技_超元気玉_弾.PNG'), // back 212: 2 frames of 126×126
  aura9: pic('Z3_戦闘_必殺技_気を溜める9.PNG'), // back 213: 3 frames of 640×378
  // variable 171 (悟空's clothes) → 168×198 (normal / Super Saiyan), and his 元気玉吸収 special sheet ($goku3dai)
  goku: [pic('Z3_必殺技_超元気玉(ゴクウ).PNG'), pic('Z3_必殺技_超元気玉(ゴクウ：ボロボロ).png'), pic('Z3_必殺技_超元気玉(ゴクウ：さらにボロボロ).png'),
    pic('Z3_必殺技_超元気玉(ゴクウ：戦闘服).png')],
  ssGoku: [pic('Z3_必殺技_超元気玉(超ゴクウ).png'), pic('Z3_必殺技_超元気玉(超ゴクウ：ボロボロ).png'), pic('Z3_必殺技_超元気玉(超ゴクウ：さらにボロボロ).png'),
    pic('Z3_必殺技_超元気玉(超ゴクウ：戦闘服).png')],
  absorb: [pic('Z3_戦闘_必殺技_ゴクウ(超)元気玉吸収.png'), pic('Z3_戦闘_必殺技_ゴクウ(超・ボロボロ)_元気玉吸収.png'),
    pic('Z3_戦闘_必殺技_ゴクウ(超・さらにボロボロ)_元気玉吸収.png'), pic('Z3_戦闘_必殺技_ゴクウ(超・バトルスーツ)元気玉吸収.png')],
  // 親子かめはめ波 (2864): by variables 171 / 172 (悟飯 2: the red 道着)
  oyako: { '0,0': pic('Z3_必殺技_親子カメハメ波.png'), '0,2': pic('Z3_必殺技_親子カメハメ波_悟空通常、悟飯赤.png'),
    '1,0': pic('Z3_必殺技_親子カメハメ波_悟空ボロ、悟飯通常.png'), '1,2': pic('Z3_必殺技_親子カメハメ波_悟空ボロ、悟飯赤.png'),
    '2,0': pic('Z3_必殺技_親子カメハメ波_悟空さらにボロ、悟飯通常.png'), '2,2': pic('Z3_必殺技_親子カメハメ波_悟空さらにボロ、悟飯赤.png'),
    '3,0': pic('Z3_必殺技_親子カメハメ波_悟空バトル、悟飯通常.png'), '3,2': pic('Z3_必殺技_親子カメハメ波_悟空バトル、悟飯赤.png') },
};
cmcPictures([P.ball, P.ball2, P.ball4, P.small, P.mid, P.midBlue, P.down, P.half, P.huge, P.kien, P.blinkS, P.blink, P.boom1, P.boom3, P.bang,
  ...P.sword, P.gather, P.genki, P.genkiBall, P.aura9, ...P.goku, ...P.ssGoku, ...P.absorb, ...Object.values(P.oyako)]);

const v = (n) => { const s = window.__game && window.__game.state; return (s && s.var && s.var[n]) || 0; };
const sw = (n) => { const s = window.__game && window.__game.state; return !!(s && s.sw && s.sw[n]); };
const fill = (color, x, y, w, h) => (c) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
const WAKE = 'rgb(188,188,188)'; // the 残像 line of 2863


// ---------- the effects (effect_pattern): each draws with st.ef as it is, then the counters go on ----------
const FX = {
  // 48 かめはめ波系(特大)横
  48: (st) => st.fxStep((k) => st.front(P.huge, 0, 0, 400, 192, -400 + k.frame * RAY_SPEED, 76)),
  // 101 爆発小 / 102 爆発中: the next picture every 10
  101: (st) => st.fxStep((k) => { st.front(P.boom1, k.type * 96, 0, 96, 96, 320, 120); if (k.frame >= 10) { k.type++; k.frame = 0; } }),
  102: (st) => st.fxStep((k) => { st.front(P.boom3, k.type * 112, 0, 112, 120, 318, 120); if (k.frame >= 10) { k.type++; k.frame = 0; } }),
  // 201 エネルギー弾系(発動): the third picture flying right
  201: (st, x, y) => st.fxStep((k) => { k.type = 2; st.front(P.ball, 256, 0, 128, 128, x + k.frame * RAY_SPEED, y); }),
  203: (st, x, y) => st.fxStep((k) => st.front(P.ball2, 0, 0, 96, 64, x + k.frame * RAY_SPEED, y)), // かめはめ波系(発動)
  206: (st, x, y) => st.fxStep((k) => st.front(P.ball4, 0, 0, 190, 126, x + k.frame * RAY_SPEED, y)), // 界王拳かめはめ波系(発動)
  207: (st) => st.fxStep((k) => st.front(P.ball4, 0, 0, 190, 126, -192 + k.frame * RAY_SPEED, 96)), // (ヒット)
  225: (st, x, y) => st.fxStep((k) => st.front(P.small, 0, 48, 54 + k.frame * RAY_SPEED, 48, x, y)), // エネルギー波_小系(発動)
  226: (st) => st.fxStep((k) => st.front(P.small, 0, 0, 400, 48, -400 + k.frame * RAY_SPEED, 148)), // (ヒット)
  // 235 / 237 スーパーカメハメ波ため (big / small): a blinking ball, the next of five every 4 (@ray_anime_*)
  235: (st, x, y) => st.fxStep((k) => { st.front(P.blink, 32 * k.rtype, 0, 32, 32, x, y); blinkOn(k); }),
  237: (st, x, y) => st.fxStep((k) => { st.front(P.blinkS, 16 * k.rtype, 0, 16, 16, x, y); blinkOn(k); }),
  249: (st) => st.fxStep((k) => { // ギャリックカメハメは(発動): the two waves leave the hands
    const n = Math.min(5, k.frame);
    st.front(P.mid, 0, 80, 80 + n * (RAY_SPEED + 2), 80, 160, 118);
    st.front(P.midBlue, 314 - n * RAY_SPEED, 0, 86 + n * RAY_SPEED, 80, 396 - n * RAY_SPEED, 118);
  }),
  250: (st) => st.fxStep((k) => { // (発動2): the long waves past each other
    const t = k.frame * RAY_SPEED;
    st.front(P.mid, 0, 0, 400, 80, -400 + t, 76);
    for (const x of [-720, -1040, -1360]) st.front(P.mid, 80, 80, 320, 80, x + t, 76);
    st.front(P.midBlue, 0, 80, 400, 80, 640 - t, 160);
    for (const x of [928, 1216, 1504]) st.front(P.midBlue, 112, 80, 288, 80, x - t, 160);
  }),
  251: (st) => st.fxStep((k) => { // (on the enemy): the two waves meeting
    st.front(P.mid, 0, 0, 400, 80, -400 + k.frame * RAY_SPEED, 134);
    st.front(P.midBlue, 0, 80, 400, 80, 640 - k.frame * RAY_SPEED, 134);
  }),
  253: (st, x, y) => st.fxStep((k) => { // 超元気玉ため: the ball growing, then pulsing between the last two pictures
    st.front(P.gather, 0, k.rtype * 110, 246, 110, x, y);
    if (k.rframe >= 20 && k.rtype !== 5) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4 && k.rtype === 5) { k.rtype = 4; k.rframe = 0; }
  }),
  256: (st, x, y) => st.fxStep((k) => st.front(P.half, 0, 0, k.frame * RAY_SPEED, 128, x, y)), // Z3エネルギー波半円発動 (blue)
  257: (st, x, y) => st.fxStep((k) => st.front(P.down, 0, 0, 60, k.frame * RAY_SPEED + 56, x, y)), // エネルギー波縦発動
  258: (st, x, y) => st.fxStep((k) => st.front(P.down, 60, 0, 60, 400, x, y + k.frame * RAY_SPEED)), // エネルギー波縦ヒット
  260: (st) => st.fxStep((k) => st.front(P.kien, 0, 120, 126, 30, -192 + k.frame * RAY_SPEED, 160)), // Z3気円斬系(ヒット)
  265: (st, x, y) => st.fxStep((k) => st.front(P.half, 0, 128, 700, 128, -700 + k.frame * RAY_SPEED, y)), // Z3エネルギー波半円ヒット
  // 267 / 268 / 269 剣攻撃 (縦: 96×160): the next picture every 2 (@ray_anime_*)
  267: (st, x, y) => st.fxStep((k) => { st.front(P.sword[0], 160 * k.rtype, 0, 160, 96, x, y); if (k.rframe >= 2) { k.rtype++; k.rframe = 0; } }),
  268: (st, x, y) => st.fxStep((k) => { st.front(P.sword[1], 160 * k.rtype, 0, 160, 96, x, y); if (k.rframe >= 2) { k.rtype++; k.rframe = 0; } }),
  269: (st, x, y) => st.fxStep((k) => { st.front(P.sword[2], 96 * k.rtype, 0, 96, 160, x, y); if (k.rframe >= 2) { k.rtype++; k.rframe = 0; } }),
  330: (st, x, y) => st.fxStep((k) => { // Z3気円斬系(発動): the disc growing (rows 0-4)
    st.front(P.kien, 0, 30 * k.rtype, 126, 30, x, y);
    if (k.rframe >= 4) { k.rtype++; k.rframe = 0; }
    if (k.rtype >= 4) { k.rtype = 4; k.rframe = 0; }
  }),
  333: (st, x, y) => st.fxStep((k) => { // エネルギー弾系(正面): growing to the sixth picture
    st.front(P.ball, k.type * 128, 0, 128, 128, x, y);
    if (k.frame >= 10) { if (k.type !== 5) k.type++; k.frame = 0; }
  }),
};
function blinkOn(k) { if (k.rframe >= 4 && k.rtype !== 4) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4) { k.rtype = 0; k.rframe = 0; } }

Object.assign(ComboDuel.prototype, {
  // a member's sheet (set_battle_character_name): the crew's, or the actor's own for someone not in it (3大超サイヤ人's
  // 超悟空 when the crew has 悟空)
  cmcBSh(id, sp) {
    const k = this.crew[id] ? id : this.who(id);
    if (k && this.crew[k]) return this.sheet(k, sp);
    const a = window.__game.world.actors[id];
    return sp ? a.special : a.sprite;
  },
  cmcBChr(st, id, sp, row, x, y, list = st.b) { const s = this.cmcBSh(id, sp); list.push((c) => blt(c, s, 0, row * 96, 96, 96, x, y)); },
  cmcBDo(st, eff, x, y) { if (eff && FX[eff]) FX[eff](st, x, y); },
  // effect 123 キャラぶつかる自由位置 / 121 攻撃ヒット: the stage's
  cmcBFx(st, eff, x, y) { if (eff === 123) this.fx123(x, y); else if (eff === 121) this.fx121(); else this.cmcBDo(st, eff, x, y); },

  // ---------- 2812 地球人ストライク (712 克林・雅木茶・天津飯・餃子, all.rb 98554) ----------
  // the other three fly in round the lead; 克林 above with 天津飯 under him, 雅木茶 and 餃子 vanish (back 48); 天津飯
  // splits into four (effect 314); 餃子 clings to the enemy (88) while 雅木茶 strikes (315, on the shock-wave back 1);
  // 克林's かめはめ波 (203); 雅木茶's flurry again, 餃子 jumps clear as the ball hits (102), the enemy is knocked away; the
  // four 天津飯 raise their hands, and the 気功砲 column (back 9) — damage 46
  * cmcBEarth() {
    const st = this.st, A = this.A, G = this.G, lead = this.lead;
    const SLOT = { 6: [24, -40], 7: [-48, -72], 8: [24, 40], 9: [-48, 72] };
    const VEL = { 6: [21, 0, -2], 7: [25, -3, -3], 8: [21, 0, 2], 9: [25, -3, 3] }; // [until, ax, ay]
    const tien = (sp) => this.sheet(this.who(8), sp);
    let eff = 0, rx = 0, ry = 0;
    for (let f = 0; f <= 761; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        const [until, ax, ay] = VEL[lead] || VEL[9];
        if (f < until) { if (ax) st.v.ax = ax; st.v.ay = ay; } else { st.v.ax = 0; st.v.ay = 0; }
        for (const id of [6, 7, 8, 9]) if (id !== lead) st.chrBack(id, true, 0, STD_CHAX + f * 8 + SLOT[id][0], STD_Y + SLOT[id][1]);
      }
      if (f >= 40 && f <= 60) {
        st.v.ax = 0; st.v.ay = 0;
        A.x = TEC_CENTER; A.y = STD_Y - 40;
        if (f === 40) this.as(6, 0);
        if (f === 60) this.se('Z1 高速移動');
        st.chrBack(7, true, 0, 194, STD_Y - 72); st.chrBack(8, true, 0, A.x, STD_Y + 40); st.chrBack(9, true, 0, 194, STD_Y + 72);
      }
      if (f >= 61 && f <= 120) { // 雅木茶 and 餃子 vanish
        st.chrBack(8, true, 0, A.x, STD_Y + 40);
        st.after(218, STD_Y - 48); st.after(218, STD_Y + 96);
      }
      if (f >= 121 && f <= 300) { // 克林 charges; 天津飯 splits into four (effect 314)
        if (f === 121) this.se('Z1 気を溜める');
        this.pose(A, 2, true);
        rx = A.x; ry = STD_Y + 40;
        if (f >= 151) { if (f === 151) this.se('Z1 分身'); eff = 314; } else st.chrBack(8, true, 3, A.x - 14, STD_Y + 40);
      }
      if (f === 301) { // サイコアタック
        this.as(9, 2); A.x = -200;
        eff = 0; st.ef.frame = 0; st.bars = false;
        this.se('Z1 逃げる');
        G.x = CENTER_ENEX; G.y = STD_Y;
      }
      if (f >= 302 && f <= 363) {
        st.shock(); eff = 88;
        if (f === 323) { this.se('Z1 強打'); st.v.gx = 2; }
        if (f === 325) st.v.gx = -2;
        if (f === 327) st.v.gx = 0;
      }
      if (f >= 364 && f <= 424) { // 餃子 holds on, 雅木茶's flurry (effect 315)
        st.shock();
        const u = f - 364;
        if (u === 0) { st.ef.frame = 0; this.se('Z3 超能力'); this.se('Z1 逃げる'); }
        this.as(7, 2); eff = 315;
        st.v.gx = u % 2 === 0 ? 6 : -6;
      }
      if (f >= 425 && f <= 439) { // 克林's かめはめ波
        if (f === 425) { audio.seStop(); this.se('Z1 気を溜める'); }
        st.bars = true; eff = 0; st.ef.frame = 0;
        G.y = -200;
        this.as(6, 2); A.x = TEC_CENTER; A.y = STD_Y;
      }
      if (f >= 440 && f <= 444) this.pose(A, 3, true);
      if (f === 445) { audio.seStop(); this.se('Z3 エネルギー波'); }
      if (f >= 446 && f <= 474) {
        eff = 203; rx = 340; ry = 142;
        if (f === 446) st.v.ax = -2; if (f === 449) st.v.ax = 2; if (f === 452) st.v.ax = 0;
      }
      if (f === 475) { eff = 0; st.ef.frame = 0; st.ef.type = 0; }
      if (f >= 480 && f <= 505) { // the ball flies in while 雅木茶 strikes again
        if (f === 480) { A.y = -200; G.x = CENTER_ENEX; G.y = STD_Y; this.as(7, 2); st.ef.frame = 36; eff = 315; this.se('Z3 超能力'); }
        if (f >= 495) { // 餃子 and 雅木茶 jump clear
          const k = f - 495;
          if (k === 0) { st.v.gx = 0; audio.seStop(); this.se('Z1 飛ぶ'); eff = 0; this.as(9, 8, true); A.x = STD_ENEX + 16 - 21 * RAY_SPEED; A.y = STD_Y + 22; }
          A.x += 4; A.y -= 24;
          st.chrBack(7, false, 16, CENTER_CHAX - 4 * k, STD_Y - 24 * k);
        }
        const bx = -128 + (f - 480) * RAY_SPEED;
        st.back(P.ball2, 0, 0, 96, 64, bx, 144);
      }
      if (f >= 506 && f <= 559) { if (f === 506) this.se('ZG 光線系ヒット2'); this.pose(G, 16, false); eff = 102; G.x += 16; }
      if (f >= 560 && f <= 720) { // the four 天津飯 (four fists, then their hands up)
        if (f === 560) G.y = -200;
        if (f === 590) { this.se('Z1 ザー'); this.se('Z1 ゴー'); }
        const s = tien(true), r = f < 590 ? 0 : 2;
        for (const [x, y] of [[CENTER_CHAX, STD_Y - 40], [CENTER_CHAX, STD_Y + 40], [CENTER_CHAX + 90, STD_Y - 64], [CENTER_CHAX + 90, STD_Y + 64]]) st.back(s, 0, r * 96, 96, 96, x, y);
      }
      if (f === 721) { this.out(); st.bars = false; st.v.gx = 0; st.v.gy = 0; }
      if (f >= 722 && f <= 760) st.kikou();
      if (f === 761) { this.fromat(); yield; break; }
      if (eff === 314) this.cmcBFx314(st, rx, ry);
      else if (eff === 88) this.cmcBFx88(st);
      else if (eff === 315) this.cmcBFx315(st);
      else this.cmcBDo(st, eff, rx, ry);
      this.mv();
      yield;
    }
  },
  cmcBFx314(st, x, y) { // 地球人ストライク 四身の拳: two, then four 天津飯 sliding apart (1.5 a frame)
    const s = this.sheet(this.who(8), true);
    st.fxStep((k) => {
      const t = k.frame, d = 1.5, x0 = x - 14;
      const at = (dx, row) => { st.front(s, 0, row * 96, 96, 96, Math.round(x0 + dx), y); st.front(s, 0, row * 96, 96, 96, Math.round(x0 - dx), y); };
      if (t <= 30) at(d * t, 4);
      else if (t <= 59) { at(d * 30, 3); if (t === 59) this.se('Z1 分身'); } else if (t <= 120) { at(d * 30, 4); at(d * (t - 30), 4); } else { at(d * 30, 4); at(d * 90, 4); }
    });
  },
  cmcBFx88(st) { // サイコアタック: 餃子 flies at the enemy and clings to it
    const s = this.L.sheets.special;
    st.fxStep((k) => {
      const t = k.frame;
      if (t <= 21) st.front(s, 0, 4 * 96, 96, 96, STD_ENEX + 60 - t * RAY_SPEED, STD_Y - 24);
      else st.front(s, 0, 5 * 96, 96, 96, STD_ENEX + 74 - 21 * RAY_SPEED, STD_Y - 8);
    });
  },
  cmcBFx315(st) { // サイコアタックと狼牙: 餃子 still clinging, 雅木茶 (the attacker's sheets) flickers in and strikes
    const chaozu = this.sheet(this.who(9), true), L = this.L.sheets;
    const ROWS = [[10, 14], [20, 13], [30, 12], [35, 0], [39, 3], [43, 1], [46, 2], [50, 4], [53, 2], [56, 1], [60, 2], [80, 16]];
    st.fxStep((k) => {
      const t = k.frame;
      st.front(chaozu, 0, 5 * 96, 96, 96, STD_ENEX + 74 - 21 * RAY_SPEED, STD_Y - 8);
      const r = ROWS.find(([end]) => t <= end), sheet = r ? L.normal : L.special;
      if (t >= 36 && t % 5 === 0 && t < 85) this.se('Z3 打撃');
      const x = t >= 61 && t <= 80 ? CENTER_CHAX - (t - 60) * 8 : t >= 81 && t <= 84 ? 80 + (t - 80) * 16 : CENTER_CHAX;
      st.front(sheet, 0, (r ? r[1] : 3) * 96, 96, 96, x, STD_Y);
    });
  },

  // ---------- 2841 あっち行ってけろ (741 雅木茶＆琪琪, all.rb 101256) ----------
  // the other one comes in (琪琪 160 behind 雅木茶), 雅木茶 jumps (the ！), and while he flies off 琪琪 fires her small
  // wave (effects 225 → 226) — damage 41
  * cmcBGoAway() {
    const st = this.st, A = this.A, chichi = this.lead === 10;
    let eff = 0, t1 = 0;
    for (let f = 0; f <= 198; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        if (chichi) { st.v.ax = f <= 20 ? -8 : 0; st.chrBack(7, true, 0, STD_CHAX + f * 8 + 16, STD_Y); } else st.chrBack(10, true, 0, STD_CHAX + f * 8 + 16 - 160, STD_Y);
      }
      if (f >= 40 && f <= 60) {
        if (f === 40) { if (chichi) A.x += 160; this.as(7, 0); }
        st.v.ax = 0; st.v.ay = 0;
        if (f === 60) { this.pose(A, 11, true); t1 = 0; this.se('Z1 ダメージ'); }
        st.chrBack(10, true, t1, A.x - 160, STD_Y);
      }
      if (f >= 61 && f <= 119) { // the ！ over 雅木茶, a jolt
        if (f === 61) A.x += 4;
        if (f === 62) A.x -= 4;
        const d = f === 61 ? 4 : 0;
        st.back(P.bang, 0, 0, 16, 16, A.x - d, A.y);
        st.chrBack(10, true, t1, A.x - 160 - d, STD_Y);
      }
      if (f === 120) { this.se('Z1 怪光線'); this.pose(A, 12, true); t1 = 4; st.chrBack(10, true, t1, A.x - 160, STD_Y); this.se('Z1 飛ぶ'); }
      if (f >= 121 && f <= 160) { eff = 225; A.y -= 16; st.chrBack(10, true, t1, A.x - 160, STD_Y); }
      if (f === 161) { eff = 0; st.ef.frame = 0; st.ef.type = 0; }
      if (f === 170) this.out();
      if (f >= 171) eff = 226;
      if (f === 198) { this.fromat(); yield; break; }
      this.cmcBDo(st, eff, 168, 128);
      this.mv();
      yield;
    }
  },

  // ---------- 2844 よけられるハズだべ・・・ (744 琪琪＆龜仙人, all.rb 101534) ----------
  // as 2841: 琪琪 behind 龜仙人, she charges (back 201) and fires a big ball (206) while he dodges out of its way (the
  // after-image), and it flies on into the enemy (207) — damage 42
  * cmcBDodge() {
    const st = this.st, A = this.A, chichi = this.lead === 10;
    let eff = 0, t1 = 0;
    for (let f = 0; f <= 278; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        if (chichi) { st.v.ax = f <= 20 ? -8 : 0; st.chrBack(24, true, 0, STD_CHAX + f * 8 + 16, STD_Y); } else st.chrBack(10, true, 0, STD_CHAX + f * 8 + 16 - 160, STD_Y);
      }
      if (f >= 40 && f <= 59) {
        if (f === 40) { if (chichi) A.x += 160; this.as(24, 0); }
        st.v.ax = 0; st.v.ay = 0;
        st.chrBack(10, true, t1, A.x - 160, STD_Y);
      }
      if (f === 60) { t1 = 5; st.chrBack(10, true, t1, A.x - 160, STD_Y); this.se('Z3 変身'); }
      if (f >= 61 && f <= 239) {
        if (f === 150) { audio.seStop(); this.se('Z1 気を溜める'); t1 = 2; }
        if (f === 201) { audio.seStop(); this.se('Z1 エネルギー波2'); t1 = 3; eff = 206; }
        if (f === 202) this.se('Z3 避ける');
        if (f >= 202 && f % 4 === 0) st.back(SPARK, 0, 48, 64, 64, A.x, STD_Y + 30);
        st.aura(64, 88); st.ba.frame--;
        st.chrBack(10, true, t1, A.x - 160, STD_Y);
        if (f === 201) A.y = -200;
      }
      if (f === 240) { t1 = 3; eff = 0; st.ef.frame = 0; st.ef.type = 0; }
      if (f === 250) this.out();
      if (f >= 251) eff = 207;
      if (f === 278) { this.fromat(); yield; break; }
      this.cmcBDo(st, eff, 180, 96);
      this.mv();
      yield;
    }
  },

  // ---------- 2854 お母さんをいじめるなーっ！ (754 悟飯＆琪琪) / 2870 母さんは俺が守る (770 未來超悟飯＆琪琪) ----------
  // (all.rb 102268 / 103780) the same opening: 琪琪 runs at the enemy and is knocked back, the son runs in and the enemy
  // throws her down; she leaves, he charges (back 201) and vanishes —
  //   2854: 悟飯 dashes in, a flurry of blows (effect 123), up and away (121), then from below the vertical wave (257 → 258), damage 46
  //   2870: 未來悟飯 flies in, knocks the enemy up and down the stage, then the blue half-circle wave (256 → 265), damage 42
  * cmcBMom() {
    const st = this.st, A = this.A, G = this.G, future = this.combo === 770;
    const son = future ? 26 : this.who(5), [bx, by, color] = future ? [176, 88, 3] : [166, 86, 0];
    // the son started it: 琪琪 comes in from the left as he runs off (0-60); 琪琪 started it: one frame (the else)
    if (this.lead === son) {
      for (let f = 0; f <= 60; f++) {
        if (f === 0) this.se('Z1 逃げる');
        st.v.ax = f === 60 ? 0 : -16;
        st.chrBack(10, false, 0, STD_CHAX + Math.min(f, 21) * 16, STD_Y);
        if (f === 60) { this.as(10, A.frame, A.sp); A.x = TEC_CENTER; }
        this.mv();
        yield;
      }
    } else { this.mv(); yield; }
    let eff = 0, rx = 0, ry = 0, t1 = 0;
    const GOHAN_AT = -96 + 16 * 25 - 8 * 12, END = future ? 1034 : 702;
    for (let f = 1; f <= END; f++) {
      if (f === 1) { this.as(10, 6, true); A.x = TEC_CENTER; A.y = STD_Y; }
      if (f >= 2 && f <= 59) { if (f === 2) this.se('Z1 逃げる'); A.x += 16; }
      if (f === 60) { G.x = CENTER_ENEX; G.y = STD_Y; A.x = -96; }
      if (f >= 61 && f <= 82) A.x += 16;
      if (f === 83) { this.pose(A, 17, false); this.pose(G, 1, false); this.se('ZG 打撃4'); }
      if (f >= 84 && f <= 119) A.x -= 20;
      if (f === 120) { G.y = -200; A.x = 840; this.se('Z1 逃げる'); }
      if (f >= 121 && f <= 146) { A.x -= 20; st.chrBack(son, false, t1, -96 + 16 * (f - 121), STD_Y); }
      if (f >= 147 && f <= 159) { if (f === 147) this.se('Z1 強打'); t1 = 16; st.chrBack(son, false, t1, -96 + 16 * 25 - 8 * (f - 147), STD_Y); A.x -= 8; }
      if (f === 160) { st.chrBack(son, false, t1, GOHAN_AT, STD_Y); t1 = 0; this.pose(A, 0); }
      if (f >= 161 && f <= 180) { st.chrBack(son, false, t1, GOHAN_AT, STD_Y); A.x += 4; }
      if (f >= 181 && f <= 240) { st.chrBack(son, false, t1, GOHAN_AT, STD_Y); this.pose(A, 7, true); }
      if (f >= 241 && f <= 270) { this.pose(A, 8, true); A.y -= 16; if (f === 241) this.se('Z1 逃げる'); st.chrBack(son, false, t1, GOHAN_AT, STD_Y); }
      if (f >= 271 && f <= 359) { if (f === 271) this.se('Z3 変身'); st.aura(bx, by, color); st.ba.frame--; st.chrBack(son, false, t1, GOHAN_AT, STD_Y); }
      if (!future) {
        if (f === 360) { audio.seStop(); this.se('Z1 高速移動'); A.y = -200; }
        if (f >= 360 && f <= 400) { st.aura(bx, by, color); if (f >= 361 && f % 4 === 0) st.back(SPARK, 0, 48, 64, 64, 210, 146); }
        if (f === 401) { this.as(son, 16, false); this.se('Z1 逃げる'); G.x = CENTER_ENEX; G.y = STD_Y; this.pose(G, 0, false); A.x = -200; A.y = STD_Y; st.v.ax = 20; }
        if (f === 426) { st.v.ax = 0; this.pose(A, 3); audio.seStop(); this.se('ZG 打撃4'); this.pose(G, 16); }
        if (f >= 426 && f <= 427) { st.v.gx = -8; eff = 123; rx = 346; ry = 154; }
        if (f >= 428 && f <= 429) st.v.gx = 8;
        if (f >= 430 && f <= 433) st.v.gx = 0;
        if (f === 434) { eff = 0; st.ef.frame = 0; this.pose(A, 0); st.v.ax = -12; st.v.ay = 6; }
        if (f === 442) { st.v.ax = 0; st.v.ay = 0; this.pose(A, 16); }
        if (f === 450) { st.v.ax = 24; st.v.ay = -12; }
        if (f >= 454 && f <= 470) {
          st.v.gx = -24; st.v.gy = -6; st.v.ax = 0; st.v.ay = 0;
          this.pose(A, 1); this.pose(G, 17);
          if (f === 454) { this.se('ZG 打撃2'); eff = 123; }
          rx = 346; ry = 154;
          if (f === 470) eff = 0;
        }
        if (f >= 471 && f <= 485) { st.ef.frame = 0; this.pose(A, 16); st.v.ax = 24; st.v.ay = -6; if (f === 471) this.se('Z1 逃げる'); }
        if (f >= 486 && f <= 495) {
          if (f === 486) { G.x = CENTER_ENEX - 240; G.y = STD_Y + 60; this.pose(G, 17); }
          if (f === 491) this.pose(G, 16);
          st.v.gx = -24; st.v.gy = -6;
        }
        if (f === 496) { st.v.gx = 0; st.v.gy = 0; A.x = CENTER_CHAX + 16 - 240; A.y = STD_Y + 60; }
        if (f >= 497 && f <= 506) { st.v.ax = 24; st.v.ay = -6; }
        if (f === 507) { st.v.ax = 0; st.v.ay = 0; }
        if (f === 511) { st.v.ax = 0; st.v.gx = -4; this.pose(A, 1); this.se('Z1 打撃'); }
        // the blows: each one 3 frames of the spark, then the next fist (rows 2 / 1 by turns)
        if (f >= 512 && f <= 516) { eff = 123; rx = 346; ry = 154; }
        if (f >= 517 && f <= 544) {
          const k = (f - 517) % 4, up = Math.floor((f - 517) / 4) % 2 === 0; // (the fist at row 2: the spark 14 higher)
          if (k === 0) { st.ef.frame = 0; eff = 0; this.pose(A, up ? 2 : 1); this.se('Z1 打撃'); if (f === 525) st.v.gx = -4; } else { eff = 123; rx = 346; ry = up ? 140 : 154; }
          if (f >= 542) { st.v.gx = 0; this.pose(A, 0); st.v.ax = -24; }
        }
        if (f === 545) { eff = 0; st.ef.frame = 0; }
        if (f === 546) st.v.ax = 48;
        if (f === 548) { st.v.ax = 0; this.pose(A, 4); this.pose(G, 17); this.se('Z1 強打'); eff = 121; }
        if (f >= 549 && f <= 570) {
          st.v.gx = -24;
          if (f === 559) { this.pose(A, 16); st.v.ay = -24; this.se('Z1 逃げる'); this.se('DB3 気を溜める2'); }
        }
        if (f === 571) { // he rises from below and fires the wave down the stage
          eff = 0; st.ef.frame = 0; st.v.gx = 0; st.v.ay = -6;
          this.pose(A, sw(445) ? 18 : 17, true);
          st.no = 1; A.x = CENTER_CHAX + 74; A.y = STD_Y + 142; st.cutFlag = false;
        }
        if (f === 610) { audio.seStop(); this.se('Z1 エネルギー波'); eff = 257; this.pose(A, sw(445) ? 19 : 18, true); st.v.ay = 0; rx = 326; ry = 124; }
        if (f >= 611 && f <= 669 && st.ef.frame >= 13) st.ef.frame = 13;
        if (f === 670) { eff = 0; st.ef.frame = 0; st.ef.type = 0; A.sp = false; this.out(); this.pose(G, 16, false); }
        if (f >= 671 && f <= 701) { rx = 330; ry = -600; eff = 258; }
      } else {
        if (f === 360) { this.as(26, 4, true); A.y = STD_Y; A.x = GOHAN_AT; this.pose(G, 0, false); }
        if (f >= 360 && f <= 397) st.aura(bx, by, color);
        if (f === 398) { audio.seStop(); this.se('Z1 飛ぶ'); this.pose(A, 7); }
        if (f >= 399 && f <= 450) A.x += 20;
        if (f === 451) { G.x = CENTER_ENEX; G.y = STD_Y; A.sp = true; A.x = -320; A.y = STD_Y; }
        if (f >= 452 && f <= 480) A.x += 20;
        if (f === 481) { this.pose(A, 11); this.se('Z1 強打'); }
        if (f >= 482 && f <= 510) { this.pose(G, 16); eff = f >= 490 ? 0 : 123; rx = 346; ry = 154; G.x += 20; G.y -= 4; }
        if (f >= 511 && f <= 530) { st.ef.type = 0; st.ef.frame = 0; eff = 0; if (f === 511) this.se('Z1 飛ぶ'); A.x += 24; A.y -= 4; this.pose(A, 10); }
        if (f >= 531 && f <= 559) {
          if (f === 531) { G.x = -100; G.y = STD_Y + 50; A.x = -150; A.y = STD_Y + 50; }
          if (f <= 554) { G.x += 16; G.y -= 2; } else this.pose(G, 0);
          A.x += 28; A.y -= 4;
        }
        if (f === 560) { this.pose(A, 15); A.x = 740; A.y = STD_Y; }
        if (f >= 561 && f <= 574) A.x -= 28;
        if (f >= 575 && f <= 595) {
          if (f === 575) { this.se('ZG 打撃2'); A.x -= 28; }
          eff = f >= 583 ? 0 : 123; rx = 324; ry = 158;
          this.pose(A, 17); this.pose(G, 17); G.x -= 20;
        }
        if (f >= 596 && f <= 614) { if (f === 596) this.se('Z1 飛ぶ'); this.pose(A, 15); A.x -= 28; G.x -= 20; }
        if (f === 615) { st.ef.type = 0; st.ef.frame = 0; eff = 0; A.x = 900; A.y = STD_Y; G.x = 640; G.y = STD_Y; }
        if (f >= 616 && f <= 634) { A.x -= 28; G.x -= 20; }
        if (f === 635) { this.se('ZG 打撃5'); A.x -= 28; this.pose(A, 16); }
        if (f >= 636 && f <= 659) { eff = f >= 644 ? 0 : 123; rx = 324; ry = 158; G.x -= 4; G.y += 16; }
        if (f === 660) {
          st.ef.type = 0; st.ef.frame = 0; eff = 0; st.cut = false; st.cutFlag = false; st.no = 1;
          A.x = CENTER_CHAX - 30; A.y = -184; G.x = CENTER_ENEX - 40; G.y = -140; this.pose(A, 10); this.se('Z1 飛ぶ');
        }
        if (f >= 661 && f <= 674) { G.y += 16; A.y += 24; A.x += 4; }
        if (f === 675) { this.pose(A, 18); this.se('ZG 打撃1'); }
        if (f >= 676 && f <= 709) { if (f % 4 === 0) G.x += 4; else if (f % 2 === 0) G.x -= 4; A.y -= 4; G.y -= 4; }
        if (f === 710) { this.pose(A, 20, true); this.se('ZG 打撃4'); }
        if (f >= 711 && f <= 739) { A.y += 2; G.y += 16; }
        if (f === 740) { this.se('Z1 飛ぶ'); this.pose(A, 29); }
        if (f >= 741 && f <= 759) { A.y -= 16; A.x -= 16; }
        if (f === 779) { st.small = false; st.cut = true; st.cutFlag = true; st.no = 0; }
        if (f === 780) { A.y = STD_Y; A.x = TEC_CENTER; this.se('Z3 変身'); this.pose(A, 4, true); }
        if (f >= 780 && f <= 907) { if (f >= 840) this.pose(A, 5); st.aura(226, by, color); }
        if (f === 908) { audio.seStop(); this.se('Z1 エネルギー波'); this.pose(A, 2); eff = 256; A.x += 2; rx = 356; ry = 112; }
        if (f === 1007) { st.ef.type = 0; st.ef.frame = 0; eff = 0; this.pose(G, 16, false); this.out(); }
        if (f >= 1008) { eff = 265; ry = 112; }
      }
      if (f === END) { this.fromat(); yield; break; }
      this.cmcBFx(st, eff, rx, ry);
      this.mv();
      yield;
    }
  },

  // ---------- 2862 ダブルスラッシュ (762 克林＆特蘭克斯, all.rb 102984) ----------
  // the lead rises (or sinks) while the other flies in (effect 90 / 89); both vanish, 克林 then 特蘭克斯 knock the enemy off
  // the stage (121), 特蘭克斯 dashes past while 克林's disc grows and shakes (330), it is thrown, 特蘭克斯 slashes in a white
  // flash, and the disc comes in (260) — damage 41
  * cmcBSlash() {
    const st = this.st, A = this.A, G = this.G, tr = this.who(17), tLead = this.lead === tr;
    let eff = 0, rx = 0, ry = 0, t2 = 0, shake = 54, sf = 0;
    for (let f = 0; f <= 557; f++) {
      rx = f <= 500 ? 325 : 340; ry = f <= 500 ? 70 : 200;
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) { eff = tLead ? 89 : 90; st.v.ay = f <= 10 ? (tLead ? 5 : -5) : 0; }
      if (f >= 40 && f <= 59) { if (f === 40) { if (tLead) A.y -= 100; this.as(6, 0); } eff = 92; }
      if (f >= 60 && f <= 100) { A.y = -120; if (f === 60) this.se('Z1 高速移動'); st.after(TEC_CENTER + 10, STD_Y + 76 - 100); }
      if (f >= 101 && f <= 140) { eff = 0; if (f === 101) this.se('Z1 高速移動'); st.after(TEC_CENTER + 10, STD_Y + 76); }
      if (f === 150) { st.ef.frame = 0; G.x = CENTER_ENEX; G.y = STD_Y; this.as(6, 0, false); A.x = CENTER_CHAX; }
      if (f >= 160 && f <= 180) { if (f === 160) this.se('Z1 高速移動'); st.after(CENTER_CHAX + 16, STD_Y + 26); if (f === 180) A.y = STD_Y; }
      if (f === 186) { this.se('Z1 打撃'); this.pose(A, 1); }
      if (f === 191) { this.se('Z1 打撃'); this.pose(A, 2); }
      if (f === 201) { this.se('Z3 打撃'); this.pose(A, 3); this.pose(G, 16, false); }
      if (f >= 207 && f <= 225) { st.v.gx = -18; eff = 121; if (f === 225) { A.y = -120; G.x = -96; this.as(tr, 0, false); } }
      if (f >= 226 && f <= 246) {
        st.v.gx = -18;
        if (f === 226) this.se('Z1 高速移動');
        if (f === 235) this.pose(G, 0, false);
        st.after(CENTER_CHAX + 16, STD_Y + 26);
        if (f === 246) { A.y = STD_Y; st.v.gx = 0; }
      }
      if (f === 252) { this.se('Z1 打撃'); this.pose(A, 4); }
      if (f === 258) { this.se('Z1 打撃'); this.pose(A, 3); }
      if (f === 268) { this.se('Z3 打撃'); this.pose(A, 2); this.pose(G, 16, false); st.ef.frame = 0; }
      if (f >= 274 && f <= 293) {
        st.v.gx = -18; eff = 121;
        if (f === 293) { st.v.gx = 0; G.y = -200; A.y = -120; this.pose(G, 0, false); A.x = TEC_CENTER; }
        st.ba.type = 0; st.ba.frame = 0;
      }
      if (f >= 294 && f <= 330) { // 特蘭克斯 dashes off to the right past 克林
        const k = f - 294;
        this.as(6, 0, true); eff = 0; st.ef.frame = 0;
        if (k === 0) this.se('Z1 飛ぶ');
        t2 = 8; A.y = STD_Y - 50;
        st.chrBack(tr, true, t2, TEC_CENTER + k * 24, STD_Y + 50 - k * 2);
      }
      if (f >= 331 && f <= 422) { // 克林's disc over his hand, shaking right and left
        const k = f - 331;
        rx = 224; ry = 46;
        if (k === 0) { sf = 0; shake = 54; this.pose(A, 5, true); }
        if (k === 30) { eff = 330; this.se('Z1 ブン'); }
        const R = { 40: 6, 50: 7, 60: 5, 70: 6, 80: 7 };
        if (R[k]) this.pose(A, R[k]);
        if (shake === 6) { rx += 8; ry += 2; } else if (shake === 4) { rx -= 8; ry -= 2; }
        if (++sf >= 3) { sf = 0; shake = { 54: 6, 56: 4, 6: 56, 4: 54 }[shake]; }
      }
      if (f >= 423 && f <= 482) { // thrown
        const k = f - 423;
        if (k === 0) this.se('Z1 エネルギー波');
        this.pose(A, 9);
        rx = 224 + 16 * k; ry = 46 + 2 * k;
        if (f === 482) { eff = 0; st.ef.frame = 0; st.ef.type = 0; }
      }
      if (f === 483) { eff = 0; this.out(); st.ef.frame = 0; }
      if (f >= 484 && f <= 525) { // 特蘭克斯 slashes through it in a white flash
        const k = f - 484;
        if (k === 0) this.se('Z1 飛ぶ');
        st.chrBack(tr, true, t2, -192 + k * 24, STD_Y);
        if (k === 19) this.se('Z3 剣攻撃');
        if (k >= 19 && k <= 23) { st.white(378); t2 = 6; }
      }
      if (f >= 526 && f <= 556) { if (f === 526) this.se('Z1 エネルギー波2'); eff = 260; }
      if (f === 557) { this.fromat(); yield; break; }
      if (eff === 89 || eff === 90) this.fx8990(eff === 89 ? 6 : tr, eff === 89);
      else if (eff === 92) this.fx92(tr);
      else this.cmcBFx(st, eff, rx, ry);
      this.mv();
      yield;
    }
  },

  // ---------- 2863 ギャリックかめはめは(ヤムチャとベジータ) (763, all.rb 103216) ----------
  // (貝吉塔 started it: 雅木茶 comes in from the left as he runs off) 雅木茶 charges (back 201, blue) and runs left leaving
  // a line, 貝吉塔 comes in from the right with his own; both move apart, the かめはめ波 and the ギャリック砲 cross (effects
  // 249 → 250) and meet on the enemy (251) — damage 41 where it stands (@damage_huttobi false, @damage_center)
  * cmcBGalick() {
    const st = this.st, A = this.A, G = this.G, veg = this.who(12);
    if (this.lead === veg) {
      let saf = 0; // @scombo_cha_anime_frame
      for (let f = 0; f <= 60; f++) {
        if (f === 0) this.se('Z1 逃げる');
        if (saf <= 20) saf++;
        st.v.ax = f === 60 ? 0 : -16;
        st.chrBack(7, true, 0, STD_CHAX + saf * 16, STD_Y); // back 127
        if (f === 60) { this.as(7, A.frame, A.sp); A.x = TEC_CENTER; }
        this.mv();
        yield;
      }
    } else { this.mv(); yield; }
    let eff = 0;
    const B = 3; // @ray_color 3: the blue auras
    for (let f = 0; f <= 704; f++) {
      if (f === 0) { this.se('Z3 変身'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 140) { if (f === 90) { audio.seStop(); this.se('Z1 気を溜める'); this.pose(A, 2, true); } st.aura(228, 86, B); }
      if (f >= 141 && f <= 180) { // he runs left, a line flies past
        const k = f - 140;
        st.v.ax = -12;
        st.aura(228 - 12 * k, 86, B);
        st.b.push(fill(WAKE, 640 - 16 * k, 64, 6, 228));
      }
      if (f >= 181 && f <= 220) { // 貝吉塔 comes in from the right with his aura
        const k = f - 180;
        if (k === 1) { audio.seStop(); this.se('Z3 変身'); }
        st.v.ax = 0;
        st.aura(708 - 12 * k, 86, B);
        st.chrBack(veg, true, 7, 730 - 12 * k, STD_Y);
      }
      if (f >= 221 && f <= 360) {
        if (f === 271) { audio.seStop(); this.se('Z1 気を溜める'); }
        st.aura(228, 86, B); st.ba.frame--;
        st.chrBack(veg, true, 7, 250, STD_Y);
      }
      if (f >= 361 && f <= 469) { // the two of them moving apart, 雅木茶 back on the left
        const k = f - 360;
        if (k === 1) { audio.seStop(); this.se('Z3 変身'); this.se('Z1 気を溜める'); }
        st.aura(228 + 2 * k, 86, B); st.ba.frame--;
        st.chrBack(veg, true, 7, 250 + 2 * k, STD_Y); st.ba.frame--;
        st.aura(-190 + 2 * k, 86, B); st.ba.frame--;
        st.chrBack(7, true, 2, -154 + 2 * k, STD_Y);
        const nx = Math.min(320, f < 412 ? 4 * k : 2 * (f - 412) + 4 * 52);
        st.b.push(fill(WAKE, nx, 64, 6, 228));
      }
      if (f >= 470 && f <= 520) {
        st.aura(448, 86, B); st.ba.frame--;
        st.chrBack(veg, true, 7, 470, STD_Y); st.ba.frame--;
        st.aura(30, 86, B); st.ba.frame--;
        st.chrBack(7, true, 2, 66, STD_Y);
        st.b.push(fill(WAKE, 320, 64, 6, 228));
      }
      if (f >= 521 && f <= 600) { // both fire
        if (f === 521) { st.ef.frame = 0; audio.seStop(); this.se('DB3 エネルギー波2'); this.se('Z1 エネルギー波'); }
        st.chrBack(veg, true, 8, 470, STD_Y); st.ba.frame--;
        st.chrBack(7, true, 3, 66, STD_Y);
        eff = 249;
        st.b.push(fill(WAKE, 320, 64, 6, 228));
      }
      if (f >= 601 && f <= 679) { if (f === 601) st.ef.frame = 0; eff = 250; st.b.push(fill(WAKE, 0, 156, 640, 4)); }
      if (f === 680) { this.out(); eff = 0; G.x = CENTER_ENEX - 56; st.ef.frame = 0; }
      if (f >= 681) eff = 251;
      if (f === 704) { this.fromat(); yield; break; }
      this.cmcBDo(st, eff, 340, 96);
      this.mv();
      yield;
    }
  },

  // ---------- 2864 親子かめはめ波 (764 超悟空＆超悟飯, all.rb 103502) ----------
  // the lead rises (or sinks) while the other flies in (90 / 89); both charge (back 201 ×2) with the blinking balls
  // (effects 237 → 235), the two of them in the 親子かめはめ波 picture between the ZG panels (@tec_output_back_no 4) with
  // the ball growing (333), then the huge wave (48) — damage 44
  * cmcBOyako() {
    const st = this.st, A = this.A, gLead = this.lead === 18;
    const look = P.oyako[`${[1, 2, 3].includes(v(171)) ? v(171) : 0},${v(172) === 2 ? 2 : 0}`];
    let eff = 0, rx = 0, ry = 0;
    for (let f = 0; f <= 427; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) { eff = gLead ? 89 : 90; if (f <= 10) st.v.ay = gLead ? 5 : -5; else { st.v.ay = 0; if (!gLead) st.v.ax = 0; } }
      if (f >= 40 && f <= 59) { if (f === 40) { if (gLead) A.y -= 100; this.as(14, 0); } eff = 92; }
      if (f === 60) {
        this.se('Z3 変身'); this.se('Z1 気を溜める');
        eff = 0; st.ef.frame = 0; this.pose(A, 2, true);
        st.chrBack(18, true, 17, TEC_CENTER, STD_Y + 50);
      }
      if (f >= 61 && f <= 281) {
        if (f === 192) this.se('Z1 気を溜める3');
        st.aura(230, 40); st.ba.frame--;
        st.aura(220, 140); st.ba.frame--;
        st.chrBack(18, true, 17, TEC_CENTER, STD_Y + 50);
        const r = st.ef.rtype;
        if (f <= 191) { st.back(P.blinkS, 16 * r, 0, 16, 16, 278, 214); eff = 237; rx = 282; ry = 110; } else { st.back(P.blink, 32 * r, 0, 32, 32, 272, 208); eff = 235; rx = 276; ry = 104; }
      }
      if (f >= 282 && f <= 398) { // the picture of the two of them
        A.y -= 200;
        if (f === 282) { this.se('Z1 大猿'); this.se('ZG 光線1'); st.ef.frame = 0; st.ef.type = 0; }
        st.cut = false; st.no = 4;
        st.back(look, 16 * st.ef.rtype, 0, 250, 286, 210, 40);
        eff = 333; rx = 236; ry = 128;
      }
      if (f === 399) { st.cut = true; eff = 0; st.ef.frame = 0; st.ef.type = 0; st.no = 0; this.out(); }
      if (f >= 400 && f <= 426) eff = 48;
      if (f === 427) { this.fromat(); yield; break; }
      if (eff === 89 || eff === 90) this.fx8990(eff === 89 ? 14 : 18, eff === 89);
      else if (eff === 92) this.fx92(18);
      else this.cmcBDo(st, eff, rx, ry);
      this.mv();
      yield;
    }
  },

  // ---------- 2838 3大超サイヤ人 (738 悟空・貝吉塔・特蘭克斯, all.rb 99913) ----------
  // the other two fly in round the lead; 特蘭克斯's ball (201), 貝吉塔's blows and the enemy blown up (101), 特蘭克斯's sword
  // (267-269) and the enemy knocked away; then 悟空 alone between the corners (@tec_output_back_no 2): the bits of energy
  // gather (the 超元気玉 charge, 253) while he turns Super Saiyan, the ball comes down into him ($goku3dai: his
  // 元気玉吸収 sheet, back 212), the great aura (back 213, the ground shaking) and he walks into the enemy with it — damage 42
  * cmcBThree() {
    const st = this.st, A = this.A, G = this.G, lead = this.lead;
    const ss = !!this.crew[14], goku = this.who(3), veg = this.who(12), tr = this.who(17);
    const v171 = [1, 2, 3].includes(v(171)) ? v(171) : 0;
    const absorb = () => { // $goku3dai: 超悟空's special sheet becomes the 元気玉吸収 one
      const L = this.crew[14] || { normal: window.__game.world.actors[14].sprite };
      this.L.sheets = { normal: L.normal, special: P.absorb[v171] };
    };
    const ss14 = () => { const a = window.__game.world.actors[14]; this.L.sheets = this.crew[14] || { normal: a.sprite, special: a.special }; };
    const kind = lead === 17 || lead === 20 ? 't' : lead === 12 || lead === 19 ? 'v' : 'g';
    const flick = (rows) => { // the special-sheet flicker between two rows, every 8 counts of @effect_anime_frame
      const k = st.ef;
      k.frame++;
      if (k.frame === 8 && k.type === 0) { k.frame = 0; k.type = 1; this.pose(A, rows[0]); } else if (k.frame === 8 && k.type === 1) { k.frame = 0; k.type = 0; this.pose(A, rows[1]); }
    };
    let eff = 0, rx = 302, ry = 64, t2 = 0, three = false;
    const bits = [0, 0, 0, 0, 0, 0, 0, 0], DIR = [[4, 2], [2, 4], [4, 4], [-2, 4], [-4, 4], [-4, 2], [4, 0], [4, -2]];
    for (let f = 0; f <= 2001; f++) {
      if (f === 0) { this.se('Z1 逃げる'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 39) {
        const k = f * 8, dy = kind === 't' ? 4 : -4;
        if (kind !== 'g') {
          if (f < 17) { st.v.ax = -4; st.v.ay = dy; } else if (f < 20) { st.v.ax = -4; st.v.ay = 0; } else if (f < 21) st.v.ax = -2; else { st.v.ax = 0; st.v.ay = 0; }
        }
        if (kind === 't') { st.chrBack(goku, true, 0, STD_CHAX + k + 16, STD_Y); st.chrBack(veg, true, 0, STD_CHAX + k - 62, STD_Y - 64); } else if (kind === 'v') { st.chrBack(goku, true, 0, STD_CHAX + k + 16, STD_Y); st.chrBack(tr, true, 0, STD_CHAX + k - 62, STD_Y + 64); } else { st.chrBack(veg, true, 0, STD_CHAX + k - 62, STD_Y - 64); st.chrBack(tr, true, 0, STD_CHAX + k - 62, STD_Y + 64); }
      }
      if (f >= 40 && f <= 59) {
        st.v.ax = 0; st.v.ay = 0;
        if (f === 40) this.as(goku, 0);
        A.x = TEC_CENTER; A.y = STD_Y;
        st.chrBack(veg, true, 0, 188, STD_Y - 64); st.chrBack(tr, true, 0, 188, STD_Y + 64);
      }
      if (f >= 60 && f <= 100) { if (f === 60) this.se('Z1 高速移動'); st.chrBack(tr, true, t2, A.x - 78, STD_Y + 64); st.ba.frame--; st.after(A.x - 70, STD_Y - 40); }
      if (f >= 101 && f <= 160) { eff = 201; rx = 230; ry = 160; if (f === 101) this.se('Z3 エネルギー波'); t2 = 1; st.chrBack(tr, true, t2, A.x - 78, STD_Y + 64); }
      if (f >= 161 && f <= 229) {
        if (f <= 200) { eff = 0; if (f === 161) this.se('Z1 高速移動'); st.after(A.x - 70, STD_Y + 80); }
        if (f >= 177) { if (!ss) this.pose(A, 5); else { if (!three) { three = true; absorb(); } this.pose(A, 1); } }
      }
      if (f === 230) { // 貝吉塔's blows
        st.ef.type = 0; st.ef.frame = 0; eff = 0;
        this.pose(G, 0, false);
        A.y = -120; G.x = CENTER_ENEX; G.y = STD_Y;
        audio.seStop(); this.se('Z1 高速移動');
        this.as(veg, 0, false); A.x -= 8;
      }
      if (f >= 231 && f <= 270) st.after(A.x - 8, STD_Y + 24);
      if (f >= 271 && f <= 302) {
        const k = f - 271, R = { 0: 1, 28: 1, 4: 4, 16: 4, 8: 2, 20: 2, 12: 3, 24: 3 };
        A.y = STD_Y;
        if (R[k]) { this.se('Z1 打撃'); this.pose(A, R[k]); } else if ([1, 5, 6, 9, 10, 13, 17, 21, 25, 29].includes(k)) G.x += 4; else if ([2, 3, 7, 11, 14, 15, 18, 19, 22, 23, 26, 27, 30, 31].includes(k)) G.x -= 4;
        this.pose(G, 16);
      }
      if (f >= 303 && f <= 322) { eff = 201; rx = -16; ry = 96; this.pose(A, 16); if (f === 303) this.se('Z1 飛ぶ'); A.y -= 16; this.pose(G, 0); }
      if (f >= 323 && f <= 331) {
        const k = f - 323;
        if (k === 0) { this.se('Z3 光線系ヒット'); st.ef.frame = 0; st.ef.type = 0; }
        eff = 101; this.pose(G, 16);
        if (k <= 3) G.x += 8; else if (k <= 7) G.x -= 8;
      }
      if (f >= 332 && f <= 370) st.after(A.x - 48, STD_Y + 24);
      if (f >= 371 && f <= 440) { // 特蘭克斯's sword
        const k = f - 371;
        if (k === 0) { this.as(tr, 3, true); A.x -= 96; A.y = STD_Y; }
        const CUT = { 10: [4, 22, 267], 16: [8, -22], 20: [6, 22, 268], 26: [5, -22], 30: [4, 22, 267], 36: [3, -16], 40: [4, 16, 269], 46: [5, -22], 50: [4, 22, 267] };
        const c = CUT[k];
        if (c) {
          this.pose(A, c[0]); A.x += c[1];
          if (c[2]) { this.se('DB3 刀'); st.ef.rtype = 0; st.ef.rframe = 0; eff = c[2]; }
        }
        if (eff === 267 || eff === 268) { rx = 228; ry = 118; } else if (eff === 269) { rx = 292; ry = 70; }
      }
      if (f >= 441 && f <= 489) { G.x += 16; if (f === 441) this.se('Z3 跳ね返し'); this.pose(G, 17); st.ef.type = 0; eff = 0; }
      if (f >= 490 && f <= 1100) { // the 超元気玉 gathering
        const k = f - 490;
        st.no = 2; rx = 640 - 246; ry = 0;
        if (k === 0) {
          this.se('Z3 気を溜める(超元気玉)');
          A.y = -160; st.cutFlag = false;
          bits.fill(0);
          st.ef.rframe = 0; st.ef.rtype = 0; st.ef.type = 0; st.ef.frame = 0;
          if (three) absorb(); else ss14();
          this.pose(A, 1);
        } else {
          if (k > 350) {
            const q = k - 350, e = st.ef;
            if (q <= 63 || q <= 143) { e.frame++; if (e.frame >= (q <= 63 ? 9 : 5)) { e.frame = 1; e.type = e.type === 0 ? 1 : 0; } } else e.type = 1;
          }
          st.back(st.ef.type === 0 && !ss ? P.goku[v171] : P.ssGoku[v171], 0, 0, 168, 198, 270, 90);
          for (let i = 0; i < 8; i++) { // the bits of energy flying in to the ball (fast for their last 15 frames)
            if (bits[i] >= 40) bits[i] = 0;
            else if (bits[i] > 0) {
              const [dx, dy] = DIR[i], tx = dx * 25 + dx * 2 * 14, ty = dy * 25 + dy * 2 * 14, n = bits[i];
              const x = n <= 25 ? 484 - tx + n * dx : 484 - tx + 25 * dx + (n - 25) * dx * 2, y = n <= 25 ? 60 + ty - n * dy : 60 + ty - 25 * dy - (n - 25) * dy * 2;
              st.back(P.genki, 0, 0, 8, 10, x, y);
              bits[i]++;
            } else if (650 - k > 40 && rand(4) === 0) bits[i] = 1;
          }
          if (k === 60) eff = 253;
        }
      }
      if (f >= 1101 && f <= 1350) { // the ball comes down into him
        const k = f - 1101;
        let bm = 300 - k * 2;
        if (bm <= 16) {
          if (bm === 16) this.se('Z1 気を溜める2');
          bm = 16;
          const e = st.ef;
          e.frame++;
          if (e.frame === 8 && e.type === 0) { e.frame = 0; e.type = 1; this.pose(A, 2); } else if (e.frame === 8 && e.type === 1) { e.frame = 0; e.type = 0; this.pose(A, 3); }
        }
        if (k === 0) {
          eff = 0; st.ef.frame = 0; st.ef.type = 0;
          st.no = 1; A.x = TEC_CENTER; A.y = STD_Y;
          this.se('Z1 気を溜める');
          three = true; absorb(); this.pose(A, 1, true); st.cutFlag = false;
        }
        st.back(P.genkiBall, st.ba.type * 126, 0, 126, 126, A.x - 10, STD_Y - bm); st.backStep(8, 1);
        if (f === 1350) this.pose(A, 4);
      }
      if (f >= 1351 && f <= 1500) { // the great aura, the ground shaking
        if (f === 1351) { audio.playBgs('Z1 大地が揺れる'); this.se('Z1 気を溜める7'); }
        st.back(P.aura9, 0, st.ba.type * 378, 640, 378, 0, -16); st.backStep(4, 2);
        flick([4, 5]);
      }
      if (f === 1501) {
        st.cutFlag = true; st.cut = true; st.mirror = true;
        this.out();
        eff = 0; st.ef.frame = 0; st.ef.type = 0; st.ba.type = 0; st.ba.frame = 0;
        this.pose(G, 0, false); st.no = 0; this.pose(A, 12);
      }
      if (f >= 1511 && f <= 2000) { // he walks in with it
        if (f === 1511) { A.x = TEC_CENTER - 640; A.y = STD_Y + 4; A.sp = true; }
        let dx = 0, rows = [12, 13];
        if (f <= 1665) A.x += 4;
        if (f >= 1731 && f <= 1800) {
          if (f === 1731) { audio.seStop(); this.se('Z1 飛ぶ'); A.x -= 12; this.pose(A, 6); }
          if (f - 1731 <= 3) A.x -= 4;
          dx = 12; rows = [6, 7];
        }
        if (f >= 1801 && f <= 1890) {
          if (f === 1801) { audio.stopBgs(); this.se('Z1 ダメージ'); this.se('Z1 強打'); this.pose(G, 16); this.pose(A, 8); }
          if (f - 1801 <= 3) A.x += 16;
          rows = [8, 9];
        }
        if (f >= 1891) {
          if (f === 1891) { this.se('Z1 エネルギー波'); A.x += 2; this.pose(G, 16); this.pose(A, 10); }
          dx = -2; rows = [10, 11];
        }
        st.back(P.aura9, 0, st.ba.type * 378, 640, 378, A.x - 276 + dx, -16); st.backStep(4, 2);
        flick(rows);
      }
      if (f === 2001) { A.y = -200; this.fromat(); yield; break; }
      if (eff === 201 || eff === 101 || eff === 253 || eff >= 267) this.cmcBDo(st, eff, rx, ry);
      this.mv();
      yield;
    }
  },
});

cmcFilms({
  712: ['cmcBEarth', 'cmcD46', true],
  738: ['cmcBThree', 'cmcD42', true],
  741: ['cmcBGoAway', 'cmcD41', true],
  744: ['cmcBDodge', 'cmcD42', true],
  754: ['cmcBMom', 'cmcD46', true],
  762: ['cmcBSlash', 'cmcD41', true],
  763: ['cmcBGalick', 'cmcD41c', true],
  764: ['cmcBOyako', 'cmcD44', true],
  770: ['cmcBMom', 'cmcD42', true],
});

export const CMC2_SOUNDS = ['Z1 逃げる', 'Z1 高速移動', 'Z1 気を溜める', 'Z1 分身', 'Z1 強打', 'Z3 超能力', 'Z3 打撃', 'Z3 エネルギー波', 'Z1 飛ぶ',
  'ZG 光線系ヒット2', 'Z1 ザー', 'Z1 ゴー', 'Z1 ダメージ', 'Z1 怪光線', 'Z3 変身', 'Z1 エネルギー波2', 'Z3 避ける', 'ZG 打撃4', 'ZG 打撃2',
  'Z1 打撃', 'DB3 気を溜める2', 'Z1 エネルギー波', 'ZG 打撃5', 'ZG 打撃1', 'Z1 ブン', 'Z3 剣攻撃', 'DB3 エネルギー波2', 'Z1 気を溜める3',
  'Z1 大猿', 'ZG 光線1', 'Z3 光線系ヒット', 'DB3 刀', 'Z3 跳ね返し', 'Z3 気を溜める(超元気玉)', 'Z1 気を溜める2', 'Z1 気を溜める7'];

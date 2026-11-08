// S-combo films, ported from the classic version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like
// src/anime.js: the combo's attack pattern (combo skill id + 10) runs anime_pattern 31 (swoop in) → 32 (必殺技!)
// → the combo's own pattern (8xx) → the damage pattern. In Z1 the original shows no character cut-in
// (output_cutin draws nothing while $btl_progress == 0), so neither does this.
// A ComboDuel is a Duel whose left side can be any of the participants: `crew` = { actorId: { normal, special } }.
// Frame numbers in the comments are the original's @battle_anime_frame.
import { audio } from './core.js?v=20261108-1614';
import { Duel, draw, spark, BALL, RAY, BACKS, MAKANKO_BALL, POWER_BALL, BOOM, STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED, SW, moveFilm, ANIME_IMAGES } from './anime.js?v=20261108-1614';

// combo skill id → [film, damage pattern]
const FILMS = {
  701: ['shitei', 23], // 師弟の絆 (801)
  706: ['kameRanbu', 23], // カメハメ乱舞 (806)
  708: ['genkiWish', 27], // 願いを込めた元気弾 (808)
  739: ['strongest', 23], // この世で一番強いヤツ (839)
  748: ['yamchaThanks', 23], // もしもヤムチャに (848 → 171 → 848 → 105)
  751: ['thanksPiccolo', 23], // ありがとうピッコロさん！ (851)
  752: ['krillinToo', 23], // 行くぞクリリン (852)
  819: ['doubleEyeBeam', 23], // ダブルアイビーム (919)
  705: ['sutemi', 23], // 捨て身の攻撃 (805)
  709: ['doubleDodonpa', 23], // ダブルどどんぱ (809)
  710: ['psychoKikou', 28], // 超能力気功砲 (810)
  707: ['sokiEnzan', 23], // 繰気円斬 (807, shortened)
  711: ['rokakuSouda', 23], // 狼鶴相打陣 (811, shortened)
  704: ['doubleShock', 22], // ダブル衝撃波 (804)
  730: ['kameRyu', 23], // 亀仙流かめはめは (830)
  786: ['doubleKame', 43], 787: ['doubleKame', 43], 788: ['doubleKame', 43], 789: ['doubleKame', 43], 790: ['doubleKame', 43], // ダブルかめはめ波 (2886-2890)
};
// the other combo films (docs/anim-f-plan.md): { combo: [film, damage pattern or the name of a method that plays it] }
export function addComboFilms(more) { Object.assign(FILMS, more); }
// the Z3 pictures of the ダブルかめはめ波 ($btl_top_file_name Z3_: every one of them opens in Z3 or later)
const pic = (n) => `Graphics/Pictures/${n}`;
const AURA_Z3 = pic('Z3_戦闘_必殺技_気を溜める.png'); // back 201: two frames of 136×142
const RAY_Z3_BIG = pic('Z3_戦闘_必殺技_エネルギー波_大.png'); // effects 359-362: 400×92, the lower half
const RAY_Z3_HUGE = [pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG'), 192, 76]; // effect 48
const STD_CHAX = -70; // (src/anime.js)
const RANBU_RAY = pic('Z1_戦闘_必殺技_カメハメ乱舞エネルギー波.png'); // effect 62: 400×152
const SHITEI_RAY = pic('Z1_戦闘_必殺技_エネルギー波_大(師弟の絆).PNG'); // effect 83: two frames of 400×92
// a Super Saiyan row has the Super Saiyan in the crew in place of the base form
const SS = { 3: 14, 5: 18, 12: 19, 17: 20, 25: 26, 16: 32 };
// combo → [the other one's charge row, fire row, his aura's x offset, his beam's offset from (340, 200)] (2886-2890)
const DOUBLE_KAME = { 786: [2, 3, 0, [4, -126]], 787: [11, 12, -18, [-10, -122]], 788: [2, 3, -14, [-10, -122]],
  789: [2, 3, -2, [6, -130]], 790: [5, 1, -2, [22, -134]] };

// moves without a film of their own yet borrow the one they come from (as ひらめき does, src/combo.js): 超元気玉 19 →
// 元気玉 18, 瞬間移動かめはめ波 27 → スーパーかめはめ波 26
const BORROW = { 19: 18, 27: 26 };

export class ComboDuel extends Duel {
  constructor(opts) {
    super({ ...opts, skill: opts.combo, playerAttacks: true, hit: true });
    this.combo = opts.combo;
    this.crew = opts.crew;
    this.lead = opts.lead; // the participant whose turn started the combo (@chanum)
    // a combo without a film of its own (chain): each participant's own move (opts.tecs: actor id → skill id)
    this.tecs = Object.fromEntries(Object.entries(opts.tecs || {}).map(([id, sk]) => [id, moveFilm(sk) || moveFilm(BORROW[sk]) || 'energyWave']));
  }

  * run() {
    const [film, dmg] = FILMS[this.combo] || ['chain', 23];
    yield* this.swoopIn(); // 31
    yield* this.launch(); // 32
    yield* this[film]();
    audio.seStop();
    if (dmg === 28) yield* this.shakeBoom();
    else if (dmg === 43) yield* this.bigBoom();
    else if (dmg === 22) yield* this.blownAway(); // shock-wave hit
    else if (dmg === 27) yield* this.blownUpLeft();
    else if (typeof dmg === 'string') yield* this[dmg]();
    else yield* this.explode(17, 50); // 23
    audio.seStop();
    this.ending = true;
    for (let i = 0; i < 10; i++) { this.fade = (i + 1) / 10; yield; }
  }

  sheet(id, sp) { const m = this.crew[this.who(id)]; return sp ? m.special : m.normal; } // (a Super Saiyan's row: his sheets)
  who(id) { return this.crew[id] ? id : SS[id]; } // the crew member who is `id` (or his Super Saiyan form)
  // back 48: the after-images left by someone vanishing at high speed (every 4th frame of the back counter, `phase` ahead)
  afterImage(x, y, phase = 0) { return (c, t) => { if ((t + phase) % 4 === 0) spark(c, 0, 48, 64, 64, x, y); }; }
  // effect 121: the spark at the attacker's fist and on the defender (as src/anime.js knockBack)
  hitSpark() {
    return (c, t) => {
      if (t > 10) return;
      spark(c, t <= 4 ? 0 : 32, 16, 32, 32, this.L.x + 96, this.L.y + 32);
      spark(c, 32, 0, 32, 16, this.R.x, this.R.y);
    };
  }
  // effect 52 / back 36: a partner flickering in (normal-sheet rows 14, 13, 12), then `row` of `rest`'s sheet
  appear(id, x, row, sp) {
    return (c, t) => {
      if (t <= 30) draw(c, this.sheet(id, false), 0, (t <= 10 ? 14 : t <= 20 ? 13 : 12) * 96, 96, 96, x, STD_Y);
      else draw(c, this.sheet(id, sp), 0, row * 96, 96, 96, x, STD_Y);
    };
  }
  // the lead steps aside for n frames at `dx` a frame (stopping at `stop` on a narrow screen)
  * stepAside(dx, n, total, stop = dx < 0 ? -1e9 : 1e9) {
    for (let f = 1; f < total; f++) { if (f <= n) this.A.x = dx < 0 ? Math.max(stop, this.A.x + dx) : Math.min(stop, this.A.x + dx); yield; }
  }

  // ---- 805 捨て身の攻撃 (悟空 + 比克): 比克 charges 魔貫光殺砲 while 悟空 grabs the enemy from behind ----
  * sutemi() {
    const lead = this.lead === this.who(3) ? 3 : 4;
    // 比克 stands at x 110 in the original; on a phone (stage cropped by `margin` each side) he moves in so he and his aura stay whole
    const px = Math.max(CENTER_CHAX - 130, Math.round(this.margin) + 28), dx = px - (CENTER_CHAX - 130);
    this.se('Z1 逃げる');
    this.pose(this.A, 0, true);
    yield;
    // 1-70: the lead steps aside, the other appears (effect 52: row 8 of the normal sheet)
    this.effect(lead === 3 ? this.appear(4, CENTER_CHAX - 114 + dx, 8, false) : this.appear(3, CENTER_CHAX + 180, 8, false));
    yield* this.stepAside(lead === 3 ? 4 : -4, 39, 71, lead === 3 ? undefined : px + 6);
    // 71-149: both ready, 悟空's ki ball grows (effect 53), at 110 悟空 dashes off (effect 54)
    this.A.y = -200;
    this.se('Z1 エネルギー波');
    const ball = this.ball(BALL.orange, 388, 100, 11);
    const piccolo = (row) => (c) => draw(c, this.sheet(4, true), 0, row * 96, 96, 96, px, STD_Y);
    this.effect((c, t) => {
      if (t < 39) draw(c, this.sheet(3, true), 0, 2 * 96, 96, 96, CENTER_CHAX + (lead === 3 ? 178 : 168), STD_Y);
      piccolo(0)(c);
      ball(c, t);
    });
    yield* this.wait(39);
    this.se('Z1 高速移動');
    yield* this.wait(40);
    // 150-210: 比克 charges, the aura behind him (back 18), finger to the forehead from 180 (effect 55 → 56)
    this.se('Z1 気を溜める3');
    this.behind(this.cycler(BACKS.flame, 128, 192, CENTER_CHAX - 156 + dx, 56));
    this.effect((c, t) => piccolo(t < 30 ? 5 : 7)(c));
    yield* this.wait(61);
    // 211-259: the cut to the enemy; 悟空's energy wave hits it and knocks it up (effect 31), then his
    // after-image appears behind it (effect 58)
    this.behind(null);
    this.aim();
    const [ray, h, ry] = RAY.small;
    this.effect((c, t) => {
      if (t < 29) draw(c, ray, 0, 0, 400, h, -400 + t * RAY_SPEED, ry);
      else if (t % 4 === 0) spark(c, 0, 48, 64, 64, CENTER_ENEX + 64, STD_Y - 60);
    });
    for (let f = 211; f < 260; f++) {
      if (f === 222) this.se('Z1 飛ぶ');
      if (f === 223) this.pose(this.G, 16);
      if (f >= 223 && f < 230) this.G.y -= 12;
      if (f === 230) this.pose(this.G, 0);
      yield;
    }
    // 260-299: 悟空 holds it from behind (back 19)
    this.se('Z1 強打');
    this.effect(null);
    const gx = this.G.x;
    this.behind((c) => draw(c, this.sheet(3, true), 0, 11 * 96, 96, 96, CENTER_ENEX + 12, STD_Y - 90));
    for (let f = 260; f < 300; f++) { this.G.x = gx + (f === 261 || f === 262 ? -4 : f === 263 || f === 264 ? 4 : 0); yield; }
    this.G.x = gx;
    // 300-391: back to 比克, the 魔貫光殺砲 forming at his fingers (effect 57)
    this.behind(this.cycler(BACKS.flame, 128, 192, CENTER_CHAX - 156 + dx, 56));
    this.G.y = -200;
    this.se('Z1 エネルギー波3');
    this.effect((c, t) => {
      piccolo(8)(c);
      const k = Math.floor(t / 7);
      if (k < 6) draw(c, MAKANKO_BALL, k * 128, 0, 128, 128, 88 + dx, 124);
    });
    yield* this.wait(92);
    // 392-419: the beam flies at the enemy while 悟空 lets go and jumps clear (effect 36, back 20)
    this.effect(null);
    this.aim();
    this.se('Z1 飛ぶ');
    const [mk, mh, my] = RAY.makanko;
    this.behind((c, t) => {
      if (t <= 8) draw(c, this.sheet(3, true), 0, 10 * 96, 96, 96, CENTER_ENEX + 12 + t * 8, STD_Y - 6);
      else draw(c, this.sheet(3, true), 0, 11 * 96, 96, 96, CENTER_ENEX + 44, STD_Y - (t - 8) * 16);
    });
    this.effect((c, t) => draw(c, mk, 0, 0, 400, mh, -400 + t * RAY_SPEED, my));
    yield* this.wait(28);
    this.behind(null);
    this.effect(null);
  }

  // 天津飯 + 餃子 (809 / 810): the lead steps aside (天津飯 left, 餃子 right) while the other flickers in (back 36)
  * tienChaozu() {
    const tien = this.lead === 8;
    this.se('Z1 逃げる');
    this.pose(this.A, 0, true);
    yield;
    this.behind(tien ? this.appear(9, CENTER_CHAX + 120, 0, true) : this.appear(8, CENTER_CHAX - 66, 0, true));
    yield* this.stepAside(tien ? -4 : 4, tien ? 23 : 24, 60);
    this.A.y = -200;
  }
  pair(chaozu, tien) { // 餃子 and 天津飯 side by side in the given special-sheet rows (back 37 / 38 / 42)
    return (c) => {
      draw(c, this.sheet(9, true), 0, chaozu * 96, 96, 96, CENTER_CHAX + 120, STD_Y);
      draw(c, this.sheet(8, true), 0, tien * 96, 96, 96, CENTER_CHAX - 66, STD_Y);
    };
  }

  * doubleDodonpa() { // 809 ダブルどどんぱ: two fingers raised, two balls, two beams
    yield* this.tienChaozu();
    this.se('Z1 気を溜める');
    this.behind(this.pair(2, 7)); // 60-120
    yield* this.wait(61);
    this.se('Z1 怪光線');
    this.behind(this.pair(3, 8)); // 121-159
    yield* this.wait(10);
    const b1 = this.ball(BALL.orange, 336, 120, 11), b2 = this.ball(BALL.orange, 142, 110, 11); // effect 80
    this.effect((c, t) => { b1(c, t); b2(c, t); });
    yield* this.wait(29);
    this.behind(null);
    const [ray, h] = RAY.small; // 160-187: effect 81
    yield* this.cut((c, t) => { for (const y of [144, 174]) draw(c, ray, 0, 0, 400, h, -400 + t * RAY_SPEED, y); }, 28);
  }

  * psychoKikou() { // 810 超能力気功砲: 餃子 holds the enemy with his mind while 天津飯 charges the 気功砲
    yield* this.tienChaozu();
    this.se('Z1 気を溜める');
    this.se('Z1 ザー');
    const pair = this.pair(1, 2), mind = this.cycler(BACKS.psychic, 128, 160, CENTER_CHAX + 102, 110), four = this.cycler(BACKS.gatherFour, 640, 360, 0, 0, 3, 360);
    this.behind((c, t) => { pair(c); mind(c, t); four(c, t); }); // back 42, 43, 8 (60-180)
    yield* this.wait(121);
    this.aim(); // 181
    yield;
    this.behind(this.kikouBack()); // 182-208: back 9
    yield* this.wait(27);
    this.behind(null);
  }

  * shakeBoom() { // damage 28: the enemy shakes in the psychic grip, then blows up and falls
    this.se('Z3 超能力');
    this.pose(this.G, 0, false);
    const x = this.G.x;
    for (let f = 1; f <= 85; f++) {
      if (f < 40) this.G.x = x + (f % 2 ? -6 : 6);
      if (f === 40) {
        this.G.x = x;
        audio.seStop();
        this.se('Z3 光線系ヒット');
        this.showHit();
        this.pose(this.G, 17);
        this.effect((c, t) => { const k = Math.floor(t / 10); if (k < 2) draw(c, 'Graphics/Pictures/戦闘アニメ_爆発1.PNG', k * 96, 0, 96, 96, 320, 120); });
      }
      if (f >= 61 && f <= 74) this.G.y += 20;
      if (f === 75) this.effect(null);
      yield;
    }
  }

  // ---- 804 ダブル衝撃波 (悟空 + 琪琪): the lead steps back while the other flickers in (effect 50), both raise a
  // hand (effect 51), then the shock wave behind the enemy (back 1) ----
  * doubleShock() {
    const other = this.lead === this.who(3) ? 10 : 3;
    this.se('Z1 逃げる');
    this.pose(this.A, 0, false);
    yield;
    this.effect(this.appear(other, CENTER_CHAX + 120, 8, false));
    yield* this.stepAside(-2, 40, 71);
    this.se('Z1 高速移動');
    this.se('Z1 ゴー');
    this.pose(this.A, 1, true);
    this.effect((c) => draw(c, this.sheet(other, true), 0, 96, 96, 96, CENTER_CHAX + 104, STD_Y));
    yield* this.wait(59);
    this.se('Z1 衝撃波');
    this.effect(null);
    this.A.y = -200;
    this.G.x = CENTER_ENEX; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    this.behind(this.shockBack());
    yield* this.wait(59);
    this.behind(null);
  }

  // ---- 830 亀仙流かめはめは (悟空・克林・雅木茶・龜仙人): the lead walks to his place while the other three flicker in
  // (back 115-120), all four charge (back 8) with 悟空 in the middle (@btl_ani_cha_chg_no = 3), four balls
  // (effect 95), then the huge wave (effect 48) ----
  * kameRyu() {
    const SLOT = { 6: 74, 3: 198, 24: 336, 7: 458 }; // CENTER_CHAX −166 / −42 / +96 / +218
    // the four take 480 px of the stage: on a phone they close up so all of them stay on screen
    const lo = Math.max(74, Math.round(this.margin)), hi = Math.min(458, SW - Math.round(this.margin) - 96);
    const X = (x) => Math.round(lo + ((x - 74) * (hi - lo)) / 384);
    const MOVE = { 3: 17, 24: 18, 6: 24, 7: 24 }; // the frames the lead walks (@ax until frame 18 / 19 / 25)
    const lead = this.lead === this.who(3) ? 3 : this.lead, others = [3, 24, 6, 7].filter((id) => id !== lead);
    const rows = { 24: 2, 6: 1, 7: 1 }; // @scombo_cha*_anime_type from frame 60 (190: 3 / 2 / 2)
    const at = (id, row) => (c) => draw(c, this.sheet(id, true), 0, row * 96, 96, 96, X(SLOT[id]), STD_Y);
    this.se('Z1 逃げる');
    this.pose(this.A, 0, false);
    yield;
    // 1-59: the lead walks to his place, the others flicker in (normal sheet rows 14, 13, 12, then their special sheet)
    const flick = others.map((id) => this.appear(id, X(SLOT[id]), 0, true));
    this.behind((c, t) => flick.forEach((f) => f(c, t)));
    const n = MOVE[lead], dx = (X(SLOT[lead]) - this.A.x) / n;
    for (let f = 1; f < 60; f++) { if (f <= n) this.A.x += dx; yield; }
    // 60-190: 悟空 in the lead's place, everyone charging (back 8 over them)
    this.L.sheets = this.crew[this.who(3)];
    this.A.x = X(SLOT[3]);
    this.pose(this.A, 3, true);
    this.se('Z1 ザー');
    this.se('Z1 ゴー');
    this.se('DB3 気を溜める2');
    const aura = this.cycler(BACKS.gatherFour, 640, 360, 0, 0);
    this.behind((c, t) => { for (const id of [24, 6, 7]) at(id, rows[id])(c); aura(c, t); });
    yield* this.wait(130);
    // 190: the hands forward; 191-299: four balls (effect 95)
    rows[24] = 3; rows[6] = 2; rows[7] = 2;
    audio.seStop();
    this.se('Z1 エネルギー波2');
    this.se('Z1 ゴー');
    yield;
    this.pose(this.A, 4, true);
    const balls = [[6, 56, 122], [3, 172, 116], [24, 310, 126], [7, 430, 118]].map(([id, x, y]) => this.ball(BALL.orange, X(SLOT[id]) + x - SLOT[id], y));
    this.effect((c, t) => balls.forEach((b) => b(c, t)));
    yield* this.wait(109);
    // 300: everyone off; 302-326: the wave on the enemy
    this.behind(null);
    this.effect(null);
    yield* this.cut(RAY.huge, 27, -30);
  }

  // ---- 2886-2890 ダブルかめはめ波 (悟空 / 悟飯 / 克林 / 雅木茶 / 未來悟飯 + 龜仙人): the lead rises (or 龜仙人 sinks) while
  // the other flies in below (effect 90) / above (89); the other one above and 龜仙人 below (effect 92), both charge
  // with an aura each (back 201 ×2, back 118), two big beams (effects 359-362), then the huge wave on the enemy (48) ----
  * doubleKame() {
    const [charge, fire, au, beam] = DOUBLE_KAME[this.combo];
    const other = Number(Object.keys(this.crew).find((id) => Number(id) !== 24)), roshiLead = this.lead === 24;
    const [ux, uy] = other === 14 ? [14, -132] : beam; // (359: 超悟空 a little higher)
    const roshi = (row) => (c) => draw(c, this.sheet(24, true), 0, row * 96, 96, 96, TEC_CENTER, STD_Y + 50);
    this.se('Z1 逃げる');
    this.pose(this.A, 0, true);
    yield;
    // 1-39
    const mate = roshiLead ? other : 24, my = roshiLead ? -50 : 50;
    this.effect((c, t) => draw(c, this.sheet(mate, true), 0, 0, 96, 96, STD_CHAX + (t - 1) * 8 + 30, STD_Y + my));
    for (let f = 1; f <= 39; f++) { if (f <= 10) this.A.y += roshiLead ? 5 : -5; yield; }
    // 40-59: the lead's sprite is the other one's, up there
    if (roshiLead) { this.A.y -= 100; this.L.sheets = this.crew[other]; }
    this.effect(roshi(0));
    yield* this.wait(20);
    // 60
    this.se('Z3 変身');
    this.se('Z1 気を溜める');
    yield;
    // 61-187: the charge
    this.effect(null);
    this.pose(this.A, charge, true);
    const aura = (x, y) => (c, t) => draw(c, AURA_Z3, (Math.floor(t / 16) % 2) * 136, 0, 136, 142, x, y);
    const lo = aura(216, 136), hi = aura(234 + au, 36), r2 = roshi(2);
    this.behind((c, t) => { lo(c, t); hi(c, t); r2(c); });
    yield* this.wait(127);
    // 188-269: the two beams
    audio.seStop();
    this.se('DB3 エネルギー波2');
    this.se('Z1 エネルギー波');
    this.pose(this.A, fire, true);
    this.behind(roshi(3));
    this.effect((c, t) => {
      const w = Math.min(400, 54 + t * RAY_SPEED);
      draw(c, RAY_Z3_BIG, 0, 92, w, 92, 340 + ux, 200 + uy);
      draw(c, RAY_Z3_BIG, 0, 92, w, 92, 330, 180);
    });
    yield* this.wait(82);
    // 270-280: both gone; 281-305: the wave on the enemy
    this.A.y = -200;
    this.effect(null);
    this.behind(null);
    yield* this.wait(11);
    yield* this.cut(RAY_Z3_HUGE, 25, -30);
  }

  // ---- 801 師弟の絆 (比克 + 悟飯): the lead steps aside while the other flickers in (back 46), both vanish (back 47 / 48),
  // 比克 then 悟飯 come out of nowhere and knock the enemy off the stage (effect 121), both charge (back 49 + 51) and
  // fire (back 50, effect 82), and the two beams come as one (effect 83) ----
  * shitei() {
    const piccolo = this.who(4), gohan = this.who(5), pLead = this.lead === piccolo;
    this.se('Z1 逃げる');
    this.pose(this.A, 0, true);
    yield;
    // 1-59: 比克 steps left to x 174 / 悟飯 right to x 360
    this.behind(pLead ? this.appear(gohan, CENTER_CHAX + 120, 0, true) : this.appear(piccolo, CENTER_CHAX - 66, 0, true));
    for (let f = 1; f <= 59; f++) { this.A.x += pLead ? (f < 24 ? -4 : 0) : (f < 24 ? 4 : f === 24 ? 2 : 0); yield; }
    // 60-100: 比克 vanishes while 悟飯 waits (back 47 + 48); 101-140: then 悟飯 (48)
    this.A.y = -200;
    this.se('Z1 高速移動');
    const g0 = (c) => draw(c, this.sheet(gohan, true), 0, 0, 96, 96, CENTER_CHAX + 120, STD_Y), a1 = this.afterImage(TEC_CENTER - 72, STD_Y + 26, 3);
    this.behind((c, t) => { g0(c); a1(c, t); });
    yield* this.wait(41);
    this.se('Z1 高速移動');
    this.behind(this.afterImage(TEC_CENTER + 114, STD_Y + 26));
    yield* this.wait(40);
    this.behind(null);
    yield* this.wait(9);
    // 150: the enemy in the middle; 160-180 比克 appears in front of it (back 48)
    this.G.x = CENTER_ENEX; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    this.L.sheets = this.crew[piccolo];
    this.A.x = CENTER_CHAX;
    this.pose(this.A, 0, false);
    yield* this.wait(10);
    this.se('Z1 高速移動');
    this.behind(this.afterImage(CENTER_CHAX + 16, STD_Y + 26));
    yield* this.wait(20);
    this.A.y = STD_Y;
    yield;
    this.behind(null);
    // 186-206: two blows and a hard one
    const blow = (row, se = 'Z1 打撃') => { this.se(se); this.pose(this.A, row); };
    yield* this.wait(5);
    blow(2); yield* this.wait(5);
    blow(1); yield* this.wait(10);
    blow(4, 'Z3 打撃'); this.pose(this.G, 16); yield* this.wait(6);
    // 207-225: the enemy flies off to the right (effect 121); at 225 it comes back in from the left
    this.effect(this.hitSpark());
    for (let f = 207; f <= 225; f++) {
      if (f === 225) { this.A.y = -200; this.G.x = -96; this.pose(this.A, 0); this.L.sheets = this.crew[gohan]; }
      this.G.x += 18;
      yield;
    }
    // 226-246: … into 悟飯, who appears in front of it (back 48)
    this.se('Z1 高速移動');
    this.behind(this.afterImage(CENTER_CHAX + 16, STD_Y + 26, 1));
    for (let f = 226; f <= 246; f++) {
      if (f === 235) this.pose(this.G, 0, false);
      if (f === 246) this.A.y = STD_Y; else this.G.x += 18;
      yield;
    }
    this.behind(null);
    // 252-273: 悟飯's blows
    yield* this.wait(5);
    blow(4); yield* this.wait(6);
    blow(3); yield* this.wait(10);
    blow(1, 'Z3 打撃'); this.pose(this.G, 16);
    this.effect(this.hitSpark());
    yield* this.wait(6);
    // 274-293: off to the right again, then both leave the stage
    for (let f = 274; f <= 293; f++) {
      if (f === 293) { this.G.y = -200; this.A.y = -200; this.pose(this.G, 0, false); } else this.G.x += 18;
      yield;
    }
    this.effect(null);
    // 294-353: side by side, charging (back 49, the auras of back 51 over them)
    this.se('Z1 気を溜める2');
    this.se('Z1 気を溜める3');
    const pair = (gr, pr) => (c) => {
      draw(c, this.sheet(gohan, true), 0, gr * 96, 96, 96, CENTER_CHAX + 120, STD_Y);
      draw(c, this.sheet(piccolo, true), 0, pr * 96, 96, 96, CENTER_CHAX - 66, STD_Y);
    };
    const charge = pair(2, 5), green = this.cycler(BACKS.auraGreen, 160, 222, 144, 70), gold = this.cycler(BACKS.flame3, 160, 160, 330, 112);
    this.behind((c, t) => { charge(c); green(c, t); gold(c, t); });
    yield* this.wait(60);
    // 354-410: hands forward, a green and an orange ball (back 50, effect 82)
    audio.seStop();
    this.se('Z1 エネルギー波2');
    this.behind(pair(3, 6));
    const b1 = this.ball(BALL.green, 156, 114), b2 = this.ball(BALL.orange, 348, 130);
    this.effect((c, t) => { b1(c, t); b2(c, t); });
    yield* this.wait(57);
    // 411-438: the joined beam (effect 83)
    yield* this.cut((c, t) => draw(c, SHITEI_RAY, 0, (Math.floor(t / 9) % 2) * 92, 400, 92, -400 + t * RAY_SPEED, 124), 27);
  }

  // ---- 806 カメハメ乱舞 (悟空 + 克林 + 雅木茶): 克林 walks left / 雅木茶 right while the other two flicker in (effect 60),
  // the three charge in a row on the 四身の拳 aura (back 8, effect 61), three balls, then one great wave (effect 62) ----
  * kameRanbu() {
    const goku = this.who(3), lead = this.lead === goku ? 3 : this.lead;
    // 克林 x 100 … 雅木茶 x 438 take 434 px of the stage: on a phone they close up so all three stay on screen
    const lo = Math.max(100, Math.round(this.margin)), hi = Math.min(438, SW - Math.round(this.margin) - 96);
    const X = (x) => Math.round(lo + ((x - 100) * (hi - lo)) / 338);
    this.se('Z1 逃げる');
    this.pose(this.A, 0, true);
    yield;
    // 1-59: the two others flicker in (normal-sheet rows 14, 13, 12, then 8); 克林 walks 166 px left, 雅木茶 174 right
    const at = { 3: X(284), 6: X(128), 7: X(458) };
    const others = [goku, 6, 7].filter((id) => id !== this.lead);
    this.effect((c, t) => {
      const row = t <= 10 ? 14 : t <= 20 ? 13 : t <= 30 ? 12 : 8;
      for (const id of others) draw(c, this.sheet(id, false), 0, row * 96, 96, 96, at[id === goku ? 3 : id], STD_Y);
    });
    const x0 = this.A.x, to = lead === 6 ? X(100) : lead === 7 ? X(440) : x0, n = lead === 6 ? 166 : 174;
    for (let f = 1; f <= 59; f++) {
      const d = lead === 6 ? (f <= 41 ? 4 * f : f === 42 ? 166 : 166) : lead === 7 ? (f <= 43 ? 4 * f : 174) : 0;
      this.A.x = x0 + ((to - x0) * d) / n;
      yield;
    }
    // 60-299: the three charging in a row (effect 61) on the aura (back 8); hands forward at 181, three balls from 210
    this.A.y = -200;
    this.se('Z1 ザー');
    this.se('Z1 ゴー');
    this.se('DB3 気を溜める2');
    this.behind(this.cycler(BACKS.gatherFour, 640, 360, 0, 0));
    this.effect((c, t) => {
      const fire = t > 120;
      draw(c, this.sheet(goku, true), 0, (fire ? 4 : 3) * 96, 96, 96, X(270), STD_Y);
      draw(c, this.sheet(6, true), 0, (fire ? 2 : 1) * 96, 96, 96, X(100), STD_Y + 2);
      draw(c, this.sheet(7, true), 0, (fire ? 2 : 1) * 96, 96, 96, X(438), STD_Y - 2);
      if (t < 150) return;
      const k = Math.floor((t - 150) / 10);
      if (k > 5) return;
      for (const [x, y, d] of [[242, 114, 270], [-18, 120, 100], [-24, 112, 438]]) draw(c, BALL.orange, k * 128, 0, 128, 128, X(d) + (x === 242 ? -28 : x), y);
    });
    yield* this.wait(130);
    audio.seStop();
    this.se('Z1 エネルギー波2');
    yield* this.wait(110);
    // 300-301: the enemy alone; 302-328: the wave (effect 62)
    this.behind(null);
    yield* this.cut((c, t) => { if (t > 0) draw(c, RANBU_RAY, 0, 0, 400, 152, -400 + (t - 1) * RAY_SPEED, 100); }, 28);
  }

  // ---- 808 願いを込めた元気弾 (悟空 + 悟飯): 悟空 raises the 元気弾 (as his own 118, on the demon backdrop, back 2 → 7 →
  // the hand, 11; the ball, effect 20) and throws it (effect 40, back 1); the enemy jumps over it, and 悟飯 bats it
  // back (effects 67, 68) into the enemy from below (69). When 悟飯 starts it, 悟空 first flickers in in his place. ----
  * genkiWish() {
    const goku = this.who(3), gohan = this.who(5);
    this.L.sheets = this.crew[goku];
    if (this.lead === gohan) { // 0-61: 悟空 flickers in (normal-sheet rows 14, 13, 12, then the special sheet)
      this.se('Z1 逃げる');
      for (let f = 0; f <= 61; f++) { if (f <= 30) this.pose(this.A, f <= 10 ? 14 : f <= 20 ? 13 : 12, false); else this.pose(this.A, 0, true); yield; }
    }
    // 0 / 1: hands up
    this.se('Z1 気を溜める(元気弾)');
    this.pose(this.A, 7, true);
    yield;
    if (this.lead !== gohan) yield;
    // 2-119: the demon backdrop (back 2); 120-220: the gathering (back 7)
    this.behind((c, t) => draw(c, BACKS.demonV, 0, (Math.floor(t / 5) % 3) * 480, 640, 356, 0, 0));
    yield* this.wait(118);
    audio.seStop();
    this.se('Z1 ザー');
    this.behind(this.cycler(BACKS.gather4, 640, 356, 0, 0, 3, 360));
    yield* this.wait(101);
    // 221-310: the ki in his hand (back 11)
    this.pose(this.A, 8, true);
    this.behind(this.cycler(BACKS.handOne, 40, 48, 266, 116, 10));
    yield* this.wait(90);
    // 311-349: the ball grows over him (effect 20)
    this.se('Z1 エネルギー波');
    this.pose(this.A, 9, true);
    this.behind(null);
    this.effect(this.ball(POWER_BALL, 230, 76));
    yield* this.wait(39);
    this.effect(null);
    yield* this.wait(10);
    // 360: the cut to the enemy; 370-450 the ball flies in (effect 40, back 1 until 400), the enemy jumps over it at 411
    this.aim();
    this.L.sheets = this.crew[this.lead];
    yield* this.wait(10);
    const shock = this.shockBack();
    this.behind((c, t) => { if (t <= 30) shock(c, t); });
    this.effect((c, t) => draw(c, POWER_BALL, 256, 0, 128, 128, -400 + t * RAY_SPEED, 120));
    for (let f = 370; f <= 450; f++) {
      if (f === 410) this.se('Z1 飛ぶ');
      if (f === 411) this.pose(this.G, 16);
      if (f >= 411 && f <= 417) this.G.y -= 12;
      if (f === 418) this.pose(this.G, 0);
      yield;
    }
    this.behind(null);
    // 451-480: 悟飯, the ball coming at him (effect 67)
    this.L.sheets = this.crew[gohan];
    this.A.x = TEC_CENTER; this.A.y = STD_Y;
    this.pose(this.A, 2, true);
    this.G.y = -200;
    this.effect((c, t) => draw(c, POWER_BALL, (5 - (t === 0 ? 0 : Math.min(5, 1 + Math.floor((t - 1) / 10)))) * 128, 0, 128, 128, 252, 130));
    yield* this.wait(30);
    // 481-509: he bats it up (effect 68)
    this.se('Z1 吹っ飛ぶ');
    this.pose(this.A, 1, true);
    this.effect((c, t) => { const k = Math.max(0, Math.floor((t - 1) / 5)); if (k < 6) draw(c, POWER_BALL, k * 128, 0, 128, 128, 252, 130 - t * 4); });
    yield* this.wait(29);
    this.effect(null);
    yield;
    // 511-533: it comes down on the enemy from the lower right (effect 69)
    this.aim();
    this.effect((c, t) => draw(c, POWER_BALL, 256, 0, 128, 128, 640 - t * RAY_SPEED, 228 - t * 4));
    yield* this.wait(23);
    this.effect(null);
  }

  // ---- 839 この世で一番強いヤツ (悟空 + 比克 + 悟飯 + 克林): the four line up (back 115-120), the three vanish (back 48)
  // and 悟空 raises the 元気弾 (back 2 → 7); 比克 and 悟飯 dash in and strike, 比克 blasts the enemy from his mouth
  // (effect 5 on back 3), 克林 is knocked back and hits it off the stage (back 119), 悟空 makes the ball (back 11,
  // effect 20), the three watch it rise, and it comes in on the enemy (back 1, effect 40) ----
  * strongest() {
    const SLOT = { 5: 74, 3: 198, 4: 336, 6: 458 }; // CENTER_CHAX −166 / −42 / +96 / +218
    // the four take 480 px of the stage: on a phone they close up so all of them stay on screen (as kameRyu)
    const lo = Math.max(74, Math.round(this.margin)), hi = Math.min(458, SW - Math.round(this.margin) - 96);
    const X = (x) => Math.round(lo + ((x - 74) * (hi - lo)) / 384);
    const P = (c, id, sp, row, x, y) => draw(c, this.sheet(id, sp), 0, row * 96, 96, 96, x, y);
    this.se('Z1 逃げる');
    this.pose(this.A, 0, true);
    yield;
    // 1-59: the lead walks to his place (悟空 −4 / 比克 +4 a frame, 悟飯 −8 / 克林 +8), the others flicker in
    const lead = this.lead, others = [3, 4, 5, 6].filter((id) => id !== lead);
    this.behind((c, t) => { for (const id of others) P(c, id, t >= 31, t <= 10 ? 14 : t <= 20 ? 13 : t <= 30 ? 12 : 0, X(SLOT[id]), STD_Y); });
    const n = { 3: 17, 4: 18, 5: 24, 6: 24 }[lead], dx = (X(SLOT[lead]) - this.A.x) / n;
    for (let f = 1; f <= 59; f++) { if (f <= n) this.A.x += dx; yield; }
    // 60-120: 悟空 stays (in the lead's sprite), the other three vanish (back 48 ×3, one counter for the three)
    this.L.sheets = this.crew[3];
    this.A.x = X(198);
    this.pose(this.A, 0, true);
    this.se('Z1 高速移動');
    const ghosts = [4, 5, 6].map((id) => X(SLOT[id]) + 18);
    this.behind((c, t) => ghosts.forEach((x, i) => { if ((177 + 3 * t + i) % 4 === 0) spark(c, 0, 48, 64, 64, x, STD_Y + 24); }));
    yield* this.wait(61);
    this.behind(null);
    // 121-139: he walks to the middle
    const x0 = this.A.x;
    for (let f = 121; f <= 139; f++) { this.A.x = f <= 137 ? x0 + ((TEC_CENTER - x0) * (f - 120)) / 17 : TEC_CENTER; yield; }
    // 140: hands up; 142-259 the demon backdrop (back 2); 260-360 the gathering (back 7)
    this.se('Z1 気を溜める(元気弾)');
    this.pose(this.A, 7, true);
    yield* this.wait(2);
    this.behind((c, t) => draw(c, BACKS.demonV, 0, (Math.floor(t / 5) % 3) * 480, 640, 356, 0, 0));
    yield* this.wait(118);
    audio.seStop();
    this.se('Z1 ザー');
    this.behind(this.cycler(BACKS.gather4, 640, 356, 0, 0, 3, 360));
    yield* this.wait(101);
    // 361-371: the enemy alone
    this.behind(null);
    this.A.y = -200;
    this.G.x = CENTER_ENEX; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    yield* this.wait(10);
    audio.seStop();
    this.se('Z1 逃げる');
    yield;
    // 372-459: 比克 (above) and 悟飯 (below) dash in from the left (back 115 / 117, normal sheets) and strike at 399
    const pc = [0, 0, 90], gh = [0, 0, 150]; // [row, x, y]
    this.behind((c) => { P(c, 4, false, ...pc); P(c, 5, false, ...gh); });
    for (let f = 372; f <= 459; f++) {
      if (f <= 398) {
        const k = f - 372;
        pc[0] = f <= 385 ? 0 : f <= 391 ? 16 : 4; pc[1] = -178 + 16 * k;
        gh[0] = f <= 385 ? 0 : f <= 391 ? 16 : 2; gh[1] = -152 + 16 * k;
      } else if (f <= 406) {
        if (f === 399) { this.se('Z1 強打'); this.pose(this.G, 16); }
        pc[1] = 254; gh[1] = 280;
        this.G.x += f <= 402 ? 8 : -8;
      } else if (f >= 437) { // 悟飯 drifts back
        pc[0] = 0; gh[0] = 0;
        gh[1] = 280 - 4 * (f - 437); gh[2] = 150 + (f - 437);
      }
      yield;
    }
    // 460-580: 比克 blasts it from his mouth (as his 134: a green ball at the mouth, effect 5, on back 3)
    this.behind(null);
    this.se('Z1 気を溜める2');
    this.L.sheets = this.crew[4];
    this.A.y = STD_Y;
    this.pose(this.A, 2, true);
    this.G.y = -200;
    yield* this.wait(31);
    this.se('Z1 エネルギー波');
    this.pose(this.A, 4, true);
    this.effect(this.ball(BALL.green, 250, 140));
    yield;
    this.behind(this.cycler(BACKS.demonH, 640, 304, 0, 0));
    yield* this.wait(89);
    // 581-630: the hit (effect 101); 比克 falls back beside 悟飯 (back 115 / 117)
    this.L.sheets = this.crew[3];
    this.pose(this.A, 7, true);
    this.A.y = -200;
    audio.seStop();
    this.se('Z3 光線系ヒット');
    this.effect((c, t) => { const k = Math.floor(t / 10); if (k < 2) draw(c, BOOM, k * 96, 0, 96, 96, 320, 120); });
    this.G.y = STD_Y;
    this.pose(this.G, 16);
    pc[0] = 16; pc[2] = 90; gh[0] = 0; gh[1] = 192; gh[2] = 172;
    this.behind((c) => { P(c, 4, false, ...pc); P(c, 5, false, ...gh); });
    for (let f = 581; f <= 590; f++) { pc[1] = 254 - 12 * (f - 581); yield; }
    pc[0] = 0; pc[1] = 134;
    yield* this.wait(40);
    // 631-660: both fly off upwards
    this.se('Z1 逃げる');
    pc[0] = gh[0] = 16;
    this.pose(this.G, 0);
    for (let f = 631; f <= 660; f++) { pc[2] = 90 - 16 * (f - 631); gh[2] = 172 - 16 * (f - 631); yield; }
    // 661-770: 克林 runs in (back 119), is knocked back (681), comes again and hits the enemy off the stage (726)
    this.se('Z1 逃げる');
    const kr = [0, -70];
    this.behind((c) => P(c, 6, false, kr[0], kr[1], STD_Y));
    for (let f = 661; f <= 770; f++) {
      if (f <= 680) { const k = f - 661; kr[0] = k < 12 ? 0 : k < 17 ? 16 : 1; kr[1] = -70 + 16 * k; } else if (f <= 685) {
        if (f === 681) { audio.seStop(); this.se('DB3 SE041'); this.pose(this.G, 1); kr[0] = 16; }
        kr[1] = 250 - 24 * (f - 681);
      } else if (f <= 720) kr[1] = 130;
      else if (f <= 725) { kr[0] = 1; kr[1] = 130 + 24 * (f - 721); } else {
        if (f === 726) { audio.seStop(); this.se('ZG 打撃2'); this.pose(this.G, 16); }
        kr[1] = 250;
        this.G.x += 20;
      }
      yield;
    }
    // 771-860: 悟空 again, the ki in his hand (back 11); 861-919: the ball grows (effect 20)
    this.A.y = STD_Y;
    audio.seStop();
    this.se('Z1 ザー');
    this.pose(this.A, 8, true);
    this.behind(this.cycler(BACKS.handOne, 40, 48, 266, 116, 10));
    yield* this.wait(90);
    audio.seStop();
    this.se('Z1 エネルギー波');
    this.pose(this.A, 9, true);
    this.behind(null);
    this.effect(this.ball(POWER_BALL, 230, 76));
    yield* this.wait(59);
    // 920-1019: the three look up as it rises past them
    this.effect(null);
    this.A.y = -200;
    this.behind((c, t) => {
      const d = 2 * Math.min(t, 34);
      P(c, 4, false, 8, CENTER_CHAX - 90 + d, STD_Y - 86);
      P(c, 5, false, 5, CENTER_CHAX - 100 + d, STD_Y + 36);
      P(c, 6, false, 8, CENTER_CHAX + 200 - d, STD_Y + 76);
      draw(c, POWER_BALL, 256, 0, 128, 128, 254, 390 - t * 7);
    });
    yield* this.wait(100);
    // 1020-1068: it comes in on the enemy (back 1, effect 40)
    this.aim();
    yield;
    this.behind(this.shockBack());
    this.effect((c, t) => draw(c, POWER_BALL, 256, 0, 128, 128, -400 + t * RAY_SPEED, 120));
    yield* this.wait(48);
    this.behind(null);
    this.effect(null);
  }

  // a partner flickering in in the lead's own place (normal-sheet rows 14, 13, 12, then special row 0) for 0-61
  * flickerIn(id) {
    this.L.sheets = this.crew[id];
    this.se('Z1 逃げる');
    for (let f = 0; f <= 61; f++) { if (f <= 30) this.pose(this.A, f <= 10 ? 14 : f <= 20 ? 13 : 12, false); else this.pose(this.A, 0, true); yield; }
  }

  // ---- もしもヤムチャに (悟空 + 雅木茶; the original's attack 758): 雅木茶 flickers in in 悟空's place (848, as the
  // original's Z2+ film also for 超悟空), his 狼牙風風拳 (171), the enemy knocked off the stage (848 again, effect 121),
  // then 悟空's かめはめ波 (105) ----
  * yamchaThanks() {
    const goku = this.who(3);
    if (this.lead === goku) yield* this.flickerIn(7);
    else { this.pose(this.A, 0, true); yield; }
    this.L.sheets = this.crew[7];
    yield* this.wolfFang();
    audio.seStop();
    this.se('Z3 跳ね返し');
    this.pose(this.G, 16);
    this.effect(this.hitSpark());
    for (let f = 0; f <= 17; f++) { this.G.x += 18; yield; }
    this.effect(null);
    this.G.y = -200;
    this.pose(this.G, 0, false);
    yield;
    audio.seStop();
    this.L.sheets = this.crew[goku];
    this.A.x = TEC_CENTER; this.A.y = STD_Y;
    yield* this.kamehameha();
  }

  // ---- 851 ありがとうピッコロさん！ (比克 + 悟飯): 悟飯 stands alone (比克 starting it: 悟飯 flickers in in his place), the
  // enemy rushes in from the right and knocks him back while 比克 runs in from the left (back 115) and throws it off the
  // stage (100), then 比克's mouth blast (as his 134: effect 5 on back 3, the green beam 32) ----
  * thanksPiccolo() {
    const gohan = this.who(5);
    if (this.lead === 4) yield* this.flickerIn(gohan);
    this.L.sheets = this.crew[gohan];
    this.pose(this.A, 0, false);
    this.A.x = TEC_CENTER; this.A.y = STD_Y;
    this.G.x = SW + 32; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    yield* this.wait(this.lead === 4 ? 1 : 2);
    // 2-24: the enemy comes in (−16 a frame) and strikes 悟飯 (19); 比克 runs in (+16)
    this.se('Z1 逃げる');
    const pc = [0, 0]; // 比克's row and x (normal sheet)
    this.behind((c) => draw(c, this.sheet(4, false), 0, pc[0] * 96, 96, 96, pc[1], STD_Y));
    for (let f = 2; f <= 24; f++) {
      if (f === 14) this.pose(this.G, 16);
      if (f === 19) { this.pose(this.A, 16); this.pose(this.G, 1); }
      if (f >= 19) this.A.x -= 20;
      if (f === 24) this.se('Z1 強打');
      this.G.x -= 16;
      pc[1] = -102 + 16 * (f - 2);
      yield;
    }
    // 25-99: 比克 between them
    this.pose(this.G, 0);
    this.pose(this.A, 0);
    this.se('Z1 気を溜める2');
    pc[1] = CENTER_CHAX;
    for (let f = 25; f <= 99; f++) {
      if (f <= 35) this.G.x += 2;
      if (f === 70) pc[0] = 16;
      if (f >= 90) pc[1] = CENTER_CHAX + 4 * (f - 90);
      yield;
    }
    // 100-159: he throws it off the stage
    pc[0] = 1; pc[1] = CENTER_CHAX + 40;
    audio.seStop();
    this.se('ZG 打撃4');
    this.pose(this.G, 16);
    for (let f = 100; f <= 159; f++) { this.G.x += 20; yield; }
    // 160-273: 比克's blast from the mouth
    this.behind(null);
    this.L.sheets = this.crew[4];
    this.A.x = TEC_CENTER;
    this.se('Z1 気を溜める2');
    this.pose(this.A, 2, true);
    yield* this.wait(31);
    this.se('Z1 エネルギー波');
    this.pose(this.A, 4, true);
    this.effect(this.ball(BALL.green, 250, 140));
    yield;
    this.behind(this.cycler(BACKS.demonH, 640, 304, 0, 0));
    yield* this.wait(53);
    this.behind(null);
    this.effect(null);
    yield;
    yield* this.cut(RAY.midGreen, 27);
  }

  // ---- 852 行くぞクリリン (比克 + 克林): as 801 with 克林 — he flickers in (back 55), both vanish (back 116 / 48), 比克
  // knocks the enemy off the stage, 克林 kicks it down to the left from behind (effect 125), both charge (back 56 + 57)
  // and fire (back 58, effect 99), and the 師弟の絆 beam (83) ----
  * krillinToo() {
    const pLead = this.lead === 4;
    this.se('Z1 逃げる');
    this.pose(this.A, 0, true);
    yield;
    this.behind(pLead ? this.appear(6, CENTER_CHAX + 120, 0, true) : this.appear(4, CENTER_CHAX - 66, 0, true));
    for (let f = 1; f <= 59; f++) { this.A.x += pLead ? (f < 24 ? -4 : 0) : (f < 24 ? 4 : f === 24 ? 2 : 0); yield; }
    // 60-140: 比克 vanishes while 克林 waits, then 克林
    this.A.y = -200;
    this.se('Z1 高速移動');
    const k0 = (c) => draw(c, this.sheet(6, true), 0, 0, 96, 96, CENTER_CHAX + 120, STD_Y), a1 = this.afterImage(TEC_CENTER - 72, STD_Y + 26, 3);
    this.behind((c, t) => { k0(c); a1(c, t); });
    yield* this.wait(41);
    this.se('Z1 高速移動');
    this.behind(this.afterImage(TEC_CENTER + 114, STD_Y + 26));
    yield* this.wait(40);
    this.behind(null);
    yield* this.wait(9);
    // 150-206: 比克 appears in front of the enemy and strikes
    this.G.x = CENTER_ENEX; this.G.y = STD_Y;
    this.pose(this.G, 0, false);
    this.L.sheets = this.crew[4];
    this.A.x = CENTER_CHAX;
    this.pose(this.A, 0, false);
    yield* this.wait(10);
    this.se('Z1 高速移動');
    this.behind(this.afterImage(CENTER_CHAX + 16, STD_Y + 26));
    yield* this.wait(20);
    this.A.y = STD_Y;
    yield;
    this.behind(null);
    const blow = (row, se = 'Z1 打撃') => { this.se(se); this.pose(this.A, row); };
    yield* this.wait(5);
    blow(3); yield* this.wait(5);
    blow(4); yield* this.wait(10);
    blow(1, 'Z3 打撃'); this.pose(this.G, 16); yield* this.wait(6);
    // 207-251: off to the right, back in from the left (a spark on it); 克林 behind it at 246
    this.effect(this.hitSpark());
    for (let f = 207; f <= 225; f++) {
      if (f === 225) { this.A.y = -200; this.G.x = -96; this.pose(this.A, 0); this.L.sheets = this.crew[6]; }
      this.G.x += 18;
      yield;
    }
    this.se('Z1 高速移動');
    this.behind(this.afterImage(CENTER_CHAX + 112, STD_Y + 26, 1));
    this.effect((c, t) => { if (t <= 25) spark(c, 32, 0, 32, 16, this.R.x, this.R.y); });
    for (let f = 226; f <= 251; f++) {
      if (f === 235) this.pose(this.G, 0, false);
      if (f < 246) this.G.x += 18;
      if (f === 246) this.A.x += 96;
      if (f === 247) this.behind(null);
      yield;
    }
    // 252-293: 克林's kick sends it down to the left
    this.A.y = STD_Y;
    this.pose(this.A, 10, true);
    this.se('Z1 強打');
    this.pose(this.G, 16);
    this.effect((c, t) => { if (t <= 4) spark(c, 32, 16, 32, 32, 350, 158); });
    for (let f = 252; f <= 293; f++) { this.G.x -= 18; this.G.y += 4; yield; }
    // 294-353: side by side, charging (back 56, 比克's aura back 57)
    this.effect(null);
    this.A.y = -200;
    this.G.y = -200;
    this.se('Z1 気を溜める2');
    this.se('Z1 気を溜める');
    const pair = (kr, pr) => (c) => {
      draw(c, this.sheet(6, true), 0, kr * 96, 96, 96, CENTER_CHAX + 120, STD_Y);
      draw(c, this.sheet(4, true), 0, pr * 96, 96, 96, CENTER_CHAX - 66, STD_Y);
    };
    const charge = pair(1, 5), green = this.cycler(BACKS.auraGreen, 160, 222, 144, 70);
    this.behind((c, t) => { charge(c); green(c, t); });
    yield* this.wait(60);
    // 354-410: a green and an orange ball (back 58, effect 99)
    audio.seStop();
    this.se('Z1 エネルギー波2');
    this.behind(pair(2, 6));
    const b1 = this.ball(BALL.green, 156, 114), b2 = this.ball(BALL.orange, 342, 122);
    this.effect((c, t) => { b1(c, t); b2(c, t); });
    yield* this.wait(57);
    // 411-438: the beam (effect 83) on the enemy, still reeling (row 16)
    this.aim();
    this.pose(this.G, 16);
    yield;
    this.effect((c, t) => draw(c, SHITEI_RAY, 0, (Math.floor(t / 9) % 2) * 92, 400, 92, -400 + t * RAY_SPEED, 124));
    yield* this.wait(27);
    this.effect(null);
  }

  // ---- 919 ダブルアイビーム (比克 + 天津飯): the other flickers in (back 59), both fire from the eyes (比克 two green
  // balls, 天津飯 one, effect 370; 天津飯 row 2, back 116), three thin beams (effect 371) ----
  * doubleEyeBeam() {
    const pLead = this.lead === 4;
    this.se('Z1 逃げる');
    this.pose(this.A, 0, true);
    yield;
    this.behind(pLead ? this.appear(8, CENTER_CHAX + 120, 0, true) : this.appear(4, CENTER_CHAX - 66, 0, true));
    for (let f = 1; f <= 59; f++) { this.A.x += pLead ? (f < 24 ? -4 : 0) : (f < 24 ? 4 : f === 24 ? 2 : 0); yield; }
    // 60-120 (比克 in the lead's sprite, in its row 0)
    this.se('Z1 怪光線');
    this.L.sheets = this.crew[4];
    if (!pLead) this.A.x -= 186;
    this.behind((c) => draw(c, this.sheet(8, true), 0, 2 * 96, 96, 96, CENTER_CHAX + 120, STD_Y));
    this.effect((c, t) => {
      draw(c, BALL.green, 0, 0, 128, 128, 160 - 2 * t, 100 - 2 * t);
      draw(c, BALL.green, 0, 0, 128, 128, 166 + 2 * t, 100 - 2 * t);
      draw(c, BALL.orange, 0, 0, 128, 128, 342, 98 - 2 * t);
    });
    yield* this.wait(61);
    // 121-129: the enemy alone; 130-156: the beams
    this.aim();
    yield* this.wait(9);
    this.effect((c, t) => {
      const x = -400 + t * RAY_SPEED;
      draw(c, RAY.smallGreen[0], 0, 0, 400, 28, x, 129);
      draw(c, RAY.smallGreen[0], 0, 0, 400, 28, x, 189);
      draw(c, RAY.small[0], 0, 0, 400, 28, x, 159);
    });
    yield* this.wait(27);
    this.effect(null);
  }

  * blownUpLeft() { // damage 27: the explosion, the enemy thrown up and back the way the ball came (left)
    this.se('Z3 光線系ヒット');
    this.showHit();
    this.pose(this.G, 17);
    this.effect((c, t) => { const k = Math.floor(t / 10); if (k < 2) draw(c, BOOM, k * 96, 0, 96, 96, 320, 120); });
    for (let f = 1; f <= 40; f++) {
      if (f >= 21 && f <= 30) this.G.x -= 20;
      if (f >= 21) this.G.y -= 20;
      if (f === 30) this.effect(null);
      yield;
    }
  }

  // 807 / 811 are long films in the original (807 alone is 618 frames over 18 effect pictures); here the two
  // participants' own moves play one after the other, the second one landing the combined hit.
  * chain() {
    const ids = Object.keys(this.crew).map(Number);
    const order = [this.lead, ...ids.filter((i) => i !== this.lead)];
    const tecs = order.map((id) => this.tecs[id]);
    for (let n = 0; n < order.length; n++) {
      this.L.sheets = this.crew[order[n]];
      if (n > 0) { this.A.y = STD_Y; this.A.x = TEC_CENTER; this.G.y = -200; this.pose(this.A, 0, true); yield* this.wait(10); }
      this.pv = null; // (src/anime_piccolo_vegeta.js: each member's film its own stage)
      yield* this[tecs[n]]();
      if (n < order.length - 1) { this.effect(null); this.behind(null); audio.seStop(); }
    }
  }
  * sokiEnzan() { this.tecs = { 6: 'kienzan', 7: 'sokidan' }; yield* this.chain(); }
  * rokakuSouda() { this.tecs = { 7: 'wolfFang', 8: 'shishinFist' }; yield* this.chain(); }
}

export const COMBO_SOUNDS = ['Z1 飛ぶ', 'ZG 技取得', 'DB3 気を溜める2', 'Z3 変身', 'ZG 打撃2', 'ZG 打撃4'];
// pictures of their own (tools/copy_assets.py)
export const COMBO_PICTURES = [AURA_Z3, RAY_Z3_BIG, RAY_Z3_HUGE[0], SHITEI_RAY, RANBU_RAY];
ANIME_IMAGES.push(...COMBO_PICTURES); // (loaded with the battle pictures at start, src/main.js battleImages)

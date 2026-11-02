// S-combo films, ported from the classic version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like
// src/anime.js: the combo's attack pattern (combo skill id + 10) runs anime_pattern 31 (swoop in) → 32 (必殺技!)
// → the combo's own pattern (8xx) → the damage pattern. In Z1 the original shows no character cut-in
// (output_cutin draws nothing while $btl_progress == 0), so neither does this.
// A ComboDuel is a Duel whose left side can be any of the participants: `crew` = { actorId: { normal, special } }.
// Frame numbers in the comments are the original's @battle_anime_frame.
import { audio } from './core.js?v=20261102-1750';
import { Duel, draw, spark, BALL, RAY, BACKS, MAKANKO_BALL, STD_Y, CENTER_CHAX, CENTER_ENEX, TEC_CENTER, RAY_SPEED, SW, moveFilm } from './anime.js?v=20261102-1750';

// combo skill id → [film, damage pattern]
const FILMS = {
  705: ['sutemi', 23], // 捨て身の攻撃 (805)
  709: ['doubleDodonpa', 23], // ダブルどどんぱ (809)
  710: ['psychoKikou', 28], // 超能力気功砲 (810)
  707: ['sokiEnzan', 23], // 繰気円斬 (807, shortened)
  711: ['rokakuSouda', 23], // 狼鶴相打陣 (811, shortened)
  704: ['doubleShock', 22], // ダブル衝撃波 (804)
  730: ['kameRyu', 23], // 亀仙流かめはめは (830)
};

export class ComboDuel extends Duel {
  constructor(opts) {
    super({ ...opts, skill: opts.combo, playerAttacks: true, hit: true });
    this.combo = opts.combo;
    this.crew = opts.crew;
    this.lead = opts.lead; // the participant whose turn started the combo (@chanum)
    // a combo without a film of its own (chain): each participant's own move (opts.tecs: actor id → skill id)
    this.tecs = Object.fromEntries(Object.entries(opts.tecs || {}).map(([id, sk]) => [id, moveFilm(sk)]));
  }

  * run() {
    const [film, dmg] = FILMS[this.combo] || ['chain', 23];
    yield* this.swoopIn(); // 31
    yield* this.launch(); // 32
    yield* this[film]();
    audio.seStop();
    if (dmg === 28) yield* this.shakeBoom();
    else if (dmg === 22) yield* this.blownAway(); // shock-wave hit
    else yield* this.explode(17, 50); // 23
    audio.seStop();
    this.ending = true;
    for (let i = 0; i < 10; i++) { this.fade = (i + 1) / 10; yield; }
  }

  sheet(id, sp) { return sp ? this.crew[id].special : this.crew[id].normal; }
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
    const lead = this.lead === 3 ? 3 : 4;
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
    const other = this.lead === 3 ? 10 : 3;
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
    const others = [3, 24, 6, 7].filter((id) => id !== this.lead);
    const rows = { 24: 2, 6: 1, 7: 1 }; // @scombo_cha*_anime_type from frame 60 (190: 3 / 2 / 2)
    const at = (id, row) => (c) => draw(c, this.sheet(id, true), 0, row * 96, 96, 96, X(SLOT[id]), STD_Y);
    this.se('Z1 逃げる');
    this.pose(this.A, 0, false);
    yield;
    // 1-59: the lead walks to his place, the others flicker in (normal sheet rows 14, 13, 12, then their special sheet)
    const flick = others.map((id) => this.appear(id, X(SLOT[id]), 0, true));
    this.behind((c, t) => flick.forEach((f) => f(c, t)));
    const n = MOVE[this.lead], dx = (X(SLOT[this.lead]) - this.A.x) / n;
    for (let f = 1; f < 60; f++) { if (f <= n) this.A.x += dx; yield; }
    // 60-190: 悟空 in the lead's place, everyone charging (back 8 over them)
    this.L.sheets = this.crew[3];
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

  // 807 / 811 are long films in the original (807 alone is 618 frames over 18 effect pictures); here the two
  // participants' own moves play one after the other, the second one landing the combined hit.
  * chain() {
    const ids = Object.keys(this.crew).map(Number);
    const order = [this.lead, ...ids.filter((i) => i !== this.lead)];
    const tecs = order.map((id) => this.tecs[id]);
    for (let n = 0; n < order.length; n++) {
      this.L.sheets = this.crew[order[n]];
      if (n > 0) { this.A.y = STD_Y; this.A.x = TEC_CENTER; this.G.y = -200; this.pose(this.A, 0, true); yield* this.wait(10); }
      yield* this[tecs[n]]();
      if (n < order.length - 1) { this.effect(null); this.behind(null); audio.seStop(); }
    }
  }
  * sokiEnzan() { this.tecs = { 6: 'kienzan', 7: 'sokidan' }; yield* this.chain(); }
  * rokakuSouda() { this.tecs = { 7: 'wolfFang', 8: 'shishinFist' }; yield* this.chain(); }
}

export const COMBO_SOUNDS = ['Z1 飛ぶ', 'ZG 技取得', 'DB3 気を溜める2'];

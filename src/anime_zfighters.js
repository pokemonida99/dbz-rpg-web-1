// 克林・雅木茶・天津飯・餃子・琪琪・青年's special moves (docs/anim-ab-plan.md, anzb), ported frame by frame from the
// classic version's Scene_Db_Battle_Anime (102_Scene_Db_Battle_Anime.rb) like src/anime.js. These are Z3 moves: in
// the Z3 part of the original's move switch (all.rb 59742, $btl_progress 2) a move's attack pattern is its skill id
// + 2100 (65 → 2165 …; the young Namekian's 魔貫光殺砲 145 is 1245 in Z2 and Z3), run after anime_pattern 31 / 32 and
// followed by its damage pattern. Z2 / Z3 add what the Z1 films never had: the special-move bars (output_back,
// all.rb 67760) and the cut-ins (output_cutin, 67657). They live in a stage of draw lists rebuilt every frame, the
// way the original draws straight into its window: the bars → the move's own pictures → the fighters → the
// effects → the cut-in. Frame numbers in the comments are the original's @battle_anime_frame.
import { audio, img, rand } from './core.js?v=20261103-0433';
import { addMoves, Duel, spark, STD_Y, CENTER_CHAX, CENTER_ENEX, RAY_SPEED } from './anime.js?v=20261103-0433';
import { registerZ3, party, heal } from './z3.js?v=20261103-0433';
import { applyLevel } from './party.js?v=20261103-0433';

const pic = (n) => `Graphics/Pictures/${n}`;
// the bars (output_back): Z3 @tec_output_back_no 0 top / bottom, 1 left / right, 2 top-left / bottom-right corners,
// 3 top-right / bottom-left corners; Z2 only has the top / bottom ones
const BAR = {
  top: pic('Z3_戦闘_必殺技_背景_上.png'), bottom: pic('Z3_戦闘_必殺技_背景_下(加工).PNG'),
  left: pic('Z3_戦闘_必殺技_背景_左(加工).PNG'), right: pic('Z3_戦闘_必殺技_背景_右(加工).PNG'),
  tl: pic('Z3_戦闘_必殺技_背景_左上.PNG'), br: pic('Z3_戦闘_必殺技_背景_右下.PNG'),
  tr: pic('Z3_戦闘_必殺技_背景_右上.PNG'), bl: pic('Z3_戦闘_必殺技_背景_左下.PNG'),
  z2top: pic('Z2_戦闘_必殺技_背景_上.png'), z2bottom: pic('Z2_戦闘_必殺技_背景_下.png'),
};
// the cut-ins: 640×64 rows, the party's by actor id - 3, the enemies' by enemy id - 101 (Z3) / - 31 (Z2)
const CUT = { z3: pic('Z3_味方カットイン.PNG'), z2: pic('Z2_味方カットイン.PNG'), foe3: pic('Z3_敵カットイン.PNG'), foe2: pic('Z2_敵カットイン.PNG') };
const AURA = [pic('Z3_戦闘_必殺技_気を溜める.png'), pic('Z3_戦闘_必殺技_気を溜める(緑).png'), null, pic('Z3_戦闘_必殺技_気を溜める(青).png')]; // back 201 by @ray_color
const SHOCK = pic('Z3_戦闘_必殺技_背景_衝撃波系.png'); // back 1
const KIKOU = pic('Z3_戦闘_必殺技_背景_気功砲系.png'); // back 9
const LINES = [pic('Z3_必殺技_超カメハメ波(バック上)_反転.png'), pic('Z3_必殺技_超カメハメ波(バック下)_反転.png')]; // back 106, mirrored
const KIEN = pic('Z3_戦闘_必殺技_気円斬.png'); // 126×30 rows: the disc growing (0-3), thrown (4)
const SOKI = pic('Z3_戦闘_必殺技_繰気弾.PNG'); // 128×128 frames
const BLINK = { small: pic('Z3_必殺技_超カメハメ波(球点滅小).png'), mid: pic('Z3_必殺技_超カメハメ波(球点滅).png') }; // effects 237 / 235
const BALL4 = pic('Z3_戦闘_必殺技_エネルギー弾4.PNG'); // effects 206 / 207: 190×126
const HUGE = pic('Z3_戦闘_必殺技_エネルギー波_特大.PNG'); // effect 295: 400×192, the lower half
const MID = pic('Z3_戦闘_必殺技_エネルギー波_中.PNG'); // effect 297: 400×80
const MAKANKO = pic('Z3_戦闘_必殺技_魔貫光殺砲.PNG'); // effects 272 / 255: 400×64 rows
const KAME_BLUE = pic('Z3_必殺技_超カメハメ波_青_反転.png'); // effect 236 mirrored: 500×350
const HALF_BLUE = pic('Z3_戦闘_必殺技_エネルギー波_半円(青).PNG'); // effect 256 mirrored: 700×128, the lower half
const BOOM = { 102: [pic('戦闘アニメ_爆発3.PNG'), 112, 120, 318, 120], 103: [pic('戦闘アニメ_爆発4.PNG'), 176, 144, 298, 120],
  104: [pic('戦闘アニメ_爆発5.PNG'), 158, 160, 282, 104] }; // explosion effects: frame size, where (the party attacking)
// the close-ups each move cuts to
const CLOSE = {
  kienretsu: pic('Z3_必殺技_気円烈斬(クリリン).png'), soki: pic('FC風_ZSSD_必殺技_繰気弾(ヤムチャ)2.png'),
  yamcha: pic('DB3_ヤムチャ(Z3化).PNG'), kikou: pic('Z3_必殺技_新気功砲(テンシンハン・服あり).png'),
  psychic: pic('Z3_必殺技_超能力(チャオズ).PNG'), dodonpa: pic('Z3_必殺技_どどん波(チャオズ1).png'),
  bashou: pic('Z3_必殺技_芭蕉扇(チチ).png'), makanko: pic('Z3_必殺技_カットイン_魔貫光殺砲(若者).png'),
  mystic: pic('Z3_必殺技_ミスティックフラッシャー(若者).png'),
};
export const ZF_IMAGES = [...Object.values(BAR), ...Object.values(CUT), ...AURA.filter(Boolean), SHOCK, KIKOU, ...LINES, KIEN, SOKI,
  ...Object.values(BLINK), BALL4, HUGE, MID, MAKANKO, KAME_BLUE, HALF_BLUE, ...Object.values(BOOM).map((b) => b[0]), ...Object.values(CLOSE)];

// skill id → film; the moves on everyone (the original's @all_attack_count >= 2: the targets after the first skip the
// charge); whose move it is (the cut-in row)
const FILMS = { 65: 'zfKienretsuzan', 74: 'zfChoSokidan', 75: 'zfShinRoga', 85: 'zfShinKikouhou', 94: 'zfNenriki',
  95: 'zfOmoikkiriDodonpa', 107: 'zfBashousen', 145: 'zfYouthMakanko', 146: 'zfMysticFlasher' };
addMoves(FILMS);
const ALL = new Set([65, 74, 94, 107]);
const ACTOR = { 65: 6, 74: 7, 75: 7, 85: 8, 94: 9, 95: 9, 107: 10, 145: 15, 146: 15 };
// what the move switch sets before anime_pattern 32 (@tec_back_small), and for a further target of a move on everyone
const SMALL = new Set([65, 75, 95, 107, 146]);
const AGAIN = { 65: { bars: true, cut: true, no: 0, small: true }, 74: { bars: true, cut: true, no: 1 }, 94: { bars: true, cut: true, no: 1 }, 107: {} };
const ended = {}; // skill → when its last film ended
const AGAIN_MS = 500;

// variable 40: 1 Z2, 2 Z3 and later (the art of the part of the story; $btl_progress for the party)
const era = () => { const s = window.__game && window.__game.state; return (s && s.var && s.var[40]) || 0; };

// a blt clipped to the picture the way RGSS clips it (a source rect partly or wholly outside draws only what is inside)
function blt(c, sheet, sx, sy, w, h, x, y) {
  const e = img(sheet);
  if (!e.ok) return;
  if (sx < 0) { x -= sx; w += sx; sx = 0; }
  if (sy < 0) { y -= sy; h += sy; sy = 0; }
  w = Math.min(w, e.im.width - sx); h = Math.min(h, e.im.height - sy);
  if (w > 0 && h > 0) c.drawImage(e.im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
}
// the two copies of a scrolling bar (output_back): offset `tb` within a strip `w` long
function tiles(tb, w) {
  if (tb <= w / 2 && tb >= -w / 2) return [tb - w / 2, tb + w / 2];
  if (tb >= w / 2) return [tb - w / 2, tb - (w + w / 2)];
  return [tb + w / 2, tb + w + w / 2];
}

// the frame's pictures behind the fighters (b) and in front (e), the bars and the cut-in, per film
class Stage {
  constructor(d) {
    this.d = d;
    this.era = d.skill === 145 && era() === 1 ? 1 : 2; // (the others only exist in the Z3 switch)
    this.actor = ACTOR[d.skill];
    const sc = window.__game && window.__game.scene, foe = sc && sc.foes && sc.foes.find((f) => f.sprite === d.R.sheets.special);
    this.foe = foe ? Number(foe.id) : 0;
    this.bars = false; this.no = 0; this.small = SMALL.has(d.skill); this.tb = 0; this.corner = 0; this.barList = [];
    this.cut = false; this.cutFlag = true; this.mirror = false;
    this.b = []; this.e = [];
    this.ba = { type: 0, frame: 0 }; // @back_anime_type / @back_anime_frame
    this.ef = { type: 0, frame: 0, rtype: 0, rframe: 0 }; // @effect_anime_* / @ray_anime_*
    d.behind((c) => { for (const f of this.barList) f(c); for (const f of this.b) f(c); });
    d.effect((c) => { for (const f of this.e) f(c); this.drawCut(c); });
    const step = d.step.bind(d);
    d.step = () => { if (!d.done) this.tick(); step(); };
    d.finished.then(() => { ended[d.skill] = performance.now(); });
  }

  // the start of a frame: the bars move on (output_back), the move draws its pictures afresh
  tick() {
    this.b = []; this.e = [];
    if (!this.cutFlag) this.cut = false; // (output_cutin)
    const L = this.barList = [];
    if (!this.bars) return;
    const at = (sheet, sx, sy, w, h, x, y) => L.push((c) => blt(c, sheet, sx, sy, w, h, x, y));
    if (this.era === 1) { // Z2: 640×64 strips, 12 a frame
      for (const x of tiles(this.tb, 640)) { at(BAR.z2top, 0, 0, 640, 64, x, 0); at(BAR.z2bottom, 0, 0, 640, 64, x, 292); }
      this.wrap(-12, 640);
      return;
    }
    if (this.no === 0) {
      const top = this.small ? 64 : 110, bh = this.small ? 60 : 114, by = 292 - (this.small ? -4 : 50);
      for (const x of tiles(this.tb, 648)) { at(BAR.top, 0, 0, 648, top, x, 0); at(BAR.bottom, 0, 0, 648, bh, x, by); }
      this.wrap(-8, 648);
    } else if (this.no === 1) {
      for (const y of tiles(this.tb, 360)) { at(BAR.left, 0, 0, 94, 360, 0, y); at(BAR.right, 0, 0, 92, 360, 640 - 94, y); }
      this.wrap(-16, 360);
    } else {
      const [a, b] = this.no === 2 ? [BAR.tl, BAR.br] : [BAR.tr, BAR.bl];
      at(a, this.corner * 238, 0, 238, 238, this.no === 2 ? 0 : 640 - 238, 0);
      at(b, this.corner * 222, 0, 222, 222, this.no === 2 ? 640 - 222 : 0, 480 - 222 - 124);
      this.corner = this.corner === 2 ? 0 : this.corner + 1;
    }
  }
  wrap(d, w) { this.tb += d; if (this.tb >= w) this.tb -= w; else if (this.tb <= -w) this.tb += w; }

  drawCut(c) { // output_cutin: the attacker's, or the defender's once the film has cut to it (Z1 enemies have none)
    if (!this.cut || !this.cutFlag) return;
    if (!this.mirror) blt(c, this.era === 1 ? CUT.z2 : CUT.z3, 0, 64 * (this.actor - 3), 640, 64, 0, 292);
    else if (this.foe >= 101) blt(c, CUT.foe3, 0, 64 * (this.foe - 101), 640, 64, 0, 292);
    else if (this.foe >= 31) blt(c, CUT.foe2, 0, 64 * (this.foe - 31), 640, 64, 0, 292);
  }

  back(sheet, sx, sy, w, h, x, y) { this.b.push((c) => blt(c, sheet, sx, sy, w, h, x, y)); }
  front(sheet, sx, sy, w, h, x, y) { this.e.push((c) => blt(c, sheet, sx, sy, w, h, x, y)); }
  white(h, list = this.b) { list.push((c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 640, h); }); }
  // back_anime_pattern's counter: the next picture every `every` calls, cycling through `last` + 1
  backStep(every, last) {
    const o = this.ba;
    if (o.frame >= every && o.type !== last) { o.type++; o.frame = 0; } else if (o.frame >= every) { o.type = 0; o.frame = 0; }
    o.frame++;
  }
  // back 201 気を溜める(Z3): two frames of 136×142 (by @ray_color: 0 white, 1 green, 3 blue)
  aura(x, y, color = 0) { this.back(AURA[color], this.ba.type * 136, 0, 136, 142, x, y); this.backStep(16, 1); }
  shock() { // back 1: the shock-wave streaks (a big defender only gets the top and bottom 42)
    const k = this.ba.type * 180;
    if ((this.d.G.sheets.size || 96) === 192) { this.back(SHOCK, 0, k, 640, 42, 0, 32); this.back(SHOCK, 0, 138 + k, 640, 42, 0, 266); } else this.back(SHOCK, 0, k, 640, 180, 0, 80);
    this.backStep(4, 2);
  }
  kikou() { // back 9: the 気功砲 column on the defender
    const k = this.ba.type * 360;
    if ((this.d.G.sheets.size || 96) === 192) { this.back(KIKOU, 0, k, 142, 356, 156, 0); this.back(KIKOU, 242, k, 142, 356, 498, 0); } else this.back(KIKOU, 0, k, 384, 356, 170, 0);
    this.backStep(4, 2);
  }
  lines() { // back 106 mirrored: the super kamehameha's lines, on the right
    this.back(LINES[0], 0, 128 * this.ba.type, 384, 128, 640 - 384, 0);
    this.back(LINES[1], 0, 64 * this.ba.type, 192, 64, 640 - 192, 292);
    this.backStep(4, 2);
  }
  // effect_pattern: draws with the counters as they are, then both count on
  fx(draw) { const k = this.ef; draw(k); k.rframe++; k.frame++; }
  fxReset() { this.ef.type = 0; this.ef.frame = 0; }
  blink(sheet, z, x, y) { // effects 237 / 235: a blinking ball, the next of five frames every 4
    this.fx((k) => {
      this.front(sheet, z * k.rtype, 0, z, z, x, y);
      if (k.rframe >= 4 && k.rtype !== 4) { k.rtype++; k.rframe = 0; } else if (k.rframe >= 4) { k.rtype = 0; k.rframe = 0; }
    });
  }
}

// anime_pattern 31 / 32 for these moves: the move switch's settings before 32 (@chr_cutin_flag, @tec_back_small), and
// for a further target of a move on everyone none of it — the film starts straight on the defender
const swoop0 = Duel.prototype.swoopIn, launch0 = Duel.prototype.launch;
Object.assign(Duel.prototype, {
  * swoopIn() {
    if (!FILMS[this.skill] || !this.p) return yield* swoop0.call(this);
    for (const p of ZF_IMAGES) img(p); // (loading while the swoop and the launch play)
    const st = this.st = new Stage(this);
    st.again = ALL.has(this.skill) && performance.now() - (ended[this.skill] || -1e9) < AGAIN_MS;
    if (st.again) {
      const a = AGAIN[this.skill];
      if (a.bars) st.bars = true;
      if (a.cut) { st.cut = true; st.mirror = true; }
      if (a.no != null) st.no = a.no;
      if (a.small) st.small = true;
      return;
    }
    yield* swoop0.call(this);
  },

  * launch() { // 32: "必殺技!" — from frame 30 the bars and the cut-in
    const st = this.st;
    if (!st) return yield* launch0.call(this);
    if (st.again) return;
    this.se('Z1 必殺技');
    this.pose(this.A, 0, true);
    for (let f = 1; f < 80; f++) {
      this.back.y += 4;
      if (f >= 30) { st.bars = true; if (st.cutFlag) st.cut = true; }
      yield;
    }
    if (this.skill === 145 && st.era === 2) st.bars = false; // (155 in the Z3 switch: @tec_output_back = false after 32)
  },

  // set_chr_display_out: the attacker leaves, the defender in the middle; the cut-in turns to the defender's
  zfOut() {
    this.A.y = -200;
    this.G.x = CENTER_ENEX; this.G.y = STD_Y;
    if (this.st.cutFlag) this.st.mirror = true;
  },

  // ---------- the damage films (anime_pattern 41 / 42 / 43 / 47 / 76 / 79), or the dodge (20) ----------
  * zfHit(kind) {
    if (!this.hit) return yield* this.zfDodge();
    if (kind === 22) return yield* this.blownAway();
    if (kind === 76) return yield* this.zfShake();
    const [se, eff, end, move] = { 41: ['ZG 光線系ヒット2', 102, 60, [21, 39, -20, 0]], 42: ['ZG 光線系ヒット3', 103, 60, [21, 39, -20, 0]],
      43: ['Z1 爆発1', 104, 60, [21, 39, -20, 0]], 47: ['ZG 光線系ヒット3', 103, 45, [21, 34, 0, 20]],
      79: ['ZG 光線系ヒット2', 102, 60, [21, 49, 20, 0]] }[kind];
    const [sheet, w, h, x, y] = BOOM[eff], st = this.st;
    this.se(se);
    this.showHit();
    this.pose(this.G, 17, false);
    let type = 0, frame = 0; // (@effect_anime_type / @effect_anime_frame, from 0 after the film)
    for (let f = 0; f <= end; f++) {
      if (f >= move[0] && f <= move[1]) { this.G.x -= move[2]; this.G.y += move[3]; }
      if (f < move[1] + 1) {
        st.front(sheet, type * w, 0, w, h, x, y);
        if (frame >= 10) { type++; frame = 0; }
        frame++;
      }
      yield;
    }
  },
  * zfShake() { // 76 超能力ヒット: the defender trembles
    this.pose(this.G, 0, false);
    this.showHit();
    this.se('Z1 ザー'); this.se('Z1 ゴー'); this.se('Z3 超能力');
    yield;
    for (let f = 1; f <= 60; f++) { this.G.x += f % 2 ? 6 : -6; yield; }
    audio.seStop();
    yield;
  },
  * zfDodge() { // 20: the defender vanishes, leaving a flickering after-image
    this.se('Z3 避ける');
    const G = this.G, x = G.x, y = G.y;
    G.y = -500;
    for (let t = 0; t < 50; t++) { if (t <= 20 && t % 4 === 0) this.st.e.push((c) => spark(c, 0, 48, 64, 64, x + 32, y + 16)); yield; }
  },

  // ---------- 克林 ----------
  * zfKienretsuzan() { // 2165 気円烈斬: two discs thrown from the hands, the big one circling over him, then it flies in
    if (!this.st) return yield* this.kienzan();
    const st = this.st, A = this.A;
    if (!st.again) {
      // the disc held at (x, y) shaking: three frames still, three right, three still, three left (@back_anime_type 54 → 6 → 56 → 4)
      const shake = (k) => [[0, 0], [8, 2], [0, 0], [-8, -2]][Math.floor(k / 3) % 4];
      const disc = (x, y) => st.fx((k) => {
        st.front(KIEN, 0, 30 * k.rtype, 126, 30, x, y);
        if (k.rframe >= 4) { k.rtype++; k.rframe = 0; }
        if (k.rtype >= 4) { k.rtype = 4; k.rframe = 0; }
      });
      let on = false; // @effect_anime_pattern 330
      for (let f = 0; f <= 551; f++) {
        if (f === 0) { this.se('Z3 変身'); this.pose(A, 0, true); }
        if (f >= 1 && f <= 128) st.aura(228, 88);
        if (f >= 129 && f <= 220 || f >= 281 && f <= 370) { // the disc grows over one hand, then the other
          const s = f <= 220 ? 129 : 281, k = f - s, [dx, dy] = shake(k);
          if (f === 129) audio.seStop();
          const P = s === 129 ? { 0: 5, 40: 6, 50: 7, 60: 5, 70: 6, 80: 7 } : { 0: 11, 40: 13, 50: 12, 60: 11, 70: 13, 80: 12 };
          if (P[k] != null) this.pose(A, P[k], true);
          if (k === 30) { on = true; this.se('Z1 ブン'); }
          if (on) disc((s === 129 ? 224 : 256) + dx, 96 + dy);
        }
        if (f >= 221 && f <= 280 || f >= 371 && f <= 430) { // thrown
          const s = f <= 280 ? 221 : 371, k = f - s;
          if (k === 0) this.se('Z1 エネルギー波');
          this.pose(A, s === 221 ? 9 : 10, true);
          if (k === 59) { on = false; st.fxReset(); if (s === 371) st.cutFlag = false; }
          if (on) disc((s === 221 ? 224 : 256) + 16 * k, 96 + 2 * k);
        }
        if (f >= 431) { // his close-up, the big disc circling twice over it, then it flies up and away
          st.no = 2;
          if (f === 431) audio.seStop();
          A.y = -160;
          st.back(CLOSE.kienretsu, 0, 0, 130, 168, 182, 130);
          const kf = 462, row = f >= kf + 15 ? 4 : f >= kf - 15 ? 1 : 0;
          let x = 250, y = 80;
          const turn = f >= kf + 10 && f <= kf + 24 ? f - kf - 9 : f >= kf + 26 && f <= kf + 40 ? f - kf - 25 : 0;
          if (turn) {
            const R = [[0, 0], [4, 1], [7, 3], [9, 6], [10, 10], [9, 14], [7, 17], [4, 19], [0, 20], [-4, 19], [-7, 17], [-9, 14], [-10, 10], [-9, 6], [-7, 3], [-4, 1]][turn];
            x += 6 * R[0]; y -= 2 * R[1];
          }
          if (f >= kf + 50) {
            if (f === kf + 50) this.se('Z3 エネルギー波');
            y = 80 - 8 * (f - (kf + 50)); x += 12 * (f - (kf + 50));
          }
          st.back(KIEN, 0, 30 * row, 126, 30, x, y);
          if (f === 551) st.cutFlag = true;
        }
        yield;
      }
    }
    st.fxReset(); st.no = 0; st.cut = true; this.zfOut(); // 552 (a further target: its 0)
    this.se('Z1 エネルギー波2');
    yield;
    if (!st.again) yield* this.wait(9);
    for (let t = 0; t <= 30; t++) { st.fx((k) => st.front(KIEN, 0, 120, 126, 30, -192 + k.frame * RAY_SPEED, 160)); yield; } // effect 260
    yield; // 593
    yield* this.zfHit(43);
    return 'none';
  },

  // ---------- 雅木茶 ----------
  * zfChoSokidan() { // 2174 超繰気弾: his close-up, the ball swelling and shrinking as it rises over him, then it flies in
    if (!this.st) return yield* this.sokidan();
    const st = this.st, A = this.A;
    if (!st.again) {
      let rt = 0; // @ray_anime_type, counted by the film itself here (it goes below 0 before the ball shows)
      for (let f = 0; f <= 459; f++) {
        if (f === 0) { this.se('Z3 変身'); this.pose(A, 0, true); }
        if (f >= 1 && f <= 128) st.aura(228, 88);
        if (f >= 129) {
          st.no = 1;
          if (f === 129) { audio.seStop(); this.se('Z1 気を溜める'); }
          A.y = -160;
          st.back(CLOSE.soki, 0, 0, 124, 156, 258, 138);
          const b = 129 + 45; // then a size every 30 frames
          let y = 70;
          if (f >= b + 30) rt = Math.min(4, Math.floor((f - b) / 30));
          if (f >= b + 150 && f < b + 180) y -= 54;
          if (f >= b + 180) { if (f === b + 180) this.se('Z1 繰気弾'); y -= 54 + 4 * (f - (b + 180)); }
          if (f < b + 150) { if (f % 12 === 0) rt--; y -= [0, 6, 22, 38, 54][rt] || 0; }
          if (f - 129 > 45) st.back(SOKI, rt * 128, 0, 128, 128, 220, y);
        }
        yield;
      }
    }
    st.small = true; st.fxReset(); st.no = 0; this.zfOut(); // 460 (a further target: its 0)
    this.se('Z1 エネルギー波');
    yield;
    for (let t = 0; t < 25; t++) { st.fx((k) => st.front(SOKI, 4 * 128, 0, 128, 128, -128 + k.frame * RAY_SPEED, 114)); yield; } // effect 294
    yield;
    yield* this.zfHit(42);
    return 'none';
  },

  * zfShinRoga() { // 2175 新狼牙風風拳: he vanishes, the flurry (effect 39), the wolf, the blows, then a ball of ki after the enemy
    if (!this.st) { yield* this.wolfFang(); return 'shock'; }
    const st = this.st, A = this.A, G = this.G;
    // effect 39: his normal sheet's rows over time, then the special sheet's row 3 (Z3) once the flurry is over
    const ROWS = [[10, 14], [20, 13], [30, 12], [35, 0], [39, 3], [43, 1], [46, 2], [50, 4], [53, 2], [56, 1], [60, 2], [80, 16]];
    const flurry = () => st.fx((k) => {
      const t = k.frame, r = ROWS.find(([end]) => t <= end), sheet = r ? A.sheets.normal : A.sheets.special;
      const x = t >= 61 && t <= 80 ? CENTER_CHAX - (t - 60) * 8 : t >= 81 && t <= 84 ? 80 + (t - 80) * 16 : CENTER_CHAX;
      if (t >= 36 && t % 5 === 0 && t < 85) this.se('Z3 打撃');
      st.front(sheet, 0, (r ? r[1] : 3) * 96, 96, 96, x, STD_Y);
    });
    const HIT = { 0: 1, 24: 1, 32: 1, 4: 4, 20: 4, 40: 4, 48: 4, 8: 3, 16: 3, 36: 3, 52: 3, 12: 2, 28: 2, 44: 2 }; // blow → his frame
    let e39 = false, fx = 0; // @effect_anime_pattern: 39, 237, 235, 206, 207
    for (let f = 0; f <= 588; f++) {
      if (f === 0) this.pose(A, 0, true);
      if (f === 30) { this.se('Z1 高速移動'); A.y = -200; }
      if (f >= 31 && f <= 70 && f % 4 === 0) { const x = A.x + 16; st.b.push((c) => spark(c, 0, 48, 64, 64, x, 144)); }
      if (f === 71) { A.x -= 26; st.bars = false; this.se('Z1 逃げる'); G.x = CENTER_ENEX; G.y = STD_Y; }
      if (f >= 72 && f <= 379) st.shock();
      if (f === 72) e39 = true;
      if (f >= 164 && f <= 379) {
        const k = f - 164, r = k - 124;
        if (k === 0) { this.se('Z1 強打'); this.pose(G, 16, false); }
        if (k <= 9) G.x += 16; else if (k <= 19) G.x -= 16; else if (k === 20) this.pose(G, 0, false);
        if (k === 50) { e39 = false; this.se('DB3 狼牙風風拳'); this.pose(A, 0, true); }
        if (k >= 51 && k <= 120) { // the wolf flickering where he stands
          if (f % 2 === 0) { st.back(CLOSE.yamcha, 0, 0, 64, 64, A.x + 16, STD_Y + 24); A.y = -200; } else A.y = STD_Y;
        }
        if (k === 121) A.y = STD_Y;
        if (HIT[r] != null) {
          if (r === 0 || r === 24 || r === 32) { A.sp = false; this.pose(G, 16, false); }
          this.pose(A, HIT[r], false);
          this.se('Z1 打撃');
        }
        if (r >= 0 && r <= 55) G.x += r % 4 < 2 ? 8 : -8;
        if (r >= 56 && r <= 80) {
          if (r === 56) this.se('ZG 打撃4');
          this.pose(A, 3, true);
          G.x += 16;
          this.pose(G, 17, false);
        }
      }
      if (f === 380) { st.bars = true; this.pose(A, 0, true); this.se('Z3 変身'); }
      if (f >= 381 && f <= 508) { // the charge: a small ball, then a bigger one
        const k = f - 381;
        st.aura(206, 88);
        if (k === 30) this.se('Z1 気を溜める');
        if (k >= 30 && k <= 74) { this.pose(A, 2, true); fx = 237; }
        if (k >= 75) fx = 235;
      }
      if (f === 509) { fx = 0; st.fxReset(); }
      if (f === 510) { audio.seStop(); this.se('Z1 エネルギー波'); fx = 206; }
      if (f >= 510 && f <= 550) this.pose(A, 3, true);
      if (f === 560) { A.y = -200; this.zfOut(); fx = 0; st.fxReset(); this.pose(G, 0, false); }
      if (f >= 561 && f <= 587) fx = 207; else if (f === 588) fx = 0;
      if (e39) flurry();
      if (fx === 237) st.blink(BLINK.small, 16, 264, 160);
      if (fx === 235) st.blink(BLINK.mid, 32, 256, 152);
      if (fx === 206) st.fx((k) => st.front(BALL4, 0, 0, 190, 126, 316 + k.frame * RAY_SPEED, 102));
      if (fx === 207) st.fx((k) => st.front(BALL4, 0, 0, 190, 126, -192 + k.frame * RAY_SPEED, 96));
      yield;
    }
    yield* this.zfHit(43);
    return 'none';
  },
});

Object.assign(Duel.prototype, {
  // ---------- 天津飯 ----------
  * zfShinKikouhou() { // 2185 新気功砲: his close-up, four flashes, then four more on the 気功砲 column over the defender
    if (!this.st) return yield* this.kikouhou();
    const st = this.st, A = this.A;
    const FLASH = [170, 210, 250, 290];
    for (let f = 0; f <= 551; f++) {
      if (f === 0) { this.se('Z3 変身'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 128) { st.aura(228, 88); if (f === 128) st.no = 3; }
      if (f >= 129 && f <= 329) {
        if (f === 129 || f === 170) audio.seStop();
        if (f === 129) this.se('Z1 気を溜める4');
        A.y = -160;
        st.back(CLOSE.kikou, 0, 0, 170, 160, 208, 98);
      }
      if (f === 330) { audio.seStop(); st.bars = false; st.fxReset(); st.no = 0; this.zfOut(); this.se('Z1 ザー'); this.se('Z1 ゴー'); }
      if (f >= 341 && f <= 550) st.kikou();
      // the flashes (FLASH_Y_SIZE_CUTIN_ON: down to the cut-in), each with a blast
      const fl = FLASH.find((s) => f >= s && f <= s + 3 || f >= s + 200 && f <= s + 203);
      if (fl && f <= 550) { st.white(296); if (f === fl || f === fl + 200) this.se('Z1 エネルギー波'); }
      yield;
    }
    yield* this.zfHit(47);
    return 'none';
  },

  // ---------- 餃子 ----------
  * zfNenriki() { // 2194 超能力(全体): his close-up with four flashes, then the defender in the side bars — and it trembles
    if (!this.st) { yield* this.psychic(); return 'psychic'; }
    const st = this.st, A = this.A;
    if (!st.again) {
      for (let f = 0; f <= 258; f++) {
        if (f === 0) { this.se('Z3 変身'); this.pose(A, 2, true); }
        if (f >= 1 && f <= 128) st.aura(228, 88);
        if (f === 129) { audio.seStop(); st.fxReset(); A.y = -160; }
        if (f >= 130 && f <= 220) {
          st.no = 3;
          st.back(CLOSE.psychic, 0, 0, 88, 116, 280, 110);
          if ([140, 160, 180, 200].some((s) => f >= s && f <= s + 3)) st.white(296);
          if (f === 140) this.se('Z1 気を溜める');
        }
        if (f === 221) { st.no = 1; this.zfOut(); }
        yield;
      }
    } else {
      this.zfOut();
      for (let f = 0; f <= 28; f++) yield;
    }
    yield* this.zfHit(76);
    return 'none';
  },

  * zfOmoikkiriDodonpa() { // 2195 おもいっきりどどんぱ: the blinking ball on his finger, his close-up firing the huge wave
    if (!this.st) return yield* this.dodonpa();
    const st = this.st, A = this.A;
    let fx = 0; // @effect_anime_pattern: 237, 235, 295, 297
    for (let f = 0; f <= 348; f++) {
      if (f === 0) { this.se('Z3 変身'); this.pose(A, 0, true); }
      if (f >= 1 && f <= 199) {
        const k = f - 1;
        st.aura(228, 88);
        if (k === 30) this.se('Z1 気を溜める');
        if (k >= 30 && k <= 74) { this.pose(A, 7, true); fx = 237; }
        if (k >= 75) fx = 235;
      }
      if (f === 200) { audio.seStop(); fx = 0; st.fxReset(); A.y = -200; this.se('Z1 エネルギー波2'); }
      if (f >= 201 && f <= 310) { st.back(CLOSE.dodonpa, 0, 0, 192, 168, 120, 90); fx = 295; }
      if (f === 311) { fx = 0; st.fxReset(); this.zfOut(); }
      if (f >= 321 && f <= 347) fx = 297; else if (f === 348) fx = 0;
      if (fx === 237) st.blink(BLINK.small, 16, 290, 132);
      if (fx === 235) st.blink(BLINK.mid, 32, 282, 116);
      if (fx === 295) st.fx((k) => st.front(HUGE, 0, 192, 192 + k.frame * RAY_SPEED, 192, 306, 94));
      if (fx === 297) st.fx((k) => st.front(MID, 0, 0, 400, 80, -400 + k.frame * RAY_SPEED, 132));
      yield;
    }
    yield* this.zfHit(41);
    return 'none';
  },

  // ---------- 琪琪 ----------
  * zfBashousen() { // 2207 芭蕉扇: she draws the fan, backs off and swings — her close-up — the defender whirls up and crashes down
    if (!this.st) { yield* this.shockwave(); return 'shock'; }
    const st = this.st, A = this.A, G = this.G;
    if (!st.again) {
      for (let f = 0; f <= 350; f++) {
        if (f === 0) { this.se('Z3 変身'); this.pose(A, 5, true); } // (in Z2: Z2 気を溜める and the white aura)
        if (f >= 1 && f <= 89) st.aura(224, 88, 3);
        if (f === 90) { audio.seStop(); this.se('DB3 刀'); this.pose(A, 9, true); }
        if (f >= 120 && f <= 180) { if (f === 120) { this.se('Z1 飛ぶ'); A.x -= 26; } this.pose(A, 10, true); A.x -= 4; A.y -= 1; }
        if (f >= 210 && f <= 225) {
          if (f === 210) this.se('DB3 ダッシュ');
          if (f === 220) { this.pose(A, 11, true); A.x += 26; }
          A.x += 16; A.y += 4;
        }
        if (f === 240) { A.y = -180; this.se('Z1 エネルギー波'); }
        if (f >= 241 && f <= 340) {
          st.cutFlag = false; st.no = 3;
          st.back(CLOSE.bashou, 0, 0, 236, 180, 220, 90);
          if (f <= 244) st.white(356); // FLASH_Y_SIZE_CUTIN_OFF
        }
        if (f === 341) { st.fxReset(); this.zfOut(); st.no = 1; }
        yield;
      }
    } else { // 0-10
      st.fxReset(); this.zfOut(); st.no = 1; st.bars = true;
      for (let f = 0; f <= 10; f++) yield;
    }
    if (!this.hit) { // (350 / 9: missed — the frame jumps to 550, the defender drops away; a further target never comes back in the original)
      for (let f = 551; f <= 561; f++) { if (f <= 560) G.y += 24; yield; }
      yield* this.zfDodge();
      return 'none';
    }
    let tx = G.x, ty = G.y, r = 0;
    for (let k = 0; k < (st.again ? 148 : 149); k++) { // 351-499 (11-158): the whirlwind carries it round and up
      if (k <= 3) st.white(356);
      if (k === 0) this.se('Z1 エネルギー波');
      this.pose(G, 16, false);
      G.x = tx + Math.cos(r) * 100; G.y = ty + Math.sin(r) * 10;
      r += 0.1 + 0.0025 * k; ty -= 2;
      yield;
    }
    G.x = CENTER_ENEX; G.y = -180; this.pose(G, 17, false); // 500 (159): it comes down
    this.se('Z1 エネルギー波2'); this.se('Z1 ゴー');
    yield;
    for (let f = 0; f < (st.again ? 51 : 60); f++) { G.y += 24; yield; }
    yield; // 561 (211)
    yield* this.zfHit(22);
    return 'none';
  },

  // ---------- 青年 (the young Namekian) ----------
  * zfYouthMakanko() { // 1245 魔貫光殺砲(若者): his shaking cut-in until all goes white, then the drill beam
    if (!this.st) return yield* this.makankosappo();
    const st = this.st, A = this.A;
    let fx = 0; // 272, 255
    for (let f = 0; f <= 248; f++) {
      if (f === 0) { this.se('Z1 気を溜める3'); A.y = -160; st.cutFlag = false; }
      if (f >= 1 && f <= 130) {
        const sx = 4 * (rand(3) - 1), sy = 4 * (rand(3) - 1); // pic_shake_cal 4
        if (f >= 116) st.white(378);
        st.back(CLOSE.makanko, 0, 0, 648, 64, -4 + sx, 146 + sy);
        if (f >= 118) st.white(378);
        if (f === 130) { audio.seStop(); st.bars = true; }
        this.pose(A, 13, true);
      }
      if (f >= 131 && f <= 220) {
        st.cut = true; st.cutFlag = true; A.y = STD_Y;
        if (f === 160) { this.pose(A, 14, true); this.se('Z1 エネルギー波3'); fx = 272; }
      }
      if (f === 221) { this.se('Z1 衝撃波'); fx = 0; st.fxReset(); st.cut = true; st.cutFlag = true; this.zfOut(); st.no = 0; }
      if (f >= 222 && f <= 247) fx = 255; else if (f === 248) fx = 0;
      if (fx === 272) st.fx((k) => st.front(MAKANKO, 0, 64, 64 + k.frame * RAY_SPEED, 64, 358, 124));
      if (fx === 255) st.fx((k) => st.front(MAKANKO, 0, 0, 400, 64, -400 + k.frame * RAY_SPEED, 134));
      yield;
    }
    yield* this.zfHit(41);
    return 'none';
  },

  * zfMysticFlasher() { // 2246 ミスティックフラッシャー: he flies at the defender, the blows, it's knocked off — he follows, the blue wave
    if (!this.st) return yield* this.energyWave();
    const st = this.st, A = this.A, G = this.G;
    let fx = 0; // 236, 256 (both mirrored: the wave goes right to left)
    for (let f = 0; f <= 398; f++) {
      if (f === 0) { this.se('Z3 変身'); this.pose(A, 11, true); }
      if (f >= 1 && f <= 89) st.aura(228, 88, 1);
      if (f >= 90 && f <= 130) { if (f === 90) { audio.seStop(); this.se('Z1 飛ぶ'); this.pose(A, 10, true); } A.x += 20; }
      if (f >= 131 && f <= 152) {
        if (f === 131) { this.se('Z1 飛ぶ'); this.pose(A, 10, true); A.x = -192; G.x = CENTER_ENEX; G.y = STD_Y; }
        A.x += 20;
      }
      if (f >= 153 && f <= 219) { // two blows, he backs off, the kick that sends it flying
        const k = f - 153;
        if (k === 0) { this.pose(G, 16, false); this.se('ZG 打撃3'); this.pose(A, 4, false); this.se('ZG 打撃3'); }
        if (k === 8) { this.pose(A, 3, false); this.se('ZG 打撃3'); }
        if (k >= 16 && k <= 31) { this.pose(A, 16, false); A.x -= 12; A.y -= 2; }
        if (k >= 35 && k <= 42) { A.x += 24; A.y += 4; if (k === 42) { this.se('ZG 打撃4'); this.pose(A, 1, false); } }
        if (k <= 3 || k >= 8 && k <= 11) G.x += 12; else if (k <= 15) G.x -= 12;
        if (k >= 42) { this.pose(G, 17, false); G.x += 16; G.y += 4; }
      }
      if (f === 220) { this.pose(G, 17, false); this.zfOut(); G.x = -194; A.x = CENTER_CHAX; A.y = -192; }
      if (f >= 221 && f <= 247) { // the stage follows it: it slides in from the left, he comes down beside it
        const k = f - 221;
        if (k === 0) { this.se('Z1 飛ぶ'); this.pose(A, 10, true); }
        if (G.x < CENTER_ENEX) G.x += 20; else G.x = CENTER_ENEX;
        if (A.y < STD_Y) { A.x += 6; A.y += 12; } else A.y = STD_Y;
        if (k === 12) this.pose(G, 16, false);
        if (k === 24) this.pose(G, 0, false);
      }
      if (f === 248) this.pose(A, 27, true);
      if (f === 268) { this.se('DB3 SE041'); this.pose(A, 28, true); }
      if (f === 287) { st.cutFlag = false; st.bars = false; }
      if (f >= 288 && f <= 360) { // his close-up firing, the super kamehameha's lines
        if (f === 288) { A.y = -192; G.y = -192; this.se('Z1 エネルギー波2'); }
        st.back(CLOSE.mystic, 0, 0, 230, 156, 220, 104);
        st.lines();
        fx = 236;
      }
      if (f === 361) { fx = 256; st.fxReset(); A.y = STD_Y; G.y = STD_Y; st.cut = true; st.cutFlag = true; st.mirror = true; st.bars = true; }
      if (f === 398) fx = 0;
      if (fx === 236) st.fx((k) => st.front(KAME_BLUE, 446 - k.frame * RAY_SPEED, 0, 446 + k.frame * RAY_SPEED, 350, 278 - k.frame * RAY_SPEED, 6));
      if (fx === 256) st.fx((k) => st.front(HALF_BLUE, 700 - k.frame * RAY_SPEED, 128, k.frame * RAY_SPEED, 128, 404 - k.frame * RAY_SPEED, 98));
      yield;
    }
    yield* this.zfHit(79);
    return 'none';
  },
});

// ?dev=anzb<skill id>: a Z3 save in the 時之間 hall with the move's user (level 50) against 19號・20號 (their cut-ins),
// e.g. ?dev=anzb65; anzb145z2 is the Z2 one (variable 40 = 1) against a Frieza soldier. The film itself is played
// from the console: __game.scene.play(m, f, true, 65, 123, f) (src/battle.js play)
registerZ3('anzb', {
  dev(game, step) {
    const m = /^anzb(\d+)(z2)?$/.exec(step), id = m && ACTOR[m[1]];
    if (!id) return false;
    const s = game.state = game.newState();
    s.var[40] = m[2] ? 1 : 2;
    s.var[43] = 60;
    s.flags.z3 = 'done';
    party(game, [id, 3]);
    for (const x of s.party) { x.level = 50; x.exp = game.world.actors[x.id].exp[50]; applyLevel(game.world, x); heal(x); }
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle(m[2] ? [31, 32] : [123, 122], true, { loseOk: true }), 300);
    return true;
  },
});

// sounds these films play, for tools/copy_assets.py
export const ZF_SOUNDS = ['Z1 必殺技', 'Z3 変身', 'Z1 ブン', 'Z1 エネルギー波', 'Z3 エネルギー波', 'Z1 エネルギー波2', 'ZG 光線系ヒット2',
  'ZG 光線系ヒット3', 'Z1 爆発1', 'Z1 ザー', 'Z1 ゴー', 'Z3 超能力', 'Z3 避ける', 'Z3 跳ね返し', 'Z1 気を溜める', 'Z1 繰気弾', 'Z1 高速移動', 'Z1 逃げる',
  'Z1 強打', 'DB3 狼牙風風拳', 'Z1 打撃', 'ZG 打撃4', 'Z3 打撃', 'DB3 SE041', 'DB3 ダッシュ', 'DB3 刀', 'Z1 エネルギー波3', 'Z1 気を溜める3',
  'Z1 気を溜める4', 'Z1 衝撃波', 'Z1 飛ぶ', 'ZG 打撃3'];
export { Stage as ZfStage, FILMS as ZF_FILMS, ALL as ZF_ALL, ACTOR as ZF_ACTOR, SMALL as ZF_SMALL, AGAIN as ZF_AGAIN, blt as zfBlt }; // (the other move films use this stage too: docs/anim-cd-plan.md)

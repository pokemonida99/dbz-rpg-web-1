// The openings after Z1 (src/opening.js addOpening; which one: src/opening_pick.js), frame for frame on the original's
// 640×480 screen. Each film's state after frame f is what the original shows on its Graphics.update of that frame.
//   z3      z3_op (all.rb 167261): z3op/ z3_op_001-010 (512×448 at (64,16)); a white wash at 360, then grey, mid-grey
//           and black under the picture, and from there each new picture's band (y 178, 32×94) copied twice at each
//           side to fill the 640 width. 2060 frames.
//   z2      z2_op (167367): z2op/ z2_op_001-289 swapped on the listed frames (all preloaded, as the original does
//           「カクカク対策」). 3720 frames.
//   z2crew  z2_op with op_change 4 (ZG バーダック一味編): a member's 640×69 band of z2_op_kirikae (row $z2opchano, the
//           title's picture too) slides in from the left at y 154 while pictures 216-231 show.
import { audio } from './core.js?v=20261108-1751';
import { addOpening, blt } from './opening.js?v=20261108-1751';
import { crewNo } from './opening_pick.js?v=20261108-1751';

const pic = (n) => `Graphics/Pictures/${n}`;
const num3 = (n) => String(n).padStart(3, '0');

// ---------- Z3 ----------
const Z3 = (n) => pic(`z3op/z3_op_${num3(n)}.PNG`);
const Z3_END = 2060, Z3_FRA = 360, KASANE_Y = 178;
class Z3Op {
  constructor() {
    this.f = 0;
    this.n = 0; // picture_num
    this.top = true; // picture.z 255 (over the window) or 0 (under it)
    this.shown = true; // picture.visible
    this.fill = null; // the window's contents: a colour …
    this.strips = []; // … and the side bands copied onto it: [picture, …]
    this.step();
  }
  step() {
    const f = this.f;
    if ([16, 32, 48, 64, Z3_FRA + 120, Z3_FRA + 128, Z3_FRA + 136, Z3_END - 40, Z3_END - 32, Z3_END - 24].includes(f)) {
      this.top = true;
      this.n++;
      if (f === Z3_FRA + 120) { this.fill = 'rgb(188,188,188)'; this.strips = []; this.kasane = true; }
      else if (f === Z3_FRA + 128) { this.fill = 'rgb(127,127,127)'; this.strips = []; }
      else if (f === Z3_FRA + 136) { this.fill = 'rgb(0,0,0)'; this.strips = []; }
      if (this.kasane) this.strips.push(Z3(this.n));
    } else if (f === Z3_END - 16) { this.fill = null; this.strips = []; this.shown = false; }
    else if (f === Z3_FRA) { this.top = false; this.fill = 'rgb(255,255,255)'; }
  }
  tick() { this.f++; this.step(); }
  draw(c) {
    c.fillStyle = '#000';
    c.fillRect(0, 0, 640, 480);
    const picture = () => { if (this.n && this.shown) blt(c, Z3(this.n), 64, 16, 512, 448); };
    if (!this.top) picture();
    if (this.fill) { c.fillStyle = this.fill; c.fillRect(0, 0, 640, 480); }
    for (const p of this.strips) for (const x of [0, 32, 576, 608]) blt(c, p, x, KASANE_Y + 16, 32, 94, 0, KASANE_Y);
    if (this.top) picture();
  }
}
addOpening('z3', { images: () => Array.from({ length: 10 }, (_, i) => Z3(i + 1)), bgm: 'Z3 オープニング', end: Z3_END, make: () => new Z3Op() });

// ---------- Z2 ----------
const Z2 = (n) => pic(`z2op/z2_op_${num3(n)}.png`), KIRIKAE = pic('z2op/z2_op_kirikae.PNG');
const Z2_END = 3720;
// the frames a new picture comes on (the `when` list of z2_op)
const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const Z2_ON = new Set([0, 4, 8, 12, 45, 49, 53, 57, 90, 94, 98, 102, 135, 139, 143, 147, 180, 184, 188, 192, 225, 229, 233, 237,
  270, 274, 278, 282, ...span(313, 360), ...span(392, 424), ...span(433, 469), 560, 564, 568, 572, ...span(595, 659),
  ...span(767, 783), ...span(843, 859), ...span(930, 966), 974, 978, 982]);
class Z2Op {
  constructor(crew) {
    this.f = 0;
    this.n = 0;
    this.crew = crew; // null, or the member's row of z2_op_kirikae
    this.cx = -640; this.cOn = false; // chapicture
    this.step();
  }
  step() {
    const f = this.f;
    if (Z2_ON.has(f)) this.n++;
    else if (f === 986) this.n = 286;
    if (this.crew != null && this.n >= 216 && this.n <= 231) { this.cx += 40; this.cOn = true; }
  }
  tick() { this.f++; this.step(); }
  draw(c) {
    c.fillStyle = '#000';
    c.fillRect(0, 0, 640, 480);
    if (this.n) blt(c, Z2(Math.min(this.n, 289)), 0, 0, 640, 480);
    if (this.cOn) blt(c, KIRIKAE, this.cx, 154, 640, 69, 0, 69 * this.crew);
  }
}
const Z2_PICS = () => Array.from({ length: 289 }, (_, i) => Z2(i + 1));
addOpening('z2', { images: Z2_PICS, bgm: 'Z2 オープニング', end: Z2_END, make: () => new Z2Op(null) });
addOpening('z2crew', { images: () => [...Z2_PICS(), KIRIKAE], bgm: 'Z2 オープニング', end: Z2_END, make: () => new Z2Op(crewNo()) });

// ---------- the Cell Games (ZD) ----------
// No end of their own: the original waits for a key on the title picture with the song playing, which is what the
// title screen then shows, so they end there (end: the first frame of that).
//   cell3   z_cell_op_rev3 (22843, variable 84 = 1): Cell (Z3_背景_エンディング_セル1) runs right to left at y 136, three
//           white flashes after the card sound; then セル2's last pose left to right, the same again; at 240 Title3_2
//           and the song.
//   cell0   z_cell_op_rev0 (22636, 84 = 2): black bands over y 0-124 and 364-480; Goku slides in from the left to 458,
//           the flashes; Cell from the right to -60, the flashes; from 240 the white fades in 8 a frame, Title3_3
//           behind it, and out from 285; the song at 330. (The blue-red backdrop and Gohan it shows at 285 stay under
//           Title3_3, as in the original.)
//   cell4   z_cell_op_rev4 (22431, 84 = 3): cell0 with Title3_4 and ゴハン(超２).
const SYS = (n) => `Graphics/System/${n}.png`, ZC = (n) => pic(`zcellop/${n}.png`);
const CELL1 = pic('Z3_背景_エンディング_セル1.PNG'), CELL2 = pic('Z3_背景_エンディング_セル2.PNG');
const CARD_SE = 'ZD OPカードセット';
const KATIDOU = 120, FRA0 = 20, FRA = 6;
// the three flashes after each card sound (at 20 and 140): on at +6/+12/+18, off 3 frames later
const flash = (f) => { for (const b of [0, KATIDOU]) for (const k of [1, 2, 3]) { if (f === b + FRA0 + FRA * k) return true; if (f === b + FRA0 + FRA * k + FRA / 2) return false; } return null; };
class CellOp {
  constructor(kind) {
    this.kind = kind;
    this.f = 0;
    this.white = false; this.whiteOp = 255; // frapic
    this.back = false; // backpic's full rect
    this.title = SYS(kind === 'cell3' ? 'Title3_2' : kind === 'cell0' ? 'Title3_3' : 'Title3_4');
    this.dx = 0;
    if (kind === 'cell3') { this.px = 640; this.pic = CELL1; this.sx = 0; this.sw = 214; }
    else { this.p1 = -214; this.p2 = 644; this.second = false; this.fade = false; this.ryou = 0; this.add = 8; this.late = false; }
    this.step();
  }
  step() {
    const f = this.f, three = this.kind === 'cell3';
    if (three) this.px += this.dx;
    else {
      if (!this.second) { if (this.p1 < 448) this.p1 += this.dx; } else if (this.p2 > -60) this.p2 += this.dx;
      if (this.fade) {
        if (this.ryou > 255) { this.ryou = 255; this.back = true; } else this.ryou += this.add;
        this.whiteOp = Math.max(0, Math.min(255, this.ryou));
      }
    }
    const fl = flash(f);
    if (fl != null) this.white = fl;
    if (f === 0) this.dx = three ? -16 : 16;
    else if (f === FRA0 || f === FRA0 + KATIDOU) this.se = CARD_SE;
    else if (f === KATIDOU) {
      if (three) { this.px = -192; this.dx = 16; this.pic = CELL2; this.sx = 178 * 3; this.sw = 178; } else { this.second = true; this.dx = -16; }
    } else if (f === KATIDOU * 2) {
      if (three) this.back = true; else { this.fade = true; this.whiteOp = 0; this.white = true; }
    } else if (!three && f === KATIDOU * 2 + 45) { this.late = true; this.add = -8; }
  }
  tick() { this.f++; this.se = null; this.step(); if (this.se) audio.se(this.se); }
  draw(c) {
    c.fillStyle = '#000';
    c.fillRect(0, 0, 640, 480);
    if (this.kind === 'cell3') blt(c, this.pic, Math.round(this.px), 136, this.sw, 192, this.sx, 0);
    else {
      if (this.late) blt(c, ZC('タイトル背景(青赤)'), 0, 120, 640, 240);
      blt(c, ZC('ゴクウ(カラー)'), this.p1, 60, 232, 348);
      blt(c, ZC('セル(カラー)'), this.p2, 30, 224, 374);
      if (this.late) blt(c, ZC(this.kind === 'cell0' ? 'ゴハン(超１)' : 'ゴハン(超２)'), 0, 0, 640, 480);
      c.fillStyle = '#000';
      c.fillRect(0, 0, 640, 124);
      c.fillRect(0, 364, 640, 116);
    }
    if (this.back) blt(c, this.title, 0, 0, 640, 480);
    if (this.white && this.whiteOp > 0) { c.globalAlpha = this.whiteOp / 255; c.fillStyle = '#fff'; c.fillRect(0, 0, 640, 480); c.globalAlpha = 1; }
  }
}
for (const [key, title, gohan, end] of [['cell3', 'Title3_2', null, KATIDOU * 2 + 1], ['cell0', 'Title3_3', 'ゴハン(超１)', KATIDOU * 2 + 91],
  ['cell4', 'Title3_4', 'ゴハン(超２)', KATIDOU * 2 + 91]]) {
  const images = () => (gohan ? [SYS(title), ZC('タイトル背景(青赤)'), ZC('ゴクウ(カラー)'), ZC('セル(カラー)'), ZC(gohan)] : [SYS(title), CELL1, CELL2]);
  addOpening(key, { images, bgm: 'ZD オープニング', bgmAt: end - 1, end, make: () => new CellOp(key) });
}

// ---------- ZG 外傳 ----------
// z_gaiden_op_rev1 (21630, variable 84 = 5 / variable 43 151-200): no song of its own — the sound ZG イベント6 at the
// start (stopped at the end), ZG SE038 when the Earth turns. Rock and star strips (512 wide, copies side by side)
// scroll right by their tables until 1484; the Earth (82×94 cells of ZG_OP_地球_まとめ) drifts in from 1125, rises
// 2183-2393, turns at 3002 and goes in grey / light grey / white flashes; the eyes (160×30 cells) open at 2478 and
// close at 2966; the lines (output_mozi, black glyphs lifted by the sprite's tone 127 → 188 → 255) come and go in
// between. 3150 frames.
const ZG = (n) => pic(`zgop/ZG_OP_${n}`);
const ZG_PICS = { iu: ZG('岩_上段.PNG'), in: ZG('岩_中段.PNG'), is: ZG('岩_下段.PNG'), hu: ZG('星_上段.PNG'), hn: ZG('星_中段.PNG'),
  hs: ZG('星_下段.PNG'), hb1: ZG('星_背景1.PNG'), hb2: ZG('星_背景2.PNG'), earth: ZG('地球_まとめ.png'), eyes: ZG('目_まとめ.png') };
const ZG_ADJ = 20; // zyougetyouseiy
const ZG_MOVESTOP = 1484, ZG_UP = 2182, ZG_UPSTOP = 2394, ZG_ME = 2478, ZG_TURN = ZG_ME + 8 + 8 + 440 + 16 + 16 + 36;
const ZG_END = ZG_TURN + 108 + 40;
const UE_Y = 480 - 128 - 64 - 32 - ZG_ADJ, NAKA_Y = 480 - 128 - 64 - ZG_ADJ, SITA_Y = 480 - 128 - ZG_ADJ;
// [kind, picture, x, y, height, table] in the order they were made (all z 200: the later on top)
const ZG_LAYERS = [
  ['iu', 0, UE_Y, 32, [0, 2]], ['iu', -1, UE_Y, 32, [0, 2]],
  ['hu', -2, UE_Y, 32, [0, 2]], ['hu', -3, UE_Y, 32, [0, 2]], ['hu', -4, UE_Y, 32, [0, 2]],
  ['in', 0, NAKA_Y, 64, [0, 2, 2, 2]], ['in', -1, NAKA_Y, 64, [0, 2, 2, 2]],
  ['hn', -2, NAKA_Y, 64, [0, 2, 2, 2]], ['hn', -3, NAKA_Y, 64, [0, 2, 2, 2]], ['hn', -4, NAKA_Y, 64, [0, 2, 2, 2]], ['hn', -5, NAKA_Y, 64, [0, 2, 2, 2]],
  ['is', 0, SITA_Y, 128, [2, 2, 2, 2, 2, 2, 2, 4]], ['is', -1, SITA_Y, 128, [2, 2, 2, 2, 2, 2, 2, 4]],
  ...[-2, -3, -4, -5, -6, -7].map((k) => ['hs', k, SITA_Y, 128, [2, 2, 2, 2, 2, 2, 2, 4]]),
  ['hb1', 0, ZG_ADJ, 256, [0, 0, 0, 2]], ['hb1', -1, ZG_ADJ, 256, [0, 0, 0, 2]], ['hb2', -1, ZG_ADJ, 256, [0, 0, 0, 2]], ['hb2', -2, ZG_ADJ, 256, [0, 0, 0, 2]],
];
const EARTH_X = [0, 2];
const EARTH_Y = [ // tikyuytbl (all.rb 21919)
  2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0,
  2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0,
  2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0,
  2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0,
  2, 0, 2, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2, 0, 0, 2, 0,
  2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 2,
];
// the lines: the original's one case over the frame, its `when`s in order (the first that matches wins)
const A = ZG_MOVESTOP + 76, M = ZG_ME + 8 + 8;
const A2 = A + 8 + 8 + 92 + 4 + 4 + 92, A3 = A2 + 8 + 8 + 92 + 4 + 4 + 116;
const ZG_LINES = [
  [[A, A + 8 + 8 + 92 + 4], { text: '我們竟然被打敗了…', x: 174, dy: 130 }],
  [[A2, A2 + 8 + 8 + 92 + 4], { text: '可惡的賽亞人', x: 240, dy: 130 }],
  [[A3, A3 + 8 + 64 + 4], { text: '如果再給我一次機會！', x: 204, dy: 130 }],
  [[M + 82, M + 82 + 8 + 92 + 4], { text: '我一定會實現那個願望…', x: 204, dy: 150 }],
  [[M + 288, M + 440 + 16], { text: '將賽亞人徹底消滅！', x: 204, dy: 150 }],
  [[A + 8, A + 8 + 8 + 92, A2 + 8, A2 + 8 + 8 + 92, A3 + 8, A3 + 8 + 64, M + 82, M + 82 + 8 + 92, M + 288 + 8, M + 440], 188],
  [[A + 8 + 8, A2 + 8 + 8, A3 + 8 + 8, M + 82 + 8, M + 288 + 8 + 8], 255],
  [[A + 8 + 8 + 92 + 4 + 4, A2 + 8 + 8 + 92 + 4 + 4, A3 + 8 + 64 + 4 + 4, M + 82 + 8 + 92 + 4 + 4, M + 440 + 16 + 16], null],
];
class ZgOp {
  constructor() {
    this.f = 0;
    this.layers = ZG_LAYERS.map(([k, n, y, h, t]) => ({ p: ZG_PICS[k], x: 128 + 512 * n, y, h, t, on: false }));
    this.ix = 0; // the strips' and the Earth's table index (they all move on together)
    this.ex = -82; this.ey = 480 - 230; this.ecell = 0; this.eOn = true; this.eiy = 0;
    this.white = null; // frapic's colour while it shows
    this.eye = null; // mepic's cell
    this.line = null; // { text, x, y, tone }
    this.step();
  }
  // the case blocks of one loop pass, then the moves, as the original orders them
  step() {
    const f = this.f;
    if (f === ZG_TURN + 84) audio.se('ZG SE038');
    if (f >= ZG_TURN && f <= ZG_TURN + 20 && (f - ZG_TURN) % 4 === 0) this.ecell = (f - ZG_TURN) / 4 + 1;
    else if (f === ZG_TURN + 92) { this.ecell = 7; this.white = 'rgb(127,127,127)'; }
    else if (f === ZG_TURN + 100) { this.ecell = 8; this.white = 'rgb(188,188,188)'; }
    else if (f === ZG_TURN + 108) { this.eOn = false; this.white = 'rgb(255,255,255)'; }
    if (f === ZG_ME || f === ZG_ME + 8 + 8 + 440 + 16) this.eye = 0;
    else if (f === ZG_ME + 8 || f === ZG_ME + 8 + 8 + 440) this.eye = 1;
    else if (f === ZG_ME + 8 + 8) this.eye = 2;
    else if (f === ZG_ME + 8 + 8 + 440 + 16 + 16) this.eye = null;
    const w = ZG_LINES.find(([at]) => at.includes(f));
    if (w) {
      const v = w[1];
      if (v && typeof v === 'object') this.line = { text: v.text, x: v.x, y: this.ey + v.dy, tone: 127 };
      else if (v === null) this.line = null;
      else if (this.line) this.line.tone = v;
    }
    if (ZG_MOVESTOP > f) {
      for (const l of this.layers) {
        l.x += l.t[this.ix % l.t.length];
        if (l.x > -512) l.on = true;
        if (l.x > 640) l.on = false;
      }
      if (f >= 1125) this.ex += EARTH_X[this.ix % 2];
    }
    if (ZG_UP < f && ZG_UPSTOP > f) this.ey -= EARTH_Y[this.eiy % EARTH_Y.length];
  }
  tick() {
    this.f++;
    if (ZG_MOVESTOP > this.f) this.ix++;
    if (ZG_UP < this.f) this.eiy++;
    this.step();
  }
  draw(c) {
    c.fillStyle = '#000';
    c.fillRect(0, 0, 640, 480);
    for (const l of this.layers) if (l.on) blt(c, l.p, l.x, l.y, 512, l.h);
    if (this.white) { c.fillStyle = this.white; c.fillRect(0, 0, 640, 480); }
    if (this.eOn) blt(c, ZG_PICS.earth, this.ex, this.ey, 82, 94, 0, 94 * this.ecell);
    if (this.line) {
      c.font = `16px ${'Cubic11, system-ui, sans-serif'}`;
      c.textBaseline = 'top';
      c.fillStyle = `rgb(${this.line.tone},${this.line.tone},${this.line.tone})`;
      [...this.line.text].forEach((ch, i) => c.fillText(ch, this.line.x + 16 * i, this.line.y + 4));
    }
    if (this.eye != null) blt(c, ZG_PICS.eyes, 240, 480 - 130, 160, 30, 0, 30 * this.eye);
  }
}
addOpening('zg', { images: () => Object.values(ZG_PICS), bgm: null, se: 'ZG イベント6', end: ZG_END, make: () => new ZgOp() });

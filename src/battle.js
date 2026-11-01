// Card battle, following the original rules (docs/battle-rules.md), drawn on the canvas with the original
// battle-screen art so it looks like the classic version, stacked for a portrait phone:
//   status window  — TN, faces, LV / HP / KI in the original digits
//   stage          — choosing: enemy faces on the ground strip; fighting: the classic one-on-one battle film
//                    for each action (src/anime.js)
//   lower area     — message window; choosing: buttons + the six cards; fighting: the original duel bar
//                    (party face, HP/KI, both cards, enemy face)
// Choosing a card that allows a special move opens the move window over the stage.
import { view, img, audio, sleep, rand } from './core.js?v=20261101-1835';
import { levelUp } from './party.js?v=20261101-1835';
import { Duel, ANIME_IMAGES, SW, SH, BACK_Y } from './anime.js?v=20261101-1835';
import { battleCommand, autoSkill, autoTarget, tally } from './partymenu.js?v=20261101-1835'; // command menu, 作戰, counters
import { tryCombo, announceCombos, skillPower, comboHints, hasCombos, HINT_TEXT } from './combo.js?v=20261101-1835'; // 組合技

export const SCHOOL = ['必', '龜', '神', '界', '魔', '惑'];
const HAND = 6;
const EXP_RATE = 8; // the original's "経験値倍率" option; at 1 the opening chapter takes ~100 fights (Raditz needs about Lv6-7)
const CARDS = 'Graphics/Pictures/カード関係.PNG';
const FACES = 'Graphics/Pictures/Z1_顔味方.PNG'; // 64×64; row = actor id - 3; columns: normal, hurt, KO
const FOE_FACES = 'Graphics/Pictures/Z1_顔敵.PNG'; // 64×64; row = enemy id; columns: normal, hurt
const DIGITS = 'Graphics/Pictures/数字英語.PNG'; // 16×16 cells: row 0 black digits + "/", row 1 HPKILV, row 2 white digits
const FRAME_IMG = 'ui/frame.png'; // the Z1 window border (8px corners)
const PURPLE = '#9040f0', CREAM = '#ffd8a0', INK = '#301808', RUST = '#d0480c';
const FONT = 'Cubic11, system-ui, sans-serif';
// portrait battle backgrounds made for this version (pixel art in the style of the Z1 field strip), 400×600;
// one is picked per battle and kept for the whole fight. Film row 0 sits on image row BACKDROP_TOP.
const BACKDROPS = ['bg/battle_night.png', 'bg/battle_dusk.png', 'bg/battle_day.png'];
const BACKDROP_TOP = 205;

export function battleImages(world) {
  const sheets = new Set([...BACKDROPS, CARDS, FACES, FOE_FACES, DIGITS, FRAME_IMG, ...ANIME_IMAGES]);
  for (const a of Object.values(world.actors)) { sheets.add(a.sprite); sheets.add(a.special); }
  for (const e of Object.values(world.enemies)) { sheets.add(e.sprite); sheets.add(e.portrait); }
  return [...sheets];
}

// ---------- cards ----------
// Early Z1 player cards: school 必/龜/神/魔 at 1/4 each; enemies also roll 惑 (1/5 each).
export function newCard() { return { a: rand(8), g: rand(8), s: [0, 1, 2, 4][rand(4)] }; }
const enemyCard = () => ({ a: rand(8), g: rand(8), s: [0, 1, 2, 4, 5][rand(5)] });
export function newHand() { return Array.from({ length: HAND }, newCard); }

export function rollEncounter(world) {
  const pool = world.encounters['1'];
  const n = rand(3) + 1;
  return Array.from({ length: n }, () => pool[rand(pool.length)]);
}

// ---------- damage (docs/battle-rules.md §4) ----------
function playerDamage(m, skill, card, foe, foeCard) {
  const P = skill ? skill.power : 3;
  let d = Math.floor(((m.atk + P) * 8 * (card.a + 7 + rand(2) + 1)) / Math.floor((foe.def * (foeCard.g + 7)) / 3));
  if (card.s === m.school) d = Math.floor(d * 1.3);
  if (skill && skill.noDamage) d = 0;
  const avoid = Math.trunc((foe.agi * 1.2 + foeCard.g) / 3 - (m.agi * 1.1 + card.a) / 3);
  return avoid > 0 && rand(100) + 1 < avoid ? -1 : d;
}
function enemyDamage(foe, skill, card, m, guardCard) {
  const P = skill ? Math.trunc((foe.atk * skill.power) / 100) - foe.atk : 0;
  let d = Math.floor(((foe.atk + P) * 8 * (card.a + 7 + rand(2) + 1)) / Math.floor((m.def * (guardCard.g + 7)) / 3));
  if (card.s === foe.school) d = Math.floor(d * 1.2);
  const avoid = Math.trunc((m.agi * 1.2 + guardCard.g) / 3 - (foe.agi * 1.1 + card.a) / 3);
  return avoid > 0 && rand(100) + 1 < avoid ? -1 : d;
}

// ---------- drawing helpers (original art) ----------
function win(c, x, y, w, h, fill = CREAM) {
  c.fillStyle = fill;
  c.fillRect(x + 3, y + 3, w - 6, h - 6);
  const f = img(FRAME_IMG);
  if (!f.ok) return;
  const k = 8, im = f.im;
  c.drawImage(im, 0, 0, k, k, x, y, k, k);
  c.drawImage(im, 64 - k, 0, k, k, x + w - k, y, k, k);
  c.drawImage(im, 0, 64 - k, k, k, x, y + h - k, k, k);
  c.drawImage(im, 64 - k, 64 - k, k, k, x + w - k, y + h - k, k, k);
  c.drawImage(im, k, 0, 64 - 2 * k, k, x + k, y, w - 2 * k, k);
  c.drawImage(im, k, 64 - k, 64 - 2 * k, k, x + k, y + h - k, w - 2 * k, k);
  c.drawImage(im, 0, k, k, 64 - 2 * k, x, y + k, k, h - 2 * k);
  c.drawImage(im, 64 - k, k, k, 64 - 2 * k, x + w - k, y + k, k, h - 2 * k);
}
// a number in the original 16px digits, right-aligned at rx; row 0 = black, row 2 = white
function num(c, n, rx, y, row = 0) {
  const d = img(DIGITS);
  if (!d.ok) return;
  const s = String(Math.max(0, Math.floor(n)));
  for (let i = 0; i < s.length; i++) c.drawImage(d.im, 16 * Number(s[i]), 16 * row, 16, 16, rx - 16 * (s.length - i), y, 16, 16);
}
const LETTER = { H: 0, P: 1, K: 2, I: 3, L: 4, V: 5 };
function word(c, w, x, y) {
  const d = img(DIGITS);
  if (!d.ok) return;
  [...w].forEach((ch, i) => c.drawImage(d.im, 16 * LETTER[ch], 16, 16, 16, x + 16 * i, y, 16, 16));
}
function slash(c, x, y) { const d = img(DIGITS); if (d.ok) c.drawImage(d.im, 160, 0, 16, 16, x, y, 16, 16); }
// the original Z1 card (010_Share.rb set_card_frame): 64×96 frame, attack ball, guard numeral, school glyph
function card(c, cd, x, y) {
  const s = img(CARDS);
  if (!s.ok) return;
  c.drawImage(s.im, 0, 96, 64, 96, x, y, 64, 96);
  c.drawImage(s.im, 32 * cd.a, 0, 32, 32, x + 2, y + 2, 32, 32);
  c.drawImage(s.im, 32 * cd.g, 32, 32, 32, x + 30, y + 62, 32, 32);
  c.drawImage(s.im, 32 * cd.s, 64, 32, 32, x + 16, y + 32, 32, 32);
}
// "[神]" school tag under a face
function tag(c, school, x, y) {
  const s = img(CARDS);
  if (!s.ok) return;
  c.drawImage(s.im, 0, 192, 64, 32, x, y, 64, 32);
  c.drawImage(s.im, 32 * school, 64, 32, 32, x + 16, y, 32, 32);
}
function face(c, m, x, y) {
  const f = img(FACES);
  if (!f.ok) return;
  const col = m.hp <= 0 ? 2 : m.hp * 4 < m.maxhp ? 1 : 0;
  c.drawImage(f.im, 64 * col, 64 * (m.id - 3), 64, 64, x, y, 64, 64);
}
function foeFace(c, f, x, y) {
  const im = img(FOE_FACES);
  if (!im.ok) return;
  c.drawImage(im.im, f.hp * 4 < f.maxhp ? 64 : 0, 64 * f.id, 64, 64, x, y, 64, 64);
}
function text(c, s, x, y, color = INK, size = 16, align = 'left') {
  c.font = `${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = 'top';
  c.fillStyle = color;
  c.fillText(s, x, y);
}
function cursor(c, x, y) { // the original's blinking ▼
  if (Math.floor(performance.now() / 300) % 2) return;
  c.fillStyle = '#f83800';
  c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y); c.lineTo(x, y + 9); c.fill();
}

export class Battle {
  constructor(world, game, enemyIds, boss) {
    this.world = world;
    this.game = game;
    this.boss = boss;
    this.party = game.state.party;
    this.hand = game.state.hand;
    this.foes = enemyIds.map((id, i) => ({ ...world.enemies[id], id, slot: i, hp: world.enemies[id].maxhp }));
    this.anim = null; // the Duel being played
    this.backdrop = BACKDROPS[rand(BACKDROPS.length)];
    this.phase = 'plan'; // plan | fight | result
    this.mode = 'card'; // while planning: card | move | target
    this.turn = 1;
    this.msg = [];
    this.buttons = [];
    this.duel = null;
    this.hits = [];
    this.el = document.getElementById('battle');
  }

  // ---------- layout (art pixels; one art pixel is about one CSS pixel on a phone) ----------
  measure() {
    const p = this.el.querySelector('.safe').getBoundingClientRect();
    const safeT = parseFloat(getComputedStyle(this.el.querySelector('.safe')).paddingTop) / view.cssPerPx || 0;
    const safeB = (p.height - parseFloat(getComputedStyle(this.el.querySelector('.safe')).paddingTop)) / view.cssPerPx || 0;
    const W = view.w, H = view.h;
    const L = {};
    L.status = { x: 4, y: Math.round(safeT) + 4, w: W - 8, h: 190 };
    L.cardsY = Math.round(H - safeB - 100);
    L.btnY = L.cardsY - 44;
    L.msg = { x: 4, y: L.btnY - 64, w: W - 8, h: 62 };
    L.stage = { y: L.status.y + L.status.h + 4, h: 0 };
    L.stage.h = L.msg.y - 4 - L.stage.y;
    this.L = L;
    const n = this.foes.length;
    // choosing: the enemies' faces sit on the strip drawn mid-stage
    this.foes.forEach((f, i) => {
      f.fx = Math.round(W / 2 - (n * 72 - 8) / 2 + i * 72);
      f.fy = Math.round(L.stage.y + L.stage.h / 2 - 32);
    });
  }

  say(...lines) { this.msg = lines; }

  // ---------- canvas ----------
  // the battle film runs at the original's 60 frames a second (×3 after a tap)
  update(dt) {
    if (!this.anim) { this.acc = 0; return; }
    this.acc = Math.min(0.25, (this.acc || 0) + dt);
    while (this.acc >= 1 / 60 && this.anim) {
      this.acc -= 1 / 60;
      for (let k = 0; k < (this.fast ? 3 : 1) && this.anim; k++) this.anim.step();
    }
  }

  draw() {
    if (!this.L) return;
    const c = view.begin();
    const { L } = this;
    const W = view.w, now = performance.now();
    this.hits = [];
    c.fillStyle = PURPLE;
    c.fillRect(0, 0, W, view.h);
    this.drawStatus(c);
    // stage: this battle's background; choosing → the enemies' faces, fighting → the battle film
    this.drawFilm(c);
    if (this.phase !== 'fight') this.drawLineup(c);
    // message window
    win(c, L.msg.x, L.msg.y, L.msg.w, L.msg.h);
    this.msg.slice(0, 2).forEach((s, i) => text(c, s, L.msg.x + 12, L.msg.y + 10 + i * 22, INK, 17));
    if (this.cont && Math.floor(now / 400) % 2) text(c, '▼', L.msg.x + L.msg.w - 22, L.msg.y + L.msg.h - 22, RUST, 14);
    if (this.cont) this.hit(0, L.msg.y, W, view.h - L.msg.y, this.cont);
    if (this.phase === 'fight' && this.duel) this.drawDuel(c);
    else this.drawHand(c);
    if (this.mode === 'move' && this.phase === 'plan') this.drawMoves(c);
  }

  hit(x, y, w, h, fn) { this.hits.unshift({ x, y, w, h, fn }); } // later = on top

  onTap(e) {
    if (this.phase === 'fight' && this.anim && !this.cont) { this.fast = true; return; } // tap to speed the film up
    const r = view.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / view.cssPerPx, y = (e.clientY - r.top) / view.cssPerPx;
    const h = this.hits.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
    if (h) { audio.unlock(); h.fn(); }
  }

  drawStatus(c) {
    const { x, y, w, h } = this.L.status;
    win(c, x, y, w, h);
    // TN (turn) column and the HP / KI labels, like the original
    word(c, 'HP', x + 10, y + 116); word(c, 'KI', x + 10, y + 152);
    text(c, 'TN', x + 12, y + 10, INK, 16);
    num(c, this.turn, x + 44, y + 30);
    const colW = Math.min(124, (w - 64) / Math.max(2, this.party.length));
    this.party.forEach((m, i) => {
      const cx = x + 56 + i * colW;
      text(c, m.name, cx + 32, y + 8, INK, 18, 'center');
      face(c, m, cx, y + 28);
      if (this.phase === 'plan' && this.cur === i) {
        c.strokeStyle = '#f83800'; c.lineWidth = 3; c.strokeRect(cx - 1.5, y + 26.5, 67, 67);
      }
      const plan = this.plans && this.plans[i];
      if (this.phase === 'plan' && plan) {
        c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(cx, y + 74, 64, 18);
        text(c, plan.skill ? plan.skill.name : '攻擊', cx + 32, y + 76, '#fff', 12, 'center');
      }
      word(c, 'LV', cx, y + 96); num(c, m.level, cx + 64, y + 96);
      num(c, m.hp, cx + 64, y + 116); slash(c, cx, y + 132); num(c, m.maxhp, cx + 64, y + 132);
      num(c, m.ki, cx + 64, y + 152); slash(c, cx, y + 168); num(c, m.maxki, cx + 64, y + 168);
      this.hit(cx, y + 20, colW, h - 20, () => this.onFighterTap(i));
    });
  }

  // choosing: the enemies' faces on the ground strip (tap one to target it while targeting)
  drawLineup(c) {
    for (const f of this.foes) {
      if (f.hp <= 0) continue;
      c.fillStyle = '#000';
      c.fillRect(f.fx - 2, f.fy - 2, 68, 68);
      foeFace(c, f, f.fx, f.fy);
      text(c, f.name, f.fx + 32, f.fy + 92, '#fff', 14, 'center');
      c.fillStyle = '#402010'; c.fillRect(f.fx + 4, f.fy + 112, 56, 4);
      c.fillStyle = '#58d858'; c.fillRect(f.fx + 4, f.fy + 112, (56 * f.hp) / f.maxhp, 4);
      if (this.mode === 'target') {
        cursor(c, f.fx + 32, f.fy - 14);
        this.hit(f.fx - 6, f.fy - 20, 76, 90, () => this.commit(f.slot));
      }
    }
    if (this.mode === 'target') {
      c.fillStyle = 'rgba(0,0,0,.6)';
      c.fillRect(0, this.L.stage.y + 8, view.w, 26);
      text(c, '點選要攻擊的敵人', view.w / 2, this.L.stage.y + 12, '#ffd8a0', 16, 'center');
    }
  }

  drawHand(c) {
    const { L } = this;
    const W = view.w;
    // buttons row
    const n = this.buttons.length;
    if (n) {
      const gap = 6, bw = (W - 8 - gap * (n - 1)) / n;
      this.buttons.forEach(([label, fn], i) => {
        const bx = 4 + i * (bw + gap);
        win(c, bx, L.btnY, bw, 40);
        text(c, label, bx + bw / 2, L.btnY + 11, INK, 18, 'center');
        this.hit(bx, L.btnY, bw, 40, fn);
      });
    }
    // the six cards
    const m = this.phase === 'plan' && this.cur != null ? this.party[this.cur] : null;
    const step = Math.min(66, (W - 4) / HAND), x0 = Math.round((W - step * (HAND - 1) - 64) / 2);
    this.hand.forEach((cd, k) => {
      const used = this.plans && this.plans.some((p) => p && p.card === k);
      const x = Math.round(x0 + k * step);
      const special = m && (cd.s === m.school || cd.s === 0) && m.skills.length;
      const picked = this.pending && this.pending.card === k;
      const y = L.cardsY + (picked ? -10 : special ? -4 : 0);
      if (used) c.globalAlpha = 0.25;
      card(c, cd, x, y);
      c.globalAlpha = 1;
      if (picked || (special && cd.s === m.school)) {
        c.strokeStyle = picked ? '#fff' : '#ffd27a'; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, 66, 98);
      }
      if (m && !used && this.mode === 'card') this.hit(x, y, step, 100, () => this.onCard(k));
    });
  }

  // move window over the stage
  drawMoves(c) {
    const { L } = this;
    const m = this.party[this.cur];
    const skills = m.skills.map((sid) => this.world.skills[sid]);
    const hints = skills.map((s) => comboHints(this, this.cur, s.id)); // S-combos (src/combo.js)
    const rowH = hints.some((x) => x.length) ? 46 : 30, h = 46 + skills.length * rowH + 50;
    const x = 10, w = view.w - 20, y = Math.max(L.stage.y + 4, L.msg.y - 4 - h);
    win(c, x, y, w, h);
    text(c, `${m.name} 的招式`, x + 14, y + 12, RUST, 18);
    word(c, 'KI', x + w - 96, y + 12); num(c, m.ki, x + w - 14, y + 12);
    skills.forEach((s, i) => {
      const ry = y + 40 + i * rowH;
      const ok = m.ki >= s.ki;
      text(c, s.name + (s.all ? '（全體）' : ''), x + 30, ry + 6, ok ? INK : '#a08060', 18);
      text(c, `KI ${s.ki}`, x + w - 14, ry + 8, ok ? '#7a5230' : '#c0a080', 14, 'right');
      hints[i].forEach((t, k) => text(c, `組合技 ${t.name}（${t.need}）${this.pending.solo ? '不使用' : HINT_TEXT[t.st]}`,
        x + 30, ry + 27 + k * 14, t.st === 'ok' && !this.pending.solo ? RUST : '#a08060', 12));
      if (ok) this.hit(x, ry, w, rowH, () => { this.pending.skill = s; this.mode = 'card'; this.chooseTarget(); });
    });
    const btns = [['普通攻擊', () => { this.mode = 'card'; this.chooseTarget(); }], ['換一張卡', () => { this.pending = null; this.mode = 'card'; this.promptCard(); }]];
    if (hasCombos(this, this.cur)) btns.push([this.pending.solo ? '組合技：關' : '組合技：開', () => { this.pending.solo = !this.pending.solo; }]);
    const by = y + h - 46, bw = (w - 10 - 10 * btns.length) / btns.length;
    btns
      .forEach(([label, fn], i) => {
        const bx = x + 10 + i * (bw + 10);
        win(c, bx, by, bw, 36, '#fff0d0');
        text(c, label, bx + bw / 2, by + 9, INK, 17, 'center');
        this.hit(bx, by, bw, 36, fn);
      });
  }

  // the original fighting bar: party face + school, HP/KI, the two cards, enemy face + school
  drawDuel(c) {
    const { L } = this;
    const { m, mc, f, fc } = this.duel;
    const W = view.w, y = L.btnY + 4;
    const gap = Math.max(2, (W - 8 - 64 - 92 - 64 - 64 - 64) / 4);
    let x = 4;
    face(c, m, x, y); tag(c, m.school, x, y + 64);
    x += 64 + gap;
    c.fillStyle = CREAM; c.fillRect(x, y, 92, 96);
    word(c, 'HP', x + 2, y + 8); num(c, m.hp, x + 90, y + 8); slash(c, x + 22, y + 26); num(c, m.maxhp, x + 90, y + 26);
    word(c, 'KI', x + 2, y + 52); num(c, m.ki, x + 90, y + 52); slash(c, x + 22, y + 70); num(c, m.maxki, x + 90, y + 70);
    x += 92 + gap;
    card(c, mc, x, y);
    x += 64 + gap;
    card(c, fc, x, y);
    x = W - 4 - 64;
    foeFace(c, f, x, y); tag(c, f.school, x, y + 64);
  }

  // the 640×356 film stage, cropped to the phone: centred across, and when the stage is short the top of the
  // sky goes first (the fighters stand at y 120-216, the ground at 256-356)
  // The background is drawn on the main canvas behind it, lined up with the film (its ground under the fighters)
  // and sinking with the film's ground while a special move rises.
  drawFilm(c) {
    const { stage } = this.L;
    const W = view.w;
    const sw = Math.min(SW, W), sx = Math.round((SW - sw) / 2), dx = Math.round((W - sw) / 2);
    let sy = 0, sh = SH, dy = stage.y + Math.floor((stage.h - SH) / 2);
    if (stage.h < SH) { sh = Math.round(stage.h); sy = Math.floor((SH - sh) * 0.6); dy = stage.y; }
    c.save();
    c.beginPath(); c.rect(0, stage.y, W, stage.h); c.clip();
    const bd = img(this.backdrop);
    if (bd.ok) {
      const bx = Math.round((W - bd.im.width) / 2);
      const lift = Math.max(0, Math.min(50, Math.round((SH - stage.h) / 3))); // short screens: ground nearer the feet
      const by = dy - sy - BACKDROP_TOP - lift + (this.anim ? this.anim.back.y - BACK_Y : 0);
      if (by > stage.y) c.drawImage(bd.im, 0, 0, bd.im.width, 1, bx, stage.y, bd.im.width, by - stage.y + 1); // sky above the picture
      c.drawImage(bd.im, bx, by);
    }
    if (this.anim) {
      c.drawImage(this.anim.render(), sx, sy, sw, sh, dx, dy, sw, sh);
      if (this.anim.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.anim.fade})`; c.fillRect(0, stage.y, W, stage.h); }
    }
    c.restore();
  }

  // ---------- planning ----------
  able(m) { return m.hp > 0; }

  startPlanning() {
    this.phase = 'plan';
    this.fast = false;
    this.duel = null;
    this.plans = this.party.map(() => null);
    this.cur = this.party.findIndex((m) => this.able(m));
    battleCommand(this); // 戰鬥・菜單・逃跑 (src/partymenu.js)
  }

  promptCard() {
    const m = this.party[this.cur];
    this.mode = 'card';
    this.pending = null;
    this.say(`${m.name}：請選一張卡。`, `${SCHOOL[m.school]}流或「必」的卡可以使用必殺技。`);
    this.buttons = [['自動', () => this.autoPlan()], ['返回', () => battleCommand(this)]];
  }

  onFighterTap(i) {
    if (this.phase !== 'plan' || !this.able(this.party[i])) return;
    this.plans[i] = null;
    this.cur = i;
    this.promptCard();
  }

  onCard(k) {
    const m = this.party[this.cur];
    const cd = this.hand[k];
    this.pending = { card: k, skill: null };
    if ((cd.s === m.school || cd.s === 0) && m.skills.length) { this.mode = 'move'; this.buttons = []; return; }
    this.chooseTarget();
  }

  chooseTarget() {
    const alive = this.foes.filter((f) => f.hp > 0);
    if (alive.length === 1 || (this.pending.skill && this.pending.skill.all)) { this.commit(alive[0].slot); return; }
    this.mode = 'target';
    this.say(`${this.party[this.cur].name}：點選要攻擊的敵人。`);
    this.buttons = [
      ['打 HP 最少的', () => this.commit(alive.reduce((a, b) => (b.hp < a.hp ? b : a)).slot)],
      ['換一張卡', () => this.promptCard()],
    ];
  }

  commit(target) {
    this.plans[this.cur] = { ...this.pending, target };
    this.pending = null;
    const next = this.party.findIndex((m, i) => this.able(m) && !this.plans[i]);
    if (next < 0) { this.cur = null; this.resolveTurn(); return; }
    this.cur = next;
    this.promptCard();
  }

  // Auto mode (§2.3): own-school card first, then 必; the move and the target follow 作戰 (src/partymenu.js).
  autoPlan() {
    const usedCards = new Set(this.plans.filter(Boolean).map((p) => p.card));
    this.party.forEach((m, i) => {
      if (!this.able(m) || this.plans[i]) return;
      const free = this.hand.map((c, k) => k).filter((k) => !usedCards.has(k));
      let k = free.find((x) => this.hand[x].s === m.school);
      if (k == null) k = free.find((x) => this.hand[x].s === 0);
      let skill = null;
      if (k != null) skill = autoSkill(this.world, this.game.state, m); // 作戰 (src/partymenu.js)
      else k = free[rand(free.length)];
      usedCards.add(k);
      this.plans[i] = { card: k, skill, target: autoTarget(this.game.state, m, this.foes) };
    });
    this.cur = null;
    this.resolveTurn();
  }

  // ---------- resolution (§2.4) ----------
  async resolveTurn() {
    this.phase = 'fight';
    this.mode = 'card';
    this.buttons = [];
    this.acted = new Set(); // members already done this turn (S-combo partners)
    const order = [];
    this.party.forEach((m, i) => { const p = this.plans[i]; if (p) order.push({ kind: 'p', i, key: this.hand[p.card].a + this.hand[p.card].g, r: Math.random() }); });
    for (const f of this.foes) if (f.hp > 0) { f.card = enemyCard(); order.push({ kind: 'e', f, key: f.card.a + f.card.g, r: Math.random() }); }
    order.sort((a, b) => b.key - a.key || a.r - b.r);
    await sleep(300);
    for (const o of order) {
      if (this.over()) break;
      if (o.kind === 'p') await this.playerAct(o.i);
      else for (let n = 0; n < o.f.eva && o.f.hp > 0 && !this.over(); n++) { if (n > 0) o.f.card = enemyCard(); await this.enemyAct(o.f); }
    }
    for (const p of this.plans) if (p) this.hand[p.card] = newCard(); // used cards are regenerated in place (§1.6)
    if (this.over()) return;
    for (const m of this.party) { // recovery from the second turn on (§4.6)
      if (m.hp > 0) { m.hp = Math.min(m.maxhp, m.hp + Math.ceil((m.maxhp * 3) / 100)); m.ki = Math.min(m.maxki, m.ki + Math.ceil((m.maxki * 2.5) / 100)); }
      else m.hp = Math.min(m.maxhp, m.hp + Math.ceil((m.maxhp * 7.5) / 100));
    }
    await announceCombos(this);
    await sleep(400);
    this.turn++;
    this.startPlanning();
  }

  over() { return this.foes.every((f) => f.hp <= 0) || this.party.every((m) => m.hp <= 0); }

  // play one action as a battle film; the damage lands (HP, duel bar) when the hit shows on screen
  play(m, f, playerAttacks, skill, dmg, target) {
    const actor = this.world.actors[m.id];
    this.anim = new Duel({
      party: { normal: actor.sprite, special: actor.special },
      foe: { normal: f.portrait, special: f.sprite },
      playerAttacks, skill, ray: actor.ray, hit: dmg >= 0, damage: Math.max(0, dmg), margin: Math.max(0, (SW - view.w) / 2),
      onHit: () => {
        if (dmg < 0) return;
        target.hp = Math.max(0, target.hp - dmg);
        if (!playerAttacks) audio.se('Z1 ダメージ', 70);
      },
    });
    if (!this.fast && !this.msg[1]) this.msg = [this.msg[0], '（點一下畫面可以加速）'];
    return this.anim.finished.then(() => { this.anim = null; });
  }

  async playerAct(i) {
    const m = this.party[i];
    const p = this.plans[i];
    if (m.hp <= 0 || this.acted.has(i)) return;
    if (await tryCombo(this, i)) return;
    let foe = this.foes[p.target];
    if (!foe || foe.hp <= 0) foe = this.foes.filter((f) => f.hp > 0).reduce((a, b) => (b.hp < a.hp ? b : a));
    const cd = this.hand[p.card];
    let skill = p.skill;
    if (skill && m.ki < skill.ki) skill = null;
    const targets = skill && skill.all ? this.foes.filter((f) => f.hp > 0) : [foe];
    if (skill) m.ki -= skill.ki;
    const alive = targets.filter((t) => t.hp > 0).length;
    for (const t of targets) {
      t.card = t.card || enemyCard();
      this.duel = { m, mc: cd, f: t, fc: t.card };
      this.say(`${m.name} 的${skill ? skill.name : '攻擊'}！`, cd.s === m.school ? '流派一致，威力 ×1.3！' : '');
      const dmg = playerDamage(m, skill && { power: skillPower(this.game.state, skill.id, skill.power), noDamage: skill.noDamage }, cd, t, t.card);
      await this.play(m, t, true, skill ? skill.id : null, dmg, t);
    }
    tally(this.game.state, m, skill, alive - targets.filter((t) => t.hp > 0).length); // use counts, KOs
  }

  async enemyAct(f) {
    const targets = this.party.filter((m, i) => m.hp > 0 && this.plans[i]);
    if (!targets.length) return;
    const cd = f.card;
    let skill = null;
    if ((cd.s === 0 || cd.s === f.school) && f.actions.length) {
      const ok = f.actions.filter((a) => a.cond === 0 || (a.cond === 2 && (f.hp * 100) / f.maxhp <= a.param));
      if (ok.length) skill = this.world.skills[ok[rand(ok.length)].skill];
    }
    const m = targets[rand(targets.length)];
    const guard = this.hand[this.plans[this.party.indexOf(m)].card];
    this.duel = { m, mc: guard, f, fc: cd };
    this.say(`${f.name} 的${skill ? skill.name : '攻擊'}！`);
    await this.play(m, f, false, skill ? skill.id : null, enemyDamage(f, skill && { power: skill.power }, cd, m, guard), m);
  }

  // ---------- result ----------
  async rewards() {
    this.phase = 'result';
    this.duel = null;
    this.buttons = [];
    await announceCombos(this);
    const exp = this.foes.reduce((s, f) => s + f.exp, 0) * EXP_RATE;
    this.game.state.zeni += this.foes.reduce((s, f) => s + f.gold, 0);
    const ups = [];
    for (const m of this.party) {
      m.exp += exp;
      if (levelUp(this.world, m)) ups.push(`${m.name} 升到 LV ${m.level}`);
    }
    this.say('打倒敵人了！', `獲得 ${exp} 點經驗值`);
    await new Promise((res) => { this.cont = res; });
    if (ups.length) {
      audio.se('Z1 レベルアップ', 80);
      this.say(...ups.length > 1 ? [`${ups.join('、')}！`] : [`${ups[0]}！`]);
      await new Promise((res) => { this.cont = res; });
    }
    this.cont = null;
  }

  async run() {
    this.el.innerHTML = '<div class="safe"></div>';
    this.el.hidden = false;
    this.measure();
    const onTap = (e) => this.onTap(e);
    this.el.addEventListener('pointerdown', onTap);
    const onResize = () => this.measure();
    window.addEventListener('resize', onResize);
    await document.fonts.load(`16px ${FONT}`).catch(() => {});
    audio.playBgm(this.boss ? 'Z1 戦闘ボス1(中ボス)' : 'Z1 戦闘1');
    this.say(`${this.foes.map((f) => f.name).join('、')} 出現了！`);
    await sleep(700);
    const result = await new Promise((res) => {
      this.done = res;
      const watch = () => {
        if (this.foes.every((f) => f.hp <= 0)) res('win');
        else if (this.party.every((m) => m.hp <= 0)) res('lose');
        else setTimeout(watch, 200);
      };
      watch();
      this.startPlanning();
    });
    if (result === 'win') { audio.stopBgm(); audio.se('GBZ1 ファンファーレ1', 80); await this.rewards(); }
    window.removeEventListener('resize', onResize);
    this.el.removeEventListener('pointerdown', onTap);
    this.el.hidden = true;
    this.el.innerHTML = '';
    for (const m of this.party) if (m.hp <= 0 && result !== 'lose') m.hp = 1; // KO'd members get back up after the fight
    return result;
  }
}

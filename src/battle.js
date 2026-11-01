// Card battle, following the original rules (docs/battle-rules.md), drawn on the canvas with the original
// battle-screen art so it looks like the classic version, stacked for a portrait phone:
//   status window  — TN, faces, LV / HP / KI in the original digits
//   stage          — choosing: enemy faces on the ground strip; fighting: the sprites fight in the sky
//   lower area     — message window; choosing: buttons + the six cards; fighting: the original duel bar
//                    (party face, HP/KI, both cards, enemy face)
// Choosing a card that allows a special move opens the move window over the stage.
import { view, img, audio, sleep, rand } from './core.js?v=20261101-1534';
import { levelUp } from './party.js?v=20261101-1534';

export const SCHOOL = ['必', '龜', '神', '界', '魔', '惑'];
const HAND = 6;
const EXP_RATE = 8; // the original's "経験値倍率" option; at 1 the opening chapter takes ~100 fights (Raditz needs about Lv6-7)
const BG = 'Graphics/Pictures/Z1_戦闘_背景.PNG'; // 640×100 strips; strip 0 = Z1 field
const CARDS = 'Graphics/Pictures/カード関係.PNG';
const FACES = 'Graphics/Pictures/Z1_顔味方.PNG'; // 64×64; row = actor id - 3; columns: normal, hurt, KO
const FOE_FACES = 'Graphics/Pictures/Z1_顔敵.PNG'; // 64×64; row = enemy id; columns: normal, hurt
const DIGITS = 'Graphics/Pictures/数字英語.PNG'; // 16×16 cells: row 0 black digits + "/", row 1 HPKILV, row 2 white digits
const FRAME_IMG = 'ui/frame.png'; // the Z1 window border (8px corners)
const BEAM_ENEMY = 'Graphics/Pictures/Z1_戦闘_必殺技_エネルギー波_敵_中.PNG';
const FRAME = 96;
const POSE = { idle: 0, special: 1, melee: 3, hurt: 5 };
const PURPLE = '#9040f0', CREAM = '#ffd8a0', INK = '#301808', RUST = '#d0480c';
const FONT = 'Cubic11, system-ui, sans-serif';

export function battleImages(world) {
  const sheets = new Set([BG, CARDS, FACES, FOE_FACES, DIGITS, FRAME_IMG, BEAM_ENEMY]);
  for (const a of Object.values(world.actors)) { sheets.add(a.sprite); sheets.add(a.beam); }
  for (const e of Object.values(world.enemies)) sheets.add(e.sprite);
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
    this.fx = [];
    this.poses = new Map();
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
    L.ground = L.stage.y + L.stage.h - 100; // top of the 100px ground strip
    this.L = L;
    const n = this.foes.length;
    // choosing: faces sit on the strip; fighting: sprites in the sky, party left, enemies right
    this.foes.forEach((f, i) => {
      f.fx = Math.round(W / 2 - (n * 72 - 8) / 2 + i * 72);
      f.fy = Math.round(L.stage.y + L.stage.h / 2 - 32); // choosing: on the strip drawn mid-stage
      f.px = W - 64 - (i % 2) * 26;
      f.py = L.stage.y + 40 + ((L.ground + 40 - L.stage.y - 80) * (i + 0.5)) / Math.max(n, 2);
    });
    this.party.forEach((m, i) => {
      m.px = 64 + (i % 2) * 22;
      m.py = L.stage.y + 50 + ((L.ground + 30 - L.stage.y - 100) * (i + 0.5)) / Math.max(this.party.length, 2);
    });
  }

  say(...lines) { this.msg = lines; }

  // ---------- canvas ----------
  update() {}

  draw() {
    if (!this.L) return;
    const c = view.begin();
    const { L } = this;
    const W = view.w, now = performance.now();
    this.hits = [];
    c.fillStyle = PURPLE;
    c.fillRect(0, 0, W, view.h);
    this.drawStatus(c);
    // stage: black sky, the ground strip at the bottom
    c.fillStyle = '#000';
    c.fillRect(0, L.stage.y, W, L.stage.h);
    const bg = img(BG);
    const gy = this.phase === 'fight' ? L.ground : Math.round(L.stage.y + L.stage.h / 2 - 50);
    if (bg.ok) c.drawImage(bg.im, Math.max(0, (640 - W) / 2), 0, Math.min(640, W), 100, Math.max(0, (W - 640) / 2), gy, Math.min(640, W), 100);
    if (this.phase === 'fight') this.drawFight(c, now);
    else this.drawLineup(c);
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
    const rowH = 30, h = 46 + skills.length * rowH + 50;
    const x = 10, w = view.w - 20, y = Math.max(L.stage.y + 4, L.msg.y - 4 - h);
    win(c, x, y, w, h);
    text(c, `${m.name} 的招式`, x + 14, y + 12, RUST, 18);
    word(c, 'KI', x + w - 96, y + 12); num(c, m.ki, x + w - 14, y + 12);
    skills.forEach((s, i) => {
      const ry = y + 40 + i * rowH;
      const ok = m.ki >= s.ki;
      text(c, s.name + (s.all ? '（全體）' : ''), x + 30, ry + 6, ok ? INK : '#a08060', 18);
      text(c, `KI ${s.ki}`, x + w - 14, ry + 8, ok ? '#7a5230' : '#c0a080', 14, 'right');
      if (ok) this.hit(x, ry, w, rowH, () => { this.pending.skill = s; this.mode = 'card'; this.chooseTarget(); });
    });
    const by = y + h - 46, bw = (w - 30) / 2;
    [['普通攻擊', () => { this.mode = 'card'; this.chooseTarget(); }], ['換一張卡', () => { this.pending = null; this.mode = 'card'; this.promptCard(); }]]
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

  drawFight(c, now) {
    const drawFighter = (o, sheet) => {
      const im = img(sheet);
      if (!im.ok || o.hp <= 0) return;
      const p = this.poses.get(o);
      const live = p && p.until > now;
      const pose = live ? p.pose : POSE.idle;
      const shake = live && p.shake ? (Math.random() - 0.5) * 6 : 0;
      c.drawImage(im.im, 0, pose * FRAME, FRAME, FRAME, Math.round(o.px + (live ? p.dx || 0 : 0) + shake - FRAME / 2), Math.round(o.py - FRAME / 2), FRAME, FRAME);
    };
    for (const m of this.party) drawFighter(m, this.world.actors[m.id].sprite);
    for (const f of this.foes) drawFighter(f, f.sprite);
    this.fx = this.fx.filter((e) => e.until > now);
    for (const e of this.fx) {
      const t = 1 - (e.until - now) / e.dur;
      if (e.type === 'beam') {
        const im = img(e.sheet);
        if (!im.ok) continue;
        const len = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) * Math.min(1, t * 1.6);
        c.save();
        c.translate(e.x1, e.y1);
        c.rotate(Math.atan2(e.y2 - e.y1, e.x2 - e.x1));
        c.drawImage(im.im, 0, 0, im.im.width, im.im.height, 0, -im.im.height / 2, Math.max(1, len), im.im.height);
        c.restore();
      } else if (e.type === 'num') {
        const y = Math.round(e.y - 24 * Math.min(1, t * 2));
        if (e.miss) text(c, 'MISS', e.x, y, '#fff', 18, 'center');
        else num(c, e.value, Math.round(e.x + (String(e.value).length * 16) / 2), y, 2);
      } else if (e.type === 'flash') {
        c.fillStyle = `rgba(255,255,255,${0.6 * (1 - t)})`;
        c.fillRect(0, this.L.stage.y, view.w, this.L.stage.h);
      }
    }
  }

  // ---------- planning ----------
  able(m) { return m.hp > 0; }

  startPlanning() {
    this.phase = 'plan';
    this.duel = null;
    this.plans = this.party.map(() => null);
    this.cur = this.party.findIndex((m) => this.able(m));
    this.promptCard();
  }

  promptCard() {
    const m = this.party[this.cur];
    this.mode = 'card';
    this.pending = null;
    this.say(`${m.name}：請選一張卡。`, `${SCHOOL[m.school]}流或「必」的卡可以使用必殺技。`);
    this.buttons = [['自動', () => this.autoPlan()], ...(this.boss ? [] : [['逃跑', () => this.done('escape')]])];
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

  // Auto mode (§2.3): own-school card first, then 必; a random affordable move; target the weakest enemy.
  autoPlan() {
    const usedCards = new Set(this.plans.filter(Boolean).map((p) => p.card));
    const weakest = () => this.foes.filter((f) => f.hp > 0).reduce((a, b) => (b.hp < a.hp ? b : a)).slot;
    this.party.forEach((m, i) => {
      if (!this.able(m) || this.plans[i]) return;
      const free = this.hand.map((c, k) => k).filter((k) => !usedCards.has(k));
      let k = free.find((x) => this.hand[x].s === m.school);
      if (k == null) k = free.find((x) => this.hand[x].s === 0);
      let skill = null;
      if (k != null) {
        const ok = m.skills.map((s) => this.world.skills[s]).filter((s) => m.ki >= s.ki);
        skill = ok.length ? ok[rand(ok.length)] : null;
      } else {
        k = free[rand(free.length)];
      }
      usedCards.add(k);
      this.plans[i] = { card: k, skill, target: weakest() };
    });
    this.cur = null;
    this.resolveTurn();
  }

  // ---------- resolution (§2.4) ----------
  async resolveTurn() {
    this.phase = 'fight';
    this.mode = 'card';
    this.buttons = [];
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
    await sleep(400);
    this.turn++;
    this.startPlanning();
  }

  over() { return this.foes.every((f) => f.hp <= 0) || this.party.every((m) => m.hp <= 0); }

  pose(o, pose, ms, extra = {}) { this.poses.set(o, { pose, until: performance.now() + ms, ...extra }); }

  async playerAct(i) {
    const m = this.party[i];
    const p = this.plans[i];
    if (m.hp <= 0) return;
    let foe = this.foes[p.target];
    if (!foe || foe.hp <= 0) foe = this.foes.filter((f) => f.hp > 0).reduce((a, b) => (b.hp < a.hp ? b : a));
    const cd = this.hand[p.card];
    let skill = p.skill;
    if (skill && m.ki < skill.ki) skill = null;
    const targets = skill && skill.all ? this.foes.filter((f) => f.hp > 0) : [foe];
    foe.card = foe.card || enemyCard();
    this.duel = { m, mc: cd, f: foe, fc: foe.card };
    this.say(`${m.name} 的${skill ? skill.name : '攻擊'}！`, cd.s === m.school ? '流派一致，威力 ×1.3！' : '');
    if (skill) {
      m.ki -= skill.ki;
      this.pose(m, POSE.special, 900);
      audio.se('Z1 エネルギー波', 70);
      await sleep(250);
      for (const t of targets) this.fx.push({ type: 'beam', sheet: this.world.actors[m.id].beam, x1: m.px + 30, y1: m.py - 10, x2: t.px - 20, y2: t.py - 10, until: performance.now() + 650, dur: 650 });
      await sleep(550);
    } else {
      this.pose(m, POSE.melee, 600, { dx: 40 });
      audio.se('Z1 打撃', 70);
      await sleep(300);
    }
    for (const t of targets) this.hit2(t, playerDamage(m, skill && { power: skill.power, noDamage: skill.noDamage }, cd, t, t.card || enemyCard()));
    await sleep(700);
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
    if (skill) {
      this.pose(f, 2, 900);
      audio.se('Z1 エネルギー波2', 70);
      await sleep(250);
      this.fx.push({ type: 'beam', sheet: BEAM_ENEMY, x1: f.px - 30, y1: f.py - 10, x2: m.px + 20, y2: m.py - 10, until: performance.now() + 650, dur: 650 });
      await sleep(550);
    } else {
      this.pose(f, 1, 600, { dx: -40 });
      audio.se('Z1 打撃', 70);
      await sleep(300);
    }
    this.hit2(m, enemyDamage(f, skill && { power: skill.power }, cd, m, guard));
    await sleep(700);
  }

  hit2(t, d) {
    if (d < 0) {
      audio.se('Z1 避ける', 70);
      this.fx.push({ type: 'num', miss: true, x: t.px, y: t.py - 56, until: performance.now() + 900, dur: 900 });
      return;
    }
    t.hp = Math.max(0, t.hp - d);
    if (this.party.includes(t)) audio.se('Z1 ダメージ', 70);
    this.pose(t, POSE.hurt, 500, { shake: true });
    this.fx.push({ type: 'num', value: d, x: t.px, y: t.py - 56, until: performance.now() + 900, dur: 900 });
    this.fx.push({ type: 'flash', until: performance.now() + 120, dur: 120 });
  }

  // ---------- result ----------
  async rewards() {
    this.phase = 'result';
    this.duel = null;
    this.buttons = [];
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

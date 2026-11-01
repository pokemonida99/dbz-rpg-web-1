// Card battle, following the original rules (docs/battle-rules.md), in a fixed one-screen portrait layout:
//   top    — while choosing: the enemies' portraits (tap one to target it); while fighting: the battle stage
//   bottom — message window, the party, the six-card hand (original card art), buttons
// Choosing a card that allows a special move opens a move picker over the hand.
import { view, img, audio, sleep, rand } from './core.js?v=20261101-1511';
import { faceCanvas } from './main.js?v=20261101-1511';
import { levelUp } from './party.js?v=20261101-1511';

export const SCHOOL = ['必', '龜', '神', '界', '魔', '惑'];
const HAND = 6;
const EXP_RATE = 8; // the original's "経験値倍率" option; at 1 the opening chapter takes ~100 fights (Raditz needs about Lv6-7)
const BG = 'Graphics/Pictures/Z1_戦闘_背景.PNG'; // 640×100 strips; strip 0 = Z1 field
const CARDS = 'Graphics/Pictures/カード関係.PNG';
const BEAM_ENEMY = 'Graphics/Pictures/Z1_戦闘_必殺技_エネルギー波_敵_中.PNG';
const FRAME = 96;
const POSE = { idle: 0, special: 1, melee: 3, hurt: 5 };

export function battleImages(world) {
  const sheets = new Set([BG, CARDS, BEAM_ENEMY]);
  for (const a of Object.values(world.actors)) { sheets.add(a.sprite); sheets.add(a.beam); }
  for (const e of Object.values(world.enemies)) { sheets.add(e.sprite); sheets.add(e.portrait); }
  return [...sheets];
}

// ---------- cards ----------
// Early Z1 player cards: school 必/龜/神/魔 at 1/4 each; enemies also roll 惑 (1/5 each).
export function newCard() { return { a: rand(8), g: rand(8), s: [0, 1, 2, 4][rand(4)] }; }
const enemyCard = () => ({ a: rand(8), g: rand(8), s: [0, 1, 2, 4, 5][rand(5)] });
export function newHand() { return Array.from({ length: HAND }, newCard); }

// The original Z1 card (010_Share.rb set_card_frame, 140_Field_Main.rb cardupdate): 64×96 frame,
// attack dragon-ball top-left, guard numeral bottom-right, school glyph in the middle.
function cardCanvas(card) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 96;
  const s = img(CARDS);
  const x = c.getContext('2d');
  if (s.ok) {
    x.drawImage(s.im, 0, 96, 64, 96, 0, 0, 64, 96);
    x.drawImage(s.im, 32 * card.a, 0, 32, 32, 2, 2, 32, 32);
    x.drawImage(s.im, 32 * card.g, 32, 32, 32, 30, 62, 32, 32);
    x.drawImage(s.im, 32 * card.s, 64, 32, 32, 16, 32, 32, 32);
  }
  return c;
}

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
    this.phase = 'plan'; // plan | fight
    this.el = document.getElementById('battle');
    this.stage = { y: 0, h: 300 };
  }

  // ---------- layout ----------
  build() {
    this.el.innerHTML = `
      <div class="top"><div class="foes"></div></div>
      <div class="lower">
        <div class="blog"></div>
        <div class="fighters"></div>
        <div class="hand"></div>
        <div class="bactions"></div>
        <div class="sheet" hidden></div>
      </div>`;
    this.topEl = this.el.querySelector('.top');
    this.topEl.addEventListener('pointerdown', (e) => this.onTopTap(e));
    this.foesEl = this.el.querySelector('.foes');
    this.logEl = this.el.querySelector('.blog');
    this.sheetEl = this.el.querySelector('.sheet');
    this.measure();
  }

  // the stage is drawn on the canvas behind the top area
  measure() {
    const r = this.topEl.getBoundingClientRect(), c = view.canvas.getBoundingClientRect();
    this.stage = { y: (r.top - c.top) / view.cssPerPx, h: r.height / view.cssPerPx };
    const { y, h } = this.stage;
    const n = this.foes.length;
    this.foes.forEach((f, i) => { f.px = view.w - 72 - (i % 2) * 30; f.py = y + 20 + ((h - 40) * (i + 0.5)) / Math.max(n, 2); });
    this.party.forEach((m, i) => { m.px = 72 + (i % 2) * 18; m.py = y + 30 + ((h - 60) * (i + 0.5)) / Math.max(this.party.length, 2); });
    // line-up while choosing (like the original's enemy window): side by side on the ground strip
    const gap = view.w / (n + 1);
    this.foes.forEach((f, i) => { f.lx = gap * (i + 1); f.ly = y + h * 0.58; });
  }

  log(html) { this.logEl.innerHTML = html; }

  // the enemies are drawn on the canvas (see draw); this only shows the targeting hint
  renderFoes() {
    this.foesEl.hidden = !this.picking;
    this.foesEl.textContent = this.picking ? '▼ 點選要攻擊的敵人' : '';
  }

  onTopTap(e) {
    if (!this.picking) return;
    const r = view.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / view.cssPerPx, y = (e.clientY - r.top) / view.cssPerPx;
    let best = null, bd = 1e9;
    for (const f of this.foes) {
      if (f.hp <= 0) continue;
      const d = Math.hypot(f.lx - x, f.ly - y);
      if (d < bd) { bd = d; best = f; }
    }
    if (best && bd < 90) this.commit(best.slot);
  }

  renderFighters() {
    const box = this.el.querySelector('.fighters');
    box.innerHTML = '';
    this.party.forEach((m, i) => {
      const d = document.createElement('div');
      const plan = this.plans && this.plans[i];
      d.className = `fighter${this.cur === i ? ' on' : ''}${plan ? ' done' : ''}${m.hp <= 0 ? ' ko' : ''}`;
      d.appendChild(faceCanvas(m.face));
      const what = plan ? (plan.skill ? plan.skill.name : '普通攻擊') : (m.hp <= 0 ? '倒下' : (this.cur === i ? '選卡中…' : ''));
      d.insertAdjacentHTML('beforeend', `<div class="info"><div class="nm">${m.name} <span class="nums">Lv${m.level} ${SCHOOL[m.school]}流</span></div>
        <div class="bar"><i style="width:${Math.max(0, (100 * m.hp) / m.maxhp)}%"></i></div>
        <div class="bar ki"><i style="width:${(100 * m.ki) / m.maxki}%"></i></div>
        <div class="nums">HP ${Math.max(0, m.hp)} KI ${m.ki}</div><div class="pick">${what}</div></div>`);
      d.onclick = () => this.onFighterTap(i);
      box.appendChild(d);
    });
  }

  renderHand() {
    const box = this.el.querySelector('.hand');
    box.innerHTML = '';
    const m = this.cur != null ? this.party[this.cur] : null;
    this.hand.forEach((card, k) => {
      const used = this.plans && this.plans.some((p) => p && p.card === k);
      const b = document.createElement('button');
      const special = m && (card.s === m.school || card.s === 0) && m.skills.length;
      b.className = `card${used ? ' used' : ''}${special ? ' special' : ''}${m && card.s === m.school ? ' match' : ''}`;
      b.appendChild(cardCanvas(card));
      b.disabled = used || !m || this.phase !== 'plan';
      b.onclick = () => this.onCard(k);
      box.appendChild(b);
    });
  }

  renderActions(list) {
    const box = this.el.querySelector('.bactions');
    box.innerHTML = '';
    for (const [label, fn, opts] of list) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = label;
      if (opts && opts.disabled) b.disabled = true;
      b.onclick = fn;
      box.appendChild(b);
    }
  }

  setPhase(p) {
    this.phase = p;
    if (p !== 'plan') this.foesEl.hidden = true;
  }

  // ---------- canvas: background always, fighters only while fighting ----------
  update() {}

  draw() {
    const c = view.begin();
    const { y: Y, h: H } = this.stage;
    c.fillStyle = '#000';
    c.fillRect(0, 0, view.w, view.h);
    const g = c.createLinearGradient(0, Y, 0, Y + H);
    g.addColorStop(0, '#0b1340'); g.addColorStop(0.62, '#2a2f6a'); g.addColorStop(1, '#3a2a1a');
    c.fillStyle = g;
    c.fillRect(0, Y, view.w, H);
    const bg = img(BG);
    if (bg.ok) for (let x = -((performance.now() / 40) % 640); x < view.w; x += 640) c.drawImage(bg.im, 0, 0, 640, 100, x, Y + H * 0.58 - 50, 640, 100);
    const now = performance.now();
    if (this.phase !== 'fight') {
      // choosing: enemies stand on the strip with name and HP, a blinking cursor while targeting
      c.font = '16px Cubic11, system-ui, sans-serif';
      c.textAlign = 'center';
      for (const f of this.foes) {
        if (f.hp <= 0) continue;
        const im = img(f.portrait);
        if (im.ok) c.drawImage(im.im, 0, 0, FRAME, FRAME, Math.round(f.lx - FRAME / 2), Math.round(f.ly - FRAME + 10), FRAME, FRAME);
        const ty = f.ly + 24;
        c.fillStyle = '#000';
        c.fillRect(f.lx - 40, ty - 14, 80, 32);
        c.fillStyle = '#fff';
        c.fillText(f.name, f.lx, ty);
        c.fillStyle = '#3a2a1a';
        c.fillRect(f.lx - 34, ty + 6, 68, 5);
        c.fillStyle = '#4fd16b';
        c.fillRect(f.lx - 34, ty + 6, (68 * f.hp) / f.maxhp, 5);
        if (this.picking && Math.floor(now / 300) % 2 === 0) {
          c.fillStyle = '#ffd27a';
          c.beginPath();
          c.moveTo(f.lx - 9, f.ly - FRAME + 2); c.lineTo(f.lx + 9, f.ly - FRAME + 2); c.lineTo(f.lx, f.ly - FRAME + 14);
          c.fill();
        }
      }
      return;
    }
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
        const L = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) * Math.min(1, t * 1.6);
        c.save();
        c.translate(e.x1, e.y1);
        c.rotate(Math.atan2(e.y2 - e.y1, e.x2 - e.x1));
        c.drawImage(im.im, 0, 0, im.im.width, im.im.height, 0, -im.im.height / 2, Math.max(1, L), im.im.height);
        c.restore();
      } else if (e.type === 'num') {
        c.font = '24px Cubic11, system-ui, sans-serif';
        c.textAlign = 'center';
        c.lineWidth = 4;
        c.strokeStyle = '#000';
        c.fillStyle = e.color;
        const y = e.y - 30 * t;
        c.globalAlpha = 1 - Math.max(0, t - 0.7) / 0.3;
        c.strokeText(e.text, e.x, y);
        c.fillText(e.text, e.x, y);
        c.globalAlpha = 1;
      } else if (e.type === 'flash') {
        c.fillStyle = `rgba(255,255,255,${0.6 * (1 - t)})`;
        c.fillRect(0, Y, view.w, H);
      }
    }
  }

  // ---------- planning ----------
  able(m) { return m.hp > 0; }

  startPlanning() {
    this.setPhase('plan');
    this.plans = this.party.map(() => null);
    this.cur = this.party.findIndex((m) => this.able(m));
    this.picking = false;
    this.renderFoes();
    this.renderFighters();
    this.renderHand();
    this.promptCard();
  }

  promptCard() {
    const m = this.party[this.cur];
    this.log(`<b>${m.name}</b>：選一張卡。<br>發光的卡（${SCHOOL[m.school]}流或必）可以使用必殺技。`);
    this.renderActions([
      ['自動', () => this.autoPlan()],
      ...(this.boss ? [] : [['逃跑', () => this.done('escape')]]),
    ]);
  }

  onFighterTap(i) {
    if (this.phase !== 'plan' || !this.able(this.party[i])) return;
    this.closeSheet();
    this.picking = false;
    this.plans[i] = null;
    this.cur = i;
    this.renderFoes();
    this.renderFighters();
    this.renderHand();
    this.promptCard();
  }

  onCard(k) {
    const m = this.party[this.cur];
    const card = this.hand[k];
    this.pending = { card: k, skill: null };
    if (!((card.s === m.school || card.s === 0) && m.skills.length)) { this.chooseTarget(); return; }
    // move picker over the hand
    const skills = m.skills.map((sid) => this.world.skills[sid]);
    this.sheetEl.innerHTML = `<div class="ttl">${m.name} 的招式　<span>KI ${m.ki}</span></div>`;
    for (const s of skills) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.disabled = m.ki < s.ki;
      b.innerHTML = `${s.name}<small>KI ${s.ki}${s.all ? '・全體' : ''}${m.ki < s.ki ? '　KI 不足' : ''}</small>`;
      b.onclick = () => { this.pending.skill = s; this.closeSheet(); this.chooseTarget(); };
      this.sheetEl.appendChild(b);
    }
    const row = document.createElement('div');
    row.className = 'row';
    const plain = document.createElement('button');
    plain.className = 'btn';
    plain.textContent = '普通攻擊';
    plain.onclick = () => { this.closeSheet(); this.chooseTarget(); };
    const back = document.createElement('button');
    back.className = 'btn';
    back.textContent = '換一張卡';
    back.onclick = () => { this.pending = null; this.closeSheet(); };
    row.append(plain, back);
    this.sheetEl.appendChild(row);
    this.sheetEl.hidden = false;
  }

  closeSheet() { this.sheetEl.hidden = true; this.sheetEl.innerHTML = ''; }

  chooseTarget() {
    const alive = this.foes.filter((f) => f.hp > 0);
    if (alive.length === 1 || (this.pending.skill && this.pending.skill.all)) { this.commit(alive[0].slot); return; }
    this.picking = true;
    this.renderFoes();
    this.log(`<b>${this.party[this.cur].name}</b>：點上方的敵人決定攻擊目標。`);
    this.renderActions([
      ['攻擊 HP 最少的', () => this.commit(alive.reduce((a, b) => (b.hp < a.hp ? b : a)).slot)],
      ['換一張卡', () => { this.picking = false; this.pending = null; this.renderFoes(); this.promptCard(); }],
    ]);
  }

  commit(target) {
    this.picking = false;
    this.plans[this.cur] = { ...this.pending, target };
    this.pending = null;
    const next = this.party.findIndex((m, i) => this.able(m) && !this.plans[i]);
    if (next < 0) { this.cur = null; this.renderFoes(); this.renderFighters(); this.resolveTurn(); return; }
    this.cur = next;
    this.renderFoes();
    this.renderFighters();
    this.renderHand();
    this.promptCard();
  }

  // Auto mode (§2.3): own-school card first, then 必; a random affordable move; target the weakest enemy.
  autoPlan() {
    this.closeSheet();
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
    this.renderFighters();
    this.resolveTurn();
  }

  // ---------- resolution (§2.4) ----------
  async resolveTurn() {
    this.setPhase('fight');
    this.renderHand();
    this.renderActions([]);
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
    const card = this.hand[p.card];
    let skill = p.skill;
    if (skill && m.ki < skill.ki) skill = null;
    const targets = skill && skill.all ? this.foes.filter((f) => f.hp > 0) : [foe];
    this.log(`<b>${m.name}</b> 的${skill ? skill.name : '攻擊'}！${card.s === m.school ? '（流派一致 ×1.3）' : ''}`);
    if (skill) {
      m.ki -= skill.ki;
      this.renderFighters();
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
    for (const t of targets) this.hit(t, playerDamage(m, skill && { power: skill.power, noDamage: skill.noDamage }, card, t, t.card || enemyCard()), '#ffe36b');
    await sleep(650);
    this.renderFighters();
  }

  async enemyAct(f) {
    const targets = this.party.filter((m, i) => m.hp > 0 && this.plans[i]);
    if (!targets.length) return;
    const card = f.card;
    let skill = null;
    if ((card.s === 0 || card.s === f.school) && f.actions.length) {
      const ok = f.actions.filter((a) => a.cond === 0 || (a.cond === 2 && (f.hp * 100) / f.maxhp <= a.param));
      if (ok.length) skill = this.world.skills[ok[rand(ok.length)].skill];
    }
    const m = targets[rand(targets.length)];
    const guard = this.hand[this.plans[this.party.indexOf(m)].card];
    this.log(`<b>${f.name}</b> 的${skill ? skill.name : '攻擊'}！`);
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
    this.hit(m, enemyDamage(f, skill && { power: skill.power }, card, m, guard), '#ff7b6b');
    await sleep(650);
    this.renderFighters();
  }

  hit(t, d, color) {
    if (d < 0) {
      audio.se('Z1 避ける', 70);
      this.fx.push({ type: 'num', text: 'MISS', x: t.px, y: t.py - 40, color: '#ddd', until: performance.now() + 900, dur: 900 });
      return;
    }
    t.hp = Math.max(0, t.hp - d);
    if (this.party.includes(t)) audio.se('Z1 ダメージ', 70);
    this.pose(t, POSE.hurt, 500, { shake: true });
    this.fx.push({ type: 'num', text: String(d), x: t.px, y: t.py - 40, color, until: performance.now() + 900, dur: 900 });
    this.fx.push({ type: 'flash', until: performance.now() + 120, dur: 120 });
  }

  // ---------- result ----------
  async rewards() {
    const exp = this.foes.reduce((s, f) => s + f.exp, 0) * EXP_RATE;
    this.game.state.zeni += this.foes.reduce((s, f) => s + f.gold, 0);
    const lines = [`戰鬥勝利！ 獲得經驗值 <b>${exp}</b>`];
    for (const m of this.party) {
      m.exp += exp;
      if (levelUp(this.world, m)) lines.push(`<b>${m.name}</b> 升到 Lv${m.level}！`);
    }
    this.log(lines.join('<br>'));
    if (lines.length > 1) audio.se('Z1 レベルアップ', 80);
    this.renderFighters();
    await new Promise((res) => this.renderActions([['繼續', res]]));
  }

  async run() {
    this.el.hidden = false;
    this.build();
    this.setPhase('plan');
    audio.playBgm(this.boss ? 'Z1 戦闘ボス1(中ボス)' : 'Z1 戦闘1');
    this.renderFoes();
    this.renderFighters();
    this.renderHand();
    this.log(`${this.foes.map((f) => f.name).join('、')} 出現了！`);
    const onResize = () => this.measure();
    window.addEventListener('resize', onResize);
    await sleep(600);
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
    window.removeEventListener('resize', onResize);
    if (result === 'win') { audio.stopBgm(); audio.se('GBZ1 ファンファーレ1', 80); await this.rewards(); }
    this.el.hidden = true;
    this.el.innerHTML = '';
    for (const m of this.party) if (m.hp <= 0 && result !== 'lose') m.hp = 1; // KO'd members get back up after the fight
    return result;
  }
}

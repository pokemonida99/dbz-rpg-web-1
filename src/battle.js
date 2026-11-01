// Card battle, following the original rules (docs/battle-rules.md), with a portrait touch UI:
// the stage (original battle sprites) on top, fighters and a 6-card hand below.
import { view, img, audio, sleep, rand } from './core.js';
import { faceCanvas } from './main.js';
import { levelUp } from './party.js';

export const SCHOOL = ['必', '龜', '神', '界', '魔', '惑'];
const HAND = 6;
const EXP_RATE = 8; // the original's "経験値倍率" option; at 1 the opening chapter takes ~100 fights (Raditz needs about Lv6-7)
const BG = 'Graphics/Pictures/Z1_戦闘_背景.PNG'; // 640×100 strips; strip 0 = Z1 field
const BEAM = 'Graphics/Pictures/Z1_戦闘_必殺技_エネルギー波.PNG';
const BEAM_GREEN = 'Graphics/Pictures/Z1_戦闘_必殺技_エネルギー波(緑).PNG';
const BEAM_ENEMY = 'Graphics/Pictures/Z1_戦闘_必殺技_エネルギー波_敵_中.PNG';
const FRAME = 96;
const POSE = { idle: 0, special: 1, melee: 3, hurt: 5 };

export function battleImages(world) {
  const sheets = new Set([BG, BEAM, BEAM_GREEN, BEAM_ENEMY]);
  for (const a of Object.values(world.actors)) sheets.add(a.sprite);
  for (const e of Object.values(world.enemies)) sheets.add(e.sprite);
  return [...sheets];
}

// ---------- cards ----------
// Early Z1 player cards: school 必/龜/神/魔 at 1/4 each; enemies also roll 惑 (1/5 each).
export function newCard() { return { a: rand(8), g: rand(8), s: [0, 1, 2, 4][rand(4)] }; }
const enemyCard = () => ({ a: rand(8), g: rand(8), s: [0, 1, 2, 4, 5][rand(5)] });
export function newHand() { return Array.from({ length: HAND }, newCard); }
const stars = (v) => (v === 7 ? 'Z' : String(v + 1));

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
    this.foes = enemyIds.map((id, i) => {
      const e = world.enemies[id];
      return { ...e, id, slot: i, hp: e.maxhp };
    });
    this.fx = []; // transient drawings: beams, numbers, flashes
    this.poses = new Map(); // fighter -> {pose, until, dx}
    this.turn = 0;
    this.el = document.getElementById('battle');
    this.stageH = 0;
  }

  // ---------- stage drawing ----------
  layout() {
    const H = Math.min(view.h * 0.5, 420);
    this.stageH = H;
    const top = Math.max(56, view.h * 0.06);
    const n = this.foes.length;
    this.foes.forEach((f, i) => { f.px = view.w - 70 - (i % 2) * 34; f.py = top + ((H - top - 20) * (i + 0.5)) / Math.max(n, 2); });
    this.party.forEach((m, i) => { m.px = 70 + (i % 2) * 20; m.py = top + 30 + ((H - top - 60) * (i + 0.5)) / Math.max(this.party.length, 2); });
  }

  update() {}

  draw() {
    const c = view.begin();
    const H = this.stageH || view.h * 0.5;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1340'); g.addColorStop(0.6, '#2a2f6a'); g.addColorStop(1, '#3a2a1a');
    c.fillStyle = g;
    c.fillRect(0, 0, view.w, view.h);
    const bg = img(BG);
    if (bg.ok) {
      const y = H * 0.55 - 50;
      for (let x = -((performance.now() / 40) % 640); x < view.w; x += 640) c.drawImage(bg.im, 0, 0, 640, 100, x, y, 640, 100);
    }
    c.fillStyle = '#000';
    c.fillRect(0, H, view.w, view.h - H);
    const now = performance.now();
    const drawFighter = (o, sheet, flip) => {
      if (o.hp <= 0 && !o.koShown) return;
      const im = img(sheet);
      if (!im.ok) return;
      const p = this.poses.get(o);
      const pose = p && p.until > now ? p.pose : (o.hp <= 0 ? POSE.hurt : POSE.idle);
      const dx = p && p.until > now ? p.dx || 0 : 0;
      const shake = p && p.until > now && p.shake ? (Math.random() - 0.5) * 6 : 0;
      c.save();
      c.globalAlpha = o.hp <= 0 ? 0.35 : 1;
      c.translate(Math.round(o.px + dx + shake), Math.round(o.py));
      if (flip) c.scale(-1, 1);
      c.drawImage(im.im, 0, pose * FRAME, FRAME, FRAME, -FRAME / 2, -FRAME / 2, FRAME, FRAME);
      c.restore();
    };
    for (const m of this.party) drawFighter(m, this.world.actors[m.id].sprite, false);
    for (const f of this.foes) if (f.hp > 0) drawFighter(f, f.sprite, f.faceRight);
    // effects
    this.fx = this.fx.filter((e) => e.until > now);
    for (const e of this.fx) {
      const t = 1 - (e.until - now) / e.dur;
      if (e.type === 'beam') {
        const im = img(e.sheet);
        if (!im.ok) continue;
        const len = (e.x2 - e.x1) * Math.min(1, t * 1.6);
        c.save();
        c.translate(e.x1, e.y1);
        c.rotate(Math.atan2(e.y2 - e.y1, e.x2 - e.x1));
        const L = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) * Math.min(1, t * 1.6);
        c.drawImage(im.im, 0, 0, im.im.width, im.im.height, 0, -im.im.height / 2, Math.max(1, L), im.im.height);
        c.restore();
        void len;
      } else if (e.type === 'num') {
        c.font = 'bold 22px system-ui, sans-serif';
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
        c.fillRect(0, 0, view.w, H);
      }
    }
  }

  // ---------- UI (DOM) ----------
  renderUi() {
    const el = this.el;
    el.innerHTML = `<div class="stage" style="height:${this.stageH * view.cssPerPx}px"></div><div class="lower">
      <div class="blog"></div><div class="fighters"></div><div class="hand"></div><div class="bactions"></div></div>`;
    el.querySelector('.stage').addEventListener('pointerdown', (e) => this.onStageTap(e));
    this.logEl = el.querySelector('.blog');
    this.renderFighters();
    this.renderHand();
  }

  log(html) { this.logEl.innerHTML = html; }

  renderFighters() {
    const box = this.el.querySelector('.fighters');
    box.innerHTML = '';
    this.party.forEach((m, i) => {
      const d = document.createElement('div');
      const plan = this.plans && this.plans[i];
      d.className = `fighter${this.cur === i ? ' on' : ''}${plan ? ' done' : ''}${m.hp <= 0 ? ' ko' : ''}`;
      d.appendChild(faceCanvas(m.face));
      const what = plan ? (plan.skill ? plan.skill.name : '普通攻擊') : (m.hp <= 0 ? '倒下' : '');
      d.insertAdjacentHTML('beforeend', `<div class="info"><div class="nm">${m.name} <span class="nums">Lv${m.level}・${SCHOOL[m.school]}</span></div>
        <div class="bar"><i style="width:${Math.max(0, (100 * m.hp) / m.maxhp)}%"></i></div>
        <div class="bar ki"><i style="width:${(100 * m.ki) / m.maxki}%"></i></div>
        <div class="nums">HP ${Math.max(0, m.hp)}/${m.maxhp}　KI ${m.ki}/${m.maxki}</div>
        <div class="pick">${what}</div></div>`);
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
      b.className = `card${used ? ' used' : ''}${m && card.s === m.school ? ' match' : ''}`;
      b.innerHTML = `<span class="stars atk">攻${stars(card.a)}</span><span class="school">${SCHOOL[card.s]}</span>
        <span class="tag">${special ? '可用必殺技' : '普通攻擊'}</span><span class="stars def">防${stars(card.g)}</span>`;
      b.disabled = used || !m;
      b.onclick = () => this.onCard(k);
      box.appendChild(b);
    });
  }

  renderActions(list) {
    const box = this.el.querySelector('.bactions');
    box.innerHTML = '';
    for (const [label, fn, opts] of list) {
      const b = document.createElement('button');
      b.className = `btn${opts && opts.ghost ? ' ghost' : ''}`;
      b.textContent = label;
      if (opts && opts.disabled) b.disabled = true;
      b.onclick = fn;
      box.appendChild(b);
    }
  }

  // ---------- planning phase ----------
  able(m) { return m.hp > 0; }

  startPlanning() {
    this.plans = this.party.map(() => null);
    this.cur = this.party.findIndex((m) => this.able(m));
    this.renderFighters();
    this.renderHand();
    this.promptCard();
  }

  promptCard() {
    const m = this.party[this.cur];
    this.log(`<b>${m.name}</b>：選一張卡。和自己流派「${SCHOOL[m.school]}」相同或「必」的卡可以用必殺技。`);
    this.renderActions([
      ['自動', () => this.autoPlan()],
      ...(this.boss ? [] : [['逃跑', () => this.finish('escape'), { ghost: true }]]),
    ]);
  }

  onFighterTap(i) {
    if (!this.plans || !this.able(this.party[i]) || this.resolving) return;
    this.plans[i] = null;
    this.cur = i;
    this.renderFighters();
    this.renderHand();
    this.promptCard();
  }

  onCard(k) {
    const m = this.party[this.cur];
    const card = this.hand[k];
    const special = (card.s === m.school || card.s === 0) && m.skills.length;
    this.pending = { card: k };
    if (!special) { this.pending.skill = null; this.chooseTarget(); return; }
    this.log(`<b>${m.name}</b>：要用哪一招？`);
    const skills = m.skills.map((sid) => this.world.skills[sid]);
    this.renderActions([
      ...skills.map((s) => [`${s.name}（KI ${s.ki}）`, () => { this.pending.skill = s; this.chooseTarget(); }, { disabled: m.ki < s.ki }]),
      ['普通攻擊', () => { this.pending.skill = null; this.chooseTarget(); }, { ghost: true }],
    ]);
    // three skills + normal attack don't fit one row on a phone
    this.el.querySelector('.bactions').style.flexWrap = 'wrap';
    for (const b of this.el.querySelectorAll('.bactions .btn')) b.style.flex = '1 1 40%';
  }

  chooseTarget() {
    const alive = this.foes.filter((f) => f.hp > 0);
    if (alive.length === 1 || (this.pending.skill && this.pending.skill.all)) { this.commit(alive[0].slot); return; }
    this.log('點選上方要攻擊的敵人。');
    this.renderActions([['自動選目標', () => this.commit(alive.reduce((a, b) => (b.hp < a.hp ? b : a)).slot), { ghost: true }]]);
    this.picking = true;
  }

  onStageTap(e) {
    if (!this.picking) return;
    const r = view.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / view.cssPerPx, y = (e.clientY - r.top) / view.cssPerPx;
    let best = null, bd = 1e9;
    for (const f of this.foes) {
      if (f.hp <= 0) continue;
      const d = Math.hypot(f.px - x, f.py - y);
      if (d < bd) { bd = d; best = f; }
    }
    if (best && bd < 80) this.commit(best.slot);
  }

  commit(target) {
    this.picking = false;
    this.plans[this.cur] = { ...this.pending, target };
    this.pending = null;
    const next = this.party.findIndex((m, i) => this.able(m) && !this.plans[i]);
    if (next < 0) { this.renderFighters(); this.resolveTurn(); return; }
    this.cur = next;
    this.renderFighters();
    this.renderHand();
    this.promptCard();
  }

  // Auto mode (§2.3): own-school card first, then 必; a random affordable skill; target the weakest enemy.
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
    this.renderFighters();
    this.resolveTurn();
  }

  // ---------- resolution (§2.4) ----------
  async resolveTurn() {
    this.resolving = true;
    this.cur = null;
    this.renderHand();
    this.renderActions([]);
    const order = [];
    this.party.forEach((m, i) => { const p = this.plans[i]; if (p) order.push({ kind: 'p', i, key: this.hand[p.card].a + this.hand[p.card].g, r: Math.random() }); });
    for (const f of this.foes) if (f.hp > 0) { f.card = enemyCard(); order.push({ kind: 'e', f, key: f.card.a + f.card.g, r: Math.random() }); }
    order.sort((a, b) => b.key - a.key || a.r - b.r);
    for (const o of order) {
      if (this.over()) break;
      if (o.kind === 'p') await this.playerAct(o.i);
      else for (let n = 0; n < o.f.eva && o.f.hp > 0 && !this.over(); n++) { if (n > 0) o.f.card = enemyCard(); await this.enemyAct(o.f); }
    }
    // used cards are regenerated in place (§1.6)
    for (const p of this.plans) if (p) this.hand[p.card] = newCard();
    this.turn++;
    if (this.over()) return;
    // recovery from the second turn on (§4.6)
    for (const m of this.party) {
      if (m.hp > 0) { m.hp = Math.min(m.maxhp, m.hp + Math.ceil((m.maxhp * 3) / 100)); m.ki = Math.min(m.maxki, m.ki + Math.ceil((m.maxki * 2.5) / 100)); }
      else { m.hp = Math.min(m.maxhp, m.hp + Math.ceil((m.maxhp * 7.5) / 100)); }
    }
    this.resolving = false;
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
    const name = skill ? skill.name : '攻擊';
    this.log(`<b>${m.name}</b> 的${name}！${card.s === m.school ? '（流派一致）' : ''}`);
    if (skill) {
      m.ki -= skill.ki;
      this.renderFighters();
      this.pose(m, POSE.special, 900);
      audio.se('Z1 エネルギー波', 70);
      await sleep(250);
      for (const t of targets) this.fx.push({ type: 'beam', sheet: m.beam, x1: m.px + 30, y1: m.py - 10, x2: t.px - 20, y2: t.py - 10, until: performance.now() + 650, dur: 650 });
      await sleep(550);
    } else {
      this.pose(m, POSE.melee, 600, { dx: 40 });
      audio.se('Z1 打撃', 70);
      await sleep(300);
    }
    for (const t of targets) {
      const fc = t.card || enemyCard();
      const d = playerDamage(m, skill && { power: skill.power, noDamage: skill.noDamage }, card, t, fc);
      this.hit(t, d, '#ffe36b');
    }
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
    const d = enemyDamage(f, skill && { power: skill.power }, card, m, guard);
    this.hit(m, d, '#ff7b6b');
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
  async finish(result) {
    this.done(result);
  }

  async rewards() {
    const exp = this.foes.reduce((s, f) => s + f.exp, 0) * EXP_RATE;
    const zeni = this.foes.reduce((s, f) => s + f.gold, 0);
    this.game.state.zeni += zeni;
    const lines = [`戰鬥勝利！　獲得經驗值 <b>${exp}</b>`];
    for (const m of this.party) {
      m.exp += exp;
      const n = levelUp(this.world, m);
      if (n) lines.push(`<b>${m.name}</b> 升到 Lv${m.level}！`);
    }
    this.log(lines.join('<br>'));
    if (lines.length > 1) audio.se('Z1 レベルアップ', 80);
    this.renderFighters();
    await new Promise((res) => this.renderActions([['繼續', res]]));
  }

  async run() {
    this.el.hidden = false;
    this.layout();
    this.renderUi();
    audio.playBgm(this.boss ? 'Z1 戦闘ボス1(中ボス)' : 'Z1 戦闘1');
    this.log(`${this.foes.map((f) => f.name).join('、')} 出現了！`);
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
    this.el.hidden = true;
    this.el.innerHTML = '';
    for (const m of this.party) if (m.hp <= 0 && result !== 'lose') m.hp = 1; // KO'd members get back up after the fight
    return result;
  }
}

// S-combos (Sコンボ / 組合技), following the original (101_Scene_Db_Battle.rb, 102_Scene_Db_Battle_Anime.rb,
// 105_Scene_Db_Scombo_Menu.rb). Data: data/combos.json from the original _scombo.csv (tools/build_combo.py).
//
// How a combo goes off (chk_scombo_flag_num / chk_scombo_flag, 102:1394, 102:87754-88070): when a party member's
// turn comes and they picked a special move, every combo listing that move is checked — first the ones not learned
// yet, then the learned ones. A combo fires when every participant
//   is in the party, played a card this turn, is alive, has not acted yet and did not forbid combos ("Y"),
//   picked exactly the combo's move for them, with a card of their OWN school (a 必 card does not count),
//   whose attack / guard values reach the combo's minimum, and has used that move at least the combo's
//   number of times (proficiency, $cha_skill_level).
// Then all participants pay their moves' KI and are done for the turn, the combo's use count goes up, and each
// participant's move counts one use. A combo that fires for the first time is learned (new_flag → get_flag) and
// announced after the scene: 「恭喜！ ○○ 能使用了！」 (chk_new_scombo, 101:3988).
//
// Game state: state.skillLv = { skillId: uses } ($cha_skill_level, shared with src/partymenu.js tally(): moves and
// combos alike), state.combos = [learned ids]. The battle 菜單's 組合技 entry opens the list (menuEntries.combo).
import { VERSION, view, img, audio, rand } from './core.js?v=20261101-1924';
import { SW } from './anime.js?v=20261101-1924';
import { ComboDuel } from './combo-anime.js?v=20261101-1924';
import { menuEntries } from './partymenu.js?v=20261101-1924';

let DATA = { combos: [], moves: {}, sync: {} };
export const comboData = fetch(`data/combos.json?v=${VERSION}`).then((r) => r.json()).then((d) => (DATA = d)).catch(() => DATA);

const LEVEL_MAX = 99999, DMG_LEVEL_MAX = 999, ATK_RATIO = 5; // 139_Public.rb
const HINT_ADD = 25; // $all_scombo_skill_level_add_num: the list reveals an unknown combo's partners past this many extra uses
const FACES = 'Graphics/Pictures/Z1_顔味方.PNG', CARDS = 'Graphics/Pictures/カード関係.PNG';

const levels = (state) => state.skillLv || (state.skillLv = {});
const learned = (state) => state.combos || (state.combos = []);
const uses = (state, id) => levels(state)[id] || 0;

// one more use of a move by a combo member (set_skill_level, 102:88126 — a normal action counts through tally() in
// Battle.playerAct, which a combo skips): moves listed together in message2 keep the same count
export function noteSkillUse(state, id) {
  const L = levels(state);
  L[id] = Math.min(LEVEL_MAX, (L[id] || 0) + 1);
  const sync = DATA.sync[id];
  if (sync) { const top = Math.max(...sync.map((s) => L[s] || 0)); for (const s of sync) L[s] = top; }
}

// a move's power with proficiency (docs/battle-rules.md §3.3, 102:15995): +1 % per use up to double, then +1 per 5
export function skillPower(state, id, base) {
  const n = uses(state, id);
  if (!n) return base;
  let p = Math.ceil((base * (100 + Math.min(n, DMG_LEVEL_MAX))) / 100);
  if (n > DMG_LEVEL_MAX + 1) p = Math.ceil(p + (n - DMG_LEVEL_MAX) / ATK_RATIO);
  return p;
}

// combos a character takes part in (get_scombo_list, 010_Share.rb:328)
export const combosOf = (actorId) => DATA.combos.filter((c) => c.cha.includes(actorId));

// ---------- the check (chk_scombo_flag, 102:87887) ----------
function fits(b, combo, newOnly) {
  const state = b.game.state;
  if (learned(state).includes(combo.id) === newOnly) return null;
  const who = [];
  for (let x = 0; x < combo.cha.length; x++) {
    const i = b.party.findIndex((m) => m.id === combo.cha[x]);
    if (i < 0) return null; // not in the party
    const m = b.party[i], p = b.plans[i];
    if (!p || m.hp <= 0 || b.acted.has(i) || p.solo) return null;
    if (!p.skill || p.skill.id !== combo.tec[x]) return null;
    const cd = b.hand[p.card];
    if (cd.s !== m.school || cd.a < combo.atk[x] || cd.g < combo.grd[x]) return null;
    if (uses(state, combo.tec[x]) < combo.uses[x]) return null;
    who.push(i);
  }
  return who;
}

function findCombo(b, i) {
  const p = b.plans[i];
  if (!p || !p.skill) return null;
  const list = DATA.combos.filter((c) => c.tec.includes(p.skill.id) && c.cha.includes(b.party[i].id));
  for (const newOnly of [true, false]) {
    for (const c of list) { const who = fits(b, c, newOnly); if (who) return { combo: c, who }; }
  }
  return null;
}

// ---------- damage (102:16062-16190; docs/battle-rules.md §4.2) ----------
function comboDamage(b, combo, who, foe, foeCard) {
  const state = b.game.state, n = who.length;
  let P = combo.power, A = 0, star = 0;
  who.forEach((i, x) => {
    const m = b.party[i];
    P += skillPower(state, combo.tec[x], DATA.moves[combo.tec[x]].power);
    A += m.atk + m.level;
    star = Math.max(star, b.hand[b.plans[i].card].a);
  });
  const k = n > 2 ? 1 + (n - 2) * 0.2 : 1;
  P += Math.ceil(uses(state, combo.id) * (n / 2) * k);
  star = Math.min(7, star + (n - 2));
  let d = Math.floor(((A + P) * 8 * (star + 7 + rand(2) + 1)) / Math.floor((foe.def * (foeCard.g + 7)) / 3));
  d = Math.floor(d * 1.3); // every participant's card is their own school; combos never miss (element 29)
  return d;
}

// ---------- battle hook: called when party member i's turn comes; true = a combo was played instead ----------
export async function tryCombo(b, i) {
  const found = findCombo(b, i);
  if (!found) return false;
  const { combo, who } = found;
  const state = b.game.state, lead = b.party[i];
  let foe = b.foes[b.plans[i].target];
  if (!foe || foe.hp <= 0) foe = b.foes.filter((f) => f.hp > 0).reduce((a, c) => (c.hp < a.hp ? c : a));
  foe.card = foe.card || { a: rand(8), g: rand(8), s: 0 };
  // everyone pays KI and is done for the turn (102:944-985)
  for (const j of who) { const m = b.party[j]; m.ki = Math.max(0, m.ki - b.plans[j].skill.ki); b.acted.add(j); }
  const dmg = comboDamage(b, combo, who, foe, foe.card);
  levels(state)[combo.id] = Math.min(LEVEL_MAX, uses(state, combo.id) + 1);
  who.forEach((j, x) => noteSkillUse(state, combo.tec[combo.cha.indexOf(b.party[j].id)]));
  if (!learned(state).includes(combo.id)) (b.newCombos || (b.newCombos = [])).push(combo.id);
  // the film
  const crew = {};
  for (const j of who) { const a = b.world.actors[b.party[j].id]; crew[b.party[j].id] = { normal: a.sprite, special: a.special }; }
  b.duel = { m: lead, mc: b.hand[b.plans[i].card], f: foe, fc: foe.card };
  b.say(`${who.map((j) => b.party[j].name).join('＋')}的組合技！`, `「${combo.name}」`);
  const before = foe.hp;
  b.anim = new ComboDuel({
    party: crew[lead.id], foe: { normal: foe.portrait, special: foe.sprite }, combo: combo.id, crew, lead: lead.id,
    damage: dmg, margin: Math.max(0, (SW - view.w) / 2),
    onHit: () => { foe.hp = Math.max(0, foe.hp - dmg); },
  });
  await b.anim.finished;
  b.anim = null;
  if (before > 0 && foe.hp <= 0) { const d = (state.defeats = state.defeats || {}); d[lead.id] = Math.min(99999, (d[lead.id] || 0) + 1); }
  return true;
}

// after the scene: newly learned combos (chk_new_scombo, 101:3988)
export async function announceCombos(b) {
  const ids = b.newCombos || [];
  b.newCombos = [];
  for (const id of ids) {
    const state = b.game.state;
    if (learned(state).includes(id)) continue;
    learned(state).push(id);
    audio.se('ZG 技取得', 80);
    b.say('恭喜！', `「${DATA.combos.find((c) => c.id === id).name}」能使用了！`);
    await new Promise((res) => { b.cont = res; });
    b.cont = null;
  }
}

// ---------- the move window: learned combos for this move, and the "Y" switch ----------
// get_tec_scombo (101:5412): for the pending card, each learned combo with this move and whether it can go off:
// 'ok' (everyone set), 'wait' (a partner has not chosen yet), 'no' (a partner's card or move does not fit),
// 'card' (this card is too weak or not of the own school)
export function comboHints(b, i, skillId) {
  const m = b.party[i], state = b.game.state, out = [];
  const cd = b.pending && b.hand[b.pending.card];
  for (const c of DATA.combos) {
    const x = c.cha.indexOf(m.id);
    if (x < 0 || c.tec[x] !== skillId || !learned(state).includes(c.id)) continue;
    let st = 'ok';
    if (!c.cha.every((id) => b.party.some((p) => p.id === id))) continue; // partner not in the party (result 4)
    if (!cd || cd.s !== m.school || cd.a < c.atk[x] || cd.g < c.grd[x]) st = 'card';
    else {
      for (let y = 0; y < c.cha.length && st !== 'no'; y++) {
        if (y === x) continue;
        const j = b.party.findIndex((p) => p.id === c.cha[y]), q = b.plans[j], pm = b.party[j];
        if (pm.hp <= 0 || (q && q.solo)) st = 'no';
        else if (!q) st = 'wait';
        else {
          const qc = b.hand[q.card];
          if (!q.skill || q.skill.id !== c.tec[y] || qc.s !== pm.school || qc.a < c.atk[y] || qc.g < c.grd[y]) st = 'no';
        }
      }
    }
    // this member's card: attack stars (the ball, 1-7 / Z) and guard (the numeral) it needs at least
    const need = [c.atk[x] && `攻★${c.atk[x] + 1}以上`, c.grd[x] && `防${c.grd[x] + 1}以上`, '自己流派'].filter(Boolean).join('・');
    out.push({ name: c.name, st, need });
  }
  return out;
}
export const HINT_TEXT = { ok: '可發動', wait: '等隊友', no: '條件不符', card: '卡不符' };

// whether the move window should offer the 組合技 on/off switch for this member
export const hasCombos = (b, i) => learned(b.game.state).some((id) => DATA.combos.find((c) => c.id === id)?.cha.includes(b.party[i].id));

// ---------- the 組合技 list (Scene_Db_Scombo_Menu, 105) as an overlay ----------
// For each party member, the combos they take part in. A learned combo shows its name and use count, every
// participant's face, school, the card it needs and their move with the uses it needs. An unknown one is
// 「？？？」 and shows only this member's move and how many more uses it needs ("剩餘"), unless every
// participant knows their move and has used it 25 times more than needed, in which case the partners show too.
export function openComboList(b, start = 0) {
  return new Promise((done) => {
    const state = b.game.state;
    const box = document.createElement('div');
    box.className = 'combo-list';
    injectCss();
    let cur = Math.max(0, start);
    const faceCv = (id, size = 48) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; cv.style.width = cv.style.height = size + 'px';
      const f = img(FACES); if (f.ok) cv.getContext('2d').drawImage(f.im, 0, 64 * (id - 3), 64, 64, 0, 0, 64, 64);
      return cv;
    };
    const cardCv = (a, g, school, back) => {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96;
      const s = img(CARDS), c = cv.getContext('2d');
      if (s.ok) {
        if (back) c.drawImage(s.im, 64, 96, 64, 96, 0, 0, 64, 96);
        else {
          c.drawImage(s.im, 0, 96, 64, 96, 0, 0, 64, 96);
          c.drawImage(s.im, 32 * a, 0, 32, 32, 2, 2, 32, 32);
          c.drawImage(s.im, 32 * g, 32, 32, 32, 30, 62, 32, 32);
          c.drawImage(s.im, 32 * school, 64, 32, 32, 16, 32, 32, 32);
        }
      }
      return cv;
    };
    const render = () => {
      box.innerHTML = '';
      const panel = document.createElement('div'); panel.className = 'win cl-panel';
      const head = document.createElement('div'); head.className = 'cl-head';
      head.innerHTML = '<b>組合技</b>';
      const close = document.createElement('button'); close.className = 'cl-close'; close.textContent = '關閉';
      close.onclick = () => { box.remove(); done(); };
      head.appendChild(close);
      panel.appendChild(head);
      const tabs = document.createElement('div'); tabs.className = 'cl-tabs';
      b.party.forEach((m, k) => {
        const t = document.createElement('button'); t.className = 'cl-tab' + (k === cur ? ' on' : '');
        t.appendChild(faceCv(m.id, 40)); t.append(m.name);
        t.onclick = () => { cur = k; render(); };
        tabs.appendChild(t);
      });
      panel.appendChild(tabs);
      const list = document.createElement('div'); list.className = 'cl-list';
      const me = b.party[cur];
      const mine = combosOf(me.id);
      if (!mine.length) list.innerHTML = '<p class="cl-none">這個角色沒有組合技。</p>';
      for (const c of mine) {
        const known = learned(state).includes(c.id);
        const near = c.cha.every((id, y) => b.world.actors[id].skills.includes(c.tec[y]) && uses(state, c.tec[y]) >= c.uses[y] + HINT_ADD);
        const item = document.createElement('div'); item.className = 'cl-item';
        item.innerHTML = `<div class="cl-name">${known ? c.name : '？？？'}${known ? `<span class="cl-lv">使用 ${uses(state, c.id)} 次</span>` : ''}</div>`;
        c.cha.forEach((id, y) => {
          const row = document.createElement('div'); row.className = 'cl-row';
          const show = known || near || id === me.id;
          const actor = b.world.actors[id];
          if (show) row.appendChild(faceCv(id)); else { const blank = document.createElement('div'); blank.className = 'cl-blank'; row.appendChild(blank); }
          if (known) row.appendChild(cardCv(c.atk[y], c.grd[y], actor.school));
          else row.appendChild(cardCv(0, 0, 0, true));
          const info = document.createElement('div'); info.className = 'cl-info';
          const left = Math.max(0, c.uses[y] - uses(state, c.tec[y]));
          if (known) info.innerHTML = `${actor.name}<br>${DATA.moves[c.tec[y]].name}（${c.uses[y]}）`;
          else if (show) info.innerHTML = `${actor.name}<br>${id === me.id || near ? DATA.moves[c.tec[y]].name : '？？？'}<br><small>剩餘 ${id === me.id || near ? left : '？'}</small>`;
          else info.innerHTML = '？？？';
          row.appendChild(info);
          item.appendChild(row);
        });
        list.appendChild(item);
      }
      panel.appendChild(list);
      const foot = document.createElement('p'); foot.className = 'cl-foot';
      foot.textContent = '每個人用自己流派的卡、選指定的必殺技，卡的攻擊／防禦星數夠，就會一起發動。';
      panel.appendChild(foot);
      box.appendChild(panel);
    };
    render();
    (b.el || document.body).appendChild(box);
    box.addEventListener('pointerdown', (e) => e.stopPropagation());
  });
}

function injectCss() {
  if (document.getElementById('combo-css')) return;
  const st = document.createElement('style');
  st.id = 'combo-css';
  st.textContent = `
.combo-list { position: absolute; inset: 0; z-index: 48; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center;
  padding: calc(var(--safe-t) + 12px) 10px calc(var(--safe-b) + 12px); }
.combo-list .cl-panel { width: 100%; max-height: 100%; display: flex; flex-direction: column; }
.combo-list .cl-head { display: flex; justify-content: space-between; align-items: center; font-size: 20px; color: var(--rust); margin-bottom: 6px; }
.combo-list button { background: #fff0d0; border: 2px solid #7a5230; color: var(--ink); padding: 4px 10px; font-size: 16px; }
.combo-list .cl-tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; }
.combo-list .cl-tab { display: flex; align-items: center; gap: 4px; padding: 2px 8px 2px 2px; white-space: nowrap; }
.combo-list .cl-tab.on { background: var(--gold); border-color: var(--rust); }
.combo-list canvas { image-rendering: pixelated; display: block; }
.combo-list .cl-list { overflow-y: auto; flex: 1; min-height: 0; touch-action: pan-y; }
.combo-list .cl-item { border-top: 2px dashed #b08860; padding: 6px 0; }
.combo-list .cl-name { font-size: 18px; color: var(--rust); margin-bottom: 4px; }
.combo-list .cl-lv { font-size: 13px; color: #7a5230; margin-left: 10px; }
.combo-list .cl-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
.combo-list .cl-row canvas:nth-child(2) { width: 40px; height: 60px; }
.combo-list .cl-blank { width: 48px; height: 48px; background: #000; }
.combo-list .cl-info { font-size: 15px; line-height: 1.3; }
.combo-list .cl-none, .combo-list .cl-foot { font-size: 13px; color: #7a5230; margin: 6px 0 0; }
`;
  document.head.appendChild(st);
}

// the battle 菜單 → 組合技 (src/partymenu.js); from the field menu there is no battle, so it lists the current party
menuEntries.combo = ({ game, battle }) => openComboList(battle || { game, world: game.world, party: game.state.party, el: document.getElementById('app') }, 0);

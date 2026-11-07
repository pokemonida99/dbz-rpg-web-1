// S-combos (Sコンボ / 組合技), following the original (101_Scene_Db_Battle.rb, 102_Scene_Db_Battle_Anime.rb,
// 105_Scene_Db_Scombo_Menu.rb). Data: data/combos.json from the original _scombo.csv (tools/build_combo.py).
//
// How a combo goes off (chk_scombo_flag_num / chk_scombo_flag, 102:1394, 102:87754-88070): when a party member's
// turn comes and they picked a special move, every combo listing that move is checked — first the ones not learned
// yet, then the learned ones (each row of data/combos.json on its own, in the original's order; a row must be open:
// see open() below). A combo fires when every participant
//   is in the party, played a card this turn, is alive, not stopped, has not acted yet and did not forbid combos ("Y"),
//   has not learned 局外人 / 旁若無人, is the Great Ape exactly when the row wants it (742 強襲サイヤ人),
//   picked exactly the combo's move for them, with a card of their OWN school (a 必 card does not count),
//   whose attack / guard values reach the combo's minimum, and has used that move at least the combo's
//   number of times (proficiency, $cha_skill_level).
// Then all participants pay their moves' KI and are done for the turn, the combo's use count goes up, and each
// participant's move counts one use. A combo that fires for the first time is learned (new_flag → get_flag) and
// announced after the scene: 「恭喜！ ○○ 能使用了！」 (chk_new_scombo, 101:3988).
//
// Game state: state.skillLv = { skillId: uses } ($cha_skill_level, shared with src/partymenu.js tally(): moves and
// combos alike), state.combos = [learned ids]. The battle 菜單's 組合技 entry opens the list (menuEntries.combo).
//
// ひらめき (閃き必殺技, data/tecspark.json → world.tecspark, tools/build_tecspark.py) is checked here too, just before the
// combos (chk_tecspark, all.rb 53813): see spark() below.
import { VERSION, view, img, audio, rand, sleep, fetchRetry } from './core.js?v=20261108-0039';
import { SW, moveFilm, addMoves } from './anime.js?v=20261108-0039';
import { ComboDuel } from './combo-anime.js?v=20261108-0039';
import { menuEntries } from './partymenu.js?v=20261108-0039';
import * as growth from './growth.js?v=20261108-0039';
import * as items from './items.js?v=20261108-0039';
import * as battle from './battle.js?v=20261108-0039'; // battleHooks (used at run time only: battle.js imports this file)

let DATA = { combos: [], moves: {}, sync: {} };
export const comboData = fetchRetry(`data/combos.json?v=${VERSION}`).then((r) => r.json()).then((d) => (DATA = d)).catch(() => DATA);

const LEVEL_MAX = 99999, DMG_LEVEL_MAX = 999, ATK_RATIO = 5; // 139_Public.rb
const HINT_ADD = 25; // $all_scombo_skill_level_add_num: the list reveals an unknown combo's partners past this many extra uses
const FACES = 'Graphics/Pictures/Z1_顔味方.PNG', CARDS = 'Graphics/Pictures/カード関係.PNG';

// rules other modules add (src/cards_a.js): less(b, m) → [a, g] stars a member's card may lack (阿吽の呼吸),
// blocked(b, m) → true when the member can't join a combo (the Great Ape)
export const comboHooks = {};
const lessA = (b, m) => (comboHooks.less ? comboHooks.less(b, m)[0] : 0);
const lessG = (b, m) => (comboHooks.less ? comboHooks.less(b, m)[1] : 0);
const blocked = (b, m) => !!(comboHooks.blocked && comboHooks.blocked(b, m));
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

// ---------- which rows are open (get_scombo_list, all.rb 8821; chk_scombo_flag 140311) ----------
// A row needs its switch (c.sw) or variable (c.v) condition and variable 40 ≥ its scenario progress (c.era). The
// switches are turned on by the story pages (world.json) and, as the original does on loading a save, by CE34 後から
// 追加設定 / CE205 (DATA.catchUp, tools/build_combo.py), run here before each check.
const CMP = [(a, b) => a === b, (a, b) => a >= b, (a, b) => a <= b, (a, b) => a > b, (a, b) => a < b, (a, b) => a !== b];
// learn_skill state: whether the actor knows the move (in the party, on the bench, or the form not in use)
function knows(state, id, skill) {
  const m = state.party.find((x) => x.id === id) || (state.bench || {})[id] || (state.forms || {})[id];
  return !!m && (m.skills || []).includes(skill);
}
function test(state, c) {
  const sw = state.sw || {}, v = state.var || {};
  if (c[0] === 'sw') return !!sw[c[1]] === c[2];
  if (c[0] === 'var') return CMP[c[3]](v[c[1]] || 0, c[2]);
  if (c[0] === 'any') return c[1].some((n) => sw[n]);
  if (c[0] === 'knows') return knows(state, c[1], c[2]);
  return false;
}
function run(state, nodes) {
  for (const n of nodes) {
    if (n.if) run(state, test(state, n.if) ? n.then : n.else);
    else if (n.sw) for (let k = n.sw[0]; k <= n.sw[1]; k++) state.sw[k] = n.sw[2];
  }
}
export function catchUp(state) { state.sw = state.sw || {}; run(state, DATA.catchUp || []); }
const open = (state, c) => {
  const v = state.var || {};
  if ((c.era || 0) > (v[40] || 0)) return false;
  if (c.sw && !(state.sw || {})[c.sw]) return false;
  if (c.v && !CMP[c.v[1]](v[c.v[0]] || 0, c.v[2])) return false;
  return true;
};
// the combo list (Scene_Db_Scombo_Menu, all.rb 144060): a row with a Super Saiyan column shows only while that actor
// is in the party (put 0) or is not (put 1), and a Great Ape row only while the member is the ape
const shown = (b, c, m) => (!c.ss || b.party.some((p) => p.id === c.ss[0]) === !c.ss[1]) && !!c.ape === blocked(b, m);
// combos a character takes part in (get_scombo_list, 010_Share.rb:328)
export const combosOf = (actorId, state) => DATA.combos.filter((c) => c.cha.includes(actorId) && (!state || open(state, c)));
// 局外人 (アウトサイダー) and 旁若無人: a member who has learned one never joins a combo (all.rb 140440-140458)
const LONERS = [430, 644, 645, 646, 647, 648, 649, 650, 651, 476, 477, 478, 479, 480, 481, 482, 483, 484];
const loner = (b, m) => LONERS.some((id) => growth.has(b.world, m, id)) || growth.ext('noCombo', false, b, m); // + 剛腕 (src/skills_d.js, all.rb 140449)

// ---------- the check (chk_scombo_flag, 102:87887) ----------
function fits(b, combo, newOnly) {
  const state = b.game.state;
  if (learned(state).includes(combo.id) === newOnly) return null;
  if (newOnly && b.practice) return null; // 戦闘練習: no new combos (all.rb 53703)
  const who = [];
  for (let x = 0; x < combo.cha.length; x++) {
    const i = b.party.findIndex((m) => m.id === combo.cha[x]);
    if (i < 0) return null; // not in the party
    const m = b.party[i], p = b.plans[i];
    if (!p || m.hp <= 0 || m.stop > 0 || b.acted.has(i) || p.solo || loner(b, m)) return null;
    if (!p.skill || p.skill.id !== combo.tec[x]) return null;
    const cd = b.hand[p.card];
    // a Great Ape row (強襲サイヤ人) wants every participant as the ape, the others none (oozaru_put, 140476)
    if (blocked(b, m) !== !!combo.ape || cd.s !== m.school || cd.a < combo.atk[x] - lessA(b, m) || cd.g < combo.grd[x] - lessG(b, m)) return null;
    if (uses(state, combo.tec[x]) < combo.uses[x]) return null;
    who.push(i);
  }
  return who;
}

function findCombo(b, i) {
  const p = b.plans[i];
  if (!p || !p.skill) return null;
  catchUp(b.game.state);
  const list = DATA.combos.filter((c) => c.tec.includes(p.skill.id) && c.cha.includes(b.party[i].id) && open(b.game.state, c));
  for (const newOnly of [true, false]) {
    for (const c of list) { const who = fits(b, c, newOnly); if (who) return { combo: c, who }; }
  }
  return null;
}

// ---------- damage (102:16062-16190; docs/battle-rules.md §4.2) ----------
// Then as damage_calculation does for any special move (all.rb 68616-68707): ×1.3 when any participant is a Super
// Saiyan (class 9, $tmp_btl_ani_scombo_cha), ×1.3 for the school match (the lead's card is of his own school), the
// passive skills (set_damage_add with the combo, element 33: the skills of every participant together, the lead's card
// for the card checks — withSkills), 敵必ず回避 (switch 18) and variable 81. Combos never miss (element 29).
function comboDamage(b, combo, who, lead, foe, foeCard) {
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
  star = Math.min(7, star + (n - 2) + growth.ext('combo', 0, b, who)); // (連攜: src/cards_b.js)
  let d = Math.floor(((A + P) * 8 * (star + 7 + rand(2) + 1)) / Math.floor((foe.def * (foeCard.g + 7)) / 3));
  if (who.some((i) => b.party[i].school === 8)) d = Math.floor(d * 1.3); // a participant of class 9 (68622-68641)
  d = Math.floor(d * 1.3); // the school match (68655)
  const skill = { id: combo.id, name: combo.name, power: combo.power, combo: true };
  const card = b.hand[b.plans[b.party.indexOf(lead)].card];
  d = withSkills(b, lead, who.map((i) => b.party[i]), () => growth.dealt(b, lead, skill, d, { card, foe, foeCard })); // (68664)
  const hooks = battle.battleHooks;
  if (hooks.dealt) d = hooks.dealt(b, lead, skill, d);
  if (b.foesEvade) return -1; // switch 18 敵必ず回避 (68695)
  return b.dmgRate ? Math.trunc(d * b.dmgRate) : d; // variable 81 (68701)
}
// set_damage_add for a combo (all.rb 14376-14410): temp_cha_skill is every participant's 固有技能 and learned 追加技能;
// the lead (cha_no) is still the one compared with the others (激怒) and whose card counts (様子見, 見下す). Here the
// lead carries all of them while fn runs.
function withSkills(b, lead, members, fn) {
  const keep = { typ: growth.ensure(lead).typ, add: lead.add, sp: lead.sp };
  const typ = [], add = [], sp = { ...lead.sp };
  for (const m of members) {
    growth.ensure(m);
    typ.push(...m.typ);
    for (const id of m.add) if (id && growth.has(b.world, m, id)) { add.push(id); sp[id] = Math.max(sp[id] || 0, m.sp[id] || 0); }
  }
  Object.assign(lead, { typ, add, sp });
  try { return fn(); } finally { Object.assign(lead, keep); }
}

// ---------- ひらめき (閃き必殺技: chk_tecspark / chk_tecspark_flag, all.rb 53656-53790) ----------
// When a member's turn comes with a special move, before the combos, each world.tecspark row for that move is tried
// in order. A row goes off when its member (cha) is in the party, played a card, is up, not stopped and has not acted,
// picked that move with a card of their own school (a 必 card does not count) whose stars reach the row's minimum, and
// has used the move skill_level_num times; the row's switch / variable condition holds, variable 40 ≥ its scenario
// progress, it is not learned yet (switch get_flag), rand(100)+1 ≤ its rate, and it is not the 戦闘練習. Then the
// member whose turn it is uses the new move instead, without KI (@new_tecspark_flag, 54590), and the combos are checked
// with it. After the scene the move is learned (new_flag → get_flag, learn_skill) with 「恭喜！」 (chk_new_tecspark 50383).
const freeKi = new WeakSet(); // the member whose move this action is a new ひらめき one
growth.extra.push({ ki: (v, m) => (freeKi.has(m) ? 0 : v) }); // (get_mp_cost: growth.kiCost)
const sparks = (b) => b.world.tecspark || [];

function sparkOk(b, r) {
  const s = b.game.state, sw = s.sw || {}, v = s.var || {};
  const j = b.party.findIndex((m) => m.id === r.cha);
  const m = b.party[j], p = b.plans[j];
  if (!p) return false; // not in the party / played no card
  if (r.chk) {
    const [kind, no, how, val] = r.chk;
    if (kind === 1 && !sw[no]) return false;
    if (kind === 2) { const x = v[no] || 0, k = Number(val); if (how === 0 ? x !== k : how === 1 ? x < k : x > k) return false; }
  }
  if (r.era > (v[40] || 0)) return false;
  if (rand(100) + 1 > r.rate) return false;
  if (sw[r.get]) return false;
  if (m.ko || m.hp <= 0 || m.stop > 0 || b.acted.has(j)) return false;
  if (!p.skill || p.skill.id !== r.tec) return false;
  const cd = b.hand[p.card];
  if (cd.s !== m.school || cd.a < r.atk || cd.g < r.grd) return false;
  if (uses(s, r.tec) < r.uses) return false;
  return !b.practice; // (switch 1305)
}

function spark(b, i) {
  const p = b.plans[i];
  if (!p || !p.skill) return;
  for (const r of sparks(b)) {
    if (r.tec !== p.skill.id || !sparkOk(b, r)) continue;
    const sk = b.world.skills[r.no];
    if (!sk) return;
    if (!moveFilm(r.no) && moveFilm(r.tec)) addMoves({ [r.no]: moveFilm(r.tec) }); // (a move without a film of its own yet)
    p.skill = sk;
    freeKi.add(b.party[i]);
    const sw = b.game.state.sw;
    if (!sw[r.get]) sw[r.new] = true; // chk_new_get_tecspark
    return;
  }
}

// learn_skill: the actor's move list, in the party, on the bench, or the form not in use (state.forms)
function learnMove(b, id, no) {
  const s = b.game.state;
  const m = b.party.find((x) => x.id === id) || s.party.find((x) => x.id === id) || (s.bench || {})[id];
  if (!m && !b.world.actors[id]) return;
  s.forms = s.forms || {};
  const list = m ? m.skills : (s.forms[id] = s.forms[id] || { skills: [...b.world.actors[id].skills] }).skills;
  if (!list.includes(no)) list.push(no);
}

// ---------- battle hook: called when party member i's turn comes; true = a combo was played instead ----------
export async function tryCombo(b, i) {
  for (const m of b.party) freeKi.delete(m);
  spark(b, i);
  const found = findCombo(b, i);
  if (!found) return false;
  const { combo, who } = found;
  const state = b.game.state, lead = b.party[i], hooks = battle.battleHooks;
  let foe = b.foes[b.plans[i].target];
  if (!foe || foe.hp <= 0) foe = b.foes.filter((f) => f.hp > 0).reduce((a, c) => (c.hp < a.hp ? c : a));
  foe.card = foe.card || { a: rand(8), g: rand(8), s: 0 };
  // everyone pays the KI of their move (get_mp_cost: passive skills, the 必殺技 card; none while practising) and is
  // done for the turn (all.rb 53389-53405)
  freeKi.delete(lead);
  for (const j of who) {
    const m = b.party[j], sk = b.plans[j].skill;
    let ki = growth.kiCost(b.world, m, sk);
    if (hooks.kiCost) ki = hooks.kiCost(b, m, sk, ki, b.hand[b.plans[j].card]);
    items.payKi(m, b.practice ? 0 : ki);
    m.ki = Math.max(0, m.ki);
    b.acted.add(j);
  }
  const dmg = comboDamage(b, combo, who, lead, foe, foe.card);
  if (!b.practice) { // (戦闘練習: no use counts, all.rb 53385)
    levels(state)[combo.id] = Math.min(LEVEL_MAX, uses(state, combo.id) + 1);
    who.forEach((j, x) => noteSkillUse(state, combo.tec[combo.cha.indexOf(b.party[j].id)]));
  }
  if (!learned(state).includes(combo.id)) (b.newCombos || (b.newCombos = [])).push(combo.id);
  // the film
  const crew = {};
  for (const j of who) { // (m.sprite: Z2 battle suits, the Great Ape — as src/battle.js play())
    const m = b.party[j], a = b.world.actors[m.id];
    crew[m.id] = { normal: m.sprite || a.sprite, special: m.special || a.special, size: m.spriteSize };
  }
  b.duel = { m: lead, mc: b.hand[b.plans[i].card], f: foe, fc: foe.card };
  b.say(`${who.map((j) => b.party[j].name).join('＋')}的組合技！`, `「${combo.name}」`);
  const before = foe.hp, hit = Math.max(0, dmg);
  b.anim = new ComboDuel({
    party: crew[lead.id], foe: { normal: foe.portrait, special: foe.sprite, size: foe.size }, combo: combo.id, crew, lead: lead.id,
    tecs: Object.fromEntries(combo.cha.map((id, x) => [id, combo.tec[x]])),
    damage: hit, margin: Math.max(0, (SW - view.w) / 2),
    onHit: () => { if (b.practice) b.practice.dmg = (b.practice.dmg || 0) + hit; else foe.hp = Math.max(0, foe.hp - hit); },
  });
  await b.anim.finished;
  b.anim = null;
  if (before > 0 && foe.hp <= 0) { const d = (state.defeats = state.defeats || {}); d[lead.id] = Math.min(99999, (d[lead.id] || 0) + 1); }
  if (dmg >= 0) {
    // get_attack_hit_skill with the combo (all.rb 17127-17577): each participant's hit skills, on their own card
    for (const j of who) {
      const m = b.party[j];
      growth.onHit(b, m, foe, b.hand[b.plans[j].card]); // かなしばり, the skill cards' hit effects
      if (hooks.hit) hooks.hit(b, m, foe, dmg); // いたずら …
    }
    if (combo.stun) foe.stop = (foe.stop || 0) + 2; // element 12, +1 more for the school match (chk_battle_damage 68866)
    if (combo.tail && foe.hp > 0 && foe.apeOf) { // 尻尾切る: the Great Ape is himself again (element 25, 68895)
      b.transform(foe, foe.apeOf);
      b.say(`${foe.name} 的尾巴被切斷，變回原狀了！`);
      await sleep(900);
    }
  }
  return true;
}

// after the scene: moves learned by ひらめき (chk_new_tecspark, 101:47800 / all.rb 50383 — every row whose new_flag is
// on, so one left from a lost battle is learned at the next), then newly learned combos (chk_new_scombo, 101:3988)
export async function announceCombos(b) {
  for (const m of b.party) freeKi.delete(m);
  const state = b.game.state, sw = state.sw || {};
  for (const r of sparks(b)) {
    if (!sw[r.new]) continue;
    sw[r.get] = true;
    sw[r.new] = false;
    learnMove(b, r.cha, r.no);
    audio.se('ZG 技取得', 80);
    b.say('恭喜！', `「${(b.world.skills[r.no] || {}).name}」能使用了！`);
    await new Promise((res) => { b.cont = res; });
    b.cont = null;
  }
  const ids = b.newCombos || [];
  b.newCombos = [];
  for (const id of ids) {
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
  const cd = b.pending && b.hand[b.pending.card], seen = new Set();
  catchUp(state);
  for (const c of DATA.combos) {
    const x = c.cha.indexOf(m.id);
    if (x < 0 || c.tec[x] !== skillId || !learned(state).includes(c.id) || !open(state, c) || seen.has(c.id)) continue;
    let st = 'ok';
    if (!c.cha.every((id) => b.party.some((p) => p.id === id))) continue; // partner not in the party (result 4)
    seen.add(c.id);
    if (!cd || blocked(b, m) !== !!c.ape || loner(b, m) || cd.s !== m.school || cd.a < c.atk[x] - lessA(b, m) || cd.g < c.grd[x] - lessG(b, m)) st = 'card';
    else {
      for (let y = 0; y < c.cha.length && st !== 'no'; y++) {
        if (y === x) continue;
        const j = b.party.findIndex((p) => p.id === c.cha[y]), q = b.plans[j], pm = b.party[j];
        if (pm.hp <= 0 || (q && q.solo)) st = 'no';
        else if (!q) st = 'wait';
        else {
          const qc = b.hand[q.card];
          if (!q.skill || q.skill.id !== c.tec[y] || blocked(b, pm) !== !!c.ape || loner(b, pm) || qc.s !== pm.school || qc.a < c.atk[y] - lessA(b, pm) || qc.g < c.grd[y] - lessG(b, pm)) st = 'no';
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
      const me = b.party[cur], ids = new Set();
      catchUp(state);
      // one row per combo (the first open one shown for the forms in the party, like the original's list)
      const mine = combosOf(me.id, state).filter((c) => shown(b, c, me) && !ids.has(c.id) && ids.add(c.id));
      if (!mine.length) list.innerHTML = '<p class="cl-none">這個角色沒有組合技。</p>';
      for (const c of mine) {
        const known = learned(state).includes(c.id);
        const near = c.cha.every((id, y) => (knows(state, id, c.tec[y]) || b.world.actors[id].skills.includes(c.tec[y])) && uses(state, c.tec[y]) >= c.uses[y] + HINT_ADD);
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

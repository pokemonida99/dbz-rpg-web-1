// The Super Saiyan (超サイヤ人), as the original does it (all.rb 12764-13030 on_off_super_saiyazin): the character
// is swapped for another actor — 悟空 3 ⇄ 14, 悟飯 5 ⇄ 18, 貝吉塔 12 ⇄ 19, 特南克斯 17 ⇄ 20, 未來悟飯 25 ⇄ 26,
// 巴達克 16 ⇄ 32 — of class 9 (超 school, school id 8), keeping the EXP (and so the level), the stats where the
// base form's are higher, HP / KI, the skills (passive skills: サイヤ人の血 becomes サイヤ人魂), the move counts.
// Class 9 in battle (docs/battle-rules.md §4.1/§4.3): ×1.3 damage dealt, ×0.85 taken (src/battle.js).
// state.ss[no] = on (the original's $super_saiyazin_flag); the inactive form waits in state.forms[actor id].
// Used by the story (CE46 / CE66 → on, the Z2 pages' on_super_saiyazin 1), by the 超サイヤ人變身 move (skill 29,
// element 26: in battle, src/battle.js), and syncSuperSaiyan (CE155 / CE157: put every form as a list says, e.g.
// when moving between the 時之間 and the story).
import { applyLevel } from './party.js?v=20261102-1935';

// no → [base actor, Super Saiyan actor, 固有技能 slot of サイヤ人の血 (null: none)]
export const FORMS = { 1: [3, 14, 0], 2: [5, 18, 1], 3: [12, 19, 1], 4: [17, 20, 1], 5: [18, 18, null], 6: [25, 26, 1], 7: [16, 32, null] };
const BLOOD = [2, 3, 4, 89, 90, 91, 92, 93, 94]; // サイヤ人の血 (each level)
const SOUL = [5, 6, 7, 95, 96, 97, 98, 99, 100]; // サイヤ人魂

// the form number of an actor (base or Super Saiyan), or 0
export const formOf = (id) => Number(Object.keys(FORMS).find((no) => FORMS[no][0] === id || FORMS[no][1] === id) || 0);
export const isSuper = (s, no) => !!(s.ss && s.ss[no]);

// run after every on_off_super_saiyazin, changed or not: f(world, s, no, on, was) — was = state.ss before it
// (CE64 超悟飯の技設定 at all.rb 13031 and the 作戰 move of 超2 悟飯, variables 450 / 451: src/grw.js)
export const changeHooks = [];
// on_off_super_saiyazin(no, on ? 0 : 1); returns the member now in the party (or bench), or null if nothing changed
export function superSaiyan(world, s, no, on = true) {
  const was = { ...(s.ss || {}) };
  const to = swapForm(world, s, no, on);
  for (const f of changeHooks) f(world, s, no, on, was);
  return to;
}
function swapForm(world, s, no, on) {
  const [base, sup, slot] = FORMS[no];
  s.ss = s.ss || {};
  if (!!s.ss[no] === on || !world.actors[sup]) return null;
  s.ss[no] = on;
  const [fromId, toId] = on ? [base, sup] : [sup, base];
  s.forms = s.forms || {};
  s.bench = s.bench || {};
  const where = s.party.findIndex((m) => m.id === fromId);
  const from = where >= 0 ? s.party[where] : s.bench[fromId];
  if (!from) return null;
  const a = world.actors[toId];
  const kept = s.forms[toId]; // that form's own move list, as it was left
  const to = { ...JSON.parse(JSON.stringify(from)), id: toId, name: a.name, face: a.face, school: a.school };
  to.skills = kept ? kept.skills : [...a.skills];
  delete s.forms[toId];
  s.forms[fromId] = { skills: from.skills };
  // the level comes with the EXP; a stat lower than the other form's is raised to it (the original's guard)
  const prev = { maxhp: from.maxhp, maxki: from.maxki, atk: from.atk, def: from.def, agi: from.agi, spi: from.spi };
  applyLevel(world, to);
  for (const k of Object.keys(prev)) if (to[k] < prev[k]) to[k] = prev[k];
  to.hp = Math.min(to.maxhp, from.hp);
  to.ki = Math.min(to.maxki, from.ki);
  // サイヤ人の血 ⇄ サイヤ人魂 in the 固有 slot (not for 超2 悟飯 / 巴達克)
  if (slot != null && to.typ) {
    const [a1, a2] = on ? [BLOOD, SOUL] : [SOUL, BLOOD];
    const k = a1.indexOf(to.typ[slot]);
    if (k >= 0) {
      const id = a2[k];
      to.typ[slot] = id;
      to.got = to.got || {};
      to.set = to.set || {};
      to.sp = to.sp || {};
      to.got[id] = to.set[id] = true;
      to.sp[id] = (world.growth && world.growth.skills[id] && world.growth.skills[id].sp) || 0;
    }
  }
  if (where >= 0) s.party[where] = to;
  else { delete s.bench[fromId]; s.bench[toId] = to; }
  if (s.var && s.var[42] === fromId) s.var[42] = toId; // the one leading on the map
  return to;
}

// CE155 / CE157: every form as `want` says ({no: on}), whatever it is now
export function syncSuperSaiyan(world, s, want) {
  for (const [no, on] of Object.entries(want)) superSaiyan(world, s, Number(no), !!on);
}

// 作戰「變身狀態」of an actor ($cha_tactics[3][id]): 0 保持, 1 不保持 — by default 1 (set_cha_tactics_nil_to_zero all.rb 14330)
export const ssOff = (s, id) => { const t = s.tactics && s.tactics[id]; return !t || t.ssOff == null || t.ssOff === 1; };
// a form's own way back (5: src/z4f.js — 超2 悟飯 is the same actor), instead of superSaiyan(…, false)
export const offHooks = {}; // no → (world, s) => …
export const onHooks = {}; // the same for on (5: src/z4f.js)

// off_super_saiyazin_all (all.rb 12766), after a battle: back to normal those whose 作戰 says 不保持, each checked on the
// actor the original looks at (the base form; 18 for 5 — the 作戰 screen keeps both forms the same); 5 before 2
export function afterBattle(world, s) {
  for (const no of [1, 5, 2, 3, 4, 6, 7]) {
    if (!(s.ss && s.ss[no]) || !ssOff(s, FORMS[no][0])) continue;
    if (offHooks[no]) offHooks[no](world, s);
    else superSaiyan(world, s, no, false);
  }
}

// the 超サイヤ人變身 move used in battle (all.rb 53426): who used it → its form number
export function moveTransforms(m) {
  const no = formOf(m.id);
  return no && FORMS[no][0] === m.id ? no : 0;
}

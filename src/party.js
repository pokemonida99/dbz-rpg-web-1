// Party members built from the original actor data (world.actors).

// the original's "経験値倍率" option, for battles and training alike; at 1 the opening chapter takes ~100 fights
// (Raditz needs about Lv6-7)
export const EXP_RATE = 8;
// src/laps.js: someone joining during a later round starts from what carried over
let memberHook = null;
export const setMemberHook = (f) => { memberHook = f; };
// src/laps_rules.js: the level cap of the round (final_level): 199 on a first play
let capHook = null;
export const setLevelCap = (f) => { capHook = f; };
export const levelCap = () => (capHook ? capHook() : 99);

export const makeMember = (world, id) => (memberHook ? memberHook(world, baseMember(world, id)) : baseMember(world, id));

// the actor as the database has it (a new game's party: whatever round the state in memory is on doesn't count)
export function baseMember(world, id) {
  const a = world.actors[id];
  const m = { id, name: a.name, face: a.face, school: a.school, level: a.level, exp: 0, skills: [...a.skills], maxLv: a.level };
  applyLevel(world, m);
  m.hp = m.maxhp;
  m.ki = m.maxki;
  return m;
}

export function applyLevel(world, m) {
  const t = world.actors[m.id].params;
  // KGC_LimitBreak base_parameter (all.rb 188043): from Lv 100 on, Lv 99's value + (Lv 99's − Lv 98's) × (level − 99)
  const p = m.level < 100 ? t[m.level] : t[99].map((v, k) => v + (v - t[98][k]) * (m.level - 99));
  [m.maxhp, m.maxki, m.atk, m.def, m.spi, m.agi] = p;
  const z = m.plus; // stats raised with ZP (src/growth.js) stay on top of the level's
  if (z) { m.maxhp += z.hp; m.maxki += z.ki; m.atk += z.atk; m.def += z.def; m.agi += z.agi; }
  // the limits of KGC_LimitBreak (all.rb 187589)
  m.maxhp = Math.min(m.maxhp, 99999); m.maxki = Math.min(m.maxki, 99999);
  m.atk = Math.min(m.atk, 999999); m.def = Math.min(m.def, 999999); m.spi = Math.min(m.spi, 999999); m.agi = Math.min(m.agi, 999999);
}

// returns the number of levels gained
export function levelUp(world, m) {
  let n = 0;
  const curve = world.actors[m.id].exp;
  while (m.level < levelCap() && m.exp >= curve[m.level + 1]) {
    m.level++;
    n++;
    if (m.maxLv == null) m.maxLv = m.level - 1;
    if (m.level > m.maxLv) { m.zp = (m.zp || 0) + 50; m.maxLv = m.level; } // ZP for a new top level ($levelup_add_zp)
    const oldMax = [m.maxhp, m.maxki];
    applyLevel(world, m);
    m.hp += m.maxhp - oldMax[0];
    m.ki += m.maxki - oldMax[1];
  }
  return n;
}

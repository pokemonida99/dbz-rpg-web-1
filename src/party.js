// Party members built from the original actor data (world.actors).

// the original's "経験値倍率" option, for battles and training alike; at 1 the opening chapter takes ~100 fights
// (Raditz needs about Lv6-7)
export const EXP_RATE = 8;
export function makeMember(world, id) {
  const a = world.actors[id];
  const m = { id, name: a.name, face: a.face, school: a.school, level: a.level, exp: 0, skills: [...a.skills], maxLv: a.level };
  applyLevel(world, m);
  m.hp = m.maxhp;
  m.ki = m.maxki;
  return m;
}

export function applyLevel(world, m) {
  const p = world.actors[m.id].params[Math.min(m.level, 99)];
  [m.maxhp, m.maxki, m.atk, m.def, m.spi, m.agi] = p;
  const z = m.plus; // stats raised with ZP (src/growth.js) stay on top of the level's
  if (z) { m.maxhp += z.hp; m.maxki += z.ki; m.atk += z.atk; m.def += z.def; m.agi += z.agi; }
}

// returns the number of levels gained
export function levelUp(world, m) {
  let n = 0;
  const curve = world.actors[m.id].exp;
  while (m.level < 99 && m.exp >= curve[m.level + 1]) {
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

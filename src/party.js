// Party members built from the original actor data (world.actors).
export function makeMember(world, id) {
  const a = world.actors[id];
  const m = { id, name: a.name, face: a.face, school: a.school, level: a.level, exp: 0, skills: [...a.skills] };
  applyLevel(world, m);
  m.hp = m.maxhp;
  m.ki = m.maxki;
  return m;
}

export function applyLevel(world, m) {
  const p = world.actors[m.id].params[Math.min(m.level, 99)];
  [m.maxhp, m.maxki, m.atk, m.def, m.spi, m.agi] = p;
}

// returns the number of levels gained
export function levelUp(world, m) {
  let n = 0;
  const curve = world.actors[m.id].exp;
  while (m.level < 99 && m.exp >= curve[m.level + 1]) {
    m.level++;
    n++;
    const oldMax = [m.maxhp, m.maxki];
    applyLevel(world, m);
    m.hp += m.maxhp - oldMax[0];
    m.ki += m.maxki - oldMax[1];
  }
  return n;
}

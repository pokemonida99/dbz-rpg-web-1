// ?dev=cmb…: testing the S-combos' passive / hit skills, the tail cut and ひらめき (docs/batch2-plan.md cmb; the rules
// are in src/combo.js). A Z4-end save (variable 40 = 2) in the 時之間 hall like ?dev=tr, with 克林・雅木茶・餃子・天津飯・
// 比克・悟空 at Lv 40, every combo of theirs learned and their moves used often enough for the combos and the ひらめき:
//   cmb       the hall
//   cmbape    a fight with 達列斯(大猿) (222, turns back into 達列斯(強) 233 when his tail is cut: 操氣氣圓斬 707)
//   cmbspark  a fight with 甜菜人 ×3 (克林 64 → 65 氣圓烈斬, 雅木茶 73 → 74 / 71 → 75, 餃子 92 → 94 / 91 → 95 may flash)
import { registerZ3, heal, party } from './z3.js?v=20261108-0603';
import { applyLevel } from './party.js?v=20261108-0603';
import { superSaiyan } from './supersaiyan.js?v=20261108-0603';
import { comboData, catchUp } from './combo.js?v=20261108-0603';

const SW = [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568]; // (?dev=tr)
const USES = { 64: 250, 73: 250, 71: 300, 92: 200, 91: 200, 62: 50, 72: 50, 81: 40, 82: 40, 83: 60, 5: 60, 2: 20, 36: 20, 35: 50 };

registerZ3('cmb', {
  dev(game, step) {
    if (!/^cmb/.test(step) || /^cmbx/.test(step)) return false; // (?dev=cmbx…: below)
    const s = game.state = game.newState();
    s.var[40] = 2;
    for (const n of SW) s.sw[n] = true;
    s.flags.z3 = 'done';
    party(game, [6, 7, 9, 8, 4, 3]);
    for (const m of s.party) { m.level = 40; m.exp = game.world.actors[m.id].exp[40]; applyLevel(game.world, m); heal(m); }
    s.skillLv = { ...USES };
    s.combos = [705, 706, 707, 709, 710, 711];
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    const foes = { cmbape: [222], cmbspark: [1, 1, 1] }[step];
    if (foes) {
      setTimeout(() => game.startBattle(foes, step === 'cmbape', { loseOk: true }), 300);
      if (step === 'cmbape') { // he is the Great Ape from the start here (FOE_FORMS 644 would set it when he changes)
        const ape = () => { const b = game.scene; if (b && b.constructor.name === 'Battle' && b.foes[0]) b.foes[0].apeOf = 233; else setTimeout(ape, 100); };
        setTimeout(ape, 400);
      }
    }
    return true;
  },
});

// ?dev=cmbx…: the S-combos of Z2 and later (docs/batch3-plan.md cmb2). Every combo switch is on (the rows whose
// switch the original never turns on too, so they can be tried), variable 40 as the era, Lv 60, every move used
// 999 times (and known), no combo learned yet; a fight with 甜菜人 ×3 (high HP) starts. In the console, __cmbx(id) deals the
// cards and picks the moves of the first open row of combo `id` whose members are all in the party (the others sit
// the turn out), then runs the turn.
//   cmbxz2  悟空・比克・悟飯・克林・貝吉塔・雅木茶 (variable 40 = 1)
//   cmbxz3  特蘭克斯・貝吉塔・比克・悟飯・克林・18 號・17 號 (2)
//   cmbxz4  超悟空・超悟飯・超貝吉塔・超特蘭克斯・比克・16 號 (2: the Super Saiyan rows)
//   cmbxzg  巴達克・托馬・賽莉帕・托特波・潘布金・龜仙人 (2: the crew can turn into the Great Ape — 強襲賽亞人)
//   cmbxkame 悟空・悟飯・克林・雅木茶・未來悟飯・龜仙人 (2: the ダブルかめはめ波 786-790, a film of their own)
//   cmbxsw  like cmbxz3 but only the switches the story has set by the end of Z4 (?dev=tr's) and CE34's catch-up
const ERAS = {
  cmbxz2: [1, [3, 4, 5, 6, 12, 7]],
  cmbxz3: [2, [17, 12, 4, 5, 6, 21, 22]],
  cmbxz4: [2, [3, 5, 12, 17, 4, 23], [1, 2, 3, 4]],
  cmbxzg: [2, [16, 27, 28, 29, 30, 24]],
  cmbxkame: [2, [3, 5, 6, 7, 25, 24]],
  cmbxsw: [2, [17, 12, 4, 5, 6, 21, 22]],
};
registerZ3('cmbx', {
  dev(game, step) {
    const era = ERAS[step];
    if (!era) return false;
    const s = game.state = game.newState(), w = game.world;
    s.var[40] = era[0];
    s.flags.z3 = 'done';
    comboData.then((d) => {
      if (step === 'cmbxsw') { for (const n of SW) s.sw[n] = true; catchUp(s); } else for (const c of d.combos) if (c.sw) s.sw[c.sw] = true;
      party(game, era[1]);
      for (const no of era[2] || []) superSaiyan(w, s, no, true);
      for (const m of s.party) { m.level = 60; m.exp = w.actors[m.id].exp[60]; applyLevel(w, m); heal(m); }
      for (const m of s.party) { // (and every move their combos use, learned)
        for (const c of d.combos) c.cha.forEach((a, x) => { if (a === m.id && !m.skills.includes(c.tec[x])) m.skills.push(c.tec[x]); });
        m.skills.sort((x, y) => x - y);
      }
      s.skillLv = {};
      for (const c of d.combos) for (const t of c.tec) s.skillLv[t] = 999;
      s.combos = [];
      s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
      game.startField();
      setTimeout(() => game.startBattle([1, 1, 1], false, { loseOk: true }), 300);
      const tough = () => { const b = game.scene; if (b && b.constructor.name === 'Battle' && b.foes[0]) for (const f of b.foes) f.hp = f.maxhp = 999999; else setTimeout(tough, 100); };
      setTimeout(tough, 400);
      window.__cmbx = (id) => fire(game, d, id);
    });
    return true;
  },
});
function fire(game, d, id) {
  const b = game.scene, w = game.world;
  if (!b || b.phase !== 'plan') return 'not planning';
  const row = d.combos.find((c) => c.id === id && c.cha.every((a) => b.party.some((m) => m.id === a)) && (!c.sw || game.state.sw[c.sw]) && (c.era || 0) <= game.state.var[40]);
  if (!row) return 'no row with this party';
  b.plans = b.party.map(() => null);
  let k = 0;
  row.cha.forEach((a, x) => {
    const i = b.party.findIndex((m) => m.id === a), m = b.party[i];
    b.hand[k] = { a: Math.min(7, row.atk[x] + 1), g: Math.min(7, row.grd[x] + 1), s: m.school };
    b.plans[i] = { card: k++, skill: w.skills[row.tec[x]], target: 0 };
  });
  b.resolveTurn();
  return row.name;
}

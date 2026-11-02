// ?dev=cmb…: testing the S-combos' passive / hit skills, the tail cut and ひらめき (docs/batch2-plan.md cmb; the rules
// are in src/combo.js). A Z4-end save (variable 40 = 2) in the 時之間 hall like ?dev=tr, with 克林・雅木茶・餃子・天津飯・
// 比克・悟空 at Lv 40, every combo of theirs learned and their moves used often enough for the combos and the ひらめき:
//   cmb       the hall
//   cmbape    a fight with 達列斯(大猿) (222, turns back into 達列斯(強) 233 when his tail is cut: 操氣氣圓斬 707)
//   cmbspark  a fight with 甜菜人 ×3 (克林 64 → 65 氣圓烈斬, 雅木茶 73 → 74 / 71 → 75, 餃子 92 → 94 / 91 → 95 may flash)
import { registerZ3, heal, party } from './z3.js?v=20261102-2129';
import { applyLevel } from './party.js?v=20261102-2129';

const SW = [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568]; // (?dev=tr)
const USES = { 64: 250, 73: 250, 71: 300, 92: 200, 91: 200, 62: 50, 72: 50, 81: 40, 82: 40, 83: 60, 5: 60, 2: 20, 36: 20, 35: 50 };

registerZ3('cmb', {
  dev(game, step) {
    if (!/^cmb/.test(step)) return false;
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

// ?dev=cos…: 換裝 and the DB3 staff roll (docs/costume.md), for testing (&timer in a hidden pane):
//   cos        Z3 era, the 時之間 hall (map 48, on foot): 悟空・悟飯・特蘭克斯・18號・龜仙人・巴達克 with every set of clothes open
//              (the party screen's 換裝 cycles them)
//   cosfly     the same, flying over map 33; cosgoku3 / cosgohan1 / cosgohan445 / costrunks1 start in those clothes (the leader's
//              sprite: map 33 event 5)
//   coshtc     map 44 (精神と時の部屋, on foot) with 悟空 and 悟飯 in their battle suits
//   cosbattle  a battle with 悟空 (さらにボロボロ → ボロボロ), 悟飯 (battle suit), 特蘭克斯 (tank top), 18號, 龜仙人 in their clothes
//   cosz2      Z2 era (map 18 on foot): 悟飯・克林 (switch 439: the battle suits), 龜仙人, 超悟空 (variable 171 = 2)
//   cosz1      Z1 era: 龜仙人 and his everyday clothes
//   cosed      the DB3 staff roll (every group of enemies shown); a tap on the last card plays 遇見阿拉蕾
import { registerZ3, party, heal, play } from './z3.js?v=20261108-1004';
import { applyLevel } from './party.js?v=20261108-1004';
import { db3ed } from './db3ed.js?v=20261108-1004';
import { toast } from './core.js?v=20261108-1004';

const OPEN = [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568];
function base(game, era, ids, lv = 40) {
  const s = game.state = game.newState();
  s.var[40] = era;
  if (era === 2) { s.var[43] = 999; for (const n of OPEN) s.sw[n] = true; s.flags.z3 = 'done'; }
  party(game, ids);
  for (const m of s.party) { m.level = Math.max(m.level, lv); m.exp = game.world.actors[m.id].exp[m.level]; applyLevel(game.world, m); heal(m); }
  s.var[42] = s.party[0].id;
  return s;
}
const at = (s, map, x, y) => { s.map = map; s.x = x * 32 + 16; s.y = y * 32 + 16; };
// every set of clothes the Z3 era has (the switches that open them: set_dress), none worn yet
function z3Clothes(s) {
  for (const n of [381, 443, 444, 110, 570, 580, 581, 594, 441, 442, 440]) s.sw[n] = true;
  s.sw[360] = false;
}
const START = { cosgoku3: { 171: 3 }, cosgohan1: { 172: 1 }, cosgohan445: { 172: 2 }, costrunks1: { 173: 1 } };

registerZ3('cos', {
  dev(game, step) {
    if (!/^cos(fly|goku3|gohan1|gohan445|trunks1|htc|battle|z2|z1|ed)?$/.test(step)) return false;
    if (step === 'cosz1') {
      const s = base(game, 0, [24, 3, 5, 4], 10);
      at(s, '1', 20, 20);
      game.startField();
      return true;
    }
    if (step === 'cosz2') {
      const s = base(game, 1, [5, 6, 24, 3], 25);
      s.sw[439] = true;
      s.var[171] = 2; // (Z2: the Super Saiyan in the さらにボロボロ 道着)
      at(s, '18', 20, 20);
      game.startField();
      return true;
    }
    const lead = { cosgohan1: 5, cosgohan445: 5, costrunks1: 17 }[step];
    const ids = [3, 5, 17, 21, 24, 16];
    if (lead) ids.unshift(...ids.splice(ids.indexOf(lead), 1));
    const s = base(game, 2, ids);
    z3Clothes(s);
    if (step === 'cosgohan445') { s.sw[445] = true; s.sw[447] = true; }
    Object.assign(s.var, START[step] || {});
    if (step === 'cos' || step === 'cosed') at(s, '48', 44, 29);
    else if (step === 'coshtc') { party(game, [3, 5]); s.var[42] = 3; Object.assign(s.var, { 171: 3, 172: 1 }); at(s, '44', 9, 8); }
    else if (step === 'cosbattle') { Object.assign(s.var, { 171: 2, 172: 1, 173: 2, 177: 1 }); s.sw[363] = true; at(s, '48', 44, 29); }
    else { at(s, '33', 30, 30); s.sw[19] = true; }
    game.startField();
    if (step === 'cosbattle') setTimeout(() => game.startBattle([101, 102], true, { loseOk: true }), 300);
    if (step === 'cosed') {
      for (const n of [119, 431, 570, 459, 599, 586]) s.sw[n] = true;
      setTimeout(async () => {
        game.busy = true;
        const hit = await db3ed(game);
        toast(hit ? '按到了阿拉蕾' : '沒有按到阿拉蕾');
        if (hit) { s.var[41] = 90911; await play(game, 'zgbj:90911'); }
        game.busy = false;
      }, 300);
    }
    return true;
  },
});

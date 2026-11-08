// Passive skills and growth, the gaps of docs/batch2-plan.md grw (the rest of it is in src/growth.js, src/cards_a.js,
// src/cards_b.js, src/z4f.js), after the original:
//   CE64 悟飯超2技切り替え (run at the end of every on_off_super_saiyazin, all.rb 13031): actor 18's moves —
//     超2 (switch 5 on): 59 / 54 / 53 forgotten, then スーパーかめはめ波 54 once switch 593 (or 861), else 激烈魔閃光 53;
//     not 超2: 54 forgotten, 超サイヤ人変身 59 with switch 458 (or 861 from variable 40 = 2), 53 learned
//   variables 450 / 451 (all.rb 12808-12845): the 作戰 move of 超1 / 超2 悟飯 ($cha_tactics[7][18]) kept apart
//   超2 悟飯's 超サイヤ人変身 59 in battle → on_super_saiyazin 5 (all.rb 53436: $partyc 18 → schanum 5)
//   地球育ちのサイヤ人 678-686 at an S-combo (all.rb 68354-68396): every participant's card + the highest fx.ah stars of
//     the levels the participants have learned (the combo star: src/combo.js ext('combo'))
import { audio, sleep } from './core.js?v=20261108-2252';
import * as growth from './growth.js?v=20261108-2252';
import * as battle from './battle.js?v=20261108-2252';
import { changeHooks, onHooks, superSaiyan } from './supersaiyan.js?v=20261108-2252';
import { tally } from './partymenu.js?v=20261108-2252';
import { registerZ3, party, member, heal } from './z3.js?v=20261108-2252';
import { applyLevel } from './party.js?v=20261108-2252';

const EARTH = [678, 679, 680, 681, 682, 683, 684, 685, 686];

// ---------- CE64 / variables 450, 451 ----------
// actor 18's move list wherever it is: in the party / bench, or kept for the form not in use (state.forms)
function list18(world, s) {
  const m = s.party.find((x) => x.id === 18) || (s.bench || {})[18];
  if (m) return m.skills;
  s.forms = s.forms || {};
  return (s.forms[18] = s.forms[18] || { skills: [...world.actors[18].skills] }).skills;
}
export function ce64(world, s) {
  if (!world.actors[18]) return;
  const L = list18(world, s), sw = s.sw || {};
  const learn = (id) => { if (!L.includes(id)) { L.push(id); L.sort((a, b) => a - b); } }; // (learn_skill sorts)
  const forget = (id) => { const k = L.indexOf(id); if (k >= 0) L.splice(k, 1); };
  if (s.ss && s.ss[5]) {
    forget(59); forget(54); forget(53);
    if (sw[593] || sw[861]) { learn(54); forget(53); } else { learn(53); forget(54); } // (861 jumps to 超かめはめ波覚える)
  } else {
    forget(54);
    if (sw[458]) learn(59);
    learn(53);
    if ((s.var && s.var[40]) >= 2 && sw[861]) learn(59);
  }
}
// $cha_tactics[7][18] ⇄ variable 450 (超1) / 451 (超2)
function tac18(s, keep, put) {
  s.var = s.var || {};
  s.tactics = s.tactics || {};
  const t = (s.tactics[18] = s.tactics[18] || {});
  s.var[keep] = t.tecId || 0;
  t.tecId = s.var[put] || 0;
}
changeHooks.push((world, s, no, on, was) => {
  if (no === 5) tac18(s, on ? 450 : 451, on ? 451 : 450); // 超1 → 超2 / 超2 → 超1
  if (no === 2 && !on && was[5]) tac18(s, 451, 450); // 超1 off while 超2 (12808)
  ce64(world, s);
});

// ---------- 超2 悟飯's 超サイヤ人変身 in battle (before src/cards_a.js's act: the Great Ape) ----------
const hooks = battle.battleHooks || {};
const prevAct = hooks.act;
hooks.act = async (b, i, skill) => {
  const m = b.party[i], s = b.game.state;
  if (skill && skill.ss && m.id === 18 && !(s.ss && s.ss[5]) && onHooks[5]) {
    b.say(`${m.name} 的${skill.name}！`);
    audio.se('Z3 変身', 80);
    await sleep(900);
    onHooks[5](b.world, s);
    audio.se('Z1 パワーアップ', 80);
    b.say(`${m.name} 變成了超級賽亞人！`);
    await sleep(1200);
    if (!b.practice) tally(s, m, skill, 0);
    return true;
  }
  return prevAct ? prevAct(b, i, skill) : false;
};

// ---------- 地球育ちのサイヤ人 at an S-combo ----------
growth.extra.push({
  combo: (v, b, who) => {
    let up = 0;
    for (const i of who) {
      for (const id of EARTH) {
        if (growth.has(b.world, b.party[i], id)) up = Math.max(up, Number((b.world.growth.skills[id] || { fx: {} }).fx.ah) || 0);
      }
    }
    return v + up;
  },
});

// ---------- testing: ?dev=grw… ----------
//   grwpic    Z2 Namek: 比克 (ネイルと同化 248) Lv 30 with 悟飯 / 克林, a battle (recover each turn: HP +7 %, KI +3 %)
//   grwkami   the same with 神と融合 249 (HP +8 %, KI +5 %)
//   grwearth  Z2 after 悟空 is back (switch 531): 悟空 Lv 30 → 地球育ちのサイヤ人 at the battle start, with 克林 / 悟飯
//   grwss2    ZG: 超2 悟飯 (真の力 38, CE64: 54 with switch 593) with 悟空, a battle
//   grwss1    ZG: 超1 悟飯 with 超サイヤ人変身 59 (switch 458): use it in battle → 超2
//   grwape    ZG 外伝: 多瑪・莎莉巴・多達布・普普堅 (大猿変身 251 / 262 / 270 / 278), a battle
//   grwfav    Z2: 悟空 the favourite character (variable 104), the field (the 隊伍 screen's mark)
const lv = (game, m, n) => { m.level = n; m.exp = game.world.actors[m.id].exp[n]; applyLevel(game.world, m); heal(m); };
registerZ3('grw', {
  dev(game, step) {
    if (!/^grw/.test(step)) return false;
    const s = game.state = game.newState(), w = game.world;
    const zg = () => {
      s.var[40] = 2;
      for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568]) s.sw[n] = true;
      s.flags.z3 = 'done';
    };
    const foes = [1, 1];
    if (step === 'grwpic' || step === 'grwkami') {
      s.var[40] = 1;
      party(game, [4, 5, 6]);
      growth.setTypical(w, s, member(game, 4), 0, step === 'grwpic' ? 248 : 249);
    } else if (step === 'grwearth') {
      s.var[40] = 1;
      s.sw[531] = true;
      party(game, [3, 6, 5]);
    } else if (step === 'grwss2' || step === 'grwss1') {
      zg();
      if (step === 'grwss2') s.sw[593] = true;
      party(game, [5, 3]);
    } else if (step === 'grwape') {
      s.var[40] = 1;
      party(game, [27, 28, 29, 30]);
    } else if (step === 'grwfav') {
      s.var[40] = 1;
      party(game, [3, 5, 4]);
      s.var[104] = 3;
    } else return false;
    for (const m of s.party) lv(game, m, 30);
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    if (step === 'grwss2' || step === 'grwss1') {
      superSaiyan(w, s, 2, true); // (CE64 runs: 59 with switch 458)
      if (step === 'grwss2') onHooks[5](w, s);
    }
    game.startField();
    if (step !== 'grwfav') setTimeout(() => game.startBattle(foes, false, { loseOk: true }), 400);
    return true;
  },
});

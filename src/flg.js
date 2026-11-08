// ?dev=flg…: test battles for the move flags and enemy mechanics (docs/batch2-plan.md flg; the rules are in src/battle.js
// and docs/battle-rules.md §4.4-§5). A Z3-era save in the 時之間 hall (variable 43 = 60 so the androids' 造 cards come
// up), the party at level 30, then the fight (no escape, losing is fine):
//   flgchao   天津飯・餃子 vs 栽培人 ×3 — 超能力 (12) / 新氣功炮・精神攻擊 (13) stop the enemy, 四身拳氣功炮 (61, 29)
//   flgguldo  vs 古爾多 — 時間停止 stops a member (12 + 11, no damage)
//   flg19     vs 19號・20號 — 吸取生命 (15) heals them, once per turn (24)
//   flgsaiba  雅木茶 vs 栽培人 — 自爆 only when it hits (60)
//   flgjeice  vs 吉斯・巴特 — 紫色彗星攻擊 only while both stand and are not stopped
//   flghatch  vs 哈奇亞克 — 復仇衝鋒 (583), then 復仇加農砲 (584) in a later turn
//   flgcell   vs 沙魯(第１形態) — 太陽拳 (14), 吸取生命
//   flgsw     vs 卡里克 with switches 121 / 122 / 124 / 125 / 137 / 148 on
//   flgdummy  vs 訓練人偶 — its cards are ★1 / 一 (element_ranks 55)
import { registerZ3, party, heal } from './z3.js?v=20261108-1751';
import { applyLevel } from './party.js?v=20261108-1751';

const FIGHTS = {
  flgchao: [[8, 9, 3], [3, 3, 3]],
  flgguldo: [[3, 4, 6], [52]],
  flg19: [[3, 4, 6], [123, 122]],
  flgsaiba: [[7], [3]],
  flgjeice: [[3, 4, 6, 8], [49, 50]],
  flghatch: [[3, 4, 12], [173]],
  flgcell: [[3, 4, 5], [127]],
  flgsw: [[3, 4], [16]],
  flgdummy: [[3, 4], [27]],
};

registerZ3('flg', {
  dev(game, step) {
    const f = FIGHTS[step];
    if (!f) return false;
    const s = game.state = game.newState();
    s.var[40] = 2;
    s.var[43] = 60;
    for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568]) s.sw[n] = true;
    s.flags.z3 = 'done';
    party(game, f[0]);
    for (const m of s.party) { m.level = 30; m.exp = game.world.actors[m.id].exp[30]; applyLevel(game.world, m); heal(m); }
    if (step === 'flgsw') for (const n of [121, 122, 124, 125, 137, 148]) s.sw[n] = true;
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    setTimeout(() => game.startBattle(f[1], true, { loseOk: true }), 300);
    return true;
  },
});

// 卡片效果 A：55 月亮和尾巴、73 皮拉夫、76 飛機、79 老鼠、91 阿修、92 小舞、96 藍將軍、100 小八、107 桃白白、112 鈴鼓、113 銅撥、114 比克(O)、123 木乃伊 — docs/cards-plan.md; the data is built by tools/build_cards_a.py.
// Card effects register in src/items.js fieldCards[id] = async ({ game, battle }) => used | 'close' | false.
//   skill cards (other_card_run, Items element 32): 73 皮拉夫 惡作劇(防禦) 23, 91 阿修 惡作劇(攻擊) 259, 92 小舞 惡作劇(變更) 289,
//     96 藍將軍 硬撐 67, 100 小八 鐵壁 73, 107 桃白白 高昂的鬥志 42, 112 鈴鼓 手下留情 385, 113 銅撥 阿吽的呼吸 610,
//     114 比克(O) 精神統一 318, 123 木乃伊 保持實力 309 — the skill joins the 追加技能 list (src/growth.js useSkillCard);
//     their battle effects are the hooks below (src/battle.js battleHooks, src/combo.js comboHooks)
//   55 月亮和尾巴 (run_card all.rb 46065): 悟飯 only, once (switch 70): Z1 大猿変身 (skill 51), later 爆裂ラッシュ (52)
//   76 飛機 (all.rb 147041): 5 more card moves of double reach (variable 420; src/field.js fieldHooks)
//   79 老鼠 (Scene_Db_Status window 13, all.rb 43585): the 自由 slot set by 假面男 goes back to 自由
// The Great Ape (on_off_oozaru, all.rb 13109): 悟飯 (51) and バーダック一味 (トーマ 251, セリパ 262, トテッポ 270,
// パンブーキン 278) forget the moves of on_off_skill and fight as the 192×192 ape — special moves ×2 power (once used),
// damage dealt ×1.5, taken ×0.7, 必 cards count as their school, more recovery, no S-combos; a tail-cutting move turns
// them back, and back they learn on_off_skill again (悟飯 always 魔閃光; 大猿変身 only in Z1 once he has it, switch 70).
// After the battle one stays an ape if its 作戰「變身狀態」is 保持 (off_oozaru_all all.rb 13083, $cha_tactics[3][id]; by
// default 不保持: back), and the story turns 悟飯 back after the Z1 bosses and Willow (Map007 #ゴハン大猿OFF: the
// tacApeOff node, tools/build_data.py), as does CE160 in the 時之間 (apeOffAll). Switches 364-368 are $oozaru_flag (CE9
// reads them); the 作戰 move is kept apart for the ape (variables 442-453, tacgvar).
import { audio, say, choose, sleep, toast, rand } from './core.js?v=20261108-0603';
import { fieldCards, cardState } from './items.js?v=20261108-0603';
import * as battle from './battle.js?v=20261108-0603';
import * as combo from './combo.js?v=20261108-0603';
import * as field from './field.js?v=20261108-0603';
import { has, ensure, useSkillCard, revive, ran } from './growth.js?v=20261108-0603';
import { pickMember, tally } from './partymenu.js?v=20261108-0603';
import { registerZ3, party } from './z3.js?v=20261108-0603';
import { addNodes } from './cutscene.js?v=20261108-0603';
import { ssOff } from './supersaiyan.js?v=20261108-0603';

const SE_ERR = 'Z3 エラー';
const APE = { sprite: 'Graphics/Pictures/Z1_戦闘_ゴハン(大猿)96×96.png', special: 'Graphics/Pictures/Z1_戦闘_必殺技_ゴハン(大猿)96×96.png', size: 192 };
// on_off_oozaru no → actor: the move, on_off_skill, oozaru_flag switch, tacgvar, the sheet name ($btl_top_file_name Z2_ / Z3_)
const APES = {
  5: { move: 51, skills: [47, 51], sw: 368, tac: [452, 453] },
  27: { move: 251, skills: [247, 249, 251], sw: 364, tac: [442, 443], jp: 'トーマ' },
  28: { move: 262, skills: [256, 259, 262], sw: 365, tac: [444, 445], jp: 'セリパ' },
  29: { move: 270, skills: [266, 268, 270], sw: 366, tac: [446, 447], jp: 'トテッポ' },
  30: { move: 278, skills: [274, 276, 278], sw: 367, tac: [448, 449], jp: 'パンブーキン' },
};
const apeSheets = (s, a) => { // 悟飯's are Z1's; the crew's Z2_ / Z3_ by variable 40 (Z3 from ZG's Frieza part on)
  if (!a.jp) return APE;
  const z = (s.var && s.var[40]) >= 2 ? 'Z3' : 'Z2';
  return { sprite: `Graphics/Pictures/${z}_戦闘_${a.jp}(大猿)96×96.png`, special: `Graphics/Pictures/${z}_戦闘_必殺技_${a.jp}(大猿)96×96.png`, size: 192 };
};
const learnSkill = (m, id) => { if (!m.skills.includes(id)) { m.skills.push(id); m.skills.sort((a, b) => a - b); } }; // (learn_skill sorts)
const AIR_MOVE = 128; // one card move = 4 tiles (as for バブルス, src/items.js)
// the hook objects of the shared files (src/battle.js, src/combo.js, src/field.js); while one is missing its rules just don't run
const battleHooks = battle.battleHooks || {}, comboHooks = combo.comboHooks || {}, fieldHooks = field.fieldHooks || {};

// ---------- skill cards ----------
for (const id of [73, 91, 92, 96, 100, 107, 112, 113, 114, 123]) {
  fieldCards[id] = async ({ game }) => useSkillCard(game, game.world.cardsA.skills[id]);
}

// ---------- 55 月亮和尾巴 ----------
fieldCards[55] = async ({ game }) => {
  const s = game.state;
  s.sw = s.sw || {};
  s.var = s.var || {};
  const m = await pickMember(game, '月亮和尾巴', (x) => x.id === 5 && !s.sw[70], false);
  if (!m) return false;
  audio.se('Z1 パワーアップ', 80);
  await sleep(500);
  const id = s.var[40] ? 52 : 51;
  if (!m.skills.includes(id)) m.skills.push(id);
  s.sw[70] = true;
  return true;
};

// ---------- 76 飛機 ----------
fieldCards[76] = async ({ game }) => {
  const s = game.state;
  s.var = s.var || {};
  if ((s.var[420] || 0) >= 999) { audio.se(SE_ERR, 70); return false; }
  s.var[420] = Math.min(999, (s.var[420] || 0) + 5);
  audio.seStop();
  audio.se('DB3 エネルギー波2', 80);
  return true;
};
// while variable 420 lasts (飛機 +5, cards-b's 173 スカイカー +15), the field flies twice as far; each card move's worth
// of flying uses one
fieldHooks.step = (s, plain) => {
  if (!(s.var && s.var[420] > 0)) return plain;
  s.cdaAir = (s.cdaAir || 0) + plain;
  if (s.cdaAir >= AIR_MOVE) {
    s.cdaAir -= AIR_MOVE;
    s.var[420]--;
    if (!s.var[420]) toast('移動量加倍的效果結束了');
  }
  return plain * 2;
};

// ---------- 79 老鼠 ----------
fieldCards[79] = async ({ game }) => {
  const w = game.world;
  const m = await pickMember(game, '老鼠', (x) => !!ensure(x).freeSet, true);
  if (!m) return false;
  const name = (w.growth.skills[m.typ[2]] || {}).n || '';
  await say([['', `卸下技能：${name}\n要卸下這個技能嗎？\n※卸下的技能無法恢復為原狀！`]], true);
  if ((await choose(['是的', '取消'])) !== 0) return false;
  audio.se('Z3 アイテム取得', 80);
  m.typ[2] = 34; // 自由
  m.freeSet = false;
  return true;
};

// ---------- the Great Ape ----------
// the 作戰 move: the one before is kept in tac[0], the ape's comes from tac[1] (on) and the other way round (off)
// ($cha_tactics[7] as it is: partymenu.js tactics() puts a move it doesn't know back to its first one when read)
function apeTactics(s, m, a, on) {
  s.var = s.var || {};
  s.tactics = s.tactics || {};
  const t = (s.tactics[m.id] = s.tactics[m.id] || {}), [keep, put] = on ? a.tac : [a.tac[1], a.tac[0]];
  s.var[keep] = t.tecId || 0;
  t.tecId = s.var[put] || 0;
}
function apeOn(s, m) {
  const a = APES[m.id];
  if (!a || m.cdaApe) return;
  const sh = apeSheets(s, a);
  m.cdaApe = { sprite: m.sprite, special: m.special, size: m.spriteSize };
  m.skills = m.skills.filter((x) => !a.skills.includes(x));
  m.sprite = sh.sprite;
  m.special = sh.special;
  m.spriteSize = sh.size;
  (s.sw = s.sw || {})[a.sw] = true;
  apeTactics(s, m, a, true);
}
function apeOff(s, m) {
  const was = m.cdaApe, a = APES[m.id];
  if (!was) return;
  delete m.cdaApe;
  // all.rb 13176: 51 only in Z1 once card 55 taught it (switch 70); the rest always
  for (const id of a ? a.skills : []) if (!(id === 51 && ((s.var && s.var[40]) || !(s.sw && s.sw[70])))) learnSkill(m, id);
  for (const [k, v] of [['sprite', was.sprite], ['special', was.special], ['spriteSize', was.size]]) { if (v === undefined) delete m[k]; else m[k] = v; }
  if (a) { (s.sw = s.sw || {})[a.sw] = false; apeTactics(s, m, a, false); }
}

// ---------- battle hooks (src/battle.js battleHooks) ----------
const plays = (b, m) => !!b.plans[b.party.indexOf(m)];
const cardOf = (b, m) => { const p = b.plans[b.party.indexOf(m)]; return p ? b.hand[p.card] : null; };
const fx = (b, id, k) => Number((b.world.growth.skills[id] || { fx: {} }).fx[k]) || 0;
const first = (b, m, fam) => fam.find((id) => has(b.world, m, id));
const YASEGAMAN = [67, 68, 69, 179, 180, 181, 182, 183, 184]; // checked lowest first, like the original
const ONZON = [309, 310, 311, 312, 313, 314, 315, 316, 317]; // 力の温存 (保持實力)
const SEISHIN = [318, 319, 320, 321, 322, 323, 324, 325, 326]; // 精神統一
const TEKAGEN = [[388, 3], [387, 2], [386, 1], [385, 0]]; // 手加減 (手下留情): attack stars at most n (0 = one star)
const DOUTYOU = [[615, 3, 3], [614, 3, 2], [613, 2, 2], [612, 2, 1], [611, 1, 1], [610, 1, 0]]; // 阿吽の呼吸

// get_battle_skill (all.rb 7283): 鉄壁 1 swaps an attack higher than the guard, 鉄壁 2 moves stars to the guard
// (捨て身 comes first in the original: it is the 悟空 card's); the Great Ape plays a 必 card as his school (7334)
battleHooks.cardFor = (b, m, cd) => {
  const c = { ...cd };
  if (!has(b.world, m, 54) && has(b.world, m, 73) && c.a > c.g) [c.a, c.g] = [c.g, c.a];
  if (!has(b.world, m, 365) && has(b.world, m, 366)) { const n = Math.min(c.a, 7 - c.g); c.a -= n; c.g += n; }
  if (m.cdaApe && c.s === 0) c.s = m.school;
  return c;
};
// get_mp_cost (all.rb 7719): 手加減 — KI ×0.75 with a low attack card
battleHooks.kiCost = (b, m, skill, ki, cd) => {
  const t = TEKAGEN.find(([id]) => has(b.world, m, id));
  return t && cd && cd.a <= t[1] ? Math.trunc(ki * 0.75) : ki;
};
// damage_calculation (all.rb 68443): the Great Ape's special moves ×2 (the original only doubles a move used before)
battleHooks.power = (b, m, skill, P) => (m.cdaApe && skill && (b.game.state.skillLv || {})[skill.id] ? P * 2 : P);
battleHooks.dealt = (b, m, skill, d) => (m.cdaApe ? Math.trunc(d * 1.5) : d); // (68654)
battleHooks.taken = (b, m, d) => (m.cdaApe ? Math.trunc(d * 0.7) : d); // (68743)

// 大猿変身 (51 悟飯, 251 / 262 / 270 / 278 the crew): no attack, the member becomes the Great Ape (anime 151 / 1351:
// the full moon, then the ape; the crew's film is src/anime_bardock_crew.js crApe)
battleHooks.act = async (b, i, skill) => {
  const m = b.party[i];
  if (!skill || !APES[m.id] || skill.id !== APES[m.id].move || m.cdaApe) return false;
  b.say(`${m.name} 的${skill.name}！`);
  const foe = b.foes.find((f) => f.hp > 0), cd = cardOf(b, m);
  if (foe) { // the film (src/anime.js gohanApe: the full moon, the face; the crew's 1351: the flicker into the ape)
    if (foe.card && cd) b.duel = { m, mc: cd, f: foe, fc: foe.card };
    await b.play(m, foe, true, skill.id, -1, foe);
    apeOn(b.game.state, m);
  } else {
    audio.se('Z1 満月', 80);
    await sleep(1400);
    audio.se('Z1 パワーアップ', 80);
    await sleep(700);
    apeOn(b.game.state, m);
    audio.se('Z1 大猿', 80);
  }
  b.say(`${m.name} 變成了大猿！`);
  await sleep(1200);
  if (!b.practice) tally(b.game.state, m, skill, 0);
  return true;
};

// get_attack_hit_skill, the party hitting (all.rb 17256-17305): いたずら changes the enemy's card
battleHooks.hit = (b, m, foe) => {
  const c = foe.card;
  if (!c) return;
  if (has(b.world, m, 23) && c.g < c.a) { [c.a, c.g] = [c.g, c.a]; ran(23, 'hit'); } // (17264 / 17279 / 17303: ran = the name box)
  if (has(b.world, m, 259) && c.g > c.a) { [c.a, c.g] = [c.g, c.a]; ran(259, 'hit'); }
  if (has(b.world, m, 289) && (c.a >= 4 || c.g >= 4)) { if (c.a >= 4) c.a = rand(7); if (c.g >= 4) c.g = rand(7); ran(289, 'hit'); }
};
// the party being hit (all.rb 17483 / 17746 / 68912 / 68955): たぎる闘志 raises the member's card, やせがまん may keep
// 1 HP, a tail-cutting move turns the Great Ape back
battleHooks.hurt = (b, m, foe, skill) => {
  const w = b.world, cd = cardOf(b, m);
  const up = [[42, 1], [43, 2], [44, 3]].find(([id]) => has(w, m, id));
  if (up && cd) { cd.a = Math.min(7, cd.a + up[1]); ran(up[0], 'hit', 1); } // (17490)
  const yg = first(b, m, YASEGAMAN);
  if (yg && rand(100) + 1 < fx(b, yg, 'rate') && m.hp <= 0) m.hp = 1;
  if (m.cdaApe && skill && w.cardsA.tail.includes(skill.id)) {
    apeOff(b.game.state, m);
    b.say(`${m.name} 的尾巴被切斷，變回原狀了！`);
  }
};

// turn_recover_hpki (all.rb 18557): the Great Ape recovers HP ×1.3 / KI ×1.2; 力の温存 / 精神統一 add HP / KI for the
// members who sat this turn out
const pct = (max, p) => Math.ceil((max * p) / 100);
battleHooks.recover = (b) => {
  for (const m of b.party) {
    const fresh = m.ko && m.koTurn === b.turn;
    const sat = !plays(b, m);
    if (!fresh) {
      let add = 0;
      if (m.cdaApe) add += m.ko ? pct(m.maxhp, 9.75) - pct(m.maxhp, 7.5) : pct(m.maxhp, 3.9) - pct(m.maxhp, 3);
      const on = sat && first(b, m, ONZON);
      if (on) add += pct(m.maxhp, fx(b, on, 'hp'));
      m.hp = Math.min(m.maxhp, m.hp + add);
      if (m.ko && m.hp >= m.maxhp) revive(m);
    }
    if (m.ko) continue;
    let ki = 0;
    if (m.cdaApe) ki += pct(m.maxki, 3) - pct(m.maxki, 2.5);
    const se = sat && first(b, m, SEISHIN);
    if (se) ki += pct(m.maxki, fx(b, se, 'ki'));
    m.ki = Math.min(m.maxki, m.ki + ki);
  }
};
battleHooks.end = (b) => { const s = b.game.state; for (const m of s.party) if (ssOff(s, m.id)) apeOff(s, m); }; // (13085-13089)
// CE160 大猿全解除 / #ゴハン大猿OFF: back to himself, wherever he is (the 時之間 calls it going in and out, src/timeroom.js)
export function apeOffAll(s) { for (const m of [...s.party, ...Object.values(s.bench || {})]) apeOff(s, m); }
addNodes({ tacApeOff: async (node, { s }) => apeOffAll(s) });

// chk_doutyou_run (all.rb 8074): 阿吽の呼吸 lowers the stars a combo needs; the Great Ape joins no combo (52131)
comboHooks.less = (b, m) => { const d = DOUTYOU.find(([id]) => has(b.world, m, id)); return d ? [d[1], d[2]] : [0, 0]; };
comboHooks.blocked = (b, m) => !!m.cdaApe;

// ---------- testing: ?dev=cda (Z1, 悟空・悟飯・比克 with every card here), ?dev=cdaz2 (the same in Z2) ----------
registerZ3('cda', {
  dev(game, step) {
    if (step !== 'cda' && step !== 'cdaz2') return false;
    const s = game.state = game.newState();
    if (step === 'cdaz2') s.var[40] = 1;
    party(game, [3, 5, 4]);
    s.zeni = 5000;
    cardState(s);
    for (const id of [55, 73, 76, 79, 91, 92, 96, 100, 107, 112, 113, 114, 123, 110]) s.cards[id] = 1;
    game.startField();
    return true;
  },
});

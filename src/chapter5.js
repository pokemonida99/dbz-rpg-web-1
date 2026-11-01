// Chapter 5 (卡里克篇): what follows the Ginger area in the original, driven by world.chapter5 (tools/build_chapter5.py).
//   end of chapter 4 (page 114: the Z fighters gather at Garlic's castle) → map 13, all six: 卡里克三人眾 (117, battle
//   120) → 卡里克 (121, battle 122) → he grows and revives the three (123, battle 126) → 一星球 (127) → King Kai's
//   planet, Goku alone (map 14): the training squares are fights with King Kai himself (130; his HP carries over,
//   losing only sends Goku back to the map) → 132: the training is over, Shenron is called → end of chapter.
// state.flags.ch5 tracks the step: 'garlic' → 'kaio' → 'done'.
import { input, say } from './core.js?v=20261101-2006';
import { scenes, setParty, moveTo, enterMap, card } from './chapter2.js?v=20261101-2006';
import { addScenes } from './cutscene.js?v=20261101-2006';
import { makeMember, levelUp } from './party.js?v=20261101-2006';
import { eventCard } from './items.js?v=20261101-2006';

const MAPS = ['13', '14'];
const pic = (n) => `Graphics/Pictures/${n}.PNG`;
const EVENT = pic('Z1_顔イベント'), FOE = pic('Z1_顔敵');

// z1field 117-134 (143_Event_Main.rb): the scenes of this chapter (src/cutscene.js)
addScenes({
  117: { bgm: 'DB3 戦闘前', bg: 'ガーリック三人衆', foe: [FOE, 13], out: true, next: '+' }, // ジンジャー
  118: { bg: 'ガーリック三人衆', foe: [FOE, 14], out: true, next: '+' }, // ニッキー
  119: { bg: 'ガーリック三人衆', foe: [FOE, 15], out: true, next: '+' }, // サンショ
  121: { bgm: 'Z1 戦闘前', bg: 'ガーリック城_ガーリックの間', foe: [FOE, 16], out: true, next: '+' }, // ガーリック
  123: { bgm: 'DB2 イベント02', bg: 'ガーリック城_ガーリックの間', foe: [FOE, 16], out: true, next: '+' }, // ガーリック撃破後
  124: { bg: 'ガーリック城_ガーリックの間', foe: [FOE, 17], out: true, next: '+' }, // 巨大化
  // the three revived above him: the original draws them a row above the scene window; here they sit in its top half
  125: { bg: 'ガーリック城_ガーリックの間', foe: [FOE, 17, 32], adds: [[FOE, 13, -64, -32], [FOE, 14, 0, -32], [FOE, 15, 64, -32]], out: true, next: '+' },
  127: { bgm: 'Z1 戦闘前', foe: [EVENT, 22], out: true, next: '+' }, // 一星球
  128: { bgm: 'Z1 界王', party: [3], fadein: true, next: '+' }, // 界王星そのころ
  129: { bg: '界王星_地上', foe: [EVENT, 18], out: true, next: '+' }, // 界王様
  132: { bgm: 'Z1 界王', bg: '界王星_地上', foe: [EVENT, 18], out: true, next: '+' }, // 修行終了
  133: { bgm: 'DB3 カメハウス', bg: 'カメハウス', foe: [EVENT, 1], out: true, fadein: true, next: '+' }, // カメハウス
  // the seven balls in the scene; 亀仙人・ブルマ・ウーロン・プーアル under it
  134: { adds: [[EVENT, 22, -128, 0], [EVENT, 23, -64, -32], [EVENT, 24, -64, 32], [EVENT, 25, 0, 0], [EVENT, 26, 64, -32], [EVENT, 27, 64, 32], [EVENT, 28, 128, 0]],
    faces: [[EVENT, 1, -96], [EVENT, 3, -32], [EVENT, 20, 32], [EVENT, 5, 96]], next: '+' },
}, [120, 122, 126, 130]);

export function chapter5Goal(world, s) {
  const c = world.chapter5;
  if (!c || !s.flags.ch5) return undefined;
  if (s.flags.ch5 === 'done') return '';
  const g = c.goals[s.map];
  return Array.isArray(g) ? g[s.flags.sanninDone ? 1 : 0] : g;
}

const recover = (s) => { for (const m of s.party) { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; } };

// right after chapter 4 ends with page 114 (z1field 116: $partyc = [4..9], all_charecter_recovery) → map 13 at (4,24)
export async function startChapter5(game) {
  const c = game.world.chapter5, s = game.state;
  game.busy = true;
  game.field.paused = true;
  game.field.leave();
  await card(c.title, 2200);
  s.bench = s.bench || {};
  for (const id of c.garlic.party) if (!s.bench[id] && !s.party.some((m) => m.id === id)) s.bench[id] = makeMember(game.world, id);
  setParty(s, c.garlic.party);
  recover(s);
  moveTo(s, c.garlic);
  s.flags.ch5 = 'garlic';
  enterMap(game);
}

// a save from before this chapter existed, stopped after the Ginger area
export function resumeChapter5(game) {
  const s = game.state;
  if (game.world.chapter5 && s.flags.ch4 === 'done' && !s.flags.ch5) { startChapter5(game); return true; }
  return false;
}

export const isChapter5Map = (s) => MAPS.includes(s.map);

// field spots with `chapter` set on these maps (King Kai's training squares)
export function chapter5Spot(game, poi) {
  return poi.chapter === 'kaioFight' ? kaioFight(game, poi) : null;
}

// stop everything on the field for a story beat
function hold(game) {
  game.busy = true;
  game.field.paused = true;
  input.dx = input.dy = 0;
}

// the bosses of map 13 (world.bosses['13']: the three, then Garlic)
export async function chapter5Boss(game, b) {
  const c = game.world.chapter5, s = game.state;
  if (game.busy || !b) return;
  hold(game);
  if (b.id === 'sannin') { // 117 → battle_process 120 (switch 59 and 概況 +1 are set by the page itself)
    await scenes(c.sannin, s);
    game.busy = false;
    if (!(await game.startBattle(b.foes, true))) return;
    s.flags.sanninDone = true;
    game.save(true);
    game.renderHud(); // the next goal
    return;
  }
  // 121 → battle_process 122 → 123 → battle_process 126 → 127
  await scenes(c.garlicBefore, s);
  game.busy = false;
  if (!(await game.startBattle(b.foes, true))) return;
  hold(game);
  await scenes(c.garlicGrows, s);
  game.busy = false;
  if (!(await game.startBattle([17, 13, 14, 15], true, { bgm: c.giantBgm }))) return;
  hold(game);
  s.flags.garlicDone = true;
  await scenes(c.garlicAfter, s); // 一星球, then King Kai's planet: 概況 +1, Goku alone
  setParty(s, c.kaio.party);
  recover(s);
  moveTo(s, c.kaio);
  s.flags.ch5 = 'kaio';
  enterMap(game);
}

// page 130 / battle_process 130: King Kai himself. His HP is kept between tries (variable 52, switch 61); losing
// (131) puts Goku back on the map, all recovered, and King Kai says it is not enough (switch 62, map 14 EV005).
async function kaioFight(game, poi) {
  const c = game.world.chapter5, s = game.state;
  game.field.spent = poi; // a square works once per visit, like landing on it
  s.var[51] = (s.var[51] || 0) + 1; // how many times Goku trained with him
  if (!s.sw[61]) { s.var[52] = game.world.enemies[18].maxhp; s.sw[61] = true; }
  game.busy = false;
  const won = await game.startBattle([18], true, { bgm: c.kaioBgm, foeHp: [s.var[52]], keepOnLose: true });
  hold(game);
  if (!won) {
    s.var[52] = Math.max(1, game.lastBattle.foes[0].hp);
    recover(s);
    s.sw[62] = true;
    await say(c.kaioLose);
    s.sw[62] = false;
    game.save(true);
    game.busy = false;
    game.field.paused = false;
    return;
  }
  await kaioDone(game);
}

// page 132: the training is over (CE14: the dragon balls are used; CE12: Goku learns 界王拳, 界王拳・龜派氣功, 元氣彈),
// the Earth gathers the balls and calls Shenron — the end of this chapter (map 117 is the next one)
async function kaioDone(game) {
  const c = game.world.chapter5, s = game.state;
  recover(s);
  for (const id of c.dragonBalls) eventCard(s, id, -99);
  const goku = s.party.find((m) => m.id === 3) || (s.bench || {})[3];
  if (goku) for (const k of c.kaioSkills) if (!goku.skills.includes(k)) goku.skills.push(k);
  await scenes(c.kaioWin, s);
  s.flags.ch5 = 'done';
  game.save(true);
  game.busy = false;
  await card(c.end, 2000);
  if (game.nextChapter && game.nextChapter('ch6') !== false) return; // the Shenron scene (map 117), when it exists
  game.showTitle(c.end);
}

// ---------- testing: ?dev=ch5 (or __game.devChapter5()) starts here as if chapter 4 had just ended ----------
export function devChapter5(game, level = 16) {
  const w = game.world, s = game.newState();
  game.state = s;
  s.bench = {};
  for (const id of [3, 4, 5, 6, 7, 8, 9]) {
    const m = makeMember(w, id);
    m.exp = w.actors[id].exp[id === 3 ? level + 4 : level];
    levelUp(w, m);
    m.hp = m.maxhp; m.ki = m.maxki;
    s.bench[id] = m;
  }
  s.party = [s.bench[4], s.bench[5]];
  delete s.bench[4]; delete s.bench[5];
  s.teams = [[4, 5], [6, 7], [8, 9]];
  Object.assign(s.flags, { bossDone: true, ch2: 'done', sanshoDone: true, ch3: 'done', nikkiDone: true, ch4: 'done' });
  Object.assign(s.var, { 41: 117, 42: 4, 43: 8 });
  for (const id of [3, 4, 5, 6, 7, 8]) eventCard(s, id, 1); // 二星球 … 七星球 found by then
  game.startField();
  return startChapter5(game);
}

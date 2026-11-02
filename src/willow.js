// The Willow chapter (この世で一番強いやつ): what the original plays after the Z1 ending film, driven by world.willow
// (tools/build_willow.py, Map007 event 9).
//   901 the story (Willow wakes from the ice, the Kame House, the Z fighters set off; Piccolo and Chichi join)
//   → map 50 the snowfield → the fortress door (931) → map 51 the fortress: the Bio-Warriors (941, Master Roshi
//   joins; battle 943) and Dr. Willow (951; battle 953) → 961 / 962 → the hand-over to Z2 (variable 40 = 1,
//   $game_progress = 1, party [5..9], variable 41 = 201 for Z2's opening), shown here as a 「待續」 card until Z2 exists.
// state.flags.willow tracks the step: 'snow' → 'fortress' → 'done'.
import { input } from './core.js?v=20261102-2129';
import { scenes, setParty, moveTo, enterMap, card } from './chapter2.js?v=20261102-2129';
import { addScenes } from './cutscene.js?v=20261102-2129';
import { makeMember, applyLevel } from './party.js?v=20261102-2129';
import { eventCard } from './items.js?v=20261102-2129';
import { ensure, has, extra } from './growth.js?v=20261102-2129';
import { registerZ3 } from './z3.js?v=20261102-2129';

const MAPS = ['50', '51'];

// 武泰斗の教え (龜仙人's 固有技能 687-695, tools/build_willow.py): evasion + its rate, on top of 残像拳 (get_avoid_add,
// all.rb 18055), and the S-combo's attack stars + its a_hoshi, the best of the members, on top of 連携 (all.rb 68502)
const MUTAITO = [695, 694, 693, 692, 691, 690, 689, 688, 687];
const mutaito = (w, m) => { const id = m && MUTAITO.find((x) => has(w, m, x)); return id ? w.growth.skills[id].fx : null; };
extra.push({
  avoid: (v, b, m) => { const fx = mutaito(b.world, m); return fx ? v + (Number(fx.rate) || 0) : v; },
  combo: (v, b, who) => v + Math.max(0, ...who.map((i) => Number((mutaito(b.world, b.party[i]) || {}).ah) || 0)),
});
const pic = (n) => `Graphics/Pictures/${n}.PNG`;
const PARTY = pic('Z1_顔味方'), FOE = pic('Z1_顔敵'), CARD = pic('顔カード');

// z1field 901-962 (143_Event_Main.rb): the scenes of this chapter (src/cutscene.js). The original puts faces left and
// right of the scene and above it; here they stay inside the scene window or go under it (smaller when there are many)
const BIO_MEN = [-96, -32, 32, 96].map((dx) => [FOE, 25, dx, 0, 32]); // four バイオマン, half size, in a row
const BIO_WARRIORS = [[FOE, 23, -64, 0], [FOE, 24, 0, 0], [FOE, 22, 64, 0]]; // エビフリャー, ミソカッツン, キシーメ
const KAME_HOUSE = [[CARD, 8, 32, 32], [CARD, 9, -32, 32], [CARD, 20, 32, -32], [CARD, 49, -32, -32]]; // ブルマ, 亀仙人, ウーロン, ウミガメ
const ROW = (row, line = 0) => [-96, -32, 32, 96].map((dx) => [FOE, row, dx, line]);
addScenes({
  901: { bg: 'ツルマイツブリ山', faces: [[PARTY, 1, 0]] }, // ピッコロ
  902: { bg: 'ツルマイツブリ山', faces: [[PARTY, 2, -32], [CARD, 20, 32]] }, // 悟飯とウーロン
  903: { bg: 'ツルマイツブリ山', faces: [[FOE, 21, 0]], balls: true }, // コーチン and the seven balls
  904: { full: 'Graphics/Pictures/Z1_背景_シェンロン.png' }, // シェンロン
  905: { bg: 'ツルマイツブリ山', faces: [[FOE, 21, 0]] },
  906: { bg: 'ツルマイツブリ山', faces: [[PARTY, 2, -32], [CARD, 20, 32]], adds: BIO_MEN }, // バイオマンに発見される
  907: { bg: 'ツルマイツブリ山', faces: [[PARTY, 1, 0], [PARTY, 2, -32, 1], [CARD, 20, 32, 1]], adds: BIO_MEN }, // ピッコロ助けに来る
  908: { bg: 'ツルマイツブリ山', faces: [[PARTY, 1, 0], [PARTY, 2, -32, 1], [CARD, 20, 32, 1]] },
  909: { bg: 'ツルマイツブリ山', faces: [[PARTY, 1, 0], [PARTY, 2, -32, 1], [CARD, 20, 32, 1]], adds: BIO_WARRIORS }, // バイオ戦士
  910: { bg: 'カメハウス', adds: KAME_HOUSE, faces: [...ROW(25), [FOE, 21, 0, 1]], faceSize: 48 }, // カメハウス
  911: { bg: 'カメハウス', adds: KAME_HOUSE, faces: [[FOE, 21, 0]] },
  912: { bg: 'カメハウス', adds: KAME_HOUSE, faces: [...ROW(25), ...ROW(25, 1), [FOE, 21, 0, 2]], faceSize: 40 }, // eight バイオマン
  913: { bg: 'カメハウス', adds: [[CARD, 20, 32, 0], [CARD, 49, -32, 0]] },
  914: { foe: [FOE, 21], faces: [[CARD, 8, 0]] }, // ウィロー要塞: コーチンとブルマ
  915: { foe: [FOE, 21, 32], adds: [[FOE, 20, 0, -32]], faces: [[CARD, 8, 0]] }, // ウィロー above コーチン
  916: { foe: [CARD, 20], faces: [[PARTY, 0, 0]] }, // 悟空とウーロン
  917: { out: true }, // Z戦士要塞へ向かう
  918: { out: true, foe: [PARTY, 1] }, // ピッコロ現れる
  919: { out: true, foe: [PARTY, 7] }, // チチ現れる
  931: { bg: 'ウイロー要塞', out: true }, // ウィロー要塞到着
  941: { foe: [PARTY, 21], out: true }, // 亀仙人
  942: { adds: BIO_WARRIORS, out: true }, // バイオ戦士
  951: { adds: [[FOE, 21, 32, 0], [CARD, 8, -32, 0]], out: true }, // Dr.ウィローとコーチンのところ到着
  952: { adds: [[FOE, 21, 32, 32], [CARD, 8, -32, 32], [FOE, 20, 0, -32]], out: true }, // ウィロー現れる
  961: { foe: [CARD, 8], out: true }, // Dr.ウィロー撃破後 (ブルマ in the scene: under it there are nine faces already)
  962: {},
}, [943, 953]);

export const isWillowMap = (s) => MAPS.includes(s.map);

export function willowGoal(world, s) {
  const c = world.willow;
  if (!c || !s.flags.willow) return undefined;
  if (s.flags.willow === 'done') return '';
  const g = c.goals[s.map];
  return Array.isArray(g) ? g[s.flags.bioDone ? 1 : 0] : g;
}

const heal = (m) => { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; };
function member(game, id) {
  const s = game.state;
  s.bench = s.bench || {};
  return s.party.find((m) => m.id === id) || s.bench[id] || (s.bench[id] = makeMember(game.world, id));
}
function hold(game) {
  game.busy = true;
  game.field.paused = true;
  input.dx = input.dy = 0;
  game.field.leave();
}

// right after the Z1 ending film (z1_ed: variable 41 = 901): page 901, then the snowfield
export async function startWillow(game) {
  const c = game.world.willow, s = game.state;
  hold(game);
  s.var[41] = 901;
  await card(c.title, 2200);
  for (const id of c.snow.party) member(game, id);
  await scenes(c.intro, s); // $partyc = [3..10] (Piccolo at 918, Chichi at 919: switches 69 / 779), 概況 16
  s.sw[69] = true;
  setParty(s, c.snow.party);
  for (const m of s.party) heal(m); // all_charecter_recovery
  s.var[42] = 3;
  moveTo(s, c.snow);
  s.flags.willow = 'snow';
  enterMap(game);
}

// a save made after Z1 but before this chapter existed (or stopped on the 待續 card)
export function resumeWillow(game) {
  const s = game.state;
  if (!game.world.willow || s.flags.ch6 !== 'done') return false;
  if (!s.flags.willow) { startWillow(game); return true; }
  if (s.flags.willow === 'done' && !game.startZ2a) { toZ2(game); return true; } // (with Z2 its own resume takes over)
  return false;
}

// map 50: the fortress door (page 931) → map 51 at (37,34)
export function willowSpot(game, poi) {
  if (poi.chapter === 'fortress') return fortress(game);
  return null;
}
async function fortress(game) {
  const c = game.world.willow, s = game.state;
  hold(game);
  s.var[41] = 931;
  await scenes(c.fortress, s); // 概況 17
  moveTo(s, c.inside);
  s.flags.willow = 'fortress';
  enterMap(game);
}

// map 51: the Bio-Warriors (941 → battle 943) and Dr. Willow (951 → battle 953 → 961 / 962)
export async function willowBoss(game, b) {
  const c = game.world.willow, s = game.state;
  if (game.busy || !b) return;
  hold(game);
  if (b.key === 'bio') {
    s.var[41] = 941;
    await scenes(c.bio, s); // (the scenes show him from z1field 942 on: $partyc << 24); switch 502, 概況 18
    roshiJoins(game, member(game, c.roshi.id));
    game.renderHud();
    game.busy = false;
    if (!(await game.startBattle(b.foes, true, { bgm: c.bgm.bio }))) return;
    s.flags.bioDone = true;
    game.save(true);
    game.renderHud(); // the next goal
    return;
  }
  s.var[41] = 951;
  await scenes(c.willow, s); // switches 128 / 185 / 26, variable 95 = 961
  game.busy = false;
  if (!(await game.startBattle(b.foes, true, { bgm: c.bgm.willow }))) return;
  hold(game);
  s.flags.willowDone = true;
  s.var[41] = 961;
  for (const m of s.party) heal(m); // all_charecter_recovery
  await scenes(c.after, s); // switch 520; z1field 962; variable 41 = 281
  s.sw[483] = true; // CE180 時の間新エリア開放 and its notice card
  eventCard(s, 67, 1);
  handOver(game);
  s.flags.willow = 'done';
  game.save(true);
  await card(c.end, 2400);
  toZ2(game);
}

// page 941: $partyc << 24 and get_skill 24,13 (Z戦士の絆 learned); z1field 941 also raises his moves' use counts
// (cha_tec_puls) and his 撃破数 ($cha_defeat_num[24] += 50)
function roshiJoins(game, roshi) {
  const c = game.world.willow, s = game.state;
  if (s.party.some((m) => m.id === roshi.id)) return;
  heal(roshi);
  delete s.bench[roshi.id];
  s.party.push(roshi);
  ensure(roshi);
  const k = c.roshi.skill;
  roshi.got[k] = roshi.set[k] = 1;
  roshi.sp[k] = game.world.growth.skills[k].sp;
  s.skillLv = s.skillLv || {};
  for (const [id, n] of Object.entries(c.roshi.uses)) s.skillLv[id] = Math.min(99999, (s.skillLv[id] || 0) + n);
  s.defeats = s.defeats || {};
  s.defeats[roshi.id] = Math.min(99999, (s.defeats[roshi.id] || 0) + 50);
}

// page 962 「Dr.ウィロー撃破後フリーザ編へ」: what Z2 starts from
function handOver(game) {
  const z = game.world.willow.z2, s = game.state;
  for (const id of z.party) member(game, id);
  setParty(s, z.party);
  for (const m of s.party) heal(m);
  s.var[40] = z.var40;
  s.progress = z.progress; // $game_progress
  s.var[41] = z.v41;
  s.var[42] = z.party[0];
  game.renderHud();
}

// until Z2 is built: the 待續 card, then the title screen with what the original opens next
async function toZ2(game) {
  const c = game.world.willow;
  if (game.startZ2a) return game.startZ2a(game); // Z2 first half (it plays 201+, the Z2 あらすじ, itself)
  game.busy = true;
  if (game.field) { game.field.paused = true; game.field.leave(); }
  await card(c.next, 2600);
  game.busy = false;
  game.showTitle(`${c.end}　～${c.next}～`, c.unlocks);
}

// ---------- development: index.html?dev=willow (the story) / willow51 (the fortress) / willowboss (only Willow) ----------
export function devWillow(game, step) {
  const w = game.world, s = game.newState();
  game.state = s;
  s.bench = {};
  const lv = { 3: 34, 4: 31, 5: 28, 6: 29, 7: 28, 8: 30, 9: 27, 10: 22 };
  for (const id of Object.keys(lv).map(Number)) {
    const m = makeMember(w, id);
    m.level = lv[id];
    m.exp = w.actors[id].exp[m.level];
    m.maxLv = m.level;
    applyLevel(w, m);
    heal(m);
    s.bench[id] = m;
  }
  const goku = s.bench[3];
  for (const id of w.chapter6.goku.skills) if (!goku.skills.includes(id)) goku.skills.push(id);
  goku.school = w.chapter6.goku.school;
  s.party = [];
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, saibaDone: true, nappaDone: true, vegetaDone: true });
  s.teams = [[4, 5], [6, 7], [8, 9]];
  Object.assign(s.var, { 41: 901, 43: 13, 51: 3 });
  Object.assign(s.sw, { 65: true, 483: true });
  s.zeni = 8000;
  if (step === 'willow') {
    s.party = [goku];
    delete s.bench[3];
    game.startField();
    startWillow(game);
    return;
  }
  setParty(s, w.willow.snow.party);
  s.var[43] = 17;
  s.flags.willow = 'fortress';
  moveTo(s, w.willow.inside);
  if (step === 'willowboss') {
    s.flags.bioDone = true;
    s.sw[502] = true;
    s.var[43] = 18;
    roshiJoins(game, member(game, w.willow.roshi.id));
    moveTo(s, { map: '51', x: 7, y: 7 });
  }
  game.startField();
  game.save(true);
}

// ?dev=ovwwillow (&timer): ?dev=willowboss plus what pages 901 / 941 set that the jump skips — switches 779 (琪琪) and
// 117 (龜仙人) for the combos 704 / 730 — 武泰斗の教え l1 for 龜仙人, and the move uses those combos need
registerZ3('ovwwillow', {
  dev(game, step) {
    if (step !== 'ovwwillow') return false;
    devWillow(game, 'willowboss');
    const s = game.state;
    Object.assign(s.sw, { 115: true, 117: true, 779: true });
    const roshi = s.party.find((m) => m.id === 24);
    if (roshi) { ensure(roshi); roshi.typ = [687, 13, 39]; } // (get_typical_skill 24: lv 9 武泰斗の教え, 3 Z戦士の絆, 6 かなしばり)
    s.skillLv = Object.assign(s.skillLv || {}, { 1: 10, 5: 50, 62: 40, 72: 40, 101: 10, 226: 30 });
    return true;
  },
});

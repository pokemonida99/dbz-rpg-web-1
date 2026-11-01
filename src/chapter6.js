// Chapter 6 (界王修行・賽亞人篇): the end of Z1, driven by world.chapter6 (tools/build_chapter6.py).
//   after Garlic Jr. (chapter 5 ends with the 一星球) → King Kai's last training (map 14, Goku alone: the squares are
//   battles against King Kai, his HP carrying over) → Shenron revives Goku → the Saiyans land → the Z fighters on
//   map 15 (栽培人・那巴・貝吉塔; Goku arrives before the Saibamen or before Nappa, by how many tries King Kai took;
//   琪琪 may join) → Vegeta flees → the Z1 ending film (src/ending.js) → 「Z1 完」.
// state.flags.ch6 tracks the step: 'kaio' → 'earth' → 'done'.
import { input, say, toast, audio } from './core.js?v=20261101-2006';
import { scenes, setParty, moveTo, enterMap, card } from './chapter2.js?v=20261101-2006';
import { makeMember, applyLevel } from './party.js?v=20261101-2006';
import { runEvent } from './events.js?v=20261101-2006';
import { eventCard } from './items.js?v=20261101-2006';
import { playShenron, playZ1Ending } from './ending.js?v=20261101-2006';

const MAPS = ['14', '15'];
export const isChapter6Map = (s) => MAPS.includes(s.map);

export function chapter6Goal(world, s) {
  const c = world.chapter6;
  if (!c || !s.flags.ch6) return undefined;
  return s.flags.ch6 === 'done' ? '' : c.goals[s.map];
}

const heal = (m) => { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; };
function member(game, id) {
  const s = game.state;
  s.bench = s.bench || {};
  const inParty = s.party.find((m) => m.id === id);
  return inParty || s.bench[id] || (s.bench[id] = makeMember(game.world, id));
}

// right after chapter 5 (the 一星球): page 127, second half — King Kai, then Goku alone on map 14
export async function startChapter6(game) {
  const c = game.world.chapter6, s = game.state;
  game.busy = true;
  game.field.paused = true;
  game.field.leave();
  await card(c.title, 2200);
  member(game, 3);
  await scenes(c.kaio, s); // z1field 128 sets $partyc = [3] and heals him
  setParty(s, c.kaioMap.party);
  heal(s.party[0]);
  moveTo(s, c.kaioMap);
  s.flags.ch6 = 'kaio';
  enterMap(game);
}

// a save made after chapter 5 but before this chapter existed
export function resumeChapter6(game) {
  const s = game.state;
  if (game.world.chapter6 && s.flags.ch5 === 'done' && !s.flags.ch6) { startChapter6(game); return true; }
  return false;
}

export function chapter6Spot(game, poi) {
  if (poi.chapter === 'kaioBattle') return kaioBattle(game);
  if (poi.chapter === 'chichi') return chichi(game);
  return null;
}

// ---------- map 14: the battles against King Kai (page 130 / 131, battle_process 130) ----------
async function kaioBattle(game) {
  const c = game.world.chapter6, s = game.state, w = game.world;
  s.var[51] = (s.var[51] || 0) + 1; // tries; z1field 130
  if (!s.sw[61]) { s.var[52] = w.enemies[c.kaioFoe].maxhp; s.sw[61] = true; }
  const won = await game.startBattle([c.kaioFoe], true, { bgm: c.kaioBgm, loseOk: true, foeHp: [s.var[52]] });
  if (!won) { // all.rb 47970: his HP is kept, Goku is healed and back on the map
    const b = game.lastBattle;
    s.var[52] = Math.max(1, b ? b.foes[0].hp : s.var[52]);
    s.sw[62] = true;
    for (const m of s.party) heal(m);
    game.renderHud();
    toast(c.kaioLose);
    return;
  }
  await afterKaio(game);
}

// page 132 (CE14, CE12), the Kame House and the balls → map 117 (Shenron) → page 135 → map 15
async function afterKaio(game) {
  const c = game.world.chapter6, s = game.state;
  game.busy = true;
  game.field.paused = true;
  game.field.leave();
  s.var[41] = 132;
  for (let id = 2; id <= 8; id++) eventCard(s, id, -99); // CE14: the dragon balls are used
  learnKaioken(game, member(game, 3)); // CE12
  heal(member(game, 3));
  await scenes(c.kaioWin, s);
  await playShenron(game.world);
  s.var[41] = 135;
  s.sw[872] = true;
  await scenes(c.revive, s); // gives 喜歡角色變更; z1field 144 sets the six on Earth
  s.bench = s.bench || {};
  const ids = c.earth.party;
  for (const id of ids) heal(member(game, id));
  setParty(s, ids);
  s.var[42] = ids[0];
  moveTo(s, c.earth);
  s.flags.ch6 = 'earth';
  enterMap(game);
}

// CE12 界王様の修行終了: Goku becomes 界 school, learns 界王拳, 界王拳・かめはめ波 and 元気玉
function learnKaioken(game, goku) {
  const g = game.world.chapter6.goku;
  goku.school = g.school;
  for (const id of g.skills) if (!goku.skills.includes(id)) goku.skills.push(id);
}

// ---------- map 15 ----------
// 145 琪琪: her cards; she joins (actor 10) when Gohan leads before Goku is back, or Goku leads after
async function chichi(game) {
  const s = game.state;
  s.var[42] = s.party[0].id;
  const had = !!s.sw[69];
  audio.playBgm('Z1 イベント1');
  await runEvent(game.world.events['145'], s);
  game.field.enter();
  if (s.sw[69] && !had && !s.party.some((m) => m.id === 10)) {
    const m = member(game, 10);
    heal(m);
    delete s.bench[10];
    s.party.push(m);
    audio.se('Z1 アイテム取得', 80);
    toast('琪琪加入了隊伍！');
  }
}

// CE11 悟空到着 (+ CE13 before Nappa, + CE12): Goku flies in and joins at the front
async function gokuArrives(game) {
  const c = game.world.chapter6, s = game.state;
  const goku = member(game, 3);
  learnKaioken(game, goku);
  heal(goku);
  await scenes(c.gokuArrives, s);
  delete s.bench[3];
  s.party.unshift(goku);
  s.sw[65] = true;
  s.var[42] = 3;
  s.skillLv = s.skillLv || {};
  for (const [id, n] of Object.entries(c.goku.uses)) s.skillLv[id] = Math.min(99999, (s.skillLv[id] || 0) + n); // cha_tec_puls
}

// the three fights of map 15 (pages 147 / 150 / 154, battle_process 149 / 151 / 155), then the ending (156-160)
export async function chapter6Boss(game, b) {
  const c = game.world.chapter6, s = game.state;
  if (game.busy || !b) return;
  game.busy = true;
  game.field.paused = true;
  input.dx = input.dy = 0;
  game.field.leave();
  s.var[41] = { saibamen: 147, nappa: 150, vegeta: 154 }[b.key];
  await scenes(c[b.key], s);
  const early = (s.var[51] || 0) <= 5;
  if (!s.sw[65] && ((b.key === 'saibamen' && early) || (b.key === 'nappa' && !early))) await gokuArrives(game);
  game.renderHud();
  game.busy = false;
  const opts = c.bgm[b.key] ? { bgm: c.bgm[b.key] } : { eventBgm: true }; // the Saibamen: an event battle's default music
  const won = await game.startBattle(b.foes, true, opts);
  if (!won) return;
  s.flags[b.flag] = true;
  if (b.key !== 'vegeta') { game.save(true); return; }
  game.busy = true;
  game.field.paused = true;
  game.field.leave();
  s.var[41] = 156;
  await scenes(c.after, s);
  for (const m of s.party) heal(m);
  s.sw[483] = true; // CE180 時の間新エリア開放 (and its notice card)
  eventCard(s, 67, 1);
  s.flags.ch6 = 'done';
  game.save(true);
  await playZ1Ending(game.world);
  s.var[41] = 901; // z1_ed: on to the Willow chapter in the original
  game.save(true);
  game.busy = false;
  await card(c.end, 2400);
  game.showTitle(c.end, c.unlocks);
}

// ---------- development: jump to this chapter (index.html?dev=ch6 / ch6earth) ----------
// the preceding chapters are built on other branches; this makes a plausible state at the hand-over point
export function devChapter6(game, step) {
  const w = game.world;
  const s = game.newState();
  game.state = s;
  s.bench = {};
  const lv = { 3: 30, 4: 26, 5: 22, 6: 24, 7: 23, 8: 25, 9: 22 };
  for (const id of [3, 4, 5, 6, 7, 8, 9]) {
    const m = makeMember(w, id);
    m.level = lv[id];
    m.exp = w.actors[id].exp[m.level];
    m.maxLv = m.level;
    applyLevel(w, m);
    heal(m);
    s.bench[id] = m;
  }
  s.party = [];
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true });
  s.teams = [[4, 5], [6, 7], [8, 9]];
  s.var[43] = 9;
  s.zeni = 5000;
  if (step === 'ch6earth' || step === 'ch6vegeta') {
    s.var[43] = 11;
    s.var[51] = step === 'ch6vegeta' ? 7 : 3;
    learnKaioken(game, s.bench[3]);
    setParty(s, w.chapter6.earth.party);
    moveTo(s, w.chapter6.earth);
    s.flags.ch6 = 'earth';
    if (step === 'ch6vegeta') { s.flags.saibaDone = s.flags.nappaDone = true; s.sw[66] = s.sw[67] = true; moveTo(s, { map: '15', x: 53, y: 7 }); }
    game.startField();
    game.save(true);
    return;
  }
  s.party = [s.bench[3]];
  delete s.bench[3];
  game.startField();
  startChapter6(game);
}

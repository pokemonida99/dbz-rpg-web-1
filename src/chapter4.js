// Chapter 4 (古雷格利修行・吉加篇): what follows Nikki in the original, driven by world.chapter4 (tools/build_chapter4.py).
//   end of chapter 3 → King Kai's planet again (map 11, Goku alone): the training squares run the Gregory training
//   (src/gregorytraining.js) → King Kai, the west pair (map 12, the Ginger area) → 吉加 → everyone gathers at
//   Garlic's castle → end of chapter; the Garlic area (map 13) is the next chapter (game.startChapter5).
// state.flags.ch4 tracks the step: 'gregory' → 'west' → 'done'.
import { input } from './core.js?v=20261102-1935';
import { scenes, setParty, moveTo, enterMap, card } from './chapter2.js?v=20261102-1935';
import { gregoryTraining } from './gregorytraining.js?v=20261102-1935';

const MAPS = ['11', '12'];

export function chapter4Goal(world, s) {
  const c = world.chapter4;
  if (!c || !s.flags.ch4) return undefined;
  return s.flags.ch4 === 'done' ? '' : c.goals[s.map];
}

// right after 「第三章 完」: page 104 has already sent Goku to King Kai's planet (map 11 at 13,3; variable 41 = 108)
export async function startChapter4(game) {
  const c = game.world.chapter4, s = game.state;
  game.busy = true;
  game.field.paused = true;
  game.field.leave();
  await card(c.title, 2200);
  setParty(s, c.gregory.party);
  moveTo(s, c.gregory);
  s.flags.ch4 = 'gregory';
  enterMap(game);
}

// a save from before this chapter existed, stopped after Nikki
export function resumeChapter4(game) {
  const s = game.state;
  if (game.world.chapter4 && s.flags.ch3 === 'done' && !s.flags.ch4) { startChapter4(game); return true; }
  return false;
}

// field spots with `chapter` set on these maps (the Gregory training squares)
export function chapter4Spot(game, poi) {
  return poi.chapter === 'gregory' ? gregory(game) : null;
}

async function gregory(game) {
  const c = game.world.chapter4, s = game.state;
  game.field.leave();
  const r = await gregoryTraining(game);
  if (r !== 'won') { game.field.enter(); return; }
  // page 109: King Kai, then the west pair sets off (z1field 110: party = variables 49, 50; 概況 +1)
  const west = s.teams[2];
  s.sw[50] = west.includes(4) && west.includes(5); // z1field 86: Piccolo and Gohan get their own scene
  s.var[43] = (s.var[43] || 0) + 1;
  await scenes(c.afterTraining, s); // (Goku is still the party here: King Kai talks to him first)
  setParty(s, west);
  for (const m of s.party) { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; } // $chadead = [false, false]
  moveTo(s, c.west);
  s.flags.ch4 = 'west';
  enterMap(game);
}

export const isChapter4Map = (s) => MAPS.includes(s.map);

// 吉加 (map 12): page 112, battle_process 113 (吉加 with 哈布 and 西納蒙), page 114 and the gathering (z1field 116)
export async function chapter4Boss(game) {
  const c = game.world.chapter4, s = game.state, b = game.world.bosses[s.map];
  if (game.busy) return;
  game.busy = true;
  game.field.paused = true;
  input.dx = input.dy = 0;
  await scenes(c.before, s);
  game.busy = false;
  const won = await game.startBattle(b.foes || [b.enemy], true);
  if (!won) return;
  game.busy = true;
  game.field.paused = true;
  s.flags[b.flag] = true;
  await scenes(c.after, s);
  // z1field 116: all six gather at Garlic's castle (all_charecter_recovery); the next chapter puts them on map 13
  for (const id of c.gather) {
    const m = s.bench[id] || s.party.find((p) => p.id === id);
    if (m) { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; }
  }
  s.var[41] = 117;
  s.flags.ch4 = 'done';
  game.save(true);
  game.busy = false;
  await card(c.end, 2000);
  if (game.startChapter5) return game.startChapter5(game); // the Garlic area (src/chapter5.js)
  game.showTitle(c.end);
}

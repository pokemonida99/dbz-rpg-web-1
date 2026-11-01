// Chapter 3 (界王星・尼奇篇): what follows Sansho in the original, driven by world.chapter3 (tools/build_chapter3.py).
//   end of chapter 2 → King Kai's planet (map 9, Goku alone): the training squares run the Bubbles training
//   (src/kaiotraining.js) → King Kai, the east pair (map 10, the Nikki area) → 尼奇 → Goku's second training is
//   announced → end of chapter.
// state.flags.ch3 tracks the step: 'kaio' → 'east' → 'done'.
import { input } from './core.js?v=20261101-1922';
import { scenes, setParty, moveTo, enterMap, card } from './chapter2.js?v=20261101-1922';
import { bubblesTraining } from './kaiotraining.js?v=20261101-1922';

const MAPS = ['9', '10'];

export function chapter3Goal(world, s) {
  const c = world.chapter3;
  if (!c || !s.flags.ch3) return undefined;
  return s.flags.ch3 === 'done' ? '' : c.goals[s.map];
}

// right after 「第二章 完」: page 94 has already sent Goku to King Kai's planet (map 9 at 7,3)
export async function startChapter3(game) {
  const c = game.world.chapter3, s = game.state;
  game.busy = true;
  game.field.paused = true;
  game.field.leave();
  await card(c.title, 2200);
  setParty(s, c.kaio.party);
  moveTo(s, c.kaio);
  s.flags.ch3 = 'kaio';
  enterMap(game);
}

// a save from before this chapter existed, stopped after Sansho
export function resumeChapter3(game) {
  const s = game.state;
  if (game.world.chapter3 && s.flags.ch2 === 'done' && !s.flags.ch3) { startChapter3(game); return true; }
  return false;
}

// field spots with `chapter` set on these maps (the Bubbles training squares)
export function chapter3Spot(game, poi) {
  return poi.chapter === 'bubbles' ? bubbles(game) : null;
}

async function bubbles(game) {
  const c = game.world.chapter3, s = game.state;
  game.field.leave();
  const r = await bubblesTraining(game);
  if (r !== 'won') { game.field.enter(); return; }
  // page 99: King Kai, then the east pair sets off (z1field 100: party = variables 47, 48; 概況 +1)
  const east = s.teams[1];
  s.sw[50] = east.includes(4) && east.includes(5); // z1field 86: Piccolo and Gohan get their own scene
  s.var[43] = (s.var[43] || 0) + 1;
  setParty(s, east);
  for (const m of s.party) { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; } // $chadead = [false, false]
  await scenes(c.afterBubbles, s);
  moveTo(s, c.east);
  s.flags.ch3 = 'east';
  enterMap(game);
}

export const isChapter3Map = (s) => MAPS.includes(s.map);

// 尼奇 (map 10): page 102, battle_process 103 (尼奇 with 賈斯敏 and 西納蒙), page 104
export async function chapter3Boss(game) {
  const c = game.world.chapter3, s = game.state, b = game.world.bosses[s.map];
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
  s.flags.ch3 = 'done';
  game.save(true);
  game.busy = false;
  await card(c.end, 2000);
  game.showTitle(c.end);
}

// Z2, first half (フリーザ編 前半), driven by world.z2a (tools/build_z2a.py): the original's story pages of Map007
// event 2 (variable 41 = the page), their scenes (143_Event_Main.rb z1field, SCENES below), the spots of
// 145_Event_Check.rb (world.pois, `page`), battle_process (world.z2a.battles) and the mini-games.
//   Z2-1 前往那美克星！ space (map 17) → Namek (18) and the cave (22): キュイ, the village, Frieza's gang (fleeing
//        from Dodoria, src/z2shoot.js), Dodoria.
//   Z2-2 悟空出擊！ Goku alone in space (23) and the gravity room (20, src/gravitytraining.js); Gohan's party on Namek
//        (24): the village and the pond (src/z2pond.js) in either order, each sending the story back to Goku; カナッサ星;
//        Piccolo with King Kai (21).
//   Z2-3 大長老 the Grand Elder's house, Vegeta joins, Zarbon twice, the last ball (26) → the second half (game.startZ2b).
// state.flags.z2a: 'on' while in this part, 'done' after page 445. Variable 40 = 1 (Z2 art, src/era.js).
import { input, audio, toast } from './core.js?v=20261102-2150';
import { scenes, setParty, moveTo, enterMap, card } from './chapter2.js?v=20261102-2150';
import { makeMember, applyLevel, levelUp } from './party.js?v=20261102-2150';
import { eventCard } from './items.js?v=20261102-2150';
import { addScenes, playScenes } from './cutscene.js?v=20261102-2150';
import { shootingGame } from './z2shoot.js?v=20261102-2150';
import { gravityTraining } from './gravitytraining.js?v=20261102-2150';
import { pondPuzzle } from './z2pond.js?v=20261102-2150';
import { applyEra } from './era.js?v=20261102-2150';
import { newHand } from './battle.js?v=20261102-2150';

const MAPS = ['17', '18', '20', '21', '22', '23', '24', '26'];
export const isZ2aMap = (s) => MAPS.includes(s.map) && !!s.flags.z2a;

// ---------- the scenes (z1field 201-219 あらすじ, 301-445, 503-515, 601) ----------
const pic = (n) => `Graphics/Pictures/${n}.PNG`;
const BG = (n) => pic(`Z2_背景_${n}`), ARA = (n) => pic(`Z2_あらすじ${n}`);
const P2 = pic('Z2_顔味方'), E2 = pic('Z2_顔イベント'), F2 = pic('Z2_顔敵'), CARD = pic('顔カード');
const GROUND = BG('ナメック星_地上'), HOUSE = BG('ナメック星_家'), ROCKS = BG('岩場'), ROOM = BG('病室'), SHIP = BG('宇宙船と悟空');
const KAIO = BG('界王星'), INSIDE = BG('フリーザ_宇宙船_内部');
const PARTY = [5, 6, 7, 8, 9];
const DENDE = [CARD, 14, 0, 1, 1], DENDE_UNDER = [CARD, 14, 0, 1, 1]; // [sheet, row, dx, line, column]: 顔カード column 1 = Z2
const card2 = (row) => [CARD, row, 0, 1]; // a 顔カード face in the scene (foe: [sheet, row, dy, column])
// Frieza and his men (326-335): the 216×170 picture over the scene (shifted up 21 px so its middle fits the 128-high
// window here); the original has Dodoria and Zarbon beside it, which on a phone would be off the screen, so they
// stand at the left and right edges of the scene window, over the picture's sides
const FRIEZA = (dodoria = true) => ({
  big: [BG('フリーザ'), 212, 25, [0, 0, 216, 170]],
  adds: [...(dodoria ? [[F2, 13, -98, 0]] : []), [F2, 15, 98, 0]],
});
const up = { next: '+' };
const SCENES = {
  201: { pic: ARA('1_1'), ...up }, 202: { pic: ARA('1_2'), ...up }, 203: { pic: ARA('1_3'), se: 'Z2 宇宙船移動', ...up },
  204: { pic: ARA('1_4'), ...up }, 205: { pic: ARA('1_5'), ...up }, 206: { pic: ARA('1_6'), se: 'Z2 宇宙船移動', ...up },
  207: { pic: ARA('1_7'), ...up }, 208: { pic: ARA('1_8'), se: 'Z2 宇宙船移動', ...up },
  211: { ...up }, 212: { pic: ARA('1_8'), ...up },
  213: { pic: GROUND, foe: [F2, 23], ...up }, 214: { pic: GROUND, foe: [P2, 9], ...up }, 215: { pic: SHIP, ...up },
  216: { pic: GROUND, foe: card2(14), ...up }, 217: { pic: BG('最長老の家'), ...up }, 218: { pic: INSIDE, foe: [F2, 23] },
  219: { pic: GROUND, foe: [P2, 10], ...up },
  // Z2-1
  301: { bgm: 'DB2 イベント02', pic: BG('謎の宇宙船'), out: true, ...up },
  302: { pic: BG('謎の宇宙船_内部'), out: true, ...up },
  303: { bgm: 'GBZ1 イベント1', pic: BG('壁'), out: true, ...up },
  304: { bgm: 'DB3 イベント04', pic: BG('謎の宇宙船_内部'), out: true, ...up },
  305: { pic: BG('謎の惑星'), out: true, ...up },
  306: { bgm: 'DB2 イベント01', pic: GROUND, foe: [E2, 1], out: true, ...up },
  307: { fadeout: true, bgm: 'DB3 戦闘前', pic: GROUND, foe: [E2, 2], out: true, ...up, fadein: true },
  309: { bgm: 'DB2 イベント01', pic: GROUND, foe: [E2, 2], out: true },
  310: { pic: BG('ナメック星到着'), out: true, ...up },
  311: { fadeout: true, bgm: 'GBZ2 イベント2', pic: GROUND, foe: card2(8), out: true, ...up, fadein: true },
  312: { pic: BG('ナメック星_宇宙船落下'), out: true, ...up },
  313: { fadeout: true, bgm: 'GBZ2 イベント4', pic: GROUND, foe: [P2, 9], ...up, fadein: true },
  314: { fadeout: true, pic: GROUND, foe: [F2, 10], ...up, fadein: true },
  315: { fadeout: true, pic: GROUND, foe: card2(8), out: true, ...up, fadein: true },
  323: { bgm: 'DB3 戦闘前', pic: ROCKS, foe: [F2, 10], out: true, ...up },
  325: { bgm: 'DB3 イベント08', pic: HOUSE, foe: [E2, 1], out: true, ...up },
  503: { bgm: 'DB3 イベント08', pic: HOUSE, foe: [E2, 7], party: (v, sw, p) => [...p, 15], out: true, faces: [DENDE_UNDER], ...up },
  326: { bgm: 'ZD イベント1', ...FRIEZA(), faces: [[E2, 1, -32, 0], [E2, 4, 32, 0], DENDE], ...up },
  327: { ...up }, // (the flash)
  328: { ...FRIEZA(), faces: [[E2, 1, -32, 0], DENDE], ...up },
  329: { ...FRIEZA(), faces: [[E2, 1, -32, 0], [CARD, 6, 32, 0, 1], DENDE], ...up }, // the six-star ball
  330: { ...FRIEZA(), faces: [DENDE], ...up },
  331: { ...up },
  332: { ...FRIEZA(), faces: [[P2, 2, 0, 0], DENDE], ...up },
  333: { ...FRIEZA(), out: true, faces: [DENDE], ...up },
  334: { ...FRIEZA(), ...up },
  335: { ...FRIEZA(false), ...up },
  336: { bgm: 'GBZ2 戦闘終了', pic: GROUND, foe: card2(14), out: true, ...up },
  337: { bgm: 'DB3 戦闘前', pic: ROCKS, out: true, ...up },
  338: { pic: HOUSE, foe: card2(14), out: true, ...up },
  339: { bgm: 'GBZ2 イベント8', pic: GROUND, foe: [F2, 13], out: true, ...up },
  341: { bgm: 'GBZ2 イベント5', pic: GROUND, foe: card2(14), out: true, ...up },
  342: { bgm: 'GBZ1 イベント6', pic: GROUND, foe: card2(8), out: true, ...up },
  // Z2-2
  401: { bgm: 'DB3 イベント03', pic: ROOM, foe: [E2, 3], ...up },
  402: { pic: ROOM, foe: [E2, 3], faces: [[CARD, 9, 0, 0, 1]], ...up },
  403: { pic: ROOM, foe: [E2, 3], faces: [[CARD, 9, -32, 0, 1], [CARD, 23, 32, 0, 1]], ...up },
  404: { pic: ROOM, foe: [P2, 0], faces: [[CARD, 9, -32, 0, 1], [CARD, 23, 32, 0, 1]], ...up },
  405: { fadeout: true, pic: SHIP, party: [3], ...up, fadein: true },
  411: { bgm: 'GBZ2 イベント3', pic: SHIP, party: (v, sw) => (sw[107] ? [...PARTY, 15] : PARTY), ...up },
  412: { fadeout: true, bgm: 'DB3 イベント02', pic: GROUND, foe: card2(14), out: true, ...up, fadein: true },
  504: { party: PARTY, pic: GROUND, foe: [E2, 7], out: true, ...up },
  505: { fadeout: true, pic: GROUND, foe: card2(14), out: true, ...up, fadein: true },
  515: { party: PARTY, fadeout: true, bgm: 'DB3 イベント02', pic: GROUND, foe: card2(14), out: true, ...up, fadein: true },
  413: { bgm: 'DB3 イベント08', pic: HOUSE, foe: [E2, 4], out: true, ...up },
  414: { bgm: 'DB3 イベント08', pic: HOUSE, foe: card2(14), out: true, ...up },
  415: { bgm: 'GBZ2 イベント3', pic: SHIP, party: [3], ...up },
  416: { pic: KAIO, next: 411 },
  417: { pic: KAIO, foe: [P2, 1], ...up },
  419: { bgm: 'DB3 イベント03', pic: GROUND, foe: card2(0), out: true, ...up },
  420: { bgm: 'GBZ2 戦闘終了', pic: GROUND, foe: card2(3), out: true, ...up },
  422: { party: [3], pic: BG('謎の惑星'), out: true, ...up },
  423: { bgm: 'DB3 イベント07', pic: BG('惑星_建物'), foe: [P2, 0], ...up },
  424: { pic: BG('惑星_建物'), foe: [F2, 5], out: true, ...up },
  426: { bgm: 'DB2 イベント01', pic: BG('カナッサ星_地上'), ...up, out: true },
  427: { pic: BG('謎の惑星と宇宙船'), ...up, out: true },
  428: { bgm: 'GBZ2 イベント3', pic: SHIP, ...up, party: [4] },
  429: { fadeout: true, bgm: 'GBZ1 界王修行', pic: KAIO, ...up, out: true, fadein: true },
  430: { bgm: 'GBZ2 戦闘終了', pic: KAIO, ...up, out: true },
  431: { fadeout: true, bgm: 'DB3 イベント02', pic: GROUND, foe: card2(14), party: PARTY, out: true, ...up, fadein: true },
  432: { ...up, fadeout: true, fadein: true, bgm: 'GBZ2 イベント8' },
  433: { pic: INSIDE, foe: [F2, 23], faces: [[F2, 15, 0, 0]], ...up },
  434: { pic: INSIDE, foe: [F2, 23], ...up },
  // Z2-3
  601: { foe: [E2, 1], out: true },
  435: { bgm: 'DB2 イベント03', pic: GROUND, foe: [P2, 10], out: true, faces: [DENDE_UNDER], ...up },
  436: { pic: GROUND, foe: card2(14), out: true, ...up },
  437: { fadeout: true, pic: BG('最長老の家'), out: true, faces: [DENDE_UNDER], ...up, fadein: true },
  438: { fadeout: true, pic: GROUND, foe: [P2, 9], out: true, ...up, fadein: true },
  439: { pic: GROUND, foe: [F2, 15], party: (v, sw, p) => (p.includes(12) ? p : [...p, 12]), out: true, ...up },
  441: { pic: GROUND, foe: [F2, 15], out: true, ...up },
  442: { pic: GROUND, foe: [F2, 16], out: true, ...up },
  444: { pic: GROUND, foe: [P2, 9], party: (v, sw, p) => p.filter((id) => id !== 12), out: true, ...up }, // Vegeta faces them
  445: { pic: GROUND, foe: card2(2), party: (v, sw, p) => (p.includes(12) ? p : [...p, 12]), out: true, ...up },
};
addScenes(SCENES, [308, 324, 340, 425, 440, 443]);

// ---------- helpers ----------
const Z = (game) => game.world.z2a;
const heal = (m) => { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; };
function member(game, id) {
  const s = game.state;
  s.bench = s.bench || {};
  return s.party.find((m) => m.id === id) || s.bench[id] || (s.bench[id] = makeMember(game.world, id));
}
function stop(game) {
  game.busy = true;
  game.field.paused = true;
  input.dx = input.dy = 0;
  game.field.leave();
}
function resume(game) { // back on the same map (XFER to the stored position)
  game.renderHud();
  game.field.enter();
  game.field.paused = false;
  game.busy = false;
  game.save(true);
}
// $partyc = ids, everyone healed (all_charecter_recovery)
function party(game, ids) {
  const s = game.state;
  for (const id of ids) member(game, id);
  setParty(s, ids);
  for (const m of s.party) heal(m);
}
function go(game, to) {
  moveTo(game.state, to);
  enterMap(game);
}
const play = (game, v) => scenes([{ nodes: Z(game).pages[v] }], game.state);
const playPart = (game, v, k) => scenes([{ nodes: Z(game).pages[v][k] }], game.state);
// battle_process: the battle of the page; won → variable 41 moves past it (the next page). false: lost (the game
// has gone back to the last save)
async function fight(game, no) {
  const b = Z(game).battles[no], s = game.state;
  game.busy = false;
  const won = await game.startBattle(b.foes, true, b.bgm ? { bgm: b.bgm } : { eventBgm: true });
  if (!won) return false;
  stop(game);
  s.var[41] = +no + 1;
  return true;
}
// cha_tec_puls / $cha_defeat_num for someone who joins with experience (the young Namekian, Vegeta)
function joinWith(game, who) {
  const s = game.state;
  s.skillLv = s.skillLv || {};
  for (const [id, n] of Object.entries(who.uses)) s.skillLv[id] = Math.min(99999, (s.skillLv[id] || 0) + n);
  s.defeats = s.defeats || {};
  s.defeats[who.id] = (s.defeats[who.id] || 0) + who.defeats;
}
function addMember(game, id) {
  const s = game.state;
  if (s.party.some((m) => m.id === id)) return;
  const m = member(game, id);
  delete s.bench[id];
  heal(m);
  s.party.push(m);
}
// CE180 時の間新エリア開放: the switch and the 通知！ card
function timeRoom(s) {
  s.sw[483] = true;
  eventCard(s, 67, 1);
}

// ---------- start (after the Willow chapter) ----------
export async function startZ2a(game) {
  const z = Z(game), s = game.state;
  if (!z) return false;
  game.busy = true;
  if (game.field) { game.field.paused = true; game.field.leave(); }
  s.var[40] = 1;
  s.flags.z2a = 'on';
  await applyEra(game);
  s.hand = newHand(game.world); // the Z2 card schools (create_card_i)
  await card(z.titles[0], 2200);
  // page 281: 概況 1 (CE15), Gohan's 大猿変身 becomes 爆裂ラッシュ, variable 43 = 21, Gohan leads, map 17 (4,4)
  s.var[43] = 21;
  audio.playBgm('Z2 あらすじ');
  await playScenes([{ bgm: 'Z2 あらすじ', nodes: z.recap['21'] }], s);
  const gohan = member(game, 5);
  if (gohan.skills.includes(51)) gohan.skills = gohan.skills.filter((id) => id !== 51).concat(52);
  s.var[17] = 0;
  s.var[42] = 5;
  s.sw[112] = false;
  party(game, z.party);
  go(game, z.start);
  return true;
}

// a save from right after the Willow chapter (flags.willow = 'done', src/willow.js hands over with variable 41 = 201)
// made before this part existed: start it
export function resumeZ2a(game) {
  const s = game.state;
  if (game.world.z2a && s.flags.willow === 'done' && !s.flags.z2a) { startZ2a(game); return true; }
  if (s.flags.z2a === 'done' && !s.flags.z2b && game.startZ2b) { game.startZ2b(game); return true; } // saved at page 445, before the second half began
  return false;
}

// the 概況 of variable 43 = 21-30 (CE15-23, 25: page 201 sets variable 41 to 211 first), from the field menu
export function storyScenes(game) {
  const z = Z(game), s = game.state, v = (s.var || {})[43];
  if (!z || !z.recap[v]) return null;
  const keep = s.var[41];
  return playScenes([{ bgm: 'Z2 あらすじ', nodes: z.recap[v] }], { ...s, var: { ...s.var }, sw: { ...s.sw } }).then(() => { s.var[41] = keep; });
}

// the battle background: the strip of Z2_戦闘_背景 for the tile under the player (set_battle_map)
export function z2aBackdrop(game) {
  const s = game.state, z = Z(game);
  if (!z || !isZ2aMap(s)) return null;
  const m = game.world.maps[s.map], i = Math.floor(s.x / 32) + Math.floor(s.y / 32) * m.w;
  const row = z.backdrops[m.layers[0][i]] ?? 0;
  return `bg/z2_battle_${row}.png`;
}

export function z2aGoal(world, s) {
  if (!world.z2a || !isZ2aMap(s)) return undefined;
  return world.z2a.goals[s.map];
}

// ---------- the spots (145_Event_Check.rb) ----------
export function z2aSpot(game, poi) {
  if (poi.chapter !== 'z2a') return null;
  return spot(game, poi.page);
}

async function spot(game, p) {
  const z = Z(game), s = game.state;
  stop(game);
  switch (p) {
    case 301: // the mysterious ship (sw81)
      await play(game, 301);
      return resume(game);
    case 305: // the unknown planet: the Namekian's drink, the aliens → battle 308 → 309 (sw82)
      await playPart(game, 305, 0);
      if (!(await fight(game, 308))) return;
      await play(game, 309);
      return resume(game);
    case 310: // Namek
      await play(game, 310);
      return go(game, z.to['310']);
    case 321: return go(game, z.to['321']); // into the cave
    case 322: return go(game, z.to['322']); // out of it
    case 323: // キュイ → battle 324; after it, Dodoria shows up if the village is done (337)
      await playPart(game, 323, 0);
      if (!(await fight(game, 324))) return;
      await playPart(game, 323, 1);
      if (s.var[41] === 337) await play(game, 337);
      return resume(game);
    case 325: { // the village: the four-star ball (sw86); the young Namekian (503) once Frieza's gang came (sw96)
      const had = !!s.sw[107];
      await play(game, 325);
      if (s.sw[107] && !had) {
        addMember(game, z.young.id);
        joinWith(game, z.young);
      }
      return resume(game);
    }
    case 326: { // Frieza's gang → fleeing from Dodoria (TBoss_Scene) → 336
      await play(game, 326);
      await shootingGame(game);
      await play(game, 336);
      const n = (s.var[53] || 0) * 10; // C 311: every member loses variable 53 × 10 HP (never below 1)
      if (n) for (const m of s.party) if ([5, 6, 7, 8, 9].includes(m.id) && m.hp > 0) m.hp = Math.max(1, m.hp - n);
      return go(game, z.to['336']);
    }
    case 339: // Dodoria → battle 340 → 341 → Goku sets out (Z2-2)
      await playPart(game, 339, 0);
      if (!(await fight(game, 340))) return;
      await play(game, 341);
      timeRoom(s);
      s.var[324] = 15;
      s.var[41] = 401; // (no save here: a save between the battle and Goku's departure would load back on map 18 with Goku not yet sent off)
      await card(z.titles[1], 2200);
      await play(game, 401);
      party(game, [3]); // z1field 405
      s.var[42] = 3;
      return go(game, z.to['401']);
    case 410: return go(game, z.to['410']); // to the gravity room
    case 'gravity': return gravity(game);
    case 422: // カナッサ星 (sw93): the soldiers → battle 425 → 426 (the カナッサ星人 card)
      for (const m of s.party) heal(m); // z1field 422: all_charecter_recovery
      await playPart(game, 422, 0);
      if (!(await fight(game, 425))) return;
      await play(game, 426);
      return resume(game);
    case 413: { // the village of map 24 (sw89), the first time: the seven-star ball, then Goku again
      const again = !!s.sw[89];
      await play(game, 413);
      if (again) return resume(game);
      return gokuAgain(game);
    }
    case 419: { // the pond (sw85): one of six pond maps (CE79) → 420
      const again = !!s.sw[85];
      await play(game, 419);
      if (again) return resume(game);
      await pondPuzzle(game);
      stop(game);
      await play(game, 420);
      return gokuAgain(game);
    }
    case 601: { // the Namekian who explains the arena and the areas (the cards once, sw1309); not a story page
      const keep = s.var[41];
      await play(game, 601);
      s.var[41] = keep;
      return resume(game);
    }
    case 435: return grandElder(game);
    case 445: return lastBall(game);
  }
  return resume(game);
}

// 413 / 420 → 415 (the first of the two: King Kai and Piccolo too) or 421; Goku alone in space again
async function gokuAgain(game) {
  const z = Z(game), s = game.state;
  const v = s.var[41] === 415 ? 415 : 421;
  await play(game, v);
  party(game, [3]);
  s.var[42] = 3;
  return go(game, z.to[String(v)]);
}

// the training squares of maps 20 / 21: Scene_Db_Gravity_Training at the level of variable 43; finished, the map's
// autorun page (map 20 EV029, map 21 EV005) goes on with the story: 411 / 418 / 428 / 430
async function gravity(game) {
  const z = Z(game), s = game.state;
  const level = z.gravity[s.var[43]] ?? 2;
  const r = await gravityTraining(game, level);
  if (r === 'gameover') { await game.gameOver(); return; }
  if (r !== 'done' || String(z.gravity[s.var[43]]) !== String(level)) return resume(game);
  const [, page] = z.gravityDone[level];
  s.var[41] = page;
  if (page === 411) { // 20×: back to the Z fighters on Namek (the young Namekian leaves them, 504/505)
    await play(game, 411);
    party(game, z.party);
    return go(game, z.to['411']);
  }
  if (page === 418) { // 50×: Frieza's ship (432-434), then the Z fighters where they were (515)
    await play(game, 418);
    party(game, z.party);
    s.var[42] = 5;
    return go(game, s.sw[89] ? z.to.village : z.to.pond);
  }
  if (page === 428) { // 100×: Goku's training ends; Piccolo with King Kai (map 21)
    await play(game, 428);
    party(game, [4]);
    s.var[42] = 4;
    return go(game, z.to['428']);
  }
  // 430: Piccolo's training ends; the Z fighters set off for the Grand Elder (Z2-3)
  await play(game, 430);
  party(game, z.party);
  s.var[42] = 5;
  moveTo(s, s.sw[106] ? z.to.pond : z.to.village);
  game.save(true);
  await card(z.titles[2], 2200);
  return enterMap(game);
}

// 435-444: the Grand Elder (the potential, the one-star ball), Vegeta joins, Zarbon and his transformation → map 26
async function grandElder(game) {
  const z = Z(game), s = game.state, w = game.world;
  await playPart(game, 435, 0); // (Vegeta's moves, CE24, and the EXP are given in the middle of it)
  for (const id of [5, 6, 7, 8, 9]) { // C 315: +15000 EXP
    const m = member(game, id);
    m.exp += z.elderExp;
    levelUp(w, m);
  }
  const vegeta = member(game, z.vegeta.id);
  for (const id of w.actors[z.vegeta.id].skills) if (!vegeta.skills.includes(id)) vegeta.skills.push(id); // CE24
  addMember(game, z.vegeta.id); // z1field 439
  joinWith(game, z.vegeta);
  for (const m of s.party) heal(m);
  game.renderHud();
  if (!(await fight(game, 440))) return;
  await playPart(game, 441, 0);
  if (!(await fight(game, 443))) return;
  await play(game, 444);
  for (const m of s.party) heal(m);
  timeRoom(s);
  return go(game, z.to['444']);
}

// 445: Vegeta's ball at the pond of map 26 — every ball is theirs; the Ginyu Force lands → the second half
async function lastBall(game) {
  const s = game.state;
  await play(game, 445);
  s.flags.z2a = 'done';
  game.save(true);
  game.busy = false;
  if (game.startZ2b) return game.startZ2b(game);
  await card('Z2　前半　完', 2400);
  game.showTitle('Z2　前半　完', ['基紐特戰隊、弗利薩決戰（Z2 後半）']);
}

// ---------- development: index.html?dev=z2 / z2b / z2c / z2d (+ &timer in a hidden pane) ----------
// the Willow chapter is built on another branch: this makes the state it hands over (page 962: variable 40 = 1,
// $partyc = [5,6,7,8,9]) with plausible levels. z2: Z2-1 from its start; z2b: Goku at 401; z2c: Gohan's party back
// on Namek (411); z2d: Z2-3 (variable 43 = 29, map 24 by the elder's house)
export async function devZ2a(game, step) {
  const w = game.world;
  const s = game.newState();
  game.state = s;
  s.bench = {};
  const lv = { 3: 34, 4: 30, 5: 28, 6: 29, 7: 27, 8: 30, 9: 26 };
  for (const [id, l] of Object.entries(lv)) {
    const m = makeMember(w, +id);
    m.level = l;
    m.exp = w.actors[id].exp[l];
    m.maxLv = l;
    applyLevel(w, m);
    heal(m);
    s.bench[id] = m;
  }
  for (const id of [6, 7, 18]) if (!s.bench[3].skills.includes(id)) s.bench[3].skills.push(id); // after King Kai (Z1)
  s.bench[3].school = 3;
  s.party = [];
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6']) s.flags[k] = 'done';
  s.flags.willow = 'done';
  s.var[40] = 1;
  s.var[41] = 201; // (page 962 → 201, as src/willow.js hands over)
  s.zeni = 8000;
  for (let id = 2; id <= 8; id++) eventCard(s, id, -99); // the Earth's balls were used at the end of Z1 (CE14)
  game.startField();
  if (step === 'z2') { s.party = []; setParty(s, PARTY); return startZ2a(game); }
  s.flags.z2a = 'on';
  await applyEra(game);
  s.hand = newHand(w);
  const z = w.z2a;
  Object.assign(s.sw, { 81: true, 82: true, 86: true, 87: true, 96: true, 97: true });
  if (step === 'z2b') { // right after page 401: Goku alone in space
    s.var[43] = 23;
    s.var[41] = 401;
    timeRoom(s);
    setParty(s, [3]);
    moveTo(s, z.to['401']);
  } else if (step === 'z2c') {
    s.var[43] = 24;
    s.var[41] = 411;
    setParty(s, PARTY);
    moveTo(s, z.to['411']);
  } else {
    Object.assign(s.sw, { 85: true, 89: true, 90: true, 91: true, 92: true, 100: true, 106: true });
    s.var[43] = 29;
    s.var[41] = 430;
    setParty(s, PARTY);
    moveTo(s, { map: '24', x: 9, y: 9 });
  }
  game.startField();
  game.save(true);
}

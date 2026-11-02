// Z3 — the shared part (docs/z3-plan.md). The original's Z3 is Map007 event 5 「イベント実行Z3」 (variable 41 = the
// page), its scenes z1field 1100-1591, the spots of 145_Event_Check.rb and battle_process; tools/build_z3.py builds
// world.z3. Each chapter is its own file and registers itself here (registerZ3), so the chapters can be built on
// separate branches without touching each other:
//   z3a 第一章 集龍珠！        maps 33, 34, 35        1100 → 1160-1220 → Porunga
//   z3b 第二章 魔凶星篇        maps 78-82             1440-1571
//   z3c 第三章 弗利薩復仇・特南克斯 map 36             1230-1266
//   z3d 第四章 古拉來襲        maps 37, 38, 39        1266-1326 (+ the training mini-games, src/z3train.js)
//   z3e 第五章 人造人間        map 40                 1326-1420 → Z4 (variable 41 = 2001)
// state.flags.z3: the chapter being played ('z3a' … 'z3e', 'done'); state.flags.z3At: { ch, at } a story step to pick
// up again after loading (saved right before a story battle, as Z2 does). Variable 40 = 2 (the Z3 art, src/era.js).
import { input, setFaces } from './core.js?v=20261102-2129';
import { playScenes, addNodes } from './cutscene.js?v=20261102-2129';
import { setParty, moveTo, enterMap, card } from './chapter2.js?v=20261102-2129';
import { makeMember, levelUp } from './party.js?v=20261102-2129';
import { eventCard } from './items.js?v=20261102-2129';
import { setZ2Env } from './z2scenes.js?v=20261102-2129';
import { FORMS, isSuper } from './supersaiyan.js?v=20261102-2129';
import { applyEra } from './era.js?v=20261102-2129';
import { newHand } from './battle.js?v=20261102-2129';

export const Z3 = (game) => game.world.z3;
export const ORDER = ['z3a', 'z3b', 'z3c', 'z3d', 'z3e', 'z4a', 'z4b', 'z4c', 'z4d', 'z4e', 'z4f']; // (Z4 too: docs/z4-plan.md)

// ---------- the chapters ----------
// registerZ3('z3a', { maps: ['33', …], start(game), spot(game, poi), boss(game, b), resume(game, at), dev(game, step),
//   goal(world, s) }); every field but start is optional. poi.chapter names the chapter of a spot (world.pois).
const chapters = {};
export function registerZ3(key, ch) { chapters[key] = ch; }
const cur = (s) => (s.flags && chapters[s.flags.z3]) || null;

// the next chapter in the original's order (a chapter calls this when it ends); false while it isn't built yet
export async function nextZ3(game, key) {
  const k = ORDER[ORDER.indexOf(key) + 1];
  const s = game.state;
  if (k && chapters[k]) { s.flags.z3 = k; s.flags.z3At = null; return chapters[k].start(game); }
  // not built yet: the 待續 card, then the title screen (a load comes back here: resumeZ3)
  s.flags.z3 = k || 'done';
  s.flags.z3At = null;
  game.save(true);
  game.busy = false;
  const t = (Z3(game).titles || {})[k], part = String(k || key).startsWith('z4') ? 'Ｚ４' : 'Ｚ３';
  await card(t ? `${t}　待續` : `${part}　待續`, 2400);
  game.showTitle(t ? `${t}（待續）` : `${part}（待續）`);
  return false;
}

// ---------- hooks for src/main.js and src/z2b.js ----------
// after the Z2 ending (variable 40 = 2, 41 = 1100)
export async function startZ3(game) {
  if (!Z3(game) || !chapters.z3a) return false;
  const s = game.state;
  s.flags.z3 = 'z3a';
  s.flags.z3At = null;
  s.var[40] = 2;
  s.cardiMax = 10; // $cardi_max = 10 (all.rb 13946)
  s.sw[381] = true; // 悟空流派ボロボロフラグ
  await applyEra(game);
  s.hand = newHand(game.world); // the Z3 card schools
  chapters.z3a.start(game); // (not awaited: true = Z3 has taken over)
  return true;
}
// is that chapter there (Z3's ending hands over to Z4 once its first chapter is built)
export const hasChapter = (key) => !!chapters[key];
// a chapter by its key, outside ORDER (the 時之間 stories: src/timeroom.js startTrStory); false while it isn't built
export function startChapter(game, key) {
  const s = game.state;
  if (!chapters[key]) return false;
  s.flags.z3 = key;
  s.flags.z3At = null;
  chapters[key].start(game);
  return true;
}
export const isZ3Map = (s) => !!(cur(s) && (cur(s).maps || []).includes(s.map));
export function z3Spot(game, poi) {
  const ch = chapters[poi.chapter] || (/^z[34]/.test(String(poi.chapter)) && cur(game.state));
  return ch && ch.spot ? ch.spot(game, poi) : null;
}
export function z3Boss(game, b) { const ch = cur(game.state); return ch && ch.boss ? ch.boss(game, b) : null; }
export function z3Goal(world, s) {
  if (!world.z3 || !s.flags || !s.flags.z3) return undefined;
  if (s.flags.z3 === 'done') return '';
  const ch = cur(s);
  if (ch && ch.goal) return ch.goal(world, s);
  const g = world.z3.goals[s.map];
  return (g && typeof g === 'object' ? g[s.var[43]] : g) || '';
}
// a save made in Z3: the chapter picks up a story step (z3At) or nothing (the field is already there)
export function resumeZ3(game) {
  const s = game.state;
  if (!Z3(game) || !s.flags) return false;
  if (s.flags.z2b === 'done' && !s.flags.z3 && chapters.z3a) { startZ3(game); return true; } // a save from the Z2 待續 card
  const ch = cur(s);
  if (!ch) return false;
  setFaces({ ...game.world.faces });
  const at = s.flags.z3At;
  if (!at || !ch.resume) return false;
  begin(game);
  ch.resume(game, at);
  return true;
}
// the battle background: the strip of Z3_戦闘_背景 for the tile under the player (set_battle_map, all.rb 165998:
// scenario_progress >= 2 — the ground tile, the tile on layer 3, the map event standing there). A chapter may put its
// own table in world.z3.backdrops[map] = { tile id: row, default: row }.
export function z3Backdrop(game) {
  const s = game.state, z = Z3(game);
  if (!z || !isZ3Map(s)) return null;
  return z3BackdropAt(game);
}
// the same for whatever map the player is on (the 時之間 areas, src/tr_z3.js / src/tr_z4.js: set_battle_map with
// variable 301 ≥ 2 follows these tile rules); world.z3.backdrops[map] and tileEvents[map] apply when set
export function z3BackdropAt(game) {
  const s = game.state, z = Z3(game);
  if (!z) return null;
  const m = game.world.maps[s.map];
  const tx = Math.floor(s.x / 32), ty = Math.floor(s.y / 32), i = ty * m.w + tx;
  const t = z.backdrops[s.map];
  const row = t ? t[m.layers[0][i]] ?? t.default ?? 0 : battleMapId(m.layers[0][i], (m.layers[2] || [])[i] || 0, ((z.tileEvents || {})[s.map] || {})[`${tx},${ty}`], s);
  return `bg/z3_battle_${row}.png`;
}
function battleMapId(tile, top, ev, s) {
  if (tile === 1550) return 29; // セルゲームリング
  if (tile === 1543 || tile === 1551) return 0; // ナメック星エリア
  if (tile === 1575) return 32; // ナメック星海エリア
  if (tile === 1552 || tile === 1555) { // 平原
    if (top === 274 || top === 275) return 4;
    if (ev && ev[0] === 'animap1' && ev[1] === 0 && ev[2] === 2) return 2; // 森
    if (ev && ev[0] === 'animap1' && ev[1] === 1 && ev[2] === 6) return 9; // 林
    return 1;
  }
  if (tile === 1553) return [556, 553, 544, 540, 536, 552, 512, 516, 522, 524, 548].includes(top) ? 29 : 5; // 砂漠
  if (tile === 1554) return top === 276 ? 7 : 6; // 雪原
  if (tile >= 1600 && tile <= 1602) { const v = (s.var || {})[101] || 0; return v === 0 ? 1 : v === 1 ? 6 : 5; } // 崖
  if (tile === 1591) return 33; // ビッグゲテスター内
  if (tile === 1583) return 28; // 新惑星ベジータエリア
  if (tile === 1541 || tile === 1549) return 34; // ボージャックエリア(ガーリックエリア)
  return ((s.var || {})[101] || 0) === 0 ? 3 : 8; // the rest: sea (variable 101)
}
// index.html?dev=z3… (&timer in a hidden pane): the chapter whose dev() knows the step
export function devZ3(game, step) {
  const keys = [...Object.keys(chapters).filter((k) => !ORDER.includes(k)), ...ORDER]; // (z3train's ?dev=z3pair / z3gravity first)
  for (const k of keys) if (chapters[k] && chapters[k].dev && chapters[k].dev(game, step)) return true;
  return false;
}

// ---------- helpers for the chapters ----------
export const heal = (m) => { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; };
// an actor wherever it is: the party, the bench, or new; the Super Saiyan form stands for the base one
export function member(game, id) {
  const s = game.state;
  s.bench = s.bench || {};
  const no = Object.keys(FORMS).find((k) => FORMS[k][0] === id && FORMS[k][1] !== id);
  const c = no && isSuper(s, Number(no)) ? FORMS[no][1] : id;
  return s.party.find((m) => m.id === c) || s.bench[c] || (s.bench[c] = makeMember(game.world, c));
}
const curId = (game, id) => member(game, id).id;
// $partyc = ids (the members come from the bench, new ones are made)
export function party(game, ids) {
  const list = ids.map((id) => curId(game, id));
  for (const id of list) member(game, id);
  setParty(game.state, list);
}
// $partyc << id
export function addMember(game, id) {
  const s = game.state, m = member(game, id);
  if (s.party.includes(m)) return;
  delete s.bench[m.id];
  s.party.push(m);
}
// $partyc.delete(id) ($chadead with it)
export function leave(game, id) {
  const s = game.state, k = s.party.findIndex((m) => m.id === curId(game, id));
  if (k >= 0) { s.bench[s.party[k].id] = s.party[k]; s.party.splice(k, 1); s.var[42] = s.party[0] ? s.party[0].id : s.var[42]; }
}
// CE180 時の間新エリア開放: the switch and the 通知！ card
export function timeRoom(s) { s.sw[483] = true; eventCard(s, 67, 1); }

// CAP: variable 25 in the original (tools/build_z3.py turns its changes into {x: 'cap'}), state.zeni here
let capGame = null;
addNodes({
  cap: async (node) => {
    const s = capGame && capGame.state;
    if (s) s.zeni = node.op === 0 ? node.n : Math.max(0, (s.zeni || 0) + (node.op === 1 ? node.n : -node.n));
  },
});

// what the converted scenes do to the party (src/z2scenes.js nodes)
function env(game) {
  const s = game.state, w = game.world;
  return {
    game,
    member: (id) => member(game, id),
    setParty: (ids) => party(game, ids),
    heal: (id) => {
      if (id) { heal(member(game, id)); return; }
      for (const m of s.party) heal(m);
      for (const m of Object.values(s.bench || {})) heal(m);
    },
    addUses: (map) => {
      s.skillLv = s.skillLv || {};
      for (const [k, n] of Object.entries(map)) s.skillLv[k] = Math.min(99999, (s.skillLv[k] || 0) + n);
    },
    gainExp: (id, n) => { const m = member(game, id); m.exp = Math.max(0, m.exp + n); levelUp(w, m); },
    learn: (id, skill, on) => {
      const inUse = s.party.find((m) => m.id === id) || (s.bench || {})[id];
      s.forms = s.forms || {};
      const list = inUse ? inUse.skills : (s.forms[id] = s.forms[id] || { skills: [...w.actors[id].skills] }).skills;
      const k = list.indexOf(skill);
      if (on && k < 0) list.push(skill);
      if (!on && k >= 0) list.splice(k, 1);
    },
    leave: (id) => leave(game, id),
  };
}

// a story beat starts: the field stops
export function begin(game) {
  capGame = game;
  game.busy = true;
  if (game.field) { game.field.paused = true; game.field.leave(); }
  input.dx = input.dy = 0;
  setZ2Env(env(game));
}
// back on the field (at: { map, x, y } to move first); saves
export function toField(game, at) {
  const s = game.state;
  if (at) moveTo(s, at);
  s.flags.z3At = null;
  enterMap(game);
}
// a story page / part of one: world.z3.pages[key] (a list of nodes) played with the scenes the chapter registered
export function play(game, key, part) {
  const p = Z3(game).pages[key];
  const nodes = part == null ? p : p[part];
  return playScenes([{ nodes }], game.state);
}
// a story battle of battle_process (world.z3.battles[no]): saved right before it (state.flags.z3At = { ch, at }), so a
// lost fight or a load starts again from here. opts: dmgRate (variable 81), turns (variable 94: the battle ends after
// that many turns → 'break'), stopWhen, foeHp, loseOk … (src/battle.js). Returns 'win' | 'lose' | 'break'.
export async function fight(game, no, at, opts = {}) {
  const s = game.state, b = Z3(game).battles[no];
  s.flags.z3At = { ch: s.flags.z3, at: at ?? String(no) };
  game.save(true);
  game.busy = false;
  const o = { ...opts };
  if (o.turns) { const n = o.turns, prev = o.stopWhen; o.stopWhen = (bt) => bt.turn >= n + 1 || !!(prev && prev(bt)); delete o.turns; }
  const won = await game.startBattle(b.foes, true, b.bgm ? { bgm: b.bgm, ...o } : { eventBgm: true, ...o });
  begin(game);
  return won ? 'win' : game.lastResult;
}
export { card, moveTo, enterMap, setParty };

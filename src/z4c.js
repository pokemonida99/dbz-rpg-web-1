// Z4 第三章 新生貝吉塔父子出擊（地圖 46・44） — driven by world.z3 (tools/build_z4c.py), following Map007 event 7
// pages 16-21 (variable 41 = 2191-2361), the scenes z1field 2191-2364 (all.rb 176086-176900) and the spots of maps 46
// and 44 (145_Event_Check.rb `when 46` / `when 44`). docs/z4bc.md has the whole chapter; the scene drawing, the films
// and the battles are src/z4b.js's.
//   2191 after battle 2188: Goku's instant transmission, Krillin and Bulma's controller, the lookout, Vegeta and
//     Trunks out of the room, the battle suits → map 46 (7,9), Vegeta and Trunks
//   map 46 Cell (40,34): 2251 → battle 2256 (Super Vegeta and Super Trunks, 5 turns) → 2261 「超級貝吉塔」, No. 18
//     absorbed (CE68), the film 2281 (Final Flash) → 2291 Vegeta beaten; Goku and Gohan in the room → map 44 (9,8)
//   map 44 (15,4): 2331 → 流派一致修行 (src/z3train.js, pattern 2: 超悟空・超悟飯) → 2341 Cell's tournament, No. 16,
//     Goku sees the perfect Cell, off to New Namek → variable 41 = 2701: 第四章 (金屬古拉)
import { registerZ3, nextZ3, Z3, toField, party, moveTo, card } from './z3.js?v=20261102-1750';
import { ryuhaPairTraining } from './z3train.js?v=20261102-1750';
import { chapterScenes, battle, playPages, stop, use, devBase } from './z4b.js?v=20261102-1750';

const MAPS = ['46', '44'];
const C = (game) => Z3(game).z4c;

chapterScenes('z4c', 2191, 2364, [2281], [2256, 2331]);

async function start(game) {
  const s = game.state;
  stop(game);
  s.flags.z3 = 'z4c';
  s.flags.z3At = null;
  await card(Z3(game).titles.z4c, 2200);
  s.var[41] = 2191;
  await playPages(game, 'z4c', 2191);
  toField(game, C(game).field);
}
// map 46, Cell at (40,34): 2251 → battle 2256
async function cell(game) {
  stop(game);
  game.state.var[41] = 2251;
  await playPages(game, 'z4c', [2251, 0]);
  return battle2256(game);
}
// Super Vegeta and Super Trunks against Cell's second form: our damage ×4, his ×0.5 (variables 81 / 82 of page 17),
// 5 turns → 2261 (switch 143: beaten or not; the film 2281: variable 95 = 2291) → 2291 → map 44
async function battle2256(game) {
  const s = game.state;
  if (await battle(game, 2256, { turns: 5, dmgRate: s.var[81] || 4, foeRate: s.var[82] || 0.5 }) === 'lose') return;
  s.var[41] = 2261;
  s.flags.z4cCell = true;
  await playPages(game, 'z4c', 2261, 2291);
  toField(game, C(game).room);
}
// map 44 (15,4), variable 121 = 2: 2331 → Scene_Db_Ryuha_Pair_Training (CE40 makes its cards) → variable 41 + 10 →
// 2341 → variable 41 = 2701
async function room(game) {
  const s = game.state;
  stop(game);
  s.var[41] = 2331;
  await playPages(game, 'z4c', [2331, 0]);
  return training(game);
}
async function training(game) {
  const s = game.state;
  s.flags.z3At = { ch: 'z4c', at: 'train' };
  game.save(true);
  game.busy = true;
  await ryuhaPairTraining(game, { pattern: 2 });
  stop(game);
  s.var[41] = 2331;
  await playPages(game, 'z4c', [2331, 1], 2341); // (variable 41 + 10 → 2341)
  s.flags.z3At = null;
  return nextZ3(game, 'z4c');
}

function spot(game, poi) {
  use(game);
  if (poi.page === 'htc' && game.state.map === '44' && (game.state.var[121] || 0) === 2) return room(game);
  return null;
}
function boss(game, b) {
  if (game.busy || !b || b.key !== 'cell2') return null;
  use(game);
  return cell(game);
}
const AT = { 2256: battle2256, train: training };
function resume(game, at) {
  use(game);
  const f = AT[at && at.at];
  if (f) f(game);
  else toField(game);
}
function goal(world, s) {
  if (s.map === '46') return '目標：追上沙魯';
  if (s.map === '44') return '目標：開始修行';
  return '';
}

// ---------- development: index.html?dev=z4c / z4c46 / z4c2261 / z4c44 / z4c2341 (&timer in a hidden pane) ----------
function dev(game, step) {
  if (!/^z4c(46|2261|44|2341)?$/.test(step)) return false;
  devState(game, step);
  return true;
}
async function devState(game, step) {
  const s = await devBase(game, 'z4c');
  // after the second chapter (battle 2188 lost: they got away)
  Object.assign(s.sw, { 435: true, 113: true, 142: true });
  Object.assign(s.var, { 43: 85, 41: 2191 });
  party(game, [8, 7, 9]);
  if (step === 'z4c') return start(game);
  // after page 16: Vegeta and Trunks on map 46 (Trunks' battle suit, Vegeta's moves)
  Object.assign(s.sw, { 131: true, 132: true, 110: true, 438: true, 19: false, 509: true });
  s.var[173] = 1;
  s.var[43] = 86;
  party(game, [12, 17]);
  if (step === 'z4c46') return toField(game, C(game).field);
  stop(game);
  if (step === 'z4c2261') { s.var[41] = 2261; s.flags.z4cCell = true; await playPages(game, 'z4c', 2261, 2291); return toField(game, C(game).room); }
  // after page 19: Goku and Gohan in the room (variable 121 = 2)
  Object.assign(s.var, { 41: 2321, 43: 87, 121: 2, 171: 3, 172: 1 });
  Object.assign(s.sw, { 443: true, 444: true, 360: true, 19: true });
  s.flags.z4cCell = true;
  party(game, [3, 5]);
  moveTo(s, C(game).room);
  if (step === 'z4c44') return toField(game, C(game).room);
  s.var[41] = 2341;
  await playPages(game, 'z4c', 2341);
  return nextZ3(game, 'z4c');
}

registerZ3('z4c', { maps: MAPS, start, spot, boss, resume, dev, goal });

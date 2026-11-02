// Z4 第四章 金屬古拉（地圖 84・90） — driven by world.z3 (tools/build_z4d.py), following Map007 event 7 pages 41-54
// (variable 41 = 2701-2791), the scenes z1field 2701-2792 (all.rb 177902-178106) and the spots of maps 84 / 90
// (145_Event_Check.rb `when 84` / `when 90`, all.rb 185725). docs/z4d.md has the whole chapter.
//   2701 Goku on New Namek, the Grand Elder, the Z fighters, Dende, the Big Gete Star, the young Namekian → map 84 (7,48)
//   map 84: the Elder's village → 2711; Metal Cooler (68..69, 2..3) → 2721 → battle 2726 → 2731 → battle 2736 (three of
//     him) → 2741 (more and more of him) → 2751 inside the Big Gete Star (the guide robot) → map 90 (5,51)
//   map 90: the robot soldiers A-D (CE37, switches 571-574) → battle 2765 each; all four (switch 575) → 2769 the door
//     opens; the door (30,14) → 2771 until then; the core (49,10) → 2781 → battle 2782 → 2791 back on Namek, Dende
//     comes along → variable 41 = 2371 → 第五章 (nextZ3).
import { audio } from './core.js?v=20261103-0433';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261103-0433';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261103-0433';
import { addMoves } from './anime.js?v=20261103-0433';
import { makeMember, applyLevel } from './party.js?v=20261103-0433';
import { applyEra } from './era.js?v=20261103-0433';
import { newHand } from './battle.js?v=20261103-0433';
import { registerZ3, nextZ3, Z3, begin, fight, toField, party, member, heal, card, moveTo } from './z3.js?v=20261103-0433';

const MAPS = ['84', '90'];
const C = (game) => Z3(game).z4d;
let G = null; // the game, for the page commands below (set whenever this chapter takes over)
function stop(game) { G = game; begin(game); }

// the battle films of this chapter's moves (src/anime.js): the closest of the earlier films
addMoves({
  48: 'kamehameha', 52: 'zanzouken', 53: 'masenko', 145: 'makankosappo', // 悟飯・超悟飯・青年 (page 41)
  396: 'foeWave', 397: 'psychic', 398: 'nappaBlast', 399: 'raditzBigWave', 401: 'rainDown', // 金屬古拉
  612: 'raditzWave', 613: 'foeWave', // 機器人士兵
  614: 'foeWave', 615: 'nappaMouth', 616: 'foeWave', 617: 'giantWave', // 金屬古拉・核心
  388: 'foeWave', 389: 'foeWave', 390: 'foeWave', 402: 'raditzWave', 404: 'raditzWave', 406: 'raditzWave', 407: 'swordAttack',
  450: 'raditzBigWave', 451: 'raditzBigWave', // 金屬沙維扎・德雷・內茲 (金屬人: 303, as the Saibamen)
});

// ---------- the scenes (z1field 2701-2792) ----------
// Z3 scenes are 512×128 pictures over the scroll window (@z1_scrollscenex = 64); faces at @ene1_x ± n (288,78), the
// party's under the scene (@play_x 288). The phone shows the middle ~230 px, so wider rows of faces are drawn closer.
const pic = (n) => `Graphics/Pictures/${n}`;
const P3 = pic('Z3_顔味方.PNG'), E3 = pic('Z3_顔イベント.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
const E2 = pic('Z2_顔イベント.PNG'); // the Namekians (rows 1 thick, 4 thin, 7 young)
const BG = { ナメック星: pic('Z3_背景_ナメック星.PNG'), ゲテスター: pic('Z3_背景_ビッグゲテスター.png'), 内部: pic('Z3_背景_ビッグゲテスター内部.png') };
const FIT = 224; // art px of the scene a phone shows for sure

const wide = (st, bg) => st.add(bg, SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
// a row of faces in the scene ([sheet, row, dx, col]) at dy: as the original places them, closer (and smaller) when wider
function group(st, list, dy = 0) {
  const xs = list.map((f) => f[2]), lo = Math.min(...xs), hi = Math.max(...xs);
  const fits = hi - lo + 64 <= FIT, size = fits ? 64 : Math.min(64, Math.floor(FIT / list.length));
  const k = fits ? 1 : (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
  for (const [sheet, row, dx, col = 0] of list) {
    st.add(sheet, ENE[0] + 32 - size / 2 + mid + (dx - mid) * k, ENE[1] + 32 - size / 2 + dy, [64 * col, 64 * row, 64, 64], false, 0, [size, size]);
  }
}
const face = (st, sheet, row, dx = 0, dy = 0, col = 0) => group(st, [[sheet, row, dx, col]], dy);
const under = (st, sheet, row, dx = 0, line = 0, col = 0) => st.add(sheet, PLAY_X + dx, 0, [64 * col, 64 * row, 64, 64], true, line);
// the faces under the scene (three a row; four smaller over six; five over eight; six over nine); returns the rows
function faces(st, ids) {
  const per = ids.length > 9 ? 6 : ids.length > 8 ? 5 : ids.length > 6 ? 4 : 3;
  st.faceSize = ids.length > 9 ? 36 : ids.length > 8 ? 40 : ids.length > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    under(st, P3, id - 3, -32 * (m - 1) + 64 * j, line);
  });
  return Math.ceil(ids.length / per);
}
const out = (st, ctx) => faces(st, ctx.partyc); // character_output
// character_output_all (all.rb 167997): the party, then everyone of the mode's list who is not in it, in the
// original's order (悟空 / 悟飯 / 貝吉塔 / 特蘭克斯 as their form is now)
function outAll(st, ctx, mode) {
  const list = C(G)[`all${mode}`], ss = ctx.s.ss || {};
  const ids = ctx.partyc.filter((id) => list.includes(id));
  const add = (base, sup, no) => { if (!ids.includes(base) && !ids.includes(sup) && list.includes(base)) ids.push(ss[no] ? sup : base); };
  add(3, 14, 1); add(4, 4); add(5, 18, 2);
  for (const id of [6, 7, 8, 9, 10, 24]) add(id, id);
  add(12, 19, 3); add(17, 20, 4); add(15, 15);
  return faces(st, ids);
}
const namekians = (st, dy = 0) => group(st, [[E2, 4, -96], [E2, 1, 0], [E2, 7, 96]], dy); // ナメック星人細い・太い・若者
const GURU = [CARD, 30], DENDE = [CARD, 14]; // 顔カード column 2 = Z3
const COOLER = [F3, 36];
const D = {
  2701: (st) => { wide(st, BG.ナメック星); under(st, P3, 11); namekians(st); }, // 超悟空
  2702: (st) => { wide(st, BG.ナメック星); under(st, P3, 11); namekians(st, -32); face(st, ...GURU, 0, 32, 2); },
  2703: (st, ctx) => { wide(st, BG.ナメック星); namekians(st, -32); face(st, ...GURU, 0, 32, 2); chichiRoshi(st, out(st, ctx)); },
  2704: (st, ctx) => {
    wide(st, BG.ナメック星); namekians(st, -32); group(st, [[...GURU, -32, 2], [...DENDE, 32, 2]], 32); chichiRoshi(st, out(st, ctx));
  },
  2705: (st) => wide(st, BG.ゲテスター),
  2711: (st, ctx) => { wide(st, BG.ナメック星); out(st, ctx); face(st, ...GURU, 0, 0, 2); },
  2721: (st, ctx) => { wide(st, BG.ナメック星); outAll(st, ctx, 1); face(st, ...COOLER); },
  2731: (st, ctx) => { wide(st, BG.ナメック星); outAll(st, ctx, 1); },
  2732: (st, ctx) => { wide(st, BG.ナメック星); outAll(st, ctx, 1); group(st, [[...COOLER, -96], [...COOLER, 0], [...COOLER, 96]]); },
  // メタルクウラ戦後: nine of him (@ene1_x - 32 × 8 + 64x)
  2742: (st, ctx) => { wide(st, BG.ナメック星); outAll(st, ctx, 1); group(st, Array.from({ length: 9 }, (_, x) => [...COOLER, -256 + 64 * x])); },
  2751: (st, ctx) => { wide(st, BG.内部); outAll(st, ctx, 1); face(st, E3, 71); }, // 誘導ロボット
  2752: (st, ctx) => { wide(st, BG.内部); outAll(st, ctx, 1); },
  2781: (st, ctx) => { wide(st, BG.内部); outAll(st, ctx, 1); face(st, F3, 114); }, // メタルクウラコア
  2791: (st, ctx) => { outAll(st, ctx, 1); }, // (no picture: the original has it commented out)
  2792: (st, ctx) => {
    wide(st, BG.ナメック星); outAll(st, ctx, 2); namekians(st, -32); group(st, [[...GURU, -32, 2], [...DENDE, 32, 2]], 32);
  },
};
D[2741] = D[2731];
for (const n of [2761, 2762, 2763, 2764]) D[n] = (st, ctx) => { wide(st, BG.内部); outAll(st, ctx, 1); face(st, F3, 113); }; // ロボット兵
D[2769] = D[2771] = D[2752];
// チチ and 亀仙人 under the party (@play_x ± 32, @play_y + 64)
function chichiRoshi(st, rows) { under(st, P3, 7, -32, rows); under(st, P3, 21, 32, rows); }
const BATTLES = [2726, 2736, 2765, 2782]; // battle_process: run by the flow below
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), BATTLES, [P3, E3, F3, CARD, E2, ...Object.values(BG)]);

// ---------- the pages' own commands (tools/build_z4d.py) ----------
const skillsOf = (s, id) => { const m = s.party.find((x) => x.id === id) || (s.bench || {})[id]; return m ? m.skills : (s.forms || {})[id] && s.forms[id].skills; };
addNodes({
  z4dParty: async (node, { ctx }) => { party(G, node.ids); ctx.partyc = G.state.party.map((m) => m.id); }, // $partyc = [...]
  z4dLearnIf: async (node) => { // 111 [4, a, 2, b]: if 悟飯 has 爆裂ラッシュ, 超悟飯 learns it too (CE9)
    const s = G.state, has = skillsOf(s, node.has[0]);
    if (!has || !has.includes(node.has[1])) return;
    s.forms = s.forms || {};
    const list = skillsOf(s, node.id) || (s.forms[node.id] = { skills: [...G.world.actors[node.id].skills] }).skills;
    if (!list.includes(node.skill)) list.push(node.skill);
  },
  z4dSeStop: async () => audio.seStop(),
  z4dClear: async (node, { stage }) => stage.clear(), // a new scene window (page 46: $eve = Event_Main.new)
});

// ---------- the flow ----------
const page = (game, k) => Z3(game).pages[`z4d${k}`];
const playPages = (game, ...keys) => playScenes(keys.map((k) => ({ nodes: page(game, k) })), game.state);

async function start(game) {
  const s = game.state;
  stop(game);
  s.flags.z3 = 'z4d';
  s.flags.z3At = null;
  await card(Z3(game).titles.z4d, 2200);
  s.var[41] = 2701;
  await playPages(game, 2701); // ($partyc = [3,4,5,6,7,8,9,12,17], variable 43 = 90, 42 = 3, CE180)
  s.var[41] = 0;
  toField(game, C(game).map84);
}

// a story battle: the extra-attack switches the page set (25 the last one standing, 26 30 % HP, 27 40 %, 28 two
// standing, 29 50 %: all.rb 140508) and the battle's own background ($Battle_MapID); they are cleared afterwards
async function story(game, no, at) {
  const s = game.state;
  const opts = { alone: !!s.sw[25], hp30: !!s.sw[26], hp40: !!s.sw[27], two: !!s.sw[28], hp50: !!s.sw[29] };
  opts.backdrop = `bg/z3_battle_${C(game).backdrops[no]}.png`;
  const r = await fight(game, no, at, opts);
  G = game;
  if (r !== 'lose') for (const k of [25, 26, 27, 28, 29, 128]) s.sw[k] = false;
  return r;
}
// a page that is only talk (the original keeps variable 41 at the spot's number until the next square)
async function talk(game, n) {
  const s = game.state;
  s.var[41] = n;
  await playPages(game, n);
  s.var[41] = 0;
  toField(game);
}

// map 84: Metal Cooler (2721) → battle 2726 → 2731 three of him → battle 2736 → 2741 / 2751 → map 90
async function cooler(game) {
  game.state.var[41] = 2721;
  await playPages(game, 2721);
  return cooler1(game);
}
async function cooler1(game) {
  const s = game.state;
  if (await story(game, '2726', 'cooler1') === 'lose') return;
  s.var[41] = 2731; // (variable 95)
  await playPages(game, 2731);
  return cooler3(game);
}
async function cooler3(game) {
  const s = game.state;
  if (await story(game, '2736', 'cooler3') === 'lose') return;
  s.var[41] = 2741;
  await playPages(game, 2741, 2751); // (page 45 sets variable 41 = 2751 and goes to page 46 by map 7)
  s.var[41] = 0;
  s.var[42] = s.party[0].id;
  toField(game, C(game).map90);
}

// map 90: a robot soldier (pages 47-50 → CE37) → battle 2765; the fourth (switch 575) → 2769 the door opens
async function robot(game, n) {
  game.state.var[41] = n;
  await playPages(game, n); // (switch 571-574, all four: 575; variable 41 = 2765)
  return robotBattle(game);
}
async function robotBattle(game) {
  const s = game.state;
  if (await story(game, '2765', 'robot') === 'lose') return;
  if (s.sw[575]) {
    s.var[41] = 2769; // (variable 95)
    await playPages(game, 2769);
  }
  s.var[41] = 0;
  toField(game);
}
// the core (2781) → battle 2782 → 2791 → 第五章 (variable 41 = 2371)
async function core(game) {
  game.state.var[41] = 2781;
  await playPages(game, 2781);
  return coreBattle(game);
}
async function coreBattle(game) {
  const s = game.state;
  if (await story(game, '2782', 'core') === 'lose') return;
  s.var[41] = 2791;
  await playPages(game, 2791); // (CE36, everyone recovered, variable 41 = 2371)
  s.var[42] = s.party[0].id;
  return nextZ3(game, 'z4d');
}

function spot(game, poi) {
  stop(game);
  switch (poi.page) {
    case 2711: case 2771: return talk(game, poi.page);
    case 2721: return cooler(game);
    case 2781: return core(game);
  }
  return toField(game);
}
function boss(game, b) {
  if (game.busy || !b || !/^robot/.test(b.key)) return null;
  stop(game);
  game.state.flags[b.flag] = true;
  return robot(game, b.page);
}
// a save made right before a story battle
const AT = { cooler1, cooler3, robot: robotBattle, core: coreBattle };
function resume(game, at) {
  G = game;
  const f = AT[at && at.at];
  if (f) f(game);
  else toField(game);
}
function goal(world, s) {
  if (s.map === '84') return '目標：前往右上方金屬古拉那裡';
  if (s.map !== '90') return '';
  const left = [571, 572, 573, 574].filter((k) => !s.sw[k]).length;
  return left ? `目標：找出機器人兵（還有 ${left} 個）` : '目標：前往金屬古拉核心';
}

// ---------- development: index.html?dev=z4d (page 2701) / z4d84 (map 84) / z4dcooler (map 84 by Metal Cooler) /
// z4d90 (map 90) / z4dcore (map 90, the robots beaten, by the core) / z4dend (page 2791 → 第五章) (&timer for a hidden
// pane) ----------
// a plausible state at the hand-over from the third chapter (variable 41 = 2701): everyone out of the 精神時光屋
const LV = { 3: 56, 4: 54, 5: 53, 6: 47, 7: 44, 8: 46, 9: 43, 10: 40, 12: 56, 17: 52, 24: 42, 15: 30 };
function dev(game, step) {
  if (!/^z4d(84|cooler|90|core|end)?$/.test(step)) return false;
  devState(game, step);
  return true;
}
async function devState(game, step) {
  const w = game.world, s = game.newState();
  game.state = s;
  G = game;
  s.bench = {};
  for (const [id, l] of Object.entries(LV)) {
    if (!w.actors[id]) continue;
    const m = makeMember(w, +id);
    m.level = l;
    m.exp = w.actors[id].exp[l];
    m.maxLv = l;
    applyLevel(w, m);
    heal(m);
    s.bench[id] = m;
  }
  const goku = s.bench[3];
  for (const id of [6, 7, 18, 26]) if (!goku.skills.includes(id)) goku.skills.push(id);
  goku.school = 3;
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'willow', 'z2a', 'z2b']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, z3: 'z4d' });
  Object.assign(s.sw, { 381: true, 483: true });
  s.var[40] = 2;
  s.var[43] = 89;
  s.cardiMax = 10;
  s.zeni = 30000;
  s.party = [];
  party(game, C(game).party);
  moveTo(s, C(game).map84);
  await applyEra(game);
  s.hand = newHand(w);
  game.startField();
  if (step === 'z4d') return start(game);
  // after page 41: on map 84
  Object.assign(s.sw, { 19: true, 116: true, 1109: true });
  Object.assign(s.var, { 43: 90, 42: 3, 324: 48, 172: 0, 41: 0 });
  if (step === 'z4d84') return toField(game);
  if (step === 'z4dcooler') return toField(game, { map: '84', x: 68, y: 4 });
  // after page 46: on map 90
  s.var[43] = 91;
  Object.assign(s.sw, { 128: false, 186: true, 566: true, 1113: true });
  if (step === 'z4d90') return toField(game, C(game).map90);
  Object.assign(s.sw, { 571: true, 572: true, 573: true, 574: true, 575: true, 735: true });
  if (step === 'z4dcore') return toField(game, { map: '90', x: 49, y: 11 });
  stop(game);
  Object.assign(s.sw, { 567: true, 187: true });
  s.var[41] = 2791;
  await playPages(game, 2791);
  return nextZ3(game, 'z4d');
}

registerZ3('z4d', { maps: MAPS, start, spot, boss, resume, dev, goal });

// Z3 第四章 古拉來襲（地圖 37・38・39） — driven by world.z3 (tools/build_z3d.py; docs/z3cd.md):
//   map 37 Vegeta alone: the gatekeeper (1270 → battle 1271), the base (1272 → battle 1273) → 1274 Brief calls Yamcha
//   map 38 Yamcha's party: the villager (1281), the three camps (1282 / 1285 / 1288 → battles 1283 / 1286 / 1289),
//          Kaiz (1295 → battle 1296), the base: Bulma (1298) → Goku's 流派一致修行 ×3 and Vegeta's 300× gravity
//          (src/z3train.js) → 1310 Cooler lands (Roshi or Chi-Chi comes along)
//   map 39 Cooler's ship (1316 → battle 1318 → 1319 Super Vegeta → battle 1322 → 1323 his last form → battle 1325) →
//          第五章 (src/z3e.js, variable 41 = 1326); Lunch (1581); the seven balls (1431: Shenron and his wishes).
// The scenes and story nodes shared with chapter 3 are in src/z3c.js.
import { audio } from './core.js?v=20261104-0709';
import { addScenes, playScenes } from './cutscene.js?v=20261104-0709';
import { SCROLL_X, SCENE_Y } from './opening.js?v=20261104-0709';
import { superSaiyan } from './supersaiyan.js?v=20261104-0709';
import { ryuhaPairTraining, z3GravityTraining } from './z3train.js?v=20261104-0709';
import { bg, face, out, screenPic, use, takeAgain, devState, BG, P3, E3, F3, CARD } from './z3c.js?v=20261104-0709';
import {
  registerZ3, nextZ3, Z3, begin, play, fight, toField, party, heal, card, moveTo,
} from './z3.js?v=20261104-0709';

const MAPS = ['37', '38', '39'];
const C = (game) => Z3(game).z3d;
const pic = (n) => `Graphics/Pictures/${n}`;
const SHENRON_FILM = pic('Z3_シェンロン呼び出し.PNG');

// ---------- z1field 1270-1325, 1431-1434, 1581 (all.rb 174388-174805) ----------
const card3 = (row) => [CARD, row, 0, 0, 2]; // 顔カード column 2 = Z3
const BRIEF = card3(36), BULMA = [E3, 5], VEGETA = [P3, 9], COOLER = [F3, 20];
// the villagers of the camps (おじさん, 謎の男 once the villager has asked: switch 422) and the guard there
const camp = (guard) => (st, ctx) => {
  bg(st, '家');
  if (ctx.s.sw[422]) { face(st, E3, 0, -84); face(st, E3, 2, 84); }
  face(st, F3, guard); out(st, ctx);
};
const freed = (st, ctx) => { bg(st, '家'); face(st, E3, 0, -84); face(st, E3, 2); face(st, E3, 1, 84); out(st, ctx); };
const D = {
  1270: (st, ctx) => { bg(st, '草原'); face(st, F3, 8); out(st, ctx); }, // ジーア
  1272: (st, ctx) => { bg(st, '基地'); face(st, F3, 32); out(st, ctx); }, // ピラール
  1274: (st, ctx) => { bg(st, '基地'); out(st, ctx); },
  1275: (st) => { bg(st, 'カプセル'); face(st, ...BRIEF); },
  1276: (st, ctx) => { bg(st, '山'); out(st, ctx); },
  1280: (st, ctx) => { bg(st, '草原'); out(st, ctx); },
  1281: (st, ctx) => { bg(st, '家'); face(st, E3, 0); out(st, ctx); }, // 救出指示村人
  1282: camp(8), 1285: camp(5), 1288: camp(10), // ジーア / イール / キース
  1284: freed, 1287: freed, 1290: freed,
  1295: (st, ctx) => { bg(st, '森'); face(st, F3, 33); out(st, ctx); }, // カイズ
  1297: (st, ctx) => { bg(st, '森'); out(st, ctx); },
  1298: (st, ctx) => { bg(st, '基地'); out(st, ctx); },
  1299: (st, ctx) => { bg(st, '基地'); face(st, ...BULMA, -48); face(st, ...VEGETA, 48); out(st, ctx); },
  1300: (st, ctx) => { bg(st, '基地'); face(st, ...BULMA); out(st, ctx); },
  1301: (st, ctx) => { bg(st, '砂漠'); out(st, ctx); }, // 悟空たち修行
  1303: (st, ctx) => { bg(st, '砂漠'); out(st, ctx); },
  1305: (st, ctx) => { bg(st, '砂漠'); out(st, ctx); },
  1307: (st, ctx) => { bg(st, 'カプセル'); out(st, ctx); }, // ベジータ修行
  1309: (st, ctx) => { bg(st, 'カプセル'); out(st, ctx); },
  1310: (st, ctx, q) => coolerShip(st, q), // クウラ到着
  1311: (st, ctx) => { bg(st, '砂漠'); out(st, ctx); },
  1312: (st, ctx) => { // ヤムチャたち合流: クリリン ヤムチャ 天津飯 チャオズ (the original's ±144 / ±48: half size here)
    bg(st, '砂漠');
    [[3, -78], [4, -26], [5, 26], [6, 78]].forEach(([r, dx]) => face(st, P3, r, dx, 8, 0, 48));
    out(st, ctx);
  },
  1313: (st, ctx) => { bg(st, '砂漠'); face(st, P3, 21, -48); face(st, P3, 7, 48); out(st, ctx); }, // 亀仙人、チチ
  1314: (st, ctx) => { bg(st, '砂漠'); face(st, P3, 7); out(st, ctx); }, // (亀仙人を選択) チチ
  1315: (st, ctx) => { bg(st, '砂漠'); face(st, P3, 21); out(st, ctx); }, // (チチを選択) 亀仙人
  1316: (st, ctx) => { bg(st, '基地'); out(st, ctx); },
  1317: (st, ctx) => { // クウラ, サウザー under him, ドーレ and ネイズ beside
    bg(st, '基地'); face(st, ...COOLER, 0, -32); face(st, F3, 19, 0, 32); face(st, F3, 16, -64, 32); face(st, F3, 13, 64, 32); out(st, ctx);
  },
  1319: (st, ctx) => { bg(st, '砂漠'); face(st, ...COOLER); out(st, ctx); },
  1320: (st, ctx) => { bg(st, '砂漠'); face(st, ...COOLER, -64); face(st, ...VEGETA, 64); out(st, ctx); },
  1321: (st, ctx) => { bg(st, '砂漠'); face(st, ...COOLER, -64); face(st, P3, 16, 64); out(st, ctx); }, // 超ベジータ
  1323: (st, ctx) => { bg(st, '砂漠'); face(st, ...COOLER); out(st, ctx); },
  1324: (st, ctx) => { bg(st, '砂漠'); face(st, F3, 21); out(st, ctx); }, // クウラ(変身)
  1431: (st, ctx) => { bg(st, '砂漠'); out(st, ctx); face(st, CARD, ctx.s.var[240] || 1, 0, 0, 2); }, // ドラゴンボール見つけた
  1432: (st, ctx) => { // ドラゴンボールを全部見つけたかチェック → switch 446
    bg(st, '砂漠'); out(st, ctx);
    const s = ctx.s;
    if ([2, 3, 4, 5, 6, 7, 8].every((i) => s.cards && s.cards[i] > 0)) s.sw[446] = true;
  },
  1433: (st, ctx, q) => shenronFilm(st, q), // シェンロン呼ぶ
  1434: (st, ctx) => { bg(st, '暗い砂漠'); out(st, ctx); face(st, ...card3(16)); }, // シェンロン呼び出した
  1581: (st, ctx) => { face(st, CARD, 34); out(st, ctx); }, // ランチ(金髪)
};
const BATTLES = [1271, 1273, 1283, 1286, 1289, 1296, 1302, 1304, 1306, 1308, 1318, 1322, 1325]; // (and the training scenes)

// z1field 1310: Cooler's ship — the 832-wide picture scrolls by 2 px a frame (161 frames) on black
async function coolerShip(st, quiet) {
  if (quiet) return;
  const sp = { path: BG.フリーザ宇宙船, x: SCROLL_X, y: SCENE_Y, src: [0, 0, 512, 128] };
  st.sprites.push(sp);
  for (let x = 1; x <= 160 && !st.ui.skipped; x++) { sp.src = [x * 2, 0, 512, 128]; await st.ui.wait(1); }
}
// z1field 1433: Shenron called — Z3_シェンロン呼び出し, nine 640×480 frames: the sky darkens (0-4), lightning twice
// (5 / 6 ×11), the white flash, Shenron rises (7 / 8 ×23)
async function shenronFilm(st, quiet) {
  if (quiet) return;
  const ui = st.ui, sp = screenPic(st, SHENRON_FILM, 0, 0, [0, 0, 640, 480]);
  const show = (k) => { sp.src = [640 * k, 0, 640, 480]; sp.op = 255; };
  for (const [k, n] of [[0, 16], [1, 16], [2, 16], [3, 16], [4, 120]]) { show(k); await ui.wait(n); }
  const flicker = async (n) => { for (let i = 0; i < n && !ui.skipped; i++) { show(5); await ui.wait(4); show(6); await ui.wait(4); sp.op = 0; } };
  sp.op = 0;
  audio.se('Z3 稲妻', 80);
  await flicker(11);
  show(4); await ui.wait(20);
  audio.se('Z3 稲妻', 80);
  await flicker(11);
  audio.se('Z3 シェンロン呼び出し', 80);
  st.flash = 1;
  await ui.wait(120);
  st.flash = 0;
  for (let i = 0; i < 23 && !ui.skipped; i++) { show(7); await ui.wait(4); show(8); await ui.wait(4); }
  st.clear();
}
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), BATTLES, [SHENRON_FILM]);

// ---------- helpers ----------
let G = null;
const useD = (game) => { G = game; use(game); };
// a story battle: the extra-attack switches the page set (25 the last one standing, 26 30 % HP, 27 40 %, 28 two
// standing, 29 50 %: all.rb 140508) and the battle's own background ($Battle_MapID); they are cleared afterwards
async function story(game, no, at) {
  const s = game.state;
  const opts = { alone: !!s.sw[25], hp30: !!s.sw[26], hp40: !!s.sw[27], two: !!s.sw[28], hp50: !!s.sw[29] };
  const row = C(game).backdrops[no];
  if (row != null) opts.backdrop = `bg/z3_battle_${row}.png`;
  const r = await fight(game, no, at, opts);
  if (r !== 'lose') for (const k of [25, 26, 27, 28, 29, 128]) s.sw[k] = false;
  return r;
}
// a page that is only talk (the original keeps variable 41 at the spot's number until the next square)
async function talk(game, n) {
  const s = game.state;
  s.var[41] = n;
  await play(game, String(n));
  s.var[41] = 0;
  toField(game);
}

// ---------- the chapter ----------
async function start(game) {
  useD(game);
  const s = game.state, c = C(game);
  begin(game);
  await card(Z3(game).titles.z3d, 2200);
  party(game, c.start.party);
  for (const m of s.party) heal(m);
  s.var[42] = c.start.party[0];
  s.var[41] = 0;
  toField(game, c.start);
}

async function spot(game, poi) {
  useD(game);
  begin(game);
  switch (poi.page) {
    case 1272: return base37(game);
    case 1280: case 1281: case 1581: return talk(game, poi.page);
    case 1282: case 1285: case 1288: return hostages(game, poi.page);
    case 1298: return bulma(game);
    case 1316: return coolerBase(game);
    case 1431: return ball(game, poi.ball);
  }
  return toField(game);
}
function boss(game, b) {
  if (game.busy) return null;
  useD(game);
  begin(game);
  if (b.key === 'gate37') return gate37(game);
  if (b.key === 'kaiz') return kaiz(game);
  return toField(game);
}

// map 37: the gatekeeper (switch 419) — after the battle Vegeta is back where he was
async function gate37(game) {
  game.state.var[41] = 1270;
  await play(game, '1270', 0);
  return gate37Battle(game);
}
async function gate37Battle(game) {
  if (await story(game, '1271', 'gate37') === 'lose') return;
  game.state.var[41] = 0;
  toField(game);
}
// the base → Pilaf's man (1273) → 1274: Vegeta, Brief's call → map 38 with Yamcha's party
async function base37(game) {
  game.state.var[41] = 1272;
  await play(game, '1272', 0);
  return base37Battle(game);
}
async function base37Battle(game) {
  const s = game.state, c = C(game);
  if (await story(game, '1273', 'base37') === 'lose') return;
  s.var[41] = 1274;
  await play(game, '1274'); // ($partyc = [7,6,8,9,24,10], CE180, variable 43 + 1, 42 = 7)
  party(game, c.map38.party);
  s.var[42] = c.map38.party[0];
  s.var[41] = 0;
  toField(game, c.map38);
}

// map 38: a camp — before the villager has asked (switch 422) only a look; then its guard (1283 / 1286 / 1289) and
// the hostages' thanks (1284 / 1287 / 1290: all three freed → switch 420, the village's short cut)
async function hostages(game, n) {
  const s = game.state;
  const sw = { 1282: 423, 1285: 424, 1288: 425 }[n];
  s.var[41] = n;
  await play(game, String(n));
  if (!s.sw[sw]) { s.var[41] = 0; return toField(game); }
  return hostageBattle(game, n);
}
async function hostageBattle(game, n) {
  const s = game.state;
  if (await story(game, String(n + 1), `camp${n}`) === 'lose') return;
  s.var[41] = n + 2;
  await play(game, String(n + 2));
  if (s.sw[420]) s.flags.z3dShortcut = true; // (Kaiz stands on the short cut: src/field.js `after`)
  s.var[41] = 0;
  toField(game);
}
// Kaiz (switch 421) → 1297
async function kaiz(game) {
  game.state.var[41] = 1295;
  await play(game, '1295', 0);
  return kaizBattle(game);
}
async function kaizBattle(game) {
  const s = game.state;
  if (await story(game, '1296', 'kaiz') === 'lose') return;
  s.var[41] = 1297;
  await play(game, '1297');
  s.var[41] = 0;
  toField(game);
}

// the base of map 38: Bulma (1298) → 流派一致修行 ×3 (1302 / 1304 / 1306) → Vegeta's gravity (1308; failed → 1309, again)
// → 1310 Cooler. A save before each training picks up there.
async function bulma(game) {
  const s = game.state;
  s.var[41] = 1298;
  await play(game, '1298', 0); // (Bulma, Vegeta flies off; $partyc = [3,4,5], variable 324 = 36)
  return training(game, 1);
}
const PAGES = { 1: ['1298', '1303'], 2: ['1303', '1305'], 3: ['1305', '1307'] }; // the training's page, the next one
async function training(game, round) {
  const s = game.state, c = C(game);
  s.flags.z3At = { ch: 'z3d', at: `pair${round}` };
  party(game, c.pair.party);
  game.save(true);
  // Scene_Db_Ryuha_Pair_Training (z1field 1302 / 1304 / 1306): Goku, Piccolo, Gohan; variable 121 = who trains (0:
  // Goku's group); variable 324 = 36; CE40 makes its cards
  await ryuhaPairTraining(game, { round, party: c.pair.party, pattern: s.var[121] || 0, v324: c.pair.v324 });
  begin(game);
  const [cur, next] = PAGES[round];
  s.var[41] = { 1: 1302, 2: 1304, 3: 1306 }[round];
  await play(game, cur, 1); // (variable 41 + 1)
  s.var[41] = +next;
  await play(game, next, 0); // 1303 / 1305: Goku again; 1307: Vegeta alone ($partyc = [12])
  if (round < 3) return training(game, round + 1);
  return gravity(game);
}
async function gravity(game, tries = 0) {
  const s = game.state, c = C(game);
  s.flags.z3At = { ch: 'z3d', at: 'gravity' };
  party(game, c.gravity.party);
  game.save(true);
  // Scene_Db_Z3_Gravity_Training (z1field 1308): Vegeta under 300× gravity; cleared → variable 41 + 1 (1310)
  const r = await z3GravityTraining(game, { party: c.gravity.party, times: c.gravity.times, tries });
  begin(game);
  if (!r.cleared) { // page 1309: 「可惡…不行嗎…」, everyone recovered, variable 41 - 1 → 1308: the training again
    s.var[41] = 1309;
    await play(game, '1309');
    return gravity(game, tries + 1);
  }
  return coolerLands(game);
}
// 1310: Cooler lands; Yamcha's party; Roshi or Chi-Chi (switch 555 / 556) → map 39 (45,47)
async function coolerLands(game) {
  const s = game.state, c = C(game);
  s.var[41] = 1310;
  await play(game, '1310'); // ($partyc = [3,4,5] → [3..9] << 24 / 10, variable 43 + 2, 42 = 3, 101 = 2)
  for (const m of s.party) heal(m);
  s.var[41] = 0;
  toField(game, c.map39);
}

// map 39: Cooler's ship → Salza, Dore, Neiz (1318) → 1319 Super Vegeta → Cooler (1322) → 1323 → his last form (1325)
async function coolerBase(game) {
  game.state.var[41] = 1316;
  await play(game, '1316', 0);
  return salza(game);
}
async function salza(game) {
  const s = game.state;
  if (await story(game, '1318', 'salza') === 'lose') return;
  s.var[41] = 1319;
  await play(game, '1319', 0); // (Vegeta: CE48, +150000 EXP, joins as a Super Saiyan, 125 / 133)
  return cooler(game);
}
async function cooler(game) {
  const s = game.state;
  if (await story(game, '1322', 'cooler') === 'lose') return;
  s.var[41] = 1323;
  await play(game, '1323', 0); // (CE50: his last form)
  return coolerLast(game);
}
async function coolerLast(game) {
  const s = game.state;
  if (await story(game, '1325', 'coolerLast') === 'lose') return;
  s.var[41] = 1326;
  for (const m of s.party) heal(m);
  return nextZ3(game, 'z3d');
}

// page 58 (1431): a ball (variable 240); all seven (switch 446): Shenron and his wishes — the menu again while a wish
// was given already or 上一页选项 was picked (119 選択肢1ページ) — then the balls go (CE14)
async function ball(game, k) {
  const s = game.state, p = Z3(game).pages['1431'];
  s.var[240] = k;
  s.var[41] = 1431;
  await playScenes([{ nodes: p.found }], s);
  if (s.sw[446]) {
    takeAgain();
    await playScenes([{ nodes: [...p.pre, ...p.menu.slice(2)] }], s); // (the first menu under Shenron's words)
    while (takeAgain()) await playScenes([{ nodes: p.menu }], s); // (again: the scene drawn first, z1field 1434)
    await playScenes([{ nodes: p.post }], s);
  }
  s.var[41] = 0;
  toField(game);
}

// the balls' squares of map 39 are there while that ball is not held (has_item?) and Shenron has not come (switch 446)
let patched = null;
function patchBalls(world) {
  if (patched === world) return;
  patched = world;
  for (const p of (world.pois || {})['39'] || []) {
    if (!p.ball) continue;
    Object.defineProperty(p, 'when', {
      configurable: true,
      get() { const s = (G || window.__game || {}).state; return s && s.cards && s.cards[p.ball + 1] > 0 ? ['sw', 0, true] : ['sw', 446, false]; },
    });
  }
}
function goal(world, s) {
  patchBalls(world);
  const g = world.z3.goals[s.map];
  return (g && typeof g === 'object' ? g[s.var[43]] : g) || '';
}

function resume(game, at) {
  useD(game);
  switch (at.at) {
    case 'gate37': return gate37Battle(game);
    case 'base37': return base37Battle(game);
    case 'camp1282': case 'camp1285': case 'camp1288': return hostageBattle(game, +at.at.slice(4));
    case 'kaiz': return kaizBattle(game);
    case 'pair1': case 'pair2': case 'pair3': return training(game, +at.at.slice(4));
    case 'gravity': return gravity(game);
    case 'salza': return salza(game);
    case 'cooler': return cooler(game);
    case 'coolerLast': return coolerLast(game);
  }
  return toField(game);
}

// ---------- development: index.html?dev=z3d (map 37, Vegeta) / z3d38 (map 38) / z3dbase (map 38 by the base, the
// camps and Kaiz done) / z3dtrain (page 1298: Bulma, the training) / z3d39 (map 39) / z3dcooler (map 39 by the ship)
// (&timer for a hidden pane) ----------
function dev(game, step) {
  if (!['z3d', 'z3d38', 'z3dbase', 'z3dtrain', 'z3d39', 'z3dcooler'].includes(step)) return false;
  const s = devState(game, 'z3d');
  useD(game);
  superSaiyan(game.world, s, 1, false); // (page 1256: 兩人解除了超級賽亞人的變身)
  const c = C(game);
  Object.assign(s.sw, { 18: false });
  s.var[43] = 54;
  if (step === 'z3d') {
    moveTo(s, c.start);
    game.startField();
    start(game);
    return true;
  }
  Object.assign(s.sw, { 419: true, 532: true });
  s.var[43] = 55;
  let to = c.map38, ids = c.map38.party;
  if (step !== 'z3d38') Object.assign(s.sw, { 420: true, 421: true, 422: true, 423: true, 424: true, 425: true }), s.flags.z3dShortcut = true;
  if (step === 'z3dbase') to = { map: '38', x: 10, y: 9 };
  if (step === 'z3d39' || step === 'z3dcooler') {
    s.var[43] = 57;
    s.var[101] = 2;
    Object.assign(s.sw, { 515: true, 555: true });
    ids = [3, 4, 5, 6, 7, 8, 9, 24];
    to = step === 'z3dcooler' ? { map: '39', x: 17, y: 16 } : c.map39;
  }
  party(game, ids);
  s.var[42] = ids[0];
  moveTo(s, to);
  game.startField();
  begin(game);
  if (step === 'z3dtrain') { bulma(game); return true; }
  toField(game);
  return true;
}

registerZ3('z3d', { maps: MAPS, start, spot, boss, resume, dev, goal });

// Z3 第二章 魔凶星篇（地圖 78～82） — driven by world.z3 (tools/build_z3b.py; docs/z3b.md), following Map007 event 5
// pages 59-70 and 73 (variable 41 = 1440-1571, 1583), their scenes z1field 1440-1571 (143_Event_Main.rb, SCENES below),
// the spots of 145_Event_Check.rb `when 78` … `when 82` and battle_process 1472 / 1492 / 1512 / 1532 / 1556 / 1565:
//   1440 Piccolo, Kami, Garlic Jr. on the lookout, the Kame House: the four teams (the choice of page 59) → map 78
//   east ガッシュ (1471 → 1472 → 1481) → map 79 west ビネガー (1491 → 1492 → 1501) → map 80 south ゾルド (1511 → 1512 →
//   1521: Piccolo in the north, Vegeta joins) → map 81 north タード (1531 → 1532 → 1541: everyone) → map 82 Karin
//   Tower: 1551 → Garlic Jr. and his three (1556) → 1561 the Makyo Star → Garlic Jr. giant and the four (1565) → 1571
//   → variable 41 = 1230: the next chapter (nextZ3). Yajirobe (1583) on map 82.
// East, west and south are played by the team that chose that way (variables 314 / 315 / 316: 6 east, 4 west, 2 south).
import { registerZ3, nextZ3, Z3, begin, play, fight, toField, party, addMember, heal, card, moveTo } from './z3.js?v=20261102-2311';
import { setFaces } from './core.js?v=20261102-2311';
import { addScenes } from './cutscene.js?v=20261102-2311';
import { SCENE_Y, SCROLL_X, ENE, PLAY_X } from './opening.js?v=20261102-2311';
import { makeMember, applyLevel } from './party.js?v=20261102-2311';
import { applyEra } from './era.js?v=20261102-2311';
import { newHand } from './battle.js?v=20261102-2311';

const MAPS = ['78', '79', '80', '81', '82'];
const W = (game) => Z3(game).z3b;

// ---------- the scenes (z1field 1440-1571, 1583; all.rb 173867-174152) ----------
const pic = (n) => `Graphics/Pictures/${n}`;
const P3 = pic('Z3_顔味方.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
const SKY = pic('Z3_背景_天界.PNG'), STAR = pic('Z3_背景_魔凶星.png');
const FIELD = pic('Z3_背景_草原.png'), DESERT = pic('Z3_背景_砂漠.png'), SNOW = pic('Z3_背景_雪山.PNG'); // (概況)
const scroll = (st, path) => st.add(path, SCROLL_X, SCENE_Y, [0, 0, 512, 128]); // a 512×128 scene picture
// a face in the scene, its middle at (cx, cy) of the original's screen (the scene's middle is 320, 110); col: the
// sheet's column (顔カード: 2 = Z3); size: drawn smaller where the original's row of faces is wider than a phone
const at = (st, sheet, row, cx, cy, size = 64, col = 0) =>
  st.add(sheet, cx - size / 2, cy - size / 2, [col * 64, row * 64, 64, 64], false, 0, size === 64 ? null : [size, size]);
const face = (st, sheet, row, dx = 0, col = 0) => at(st, sheet, row, ENE[0] + 32 + dx, ENE[1] + 32, 64, col); // @ene1_x + dx
const under = (st, sheet, row, dx = 0, col = 0) => st.add(sheet, PLAY_X + dx, 0, [col * 64, row * 64, 64, 64], true, 0); // @play_x
// character_output: the party's Z3 faces under the scene, three a row (four / five smaller with more), as src/cutscene.js
function out(st, ctx) {
  const ids = ctx.partyc, per = ids.length > 8 ? 5 : ids.length > 6 ? 4 : 3;
  st.faceSize = ids.length > 8 ? 40 : ids.length > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    st.add(P3, PLAY_X - 32 * (m - 1) + 64 * j, 0, [0, (id - 3) * 64, 64, 64], true, line);
  });
}
// Garlic Jr. (row 81, or 82 giant) over the four of the Demon Clan (ガッシュ タード ビネガー ゾルド, ±96 / ±32 apart in
// the original: here at 40 px, so the row fits a phone)
const garlicFour = (st, row) => {
  at(st, F3, row, 320, 80);
  [77, 78, 79, 80].forEach((r, k) => at(st, F3, r, 260 + 40 * k, 146, 40));
};
// Garlic Jr. under his three old men (z1field 1553-1555: ジンジャー ニッキー サンショ at ene1 -64 / 0 / +64, 64 higher)
const garlicThree = (st, n) => {
  at(st, F3, 81, 320, 126);
  [86, 87, 88].slice(0, n).forEach((r, k) => at(st, F3, r, 280 + 40 * k, 70, 40));
};
// grown giant (1562 on), his face in the message box is the giant one too
const giantFace = (ctx) => { ctx.faces['z3:卡里克'] = [F3, 82]; };
// the Kame House (1446 / 1447): Bulma in the middle, two rows of four round her (64 apart in the original, 40 here)
const KAME = [[P3, 2, 0, -128, -32], [P3, 7, 0, -64, -32], [P3, 4, 0, 64, -32], [P3, 3, 0, 128, -32], [CARD, 8, 2, 0, 0],
  [P3, 21, 0, -128, 32], [CARD, 49, 2, -64, 32], [P3, 5, 0, 64, 32], [P3, 6, 0, 128, 32]];
const kame = (st) => KAME.forEach(([sh, r, col, dx, dy]) => at(st, sh, r, 320 + (dx * 40) / 64, 110 + (dy * 40) / 32, 40, col));

// 概況 1011-1014 (CE110-113): the team of that area at ene1 ±48 (two) / ±80 (three) over the place
const recapTeam = (st, ctx, path) => {
  scroll(st, path);
  const p = ctx.partyc, dx = p.length === 2 ? [-48, 48] : [-80, 0, 80];
  p.slice(0, dx.length).forEach((id, k) => face(st, P3, id - 3, dx[k]));
};

const S = {
  1011: (st, ctx) => recapTeam(st, ctx, FIELD), // あらすじ (east)
  1012: (st, ctx) => recapTeam(st, ctx, DESERT), // (west)
  1013: (st, ctx) => recapTeam(st, ctx, FIELD), // (south)
  1014: (st, ctx) => recapTeam(st, ctx, SNOW), // (north)
  1015: (st, ctx) => { scroll(st, FIELD); out(st, ctx); }, // (Karin Tower)
  1440: (st) => face(st, P3, 1), // ピッコロ
  1441: (st) => { face(st, P3, 1); under(st, CARD, 10, 0, 2); }, // ピッコロと神
  1442: (st) => under(st, CARD, 10, 0, 2), // 神
  1443: (st) => { scroll(st, SKY); under(st, CARD, 12, 0, 2); }, // 神殿とポポ
  1444: (st) => { scroll(st, SKY); under(st, CARD, 12, 0, 2); face(st, F3, 81); }, // …とガーリックJr
  1445: (st) => { scroll(st, SKY); under(st, CARD, 12, 0, 2); garlicFour(st, 81); }, // …と四天王
  1446: (st) => kame(st), // カメハウス
  1447: (st) => { kame(st); under(st, P3, 1); }, // カメハウスピッコロ到着
  1471: (st, ctx) => { face(st, F3, 77); out(st, ctx); }, // ガッシュ戦闘前
  1481: (st, ctx) => out(st, ctx), // ガッシュ撃破
  1491: (st, ctx) => { face(st, F3, 79); out(st, ctx); }, // ビネガー戦闘前
  1501: (st, ctx) => out(st, ctx),
  1511: (st, ctx) => { face(st, F3, 80); out(st, ctx); }, // ゾルド戦闘前
  1521: (st, ctx) => out(st, ctx),
  1522: (st, ctx) => out(st, ctx), // ピッコロ
  1523: (st, ctx) => { face(st, P3, 9); out(st, ctx); }, // ピッコロとベジータ
  1531: (st, ctx) => { face(st, F3, 78); out(st, ctx); }, // タード戦闘前
  1541: (st, ctx) => out(st, ctx),
  1542: (st, ctx) => out(st, ctx), // Z戦士たち
  1583: (st, ctx) => { face(st, CARD, 23, 0, 2); out(st, ctx); }, // ヤジロベー
  1551: (st, ctx) => { scroll(st, SKY); out(st, ctx); }, // 神の神殿
  1552: (st, ctx) => { scroll(st, SKY); out(st, ctx); face(st, F3, 81); },
  1553: (st, ctx) => { scroll(st, SKY); out(st, ctx); garlicThree(st, 1); },
  1554: (st, ctx) => { scroll(st, SKY); out(st, ctx); garlicThree(st, 2); },
  1555: (st, ctx) => { scroll(st, SKY); out(st, ctx); garlicThree(st, 3); },
  1561: (st, ctx) => { scroll(st, SKY); out(st, ctx); face(st, F3, 81); },
  1562: (st, ctx) => { scroll(st, SKY); out(st, ctx); face(st, F3, 82); giantFace(ctx); }, // ガーリック(巨大化)
  1563: (st, ctx) => { scroll(st, SKY); out(st, ctx); garlicFour(st, 82); giantFace(ctx); },
  1564: (st, ctx) => { scroll(st, STAR); out(st, ctx); garlicFour(st, 82); giantFace(ctx); },
  1566: (st) => scroll(st, STAR), // 魔凶星
  1571: (st, ctx) => { scroll(st, SKY); out(st, ctx); face(st, CARD, 10, -48, 2); face(st, CARD, 12, 48, 2); }, // 神様、ポポ
};
addScenes(Object.fromEntries(Object.entries(S).map(([k, f]) => [k, { draw: async (st, ctx) => f(st, ctx) }])),
  [1472, 1492, 1512, 1532, 1556, 1565], [P3, F3, CARD, SKY, STAR, FIELD, DESERT, SNOW]);

// ---------- helpers ----------
// all_charecter_recovery: everyone, in the party or not
function healAll(game) {
  const s = game.state;
  for (const m of s.party) heal(m);
  for (const m of Object.values(s.bench || {})) heal(m);
}
// a page's party (the `$partyc = …` of the original), healed; the first one leads (variable 42)
function team(game, ids) {
  healAll(game);
  party(game, ids);
  healAll(game);
  game.state.var[42] = game.state.party[0].id;
}
// the team that chose a direction (6 east, 4 west, 2 south): variables 314 / 315 / 316
function teamOf(game, dir) {
  const s = game.state, t = W(game).teams;
  return t[['314', '315', '316'].find((k) => s.var[k] === dir) || '316'];
}
// a story battle: the extra-attack switches the page set (25 last one standing, 26 HP ≤ 30 % …, all.rb 140508) and the
// battle's own background ($Battle_MapID); reset_battle_flag clears the switches after it
async function battle(game, no) {
  const s = game.state, sw = s.sw;
  const flags = { alone: !!sw[25], hp30: !!sw[26], hp40: !!sw[27], two: !!sw[28], hp50: !!sw[29] };
  const r = await fight(game, no, String(no), { backdrop: `bg/z3_battle_${W(game).battleBg[no]}.png`, ...flags });
  for (let k = 25; k <= 29; k++) sw[k] = false;
  return r;
}

// ---------- 1440: the four teams ----------
async function start(game) {
  const s = game.state;
  begin(game);
  s.flags.z3 = 'z3b';
  setFaces({ ...game.world.faces });
  await card(Z3(game).titles.z3b, 2200);
  s.var[41] = 1440;
  await play(game, '1440', 0);
  // the choosing (label 方角選択): again while 不是 leaves all three switches off
  const dirSw = Object.values(W(game).dirSw);
  do await play(game, '1440', 1); while (!dirSw.some((k) => s.sw[k]));
  await play(game, '1440', 2);
  team(game, teamOf(game, 6)); // the east first
  toField(game, W(game).to['1440']);
}

// ---------- the four of the Demon Clan (the boss markers of maps 78-81) ----------
const DEMON = { 1471: 'z3bEast', 1491: 'z3bWest', 1511: 'z3bSouth', 1531: 'z3bNorth' };
async function boss(game, b) {
  if (game.busy || !b) return;
  begin(game);
  const page = Number(b.key), s = game.state;
  s.var[41] = page;
  await play(game, String(page), 0); // (variable 95: the page after the battle; 概況 +1)
  return demonBattle(game, page + 1);
}
async function demonBattle(game, no) {
  const s = game.state;
  if (await battle(game, no) !== 'win') return;
  s.flags[DEMON[no - 1]] = true;
  s.var[41] = s.var[95]; // $game_switches[128]: variable 41 goes on to variable 95 after the battle
  const page = s.var[41];
  await play(game, String(page));
  const w = W(game);
  if (page === 1481) team(game, teamOf(game, 4)); // the west
  else if (page === 1501) team(game, teamOf(game, 2)); // the south
  else if (page === 1521) { team(game, w.north); addMember(game, 12); healAll(game); } // Piccolo; Vegeta joins
  else team(game, w.all); // 1541: everyone together, Piccolo leads
  toField(game, w.to[String(page)]);
}

// ---------- map 82: Karin Tower (1551-1571), Yajirobe (1583) ----------
function spot(game, poi) {
  if (poi.page === 1551) return karin(game);
  if (poi.page === 1583) return yajirobe(game);
  return null;
}
async function karin(game) {
  const s = game.state;
  begin(game);
  s.var[41] = 1551;
  await play(game, '1551', 0);
  return garlic(game);
}
async function garlic(game) { // 1556: Garlic Jr. with Ginger, Nicky and Sansho
  const s = game.state;
  if (await battle(game, 1556) !== 'win') return;
  s.var[41] = s.var[95]; // 1561
  await play(game, '1561', 0); // the Makyo Star: he grows, the four come back
  return giant(game);
}
async function giant(game) { // 1565: Garlic Jr. giant and the four
  const s = game.state;
  if (await battle(game, 1565) !== 'win') return;
  s.var[41] = s.var[95]; // 1571
  await play(game, '1571'); // … variable 41 = 1230
  healAll(game);
  return nextZ3(game, 'z3b');
}
// 1583: the cards the first time (sw1311), then the 「自由」 skill again if asked; the story page stays as it was
async function yajirobe(game) {
  const s = game.state;
  begin(game);
  const keep = s.var[41];
  s.var[41] = 1583;
  await play(game, '1583');
  s.var[41] = keep;
  toField(game);
}

// ---------- loading: a save made before a story battle starts it again ----------
const AT = { 1472: demonBattle, 1492: demonBattle, 1512: demonBattle, 1532: demonBattle, 1556: garlic, 1565: giant };
function resume(game, at) {
  const no = Number(at && at.at);
  if (!AT[no]) return toField(game);
  return AT[no](game, no);
}

// ---------- development: index.html?dev=z3b / z3bwest / z3bsouth / z3bnorth / z3bkarin (&timer in a hidden pane) ----------
// the state the first chapter hands over (variable 41 = 1440, 43 = 65: the eight of page 1158 and Vegeta), plausible
// levels; the later steps take the original's default choice (Gohan east, Yamcha west, Krillin south)
const STEPS = {
  z3bwest: { page: 1481, beaten: 1, team: 4 },
  z3bsouth: { page: 1501, beaten: 2, team: 2 },
  z3bnorth: { page: 1521, beaten: 3 },
  z3bkarin: { page: 1541, beaten: 4 },
};
function dev(game, step) {
  if (step !== 'z3b' && !STEPS[step]) return false;
  const w = game.world, s = game.newState();
  game.state = s;
  s.bench = {};
  const lv = { 3: 52, 4: 48, 5: 45, 6: 44, 7: 42, 8: 44, 9: 40, 10: 38, 24: 40, 12: 50 };
  for (const [id, l] of Object.entries(lv)) {
    if (!w.actors[id]) continue;
    const m = makeMember(w, +id);
    m.level = l;
    m.exp = w.actors[id].exp[l];
    m.maxLv = l;
    applyLevel(w, m);
    heal(m);
    s.bench[id] = m;
  }
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, willow: 'done', z2a: 'done', z2b: 'done', z3: 'z3b' });
  Object.assign(s.sw, { 38: true, 39: true, 156: true, 381: true, 483: true });
  s.var[40] = 2;
  s.var[43] = 65;
  s.cardiMax = 10;
  s.zeni = 12000;
  s.party = [];
  party(game, [4, 5, 6, 7, 8, 9, 24, 10]);
  s.map = '78';
  moveTo(s, W(game).to['1440']);
  (async () => {
    await applyEra(game);
    s.hand = newHand(w);
    game.startField();
    if (step === 'z3b') { s.var[41] = 1440; return start(game); }
    const st = STEPS[step];
    Object.assign(s.var, { 314: 6, 315: 4, 316: 2 });
    Object.assign(s.sw, { 536: true, 537: true });
    Object.values(DEMON).slice(0, st.beaten).forEach((f) => { s.flags[f] = true; });
    s.var[43] = 65 + st.beaten;
    s.var[41] = st.page;
    if (st.team) team(game, teamOf(game, st.team));
    else if (st.page === 1521) { team(game, W(game).north); addMember(game, 12); healAll(game); s.var[101] = 1; }
    else team(game, W(game).all);
    setFaces({ ...w.faces });
    toField(game, W(game).to[String(st.page)]);
  })();
  return true;
}

registerZ3('z3b', { maps: MAPS, start, spot, boss, resume, dev });

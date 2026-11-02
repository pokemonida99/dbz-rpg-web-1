// Z3 第五章 人造人間（地圖 40） — driven by world.z3 (tools/build_z3e.py), following Map007 event 5 pages 46-57 and 72
// (variable 41 = 1326-1421, 1582), the scenes z1field 1326-1421 (all.rb 174805-175385) and the spots of map 40
// (145_Event_Check.rb `when 40`, all.rb 185604). docs/z3e.md has the whole chapter.
//   1326 the day the androids come (Bulma, baby Trunks, Yajirobe's senzu, his car blown up) → map 40 (5,56)
//   map 40: a stop that is no spot → 1335 Goku's heart attack (once; not after the 未来の薬, switch 428), Chi-Chi
//     (switch 555) or Roshi in his place; before No. 20 is found, one stop in three → 1421 (a passer-by points the way
//     to (variable 308, 309)); there → 1341 → battle 1342 → 1351 Trunks is back → the lab (61,33) 1356 →
//     Nos. 17 / 18 / 16 at (9,10): 1361 → battle 1363 → 1371 → battle 1372 → 1376 (won) / 1381 (either lost)
//   1383 Piccolo and Kami fuse, Cell → battle 1390 (Piccolo alone, 4 turns, enemy damage × 0.5) → 1401 太陽拳, the
//     ending cut-ins → variable 41 = 2001 → 「Z3 完」 and the title screen (Z4 待續).
// A "stop" (the original's Event_Check after each move on the board): the stick let go after flying a few squares.
import { input, audio, toast, rand } from './core.js?v=20261103-0423';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261103-0423';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261103-0423';
import { addMoves } from './anime.js?v=20261103-0423';
import { makeMember, applyLevel } from './party.js?v=20261103-0423';
import { superSaiyan } from './supersaiyan.js?v=20261103-0423';
import { setTypical } from './growth.js?v=20261103-0423';
import { eventCard } from './items.js?v=20261103-0423';
import { applyEra } from './era.js?v=20261103-0423';
import { newHand } from './battle.js?v=20261103-0423';
import { cardSquare } from './cardgames.js?v=20261103-0423';
import { spotTally } from './fieldmenu.js?v=20261103-0423';
import { registerZ3, Z3, begin, fight, toField, party, addMember, member, heal, card, moveTo, setParty, hasChapter, nextZ3 } from './z3.js?v=20261103-0423';

const MAPS = ['40'];
const C = (game) => Z3(game).z3e;
let G = null; // the game, for the page commands below (set whenever this chapter takes over)
function stop(game) { G = game; begin(game); }

// the battle films of this chapter's moves (src/anime.js): the closest of the earlier films
addMoves({
  171: 'energyWave', 172: 'swordAttack', 173: 'nappaBlast', 174: 'masenko', 176: 'galickGun', 177: 'swordAttack', // 特南克斯
  32: 'nappaBlast', 39: 'makouhou', 40: 'rainDown', // 比克 (神との融合)
  408: 'foeWave', 409: 'raditzBigWave', 410: 'foeWave', 411: 'raditzWave', 412: 'foeWave', 413: 'raditzBigWave', 414: 'foeWave',
  415: 'raditzWave', 416: 'foeWave', 417: 'raditzWave', 453: 'raditzBigWave', 420: 'foeWave', 421: 'raditzWave', 422: 'raditzBigWave',
  424: 'foeWave', 425: 'raditzWave', 454: 'raditzBigWave', 428: 'foeWave', 429: 'raditzWave', 430: 'raditzBigWave', 431: 'pierce',
  433: 'foeWave',
});

// ---------- the scenes (z1field 1326-1421, 1582) ----------
// Z3 scenes are 512×128 pictures over the scroll window (@z1_scrollscenex = 64); faces at @ene1_x ± n (288,78), the
// party's under the scene (@play_x 288). The phone shows the middle ~230 px, so wider rows of faces are drawn closer.
const pic = (n) => `Graphics/Pictures/${n}`;
const P3 = pic('Z3_顔味方.PNG'), E3 = pic('Z3_顔イベント.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
const BG = {
  草原: pic('Z3_背景_草原.png'), 砂漠: pic('Z3_背景_砂漠.png'), 山: pic('Z3_背景_山.PNG'), 研究所: pic('Z3_背景_研究所.PNG'),
  天界: pic('Z3_背景_天界.PNG'), 街: pic('Z3_背景_街.png'),
};
const DARK = ['bg/z3e_tenkai_1.png', 'bg/z3e_tenkai_2.png']; // 天界 at Tone -85 / -170 (tools/build_z3e.py)
const AURA = pic('Z3_スーパーサイヤ人_バック.PNG'), CELL_IN = pic('ZD_セル登場.PNG');
const CUT_P = pic('Z3_味方カットイン.PNG'), CUT_E = pic('Z3_敵カットイン.PNG');
const END1 = pic('Z3_背景_エンディング_セル1.PNG'), END2 = pic('Z3_背景_エンディング_セル2.PNG');
const SUN = pic('Z3_必殺技_カットイン_太陽拳(セル第１形態).png'), LINE_T = pic('Z3_戦闘_必殺技_背景_上(茶).png');
const LINE_B = pic('Z3_戦闘_必殺技_背景_下(加工)(茶).PNG'), CELL = pic('Z3_戦闘_敵_沙鲁(第１形态).PNG');
const PICCOLO = pic('Z3_戦闘_ピッコロ.PNG'), KI = pic('Z3_戦闘_必殺技_気を溜める(青).png');
const FIT = 224; // art px of the scene a phone shows for sure

const wide = (st, bg) => st.add(bg, SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
const face = (st, sheet, row, dx = 0, dy = 0, col = 0) => st.add(sheet, ENE[0] + dx, ENE[1] + dy, [64 * col, 64 * row, 64, 64]);
// a row of faces in the scene ([sheet, row, dx, col]): as the original places them, closer (and smaller) when wider
function group(st, list) {
  const xs = list.map((f) => f[2]), lo = Math.min(...xs), hi = Math.max(...xs);
  if (hi - lo + 64 <= FIT) { for (const [sheet, row, dx, col] of list) face(st, sheet, row, dx, 0, col); return; }
  const size = Math.min(64, Math.floor(FIT / list.length)), k = (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
  for (const [sheet, row, dx, col = 0] of list) {
    st.add(sheet, ENE[0] + 32 - size / 2 + (dx - mid) * k, ENE[1] + 32 - size / 2, [64 * col, 64 * row, 64, 64], false, 0, [size, size]);
  }
}
const under = (st, sheet, row, dx = 0, line = 0, col = 0) => st.add(sheet, PLAY_X + dx, 0, [64 * col, 64 * row, 64, 64], true, line);
// character_output: the party's faces under the scene (three a row; four smaller over six; five over eight);
// returns how many rows it took (the faces the original puts at @play_y + 64 go under them)
function out(st, ctx) {
  const ids = ctx.partyc, per = ids.length > 8 ? 5 : ids.length > 6 ? 4 : 3;
  st.faceSize = ids.length > 8 ? 40 : ids.length > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    under(st, P3, id - 3, -32 * (m - 1) + 64 * j, line);
  });
  return Math.ceil(ids.length / per);
}
// Bulma and baby Trunks under the party (z1field 1329-1331: @play_x ± 32, @play_y + 64)
const bulma = (st, line) => { under(st, CARD, 8, 32, line, 2); under(st, E3, 16, -32, line); };
const trio = (st) => group(st, [[F3, 25, -96], [F3, 24, 0], [F3, 26, 96]]); // 17号 18号 16号
// the aura (Z3_スーパーサイヤ人_バック at zoom_y 2.5 over the screen): the part the scene window shows
const aura = (st) => st.add(AURA, SCROLL_X, SCENE_Y, [64, 18, 512, 51], false, 0, [512, 128]);
// a cut-in strip (640×64): under the scene, where the original has it (480 - 192)
const strip = (st, sheet, sx, sy, h = 64) => st.add(sheet, 0, 0, [sx, sy, 640, h], true, 0);
const wait = (st, q, n) => (q ? null : st.ui.wait(n));
const uses = (ctx, k) => {
  const s = ctx.s;
  s.skillLv = s.skillLv || {};
  for (const [id, n] of Object.entries(C(G)[k])) s.skillLv[id] = Math.min(99999, (s.skillLv[id] || 0) + n); // cha_tec_puls
};

const D = {
  1326: (st, ctx) => { wide(st, BG.砂漠); out(st, ctx); },
  1327: (st, ctx) => { wide(st, BG.草原); out(st, ctx); },
  1328: (st, ctx) => { wide(st, BG.草原); group(st, [[P3, 4, -128], [E3, 16, -64], [CARD, 8, 0, 2], [P3, 5, 64], [P3, 6, 128]]); out(st, ctx); },
  1329: (st, ctx) => { wide(st, BG.草原); face(st, CARD, 23, 0, 0, 2); bulma(st, out(st, ctx)); },
  1330: (st, ctx) => { wide(st, BG.草原); group(st, [[CARD, 23, -48, 2], [E3, 8, 48]]); bulma(st, out(st, ctx)); },
  1331: (st, ctx) => { wide(st, BG.草原); bulma(st, out(st, ctx)); },
  1335: (st, ctx) => { wide(st, BG.草原); face(st, P3, 0, 0, 0, 1); out(st, ctx); }, // 悟空 (the hurt face)
  1336: (st, ctx) => { wide(st, BG.草原); out(st, ctx); },
  1337: (st, ctx) => { wide(st, BG.草原); face(st, P3, 7); out(st, ctx); }, // チチ
  1338: (st, ctx) => { wide(st, BG.草原); face(st, P3, 21); out(st, ctx); }, // 亀仙人
  1341: (st, ctx) => { wide(st, BG.草原); group(st, [[F3, 23, -48], [F3, 22, 48]]); out(st, ctx); }, // 19号 20号
  1351: (st, ctx) => { wide(st, BG.草原); face(st, P3, 14); uses(ctx, 'uses1351'); }, // トランクス
  1352: (st, ctx) => { wide(st, BG.草原); face(st, F3, 22); out(st, ctx); },
  1353: (st, ctx) => { wide(st, BG.草原); out(st, ctx); },
  1354: (st, ctx) => { wide(st, BG.草原); face(st, P3, 14); out(st, ctx); },
  1356: (st, ctx) => { wide(st, BG.山); out(st, ctx); },
  1357: (st) => { wide(st, BG.研究所); group(st, [[F3, 25, -96], [F3, 24, 0], [F3, 22, 96]]); },
  1358: (st) => { wide(st, BG.研究所); group(st, [[F3, 25, -96], [F3, 24, 0], [F3, 0, 96]]); }, // 20号 gone
  1359: (st, ctx) => { wide(st, BG.山); trio(st); out(st, ctx); },
  1361: (st) => { wide(st, BG.山); trio(st); },
  1382: (st, ctx) => { wide(st, BG.山); out(st, ctx); },
  1383: (st) => { wide(st, BG.天界); face(st, CARD, 10, -64, 0, 2); under(st, CARD, 12, 0, 0, 2); face(st, P3, 1, 64); },
  // 神様とピッコロ融合: the temple goes dark (three steps of 20 frames), then 神様 and ピッコロ slide together, fading
  // 5 a step (all.rb 175064); at the end ピッコロ is whole again and 神様 stays faint under him (opacity 95)
  1384: async (st, ctx, q) => {
    uses(ctx, 'uses1384');
    const p = member(G, 4); // set_typical_skill 4,0,249: 神との融合
    setTypical(G.world, G.state, p, 0, 249); // (all.rb 175032)
    const op = (v) => { const sp = st.sprites; if (sp && sp.length) sp[sp.length - 1].op = v; }; // (a recap's stage may have no sprites)
    const draw = (bg, k, kami = 255, pic = 255) => { st.clear(); if (bg) wide(st, bg); face(st, CARD, 10, -64 + k, 0, 2); op(kami); face(st, P3, 1, 64 - k); op(pic); };
    draw(BG.天界, 0);
    if (q) { draw(null, 64, 95); return; }
    for (const bg of [...DARK, null]) { await st.ui.wait(20); draw(bg, 0); }
    for (let x = 1; x <= 32 && !st.ui.skipped; x++) { draw(null, 2 * x, 260 - 5 * x, 260 - 5 * x); await st.ui.wait(2); }
    draw(null, 64, 95);
  },
  // 融合後気溜め: ピッコロ in the blue aura, his cut-in under it
  1385: async (st, ctx, q) => {
    let type = 0, frame = 0;
    const draw = () => {
      st.clear(); aura(st);
      st.add(KI, 240, SCENE_Y - 7, [136 * type, 0, 136, 142]);
      st.add(PICCOLO, 272, SCENE_Y + 25, [0, 0, 96, 96]);
      strip(st, CUT_P, 0, 64);
    };
    draw();
    for (let x = 1; x <= 120 && !q && !st.ui.skipped; x++) {
      if (frame >= 4) { type = type === 1 ? 0 : type + 1; frame = 0; }
      frame++;
      draw();
      await st.ui.wait(2);
    }
  },
  1386: (st) => { aura(st); st.add(CUT_P, 0, SCENE_Y + 32, [0, 64, 640, 64]); }, // カットインセンター
  1387: (st, ctx) => { wide(st, BG.天界); face(st, CARD, 12, 0, 0, 2); out(st, ctx); }, // ポポ
  1388: (st, ctx) => { wide(st, BG.街); out(st, ctx); }, // セル探索
  1389: (st) => { aura(st); st.add(CELL_IN, 216, SCENE_Y, [0, 0, 208, 128]); }, // セル発見
  1401: (st, ctx) => { wide(st, BG.街); face(st, F3, 27); out(st, ctx); },
  // セル太陽拳: the brown special-move lines, Cell comes in (1402), his 太陽拳 cut-in crosses (1403), all goes white (1404)
  1402: async (st, ctx, q) => { for (let x = 1; x <= 93 && !q && !st.ui.skipped; x++) { sun(st, 640 - 4 * x, null); await st.ui.wait(1); } sun(st, 268, null); },
  1403: async (st, ctx, q) => { for (let x = 1; x <= 54 && !q && !st.ui.skipped; x++) { sun(st, 268 + 16 * x, -648 + 12 * x); await st.ui.wait(1); } sun(st, 640, 0); },
  1404: async (st, ctx, q) => {
    sun(st, 640, 0);
    for (let x = 1; x <= 56 && !q && !st.ui.skipped; x++) { st.flash = Math.min(1, (5 * x) / 255); await st.ui.wait(1); }
  },
  1411: async (st, ctx, q) => { st.flash = 0; aura(st); strip(st, CUT_P, 0, 704); await wait(st, q, 180); }, // 超悟空
  1412: async (st, ctx, q) => { // セル2: the picture moves, then 超悟空's eyes
    st.flash = 0;
    const draw = (k, col) => { st.clear(); aura(st); strip(st, CUT_P, 640 * col, 704); st.add(END2, 198, SCENE_Y, [178 * k, 0, 178, 128]); };
    draw(0, 0);
    for (let k = 1; k <= 3 && !q && !st.ui.skipped; k++) { await st.ui.wait(8); draw(k, 0); }
    if (!q) await st.ui.wait(9);
    draw(3, 1);
  },
  1421: (st, ctx) => { wide(st, BG.草原); face(st, E3, [0, 0, 1, 4][ctx.s.var[307] || 1]); out(st, ctx); }, // 人造人間居場所
  1582: (st, ctx) => { face(st, CARD, 20, 0, 0, 2); out(st, ctx); }, // ウーロン
};
for (const n of [1362, 1371, 1376, 1381]) D[n] = D[1359]; // 研究所破壊(16号復活)、17号たち発見Ｚ戦士合流
// 1405-1410: the ending cut-ins (ピッコロ, 17号, 18号, 16号, セル, 超悟空) under Cell's picture
[[CUT_P, 64 + 4], [CUT_E, 24 * 64 + 4], [CUT_E, 23 * 64 + 4], [CUT_E, 25 * 64 + 4], [CUT_E, 26 * 64 + 4], [CUT_P, 704]].forEach(([sheet, y], k) => {
  D[1405 + k] = (st) => { st.flash = 0; aura(st); strip(st, sheet, 0, y, k === 5 ? 64 : 60); st.add(END1, 214, SCENE_Y, [0, 0, 214, 128]); };
});
function sun(st, cellX, cutX) {
  st.clear();
  aura(st);
  st.add(LINE_T, 0, SCENE_Y, [0, 78, 640, 32]);
  st.add(LINE_B, 0, SCENE_Y + 96, [0, 0, 640, 32]);
  st.add(CELL, cellX, SCENE_Y + 16, [0, 0, 96, 96]);
  if (cutX != null) st.add(SUN, cutX, SCENE_Y + 32, [0, 0, 648, 64]);
}
const BATTLES = [1342, 1363, 1372, 1390]; // battle_process: run by the flow below
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), BATTLES,
  [P3, E3, F3, CARD, ...Object.values(BG), ...DARK, AURA, CELL_IN, CUT_P, CUT_E, END1, END2, SUN, LINE_T, LINE_B, CELL, PICCOLO, KI]);

// ---------- the pages' own commands (tools/build_z3e.py) ----------
let me = null; // the ME playing (249: Z3 今度はオラがやる)
addNodes({
  z3eSsOff: async (node, { ctx }) => { superSaiyan(G.world, G.state, node.no, false); ctx.partyc = G.state.party.map((m) => m.id); }, // off_super_saiyazin
  z3eParty: async (node, { ctx }) => { party(G, node.ids); ctx.partyc = G.state.party.map((m) => m.id); }, // $partyc = [...]
  z3eJoin: async (node, { ctx }) => { // $partyc << id (someone new starts at the EXP of his level)
    const m = member(G, node.id);
    if (!m.exp) m.exp = G.world.actors[m.id].exp[m.level];
    addMember(G, node.id);
    ctx.partyc = G.state.party.map((x) => x.id);
  },
  z3eGetSkill: async (node) => { // get_skill: the passive skill is had (the Super Saiyan form shares the member)
    const s = G.state, m = s.party.find((x) => x.id === node.id) || (s.bench || {})[node.id];
    if (!m) return;
    m.got = m.got || {};
    m.got[node.skill] = true;
  },
  z3eMe: async (node, { quiet }) => {
    if (quiet || !audio.ctx) return;
    const b = await audio.buf(`Audio/ME/${node.name}.ogg`);
    if (!b) return;
    stopMe();
    const src = audio.ctx.createBufferSource(), g = audio.ctx.createGain();
    src.buffer = b;
    g.gain.value = 0.49;
    src.connect(g).connect(audio.master);
    src.start();
    me = src;
  },
});
function stopMe() { if (me) { try { me.stop(); } catch (e) { /* ended */ } me = null; } }

// ---------- the flow ----------
const page = (game, k) => Z3(game).pages[`z3e${k}`];
const playPages = (game, ...keys) => playScenes(keys.map((k) => ({ nodes: page(game, k) })), game.state);

async function start(game) {
  const s = game.state;
  stop(game);
  s.flags.z3 = 'z3e';
  s.flags.z3At = null;
  await card(Z3(game).titles.z3e, 2200);
  s.var[41] = 1326;
  await playPages(game, 1326);
  toField(game, C(game).start);
}

// a story battle of this chapter: the background of battle_process ($Battle_MapID), the extra-attack switches the page
// set (25 last one standing, 26 / 27 / 29 HP ≤ 30 / 40 / 50 %, 28 two or fewer; cleared after, reset_battle_flag)
async function battle(game, no, opts = {}) {
  const s = game.state, sw = s.sw;
  const flags = { alone: !!sw[25], hp30: !!sw[26], hp40: !!sw[27], two: !!sw[28], hp50: !!sw[29] };
  const r = await fight(game, no, String(no), { backdrop: C(game).backdrops[no], ...flags, ...opts });
  G = game;
  for (let k = 25; k <= 29; k++) sw[k] = false;
  return r;
}

// map 40: a stop
async function landing(game) {
  const s = game.state;
  if (!s.sw[428] && !s.sw[434]) return heartAttack(game);
  if (!s.sw[426] && rand(3) === 0) return passerBy(game);
}
async function heartAttack(game) {
  stop(game);
  game.state.var[41] = 1335;
  await playPages(game, 1335);
  toField(game);
}
// 1421: where No. 20 is, from where the party stands (z1field 1421: variable 310, a numpad direction)
async function passerBy(game) {
  const s = game.state, v = s.var;
  stop(game);
  const tx = Math.floor(s.x / 32), ty = Math.floor(s.y / 32);
  const yoko = tx === v[308] ? 5 : tx < v[308] ? 6 : 4, tate = ty === v[309] ? 5 : ty < v[309] ? 2 : 8;
  v[310] = yoko === 5 ? tate : yoko === 6 ? { 5: 6, 2: 3, 8: 9 }[tate] : { 5: 4, 2: 1, 8: 7 }[tate];
  v[307] = rand(3) + 1;
  const [name] = C(game).passers[v[307] - 1];
  const named = (nodes) => nodes.map((n) => (n.say && n.say[0] === '＠' ? { say: [name, n.say[1], `z3:${name}`] }
    : n.if ? { ...n, then: named(n.then), else: named(n.else) } : n));
  v[41] = 1421;
  await playScenes([{ nodes: named(page(game, 1421)) }], s);
  toField(game);
}

// No. 20 at (variable 308, 309): 1341 → the battle with Nos. 19 and 20 → 1351 Trunks
async function no20(game) {
  stop(game);
  game.state.var[41] = 1341;
  await playPages(game, 1341);
  return battle20(game);
}
async function battle20(game) {
  const s = game.state;
  if (await battle(game, 1342) !== 'win') return; // (lost: main.js loads the save made before it)
  s.var[41] = 1351;
  await playPages(game, 1351);
  toField(game);
}
async function lab(game) {
  stop(game);
  game.state.var[41] = 1356;
  await playPages(game, 1356);
  toField(game);
}
// Nos. 17, 18 (and 16): 1361 → 1363 → 1371 → 1372; a lost battle goes on with the story (variable 239 = 1381)
async function androids(game) {
  stop(game);
  game.state.flags.z3e17 = true;
  game.state.var[41] = 1361;
  await playPages(game, 1361);
  return battle17(game);
}
async function battle17(game) {
  const s = game.state;
  const r = await battle(game, 1363, { loseOk: true });
  if (r !== 'win') return afterAndroids(game, false);
  s.var[41] = 1371;
  await playPages(game, 1371);
  return battle16(game);
}
async function battle16(game) {
  return afterAndroids(game, await battle(game, 1372, { loseOk: true }) === 'win');
}
// 1376 (won) / 1381 (lost): Piccolo flies off → 1383 the fusion, Cell
async function afterAndroids(game, won) {
  const s = game.state;
  s.sw[143] = won;
  s.var[41] = won ? 1376 : 1381;
  await playPages(game, won ? 1376 : 1381, 1383);
  return battleCell(game);
}
// 1390: Piccolo alone against Cell, 4 turns (variable 94), the enemy's damage halved (variable 82)
async function battleCell(game) {
  const s = game.state;
  const r = await battle(game, 1390, { turns: 4, foeRate: s.var[82] || 0.5 });
  if (r === 'lose') return;
  s.var[82] = 0;
  s.sw[143] = r === 'win'; // 撃破 / ターン数経過
  s.var[41] = 1401;
  await playPages(game, 1401);
  return ending(game);
}
// after 1401: variable 41 = 2001 (Z4); 「Z3 完」, then the title screen with what the original opens next
async function ending(game) {
  const c = C(game), s = game.state;
  s.flags.z3 = 'done';
  s.flags.z3At = null;
  game.save(true);
  game.busy = false;
  await card(c.end, 2400);
  stopMe();
  if (hasChapter('z4a')) return nextZ3(game, 'z3e'); // Z4 (セル編), once its first chapter is there
  game.showTitle(c.end, c.unlocks);
}

// 1582 ウーロン; the card square of variable 44 = 30
async function oolong(game) {
  const s = game.state, keep = s.var[41];
  stop(game);
  s.var[41] = 1582;
  await playPages(game, 1582);
  s.var[41] = keep;
  toField(game);
}
async function card30(game, poi) {
  const s = game.state;
  spotTally(s, { effect: 'shop' });
  game.field.spent = poi; // once per stop, like the other card squares
  s.var[44] = 30; // カード特殊 (create_get_card: the Z3 cards)
  await cardSquare(game);
  s.var[44] = 0;
  game.save(true);
  toast('已存檔');
}

function spot(game, poi) {
  G = game;
  if (poi.kind === 'no20') return no20(game);
  if (poi.kind === 'lab') return lab(game);
  if (poi.kind === 'oolong') return oolong(game);
  if (poi.kind === 'card30') return card30(game, poi);
  return null;
}
function boss(game, b) {
  if (game.busy || !b) return null;
  G = game;
  return b.key === 'a17' ? androids(game) : null;
}
// a save made right before a story battle
const AT = { 1342: battle20, 1363: battle17, 1372: battle16, 1390: battleCell };
function resume(game, at) {
  G = game;
  const f = AT[at && at.at];
  if (f) f(game);
  else toField(game);
}
function goal(world, s) {
  if (!s.sw[426]) return '目標：尋找人造人';
  if (!s.sw[427]) return '目標：前往 20 號的研究所';
  if (!s.sw[431]) return '目標：追上 17 號他們';
  return '';
}

// ---------- the stops on map 40 ----------
// The original moves by cards on a board and checks the square it stops on (145_Event_Check.rb); here a stop is the
// stick let go after flying STEP squares or more, away from any spot
const STEP = 3;
let mark = null, idle = 0;
setInterval(() => {
  const game = G || window.__game, s = game && game.state;
  if (!s || !s.flags || s.flags.z3 !== 'z3e' || s.map !== '40' || game.busy || !game.field || game.scene !== game.field || game.field.paused) { mark = null; return; }
  if (mark == null || s.steps < mark) { mark = s.steps; idle = 0; return; }
  if (Math.hypot(input.dx, input.dy) > 0.05) { idle = 0; return; }
  if (s.steps - mark < STEP || ++idle < 2) return;
  mark = s.steps;
  idle = 0;
  if (game.field.near) return; // a spot: its own event
  G = game;
  landing(game);
}, 250);

// ---------- development: index.html?dev=z3e / z3efield / z3elab / z3e17 / z3ecell / z3eend (&timer in a hidden pane) ----------
// a plausible state at the hand-over from the fourth chapter (variable 41 = 1326)
function dev(game, step) {
  if (!/^z3e(field|lab|17|cell|end)?$/.test(step)) return false;
  devState(game, step);
  return true;
}
async function devState(game, step) {
  const w = game.world, s = game.newState();
  game.state = s;
  G = game;
  s.bench = {};
  const lv = { 3: 48, 4: 47, 5: 44, 6: 43, 7: 40, 8: 42, 9: 38, 10: 36, 12: 48, 17: 47, 24: 38 };
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
  const goku = s.bench[3];
  for (const id of [6, 7, 18, 26]) if (!goku.skills.includes(id)) goku.skills.push(id);
  goku.school = 3;
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'willow', 'z2a', 'z2b']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, z3: 'z3e' });
  s.var[40] = 2;
  s.var[43] = 57;
  s.cardiMax = 10;
  s.sw[381] = true;
  s.zeni = 20000;
  s.party = [];
  setParty(s, [3, 4, 5, 6]);
  moveTo(s, C(game).start);
  await applyEra(game);
  s.hand = newHand(w);
  game.startField();
  if (step === 'z3e') return start(game);
  // after page 46 (z3efield): the seven on map 40; then further on
  Object.assign(s.var, { 308: 64, 309: 13, 324: 39, 43: 58, 101: 0, 41: 1331 });
  Object.assign(s.sw, { 483: true, 533: true });
  eventCard(s, 17, 1);
  setParty(s, [3, 4, 5, 6, 7, 8, 9]);
  const later = ['lab', '17', 'cell', 'end'].indexOf(step.slice(3));
  if (later >= 0) { // Goku's heart attack (Roshi in his place), Nos. 19 / 20 beaten, Vegeta and Trunks with them
    Object.assign(s.sw, { 434: true, 426: true, 159: true, 512: true, 762: true });
    s.var[43] = 59;
    s.var[41] = 1355;
    setParty(s, [4, 5, 6, 7, 8, 9, 24, 12, 17]);
    moveTo(s, { map: '40', x: 61, y: 36 });
  }
  if (later >= 1) { Object.assign(s.sw, { 427: true }); s.var[43] = 60; moveTo(s, { map: '40', x: 9, y: 14 }); }
  if (later >= 2) {
    stop(game);
    Object.assign(s.flags, { z3e17: true });
    s.var[41] = 1383;
    if (step === 'z3ecell') { await playPages(game, 1383); return battleCell(game); }
    setParty(s, [4]);
    s.var[41] = 1401;
    await playPages(game, 1401);
    return ending(game);
  }
  toField(game);
}

registerZ3('z3e', { maps: MAPS, start, spot, boss, resume, dev, goal });

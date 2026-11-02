// ZG 本編 前段（事件 23 頁 6000～6171：ZG 開始、巴達克一夥篇，地圖 100～102）：ZG 時之間的門 9931 — docs/zg-a.md; the data is
// built by tools/build_zg_a.py (world.z3.zga: the z1field scenes, the battles, the door's lines; the pages are
// world.z3.pages['zga:6001'] …).
//   door 9931 (map 96 (18,2)) → page 6000: 是 / 否 (switch 850: back into ZG where it was left; switch 586: may start
//     at the dark planet — zgc) → startTrStory('zga') → 6001 (CE166: the time room's party aside) … 6061 (Bardock's
//     crew, variable 40 = 1) → map 100 (6,24)
//   map 100 (5,4) → 6071 → map 101; Turles (34,21) → 6081 → battle 6086 → 6091 → map 102; Slug (51,13) → 6111 →
//     battle 6116 → 6121 → map 100 (35,14); (5,27) → 6131 (CE66) → battle 6141 → 6151 → 6171 → map 103: zgb
// The pages run one after another the way Map007 does (variable 41; a transfer to map 7 = the page of variable 41;
// a page that ends on a battle_process number fights it, then variable 95's page).
import { registerArea, startTrStory, endTrStory, registerBackdrop, goTo, healAll } from './timeroom.js?v=20261103-0338';
import { registerZ3, begin, play, fight, party, member, leave, hasChapter, Z3, z3BackdropAt, moveTo } from './z3.js?v=20261103-0338';
import { addScenes, addNodes } from './cutscene.js?v=20261103-0338';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261103-0338';
import { audio, say, choose, img, loadImages, setFaces } from './core.js?v=20261103-0338';
import { superSaiyan, syncSuperSaiyan, FORMS, formOf } from './supersaiyan.js?v=20261103-0338';
import { applyEra } from './era.js?v=20261103-0338';
import { addMoves } from './anime.js?v=20261103-0338';
import { screenPic } from './z3c.js?v=20261103-0338';
import { eventCard } from './items.js?v=20261103-0338';
import { setTypical } from './growth.js?v=20261103-0338';

const T = (game) => Z3(game).zga;
const MAPS = ['100', '101', '102'];
let G = null; // the game, for the scene and node handlers
let goal = null; // where the page that just played sends the party (its 201 transfer)

// the battle films of the new moves (src/anime.js: the nearest film there is, as src/z2b.js / src/z4b.js do)
addMoves({
  246: 'energyWave', 247: 'scatterWave', 248: 'kamehameha', 249: 'sokidan', 250: 'galickGun', // 多瑪
  255: 'energyWave', 256: 'scatterWave', 257: 'kamehameha', 259: 'wolfFang', 260: 'pierce', // 莎莉巴
  265: 'energyWave', 266: 'scatterWave', 267: 'kamehameha', 268: 'zanzouken', 269: 'kikouhou', // 多達布
  273: 'energyWave', 274: 'scatterWave', 275: 'kamehameha', 276: 'wolfFang', 277: 'galickGun', // 普普堅
  155: 'genkidama', // 超巴達克 超級復仇標槍
  236: 'makouhou', 237: 'masenko', 238: 'nappaBlast', 240: 'makankosappo', 241: 'kamehameha', 242: 'wolfFang', // 未來悟飯
  550: 'foeWave', 552: 'foeWave', 553: 'psychic', // 金卡恩・阿比
  625: 'foeWave', 626: 'kienzan', 627: 'garlicBall', 629: 'foeWave', 630: 'zanzouken', 632: 'foeWave', 633: 'nappaBlast',
  634: 'garlicBall', 636: 'foeWave', 637: 'raditzWave', 639: 'foeWave', 640: 'raditzWave', // 達列斯軍
  646: 'foeWave', 647: 'garlicBall', 648: 'pierce', 650: 'foeWave', 651: 'psychic', 653: 'foeWave', 654: 'garlicBigWave',
  655: 'paralysis', 657: 'foeWave', 658: 'raditzBigWave', 660: 'foeWave', 661: 'nappaBlast', // 史拉格軍・一般兵
  391: 'foeWave', 392: 'psychic', 393: 'kienzan', 394: 'raditzWave', 395: 'giantWave', // 弗利薩(全力)
});

// ---------- the scenes: z1field 6001-6178 (tools/build_zg_a.py scene_of) ----------
// set_character_face (all.rb 19758): Z2_顔味方 while variable 40 = 1 (Bardock without his headband: variable 163),
// otherwise Z3_顔味方 or the clothes the story has put on (variables 171-173, 175, 177, switch 445)
function charFace(s, sx, sy) {
  const v = s.var || {}, sw = s.sw || {}, row = sy / 64, sh = T(G).sheets;
  const to = (sheet, r) => [sheet, sx, 64 * r];
  if ((v[40] || 0) === 1) return row === 13 && v[163] === 1 ? to(sh.kit2, 2) : to(sh.p2, row);
  if (row === 0 && (v[171] === 1 || v[171] === 2)) return to(sh.clothes, 3); // 悟空
  if (row === 0 && v[171] === 3) return to(sh.clothes, 0);
  if (row === 11 && v[171] >= 1 && v[171] <= 3) return to(sh.clothes, { 1: 4, 2: 22, 3: 1 }[v[171]]);
  if (row === 2 && sw[445]) return to(sh.clothes, 8); // 悟飯
  if (row === 2 && v[172] === 1) return to(sh.clothes, 6);
  if (row === 13 && v[175] === 1) return to(sh.clothes, 11); // 巴達克 (no scouter)
  if (row === 29 && v[175] === 1) return to(sh.clothes, 12);
  if (row === 14 && v[173] >= 1 && v[173] <= 4) return v[173] === 1 ? to(sh.long, 1) : to(sh.clothes, { 2: 13, 3: 16, 4: 18 }[v[173]]); // 特蘭克斯
  if (row === 17 && v[173] >= 1 && v[173] <= 4) return v[173] === 1 ? to(sh.zg, 17) : to(sh.clothes, { 2: 14, 3: 17, 4: 19 }[v[173]]);
  if (row === 18 && v[177] === 1) return to(sh.clothes, 20); // 18號
  return to(sh.p3, row);
}
// character_output_all mode 26 (外伝編 全員集合, all.rb 167997): the party, then everyone else of the list in its order
// (a Super Saiyan as such); mode 22 (ボージャック編 全員集合) for the 概況 of src/zg_recap.js
const ALL26 = [3, 14, 4, 5, 18, 12, 19, 17, 20, 25, 26, 6, 7, 8, 9, 16, 32, 27, 28, 29, 30, 10, 24, 15, 21, 22, 23];
const ALL = { 26: ALL26, 22: [4, 5, 18, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24],
  // the Z4 modes, for the 概況 of src/sys.js (all.rb 168006-168039)
  1: [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20, 15], 2: [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20],
  5: [4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20, 23], 8: [3, 14, 4, 5, 18, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24],
  9: [3, 14, 4, 5, 18, 6, 7, 8, 9, 12, 19, 17, 20, 10, 24, 23] };
const ALL_ORDER = [[3, 14, 1], [4], [5, 18, 2], [6], [7], [8], [9], [10], [24], [12, 19, 3], [17, 20, 4], [25, 26, 6], [16, 32, 7],
  [27], [28], [29], [30], [15], [23], [22], [21]];
function everyone(s, ids, mode) {
  const all = ALL[mode] || ALL26, list = ids.filter((id) => all.includes(id));
  for (const [a, b, no] of ALL_ORDER) {
    if (!all.includes(a) || list.includes(a) || (b && list.includes(b))) continue;
    list.push(b && s.ss && s.ss[no] ? b : a);
  }
  return list;
}
// the party's faces under the scene (three a row; more: smaller, more a row); returns how many rows
function out(st, ctx, ids, line0) {
  const n = ids.length, per = n > 15 ? 6 : n > 8 ? 5 : n > 6 ? 4 : 3;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, n - per * line), j = k % per;
    const [sheet, sx, sy] = charFace(ctx.s, 0, 64 * (id - 3));
    st.add(sheet, PLAY_X - 32 * (m - 1) + 64 * j, 0, [sx, sy, 64, 64], true, line0 + line);
  });
  return { rows: Math.ceil(n / per), size: n > 15 ? 36 : n > 8 ? 40 : n > 6 ? 48 : 64 };
}
// one scene: the picture over the scroll window, the faces in it at the original's places (closer and smaller when
// wider than a phone shows: as src/z4b.js), the faces under it (@play_y rows, character_output)
const FIT = 224, ROW = 230;
function drawScene(st, ctx, d) {
  const s = ctx.s;
  // '@pc': set_character_face of $partyc[k] (the 概況 of src/sys.js; nobody there: no face)
  const pick = (it) => (it[0] === '@cf' ? charFace(s, it[1], it[2]) : it[0] === '@pc' ? charFace(s, 0, 64 * (ctx.partyc[it[1]] - 3)) : [it[0], it[1], it[2]]);
  if (d.bg) st.add(d.bg, SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
  const faces = d.ene.filter((e) => e[3] === 64 && e[4] === 64 && (e[0] !== '@pc' || ctx.partyc[e[1]]));
  for (const e of d.ene) if (!faces.includes(e) && e[0] !== '@pc') st.add(e[0], ENE[0] + e[5], ENE[1] + e[6], [e[1], e[2], e[3], e[4]]); // (the time machine)
  if (faces.length) {
    const xs = faces.map((e) => e[5]), lo = Math.min(...xs), hi = Math.max(...xs), cols = new Set(xs).size;
    const fit = hi - lo + 64 <= FIT, size = fit ? 64 : Math.min(64, Math.floor(FIT / cols)), k = fit ? 1 : (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
    // a face above @ene1_y (Frieza over Dodoria and Zarbon) starts at the window's top, the rest one face lower
    const down = Math.max(0, SCENE_Y - (ENE[1] + Math.min(...faces.map((e) => e[6]))));
    for (const e of faces) {
      const [sheet, sx, sy] = pick(e);
      const x = fit ? ENE[0] + e[5] : ENE[0] + 32 - size / 2 + (e[5] - mid) * k;
      const y = ENE[1] + (64 - size) / 2 + e[6] + down;
      st.add(sheet, x, y, [sx, sy, 64, 64], false, 0, size === 64 ? null : [size, size]);
    }
  }
  let size = 64, rows = 0;
  const o = d.out;
  if (o) {
    const ids = o.all ? everyone(s, ctx.partyc, o.all) : ctx.partyc;
    const r = out(st, ctx, ids, o.dy / 64);
    size = r.size; rows = r.rows;
  }
  const spans = {};
  for (const p of d.play) {
    const [sheet, sx, sy] = pick(p);
    const line = o && !o.dy && p[4] ? p[4] + rows - 1 : p[4]; // (under the party's rows)
    st.add(sheet, PLAY_X + p[3], 0, [sx, sy, 64, 64], true, line);
    (spans[line] = spans[line] || []).push(p[3]);
  }
  for (const xs of Object.values(spans)) { // a row wider than the phone: every face smaller
    const w = Math.max(...xs) - Math.min(...xs) + 64;
    if (w > ROW) size = Math.min(size, Math.floor((64 * ROW) / w / 4) * 4);
  }
  st.faceSize = size;
}
// a scene of this format from elsewhere (the 概況, src/zg_recap.js)
export function drawZgScene(game, st, ctx, d) { G = game; drawScene(st, ctx, d); }
let ready = false;
function ensure(game) {
  G = game;
  if (ready) return;
  ready = true;
  const t = T(game), S = {};
  for (const n of Object.keys(t.scenes)) S[n] = { draw: async (st, ctx, quiet) => { if (!quiet) drawScene(st, ctx, T(G).scenes[n]); } };
  const pics = new Set(Object.values(t.sheets));
  for (const d of Object.values(t.scenes)) {
    if (d.bg) pics.add(d.bg);
    for (const it of [...d.ene, ...d.play]) if (it[0] !== '@cf') pics.add(it[0]);
  }
  addScenes(S, Object.keys(t.battles).map(Number), [...pics]);
}

// ---------- CE66 バーダック超サイヤ人変身 → CE45: the back (0,128), Trunks' three auras (178,128), Bardock's two bodies
// at (178 − 146, 128); as src/z3c.js transformFilm ----------
async function transformFilm(st, ui) {
  const t = T(G).ss;
  await loadImages([t.back, ...t.auras, ...t.body]);
  ui.dlg.hidden = true;
  st.clear();
  screenPic(st, t.back, 0, 128, [0, 0, 640, 224]);
  const wide = (p) => { const e = img(p); return [0, 0, e.ok ? e.im.width : 286, 224]; };
  const A = t.auras.map((p) => screenPic(st, p, 178, 128, wide(p), 0));
  const B = t.body.map((p, k) => screenPic(st, p, t.x, 128, wide(p), k ? 0 : 255));
  const frame = async (k) => { A.forEach((a, i) => { a.op = i === k ? 255 : 0; }); await ui.wait(4); };
  await ui.wait(90);
  audio.se('Z3 変身', 80);
  ui.el.classList.add('shake');
  setTimeout(() => ui.el.classList.remove('shake'), (264 * 1000) / 60);
  for (let c = 0; c < 10 && !ui.skipped; c++) for (let k = 0; k < 3; k++) await frame(k);
  let v33 = 0, v32 = 0;
  for (const [every, cycles] of [[8, 5], [4, 7]]) {
    for (let c = 0; c < cycles && !ui.skipped; c++) {
      for (let k = 0; k < 3; k++) {
        await frame(k);
        v33 += 4;
        if (v33 >= every) { v33 = 0; v32 = 1 - v32; B[0].op = v32 ? 0 : 255; B[1].op = v32 ? 255 : 0; }
      }
    }
    B[0].op = 0; B[1].op = 255;
  }
  for (let c = 0; c < 20 && !ui.skipped; c++) for (let k = 0; k < 3; k++) await frame(k);
  ui.el.classList.remove('shake');
  st.clear();
}

// ---------- the party (CE166 / CE168 / CE157: the time room's party kept aside while ZG runs, variable 22 = 3) ----------
// The three ZG parts agree (docs/zg-a.md): state.flags.zgParty = { party: [ids], ss } is the time room's party while
// ZG runs; state.flags.zgBack = { key, map, x, y, v43, v17, party, ss } is where ZG was left half-way (page 9932) and
// its party, until the door (switch 850) hands it back to that part: startTrStory(game, key), whose start() goes there.
const base = (id) => { const no = formOf(id); return no ? FORMS[no][0] : id; };
const noForms = () => Object.fromEntries(Object.keys(FORMS).map((no) => [no, false]));
const partyOf = (s) => ({ party: s.party.map((m) => base(m.id)), ss: { ...(s.ss || {}) } });
// a kept party back in place (CE157: the Super Saiyans each as they were; CE168; $chadead all false)
function putParty(game, k) {
  const s = game.state;
  syncSuperSaiyan(game.world, s, { ...noForms(), ...(k.ss || {}) });
  party(game, k.party);
  for (const m of s.party) m.ko = false;
  s.var[42] = s.party[0].id;
}
// CE166: the time room's party and its Super Saiyans aside (state.flags.zgParty)
export function keepParty(game) { game.state.flags.zgParty = partyOf(game.state); }
// CE157 + CE168 at the end of ZG (page 9932 after 6761: zgc): the time room's party back
export function restoreParty(game) {
  const s = game.state, k = s.flags.zgParty;
  if (k) putParty(game, k);
  delete s.flags.zgParty;
}
// page 9932 「ＺＧ⇒時之間」 half-way (zgb / zgc call it from their 時之間 squares): CE171 (where ZG was left, variables
// 371-375; the caller's y − 1) into state.flags.zgBack with the ZG party, CE182, CE157 / CE168 (the time room's party),
// switch 78 on, 19 off, variables 17 = 0, 43 = 999, then the ZG hall (18,3)
export function leaveZg(game, dy = -1) {
  const s = game.state, x = Math.floor(s.x / 32), y = Math.floor(s.y / 32) + dy;
  s.flags.zgBack = { key: s.flags.z3, map: s.map, x, y, v43: s.var[43] || 0, v17: s.var[17] || 0, ...partyOf(s) };
  [s.var[371], s.var[372], s.var[373], s.var[374], s.var[375]] = [x, y, Number(s.map), s.var[43] || 0, s.var[17] || 0];
  eventCard(s, 37, -99);
  eventCard(s, 124, -99);
  if (s.flags.zgParty) putParty(game, s.flags.zgParty);
  s.sw[78] = true; s.sw[19] = false;
  s.var[17] = 0; s.var[43] = 999;
  endTrStory(game, T(game).back);
}
// a part's start() with state.flags.zgBack for it: back where ZG was left (the door has put its party back); true if so
export function backToZg(game, key) {
  const s = game.state, k = s.flags.zgBack;
  if (!k || k.key !== key) return false;
  delete s.flags.zgBack;
  begin(game);
  applyEra(game).then(() => { audio.se('Z1 入る'); goTo(game, { map: k.map, x: k.x, y: k.y }); });
  return true;
}

// ---------- the nodes of the pages (tools/build_zg_a.py converter) ----------
const refresh = (ctx) => { if (G) ctx.partyc = G.state.party.map((m) => m.id); };
addNodes({
  zgaGo: async (node) => { goal = node.to; },
  zgaKeep: async () => { if (G) keepParty(G); }, // CE166
  zgaSsOff: async (node, { ctx }) => { if (G) { syncSuperSaiyan(G.world, G.state, noForms()); refresh(ctx); } }, // CE159
  zgaSs: async (node, { ctx }) => { if (G) { superSaiyan(G.world, G.state, node.no, node.on); refresh(ctx); } },
  zgaParty: async (node, { ctx }) => { if (G) { party(G, node.ids); refresh(ctx); } },
  zgaMember: async (node, { ctx }) => { // $partyc.unshift / push / delete
    if (!G) return;
    const s = G.state;
    if (node.op === 'delete') leave(G, node.id);
    else {
      const m = member(G, node.id);
      if (!s.party.includes(m)) { delete s.bench[m.id]; if (node.op === 'unshift') s.party.unshift(m); else s.party.push(m); }
    }
    refresh(ctx);
  },
  zgaKi0: async (node) => { if (G) member(G, node.id).ki = 0; }, // 演出としてKIを0にしておく
  zgaCardi: async (node) => { if (G) G.state.cardiMax = node.n; },
  zgaEra: async () => { if (G) await applyEra(G); }, // chk_scenario_progress
  zgaTypical: async (node) => { if (G) setTypical(G.world, G.state, member(G, node.id), node.slot, node.skill); }, // 6131 最終決戦改
  zgaLead: async () => { const s = G && G.state; if (s && s.party[0]) s.var[42] = s.party[0].id; }, // CE39
  zgaSkills: async () => { if (G) crewSkills(G); }, // CE9
  zgaBardockSs: async (node, { stage, ui, quiet }) => { if (!quiet) await transformFilm(stage, ui); }, // CE66
  zgaSeStop: async () => audio.seStop(),
});
// CE9 for the crew: their moves (switches 364-367 off), the strongest once Frieza is beaten or ZG is over and
// switch 629 / 631 / 633 / 635 is on (variable 40 = 2)
function crewSkills(game) {
  const s = game.state, t = T(game), sw = s.sw;
  const late = (sw[598] || sw[586] || sw[860]) && (s.var[40] || 0) === 2;
  for (const [id, list] of Object.entries(t.crew)) {
    const m = member(game, +id), best = t.best[id];
    const ape = sw[{ 27: 364, 28: 365, 29: 366, 30: 367 }[id]]; // (the Great Ape: src/cards_a.js)
    list.forEach((k, x) => { if ((x < 2 || !ape) && !m.skills.includes(k)) m.skills.push(k); });
    if (late && sw[{ 27: 629, 28: 631, 29: 633, 30: 635 }[id]] && !m.skills.includes(best)) m.skills.push(best);
  }
}

// ---------- running the pages ----------
async function playPage(game, v) {
  ensure(game);
  goal = null;
  game.state.var[41] = v;
  await play(game, `zga:${v}`);
  await applyEra(game);
}
// a story battle of battle_process (6021 / 6086 / 6116 / 6141): saved right before it (a lost one or a load starts it
// again: resume), its background; afterwards reset_battle_flag
async function battle(game, no) {
  const s = game.state, b = T(game).battles[no];
  await applyEra(game);
  const r = await fight(game, no, String(no), { backdrop: b.backdrop });
  G = game;
  for (const k of [17, 18, 25, 26, 27, 28, 29, 128]) s.sw[k] = false;
  for (const k of [81, 82, 94, 95, 96]) s.var[k] = 0;
  return r;
}
// from page v on, as Map007 runs them; returns where the party goes ({map, x, y}), or null when a battle was lost
// (the game loads the save made before it)
async function runPages(game, v) {
  const s = game.state, t = T(game);
  for (;;) {
    await playPage(game, v);
    const no = s.var[41], b = t.battles[no];
    if (b) {
      if ((await battle(game, no)) !== 'win') return null;
      v = b.next;
      continue;
    }
    if (goal && goal[0] !== 7) return { map: String(goal[0]), x: goal[1], y: goal[2] };
    v = s.var[41];
  }
}
// where a run of pages ended: a square of maps 100-102, or map 103 (zgb's part)
async function arrive(game, to) {
  if (!to) return;
  const s = game.state;
  s.flags.z3At = null;
  if (to.map === '103') return startTrStory(game, 'zgb'); // (zgb's start moves the party to map 103 (24,23))
  s.var[41] = 0;
  await applyEra(game);
  goTo(game, to);
}
const setPos = (s) => { s.var[13] = Number(s.map); s.var[1] = Math.floor(s.x / 32); s.var[2] = Math.floor(s.y / 32); };

// ---------- the door (9931 → page 6000) ----------
async function door(game) {
  const s = game.state, t = T(game), x = t.text;
  ensure(game);
  begin(game);
  setFaces({ ...game.world.faces });
  s.var[22] = 3;
  if (s.sw[850] && s.flags.zgBack) return resume850(game);
  audio.playBgm(x.bgm);
  await say([['', x.ask]], true);
  if (await choose(x.yesNo) !== 0) { audio.se('Z1 入る'); return goTo(game, t.back); } // (the square under the door)
  s.sw[466] = true;
  if (s.sw[586]) {
    await say([['', x.askDark]], true);
    if (await choose(x.dark) === 0) return darkPlanet(game);
  }
  s.sw[850] = true; // 外伝編スタート処理
  audio.fadeBgm(1);
  startTrStory(game, 'zga');
}
// switch 850 on: back into ZG where it was left (page 6000's other branch: CE157, CE168, everyone up and full, CE39,
// variables 371-375) — the part it was left in takes over (startTrStory; its start() sees state.flags.zgBack)
async function resume850(game) {
  const s = game.state, k = s.flags.zgBack;
  if (!k || !hasChapter(k.key) || !game.world.maps[k.map]) return notYet(game);
  keepParty(game); // (the time room's party as it is now)
  putParty(game, k);
  healAll(game);
  s.sw[466] = true; s.var[301] = 2;
  s.var[43] = k.v43; s.var[17] = k.v17;
  s.sw[19] = false; s.sw[78] = false;
  startTrStory(game, k.key);
}
// switch 586 (ZG cleared) — 從暗黑星球區域開始: the original's set-up, then zgc's dark planet (map 110 (2,21))
async function darkPlanet(game) {
  const s = game.state, t = T(game);
  if (!hasChapter('zgc') || !game.world.maps[t.dark.map]) return notYet(game);
  s.var[301] = 2; s.sw[850] = true;
  s.sw[19] = false; s.sw[78] = true;
  s.var[43] = 186; s.var[1] = t.dark.x; s.var[2] = t.dark.y; s.var[17] = 6;
  for (const n of [596, 597, 598, 599, 858]) s.sw[n] = false; // CE170
  for (let n = 802; n <= 845; n++) s.sw[n] = false;
  for (const [id, sk] of Object.entries(t.best)) { const m = member(game, +id), i = m.skills.indexOf(sk); if (i >= 0) m.skills.splice(i, 1); }
  for (const n of [598, 840, 842, 843, 844]) s.sw[n] = true;
  for (const [id, sk] of Object.entries(t.best)) { // CE169
    const m = member(game, +id), on = { 27: [629, 364], 28: [631, 365], 29: [633, 366], 30: [635, 367] }[id];
    if (s.sw[on[0]] && !s.sw[on[1]] && !m.skills.includes(sk)) m.skills.push(sk);
  }
  keepParty(game); // CE166
  healAll(game);
  // (as a half-way return: zgc's start() takes the party to the dark planet, map 110 (2,21))
  s.flags.zgBack = { key: 'zgc', map: t.dark.map, x: t.dark.x, y: t.dark.y, v43: 186, v17: 6, ...partyOf(s) };
  startTrStory(game, 'zgc');
}
async function notYet(game) {
  const s = game.state;
  await say([['', '這段劇情本版尚未製作，之後會照原版加入。']]);
  goTo(game, { map: s.map, x: Math.floor(s.x / 32), y: Math.floor(s.y / 32) });
}
registerArea(9931, door);

// ---------- the battle backgrounds of the encounters (set_battle_map: variable 301 = 1 on maps 100 / 102 — the Z2
// rules by the ground tile; 2 on map 101 — the Z3 rules, src/z3.js) ----------
function backdrop(game) {
  const s = game.state;
  if (s.map === '101') return z3BackdropAt(game);
  const m = game.world.maps[s.map], i = Math.floor(s.x / 32) + Math.floor(s.y / 32) * m.w;
  return `bg/z2_battle_${T(game).tiles[m.layers[0][i]] ?? 0}.png`;
}
for (const m of MAPS) registerBackdrop(m, backdrop);

// ---------- the chapter ----------
async function start(game) {
  const s = game.state;
  ensure(game);
  if (backToZg(game, 'zga')) return; // (maps 100-102 have no 時之間 square in the original: only for the rule's sake)
  begin(game);
  setFaces({ ...game.world.faces });
  setPos(s);
  return arrive(game, await runPages(game, 6001));
}
// the story squares of maps 100-102 (145_Event_Check.rb `when 100`-`102`): poi.page is the page they run
async function spot(game, poi) {
  const s = game.state;
  ensure(game);
  game.save(true); // (a lost battle loads this: the square is there to try again)
  begin(game);
  setPos(s);
  return arrive(game, await runPages(game, poi.page));
}
// a load after the save fight() made: that battle again, then on from variable 95's page
async function resume(game, at) {
  ensure(game);
  const no = +at.at, b = T(game).battles[no];
  if (!b) return goTo(game, { map: game.state.map, x: Math.floor(game.state.x / 32), y: Math.floor(game.state.y / 32) });
  if ((await battle(game, no)) !== 'win') return;
  return arrive(game, await runPages(game, b.next));
}

// ---------- development: ?dev=zga (the door) / zgaspace (map 100, the crew) / zgaturles (map 101 by Turles) /
// zgaslug (map 102 by Slug) / zgafrieza (map 100 by Frieza's planet) / zga6001 … (a page and on, from the ZG hall) ----------
function devState(game) {
  const s = game.state = game.newState();
  s.var[40] = 2;
  for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568,
    470, 459, 570, 580, 581, 585]) s.sw[n] = true;
  s.flags.z3 = 'done';
  s.cardiMax = 10;
  party(game, [3, 5, 4, 12, 17, 6]);
  s.flags.tr = { back: { map: '48', x: 44 * 32 + 16, y: 29 * 32 + 16 }, v43: 0, v17: 2, party: s.party.map((m) => m.id), ss: {} };
  s.var[43] = 999;
  s.sw[466] = true;
  s.sw[473] = true;
  for (const m of s.party) m.level = Math.max(m.level, 40);
  return s;
}
// the state of the crew's part (pages 6001 / 6061 without their scenes)
function devCrew(game) {
  const s = game.state;
  keepParty(game);
  s.flags.trStory = s.flags.trStory || { main: s.flags.z3 };
  s.flags.z3 = 'zga';
  s.sw[850] = true;
  party(game, [27, 28, 29, 30]);
  crewSkills(game);
  healAll(game);
  s.var[42] = 27;
  s.var[40] = 1; s.var[301] = 1; s.var[43] = 143; s.var[324] = 30;
}
registerZ3('zga', {
  maps: MAPS,
  start,
  spot,
  resume,
  goal: (world, s) => `概況：${(world.z3.zga.goals || {})[s.var[43]] || 'Z 外傳'}`,
  dev(game, step) {
    if (!/^zga/.test(step)) return false;
    const s = devState(game), t = T(game);
    moveTo(s, t.back);
    (async () => {
      ensure(game);
      await applyEra(game);
      game.startField();
      if (step === 'zga') return door(game);
      const page = Number(step.slice(3));
      if (page) {
        s.sw[850] = true;
        keepParty(game);
        s.flags.trStory = s.flags.trStory || { main: s.flags.z3 };
        s.flags.z3 = 'zga';
        if (page >= 6061) devCrew(game);
        if (page >= 6131) { s.sw[596] = true; s.sw[597] = true; s.var[43] = 146; }
        if (page >= 6151) { party(game, [16, 27, 28, 29, 30]); superSaiyan(game.world, s, 7, true); s.var[40] = 2; }
        await applyEra(game);
        begin(game);
        setPos(s);
        return arrive(game, await runPages(game, page));
      }
      devCrew(game);
      const at = { zgaspace: { map: '100', x: 6, y: 24 }, zgaturles: { map: '101', x: 33, y: 21 }, zgaslug: { map: '102', x: 50, y: 13 },
        zgafrieza: { map: '100', x: 5, y: 26 } }[step];
      if (!at) return;
      if (step === 'zgaturles') { s.var[43] = 144; s.var[301] = 2; }
      if (step === 'zgaslug') { s.sw[596] = true; s.var[43] = 145; }
      if (step === 'zgafrieza') { s.sw[596] = true; s.sw[597] = true; s.var[43] = 146; }
      await applyEra(game);
      begin(game);
      goTo(game, at);
    })();
    return true;
  },
});

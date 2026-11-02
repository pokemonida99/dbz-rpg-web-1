// Z4 第二章 悄悄接近的賽魯（地圖 43） — driven by world.z3 (tools/build_z4b.py), following Map007 event 7 pages 7-15
// (variable 41 = 2091-2181), the scenes z1field 2091-2188 (all.rb 175648-176090) and the spots of map 43
// (145_Event_Check.rb `when 43`). docs/z4bc.md has the whole chapter.
//   2091 Piccolo against No. 17 → the film 2092 → 2093 Cell, Kame House, Bulma's controller → 2110 Cell arrives →
//     Tien, Chiaotzu, Yamcha fly off → map 43 (59,5)
//   map 43 Piccolo and Cell (8,40)/(8,41): 2121 → battle 2123 (Piccolo and No. 17, 5 turns) → 2131 (the film 2132)
//     → 2136 → No. 16 alone at (8,36) → the same squares: 2151 → battle 2153 (5 turns) → 2156 (the film 2157) →
//     2161 No. 17 absorbed (CE67), the film 2172 新気功砲 → 2181 → battle 2188 (4 turns; losing goes on as well)
//     → variable 41 = 2191: 第三章 (src/z4c.js)
// The scene drawing, the battle films and the battles of both chapters are here (src/z4c.js imports them): the
// scenes come from all.rb itself (tools/build_z4b.py scenes(): background, faces, character_output).
import { audio, img, loadImages } from './core.js?v=20261102-2150';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261102-2150';
import { SCROLL_X, SCENE_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261102-2150';
import { makeMember, applyLevel } from './party.js?v=20261102-2150';
import { superSaiyan } from './supersaiyan.js?v=20261102-2150';
import { applyEra } from './era.js?v=20261102-2150';
import { newHand } from './battle.js?v=20261102-2150';
import { addMoves, ANIME_IMAGES } from './anime.js?v=20261102-2150';
import { duelFilm, screenPic } from './z3c.js?v=20261102-2150';
import { registerZ3, nextZ3, Z3, begin, fight, toField, party, member, heal, card, moveTo, setParty } from './z3.js?v=20261102-2150';

const MAPS = ['43'];
const C = (game) => Z3(game).z4b;
let G = null; // the game, for the scenes and the page commands (set whenever chapter 2 or 3 takes over)
export const use = (game) => { G = game; };
export function stop(game) { G = game; begin(game); }

// the battle films of the moves these chapters bring (src/anime.js: the nearest earlier film)
addMoves({
  191: 'energyWave', 192: 'vegetaWave', 193: 'galickGun', 201: 'energyWave', 202: 'vegetaWave', 203: 'galickGun', // 18號 / 17號
  211: 'energyWave', 212: 'vegetaWave', 213: 'galickGun', 214: 'pierce', 215: 'galickGun', // 16號 (火箭飛拳・地獄閃光)
  85: 'kikouhou', 39: 'makouhou', 40: 'rainDown', // 新氣功砲, 激烈光彈, 魔空包圍彈
  434: 'foeWave', 435: 'raditzWave', 436: 'raditzBigWave', 437: 'raditzBigWave', // 沙魯(第２形態)
});

// ---------- the scenes (data: world.z3.z4b / z4c .scenes, from all.rb) ----------
// Z3 scenes are 512×128 pictures over the scroll window; faces at @ene1_x ± n (ENE), the others under the scene
// (@play_x / @play_y, @play_y + 64 = the second row). A phone shows the middle ~230 px of the scene, so rows of faces
// wider than that are drawn closer and smaller (as src/z3e.js does).
const FIT = 224, ROW = 230;
const sheets = () => Z3(G).z4b.sheets;
// set_character_face (all.rb 19758, the Z3 part): the face by the clothes the story has put on (variables 171-173,
// 177, switch 445); rect.x = 64 × column, rect.y = 64 × row of Z3_顔味方 otherwise
export function charFace(s, sx, sy) {
  const v = s.var || {}, sw = s.sw || {}, row = sy / 64, sh = sheets();
  const to = (sheet, r) => [sheet, sx, 64 * r];
  if (row === 0 && (v[171] === 1 || v[171] === 2)) return to(sh.clothes, 3); // 悟空
  if (row === 0 && v[171] === 3) return to(sh.clothes, 0);
  if (row === 11 && v[171] >= 1 && v[171] <= 3) return to(sh.clothes, { 1: 4, 2: 22, 3: 1 }[v[171]]); // 超悟空
  if (row === 2 && sw[445]) return to(sh.clothes, 8); // 悟飯
  if (row === 2 && v[172] === 1) return to(sh.clothes, 6);
  if (row === 14 && v[173] >= 1 && v[173] <= 4) return v[173] === 1 ? to(sh.long, 1) : to(sh.clothes, { 2: 13, 3: 16, 4: 18 }[v[173]]); // 特蘭克斯
  if (row === 17 && v[173] >= 1 && v[173] <= 4) return v[173] === 1 ? to(sh.zg, 17) : to(sh.clothes, { 2: 14, 3: 17, 4: 19 }[v[173]]);
  if (row === 18 && v[177] === 1) return to(sh.clothes, 20); // 18號
  return to(sh.p3, row);
}
// character_output: the party's faces under the scene (three a row; four smaller over six; five over eight)
export function out(st, ctx) {
  const ids = ctx.partyc, per = ids.length > 8 ? 5 : ids.length > 6 ? 4 : 3, s = ctx.s;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    const [sheet, sx, sy] = charFace(s, 0, 64 * (id - 3));
    st.add(sheet, PLAY_X - 32 * (m - 1) + 64 * j, 0, [sx, sy, 64, 64], true, line);
  });
  return { rows: Math.ceil(ids.length / per), size: ids.length > 8 ? 40 : ids.length > 6 ? 48 : 64 };
}
// one scene of the data; shake: the offset of the face marked to shake (z1field 2164 / 2272)
export function drawScene(st, ctx, d, shake = 0) {
  const s = ctx.s;
  const pick = (it) => (it[0] === '@cf' ? charFace(s, it[1], it[2]) : it);
  if (d.bg) st.add(d.bg, d.narrow ? SCENE_X : SCROLL_X, SCENE_Y, [0, 0, d.narrow ? 192 : 512, 128]);
  // in the scene: as the original places them, closer (and smaller) when wider than a phone shows
  if (d.ene.length) {
    const xs = d.ene.map((e) => e[3]), lo = Math.min(...xs), hi = Math.max(...xs), cols = new Set(xs).size;
    const fit = hi - lo + 64 <= FIT, size = fit ? 64 : Math.min(64, Math.floor(FIT / cols)), k = fit ? 1 : (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
    for (const e of d.ene) {
      const [sheet, sx, sy] = pick(e);
      const x = fit ? ENE[0] + e[3] : ENE[0] + 32 - size / 2 + (e[3] - mid) * k;
      const y = Math.max(SCENE_Y, ENE[1] + (64 - size) / 2 + e[4] + (e[5] ? shake : 0)); // (above the window: at its top)
      st.add(sheet, x, y, [sx, sy, 64, 64], false, 0, size === 64 ? null : [size, size]);
    }
  }
  // under the scene: the party (character_output) and the faces at @play_y (line 1 = @play_y + 64, under the party)
  let size = 64, below = 0;
  if (d.out) { const o = out(st, ctx); size = o.size; below = o.rows - 1; }
  const spans = {};
  for (const p of d.play) {
    const [sheet, sx, sy] = pick(p);
    const line = p[4] ? p[4] + below : 0;
    st.add(sheet, PLAY_X + p[3], 0, [sx, sy, 64, 64], true, line);
    (spans[line] = spans[line] || []).push(p[3]);
  }
  for (const xs of Object.values(spans)) { // a row wider than the phone: every face smaller (the gaps too)
    const w = Math.max(...xs) - Math.min(...xs) + 64;
    if (w > ROW) size = Math.min(size, Math.floor((64 * ROW) / w / 4) * 4);
  }
  st.faceSize = size;
}
// the scenes of a chapter: every z1field number lo..hi (none in the data: the background colour only, as z1field's
// unmatched numbers), its films (set_battle_event) and battles (run by the chapter's flow)
export function chapterScenes(key, lo, hi, films, battles, more = {}) {
  const D = {};
  for (let n = lo; n <= hi; n++) {
    if (battles.includes(n)) continue;
    if (films.includes(n)) { D[n] = { draw: (st, ctx, q) => film(st, ctx, q, key, n) }; continue; }
    D[n] = { draw: async (st, ctx, q) => {
      const d = G && Z3(G)[key].scenes[n];
      if (!d) return;
      if (!d.shake) { drawScene(st, ctx, d); return; }
      // 61 frames: the face shakes 4 px up / down, turning every 4 frames (Z2 変身2)
      if (!q) audio.se('Z2 変身2', 80);
      let dir = -1;
      for (let x = 0; x <= 60; x++) {
        st.clear();
        drawScene(st, ctx, d, 4 * dir);
        if (q || st.ui.skipped) break;
        await st.ui.wait(1);
        if (x % 4 === 3) dir = -dir;
      }
    } };
  }
  addScenes({ ...D, ...more }, battles);
}

// ---------- set_battle_event: a battle film nobody plays (variable 96; all.rb 52555) ----------
// world.z3[key].films[n] = { party (actor), foe (enemy), acts: [[party attacks?, skill (null: a plain attack), hit?]] }
// as $attack_order runs them; afterwards variable 41 = variable 95 (or + 1), as Scene_Db_Battle_Anime ends.
async function film(st, ctx, q, key, n) {
  const v = ctx.s.var;
  if (!q && G) {
    const w = G.world, f = Z3(G)[key].films[n], a = w.actors[f.party], e = w.enemies[f.foe];
    const pp = { normal: a.sprite, special: a.special }, fp = { normal: e.portrait, special: e.sprite, size: e.size };
    const backdrop = Z3(G).z4b.backdrop;
    await loadImages([pp.normal, pp.special, fp.normal, fp.special, backdrop, ...ANIME_IMAGES]);
    await duelFilm(st.ui, f.acts.map(([p, skill, hit]) => ({ party: pp, foe: fp, ray: a.ray, p: !!p, skill, hit: !!hit })), backdrop);
  }
  v[41] = v[95] || v[41] + 1;
  v[95] = v[96] = 0;
}

// ---------- CE67 / CE68 セル変身 → CE45 (the transformation template) with Cell's pictures ----------
// the back (0,128), the auras (ブロリー_気1-3) at (88,128), the bodies (セル変身1-3) at (64,128): as src/z3c.js
// transformFilm — 90 frames, the sound and a 264-frame quake, the aura every 4 frames ×10, the body flickering every
// 8 frames (×5 cycles), every 4 (×7), the new body and the aura ×20
async function cellForm(st, ui, form) {
  const sh = sheets();
  ui.dlg.hidden = true;
  st.clear();
  screenPic(st, sh.back, 0, 128, [0, 0, 640, 224]);
  const wide = (p) => { const e = img(p); return [0, 0, e.ok ? e.im.width : 512, 224]; };
  await loadImages([sh.back, ...sh.auras, ...sh.cells]);
  const A = sh.auras.map((p) => screenPic(st, p, 88, 128, wide(p), 0));
  const B = [sh.cells[form - 1], sh.cells[form]].map((p, k) => screenPic(st, p, 64, 128, wide(p), k ? 0 : 255));
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

// ---------- the pages' own commands (tools/build_z4b.py converter) ----------
const refresh = (ctx) => { ctx.partyc = G.state.party.map((m) => m.id); };
addNodes({
  z4Ss: async (node, { ctx }) => { if (G) { superSaiyan(G.world, G.state, node.no, node.on); refresh(ctx); } }, // on / off_super_saiyazin
  // $partyc = [...]: the real party, except the films' line-ups ([4,4,4,4], [23,23,23]: who the scenes show only)
  z4Party: async (node, { ctx }) => {
    if (!G || new Set(node.ids).size < node.ids.length) { ctx.partyc = node.ids; return; }
    party(G, node.ids);
    refresh(ctx);
  },
  z4CellForm: async (node, { stage, ui, quiet }) => { if (!quiet) await cellForm(stage, ui, node.form); },
  z4SeStop: async () => audio.seStop(),
});

// ---------- battles ----------
// a story battle of battle_process ($Battle_MapID = 1 for all of these); afterwards the result switches (142 lost,
// 143 beaten, 144 the turns ran out) and reset_battle_flag (variables 81 / 82 / 94-96, switches 17 / 18 / 25-29)
export async function battle(game, no, opts = {}) {
  const s = game.state;
  const r = await fight(game, no, String(no), { backdrop: C(game).backdrop, ...opts });
  G = game;
  s.sw[142] = r === 'lose'; s.sw[143] = r === 'win'; s.sw[144] = r === 'break';
  for (const k of [17, 18, 25, 26, 27, 28, 29]) s.sw[k] = false;
  for (const k of [81, 82, 94, 95, 96]) s.var[k] = 0;
  return r;
}
// the pictures of a chapter's scenes (loaded before its pages play)
export function scenePics(game, key) {
  const z = Z3(game), sh = z.z4b.sheets;
  const set = new Set([sh.p3, sh.clothes, sh.long, sh.zg]);
  for (const d of Object.values(z[key].scenes)) {
    if (d.bg) set.add(d.bg);
    for (const it of [...d.ene, ...d.play]) if (it[0] !== '@cf') set.add(it[0]);
  }
  return [...set];
}
export async function playPages(game, key, ...pages) {
  await loadImages(scenePics(game, key));
  const P = Z3(game).pages;
  return playScenes(pages.map((p) => (Array.isArray(p) ? { nodes: P[key + p[0]][p[1]] } : { nodes: P[key + p] })), game.state);
}

// ---------- the flow ----------
chapterScenes('z4b', 2091, 2188, [2092, 2132, 2157, 2172], [2123, 2153, 2188]);

async function start(game) {
  const s = game.state;
  stop(game);
  s.flags.z3 = 'z4b';
  s.flags.z3At = null;
  await card(Z3(game).titles.z4b, 2200);
  s.var[95] = 0;
  s.var[41] = 2091;
  await playPages(game, 'z4b', 2091, 2093); // (the film 2092 between them: variable 41 → 2093)
  toField(game, C(game).field);
}
// map 43, Piccolo and Cell at (8,40) / (8,41): 2121 (switch 435 off) → battle 2123; 2151 (on, No. 16) → battle 2153
async function cell(game) {
  const s = game.state;
  stop(game);
  if (!s.sw[435]) {
    s.var[41] = 2121;
    await playPages(game, 'z4b', [2121, 0]);
    return battle2123(game);
  }
  s.var[41] = 2151;
  await playPages(game, 'z4b', [2151, 0]);
  return battle2153(game);
}
// Piccolo and No. 17 against Cell: 5 turns (variable 94) → 2131 (switch 143: beaten or not) → 2136 → No. 16 alone
async function battle2123(game) {
  const s = game.state;
  if (await battle(game, 2123, { turns: 5 }) === 'lose') return; // (lost: main.js loads the save made before it)
  s.var[41] = 2131;
  await playPages(game, 'z4b', 2131, 2136); // (the film 2132: variable 95 = 2136)
  toField(game, C(game).field16);
}
// No. 16 against Cell: our damage ×2.5, Cell's ×0.3 (variables 81 / 82 of page 12), 5 turns → 2156 (the film 2157)
// → 2161 No. 17 absorbed, 新気功砲 (the film 2172) → 2181 → battle 2188
async function battle2153(game) {
  const s = game.state;
  if (await battle(game, 2153, { turns: 5, dmgRate: s.var[81] || 2.5, foeRate: s.var[82] || 0.3 }) === 'lose') return;
  s.var[41] = 2156;
  await playPages(game, 'z4b', 2156, 2161, [2181, 0]);
  return battle2188(game);
}
// Tien, Yamcha and Chiaotzu against Cell's second form: 4 turns; lost goes on too (variable 239 = 2191)
async function battle2188(game) {
  const s = game.state;
  await battle(game, 2188, { turns: 4, loseOk: true });
  s.var[41] = 2191;
  s.flags.z4bDone = true;
  return nextZ3(game, 'z4b');
}

function boss(game, b) {
  if (game.busy || !b || b.key !== 'cell') return null;
  G = game;
  return cell(game);
}
const AT = { 2123: battle2123, 2153: battle2153, 2188: battle2188 };
function resume(game, at) {
  G = game;
  const f = AT[at && at.at];
  if (f) f(game);
  else toField(game);
}
function goal(world, s) {
  if (s.map !== '43') return '';
  return s.sw[435] ? '目標：16號前往沙魯那裡' : '目標：趕往比克與沙魯戰鬥的地方';
}

// ---------- development: index.html?dev=z4b / z4b43 / z4b16 / z4b2156 / z4b2188 (&timer in a hidden pane) ----------
// a plausible state at the hand-over from the first chapter (variable 41 = 2091); src/z4c.js uses it too
export async function devBase(game, key) {
  const w = game.world, s = game.newState();
  game.state = s;
  G = game;
  s.bench = {};
  const lv = { 3: 52, 4: 51, 5: 48, 6: 46, 7: 43, 8: 46, 9: 41, 10: 38, 12: 53, 17: 52, 24: 40 };
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
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, z3: key });
  Object.assign(s.var, { 40: 2, 43: 82, 101: 0 });
  Object.assign(s.sw, { 381: true, 483: true });
  s.cardiMax = 10;
  s.zeni = 30000;
  s.party = [];
  setParty(s, [4]);
  moveTo(s, { map: '43', x: 59, y: 5 });
  await applyEra(game);
  s.hand = newHand(w);
  game.startField();
  return s;
}
function dev(game, step) {
  if (!/^z4b(43|16|2156|2188)?$/.test(step)) return false;
  devState(game, step);
  return true;
}
async function devState(game, step) {
  const s = await devBase(game, 'z4b');
  if (step === 'z4b') return start(game);
  // after page 8: Tien, Chiaotzu and Yamcha on map 43
  Object.assign(s.var, { 43: 83, 41: 2120 });
  Object.assign(s.sw, { 113: true, 19: true });
  setParty(s, [8, 9, 7]);
  if (step === 'z4b43') return toField(game, C(game).field);
  // after page 11: No. 16 alone at (8,36) (switch 435: Piccolo and Cell already met)
  Object.assign(s.sw, { 435: true });
  s.var[43] = 84;
  s.var[41] = 2150;
  party(game, [23]);
  if (step === 'z4b16') return toField(game, C(game).field16);
  stop(game);
  if (step === 'z4b2156') { s.var[41] = 2156; await playPages(game, 'z4b', 2156, 2161, [2181, 0]); return battle2188(game); }
  party(game, [8, 7, 9]);
  Object.assign(s.var, { 41: 2188, 94: 4 });
  return battle2188(game);
}

registerZ3('z4b', { maps: MAPS, start, boss, resume, dev, goal });

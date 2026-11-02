// 熱戰・烈戰・超激戰（事件 8，頁 5000～5200，地圖 56）＋Episode of Bardock（事件 25，頁 5701～）：ZG 時之間的門 9902／9921 —
// docs/zg-broly.md (plan: docs/zg-plan.md); the data is world.z3.zgbroly and the 'zgbroly:' pages of world.z3.pages,
// built by tools/build_zg_broly.py. Each is a story of src/z3.js (registerZ3) started with startTrStory and ended
// with endTrStory (the main story's chapter comes back):
//   zgbroly  9902 → 5000 (variable 22 = 1: the 時之間 party aside, CE166 / CE168) → 5001-5081 → map 56 (66,40);
//            Paragus and Broly (7,9)/(8,9) → 5101 → battle 5111 → 5121 → battle 5131 → 5141 (switch 580) → 9903;
//            (66,41) → 9903 (CE157, CE168: the story party kept for next time) → the ZG hall (3,3)
//   zgeob    9921 → 5701 (variable 22 = 0, party [16]) → 5741 → 5791 → the film 5801 (set_battle_event 18) → 5811
//            (switch 585, Bardock learns 158, CE167) → 9922 → the ZG hall (13,3)
// The pages run one after another the way Map007 does (each sets variable 41 to the next one before its transfer).
import { audio, img, say, choose, loadImages } from './core.js?v=20261102-1344';
import { addScenes, addNodes } from './cutscene.js?v=20261102-1344';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261102-1344';
import { addMoves, ANIME_IMAGES } from './anime.js?v=20261102-1344';
import { syncSuperSaiyan, superSaiyan, FORMS } from './supersaiyan.js?v=20261102-1344';
import { duelFilm, screenPic } from './z3c.js?v=20261102-1344';
import { registerZ3, Z3, begin, play, fight, toField, party, member, heal, z3BackdropAt } from './z3.js?v=20261102-1344';
import { registerArea, registerBackdrop, startTrStory, endTrStory, goTo, healAll } from './timeroom.js?v=20261102-1344';

const C = (game) => Z3(game).zgbroly;
const MAP = '56';
const BATTLES = [5111, 5131], FILM = 5801;
let G = null; // the game, for the scene and node handlers (set whenever one of these stories takes over)
function stop(game) { G = game; ensure(game); begin(game); }

// ---------- the battle films of the moves met here (src/anime.js): the closest of the earlier films ----------
addMoves({
  519: 'foeWave', // 戦闘員
  521: 'foeWave', 522: 'raditzWave', 523: 'raditzBigWave', 524: 'raditzBigWave', // ブロリー(超)
  526: 'foeWave', 527: 'raditzWave', 528: 'raditzBigWave', 529: 'nappaBlast', // ブロリー(フルパワー)
  530: 'raditzBigWave', 531: 'raditzBigWave', 532: 'raditzBigWave', 533: 'raditzBigWave',
  155: 'galickGun', // 超バーダック スーパーファイナルリベンジャー (the film 5801; ファイナルリベンジャー 151 is this one too)
});

// ---------- the scenes (data: world.z3.zgbroly.scenes, z1field 5001-5143 / 5701-5816 from all.rb) ----------
// Z3 scenes are 512×128 pictures over the scroll window; faces at @ene1_x ± n (ENE; @ene1_y − 64 = a row above), the
// others under the scene (@play_x; @play_y + 64 = the second row). A phone shows the middle ~230 px of the scene, so
// rows of faces wider than that are drawn closer and smaller, and two rows in the scene share its 128 px.
const FIT = 224, ROW = 230;
// set_character_face (all.rb 19758, the Z3 part, variable 40 = 2): the face by the clothes the story has put on
function charFace(s, sx, sy) {
  const v = s.var || {}, sw = s.sw || {}, row = sy / 64, sh = C(G).sheets;
  const to = (sheet, r) => [sheet, sx, 64 * r];
  if (row === 0 && (v[171] === 1 || v[171] === 2)) return to(sh.clothes, 3); // 悟空
  if (row === 0 && v[171] === 3) return to(sh.clothes, 0);
  if (row === 11 && v[171] >= 1 && v[171] <= 3 && s.ss && s.ss[1]) return to(sh.clothes, { 1: 4, 2: 22, 3: 1 }[v[171]]); // 超悟空
  if (row === 2 && sw[445]) return to(sh.clothes, 8); // 悟飯
  if (row === 2 && v[172] === 1) return to(sh.clothes, 6);
  if (row === 15 && sw[388]) return to(sh.gohan2, 2);
  if (row === 7 && v[176] === 1) return to(sh.clothes, 21); // 雅木茶
  if (row === 13 && v[175] === 1) return to(sh.clothes, 11); // 巴達克 (スカウターなし)
  if (row === 29 && v[175] === 1) return to(sh.clothes, 12);
  if (row === 14 && v[173] >= 1 && v[173] <= 4) return v[173] === 1 ? to(sh.long, 1) : to(sh.clothes, { 2: 13, 3: 16, 4: 18 }[v[173]]); // 特蘭克斯
  if (row === 17 && v[173] >= 1 && v[173] <= 4) return v[173] === 1 ? to(sh.zg, 17) : to(sh.clothes, { 2: 14, 3: 17, 4: 19 }[v[173]]);
  if (row === 18 && v[177] === 1) return to(sh.clothes, 20); // 18號
  if (row === 21 && sw[363]) return to(sh.roshi, 2); // 龜仙人
  return to(sh.p3, row);
}
// character_output_all 0,0,0,mode (all.rb 167997): the party as the mode lists it, then the others of the list who
// are not in it, in the original's order (a Super Saiyan as he is)
const TARGETS = { 21: [3, 14, 4, 5, 18, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24] };
const ADD_ORDER = [[3, 14, 1], [4], [5, 18, 2], [6], [7], [8], [9], [10], [24], [12, 19, 3], [17, 20, 4], [25, 26, 6], [16, 32, 7],
  [27], [28], [29], [30], [15], [23], [22], [21], [31]];
function allIds(ctx, mode) {
  const t = TARGETS[mode], ss = ctx.s.ss || {};
  const ids = ctx.partyc.filter((id) => t.includes(id));
  for (const [a, b, no] of ADD_ORDER) {
    if (!t.includes(a) || ids.includes(a) || (b && ids.includes(b))) continue;
    ids.push(b && (ss[no] || (no === 2 && ss[5])) ? b : a);
  }
  return ids;
}
// one scene of the data
function drawScene(st, ctx, d) {
  const s = ctx.s;
  const pick = (it) => (it[0] === '@cf' ? charFace(s, it[1], it[2]) : it);
  if (d.bg) st.add(d.bg, SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
  // the Z2 216×170 picture over the scene, shifted up 21 px so its middle fits the 128-high window (as src/z2a.js)
  if (d.big) st.add(d.big[0], d.big[2], SCENE_Y - 21, d.big[1]);
  if (d.ene.length) {
    const xs = d.ene.map((e) => e[3]), lo = Math.min(...xs), hi = Math.max(...xs), cols = new Set(xs).size;
    const rows = [...new Set(d.ene.map((e) => e[4]))].sort((a, b) => a - b);
    const fit = hi - lo + 64 <= FIT;
    let size = fit ? 64 : Math.min(64, Math.floor(FIT / cols));
    if (rows.length > 1) size = Math.min(size, 60); // a row above (@ene1_y − 64): both inside the window
    const k = hi > lo ? (fit && size === 64 ? 1 : Math.min(1, (FIT - size) / (hi - lo))) : 1, mid = (hi + lo) / 2;
    for (const e of d.ene) {
      const [sheet, sx, sy] = pick(e);
      const x = k === 1 && size === 64 ? ENE[0] + e[3] : ENE[0] + 32 - size / 2 + (e[3] - (k === 1 ? 0 : mid)) * k;
      const y = rows.length > 1 ? SCENE_Y + 2 + rows.indexOf(e[4]) * (size + 4) : ENE[1] + (64 - size) / 2 + e[4];
      st.add(sheet, Math.round(x), Math.round(y), [sx, sy, 64, 64], false, 0, size === 64 ? null : [size, size]);
    }
  }
  // under the scene: the party (character_output / _all) and the faces at @play_y (line 1 = under the party)
  let size = 64, below = 0;
  if (d.out || d.all) {
    const ids = d.all ? allIds(ctx, d.all) : ctx.partyc, n = ids.length;
    const per = n > 10 ? 6 : n > 8 ? 5 : n > 6 ? 4 : 3;
    size = n > 10 ? 36 : n > 8 ? 40 : n > 6 ? 48 : 64;
    ids.forEach((id, j) => {
      const line = Math.floor(j / per), m = Math.min(per, n - per * line), i = j % per;
      const [sheet, sx, sy] = charFace(s, 0, 64 * (id - 3));
      st.add(sheet, PLAY_X - 32 * (m - 1) + 64 * i, 0, [sx, sy, 64, 64], true, line);
    });
    below = Math.ceil(n / per) - 1;
  }
  const spans = {};
  for (const p of d.play) {
    const [sheet, sx, sy] = pick(p);
    const line = d.out || d.all ? p[4] + below + (p[4] ? 0 : 1) : p[4];
    st.add(sheet, PLAY_X + p[3], 0, [sx, sy, 64, 64], true, line);
    (spans[line] = spans[line] || []).push(p[3]);
  }
  for (const xs of Object.values(spans)) { // a row wider than the phone: every face smaller (the gaps too)
    const w = Math.max(...xs) - Math.min(...xs) + 64;
    if (w > ROW) size = Math.min(size, Math.floor((64 * ROW) / w / 4) * 4);
  }
  st.faceSize = size;
}

// set_battle_event 18 (all.rb 52908): 超バーダック against チルド — スーパーファイナルリベンジャー, one blow that lands
// (Scene_Db_Battle_Anime; no damage is shown or dealt); afterwards variable 41 = variable 95 (5811)
async function film(st, quiet) {
  if (quiet || !G) return;
  const f = C(G).film;
  await loadImages([f.party.normal, f.party.special, f.foe.normal, f.foe.special, f.backdrop, ...ANIME_IMAGES]);
  if (f.bgm) audio.playBgm(f.bgm);
  await duelFilm(st.ui, [{ party: f.party, foe: f.foe, p: true, skill: f.skill, hit: true, ray: 'orange' }], f.backdrop);
}

let ready = false;
function ensure(game) {
  G = game;
  if (ready) return;
  ready = true;
  const c = C(game), D = {};
  for (const [n, d] of Object.entries(c.scenes)) D[n] = { draw: (st, ctx) => drawScene(st, ctx, d) };
  D[FILM] = { draw: (st, ctx, quiet) => film(st, quiet) };
  addScenes(D, BATTLES, c.pictures);
}

// ---------- CE59 / CE60 / CE66 → CE45: the transformation (Broly 超, full power; Bardock) ----------
// the back (0,128), the three auras and the two bodies where variables 97-100 put them: 90 frames, the sound and a
// 264-frame quake, the aura cycling every 4 frames ×10, then the body flickering every 8 frames (×5 cycles), every 4
// (×7), the new body and the aura ×20 (as src/z3c.js transformFilm / src/z4f.js)
async function formFilm(st, ui, f) {
  ui.dlg.hidden = true;
  st.clear();
  const wide = (p) => { const e = img(p); return [0, 0, e.ok ? e.im.width : 286, 224]; };
  screenPic(st, f.back, 0, 128, [0, 0, 640, 224]);
  const A = f.auras.map((p) => screenPic(st, p, f.ax, 128, wide(p), 0));
  const B = f.bodies.map((p, k) => screenPic(st, p, f.bx, 128, wide(p), k ? 0 : 255));
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

// ---------- the party kept aside (CE166 / CE167 / CE168: $tmp_partyc[variable 22], with the Super Saiyans) ----------
const K = (s) => (s.flags.zgb = s.flags.zgb || { tmp: {} });
const noForms = (ss = {}) => Object.fromEntries(Object.keys(FORMS).map((no) => [no, !!ss[no]]));
const snapshot = (s) => ({ ids: s.party.map((m) => m.id), ss: { ...(s.ss || {}) } });
function restore(game, t) {
  if (!t) return;
  const s = game.state;
  syncSuperSaiyan(game.world, s, noForms(t.ss)); // (CE157: who is a Super Saiyan, as that party was)
  party(game, [...new Set(t.ids)]);
  for (const m of s.party) m.ko = false;
  s.var[42] = s.party[0].id; // (CE167 / CE168: the lead on the map)
}
const keep = (game) => { const s = game.state; K(s).tmp[s.var[22] || 0] = snapshot(s); }; // CE166
const back = (game) => { const s = game.state; restore(game, K(s).tmp[s.var[22] || 0]); }; // CE167
function swap(game) { // CE168
  const s = game.state, k = s.var[22] || 0, t = K(s).tmp[k];
  K(s).tmp[k] = snapshot(s);
  restore(game, t);
}
// CE61 トランクス技切り替え: Trunks' (and Super Trunks') sword moves by his clothes (variable 173; switch 438 the sword)
function trunksMoves(game) {
  const s = game.state, w = game.world, v = s.var[173] || 0;
  if (v === 0 || v === 4) s.sw[438] = false;
  if (v >= 1 && v <= 3) s.sw[438] = true;
  const learn = (id, skill, on) => {
    const m = s.party.find((x) => x.id === id) || (s.bench || {})[id];
    s.forms = s.forms || {};
    const list = m ? m.skills : (s.forms[id] = s.forms[id] || { skills: [...((w.actors[id] || {}).skills || [])] }).skills;
    const k = list.indexOf(skill);
    if (on && k < 0) list.push(skill);
    if (!on && k >= 0) list.splice(k, 1);
  };
  for (const id of [17, 20]) {
    for (const sk of [172, 173, 177, 178, 181]) learn(id, sk, false);
    if (s.sw[438]) { learn(id, 172, true); learn(id, 177, true); continue; }
    learn(id, 173, true);
    if (s.sw[437] || s.sw[861]) learn(id, 178, true); // ヒートドーム覚える
    else learn(id, 181, true);
  }
}

addNodes({
  zgbCE: async (node, { ctx }) => {
    if (!G) return;
    if (node.n === 166) keep(G);
    else if (node.n === 167) back(G);
    else if (node.n === 168) swap(G);
    else if (node.n === 61) trunksMoves(G);
    ctx.partyc = G.state.party.map((m) => m.id);
  },
  zgbParty: async (node, { ctx }) => { if (G) { party(G, node.ids); ctx.partyc = G.state.party.map((m) => m.id); } }, // $partyc = [...]
  zgbSs: async (node, { ctx }) => { // on_super_saiyazin n (7: Bardock — the remake has no 超バーダック actor yet: the scenes show his face)
    if (!G) return;
    superSaiyan(G.world, G.state, node.no, node.on);
    ctx.partyc = G.state.party.map((m) => m.id);
  },
  zgbSsOff: async (node, { ctx }) => { if (G) { syncSuperSaiyan(G.world, G.state, noForms()); ctx.partyc = G.state.party.map((m) => m.id); } }, // CE159
  zgbForm: async (node, { stage, ui, quiet }) => { if (!quiet && G) await formFilm(stage, ui, C(G).forms[node.n]); },
  zgbSeStop: async () => audio.seStop(),
  zgbVarVar: async (node, { s }) => { s.var[node.a] = s.var[node.b] || 0; },
});

// ---------- the story ----------
const page = (game, v) => Z3(game).pages[`zgbroly:${v}`];
// the pages from v on, one after another; a battle_process number runs that battle (won: variable 95 is the next
// page, chk_set_event_no), the film's number goes on to variable 95 too. Returns where it stopped (variable 41), or
// null after a lost battle (src/main.js loads the save fight() made before it).
async function run(game, v) {
  const s = game.state;
  for (;;) {
    if (BATTLES.includes(v)) {
      const r = await fight(game, v, String(v), { backdrop: Z3(game).battles[v].backdrop });
      G = game;
      if (r !== 'win') return null;
      v = s.var[95] || v + 10;
      s.var[95] = 0;
      continue;
    }
    if (!page(game, v)) return v;
    s.var[41] = v;
    await play(game, `zgbroly:${v}`);
    v = s.var[41];
    if (v === FILM) { v = s.var[95]; s.var[95] = 0; }
  }
}
async function go(game, v) {
  const end = await run(game, v);
  if (end === null) return;
  if (end === 9903) return leaveBroly(game);
  if (end === 9922) return leaveEob(game);
  toField(game, C(game).start); // (5081: map 56 (66,40))
}

// 5000: the door of the ZG hall
async function startBroly(game) {
  const s = game.state, c = C(game);
  stop(game);
  s.var[22] = 1;
  if (!s.sw[589]) {
    keep(game); // CE166
    audio.playBgm('DB3 イベント06');
    await say([['', c.ask.join('\n')]], true);
    if (await choose(['是', '否']) !== 0) { // 否: back under the door
      audio.se('Z1 出る');
      endTrStory(game, c.door);
      return;
    }
    return go(game, 5001);
  }
  // again (switch 589: the story has begun): CE168 — the story party back — Trunks' clothes, everyone recovered
  swap(game);
  s.var[174] = s.var[173] || 0;
  s.var[173] = 3;
  s.sw[438] = true;
  trunksMoves(game); // CE61
  healAll(game);
  for (const m of s.party) m.ko = false;
  s.sw[360] = false; s.sw[19] = false; s.sw[78] = true;
  s.var[43] = 121;
  audio.se('Z1 入る');
  toField(game, c.start);
}
// 9903: back to the 時之間 — CE182 (the area cards), CE157 + CE168 (the 時之間 party back, as it was), the hall (3,3)
function leaveBroly(game) {
  const s = game.state;
  stop(game);
  s.var[22] = 1;
  swap(game);
  s.sw[360] = true;
  s.var[43] = 999;
  s.sw[78] = false; s.sw[19] = true;
  audio.se('Z1 入る');
  endTrStory(game, C(game).door);
}
// 9922: CE182, variable 43 = 999, the hall (13,3) (CE167 has put the party back in 5811)
function leaveEob(game) {
  const s = game.state;
  stop(game);
  s.var[43] = 999;
  audio.se('Z1 入る');
  endTrStory(game, C(game).eobDoor);
}

function spot(game, poi) {
  stop(game);
  if (poi.page === 'boss') return go(game, 5101); // パラガスとブロリー
  if (poi.page === 'back') return leaveBroly(game);
  return null;
}

registerArea(9902, (game) => startTrStory(game, 'zgbroly'));
registerArea(9921, (game) => startTrStory(game, 'zgeob'));
registerBackdrop(MAP, (game) => z3BackdropAt(game)); // set_battle_map (variable 301 = 2): tile 1583 → row 28

registerZ3('zgbroly', {
  maps: [MAP],
  start: startBroly,
  spot,
  resume(game, at) { stop(game); return go(game, Number(at.at)); }, // a story battle (5111 / 5131) again
  goal: (world, s) => (s.map === MAP ? '目標：前往帕拉伽斯和布羅利那裡' : ''),
  dev: (game, step) => dev(game, step),
});
registerZ3('zgeob', {
  start(game) { stop(game); return go(game, 5701); },
  resume(game, at) { stop(game); return go(game, Number(at.at)); },
  goal: () => '',
});

// ---------- ?dev= (&timer) ----------
// zgbroly / zgeob: a Z4-end save in the ZG hall, through the door; zgbrolyfield: the story begun, on map 56 next to
// Paragus and Broly; zgbrolyboss: straight into 5101; zgbroly2: the door again after leaving half-way;
// zgeobfilm: from 5791 (the transformation, the film, the end)
function dev(game, step) {
  const k = /^zg(broly|eob)(field|boss|2|film)?$/.exec(step);
  if (!k) return false;
  const [, which, sub] = k;
  if (which === 'eob' ? sub && sub !== 'film' : sub === 'film') return false;
  const s = game.state = game.newState();
  s.var[40] = 2;
  for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 459, 570, 521, 545, 429, 532, 421, 533, 561,
    563, 564, 566, 568]) s.sw[n] = true;
  if (which === 'eob') s.sw[580] = s.sw[581] = true;
  s.flags.z3 = 'done';
  party(game, [3, 5, 4, 12, 17, 6]);
  s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
  // page 15 has run (src/timeroom.js enter): the ZG hall, under the door
  s.flags.tr = { back: { map: s.map, x: s.x, y: s.y }, v43: 0, v17: 2, party: s.party.map((m) => m.id), ss: {} };
  Object.assign(s.var, { 43: 999, 17: 2, 23: 2 });
  Object.assign(s.sw, { 78: true, 466: true, 470: true, 473: true });
  for (const m of s.party) heal(m);
  game.startField();
  stop(game);
  goTo(game, which === 'eob' ? C(game).eobDoor : C(game).door);
  if (sub === '2') { prepare(game); swap(game); } // left half-way: the 時之間 party in use, the story party aside
  if (!sub || sub === '2') { stop(game); startTrStory(game, which === 'eob' ? 'zgeob' : 'zgbroly'); return true; }
  s.flags.trStory = { main: s.flags.z3 };
  if (which === 'eob') { // from 5791: the state 5701 / 5741 leave
    s.flags.z3 = 'zgeob';
    s.var[22] = 0;
    keep(game);
    s.var[175] = 1;
    s.sw[594] = true;
    party(game, [16]);
    healAll(game);
    stop(game);
    go(game, 5791);
    return true;
  }
  s.flags.z3 = 'zgbroly';
  prepare(game);
  stop(game);
  if (sub === 'boss') go(game, 5101);
  else toField(game, { map: MAP, x: 8, y: 11 });
  return true;
}
// the state after 5081 (switch 589: the story has begun; the 時之間 party aside)
function prepare(game) {
  const s = game.state;
  s.var[22] = 1;
  keep(game);
  s.sw[589] = true;
  Object.assign(s.var, { 173: 3, 174: 3, 43: 121, 324: 63 });
  party(game, [3, 4, 5, 12, 17, 6, 7, 8, 9]);
  trunksMoves(game);
  healAll(game);
}

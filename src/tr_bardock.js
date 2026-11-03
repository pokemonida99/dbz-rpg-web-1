// 巴達克篇 Z1／Z2（門 9151、9351：Map007 事件 4、10，地圖 31、54、65） — docs/tr-bardock.md; the data is built by
// tools/build_tr_bardock.py (world.trBardock: the pages, the z1field scenes as drawing steps, the battles).
//   Z1 (door 9151 of the Z1 hall): page 800 (是 / 否) → 801: CE161 — the Bardock part has its own actors, skills, cards,
//     shared EXP (Share.main_z1bar_varchange: the main story's are kept aside, state.flags.trbd) — the opening → map 31:
//     the Kame House 841, Raditz 831 → battle 832 → 833 → the end (9152: CE162, back to the hall), Popo 851 → battle
//     852 → 853 / 861, the cave (map 65, 871-874) and its boss 881 → battle 882.
//   Z2 (door 9351 of the Z2 hall): page 3000 → CE163 (Bardock alone, the main story's Bardock) → 3001-3111 (the film of
//     set_battle_event 12, the pods passing on maps 53 / 52) → map 54 → the goal 3161 (film 13) → 3181 → CE164.
// The pages run one after another the way Map007 does (variable 41; a transfer to map 7 = the next page).
import { registerArea, registerTrSpot, registerBackdrop, goTo, healAll } from './timeroom.js?v=20261104-0520';
import { registerZ3, begin, party, member, heal, leave } from './z3.js?v=20261104-0520';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261104-0520';
import { ENE, PLAY_X } from './opening.js?v=20261104-0520';
import { audio, view, img, loadImages, setFaces } from './core.js?v=20261104-0520';
import { eventCard } from './items.js?v=20261104-0520';
import { makeMember, applyLevel } from './party.js?v=20261104-0520';
import { applyEra } from './era.js?v=20261104-0520';
import { newHand } from './battle.js?v=20261104-0520';
import { syncSuperSaiyan, FORMS } from './supersaiyan.js?v=20261104-0520';
import { moveTo } from './chapter2.js?v=20261104-0520';
import { drawTile, tileSheetPaths } from './tiles.js?v=20261104-0520';
import { duelFilm } from './z3c.js?v=20261104-0520';
import { ANIME_IMAGES, addMoves } from './anime.js?v=20261104-0520';

const T = (game) => game.world.trBardock;
let G = null; // the game, for the scene and node handlers
let goal = null; // where the page that just played sends the party (its 201 transfer)
let fightNo = 0; // a scene that is a battle_process (z1field 832 / 852 / 882): the battle comes once the page is over

// the Bardock part's own moves (CE161: 159-163 instead of 147-152), with the films of the main story's ones (src/z2b.js)
addMoves({ 159: 'energyWave', 160: 'kamehameha', 161: 'vegetaBlast', 162: 'kaioken', 163: 'galickGun' });

// ---------- the scenes: z1field 801-882 / 3001-3188 (tools/build_tr_bardock.py scene_ops) ----------
const PIC = (n) => `Graphics/Pictures/${n}`;
const PARTY = PIC('Z1_顔味方.PNG'), Z2P = PIC('Z2_顔味方.PNG'), Z2KIT = PIC('Z2_顔味方_衣替.png');
const val = (v, x) => (Array.isArray(v) ? v[0] + v[1] * x : v);
// one add_chr → a sprite of the stage; cf = set_character_face (Z2: 顔味方, Bardock without his headband while
// variable 163 = 1 → Z2_顔味方_衣替 row 2)
function sprite(it, x, s) {
  let path = it.p, r = it.r && it.r.map((n) => val(n, x));
  if (it.cf) {
    const [c, row] = it.cf;
    [path, r] = row === 13 && (s.var[163] || 0) === 1 ? [Z2KIT, [64 * c, 128, 64, 64]] : [Z2P, [64 * c, 64 * row, 64, 64]];
  }
  return { path, r, x: val(it.x, x), y: val(it.y, x), line: it.line };
}
// character_output: the party's faces under the scene, three a row (as src/cutscene.js partyFaces)
function partyFaces(ids) {
  const per = ids.length > 6 ? 4 : 3;
  return ids.map((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    return { path: PARTY, r: [0, 64 * (id - 3), 64, 64], x: PLAY_X - 32 * (m - 1) + 64 * j, y: 0, line };
  });
}
const isFace = (sp) => sp.r && sp.r[2] === 64 && sp.r[3] === 64 && /顔/.test(sp.path);
// puts the sprites on the stage. The original's 640-wide screen has room for faces 128 px either side of the scene;
// a phone has about 115: faces that would fall off are drawn smaller and closer, the way src/z3b.js does by hand.
function place(st, list) {
  st.clear();
  let k = 1, under = 64;
  for (const sp of list) {
    const cx = sp.x + 32 - 320;
    if (sp.line != null) { under = Math.min(under, Math.floor(115 / (Math.abs(cx) / 64 + 0.5))); continue; }
    if (isFace(sp)) k = Math.min(k, 115 / (Math.abs(cx) + 32), 64 / (Math.abs(sp.y + 32 - 110) + 32));
  }
  const rows = Math.max(0, ...list.filter((sp) => sp.line != null).map((sp) => sp.line));
  st.faceSize = Math.min(under, rows > 0 && list.filter((sp) => sp.line != null).length > 6 ? 48 : 64);
  for (const sp of list) {
    if (sp.line != null) { st.add(sp.path, sp.x, 0, sp.r, true, sp.line); continue; }
    if (isFace(sp) && k < 1) {
      const z = Math.round(64 * k), cx = 320 + (sp.x + 32 - 320) * k, cy = 110 + (sp.y + 32 - 110) * k;
      st.add(sp.path, Math.round(cx - z / 2), Math.round(cy - z / 2), sp.r, false, 0, [z, z]);
    } else st.add(sp.path, sp.x, sp.y, sp.r);
  }
}
async function drawScene(st, ctx, quiet, ops) {
  const s = ctx.s, v = s.var;
  let list = [];
  for (const op of ops) {
    const [kind] = op;
    if (kind === 'pic') list.push(sprite(op[1], 0, s));
    else if (kind === 'out') list.push(...partyFaces(ctx.partyc));
    else if (kind === 'bgm') { if (!quiet) audio.playBgm(op[1]); }
    else if (kind === 'se') { if (!quiet) audio.se(op[1], 80); }
    else if (kind === 'next') v[41] = (v[41] || 0) + op[1];
    else if (kind === 'leave') { if (G) leave(G, op[1]); ctx.partyc = ctx.partyc.filter((id) => id !== op[1]); }
    else if (kind === 'anim') { // for x in a..b … Graphics.update: one frame each, the screen cleared in between
      const [, a, b, keep, items, n] = op;
      v[41] = (v[41] || 0) + n * (b - a + 1);
      if (quiet) continue;
      if (list.length) place(st, list);
      for (let x = a; x <= b && !st.ui.skipped; x++) {
        list = items.map((it) => sprite(it, x, s));
        place(st, list);
        await st.ui.wait(1);
      }
      list = keep ? items.map((it) => sprite(it, b, s)) : [];
    } else if (kind === 'film') { if (!quiet) await film(st, s); }
    else if (kind === 'battle') fightNo = v[41];
  }
  if (!quiet) place(st, list);
}
// set_battle_event 12 / 13 (Scene_Db_Battle_Anime: Bardock's long fights with the 惑星戦士 / Frieza, actions 179 /
// 180): here the nearest film of the battle screen — his 能量波 on the warriors, and his last blow at Frieza
async function film(st, s) {
  if (!G) return;
  const w = G.world, no = s.var[41], f = T(G).films[no];
  if (!f) return;
  const a = w.actors[16], e = w.enemies[f.foe];
  const party = { normal: a.sprite, special: a.special }, foe = { normal: e.portrait, special: e.sprite, size: e.size };
  const acts = no === 3071 ? [{ p: true, skill: 147, hit: true }] : [{ p: true, skill: 152, hit: false }];
  const bd = 'bg/z2_battle_0.png';
  await loadImages([party.normal, party.special, foe.normal, foe.special, bd, ...ANIME_IMAGES]);
  await duelFilm(st.ui, acts.map((x) => ({ party, foe, ray: a.ray, ...x })), bd);
}
let ready = false;
function ensure(game) {
  G = game;
  if (ready) return;
  ready = true;
  const t = T(game);
  addScenes(Object.fromEntries(Object.entries(t.scenes).map(([n, ops]) => [n, { draw: (st, ctx, quiet) => drawScene(st, ctx, quiet, ops) }])),
    [], t.pictures);
}

// ---------- the nodes of the pages ----------
addNodes({
  trbdGo: async (node) => { goal = node.to; },
  trbdCE: async (node, { ctx }) => {
    if (!G) return;
    if (node.n === 161) await setupZ1(G);
    if (node.n === 163) await setupZ2(G);
    ctx.partyc = G.state.party.map((m) => m.id);
  },
  trbdHand: async () => { if (G) G.state.hand = newHand(); }, // $eve.allcardexchange
  trbdHeal: async () => { if (G) healAll(G); },
  trbdParty: async (node, { ctx }) => { if (G) { party(G, node.ids); ctx.partyc = [...node.ids]; } },
  trbdSeStop: async () => audio.seStop(),
});

// ---------- the main story kept aside (state.flags.trbd) ----------
const K = (s) => (s.flags.trbd = s.flags.trbd || {});
const PICCOLO = [31, 33, 34, 35, 36]; // $cha_skill_level of Piccolo's moves: variables 61-66 (main) / 71-76 (Bardock part)
const noForms = () => Object.fromEntries(Object.keys(FORMS).map((no) => [no, false]));
const setPos = (s) => { s.var[13] = Number(s.map); s.var[1] = Math.floor(s.x / 32); s.var[2] = Math.floor(s.y / 32); };
const learn = (m, skill, on) => {
  const k = m.skills.indexOf(skill);
  if (on && k < 0) m.skills.push(skill);
  if (!on && k >= 0) m.skills.splice(k, 1);
};

// CE161 Z1バーダック編準備: variable 43 = 101, the story variables kept (235-238), variable 40 = 0, switches 507 /
// 526 / 527 off; CE166 (the party aside); the first time (switch 525 off) the Bardock part starts afresh — a copy of
// the actors with Bardock and Piccolo at level 1, no SP skills or ZP, no cards; otherwise the one left last time.
// Then main_z1bar_varchange (actors, skills, ZP, cards, defeats, shared EXP 305 / 324 swapped), party [16, 4].
async function setupZ1(game) {
  const s = game.state, w = game.world, k = K(s), t = T(game);
  k.arc = 'z1';
  s.skillLv = s.skillLv || {};
  k.keep = { v40: s.var[40] || 0, v43: s.var[43] || 0, hand: s.hand, pic: PICCOLO.map((id) => s.skillLv[id] || 0) };
  s.var[43] = 101;
  s.var[40] = 0;
  for (const n of [507, 526, 527]) s.sw[n] = false;
  k.main = { party: s.party, bench: s.bench || {}, forms: s.forms || {}, cards: s.cards || {}, defeats: s.defeats || {},
    v305: s.var[305] || 0, v324: s.var[324] || 0, ss: s.ss || {} };
  let bar = s.sw[525] && k.z1;
  if (!bar) {
    const mainOf = (id) => k.main.party.find((m) => m.id === id) || k.main.bench[id];
    const fresh = (id) => {
      const m = makeMember(w, id), was = mainOf(id);
      if (was) m.skills = [...was.skills];
      m.level = 1; m.exp = 0; m.maxLv = 1;
      applyLevel(w, m);
      heal(m);
      return m;
    };
    bar = { party: [fresh(16), fresh(4)], bench: {}, forms: {}, cards: {}, defeats: {}, v305: 0, v324: 0, pic: [0, 0, 0, 0, 0] };
    for (const [id, on, skill] of t.ce161) learn(bar.party.find((m) => m.id === id), skill, on);
  }
  s.party = bar.party; s.bench = bar.bench; s.forms = bar.forms; s.cards = bar.cards; s.defeats = bar.defeats;
  s.var[305] = bar.v305; s.var[324] = bar.v324; s.ss = {};
  PICCOLO.forEach((id, i) => { s.skillLv[id] = bar.pic[i] || 0; });
  k.z1 = null;
  party(game, [16, 4]);
  healAll(game);
  s.var[42] = 16;
  await applyEra(game);
}
// CE162 Z1バーダック編完了 + page 9152: the Bardock part put aside for next time, the main story back as it was
async function finishZ1(game) {
  const s = game.state, k = K(s);
  if (k.arc !== 'z1') return;
  s.var[43] = 999;
  s.var[40] = k.keep.v40;
  s.sw[507] = false;
  s.sw[153] = false;
  s.skillLv = s.skillLv || {};
  k.z1 = { party: s.party, bench: s.bench, forms: s.forms, cards: s.cards, defeats: s.defeats, v305: s.var[305] || 0,
    v324: s.var[324] || 0, pic: PICCOLO.map((id) => s.skillLv[id] || 0) };
  const m = k.main;
  s.party = m.party; s.bench = m.bench; s.forms = m.forms; s.cards = m.cards; s.defeats = m.defeats;
  s.var[305] = m.v305; s.var[324] = m.v324; s.ss = m.ss;
  PICCOLO.forEach((id, i) => { s.skillLv[id] = k.keep.pic[i]; });
  s.hand = k.keep.hand;
  for (const p of s.party) p.ko = false;
  healAll(game);
  s.var[42] = s.party[0].id;
  eventCard(s, 37, -99); // CE182
  eventCard(s, 124, -99);
  delete k.main; delete k.keep; delete k.arc;
  await applyEra(game);
}
// CE163 Z2バーダック編準備: the story variables kept, variable 40 = 1, 163 = 1 (no headband), 43 = 41, switches 19 /
// 111, Bardock forgets 152 / 158, CE166 (the party aside), party [16] — the main story's own Bardock
async function setupZ2(game) {
  const s = game.state, w = game.world, k = K(s);
  k.arc = 'z2';
  k.keep = { v40: s.var[40] || 0, v43: s.var[43] || 0, v17: s.var[17] || 0, ss: { ...(s.ss || {}) } };
  syncSuperSaiyan(w, s, noForms()); // (the Super Saiyan forms back to normal while the party is aside)
  k.keep.ids = s.party.map((m) => m.id);
  s.var[40] = 1;
  s.var[163] = 1;
  s.sw[19] = true;
  s.var[43] = 41;
  s.sw[111] = true;
  const b = member(game, 16);
  k.keep.had = T(game).ce163.filter(([, on, skill]) => !on && b.skills.includes(skill)).map(([, , skill]) => skill);
  for (const [, on, skill] of T(game).ce163) learn(b, skill, on);
  party(game, [16]);
  healAll(game);
  s.var[42] = 16;
  await applyEra(game);
}
// CE164 Z2バーダック編完了: the party and the story variables back (Bardock keeps what he earned: he is the main
// story's own); he learns 152 again (and here also 158 if he had it: the original leaves 超サイヤ人變身 forgotten)
async function finishZ2(game) {
  const s = game.state, k = K(s);
  if (k.arc !== 'z2') return;
  s.var[43] = 999;
  s.var[40] = k.keep.v40;
  s.var[17] = k.keep.v17;
  s.sw[152] = false;
  const b = member(game, 16);
  for (const skill of k.keep.had) learn(b, skill, true);
  party(game, k.keep.ids);
  syncSuperSaiyan(game.world, s, { ...noForms(), ...k.keep.ss });
  for (const p of s.party) p.ko = false;
  healAll(game);
  s.var[42] = s.party[0].id;
  eventCard(s, 37, -99); // CE182
  eventCard(s, 124, -99);
  delete k.keep; delete k.arc;
  await applyEra(game);
}

// ---------- running the pages ----------
function playPage(game, v) {
  ensure(game);
  goal = null;
  fightNo = 0;
  return playScenes([{ nodes: T(game).pages[v] }], game.state);
}
// a story battle of battle_process (832 / 852 / 882): the flags the page set (switch 27: HP 40 % …), its background
async function battle(game, no) {
  const s = game.state, sw = s.sw, b = T(game).battles[no];
  const flags = { alone: !!sw[25], hp30: !!sw[26], hp40: !!sw[27], two: !!sw[28], hp50: !!sw[29] };
  game.busy = false;
  const won = await game.startBattle(b.foes, true, { backdrop: b.backdrop, ...(b.bgm ? { bgm: b.bgm } : { eventBgm: true }), ...flags });
  for (let n = 25; n <= 29; n++) sw[n] = false;
  begin(game);
  return won;
}
// from page v on, as Map007 runs them: a page that draws a battle_process scene ends in that battle; one that turns
// switch 128 on (a battle or a film) goes on to variable 95 afterwards (or the next number); a transfer to map 7
// starts the page of variable 41.
// Returns where the party goes next ({map, x, y}), or null when a battle was lost (the game loads the last save).
async function runPages(game, v) {
  const s = game.state, t = T(game);
  for (;;) {
    s.var[41] = v;
    await playPage(game, v);
    const g = goal, no = fightNo;
    if (no && t.battles[no] && !(await battle(game, no))) return null;
    if (s.sw[128] || no) {
      s.sw[128] = false;
      s.var[41] = s.var[95] || s.var[41] + 1;
      s.var[95] = 0;
      s.var[96] = 0;
      for (const n of [121, 129, 135]) s.sw[n] = false;
      s.sw[17] = true;
    }
    if (g === 'back') return { map: String(s.var[13]), x: s.var[1], y: s.var[2] };
    if (g && g[0] !== 7) {
      if (g[0] === 53 || g[0] === 52) { await pods(game, String(g[0]), g); v = s.var[41]; continue; }
      return { map: String(g[0]), x: g[1], y: g[2] };
    }
    v = s.var[41];
    if (!t.pages[v]) return { map: s.map, x: Math.floor(s.x / 32), y: Math.floor(s.y / 32), end: v };
  }
}
// where a run of pages ended: the end of a part (9152 / 9352) back to the hall, or a square of the field
async function arrive(game, to) {
  if (!to) return;
  const s = game.state;
  if (s.var[41] === 9152) { await finishZ1(game); s.var[41] = 0; return goTo(game, T(game).z1.back); }
  if (s.var[41] === 9352) { await finishZ2(game); s.var[41] = 0; return goTo(game, T(game).z2.back); }
  s.var[41] = 0;
  goTo(game, to);
}

// maps 53 / 52: Bardock's pod and Kakarot's pass each other (event 15: Bardock's 15 tiles down, Kakarot's 15 up at
// move speed 5 — 8 frames a tile — then the wait of the page), seen from (18,25); nobody walks there
async function pods(game, mid, at) {
  const s = game.state, p = T(game).pods[mid];
  moveTo(s, { map: mid, x: at[1], y: at[2] });
  await loadImages(tileSheetPaths);
  game.startField();
  const f = game.field;
  f.paused = true;
  game.busy = true;
  f.leave();
  const pod = (q) => ({ x: q[0] * 32, y: q[1] * 32, tile: q[2] });
  const a = pod(p.bardock), b = pod(p.kakarot);
  const draw0 = f.draw.bind(f);
  f.draw = () => {
    const c = view.begin(), W = f.map.w * 32, H = f.map.h * 32;
    const cx = Math.round(Math.max(0, Math.min(W - view.w, s.x - view.w / 2))), cy = Math.round(Math.max(0, Math.min(H - view.h, s.y - view.h / 2)));
    c.fillStyle = '#000';
    c.fillRect(0, 0, view.w, view.h);
    c.drawImage(f.layers.ground, -cx, -cy);
    const bm = tileSheetPaths.map((q) => { const e = img(q); return e.ok ? e.im : null; });
    drawTile(c, bm, a.tile, a.x - cx, a.y - cy, 0);
    drawTile(c, bm, b.tile, b.x - cx, b.y - cy, 0);
    c.drawImage(f.layers.upper, -cx, -cy);
  };
  const frames = (n) => new Promise((res) => setTimeout(res, (n * 1000) / 60));
  audio.se('Z2 宇宙船移動', 80);
  for (let k = 0; k < 15 * 8; k++) { a.y += 4; b.y -= 4; await frames(1); }
  s.sw[503] = true;
  await frames(p.wait);
  f.draw = draw0;
  begin(game);
}

// ---------- the battle backgrounds of the random encounters (set_battle_map: Z1 by the ground tile, Z2 space) ----------
function backdrop(game) {
  const s = game.state;
  if (s.map === '54') return 'bg/z2_battle_0.png';
  if (s.map !== '31' && s.map !== '65') return null;
  const m = game.world.maps[s.map], i = Math.floor(s.x / 32) + Math.floor(s.y / 32) * m.w;
  const row = T(game).tiles[m.layers[0][i]];
  return row == null ? null : `bg/trbd_z1_${row}.png`;
}
for (const m of ['31', '65', '54']) registerBackdrop(m, backdrop);

// ---------- the doors ----------
// 9151: variable 41 = 800 (page 800: 「在通关之前无法回到时之间　要移动吗？」), 9351: 3000
async function door(game, first, at) {
  const s = game.state;
  ensure(game);
  begin(game);
  setFaces({ ...game.world.faces });
  moveTo(s, at);
  setPos(s);
  return arrive(game, await runPages(game, first));
}
registerArea(9151, (game) => door(game, 800, T(game).z1.door));
registerArea(9351, (game) => door(game, 3000, T(game).z2.door));

// ---------- the squares of maps 31 / 65 / 54 (145_Event_Check.rb) ----------
async function spot(game, first, save = false) {
  const s = game.state;
  ensure(game);
  if (save) game.save(true); // (a lost battle loads this: the story square is there to try again)
  begin(game);
  setPos(s);
  return arrive(game, await runPages(game, first));
}
registerTrSpot('trbdKame', (game) => spot(game, 841));
registerTrSpot('trbdRaditz', (game) => spot(game, 831, true));
registerTrSpot('trbdPopo', (game) => (game.state.sw[526] ? spot(game, 861) : spot(game, 851, true)));
registerTrSpot('trbdCaveBoss', (game) => spot(game, 881, true));
registerTrSpot('trbdFrieza', (game) => spot(game, 3161, true));
registerTrSpot('trbdCave', (game, poi) => { // 871-874: through the cave
  ensure(game);
  begin(game);
  const [map, x, y] = T(game).cave[`${poi.x},${poi.y}`];
  return goTo(game, { map: String(map), x, y });
});

// ---------- development: ?dev=trbd (the Z1 door) / trbdfield (map 31) / trbdcave (map 65) / trbd2 (the Z2 door) /
// trbd2field (map 54 by the goal); a Z4-end state in the time room, as src/timeroom.js ?dev=tr makes ----------
function devState(game, hall) {
  const s = game.state = game.newState();
  s.var[40] = 2;
  for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568, 470]) s.sw[n] = true;
  s.flags.z3 = 'done';
  party(game, [3, 5, 4, 12, 17, 6]);
  s.flags.tr = { back: { map: '48', x: 44 * 32 + 16, y: 29 * 32 + 16 }, v43: 0, v17: 2, party: s.party.map((m) => m.id), ss: {} };
  s.var[43] = 999;
  s.sw[466] = true;
  s.sw[473] = true;
  s.var[17] = hall === '59' ? 0 : 1;
  return s;
}
registerZ3('trbd', {
  dev(game, step) {
    if (!/^trbd/.test(step)) return false;
    const z2 = step.startsWith('trbd2');
    const s = devState(game, z2 ? '66' : '59'), t = T(game);
    moveTo(s, z2 ? t.z2.back : t.z1.back);
    (async () => {
      await applyEra(game);
      game.startField();
      if (step === 'trbd' || step === 'trbd2') return door(game, z2 ? 3000 : 800, z2 ? t.z2.door : t.z1.door);
      // straight onto the field of the part (its setup done, the story before skipped)
      ensure(game);
      begin(game);
      if (z2) { await setupZ2(game); s.var[163] = 0; } else { await setupZ1(game); s.hand = newHand(); }
      const at = { trbdfield: { map: '31', x: 17, y: 9 }, trbdcave: { map: '65', x: 8, y: 12 }, trbd2field: { map: '54', x: 17, y: 5 } }[step];
      if (step === 'trbdcave') s.sw[526] = true;
      goTo(game, at || (z2 ? t.z2.start : t.z1.start));
    })();
    return true;
  },
});

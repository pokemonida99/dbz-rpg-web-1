// ZG 本編 中段（事件 23 頁 6181～6421：四個毀滅瓦斯產生裝置、西之都尖塔，地圖 103～107） — docs/zg-plan.md, docs/zg-b.md;
// the data is built by tools/build_zg_b.py (world.z3.zgb, the 'zgb:' pages). zga hands over with
// startTrStory(game, 'zgb') at the end of page 6171; this part ends with startTrStory(game, 'zgc') after page 6421.
//   map 103 グランドアポロン (Goku's team): the village 6181, the egg mountain 6201, the bird (map events 64-66),
//     the nest 6211 → Cooler's crew, battle 6206 → 6221
//   map 104 西の砂漠 (Gohan's team): the village 6231, the pyramid 6241, the real pyramid (map event 101) 6251 →
//     Turles, battle 6261 → 6271
//   map 105 ブンブク島 (Piccolo's team): the village 6281, the cave 6291, the mine 6296, the villa 6301, the volcano
//     6311 → battle 6316 (Kawazu) → 6321 → battle 6326 (Slug) → 6331
//   map 106 氷の大陸 (Trunks's team): the flood machine 6341 → battle 6346 (Cui) → 6351; the ice wall 6361 → battle
//     6371 (Frieza) → 6381 → 6391 (everyone) → map 107
//   map 107 西の都: the Tongari tower 6401 → battle 6411 (the ghost warriors) → 6421 → zgc; the 時の間 square 9932
// A page runs as the original's does: it ends with a transfer (201), kept here as state.flags.zgbGo — map 7 means the
// next page (variable 41) or, with switch 128, the battle variable 41 names and then the page of variable 95.
import { audio, img, loadImages } from './core.js?v=20261102-2225';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261102-2225';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261102-2225';
import { addMoves, Duel, draw, BACKS, SW, SH, STD_Y, TEC_CENTER } from './anime.js?v=20261102-2225';
import { makeMember, applyLevel } from './party.js?v=20261102-2225';
import { superSaiyan } from './supersaiyan.js?v=20261102-2225';
import { applyEra } from './era.js?v=20261102-2225';
import { newHand } from './battle.js?v=20261102-2225';
import { eventCard } from './items.js?v=20261102-2225';
import { Field } from './field.js?v=20261102-2225';
import { registerZ3, Z3, begin, fight, toField, party, member, heal, moveTo, z3BackdropAt } from './z3.js?v=20261102-2225';
import { startTrStory, endTrStory, registerBackdrop } from './timeroom.js?v=20261102-2225';
// zga's shared ZG helpers (leaveZg / backToZg); a namespace import, so this part still runs where zga is not there yet
import * as zga from './zg_a.js?v=20261102-2225';

const MAPS = ['103', '104', '105', '106', '107'];
const C = (game) => Z3(game).zgb;
let G = null; // the game, for the scenes and the page commands (set whenever this part takes over)
function stop(game) { G = game; begin(game); }

// the battle films of the moves met here (src/anime.js): the closest of the earlier films
addMoves({
  155: 'genkidama', // 巴達克 超級復仇標槍
  236: 'gohanMakouhou', 237: 'masenko', 238: 'scatterWave', 239: 'masenko', 240: 'makankosappo', 241: 'kamehameha', 242: 'kaioken', // 未來悟飯
  246: 'energyWave', 247: 'scatterWave', 248: 'vegetaWave', 249: 'vegetaBlast', 250: 'galickGun', // 多瑪
  255: 'energyWave', 256: 'scatterWave', 257: 'vegetaWave', 259: 'kaioken', 260: 'galickGun', // 莎莉巴
  265: 'energyWave', 266: 'scatterWave', 267: 'vegetaWave', 268: 'nappaBlast', 269: 'galickGun', // 多達布
  273: 'energyWave', 274: 'scatterWave', 275: 'vegetaWave', 276: 'nappaBlast', 277: 'galickGun', // 普普堅
  194: 'kienzan', 107: 'shockwave', 146: 'kikouhou', 230: 'maxKamehameha', // 18號 / 琪琪 / 青年 / 龜仙人
  74: 'sokidan', 75: 'wolfFang', 94: 'psychic', 95: 'dodonpa', 65: 'kienzan', // 雅木茶 / 餃子 / 克林
  550: 'foeWave', 552: 'foeWave', 553: 'raditzWave', 555: 'foeWave', // 金卡恩・阿比・古勒 (the field)
  625: 'foeWave', 626: 'kienzan', 627: 'raditzBigWave', 629: 'foeWave', 630: 'raditzWave', 632: 'foeWave', 633: 'nappaBlast',
  634: 'raditzBigWave', 636: 'foeWave', 637: 'raditzWave', 639: 'foeWave', 640: 'raditzWave', // 達列斯軍
  646: 'foeWave', 647: 'raditzWave', 648: 'pierce', 650: 'foeWave', 651: 'raditzBigWave', 653: 'foeWave', 654: 'nappaBlast',
  655: 'raditzWave', 657: 'foeWave', 658: 'raditzBigWave', 661: 'giantWave', // 史拉格軍
  391: 'foeWave', 392: 'psychic', 393: 'swordAttack', 394: 'raditzWave', 395: 'raditzBigWave', // 弗利薩
  400: 'giantWave', 403: 'raditzWave', 405: 'raditzWave', 452: 'swordAttack', // 古拉一味
  644: 'etfTurlesApe', 645: 'etfSlugGiant', // 大猿変身 / 巨大化 (their own films below; src/battle.js FOE_FORMS)
  642: 'apeWave', 667: 'apeWave', 668: 'nappaBlast', 669: 'apeWave', // 達列斯(大猿) / 史拉格(巨大化)
});

// the form changes in battle (anime_pattern 1744 / 1745), ported from the original frame by frame
const POWER_BALL = 'Graphics/Pictures/Z1_戦闘_必殺技_繰気弾.PNG'; // effect 21
const APE_HEAD = 'Graphics/Pictures/Z2_戦闘_必殺技_敵_达列斯.png'; // its 96×112 faces at (0,1056) / (0,1168), mouth shut / open
const FLASH = ['#fff', '#000', '#fff', '#ffd8a0']; // 375-439: the screen flashes, 8 frames each
Object.assign(Duel.prototype, {
  * etfTurlesApe() { // 1744 大猿変身(ターレス): the power ball goes up and becomes the moon, he looks at it — the Great Ape's face
    const A = this.A, aura = this.cycler(BACKS.aura, 160, 222, 234, 70);
    img(APE_HEAD); // (Z2 Turles's sheet: not met yet in ZG; it loads while the moon rises)
    let bx = 234, by = 100, face = 1;
    const ball = (c) => draw(c, POWER_BALL, 0, 0, 128, 128, bx, by);
    this.se('Z1 気を溜める6'); this.pose(A, 7, true); this.behind(aura); yield; // 0
    yield* this.wait(80); // 1-80
    this.se('Z1 高速移動'); this.effect(ball); yield; // 81
    for (let f = 82; f <= 102; f++) { by = 100 - (f - 82); yield; }
    by = 80; yield* this.wait(82); // 103-184
    this.behind(null); this.pose(A, 8, true); bx = 226; by = 88; yield* this.wait(25); // 185-209
    this.se('Z1 繰気弾'); this.pose(A, 9, true); yield; // 210
    for (let f = 211; f <= 305; f++) { // the ball thrown up; from 265 he holds out his hand
      bx = 226 - (f - 211) * 4; by = 88 - (f - 211) * 4;
      if (f === 265) { this.pose(A, 10, true); this.behind((c, t) => draw(c, BACKS.handOne, 0, (Math.floor(t / 5) % 10) * 48, 40, 48, 266, 116)); }
      yield;
    }
    audio.seStop(); this.effect(null); this.behind(null); yield; // 306
    A.y = -200; this.effect(ball); bx = 256; // 307
    for (let f = 308; f <= 374; f++) { by = 240 - (f - 308) * 2; yield; } // the moon rises
    by = 108; this.se('Z1 気を溜める(元気弾)');
    this.behind((c, t) => { c.fillStyle = FLASH[Math.floor(t / 8) % 4]; c.fillRect(0, 0, SW, SH); });
    yield* this.wait(65); // 375-439
    this.behind(null); this.effect(null); this.pose(A, 0, true); A.y = STD_Y; yield* this.wait(31); // 440-470
    this.se('Z1 パワーアップ');
    this.behind((c) => { if (face) draw(c, APE_HEAD, 0, face === 2 ? 1168 : 1056, 96, 112, 266, 118); });
    for (let f = 471; f <= 660; f++) { // he and the face by turns (8 frames), then the face roars
      if (f === 536) this.se('Z1 大猿');
      const head = f === 471 || f >= 536 || Math.floor((f - 472) / 8) % 2 === 1;
      face = !head ? 0 : f >= 536 && f <= 600 ? 2 : 1;
      A.y = head ? -200 : STD_Y;
      yield;
    }
    return 'none';
  },
  * etfSlugGiant() { // 1745 スラッグ巨大化: he and the giant by turns (8 frames), then the giant
    const A = this.A, small = A.sheets, big = this.form || small;
    this.pose(A, 0, true); A.x = TEC_CENTER; A.y = STD_Y; yield; // 0
    this.se('Z1 気を溜める5');
    for (let f = 1; f <= 199; f++) {
      if (f === 66) this.se('Z1 パワーアップ');
      A.sheets = f === 1 || f >= 58 || Math.floor((f - 2) / 8) % 2 === 1 ? big : small;
      yield;
    }
    return 'none';
  },
});

// ---------- the scenes (z1field 6181-6423, data from all.rb: background, faces, character_output(_all)) ----------
// Z3 scenes are 512×128 pictures over the scroll window; faces at @ene1_x ± n (ENE), the others under the scene
// (@play_x / @play_y, @play_y + 64 = the second row). A phone shows the middle ~230 px of the scene, so rows of faces
// wider than that are drawn closer and smaller.
const FIT = 224, ROW = 230;
const BATTLES = [6206, 6261, 6316, 6326, 6346, 6371, 6411];
// set_character_face (all.rb 19758, the Z3 part): the face by the clothes the story has put on
function charFace(s, id) {
  const v = s.var || {}, sw = s.sw || {}, row = id - 3, sh = C(G).sheets;
  const to = (sheet, r) => [sheet, 0, 64 * r];
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
// the faces under the scene: three a row; more get smaller (seven a row of 32 for the whole Z team)
function faces(st, s, ids) {
  const n = ids.length;
  const per = n > 18 ? 7 : n > 10 ? 6 : n > 8 ? 5 : n > 6 ? 4 : 3, size = n > 18 ? 32 : n > 10 ? 36 : n > 8 ? 40 : n > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, n - per * line), j = k % per;
    const [sheet, sx, sy] = charFace(s, id);
    st.add(sheet, PLAY_X - 32 * (m - 1) + 64 * j, 0, [sx, sy, 64, 64], true, line);
  });
  return { rows: Math.ceil(n / per), size };
}
// character_output_all (all.rb 167997): the party, then everyone of the mode's list who is not in it, in the
// original's order (悟空 / 悟飯 / 貝吉塔 / 特蘭克斯 / 未來悟飯 / 巴達克 as their form is now)
const ADD_ORDER = [[3, 14, 1], [4], [5, 18, 2], [6], [7], [8], [9], [10], [24], [12, 19, 3], [17, 20, 4], [25, 26, 6], [16, 32, 7],
  [27], [28], [29], [30], [15], [23], [22], [21], [31]];
function allIds(ctx, mode) {
  const list = C(G)[`all${mode}`], ss = ctx.s.ss || {};
  const ids = ctx.partyc.filter((id) => list.includes(id));
  for (const [a, b, no] of ADD_ORDER) {
    if (!list.includes(a) || ids.includes(a) || (b && ids.includes(b))) continue;
    ids.push(b && (ss[no] || (no === 2 && ss[5])) ? b : a);
  }
  return ids;
}
function drawScene(st, ctx, d) {
  if (d.bg) st.add(d.bg, SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
  if (d.ene.length) { // in the scene: as the original places them, closer (and smaller) when wider than a phone shows
    const xs = d.ene.map((e) => e[3]), lo = Math.min(...xs), hi = Math.max(...xs), cols = new Set(xs).size;
    const fit = hi - lo + 64 <= FIT, size = fit ? 64 : Math.min(64, Math.floor(FIT / cols)), k = fit ? 1 : (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
    for (const [sheet, sx, sy, dx, dy] of d.ene) {
      const x = fit ? ENE[0] + dx : ENE[0] + 32 - size / 2 + (dx - mid) * k;
      const y = ENE[1] + (64 - size) / 2 + (fit ? dy : (dy * size) / 64); // (above the window: clipped, as the original)
      st.add(sheet, x, y, [sx, sy, 64, 64], false, 0, size === 64 ? null : [size, size]);
    }
  }
  let size = 64, below = 0;
  if (d.out || d.all) { const o = faces(st, ctx.s, d.all ? allIds(ctx, d.all) : ctx.partyc); size = o.size; below = o.rows - 1; }
  const spans = {};
  for (const [sheet, sx, sy, dx, l] of d.play) {
    const line = l ? l + below : 0;
    st.add(sheet, PLAY_X + dx, 0, [sx, sy, 64, 64], true, line);
    (spans[line] = spans[line] || []).push(dx);
  }
  for (const xs of Object.values(spans)) { // a row wider than the phone: every face smaller
    const w = Math.max(...xs) - Math.min(...xs) + 64;
    if (w > ROW) size = Math.min(size, Math.floor((64 * ROW) / w / 4) * 4);
  }
  st.faceSize = size;
}
const SCENES = {};
for (let n = 6181; n <= 6423; n++) {
  if (BATTLES.includes(n)) continue;
  SCENES[n] = { draw: (st, ctx) => { const d = G && C(G).scenes[n]; if (d) drawScene(st, ctx, d); } };
}
addScenes(SCENES, BATTLES);
function scenePics(game) {
  const z = C(game), set = new Set(Object.values(z.sheets).filter(Boolean));
  for (const d of Object.values(z.scenes)) {
    if (d.bg) set.add(d.bg);
    for (const it of [...d.ene, ...d.play]) set.add(it[0]);
  }
  return [...set];
}

// ---------- the pages' own commands (tools/build_zg_b.py) ----------
const refresh = (ctx) => { ctx.partyc = G.state.party.map((m) => m.id); };
addNodes({
  zgbParty: async (node, { ctx }) => { party(G, node.ids); refresh(ctx); }, // $partyc = [...] (all_charecter_recovery follows)
  zgbLead: async () => { const s = G.state; s.var[42] = s.party[0].id; }, // CE39
  zgbSsOff: async (node, { ctx }) => { for (const no of [1, 2, 3, 4, 5, 6, 7]) superSaiyan(G.world, G.state, no, false); refresh(ctx); }, // CE159
  zgbGo: async (node) => { G.state.flags.zgbGo = node.to; }, // 201: where the page sends the party (run() goes there)
  zgbSeStop: async () => audio.seStop(),
  // a menu of the villages (102 after the line that asks): the window closes and the answers stand in one row at the
  // bottom (src/cutscene.js choice() stacks them under the window, off a 375×667 screen under two rows of faces)
  zgbAsk: async (node, { ui, quiet }) => {
    if (quiet) return;
    ui.dlg.hidden = true;
    ui.el.classList.add('zgb-ask');
  },
});
const css = document.createElement('style');
css.textContent = '.zgb-ask .cs-choices .btn { width: auto; flex: 1 1 0; min-width: 0; margin: 0; padding: 6px 4px; text-align: center; font-size: 16px; }';
document.head.appendChild(css);

// ---------- the flow ----------
async function playPage(game, n) {
  const s = game.state;
  G = game;
  s.var[41] = n;
  s.flags.zgbGo = null;
  await loadImages(scenePics(game));
  await playScenes([{ nodes: Z3(game).pages[`zgb:${n}`] }], s);
}
// a page and whatever it leads to (map 7: the next page or a battle), then the field
async function run(game, n) {
  const s = game.state;
  for (;;) {
    await playPage(game, n);
    const go = s.flags.zgbGo;
    s.flags.zgbGo = null;
    if (Array.isArray(go) && go[0] === 7) {
      if (s.sw[128]) return battle(game, s.var[41]);
      n = s.var[41];
      continue;
    }
    return arrive(game, go);
  }
}
// battle_process n (saved right before it: a load or a loss starts here again), then its page (variable 95)
async function battle(game, no) {
  const s = game.state, b = C(game).battles[no];
  const opts = { alone: !!s.sw[25], hp30: !!s.sw[26], hp40: !!s.sw[27], two: !!s.sw[28], hp50: !!s.sw[29], backdrop: b.backdrop };
  const r = await fight(game, String(no), `b${no}`, opts);
  G = game;
  if (r === 'lose') return;
  for (const k of [25, 26, 27, 28, 29, 128]) s.sw[k] = false;
  s.var[95] = 0;
  return run(game, b.next);
}
// the transfer at the end of a page: back to the square, another map, or (page 6421) on to zgc
function arrive(game, go) {
  const s = game.state;
  s.var[41] = 0;
  if (s.party[0]) s.var[42] = s.party[0].id;
  if (!Array.isArray(go)) return toField(game);
  const [map, x, y] = go;
  s.var[17] = C(game).v17[map] ?? s.var[17];
  if (map === 105 && s.var[43] === 173) { // page 6421: the Linium part (zgc)
    moveTo(s, { map: '105', x, y });
    return startTrStory(game, 'zgc');
  }
  return toField(game, { map: String(map), x, y });
}

// the squares
function spot(game, poi) {
  stop(game);
  const s = game.state;
  if (poi.page === 9932) return toHall(game);
  if (poi.page === 6251 && s.sw[814] && !s.sw[816]) return pyramid(game);
  return run(game, poi.page);
}

// map 104: the real pyramid comes up out of the sand (Event_Check `when 104` with switch 814 on and 816 off: variable
// 39 + 1, switch 817 → map event 101: the sound, flashes and a quake, the party pushed to (9,y), switch 816)
async function pyramid(game) {
  const s = game.state;
  s.var[39] = (s.var[39] || 0) + 1;
  s.sw[817] = true;
  toField(game);
  game.busy = true;
  game.field.paused = true;
  audio.se('ZG ピラミッド現れる', 90);
  const app = document.getElementById('app');
  const flash = async (frames) => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;inset:0;background:#fff;z-index:25;opacity:1;transition:opacity ${frames / 60}s`;
    app.appendChild(el);
    await new Promise((r) => setTimeout(r, 30));
    el.style.opacity = '0';
    await new Promise((r) => setTimeout(r, (frames * 1000) / 60));
    el.remove();
  };
  app.classList.add('shake');
  for (const f of [30, 30, 30, ...Array(22).fill(15)]) await flash(f);
  app.classList.remove('shake');
  s.x = 9 * 32 + 16; // (the move route: right until x = 9)
  s.sw[816] = true;
  game.busy = false;
  game.field.paused = false;
  game.save(true);
}

// page 9932 (map 107 (51,4)): back to the ZG hall of the 時之間 — CE182 (the 舞空術 / 帶路人 cards), CE171 (where to
// come back: one square above, variables 371-375 → state.flags.zgBack), variable 43 = 999, on foot; the ZG hall's
// door (page 6000, switch 850 on) brings the story back here (start below)
function toHall(game) {
  const s = game.state;
  if (zga.leaveZg) return zga.leaveZg(game); // (zga: CE171 one square up, CE182, the 時之間's party back, the hall)
  eventCard(s, 37, -99);
  eventCard(s, 124, -99);
  s.flags.zgBack = { key: 'zgb', map: s.map, x: 51, y: 3, v43: s.var[43], v17: s.var[17] };
  // CE168: the story's party out, the 時之間's back (state.flags.zgParty, kept by zga at page 6001 as CE166 does)
  const zp = s.flags.zgParty;
  if (zp && zp.party) {
    zp.story = { party: s.party.map((m) => m.id), ss: { ...(s.ss || {}) } };
    for (const no of [1, 2, 3, 4, 5, 6, 7]) superSaiyan(game.world, s, no, !!(zp.ss || {})[no]);
    party(game, zp.party);
  }
  s.var[43] = 999;
  s.var[17] = 0;
  s.sw[78] = true;
  s.sw[19] = false;
  audio.se('Z1 入る');
  endTrStory(game, C(game).hall);
}

// ---------- the bird of map 103 (map events 64-66: '!bigsize_anime', 96×64 frames) ----------
// It stands (alternately facing up / right every 90 frames) while its switch is on; walking into the region round it
// (Event_Check: switch `fly`, variable 39 + 1) — or, at the egg mountain, page 6201's switch 803 — makes it fly off:
// speed 4 (16 frames a tile), 14 tiles to the lower right, then the next switch shows the next bird.
let flight = null; // { b, t0 }
const FLIGHT = 14 * 16 * (1000 / 60);
function birdAt(s, b, now) {
  if (flight && flight.b === b) {
    const k = Math.min(1, (now - flight.t0) / FLIGHT);
    return { x: b.x + 14 * k, y: b.y + 14 * k, dir: Math.floor((now - flight.t0) / ((16 * 1000) / 60)) % 2 ? 3 : 2 };
  }
  if (!s.sw[b.show] || s.sw[b.done] || s.sw[b.fly]) return null;
  return { x: b.x, y: b.y, dir: Math.floor(now / 1500) % 2 ? 3 : 2 };
}
function birds(field, c, cx, cy) {
  const game = field.game, s = game.state;
  if (s.map !== '103' || !Z3(game) || !C(game)) return;
  G = game;
  const z = C(game), now = performance.now();
  const e = img(z.bird);
  for (const b of z.birds) {
    const p = birdAt(s, b, now);
    if (!p || !e.ok) continue;
    const pat = [0, 1, 2, 1][Math.floor(now / 160) % 4]; // (step anime)
    // character 0 of the sheet: rows down / left / right / up; drawn with its feet at the tile's bottom middle
    c.drawImage(e.im, pat * 96, p.dir * 64, 96, 64, Math.round(p.x * 32 + 16 - 48 - cx), Math.round(p.y * 32 + 32 - 64 - cy), 96, 64);
  }
  // a flight under way, or one to start
  if (flight && now - flight.t0 >= FLIGHT) {
    s.sw[flight.b.done] = true;
    flight = null;
    game.busy = false;
    field.paused = false;
    game.save(true);
    return;
  }
  if (flight || game.busy || field.paused || game.scene !== field) return;
  const tx = Math.floor(s.x / 32), ty = Math.floor(s.y / 32);
  for (const b of z.birds) {
    if (!s.sw[b.show] || s.sw[b.done]) continue;
    const inside = b.area && tx >= b.area[0] && ty >= b.area[1] && tx <= b.area[2] && ty <= b.area[3];
    if (!s.sw[b.fly] && inside) { s.sw[b.fly] = true; s.var[39] = (s.var[39] || 0) + 1; }
    if (s.sw[b.fly]) { // (the autorun page: the player waits)
      flight = { b, t0: now };
      game.busy = true;
      field.paused = true;
      audio.se('ZG 鳥が飛び去る', 90);
      return;
    }
  }
}
// (src/field.js draws the map events; the bird is drawn after the ones above the player)
const drawEvents = Field.prototype.drawEvents;
Field.prototype.drawEvents = function (c, cx, cy, above) {
  drawEvents.call(this, c, cx, cy, above);
  if (above) birds(this, c, cx, cy);
};

// ---------- the battle backgrounds of the field (set_battle_map, scenario_progress ≥ 2: the ZG tiles) ----------
function backdrop(game) {
  const s = game.state, m = game.world.maps[s.map], z = C(game);
  if (!m || !z) return null;
  const tx = Math.floor(s.x / 32), ty = Math.floor(s.y / 32), i = ty * m.w + tx;
  const tile = m.layers[0][i], top = (m.layers[2] || [])[i] || 0, ev = (z.tileEvents[s.map] || {})[`${tx},${ty}`];
  let row;
  if (tile === 1603 || tile === 1604) row = 11; // ZGグランドアポロン
  else if (tile === 1606) row = 16; // ZG砂漠
  else if (tile === 1607) row = top === 627 ? 12 : ev && ev[0] === 'animap1' && ev[1] === 2 && ev[2] === 4 ? 15 : 14; // 山 / 森 / 平原
  else if ([1550, 1543, 1551, 1575, 1552, 1555, 1553, 1554, 1600, 1601, 1602, 1591, 1583, 1541, 1549].includes(tile)) return z3BackdropAt(game);
  else row = s.var[17] === 3 ? 13 : s.var[17] === 4 ? 17 : (s.var[101] || 0) === 0 ? 3 : 8; // the sea (variable 17)
  return `bg/z3_battle_${row}.png`;
}
for (const m of MAPS) registerBackdrop(m, backdrop);

// ---------- the start (the end of page 6171), a save, the goal ----------
// CE9 必殺技設定 for the members of these teams (other chapters may have made them without their moves)
function ce9(game) {
  const z = C(game);
  const sets = { ...z.androids, ...z.ce9 };
  for (const [id, list] of Object.entries(sets)) {
    if (['26', '32'].includes(id)) continue; // (the Super Saiyan forms: src/supersaiyan.js keeps one member each)
    const m = member(game, +id);
    for (const k of list) if (!m.skills.includes(k)) m.skills.push(k);
  }
}
async function start(game) {
  const s = game.state;
  stop(game);
  s.flags.z3 = 'zgb';
  s.flags.z3At = null;
  if (zga.backToZg && zga.backToZg(game, 'zgb')) return; // from the ZG hall's door (zga puts the party back)
  const back = s.flags.zgBack;
  if (back && back.key === 'zgb') { // from the ZG hall's door (page 6000 with switch 850): where page 9932 left
    delete s.flags.zgBack;
    const zp = s.flags.zgParty; // (CE168 the other way, when the door has not done it)
    if (zp && zp.story) {
      for (const no of [1, 2, 3, 4, 5, 6, 7]) superSaiyan(game.world, s, no, !!(zp.story.ss || {})[no]);
      party(game, zp.story.party);
      delete zp.story;
    }
    for (const m of s.party) heal(m); // (page 6000: everyone up and recovered)
    s.var[43] = back.v43;
    s.var[17] = back.v17;
    s.sw[19] = false;
    s.sw[78] = false;
    s.var[42] = s.party[0].id;
    return toField(game, { map: back.map, x: back.x, y: back.y });
  }
  // page 6171 (zga): Goku's team, everyone up and recovered, switches 1152-1161 on, 80 / 19 off, CE39, variables 301 / 43 / 324
  ce9(game);
  party(game, C(game).party);
  for (const m of s.party) heal(m);
  for (let k = 1152; k <= 1161; k++) s.sw[k] = true;
  Object.assign(s.sw, { 80: false, 19: false, 38: true, 39: true });
  Object.assign(s.var, { 301: 2, 43: 151, 17: 1, 324: 65, 41: 0, 42: s.party[0].id });
  s.var[40] = 2;
  await applyEra(game);
  return toField(game, C(game).start);
}
const AT = Object.fromEntries(BATTLES.map((n) => [`b${n}`, (game) => battle(game, String(n))]));
function resume(game, at) {
  G = game;
  const f = AT[at && at.at];
  if (f) f(game);
  else toField(game);
}
function goal(world, s) {
  const sw = s.sw || {};
  switch (s.map) {
    case '103':
      if (sw[809]) return '目標：回到西北方有蛋的岩山';
      if (sw[808]) return '目標：前往東南方的鳥巢';
      if (sw[803]) return '目標：追上飛走的鳥';
      if (sw[802]) return '目標：前往西北方的山';
      return '目標：到村子打聽消息';
    case '104':
      if (sw[816]) return '目標：進入西邊的金字塔';
      if (sw[814]) return '目標：前往西邊的金字塔';
      if (sw[813]) return '目標：帶著手電筒進入金字塔';
      if (sw[812]) return '目標：回村子找老爺爺';
      if (sw[811]) return '目標：前往南邊的金字塔';
      return '目標：到村子打聽消息';
    case '105':
      if (sw[821]) return '目標：在火山使用冷凍膠囊';
      if (sw[820]) return '目標：回村子';
      if (sw[819]) return '目標：前往科波科波火山';
      if (sw[818]) return '目標：前往北邊的洞穴';
      return '目標：到村子打聽消息';
    case '106':
      return sw[823] ? '目標：追上往西南逃走的邱夷' : '目標：找出融化冰的機器';
    case '107':
      return '目標：前往西之都的通加利塔';
  }
  return '';
}

// ---------- development: index.html?dev=zgb (map 103, the start) / zgbcooler (the egg mountain, the bird found) /
// zgb104 / zgbturles (the real pyramid up) / zgb105 / zgbkawazu (the volcano, the capsule) / zgb106 / zgbfrieza (the
// ice wall, Cui beaten) / zgb6391 (the teams meet) / zgb107 / zgbtower (by the Tongari tower) (&timer in a hidden
// pane) ----------
const LV = { 3: 70, 4: 66, 5: 64, 6: 58, 7: 55, 8: 57, 9: 54, 10: 50, 12: 70, 15: 52, 16: 62, 17: 66, 21: 60, 22: 60, 23: 60, 24: 52,
  25: 66, 27: 58, 28: 58, 29: 58, 30: 58 };
const TEAMS = { 104: [5, 6, 10, 24, 15], 105: [4, 25, 21, 22, 23], 106: [17, 12, 7, 8, 9], 107: [3, 4, 5, 16, 17, 12, 25, 6, 7] };
function dev(game, step) {
  if (!/^zgb(cooler|104|turles|105|kawazu|106|frieza|6391|107|tower)?$/.test(step)) return false;
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
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'willow', 'z2a', 'z2b']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, z3: 'zgb', trStory: { main: 'done' } });
  // inside the 時之間 (the ZG hall's door): what page 15 kept for the way back
  s.flags.tr = { back: { map: '48', x: 44 * 32 + 16, y: 29 * 32 + 16 }, v43: 0, v17: 2, party: [3, 4, 5, 6, 7, 8, 9, 12, 17], ss: {} };
  Object.assign(s.sw, { 381: true, 458: true, 459: true, 570: true, 580: true, 581: true, 585: true, 850: true });
  s.var[40] = 2;
  s.cardiMax = 10;
  s.zeni = 30000;
  s.party = [];
  party(game, [3, 16, 27, 28, 29, 30]);
  moveTo(s, C(game).start);
  await applyEra(game);
  s.hand = newHand(w);
  game.startField();
  if (step === 'zgb') return start(game);
  ce9(game);
  for (let k = 1152; k <= 1161; k++) s.sw[k] = true;
  Object.assign(s.var, { 301: 2, 43: 151, 17: 1, 324: 65 });
  const team = (map, v43, v17, at) => {
    party(game, TEAMS[map]);
    for (const m of s.party) heal(m);
    Object.assign(s.var, { 43: v43, 17: v17, 42: s.party[0].id });
    return toField(game, at);
  };
  if (step === 'zgbcooler') { Object.assign(s.sw, { 802: true, 803: true, 804: true, 805: true, 806: true, 807: true, 808: true, 809: true }); return toField(game, { map: '103', x: 5, y: 5 }); }
  Object.assign(s.sw, { 802: true, 803: true, 804: true, 805: true, 806: true, 807: true, 808: true, 809: true, 810: true });
  if (step === 'zgb104') return team(104, 156, 3, { map: '104', x: 51, y: 8 });
  if (step === 'zgbturles') { Object.assign(s.sw, { 811: true, 812: true, 813: true, 814: true, 816: true, 817: true }); return team(104, 156, 3, { map: '104', x: 9, y: 35 }); }
  Object.assign(s.sw, { 811: true, 812: true, 813: true, 814: true, 816: true, 817: true, 815: true });
  if (step === 'zgb105') return team(105, 161, 3, { map: '105', x: 4, y: 33 });
  if (step === 'zgbkawazu') { Object.assign(s.sw, { 818: true, 819: true, 820: true, 821: true }); return team(105, 161, 3, { map: '105', x: 40, y: 14 }); }
  Object.assign(s.sw, { 818: true, 819: true, 820: true, 822: true });
  if (step === 'zgb106') return team(106, 166, 4, { map: '106', x: 51, y: 37 });
  if (step === 'zgbfrieza') { s.sw[823] = true; return team(106, 166, 4, { map: '106', x: 8, y: 35 }); }
  Object.assign(s.sw, { 823: true, 824: true });
  if (step === 'zgb6391') { party(game, TEAMS[106]); Object.assign(s.var, { 43: 166, 17: 4 }); stop(game); return run(game, 6391); }
  if (step === 'zgb107') return team(107, 171, 3, { map: '107', x: 51, y: 5 });
  return team(107, 171, 3, { map: '107', x: 7, y: 23 });
}

registerZ3('zgb', { maps: MAPS, start, spot, resume, dev, goal });
// ?dev=etf (docs/batch1-plan.md §3, the enemies' form changes): straight into the battle with Turles and Slug (強) —
// etf: 6411 (both), etfturles: 6261, etfslug: 6326; the story goes on from there as usual
registerZ3('etf', {
  dev(game, step) {
    const m = /^etf(turles|slug)?$/.exec(step);
    if (!m) return false;
    const no = { turles: 6261, slug: 6326 }[m[1]] || 6411;
    devState(game, { 6261: 'zgbturles', 6326: 'zgbkawazu', 6411: 'zgbtower' }[no]).then(() => { stop(game); return battle(game, no); });
    return true;
  },
});

// Z4 第五章 人造人間 13 號（地圖 44・93） — driven by world.z3 (tools/build_z4e.py), following Map007 event 7 pages 22, 70,
// 71 and 55-69 (variable 41 = 2371, 2941, 2951, 2801-2931), the scenes z1field 2371-2373 / 2801-2951 (all.rb 176835,
// 178112-178605) and the spots of maps 44 / 93 (145_Event_Check.rb `when 44` / `when 93`). docs/z4e.md has the whole chapter.
//   2371 Goku brings Dende back, everyone goes home → 2941 Tien's group at the temple, the Room of Spirit and Time
//     → map 44 (9,8), variable 121 = 3; (15,4) → 2951 流派一致修行 (the party, src/z3train.js pattern 3)
//   2801 shopping, Nos. 14 / 15 → 2811 Goku against them (set_battle_event 17, a film) → 2821 everyone gathers → map 93
//   map 93: No. 15 (10,24) 2831 → battle 2832; No. 14 (31,22) 2841 → battle 2842; both beaten → 2846 No. 13 wakes;
//     No. 13 (65,17) 2851 → battle 2852 → 2861 the merge (CE63) → battle 2871 → 2881 → 2901-2931 → variable 41 = 2991
//     → the next chapter (セルゲーム).
import { audio, img, loadImages } from './core.js?v=20261103-0423';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261103-0423';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261103-0423';
import { addMoves, ANIME_IMAGES } from './anime.js?v=20261103-0423';
import { makeMember, applyLevel } from './party.js?v=20261103-0423';
import { superSaiyan } from './supersaiyan.js?v=20261103-0423';
import { applyEra } from './era.js?v=20261103-0423';
import { newHand } from './battle.js?v=20261103-0423';
import { duelFilm, screenPic } from './z3c.js?v=20261103-0423';
import { ryuhaPairTraining } from './z3train.js?v=20261103-0423';
import { registerZ3, nextZ3, Z3, begin, fight, toField, party, member, heal, card, moveTo, setParty } from './z3.js?v=20261103-0423';

const MAPS = ['44', '93'];
const C = (game) => Z3(game).z4e;
let G = null; // the game, for the scenes and page commands below (set whenever this chapter takes over)
function stop(game) { G = game; begin(game); }

// the battle films of the androids' moves (src/anime.js): the closest of the earlier films
addMoves({
  471: 'foeWave', 472: 'raditzBigWave', 473: 'pierce', 474: 'pierce', 475: 'nappaBlast', 620: 'raditzWave', // 13号
  476: 'foeWave', 477: 'raditzBigWave', 478: 'nappaBlast', 479: 'nappaBlast', 480: 'nappaBlast', // 合体13号
  481: 'foeWave', 618: 'raditzWave', 482: 'raditzBigWave', 483: 'pierce', // 14号
  484: 'foeWave', 619: 'raditzWave', 485: 'raditzBigWave', 486: 'pierce', // 15号
});

// ---------- the scenes (z1field 2371-2373, 2801-2943) ----------
// Z3 scenes are 512×128 pictures over the scroll window; faces at @ene1_x ± n (288,78), the party's under the scene
// (@play_x 288, @play_y + 64 a second row). The phone shows the middle ~230 px, so wider rows are drawn closer.
const pic = (n) => `Graphics/Pictures/${n}`;
const P3 = pic('Z3_顔味方.PNG'), E3 = pic('Z3_顔イベント.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
const BG = {
  天界: pic('Z3_背景_天界.PNG'), 部屋: pic('Z3_背景_精神と時の部屋.png'), 街: pic('Z3_背景_街.png'), 雪山: pic('Z3_背景_雪山.PNG'),
  宇宙船: pic('ZG_背景_宇宙船.PNG'), カプセル: pic('Z3_背景_カプセルコーポレーション.PNG'), 林: pic('Z3_背景_林.PNG'), 家: pic('ZG_背景_ゴクウの家.PNG'),
};
const FIT = 224; // art px of the scene a phone shows for sure

const wide = (st, bg) => st.add(bg, SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
const face = (st, sheet, row, dx = 0, col = 0) => st.add(sheet, ENE[0] + dx, ENE[1], [64 * col, 64 * row, 64, 64]);
// a row of faces in the scene ([sheet, row, dx, col]): as the original places them, closer (and smaller) when wider
function group(st, list) {
  const xs = list.map((f) => f[2]), lo = Math.min(...xs), hi = Math.max(...xs);
  if (hi - lo + 64 <= FIT) { for (const [sheet, row, dx, col] of list) face(st, sheet, row, dx, col); return; }
  const size = Math.min(64, Math.floor(FIT / list.length)), k = (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
  for (const [sheet, row, dx, col = 0] of list) {
    st.add(sheet, ENE[0] + 32 - size / 2 + (dx - mid) * k, ENE[1] + 32 - size / 2, [64 * col, 64 * row, 64, 64], false, 0, [size, size]);
  }
}
const under = (st, sheet, row, dx = 0, line = 0, col = 0) => st.add(sheet, PLAY_X + dx, 0, [64 * col, 64 * row, 64, 64], true, line);
// character_output: faces under the scene (three a row; four smaller over six; five over eight)
function row(st, ids) {
  const per = ids.length > 8 ? 5 : ids.length > 6 ? 4 : 3;
  st.faceSize = ids.length > 8 ? 40 : ids.length > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    under(st, P3, id - 3, -32 * (m - 1) + 64 * j, line);
  });
}
const out = (st, ctx) => row(st, ctx.partyc);
// character_output_all 0,0,0,mode (all.rb 167997): the party members of that mode's cast, then the rest of the cast in
// the original's order (a Super Saiyan form when the party has it)
const CAST = {
  2: [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20], 3: [4, 6, 7, 8, 9, 12, 19, 17, 20], 4: [4, 6, 7, 8, 9],
  5: [4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20, 23], 6: [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20, 23],
};
const ORDER = [[3, 14], [4], [5, 18], [6], [7], [8], [9], [10], [24], [12, 19], [17, 20], [23]];
function outAll(st, ctx, mode) {
  const cast = CAST[mode], ids = ctx.partyc.filter((id) => cast.includes(id));
  for (const forms of ORDER) if (forms.some((id) => cast.includes(id)) && !forms.some((id) => ids.includes(id))) ids.push(forms[0]);
  row(st, ids);
}
const popoDende = (st) => { face(st, CARD, 12, 48, 2); face(st, CARD, 14, -48, 2); }; // ポポ, デンデ
// 2803-2807: the family and Roshi's lot at the table (@play_x ± 64 / ± 96, @play_y + 64): seven, four a row
function table(st, goku = true) {
  st.faceSize = 48;
  if (goku) under(st, P3, 0, -64);
  under(st, P3, 2, 0); under(st, P3, 7, 64); // 悟飯 チチ
  under(st, P3, 3, -96, 1); under(st, P3, 21, -32, 1); under(st, P3, 14, 32, 1); under(st, CARD, 20, 96, 1, 2); // クリリン 亀仙人 トランクス ウーロン
}
const pair1415 = (st) => { face(st, F3, 40, -32); face(st, F3, 41, 32); }; // 14号 15号
const snow = (st, ctx) => { wide(st, BG.雪山); outAll(st, ctx, 6); };
const PART = [E3, 53]; // 人造人間パーツ

const D = {
  2371: (st, ctx) => { wide(st, BG.天界); outAll(st, ctx, 2); popoDende(st); }, // ビッグゲテスター編が終わって戻ってくる
  2372: (st, ctx) => { wide(st, BG.天界); outAll(st, ctx, 3); popoDende(st); }, // 悟空 家に帰る
  2373: (st, ctx) => { wide(st, BG.天界); outAll(st, ctx, 4); popoDende(st); }, // 悟空、ベジータ家に帰る
  2941: (st, ctx) => { wide(st, BG.天界); face(st, P3, 5, -32); face(st, P3, 6, 32); out(st, ctx); }, // 天津飯 チャオズ
  2942: (st, ctx) => { wide(st, BG.天界); face(st, CARD, 12, 0, 2); out(st, ctx); }, // ポポ
  2943: (st, ctx) => { wide(st, BG.部屋); out(st, ctx); },
  // (2801-2807: no background in the original)
  2801: (st) => { under(st, P3, 0, -32); under(st, P3, 2, 32); }, // 悟空と悟飯
  2802: (st) => { under(st, P3, 0, -32); under(st, P3, 2, 32); face(st, P3, 7); }, // チチ
  2803: (st) => { table(st); group(st, [[CARD, 74, -96, 2], [CARD, 74, 0, 2], [CARD, 74, 96, 2]]); }, // ごちそう
  2804: (st) => table(st),
  2805: (st) => { table(st); pair1415(st); },
  2806: (st) => { table(st, false); pair1415(st); }, // 悟空離れる
  2807: (st) => table(st, false),
  2808: (st) => { wide(st, BG.街); under(st, P3, 0); pair1415(st); },
  2811: (st, ctx, q) => film(st, q), // set_battle_event: 悟空 14、15号戦闘
  2821: (st) => { wide(st, BG.街); under(st, P3, 0); pair1415(st); },
  2822: (st) => { wide(st, BG.街); pair1415(st); },
  2823: (st) => wide(st, BG.街),
  2824: (st) => { // 悟飯、チチ、クリリン / 亀仙人、トランクス、ウーロン
    wide(st, BG.街);
    under(st, P3, 3, -64); under(st, P3, 2, 0); under(st, P3, 7, 64);
    under(st, P3, 21, -64, 1); under(st, P3, 14, 0, 1); under(st, CARD, 20, 64, 1, 2);
  },
  2825: (st, ctx) => { wide(st, BG.雪山); outAll(st, ctx, 5); },
  2826: (st, ctx) => { wide(st, BG.雪山); outAll(st, ctx, 5); face(st, P3, 0); },
  2831: (st, ctx) => { snow(st, ctx); face(st, F3, 41); },
  2841: (st, ctx) => { snow(st, ctx); face(st, F3, 40); },
  2846: (st) => { wide(st, BG.宇宙船); face(st, E3, 15); }, // 13号復活 (人影)
  2851: (st, ctx) => { snow(st, ctx); face(st, F3, 38); },
  2861: (st, ctx) => { snow(st, ctx); face(st, F3, 38, 0, 1); },
  2862: (st, ctx) => { snow(st, ctx); face(st, F3, 38); face(st, ...PART, -80); face(st, ...PART, 80); }, // パーツ呼ぶ
  // パーツ合体: the parts slide in 2 px a step while fading (40 steps, 2 frames each; the stage has no opacity for scene
  // pictures, so they slide in and are gone at the end)
  2863: async (st, ctx, q) => {
    const draw = (x) => { st.clear(); snow(st, ctx); face(st, F3, 38); face(st, ...PART, -80 + 2 * x); face(st, ...PART, 80 - 2 * x); };
    draw(0);
    for (let x = 1; x <= 40 && !q && !st.ui.skipped; x++) { draw(x); await st.ui.wait(2); }
    st.clear(); snow(st, ctx); face(st, F3, 38);
  },
  2864: (st, ctx) => { snow(st, ctx); face(st, F3, 38); },
  2865: (st, ctx) => { snow(st, ctx); face(st, F3, 39); }, // 合体13号
  2881: (st, ctx) => snow(st, ctx),
  2901: (st) => { wide(st, BG.天界); under(st, P3, 0, -32); under(st, P3, 4, 32); face(st, P3, 1); }, // 悟空、ヤムチャ、ピッコロ
  2911: (st) => { wide(st, BG.カプセル); under(st, P3, 3); face(st, CARD, 8, -32, 2); face(st, P3, 9, 32); }, // クリリン、ブルマ、ベジータ
  2921: (st) => { wide(st, BG.林); under(st, P3, 5, -32); under(st, P3, 6, 32); }, // 天津飯、チャオズ
  2922: (st) => { wide(st, BG.林); under(st, P3, 5, -32); under(st, P3, 6, 32); face(st, CARD, 115, 0, 2); }, // タオパイパイ(サイボーグ)
  2931: (st) => { wide(st, BG.家); face(st, P3, 2, -32); face(st, P3, 7, 32); under(st, P3, 21, -32); under(st, CARD, 35, 32, 0, 2); }, // 牛魔王
};
D[2923] = D[2921];
const BATTLES = [2832, 2842, 2852, 2871]; // battle_process: run by the flow below
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), BATTLES, [P3, E3, F3, CARD, ...Object.values(BG)]);

// set_battle_event 17: Goku against Nos. 14, 14, 15 — only they attack; the first two he dodges (@event_atc_hit), the
// third lands as usual. The damage is not shown ($game_variables[96] != 0).
async function film(st, quiet) {
  if (quiet || !G) return;
  const w = G.world, f = C(G).film, a = w.actors[f.party];
  const pty = { normal: a.sprite, special: a.special };
  const foes = f.foes.map((id) => ({ normal: w.enemies[id].portrait, special: w.enemies[id].sprite, size: w.enemies[id].size }));
  await loadImages([pty.normal, pty.special, ...foes.flatMap((x) => [x.normal, x.special]), f.backdrop, ...ANIME_IMAGES]);
  await duelFilm(st.ui, foes.map((foe, k) => ({ party: pty, foe, ray: a.ray, p: false, skill: null, hit: !f.dodge[k] })), f.backdrop);
}

// CE63 合体13号へ変身 → CE45 (the Super Saiyan template): the back, Broly's three auras, No. 13's two bodies; 90 frames,
// the sound and a 264-frame quake, the aura cycling every 4 frames ×10, the bodies flickering every 8 frames (×5) and
// every 4 (×7), the merged body and the aura ×20
async function mergeFilm(st, ui) {
  const m = C(G).merge;
  await loadImages([m.back, ...m.auras, ...m.bodies]);
  ui.dlg.hidden = true;
  st.clear();
  const size = (p) => { const e = img(p); return e.ok ? [e.im.width, e.im.height] : [512, 224]; };
  screenPic(st, m.back, 0, 128, [0, 0, 640, 224]);
  const A = m.auras.map((p) => screenPic(st, p, m.aura[0], m.aura[1], [0, 0, ...size(p)], 0));
  const B = m.bodies.map((p, k) => screenPic(st, p, m.body[0], m.body[1], [0, 0, ...size(p)], k ? 0 : 255));
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

// ---------- the pages' own commands (tools/build_z4e.py) ----------
// $partyc = [...]: the remake keeps one member per character (a Super Saiyan id stands for the base one) and has no
// No. 16 to play (page 56 lists everyone, 16号 too, only to recover them all before the real party is set)
const BASE = { 14: 3, 18: 5, 19: 12, 20: 17, 26: 25, 32: 16 };
addNodes({
  z4eParty: async (node, { ctx }) => {
    if (!G) return;
    party(G, [...new Set(node.ids.map((id) => BASE[id] ?? id))].filter((id) => G.world.actors[id]));
    ctx.partyc = G.state.party.map((m) => m.id);
  },
  z4eSsOff: async (node, { ctx }) => { // CE159 超サイヤ人全解除
    if (!G) return;
    for (let no = 1; no <= 7; no++) superSaiyan(G.world, G.state, no, false);
    ctx.partyc = G.state.party.map((m) => m.id);
  },
  z4eMerge: async (node, { stage, ui, quiet }) => { if (!quiet && G) await mergeFilm(stage, ui); },
});

// ---------- the flow ----------
const page = (game, k) => Z3(game).pages[`z4e${k}`];
const playPages = (game, ...keys) => playScenes(keys.map((k) => ({ nodes: page(game, k) })), game.state);
const playPart = (game, k, part) => playScenes([{ nodes: page(game, k)[part] }], game.state);

async function start(game) {
  const s = game.state;
  stop(game);
  s.flags.z3 = 'z4e';
  s.flags.z3At = null;
  await card(Z3(game).titles.z4e, 2200);
  s.var[41] = 2371;
  await playPages(game, 2371, 2941); // (page 22 ends in variable 41 = 2941: page 70 follows)
  toField(game, C(game).room);
}

// map 44 (15,4) with variable 121 = 3: page 71 — CE40 and 流派一致修行 with the party (Krillin, Yamcha, Tien, Chiaotzu)
async function training(game) {
  const s = game.state;
  stop(game);
  s.var[41] = 2951;
  s.flags.z3At = { ch: 'z4e', at: 'train' };
  game.save(true);
  await ryuhaPairTraining(game, { pattern: 3 });
  stop(game);
  s.var[41] = 2801;
  await playPages(game, 2801); // (ends in the film: z1field 2811)
  s.sw[128] = false; // chk_set_event_no: variable 41 = variable 95
  s.var[41] = s.var[95] || 2821;
  s.var[95] = 0;
  s.sw[135] = false;
  await playPages(game, 2821);
  toField(game, C(game).field);
}

// a story battle of this chapter: $Battle_MapID = 6, the extra-attack switches the page set (25 last one standing,
// 26 / 27 / 29 HP ≤ 30 / 40 / 50 %, 28 two or fewer; cleared after, reset_battle_flag); chk_set_event_no after it
async function battle(game, no) {
  const s = game.state, sw = s.sw;
  const flags = { alone: !!sw[25], hp30: !!sw[26], hp40: !!sw[27], two: !!sw[28], hp50: !!sw[29] };
  const r = await fight(game, no, String(no), { backdrop: C(game).backdrop, ...flags });
  G = game;
  for (let k = 25; k <= 29; k++) sw[k] = false;
  if (r === 'win') { s.sw[128] = false; s.var[95] = 0; }
  return r;
}

// Nos. 15 and 14 (map 93 events 6, 7): their page → the battle; the second one beaten → 2846 No. 13 wakes up
async function android(game, k) {
  stop(game);
  game.state.var[41] = k;
  await playPart(game, k, 0);
  return k === 2831 ? battle15(game) : battle14(game);
}
const battle15 = (game) => afterAndroid(game, 2832);
const battle14 = (game) => afterAndroid(game, 2842);
async function afterAndroid(game, no) {
  const s = game.state;
  if (await battle(game, no) !== 'win') return; // (lost: main.js loads the save made before it)
  s.flags[no === 2832 ? 'z4e15' : 'z4e14'] = true;
  if (s.sw[578] && s.sw[579]) {
    s.var[41] = 2846;
    await playPages(game, 2846);
  }
  toField(game);
}
// No. 13 (65,17): 2851 → 2852 → 2861 the merge → 2871 → 2881 → 2901-2931 → variable 41 = 2991
async function no13(game) {
  stop(game);
  game.state.flags.z4e13 = true; // (his marker goes now, as 14 / 15's do with the switches their pages set first)
  game.state.var[41] = 2851;
  await playPart(game, 2851, 0);
  return battle13(game);
}
async function battle13(game) {
  const s = game.state;
  if (await battle(game, 2852) !== 'win') return;
  s.var[41] = 2861;
  await playPart(game, 2861, 0);
  return battleMerged(game);
}
async function battleMerged(game) {
  const s = game.state;
  if (await battle(game, 2871) !== 'win') return;
  s.var[41] = 2881;
  await playPages(game, 2881, 2901, 2911, 2921, 2931); // (each page sets the next one's variable 41; 2931 ends at 2991)
  s.var[41] = 2991;
  return nextZ3(game, 'z4e');
}

function spot(game, poi) {
  G = game;
  if (poi.page === 'htc' && game.state.var[121] === 3) return training(game); // map 44 修行開始 (tools/build_z4a.py)
  return null;
}
function boss(game, b) {
  if (game.busy || !b) return null;
  G = game;
  if (b.key === '2831' || b.key === '2841') return android(game, +b.key);
  if (b.key === '2851') return no13(game);
  return null;
}
// a save made right before the training or a story battle
const AT = { train: training, 2832: battle15, 2842: battle14, 2852: battle13, 2871: battleMerged };
function resume(game, at) {
  G = game;
  const f = AT[at && at.at];
  if (f) f(game);
  else toField(game);
}

// ---------- development: index.html?dev=z4e / z4eroom / z4eshop / z4efield / z4e13 / z4eend (&timer in a hidden pane) ----------
// a plausible state at the hand-over from the fourth chapter (variable 41 = 2371)
function dev(game, step) {
  if (!/^z4e(room|shop|field|13|end)?$/.test(step)) return false;
  devState(game, step);
  return true;
}
async function devState(game, step) {
  const w = game.world, s = game.newState();
  game.state = s;
  G = game;
  s.bench = {};
  const lv = { 3: 60, 4: 58, 5: 57, 6: 52, 7: 50, 8: 52, 9: 48, 10: 45, 12: 60, 17: 58, 24: 46 };
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
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, z3: 'z4e' });
  Object.assign(s.var, { 40: 2, 43: 91, 41: 2371 });
  Object.assign(s.sw, { 381: true, 431: true, 483: true });
  s.cardiMax = 10;
  s.zeni = 30000;
  s.party = [];
  setParty(s, [3, 4, 5, 6, 7, 8, 9, 10, 24, 12, 17]);
  await applyEra(game);
  s.hand = newHand(w);
  moveTo(s, C(game).room);
  game.startField();
  if (step === 'z4e') return start(game);
  // after page 70 (z4eroom): the four on map 44, variable 121 = 3
  Object.assign(s.var, { 41: 2941, 43: 94, 121: 3, 42: 6 });
  setParty(s, [6, 7, 8, 9]);
  if (step === 'z4eroom') { toField(game, C(game).room); return; }
  stop(game);
  if (step === 'z4eshop') { s.var[41] = 2801; await playPages(game, 2801); s.var[41] = 2821; await playPages(game, 2821); toField(game, C(game).field); return; }
  // after page 56 (z4efield): the nine on map 93
  Object.assign(s.var, { 41: 2821, 43: 92, 42: 3, 324: 52 });
  setParty(s, [3, 4, 5, 6, 7, 8, 9, 12, 17]);
  moveTo(s, C(game).field);
  if (step === 'z4efield') { toField(game); return; }
  // Nos. 14 and 15 beaten (z4e13): No. 13 is up; z4eend: the pages after the merged No. 13
  Object.assign(s.sw, { 578: true, 579: true, 193: true });
  Object.assign(s.flags, { z4e14: true, z4e15: true });
  s.var[43] = 93;
  moveTo(s, { map: '93', x: 63, y: 18 });
  if (step === 'z4e13') { toField(game); return; }
  s.flags.z4e13 = true;
  s.var[41] = 2881;
  await playPages(game, 2881, 2901, 2911, 2921, 2931);
  s.var[41] = 2991;
  nextZ3(game, 'z4e');
}

registerZ3('z4e', { maps: MAPS, start, spot, boss, resume, dev });

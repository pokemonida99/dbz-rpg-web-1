// Z4 第六章 賽魯遊戲（地圖 48・49） — driven by world.z3 (tools/build_z4f.py), following Map007 event 7 page 72 (variable
// 41 = 2991) and pages 28-40 (2431-2621), the scenes z1field 2431-2693 (all.rb 176917-177900), the spots of map 48
// (145_Event_Check.rb `when 48`) and map 49 (the kamehameha duel). docs/z4f.md has the whole chapter.
//   2991 the 17th day (Goku's house, the temple, the rocks, No. 16) → map 48 (75,63)
//   the ring (44,35): 2441 Mr. Satan → his kick (a battle film) → 2451 → (44,36); again → 2461 Goku alone → battle
//     2463 (10 turns) → 2471 Gohan → battle 2481 (7 turns, enemy damage × 0.5) → 2491 No. 16's attack (a film) →
//     2511 No. 16 destroyed, Gohan awakens (a film) → 2541 No. 18, the self-destruct, the perfect Cell → battle 2561
//     → 2571 → map 49 the kamehameha duel → 2591 heaven, Shenron, Capsule Corporation → 2602 the end (2691 the staff
//     roll, 2693 Roshi) → 「Z4 完」 and the title screen (ZG 待續).
//   After the clear (switch 458, the 時之間 in the original) 2461 asks whether everyone fights → battle 2464 → 2621.
import { audio, img, loadImages, toast } from './core.js?v=20261103-0319';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261103-0319';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261103-0319';
import { addMoves, ANIME_IMAGES } from './anime.js?v=20261103-0319';
import { makeMember, applyLevel } from './party.js?v=20261103-0319';
import { superSaiyan, syncSuperSaiyan, afterBattle, offHooks, onHooks, changeHooks } from './supersaiyan.js?v=20261103-0319';
import { applyEra } from './era.js?v=20261103-0319';
import { newHand } from './battle.js?v=20261103-0319';
import { cardSquare } from './cardgames.js?v=20261103-0319';
import { spotTally } from './fieldmenu.js?v=20261103-0319';
import { duelFilm, screenPic } from './z3c.js?v=20261103-0319';
import { registerZ3, Z3, begin, fight, toField, party, addMember, leave, member, heal, card, moveTo, setParty } from './z3.js?v=20261103-0319';

const MAPS = ['48', '49'];
const C = (game) => Z3(game).z4f;
let G = null; // the game, for the page commands below (set whenever this chapter takes over)
function stop(game) { G = game; begin(game); }

// the battle films of the moves met here (src/anime.js): the closest of the earlier films
addMoves({
  48: 'kamehameha', 52: 'masenko', 53: 'masenko', 54: 'kamehameha', // 悟飯
  191: 'energyWave', 192: 'scatterWave', 193: 'kikouhou', // 18號
  211: 'energyWave', 212: 'scatterWave', 213: 'kikouhou', 214: 'shishinFist', 215: 'kikouhou', // 16號
  439: 'foeWave', 440: 'raditzWave', 441: 'raditzBigWave', 442: 'raditzBigWave', 443: 'foeWave', 444: 'raditzBigWave', // 沙魯
  445: 'foeWave', 446: 'raditzWave', 447: 'raditzBigWave', 448: 'pierce', // 小沙魯
});

// ---------- the scenes (z1field 2431-2693) ----------
// Z3 scenes are 512×128 pictures over the scroll window (@z1_scrollscenex = 64); faces at @ene1_x ± n (288,78), the
// party's under the scene (@play_x 288). The phone shows the middle ~230 px, so wider rows of faces are drawn closer.
const pic = (n) => `Graphics/Pictures/${n}`;
const P3 = pic('Z3_顔味方.PNG'), E3 = pic('Z3_顔イベント.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
const BG = {
  家: pic('ZG_背景_ゴクウの家.PNG'), 天界: pic('Z3_背景_天界.PNG'), 岩山: pic('ZG_背景_グランドアポロン(青空).PNG'),
  リング: pic('Z3_背景_セルゲームリング.png'), 界王星: pic('Z3_背景_界王星.PNG'), 界王星なし: pic('Z3_背景_界王星(なし).PNG'),
  カプセル: pic('Z3_背景_カプセルコーポレーション.PNG'),
};
const SELF_DESTRUCT = pic('Z3_背景_セル自爆.png'), TIME_MACHINE = pic('Z3_背景_タイムマシンp2.png');
const SHENRON = pic('Z3_シェンロン呼び出し(天界用に編集).PNG');
const SS_BACK = pic('Z3_スーパーサイヤ人_バック.PNG');
const FIT = 224; // art px of the scene a phone shows for sure
// faces: [sheet, row, col]
const CELL = [F3, 29], JR = [F3, 30], N18 = [F3, 24], ANN = [E3, 10], N16_BROKEN = [E3, 55];
const card3 = (row) => [CARD, row, 2]; // a 顔カード face: column 2 = Z3
const POPO = card3(12), DENDE = card3(14), KAIO = card3(25), GYUMAO = card3(35);
const P = (row, col = 0) => [P3, row, col];
const GOKU = P(0), PICCOLO = P(1), GOHAN = P(2), KRILLIN = P(3), YAMCHA = P(4), TIEN = P(5), CHAOZU = P(6), CHICHI = P(7);
const VEGETA = P(9), TRUNKS = P(14), N16 = P(20), ROSHI = P(21), SATAN = P(28);
// set_character_face 0,15: 超サイヤ人悟飯 — 超サイヤ人2 (switch 388 in the original) has its own face (ZG_顔グラ(ゴハン超1_2))
const ssGohan = (col = 0) => {
  const s = G && G.state, f = G && C(G).ss2.face;
  return s && s.ss && s.ss[5] && f ? [f[0], f[1], col] : P(15, col);
};

const wide = (st, bg) => st.add(bg, SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
const face = (st, [sheet, row, col = 0], dx = 0, dy = 0) => st.add(sheet, ENE[0] + dx, ENE[1] + dy, [64 * col, 64 * row, 64, 64]);
// a row of faces in the scene ([face, dx]): as the original places them, closer (and smaller) when wider
function group(st, list) {
  const xs = list.map((f) => f[1]), lo = Math.min(...xs), hi = Math.max(...xs);
  if (hi - lo + 64 <= FIT) { for (const [f, dx] of list) face(st, f, dx); return; }
  const size = Math.min(64, Math.floor(FIT / list.length)), k = (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
  for (const [[sheet, row, col = 0], dx] of list) {
    st.add(sheet, ENE[0] + 32 - size / 2 + (dx - mid) * k, ENE[1] + 32 - size / 2, [64 * col, 64 * row, 64, 64], false, 0, [size, size]);
  }
}
// the eight Cell Jr. round Cell (or alone: at ±64·k, or ±(64·k − 32) when Cell is not there)
const juniors = (k, cell = true) => [...Array(k * 2)].map((_, i) => {
  const n = (i >> 1) + 1, side = i % 2 ? 1 : -1;
  return [JR, side * (cell ? 64 * n : 64 * n - 32)];
}).sort((a, b) => a[1] - b[1]);
const under = (st, sheet, row, dx = 0, line = 0, col = 0) => st.add(sheet, PLAY_X + dx, 0, [64 * col, 64 * row, 64, 64], true, line);
// faces under the scene: groups of [sheet, row, col], each from a new line (the original's @play_y and @play_y + 64);
// as many a row as fit a phone, smaller when more (two rows at most for the dozen of the Cell Game, so a 375×667
// screen still shows the 是 / 否 under the message box)
function lay(st, groups) {
  const n = Math.max(1, ...groups.map((g) => g.length));
  const per = n > 10 ? 6 : n > 8 ? 5 : n > 6 ? 4 : 3;
  st.faceSize = n > 10 ? 36 : n > 8 ? 40 : n > 6 ? 48 : 64;
  let line = 0;
  for (const g of groups) {
    g.forEach(([sheet, row, col = 0], k) => {
      const ln = Math.floor(k / per), m = Math.min(per, g.length - per * ln), j = k % per;
      under(st, sheet, row, -32 * (m - 1) + 64 * j, line + ln, col);
    });
    line += Math.ceil(g.length / per);
  }
}
const partyFace = (id, col = 0) => (id === 18 ? ssGohan(col) : P(id - 3, col));
// character_output: the party ($partyc)
const party3 = (ctx, col = 0) => ctx.partyc.map((id) => partyFace(id, col));
// character_output_all dying, 0, adjust_y, mode (all.rb 167997): the party as the mode lists it, then the others of
// the list who are not in it, in the original's order (a Super Saiyan as he is)
const TARGETS = {
  7: [3, 14, 4, 5, 18, 17, 20, 6, 7, 8, 9, 10, 24], 8: [3, 14, 4, 5, 18, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24],
  9: [3, 14, 4, 5, 18, 6, 7, 8, 9, 12, 19, 17, 20, 10, 24, 23], 10: [4, 5, 18, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24, 23],
  11: [3, 14, 4, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24, 23], 12: [3, 14, 4, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24],
  13: [4, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24], 14: [5, 18, 4, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24],
  15: [5, 18, 4, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24, 21], 16: [4, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24, 21], 17: [4, 12, 19],
};
const ADD_ORDER = [[3, 14, 1], [4], [5, 18, 2], [6], [7], [8], [9], [10], [24], [12, 19, 3], [17, 20, 4], [25, 26, 6], [16, 32, 7],
  [27], [28], [29], [30], [15], [23], [22], [21], [31]];
function all(ctx, mode, col = 0) {
  const t = TARGETS[mode], ss = (ctx.s.ss || {});
  const ids = ctx.partyc.filter((id) => t.includes(id));
  for (const [a, b, no] of ADD_ORDER) {
    if (!t.includes(a) || ids.includes(a) || (b && ids.includes(b))) continue;
    ids.push(b && (ss[no] || (no === 2 && ss[5])) ? b : a);
  }
  return ids.map((id) => partyFace(id, col));
}

const D = {
  2431: (st) => { wide(st, BG.家); group(st, [[CHICHI, -32], [GYUMAO, 32]]); lay(st, [[GOKU]]); }, // チチ 牛魔王 / 悟空
  2432: (st) => { wide(st, BG.家); face(st, GYUMAO, 32); },
  // the temple: the eight and Dende in a row, Popo over Dende in the original (here next to him)
  2433: (st) => { wide(st, BG.天界); temple(st); },
  2434: (st) => { wide(st, BG.天界); temple(st); lay(st, [[GOKU, CHICHI]]); },
  2435: (st) => { wide(st, BG.岩山); face(st, VEGETA); },
  2436: (st, ctx) => { wide(st, BG.岩山); face(st, VEGETA); lay(st, [all(ctx, 7)]); },
  2437: (st, ctx) => { wide(st, BG.岩山); lay(st, [all(ctx, 8)]); },
  2438: (st, ctx) => { wide(st, BG.岩山); face(st, N16); lay(st, [all(ctx, 8)]); },
  2441: (st) => { wide(st, BG.リング); group(st, [[ANN, -192], [SATAN, -96], [CELL, 96]]); },
  2442: (st, ctx) => { wide(st, BG.リング); group(st, [[ANN, -192], [SATAN, -96], [CELL, 96]]); lay(st, [all(ctx, 9)]); },
  2449: (st, ctx, q) => duel(st, q, '2449'), // set_battle_event 9: サタンダイナマイトキック
  2451: (st, ctx) => { wide(st, BG.リング); group(st, [[ANN, -192], [CELL, 96]]); lay(st, [all(ctx, 9)]); },
  2452: (st, ctx) => { wide(st, BG.リング); group(st, [[ANN, -192], [P(28, 1), -96], [CELL, 96]]); lay(st, [all(ctx, 9)]); },
  2461: (st, ctx) => { wide(st, BG.リング); face(st, CELL); lay(st, [all(ctx, 9)]); },
  2462: (st, ctx) => { wide(st, BG.リング); group(st, [...juniors(4), [CELL, 0]]); lay(st, [all(ctx, 9)]); }, // セルジュニア
  2471: (st, ctx) => { wide(st, BG.岩山); group(st, [[GOKU, -96], [CELL, 96]]); lay(st, [all(ctx, 10)]); },
  2472: (st, ctx) => { wide(st, BG.岩山); group(st, [[GOHAN, -96], [CELL, 96]]); lay(st, [all(ctx, 11)]); },
  2473: (st, ctx) => { wide(st, BG.岩山); group(st, [[ssGohan(), -96], [CELL, 96]]); lay(st, [all(ctx, 11)]); },
  2501: (st, ctx, q) => duel(st, q, '2501'), // set_battle_event 10: 16号自爆
  2512: (st, ctx) => { wide(st, BG.岩山); group(st, [[ssGohan(), -96], [CELL, 96]]); lay(st, [all(ctx, 12)]); },
  // Gohan over the Cell Jr. in the original (@ene1_y - 72, above the scene): here alone on the first row under it
  2513: (st, ctx) => { wide(st, BG.岩山); group(st, [...juniors(4), [CELL, 0]]); lay(st, [[ssGohan()], all(ctx, 12)]); },
  2514: (st) => { wide(st, BG.岩山); lay(st, [[SATAN], [ANN]]); },
  2515: (st) => { wide(st, BG.岩山); face(st, N16_BROKEN); lay(st, [[SATAN], [ANN]]); }, // 16号破壊
  2517: (st, ctx) => { wide(st, BG.岩山); group(st, [...juniors(4), [CELL, 0]]); lay(st, [[ssGohan()], all(ctx, 12, 1)]); },
  2518: (st) => { wide(st, BG.岩山); group(st, [[N16_BROKEN, -32], [CELL, 32]]); lay(st, [[ssGohan()]]); }, // 16号放り投げる
  2519: (st) => { wide(st, BG.岩山); face(st, CELL); lay(st, [[ssGohan()]]); },
  2521: (st, ctx) => { wide(st, BG.岩山); group(st, juniors(4, false)); lay(st, [[ssGohan()], all(ctx, 12, 1)]); },
  2522: (st, ctx) => { wide(st, BG.岩山); group(st, juniors(3, false)); lay(st, [[ssGohan()], all(ctx, 12, 1)]); },
  2523: (st, ctx) => { wide(st, BG.岩山); group(st, juniors(2, false)); lay(st, [[ssGohan()], all(ctx, 12, 1)]); },
  2524: (st, ctx) => { wide(st, BG.岩山); lay(st, [[ssGohan()], all(ctx, 12, 1)]); },
  2525: (st, ctx) => { wide(st, BG.岩山); face(st, CELL); lay(st, [[ssGohan()], all(ctx, 12, 1)]); },
  2531: (st, ctx, q) => duel(st, q, '2531'), // set_battle_event 11: 超悟飯2対セル
  2541: (st, ctx) => { wide(st, BG.岩山); face(st, CELL); lay(st, [[ssGohan()], all(ctx, 12)]); },
  2542: (st, ctx) => { wide(st, BG.岩山); group(st, [[N18, -32], [[F3, 28], 32]]); lay(st, [[ssGohan()], all(ctx, 12)]); }, // 18号吐き出す
  2543: (st, ctx) => { wide(st, BG.岩山); wide(st, SELF_DESTRUCT); lay(st, [[ssGohan()], all(ctx, 12)]); }, // セル爆発巨大化
  2544: (st, ctx) => { wide(st, BG.岩山); wide(st, SELF_DESTRUCT); face(st, GOKU, -96); lay(st, [[ssGohan()], all(ctx, 13)]); },
  2545: (st) => { wide(st, BG.界王星); wide(st, SELF_DESTRUCT); group(st, [[GOKU, -96], [KAIO, 94]]); }, // 界王星
  2546: (st, ctx) => { wide(st, BG.岩山); lay(st, [all(ctx, 14)]); },
  2547: (st) => { wide(st, BG.界王星なし); group(st, [[GOKU, -64], [KAIO, 64]]); },
  2548: (st, ctx) => { wide(st, BG.岩山); lay(st, [all(ctx, 15)]); }, // 18号味方側
  2549: (st, ctx) => { wide(st, BG.岩山); face(st, CELL); lay(st, [all(ctx, 15)]); },
  2550: (st, ctx) => { wide(st, BG.リング); group(st, [...juniors(4), [CELL, 0]]); lay(st, [all(ctx, 15)]); },
  2571: (st, ctx) => { wide(st, BG.リング); face(st, CELL); lay(st, [all(ctx, 15)]); },
  2591: (st, ctx) => { wide(st, BG.岩山); face(st, GOHAN); lay(st, [all(ctx, 16)]); },
  2592: (st, ctx) => { wide(st, BG.岩山); lay(st, [all(ctx, 17)]); },
  2593: (st) => wide(st, BG.岩山),
  2594: (st) => { wide(st, BG.岩山); face(st, ANN); lay(st, [[SATAN]]); },
  2595: (st, ctx) => { wide(st, BG.天界); group(st, [[N18, -64], [DENDE, 0], [POPO, 64]]); lay(st, [party3(ctx)]); },
  2596: (st, ctx) => { wide(st, BG.天界); group(st, [[DENDE, -32], [POPO, 32]]); lay(st, [party3(ctx)]); },
  2597: (st, ctx, q) => shenron(st, q), // シェンロン呼ぶ
  2598: (st, ctx) => { face(st, card3(16)); lay(st, [[DENDE, POPO], party3(ctx)]); }, // シェンロン
  2599: (st, ctx) => { wide(st, BG.天界); lay(st, [[DENDE, POPO], party3(ctx)]); },
  2600: (st, ctx) => { wide(st, BG.天界); face(st, N18); lay(st, [[DENDE, POPO], party3(ctx)]); }, // 18号来る
  2601: (st) => { wide(st, BG.家); face(st, GYUMAO); lay(st, [[[E3, 17], GOHAN, card3(18)]]); }, // チチ 悟飯 占いババ
  2602: (st) => { wide(st, BG.カプセル); face(st, TRUNKS); capsule(st); },
  2603: (st) => { wide(st, BG.カプセル); st.add(TIME_MACHINE, ENE[0] - 20, SCENE_Y + 10, [0, 0, 128, 128]); capsule(st); },
  2604: (st) => { wide(st, BG.カプセル); capsule(st); },
  2611: (st) => { wide(st, BG.岩山); const s = G && G.state; lay(st, [[s && s.ss && s.ss[3] ? P(16) : VEGETA]]); }, // ベジータのみ
  2621: (st, ctx) => { wide(st, BG.リング); lay(st, [all(ctx, 9)]); },
  2691: (st, ctx, q) => (q ? null : staffRoll(st.ui)), // z_ed_rev1 スタッフロール
  2693: (st) => face(st, ROSHI), // クリア後もうちっとだけ続く
};
for (const n of [2491, 2511]) D[n] = n === 2491 ? D[2473] : (st, ctx) => D[2492](st, ctx);
D[2492] = (st, ctx) => { wide(st, BG.岩山); group(st, [[ssGohan(), -96], [CELL, 96], [N16, 160]]); lay(st, [all(ctx, 12)]); };
D[2516] = D[2513];
D[2520] = D[2519];
function temple(st) {
  group(st, [[YAMCHA, -256], [KRILLIN, -192], [ROSHI, -128], [GOHAN, -64], [DENDE, -8], [POPO, 8], [PICCOLO, 64], [TRUNKS, 128],
    [TIEN, 192], [CHAOZU, 256]]);
}
// Capsule Corporation: Yamcha, Gohan, Krillin, Bulma, baby Trunks, her mother, Roshi, Oolong; Vegeta under them
function capsule(st) {
  lay(st, [[YAMCHA, GOHAN, KRILLIN, card3(8), [E3, 16], card3(37), card3(9), card3(20)], [VEGETA]]);
}
// 2597: Shenron called at the temple (Z3_シェンロン呼び出し(天界用に編集): nine 640×480 frames)
async function shenron(st, quiet) {
  if (quiet) return;
  const ui = st.ui;
  st.ui.dlg.hidden = true;
  const show = (k) => { st.clear(); if (k != null) screenPic(st, SHENRON, 0, 0, [640 * k, 0, 640, 480]); };
  for (const k of [0, 1, 2, 3, 4]) { show(k); await ui.wait(k === 4 ? 120 : 16); }
  for (let t = 0; t < 2 && !ui.skipped; t++) {
    show(null);
    audio.se('Z3 稲妻', 80);
    for (let x = 0; x <= 10 && !ui.skipped; x++) { show(5); await ui.wait(4); show(6); await ui.wait(4); show(null); }
    if (t === 0) { show(4); await ui.wait(20); }
  }
  audio.se('Z3 シェンロン呼び出し', 80);
  show(null);
  st.flash = 1;
  await ui.wait(120);
  st.flash = 0;
  for (let x = 0; x <= 22 && !ui.skipped; x++) { show(7); await ui.wait(4); show(8); await ui.wait(4); show(null); }
}

// set_battle_event 9 / 10 / 11 (all.rb 52716): a battle film nobody plays — Mr. Satan's kick, No. 16's attack (the
// self-destruct that does not go off), Super Saiyan 2 Gohan and Cell (Cell attacks, Gohan hits, twice)
async function duel(st, quiet, key) {
  if (quiet || !G) return;
  const c = C(G), d = c.duels[key], f = G.world.enemies[129];
  const foe = { normal: f.portrait, special: f.sprite, size: f.size };
  const acts = key === '2531'
    ? [{ p: false, hit: false }, { p: true, hit: true }, { p: false, hit: false }, { p: true, hit: true }]
    : [{ p: true, hit: true }];
  await loadImages([d.party.normal, d.party.special, foe.normal, foe.special, c.backdrop, ...ANIME_IMAGES]);
  await duelFilm(st.ui, acts.map((x) => ({ party: d.party, foe, skill: null, ray: 'orange', ...x })), c.backdrop);
}

// CE57 / CE58 → CE45: Gohan's Super Saiyan (2) transformation — the back (0,128), Vegeta's three auras (178,128), the two
// bodies (88,128): 90 frames, the sound and a 264-frame quake, the aura every 4 frames ×10, then the body flickering
// every 8 frames (×5), every 4 (×7), the new body and the aura ×20 (as src/z3c.js transformFilm)
const TRANSFORM = { gohan1: ['Z3_スーパーサイヤ人_ゴハン1.png', 'Z3_スーパーサイヤ人_ゴハン2.png'], gohan2: ['Z3_スーパーサイヤ人_ゴハン2.png', 'Z3_スーパーサイヤ人_ゴハン3.png'] };
const AURAS = [1, 2, 3].map((k) => pic(`Z3_スーパーサイヤ人_ベジータ_気${k}.PNG`));
async function transform(st, ui, who) {
  ui.dlg.hidden = true;
  st.clear();
  screenPic(st, SS_BACK, 0, 128, [0, 0, 640, 224]);
  const A = AURAS.map((p) => screenPic(st, p, 178, 128, [0, 0, 284, 224], 0));
  const B = TRANSFORM[who].map((p, k) => screenPic(st, pic(p), 88, 128, [0, 0, 512, 224], k ? 0 : 255));
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

const BATTLES = [2463, 2464, 2481, 2561]; // battle_process: run by the flow below (set_battle_event 2449 / 2501 / 2531: films)
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), BATTLES,
[P3, E3, F3, CARD, ...Object.values(BG), SELF_DESTRUCT, TIME_MACHINE, SHENRON, SS_BACK, ...AURAS,
  ...Object.values(TRANSFORM).flat().map(pic), pic('ZG_顔グラ(ゴハン超1_2).png')]);

// ---------- the party commands of these pages (tools/build_z4f.py) ----------
const ids = () => G.state.party.map((m) => m.id);
const refresh = (ctx) => { ctx.partyc = ids(); };
const snapshot = () => ({ ids: ids(), ss: { ...(G.state.ss || {}) } });
function restore(t) {
  if (!t) return;
  const ss = { ...t.ss };
  const s2 = !!ss[5];
  delete ss[5];
  ssOff5();
  syncSuperSaiyan(G.world, G.state, ss);
  if (s2) ss5(true);
  party(G, [...new Set(t.ids)]);
}
// on_off_super_saiyazin 5 (all.rb 12824): 超サイヤ人2 悟飯 is the same actor (18) — on: the 固有技能 真の力 (38) in place
// of his first one, the ZG battle sheets; off: back to the first one, and to the normal Gohan (switch 2 off too)
function ss5(on, world = G.world, s = G.state) {
  const c = world.z3.z4f;
  s.ss = s.ss || {};
  if (on) {
    if (s.ss[5]) return;
    const was = { ...s.ss };
    const m = s.party.find((x) => x.id === 18) || (s.bench || {})[18];
    s.ss[5] = true;
    if (m) {
      m.typ = m.typ || [0, 0, 0]; // (one who has not fought yet: src/growth.js ensure)
      s.flags.z4fTyp = m.typ[0]; m.typ[0] = 38; m.got = m.got || {}; m.set = m.set || {}; m.got[38] = m.set[38] = true;
      (m.sp = m.sp || {})[38] = (world.growth.skills[38] || {}).sp || 0; // (取得済み状態にする)
      m.sprite = c.ss2.sprite;
      m.special = c.ss2.special;
    }
    for (const f of changeHooks) f(world, s, 5, true, was); // CE64, variables 450 / 451 (src/grw.js)
  } else ssOff5(world, s);
}
function ssOff5(world = G.world, s = G.state) {
  if (!s.ss || !s.ss[5]) return;
  const was = { ...s.ss };
  s.ss[5] = false;
  const m = s.party.find((x) => x.id === 18) || (s.bench || {})[18];
  if (m) {
    if (m.typ && s.flags.z4fTyp != null) m.typ[0] = s.flags.z4fTyp;
    delete m.sprite;
    delete m.special;
  }
  for (const f of changeHooks) f(world, s, 5, false, was);
  superSaiyan(world, s, 2, false);
}
offHooks[5] = ssOff5; // (off_super_saiyazin_all after a battle, src/supersaiyan.js)
onHooks[5] = (world, s) => ss5(true, world, s); // (超2 悟飯's 超サイヤ人変身 59 in battle: src/grw.js)
let me = null; // the ME playing (249: ZSSD 戦いの終わり)
function stopMe() { if (me) { try { me.stop(); } catch (e) { /* ended */ } me = null; } }
addNodes({
  z4fParty: async (node, { ctx }) => { party(G, node.ids); refresh(ctx); }, // $partyc = [...]
  z4fLeave: async (node, { ctx }) => { leave(G, node.id); refresh(ctx); }, // $partyc.delete(id)
  z4fFront: async (node, { ctx }) => { // $partyc.unshift(id)
    const s = G.state, m = member(G, node.id);
    if (!s.party.includes(m)) { delete s.bench[m.id]; s.party.unshift(m); }
    refresh(ctx);
  },
  // add_cha_last_cellbtl: the party filled up to nine (Gohan, Piccolo, Vegeta, Trunks, …), everyone healed
  z4fFill: async (node, { ctx }) => {
    const s = G.state;
    for (const id of C(G).fill) if (s.party.length < 9) addMember(G, id);
    for (const m of s.party) heal(m);
    refresh(ctx);
  },
  z4fSs: async (node, { ctx }) => { // on / off_super_saiyazin n
    if (node.no === 5) ss5(node.on);
    else superSaiyan(G.world, G.state, node.no, node.on);
    refresh(ctx);
  },
  z4fSsAll: async (node, { ctx }) => { // off_super_saiyazin_all: back to normal whom 作戰 says so (5 first)
    afterBattle(G.world, G.state);
    refresh(ctx);
  },
  z4fStore: async () => { G.state.flags.z4fTmp = snapshot(); }, // CE166 現在パーティーをtempへ格納
  z4fRestore: async (node, { ctx }) => { restore(G.state.flags.z4fTmp); refresh(ctx); }, // CE167 tempからパーティーを戻す
  z4fKeep: async () => { G.state.flags.z4fKeep = snapshot(); }, // $tmp_partyc2 (before Goku fights alone)
  z4fBack: async (node, { ctx }) => { restore(G.state.flags.z4fKeep); refresh(ctx); }, // … and back at the end
  z4fTransform: async (node, { ui, stage, quiet }) => { if (!quiet) await transform(stage, ui, node.who); },
  z4fMe: async (node, { quiet }) => {
    stopMe();
    if (quiet || !node.name || !audio.ctx) return;
    const b = await audio.buf(`Audio/ME/${node.name}.ogg`);
    if (!b) return;
    const src = audio.ctx.createBufferSource(), g = audio.ctx.createGain();
    src.buffer = b;
    g.gain.value = 0.49;
    src.connect(g).connect(audio.master);
    src.start();
    me = src;
  },
});

// ---------- map 49: the kamehameha duel (pictures over black) ----------
// Event 1 is the film (its commands: tools/build_z4f.py → z4fPic / z4fMove / z4fVar …, with the lines between them);
// event 2 runs in parallel every frame — page 1 (switch 138): the fighters shake now and then, the meeting point of
// the two beams moves by variable 125 until variable 123 is used up, sparks, the sky flashing; page 2 (switch 139): the
// 親子かめはめ波 background; page 3 (switch 140): the screen shaking. Drawn on the original's 640×480 screen fitted to
// the width (above the message box while it is open).
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
class Beam {
  constructor(ui, stage) {
    this.ui = ui;
    this.stage = stage;
    this.v = {};
    this.sw = {};
    this.pics = {};
    this.k1 = 0; // page 2 waits a frame each round
    this.shake = { x: 0, dir: 1 };
    this.cv = document.createElement('canvas');
    this.cv.style.zIndex = '0';
    ui.el.insertBefore(this.cv, ui.dlg);
    this.on = true;
    const step = 1000 / 60;
    let last = performance.now(), acc = 0;
    const tick = (t) => {
      if (!this.on) return;
      acc += Math.min(200, t - last);
      last = t;
      while (acc >= step) { this.frame(); acc -= step; }
      this.draw();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  close() { this.on = false; this.cv.remove(); }
  g(id) { return this.v[id] || 0; }
  set(id, x) { this.v[id] = x; }
  // 122: [first, last, op (= += -= *= /= %=), operand (constant / variable / random), value, (random to)]
  op(p) {
    const [a, b, o, t, x, y] = p;
    for (let id = a; id <= b; id++) {
      const n = t === 0 ? x : t === 1 ? this.g(x) : rnd(x, y);
      const cur = id === 41 ? (G.state.var[41] || 0) : this.g(id);
      let r = cur;
      if (o === 0) r = n; else if (o === 1) r = cur + n; else if (o === 2) r = cur - n; else if (o === 3) r = cur * n;
      else if (o === 4) r = n ? Math.floor(cur / n) : cur; else if (o === 5) r = n ? ((cur % n) + n) % n : cur;
      if (id === 41) G.state.var[41] = r; else this.v[id] = r;
    }
  }
  show(n, name, o, x, y, zx = 100, zy = 100, op = 255, blend = 0) {
    this.pics[n] = { path: C(G).filmPics[name], o, x, y, zx, zy, op, blend, mirror: false, mv: null };
  }
  showBy(n, name, vx, vy) { this.show(n, name, 0, this.g(vx), this.g(vy)); }
  erase(n) { delete this.pics[n]; }
  // the common events of the film (CE80-90, CE100)
  ce(n) {
    const g = (id) => this.g(id), s = (id, x) => this.set(id, x);
    if (n === 80) for (const id of [106, 107, 139, 140, 151, 133, 134, 135, 136, 137, 138]) s(id, 0);
    if (n === 81) { s(116, g(109) - 2); s(117, g(113) - 16 + g(115)); s(118, g(113) + g(115)); } // 衝突更新
    if (n === 82) { s(109, g(106) + 4); s(110, g(107) + 86); s(111, g(108) - 50); s(112, g(109) + 16); s(113, g(110) + 60); s(114, g(114) - 60); }
    const at = { 83: [-40, 60], 84: [0, 50], 85: [-80, 56], 86: [-140, 12], 87: [40, 46], 88: [80, 36], 89: [20, 14] }[n]; // 位置
    if (at) { s(122, -100); s(139, g(106) + at[0]); s(140, g(107) - at[1]); }
    if (n === 90) { s(156, g(116) - 48); s(157, g(117) - 56); } // 火花更新
    if (n === 100) this.pics = {}; // ピクチャー全消去
  }
  // one frame: event 2 (the highest page whose switch is on), then the pictures' moves, the shake
  frame() {
    if (this.sw[140]) this.shake.on = true; // page 3: 画面のシェイク (power 2, speed 9) every frame
    else if (this.sw[139]) { if (this.k1++ % 2 === 0) this.page2(); }
    else if (this.sw[138]) this.page1();
    for (const p of Object.values(this.pics)) {
      const m = p.mv;
      if (!m || m.d < 1) continue;
      const d = m.d;
      p.x = (p.x * (d - 1) + m.x) / d; p.y = (p.y * (d - 1) + m.y) / d;
      p.zx = (p.zx * (d - 1) + m.zx) / d; p.zy = (p.zy * (d - 1) + m.zy) / d;
      p.op = (p.op * (d - 1) + m.op) / d;
      m.d--;
    }
    const sh = this.shake;
    if (sh.on || sh.x !== 0) { // Game_Screen#update shake: power 2, speed 9, for one frame each time
      const delta = (2 * 9 * sh.dir) / 10;
      if (!sh.on && sh.x * (sh.x + delta) < 0) sh.x = 0; else sh.x += delta;
      if (sh.x > 4) sh.dir = -1;
      if (sh.x < -4) sh.dir = 1;
      sh.on = false;
    }
  }
  page1() {
    const g = (id) => this.g(id), s = (id, x) => this.set(id, x);
    if (g(132) === 1) { // 左右揺れ
      s(128, rnd(1, 4));
      if (g(128) === 1) {
        s(129, g(107)); s(130, g(108)); s(131, g(115));
        s(126, rnd(0, 2) * 2);
        if (rnd(0, 1) === 1) s(126, -g(126));
        s(107, g(107) + g(126));
        if (g(153) === 0) s(108, g(108) + g(126));
        s(115, g(115) + g(126));
        this.ce(82);
        this.showBy(17, 'ZG_修行_光線打合_キャラ_超悟飯2_3', 107, 106);
        if (g(153) === 0) this.showBy(2, 'ZG_修行_光線打合_キャラ_セル3', 108, 106);
        this.showBy(3, 'ZG_修行_光線打合_発動_黄', 110, 109);
        if (g(153) === 0) this.showBy(4, 'ZG_修行_光線打合_発動_青', 111, 109);
        this.showBy(6, 'ZG_修行_光線打合_エネルギー波_黄', 113, 112);
        if (g(153) === 0) { this.showBy(5, 'ZG_修行_光線打合_エネルギー波_青', 113, 112); this.pics[5].zx = 1140; }
        if (this.pics[2]) this.pics[2].mirror = true;
        if (this.pics[4]) this.pics[4].mirror = true;
        const who = [[133, 83, 13, 'ピッコロ_3'], [134, 84, 14, 'クリリン_3'], [135, 85, 12, 'テンシンハン_3'], [136, 86, 11, 'チャオズ_3'],
          [137, 87, 15, 'ヤムチャ_3'], [138, 88, 16, 'ZG_トランクス(超)_3'], [151, 89, 18, 'ゴクウ(超)_3']];
        for (const [v, ce, n, name] of who) if (g(v) === 1) { this.ce(ce); this.showBy(n, `ZG_修行_光線打合_キャラ_${name}`, 140, 139); }
        s(107, g(129));
        if (g(153) === 0) s(108, g(130));
      }
    }
    if (g(123) !== 0) { s(115, g(115) - g(125)); s(123, g(123) - g(125)); } // エネ左右移動
    const jolt = () => { s(119, rnd(0, 2) * 2); if (rnd(0, 1) === 1) s(119, -g(119)); if (g(132) === 0) s(119, 0); }; // 上下揺れ
    jolt();
    this.ce(81);
    s(119, g(119) + g(116));
    this.showBy(7, 'ZG_修行_光線打合_衝突_黄', 117, 119);
    jolt();
    s(119, g(119) + g(116));
    if (g(153) === 0) { this.showBy(8, 'ZG_修行_光線打合_衝突_青', 118, 119); this.pics[8].mirror = true; }
    if (this.pics[6]) this.pics[6].zx = g(115) * 5;
    if (g(128) === 1) s(115, g(131));
    if (g(132) === 1) { // 火花
      s(154, rnd(1, 10));
      this.ce(90);
      if (g(154) === 1) this.showBy(19, `ZG_修行_光線打合_火花_${rnd(1, 12)}`, 157, 156);
      else this.erase(19);
    }
    s(122, rnd(1, 20)); // 遠景点滅
    if (g(122) === 1) this.show(20, 'ZG_修行_光線打合(点滅)', 0, 0, 0, 2000, 2000);
    else this.erase(20);
    if (g(132) === 0) this.erase(20);
  }
  page2() { // 超カメハメ波 background, three frames
    const k = this.g(152) === 0 ? 1 : this.g(152) === 1 ? 2 : 3;
    this.show(1, `ZG_修行_光線打合_背景_超カメハメ波_左_${k}`, 0, 0, 14);
    this.show(2, `ZG_修行_光線打合_背景_超カメハメ波_右_${k}`, 0, 464, 14);
    this.set(152, this.g(152) + 1);
    if (this.g(152) === 4) this.set(152, 0);
  }
  draw() {
    const cv = this.cv, ui = this.ui;
    const r = ui.el.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const W = Math.round(r.width), H = Math.round(r.height);
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    const k = W / 640, h = 480 * k;
    const y0 = ui.dlg.hidden ? Math.round((H - h) / 2) : Math.max(0, Math.round(ui.dlg.offsetTop - h - 8));
    c.save();
    c.translate(this.shake.x * k, y0);
    c.beginPath(); c.rect(0, 0, W, h); c.clip();
    for (const n of Object.keys(this.pics).map(Number).sort((a, b) => a - b)) {
      const p = this.pics[n], e = img(p.path);
      if (!e.ok || p.op <= 0) continue;
      const w = e.im.width * (p.zx / 100), hh = e.im.height * (p.zy / 100);
      const x = p.o ? p.x - w / 2 : p.x, y = p.o ? p.y - hh / 2 : p.y;
      c.globalAlpha = Math.min(1, p.op / 255);
      c.globalCompositeOperation = p.blend === 1 ? 'lighter' : 'source-over';
      if (p.mirror) { c.save(); c.translate((x + w) * k, y * k); c.scale(-1, 1); c.drawImage(e.im, 0, 0, w * k, hh * k); c.restore(); }
      else c.drawImage(e.im, x * k, y * k, w * k, hh * k);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.restore();
    const st = this.stage;
    if (st && st.flash > 0) { c.fillStyle = `rgba(255,255,255,${st.flash})`; c.fillRect(0, 0, W, H); }
    if (st && st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  }
}
let beam = null;
const film = (stage, ui) => { if (!beam && ui && stage.sprites) { stage.clear(); beam = new Beam(ui, stage); } return beam; };
const vAt = (b, node, k) => (node.byVar ? b.g(node[k]) : node[k]);
addNodes({
  z4fVar: async (node, { ui, stage }) => { const b = film(stage, ui); if (b) b.op(node.p); else if (node.p[0] === 41) G.state.var[41] = node.p[4]; },
  z4fSw: async (node, { ui, stage }) => { const b = film(stage, ui); if (b) for (let i = node.a; i <= node.b; i++) b.sw[i] = node.on; },
  z4fCe: async (node, { ui, stage }) => { const b = film(stage, ui); if (b) b.ce(node.n); },
  z4fPic: async (node, { ui, stage }) => {
    const b = film(stage, ui);
    if (!b) return;
    ui.dlg.hidden = true;
    b.show(node.n, node.name, node.o, vAt(b, node, 'px'), vAt(b, node, 'py'), node.zx, node.zy, node.op, node.blend);
  },
  z4fMove: async (node, { ui, stage, quiet }) => {
    const b = film(stage, ui), p = b && b.pics[node.n];
    if (!p) return;
    p.o = node.o;
    p.mv = { d: node.dur, x: vAt(b, node, 'px'), y: vAt(b, node, 'py'), zx: node.zx, zy: node.zy, op: node.op };
    if (node.wait && !quiet) await ui.wait(node.dur);
  },
  z4fErase: async (node, { ui, stage }) => { const b = film(stage, ui); if (b) b.erase(node.n); },
  z4fMirror: async (node, { ui, stage }) => { const b = film(stage, ui); if (b && b.pics[node.n]) b.pics[node.n].mirror = true; },
  z4fBeamZoom: async (node, { ui, stage }) => { const b = film(stage, ui); if (b && b.pics[6]) b.pics[6].zx = b.g(115) * 5; }, // zoom_x = 変数115 * 5
});
async function playBeam(game) {
  beam = null;
  try { await playScenes([{ nodes: page(game, 'beam') }], game.state); } finally { if (beam) beam.close(); beam = null; }
  game.state.var[41] = 2591;
}

// ---------- the staff roll (z1field 2691: z_ed_rev1, all.rb 23217) ----------
// Two backgrounds swapped every 8 frames; the lines (文字_Z1_スタッフロール, 16 px a letter, '_' a space) rise from the
// bottom 2 px every 3 frames, each once the one before is 16 px up; the last two stop in the middle. At frame 11900 the
// lines fade, then the backgrounds, then 集合絵 and the last line come; a tap after 300 frames ends it.
const FONT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ／1234567890！＆,.@?_・-◆';
async function staffRoll(ui) {
  const c0 = C(G), P0 = c0.pics;
  const font = img(P0['文字_Z1_スタッフロール']), backs = [img(P0['zed/背景1']), img(P0['zed/背景2'])], group = img(P0['集合絵_修正']);
  await Promise.all([font.p, ...backs.map((b) => b.p), group.p]);
  ui.dlg.hidden = true;
  const cv = document.createElement('canvas');
  cv.style.zIndex = '1';
  ui.el.insertBefore(cv, ui.dlg);
  audio.stopBgm();
  audio.playBgm('Z1 エンディング');
  const lines = c0.staff.map((t) => ({ t, y: 480, on: false, op: 255 })), ends = c0.staffEnd.map((t) => ({ t, op: 0 }));
  let f = 0, phase = 0, count = 0, backOp = 255, groupOp = 0, tapped = false;
  const tap = () => { if (phase === 3) tapped = true; };
  const prevTap = ui.onTap;
  ui.onTap = tap;
  const step = () => {
    f++;
    if (phase === 0) {
      if (f % 3 === 0) {
        lines.forEach((l, x) => {
          if (x === 0) { l.on = true; l.y -= 2; return; }
          if (lines[x - 1].y < 480 - 16) {
            l.on = true;
            const stopAt = x === lines.length - 2 ? 216 : x === lines.length - 1 ? 232 : -1e9;
            if (l.y > stopAt) l.y -= 2;
          }
        });
      }
      if (f === 11900) phase = 1;
    } else if (phase === 1) {
      const last = lines[lines.length - 1];
      if (last.op > 0) for (const l of lines) l.op = Math.max(0, l.op - 2);
      else if (backOp > 0) backOp = Math.max(0, backOp - 4);
      else { for (const e of ends) e.op = Math.min(255, e.op + 2); groupOp = Math.min(255, groupOp + 2); }
      if (ends[ends.length - 1].op === 255 && ++count >= 300) phase = 3;
    } else if (phase === 3) { if (tapped) phase = 4; }
    else if (phase === 4) { for (const e of ends) e.op = Math.max(0, e.op - 2); if (ends[ends.length - 1].op === 0) { phase = 5; count = 0; } }
    else if (phase === 5 && ++count >= 180) phase = 6;
  };
  const text = (c, t, y, op, k) => {
    if (op <= 0 || !font.ok) return;
    c.globalAlpha = op / 255;
    [...t].forEach((ch, i) => {
      const g = FONT.indexOf(ch);
      if (g < 0 || ch === '_') return;
      c.drawImage(font.im, 16 * g, 0, 16, 16, 16 * i * k, y * k, 16 * k, 16 * k);
    });
    c.globalAlpha = 1;
  };
  const draw = () => {
    const r = ui.el.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const W = Math.round(r.width), H = Math.round(r.height);
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    const k = W / 640;
    c.save();
    c.translate(0, Math.round((H - 480 * k) / 2));
    c.beginPath(); c.rect(0, 0, 640 * k, 480 * k); c.clip();
    const b = backs[Math.floor(f / 8) % 2];
    if (b.ok && backOp > 0) { c.globalAlpha = backOp / 255; c.drawImage(b.im, 0, 0, 640 * k, 480 * k); c.globalAlpha = 1; }
    for (const l of lines) if (l.on && l.y > -16 && l.y < 480) text(c, l.t, l.y, l.op, k);
    if (group.ok && groupOp > 0) { c.globalAlpha = groupOp / 255; c.drawImage(group.im, 0, 0, 640 * k, 480 * k); c.globalAlpha = 1; }
    for (const e of ends) text(c, e.t, 414, e.op, k);
    c.restore();
  };
  const stepMs = 1000 / 60;
  let last = performance.now(), acc = 0;
  window.__z4fStaff = { get f() { return f; }, get phase() { return phase; }, to(n) { while (f < n && phase === 0) step(); } }; // (testing)
  await new Promise((res) => {
    ui.onSkip.push(res);
    const tick = (t) => {
      if (ui.skipped || phase === 6) { res(); return; }
      acc += Math.min(200, t - last);
      last = t;
      while (acc >= stepMs && phase !== 6) { step(); acc -= stepMs; }
      draw();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  ui.onTap = prevTap;
  delete window.__z4fStaff;
  cv.remove();
  audio.stopBgm();
}

// ---------- the flow ----------
const page = (game, k) => Z3(game).pages[`z4f${k}`];
const playPages = (game, ...keys) => playScenes(keys.map((k) => ({ nodes: page(game, k) })), game.state);

async function start(game) {
  const s = game.state;
  stop(game);
  s.flags.z3 = 'z4f';
  s.flags.z3At = null;
  await card(Z3(game).titles.z4f, 2200);
  s.var[41] = 2991;
  await playPages(game, 2991);
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
  if (r !== 'lose') s.sw[143] = r === 'win'; // 撃破 / ターン数経過
  return r;
}

// the ring (44,35): Mr. Satan first (switch 457), then the Cell Game
let armed = true; // after Mr. Satan the party stands next to the ring: it starts once they have come to it again
async function ring(game) {
  const s = game.state;
  stop(game);
  armed = false;
  if (!s.sw[457]) {
    s.var[41] = 2441;
    await playPages(game, 2441); // (its last scene is 2449: set_battle_event 9, Mr. Satan's kick)
    s.var[41] = 2451;
    await playPages(game, 2451);
    toField(game, C(game).back);
    return;
  }
  s.var[41] = 2461;
  await playPages(game, 2461);
  return s.var[41] === 2464 ? battleAll(game) : battleGoku(game);
}
// 2463: Goku alone, 10 turns (variable 94) → 2471 → 2481 Gohan, 7 turns, the enemy's damage halved (variable 82)
async function battleGoku(game) {
  const s = game.state;
  if (await battle(game, 2463, { turns: 10 }) === 'lose') return; // (lost: main.js loads the save made before it)
  s.var[41] = 2471;
  await playPages(game, 2471);
  return battleGohan(game);
}
async function battleGohan(game) {
  const s = game.state;
  const r = await battle(game, 2481, { turns: 7, foeRate: s.var[82] || 0.5 });
  if (r === 'lose') return;
  s.var[82] = 0;
  s.var[41] = 2491;
  await playPages(game, 2491); // → 2501 No. 16
  s.var[41] = 2501;
  await playScenes([{ nodes: [{ z1field: true }] }], s);
  s.var[41] = 2511;
  await playPages(game, 2511); // → 2531 Gohan's awakening
  s.var[41] = 2531;
  await playScenes([{ nodes: [{ z1field: true }] }], s);
  s.var[41] = 2541;
  await playPages(game, 2541);
  return battleLast(game);
}
// 2561: the perfect Cell and the Cell Jr. → 2571 → map 49 → 2591 → 2602 the end
async function battleLast(game) {
  const s = game.state;
  if (await battle(game, 2561) === 'lose') return;
  s.var[41] = 2571;
  await playPages(game, 2571);
  await playBeam(game);
  return theEnd(game);
}
async function theEnd(game) {
  const s = game.state;
  s.var[41] = 2591;
  await playPages(game, 2591);
  s.var[41] = 2602;
  await playPages(game, 2602);
  stopMe();
  return ending(game);
}
// after the clear: everyone against Cell and the Cell Jr. (2464) → 2621
async function battleAll(game) {
  const s = game.state;
  if (await battle(game, 2464) === 'lose') return;
  s.var[41] = 2621;
  await playPages(game, 2621);
  return ending(game);
}
// the end of Z4: 「Z4 完」, then the title screen with what the original opens next (ZG 待續)
async function ending(game) {
  const c = C(game), s = game.state;
  s.flags.z3 = 'done';
  s.flags.z3At = null;
  for (const m of s.party) heal(m);
  game.save(true);
  game.busy = false;
  await card(c.end, 2400);
  game.showTitle(c.end, c.unlocks);
}

// カード特殊 (38,29): the card square of variable 44 = 40
async function card40(game, poi) {
  const s = game.state;
  spotTally(s, { effect: 'shop' });
  game.field.spent = poi; // once per stop, like the other card squares
  s.var[44] = 40;
  await cardSquare(game);
  s.var[44] = 0;
  game.save(true);
  toast('已存檔');
}

function spot(game, poi) {
  G = game;
  if (poi.kind === 'card40') return card40(game, poi);
  return null;
}
function boss(game, b) {
  if (game.busy || !b || b.key !== 'ring' || !armed) return null;
  G = game;
  return ring(game);
}
// the ring again once the party has moved off it
setInterval(() => {
  const game = G || window.__game, s = game && game.state;
  if (armed || !s || s.map !== '48') return;
  if (Math.hypot(s.x - (44 * 32 + 16), s.y - (35 * 32 + 16)) > 48) armed = true;
}, 250);
// a save made right before a story battle
const AT = { 2463: battleGoku, 2464: battleAll, 2481: battleGohan, 2561: battleLast };
function resume(game, at) {
  G = game;
  const f = AT[at && at.at];
  if (f) f(game);
  else toField(game);
}
function goal(world, s) { return s.map === '48' ? Z3({ world }).goals['48'] : ''; }

// ---------- development: index.html?dev=z4f / z4fring / z4fcell / z4fgohan / z4f16 / z4fawake / z4flast / z4fbeam /
// z4fend / z4fstaff / z4fall (&timer in a hidden pane) ----------
// a plausible state at the hand-over from the fifth chapter (variable 41 = 2991)
function dev(game, step) {
  if (!/^z4f(ring|cell|gohan|16|awake|last|beam|end|staff|all)?$/.test(step)) return false;
  devState(game, step);
  return true;
}
async function devState(game, step) {
  const w = game.world, s = game.newState();
  game.state = s;
  G = game;
  s.bench = {};
  const lv = { 3: 62, 4: 58, 5: 58, 6: 52, 7: 50, 8: 53, 9: 48, 10: 45, 12: 62, 17: 60, 24: 46, 21: 52, 23: 56 };
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
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, z3: 'z4f' });
  s.var[40] = 2;
  s.var[43] = 94;
  s.var[41] = 2991;
  s.cardiMax = 10;
  s.sw[381] = true;
  s.zeni = 30000;
  s.party = [];
  setParty(s, [3, 4, 5, 6, 7, 8, 9, 12, 17]);
  moveTo(s, C(game).start);
  await applyEra(game);
  s.hand = newHand(w);
  game.startField();
  if (step === 'z4f') return start(game);
  Object.assign(s.var, { 43: 95, 41: 2431 });
  s.sw[483] = true;
  if (step === 'z4fring') return toField(game, C(game).start);
  s.sw[457] = true; // Mr. Satan has had his go
  s.var[43] = 96;
  s.var[41] = 2451;
  if (step === 'z4fall') s.sw[458] = true; // cleared once (時之間 in the original)
  if (step === 'z4fcell' || step === 'z4fall') { armed = false; return toField(game, C(game).back); }
  stop(game);
  // after 2461: the party kept (CE166 / $tmp_partyc2), Goku has fought
  s.flags.z4fTmp = snapshot();
  s.flags.z4fKeep = snapshot();
  s.sw[143] = false;
  if (step === 'z4fgohan') { s.var[41] = 2471; await playPages(game, 2471); return battleGohan(game); }
  restore(s.flags.z4fTmp);
  leave(game, 3);
  superSaiyan(w, s, 2, true);
  if (step === 'z4f16') {
    party(game, [18]);
    s.var[41] = 2491;
    await playPages(game, 2491);
    s.var[41] = 2501;
    await playScenes([{ nodes: [{ z1field: true }] }], s);
    s.var[41] = 2511;
    await playPages(game, 2511);
    s.var[41] = 2531;
    await playScenes([{ nodes: [{ z1field: true }] }], s);
    s.var[41] = 2541;
    await playPages(game, 2541);
    return battleLast(game);
  }
  if (step === 'z4fawake') { s.var[41] = 2511; await playPages(game, 2511); s.var[41] = 2531; await playScenes([{ nodes: [{ z1field: true }] }], s); s.var[41] = 2541; await playPages(game, 2541); return battleLast(game); }
  if (step === 'z4flast') { s.var[41] = 2541; await playPages(game, 2541); return battleLast(game); }
  // after the last battle: Gohan a Super Saiyan 2 at the front, the nine
  ss5(true);
  leave(game, 5);
  party(game, [5, 4, 6, 7, 8, 9, 12, 17, 10]);
  if (step === 'z4fbeam') { s.var[41] = 2571; await playPages(game, 2571); await playBeam(game); return theEnd(game); }
  if (step === 'z4fend') return theEnd(game);
  s.var[41] = 2602; // z4fstaff
  await playPages(game, 2602);
  return ending(game);
}

registerZ3('z4f', { maps: MAPS, start, spot, boss, resume, dev, goal });

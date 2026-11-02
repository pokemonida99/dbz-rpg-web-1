// 絕望的反抗（Map007 事件 12，頁 3500～）＋另一個結局（事件 13，頁 3801～）：Z4 時之間的門 9781／9791，地圖 55 — docs/tr-future.md
// (plan: docs/zg-plan.md); the data is built by tools/build_tr_future.py (world.trFuture, world.z3.pages['trfuture:…']).
// The doors register with registerArea (src/timeroom.js); each story is a chapter of src/z3.js (registerZ3) started with
// startTrStory and ended with endTrStory.
//   9781 (switch 458): page 3500 (是 / 否) → trfuture: 3501 (CE166: the party aside, 未来悟飯 alone) → 3521 → 3571 → map 55
//     (14,40); 17号 and 18号 at (56-57,6) → 3621 → battle 3631 (4 turns; losing goes on too) → 3641 → the film of
//     set_battle_event 14 → 3661 → 3681 (switch 569) → CE167, 9782: back to the hall (38,3)
//   9791 (switch 569): trtrunks: 3801 (Trunks alone) → 3821 → film 15 → 3841 → film 16 → 3861 (switch 570: the ZG hall)
//     → CE167, 9792: back to the hall (43,3)
import { audio, img, loadImages } from './core.js?v=20261102-2225';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261102-2225';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261102-2225';
import { addMoves, ANIME_IMAGES } from './anime.js?v=20261102-2225';
import { superSaiyan, syncSuperSaiyan, FORMS } from './supersaiyan.js?v=20261102-2225';
import { eventCard } from './items.js?v=20261102-2225';
import { applyEra } from './era.js?v=20261102-2225';
import { duelFilm, screenPic } from './z3c.js?v=20261102-2225';
import { registerZ3, Z3, begin, fight, toField, party, moveTo } from './z3.js?v=20261102-2225';
import { registerArea, startTrStory, endTrStory, goTo, healAll } from './timeroom.js?v=20261102-2225';

const T = (game) => game.world.trFuture;
let G = null; // the game, for the scenes and page commands below (set whenever these stories take over)
function stop(game) { G = game; begin(game); }

// the battle films of 未来悟飯's moves (CE9) and Trunks' ヒートドームアタック / フィニッシュバスター (CE61): the closest
// of the earlier films
addMoves({
  236: 'gohanMakouhou', 237: 'masenko', 238: 'nappaBlast', 240: 'makankosappo', 241: 'kamehameha', 242: 'zanzouken',
  178: 'galickGun', 181: 'energyWave',
});

// ---------- the scenes (z1field 3501-3694, 3801-3862: all.rb 178609-179320) ----------
// Z3 scenes: 512×128 pictures over the scroll window, faces at @ene1_x ± n (288,78), the party's under the scene
// (@play_x 288, @play_y + 64 a second row). The phone shows the middle ~224 px, so wider rows are drawn closer.
const pic = (n) => `Graphics/Pictures/${n}`;
const P3 = pic('Z3_顔味方.PNG'), E3 = pic('Z3_顔イベント.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
const ZG = pic('ZG_顔味方.PNG'), LONG = pic('Z3_顔味方_トランクス長髪.PNG'), KIT = pic('Z3_顔味方_衣替え.png');
const BG = { 家: pic('ZG_背景_ゴクウの家.PNG'), 街: pic('Z3_背景_街.png'), 草原: pic('Z3_背景_草原.png'), ブルマ: pic('ZG_背景_ブルマの家.PNG') };
const TIME_MACHINE = pic('Z3_背景_タイムマシンp2.png');
const FIT = 224; // art px of the scene a phone shows for sure

const wide = (st, bg) => st.add(bg, SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
const face = (st, sheet, row, dx = 0, dy = 0, col = 0) => st.add(sheet, ENE[0] + dx, ENE[1] + dy, [64 * col, 64 * row, 64, 64]);
// a row of faces in the scene ([sheet, row, dx, col]): as the original places them, closer (and smaller) when wider
function group(st, list) {
  const xs = list.map((f) => f[2]), lo = Math.min(...xs), hi = Math.max(...xs);
  if (hi - lo + 64 <= FIT) { for (const [sheet, row, dx, col = 0] of list) face(st, sheet, row, dx, 0, col); return; }
  const size = Math.min(64, Math.floor(FIT / list.length)), k = (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
  for (const [sheet, row, dx, col = 0] of list) {
    st.add(sheet, ENE[0] + 32 - size / 2 + (dx - mid) * k, ENE[1] + 32 - size / 2, [64 * col, 64 * row, 64, 64], false, 0, [size, size]);
  }
}
const under = (st, sheet, row, dx = 0, line = 0, col = 0) => st.add(sheet, PLAY_X + dx, 0, [64 * col, 64 * row, 64, 64], true, line);
const pair = (st, d17 = 32, d18 = -32) => { face(st, F3, 25, d17); face(st, F3, 24, d18); }; // 17号 18号
// set_character_face for Trunks (all.rb 19758): his clothes (variable 173: 1 the battle suit, 2 the tank top)
function trunksFace(s, id) {
  const v = (s.var || {})[173] || 0, sup = id === 20;
  if (v === 1) return sup ? [ZG, 17] : [LONG, 1];
  if (v === 2) return sup ? [KIT, 14] : [KIT, 13];
  return [P3, id - 3];
}
const faceOf = (s, id) => (id === 17 || id === 20 ? trunksFace(s, id) : [P3, id - 3]);
// character_output (dying 0, adjust_x, adjust_y): the party's faces under the scene, or (adjust_y −228) in it
function out(st, ctx) {
  const ids = ctx.partyc;
  ids.forEach((id, k) => under(st, ...faceOf(ctx.s, id), -32 * (ids.length - 1) + 64 * k));
}
const inScene = (ctx, dx) => ctx.partyc.map((id) => [...faceOf(ctx.s, id), dx]);

const D = {
  3501: (st) => under(st, P3, 2), // 悟飯自宅へ向かう
  3502: (st) => group(st, [[P3, 9, -256], [P3, 1, -192], [P3, 6, -128], [P3, 5, -64], [P3, 3, 0], [P3, 4, 64], [CARD, 23, 128, 2],
    [E3, 16, 192], [CARD, 8, 256, 2]]), // ベジータ ピッコロ チャオズ 天津飯 クリリン ヤムチャ ヤジロベー トランクス(赤ちゃん) ブルマ
  3503: (st) => { under(st, P3, 2); face(st, CARD, 11, -32, 0, 2); face(st, CARD, 20, 32, 0, 2); }, // プーアル ウーロン
  3504: (st) => { wide(st, BG.家); face(st, E3, 17); face(st, CARD, 35, -64, 0, 2); face(st, CARD, 9, 64, 0, 2); under(st, P3, 2); }, // チチ 牛魔王 亀仙人
  3505: (st) => { wide(st, BG.家); face(st, E3, 24); under(st, P3, 2); }, // 悟空死亡
  3512: (st) => pair(st),
  3521: (st) => { pair(st, -32, 32); under(st, E3, 0); under(st, E3, 4, 64); under(st, E3, 12, -64); }, // 男 女 老人
  3531: (st) => { st.faceSize = 48; under(st, CARD, 11, -32, 0, 2); under(st, CARD, 20, -96, 0, 2); under(st, CARD, 9, 32, 0, 2); under(st, CARD, 49, 96, 0, 2); }, // ウミガメ
  3541: (st) => { face(st, E3, 26); under(st, E3, 29); }, // ブルマ トランクス
  3542: (st) => face(st, E3, 26),
  3543: (st) => { wide(st, BG.街); pair(st); },
  3544: (st) => pair(st),
  3551: (st) => under(st, E3, 29),
  3552: (st) => { under(st, E3, 29); face(st, E3, 30); }, // 悟飯
  3553: (st) => { under(st, E3, 29, -32); under(st, E3, 30, 32); face(st, E3, 26); },
  3554: (st) => { under(st, E3, 29, -32); under(st, E3, 30, 32); face(st, E3, 26, 0, -64); face(st, CARD, 74, 0, 0, 2); }, // ごちそう
  3555: (st) => { under(st, E3, 29, -32); under(st, E3, 30, 32); face(st, E3, 26, 0, -64); },
  3561: (st) => { under(st, E3, 29); face(st, E3, 30); },
  3562: (st) => { under(st, E3, 28); face(st, E3, 27); }, // 牛魔王 チチ
  3571: (st) => { under(st, E3, 29, 32); under(st, E3, 30, -32); },
  3572: (st) => { under(st, E3, 29, 32); under(st, E3, 30, -32); pair(st, -32, 32); },
  3573: (st) => { under(st, E3, 30); pair(st, -32, 32); },
  3574: (st) => { under(st, E3, 30); face(st, F3, 25); },
  3575: (st) => { under(st, E3, 31); face(st, F3, 25); }, // 超悟飯
  3576: (st) => { under(st, E3, 31); face(st, F3, 25, 0, -64); face(st, F3, 24); }, // 18号援護
  3577: (st) => under(st, E3, 29),
  3578: (st) => { under(st, E3, 29); face(st, F3, 24); },
  3579: (st) => { under(st, E3, 29); face(st, F3, 24, 0, 0, 1); }, // 18号ダメージ
  3580: (st) => { under(st, E3, 29); face(st, F3, 24); },
  3581: (st) => { under(st, E3, 31); under(st, E3, 29, 0, 1); face(st, F3, 24); },
  3582: (st) => { under(st, E3, 31); under(st, E3, 29, 0, 1); pair(st, -32, 32); },
  3583: (st) => pair(st, -32, 32),
  3591: (st) => under(st, P3, 22, 0, 0, 1), // 悟飯瀕死
  3592: (st) => { under(st, P3, 22, 0, 0, 1); face(st, CARD, 15, 0, 0, 2); }, // 仙豆
  3593: (st) => { under(st, P3, 22, 0, 0, 1); face(st, E3, 29, -32); face(st, CARD, 15, 32, 0, 2); },
  3594: (st) => { under(st, P3, 22, 0, 0, 1); face(st, E3, 29); },
  3601: (st) => face(st, E3, 26), // ブルマ作業
  3602: (st) => { face(st, E3, 26); under(st, E3, 29); under(st, P3, 22, 0, 1, 1); },
  3603: (st) => { face(st, E3, 26); under(st, E3, 29); },
  3604: (st) => { face(st, P3, 22, 0, 0, 1); under(st, E3, 29); },
  3605: (st) => { face(st, P3, 22); under(st, E3, 29); },
  3606: (st) => face(st, P3, 22),
  3621: (st) => pair(st, -32, 32),
  3622: (st) => { under(st, P3, 22); pair(st, -32, 32); },
  3641: (st) => { under(st, P3, 23, 0, 0, 1); pair(st, -32, 32); }, // 超悟飯
  3651: (st, ctx, q) => film(st, '3651', q), // set_battle_event 14: 未来悟飯と人造人間
  3661: (st) => under(st, E3, 29),
  3662: (st) => { under(st, E3, 29); face(st, E3, 25); }, // 悟飯の遺体
  3663: () => {}, // (トランクス超サイヤ人変身: the original has no picture for it)
  3671: (st) => { under(st, P3, 14); face(st, E3, 26); }, // 3年後
  3672: (st) => face(st, E3, 26),
  3673: (st) => under(st, P3, 14),
  3674: (st) => under(st, P3, 17), // 超トランクス
  3675: (st) => pair(st),
  3676: (st) => { under(st, P3, 17); pair(st); },
  3677: (st) => under(st, P3, 17),
  3681: (st) => under(st, P3, 17),
  3682: (st) => { under(st, P3, 17); pair(st); },
  3683: (st) => { under(st, P3, 14, 0, 0, 1); pair(st); },
  3691: (st) => { under(st, E3, 26); face(st, P3, 14); },
  3692: (st) => { wide(st, BG.草原); timeMachine(st); under(st, E3, 26); face(st, P3, 14); }, // タイムマシン発進
  3693: (st) => { wide(st, BG.草原); timeMachine(st); under(st, E3, 26); },
  3694: (st) => { wide(st, BG.草原); under(st, E3, 26); },
  // 未来トランクス編
  3801: (st) => { wide(st, BG.街); pair(st); },
  3802: (st) => wide(st, BG.草原),
  3803: (st) => { wide(st, BG.草原); timeMachine(st); },
  3804: (st, ctx) => { face(st, E3, 26); out(st, ctx); },
  3807: (st) => { wide(st, BG.街); pair(st, 64, -64); },
  3808: (st, ctx) => { wide(st, BG.街); pair(st, 64, -64); out(st, ctx); },
  3809: (st, ctx) => { wide(st, BG.街); group(st, [[F3, 25, 64], [F3, 24, -64], ...inScene(ctx, -128)]); }, // 18号の横へ
  3810: (st, ctx) => { wide(st, BG.街); group(st, [[F3, 25, 64], ...inScene(ctx, -128)]); }, // 18号破壊
  3811: (st, ctx) => { wide(st, BG.街); group(st, [[F3, 25, 64, 1], ...inScene(ctx, -128)]); }, // 17号ダメージ
  3812: (st, ctx) => { wide(st, BG.街); group(st, [[F3, 25, 64, 1], ...inScene(ctx, 0)]); },
  3813: (st, ctx) => { wide(st, BG.街); group(st, inScene(ctx, 0)); },
  3821: (st, ctx) => { wide(st, BG.ブルマ); face(st, E3, 57); out(st, ctx); }, // ブルマ(未来編1718号撃破後)
  3822: (st, ctx) => { wide(st, BG.ブルマ); out(st, ctx); },
  3823: (st, ctx) => { wide(st, BG.ブルマ); face(st, F3, 27); out(st, ctx); }, // セル
  3825: (st) => wide(st, BG.ブルマ),
  3826: (st, ctx) => { wide(st, BG.草原); face(st, F3, 27); out(st, ctx); },
  3831: (st, ctx, q) => film(st, '3831', q), // set_battle_event 15: 未来トランクスとセル
  3851: (st, ctx, q) => film(st, '3851', q), // set_battle_event 16: ヒートドームアタック
  3861: (st, ctx) => { wide(st, BG.草原); out(st, ctx); },
};
for (const n of [3506, 3507, 3508, 3509, 3510, 3511]) { // ピッコロ ベジータ ヤムチャ 天津飯 チャオズ クリリン死亡
  const row = { 3506: 1, 3507: 9, 3508: 4, 3509: 5, 3510: 6, 3511: 3 }[n];
  D[n] = (st) => { pair(st); under(st, P3, row, 0, 0, 1); };
}
D[3805] = D[3806] = D[3804];
D[3814] = D[3813];
D[3824] = D[3822];
D[3827] = D[3828] = D[3841] = D[3842] = D[3826];
D[3862] = D[3861];
function timeMachine(st) { st.add(TIME_MACHINE, ENE[0] - 20, SCENE_Y + 10, [0, 0, 128, 128]); } // (@ene1_x − 20, @z1_sceney + 10)
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), [3631], [P3, E3, F3, CARD, ZG, LONG, KIT, TIME_MACHINE, ...Object.values(BG)]);

// set_battle_event 14 / 15 / 16 (all.rb 52803): who attacks whom, in $attack_order; the damage is not shown or dealt
// ($game_variables[96] != 0). The battle suit's Trunks (variable 173 = 1) in 15 / 16: ZG_戦闘_トランクス(超).
async function film(st, key, quiet) {
  if (quiet || !G) return;
  const w = G.world, f = T(G).films[key], bd = T(G).filmBackdrop;
  const pty = { normal: f.sheets[0], special: f.sheets[1] };
  const foes = f.foes.map((id) => ({ normal: w.enemies[id].portrait, special: w.enemies[id].sprite, size: w.enemies[id].size }));
  await loadImages([pty.normal, pty.special, ...foes.flatMap((x) => [x.normal, x.special]), bd, ...ANIME_IMAGES]);
  await duelFilm(st.ui, f.acts.map(([p, k, skill]) => ({ party: pty, foe: foes[k], ray: w.actors[f.party].ray, p, skill, hit: true })), bd);
}

// CE49 / 51 / 53 / 55 → CE45 (as src/z3c.js transformFilm): the back, three auras, the two bodies (before / after);
// 90 frames, the sound and a 264-frame quake, the aura cycling every 4 frames ×10, the bodies flickering every 8
// frames (×5) and every 4 (×7), the aura ×20
async function transformFilm(st, ui, ce) {
  const t = T(G).transform[ce], back = T(G).ssBack;
  await loadImages([back, ...t.auras, ...t.bodies]);
  ui.dlg.hidden = true;
  st.clear();
  screenPic(st, back, 0, 128, [0, 0, 640, 224]);
  const size = (p) => { const e = img(p); return [0, 0, e.ok ? e.im.width : 286, 224]; };
  const A = t.auras.map((p) => screenPic(st, p, 178, 128, size(p), 0));
  const B = t.bodies.map((p, k) => screenPic(st, p, t.x, 128, size(p), k ? 0 : 255));
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

// ---------- the pages' own commands (tools/build_tr_future.py) ----------
const refresh = (ctx) => { ctx.partyc = G.state.party.map((m) => m.id); };
addNodes({
  // $partyc = [...]: the real party, except the films' line-ups ([26, 26], [20, 20, 20, 20, 20]: who the scenes show only)
  trfParty: async (node, { ctx }) => {
    if (!G || new Set(node.ids).size < node.ids.length) { ctx.partyc = node.ids; return; }
    party(G, node.ids);
    G.state.var[42] = G.state.party[0].id;
    refresh(ctx);
  },
  trfSs: async (node, { ctx }) => { if (G) { superSaiyan(G.world, G.state, node.no, node.on); refresh(ctx); } }, // on / off_super_saiyazin
  trfTransform: async (node, { stage, ui, quiet }) => { if (!quiet && G) await transformFilm(stage, ui, String(node.ce)); },
  // CE230 未来悟飯技熟練度調整: cha_tec_puls, once (switch 450)
  trfUses: async (node, { s }) => {
    if (!G || s.sw[450]) return;
    s.skillLv = s.skillLv || {};
    for (const [id, n] of Object.entries(T(G).uses)) s.skillLv[id] = Math.min(99999, (s.skillLv[id] || 0) + n);
    s.sw[450] = true;
  },
  trfVarVar: async (node, { s }) => { s.var[node.to] = s.var[node.from] || 0; }, // $game_variables[a] = $game_variables[b]
  trfSeStop: async () => audio.seStop(),
  // 223 change the screen tone: to white over `frames` (the 超サイヤ人 flash) / back to normal; wait = until it is done
  trfTone: async (node, { stage, ui, quiet }) => {
    const to = node.white ? 1 : 0;
    if (quiet) { stage.flash = to; return; }
    const from = stage.flash || 0, n = Math.max(1, node.frames);
    const run = (async () => {
      for (let k = 1; k <= n && !ui.skipped; k++) { stage.flash = from + ((to - from) * k) / n; await ui.wait(1); }
      stage.flash = to;
    })();
    if (node.wait) await run;
  },
});

// ---------- the party kept aside (CE166 / CE167) ----------
const noForms = () => Object.fromEntries(Object.keys(FORMS).map((no) => [no, false]));
// CE166: the 時之間 party and its Super Saiyan forms (state.flags.trf), everyone back to normal for the story
function keep(game) {
  const s = game.state;
  if (s.flags.trf) return;
  const ss = { ...(s.ss || {}) };
  syncSuperSaiyan(game.world, s, noForms());
  s.flags.trf = { ids: s.party.map((m) => m.id), ss };
}
// CE167 + 9782 / 9792: the party back as it was, CE182 (the area cards), variable 43 = 999, back to the hall
async function finish(game, back) {
  const s = game.state, k = s.flags.trf;
  stop(game);
  syncSuperSaiyan(game.world, s, noForms());
  if (k) { party(game, k.ids); syncSuperSaiyan(game.world, s, { ...noForms(), ...k.ss }); }
  for (const m of s.party) m.ko = false;
  healAll(game);
  s.var[42] = s.party[0].id;
  eventCard(s, 37, -99);
  eventCard(s, 124, -99);
  s.var[43] = 999;
  s.var[41] = 0;
  s.sw[19] = false;
  delete s.flags.trf;
  await applyEra(game);
  endTrStory(game, back);
}
// reset_battle_flag and chk_set_event_no after a battle or a film (switches 17, 18, 25-29, 121, 128-130, 135; variables 81,
// 82, 94-96)
function resetBattle(s) {
  for (const k of [17, 18, 25, 26, 27, 28, 29, 121, 128, 129, 130, 135]) s.sw[k] = false;
  for (const k of [81, 82, 94, 95, 96, 239]) s.var[k] = 0;
}

// ---------- the flow ----------
const page = (game, v) => Z3(game).pages[`trfuture:${v}`];
const playPages = (game, ...vs) => playScenes(vs.map((v) => ({ nodes: page(game, v) })), game.state);

// door 9781: page 3500 「在通关之前无法回到时之间　要移动吗？」 (否: back one square down)
async function door1(game, poi) {
  const s = game.state;
  stop(game);
  s.var[41] = 3500;
  await playPages(game, 3500);
  if (s.var[41] !== 3501) { s.var[41] = 0; return goTo(game, { map: s.map, x: poi.x, y: poi.y + 1 }); }
  return story(game, 'trfuture');
}
// door 9791: variable 41 = 3801 straight away
const door2 = (game) => story(game, 'trtrunks');
// startTrStory starts the chapter without waiting for it; the door waits (src/main.js frees the field once the door is done)
let running = null;
async function story(game, key) {
  running = null;
  if (startTrStory(game, key)) await running;
}
registerArea(9781, door1);
registerArea(9791, door2);

// 3501 (CE166, party [25]) → 3521 → 3571 → map 55 (14,40)
async function startFuture(game) {
  const s = game.state;
  stop(game);
  keep(game);
  s.var[41] = 3501;
  await playPages(game, 3501, 3521, 3571);
  s.var[41] = 3621;
  toField(game, T(game).start);
}
// map 55 (56-57, 5-6): 3621 → battle 3631
function boss(game, b) {
  if (game.busy || !b || b.key !== '3621') return null;
  return androids(game);
}
async function androids(game) {
  stop(game);
  game.state.var[41] = 3621;
  await playScenes([{ nodes: page(game, 3621)[0] }], game.state);
  return battle(game);
}
// battle_process 3631: 17号 and 18号, variable 94 = 4 (after 4 turns it ends), variable 239 = 3641 (a loss goes on to
// 3641 as well: no game over); the result switches 142 (lost) / 143 (beaten) / 144 (turns) pick 3641's lines
async function battle(game) {
  const s = game.state;
  const r = await fight(game, 3631, '3631', { turns: 4, loseOk: true, backdrop: T(game).backdrop });
  G = game;
  s.sw[142] = r === 'lose'; s.sw[143] = r === 'win'; s.sw[144] = r === 'break';
  resetBattle(s);
  s.var[41] = 3641;
  await playScenes([{ nodes: page(game, 3621)[1] }, ...[3641, 3661, 3681].map((v) => ({ nodes: page(game, v) }))], s);
  resetBattle(s);
  return finish(game, T(game).back1);
}

// 3801 (CE62, CE166, party [17], CE213) → 3821 (CE212) → film 15 → 3841 → film 16 → 3861 (switch 570, CE210, CE61)
async function startTrunks(game) {
  const s = game.state;
  stop(game);
  keep(game);
  s.var[41] = 3801;
  await playPages(game, 3801, 3821, 3841, 3861);
  resetBattle(s);
  return finish(game, T(game).back2);
}

function resume(game, at) {
  G = game;
  if (at && at.at === '3631') { begin(game); return battle(game); }
  return toField(game);
}
const goal = (world, s) => (s.map === '55' ? world.trFuture.text.goal : '');

// ---------- development: ?dev=trfuture (the hall, door 9781) / trfuturefield (map 55 by 17号 and 18号) / trfutureend
// (after the battle: 3641 on) / trfuture2 (door 9791); a Z4-end state in the Z4 hall (map 85), as src/tr_z4.js makes ----------
function devState(game) {
  const s = game.state = game.newState();
  s.var[40] = 2;
  for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568, 470]) s.sw[n] = true;
  s.flags.z3 = 'done';
  party(game, [3, 5, 4, 12, 17, 6]);
  s.flags.tr = { back: { map: '48', x: 44 * 32 + 16, y: 29 * 32 + 16 }, v43: 0, v17: 2, party: s.party.map((m) => m.id), ss: {} };
  Object.assign(s.var, { 43: 999, 17: 2, 23: 2 });
  Object.assign(s.sw, { 78: true, 466: true, 473: true });
  return s;
}
function dev(game, step) {
  if (!/^trfuture(field|end|2)?$/.test(step)) return false;
  const s = devState(game);
  G = game;
  (async () => {
    await applyEra(game);
    if (step === 'trfuture2') Object.assign(s.sw, { 569: true, 459: true }); // (459: Z4's last page, 2461)
    moveTo(s, step === 'trfuture2' ? { map: '85', x: 43, y: 3 } : T(game).back1);
    game.startField();
    if (step === 'trfuture') { begin(game); return door1(game, { x: 38, y: 2 }); } // (as src/timeroom.js runs a door)
    if (step === 'trfuture2') { begin(game); return door2(game); }
    // the story under way (3501-3571 played): 未来悟飯 alone on map 55
    stop(game);
    s.flags.trStory = { main: s.flags.z3 };
    s.flags.z3 = 'trfuture';
    keep(game);
    party(game, [25]);
    Object.assign(s.var, { 42: 25, 43: 111, 41: 3621 });
    s.sw[19] = true;
    if (step === 'trfuturefield') return toField(game, { map: '55', x: 54, y: 9 });
    superSaiyan(game.world, s, 6, true);
    s.sw[143] = true;
    s.var[41] = 3641;
    await playPages(game, 3641, 3661, 3681);
    return finish(game, T(game).back1);
  })();
  return true;
}
registerZ3('trfuture', { maps: ['55'], start: (game) => (running = startFuture(game)), boss, resume, dev, goal });
registerZ3('trtrunks', { start: (game) => (running = startTrunks(game)) });

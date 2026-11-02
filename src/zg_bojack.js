// 銀河危機（事件 24，頁 5500～5650，地圖 97～99）＋帕伊庫漢（事件 28）＋布歐（事件 29）＋鬥技場（事件 19）：ZG 時之間的門 9911／9941／9951、大廳的鬥技場 — docs/zg-plan.md; the data is built by tools/build_zg_bojack.py.
// Its doors register with registerArea (src/timeroom.js); the story is a chapter of src/z3.js (registerZ3) started
// with startTrStory and ended with endTrStory. docs/zg-bojack.md has the whole flow with the original's sources.
//   9911 銀河ギリギリ!!ぶっちぎりの凄い奴 (zgbojack): 5500 the door → 5501 → map 97 (7,33); Bujin & Gokua 5511 → 5516 →
//        5521, Zangya & Bido (map 98) 5531 → 5536 → 5541, both → 5551 → map 99 (46,20); Bojack 5571 → 5576 → 5581 → 5591
//        → 5601 → 9912 (the 時之間 party back, map 96 (8,3)). Switch 590 is on while the story is under way: left half
//        way (map 97 (7,34), map 99 (47,20)), the door goes straight back to the story party on map 97, or map 99 once
//        both pairs are beaten; after the end it is off again and the door plays the story from the start.
//   9941 帕伊庫漢 (zgpaikuhan): 7101 → 7111 → battle 7116 → 7121 → 9942;  9951 布歐 (zgbuu): 7201 → 7211 → 7216 → 7221 → 9952
//   闘技場 (map 58 (22,5), 'arena'): 90001 → Scene_Db_Battle_arena (the rank list) → 90011-90031 three rounds (90012 …:
//        battle_arena_ene_set) → 90041 (CE191 prizes, the new ranks) / 90051 (lost); rank 69 Arale, 70-91 覚醒 bosses.
import { audio, say, choose, toast } from './core.js?v=20261102-2217';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261102-2217';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X, say as sceneSay } from './opening.js?v=20261102-2217';
import { addMoves } from './anime.js?v=20261102-2217';
import { syncSuperSaiyan, superSaiyan, FORMS } from './supersaiyan.js?v=20261102-2217';
import { eventCard, cardState } from './items.js?v=20261102-2217';
import { cardSquare } from './cardgames.js?v=20261102-2217';
import { spotTally } from './fieldmenu.js?v=20261102-2217';
import { registerZ3, Z3, begin, play, fight, toField, party, member, heal } from './z3.js?v=20261102-2217';
import { registerArea, startTrStory, endTrStory, goTo, healAll } from './timeroom.js?v=20261102-2217';
import { applyLevel } from './party.js?v=20261102-2217';

const C = (game) => game.world.zgBojack;
const MAPS = ['97', '98', '99'];
let G = null; // the game, for the scenes and page commands below
function stop(game) { G = game; begin(game); }
const here = (s) => ({ map: s.map, x: Math.floor(s.x / 32), y: Math.floor(s.y / 32) });

// the battle films of the new enemies' moves (src/anime.js): the closest of the earlier films, as the Z4 chapters do
addMoves({
  487: 'foeWave', 488: 'raditzWave', 489: 'raditzBigWave', // 波傑克 (グランドスマッシャー)
  492: 'foeWave', 493: 'raditzWave', 494: 'raditzBigWave', 495: 'nappaBlast', 496: 'raditzBigWave', // 波傑克(全力) (ギャラテクタイラント, ギャラティックバスター)
  497: 'foeWave', 498: 'raditzWave', 499: 'raditzBigWave', 500: 'swordAttack', 501: 'pierce', // 哥高亞
  502: 'foeWave', 503: 'raditzWave', 504: 'raditzBigWave', 505: 'raditzBigWave', 506: 'foeWave', // 贊佳 (スカイザッパー, 超能力)
  508: 'foeWave', 509: 'raditzWave', 510: 'raditzBigWave', 511: 'foeWave', 512: 'nappaBlast', // 比度
  514: 'foeWave', 515: 'raditzWave', 516: 'raditzBigWave', 517: 'foeWave', 518: 'nappaBlast', // 布欽 (合体超能力)
  671: 'foeWave', 672: 'raditzWave', 676: 'raditzBigWave', 673: 'pierce', 675: 'nappaBlast', // 排骨飯 (超体当たり, サンダーフラッシュ)
  677: 'foeWave', 678: 'raditzWave', 683: 'raditzBigWave', 679: 'raditzBigWave', 680: 'pierce', 681: 'raditzWave', 682: 'nappaBlast', // 布歐
  535: 'foeWave', 536: 'pierce', 537: 'foeWave', 538: 'pierce', 539: 'raditzBigWave', 540: 'pierce', // 阿拉蕾
});

// ---------- the scenes (z1field 5501-5602, 7111-7222, 90001-90921) ----------
// Z3 scenes: 512×128 pictures over the scroll window, faces at @ene1_x ± n (288,78), the party's under the scene.
const pic = (n) => `Graphics/Pictures/${n}`;
const P3 = pic('Z3_顔味方.PNG'), E3 = pic('Z3_顔イベント.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
const KAIO_BG = pic('Z3_背景_界王星.PNG');
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
// faces under the scene: three a row; more and they get smaller (up to seven a row for the 27 of mode 30)
function row(st, ids) {
  const n = ids.length, per = n > 15 ? 7 : n > 8 ? 5 : n > 6 ? 4 : 3;
  st.faceSize = n > 15 ? 32 : n > 8 ? 40 : n > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, n - per * line), j = k % per;
    under(st, P3, id - 3, -32 * (m - 1) + 64 * j, line);
  });
}
// character_output_all 0,0,0,mode (all.rb 167997): the party members of that mode's cast, then the rest of the cast in
// the original's order (a Super Saiyan form when the party has it)
const CAST = {
  22: [4, 5, 18, 12, 19, 17, 20, 6, 7, 8, 9, 10, 24], // ボージャック編 全員集合
  30: [3, 14, 4, 5, 18, 12, 19, 17, 20, 25, 26, 6, 7, 8, 9, 16, 32, 27, 28, 29, 30, 10, 24, 15, 21, 22, 23], // パイクーハン、ブウ
};
const ORDER = [[3, 14], [4], [5, 18], [6], [7], [8], [9], [10], [24], [12, 19], [17, 20], [25, 26], [16, 32], [27], [28], [29], [30], [15], [21], [22], [23]];
function outAll(st, ctx, mode) {
  const cast = CAST[mode], ids = ctx.partyc.filter((id) => cast.includes(id));
  for (const forms of ORDER) if (forms.some((id) => cast.includes(id)) && !forms.some((id) => ids.includes(id))) ids.push(forms[0]);
  row(st, ids);
}
const mob = (st, ctx) => outAll(st, ctx, 22);
const PAIR = { bujin: [F3, 47], gokua: [F3, 44], zangya: [F3, 45], bido: [F3, 46] };
const two = (st, a, b, col = 0) => { face(st, a[0], a[1], -48, col); face(st, b[0], b[1], 48, col); };
const ANN = (st, s) => face(st, CARD, 69, 0, s.var[40] || 0); // リングアナ (顔カード column = variable 40)
const ARALE = (st) => face(st, F3, 53);

const D = {
  5501: (st) => { under(st, P3, 28); face(st, E3, 10); }, // サタン、アナウンサー
  5502: (st) => { under(st, P3, 2); face(st, P3, 3, -48); face(st, P3, 14, 48); }, // 悟飯、クリリン、トランクス
  5503: (st) => { // Z戦士合流
    under(st, P3, 2); under(st, P3, 3, -64); under(st, P3, 14, 64);
    group(st, [[P3, 4, -192], [P3, 5, -128], [P3, 6, -64], [P3, 1, 0], [P3, 7, 64], [P3, 21, 128], [P3, 9, 192]]);
  },
  5511: (st, ctx) => { mob(st, ctx); two(st, PAIR.bujin, PAIR.gokua); },
  5521: (st, ctx) => { mob(st, ctx); two(st, PAIR.bujin, PAIR.gokua, 1); },
  5522: (st, ctx) => mob(st, ctx),
  5531: (st, ctx) => { mob(st, ctx); two(st, PAIR.zangya, PAIR.bido); },
  5541: (st, ctx) => { mob(st, ctx); two(st, PAIR.zangya, PAIR.bido, 1); },
  5542: (st, ctx) => mob(st, ctx),
  5551: (st, ctx) => mob(st, ctx),
  5571: (st, ctx) => { // ボージャック一味
    mob(st, ctx);
    group(st, [[F3, 44, -128], [F3, 45, -64], [F3, 42, 0], [F3, 46, 64], [F3, 47, 128]]);
  },
  5581: (st, ctx) => { mob(st, ctx); face(st, F3, 42, 0, 1); },
  5582: (st, ctx) => { mob(st, ctx); face(st, F3, 42); },
  5583: (st, ctx) => { mob(st, ctx); face(st, F3, 43); }, // フルパワー
  5584: (st) => { under(st, P3, 2); face(st, P3, 0); }, // 悟空登場
  5601: (st) => { wide(st, KAIO_BG); face(st, P3, 0, -48); face(st, CARD, 25, 48, 2); }, // 界王星
  5602: (st) => { // 病院
    under(st, P3, 2); under(st, P3, 14, 64); under(st, P3, 3, -64); under(st, P3, 5, 128); under(st, P3, 6, -128);
    face(st, P3, 7);
  },
  7111: (st, ctx) => { face(st, E3, 15); outAll(st, ctx, 30); }, // 人影
  7121: (st, ctx) => { face(st, F3, 115); outAll(st, ctx, 30); }, // パイクーハン
  7122: (st, ctx) => outAll(st, ctx, 30),
  7211: (st, ctx) => { face(st, E3, 15); outAll(st, ctx, 30); },
  7221: (st, ctx) => { face(st, F3, 154); outAll(st, ctx, 30); }, // ブウ
  7222: (st, ctx) => outAll(st, ctx, 30),
  90013: (st) => face(st, CARD, 12, 0, 2), // ポポ
  90911: (st, ctx) => { ARALE(st); outAll(st, ctx, 30); },
  90912: (st, ctx) => outAll(st, ctx, 30),
  90921: (st) => ARALE(st),
};
for (const n of [90001, 90011, 90021, 90031, 90041, 90051]) D[n] = (st, ctx) => ANN(st, ctx.s);
D[90012] = D[90022] = D[90032] = (st, ctx) => (ctx.s.var[282] === ctx.s.var[343] ? ARALE(st) : ANN(st, ctx.s)); // 闘技場 n 回戦
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), [5516, 5536, 5576, 5591, 7116, 7216],
  [P3, E3, F3, CARD, KAIO_BG]);

// ---------- the pages' own commands (tools/build_zg_bojack.py) ----------
addNodes({
  zgbjParty: async (node, { ctx }) => { // $partyc = [...]
    if (!G) return;
    party(G, node.ids.filter((id) => G.world.actors[id]));
    G.state.var[42] = G.state.party[0].id;
    ctx.partyc = G.state.party.map((m) => m.id);
  },
  zgbjSsOff: async (node, { ctx }) => { // CE159 超サイヤ人全解除
    if (!G) return;
    for (let no = 1; no <= 7; no++) superSaiyan(G.world, G.state, no, false);
    ctx.partyc = G.state.party.map((m) => m.id);
  },
  zgbjKeep: async () => { if (G) keepParty(G.state); }, // CE166
  zgbjRanks: async (node) => { if (G) arenaRanks(G.state, node.from === 'v282' ? G.state.var[282] || 0 : node.from); },
  zgbjClear: async () => { if (G) { const a = ar(G.state), r = G.state.var[282]; a.clear[r - 1] = (a.clear[r - 1] || 0) + 1; } },
  zgbjCE: async (node, env) => { if (G) await arenaCE(G, node.n, env); },
});

// ---------- 時之間 party ⇄ story party (CE166 / CE157 / CE168 with variable 22 = 2) ----------
// $tmp_partyc[2]: the 時之間 party while the story runs; afterwards the story party (the next time the door is used)
const tmp = (s) => (s.flags.zgbjTmp = s.flags.zgbjTmp || {});
function snapshot(s) { return { party: s.party.map((m) => m.id), ss: { ...(s.ss || {}) } }; }
function keepParty(s) { tmp(s).party = snapshot(s); }
function swapParty(game) { // CE157 + CE168: the kept one comes back (Super Saiyans too), the current one is kept
  const s = game.state, t = tmp(s), cur = snapshot(s), k = t.party;
  t.party = cur;
  if (!k) return;
  syncSuperSaiyan(game.world, s, Object.fromEntries(Object.keys(FORMS).map((no) => [no, !!k.ss[no]])));
  party(game, k.party.filter((id) => game.world.actors[id]));
  s.var[42] = s.party[0].id;
}

// ---------- 9911: 銀河ギリギリ!!ぶっちぎりの凄い奴 ----------
registerArea(9911, async (game, poi) => {
  const s = game.state;
  stop(game);
  s.var[41] = 5500;
  s.var[22] = 2;
  if (!s.sw[590]) { // not under way: 「在通關之前無法回到時之間 / 要移動嗎？」
    await play(game, 'zgbj:5500'); // (yes: CE166, variable 41 = 5501)
    if (s.var[41] !== 5501) { audio.se('Z1 出る'); goTo(game, { map: '96', x: poi.x, y: poi.y + 1 }); return; }
    G.zgbjMode = 'story';
  } else G.zgbjMode = 'again';
  startTrStory(game, 'zgbojack');
});

async function start(game) {
  const s = game.state;
  stop(game);
  if (game.zgbjMode === 'again') { // 5500, switch 590 on (left half way): the story party again, where it was
    game.zgbjMode = null;
    swapParty(game);
    s.var[173] = 4;
    healAll(game);
    s.sw[360] = true;
    s.var[43] = 126;
    toField(game, s.sw[591] && s.sw[592] ? C(game).boss99 : C(game).start);
    return;
  }
  game.zgbjMode = null;
  s.var[41] = 5501;
  await play(game, 'zgbj:5501'); // (CE159, CE166, $partyc = [5,6,17,4,12,7,8,9,10], everyone healed)
  healAll(game);
  toField(game, C(game).start);
}

// a story battle: the extra-attack switches the page set (25 last one standing, 26 / 27 / 29 HP ≤ 30 / 40 / 50 %,
// 28 two or fewer; cleared after, reset_battle_flag); chk_set_event_no after a win (variable 41 = variable 95)
async function battle(game, no, at) {
  const s = game.state, sw = s.sw;
  const flags = { alone: !!sw[25], hp30: !!sw[26], hp40: !!sw[27], two: !!sw[28], hp50: !!sw[29] };
  const r = await fight(game, no, at ?? String(no), { backdrop: Z3(game).battles[no].backdrop, ...flags });
  G = game;
  for (let k = 25; k <= 29; k++) sw[k] = false;
  if (r === 'win') { sw[128] = false; s.var[41] = s.var[95] || s.var[41]; s.var[95] = 0; }
  return r;
}

// map 97 (61,11) / map 98 (35,22): 5511 → 5516 → 5521 / 5531 → 5536 → 5541; both pairs beaten → 5551 → map 99
async function pair(game, page) {
  stop(game);
  game.state.var[41] = page;
  await play(game, `zgbj:${page}`);
  return afterPair(game, page + 5);
}
async function afterPair(game, no) {
  const s = game.state;
  if (await battle(game, no) !== 'win') return;
  s.var[41] = no + 5;
  await play(game, `zgbj:${no + 5}`); // (the other pair beaten too: 悟飯「大家一起追上去！！」, variable 41 = 5551)
  if (s.var[41] !== 5551) { toField(game); return; }
  await play(game, 'zgbj:5551'); // variable 43 + 1
  toField(game, C(game).boss99);
}
// map 99 (26,2): 5571 → 5576 → 5581 → 5591 → 5601 → 9912
async function bojack(game) {
  stop(game);
  game.state.var[41] = 5571;
  await play(game, 'zgbj:5571');
  return bojack1(game);
}
async function bojack1(game) {
  if (await battle(game, 5576) !== 'win') return;
  game.state.var[41] = 5581;
  await play(game, 'zgbj:5581'); // (switch 581: the door shows him beaten; Gohan's 超かめはめ波 with switch 388)
  return bojack2(game);
}
async function bojack2(game) {
  const s = game.state;
  if (await battle(game, 5591) !== 'win') return;
  s.var[41] = 5601;
  await play(game, 'zgbj:5601'); // CE159; switches 360 / 590 off (the next time: the story from the start), 593 / 766 on
  backToHall(game);
}
// 9912: CE182, CE157 + CE168 (the 時之間 party back, this one kept), switch 360 off, 78 on (no 筋斗雲 card), variable
// 43 = 999 → map 96 (8,3)
function backToHall(game) {
  const s = game.state;
  stop(game);
  eventCard(s, 37, -99);
  eventCard(s, 124, -99);
  swapParty(game);
  s.sw[360] = false;
  s.sw[78] = true;
  s.var[43] = 999;
  s.sw[466] = true; // (still in the 時之間)
  audio.se('Z1 入る');
  endTrStory(game, C(game).back);
}

function spot(game, poi) {
  G = game;
  const p = String(poi.page);
  if (p === 'bujin') return pair(game, 5511);
  if (p === 'zangya') return pair(game, 5531);
  if (p === 'bojack') return bojack(game);
  if (p === 'back') return backToHall(game);
  if (p.startsWith('warp:')) { stop(game); goTo(game, C(game).warps[p.slice(5)]); return true; } // 5561-5564
  if (p === 'card40') return card40(game, poi);
  return null;
}
// map 99 (47,15): カード特殊 (variable 44 = 40 before chk_card)
async function card40(game, poi) {
  const s = game.state;
  spotTally(s, { effect: 'shop' });
  game.field.spent = poi;
  s.var[44] = 40;
  await cardSquare(game);
  s.var[44] = 0;
  game.save(true);
  toast('已存檔');
}
const AT = { 5516: (g) => afterPair(g, 5516), 5536: (g) => afterPair(g, 5536), 5576: bojack1, 5591: bojack2,
  7116: (g) => afterOne(g, 'paikuhan'), 7216: (g) => afterOne(g, 'buu') };
function resume(game, at) {
  G = game;
  const f = AT[at && at.at];
  if (f) f(game); else toField(game);
}
function goal(world, s) {
  const t = world.zgBojack.text;
  return s.map === '99' ? t.goal99 : MAPS.includes(s.map) ? t.goal97 : '';
}

// ---------- 9941 帕伊庫漢 / 9951 布歐: one battle each with the 時之間 party ----------
const ONE = {
  paikuhan: { door: 9941, gate: 7101, page: 7111, no: 7116, after: 7121, back: 'paikuhan' },
  buu: { door: 9951, gate: 7201, page: 7211, no: 7216, after: 7221, back: 'buu' },
};
for (const [k, o] of Object.entries(ONE)) {
  registerArea(o.door, async (game, poi) => {
    const s = game.state;
    stop(game);
    s.var[41] = o.gate;
    await play(game, `zgbj:${o.gate}`); // 「從這個區域可以感受到…你還要繼續前進嗎？」 (yes: variable 41 = page)
    if (s.var[41] !== o.page) { audio.se('Z1 出る'); goTo(game, { map: '96', x: poi.x, y: poi.y + 1 }); return; }
    startTrStory(game, k === 'paikuhan' ? 'zgpaikuhan' : 'zgbuu');
  });
}
async function oneStart(game, k) {
  const o = ONE[k], s = game.state;
  stop(game);
  s.var[41] = o.page;
  await play(game, `zgbj:${o.page}`); // switch 587 / 600, the extra attack at HP ≤ 30 % (26), variable 43 = 801
  return afterOne(game, k);
}
async function afterOne(game, k) {
  const o = ONE[k], s = game.state;
  if (await battle(game, o.no) !== 'win') return;
  s.var[41] = o.after;
  await play(game, `zgbj:${o.after}`); // variable 43 = 999; everyone healed; → 9942 / 9952
  s.var[43] = 999;
  s.sw[466] = true;
  endTrStory(game, C(game)[o.back]);
}

// ---------- the 闘技場 (event 19) ----------
const A = (game) => C(game).arena;
const HALL_BACK = { map: '58', x: 22, y: 6 };
// set_btl_arena_fight_rank (all.rb 1044): s.flags.arena = { open: [rank 1 …], clear: [count …], first: [prize got …] }
const ar = (s) => (s.flags.arena = s.flags.arena || { open: [true], clear: [], first: [] });
function arenaRanks(s, from) {
  const a = ar(s), unlock = G.world.zgBojack.arena.unlock;
  const to = from === 0 ? a.clear.length : from;
  for (let x = from; x <= to; x++) {
    for (const u of unlock[x] || []) {
      const sw = u.sw.length ? (u.all ? u.sw.every((n) => s.sw[n]) : u.sw.some((n) => s.sw[n])) : true;
      if (sw && (a.clear[x - 1] || 0) > 0 && (!u.laps || (s.laps || 0) >= 1)) a.open[x + u.k] = true;
    }
  }
}
// CE192 / CE193: the arena's cards in place of the party's (main_btl_arena_cardchange), and back
function arenaCards(game, on) {
  const s = game.state, a = ar(s);
  if (on) {
    a.keep = cardState(s).cards;
    s.cards = {};
    const rank = s.var[282] || 0;
    for (const [id, n, need] of A(game).cards) {
      if (Array.isArray(need) ? s.sw[need[1]] : rank >= need) eventCard(s, id, n);
    }
  } else if ('keep' in a) { s.cards = a.keep || {}; delete a.keep; }
}
// CE191: the prizes of the rank in variable 284 (cards 291-295 always, 296-300 the first win), told in the page's
// message window
async function arenaPrize(game, line) {
  const s = game.state, a = ar(s), w = game.world, rank = s.var[284] || 0;
  const p = A(game).prizes[rank >= 70 ? 'ge70' : String(rank)];
  if (!p) return;
  const v = {};
  for (let k = 291; k <= 300; k++) v[k] = 0;
  Object.assign(v, p.fix);
  if (a.first[rank - 1] !== 1) Object.assign(v, p.first);
  for (const [k, pct, id] of p.rand) if (Math.floor(Math.random() * 99) + 1 <= pct) v[k] = id;
  const give = (ks) => ks.filter((k) => v[k] && w.items[v[k]]).map((k) => { eventCard(s, v[k], 1); return w.items[v[k]].name; });
  const names = (list) => [list.slice(0, 3).join('　'), list.slice(3).join('　')].filter(Boolean).join('\n');
  if (v[296]) {
    audio.se('DB2 アイテム取得', 80);
    const got = give([296, 297, 298, 299, 300]);
    a.first[rank - 1] = 1;
    await line(`首次勝利！　獲得以下卡片！\n${names(got)}`);
  }
  const got = give([291, 292, 293, 294, 295]);
  audio.se('DB2 アイテム取得', 80);
  await line(`獲得以下卡片！\n${names(got)}`);
}
// CE194: every rank but Arale's cleared once (855), every enemy of the 図鑑 but her met (853)
function araleCheck(game) {
  const s = game.state, a = ar(s), last = 69;
  const all = a.clear.length >= last && [...Array(last - 1).keys()].every((x) => (a.clear[x] || 0) > 0);
  s.sw[855] = all;
  s.sw[853] = all && A(game).seen.every((id) => (s.foeSeen || {})[id]);
}
async function arenaCE(game, n, env) {
  if (n === 191) await arenaPrize(game, (t) => (env.quiet ? null : sceneSay(env.ui, env.ctx.faces, ['', t])));
  else if (n === 192) arenaCards(game, true);
  else if (n === 193) arenaCards(game, false);
  else if (n === 194) araleCheck(game);
}

// 90001: the first time CE277; 「要參加競技場嗎？」 → the rank list
registerArea('arena', async (game) => {
  const s = game.state;
  stop(game);
  s.var[41] = 90001;
  s.var[343] = 69; // (the original sets it at the start of the game: Arale's rank)
  await play(game, 'zgbj:90001'); // (yes: variables 306 / 317 / 318 = 0, switches 122 / 124 / 477 / 876 off, the ranks)
  if (s.var[41] !== 90002) { audio.se('Z1 出る'); goTo(game, HALL_BACK); return; }
  const rank = await rankList(game);
  if (!rank) { audio.se('Z1 出る'); goTo(game, HALL_BACK); return; }
  s.var[282] = rank;
  s.var[283] = 1;
  s.sw[876] = rank >= 70;
  return arena(game);
});
// 90011 → the rounds → 90041 / 90051
async function arena(game) {
  const s = game.state, A_ = A(game);
  stop(game);
  s.var[41] = 90011;
  await play(game, 'zgbj:90011'); // the first round's call (CE192), or the 覚醒 / Arale lines
  const rank = s.var[282], rounds = A_.ranks[rank] || [];
  for (;;) {
    const r = await arenaBattle(game, rounds[(s.var[283] || 1) - 1]);
    stop(game);
    if (r !== 'win') { s.var[41] = 90051; await play(game, 'zgbj:90051'); goTo(game, HALL_BACK); return; }
    const next = s.var[95];
    if (next === 90041 || !rounds[s.var[283]]) break;
    s.var[41] = next; // 90021 / 90031: the next round's call (variable 283 + 1)
    await play(game, `zgbj:${next}`);
  }
  s.var[41] = 90041;
  s.var[284] = rank;
  await play(game, 'zgbj:90041'); // the new ranks, the prizes, the music switches
  if (s.var[41] === 90901) { // every rank cleared and every enemy met: (the DB3 staff roll) → Arale
    s.var[41] = 90911;
    await play(game, 'zgbj:90911');
  }
  goTo(game, HALL_BACK);
}
// battle_arena_ene_set: one of the round's rolls (variable 281 = rand(3)+1), the era's practice background, no EXP,
// no card drops, no victory music (switches 122 / 124 / 148); a loss is not a game over (variable 239 = 90051)
async function arenaBattle(game, rolls) {
  const s = game.state;
  if (!rolls || !rolls.length) return 'win';
  const b = rolls[Math.floor(Math.random() * rolls.length)];
  s.var[95] = s.var[95] || 90041;
  const bg = A(game).bg[Math.min(2, s.var[40] || 0)];
  game.busy = false;
  const won = await game.startBattle(b.foes, true, {
    trReward: { shared: 0, cap: 0, sp: 0, drops: [] }, backdrop: bg, loseOk: true, ...(b.bgm ? { bgm: b.bgm } : { eventBgm: true }),
    alone: !!(b.sw25 || s.sw[25]), hp30: !!(b.sw26 || s.sw[26]), hp40: !!(b.sw27 || s.sw[27]), two: !!(b.sw28 || s.sw[28]), hp50: !!(b.sw29 || s.sw[29]),
  });
  for (let k = 25; k <= 29; k++) s.sw[k] = false;
  return won ? 'win' : 'lose';
}
// Scene_Db_Battle_arena: ten ranks a page (等級 n, its clear count, its name once cleared, a ball once the first prize
// is got), 上一页 / 下一页 / 结束; 「决定进入等级 n 吗？」 好的 / 算了. Resolves with the rank (0: closed).
function rankList(game) {
  const s = game.state, a = ar(s), names = A(game).names;
  return new Promise((res) => {
    const root = document.createElement('div');
    root.className = 'fm tr-info zgbj-arena';
    root.innerHTML = '<div class="win"><div class="tr-title"></div><div class="tr-list"></div><div class="zgbj-nav"></div></div>';
    root.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); });
    document.getElementById('app').appendChild(root);
    let page = s.var[342] || 0;
    const done = (rank) => { root.remove(); res(rank); };
    const draw = () => {
      root.querySelector('.tr-title').textContent = '－ 等級選擇 －　　通過次數';
      const list = root.querySelector('.tr-list'), nav = root.querySelector('.zgbj-nav');
      list.innerHTML = '';
      nav.innerHTML = '';
      const total = Math.max(1, a.open.length);
      for (let x = page * 10 + 1; x <= Math.min(total, page * 10 + 10); x++) {
        if (!a.open[x - 1]) continue;
        const b = document.createElement('button');
        b.className = 'btn';
        const n = a.clear[x - 1] || 0;
        b.innerHTML = `<span class="r">${a.first[x - 1] > 0 ? '●' : '　'}等級${x}</span><span class="n"></span><span class="c">${n}次</span>`;
        b.querySelector('.n').textContent = n > 0 ? `：${names[x] || ''}` : '：？？？？？？？？？？？';
        b.onclick = async () => {
          audio.se('Z3 決定');
          root.hidden = true;
          await say([['', `決定進入等級${x}嗎？`]], true);
          const k = await choose(['好的', '算了']);
          root.hidden = false;
          if (k === 0) { s.var[341] = (x - 1) % 10; s.var[342] = page; done(x); }
        };
        list.append(b);
      }
      const btn = (t, f) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = t; b.onclick = f; nav.append(b); };
      btn('上一頁', () => { audio.se('Z3 決定'); if (page > 0) { page--; draw(); } });
      btn('下一頁', () => { audio.se('Z3 決定'); if (total > (page + 1) * 10) { page++; draw(); } });
      btn('結束', () => done(0));
    };
    draw();
  });
}
const css = document.createElement('style');
css.textContent = `
.zgbj-arena .tr-list .btn { display: flex; gap: 2px; align-items: baseline; padding-left: 8px; padding-right: 8px; }
.zgbj-arena .tr-list .r { flex: none; }
.zgbj-arena .tr-list .n { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.zgbj-arena .tr-list .c { flex: none; font-size: 14px; }
.zgbj-nav { flex: none; display: flex; gap: 6px; }
.zgbj-nav .btn { flex: 1 1 0; margin: 0; font-size: 15px; }
`;
document.head.appendChild(css);

// ---------- the chapters ----------
registerZ3('zgbojack', { maps: MAPS, start, spot, resume, goal, dev });
registerZ3('zgpaikuhan', { start: (g) => oneStart(g, 'paikuhan'), resume, goal: () => '' });
registerZ3('zgbuu', { start: (g) => oneStart(g, 'buu'), resume, goal: () => '' });

// ---------- development: ?dev=zgbojack / zgbojack99 / zgbojackend / zgpai / zgbuu / zgarena / zgarena50 (&timer) ----------
// a Z4-end save inside the 時之間 (as ?dev=tr, src/timeroom.js), the ZG hall open (switches 459, 570, 580)
function dev(game, step) {
  if (!/^(zgbojack(99|end)?|zgpai|zgbuu|zgarena\d*)$/.test(step)) return false;
  devState(game, step);
  return true;
}
function devState(game, step) {
  const s = game.state = game.newState();
  G = game;
  s.var[40] = 2;
  for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 459, 570, 580, 521, 545, 429, 532, 421, 533, 561, 563,
    564, 566, 568]) s.sw[n] = true;
  if (step === 'zgpai' || step === 'zgbuu') for (const n of [581, 585, 586]) s.sw[n] = true; // (the ZG story cleared)
  if (step === 'zgbuu') s.sw[587] = true;
  s.flags.z3 = 'done';
  party(game, [3, 5, 4, 12, 17, 6]);
  for (const m of s.party) { m.level = 60; m.exp = game.world.actors[m.id].exp[60]; }
  for (const id of [7, 8, 9, 10, 24]) { const m = member(game, id); m.level = 55; m.exp = game.world.actors[id].exp[55]; }
  s.flags.tr = { back: { map: '48', x: 44 * 32 + 16, y: 29 * 32 + 16 }, v43: 0, v17: 2, party: s.party.map((m) => m.id), ss: {} };
  for (const n of [470, 466, 473, 476, 1301, 1304]) s.sw[n] = true;
  s.sw[78] = true;
  s.var[43] = 999;
  s.var[17] = 2;
  s.zeni = 30000;
  Promise.resolve().then(() => {
    for (const m of [...s.party, ...Object.values(s.bench || {})]) { applyLevel(game.world, m); heal(m); }
    const to = step.startsWith('zgarena') ? { map: '58', x: 22, y: 6 } : { map: '96', x: step === 'zgpai' ? 23 : step === 'zgbuu' ? 28 : 8, y: 3 };
    s.map = to.map; s.x = to.x * 32 + 16; s.y = to.y * 32 + 16;
    game.startField();
    if (step === 'zgbojack99' || step === 'zgbojackend') {
      s.flags.trStory = { main: 'done' };
      s.flags.z3 = 'zgbojack';
      keepParty(s);
      party(game, [5, 6, 17, 4, 12, 7, 8, 9, 10]);
      Object.assign(s.sw, { 590: true, 591: true, 592: true, 360: true });
      s.var[43] = 127;
      if (step === 'zgbojack99') { toField(game, { map: '99', x: 26, y: 4 }); return; }
      stop(game);
      s.var[41] = 5601;
      play(game, 'zgbj:5601').then(() => backToHall(game));
      return;
    }
    if (step.startsWith('zgarena') && step.length > 7) { // zgarena50: the ranks before that one cleared once (open
      const n = Number(step.slice(7)), a = ar(s); //   as far as the story switches allow); zgarena69 also opens Arale's
      for (let x = 0; x < n - 1; x++) { a.open[x] = true; a.clear[x] = 1; }
      a.open[n - 1] = true;
      if (n === 69) s.sw[852] = true;
    }
  });
}

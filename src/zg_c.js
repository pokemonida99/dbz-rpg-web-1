// ZG 本編 後段（事件 23 頁 6431～6999：布布克島（力紐姆）、克恩星、奧特星、暗黑行星，地圖 105、108～110） — docs/zg-c.md;
// the data is built by tools/build_zg_c.py (world.z3.pages 'zgc:…', world.z3.zgc). The middle part (src/zg_b.js) hands
// over with startTrStory(game, 'zgc') once page 6421 is over; the end (page 6761 → 9932) is endTrStory back in the ZG hall.
//   map 105 (variable 43 = 173): 村 6431, 洞穴 6441, 鉱山 6451 (皮拉夫一夥), 火山 6471, 別荘 6461 → 6481 布爾瑪家 (CE92) → map 108
//   map 108: 派瑞之城 6491, 預言者 6501, 洞穴 6511 → battle 6516 → 6521; switch 833 → the pirate ship → 6531 → map 109
//   map 109: 海盜船 6541, 庫阿鎮 6551, 漩渦 6561 → battle 6566 → 6571 → map 110
//   map 110: guard robots 6611-6615 → battle 6616 → 6621 (all five: switch 845); the door 6601; 怨念增幅裝置 6631 → battle
//     6641 → 6651 (CE94) → battle 6671 → 6681 → battle 6701 → 6711 (CE69) → battle 6721 → 6731 → 6751 (CE95) → 6761 → 9932
//   the 時の間へ移動 squares → page 9932 (back to the ZG hall mid-story: state.flags.zgBack, src/zg_a.js leaveZg / backToZg)
import { audio, img, loadImages, toast, view } from './core.js?v=20261102-2129';
import { addScenes, addNodes, playScenes } from './cutscene.js?v=20261102-2129';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261102-2129';
import { addMoves } from './anime.js?v=20261102-2129';
import { makeMember, applyLevel } from './party.js?v=20261102-2129';
import { syncSuperSaiyan, FORMS } from './supersaiyan.js?v=20261102-2129';
import { applyEra } from './era.js?v=20261102-2129';
import { newHand } from './battle.js?v=20261102-2129';
import { eventCard } from './items.js?v=20261102-2129';
import { cardSquare } from './cardgames.js?v=20261102-2129';
import { spotTally } from './fieldmenu.js?v=20261102-2129';
import { screenPic } from './z3c.js?v=20261102-2129';
import { registerZ3, Z3, begin, fight, toField, party, member, heal, moveTo } from './z3.js?v=20261102-2129';
import { registerBackdrop, endTrStory } from './timeroom.js?v=20261102-2129';
// the ZG parts' shared party / way-back helpers (keepParty, restoreParty, leaveZg, backToZg: docs/zg-c.md); read through
// the namespace so this part still runs on its own before the first part is merged (the same steps are below)
import * as ZGA from './zg_a.js?v=20261102-2129';

const MAPS = ['105', '108', '109', '110'];
const C = (game) => Z3(game).zgc;
let G = null; // the game, for the page commands below (set whenever this part takes over)
function stop(game) { G = game; begin(game); }

// the battle films of this part's moves (src/anime.js): the closest of the earlier films, as the earlier chapters do
addMoves({
  662: 'foeWave', 664: 'raditzBigWave', 663: 'nappaBlast', 665: 'garlicBall', // 齊爾德(強)
  567: 'foeWave', 568: 'raditzWave', 569: 'swordAttack', 570: 'nappaBlast', // 戈特加登
  571: 'foeWave', 572: 'raditzWave', 573: 'swordAttack', 574: 'kienzan', 575: 'raditzBigWave', 576: 'nappaBlast', 577: 'psychic', 578: 'giantWave', // 萊奇
  579: 'foeWave', 580: 'raditzWave', 581: 'nappaBlast', 582: 'raditzBigWave', 583: 'swordAttack', 584: 'giantWave', // 哈奇亞克
  542: 'foeWave', 543: 'raditzWave', 544: 'raditzBigWave', 545: 'kamehameha', 546: 'bakuretsu', 547: 'masenko', 548: 'galickGun',
  549: 'swordAttack', 692: 'psychic', 693: 'giantWave', // 奧佐特
  685: 'foeWave', 686: 'raditzWave', 687: 'raditzBigWave', 688: 'swordAttack', 689: 'psychic', 690: 'giantWave', // 奧佐特(變身)
  550: 'foeWave', 552: 'foeWave', 553: 'paralysis', 555: 'foeWave', 557: 'foeWave', 559: 'makouhou', 561: 'foeWave', // 雜兵
  562: 'raditzWave', 399: 'raditzBigWave', 563: 'nappaBlast', 564: 'foeWave', 566: 'kienzan', 660: 'foeWave',
  236: 'makouhou', 237: 'masenko', 238: 'nappaBlast', 240: 'makankosappo', 241: 'kamehameha', // 未來悟飯
  246: 'energyWave', 248: 'vegetaWave', 247: 'scatterWave', 249: 'galickGun', // 多瑪
  255: 'energyWave', 257: 'vegetaWave', 256: 'scatterWave', 259: 'swordAttack', // 莎莉巴
  265: 'energyWave', 267: 'vegetaWave', 266: 'scatterWave', 268: 'swordAttack', // 多達布
  273: 'energyWave', 275: 'vegetaWave', 274: 'scatterWave', 276: 'swordAttack', // 普普堅
});

// ---------- the scenes (z1field 6431-6769, all.rb 181975-182520) ----------
// ZG scenes are 512×128 pictures over the scroll window (@z1_scrollscenex = 64); faces at @ene1_x ± n (288,78), the
// others under the scene. A phone shows the middle ~230 px, so wider rows of faces are drawn closer (and smaller).
const pic = (n) => `Graphics/Pictures/${n}`;
const P3 = pic('Z3_顔味方.PNG'), E3 = pic('Z3_顔イベント.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
const BGN = ['町1', '草原', 'ピラフの別荘', '溶岩2', 'ブルマの家', '宇宙船', '界王星', '町_クーン星', '洞窟3', '洞窟2', '海3', 'クアーの町',
  '怨念増幅装置(影)', '洞窟6', '怨念増幅装置'];
const BG = Object.fromEntries(BGN.map((n) => [n, pic(`ZG_背景_${n}.PNG`)]));
const TIME_MACHINE = pic('Z3_背景_タイムマシンp2.png');
const FIT = 224; // art px of the scene a phone shows for sure

const wide = (st, bg) => st.add(BG[bg], SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
// a row of faces in the scene ([sheet, row, dx, col]) at dy: as the original places them, closer (and smaller) when wider
function group(st, list, dy = 0) {
  const xs = list.map((f) => f[2]), lo = Math.min(...xs), hi = Math.max(...xs);
  const fits = hi - lo + 64 <= FIT, size = fits ? 64 : Math.min(64, Math.floor(FIT / list.length));
  const k = fits ? 1 : (FIT - size) / (hi - lo), mid = (hi + lo) / 2;
  for (const [sheet, row, dx, col = 0] of list) {
    st.add(sheet, ENE[0] + 32 - size / 2 + mid + (dx - mid) * k, ENE[1] + 32 - size / 2 + dy, [64 * col, 64 * row, 64, 64], false, 0, [size, size]);
  }
}
const face = (st, sheet, row, dx = 0, col = 0) => group(st, [[sheet, row, dx, col]]);
// the faces under the scene, a row of ids each (actor id - 3 on Z3_顔味方): as many a line as fit, smaller when more
function lay(st, rows) {
  const n = Math.max(...rows.map((r) => r.length));
  const per = n > 18 ? 7 : n > 12 ? 7 : n > 9 ? 6 : n > 8 ? 5 : n > 6 ? 4 : 3;
  st.faceSize = per >= 7 ? 30 : per === 6 ? 36 : per === 5 ? 40 : per === 4 ? 48 : 64;
  let line = 0;
  for (const ids of rows) {
    for (let k = 0; k < ids.length; k += per) {
      const part = ids.slice(k, k + per);
      part.forEach((id, j) => st.add(P3, PLAY_X - 32 * (part.length - 1) + 64 * j, 0, [0, 64 * (id - 3), 64, 64], true, line));
      line++;
    }
  }
}
// character_output_all (all.rb 167997): the party, then everyone of the mode's list who is not in it, in the
// original's order (悟空 / 悟飯 / 貝吉塔 / 特蘭克斯 / 未來悟飯 / 巴達克 as their form is now)
const MODES = {
  26: [3, 14, 4, 5, 18, 12, 19, 17, 20, 25, 26, 6, 7, 8, 9, 16, 32, 27, 28, 29, 30, 10, 24, 15, 21, 22, 23],
  27: [3, 14, 4, 5, 18, 12, 19, 25, 26, 6, 7, 8, 9, 10, 24, 15, 21, 22, 23],
  28: [12, 19, 6, 7, 8, 9, 16, 32, 24, 15, 21, 22, 23],
  29: [4, 5, 18, 12, 19, 6, 7, 8, 9, 24, 15, 21, 22, 23],
};
function all(ctx, mode) {
  const list = MODES[mode], ss = ctx.s.ss || {};
  const ids = ctx.partyc.filter((id) => list.includes(id));
  const add = (base, sup, no) => { if (!ids.includes(base) && !ids.includes(sup) && list.includes(base) && list.includes(sup)) ids.push(ss[no] ? sup : base); };
  const one = (id) => { if (!ids.includes(id) && list.includes(id)) ids.push(id); };
  add(3, 14, 1); one(4); add(5, 18, 2);
  if (ss[5] && ids.includes(5)) ids[ids.indexOf(5)] = 18; // (超悟飯 2)
  for (const id of [6, 7, 8, 9, 10, 24]) one(id);
  add(12, 19, 3); add(17, 20, 4); add(25, 26, 6); add(16, 32, 7);
  for (const id of [27, 28, 29, 30, 15, 23, 22, 21]) one(id);
  return ids.filter((id) => G.world.actors[id]);
}
const outAll = (st, ctx, mode = 26) => lay(st, [all(ctx, mode)]);
// a party member's face as it is now (set_character_face 0, id - 3: the Super Saiyan form if that one is on)
const now = (ctx, id) => { const no = Object.keys(FORMS).find((k) => FORMS[k][0] === id); return no && (ctx.s.ss || {})[no] ? FORMS[no][1] : id; };
const card3 = (row) => [CARD, row, 2]; // 顔カード column 2 = Z3
const at = ([sheet, row, col = 0], dx) => [sheet, row, dx, col];
const PILAF = card3(72), SHU = card3(90), MAI = card3(91), KAIO = card3(25), BULMA = card3(8), BRIEF = card3(36);
const D = {
  1100: () => {}, // 背景色表示
  6431: (st, ctx) => { wide(st, '町1'); outAll(st, ctx); },
  6432: (st, ctx) => { wide(st, '町1'); face(st, E3, 33); outAll(st, ctx); }, // お姉さん
  6436: (st, ctx) => { wide(st, '町1'); face(st, E3, 13); outAll(st, ctx); }, // 男の子
  6441: (st, ctx) => { wide(st, '草原'); outAll(st, ctx); },
  6452: (st, ctx) => { wide(st, '草原'); group(st, [at(SHU, -80), at(PILAF, 0), at(MAI, 80)]); outAll(st, ctx); }, // ピラフ一味
  6453: (st, ctx) => { wide(st, '草原'); group(st, [at(SHU, -80), at(MAI, 80)]); outAll(st, ctx); },
  6454: (st, ctx) => { wide(st, '草原'); face(st, MAI[0], MAI[1], 80, 2); outAll(st, ctx); },
  6461: (st, ctx) => { wide(st, 'ピラフの別荘'); outAll(st, ctx); },
  6463: (st) => { wide(st, 'ピラフの別荘'); group(st, [at(SHU, -80), at(PILAF, 0), at(MAI, 80)]); }, // Z戦士飛び去る
  6464: (st) => { wide(st, 'ピラフの別荘'); group(st, [at(SHU, -80), [E3, 19, 0], at(MAI, 80)]); }, // ピラフ着替える
  6471: (st, ctx) => { wide(st, '溶岩2'); outAll(st, ctx); },
  6481: (st, ctx) => { wide(st, 'ブルマの家'); group(st, [at(BULMA, -48), at(BRIEF, 48)]); outAll(st, ctx); },
  6482: (st, ctx) => { wide(st, '宇宙船'); outAll(st, ctx); },
  6483: (st) => { wide(st, '界王星'); face(st, ...KAIO.slice(0, 2), 0, 2); },
  6491: (st, ctx) => { wide(st, '町_クーン星'); outAll(st, ctx); },
  6492: (st, ctx) => { wide(st, '町_クーン星'); face(st, E3, 45); outAll(st, ctx); }, // パイレ人
  6501: (st, ctx) => { wide(st, '洞窟3'); outAll(st, ctx); },
  6502: (st, ctx) => { wide(st, '洞窟3'); face(st, E3, 43); outAll(st, ctx); }, // 預言者
  6511: (st, ctx) => { wide(st, '洞窟2'); outAll(st, ctx); },
  // ギニュー特戦隊 (リクーム -128, グルド -64, ギニュー 0, ジース 64, バータ 128: over the prophet, as the original draws it)
  6512: (st, ctx) => { wide(st, '洞窟2'); group(st, [[F3, 150, -128], [F3, 151, -64], [F3, 147, 0], [F3, 148, 64], [F3, 149, 128]]); outAll(st, ctx); },
  6521: (st, ctx) => { wide(st, '洞窟2'); outAll(st, ctx); face(st, CARD, 125, 0, 2); }, // リング
  6531: (st, ctx) => { wide(st, '町_クーン星'); outAll(st, ctx); },
  6532: (st, ctx) => { wide(st, '海3'); outAll(st, ctx); },
  6541: (st, ctx) => { wide(st, '宇宙船'); face(st, E3, 44); outAll(st, ctx); }, // 海賊
  6551: (st, ctx) => { wide(st, 'クアーの町'); outAll(st, ctx); },
  6552: (st, ctx) => { wide(st, 'クアーの町'); face(st, E3, 46); outAll(st, ctx); }, // オクター人
  6561: (st, ctx) => { wide(st, '海3'); outAll(st, ctx); },
  6562: (st, ctx) => { wide(st, '海3'); face(st, E3, 47); outAll(st, ctx); }, // 海の主
  6563: (st, ctx) => { wide(st, '海3'); group(st, [[E3, 47, -48], [F3, 152, 48]]); outAll(st, ctx); }, // 海の主・チルド(強)
  6572: (st, ctx) => { wide(st, '海3'); face(st, CARD, 124, 0, 2); outAll(st, ctx); }, // 真珠
  6573: (st) => { wide(st, '怨念増幅装置(影)'); face(st, E3, 15); }, // 人影
  6574: (st, ctx) => { wide(st, '洞窟6'); outAll(st, ctx); },
  6611: (st, ctx) => { wide(st, '洞窟6'); face(st, F3, 71); outAll(st, ctx); }, // ゴッドガードン
  6631: (st, ctx) => { wide(st, '怨念増幅装置'); outAll(st, ctx); },
  6632: (st, ctx) => { wide(st, '怨念増幅装置'); face(st, E3, 15); outAll(st, ctx); },
  6633: (st, ctx) => { wide(st, '怨念増幅装置'); face(st, F3, 72); outAll(st, ctx); }, // ライチー
  6661: (st, ctx) => { wide(st, '怨念増幅装置'); face(st, F3, 73); outAll(st, ctx); }, // ハッチヒャック
  6692: (st, ctx) => { wide(st, '怨念増幅装置'); face(st, F3, 54); outAll(st, ctx); }, // オゾット
  6711: (st, ctx) => { wide(st, '怨念増幅装置'); face(st, F3, 54, 0, 1); outAll(st, ctx); },
  6712: (st, ctx) => { wide(st, '怨念増幅装置'); face(st, F3, 153); outAll(st, ctx); }, // オゾット(変身)
  // バーダック一味元の時代へ: the time machine, トテッポ -176, トーマ -96, セリパ 96, パンブーキン 176, トランクス 256 in the scene,
  // バーダック above the others (@play_y - 24), character_output_all 0,0,40,27
  6761: (st, ctx) => {
    wide(st, 'ブルマの家'); st.add(TIME_MACHINE, ENE[0] - 20, SCENE_Y + 10, [0, 0, 128, 128]);
    group(st, [[P3, 26, -176], [P3, 24, -96], [P3, 25, 96], [P3, 27, 176], [P3, now(ctx, 17) - 3, 256]]);
    lay(st, [[now(ctx, 16)], all(ctx, 27)]);
  },
  // 未来悟飯元の時代へ: 未来悟飯 -96, トランクス 96; チチ 悟空 ピッコロ 悟飯 above the others; mode 28
  6762: (st, ctx) => {
    wide(st, 'ブルマの家'); st.add(TIME_MACHINE, ENE[0] - 20, SCENE_Y + 10, [0, 0, 128, 128]);
    group(st, [[P3, now(ctx, 25) - 3, -96], [P3, now(ctx, 17) - 3, 96]]);
    lay(st, [[10, now(ctx, 3), 4, now(ctx, 5)], all(ctx, 28)]);
  },
  // バーダック元の時代へ: バーダック -96, トランクス 96; 悟空 チチ above the others; mode 29
  6763: (st, ctx) => {
    wide(st, 'ブルマの家'); st.add(TIME_MACHINE, ENE[0] - 20, SCENE_Y + 10, [0, 0, 128, 128]);
    group(st, [[P3, now(ctx, 16) - 3, -96], [P3, now(ctx, 17) - 3, 96]]);
    lay(st, [[now(ctx, 3), 10], all(ctx, 29)]);
  },
  6768: (st, ctx, quiet) => (quiet ? null : endingPicture(st)), // 集合絵表示
  6769: (st) => st.clear(), // 集合絵削除
};
for (const n of [6451, 6462]) D[n] = n === 6462 ? (st, ctx) => { wide(st, 'ピラフの別荘'); group(st, [at(SHU, -80), at(PILAF, 0), at(MAI, 80)]); outAll(st, ctx); } : D[6441];
D[6522] = D[6511];
D[6571] = D[6562];
D[6662] = D[6483]; // 界王様
for (const n of [6601, 6621]) D[n] = D[6574];
for (const n of [6612, 6613, 6614, 6615]) D[n] = D[6611];
for (const n of [6651, 6681, 6691, 6731]) D[n] = D[6631];
const BATTLES = [6516, 6566, 6616, 6641, 6671, 6701, 6721]; // battle_process: run by the flow below
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), BATTLES, [P3, E3, F3, CARD, TIME_MACHINE, ...Object.values(BG)]);

// ---------- the films (common events 92 / 94 / 95 / 69, map 108 event 88, z1field 6768) ----------
const SHIP = (k) => pic(`ZG_イベント_宇宙船_${String(k).padStart(2, '0')}.PNG`);
const SHIP_SIZE = { 中: pic('ZG_イベント_宇宙船_中.PNG'), 大: pic('ZG_イベント_宇宙船_大.PNG'), 特大: pic('ZG_イベント_宇宙船_特大.PNG') };
const sz = (p) => { const e = img(p); return e.ok ? [0, 0, e.im.width, e.im.height] : [0, 0, 0, 0]; };
const put = (st, sp, path, x, y) => { sp.path = path; sp.src = sz(path); sp.x = x; sp.y = y; };
async function film(env, fn, pics) {
  const { stage: st, ui } = env;
  if (!st.sprites) return;
  ui.dlg.hidden = true;
  await loadImages(pics);
  st.clear();
  await fn(st, ui);
  st.clear();
}
const FILMS = {
  // CE92 ZG宇宙船発進: the ship's pictures 02-20 at (64,0), then it flies off upward growing (中 / 大 / 特大, centred)
  shipLaunch: (env) => film(env, async (st, ui) => {
    const sp = screenPic(st, SHIP(2), 64, 0, sz(SHIP(2)));
    const step = async (k, w) => { put(st, sp, SHIP(k), 64, 0); await ui.wait(w); };
    await ui.wait(8);
    await step(2, 16); await step(3, 16); await step(4, 62);
    audio.se('Z2 宇宙船移動', 80);
    for (let k = 5; k <= 19; k++) await step(k, 2);
    await step(20, 1); put(st, sp, SHIP(4), 64, 0);
    const ship = screenPic(st, SHIP_SIZE.中, 0, 0, sz(SHIP_SIZE.中));
    let x = 306, y = 222;
    const fly = async (path, dy, until) => {
      for (;;) {
        y -= dy;
        const [, , w, h] = sz(path);
        put(st, ship, path, x - w / 2, y - h / 2);
        await ui.wait(1);
        if (ui.skipped || y <= until) break;
      }
    };
    await fly(SHIP_SIZE.中, 2, 152); x += 8;
    await fly(SHIP_SIZE.大, 4, 80); x += 8;
    await fly(SHIP_SIZE.特大, 4, -100);
  }, [SHIP(2), ...Array.from({ length: 19 }, (_, k) => SHIP(k + 2)), ...Object.values(SHIP_SIZE)]),
  // CE95 ZG宇宙船地球に到着: the ship comes down shrinking, the pictures 20-05 backwards, 04, 21 (landed), 04
  shipEarth: (env) => film(env, async (st, ui) => {
    const sp = screenPic(st, SHIP(2), 64, 0, sz(SHIP(2)));
    const step = async (k, w) => { put(st, sp, SHIP(k), 64, 0); await ui.wait(w); };
    await ui.wait(8);
    await step(2, 16); await step(3, 16); await step(4, 122);
    audio.se('Z2 宇宙船移動', 80);
    const ship = screenPic(st, SHIP_SIZE.特大, 0, 0, sz(SHIP_SIZE.特大));
    let x = 290, y = -40;
    const fly = async (path, dy, until) => {
      for (;;) {
        y += dy;
        await ui.wait(1);
        const [, , w, h] = sz(path);
        put(st, ship, path, x - w / 2, y - h / 2);
        if (ui.skipped || y >= until) break;
      }
    };
    await fly(SHIP_SIZE.特大, 4, 62); x += 8; y += 16;
    await fly(SHIP_SIZE.大, 4, 144); x += 8; y += 16;
    await fly(SHIP_SIZE.中, 2, 222);
    await ui.wait(1);
    st.sprites.splice(st.sprites.indexOf(ship), 1);
    await step(20, 1);
    for (let k = 19; k >= 5; k--) await step(k, 2);
    await step(4, 32); await step(21, 28); await step(4, 180);
  }, [...Array.from({ length: 20 }, (_, k) => SHIP(k + 2)), ...Object.values(SHIP_SIZE)]),
  // CE94 ZGハッチヒャック登場イベント: 769 frames — the body (hatc_touzyo 001-769) at (64,114) between the moving
  // backgrounds above / below (1-3, a frame each), the flashes at 453 / 457 / 461 (gone at 513: picture 10, the grey
  // 背景色_127 / 188 / 255 at 200 % added, under the body, picture 15), the message window from 33, the rumble stops at
  // 269, the hand's sound at 388
  hatch: async (env) => {
    const { stage: st, ui, quiet } = env;
    if (quiet || !st.sprites) return;
    const h = C(G).hatch, body = (k) => `${h.dir}ZG_イベント_ハッチ登場_${h.body[k - 1]}.png`;
    const top = (k) => `${h.dir}ZG_イベント_ハッチ登場_背景上_${k}.PNG`, low = (k) => `${h.dir}ZG_イベント_ハッチ登場_背景下_${k}.PNG`;
    ui.dlg.hidden = true;
    const first = Array.from({ length: 60 }, (_, k) => body(k + 1));
    await loadImages([...first, top(1), top(2), top(3), low(1), low(2), low(3)]);
    loadImages(h.body.map((_, k) => body(k + 1))); // (the rest comes in while it plays)
    st.clear();
    const flash = (n) => `${h.dir}ZG_イベント_ハッチ登場_背景色_${n}.PNG`;
    loadImages([127, 188, 255].map(flash));
    const T = screenPic(st, top(1), 0, 18, [0, 0, 640, 94]);
    const L = screenPic(st, low(1), 0, 274, [0, 0, 640, 60]);
    const FL = screenPic(st, flash(127), 0, 0, [0, 0, 320, 240], 0); // (over the backgrounds, under the body)
    Object.assign(FL, { zoom: 2, blend: 'add' });
    const B = screenPic(st, body(1), 64, 114, [0, 0, 512, 158]);
    let bg = 1;
    for (let k = 1; k <= 769 && !ui.skipped; k++) {
      const e = img(body(k));
      if (!e.ok) await e.p;
      B.path = body(k);
      T.path = top(bg); L.path = low(bg);
      if (k === 453 || k === 457 || k === 461) { FL.path = flash({ 453: 127, 457: 188, 461: 255 }[k]); FL.op = 255; }
      if (k === 513) FL.op = 0;
      if (k === 269) audio.stopBgs();
      if (k === 388) audio.se('ZG SE061', 80);
      await ui.wait(1);
      bg = bg >= 3 ? 1 : bg + 1;
    }
    st.clear();
  },
  // CE69 オゾットから巨大化へ変身 → CE45: the back (0,128), Broly's three auras (88,128), Ozotto's two bodies (64,128)
  ozotto: async (env) => {
    const { stage: st, ui, quiet } = env;
    if (quiet || !st.sprites) return;
    const back = pic('Z3_スーパーサイヤ人_バック.png'), auras = [1, 2, 3].map((k) => pic(`Z3_スーパーサイヤ人フルパワー_ブロリー_気${k}.png`));
    const bodies = [pic('Z3_オゾット変身_1.png'), pic('Z3_オゾット変身_2.png')];
    ui.dlg.hidden = true;
    await loadImages([back, ...auras, ...bodies]);
    st.clear();
    screenPic(st, back, 0, 128, [0, 0, 640, 224]);
    const A = auras.map((p) => screenPic(st, p, 88, 128, sz(p), 0));
    const Bs = bodies.map((p, k) => screenPic(st, p, 64, 128, sz(p), k ? 0 : 255));
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
          if (v33 >= every) { v33 = 0; v32 = 1 - v32; Bs[0].op = v32 ? 0 : 255; Bs[1].op = v32 ? 255 : 0; }
        }
      }
      Bs[0].op = 0; Bs[1].op = 255;
    }
    for (let c = 0; c < 20 && !ui.skipped; c++) for (let k = 0; k < 3; k++) await frame(k);
    ui.el.classList.remove('shake');
    st.clear();
  },
  // map 108 event 88 (switch 833): the pirate ship crosses the screen (-150 → 700 at y 280, its two pictures in turn)
  pirate: (env) => film(env, async (st, ui) => {
    audio.se('ZG SE062', 80);
    const a = pic('ZG_イベント_海賊船_1.PNG'), b = pic('ZG_イベント_海賊船_2.PNG');
    const sp = screenPic(st, a, -150, 280, sz(a));
    for (let x = -150, k = 1; x < 700 && !ui.skipped; x += 2, k = 3 - k) { put(st, sp, k === 1 ? a : b, x, 280); await ui.wait(1); }
    audio.seStop();
  }, [pic('ZG_イベント_海賊船_1.PNG'), pic('ZG_イベント_海賊船_2.PNG')]),
};
// z1field 6768: the Z4 group picture fades in over the black (2 a frame, 490 frames), turns into the ZG one (560
// frames), END fades in (490 frames), then a tap
async function endingPicture(st) {
  const ui = st.ui, z4 = pic('集合絵_修正.png'), zg = pic('集合絵_追加.png'), end = pic('文字_END.PNG');
  ui.dlg.hidden = true;
  await loadImages([z4, zg, end]);
  st.clear();
  const A = screenPic(st, z4, 0, 0, [0, 0, 640, 480], 0), B = screenPic(st, zg, 0, 0, [0, 0, 640, 480], 0);
  const E = screenPic(st, end, 320 - 76, 480 - 64, [0, 0, 152, 32], 0);
  for (let f = 0; f < 490 && !ui.skipped; f++) { A.op = Math.min(255, A.op + 2); await ui.wait(1); }
  for (let f = 0; f < 560 && !ui.skipped; f++) { A.op = Math.max(0, A.op - 1); B.op = Math.min(255, B.op + 1); await ui.wait(1); }
  A.op = 0; B.op = 255;
  for (let f = 0; f < 490 && !ui.skipped; f++) { E.op = Math.min(255, E.op + 2); await ui.wait(1); }
  E.op = 255;
  if (!ui.skipped) await new Promise((res) => { ui.onTap = () => { ui.onTap = null; res(); }; ui.onSkip.push(res); });
}

// ---------- the pages' own commands (tools/build_zg_c.py) ----------
let pending = null; // the battle a page ends in ({x: 'zgcFight'}: battle_process, then variable 95's page)
addNodes({
  zgcFight: async (node) => { pending = node.no; },
  zgcFilm: async (node, env) => FILMS[node.name] && FILMS[node.name](env),
  zgcSsOff: async (node, { ctx }) => { // CE159 超サイヤ人全解除
    if (!G) return;
    syncSuperSaiyan(G.world, G.state, Object.fromEntries(Object.keys(FORMS).map((no) => [no, false])));
    ctx.partyc = G.state.party.map((m) => m.id);
  },
});

// ---------- the flow ----------
const pg = (game, n) => Z3(game).pages[`zgc:${n}`];
const playPages = (game, ...ns) => playScenes(ns.map((n) => ({ nodes: pg(game, n) })), game.state);
// a page: variable 41 = its number while it plays; returns the battle it ends in (or null) and variable 41 as the
// page left it (6461: 6481, the next page by map 7)
async function page(game, n) {
  const s = game.state;
  pending = null;
  s.var[41] = n;
  await playPages(game, n);
  const out = { battle: pending, next: s.var[41] };
  pending = null;
  s.var[41] = 0;
  return out;
}

// the start (page 6421 is over: switches 1121 1137-1139 1141 1192 on, 1130 / 1135 by switch 438, variable 43 = 173,
// 1 / 2 = 4 / 33, 17 = 3, 324 = 74, map 105) — or back where ZG was left (state.flags.zgBack: door 9931 with switch 850,
// or 「從暗黑星球區域開始」 after the clear)
async function start(game) {
  const s = game.state;
  stop(game);
  if (ZGA.backToZg ? ZGA.backToZg(game, 'zgc') : backToZg(game)) return;
  for (const k of [1121, 1137, 1138, 1139, 1141, 1192]) s.sw[k] = true;
  s.sw[1130] = !s.sw[438]; s.sw[1135] = !!s.sw[438];
  s.sw[80] = false;
  Object.assign(s.var, { 43: 173, 1: 4, 2: 33, 17: 3, 324: 74, 41: 0 });
  s.var[42] = s.party[0].id;
  toField(game, C(game).start);
}
// (without src/zg_a.js) door 9931 / page 6000 switch 850: the ZG party back (CE157 / CE168), everyone up and recovered,
// variables 43 / 17 from the way back, then where ZG was left
function backToZg(game) {
  const s = game.state, k = s.flags.zgBack;
  if (!k || k.key !== 'zgc') return false;
  delete s.flags.zgBack;
  if (k.party) { s.flags.zgParty = partyOf(s); putParty(game, k); }
  for (const m of s.party) heal(m);
  for (const m of Object.values(s.bench || {})) heal(m);
  s.sw[466] = true; s.var[301] = 2; s.sw[19] = false; s.sw[78] = false;
  Object.assign(s.var, { 43: k.v43, 17: k.v17, 42: s.party[0].id });
  toField(game, { map: k.map, x: k.x, y: k.y });
  return true;
}
const partyOf = (s) => ({ party: s.party.map((m) => m.id), ss: { ...(s.ss || {}) } });
function putParty(game, k) { // CE157 / CE168: that party, its Super Saiyans as they were
  syncSuperSaiyan(game.world, game.state, Object.fromEntries(Object.keys(FORMS).map((no) => [no, !!(k.ss || {})[no]])));
  party(game, k.party);
}

// a story battle: the extra-attack switches the page set (25 the last one standing, 26 30 % HP, 27 40 %, 28 two
// standing, 29 50 %: all.rb 140508) and the battle's own background ($Battle_MapID); they are cleared afterwards
async function story(game, no, at) {
  const s = game.state, b = Z3(game).battles[no];
  const opts = { alone: !!s.sw[25], hp30: !!s.sw[26], hp40: !!s.sw[27], two: !!s.sw[28], hp50: !!s.sw[29], backdrop: b.backdrop };
  const r = await fight(game, String(no), at, opts);
  G = game;
  if (r !== 'lose') for (const k of [25, 26, 27, 28, 29, 128]) s.sw[k] = false;
  return r;
}
// a page with a battle at its end, then the page after it (variable 95), and so on until a page has none
const AFTER = { 6516: 6521, 6566: 6571, 6616: 6621, 6641: 6651, 6671: 6681, 6701: 6711, 6721: 6731 };
async function run(game, n) {
  const { battle, next } = await page(game, n);
  if (battle) return battleThen(game, battle);
  return afterPage(game, n, next);
}
async function battleThen(game, b) {
  if (await story(game, b, String(b)) === 'lose') return;
  return run(game, AFTER[b]);
}
// where each page goes when it is over (its last transfer)
async function afterPage(game, n, next) {
  const s = game.state, c = C(game);
  if (n === 6461 && next === 6481) return run(game, 6481);
  if (n === 6481) { s.var[42] = s.party[0].id; return toField(game, c.map108); }
  if (n === 6491 && s.sw[833] && !s.sw[834]) { // (saved here: a load picks the autorun up again)
    s.flags.z3At = { ch: 'zgc', at: 'pirate' };
    game.save(true);
    return pirate(game);
  }
  if (n === 6531) { s.var[42] = s.party[0].id; return toField(game, c.map109); }
  if (n === 6571) { s.var[42] = s.party[0].id; return toField(game, c.map110); }
  if (n === 6731) return run(game, 6751);
  if (n === 6751) return run(game, 6761);
  if (n === 6761) return toHall(game, true);
  return toField(game);
}

// map 108 event 88 (switch 833 on, autorun): the pirate ship → switch 834 → page 6531 (exported for ?dev=vizpirate)
export async function pirate(game) {
  const s = game.state;
  stop(game);
  await shipOverMap(game);
  s.sw[834] = true;
  return run(game, 6531);
}
// the ship's two pictures in turn over map 108 itself (the original shows them as pictures on the field: -150 → 700 at
// y 280 of the 640×480 screen, 2 px a frame), placed from the player as the original's screen has him in its middle
async function shipOverMap(game) {
  const s = game.state, a = pic('ZG_イベント_海賊船_1.PNG'), b = pic('ZG_イベント_海賊船_2.PNG');
  await loadImages([a, b]);
  game.startField();
  const f = game.field;
  f.paused = true;
  game.busy = true;
  f.leave();
  let x = -150, k = 1;
  const draw0 = f.draw.bind(f);
  f.draw = () => {
    draw0();
    const c = view.begin(), W = f.map.w * 32, H = f.map.h * 32; // (the camera of src/field.js)
    let cx = s.x - view.w / 2, cy = s.y - view.h * 0.45;
    cx = Math.round(W <= view.w ? (W - view.w) / 2 : Math.max(0, Math.min(W - view.w, cx)));
    cy = Math.round(H <= view.h ? (H - view.h) / 2 : Math.max(-f.hudPad(), Math.min(H - view.h, cy)));
    const e = img(k === 1 ? a : b);
    if (e.ok) c.drawImage(e.im, Math.round(s.x - cx + x - 320), Math.round(s.y - cy + 280 - 240));
  };
  audio.se('ZG SE062', 80);
  for (; x < 700; x += 2, k = 3 - k) await new Promise((res) => setTimeout(res, 1000 / 60));
  audio.seStop();
  f.draw = draw0;
}

// page 9932 (ＺＧ⇒時の間): CE182 (the area cards), CE157 / CE168 (the 時之間's party back: state.flags.zgParty), switch
// 78 on, 19 off, variables 17 = 0, 43 = 999 → the ZG hall (96: 18,3). Mid-story (a 時の間へ移動 square) CE171 keeps where
// the party was (variables 371-375 and state.flags.zgBack, the ZG party with it) for door 9931 (switch 850 still on);
// Event_Check moves the place one off the square (105 / 108: y − 1, 109: y + 1, 110: x + 1)
async function toHall(game, done) {
  const s = game.state;
  stop(game);
  if (!done) {
    if (s.map === '110') s.x += 32;
    const dy = { 105: -1, 108: -1, 109: 1 }[s.map] || 0;
    if (ZGA.leaveZg) return ZGA.leaveZg(game, dy);
    const x = Math.floor(s.x / 32), y = Math.floor(s.y / 32) + dy;
    s.flags.zgBack = { key: 'zgc', map: s.map, x, y, v43: s.var[43] || 0, v17: s.var[17] || 0, ...partyOf(s) };
    Object.assign(s.var, { 371: x, 372: y, 373: Number(s.map), 374: s.var[43] || 0, 375: s.var[17] || 0 });
    if (s.flags.zgParty) putParty(game, s.flags.zgParty);
  } else if (ZGA.restoreParty) ZGA.restoreParty(game);
  else if (s.flags.zgParty) { putParty(game, s.flags.zgParty); delete s.flags.zgParty; }
  eventCard(s, 37, -99);
  eventCard(s, 124, -99);
  s.sw[78] = true; s.sw[19] = false;
  Object.assign(s.var, { 17: 0, 1: 18, 2: 3, 43: 999, 42: s.party[0].id });
  audio.se('Z1 入る');
  endTrStory(game, C(game).hall);
}

// 140_Field_Main.rb: map 105 has 3-6 enemies while variable 43 = 173, map 110 another set once switch 845 is on
// (world.areas is static: brought in line with the state whenever the HUD asks for the goal)
function syncAreas(world, s) {
  const c = world.z3.zgc, b = world.areas['110'], a = world.areas['105'];
  if (b) { if (!b.base) b.base = { pool: b.pool, n: b.n }; Object.assign(b, s.sw[845] ? c.late110 : b.base); }
  if (a) { if (!a.base) a.base = a.n; a.n = s.var[43] === 173 ? c.n105 : a.base; }
}

// the field battles' background: set_battle_map (all.rb 165938, variable 301 = 2) with its ZG tiles — the ground tile
// under the party, the tile on layer 3, the map event standing there (get_event_id_and_graphic: the last one); the
// sea by variable 17 (3 ZG, 4 氷の大陸, 5 クーン, 6 オウター). Asked first in the 時之間 (src/timeroom.js registerBackdrop)
const RUINS = [930, 922, 807, 938, 799, 931, 936, 937, 944, 954, 953, 952, 925, 932, 933, 955, 939, 923, 940, 956, 948];
function zgBackdrop(game) {
  const s = game.state, m = game.world.maps[s.map];
  const tx = Math.floor(s.x / 32), ty = Math.floor(s.y / 32), i = ty * m.w + tx;
  const tile = m.layers[0][i], top = (m.layers[2] || [])[i] || 0;
  let info = null;
  for (const [x, y, pages] of m.ev || []) if (x === tx && y === ty) info = Array.isArray(pages[0][1]) ? pages[0][1] : null;
  const ev = (name, k, dir) => info && info[0] === name && info[1] === k && info[2] === dir;
  const v17 = s.var[17] || 0;
  let row;
  if (tile === 1603 || tile === 1604) row = 11; // グランドアポロン
  else if (tile === 1605) row = info ? (ev('animap1', 3, 8) ? 23 : 24) : RUINS.includes(top) ? 25 : 24; // クーン星 砂漠・廃墟・森
  else if (tile === 1606) row = 16; // 砂漠
  else if (tile === 1607) row = info ? (ev('animap1', 2, 4) ? 15 : 14) : top === 627 ? 12 : 14; // 平原・山・森
  else if (tile === 1611) row = info ? (ev('animap1', 4, 2) ? 22 : 20) : top === 629 ? 21 : 20; // オウター星
  else if (tile === 1612) row = 18; // 暗黒惑星
  else if (tile === 1552 || tile === 1555 || tile === 1553 || tile === 1554) return null; // (the Z3 tiles: src/z3.js)
  else row = { 3: 13, 4: 17, 5: 36, 6: 19 }[v17] ?? ((s.var[101] || 0) === 0 ? 3 : 8); // 海
  return `bg/z3_battle_${row}.png`;
}
for (const m of MAPS) registerBackdrop(m, zgBackdrop);

// カード特殊 (26,13): the card square of variable 44 = 50
async function card50(game, poi) {
  const s = game.state;
  spotTally(s, { effect: 'shop' });
  game.field.spent = poi;
  s.var[44] = 50;
  await cardSquare(game);
  s.var[44] = 0;
  game.save(true);
  toast('已存檔');
}

function spot(game, poi) {
  G = game;
  if (poi.page === 'card50') return card50(game, poi);
  stop(game);
  if (poi.page === 9932) return toHall(game, false);
  return run(game, poi.page);
}
function boss(game, b) {
  if (game.busy || !b || !/^guard/.test(b.key)) return null;
  stop(game);
  return run(game, b.page);
}
// a save made right before a story battle
function resume(game, at) {
  G = game;
  if (at && at.at === 'pirate') { stop(game); return pirate(game); }
  const no = Number(at && at.at);
  if (BATTLES.includes(no)) return battleThen(game, no);
  return toField(game);
}
function goal(world, s) {
  syncAreas(world, s);
  const sw = s.sw || {};
  if (s.map === '105') return !sw[826] ? '目標：先去村子看看' : !sw[827] ? '目標：前往東北方的礦山' : '目標：前往南方的別墅追皮拉夫他們';
  if (s.map === '108') {
    return !sw[829] ? '目標：前往東南方的派瑞之城打聽' : !sw[830] ? '目標：前往預言者之塔' : !sw[831] ? '目標：前往西北方的洞穴找護身符'
      : !sw[832] ? '目標：回到預言者那裡' : '目標：前往派瑞之城換星之貝殼';
  }
  if (s.map === '109') {
    return !sw[835] ? '目標：前往北方的海盜船' : !sw[836] ? '目標：前往西方湖中的庫阿鎮' : !sw[837] ? '目標：前往東南方的漩渦找海精靈'
      : !sw[838] ? '目標：回海盜船問讓海精靈哭的方法' : '目標：帶著淚之書前往漩渦';
  }
  if (s.map === '110') {
    const left = [840, 841, 842, 843, 844].filter((k) => !sw[k]).length;
    return left ? `目標：打倒護衛機器人（還有 ${left} 個）` : '目標：前往中央的怨念增幅裝置';
  }
  return '';
}

// ---------- development: index.html?dev=zgc (map 105, page 6421 over) / zgc108 (map 108) / zgc109 (map 109) /
// zgc110 (map 110) / zgcboss (map 110, the robots beaten, by the device) / zgcend (page 6761 → the ZG hall)
// (&timer for a hidden pane) ----------
// a plausible state at the hand-over from the middle part: the levels of the ZG party ($partyc of page 6391), the
// 時之間 as page 6000 leaves it (switch 466, variable 301 = 2, 850 on, the 時之間's party kept)
const LV = { 3: 70, 4: 66, 5: 66, 6: 58, 7: 55, 8: 57, 9: 54, 10: 50, 12: 70, 16: 66, 17: 66, 24: 52, 15: 50, 25: 66, 21: 62,
  22: 62, 23: 62, 27: 60, 28: 60, 29: 60, 30: 60 };
function dev(game, step) {
  if (!/^zgc(108|109|110|boss|end)?$/.test(step)) return false;
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
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, z3: 'zgc' });
  for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 459, 570, 580, 581, 585, 598, 521, 545, 429, 532, 421, 533,
    561, 563, 564, 566, 568, 381, 466, 850, 470]) s.sw[n] = true;
  s.var[40] = 2; s.var[301] = 2;
  s.cardiMax = 10;
  s.zeni = 50000;
  s.party = [];
  party(game, [3, 5, 4, 12, 17, 6]); // the 時之間's party (kept by the first part, page 6001 CE166: state.flags.zgParty)
  s.flags.tr = { back: { map: '48', x: 44 * 32 + 16, y: 29 * 32 + 16 }, v43: 0, v17: 2, party: s.party.map((m) => m.id), ss: {} };
  s.flags.trStory = { main: 'done' };
  s.flags.zgParty = { party: s.party.map((m) => m.id), ss: {} };
  party(game, C(game).party);
  moveTo(s, C(game).start);
  await applyEra(game);
  s.hand = newHand(w);
  game.startField();
  if (step === 'zgc') return start(game);
  stop(game);
  const after105 = () => { Object.assign(s.sw, { 826: true, 827: true, 828: true }); };
  after105();
  for (const k of [1142, 1143, 1144, 1131, 1169, 1170, 1174, 1175, 1176, 1177]) s.sw[k] = true;
  Object.assign(s.var, { 43: 175, 17: 5, 324: 76, 41: 0, 42: s.party[0].id });
  if (step === 'zgc108') return toField(game, C(game).map108);
  Object.assign(s.sw, { 829: true, 830: true, 831: true, 832: true, 833: true, 834: true, 720: true });
  for (const k of [1140, 1180, 1181, 1182, 1183, 1145, 1185]) s.sw[k] = true;
  Object.assign(s.var, { 43: 181, 17: 6, 324: 65 });
  if (step === 'zgc109') return toField(game, C(game).map109);
  Object.assign(s.sw, { 835: true, 836: true, 837: true, 838: true, 839: true, 718: true });
  for (const k of [1144, 1162, 1163, 1164, 1168, 1178, 1179]) s.sw[k] = true;
  Object.assign(s.var, { 43: 186, 17: 6, 324: 78 });
  if (step === 'zgc110') return toField(game, C(game).map110);
  Object.assign(s.sw, { 840: true, 841: true, 842: true, 843: true, 844: true, 845: true, 1129: true, 1165: true, 1166: true, 1167: true, 1149: true });
  s.var[324] = 83;
  if (step === 'zgcboss') return toField(game, { map: '110', x: 28, y: 16 });
  Object.assign(s.sw, { 846: true, 847: true, 848: true, 849: true, 199: true, 195: true, 198: true });
  s.var[324] = 70;
  moveTo(s, { map: '110', x: 28, y: 15 });
  return run(game, 6761);
}

registerZ3('zgc', { maps: MAPS, start, spot, boss, resume, dev, goal });

// Z4 第一章 沙魯誕生的秘密（地圖 42・44・45）— driven by world.z3 (tools/build_z4a.py; docs/z4-plan.md):
//   page 2001: あらすじ, Piccolo tells of Cell, Cell at Ginger Town, Vegeta flies off → map 42: the basement of
//   Dr. Gero's lab (2011) → Willow and the bio-warriors again (battle 2015) → 2016: Capsule Corp., Piccolo after Cell,
//   Goku wakes up, Vegeta and Trunks to the time chamber → map 44: the training (2071, 流派一致修行 pattern 1:
//   Super Vegeta and Super Trunks, src/z3train.js) → 2081: the androids at the Kame House, Piccolo leads them off →
//   map 45 (the flight, a short film here) → variable 41 = 2091 → 第二章 (src/z4b.js).
// Map 44 (精神と時の部屋) is shared by Z4 chapters 1 / 3 / 5: its training spot is { chapter: 'z4', page: 'htc' },
// handled by whichever chapter is being played (variable 121 says who trains).
import { audio, img } from './core.js?v=20261108-0950';
import { addScenes } from './cutscene.js?v=20261108-0950';
import { makeMember, applyLevel } from './party.js?v=20261108-0950';
import { superSaiyan } from './supersaiyan.js?v=20261108-0950';
import { newHand } from './battle.js?v=20261108-0950';
import { applyEra } from './era.js?v=20261108-0950';
import { ryuhaPairTraining } from './z3train.js?v=20261108-0950';
import {
  registerZ3, nextZ3, Z3, begin, play, fight, toField, party, heal, card, moveTo,
} from './z3.js?v=20261108-0950';

const MAPS = ['42', '44', '45'];

// ---------- the scenes (z1field 2000-2084: 143_Event_Main.rb all.rb 175391-175560) ----------
// (the original's file names: .PNG or .png as on disk)
const PIC = (n) => `Graphics/Pictures/${n}`;
const P3 = PIC('Z3_顔味方.PNG'), E3 = PIC('Z3_顔イベント.PNG'), F3 = PIC('Z3_顔敵.PNG'), F1 = PIC('Z1_顔敵.PNG'), CARD = PIC('顔カード.PNG');
const wide = (path) => ({ big: [PIC(path), 64, 46, [0, 0, 512, 128]] }); // a 512×128 scene (@z1_scrollscenex)
const GRASS = wide('Z3_背景_草原.png'), HILL = wide('Z3_背景_山.PNG'), TOWN = wide('Z3_背景_街.png'), SHIP = wide('ZG_背景_宇宙船.PNG');
const KAME = wide('ZG_背景_亀仙人の家.PNG'), APOLLON = wide('ZG_背景_グランドアポロン.PNG'), LOOKOUT = wide('Z3_背景_天界.PNG');
const SKY = PIC('Z1_背景_スクロール_空.PNG'), PLANE = PIC('Z1_イベント_飛行機.PNG');
const PLANE_SCENE = { bigs: [[SKY, 64, 46, [0, 0, 512, 128]], [PLANE, 64 + 224, 46 + 24, [0, 0, 60, 52]]], out: true };
const SEA = PIC('Z1_背景_海.PNG'), HOUSE = PIC('Z1_背景_カメハウス.PNG'); // 192×128 scenes (@z1_scenex)
const GOKU = 0, PICCOLO = 1, GOHAN = 2, VEGETA = 9, TRUNKS = 14; // Z3_顔味方 rows
const CHICHI = [E3, 17], ROSHI = (dx, dy = 0) => [CARD, 9, dx, dy, 0, 2]; // 顔カード column 2 = Z3
const SCENES = {
  2000: { out: true }, // キャラクターのみ表示
  2001: { ...GRASS, foe: [P3, PICCOLO], out: true }, // セル編開始 Z戦士たち
  2002: { big: [PIC('ZD_ジンジャータウン.PNG'), 256, 46, [0, 0, 128, 128]], faces: [[F3, 27, 0]] }, // セルジンジャータウン
  2011: { ...HILL, out: true }, // Dr.ゲロ研究所外
  2012: { ...SHIP, out: true }, // 研究所内部
  2013: { ...SHIP, foe: [E3, 50], out: true }, // セル幼虫
  2014: { ...HILL, out: true, adds: [[F1, 20, 0, -64], [F1, 23, -64, 0], [F1, 24, 0, 0], [F1, 22, 64, 0]] }, // ウィローたち
  2016: { ...wide('Z3_背景_カプセルコーポレーション.PNG'), adds: [[CARD, 36, 48, 0, 0, 2], [CARD, 8, -48, 0, 0, 2]], out: true },
  2021: { ...TOWN, out: true }, // ピッコロ、セルを追いかける
  2022: { ...TOWN, foe: [F3, 27] },
  2023: { ...KAME, out: true }, // カメハウス内TV視聴
  2024: PLANE_SCENE, // 飛行機内
  2031: { ...KAME, foe: CHICHI }, // 悟空復活 チチ
  2032: { pic: SEA, foe: [P3, GOKU], faces: [[E3, 17, 0]] },
  2033: { pic: SEA, foe: [P3, GOKU], faces: [[E3, 17, -48], [CARD, 9, 48, 0, 2]] },
  2034: { ...KAME, adds: [[E3, 17, -48, 0], ROSHI(48)], faces: [[P3, GOKU, 0]] },
  2035: { ...KAME, adds: [[E3, 17, -48, 0], ROSHI(48)] }, // 瞬間移動後
  2041: { foe: [P3, GOKU], out: true }, // 飛行機へ瞬間移動
  2042: { adds: [[P3, GOKU, -32, 0], [P3, GOHAN, 32, 0]], out: true },
  2051: { ...APOLLON, faces: [[P3, TRUNKS, 0]] }, // トランクスの元へ
  2052: { ...APOLLON, faces: [[P3, TRUNKS, 0]], adds: [[P3, GOKU, -32, 0], [P3, GOHAN, 32, 0]] },
  2053: { ...APOLLON, faces: [[P3, GOKU, 0]], foe: [P3, VEGETA] }, // ベジータの元へ
  2054: { ...TOWN, adds: [[F3, 25, -96, 0], [F3, 24, 0, 0], [F3, 26, 96, 0]] }, // 17号たち
  2061: { ...LOOKOUT, adds: [[P3, VEGETA, -48, 0], [P3, TRUNKS, 48, 0]], faces: [[P3, GOKU, -32], [P3, GOHAN, 32]] },
  2062: { ...wide('Z3_背景_精神と時の部屋.png'), out: true },
  2081: PLANE_SCENE, // 精神と時の部屋修行後
  2082: { ...KAME, out: true }, // カメハウスでTV
  2083: { pic: SEA, foe: [F3, 25], adds: [[F3, 24, -64, 0], [F3, 26, 64, 0]], out: true }, // 人造人間到着
  2084: { pic: HOUSE, adds: [[E3, 17, -32, 0], ROSHI(32)], out: true },
};
addScenes(SCENES, [2015, 2071]);

const C = (game) => Z3(game).z4a;

// ---------- the chapter ----------
// page 2001 (after the Z3 ending, variable 41 = 2001)
async function start(game) {
  const s = game.state;
  begin(game);
  s.flags.z3 = 'z4a';
  s.flags.z3At = null;
  await card(Z3(game).titles.z4a, 2200);
  s.var[41] = 2001;
  s.var[84] = 1; // オープニング変更 (Map007 event 5 page 56: the Cell Games opening, src/opening_pick.js)
  await play(game, '2001'); // ends: variable 43 = 81; $partyc = Krillin, Trunks, Yamcha, Tien, Chiaotzu, Chi-Chi, Roshi
  const c = C(game);
  party(game, c.start42.party);
  for (const m of s.party) heal(m);
  s.var[41] = 0;
  toField(game, c.start42);
}

// map 42: the basement (19,9) → 2011 → Willow (2015) → 2016 → map 44; map 44: the training spot
function spot(game, poi) {
  if (poi.page === 2011) return lab(game);
  if (poi.page === 'htc') return htc(game);
  return null;
}
async function lab(game) {
  const s = game.state;
  begin(game);
  s.var[41] = 2011;
  await play(game, '2011', 0);
  return willow(game);
}
async function willow(game) {
  const s = game.state;
  if (await fight(game, '2015', 'willow') !== 'win') return;
  s.var[41] = 2016;
  await play(game, '2016'); // ends: $partyc = [12,17], variable 43 + 1, variable 121 = 1
  const c = C(game);
  party(game, c.start44.party);
  for (const m of s.party) heal(m);
  s.var[41] = 0;
  toField(game, c.start44);
}
// map 44 (15,4), variable 121 = 1: page 2071 (CE40 + Scene_Db_Ryuha_Pair_Training) → variable 41 + 10 → 2081
async function htc(game) {
  const s = game.state;
  if (s.var[121] !== 1) return null;
  begin(game);
  s.flags.z3At = { ch: 'z4a', at: 'htc' };
  game.save(true);
  s.var[41] = 2071;
  await ryuhaPairTraining(game, { pattern: 1 });
  begin(game);
  return after2081(game);
}
async function after2081(game) {
  const s = game.state;
  s.var[41] = 2081;
  await play(game, '2081'); // the androids at the Kame House; Piccolo leads them off
  await flight(game); // map 45
  party(game, C(game).after2081.filter((id) => id !== 4));
  s.var[41] = 2091; // map 45 event 15
  return nextZ3(game, 'z4a');
}

// map 45 (Z4 ピッコロと17号たち移動): its event 15 moves Piccolo and Nos. 17, 16, 18 across the mountains together
// (move routes over the map). Here: the same four flying over the scrolling sky, in the cutscene stage.
const FLY = (sheet) => `Graphics/Characters/${sheet}.png`;
let FLIGHT = null; // world.z3.z4a.flight while the film plays
addScenes({
  9045: {
    draw: async (st, ctx, quiet) => {
      if (quiet || !FLIGHT) return;
      const who = [FLIGHT.piccolo, FLIGHT.a17, FLIGHT.a16, FLIGHT.a18];
      audio.se('Z1 飛ぶ', 80);
      for (let t = 0; t <= 120 && !st.ui.skipped; t++) {
        st.clear();
        st.add(SKY, 64, 46, [Math.max(0, 512 - t * 4), 0, 512, 128]);
        who.forEach(([sheet, k], i) => {
          const pat = [0, 1, 2, 1][Math.floor(t / 6) % 4];
          const x = 64 + 520 - t * 5 + i * 36 + (i ? 40 : 0), y = 46 + 30 + (i % 2) * 22 + Math.round(Math.sin((t + i * 7) / 6) * 2);
          st.add(FLY(sheet), x, y, [((k % 4) * 3 + pat) * 48, (Math.floor(k / 4) * 4 + 1) * 48, 48, 48]); // row 1: facing left
        });
        await st.ui.wait(1);
      }
      st.clear();
    },
  },
});
async function flight(game) {
  const s = game.state, keep = s.var[41];
  FLIGHT = C(game).flight;
  await Promise.all(Object.values(FLIGHT).map(([sheet]) => img(FLY(sheet)).p));
  s.var[41] = 9045;
  await play(game, 'flight');
  s.var[41] = keep;
}

function resume(game, at) {
  if (at.at === 'willow') return willow(game);
  if (at.at === 'htc') { game.state.var[121] = 1; return htc(game); }
  toField(game);
}

// ---------- development: index.html?dev=z4 / z4a / z4a42 / z4a44 (&timer for a hidden pane) ----------
// a plausible state at the end of Z3 (variable 41 = 2001)
const LV = { 3: 58, 4: 56, 5: 52, 6: 48, 7: 45, 8: 47, 9: 44, 10: 40, 24: 42, 12: 57, 17: 55 };
function dev(game, step) {
  if (!['z4', 'z4a', 'z4a42', 'z4a44'].includes(step)) return false;
  const w = game.world, s = game.newState();
  game.state = s;
  s.bench = {};
  for (const id of Object.keys(LV).map(Number)) {
    if (!w.actors[id]) continue;
    const m = makeMember(w, id);
    m.level = LV[id];
    m.exp = w.actors[id].exp[m.level];
    m.maxLv = m.level;
    applyLevel(w, m);
    heal(m);
    s.bench[id] = m;
  }
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, willow: 'done', z2a: 'done', z2b: 'done', z3: 'z4a' });
  Object.assign(s.sw, { 38: true, 39: true, 156: true, 381: true, 483: true });
  s.var[40] = 2;
  s.cardiMax = 10;
  s.zeni = 30000;
  s.party = [];
  party(game, [4]);
  superSaiyan(w, s, 1, true);
  superSaiyan(w, s, 3, true); // Vegeta (since the Cooler fight)
  moveTo(s, { map: '42', x: 67, y: 46 });
  s.hand = newHand(w);
  applyEra(game);
  if (step === 'z4' || step === 'z4a') {
    s.var[41] = 2001;
    game.startField();
    start(game);
    return true;
  }
  const c = C(game);
  s.var[43] = step === 'z4a44' ? 82 : 81;
  if (step === 'z4a44') {
    s.var[121] = 1;
    party(game, c.start44.party);
    moveTo(s, c.start44);
  } else {
    party(game, c.start42.party);
    moveTo(s, c.start42);
  }
  game.startField();
  begin(game);
  toField(game);
  return true;
}

registerZ3('z4a', { maps: MAPS, start, spot, resume, dev });

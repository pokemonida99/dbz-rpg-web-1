// Z3 第一章 集龍珠！（地圖 33・34・35）— driven by world.z3 (tools/build_z3a.py; docs/z3-plan.md):
//   page 1100: 前情提要, Goku alone (a Super Saiyan) against Frieza — battle 1107 (variable 81 = 20: the party's damage
//   ×20) → 1151: Namek blows up, Earth, Roshi and Chi-Chi come along → map 33: the town, the glasses rock (1-star ball),
//   the herb man and the dinosaur (5-star ball), the mine and the gatekeeper (dynamite), the base (Kraz, battle 1197) →
//   1200: four balls → Vegeta alone on map 34: the barrier and its three generators, the base (Ear, battle 1216) →
//   1217: the others come, seven balls → map 35 Porunga (two wishes) → variable 41 = 1440 → 第二章 (src/z3b.js).
import { addScenes, addNodes } from './cutscene.js?v=20261102-2311';
import { makeMember, applyLevel } from './party.js?v=20261102-2311';
import { eventCard } from './items.js?v=20261102-2311';
import { ensure } from './growth.js?v=20261102-2311';
import { superSaiyan } from './supersaiyan.js?v=20261102-2311';
import { newHand } from './battle.js?v=20261102-2311';
import {
  registerZ3, startZ3, nextZ3, Z3, begin, play, fight, toField, party, member, heal, card, moveTo,
} from './z3.js?v=20261102-2311';

const MAPS = ['33', '34', '35'];

// ---------- the scenes (z1field 1100-1220, 1591: 143_Event_Main.rb all.rb 173505-173870) ----------
// The Z3 scene pictures are 512×128 (drawn at @z1_scrollscenex like the Z1 scroll scenes).
const pic = (n) => `Graphics/Pictures/${n}.PNG`;
const LOWER = new Set(["ナメック星崩壊", "洞窟", "草原", "街"]); // (these files end in .png)
const BG = (n) => ({ big: [LOWER.has(n) ? `Graphics/Pictures/Z3_背景_${n}.png` : pic(`Z3_背景_${n}`), 64, 46, [0, 0, 512, 128]] });
const P3 = pic('Z3_顔味方'), E3 = pic('Z3_顔イベント'), F3 = pic('Z3_顔敵'), CARD = pic('顔カード');
const GOKU_SS = 11, GOKU = 0, PICCOLO = 1, GOHAN = 2, KRILLIN = 3, VEGETA = 9, CHICHI = 7, ROSHI = 21; // Z3_顔味方 rows
const FRIEZA = [F3, 1];
const card3 = (row) => [CARD, row, 0, 2]; // a 顔カード face in the scene, column 2 = Z3
const up = { next: '+' };
const SCENES = {
  1100: {}, // 背景色表示
  1101: { ...BG('ナメック星'), foe: FRIEZA, ...up },
  1102: { ...BG('ナメック星'), foe: [P3, VEGETA], ...up },
  1103: { ...BG('ナメック星'), foe: card3(31), ...up }, // ポルンガ
  1104: { ...BG('ナメック星'), foe: [P3, PICCOLO], adds: [[P3, GOKU_SS, -96, 0], [F3, 1, 96, 0]], ...up },
  1105: { fadeout: true, ...BG('界王星'), foe: card3(16), adds: [[CARD, 25, -96, 0, 0, 2], [CARD, 31, 96, 0, 0, 2]], ...up, fadein: true },
  1106: { ...BG('ナメック星崩壊'), adds: [[P3, GOKU_SS, -48, 0], [F3, 1, 48, 0]], ...up },
  1151: { ...BG('ナメック星崩壊'), foe: [P3, GOKU_SS], ...up },
  1152: { ...BG('宇宙船_内部'), foe: [P3, GOKU_SS], ...up },
  1153: { ...BG('宇宙'), foe: FRIEZA, ...up },
  1154: { ...BG('宇宙'), foe: [P3, GOKU], ...up },
  1155: { ...BG('草原'), ...up, fadein: true },
  1156: { ...BG('草原'), adds: [[P3, GOHAN, -96, 0], [P3, PICCOLO, 0, 0], [P3, KRILLIN, 96, 0]], ...up },
  1157: { ...BG('界王星'), foe: card3(25), ...up }, // 界王様
  1158: { ...BG('草原'), faces: [[P3, GOHAN, -96], [P3, PICCOLO, 0], [P3, KRILLIN, 96]], adds: [[P3, CHICHI, 64, 0], [P3, ROSHI, -64, 0]] },
  1591: { foe: [CARD, 49], out: true }, // ウミガメ
  1160: { ...BG('街'), out: true }, // 最初の街
  1161: { ...BG('街'), out: true },
  1162: { ...BG('街'), foe: [E3, 1], out: true }, // 少年
  1163: { ...BG('街'), foe: [E3, 2], out: true }, // 謎の男
  1164: { ...BG('街'), foe: [E3, 4], out: true }, // 薬剤師
  1170: { ...BG('洞窟'), out: true },
  1171: { ...BG('洞窟'), foe: card3(1), out: true }, // 一星球
  1180: { ...BG('家'), foe: [E3, 0], out: true }, // オジサン
  1181: { ...BG('草原'), foe: [E3, 3], out: true }, // 恐竜
  1182: { ...BG('草原'), out: true }, // ダイナマイト設置場所
  1183: { ...BG('草原'), foe: [E3, 1] }, // 門番少年 (Ｚ戦士出力なし)
  1185: { ...BG('洞窟'), foe: [E3, 2], out: true }, // 謎のオジサン
  1190: { ...BG('草原'), foe: [E3, 1], out: true }, // 門番少年
  1195: { ...BG('基地'), out: true }, // 最初の敵の基地
  1196: { ...BG('基地'), foe: [F3, 31], out: true }, // クラズ
  1200: { ...BG('基地'), adds: [[CARD, 2, -144, 0, 0, 2], [CARD, 3, -48, 0, 0, 2], [CARD, 4, 48, 0, 0, 2], [CARD, 6, 144, 0, 0, 2]], out: true },
  1201: { ...BG('雪山') },
  1202: { ...BG('雪山'), out: true },
  1210: { ...BG('雪山'), out: true }, 1211: { ...BG('雪山'), out: true }, 1212: { ...BG('雪山'), out: true }, 1213: { ...BG('雪山'), out: true },
  1215: { ...BG('基地'), foe: [F3, 5], out: true }, // イール
  1217: { ...BG('基地'), out: true },
  1218: { ...BG('基地'), foe: [P3, VEGETA], out: true },
  1219: { ...BG('基地'), out: true },
  1220: { ...BG('カプセルコーポレーション'), foe: [E3, 5], adds: [[CARD, 30, -96, 0, 0, 2], [CARD, 14, 96, 0, 0, 2]], out: true }, // ブルマ、ムーリー、デンデ
};
addScenes(SCENES, [1107, 1197, 1216]);

// what map 35's wishes give that the story nodes don't: ZP (#ZP取得: $zp[x] += 150 for everyone); the defeat counts
// of CE227 (バーダック初回加入調整)
let gameRef = null;
addNodes({
  zp: async (node) => {
    const s = gameRef && gameRef.state;
    if (!s) return;
    for (const m of [...s.party, ...Object.values(s.bench || {})]) ensure(m).zp += node.n;
  },
  defeats: async (node) => {
    const s = gameRef && gameRef.state;
    if (!s) return;
    s.defeats = s.defeats || {};
    s.defeats[node.id] = (s.defeats[node.id] || 0) + node.n;
  },
});

const C = (game) => Z3(game).z3a;
const addUses = (s, map) => {
  s.skillLv = s.skillLv || {};
  for (const [k, n] of Object.entries(map)) s.skillLv[k] = Math.min(99999, (s.skillLv[k] || 0) + n);
};

// ---------- the chapter ----------
// page 1100 (after the Z2 ending, src/z3.js startZ3): z1field 1101 — everyone recovered, Goku alone, a Super Saiyan
async function start(game) {
  const s = game.state;
  gameRef = game;
  begin(game);
  await card(Z3(game).titles.z3a, 2200);
  for (const m of [...s.party, ...Object.values(s.bench || {})]) heal(m); // all_charecter_recovery
  member(game, 3);
  superSaiyan(game.world, s, 1, true); // on_super_saiyazin 1 (when he isn't one)
  party(game, [3]);
  for (const m of s.party) heal(m);
  s.hand = newHand(game.world); // (a party of one: 必, his own school and one more)
  s.var[41] = 1100;
  await play(game, '1100', 0);
  return openingBattle(game);
}
// battle 1107: variable 81 = 20 (the party's damage ×20), afterwards variable 95 = 1151
async function openingBattle(game) {
  const s = game.state;
  if (await fight(game, '1107', 'opening', { dmgRate: C(game).opening.dmgRate }) !== 'win') return;
  s.var[81] = 0;
  s.var[41] = 1151;
  await play(game, '1151'); // ends: $partyc, variable 43 = 51
  const c = C(game);
  party(game, c.start33.party);
  addUses(s, c.uses1158); // z1field 1158 cha_tec_puls
  toField(game, c.start33);
}

// the spots of maps 33 / 34 (poi.page = the page the original runs there)
async function spot(game, poi) {
  const s = game.state, n = poi.page;
  gameRef = game;
  begin(game);
  if (n === 1195) return base33(game);
  if (n === 1215) return base34(game);
  const keep = s.var[41];
  s.var[41] = n;
  await play(game, String(n));
  s.var[41] = keep;
  toField(game);
}
// 1195 the first enemy base → Kraz (1197) → 1200: four balls, Vegeta alone → map 34
async function base33(game) {
  const s = game.state;
  s.var[41] = 1195;
  await play(game, '1195', 0);
  return base33Battle(game);
}
async function base33Battle(game) {
  const s = game.state;
  if (await fight(game, '1197', 'base33') !== 'win') return;
  s.var[41] = 1200;
  await play(game, '1200'); // the balls, CE180, variable 43 + 1, $partyc = [12]
  const c = C(game);
  party(game, c.start34.party);
  for (const m of game.state.party) heal(m);
  s.var[41] = 0;
  toField(game, c.start34);
}
// 1215 the snow-field base → Ear (1216) → 1217: the others, seven balls, Bulma, Dende (CE14) → map 35 Porunga
async function base34(game) {
  const s = game.state;
  s.var[41] = 1215;
  await play(game, '1215', 0);
  return base34Battle(game);
}
async function base34Battle(game) {
  const s = game.state;
  if (await fight(game, '1216', 'base34') !== 'win') return;
  s.var[41] = 1217;
  await play(game, '1217'); // the others come ($partyc in the page); Vegeta throws the balls and goes
  party(game, C(game).after.party);
  await play(game, 'porunga'); // map 35: the two wishes; variable 41 = 1440, 43 = 65
  return nextZ3(game, 'z3a');
}

function resume(game, at) {
  gameRef = game;
  if (at.at === 'opening') return openingBattle(game);
  if (at.at === 'base33') return base33Battle(game);
  if (at.at === 'base34') return base34Battle(game);
  toField(game);
}

// ---------- development: index.html?dev=z3 / z3a33 / z3a34 (&timer for a hidden pane) ----------
// a plausible state at the end of Z2 (Frieza beaten): levels a little above the Z2 dev jumps
const LV = { 3: 46, 4: 44, 5: 41, 6: 39, 7: 36, 8: 38, 9: 35, 10: 32, 24: 34, 12: 45 };
function dev(game, step) {
  if (!['z3', 'z3a', 'z3a33', 'z3a34'].includes(step)) return false;
  const w = game.world, s = game.newState();
  game.state = s;
  gameRef = game;
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
  const goku = s.bench[3];
  for (const id of [6, 7, 18]) if (!goku.skills.includes(id)) goku.skills.push(id); // 界王拳 etc.
  goku.school = 3;
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, willow: 'done', z2a: 'done', z2b: 'done' });
  Object.assign(s.sw, { 38: true, 39: true, 156: true, 483: true });
  s.var[40] = 2;
  s.var[41] = 1100;
  s.var[43] = 50;
  s.zeni = 12000;
  s.party = [];
  party(game, [5, 6, 7, 8, 9, 12]);
  moveTo(s, { map: '33', x: 42, y: 43 });
  if (step === 'z3' || step === 'z3a') {
    game.startField();
    startZ3(game);
    return true;
  }
  // z3a33: map 33 with the eight; z3a34: Vegeta alone on map 34 (the four balls of the base found)
  s.flags.z3 = 'z3a';
  s.cardiMax = 10;
  s.var[43] = step === 'z3a34' ? 52 : 51;
  s.sw[381] = true;
  const c = C(game);
  if (step === 'z3a34') {
    Object.assign(s.sw, { 402: true, 403: true, 404: true, 405: true, 406: true, 407: true, 408: true, 409: true });
    for (const id of [2, 3, 4, 5, 6, 7]) eventCard(s, id, 1);
    party(game, c.start34.party);
    moveTo(s, c.start34);
  } else {
    party(game, c.start33.party);
    moveTo(s, c.start33);
  }
  s.hand = newHand(w); // the Z3 card schools
  game.startField();
  begin(game);
  toField(game);
  return true;
}

registerZ3('z3a', { maps: MAPS, start, spot, resume, dev });

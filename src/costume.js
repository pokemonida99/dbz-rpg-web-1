// 換裝 (衣替え), as the original does it (docs/costume.md): the clothes are variables and switches, and every picture of a
// party member goes through them —
//   faces          set_character_face (all.rb 19758): a row of Z3_顔味方_衣替え / Z2_顔味方_衣替 / Z3_顔味方_亀仙人 … in place of
//                  the 顔味方 row (dialogue, scenes, the party screen, the battle's faces and 對決 row, the HUD, cards …)
//   battle sheets  set_battle_character_name (19414): Z3_戦闘_ゴクウ(ボロボロ) … for the battle, its films and the S-combos
//   map sprites    set_map_cha (20249: switches 361 / 362 / 382 / 386) and the clothes pages of map 33 event 5 (flying) and
//                  map 44 event 2 (on foot, the 精神と時の部屋): world.costume (tools/build_costume.py), src/field.js
//   the party screen's 換裝 (set_dress 20018, Input L / R in Scene_Db_Status 43929) and its 「D:」 mark (45264)
// The faces: one canvas copy of the era's 顔味方 with the rows of the clothes drawn over it, put under that sheet's name;
// the battle sheets: image aliases on top of the era's (src/era.js). syncCostume (every frame, src/main.js) redoes both
// when a variable or switch of the clothes changes, whoever changed it (the story pages, 換裝, the Super Saiyan).
//   variable 40 the part of the story (0 Z1, 1 Z2, 2 Z3 on); 161 / 162 悟飯 / 克林 Z2 battle suit (switch 439 got them);
//   163 Z2 巴達克 without his headband; 171 悟空 (1 ボロボロ, 2 さらにボロボロ: switch 381; 3 battle suit: 444); 172 悟飯 (1 battle
//   suit: 443, long hair; 2 red 道着: 447, short hair = switch 445); 173 特蘭克斯 (0 私服, 1 battle suit: 110, 2 tank top: 570,
//   3 long hair no sword: 580, 4 long hair with the sword: 581 / 860); 174 his clothes kept (CE210); 175 巴達克 without the
//   scouter (594); 176 琪琪; 177 18號 (always); switch 363 龜仙人's everyday clothes (always); switch 360: no 換裝 now.
import { img, assetUrl, setImageAlias, putImage, loadImages, audio } from './core.js?v=20261102-2311';

const PIC = 'Graphics/Pictures/';
const era = (s) => Math.min(2, (s.var && s.var[40]) || 0);
const W = () => (window.__game && window.__game.world.costume) || { fly: [], walk: [] };

// ---------- set_character_face: the 64×64 row (actor id − 3) → [sheet, its row] ----------
const KIT3 = 'Z3_顔味方_衣替え.png', KIT2 = 'Z2_顔味方_衣替.png', ROSHI = 'Z3_顔味方_亀仙人.png', LONG = 'Z3_顔味方_トランクス長髪.PNG';
const ZGF = 'ZG_顔味方.PNG', SS2 = 'ZG_顔グラ(ゴハン超1_2).png';
const BASE = ['Z1_顔味方.PNG', 'Z2_顔味方.PNG', 'Z3_顔味方.PNG'];
export function faceOf(s, row) {
  const v = s.var || {}, sw = s.sw || {}, ss = s.ss || {}, e = era(s);
  let r = null;
  if (e === 0 && row === 21 && sw[363]) r = [ROSHI, 0]; // 亀仙人普段着
  if (e === 1) {
    if (row === 11 && v[171] === 2) r = [KIT3, 22]; // 悟空さらにボロボロ(超)
    if (row === 2 && v[161] === 1) r = [KIT2, 0]; // 悟飯バトルスーツ
    if (row === 3 && v[162] === 1) r = [KIT2, 1]; // クリリンバトルスーツ
    if (row === 13 && v[163] === 1) r = [KIT2, 2]; // バーダックはちまきなし
    if (row === 21 && sw[363]) r = [ROSHI, 1];
  }
  if (e === 2) {
    if (row === 0 && (v[171] === 1 || v[171] === 2)) r = [KIT3, 3]; // 悟空ボロボロ (さらに: 素材がないのでボロボロのまま)
    if (row === 0 && v[171] === 3) r = [KIT3, 0]; // バトルスーツ
    if (row === 11 && v[171] >= 1 && v[171] <= 3) r = [KIT3, [0, 4, 22, 1][v[171]]]; // 超悟空
    if (row === 2 && !sw[445] && v[172] === 1) r = [KIT3, 6]; // 悟飯バトルスーツ
    if (row === 2 && sw[445]) r = [KIT3, 8]; // 悟飯短髪
    if (row === 15 && (sw[388] || ss[5])) r = [SS2, 2]; // 悟飯超サイヤ人2
    if (row === 7 && v[176] === 1) r = [KIT3, 21]; // チチ
    if (row === 13 && v[175] === 1) r = [KIT3, 11]; // バーダックスカウターなし
    if (row === 29 && v[175] === 1) r = [KIT3, 12];
    if (row === 14) r = { 3: [KIT3, 16], 4: [KIT3, 18], 1: [LONG, 1], 2: [KIT3, 13] }[v[173]] || r; // トランクス
    if (row === 17) r = { 3: [KIT3, 17], 4: [KIT3, 19], 1: [ZGF, 17], 2: [KIT3, 14] }[v[173]] || r;
    if (row === 18 && v[177] === 1) r = [KIT3, 20]; // 18号着せ替え
    if (row === 21 && sw[363]) r = [ROSHI, 2];
  }
  return r;
}

// ---------- set_battle_character_name: actor → [battle sheet, special-move sheet] ----------
const SHEET = (a, b) => [PIC + a, PIC + b];
const ROSHI_B = [SHEET('Z1_戦闘_かめせんにん(普段着).png', 'Z1_戦闘_必殺技_かめせんにん(普段着).png'),
  SHEET('Z2_戦闘_かめせんにん(普段着).png', 'Z2_戦闘_必殺技_かめせんにん(普段着).png'),
  SHEET('Z3_戦闘_かめせんにん(普段着).png', 'Z3_戦闘_必殺技_かめせんにん(普段着).png')];
const GOKU = [null, SHEET('Z3_戦闘_ゴクウ(ボロボロ).png', 'Z3_戦闘_必殺技_ゴクウ(ボロボロ).png'),
  SHEET('Z3_戦闘_ゴクウ(ボロボロ).png', 'Z3_戦闘_必殺技_ゴクウ(ボロボロ).png'), // (さらにボロボロ: 素材がないのでボロボロのまま)
  SHEET('Z3_戦闘_ゴクウ(バトルスーツ).png', 'Z3_戦闘_必殺技_ゴクウ(バトルスーツ).png')];
const SGOKU = [null, SHEET('Z3_戦闘_ゴクウ(超・ボロボロ).png', 'Z3_戦闘_必殺技_ゴクウ(超・ボロボロ).png'),
  SHEET('Z3_戦闘_ゴクウ(超・さらにボロボロ).png', 'Z3_戦闘_必殺技_ゴクウ(超・さらにボロボロ).png'),
  SHEET('Z3_戦闘_ゴクウ(超・バトルスーツ).png', 'Z3_戦闘_必殺技_ゴクウ(超・バトルスーツ).png')];
const TRUNKS = [null, SHEET('ZG_戦闘_トランクス.png', 'ZG_戦闘_必殺技_トランクス.png'),
  SHEET('Z3_戦闘_トランクス(タンクトップ).png', 'Z3_戦闘_必殺技_トランクス(タンクトップ).png'),
  SHEET('Z3_戦闘_トランクス(剣なし・タンクトップ・長髪).png', 'Z3_戦闘_必殺技_トランクス(剣なし・タンクトップ・長髪).png'),
  SHEET('Z3_戦闘_トランクス(剣持ち長髪).png', 'Z3_戦闘_必殺技_トランクス(剣持ち長髪).png')];
const STRUNKS = [null, SHEET('ZG_戦闘_トランクス(超).PNG', 'ZG_戦闘_必殺技_トランクス(超).PNG'),
  SHEET('Z3_戦闘_トランクス(超)(タンクトップ).png', 'Z3_戦闘_必殺技_トランクス(超)(タンクトップ).png'),
  SHEET('Z3_戦闘_トランクス(超)(剣なし・タンクトップ・長髪).png', 'Z3_戦闘_必殺技_トランクス(超)(剣なし・タンクトップ・長髪).png'),
  SHEET('Z3_戦闘_トランクス(超)(剣持ち長髪).png', 'Z3_戦闘_必殺技_トランクス(超)(剣持ち長髪).png')];
const GOHAN_SS2 = SHEET('ZG_戦闘_ゴハン(超2).png', 'ZG_戦闘_必殺技_ゴハン(超2).png'); // (src/z4f.js puts it on 悟飯 as m.sprite)
export function battleOf(s, id) {
  const v = s.var || {}, sw = s.sw || {}, ss = s.ss || {}, e = era(s);
  let r = null;
  if (id === 24 && sw[363]) r = ROSHI_B[e]; // 亀仙人普段着
  if (id === 14 && e === 1 && v[171] === 2) r = SGOKU[2]; // Z2悟空さらにボロボロ
  if (id === 5 && e === 1 && v[161] === 1) r = SHEET('Z2_戦闘_ゴハン_バトルスーツ.png', 'Z2_戦闘_必殺技_ゴハン_バトルスーツ.png');
  if (id === 6 && e === 1 && v[162] === 1) r = SHEET('Z2_戦闘_クリリン_バトルスーツ.png', 'Z2_戦闘_必殺技_クリリン_バトルスーツ.png');
  if (id === 3 && e === 2 && GOKU[v[171]]) r = GOKU[v[171]];
  if (id === 14 && e === 2 && SGOKU[v[171]]) r = SGOKU[v[171]];
  if (id === 19 && e === 2 && sw[110]) r = SHEET('ZG_戦闘_ベジータ(超).PNG', 'ZG_戦闘_必殺技_ベジータ(超).PNG'); // 精神と時の部屋の後
  if (id === 17 && TRUNKS[v[173]]) r = TRUNKS[v[173]];
  if (id === 20 && STRUNKS[v[173]]) r = STRUNKS[v[173]];
  if (id === 21 && e === 2 && v[177] === 1) r = SHEET('Z3_戦闘_18号(着替).png', 'Z3_戦闘_必殺技_18号(着替).png');
  if (id === 5 && e === 2 && v[172] === 1 && !sw[445]) r = SHEET('Z3_戦闘_ゴハン(バトルスーツ).png', 'Z3_戦闘_必殺技_ゴハン(バトルスーツ).png');
  if (id === 5 && e === 2 && sw[445]) r = SHEET('ZG_戦闘_ゴハン.PNG', 'ZG_戦闘_必殺技_ゴハン.PNG'); // 短髪
  if (id === 18 && e === 2 && ss[5]) r = GOHAN_SS2;
  if (id === 5 && e === 2 && sw[445] && v[172] === 2) r = SHEET('ZG_戦闘_ゴハン_赤道着.png', 'ZG_戦闘_必殺技_ゴハン_赤道着.png');
  if (id === 18 && e === 2 && v[172] === 2) {
    r = ss[5] ? SHEET('ZG_戦闘_ゴハン(超2)_赤道着.png', 'ZG_戦闘_必殺技_ゴハン(超2)_赤道着.png')
      : SHEET('ZG_戦闘_ゴハン(超)_赤道着.png', 'ZG_戦闘_必殺技_ゴハン(超)_赤道着.png');
  }
  return r;
}

// ---------- the pictures: aliases on top of the era's, and the faces' canvas ----------
const raw = new Map(); // the sheets themselves (not through the aliases: the canvas stands in for one of them)
function rawImg(file) {
  let e = raw.get(file);
  if (!e) {
    const im = new Image(), other = file.replace(/\.(png|PNG)$/, (x) => (x === '.png' ? '.PNG' : '.png'));
    e = { im, ok: false };
    e.p = new Promise((res) => {
      im.onload = () => { e.ok = true; res(); };
      im.onerror = () => { if (!e.retry) { e.retry = true; im.src = assetUrl(PIC + other); } else res(); };
    });
    im.src = assetUrl(PIC + file);
    raw.set(file, e);
  }
  return e;
}
const FACES_KEY = 'costume/faces'; // the canvas's name among the images (core.js putImage)
const faces = document.createElement('canvas');
let eraMap = {}, lastSig = null;
function facesAlias(s) {
  const e = era(s), base = BASE[e], rows = [];
  for (let row = 0; row < 30; row++) { const f = faceOf(s, row); if (f) rows.push([row, ...f]); }
  if (!rows.length) return {};
  const need = [base, ...rows.map((r) => r[1])].map(rawImg);
  if (need.some((x) => !x.ok)) { Promise.all(need.map((x) => x.p)).then(() => { lastSig = null; }); return {}; } // (redone once loaded)
  const b = need[0].im;
  faces.width = b.width; faces.height = b.height;
  const c = faces.getContext('2d');
  c.clearRect(0, 0, b.width, b.height);
  c.drawImage(b, 0, 0);
  for (const [row, sheet, from] of rows) {
    c.clearRect(0, 64 * row, b.width, 64);
    c.drawImage(rawImg(sheet).im, 0, 64 * from, b.width, 64, 0, 64 * row, b.width, 64);
  }
  putImage(FACES_KEY, faces);
  return { [PIC + BASE[0]]: FACES_KEY, [PIC + base]: FACES_KEY };
}
function sheetsAlias(world, s) {
  const out = {};
  for (const [id, a] of Object.entries(world.actors)) {
    const r = battleOf(s, +id);
    if (!r) continue;
    for (const [k, to] of [[a.sprite, r[0]], [a.special, r[1]]]) { out[k] = to; if (eraMap[k]) out[eraMap[k]] = to; }
    if (+id === 18) { out[GOHAN_SS2[0]] = r[0]; out[GOHAN_SS2[1]] = r[1]; }
  }
  return out;
}
const SIG_VARS = [40, 42, 161, 162, 163, 171, 172, 173, 175, 176, 177], SIG_SW = [110, 363, 388, 445];
const sig = (s) => JSON.stringify([SIG_VARS.map((n) => s.var[n] || 0), SIG_SW.map((n) => !!s.sw[n]), !!(s.ss && s.ss[5])]);
// src/era.js: the era's aliases and the clothes' on top
export function withCostume(game, map) {
  eraMap = map;
  const s = game.state;
  if (!s || !s.var || !s.sw) return map;
  lastSig = sig(s);
  if (era(s)) for (const f of [KIT3, KIT2, ROSHI, LONG, ZGF, SS2]) rawImg(f); // (ready before the first 換裝)
  mapSwitches(s);
  migrate(s);
  return { ...map, ...sheetsAlias(game.world, s), ...facesAlias(s) };
}
export function syncCostume(game) {
  const s = game.state;
  if (!s || !s.var || !s.sw || sig(s) === lastSig) return;
  const all = withCostume(game, eraMap);
  setImageAlias(all);
  loadImages(Object.values(all));
  if (game.renderHud && s.party && game.scene === game.field) game.renderHud(); // (the map's faces are painted once)
}

// the remake's Z2 battle suits before 換裝 (src/z2b.js put the sheets on the members): variables 161 / 162 instead
function migrate(s) {
  for (const m of [...(s.party || []), ...Object.values(s.bench || {})]) {
    if (!m || !/_バトルスーツ\.png$/.test(m.sprite || '') || (m.id !== 5 && m.id !== 6)) continue;
    delete m.sprite; delete m.special;
    s.var[m.id === 5 ? 161 : 162] = 1;
  }
}

// ---------- set_map_cha and the clothes' map sprites ----------
function mapSwitches(s) {
  const v = s.var, sw = s.sw, e = era(s), lead = v[42] || 3;
  if (e === 1) { sw[361] = v[161] === 1 && lead === 5; sw[362] = v[162] === 1 && lead === 6; }
  if (e === 2) { sw[382] = v[171] === 3 && (lead === 3 || lead === 14); sw[386] = v[172] === 1 && lead === 5; }
}
// 131 トランクス長髪 (CE212 / 214 / 215: clothes 1, 3, 4), 388 悟飯超サイヤ人2
const on = (s, n) => (n === 131 ? [1, 3, 4].includes(s.var[173]) : n === 388 ? !!(s.sw[388] || (s.ss && s.ss[5])) : !!s.sw[n]);
const pick = (s, list, lead) => {
  let hit = null;
  for (const [v, sws, sheet, k] of list) if (v === lead && sws.every((n) => on(s, n))) hit = `${sheet}:${k}`;
  return hit;
};
export const flySprite = (s, lead) => (era(s) === 2 ? pick(s, W().fly, lead) : null); // 'sheet:character' (src/field.js FLY_MORE)
export const walkSprite = (s, lead) => (era(s) === 2 && s.map === '44' ? pick(s, W().walk, lead) : null);

// ---------- set_dress: the party screen's 換裝 (only on the map: the remake's party screen in battle has no L / R) ----------
// one step forward (Input R); returns whether it did anything (the original's `onse`). v / sw: the state's or a copy
function step(s, v, sw, id) {
  const e = era(s);
  const cycle = (n, max) => { v[n] = ((v[n] || 0) + 1) % (max + 1); };
  if (sw[360]) return false;
  if (id === 24) { sw[363] = !sw[363]; return true; } // 亀仙人 (every part of the story)
  if (e === 1) {
    if ((id === 5 || id === 6) && sw[439]) { const n = id === 5 ? 161 : 162; v[n] = v[n] ? 0 : 1; return true; }
    return false;
  }
  if (e !== 2) return false;
  if (id === 3 || id === 14) { // 悟空: 0 → ボロボロ → さらにボロボロ (381) → バトルスーツ (444)
    let x = (v[171] || 0) + 1;
    if (x === 1 && !sw[381]) x++;
    if (x === 2 && !sw[381]) x++;
    if (x === 3 && !sw[444]) x++;
    v[171] = x % 4;
    return true;
  }
  if ((id === 5 && !sw[445]) || ((id === 5 || id === 18) && sw[445] && sw[447])) { // 悟飯: 長髪 ⇄ バトルスーツ, 短髪 ⇄ 赤道着
    if (!sw[445]) { if (!sw[443]) return false; v[172] = v[172] ? 0 : 1; } else v[172] = v[172] ? 0 : 2;
    return true;
  }
  if (id === 16 || id === 32) { cycle(175, sw[594] ? 1 : 0); return true; } // バーダック
  if (id === 17 || id === 20) { // トランクス
    cycle(173, sw[581] || sw[860] ? 4 : sw[580] ? 3 : sw[570] ? 2 : sw[110] ? 1 : 0);
    return true;
  }
  if (id === 21) { cycle(177, 1); return true; } // 18号
  return false;
}
// whether 換裝 shows anything for this member now (a step that changes a picture)
export function canDress(s, id) {
  const v = { ...s.var }, sw = { ...s.sw };
  if (!step(s, v, sw, id)) return false;
  return [161, 162, 171, 172, 173, 175, 177].some((n) => (v[n] || 0) !== (s.var[n] || 0)) || !!sw[363] !== !!s.sw[363];
}
// CE211-215 ドレス:トラ…: the switches of Trunks' clothes (131 長髪, 132, 395 タンクトップ, 438 剣なし)
const TRUNKS_SW = [[0, 0, 0, 0], [1, 1, 0, 1], [0, 0, 1, 1], [1, 1, 0, 1], [1, 0, 0, 0]];
export function dress(game, id) {
  const s = game.state;
  if (!step(s, s.var, s.sw, id)) return false;
  if (id === 17 || id === 20) {
    TRUNKS_SW[s.var[173] || 0].forEach((x, k) => { s.sw[[131, 132, 395, 438][k]] = !!x; });
    trunksMoves(game); // CE61
  }
  audio.se('Z3 カーソル移動');
  syncCostume(game);
  return true;
}
// CE61 トランクス技切り替え: 特蘭克斯 (and 超特蘭克斯) — with the sword (switch 438 off: 私服, 私服長髪刀あり) 剣攻撃 172 and
// シャイニングソードアタック 177; without it 爆発波 173 and ヒートドームアタック 178 (switch 437 or 861) or else フィニッシュバスター 181
export function trunksMoves(game) {
  const s = game.state, w = game.world, v = s.var[173] || 0;
  if (v === 0 || v === 4) s.sw[438] = false;
  if (v >= 1 && v <= 3) s.sw[438] = true;
  const learn = (id, skill, yes) => {
    const m = s.party.find((x) => x.id === id) || (s.bench || {})[id];
    s.forms = s.forms || {};
    const list = m ? m.skills : (s.forms[id] = s.forms[id] || { skills: [...((w.actors[id] || {}).skills || [])] }).skills;
    const k = list.indexOf(skill);
    if (yes && k < 0) { list.push(skill); list.sort((a, b) => a - b); } // (learn_skill sorts)
    if (!yes && k >= 0) list.splice(k, 1);
  };
  for (const id of [17, 20]) {
    for (const sk of [172, 173, 177, 178, 181]) learn(id, sk, false);
    if (!s.sw[438]) { learn(id, 172, true); learn(id, 177, true); continue; }
    learn(id, 173, true);
    if (s.sw[437] || s.sw[861]) learn(id, 178, true); // ヒートドーム覚える
    else learn(id, 181, true);
  }
}

// the 「D:」 mark of the party list (100_Scene_Db_Status, all.rb 45264): which clothes, in the 数字英語 letters
export function dressMark(s, id) {
  const v = s.var || {}, sw = s.sw || {}, e = era(s);
  if ((id === 3 || id === 14) && e === 2) return ['N', 'T', 'T2', 'B'][v[171] || 0];
  if (id === 5 || id === 18) {
    if (e === 1 && sw[439]) return v[161] === 1 ? 'B' : 'N';
    if (e === 2 && sw[441] && sw[443] && !sw[445]) return v[172] === 1 ? 'B' : 'N';
    if (e === 2 && sw[441] && sw[445] && sw[447]) return v[172] === 2 ? 'NR' : 'N';
    return null;
  }
  if (id === 6 && e === 1 && sw[439]) return v[162] === 1 ? 'B' : 'N';
  if ((id === 17 || id === 20) && e === 2 && sw[442]) return ['N', 'B', 'T', 'TL', 'NL'][v[173] || 0];
  if (id === 21) return v[177] === 1 ? 'S' : 'N';
  if (id === 24) return sw[363] ? 'S' : 'N';
  return null;
}
const GLYPH = { D: [23, 0], ':': [25, 0], 2: [2, 0], N: [8, 1], B: [14, 1], S: [12, 1], T: [25, 1], L: [4, 1], R: [26, 1] };
export function dressTag(s, id) {
  const mark = dressMark(s, id);
  if (!mark) return null;
  const text = 'D:' + mark, c = document.createElement('canvas'), d = img(PIC + '数字英語.PNG');
  c.width = 16 * text.length; c.height = 16;
  c.className = 'pm-num';
  const paint = () => [...text].forEach((ch, k) => c.getContext('2d').drawImage(d.im, 16 * GLYPH[ch][0], 16 * GLYPH[ch][1], 16, 16, 16 * k, 0, 16, 16));
  if (d.ok) paint(); else d.p.then(() => d.ok && paint());
  return c;
}

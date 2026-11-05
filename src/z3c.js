// Z3 第三章 弗利薩復仇・特南克斯（地圖 36） — driven by world.z3 (tools/build_z3c.py; docs/z3cd.md):
//   1230 Frieza and King Cold land → battle 1237 (Mecha Frieza: four turns, every attack of the party misses) →
//   1240 the mysterious boy (Trunks alone, a Super Saiyan) → 1241 his fight (a battle film) → 1246 King Cold →
//   map 36 the space pod lands → 1250 Goku, Goku against Trunks (CE46 / CE49, the film 1255) → 1256 the future,
//   the time machine, Cooler's men, Vegeta to Capsule Corporation → 第四章 (src/z3d.js).
// The scenes of chapters 3 and 4 (z1field 1230-1325, 1431-1434, 1581) and the story nodes both use are here; src/z3d.js
// imports them. Also here: CE45 (the Super Saiyan transformation pictures) and set_battle_event (a battle film with no
// input, src/anime.js Duel).
import { audio, img, loadImages, view } from './core.js?v=20261105-1811';
import { addScenes, addNodes } from './cutscene.js?v=20261105-1811';
import { SCROLL_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261105-1811';
import { makeMember, applyLevel } from './party.js?v=20261105-1811';
import { ensure } from './growth.js?v=20261105-1811';
import { superSaiyan } from './supersaiyan.js?v=20261105-1811';
import { newHand } from './battle.js?v=20261105-1811';
import { Duel, SW, SH, ANIME_IMAGES, addMoves } from './anime.js?v=20261105-1811';
import { drawAnim, animFrames } from './vxanim.js?v=20261105-1811'; // (map 36: animation 4 on the landed pod)
import {
  registerZ3, nextZ3, Z3, begin, play, fight, toField, party, addMember, member, heal, card, moveTo,
} from './z3.js?v=20261105-1811';

const MAPS = ['36'];

// ---------- pictures ----------
const pic = (n) => `Graphics/Pictures/${n}`; // (with the extension the file has: GitHub Pages minds the case)
export const P3 = pic('Z3_顔味方.PNG'), E3 = pic('Z3_顔イベント.PNG'), F3 = pic('Z3_顔敵.PNG'), CARD = pic('顔カード.PNG');
export const BG = {
  草原: pic('Z3_背景_草原.png'), 家: pic('Z3_背景_家.PNG'), 亀仙人の家: pic('ZG_背景_亀仙人の家.PNG'), 界王星: pic('Z3_背景_界王星.PNG'),
  フリーザ宇宙船: pic('Z3_背景_宇宙_フリーザ宇宙船.PNG'), 人造人間: pic('Z3_背景_人造人間.png'), 宇宙: pic('Z3_背景_宇宙.PNG'),
  砂漠: pic('Z3_背景_砂漠.png'), カプセル: pic('Z3_背景_カプセルコーポレーション.PNG'), 基地: pic('Z3_背景_基地.PNG'), 山: pic('Z3_背景_山.PNG'),
  森: pic('Z3_背景_森.PNG'), 暗い砂漠: pic('Z3_背景_暗い砂漠.png'),
};
const TIME_MACHINE = pic('Z3_背景_タイムマシンp2.png');
const COLD_FILM = pic('Z3_コルド撃破_修正.PNG');
// CE46 / 48 / 49 / 50 → CE45: the back, three auras, the two bodies (before / after) — Goku's by his clothes (variable 171)
const SS_BACK = pic('Z3_スーパーサイヤ人_バック.PNG');
const TRANSFORM = {
  goku: { aura: '悟空', body: ['Z3_スーパーサイヤ人悟空1.PNG', 'Z3_スーパーサイヤ人悟空2.PNG'],
    clothes: [null, ['Z3_スーパーサイヤ人悟空(道着ボロボロ)1.png', 'Z3_スーパーサイヤ人悟空(道着ボロボロ)2.png'],
      ['Z3_スーパーサイヤ人悟空(道着さらにボロボロ)1.png', 'Z3_スーパーサイヤ人悟空(道着さらにボロボロ)2.png'],
      ['Z3_スーパーサイヤ人悟空(バトルスーツ)1.png', 'Z3_スーパーサイヤ人悟空(バトルスーツ)2.png']] },
  vegeta: { aura: 'ベジータ', body: ['Z3_スーパーサイヤ人ベジータ1.PNG', 'Z3_スーパーサイヤ人ベジータ2.PNG'] },
  trunks: { aura: 'トランクス', body: ['Z3_スーパーサイヤ人トランクス1.PNG', 'Z3_スーパーサイヤ人トランクス2.PNG'] },
  cooler: { auras: ['Z3_クウラ変身_気1.PNG', 'Z3_クウラ変身_気2.PNG', 'Z3_クウラ変身_気3.PNG'], body: ['Z3_クウラ変身1.PNG', 'Z3_クウラ変身2.PNG'] },
};
const auras = (t) => (t.auras || [1, 2, 3].map((k) => `Z3_スーパーサイヤ人_${t.aura}_気${k}.PNG`)).map(pic);
const SS_PICS = [SS_BACK, ...Object.values(TRANSFORM).flatMap((t) => [...auras(t), ...t.body.map(pic), ...(t.clothes || []).filter(Boolean).flat().map(pic)])];
const SHENRON_FILM = pic('Z3_シェンロン呼び出し.PNG');

// ---------- drawing (add_chr at the original's places: @ene1_x/@ene1_y = ENE, @play_x/@play_y = under the scene) ----------
// The Z3 scene pictures are 512×128 at @z1_scrollscenex (a phone shows the middle of them). Faces the original sets
// 96 or 144 px from the middle are drawn closer (84) or smaller here, so they stay inside a 390-wide screen.
export const bg = (st, name, sx = 0) => st.add(BG[name], SCROLL_X, SCENE_Y, [sx, 0, 512, 128]);
export const face = (st, sheet, row, dx = 0, dy = 0, col = 0, size = null) => (size
  ? st.add(sheet, ENE[0] + 32 - size / 2 + dx, ENE[1] + 32 - size / 2 + dy, [64 * col, 64 * row, 64, 64], false, 0, [size, size])
  : st.add(sheet, ENE[0] + dx, ENE[1] + dy, [64 * col, 64 * row, 64, 64]));
export const under = (st, sheet, row, dx = 0, line = 0, col = 0) => st.add(sheet, PLAY_X + dx, 0, [64 * col, 64 * row, 64, 64], true, line);
// character_output: the party's faces under the scene (as src/cutscene.js: three a row, more than six smaller)
export function out(st, ctx) {
  const ids = ctx.partyc, per = ids.length > 8 ? 5 : ids.length > 6 ? 4 : 3;
  st.faceSize = ids.length > 8 ? 40 : ids.length > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    under(st, P3, id - 3, -32 * (m - 1) + 64 * j, line);
  });
}
// a picture on the original's 640×480 screen (show picture / add_chr at screen coordinates), as src/z2scenes.js does
export const screenPic = (st, path, x, y, src, op = 255) => {
  const sp = { path, x, y, w: src[2], h: src[3], src, size: 'screen', op };
  if (st.sprites) st.sprites.push(sp);
  return sp;
};

// ---------- the game the scenes act on (set by every entry point of chapters 3 and 4) ----------
let gameRef = null;
export const use = (game) => { gameRef = game; };
const refresh = (ctx) => { if (gameRef) ctx.partyc = gameRef.state.party.map((m) => m.id); };
// $partyc = ids with all_charecter_recovery around it (z1field 1236 / 1249 / 1261): the real party changes too
function setTeam(ctx, ids, recover = true) {
  if (gameRef) {
    party(gameRef, ids);
    if (recover) for (const m of gameRef.state.party) heal(m);
    refresh(ctx);
  } else ctx.partyc = ids;
}

// ---------- z1field (all.rb 174151-174810) ----------
const two = (st, a, b, d = 48) => { face(st, ...a, -d); face(st, ...b, d); };
const FRIEZA_M = [F3, 2], COLD = [E3, 6], GOKU = [P3, 0], TRUNKS = [P3, 14], SUPER_TRUNKS = [P3, 17], POD = [E3, 7];
const card3 = (row) => [CARD, row, 0, 0, 2]; // a 顔カード face: column 2 = Z3
const C = (game) => Z3(game).z3c;
const D = {
  1100: () => {}, // 背景色表示 (the CE45 pictures come next)
  1230: (st) => bg(st, '草原'),
  1231: (st) => { bg(st, '家'); face(st, P3, 2); }, // 悟飯
  1232: (st) => { bg(st, '亀仙人の家'); face(st, P3, 3); }, // クリリン
  1233: (st) => { bg(st, '界王星'); face(st, ...card3(25)); }, // 界王様
  1234: (st) => { bg(st, 'フリーザ宇宙船'); two(st, FRIEZA_M, COLD); },
  1235: (st) => { bg(st, '草原'); two(st, FRIEZA_M, COLD); },
  1236: (st, ctx) => { setTeam(ctx, C(gameRef).party1236); bg(st, '草原'); two(st, FRIEZA_M, COLD); out(st, ctx); },
  1240: (st, ctx) => { bg(st, '草原'); two(st, FRIEZA_M, COLD); out(st, ctx); },
  1241: (st, ctx, q) => duelScene(st, ctx, q, '1241'), // set_battle_event: トランクス対フリーザサイボーグ
  1246: (st, ctx) => { bg(st, '草原'); face(st, ...COLD); out(st, ctx); },
  1247: (st, ctx, q) => coldFilm(st, q),
  1248: (st) => { bg(st, '草原'); face(st, ...TRUNKS); },
  1249: (st, ctx) => { bg(st, '草原'); face(st, ...TRUNKS); setTeam(ctx, C(gameRef).party1236); out(st, ctx); },
  1250: (st, ctx) => { bg(st, '草原'); two(st, GOKU, POD); out(st, ctx); },
  1251: (st, ctx) => { bg(st, '草原'); face(st, ...POD, -84); face(st, ...GOKU); face(st, ...TRUNKS, 84); out(st, ctx); },
  1252: (st, ctx) => { bg(st, '草原'); face(st, ...TRUNKS); setTeam(ctx, [3], false); out(st, ctx); },
  1255: (st, ctx, q) => duelScene(st, ctx, q, '1255'), // set_battle_event: ゴクウ対トランクス
  1256: (st, ctx) => { bg(st, '草原'); face(st, ...SUPER_TRUNKS); out(st, ctx); },
  1257: (st, ctx) => { bg(st, '草原'); face(st, ...TRUNKS); out(st, ctx); },
  1258: (st, ctx) => { bg(st, '人造人間'); out(st, ctx); },
  1259: (st) => { // タイムマシン発進 (cha_tec_puls: Goku's move counts)
    bg(st, '草原');
    st.add(TIME_MACHINE, ENE[0] - 20, SCENE_Y + 10, [0, 0, 128, 128]);
    const s = gameRef && gameRef.state;
    if (s) { s.skillLv = s.skillLv || {}; for (const [k, n] of Object.entries(C(gameRef).uses1259)) s.skillLv[k] = Math.min(99999, (s.skillLv[k] || 0) + n); }
  },
  1260: (st) => bg(st, '草原'),
  1261: (st, ctx) => { bg(st, '草原'); face(st, ...GOKU); setTeam(ctx, C(gameRef).party1236, false); out(st, ctx); },
  1262: (st) => bg(st, '宇宙'),
  1263: (st) => { // クウラ、サウザー (@play_x), ドーレ / ネイズ (@play_y + 64)
    bg(st, 'フリーザ宇宙船'); face(st, F3, 20);
    under(st, F3, 19); under(st, F3, 16, -64, 1); under(st, F3, 13, 64, 1);
  },
  1264: (st, ctx) => { bg(st, '砂漠'); out(st, ctx); },
  1265: (st, ctx) => { bg(st, 'カプセル'); face(st, ...card3(36)); out(st, ctx); }, // ブリーフ博士
  1266: (st) => { bg(st, 'カプセル'); face(st, ...card3(36)); },
};

// z1field 1247: King Cold's end (Z3_コルド撃破_修正, three 640×222 frames at y 129), the white flash
async function coldFilm(st, quiet) {
  if (quiet) return;
  const sp = screenPic(st, COLD_FILM, 0, 129, [0, 0, 640, 222]);
  await st.ui.wait(60);
  audio.se('Z3 トランクスエネルギー波', 80);
  st.flash = 1;
  await st.ui.wait(30);
  st.flash = 0;
  for (let k = 0; k < 15 && !st.ui.skipped; k++) {
    sp.src = [0, 222, 640, 222]; await st.ui.wait(8);
    sp.src = [0, 444, 640, 222]; await st.ui.wait(8);
  }
  audio.seStop();
}

// ---------- CE45 超サイヤ人変身テンプレート (CE46 / 48 / 49 / 50) ----------
// the back (0,128), auras 5-7 and the bodies 11 / 12 at (178,128): 90 frames, the sound and a 264-frame quake, the aura
// cycling every 4 frames ×10, then the body flickering every 8 frames (×5 cycles), every 4 (×7), the new body and the
// aura ×20
export async function transformFilm(st, ui, who, s) {
  const t = TRANSFORM[who];
  const v171 = (s && s.var && s.var[171]) || 0;
  const body = (t.clothes && t.clothes[v171]) || t.body;
  ui.dlg.hidden = true;
  st.clear();
  screenPic(st, SS_BACK, 0, 128, [0, 0, 640, 224]);
  const wide = (p) => { const e = img(p); return [0, 0, e.ok ? e.im.width : 286, 224]; };
  const A = auras(t).map((p) => screenPic(st, p, 178, 128, wide(p), 0));
  const B = body.map((p, k) => screenPic(st, pic(p), 178, 128, wide(pic(p)), k ? 0 : 255));
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

// ---------- set_battle_event: a battle film nobody plays (Scene_Db_Battle_Anime with $game_variables[96]) ----------
// 1: Trunks (a Super Saiyan) against Mecha Frieza — Frieza attacks and misses, the Shining Sword Attack (the action 187
//    = move 177) ends him; 2: Goku against Trunks (enemy 134 twice) — Goku's blow and the first Trunks' miss, the
//    second one's lands. The damage is not shown or dealt ($game_variables[96] != 0: no damage result).
async function duelScene(st, ctx, quiet, key) {
  if (quiet || !gameRef) return;
  const w = gameRef.world, d = C(gameRef).duels[key];
  const m = gameRef.state.party.find((x) => x.id === d.party) || member(gameRef, d.party);
  const a = w.actors[m.id], f = w.enemies[d.foe];
  const party = { normal: a.sprite, special: a.special }, foe = { normal: f.portrait, special: f.sprite, size: f.size };
  const acts = key === '1241'
    ? [{ p: false, skill: null, hit: false }, { p: true, skill: 177, hit: true }]
    : [{ p: true, skill: null, hit: false }, { p: false, skill: null, hit: false }, { p: false, skill: null, hit: true }];
  await loadImages([party.normal, party.special, foe.normal, foe.special, d.backdrop, ...ANIME_IMAGES]);
  await duelFilm(st.ui, acts.map((x) => ({ party, foe, ray: a.ray, ...x })), d.backdrop);
}
export async function duelFilm(ui, acts, backdrop) {
  ui.dlg.hidden = true;
  audio.stopBgm();
  audio.se('Z1 敵発見', 80); // ($BGM_encount, as a battle starts)
  const cv = document.createElement('canvas');
  cv.style.zIndex = '1';
  ui.el.appendChild(cv);
  for (const act of acts) {
    if (ui.skipped) break;
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const W = Math.round(r.width), H = Math.round(r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    const duel = new Duel({ party: act.party, foe: act.foe, playerAttacks: act.p, skill: act.skill, ray: act.ray, hit: act.hit,
      damage: '', onHit() {}, margin: Math.max(0, (SW - W) / 2) });
    await new Promise((res) => {
      let last = performance.now(), acc = 0;
      ui.onSkip.push(res);
      const tick = (t) => {
        if (ui.skipped || duel.done) { res(); return; }
        acc += Math.min(0.1, (t - last) / 1000);
        last = t;
        while (acc >= 1 / 60 && !duel.done) { duel.step(); acc -= 1 / 60; }
        const c = cv.getContext('2d');
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.imageSmoothingEnabled = false;
        c.fillStyle = '#000';
        c.fillRect(0, 0, W, H);
        const sw = Math.min(SW, W), sx = Math.round((SW - sw) / 2), dx = Math.round((W - sw) / 2), dy = Math.round((H - SH) / 2);
        const bd = img(backdrop);
        if (bd.ok) { // the strip under the fighters (row 0 of the film = image row 205, as src/battle.js)
          const k = Math.max(1, W / bd.im.width), bw = Math.ceil(bd.im.width * k);
          c.drawImage(bd.im, 0, 0, bd.im.width, bd.im.height, Math.round((W - bw) / 2), Math.round(dy - 205 * k + duel.back.y - 256), bw, Math.ceil(bd.im.height * k));
        }
        c.drawImage(duel.render(), sx, 0, sw, SH, dx, dy, sw, SH);
        if (duel.fade > 0) { c.fillStyle = `rgba(0,0,0,${duel.fade})`; c.fillRect(0, 0, W, H); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  audio.seStop();
  cv.remove();
}

// ---------- the story nodes of these pages (tools/build_z3c.py convert) ----------
let again = false; // page 58: the wish menu once more (119 選択肢1ページ)
export const takeAgain = () => { const a = again; again = false; return a; };
addNodes({
  z3Transform: async (node, { stage, ui, s, quiet }) => { if (!quiet) await transformFilm(stage, ui, node.who, s); },
  z3cdTint: async (node, { stage, quiet }) => { if (!quiet) stage.fade = node.dark ? 1 : 0; },
  z3cdSeStop: async () => audio.seStop(),
  z3cdParty: async (node, { ctx }) => setTeam(ctx, node.ids, false),
  z3cdJoin: async (node, { ctx }) => { if (gameRef) { addMember(gameRef, node.id); refresh(ctx); } else ctx.partyc = [...ctx.partyc, node.id]; },
  z3cdSs: async (node, { ctx }) => { if (gameRef) { superSaiyan(gameRef.world, gameRef.state, node.no, node.on); refresh(ctx); } },
  z3cdHand: async () => { if (gameRef) gameRef.state.hand = newHand(gameRef.world); },
  z3cdLead: async () => { const s = gameRef && gameRef.state; if (s && s.party[0]) s.var[42] = s.party[0].id; },
  z3cdZp: async (node) => { const s = gameRef && gameRef.state; if (s) for (const m of [...s.party, ...Object.values(s.bench || {})]) ensure(m).zp += node.n; },
  z3cdAgain: async () => { again = true; },
});
// battle films of the new members' moves (src/anime.js MOVES; the nearest Z1 / Z2 film, as src/z2b.js does)
addMoves({ 171: 'energyWave', 174: 'masenko', 176: 'kikouhou', 125: 'galickGun', 130: 'galickGun' });

// ---------- the chapter ----------
async function start(game) {
  use(game);
  const s = game.state;
  begin(game);
  await card(Z3(game).titles.z3c, 2200);
  s.var[41] = 1230;
  await play(game, '1230', 0);
  return mecha(game);
}
// battle 1237: switch 18 (敵必ず回避), variable 94 = 4 — the battle stops after four turns; then variable 95 = 1240
async function mecha(game) {
  const s = game.state, c = C(game);
  const r = await fight(game, '1237', '1237', { turns: c.mecha.turns, foesEvade: true, backdrop: c.mecha.backdrop });
  if (r === 'lose') return;
  s.sw[18] = false;
  s.sw[128] = false;
  s.var[94] = 0;
  s.var[41] = 1240;
  await play(game, '1240'); // Trunks (z1field 1241: his fight) → variable 95 = 1246
  for (const m of s.party) heal(m);
  s.var[41] = 1246;
  await play(game, '1246'); // → map 36
  return pod(game);
}

// map 36 event 15 (autorun): the pod (event 1, tile 166) comes down 15 tiles from (18,12) (move speed 4: 16 frames a
// tile), the screen shakes, Goku (event 16, chara2) at (18,27) turns and steps left; variable 41 + 1 → 1250
const TILE_B = 'Graphics/System/TileB.png', CHARA2 = 'Graphics/Characters/chara2.png';
async function pod(game) {
  use(game);
  const s = game.state, p = C(game).pod;
  s.var[41] = 1249;
  s.flags.z3At = { ch: 'z3c', at: 'pod' };
  game.save(true); // (on the map before: map 36 has no music, a load there would ask for none)
  moveTo(s, p);
  audio.stopBgm();
  await loadImages([TILE_B, CHARA2]);
  game.startField();
  const f = game.field;
  f.paused = true;
  game.busy = true;
  f.leave();
  const at = { x: p.from[0] * 32, y: p.from[1] * 32 }, goku = { on: false, x: p.goku[0] * 32, y: p.goku[1] * 32 };
  const anim = ((game.world.viz || {}).anims || {})[4]; // 宇宙船到着1フレ (src/vxanim.js), on the landed pod
  let fx = -1;
  if (anim) await loadImages(anim.pics);
  const draw0 = f.draw.bind(f);
  f.draw = () => {
    draw0();
    const c = view.ctx || view.canvas.getContext('2d');
    const W = f.map.w * 32, H = f.map.h * 32;
    let cx = s.x - view.w / 2, cy = s.y - view.h * 0.45; // (the camera of src/field.js)
    cx = W <= view.w ? (W - view.w) / 2 : Math.max(0, Math.min(W - view.w, cx));
    cy = H <= view.h ? (H - view.h) / 2 : Math.max(-f.hudPad(), Math.min(H - view.h, cy));
    cx = Math.round(cx); cy = Math.round(cy);
    const tb = img(TILE_B), ch = img(CHARA2);
    if (goku.on && ch.ok) c.drawImage(ch.im, 32, 32, 32, 32, goku.x - cx, goku.y - cy, 32, 32); // facing left
    if (tb.ok) c.drawImage(tb.im, 448, 128, 32, 32, at.x - cx, at.y - cy, 32, 32);
    if (anim && fx >= 0 && fx % 30 < animFrames(anim)) drawAnim(c, anim, fx % 30, at.x - cx + 16, at.y - cy + 16);
  };
  const frames = (n) => new Promise((res) => setTimeout(res, (n * 1000) / 60));
  audio.se('Z3 宇宙船到着', 80);
  for (let k = 0; k < 15 * 16; k++) { at.y += 2; await frames(1); }
  // 225 (power 3, speed 8, 60 frames, no wait) with 212 animation 4 on the pod, wait 30, animation 4 again, wait 30
  for (let k = 0; k < 60; k++) { fx = k; view.canvas.style.transform = `translateX(${[-3, 0, 3, 0][(k >> 1) % 4]}px)`; await frames(1); }
  fx = -1;
  view.canvas.style.transform = '';
  goku.on = true;
  for (let k = 0; k < 16; k++) { goku.x -= 2; await frames(1); }
  await frames(90);
  f.draw = draw0;
  begin(game);
  s.var[41] = 1250;
  return gokuArrives(game);
}
// 1250 → 1255 (Goku against Trunks) → 1256 → map 37: 第四章
async function gokuArrives(game) {
  const s = game.state;
  await play(game, '1250');
  s.var[41] = 1256;
  await play(game, '1256');
  const n = C(game).next;
  party(game, n.party);
  s.var[42] = n.party[0];
  s.var[41] = 0;
  moveTo(s, n);
  return nextZ3(game, 'z3c');
}

function resume(game, at) {
  use(game);
  if (at.at === '1237') return mecha(game);
  if (at.at === 'pod') { begin(game); return pod(game); }
  toField(game);
}

// ---------- development: index.html?dev=z3c (page 1230) / z3c36 (map 36, the pod) / z3c1256 (after Goku against
// Trunks) (&timer for a hidden pane) ----------
// what 第二章 hands over (variable 41 = 1230): everyone back from 魔凶星, Goku (a Super Saiyan since Namek) on the bench
export const LV = { 3: 52, 4: 50, 5: 47, 6: 44, 7: 41, 8: 43, 9: 40, 10: 37, 24: 39, 12: 51, 17: 43 };
export function devState(game, key) {
  const w = game.world, s = game.newState();
  game.state = s;
  use(game);
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
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true, willow: 'done', z2a: 'done', z2b: 'done', z3: key });
  Object.assign(s.sw, { 38: true, 39: true, 156: true, 381: true, 483: true });
  s.var[40] = 2;
  s.var[43] = 69;
  s.cardiMax = 10;
  s.zeni = 15000;
  s.party = [];
  superSaiyan(w, s, 1, true); // (Goku has been one since z1field 1101)
  party(game, [4, 12, 5, 6, 7, 8, 9, 24, 10]);
  s.hand = newHand(w);
  return s;
}
function dev(game, step) {
  if (!['z3c', 'z3c36', 'z3c1256'].includes(step)) return false;
  const s = devState(game, 'z3c');
  moveTo(s, { map: '37', x: 8, y: 9 }); // (somewhere with music: map 36 has none)
  game.startField();
  begin(game);
  if (step === 'z3c') { start(game); return true; }
  party(game, C(game).party1236);
  if (step === 'z3c36') { pod(game); return true; }
  superSaiyan(game.world, s, 1, false);
  party(game, [3]);
  s.var[41] = 1256;
  (async () => {
    await play(game, '1256');
    const n = C(game).next;
    party(game, n.party);
    s.var[42] = n.party[0];
    s.var[41] = 0;
    moveTo(s, n);
    nextZ3(game, 'z3c');
  })();
  return true;
}

addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), [1237], [P3, E3, F3, CARD, ...Object.values(BG), TIME_MACHINE, COLD_FILM, SHENRON_FILM, ...SS_PICS]);
registerZ3('z3c', { maps: MAPS, start, resume, dev });

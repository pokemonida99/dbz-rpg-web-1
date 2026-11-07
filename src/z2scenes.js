// The scenes of the Z2 second half, staged like the original: `$eve.z1field` 445-561 (143_Event_Main.rb, all.rb
// 171561-172346) — the Z2 scene pictures, the Z2 face sheets, the party changes some of them make — plus the
// commands of these pages that src/cutscene.js does not know (tools/build_z2b.py): show / move / erase picture
// (the Ginyu Force pose, Porunga, the fusion with Nail, Frieza's transformations), EXP, recovery, moves learned,
// BGM changes, the Super Saiyan (src/supersaiyan.js) and the Super Spirit Bomb film (CE147).
// What happens to the party goes through `env` (src/z2b.js setZ2Env), so it changes the game state, not just the picture.
import { audio, img, sleep } from './core.js?v=20261108-0722';
import { addScenes, addNodes } from './cutscene.js?v=20261108-0722';
import { SCENE_X, SCENE_Y, ENE, PLAY_X } from './opening.js?v=20261108-0722';
import { superSaiyan } from './supersaiyan.js?v=20261108-0722';
import { setTypical, earthSaiyan } from './growth.js?v=20261108-0722';

const pic = (n) => `Graphics/Pictures/${n}`;
const BG = (n) => pic(`Z2_背景_${n}.PNG`);
const FP = pic('Z2_顔味方.PNG'), FF = pic('Z2_顔敵.PNG'), FE = pic('Z2_顔イベント.PNG'), FC = pic('顔カード.PNG');
let env = null; // { game, setParty(ids), heal(), addUses({skill: n}), member(id) }
export function setZ2Env(e) { env = e; }

// ---------- drawing helpers (add_chr at the original's places) ----------
const bg = (st, name) => st.add(name.startsWith('Graphics') ? name : BG(name), SCENE_X, SCENE_Y, [0, 0, 192, 128]);
// a face in the scene, at ENE + (dx, dy); col: the sheet's column (顔カード: 1)
const face = (st, sheet, row, dx = 0, dy = 0, col = 0, size = null) => st.add(sheet, ENE[0] + dx, ENE[1] + dy, [col * 64, 64 * row, 64, 64], false, 0, size);
// a face under the scene (the original's @play_x / @play_y row); line 1 = one row lower
const under = (st, sheet, row, dx = 0, line = 0, col = 0) => st.add(sheet, PLAY_X + dx, 0, [col * 64, 64 * row, 64, 64], true, line);
// character_output: the party's Z2 faces under the scene, three a row (four smaller when more than six)
function out(st, ctx) {
  const ids = ctx.partyc, per = ids.length > 6 ? 4 : 3;
  st.faceSize = ids.length > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    under(st, FP, id - 3, -32 * (m - 1) + 64 * j, line);
  });
}
// the Ginyu Force: the original lines the five up 64 apart (320 px, wider than a phone shows) — here Ginyu in the
// middle and the other four at half size beside him; under the scene (447), two rows
const ginyu = (st) => {
  face(st, FF, 18);
  [[21, -56, 0], [22, -56, 32], [19, 88, 0], [20, 88, 32]].forEach(([r, dx, dy]) => face(st, FF, r, dx, dy, 0, [32, 32]));
};
const ginyuUnder = (st) => [[21, -64, 0], [22, 0, 0], [18, 64, 0], [19, -32, 1], [20, 32, 1]].forEach(([r, dx, l]) => under(st, FF, r, dx, l));
const dende = (st, line = 1) => under(st, FC, 14, 0, line, 1);
const frieza = (st, ctx, row) => { face(st, FF, row); ctx.faces['弗利薩'] = [FF, row]; }; // his face in the box follows his form
// the dragon balls one to seven round the middle (z1field 456), half size so they fit
const balls = (st) => [[-128, 0], [-64, -32], [-64, 32], [0, 0], [64, -32], [64, 32], [128, 0]]
  .forEach(([dx, dy], k) => st.add(FC, ENE[0] + 16 + dx / 2, ENE[1] + 16 + dy / 2, [64, 64 * (k + 1), 64, 64], false, 0, [32, 32]));

const party = (ctx, ids) => { ctx.partyc = ids; if (env) env.setParty(ids); };
const heal = () => env && env.heal();
const uses = (k) => env && env.addUses(env.game.world.z2b[k[0]][k[1]]);
async function fadeOut(st, quiet) { if (!quiet) await st.fadeTo(1, 30); }
async function fadeIn(st, quiet) { if (!quiet) await st.fadeTo(0, 30); }
const next = (ctx) => { ctx.s.var[41] = (ctx.s.var[41] || 0) + 1; };

// z1field n → async (stage, ctx, quiet). The stage is cleared before; a fade-out first clears it again after.
const D = {
  445: (st, ctx) => { bg(st, 'ナメック星_地上'); face(st, FC, 2, 0, 0, 1); out(st, ctx); next(ctx); },
  446: (st, ctx) => { bg(st, 'フリーザ_宇宙船_内部'); frieza(st, ctx, 23); next(ctx); },
  447: (st, ctx) => { bg(st, 'フリーザ_宇宙船_内部'); frieza(st, ctx, 23); ginyuUnder(st); next(ctx); },
  448: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); ginyu(st); out(st, ctx); next(ctx); await fadeIn(st, q); },
  449: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); face(st, FP, 0); next(ctx); await fadeIn(st, q); },
  450: async (st, ctx, q) => { // 悟空到着再開: Goku joins at the front, everyone healed, his move counts up
    await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); face(st, FP, 0);
    party(ctx, [3, ...ctx.partyc.filter((id) => id !== 3)]); heal(); uses(['goku', 'uses450']);
    out(st, ctx); next(ctx); await fadeIn(st, q);
  },
  451: (st, ctx) => { bg(st, 'ナメック星_地上'); ginyu(st); out(st, ctx); next(ctx); },
  453: (st, ctx) => { bg(st, 'ナメック星_地上'); ginyu(st); out(st, ctx); next(ctx); },
  454: (st, ctx) => { bg(st, pic('Z1_背景_都崩壊.PNG')); out(st, ctx); next(ctx); },
  455: async (st, ctx, q) => { // メディカルルーム休憩: Goku in the tank; the others go on
    await fadeOut(st, q); st.clear(); bg(st, 'メディカルルーム'); face(st, FP, 0);
    heal(); party(ctx, [5, 6, 7, 8, 9, 12]); out(st, ctx); next(ctx); await fadeIn(st, q);
  },
  456: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); balls(st); out(st, ctx); next(ctx); await fadeIn(st, q); },
  457: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); frieza(st, ctx, 23); await fadeIn(st, q); next(ctx); },
  458: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, '最長老の家'); face(st, FP, 10, -64); await fadeIn(st, q); next(ctx); },
  459: (st, ctx) => { bg(st, '最長老の家'); face(st, FP, 10, -64); under(st, FF, 23); next(ctx); },
  460: (st, ctx) => { bg(st, '最長老の家'); next(ctx); },
  461: (st, ctx) => next(ctx),
  462: async (st, ctx, q) => { // デンデ到着
    await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); party(ctx, [5, 6, 7, 8, 9]);
    face(st, FC, 14, 0, 0, 1); out(st, ctx); next(ctx); await fadeIn(st, q);
  },
  463: (st, ctx) => next(ctx),
  464: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); under(st, FP, 10); frieza(st, ctx, 23); await fadeIn(st, q); next(ctx); },
  465: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); face(st, FC, 14, 0, 0, 1); out(st, ctx); await fadeIn(st, q); },
  466: (st, ctx) => { bg(st, 'ナメック星_暗い'); face(st, FC, 14, 0, 0, 1); out(st, ctx); next(ctx); },
  467: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, '界王星'); under(st, FP, 1); next(ctx); await fadeIn(st, q); },
  468: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_暗い'); face(st, FP, 1); next(ctx); await fadeIn(st, q); },
  469: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_暗い'); face(st, FP, 9); out(st, ctx); dende(st); next(ctx); await fadeIn(st, q); },
  470: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); face(st, FP, 9); out(st, ctx); dende(st); next(ctx); await fadeIn(st, q); },
  471: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 23); party(ctx, [5, 6, 7, 8, 9, 12]); heal(); out(st, ctx); dende(st); next(ctx); },
  473: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 23); out(st, ctx); dende(st); next(ctx); },
  474: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 24); out(st, ctx); dende(st); next(ctx); },
  475: (st, ctx) => { party(ctx, [4]); heal(); uses(['piccolo', 'uses475']); next(ctx); }, // ピッコロ: alone
  476: (st, ctx) => { bg(st, 'ナメック星_地上'); face(st, FP, 10); out(st, ctx); next(ctx); },
  477: (st, ctx) => { // ネイル同化後: healed, moves up, the skill ネイルと同化 (248) unless he has 神との融合 (249)
    bg(st, 'ナメック星_地上'); face(st, FP, 1); next(ctx); heal(); uses(['piccolo', 'uses477']);
    const p = env && env.member(4);
    if (p && p.typ && p.typ[0] !== 249) setTypical(env.game.world, env.game.state, p, 0, 248); // (all.rb 171942)
  },
  478: (st, ctx) => { next(ctx); party(ctx, [4, 5, 6, 7, 8, 9, 12]); heal(); },
  479: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 24); out(st, ctx); dende(st); next(ctx); },
  481: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 24); out(st, ctx); dende(st); next(ctx); },
  482: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 25); out(st, ctx); dende(st); next(ctx); },
  483: (st, ctx) => { dende(st); out(st, ctx); next(ctx); },
  484: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 25); out(st, ctx); dende(st); next(ctx); },
  486: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 25); out(st, ctx); dende(st); next(ctx); },
  487: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); out(st, ctx); next(ctx); },
  488: async (st, ctx, q) => { // メディカルルーム: Goku is healed and joins at the front
    await fadeOut(st, q); st.clear(); bg(st, 'メディカルルーム'); face(st, FP, 0);
    party(ctx, [3, ...ctx.partyc.filter((id) => id !== 3)]); await fadeIn(st, q); next(ctx); uses(['goku', 'uses488']);
  },
  489: async (st, ctx, q) => { await fadeOut(st, q); st.clear(); bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); out(st, ctx); next(ctx); await fadeIn(st, q); },
  490: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); out(st, ctx); under(st, FE, 6, 0, 1); next(ctx); },
  491: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); out(st, ctx); next(ctx); },
  492: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); out(st, ctx); next(ctx); },
  494: (st, ctx) => { bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); out(st, ctx); next(ctx); },
  495: (st, ctx) => next(ctx),
  496: (st, ctx) => { // the Super Saiyan
    bg(st, 'ナメック星_地上'); frieza(st, ctx, 26);
    if (env) { superSaiyan(env.game.world, ctx.s, 1, true); ctx.partyc = ctx.s.party.map((m) => m.id); }
    out(st, ctx); next(ctx);
  },
  498: (st, ctx) => { // Super Vegeta comes: Vegeta leaves the party
    if (ctx.s.sw[105]) party(ctx, ctx.partyc.filter((id) => id !== 12 && id !== 19));
    out(st, ctx); next(ctx);
  },
  499: (st, ctx) => { bg(st, 'ナメック星_地上'); face(st, FP, 9); out(st, ctx); next(ctx); },
  500: (st, ctx) => { bg(st, 'ナメック星_地上'); face(st, FF, 28); ctx.faces['貝吉塔'] = [FF, 28]; out(st, ctx); next(ctx); },
  502: (st, ctx) => { out(st, ctx); next(ctx); },
  506: (st, ctx) => { bg(st, 'ナメック星_家'); face(st, FE, 1); out(st, ctx); next(ctx); },
  507: (st, ctx) => { bg(st, 'ナメック星_家'); face(st, FE, 7); out(st, ctx); next(ctx); uses(['piccolo', 'uses507']); },
  508: (st, ctx) => { bg(st, 'ナメック星_地上'); face(st, FF, 29, -32); face(st, FF, 30, 32); out(st, ctx); next(ctx); },
  509: (st, ctx) => { // バーダック: he joins at the end of the party
    bg(st, 'ナメック星_地上'); face(st, FP, 13); party(ctx, [...ctx.partyc.filter((id) => id !== 16), 16]); out(st, ctx); next(ctx);
  },
  510: (st, ctx) => { bg(st, 'ナメック星_地上'); face(st, FF, 29, -32); face(st, FF, 30, 32); out(st, ctx); next(ctx); },
  512: (st, ctx) => { party(ctx, ctx.partyc.filter((id) => id !== 16)); out(st, ctx); face(st, FP, 13); next(ctx); }, // バーダック別れ
  513: (st, ctx) => { out(st, ctx); next(ctx); },
  514: (st, ctx) => next(ctx), // ターレスとスラッグ(登場): map 30 next
  521: (st, ctx) => { out(st, ctx); if ([33, 35].includes(ctx.s.var[43])) dende(st); },
  522: (st, ctx) => { out(st, ctx); bg(st, 'フリーザ_宇宙船_内部'); face(st, FC, 40); if ([33, 35].includes(ctx.s.var[43])) dende(st); },
  543: (st) => { bg(st, '界王星'); face(st, FC, 25, 0, 0, 1); },
  544: (st, ctx) => out(st, ctx),
  545: (st, ctx) => { out(st, ctx); bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); },
  546: (st, ctx) => { out(st, ctx); bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); face(st, FP, 3, 64); }, // Krillin to his right
  547: (st, ctx) => { out(st, ctx); bg(st, 'ナメック星_地上'); frieza(st, ctx, 26); },
  548: (st, ctx) => { out(st, ctx); bg(st, 'ナメック星_地上'); frieza(st, ctx, 27); },
  561: (st, ctx) => out(st, ctx),
  602: (st, ctx) => { face(st, FE, 4); out(st, ctx); },
};
const BATTLES = [452, 472, 480, 485, 493, 497, 501, 511, 531, 556]; // battle_process: src/z2b.js runs them
const PICS = [FP, FF, FE, FC, ...['ナメック星_地上', 'フリーザ_宇宙船_内部', 'メディカルルーム', '最長老の家', 'ナメック星_暗い', '界王星', 'ナメック星_家'].map(BG),
  pic('Z1_背景_都崩壊.PNG')];
addScenes(Object.fromEntries(Object.entries(D).map(([n, f]) => [n, { draw: f }])), BATTLES, PICS);

// ---------- the pages' other commands ----------
// pictures (show / move / erase picture) live on the stage as 'screen' sprites: the original's 640×480 coordinates
function picSprite(st, n) { return st.sprites && st.sprites.find((x) => x.pic === n); }
async function showPic(node, { stage, ctx, ui }) {
  if (!stage.sprites) return;
  if (ui) ui.dlg.hidden = true; // the original closes the message window for its pictures
  if (!ctx.film) { stage.clear(); ctx.film = true; } // the scene goes; pictures on black
  const e = img(node.name);
  await e.p;
  const w = e.ok ? e.im.width : 0, h = e.ok ? e.im.height : 0, z = (node.zoom || 100) / 100;
  const old = picSprite(stage, node.n);
  if (old) stage.sprites.splice(stage.sprites.indexOf(old), 1);
  const sp = { pic: node.n, path: node.name, w: w * z, h: h * z, o: node.o, src: [0, 0, w, h], size: 'screen', op: 255 };
  place(sp, node.px, node.py);
  stage.sprites.push(sp);
}
function place(sp, x, y) { sp.ox = x; sp.oy = y; sp.x = sp.o ? x - sp.w / 2 : x; sp.y = sp.o ? y - sp.h / 2 : y; }
async function movePic(node, { stage, ui, quiet }) {
  const sp = stage.sprites && picSprite(stage, node.n);
  if (!sp) return;
  const from = [sp.ox, sp.oy, sp.op], to = [node.px, node.py, node.op];
  const run = async () => {
    for (let f = 1; f <= node.dur; f++) {
      const k = f / node.dur;
      place(sp, from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k);
      sp.op = from[2] + (to[2] - from[2]) * k;
      if (quiet || ui.skipped) break;
      await ui.wait(1);
    }
    place(sp, to[0], to[1]);
    sp.op = to[2];
  };
  if (node.wait) await run(); else run();
}

addNodes({
  pic: showPic,
  move: movePic,
  erase: async (node, { stage, ctx }) => {
    const sp = stage.sprites && picSprite(stage, node.n);
    if (sp) stage.sprites.splice(stage.sprites.indexOf(sp), 1);
    if (stage.sprites && !stage.sprites.some((x) => x.pic != null)) ctx.film = false;
  },
  fadein: async (node, { stage, quiet }) => { if (!quiet) await stage.fadeTo(0, 30); },
  quake: async (node, { ui, quiet }) => { // shake the screen (225)
    if (quiet) return;
    ui.el.classList.add('shake');
    await ui.wait(node.dur);
    ui.el.classList.remove('shake');
  },
  bgm: async (node, { quiet }) => { if (!quiet) { if (node.name) audio.playBgm(node.name); else audio.stopBgm(); } },
  exp: async (node) => env && env.gainExp(node.id, node.n),
  uses: async (node) => env && env.addUses(node.map), // cha_tec_puls (CE227)
  recover: async (node) => env && env.heal(node.id),
  skill: async (node) => env && env.learn(node.id, node.skill, node.learn),
  ss: async (node, { ctx }) => { if (env) { superSaiyan(env.game.world, ctx.s, node.on, true); ctx.partyc = ctx.s.party.map((m) => m.id); } },
  typical: async (node) => { // 地球育ちのサイヤ人 in place of Z戦士の絆 (same level): set_typical_skill 3, 2, 678 + x
    const m = env && env.member(node.id);
    if (m) earthSaiyan(env.game.world, env.game.state, m);
  },
  leave: async (node, { ctx }) => { if (env) { env.leave(node.id); ctx.partyc = ctx.s.party.map((m) => m.id); } },
  revive: async (node) => { const m = env && env.member(node.id); if (m) { m.ko = false; m.hp = Math.max(1, m.hp); } },
  film: async (node, env2) => FILMS[node.name] && FILMS[node.name](env2),
});

// CE147 (Z2超元気玉でフリーザ撃破): the Super Spirit Bomb comes down on Frieza (the view drops with it, shaking),
// the hit (two pictures in turn), then Namek with a hole in it
const FILMS = {
  async superGenki({ stage, ui, quiet }) {
    if (quiet || !stage.sprites) return;
    const add = async (n, name, o, x, y) => showPic({ n, name: pic(name), o, px: x, py: y }, { stage, ctx: { film: true } });
    stage.clear();
    let fx = 256, fy = -48, bx = 0, by = -276;
    await add(1, 'Z2_戦闘_必殺技_デスボール(極大玉縦)(超元気玉).PNG', 0, bx, by);
    await add(2, 'z2_フリーザ超元気弾(フリーザのみ).PNG', 0, fx, fy);
    for (let t = 1; t <= 300 && !ui.skipped; t++) {
      const drop = (t >= 29 && t <= 59) || (t >= 92 && t <= 122) || (t >= 156 && t <= 164) || (t >= 198 && t <= 232) ? 2 : 0;
      fy += drop; by += drop;
      const shake = t % 8 === 0 ? -4 : t % 4 === 0 ? 4 : 0;
      place(picSprite(stage, 1), bx + shake, by); place(picSprite(stage, 2), fx + shake, fy);
      await ui.wait(1);
    }
    stage.clear();
    audio.se('Z2 ラスト超元気玉ヒット', 80);
    for (let t = 1; t <= 192 && !ui.skipped; t++) {
      if (t % 4 === 1) await add(3, `z2_フリーザ超元気弾_ヒット${(t >> 2) % 2 ? 2 : 1}.PNG`, 0, t % 8 < 4 ? 0 : 4, 0);
      await ui.wait(1);
    }
    await ui.wait(60);
    stage.clear();
    audio.se('Z2 ラスト_ナメック星に穴が開く', 80);
    audio.stopBgm();
    let k = 1, y = 640;
    for (let t = 1; t <= 540 && !ui.skipped; t++) {
      if (t % 4 === 0) k = (k % 3) + 1;
      if (y > 3) y -= 2;
      await add(4, `z2_フリーザ撃破界王星崩壊_${k}.PNG`, 1, 320, 240 + (y - 240) / 4);
      await ui.wait(1);
    }
    stage.clear();
  },
};
export const sleepFrames = (n) => sleep((n * 1000) / 60);

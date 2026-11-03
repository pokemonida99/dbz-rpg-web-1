// The story between the chapters, staged like the original: every `$eve.z1field $game_variables[41]` of the Map007
// story pages draws its scene (143_Event_Main.rb z1field: the scene picture, the face of whoever the party faces,
// the party's faces, music, fades) while the text plays in the message box — the same stage as the opening
// (src/opening.js), with its 略過 button. Events come from tools/build_data.py script(): the usual runEvent nodes plus
// {v41} (the page, which z1field reads), {z1field}, {fadeout}.
// Skipping still applies every switch, variable and card of the rest of the event, so the story flags stay right.
import { audio, loadImages, toast } from './core.js?v=20261103-0825';
import { eventCard } from './items.js?v=20261103-0825';
import { overlay, Stage, say, SCENE_X, SCENE_Y, SCROLL_X, ENE, PLAY_X } from './opening.js?v=20261103-0825';

const pic = (n) => `Graphics/Pictures/${n}.PNG`;
const BG = (n) => pic(`Z1_背景_${n}`);
const PARTY = pic('Z1_顔味方'), EVENT = pic('Z1_顔イベント'), FOE = pic('Z1_顔敵');
const CMP = [(a, b) => a === b, (a, b) => a >= b, (a, b) => a <= b, (a, b) => a > b, (a, b) => a < b, (a, b) => a !== b];

let world = null;
export function setCutsceneWorld(w) { world = w; }

// ---------- z1field n: what each scene shows (143_Event_Main.rb, the Z1 story part) ----------
// bgm, bg (192×128 scene picture, or `scroll` 512×128), foe (the face in the scene: [sheet, row, dy]), faces (faces under
// the scene: [sheet, row, x offset]), out (character_output: the party's faces), party ($partyc becomes this),
// adds (more faces in the scene: [sheet, row, dx, dy] from the foe's place), fadein, next (variable 41 afterwards: '+' adds one, a number sets it; none leaves it)
const S = {
  58: { bgm: 'Z1 戦闘前', out: true, bg: '山', foe: [FOE, 10], next: '+' }, // ラディッツ
  60: { bgm: 'Z1 戦闘前', bg: '山', foe: [FOE, 10], next: '+', // ラディッツ撃墜: who is still standing
    faces: (sw) => (sw[865] ? [[PARTY, 0, 32], [EVENT, 0, -32]] : sw[864] ? [[PARTY, 1, 32], [EVENT, 0, -32]]
      : [[PARTY, 0, 0], [PARTY, 1, 64], [EVENT, 0, -64]]) },
  // ベジータとナッパ: the original puts their faces beside the scene; here they go under it
  61: { bgm: 'Z1 イベント2', bg: '惑星_ベジータとナッパ', faces: [[FOE, 12, -32], [FOE, 11, 32]], fadein: true, next: '+' },
  62: { scroll: '宇宙船_ベジータとナッパ', fadein: true, next: '+' }, // ベジータとナッパ宇宙船
  63: { bgm: 'Z1 イベント4', bg: '山', foe: [EVENT, 4], faces: [[PARTY, 1, 64], [EVENT, 0, -64], [EVENT, 14, 0]], fadein: true, next: '+' }, // 悟空死亡
  64: { bg: 'あの世', fadein: true, next: '+' },
  65: { bg: 'エンマ様', foe: [EVENT, 16], faces: [[EVENT, 14, 32], [PARTY, 0, -32]], fadein: true, next: '+' },
  66: { bg: '蛇の道', fadein: true, next: '+' },
  67: { bgm: 'DB3 イベント07', bg: 'ガーリック城', fadein: true, next: '+' },
  68: { bg: 'ガーリック城_ガーリックの間', foe: [FOE, 16], faces: [[FOE, 13, -64], [FOE, 14, 0], [FOE, 15, 64]], fadein: true, next: '+' },
  69: { bgm: 'Z1 イベント4', party: [4, 5, 6, 7, 8, 9], bg: 'カリン塔', foe: [EVENT, 8], out: true, fadein: true, next: '+' },
  70: { keep: true, next: '+' }, // チーム分け (Scene_Team_Divide: src/chapter2.js runs it between the two parts)
  71: { bgm: 'Z1 イベント4', party: [4, 5, 6, 7, 8, 9], bg: 'カリン塔', foe: [EVENT, 8], out: true, fadein: true, next: '+' },
  72: { party: [3], fadein: true }, // ゴクウあらすじ
  75: { bgm: 'Z1 イベント4', bg: '山', foe: [EVENT, 14], faces: [[PARTY, 0, 0], [PARTY, 1, 64], [EVENT, 0, -64]], fadein: true, next: 64 }, // 悟空が生きてた
  83: { bgm: 'Z1 イベント1', bg: '界王星', out: true },
  84: { bgm: 'Z1 界王', bg: '界王星_地上', foe: [EVENT, 18], out: true, next: '+' },
  85: { bgm: 'DB3 イベント02', party: (v) => [v[45], v[46]], out: true, fadein: true, next: '+' }, // 北へ
  86: { piccoloGohan: true }, // ピッコロと悟飯
  92: { bgm: 'DB3 戦闘前', foe: [FOE, 15], out: true, next: '+' }, // サンショ
  94: { bgm: 'DB3 戦闘前', foe: [FOE, 15], out: true, next: '+' },
  95: { foe: [EVENT, 23], out: true, next: '+' }, // 二星球
  96: { bgm: 'Z1 界王', party: [3], fadein: true, next: '+' }, // 界王星そのころ
  97: { bg: '界王星_地上', foe: [EVENT, 18], out: true, next: '+' },
  98: { bg: '界王星_地上', foe: [EVENT, 17], out: true }, // バブルス
  99: { bgm: 'Z1 界王', bg: '界王星_地上', foe: [EVENT, 18], out: true },
  100: { bgm: 'DB3 イベント02', party: (v) => [v[47], v[48]], out: true, fadein: true, next: 86 }, // 東へ
  102: { bgm: 'DB3 戦闘前', foe: [FOE, 14], out: true, next: '+' }, // ニッキー
  104: { bgm: 'DB3 戦闘前', foe: [FOE, 14], out: true, next: '+' },
  105: { foe: [EVENT, 26], out: true, next: '+' }, // 五星球
  106: { bgm: 'Z1 界王', party: [3], fadein: true, next: '+' },
  107: { bg: '界王星_地上', foe: [EVENT, 18], out: true, next: '+' },
  108: { bg: '界王星_地上', foe: [EVENT, 13], out: true }, // グレゴリー
  109: { bgm: 'Z1 界王', bg: '界王星_地上', foe: [EVENT, 18], out: true }, // 界王様 (after the Gregory training)
  110: { bgm: 'DB3 イベント02', party: (v) => [v[49], v[50]], out: true, fadein: true, next: 86 }, // 西へ (ジンジャーエリア前)
  111: { bgm: 'Z1 イベント1', foe: [EVENT, 30], out: true }, // 牛魔王
  112: { bgm: 'DB3 戦闘前', foe: [FOE, 13], out: true, next: '+' }, // ジンジャー
  114: { bgm: 'DB3 戦闘前', foe: [FOE, 13], out: true, next: '+' },
  115: { foe: [EVENT, 28], out: true, next: '+' }, // 七星球
  116: { bgm: 'Z1 イベント3', party: [4, 5, 6, 7, 8, 9], bg: 'ガーリック城', out: true, fadein: true, next: '+' }, // ガーリック城集結
  // ---- chapter 6 (src/chapter6.js): King Kai's last training, Shenron, the Saiyans, the end of Z1 ----
  128: { bgm: 'Z1 界王', party: [3], fadein: true, next: '+' }, // 界王星そのころ
  129: { bg: '界王星_地上', foe: [EVENT, 18], out: true, next: '+' }, // 界王様
  132: { bgm: 'Z1 界王', bg: '界王星_地上', foe: [EVENT, 18], out: true, next: '+' }, // 界王様 (beaten)
  133: { bgm: 'DB3 カメハウス', bg: 'カメハウス', foe: [EVENT, 1], out: true, fadein: true, next: '+' }, // カメハウス
  // ドラゴンボール: the seven balls in the scene (at half size, so they fit the narrow scene), the Kame House people under it
  134: { balls: true, faces: [[EVENT, 1, -32], [EVENT, 3, 32], [EVENT, 20, -32, 1], [EVENT, 5, 32, 1]], next: '+' },
  135: { full: pic('Z1_背景_シェンロン').replace('.PNG', '.png'), next: '+' }, // シェンロン (a 640×480 picture)
  136: { bgm: 'Z1 フィールド1', bg: '界王星_地上', foe: [EVENT, 18], out: true, fadein: true, next: '+' },
  137: { anim: 'snakeWay', next: '+' }, // 悟空蛇の道を帰る
  138: { bgm: 'Z1 イベント2', scroll: '都(長い)', fadein: true, next: '+' }, // 都
  139: { anim: 'podFalls', next: '+' }, // 都(宇宙船落下)
  // ベジータとナッパ: beside the scene in the original, under it here (as in 61)
  140: { bg: '都', faces: [[FOE, 12, -32], [FOE, 11, 32]], fadein: true, next: '+' },
  141: { se: 'Z1 都爆発', bg: '爆発', faces: [[FOE, 12, -32], [FOE, 11, 32]], next: '+', wait: 40 },
  142: { bg: '都崩壊', faces: [[FOE, 12, -32], [FOE, 11, 32]], fadein: true, next: '+' },
  143: { anim: 'saiyansFly', next: '+' }, // ベジータとナッパ飛ぶ
  144: { bgm: 'Z1 イベント4', party: [4, 5, 6, 7, 8, 9], out: true, bg: 'カメハウス', foe: [EVENT, 14], fadein: true }, // 神様とZ戦士
  147: { bgm: 'Z1 戦闘前', se: 'Z1 怪しい気', bg: '平野_サイバイマン', out: true, next: '+' }, // サイバイマン
  148: { se: 'Z1 ダメージ', bg: '平野_サイバイマン', saibamen: true, out: true, next: '+' }, // サイバイマン(発見)
  150: { bgm: 'Z1 イベント3', bg: '岩場_ナッパ', foe: [FOE, 11], out: true, next: '+' }, // ナッパ
  152: { anim: 'gokuFlies', next: '+' }, // 悟空到着
  153: { bgm: 'Z1 イベント4', foe: [PARTY, 0], out: true }, // ゴクウ到着2 (src/chapter6.js adds him to the party)
  154: { bgm: 'Z1 イベント3', bg: '岩場_ベジータ', foe: [FOE, 12], out: true, next: '+' }, // ベジータ
  156: { bgm: 'Z1 イベント3', bg: '岩場_ベジータ', foe: [FOE, 12], out: true, next: '+' }, // ベジータ撃破
  157: { bg: '岩場_ベジータ', out: true, next: '+' }, // ベジータ逃走
  158: { anim: 'podLeaves', next: '+' }, // ベジータ逃走(宇宙船)
  159: { bgm: 'Z1 フィールド1', bg: '界王星_地上', foe: [EVENT, 18], fadein: true, next: '+' }, // 界王様
  160: { fadein: true, next: 200 }, // エンディング前
};
const BATTLES = [59, 93, 103, 113, 130, 149, 151, 155]; // battle_process: the battle itself is run by the chapter code
const EV = (n) => pic(`Z1_イベント_${n}`);
// the moving scenes (a loop of Graphics.update in the original: one picture per frame)
const ANIM = {
  * snakeWay(stage) { // 137: Goku flies back down Snake Way
    stage.se('Z1 飛ぶ');
    for (let x = 0; x <= 100; x++) {
      yield () => { stage.add(BG('スクロール_蛇の道'), SCROLL_X, SCENE_Y, [512 - x * 4, 0, 512, 128]); stage.add(EV('ゴクウ_蛇の道を飛ぶ'), SCROLL_X + 226, SCENE_Y + 40, [0, 0, 54, 18]); };
    }
  },
  * podFalls(stage) { // 139: the pod falls on the city
    stage.se('Z1 宇宙船落下');
    for (let x = 0; x <= 35; x++) {
      yield () => { stage.add(BG('都(長い)'), SCROLL_X, SCENE_Y, [0, 0, 512, 128]); stage.add(EV('都に落ちる宇宙船'), SCROLL_X + 320 - x * 6, x * 4, [0, 0, 80, 76]); };
    }
  },
  * saiyansFly(stage) { // 143: Vegeta and Nappa fly off over the mountains
    stage.se('Z1 エネルギー波2');
    for (let x = 0; x <= 100; x++) {
      yield () => { stage.add(BG('スクロール_山'), SCROLL_X, SCENE_Y, [512 - x * 4, 0, 512, 128]); stage.add(EV('ベジータとナッパ'), SCROLL_X + 194, SCENE_Y + 20, [0, 0, 126, 54]); };
    }
  },
  * gokuFlies(stage) { // 152: Goku on the Nimbus
    audio.playBgm('DB3 筋斗雲');
    stage.se('Z1 飛ぶ');
    for (let x = 0; x <= 100; x++) {
      yield () => { stage.add(BG('スクロール_山'), SCROLL_X, SCENE_Y, [512 - x * 4, 0, 512, 128]); stage.add(EV('ゴクウ'), SCROLL_X + 210, SCENE_Y + 20, [0, 0, 96, 74]); };
    }
  },
  * podLeaves(stage, ctx) { // 158: Vegeta's pod rises out of the rocks
    stage.se('Z1 飛ぶ');
    for (let x = 0; x <= 20; x++) {
      yield () => { partyFaces(stage, ctx.partyc); stage.bg('岩場_ベジータ'); stage.add(EV('宇宙船(ベジータ逃走)'), ENE[0] + 24, ENE[1] + 54 - x * 4, [0, 0, 16, 16]); };
    }
  },
};
const pics = () => [PARTY, EVENT, FOE, ...new Set(Object.values(S).flatMap((d) => [d.bg && BG(d.bg), d.scroll && BG(d.scroll), d.full]).filter(Boolean)),
  BG('ピッコロと悟飯'), BG('スクロール_蛇の道'), BG('スクロール_山'), pic('顔カード'),
  ...['ゴクウ_蛇の道を飛ぶ', '都に落ちる宇宙船', 'ベジータとナッパ', 'ゴクウ', '宇宙船(ベジータ逃走)'].map(EV), ...MORE_PICS];

// later chapters bring their own scenes (src/chapter5.js …): z1field entries as above, and their battle_process numbers;
// an entry may instead draw itself: { draw(stage, ctx, quiet) } (src/z2scenes.js), and `pictures` to load first
const MORE_PICS = [];
export function addScenes(more, battles = [], pictures = []) {
  Object.assign(S, more);
  BATTLES.push(...battles);
  MORE_PICS.push(...pictures);
}
// nodes of a later chapter's own kinds ({x: name, …}, e.g. pictures, EXP, the Super Saiyan): name → async fn(node, env)
const EXT = {};
export function addNodes(more) { Object.assign(EXT, more); }
export const registerScenes = addScenes; // the same, by the name src/chapter4.js uses

// character_output: the party's faces centred under the scene, three to a row
// (more than six: four a row, drawn smaller, so the message box still fits on a short phone; nine: five a row, smaller still)
function partyFaces(stage, ids) {
  const per = ids.length > 8 ? 5 : ids.length > 6 ? 4 : 3;
  stage.faceSize = ids.length > 8 ? 40 : ids.length > 6 ? 48 : 64;
  ids.forEach((id, k) => {
    const line = Math.floor(k / per), m = Math.min(per, ids.length - per * line), j = k % per;
    stage.party(PARTY, id - 3, -32 * (m - 1) + 64 * j, line);
  });
}

// quiet: skipped — only variable 41 and the switches move on
const NO_STAGE = { clear() {}, bg() {}, add() {}, party() {}, async fadeTo() {} };

async function z1field(stage, ctx, quiet = false) {
  const v = ctx.s.var, n = v[41] || 0;
  if (BATTLES.includes(n)) return;
  const d = S[n];
  if (!d) { stage.clear(); return; }
  if (d.fadeout && !quiet) await stage.fadeTo(1, 30); // Graphics.fadeout before the scene is drawn
  if (d.draw) { if (!quiet) { stage.clear(); stage.faceSize = 64; } await d.draw(stage, ctx, quiet); return; } // (also moves variable 41 on when skipped)
  if (!d.keep) { stage.clear(); stage.faceSize = 64; }
  if (d.bgm && !quiet) audio.playBgm(d.bgm);
  if (d.party) ctx.partyc = typeof d.party === 'function' ? d.party(v, ctx.s.sw || {}, ctx.partyc) : d.party;
  if (d.piccoloGohan) {
    const p = ctx.partyc;
    if (p.length === 2 && p.includes(4) && p.includes(5)) {
      stage.bg('ピッコロと悟飯');
      partyFaces(stage, p);
      ctx.s.sw[50] = true;
      await stage.fadeTo(0, 30);
    }
    return;
  }
  if (d.se && !quiet) audio.se(d.se, 80);
  if (d.anim) {
    if (!quiet) for (const frame of ANIM[d.anim](stage, ctx)) { if (stage.ui.skipped) break; stage.clear(); frame(); await stage.ui.wait(1); }
    stage.clear();
  }
  if (d.bg) stage.bg(d.bg);
  if (d.pic) stage.add(d.pic, SCENE_X, SCENE_Y, [0, 0, 192, 128]); // a picture by its path (the Z2 scenes)
  if (d.big) stage.add(d.big[0], d.big[1], d.big[2], d.big[3]); // [path, x, y, src]: a picture of another size
  for (const b of d.bigs || []) stage.add(b[0], b[1], b[2], b[3]); // more of them (Z4: the plane over the sky)
  if (d.scroll) stage.add(BG(d.scroll), SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
  if (d.full) stage.add(d.full, 0, 0, [0, 0, 640, 480], false, 0, 'full');
  if (d.foe) stage.add(d.foe[0], ENE[0], ENE[1] + (d.foe[2] || 0), [64 * (d.foe[3] || 0), 64 * d.foe[1], 64, 64]); // [sheet, row, dy, column]
  // more faces in the scene (size: drawn that many px square, its middle at dx / 2 — a row of four that fits the scene)
  for (const [sheet, row, dx, dy, size, col = 0] of d.adds || []) { // (col: 顔カード's column of the part of the story)
    if (size) stage.add(sheet, ENE[0] + 32 - size / 2 + dx / 2, ENE[1] + 32 - size / 2 + dy, [64 * col, 64 * row, 64, 64], false, 0, [size, size]);
    else stage.add(sheet, ENE[0] + dx, ENE[1] + dy, [64 * col, 64 * row, 64, 64]);
  }
  if (d.balls) { // z1field 134: the balls one to seven in a diamond round the middle
    [[-128, 0], [-64, -32], [-64, 32], [0, 0], [64, -32], [64, 32], [128, 0]].forEach(([dx, dy], k) => {
      stage.add(EVENT, ENE[0] + 16 + dx / 2, ENE[1] + 16 + dy / 2, [0, 64 * (22 + k), 64, 64], false, 0, [32, 32]);
    });
  }
  if (d.saibamen) for (let k = 0; k < 6; k++) stage.add(FOE, SCENE_X + 32 * k, ENE[1] + 16, [0, 64 * 3, 64, 64], false, 0, [32, 32]); // six in a row
  if (d.out) partyFaces(stage, ctx.partyc);
  if (d.faceSize) stage.faceSize = d.faceSize; // more faces under the scene than fit at 64
  // faces under the party's (line 1 = @play_y + 64) go under however many rows the party took here
  const below = d.out ? Math.ceil(ctx.partyc.length / (ctx.partyc.length > 8 ? 5 : ctx.partyc.length > 6 ? 4 : 3)) - 1 : 0;
  for (const [sheet, row, dx, line, col] of (typeof d.faces === 'function' ? d.faces(ctx.s.sw) : d.faces) || []) {
    const ln = line ? line + below : 0;
    if (col) stage.add(sheet, PLAY_X + dx, 0, [64 * col, 64 * row, 64, 64], true, ln); // (顔カード: the column of the part of the story)
    else stage.party(sheet, row, dx, ln);
  }
  if (d.next === '+') v[41] = n + 1;
  else if (d.next) v[41] = d.next;
  if (d.wait && !quiet) await stage.ui.wait(d.wait);
  if (d.fadein) await stage.fadeTo(0, 30);
}

// Plays a list of [{bgm, nodes}] (the chapter scenes, tools/build_chapter2.py scenes()) as one cutscene.
// faces: speaker → face, on top of world.faces (src/z2b.js: the Z2 sheets)
export async function playScenes(list, s, more = {}) {
  const ui = overlay();
  await loadImages(pics());
  const stage = new Stage(ui);
  const { '？': _raditz, ...openingFaces } = (world.opening && world.opening.faces) || {}; // the opening's ？ is Raditz (src/opening.js): only there
  const faces = { ...openingFaces, ...world.faces, ...more.faces };
  const sw = s.sw || (s.sw = {});
  const v = s.var || (s.var = {});
  const ctx = { s, partyc: s.party.map((m) => m.id), faces };
  const test = (c) => (c[0] === 'sw' ? !!sw[c[1]] === c[2] : c[0] === 'var' ? CMP[c[3]](v[c[1]] || 0, c[2])
    : c[0] === 'vv' ? CMP[c[3]](v[c[1]] || 0, v[c[2]] || 0) : c[0] === 'party' ? s.party.length > c[1] : false);
  const run = async (nodes) => {
    for (const n of nodes) {
      const quiet = ui.skipped; // skipped: only the story state still changes
      if (n.say) { if (!quiet) await say(ui, faces, [n.say[0], n.say[1], n.say[2]]); }
      else if (n.if) { const r = await run(test(n.if) ? n.then : n.else); if (r) return r; }
      else if (n.sw) { for (let i = n.sw[0]; i <= n.sw[1]; i++) sw[i] = n.sw[2]; }
      else if (n.var) { const [id, op, x] = n.var; v[id] = op === 0 ? x : (v[id] || 0) + (op === 1 ? x : -x); }
      else if (n.v41) v[41] = n.v41;
      else if (n.item) { const it = eventCard(s, n.item[0], n.item[1]); if (it && n.item[1] > 0 && !quiet) { audio.se('Z1 アイテム取得', 80); toast(`得到了「${it.name}」卡片！`); } }
      else if (n.se) { // (repeat: a sound played every few frames, like the scouter beeping)
        if (!quiet) for (let k = 0; k < (n.repeat || 1) && !ui.skipped; k++) { audio.se(n.se, 80); if (n.repeat) await ui.wait(n.every); }
      }
      else if (n.z1field) { ui.dlg.hidden = true; await z1field(quiet ? NO_STAGE : stage, ctx, quiet); }
      else if (n.fadeout) { ui.dlg.hidden = true; if (!quiet) await stage.fadeTo(1, 30); }
      else if (n.bgs) { if (!quiet) audio.playBgs(n.bgs, n.vol); }
      else if (n.bgm !== undefined) { if (!quiet) { if (n.bgm) audio.playBgm(n.bgm); else audio.stopBgm(); } } // (pages converted with their BGM commands; '' stops it)
      else if (n.bgmFade != null) { if (!quiet) audio.fadeBgm(n.bgmFade); }
      else if (n.partyc) ctx.partyc = n.partyc; // `$partyc = [...]`: who the scenes show
      else if (n.partycAdd) { if (!ctx.partyc.includes(n.partycAdd)) ctx.partyc = [...ctx.partyc, n.partycAdd]; } // `$partyc << id`
      else if (n.bgsFade != null) audio.fadeBgs(n.bgsFade);
      else if (n.shake != null) ui.el.classList.toggle('shake', n.shake && !quiet); // 画面揺らすフラグ
      else if (n.flash) { if (!quiet) await stage.doFlash(n.flash); }
      else if (n.wait) { if (!quiet) await ui.wait(n.wait); }
      else if (n.choice) { const k = quiet ? 0 : await choice(ui, n.choice); const r = await run(n.branches[k] || []); if (r) return r; } // skipped: the first answer
      else if (n.loop) { // 112 loop … 413 (a menu asked again until its 113 break); skipped: once round
        for (let k = 0; k < 99; k++) { const r = await run(n.loop); if (r === 'break' || ui.skipped) break; if (r) return r; }
      }
      else if (n.brk) return 'break';
      else if (n.x) { if (EXT[n.x]) await EXT[n.x](n, { ui, stage: quiet ? NO_STAGE : stage, ctx, s, quiet }); }
      else if (n.end) return true;
    }
    return false;
  };
  for (const sc of list) {
    if (sc.bgm && !ui.skipped) audio.playBgm(sc.bgm);
    if (await run(sc.nodes)) break;
  }
  if (ui.skipped) audio.seStop();
  audio.stopBgs();
  stage.running = false;
  ui.close();
}

// the choice window over the last line (page 301: 是 / 否); resolves with the index
function choice(ui, options) {
  return new Promise((res) => {
    const box = document.createElement('div');
    box.className = 'cs-choices';
    box.style.cssText = 'position:absolute;left:0;right:0;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:0 12px;z-index:5';
    if (ui.dlg.hidden) box.style.bottom = '3%'; // a menu straight after a scene (Z3 town: no line shown) — where the window would be
    else box.style.top = `${ui.dlg.offsetTop + ui.dlg.offsetHeight + 10}px`; // under the message window
    options.forEach((label, k) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.style.whiteSpace = 'nowrap'; // (four answers: the row wraps instead of each word)
      b.textContent = label;
      b.onpointerdown = (e) => { e.stopPropagation(); box.remove(); audio.se('Z3 決定', 80); res(k); };
      box.appendChild(b);
    });
    ui.el.appendChild(box);
    ui.onSkip.push(() => { box.remove(); res(0); });
  });
}

// one event (a node list) as a cutscene
export const playEvent = (nodes, s, more) => playScenes([{ nodes }], s, more);

// common events 203 / 204: whether Goku / Piccolo were down at the end of the Raditz battle (switches 864 / 865);
// the story after it (z1field 60, page 60) goes by them
export function raditzOutcome(s) {
  const down = (id) => { const m = s.party.find((p) => p.id === id); return !!(m && (m.ko || m.hp <= 0)); };
  s.sw = s.sw || {};
  s.sw[864] = down(3);
  s.sw[865] = down(4);
}


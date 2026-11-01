// The story between the chapters, staged like the original: every `$eve.z1field $game_variables[41]` of the Map007
// story pages draws its scene (143_Event_Main.rb z1field: the scene picture, the face of whoever the party faces,
// the party's faces, music, fades) while the text plays in the message box — the same stage as the opening
// (src/opening.js), with its 略過 button. Events come from tools/build_data.py script(): the usual runEvent nodes plus
// {v41} (the page, which z1field reads), {z1field}, {fadeout}.
// Skipping still applies every switch, variable and card of the rest of the event, so the story flags stay right.
import { audio, loadImages, toast } from './core.js?v=20261101-2006';
import { eventCard } from './items.js?v=20261101-2006';
import { overlay, Stage, say, SCENE_Y, SCROLL_X, ENE } from './opening.js?v=20261101-2006';

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
};
const BATTLES = [59, 93, 103]; // battle_process: the battle itself is run by the chapter code
const pics = () => [PARTY, EVENT, FOE, ...new Set(Object.values(S).flatMap((d) => [d.bg && BG(d.bg), d.scroll && BG(d.scroll)]).filter(Boolean)),
  BG('ピッコロと悟飯')];

// later chapters bring their own scenes (src/chapter5.js …): z1field entries as above, and their battle_process numbers
export function addScenes(more, battles = []) {
  Object.assign(S, more);
  BATTLES.push(...battles);
}
export const registerScenes = addScenes; // the same, by the name src/chapter4.js uses

// character_output: the party's faces centred under the scene, three to a row
function partyFaces(stage, ids) {
  ids.forEach((id, k) => {
    const line = Math.floor(k / 3), m = Math.min(3, ids.length - 3 * line), j = k % 3;
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
  if (!d.keep) stage.clear();
  if (d.bgm && !quiet) audio.playBgm(d.bgm);
  if (d.party) ctx.partyc = typeof d.party === 'function' ? d.party(v) : d.party;
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
  if (d.bg) stage.bg(d.bg);
  if (d.scroll) stage.add(BG(d.scroll), SCROLL_X, SCENE_Y, [0, 0, 512, 128]);
  if (d.foe) stage.add(d.foe[0], ENE[0], ENE[1] + (d.foe[2] || 0), [0, 64 * d.foe[1], 64, 64]);
  for (const [sheet, row, dx, dy] of d.adds || []) stage.add(sheet, ENE[0] + dx, ENE[1] + dy, [0, 64 * row, 64, 64]); // more faces in the scene
  for (const [sheet, row, dx] of (typeof d.faces === 'function' ? d.faces(ctx.s.sw) : d.faces) || []) stage.party(sheet, row, dx);
  if (d.out) partyFaces(stage, ctx.partyc);
  if (d.next === '+') v[41] = n + 1;
  else if (d.next) v[41] = d.next;
  if (d.fadein) await stage.fadeTo(0, 30);
}

// Plays a list of [{bgm, nodes}] (the chapter scenes, tools/build_chapter2.py scenes()) as one cutscene.
export async function playScenes(list, s) {
  const ui = overlay();
  await loadImages(pics());
  const stage = new Stage(ui);
  const faces = { ...(world.opening && world.opening.faces), ...world.faces };
  const sw = s.sw || (s.sw = {});
  const v = s.var || (s.var = {});
  const ctx = { s, partyc: s.party.map((m) => m.id) };
  const test = (c) => (c[0] === 'sw' ? !!sw[c[1]] === c[2] : c[0] === 'var' ? CMP[c[3]](v[c[1]] || 0, c[2]) : false);
  const run = async (nodes) => {
    for (const n of nodes) {
      const quiet = ui.skipped; // skipped: only the story state still changes
      if (n.say) { if (!quiet) await say(ui, faces, [n.say[0], n.say[1], n.say[2]]); }
      else if (n.if) { if (await run(test(n.if) ? n.then : n.else)) return true; }
      else if (n.sw) { for (let i = n.sw[0]; i <= n.sw[1]; i++) sw[i] = n.sw[2]; }
      else if (n.var) { const [id, op, x] = n.var; v[id] = op === 0 ? x : (v[id] || 0) + (op === 1 ? x : -x); }
      else if (n.v41) v[41] = n.v41;
      else if (n.item) { const it = eventCard(s, n.item[0], n.item[1]); if (it && n.item[1] > 0 && !quiet) { audio.se('Z1 アイテム取得', 80); toast(`得到了「${it.name}」卡片！`); } }
      else if (n.se) { if (!quiet) audio.se(n.se, 80); }
      else if (n.z1field) { ui.dlg.hidden = true; await z1field(quiet ? NO_STAGE : stage, ctx, quiet); }
      else if (n.fadeout) { ui.dlg.hidden = true; if (!quiet) await stage.fadeTo(1, 30); }
      else if (n.choice) { if (await run(n.branches[0] || [])) return true; } // (none in these pages)
      else if (n.end) return true;
    }
    return false;
  };
  for (const sc of list) {
    if (sc.bgm && !ui.skipped) audio.playBgm(sc.bgm);
    if (await run(sc.nodes)) break;
  }
  if (ui.skipped) audio.seStop();
  stage.running = false;
  ui.close();
}

// one event (a node list) as a cutscene
export const playEvent = (nodes, s) => playScenes([{ nodes }], s);

// common events 203 / 204: whether Goku / Piccolo were down at the end of the Raditz battle (switches 864 / 865);
// the story after it (z1field 60, page 60) goes by them
export function raditzOutcome(s) {
  const down = (id) => { const m = s.party.find((p) => p.id === id); return !!(m && (m.ko || m.hp <= 0)); };
  s.sw = s.sw || {};
  s.sw[864] = down(3);
  s.sw[865] = down(4);
}


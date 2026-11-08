// Z2, second half — 第四章 the Ginyu Force and 第五章 Frieza — driven by world.z2b (tools/build_z2b.py), following
// Map007 event 2 「イベント実行Z2」 pages 445-561 and the spots of map 29 (145_Event_Check.rb "Z2ナメック星エリア４"):
//   map 26 pond (from the first half: game.startZ2Ginyu) → 445 → the Ginyu Force pose (map 27) → 447 → Goku lands →
//   the Ginyu Force (452) → 453: the medical room, Dende → map 29: Porunga (463, map 28) → 466 → 第五章: Frieza (472)
//   → 473 Piccolo alone: Nail (476) → Frieza 2nd form… (478/480/481) → 3rd form (484/485/486, Goku back) → the last
//   form (492/493: the battle stops when a friend first falls) → 494 Super Saiyan → 497 → 498 → Super Vegeta
//   (499-501) → 502; or, with no one fallen: 498 → the Super Spirit Bomb (531/541) → 543 → full power (556) → 561.
//   → 「Z2 完」; variable 40 = 2, 41 = 1100 hands over to Z3 (not in this version yet).
// state.flags.z2b: 'ginyu' (map 29 before Porunga) → 'frieza' → 'done'; state.flags.z2bAt: a story step to pick up
// again after loading (a save made right before a story battle).
import { input, toast, audio, setFaces } from './core.js?v=20261108-1004';
import { playScenes } from './cutscene.js?v=20261108-1004';
import { setParty, moveTo, enterMap, card } from './chapter2.js?v=20261108-1004';
import { makeMember, applyLevel, levelUp } from './party.js?v=20261108-1004';
import { runEvent } from './events.js?v=20261108-1004';
import { eventCard } from './items.js?v=20261108-1004';
import { addMoves } from './anime.js?v=20261108-1004';
import { setZ2Env } from './z2scenes.js?v=20261108-1004';
import { FORMS, isSuper } from './supersaiyan.js?v=20261108-1004';

export const isZ2bMap = (s) => s.map === '29' || (s.flags && s.flags.z2b && ['27', '28', '30'].includes(s.map));

// the battle films of this half's moves (src/anime.js): the closest of the Z1 films
addMoves({
  121: 'energyWave', 122: 'energyWave', 123: 'vegetaBlast', 124: 'galickGun', 125: 'galickGun', 26: 'kamehameha',
  147: 'energyWave', 148: 'kamehameha', 149: 'vegetaBlast', 150: 'kaioken', 151: 'galickGun', 152: 'genkidama', // バーダック
  374: 'foeWave', 375: 'nappaBlast', 376: 'swordAttack', 377: 'garlicBall', 378: 'raditzBigWave', 379: 'nappaBlast', // ターレス・スラッグ
  380: 'giantWave', 381: 'garlicBall',
  345: 'foeWave', 346: 'raditzBigWave', 347: 'nappaBlast', 349: 'foeWave', 350: 'garlicBall', 382: 'raditzBigWave',
  351: 'foeWave', 352: 'swordAttack', 383: 'raditzBigWave', 353: 'foeWave', 354: 'raditzWave', 355: 'raditzBigWave',
  356: 'foeWave', 357: 'paralysis', 358: 'foeWave', 359: 'nappaBlast', 360: 'raditzBigWave', 361: 'foeWave', 362: 'nappaBlast',
  363: 'raditzBigWave', 364: 'foeWave', 365: 'nappaBlast', 366: 'raditzBigWave', 367: 'foeWave', 368: 'nappaBlast',
  369: 'raditzBigWave', 624: 'garlicBall', 694: 'giantWave', 370: 'vegetaWave', 371: 'vegetaBlast', 372: 'galickGun',
  695: 'galickGun', 331: 'foeWave', 332: 'pierce', 333: 'foeWave', 334: 'foeWave', 337: 'foeWave', 340: 'foeWave',
});

const heal = (m) => { m.hp = m.maxhp; m.ki = m.maxki; m.ko = false; };
// an actor, wherever it is: the party, the bench, or a new member; the Super Saiyan form stands for the base one
function member(game, id) {
  const s = game.state;
  s.bench = s.bench || {};
  const no = Object.keys(FORMS).find((k) => FORMS[k][0] === id && FORMS[k][1] !== id);
  const cur = no && isSuper(s, Number(no)) ? FORMS[no][1] : id;
  return s.party.find((m) => m.id === cur) || s.bench[cur] || (s.bench[cur] = makeMember(game.world, cur));
}
const cur = (game, id) => member(game, id).id;
const faces = (game) => game.world.z2b.faces;
const play = (game, key) => playScenes(game.world.z2b.pages[key], game.state, { faces: faces(game) });

// what the scenes do to the party (src/z2scenes.js)
function env(game) {
  const s = game.state, w = game.world;
  return {
    game,
    member: (id) => member(game, id),
    setParty: (ids) => { const list = ids.map((id) => cur(game, id)); for (const id of list) member(game, id); setParty(s, list); },
    heal: (id) => { // all_charecter_recovery / 314 (0 = everyone)
      if (id) { heal(member(game, id)); return; }
      for (const m of s.party) heal(m);
      for (const m of Object.values(s.bench || {})) heal(m);
    },
    addUses: (map) => { // cha_tec_puls: move counts (proficiency)
      s.skillLv = s.skillLv || {};
      for (const [k, n] of Object.entries(map)) s.skillLv[k] = Math.min(99999, (s.skillLv[k] || 0) + n);
    },
    gainExp: (id, n) => { const m = member(game, id); m.exp = Math.max(0, m.exp + n); levelUp(w, m); },
    learn: (id, skill, on) => { // 318: a form not in use keeps its list in state.forms
      const inUse = s.party.find((m) => m.id === id) || (s.bench || {})[id];
      s.forms = s.forms || {};
      const list = inUse ? inUse.skills : (s.forms[id] = s.forms[id] || { skills: [...w.actors[id].skills] }).skills;
      const k = list.indexOf(skill);
      if (on && k < 0) list.push(skill);
      if (!on && k >= 0) list.splice(k, 1);
    },
    leave: (id) => { const k = s.party.findIndex((m) => m.id === cur(game, id)); if (k >= 0) { s.bench[s.party[k].id] = s.party[k]; s.party.splice(k, 1); } },
  };
}

export function z2bGoal(world, s) {
  const c = world.z2b;
  if (!c || !s.flags.z2b) return undefined;
  if (s.flags.z2b === 'done') return '';
  return (c.goals[s.map] || {})[s.var[43]] || '';
}

function begin(game) {
  game.busy = true;
  game.field.paused = true;
  input.dx = input.dy = 0;
  game.field.leave();
  setZ2Env(env(game));
}
function toField(game, at) {
  const s = game.state;
  if (at) moveTo(s, at);
  s.flags.z2bAt = null;
  setFaces({ ...game.world.faces, ...faces(game) });
  enterMap(game);
}
// a story battle: saved right before it (state.flags.z2bAt), so a lost fight starts again from here
async function fight(game, key, opts = {}) {
  const s = game.state, b = game.world.z2b.battles[key];
  s.flags.z2bAt = key;
  game.save(true);
  game.busy = false;
  // the extra-attack switches the page set (all.rb 140508): 25 last one standing, 26 / 27 / 29 HP ≤ 30 / 40 / 50 %,
  // 28 two or fewer standing; reset_battle_flag clears them after the battle
  const sw = s.sw;
  const flags = { alone: !!sw[25], hp30: !!sw[26], hp40: !!sw[27], two: !!sw[28], hp50: !!sw[29] };
  // 493 / 497: with the planet Kanassa seen (93), Bardock in the party (109) and leading, ソリッドステートスカウター
  const bgm = b.sorid && sw[93] && sw[109] && s.var[42] === 16 ? b.sorid : b.bgm;
  const won = await game.startBattle(b.foes, true, { bgm, ...flags, ...opts });
  for (let k = 25; k <= 29; k++) sw[k] = false;
  begin(game);
  return won ? 'win' : game.lastResult;
}

// ---------- 第四章 ----------
// page 445 onward (the dev jump; the first half plays 445 itself and calls startZ2b)
export async function startZ2Ginyu(game) {
  return ginyuArrive(game, true);
}
// from the first half (src/z2a.js), right after page 445 at the map 26 pond: variable 41 = 446, on to map 27
export async function startZ2b(game) {
  return ginyuArrive(game, false);
}
async function ginyuArrive(game, with445) {
  const c = game.world.z2b, s = game.state;
  begin(game);
  s.flags.z2b = 'ginyu';
  await card(c.titles.ginyu, 2200);
  if (with445) { s.var[41] = 445; await play(game, '445'); }
  await play(game, 'ginyuPose'); // map 27
  s.var[41] = 447;
  await play(game, '447');
  await ginyuBattle(game);
}
async function ginyuBattle(game) {
  const s = game.state;
  if (await fight(game, 'ginyu') !== 'win') return; // (a loss loads the save made before the fight)
  s.var[41] = 453;
  await play(game, '453'); // ends: 概況 +3, Gohan leads, (47,24) on map 29
  toField(game, game.world.z2b.namek4);
}

// ---------- map 29 ----------
export function z2bSpot(game, poi) {
  if (poi.chapter === 'z2turles') return turlesSlug(game);
  if (poi.chapter === 'z2porunga') return porunga(game);
  if (poi.chapter === 'z2nail') return nail(game);
  if (poi.chapter === 'z2page') return sidePage(game, poi.page);
  return null;
}

// 463 (Dende at the island) → map 28 Porunga → 466 → 第五章 → Frieza (472) → 473
async function porunga(game) {
  const c = game.world.z2b, s = game.state;
  begin(game);
  s.var[41] = 463;
  await play(game, '463');
  await play(game, 'porunga'); // map 28
  s.var[41] = 466;
  await play(game, '466');
  s.flags.z2b = 'frieza';
  await card(c.titles.frieza, 2200);
  await friezaFirst(game);
}
async function friezaFirst(game) {
  const s = game.state;
  if (await fight(game, 'frieza0') !== 'win') return;
  s.var[41] = 473;
  await play(game, '473'); // Piccolo, alone (475), heads for the Z fighters; 概況 34
  toField(game, game.world.z2b.piccoloAt);
}

// 514 (11,5) at 概況 36: Turles and Slug appear (map 30) → 508: Bardock arrives and joins → the battle (511);
// then back on the field with Bardock in the party until the end of Z2 (502 / 561: 512 his farewell)
async function turlesSlug(game) {
  const s = game.state;
  begin(game);
  s.var[41] = 514;
  await play(game, '514');
  await play(game, 'turlesSlug'); // map 30
  s.var[41] = 508;
  await play(game, '508'); // Bardock joins (509), switch 109
  await turlesBattle(game);
}
async function turlesBattle(game) {
  if (await fight(game, 'turlesSlug') !== 'win') return;
  toField(game);
}

// 476 Nail: the fusion
async function nail(game) {
  begin(game);
  game.state.var[41] = 476;
  await play(game, '476');
  toField(game);
}

// the Namekians, the battle suits: the page as it is in the original (the spot decides the page)
async function sidePage(game, page) {
  const s = game.state;
  begin(game);
  const keep = s.var[41];
  s.var[41] = page;
  await play(game, String(page));
  s.var[41] = keep;
  toField(game);
}
// 521 バトルスーツ取得: switch 439 (the page) — 悟飯 and 克林 can wear them from then on, by 換裝 in the party screen
// (variables 161 / 162, src/costume.js), as the original's set_dress

// Frieza on map 29: his 2nd form (478 → 480 → 481), 3rd (484 → 485 → 486), last (492 → 493 …)
export async function z2bBoss(game, b) {
  if (game.busy || !b) return;
  begin(game);
  if (b.key === 'frieza1') return friezaForm2(game, true);
  if (b.key === 'frieza2') return friezaForm3(game, true);
  if (b.key === 'frieza3') return friezaLast(game, true);
}
async function friezaForm2(game, story) {
  const s = game.state;
  if (story) { s.var[41] = 478; await play(game, '478'); }
  if (await fight(game, 'frieza1') !== 'win') return;
  s.flags.z2Frieza1 = true;
  s.var[41] = 481;
  await play(game, '481'); // CE41: his next form, he flies off; 概況 35
  toField(game);
}
async function friezaForm3(game, story) {
  const s = game.state;
  if (story) { s.var[41] = 484; await play(game, '484'); }
  if (await fight(game, 'frieza2') !== 'win') return;
  s.flags.z2Frieza2 = true;
  s.var[41] = 486;
  await play(game, '486'); // CE42, Dende, Goku healed and back; 概況 36, (38,59)
  toField(game, game.world.z2b.beforeFrieza3);
}
// 493: Frieza's last form. all.rb 50638 / 47815: when a friend falls while Goku stands, the battle stops
// (battle_main_result 8): his HP goes to variable 56, Goku turns Super Saiyan (494) and the fight goes on (497)
async function friezaLast(game, story) {
  const s = game.state;
  if (story) { s.var[41] = 492; await play(game, '492'); }
  const goku = () => s.party.find((m) => m.id === 3 || m.id === 14);
  const r = await fight(game, 'frieza3', { stopWhen: (b) => !s.sw[104] && goku() && !goku().ko && b.party.some((m) => m.ko && m !== goku()) });
  if (r === 'break') {
    s.var[56] = game.lastBattle.foes[0].hp;
    s.var[41] = 494;
    await play(game, '494'); // the Super Saiyan; 497 next
    return friezaSuper(game);
  }
  if (r !== 'win') return;
  s.var[41] = 498; // no one fell: no Super Saiyan, the Super Spirit Bomb
  await afterFrieza(game);
}
async function friezaSuper(game) {
  const s = game.state;
  s.cardiMax = 9; // $cardi_max = 9: 超 cards from now on
  if (await fight(game, 'frieza3ss', { foeHp: [s.var[56]] }) !== 'win') return;
  s.var[41] = 498;
  if (s.sw[104]) s.sw[105] = true; // chk_set_event_no: Super Vegeta comes
  await afterFrieza(game);
}
async function afterFrieza(game) {
  const s = game.state;
  s.flags.z2Frieza3 = true;
  await play(game, '498');
  if (s.sw[105]) { // 499 / 500 then the Super Vegeta battle (501)
    s.var[41] = 501;
    return superVegeta(game);
  }
  // 531 (an event battle in the original: Goku's Super Spirit Bomb) → 541 CE147 → 543
  s.var[41] = 541;
  await playScenes([{ nodes: [{ x: 'film', name: 'superGenki' }] }], s);
  s.var[41] = 543;
  await play(game, '543');
  return fullPower(game);
}
async function superVegeta(game) {
  const s = game.state;
  if (await fight(game, 'superVegeta') !== 'win') return;
  s.var[41] = 502;
  await play(game, '502');
  await ending(game);
}
async function fullPower(game) {
  const s = game.state;
  s.cardiMax = 9;
  if (await fight(game, 'fullPower') !== 'win') return;
  s.var[41] = 561;
  await play(game, '561');
  await ending(game);
}

// after 502 / 561: variable 40 = 2, variable 41 = 1100 (Z3); switches 38 / 39, 156 (the Super Saiyan battle music)
async function ending(game) {
  const c = game.world.z2b, s = game.state;
  s.var[40] = 2;
  s.var[41] = 1100;
  s.sw[38] = s.sw[39] = s.sw[156] = true;
  for (const m of s.party) heal(m);
  s.flags.z2b = 'done';
  s.flags.z2bAt = null;
  game.save(true);
  game.busy = false;
  await card(c.end, 2400);
  if (game.startZ3 && await game.startZ3()) return; // Z3 (src/z3.js), once its first chapter is there
  game.showTitle(c.end, c.unlocks);
}

// ---------- loading: a save made before a story battle picks up there ----------
const AT = {
  ginyu: ginyuBattle, frieza0: friezaFirst, frieza1: (g) => friezaForm2(g, false), frieza2: (g) => friezaForm3(g, false),
  frieza3: (g) => friezaLast(g, false), frieza3ss: friezaSuper, superVegeta, fullPower, turlesSlug: turlesBattle,
};
export function resumeZ2b(game) {
  const s = game.state;
  if (!game.world.z2b || !s.flags || !s.flags.z2b) return false;
  setFaces({ ...game.world.faces, ...faces(game) });
  const at = s.flags.z2bAt;
  if (!at || !AT[at]) return false;
  begin(game);
  AT[at](game);
  return true;
}

// ---------- development: index.html?dev=z2ginyu / z2frieza / z2last (&timer for a hidden pane) ----------
// the first half is built on another branch; this makes a plausible state at the hand-over (page 445)
export function devZ2b(game, step) {
  const w = game.world;
  const s = game.newState();
  game.state = s;
  s.bench = {};
  const lv = { 3: 42, 4: 40, 5: 36, 6: 35, 7: 32, 8: 34, 9: 31, 12: 40 };
  for (const id of Object.keys(lv).map(Number)) {
    if (!w.actors[id]) continue;
    const m = makeMember(w, id);
    m.level = lv[id];
    m.exp = w.actors[id].exp[m.level];
    m.maxLv = m.level;
    applyLevel(w, m);
    heal(m);
    s.bench[id] = m;
  }
  for (const k of ['ch2', 'ch3', 'ch4', 'ch5', 'ch6']) s.flags[k] = 'done';
  Object.assign(s.flags, { bossDone: true, sanshoDone: true, nikkiDone: true });
  s.var[40] = 1;
  s.var[43] = 30;
  s.zeni = 8000;
  for (let id = 2; id <= 8; id++) eventCard(s, id, 1); // the seven balls (CE14 uses them at Porunga)
  const goku = s.bench[3];
  for (const id of [6, 7, 18]) if (!goku.skills.includes(id)) goku.skills.push(id); // 界王拳 etc. (Z1 CE12)
  goku.school = 3;
  s.party = [];
  setParty(s, [5, 6, 12]);
  s.map = '29'; // (map 26 belongs to the first half: the chapter starts in a cutscene anyway)
  moveTo(s, w.z2b.namek4);
  game.startField();
  setZ2Env(env(game));
  const after = (fn) => { setFaces({ ...w.faces, ...faces(game) }); fn(); };
  if (step === 'z2ginyu') { after(() => startZ2Ginyu(game)); return; }
  // z2frieza: Porunga is done, Piccolo has fused with Nail, Frieza's 2nd form waits (概況 34)
  s.flags.z2b = 'frieza';
  Object.assign(s.sw, { 101: true, 102: true, 154: true, 483: true });
  s.var[43] = 34;
  setParty(s, [4, 5, 6, 7, 8, 9, 12]);
  if (step === 'z2last' || step === 'z2turles') { // Frieza's last form, Goku back (概況 36); z2turles: by Turles and Slug
    s.var[43] = 36;
    Object.assign(s.flags, { z2Frieza1: true, z2Frieza2: true });
    goku.skills = [...goku.skills.filter((x) => x !== 3)];
    setParty(s, [3, 4, 5, 6, 7, 8, 9, 12]);
    moveTo(s, step === 'z2turles' ? { map: '29', x: 11, y: 8 } : w.z2b.beforeFrieza3);
  } else moveTo(s, { map: '29', x: 22, y: 21 });
  s.var[42] = s.party[0].id;
  after(() => toField(game));
}

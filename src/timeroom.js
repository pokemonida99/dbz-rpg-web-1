// 時之間 (phase 1, docs/timeroom.md) — the original's time room: Map007 event 1 pages 15 / 16 (in and out), event 16
// pages 9001-9091 (the hall, map 58), events 17-22 (each era's hall, maps 59 / 66 / 72 / 85-86 / 96); the data is
// world.timeroom and the 'tr:' pages of world.z3.pages (tools/build_timeroom.py). The spots carry chapter 'tr':
//   enter     a story map's 時の間 square (variable 41 = 15)      leave  the hall's exit (page 16)
//   go        a door / way between the halls (to: {map, x, y}, or 'z4' / 'z4side': map 85 after Z4, 86 before)
//   party     隊伍變更 (9051: CE160, CE159, Scene_Db_Member_change)   info  説明 (9021: Scene_Db_infolist)
//   practice  戦闘練習 (9031-9036: 訓練人偶, one-turn damage)          arena  闘技場 (phase 3)
//   area      a door to an era's area (area = the page the original runs, 9102 …): phase 2 registers them here
// state.flags.tr = what page 15 kept for the way back (variables 231-235, $story_partyc, $story_sp_saiya); variable 43 is
// 999 inside, the story's value comes back on leaving.
import { audio, say, choose, sleep } from './core.js?v=20261102-1141';
import { registerZ3, begin, play, heal, member, party } from './z3.js?v=20261102-1141';
import { moveTo, enterMap } from './chapter2.js?v=20261102-1141';
import { syncSuperSaiyan, FORMS } from './supersaiyan.js?v=20261102-1141';
import { eventCard } from './items.js?v=20261102-1141';
import { memberChange } from './partymenu.js?v=20261102-1141';
import { holds } from './field.js?v=20261102-1141';

const TR = (game) => game.world.timeroom;
const TX = (game) => TR(game).text;
const HALL = { map: '58', x: 22, y: 13 };
export const inTimeRoom = (s) => !!(s.flags && s.flags.tr);

// ---------- phase 2 / 3: the areas behind the doors (docs/timeroom-plan.md) ----------
// registerArea(9102, fn): the door of the hall that runs the original's page 9102 (拉蒂茲區 …), 'arena' the 闘技場.
// registerTrSpot('z1raditz', fn): a spot of an area map ({chapter: 'tr', page: 'z1raditz'} in world.pois).
const areas = {}, spots = {};
export function registerArea(no, fn) { areas[no] = fn; }
export function registerTrSpot(page, fn) { spots[page] = fn; }
// the battle background of an area map (set_battle_map in the 時之間): registerBackdrop('73', (game) => 'bg/…png');
// src/main.js asks trBackdrop first
const backdrops = {};
export function registerBackdrop(map, fn) { backdrops[map] = fn; }
export function trBackdrop(game) {
  const s = game.state, fn = inTimeRoom(s) && backdrops[s.map];
  return fn ? fn(game) || null : null;
}

// into an area (9102 …): CE181 (舞空術 37 and 帶路人 124 cards), variable 43 = the area's number (901 …: battle
// backgrounds and rules key on it), then the map
export function enterArea(game, to, v43) {
  const s = game.state;
  begin(game);
  eventCard(s, 37, 1);
  eventCard(s, 124, 1);
  s.var[43] = v43;
  audio.se('Z1 入る');
  goTo(game, to);
}
// back to the era's hall (9103 …): CE182 (those cards gone), variable 43 = 999
export function leaveArea(game, back) {
  const s = game.state;
  begin(game);
  eventCard(s, 37, -99);
  eventCard(s, 124, -99);
  s.var[43] = 999;
  audio.se('Z1 入る');
  goTo(game, back);
}
// a boss of an area (9104 …: battle_process of that page): no EXP (switch 124), the shared EXP / CAP / SP the page
// sets (variables 306 / 317 / 318), its card drops [[rate %, card], …] (241-245 / 246-250, switch 477), full
// recovery after it when the page turns switch 141 on. opts: { shared, cap, sp, drops, heal, bgm, backdrop, … } (the
// rest goes to game.startBattle). Returns 'win' | 'lose' | 'escape'; the field is back afterwards.
export async function trBattle(game, foes, opts = {}) {
  const { shared, cap, sp, drops, heal: healAfter, ...rest } = opts;
  game.busy = false;
  const won = await game.startBattle(foes, true, { trReward: { shared, cap, sp, drops }, ...rest });
  if (won && healAfter) healAll(game);
  game.renderHud();
  return won ? 'win' : game.lastResult;
}
export { goTo, healAll };

// all_charecter_recovery: every actor, in the party or not
function healAll(game) {
  const s = game.state;
  for (const m of s.party) heal(m);
  for (const m of Object.values(s.bench || {})) heal(m);
}
// back on the time room's field at a spot (a fresh field: the map's events, the walking sprite)
function goTo(game, at) {
  moveTo(game.state, at);
  enterMap(game);
}
const say1 = (t) => say([['', t]], true);

// ---------- page 15: into the time room ----------
async function enter(game) {
  const s = game.state;
  begin(game);
  s.sw[78] = true; // 筋斗雲 card not usable
  if (!s.sw[470]) { await play(game, 'tr:first'); s.sw[470] = true; } // 「这里是 时之间…」, CE262
  if (s.sw[483]) await play(game, 'tr:new'); // CE179 「新的区域开放了！」 (switch 483 off, the 通知！ card gone)
  s.flags.tr = { // variables 231-235, $story_partyc, $story_sp_saiya
    back: { map: s.map, x: s.x, y: s.y }, v43: s.var[43] || 0, v17: s.var[17] || 0,
    party: s.party.map((m) => m.id), ss: { ...(s.ss || {}) },
  };
  s.var[43] = 999;
  s.var[23] = s.var[17] || 0;
  eventCard(s, 67, -1); // (the original's guard: a 通知！ card picked up for nothing)
  const era = s.var[40] || 0;
  s.sw[471] = era === 0; s.sw[472] = era === 1; s.sw[473] = era >= 2; // the walking sprites of the era
  s.sw[466] = true;
  healAll(game);
  audio.stopBgm();
  goTo(game, HALL);
}

// ---------- page 16: back to the story ----------
async function leave(game) {
  const s = game.state, k = s.flags.tr;
  begin(game);
  if (!k) { goTo(game, HALL); return; }
  s.var[43] = k.v43;
  s.sw[466] = false;
  s.var[17] = s.var[23] || k.v17;
  syncSuperSaiyan(game.world, s, Object.fromEntries(Object.keys(FORMS).map((no) => [no, !!k.ss[no]]))); // CE155
  party(game, k.party); // $partyc = $story_partyc
  for (const m of s.party) m.ko = false; // $chadead all false
  healAll(game);
  s.var[42] = s.party[0].id;
  s.sw[78] = false;
  delete s.flags.tr;
  s.map = k.back.map;
  s.x = k.back.x;
  s.y = k.back.y;
  s.travel = 0;
  enterMap(game);
}

// ---------- 9051: 隊伍變更 ----------
// the members the original's Scene_Db_Member_change offers (create_party_picture), Super Saiyans in that form
export function candidates(s) {
  const sw = (n) => !!s.sw[n];
  const list = [3, 4, 5, 6, 7, 8, 9];
  if (sw(68) || sw(69)) list.push(10); // 琪琪
  if (sw(502)) list.push(24); // 龜仙人
  if (sw(95) || sw(107)) list.push(15); // 那美克星的年輕人
  if (sw(522)) list.push(12); // 貝吉塔
  if (sw(109) || (s.var[40] || 0) >= 2) list.push(16); // 巴達克
  if (sw(598) || sw(586)) list.push(27, 28, 29, 30); // 巴達克一夥
  if (sw(426)) list.push(17); // 特蘭克斯
  if (sw(598) || sw(586)) list.push(25); // 未來悟飯
  if (sw(567)) list.push(23); // 16 號
  if (sw(598) || sw(586)) list.push(22, 21); // 17 號・18 號
  const rep = [0, 3, 5, 12, 17, 5, 25, 16], chk = [0, 14, 18, 19, 20, 18, 26, 32]; // tmprepchano → tmpchkchano
  for (let y = 1; y < rep.length; y++) if (s.ss && s.ss[y]) list.forEach((x, i) => { if (x === rep[y]) list[i] = chk[y]; });
  return list;
}
async function partyChange(game) {
  const s = game.state, t = TX(game);
  begin(game);
  audio.playBgm(TR(game).bgm);
  if (!s.sw[476]) await say(t.partyFirst.map((x) => ['', x]));
  s.sw[476] = true;
  await say1(t.partyAsk);
  if (await choose([t.yes, t.no]) === 0) {
    syncSuperSaiyan(game.world, s, Object.fromEntries(Object.keys(FORMS).map((no) => [no, false]))); // CE160, CE159
    const list = candidates(s).filter((id) => game.world.actors[id]);
    for (const id of list) heal(member(game, id)); // (variable 43 = 999: everyone full)
    const ids = await memberChange(game, list.map((id) => member(game, id)));
    if (ids) { party(game, ids); s.var[42] = s.party[0].id; }
  } else audio.se('Z1 入る');
  goTo(game, { map: s.map, x: Math.floor(s.x / 32), y: Math.floor(s.y / 32) });
}

// ---------- 9021: 説明 (Scene_Db_infolist, CE270) ----------
async function info(game) {
  const s = game.state, t = TX(game);
  begin(game);
  audio.playBgm(TR(game).bgm);
  if (!s.sw[1301]) { s.sw[1301] = true; await say([['', t.infoFirst]]); }
  await say1(t.infoAsk);
  if (await choose([t.infoYes, t.infoNo]) === 0) {
    for (;;) {
      const list = TR(game).info.filter((x) => !x.when || holds(s, x.when));
      const k = await infoList(t.infoTitle, [...list.map((x) => x.name), t.infoEnd]);
      if (k < 0 || k >= list.length) break;
      await play(game, list[k].page);
    }
  }
  audio.se('Z1 出る');
  await sleep(16);
  goTo(game, { map: s.map, x: Math.floor(s.x / 32), y: Math.floor(s.y / 32) });
}
// the list window: one button a row; resolves with the index (-1: closed)
function infoList(title, names) {
  return new Promise((res) => {
    const root = document.createElement('div');
    root.className = 'fm tr-info';
    root.innerHTML = `<div class="win"><div class="tr-title"></div><div class="tr-list"></div></div>`;
    root.querySelector('.tr-title').textContent = title;
    const box = root.querySelector('.tr-list');
    names.forEach((n, k) => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = n;
      b.onclick = () => { audio.se('Z3 決定'); root.remove(); res(k); };
      box.append(b);
    });
    root.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); });
    document.getElementById('app').appendChild(root);
  });
}

// ---------- 9031-9036: 戦闘練習 (1 回合攻擊挑戰) ----------
async function practice(game) {
  const s = game.state, t = TX(game), tr = TR(game);
  begin(game);
  audio.playBgm(tr.bgm);
  if (!s.sw[1304]) { s.sw[1304] = true; await play(game, 'tr:practiceHelp'); } // CE268
  await say1(t.practiceAsk);
  if (await choose([t.practiceYes, t.practiceNo]) !== 0) {
    audio.se('Z1 出る');
    goTo(game, { map: s.map, x: Math.floor(s.x / 32), y: Math.floor(s.y / 32) });
    return;
  }
  await say1(t.practiceKind);
  // element 22 of 訓練人偶: 1 = treated as a boss, 3 = a normal enemy (the passive skills 最終決戦 / 征服 look at it)
  const bossKind = (await choose([t.practiceBoss, t.practiceNormal])) === 0;
  s.sw[1305] = true;
  const hand = s.hand.map((c) => ({ ...c })); // CE221
  s.hand = s.hand.map(() => ({ a: 7, g: 7, s: 16 })); // 攻防 Z, 流派「氣」
  healAll(game);
  const best = { dmg: 0, turn: 0 }; // variables 424 / 426
  const bg = tr.practiceBg[Math.min(2, s.var[40] || 0)];
  game.busy = false;
  await game.startBattle([27], false, { practice: { best, old: s.var[423] || 0, bossKind }, backdrop: bg, loseOk: true });
  begin(game);
  s.hand = hand; // CE222
  s.sw[1305] = false;
  audio.playBgm(tr.bgm);
  const fill = (x) => x.replace('{turn}', best.turn).replace('{dmg}', best.dmg).replace('{old}', s.var[423] || 0);
  await say([['', t.practiceBest.map(fill).join('\n')]]);
  if (best.dmg > (s.var[423] || 0)) {
    audio.se('DB2 アイテム取得', 80);
    await say([['', t.practiceNew.map(fill).join('\n')]]);
    s.var[423] = best.dmg;
  } else {
    audio.se('Z2 気が遠くなる', 80);
    await say([['', t.practiceNot.join('\n')]]);
  }
  audio.se('Z1 出る');
  goTo(game, { map: s.map, x: Math.floor(s.x / 32), y: Math.floor(s.y / 32) });
}

// ---------- the doors ----------
async function go(game, poi) {
  const s = game.state, tr = TR(game);
  begin(game);
  let to = poi.to;
  if (to === 'z4' || to === 'z4side') to = (to === 'z4' ? tr.z4 : tr.z4Side)[s.sw[458] ? 0 : 1]; // 9004 / 9699
  const era = to.map === '59' ? 0 : to.map === '66' ? 1 : to.map === '58' ? null : 2;
  if (era != null) s.var[17] = era; // variable 17 / 301: the era of that hall
  audio.se('Z1 入る');
  goTo(game, to);
}
async function notYet(game, poi) {
  const s = game.state;
  begin(game);
  const fn = areas[poi.area] || (poi.page === 'arena' && areas.arena);
  if (fn) { await fn(game, poi); return; }
  await say([['', `「${poi.label}」本版尚未製作，之後會照原版加入。`]]);
  goTo(game, { map: s.map, x: Math.floor(s.x / 32), y: Math.floor(s.y / 32) });
}

registerZ3('tr', {
  spot(game, poi) {
    const f = { enter, leave, go, party: partyChange, info, practice, area: notYet, arena: notYet }[poi.page] || spots[poi.page];
    return f ? f(game, poi) : null;
  },
  // ?dev=tr: a Z4-end save straight into the hall (for testing); ?dev=trz1: an early one (Z1 era)
  dev(game, step) {
    if (step !== 'tr' && step !== 'trz1') return false;
    const s = game.state = game.newState();
    if (step === 'tr') {
      s.var[40] = 2;
      for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568]) s.sw[n] = true;
      s.flags.z3 = 'done';
      party(game, [3, 5, 4, 12, 17, 6]);
      s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    }
    game.startField();
    enter(game);
    return true;
  },
});

// the goal line on the HUD (src/main.js renderHud)
export function trGoal(world, s) {
  if (!inTimeRoom(s)) return undefined;
  return s.map === '58' ? '時之間：從下方出口回到主線' : '時之間';
}

const css = document.createElement('style');
css.textContent = `
.tr-info { display: flex; flex-direction: column; justify-content: center; padding: calc(var(--safe-t) + 8px) 10px calc(var(--safe-b) + 8px); }
.tr-info .win { flex: 0 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 6px; font-size: 16px; }
.tr-title { color: #d0480c; flex: none; }
.tr-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; touch-action: pan-y; }
.tr-list .btn { margin: 0; text-align: left; font-size: 16px; }
`;
document.head.appendChild(css);

// 第二輪（周回）的基礎，after the original's Scene_Db_New_game_plus (all.rb 161144) and new_game_plus_db_var_refresh
// (all.rb 21318). docs/laps-plan.md has the rules and which state belongs to which item.
//   s.laps       $game_laps: rounds finished by starting over (0 / missing on a first play and on every old save)
//   s.sw[860]    on during any second or later round; s.sw[455] (from 時間君, page zgbj:90041): this save may start one
//   s.lapKeep    { members: { id: what carries over } }: everyone who joins later starts from it (makeMember, src/party.js)
import { applyLevel, setMemberHook } from './party.js?v=20261104-0742';
import { registerZ3 } from './z3.js?v=20261104-0742';

export const lapCount = (s) => (s && s.laps) || 0;
export const isLap = (s) => lapCount(s) >= 1;
export const canLap = (s) => !!(s && s.sw && s.sw[455]);
export const lapLabel = (s) => (isLap(s) ? `第 ${lapCount(s) + 1} 輪　` : ''); // (the save list: draw_laps, all.rb 35597)

// 神龍的願望 (all.rb 21369-21377) stay whatever is picked; the settings are in src/fieldmenu.js's options, outside the save
const ALWAYS = { sw: [490, 491, 494, 495, 496, 497, 498, 499, 1320], var: [], state: ['cardMax', 'recipes'] };

// the ten rows of the screen, in the original's order (all.rb 161195); all carry over unless the player turns one off.
// member: fields of each party member; state: fields of the save; sw / var: the original's numbers
export const LAP_ITEMS = [
  { k: 'status', name: '能力', msg: '繼承等級與能力', member: ['level', 'exp', 'maxLv', 'zp', 'runzp', 'plus'], var: [305, 324] },
  { k: 'skill', name: '技能', msg: '繼承已學會的技能', member: ['typ', 'add', 'addN', 'sp', 'got', 'set', 'firstTyp', 'freeSet'], state: ['skillSeen'], var: [25] },
  { k: 'dress', name: '換裝', msg: '繼承換裝', sw: [439, 381, 444, 443, 447, 594] },
  { k: 'card', name: '卡片', msg: '繼承卡片', state: ['cards', 'zeni'], var: [224, 225, 226, 227, 311, 312, 313, 420] },
  { k: 'tec', name: '必殺技', msg: '繼承取得的靈光招式', sw: [70, 861], tecspark: true },
  { k: 'skillLv', name: '熟練度', msg: '繼承必殺技的熟練度', state: ['skillLv'], var: [61, 62, 63, 64, 65, 66, 71, 72, 73, 74, 75, 76] },
  { k: 'combo', name: '組合技', msg: '繼承已獲得的組合技', state: ['combos'] },
  { k: 'history', name: '戰鬥記錄', msg: '繼承戰鬥記錄和鬥技場的狀態', state: ['stats', 'defeats'], flags: ['arena'], var: [202, 204, 214, 203, 208, 216, 207, 211, 212, 218, 219, 220, 221, 222, 223, 213, 423] },
  { k: 'foes', name: '敵人情報', msg: '繼承敵人的情報', state: ['foeSeen', 'foeKills', 'foeScouted'] },
  { k: 'bgm', name: 'ＢＧＭ', msg: '繼承 BGM 的取得狀態', sw: [...Array(50).keys()].map((i) => 151 + i).concat([...Array(39).keys()].map((i) => 702 + i)) },
];
export const allPicks = () => Object.fromEntries(LAP_ITEMS.map((it) => [it.k, true]));

const copy = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

function keptMembers(old, picks) {
  const fields = LAP_ITEMS.filter((it) => picks[it.k] && it.member).flatMap((it) => it.member), out = {};
  for (const m of [...(old.party || []), ...Object.values(old.bench || {})]) {
    if (!m || out[m.id]) continue;
    const k = {};
    for (const f of fields) if (m[f] !== undefined) k[f] = copy(m[f]);
    out[m.id] = k;
  }
  return out;
}

// what everyone joining this round starts from (the original's $game_actors stay as they were)
function overlay(world, m, keep) {
  const k = keep && keep.members && keep.members[m.id];
  if (!k) return m;
  Object.assign(m, copy(k));
  applyLevel(world, m);
  m.hp = m.maxhp;
  m.ki = m.maxki;
  return m;
}

// the new state of the next round; the caller starts it like a new game. picks: { item key: carry over? }
export function nextLapState(game, old, picks = allPicks()) {
  const s = game.newState();
  s.laps = lapCount(old) + 1;
  s.sw[860] = true;
  s.sw[484] = true; // ZP 割り振り計算済み
  const takeSw = (n) => { if (old.sw && old.sw[n] !== undefined) s.sw[n] = old.sw[n]; };
  const takeVar = (n) => { if (old.var && old.var[n] !== undefined) s.var[n] = old.var[n]; };
  const take = (it) => {
    (it.sw || []).forEach(takeSw);
    (it.var || []).forEach(takeVar);
    for (const f of it.state || []) if (old[f] !== undefined) s[f] = copy(old[f]);
    for (const f of it.flags || []) if (old.flags && old.flags[f] !== undefined) s.flags[f] = copy(old.flags[f]);
    if (it.tecspark) for (const r of game.world.tecspark || []) takeSw(r.get);
  };
  take(ALWAYS);
  for (const it of LAP_ITEMS) if (picks[it.k]) take(it);
  if (s.flags.arena) s.flags.arena.first = []; // バトルアリーナの初回報酬はあえてクリアする (all.rb 21356)
  s.lapKeep = { members: keptMembers(old, picks) };
  s.party = s.party.map((m) => overlay(game.world, m, s.lapKeep));
  return s;
}

// hooked into makeMember: everyone who joins during a later round
let GAME = null;
setMemberHook((world, m) => (GAME && GAME.state && GAME.state.lapKeep ? overlay(world, m, GAME.state.lapKeep) : m));
export const setLapGame = (game) => { GAME = game; };

// ?dev=lap: a finished first round at Lv 99, then a second round with everything carried over; ?dev=lap3: the third;
// ?dev=lapold: the finished save itself on the map (it has switch 455, for the way in)
function finishedRound(game) {
  const s = game.newState();
  s.var[40] = 2;
  s.sw[455] = true;
  s.flags.z3 = 'done';
  s.zeni = 99999;
  for (const m of s.party) {
    m.level = 99;
    m.exp = game.world.actors[m.id].exp[99];
    m.maxLv = 99;
    applyLevel(game.world, m);
    m.hp = m.maxhp;
    m.ki = m.maxki;
  }
  return s;
}
function dev(game, step) {
  if (!/^lap(old|\d+)?$/.test(step)) return false;
  setLapGame(game);
  let s = finishedRound(game);
  if (step !== 'lapold') for (let n = Number(step.slice(3)) || 2; n > 1; n--) { s = nextLapState(game, s); s.sw[455] = true; }
  game.state = s;
  Promise.resolve().then(() => game.startField());
  return true;
}
registerZ3('laps', { dev });

// 第二輪（周回）的入口與繼承, after the original's Scene_Db_New_game_plus (all.rb 161144) and new_game_plus_db_var_refresh
// (all.rb 21318). docs/laps-a.md has which state belongs to which item, with the original's lines.
//   s.laps       $game_laps: rounds finished by starting over (0 / missing on a first play and on every old save)
//   s.sw[860]    on during any second or later round; s.sw[455] (from 時間君, page zgbj:90041): this save may start one
//   s.sw[861]    必殺技 was carried over: CE9 (syncLap below), CE61 (src/costume.js), CE64 (src/grw.js) give those moves
//   s.lapKeep    { members: { id: what carries over } }: everyone who joins later starts from it (makeMember, src/party.js)
import { audio } from './core.js?v=20261107-2349';
import { applyLevel, setMemberHook } from './party.js?v=20261107-2349';
import { FORMS, superSaiyan, offHooks } from './supersaiyan.js?v=20261107-2349';
import { registerZ3, party } from './z3.js?v=20261107-2349';

export const lapCount = (s) => (s && s.laps) || 0;
export const isLap = (s) => lapCount(s) >= 1;
export const canLap = (s) => !!(s && s.sw && s.sw[455]);
export const lapLabel = (s) => (isLap(s) ? `第 ${lapCount(s) + 1} 輪　` : ''); // (the save list: draw_laps, all.rb 35597)

// whatever is picked: 神龍的願望 and the options (all.rb 21368-21414; those the remake keeps in src/fieldmenu.js's options
// are outside the save anyway), and the original's own globals that new_game_plus_db_var_refresh leaves alone:
// $get_card_compo_recipe, $cha_tactics
const ALWAYS = {
  sw: [490, 491, 494, 495, 496, 497, 498, 499, 1320, 461, 463, 482, 492, 881, 882, 883],
  var: [38, 30, 29, 351, 352, 37, 319, 103, 36, 35, 31, 28, 83, 302, 303, 353, 354, 355, 356, 357, 358, 427, 428, 429, 462, 463, 464],
  state: ['recipes', 'tactics'],
};

// the ten rows of the screen, in the original's order (all.rb 161195); all carry over unless the player turns one off.
// member: fields of each party member; state: fields of the save; sw / var: the original's numbers
export const LAP_ITEMS = [
  { k: 'status', name: '角色狀態', msg: ['繼承各角色的等級和經驗值', '※如果沒有繼承，ZP將恢復為未使用狀態'], member: ['level', 'exp', 'maxLv', 'runzp', 'plus'], var: [305, 324] },
  { k: 'skill', name: '技能', msg: ['繼承取得的技能和CAP'], member: ['typ', 'add', 'addN', 'sp', 'got', 'set', 'firstTyp', 'freeSet'], state: ['skillSeen'], var: [25] },
  { k: 'dress', name: '服裝', msg: ['繼承取得的服裝'], sw: [439, 381, 444, 443, 447, 594] },
  { k: 'card', name: '卡片', msg: ['繼承未使用的卡和各等級的持有數'], state: ['cards', 'zeni', 'cardMax'], var: [224, 225, 226, 227, 311, 312, 313, 420] },
  { k: 'tec', name: '必殺技', msg: ['繼承取得的閃光技能'], sw: [70], tecspark: true },
  { k: 'skillLv', name: '熟練度', msg: ['繼承必殺技的熟練度'], state: ['skillLv', 'atkLv'], var: [61, 62, 63, 64, 65, 66, 71, 72, 73, 74, 75, 76] },
  { k: 'combo', name: '組合技', msg: ['繼承已獲取的組合技'], state: ['combos'], combo: true },
  { k: 'history', name: '戰鬥記錄', msg: ['繼承戰鬥記錄和競技場的狀態'], state: ['stats', 'defeats', 'cardUses', 'steps'], flags: ['arena'], var: [202, 204, 214, 203, 208, 216, 207, 211, 212, 218, 219, 220, 221, 222, 223, 213, 423] },
  { k: 'foes', name: '敵人情報', msg: ['繼承敵人的情報狀態'], state: ['foeSeen', 'foeKills', 'foeScouted'] },
  { k: 'bgm', name: 'ＢＧＭ', msg: ['繼承BGM的取得狀態'], sw: [...Array(50).keys()].map((i) => 151 + i).concat([...Array(39).keys()].map((i) => 702 + i)) },
];
export const allPicks = () => Object.fromEntries(LAP_ITEMS.map((it) => [it.k, true]));

const copy = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const LEVELUP_ZP = 50, STATUSUP_ZP = 150; // $levelup_add_zp, $statusup_zp
// CE199 周回プレイ時のアイテム整理 + CE14 ドラゴンボール使用: the cards a round doesn't start with
const DROPPED = [1, 67, 168, 78, 37, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 2, 3, 4, 5, 6, 7, 8];
const STARTERS = [4, 7, 77, 71]; // Map007 event 1 page 1 (cardState in src/items.js gives the same to a new game)
const COMBO_SWAPS = [[553, 796], [1108, 1109], [445, 512]]; // the Super Saiyan's combo switches → the normal ones (all.rb 21525)
const PICCOLO = [31, 33, 34, 35, 36], PICCOLO_BAR = [71, 73, 74, 75, 76]; // CE161: 比克's move counts in the Bardock part

// the save as the main story has it, whatever it was in the middle of: the Bardock part's party and cards aside
// (main_z1bar_varchange, flags.trbd), the arena's cards back (a.keep), everyone back from a Super Saiyan form (CE159).
// The time room's and ZG's parties (flags.tr, zgParty, z4fTmp …) are only lists of ids: everyone is in party + bench.
function mainStory(world, old) {
  const o = copy(old);
  o.flags = o.flags || {};
  o.sw = o.sw || {};
  o.var = o.var || {};
  o.party = o.party || [];
  const k = o.flags.trbd;
  o.barPic = k && k.z1 && k.z1.pic;
  if (k && k.arc === 'z1' && k.main) {
    o.skillLv = o.skillLv || {};
    o.barPic = PICCOLO.map((id) => o.skillLv[id] || 0);
    if (k.keep && k.keep.pic) PICCOLO.forEach((id, i) => { o.skillLv[id] = k.keep.pic[i]; });
    Object.assign(o, { party: k.main.party, bench: k.main.bench, forms: k.main.forms, cards: k.main.cards, defeats: k.main.defeats, ss: k.main.ss });
    o.var[305] = k.main.v305;
    o.var[324] = k.main.v324;
  }
  const a = o.flags.arena;
  if (a && 'keep' in a) { o.cards = a.keep || {}; delete a.keep; }
  o.bench = o.bench || {};
  for (const no of [5, 1, 2, 3, 4, 6, 7]) {
    if (!(o.ss && o.ss[no])) continue;
    if (offHooks[no]) offHooks[no](world, o); else superSaiyan(world, o, no, false);
  }
  return o;
}

// everyone's state for the next round, as the original's $game_actors, $zp, $cha_typical_skill … stay in memory:
// also those nobody has met this round (old.lapKeep). 能力 off: back to the database, the ZP spent back to unused plus
// the initial levels' worth (all.rb 21419). Super Saiyan forms start from their base form.
function keptMembers(world, o, picks) {
  const fields = LAP_ITEMS.filter((it) => picks[it.k] && it.member).flatMap((it) => it.member), out = {};
  const was = (o.lapKeep && o.lapKeep.members) || {}, now = {};
  for (const m of [...o.party, ...Object.values(o.bench)]) if (m) now[m.id] = m;
  const form = new Set(Object.values(FORMS).filter(([b, f]) => b !== f).map(([, f]) => Number(f)));
  for (const id of Object.keys(world.actors).map(Number)) {
    if (form.has(id)) continue;
    const m = now[id] || was[id] || {}, k = {};
    for (const f of fields) if (m[f] !== undefined) k[f] = copy(m[f]);
    k.zp = m.zp || 0;
    if (!picks.status) k.zp += (world.actors[id].level - 1) * LEVELUP_ZP + (m.runzp || 0) * STATUSUP_ZP;
    out[id] = k;
  }
  for (const [b, f] of Object.values(FORMS)) if (b !== f && out[b]) out[f] = out[b];
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
export function nextLapState(game, saved, picks = allPicks()) {
  const world = game.world, old = mainStory(world, saved), s = game.newState(), L = world.laps || {};
  s.laps = lapCount(old) + 1;
  s.sw[860] = true;
  s.sw[484] = true; // ZP 割り振り計算済み
  s.var[266] = 150;
  const takeSw = (n) => { if (old.sw[n] !== undefined) s.sw[n] = old.sw[n]; };
  const takeVar = (n) => { if (old.var[n] !== undefined) s.var[n] = old.var[n]; };
  const take = (it) => {
    (it.sw || []).forEach(takeSw);
    (it.var || []).forEach(takeVar);
    for (const f of it.state || []) if (old[f] !== undefined) s[f] = copy(old[f]);
    for (const f of it.flags || []) if (old.flags[f] !== undefined) s.flags[f] = copy(old.flags[f]);
    if (it.tecspark) {
      for (const r of world.tecspark || []) {
        takeSw(r.get);
        if (r.chk && r.chk[0] === 1) takeSw(r.chk[1]);
        if (r.chk && r.chk[0] === 2) takeVar(r.chk[1]);
      }
    }
    if (it.combo) {
      for (const [a, b] of COMBO_SWAPS) [old.sw[a], old.sw[b]] = [old.sw[b], old.sw[a]];
      (L.comboSw || []).forEach(takeSw);
      (L.comboVar || []).forEach(takeVar);
    }
  };
  take(ALWAYS);
  for (const it of LAP_ITEMS) if (picks[it.k]) take(it);
  if (picks.tec) s.sw[861] = true; // 新気功法とかイベントで覚える技用
  if (s.flags.arena) s.flags.arena.first = []; // バトルアリーナの初回報酬はあえてクリアする (all.rb 21357)
  if (picks.skillLv && old.barPic) old.barPic.forEach((n, i) => { s.var[PICCOLO_BAR[i]] = n; });
  if (!picks.history && old.stats && old.stats.time) s.stats = { time: old.stats.time }; // (play time: Graphics.frame_count)
  if (picks.card) {
    const c = s.cards || {};
    for (const id of DROPPED) delete c[id];
    for (const id of STARTERS) c[id] = Math.min(99, (c[id] || 0) + 1);
    s.cards = c;
  }
  s.lapKeep = { members: keptMembers(world, old, picks) };
  s.party = s.party.map((m) => overlay(world, m, s.lapKeep));
  return s;
}

// hooked into makeMember: everyone who joins during a later round
let GAME = null;
setMemberHook((world, m) => (GAME && GAME.state && GAME.state.lapKeep ? overlay(world, m, GAME.state.lapKeep) : m));
export const setLapGame = (game) => { GAME = game; };

// ---------- CE9 必殺技設定 in a later round ----------
// All moves are forgotten at the start of a round and CE9 gives them back: every time a save is loaded, as well as at
// some pages. Only the rows the story won't teach again run here (world.laps.ce9: 861 and the ひらめき's get_flag); the
// rest of CE9 is in the chapters as on a first play. Every frame, like syncCostume: the conditions turn true as the
// story moves on and the Super Saiyan's lists come and go.
const CMP = [(a, b) => a === b, (a, b) => a >= b, (a, b) => a <= b, (a, b) => a > b, (a, b) => a < b, (a, b) => a !== b];
export function syncLap(game) {
  const s = game.state, rows = s && s.laps && s.sw && game.world.laps && game.world.laps.ce9;
  if (!rows) return;
  const v = s.var || {};
  for (const r of rows) {
    if (!r.when.every((c) => (c[0] === 'sw' ? !!s.sw[c[1]] === c[2] : CMP[c[3]](v[c[1]] || 0, c[2])))) continue;
    const m = s.party.find((x) => x.id === r.id) || (s.bench || {})[r.id] || (s.forms || {})[r.id];
    if (m && !m.skills.includes(r.skill)) { m.skills.push(r.skill); m.skills.sort((a, b) => a - b); } // (learn_skill sorts)
  }
}

// ---------- the screen: Scene_Db_New_game_plus on a phone ----------
const css = document.createElement('style');
css.textContent = `
.slots.lapa .panel { display: flex; flex-direction: column; max-height: 100%; }
.lapa-help { min-height: 84px; margin: 0 0 8px; padding: 8px 10px; font-size: 14px; line-height: 1.5; color: var(--ink); background: var(--cream-hi); border: 3px solid #7a5230; }
.lapa-list { flex: 0 1 auto; min-height: 0; overflow-y: auto; }
.lapa-row { display: flex; justify-content: space-between; align-items: center; width: 100%; margin: 0 0 3px; padding: 4px 12px; font: inherit; font-size: 16px; color: var(--ink); background: var(--cream-hi); border: 2px solid #7a5230; }
.lapa-row b { font-weight: normal; color: #d0480c; }
.lapa-row.off { background: #cfc4ae; color: #6a6054; border-color: #8a8070; }
.lapa-row.off b { color: #6a6054; }
.lapa-row.now { outline: 2px solid #f08a1c; outline-offset: -1px; }
.lapa-btns { display: flex; gap: 8px; margin-top: 4px; }
.lapa-btns .btn { flex: 1; margin: 0; text-align: center; }
.lapa-btns .btn::before { display: none; }
.lapa-ask { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(5,5,12,.7); padding: 16px; }
.lapa-ask > div { width: min(100%, 320px); padding: 14px; background: var(--cream-hi); border: 3px solid #7a5230; color: var(--ink); text-align: center; font-size: 16px; }
.lapa-ask .t-btns { display: flex; gap: 10px; margin-top: 10px; }
.lapa-ask .btn { flex: 1; text-align: center; margin: 0; }
.slots .lapa-go { margin: -4px 0 10px; padding: 7px 10px; width: 100%; font: inherit; font-size: 15px; color: #101848; background: #f08a1c; border: 2px solid #5a1e00; }
.slots .lapa-go:active { transform: translateY(2px); }
`;
document.head.appendChild(css);

// done(picks) on 是; back() on 返回
export function lapScreen(done, back) {
  const picks = allPicks(), el = document.createElement('div');
  el.className = 'slots lapa';
  const help = (it) => `請選擇要繼承的內容<br>${it ? it.msg.join('<br>') : '點項目可以切換繼承／不繼承'}`;
  el.innerHTML = `<div class="panel"><div class="sl-head">繼承到下一輪</div><div class="lapa-help">${help()}</div>
    <div class="lapa-list">${LAP_ITEMS.map((it, i) => `<button class="lapa-row" data-i="${i}"><span>${it.name}</span><b>繼承</b></button>`).join('')}</div>
    <div class="lapa-btns"><button class="btn" data-k="done">設定完成</button><button class="btn ghost" data-k="back">返回</button></div></div>`;
  el.onclick = (e) => {
    e.stopPropagation();
    const row = e.target.closest('.lapa-row');
    if (row) { // (the arrow keys of the original's cursor: one tap shows what it is and turns it over)
      const it = LAP_ITEMS[row.dataset.i];
      picks[it.k] = !picks[it.k];
      row.classList.toggle('off', !picks[it.k]);
      row.querySelector('b').textContent = picks[it.k] ? '繼承' : '不繼承';
      el.querySelectorAll('.lapa-row.now').forEach((x) => x.classList.remove('now'));
      row.classList.add('now');
      el.querySelector('.lapa-help').innerHTML = help(it);
      audio.se('Z3 カーソル移動');
      return;
    }
    const b = e.target.closest('[data-k]');
    if (!b) return;
    audio.se('Z3 決定');
    if (b.dataset.k === 'back') { el.remove(); back(); return; }
    if (b.dataset.k === 'no') { el.querySelector('.lapa-ask').remove(); return; }
    if (b.dataset.k === 'yes') { el.remove(); done({ ...picks }); return; }
    el.insertAdjacentHTML('beforeend', '<div class="lapa-ask"><div>用這個設定開始遊戲嗎？<div class="t-btns"><button class="btn" data-k="yes">是</button><button class="btn" data-k="no">否</button></div></div></div>');
  };
  document.getElementById('app').appendChild(el);
}

// ?dev=lap: a finished first round at Lv 99, then a second round with everything carried over; ?dev=lap3: the third;
// ?dev=lapold: the finished save itself on the map (it has switch 455, for the way in)
function finishedRound(game) {
  const s = game.state = game.newState();
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
// ?dev=lapa: the title, with a save that has something in every item and stands mid-way: 悟空 and 貝吉塔 Super Saiyans,
// someone else's party in front (the time room's), for the way in with the buttons. Also what the tests start from.
export function richRound(game) {
  const s = finishedRound(game), w = game.world;
  party(game, [3, 12, 5, 4]);
  for (const m of s.party) {
    m.level = 99; m.exp = w.actors[m.id].exp[99]; m.maxLv = 99;
    m.zp = 500; m.runzp = 3; m.plus = { hp: 40, ki: 30, atk: 20, def: 10, agi: 5 };
    m.typ = [2, 0, 0]; m.add = [365, 0, 0]; m.addN = 2; m.sp = { 365: 10 }; m.got = { 2: 1, 365: 1 }; m.set = { 2: 1, 365: 1 }; m.firstTyp = 1;
    applyLevel(w, m);
  }
  superSaiyan(w, s, 1, true);
  superSaiyan(w, s, 3, true);
  party(game, [5, 4]); // (the time room's party: 悟空 and 貝吉塔 on the bench, in their Super Saiyan forms)
  s.flags.tr = { back: { map: '48', x: 1424, y: 944 }, v43: 0, v17: 2, party: [5, 4], ss: {} };
  s.flags.zgParty = { party: [3, 12], ss: { 1: true } };
  s.flags.arena = { open: [true, true], clear: [2], first: [true] };
  s.sw[381] = s.sw[444] = true; // 服裝
  s.sw[70] = true;
  s.sw[605] = true; // ひらめき 氣圓烈斬
  s.sw[554] = true;
  s.sw[796] = true; s.sw[1108] = true; // the combos' Super Saiyan switches (swapped)
  s.sw[151] = s.sw[702] = true; // BGM
  s.sw[494] = s.sw[496] = true; // 神龍
  s.sw[119] = s.sw[469] = true; // (story: not carried over)
  Object.assign(s.var, { 25: 300, 224: 3, 305: 7000, 324: 50, 311: 5, 420: 5, 61: 6, 202: 88, 38: 2 });
  s.var[41] = 90941; s.var[43] = 999; s.var[104] = 3;
  s.cards = { 1: 1, 4: 1, 17: 2, 37: 1, 71: 2, 77: 1, 124: 3, 168: 1, 203: 1 };
  s.cardMax = { S: 3, A: 3, B: 4, C: 5 };
  s.zeni = 54321;
  s.skillLv = { 1: 120, 36: 40 };
  s.atkLv = { 3: 77 };
  s.combos = [705, 706];
  s.stats = { time: 3600, wins: 88, inns: 3 };
  s.defeats = { 3: 50 };
  s.cardUses = { 17: 4 };
  s.steps = 1234;
  s.foeSeen = { 1: true };
  s.foeKills = { 1: 3 };
  s.foeScouted = { 1: true };
  s.skillSeen = { 365: 1 };
  s.recipes = { 2: true };
  s.tactics = { 3: { ssOff: 0 } };
  s.teams = [[4, 5]];
  s.savedAt = Date.now();
  return s;
}
function dev(game, step) {
  if (!/^lap(a|old|\d+)?$/.test(step)) return false;
  setLapGame(game);
  if (step === 'lapa') {
    const s = richRound(game);
    try { localStorage.setItem('dbz-portrait-save-v1', JSON.stringify(s)); } catch (e) { /* private mode */ }
    game.state = null;
    Promise.resolve().then(() => game.showTitle());
    return true;
  }
  let s = finishedRound(game);
  if (step !== 'lapold') for (let n = Number(step.slice(3)) || 2; n > 1; n--) { s = nextLapState(game, s); s.sw[455] = true; }
  game.state = s;
  Promise.resolve().then(() => game.startField());
  return true;
}
registerZ3('laps', { dev });

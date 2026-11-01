// Item cards (アイテムカード / 特殊卡片), following the original (106_Scene_Db_Card.rb, 100_Scene_Db_Status.rb run_card,
// 101_Scene_Db_Battle.rb get_item_card / WinState 7, 095_Scene_Shop.rb, 010_Share.rb set_max_item_card).
//   inventory   state.cards {id: count}; how many of one card may be held depends on its rank
//               (state.cardMax, variables 224-227: S 1, A 1, B 2, C 3; no rank 1). Extra copies are sold for half
//               the price when the card screen or the shop opens.
//   getting     enemy drops after a won battle (world.drops), gifts in events ({item} nodes, src/events.js),
//               the card shop on the Z marks (world.cardShop), paid with CAP (state.zeni)
//   using       field menu「卡片」and the battle menu「卡牌」: heal / KI, change cards in the hand, and battle
//               effects (power, guard, first strike, dodge, KI-free move, stopping or weakening an enemy, scouter).
// Data: world.items / cardShop / drops (tools/build_items.py). Battle hooks: the exports under "battle" below.
// Menus: the 卡牌 slot of src/partymenu.js (battle 菜單 and field menu, battle = null on the field).
import { img, audio, toast, rand } from './core.js?v=20261101-2204';
import { newCard } from './battle.js?v=20261101-2204';
import { menuEntries, hooks } from './partymenu.js?v=20261101-2204';

const ICONS = 'ui/item_cards.png'; // 64×64 icons, 10 a row, the Z1 column of the original 顔カード.PNG
const CARDS = 'Graphics/Pictures/カード関係.PNG';
const FACES = 'Graphics/Pictures/Z1_顔味方.PNG';
const FOE_FACES = 'Graphics/Pictures/Z1_顔敵.PNG';
const MAX_RANK_UP = 7; // $max_item_card_num_syokiti: a rank-up card raises a limit up to 7
const RINGANA_CAP = 30; // variable 384 in Z1 (010_Share.rb set_ringana_card_kouka)
const SE_OK = 'Z3 決定', SE_ERR = 'Z3 エラー', SE_CARD = 'Z2 カードアップ', SE_HEAL = 'Z3 回復', SE_POWER = 'Z1 パワーアップ';
const OCC = ['戰鬥・地圖', '只能在戰鬥中', '只能在地圖上', '不能使用'];

// ---------- inventory ----------
export function cardState(s) {
  s.cards = s.cards || { 4: 1, 7: 1, 71: 1, 77: 1 }; // Map007 event 1 page 1 (new game): 三星球, 六星球, 龜屋, 哥美拉
  s.cardMax = s.cardMax || { S: 1, A: 1, B: 2, C: 3 }; // 010_Share.rb: card holding limits start at 1/1/2/3
  s.var = s.var || {};
  s.zeni = s.zeni || 0;
  return s;
}
export const maxOf = (s, it) => (it.rank ? s.cardMax[it.rank] : 1);

export function gainCard(world, s, id, n = 1) {
  cardState(s);
  if (!world.items[id]) return null;
  const k = Math.max(0, (s.cards[id] || 0) + n);
  if (k) s.cards[id] = k; else delete s.cards[id];
  return world.items[id];
}
// cards given by the original's events (Change Items, src/events.js); the world is set by main.js at boot
let WORLD = null;
export function setItemsWorld(w) { WORLD = w; }
export const eventCard = (s, id, n) => (WORLD ? gainCard(WORLD, s, id, n) : null);
export function lose(s, id) { if (!--s.cards[id]) delete s.cards[id]; }

// set_max_item_card: copies over the limit are sold for half their price
export function trim(world, s) {
  let cap = 0;
  for (const [id, n] of Object.entries(s.cards)) {
    const it = world.items[id];
    if (!it) { delete s.cards[id]; continue; }
    const max = maxOf(s, it);
    if (n > max) { cap += Math.floor(((n - max) * it.price) / 2); s.cards[id] = max; }
  }
  s.zeni += cap;
  if (cap) toast(`超過持有上限的卡片以半價賣出了（+${cap} CAP）`);
}

// the note text, with the original's \V[n] filled in
function desc(world, s, it) {
  const v = { 224: s.cardMax.S, 225: s.cardMax.A, 226: s.cardMax.B, 227: s.cardMax.C, 384: RINGANA_CAP, 383: s.cardMax.A - (s.cards[17] || 0) };
  return it.desc.replace(/\\V\[(\d+)\]/g, (_, n) => String(v[n] ?? s.var[n] ?? 0));
}

// ---------- battle ----------
// Flags that last one battle ($cha_power_up, $cha_defense_up, $cha_sente_card_flag, $cha_kaihi_card_flag,
// $cha_ki_zero …) or one turn ($one_turn_cha_defense_up, $run_stop_card, $run_alow_card, $run_glow_card).
let fx = null;
// cards other systems run (71 龜屋 = ZP, 77 哥美拉 = shared EXP, skill cards …): fieldCards[id] = async ({ game, battle }) => used?
// (a truthy result spends one copy unless the original never uses the card up)
export const fieldCards = {};
// バブルス (variable 39): no encounters for the next 5 card moves (140_Field_Main.rb encounter); this version has no
// card moves, so one move = 4 tiles flown. Returns true while it keeps enemies away.
export function bubbles(s) {
  if (!(s.var && s.var[39] > 0)) return false;
  s.bubbleTiles = (s.bubbleTiles || 0) + 1;
  if (s.bubbleTiles >= 4) { s.bubbleTiles = 0; s.var[39]--; if (!s.var[39]) toast('巴布魯斯的效果結束了'); }
  return true;
}
export function battleFx(b) { fx = { b, m: new Map(), oneTurnDef: false, stopUsed: false, gozu: false, mezu: false, scouter: false, stop: new Map() }; }
export function battleEnd() { fx = null; }
const mf = (m) => { let f = fx.m.get(m); if (!f) fx.m.set(m, (f = {})); return f; };
export const powerUp = (m) => !!(fx && mf(m).pow); // ×1.3 like a school match (102:16236)
export const guardUp = (m) => !!(fx && (fx.oneTurnDef || mf(m).def)); // damage taken ×0.7 (102:16325)
export const evades = (m) => !!(fx && mf(m).evade); // every attack misses this turn (102:16366)
export const kiNeed = (m, ki) => (fx && mf(m).kiZero ? 0 : ki); // 必殺技 card: one move without KI (008:4614)
hooks.kiNeed = (m, ki) => kiNeed(m, ki); // 自動 (partymenu.js autoSkill) sees the 必殺技 card too
export function payKi(m, ki) { m.ki -= kiNeed(m, ki); if (fx) mf(m).kiZero = false; }
// 少年: acts first this turn (101:203)
export function firstMovers(b, order) {
  if (!fx) return order;
  const first = order.filter((o) => o.kind === 'p' && mf(b.party[o.i]).sente);
  return [...first, ...order.filter((o) => !first.includes(o))];
}
// 爺爺: the enemy loses its next action (102:1499)
export function foeStopped(f) {
  const n = (fx && fx.stop.get(f)) || 0;
  if (n > 0) fx.stop.set(f, n - 1);
  return n > 0;
}
export const stopCount = (f) => (fx && fx.stop.get(f)) || 0;
export const scouted = () => !!(fx && fx.scouter);
// end of the turn's fighting (102:760-785)
export function endTurn(b) {
  if (!fx) return;
  fx.oneTurnDef = fx.stopUsed = fx.gozu = fx.mezu = false;
  b.party.forEach((m, i) => { if (b.plans[i]) { const f = mf(m); f.sente = f.evade = false; } });
}
// ブリーフ博士 ×1.5 EXP / 亀の甲羅 ×1.5 CAP for the next 5 won battles (variables 311 / 312)
export const expGain = (s, n) => ((s.var && s.var[311] > 0) ? Math.trunc(n * 1.5) : n);
export const capGain = (s, n) => ((s.var && s.var[312] > 0) ? Math.trunc(n * 1.5) : n);

// after a won battle: what's left of the EXP / CAP cards, then the dropped cards (get_item_card)
export async function afterBattle(b) {
  const s = cardState(b.game.state), w = b.world;
  const show = (...lines) => { b.say(...lines); return new Promise((res) => { b.cont = res; }); };
  const left = [];
  for (const [v, name] of [[311, '布里夫博士'], [312, '龜殼']]) {
    if (!(s.var[v] > 0)) continue;
    s.var[v]--;
    left.push(s.var[v] ? `（${name}的效果剩餘 ${s.var[v]} 回）` : `${name}的效果結束了。`);
  }
  if (left.length) await show(...left);
  const got = [];
  for (const f of b.foes) for (const [id, den] of w.drops[f.id] || []) if (rand(den) === 0) { gainCard(w, s, id); got.push(w.items[id].name); }
  if (got.length) { audio.se('Z1 アイテム取得', 80); await show('獲得以下卡片！', got.join('　')); }
}

// ---------- effects ----------
// ok(ctx, target) says whether the card does anything (the original plays the error sound otherwise);
// use(ctx, target) applies it and returns the sound to play.
const ALL_HAND = (h, f) => h.some(f);
const bump = (v, n) => (v === 7 ? 7 : Math.min(7, v + n));
const schoolPool = (s) => ((s.var[43] || 0) >= 11 ? [0, 1, 3, 4] : [0, 1, 2, 4]); // create_card_i, Z1
const healOk = (it, m) => (it.hp && m.hp < m.maxhp) || (it.mp && m.ki < m.maxki);
function heal(it, m, half) {
  const h = Math.ceil((m.maxhp * it.hp) / 100), k = Math.ceil((m.maxki * it.mp) / 100);
  if (it.hp) m.hp = Math.min(m.maxhp, m.hp + (half ? Math.floor(h / 2) : h));
  if (it.mp) m.ki = Math.min(m.maxki, m.ki + (half ? Math.floor(k / 2) : k));
}
const CARD = { // one card of the hand (output_card_change_effect)
  19: [(c) => c.a !== 7, (c) => { c.a = 7; }],
  20: [(c) => c.g !== 7, (c) => { c.g = 7; }],
  23: [(c) => c.s !== 0, (c) => { c.s = 0; }],
  25: [(c) => c.a !== c.g, (c) => { [c.a, c.g] = [c.g, c.a]; }],
  50: [() => true, (c, s) => { const p = schoolPool(s).filter((x) => x !== c.s); c.s = p[rand(p.length)]; }],
  84: [(c) => c.a !== 7, (c) => { c.a = bump(c.a, rand(2) + 1); }],
  87: [(c) => c.g !== 7, (c) => { c.g = bump(c.g, rand(2) + 1); }],
  93: [(c) => c.a !== 7 || c.g !== 7, (c) => { const n = rand(2) + 3; c.a = bump(c.a, n); c.g = bump(c.g, n); }],
  106: [(c) => c.a !== 7 || c.g !== 7, (c) => { const n = rand(2) + 1; c.a = bump(c.a, n); c.g = bump(c.g, n); }],
};
const HAND = { // the whole hand
  21: [(h) => ALL_HAND(h, (c) => c.a !== 7), (h) => { const n = rand(2) + 1; h.forEach((c) => { c.a = bump(c.a, n); }); }],
  22: [(h) => ALL_HAND(h, (c) => c.g !== 7), (h) => { const n = rand(2) + 1; h.forEach((c) => { c.g = bump(c.g, n); }); }],
  24: [() => true, (h) => { h.forEach((c, k) => { h[k] = newCard(); }); }],
  26: [(h) => ALL_HAND(h, (c) => c.a !== c.g), (h) => { h.forEach((c) => { [c.a, c.g] = [c.g, c.a]; }); }],
  98: [(h) => ALL_HAND(h, (c) => c.g !== 7), (h) => { const n = rand(2) + 3; h.forEach((c) => { c.g = bump(c.g, n); }); }],
  104: [(h) => ALL_HAND(h, (c) => c.s !== 0), (h) => { h.forEach((c) => { c.s = 0; }); }],
  105: [(h) => ALL_HAND(h, (c) => c.a !== 7), (h) => { const n = rand(2) + 3; h.forEach((c) => { c.a = bump(c.a, n); }); }],
};
const OTHER = { // no target
  28: [(x) => (x.s.var[311] || 0) < 999, (x) => { x.s.var[311] = Math.min(999, (x.s.var[311] || 0) + 5); return SE_HEAL; }],
  80: [(x) => (x.s.var[312] || 0) < 999, (x) => { x.s.var[312] = Math.min(999, (x.s.var[312] || 0) + 5); return SE_HEAL; }],
  29: [() => !fx.oneTurnDef, () => { fx.oneTurnDef = true; return 'Z1 刀'; }],
  33: [(x) => x.party.some((m) => !mf(m).pow), (x) => { x.party.forEach((m) => { mf(m).pow = true; }); return SE_POWER; }],
  34: [() => !fx.scouter, () => { fx.scouter = true; return SE_OK; }],
  205: [() => !fx.scouter, () => { fx.scouter = true; return SE_OK; }],
  27: [(x) => (x.s.var[39] || 0) < 999, (x) => { x.s.var[39] = Math.min(999, (x.s.var[39] || 0) + 5); return 'Z1 飛ぶ'; }], // バブルス
  42: [(x) => x.s.cardMax.S < MAX_RANK_UP, (x) => { x.s.cardMax.S++; return 'Z3 レベルアップ'; }],
  43: [(x) => x.s.cardMax.A < MAX_RANK_UP, (x) => { x.s.cardMax.A++; return 'Z3 レベルアップ'; }],
  44: [(x) => x.s.cardMax.B < MAX_RANK_UP, (x) => { x.s.cardMax.B++; return 'Z3 レベルアップ'; }],
  89: [(x) => (x.s.cards[17] || 0) < x.s.cardMax.A, (x) => { gainCard(x.world, x.s, 17); return 'Z3 アイテム取得'; }], // 仙豆の壺
  45: [(x) => x.s.cardMax.C < MAX_RANK_UP, (x) => { x.s.cardMax.C++; return 'Z3 レベルアップ'; }],
  70: [() => true, (x) => { x.s.zeni += RINGANA_CAP; return SE_HEAL; }],
};
const MEMBER = { // one party member, in battle (100_Scene_Db_Status.rb run_card)
  32: [(f) => !f.pow, (f) => { f.pow = true; return SE_POWER; }],
  40: [(f) => !f.pow || !f.def, (f) => { f.pow = f.def = true; return SE_POWER; }],
  41: [(f) => !f.def, (f) => { f.def = true; return 'Z1 刀'; }],
  53: [(f) => !f.sente, (f) => { f.sente = true; return 'Z1 飛ぶ'; }],
  54: [(f) => !f.evade, (f) => { f.evade = true; return 'Z1 高速移動'; }],
  64: [(f) => !f.kiZero, (f) => { f.kiZero = true; return SE_CARD; }],
};
const FOE = { // one enemy (101_Scene_Db_Battle.rb WinState 7)
  30: [() => !fx.stopUsed, (f) => { fx.stopUsed = true; fx.stop.set(f, stopCount(f) + 1); }],
  51: [() => !fx.gozu, (f) => { fx.gozu = true; f.card.a = Math.max(0, f.card.a - (rand(2) + 1)); }],
  52: [() => !fx.mezu, (f) => { fx.mezu = true; f.card.g = Math.max(0, f.card.g - (rand(2) + 1)); }],
};
// 仙豆 on a dying Saiyan in battle: power and guard up (run_card, $hinshi_hp = 31)
const ZENKAI = [3, 5, 12, 14, 16, 17, 18, 19, 20, 25, 26, 27, 28, 29, 30, 32];

// what kind of target a card wants: 'member' | 'hand' | 'foe' | 'none'
function target(id, it) {
  if (it.kind === 'heal') return it.all ? 'none' : 'member';
  if (it.kind === 'card') return 'hand';
  if (it.kind === 'foe') return 'foe';
  if (it.kind === 'member' && id !== 33) return 'member';
  return 'none';
}

// can this card be used here at all (chk_card_run), before picking a target
function usable(x, id, it) {
  if (it.kind === 'hook') return !!fieldCards[id] && !(it.occ === 1 && !x.battle) && !(it.occ === 2 && x.battle);
  if (it.kind === 'none' || it.occ === 3) return false;
  if (it.occ === 1 && !x.battle) return false;
  if (it.occ === 2 && x.battle) return false;
  if (it.kind === 'heal') return x.party.some((m) => healOk(it, m));
  if (it.kind === 'card') return x.hand.some((c) => CARD[id][0](c));
  if (it.kind === 'cardAll') return HAND[id][0](x.hand);
  if (it.kind === 'member') return id === 33 ? OTHER[33][0](x) : x.party.some((m) => MEMBER[id][0](mf(m)));
  if (it.kind === 'foe') return FOE[id][0]() && x.battle.foes.some((f) => f.hp > 0);
  return !!OTHER[id] && OTHER[id][0](x);
}
// apply to the target; returns the sound, or null when it does nothing
function apply(x, id, it, t) {
  if (it.kind === 'heal') {
    if (!it.all) {
      if (!healOk(it, t)) return null;
      const dying = t.hp > 0 && Math.trunc((t.hp * 100) / t.maxhp) < 31;
      heal(it, t);
      if (id === 17 && dying && fx && ZENKAI.includes(t.id)) { mf(t).pow = true; mf(t).def = true; }
      return SE_HEAL;
    }
    for (const m of x.party) {
      if (id === 18) { if (m.hp > 0) { m.hp = m.maxhp; m.ki = m.maxki; } else heal(it, m, true); } // 神龍: KO'd members get half
      else heal(it, m, id === 61 && m.hp <= 0); // 急救箱: KO'd members get half
    }
    return SE_HEAL;
  }
  if (it.kind === 'card') { if (!CARD[id][0](t)) return null; CARD[id][1](t, x.s); return SE_CARD; }
  if (it.kind === 'cardAll') { HAND[id][1](x.hand); return SE_CARD; }
  if (it.kind === 'member' && id !== 33) { const f = mf(t); return MEMBER[id][0](f) ? MEMBER[id][1](f) : null; }
  if (it.kind === 'foe') { FOE[id][1](t); return 'Z1 歩く音'; }
  return OTHER[id][1](x);
}

// ---------- drawing ----------
export function iconCanvas(it, size = 40) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  c.style.width = c.style.height = `${size}px`;
  const s = img(ICONS);
  const paint = () => { if (s.ok) c.getContext('2d').drawImage(s.im, 64 * (it.icon % 10), 64 * Math.floor(it.icon / 10), 64, 64, 0, 0, 64, 64); };
  if (s.ok) paint(); else s.p.then(paint);
  return c;
}
export function handCanvas(cd) { // the original Z1 card (64×96)
  const c = document.createElement('canvas');
  c.width = 64; c.height = 96;
  const s = img(CARDS), x = c.getContext('2d');
  const paint = () => {
    if (!s.ok) return;
    x.drawImage(s.im, 0, 96, 64, 96, 0, 0, 64, 96);
    x.drawImage(s.im, 32 * cd.a, 0, 32, 32, 2, 2, 32, 32);
    x.drawImage(s.im, 32 * cd.g, 32, 32, 32, 30, 62, 32, 32);
    x.drawImage(s.im, 32 * cd.s, 64, 32, 32, 16, 32, 32, 32);
  };
  if (s.ok) paint(); else s.p.then(paint);
  return c;
}
function faceCanvas(sheet, row, col = 0) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const s = img(sheet);
  const paint = () => { if (s.ok) c.getContext('2d').drawImage(s.im, 64 * col, 64 * row, 64, 64, 0, 0, 64, 64); };
  if (s.ok) paint(); else s.p.then(paint);
  return c;
}

const CSS = `
#cards { position: absolute; inset: 0; z-index: 45; background: rgba(0,0,0,.72); display: flex; flex-direction: column; gap: 6px;
  padding: calc(var(--safe-t) + 8px) 8px calc(var(--safe-b) + 8px); color: var(--ink); }
#cards .cw { border: 10px solid transparent; border-image: url("assets/ui/frame.png") 8 / 10px stretch; background: var(--cream) padding-box; padding: 4px 6px; }
#cards .head { display: flex; align-items: center; justify-content: space-between; font-size: 19px; }
#cards .head small { font-size: 14px; color: #6a4a24; }
#cards .tabs { display: flex; gap: 6px; }
#cards .tabs button { flex: 1; padding: 4px; font-size: 16px; border: 2px solid #b08850; background: #fbe6bf; color: var(--ink); border-radius: 4px; }
#cards .tabs button.on { background: #d0480c; color: #fff; border-color: #d0480c; }
#cards .list { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; align-content: start; touch-action: pan-y; }
#cards .it { display: flex; align-items: center; gap: 6px; padding: 3px; border: 2px solid transparent; background: none; text-align: left; min-width: 0; }
#cards .it.sel { border-color: #d0480c; background: #fbe6bf; }
#cards .it.off { opacity: .45; }
#cards .it canvas { image-rendering: pixelated; flex: none; }
#cards .it .nm { font-size: 15px; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#cards .it .n { font-size: 12px; color: #7a5230; }
#cards .empty { grid-column: 1 / -1; white-space: pre-line; text-align: center; padding: 24px 0; color: #7a5230; }
#cards .detail { display: flex; gap: 8px; min-height: 96px; }
#cards .detail canvas { image-rendering: pixelated; flex: none; }
#cards .detail .tx { flex: 1; font-size: 15px; line-height: 1.35; white-space: pre-line; }
#cards .detail .tag { display: inline-block; font-size: 12px; padding: 0 4px; margin: 4px 4px 0 0; border: 1px solid #b08850; color: #6a4a24; }
#cards .acts { display: flex; gap: 6px; }
#cards .acts .btn { margin: 0; text-align: center; }
#cards .pick { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
#cards .pick button { background: none; border: 2px solid transparent; padding: 2px; text-align: center; font-size: 13px; color: var(--ink); }
#cards .pick button:active { border-color: #d0480c; }
#cards .pick button.off { opacity: .4; }
#cards .pick canvas { display: block; image-rendering: pixelated; width: 56px; height: 56px; margin: 0 auto; background: #000; }
#cards .pick .hand { padding: 1px; }
#cards .pick .hand canvas { width: 44px; height: 66px; background: none; }
#cards .pick .flash { animation: cardflash .5s 2; }
@keyframes cardflash { 50% { filter: brightness(2.4); } }
`;
export function overlay() {
  if (!document.getElementById('cards-css')) {
    const st = document.createElement('style');
    st.id = 'cards-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.id = 'cards';
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  document.getElementById('app').appendChild(el);
  return el;
}
export const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
export function button(label, fn, cls = 'btn') { const b = h('button', cls, label); b.onclick = fn; return b; }
function detail(world, s, it, extra) {
  const d = h('div', 'detail');
  d.appendChild(iconCanvas(it, 64));
  const tx = h('div', 'tx', desc(world, s, it));
  tx.appendChild(h('br'));
  tx.appendChild(h('span', 'tag', OCC[it.occ]));
  if (it.rank) tx.appendChild(h('span', 'tag', `${it.rank} 級・最多 ${maxOf(s, it)} 張`));
  if (extra) tx.appendChild(h('span', 'tag', extra));
  d.appendChild(tx);
  return d;
}

// ---------- the card screen (Scene_Db_Card): field menu (battle = null) or battle menu ----------
export function openCards(game, battle = null) {
  const world = game.world, s = cardState(game.state);
  const x = { world, s, battle, party: s.party, hand: s.hand };
  trim(world, s);
  const el = overlay();
  let sel = null, mode = 'list';
  return new Promise((done) => {
    const close = () => { el.remove(); audio.se(SE_OK, 70); if (game.renderHud && !battle) game.renderHud(); done(); };
    const use = (id, it, t) => {
      const se = apply(x, id, it, t);
      if (!se) { audio.se(SE_ERR, 70); return false; }
      audio.se(se, 80);
      lose(s, id);
      toast(`使用了「${it.name}」`);
      return true;
    };
    const render = () => {
      el.innerHTML = '';
      const head = h('div', 'cw head', battle ? '卡牌' : '卡片');
      head.appendChild(h('small', null, `信用點 ${s.zeni} CAP`));
      el.appendChild(head);
      const ids = Object.keys(s.cards).map(Number).filter((id) => world.items[id]).sort((a, b) => world.items[a].order - world.items[b].order);
      if (sel != null && !s.cards[sel] && mode !== 'hand') { sel = null; mode = 'list'; } // the changed hand stays up
      {
        const list = h('div', 'cw list');
        if (!ids.length) list.appendChild(h('div', 'empty', '一張卡片也沒有。\n打倒敵人或在 Z 標記的卡片商店可以得到卡片。'));
        for (const id of ids) {
          const it = world.items[id];
          const b = h('button', `it${sel === id ? ' sel' : ''}${usable(x, id, it) ? '' : ' off'}`);
          b.appendChild(iconCanvas(it, 40));
          const t = h('div');
          t.appendChild(h('div', 'nm', it.name));
          t.appendChild(h('div', 'n', `${s.cards[id]} / ${maxOf(s, it)}${it.rank ? `　${it.rank}` : ''}`));
          b.appendChild(t);
          b.onclick = () => { sel = id; mode = 'list'; audio.se('Z3 カーソル移動', 60); render(); };
          list.appendChild(b);
        }
        el.appendChild(list);
      }
      const box = h('div', 'cw');
      if (sel != null) box.appendChild(detail(world, s, world.items[sel]));
      else box.appendChild(h('div', 'detail', ids.length ? '點選一張卡片看說明。' : ''));
      if (mode !== 'list') box.appendChild(picker(world.items[sel]));
      el.appendChild(box);
      const acts = h('div', 'acts');
      if (mode === 'list' && sel != null) acts.appendChild(button('使用', () => tryUse(sel)));
      if (mode !== 'list') acts.appendChild(button('返回', () => { mode = 'list'; render(); }));
      else acts.appendChild(button('關閉', close));
      el.appendChild(acts);
    };
    const tryUse = (id) => {
      const it = world.items[id];
      if (!usable(x, id, it)) { audio.se(SE_ERR, 70); toast(it.kind === 'hook' ? '這張卡片的功能還沒做好' : it.kind === 'none' || it.occ === 3 ? '這張卡片不能使用' : it.occ === 1 && !battle ? '這張卡片只能在戰鬥中使用' : it.occ === 2 && battle ? '這張卡片只能在地圖上使用' : '現在使用也沒有效果'); return; }
      audio.se(SE_OK, 70);
      if (it.kind === 'hook') { el.hidden = true; fieldCards[id]({ game, battle }).then((r) => { if (r && it.spent) lose(s, id); el.hidden = false; render(); }); return; }
      mode = target(id, it);
      if (mode === 'none') mode = 'confirm';
      render();
    };
    // the target window under the explanation
    const picker = (it) => {
      const id = sel;
      const p = h('div', 'pick');
      const after = () => { if (!s.cards[id] && mode !== 'hand') mode = 'list'; render(); };
      if (mode === 'confirm') {
        p.appendChild(h('div', null, '要使用這張卡片嗎？'));
        const yes = button('是', () => { if (use(id, it)) mode = 'list'; render(); }, 'btn');
        const no = button('否', () => { mode = 'list'; render(); }, 'btn');
        const row = h('div', 'acts'); row.style.width = '100%'; row.append(yes, no);
        p.appendChild(row);
      } else if (mode === 'member') {
        for (const m of x.party) {
          const okHere = it.kind === 'heal' ? healOk(it, m) : MEMBER[id][0](mf(m));
          const b = h('button', okHere ? '' : 'off');
          b.appendChild(faceCanvas(FACES, m.id - 3, m.hp <= 0 ? 2 : m.hp * 4 < m.maxhp ? 1 : 0));
          b.appendChild(h('div', null, m.name));
          b.appendChild(h('div', null, `HP ${m.hp}/${m.maxhp}`));
          b.appendChild(h('div', null, `KI ${m.ki}/${m.maxki}`));
          b.onclick = () => { if (use(id, it, m)) after(); };
          p.appendChild(b);
        }
      } else if (mode === 'hand') {
        x.hand.forEach((cd, k) => {
          const b = h('button', `hand${!s.cards[id] || CARD[id][0](cd) ? '' : ' off'}`);
          b.appendChild(handCanvas(cd));
          b.onclick = () => {
            if (!s.cards[id] || !use(id, it, cd)) return;
            after();
            const nb = el.querySelectorAll('.pick .hand')[k];
            if (nb) nb.classList.add('flash');
          };
          p.appendChild(b);
        });
      } else if (mode === 'foe') {
        for (const f of x.battle.foes) {
          if (f.hp <= 0) continue;
          const b = h('button');
          b.appendChild(faceCanvas(FOE_FACES, f.id, f.hp * 4 < f.maxhp ? 1 : 0));
          b.appendChild(h('div', null, f.name));
          if (scouted() && f.card) b.appendChild(handCanvas(f.card)).style.cssText = 'width:32px;height:48px;background:none';
          b.onclick = () => { if (use(id, it, f)) { mode = 'list'; render(); } };
          p.appendChild(b);
        }
      }
      return p;
    };
    render();
  });
}

menuEntries.card = ({ game, battle }) => openCards(game, battle);

// ---------- the card shop (Scene_Shop on a Z mark) ----------
export function openShop(game) {
  const world = game.world, s = cardState(game.state);
  trim(world, s);
  const el = overlay();
  let tab = 'buy', sel = null;
  return new Promise((done) => {
    const close = () => { el.remove(); audio.se(SE_OK, 70); toast('祝你一路順風'); done(); };
    const render = () => {
      el.innerHTML = '';
      const head = h('div', 'cw head', '卡片商店');
      head.appendChild(h('small', null, `信用點 ${s.zeni} CAP`));
      el.appendChild(head);
      const tabs = h('div', 'tabs');
      for (const [k, label] of [['buy', '買'], ['sell', '賣']]) {
        const b = button(label, () => { tab = k; sel = null; render(); }, k === tab ? 'on' : '');
        tabs.appendChild(b);
      }
      el.appendChild(tabs);
      const ids = tab === 'buy' ? world.cardShop
        : Object.keys(s.cards).map(Number).filter((id) => world.items[id] && world.items[id].price > 0).sort((a, b) => world.items[a].order - world.items[b].order);
      const list = h('div', 'cw list');
      if (!ids.length) list.appendChild(h('div', 'empty', '沒有可以賣的卡片。'));
      for (const id of ids) {
        const it = world.items[id], have = s.cards[id] || 0;
        const price = tab === 'buy' ? it.price : Math.floor(it.price / 2);
        const off = tab === 'buy' && (it.price > s.zeni || have >= maxOf(s, it));
        const b = h('button', `it${sel === id ? ' sel' : ''}${off ? ' off' : ''}`);
        b.appendChild(iconCanvas(it, 40));
        const t = h('div');
        t.appendChild(h('div', 'nm', it.name));
        t.appendChild(h('div', 'n', `${price} CAP　持有 ${have}/${maxOf(s, it)}`));
        b.appendChild(t);
        b.onclick = () => { sel = id; audio.se('Z3 カーソル移動', 60); render(); };
        list.appendChild(b);
      }
      el.appendChild(list);
      const box = h('div', 'cw');
      box.appendChild(sel != null ? detail(world, s, world.items[sel])
        : h('div', 'detail', tab === 'buy' ? '這裡是卡片商店，\n可以用信用點來交換卡片喲。' : '賣出的價錢是買價的一半。'));
      el.appendChild(box);
      const acts = h('div', 'acts');
      if (sel != null) {
        const it = world.items[sel];
        acts.appendChild(button(tab === 'buy' ? `買（${it.price} CAP）` : `賣（${Math.floor(it.price / 2)} CAP）`, () => {
          const have = s.cards[sel] || 0;
          if (tab === 'buy') {
            if (it.price > s.zeni || have >= maxOf(s, it)) { audio.se(SE_ERR, 70); toast(have >= maxOf(s, it) ? '已經到持有上限了' : 'CAP 不夠'); return; }
            s.zeni -= it.price;
            gainCard(world, s, sel);
          } else {
            s.zeni += Math.floor(it.price / 2);
            lose(s, sel);
            if (!s.cards[sel]) sel = null;
          }
          audio.se('Z1 アイテム取得', 70);
          render();
        }));
      }
      acts.appendChild(button('離開', close));
      el.appendChild(acts);
    };
    render();
  });
}

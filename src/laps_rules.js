// 第二輪的規則（等級上限、移動、卡片商店、BGM、換裝、圖鑑、設定、難度），docs/laps-plan.md 第 1 節。分工 B 的檔案，細節在 docs/laps-b.md。
//   等級        set_actor_final_level (all.rb 21223): 199 + 100 a round up to 9 rounds, + 1000 a round after, 9999 at most. The
//               stats past 99 are in src/party.js applyLevel; the curve past 99 is made here (world.laps.exp).
//   移動        all.rb 165123: card moves ×2, ×3 with 飛機 / 氣墊車 (variable 420); the field's speed (fieldHooks.step)
//   卡片        商店: event 1 page 7 sets variable 230 = 11 (all.rb 31689, 31719-31749, 31790); 141 is not used up (39903)
//   設定        the rows Scene_Db_Option adds (157379) that this version has something for; kept in options like the others
//   難度        revise_enemy_parameters (187755): the enemies' numbers in world.enemies, re-made when the choice changes
// ?dev=lapb<round>: that round with the party one EXP below the cap; ?dev=lapbmax: at Lv 9999; ?dev=lapbshop: next to a card
// square; ?dev=lapbtr: in the 時之間
import { levelCap, setLevelCap, applyLevel } from './party.js?v=20261108-2252';
import { isLap, lapCount } from './laps.js?v=20261108-2252';
import { registerZ3, devZ3 } from './z3.js?v=20261108-2252';
import { fieldHooks } from './field.js?v=20261108-2252';
import './cards_a.js?v=20261108-2252';
import { capRules } from './cards_b.js?v=20261108-2252';
import * as items from './items.js?v=20261108-2252';
import { battleRules } from './battle.js?v=20261108-2252';
import { cutRules } from './cutscene.js?v=20261108-2252';
import { options, lapOptions, songList } from './fieldmenu.js?v=20261108-2252';

const stateOf = () => { const g = window.__game; return g && g.state; };

// ---------- 等級 ----------
export const finalLevel = (laps) => Math.min(9999, 199 + Math.min(laps, 9) * 100 + Math.max(laps - 9, 0) * 1000);

// make_exp_list (all.rb 187941), tools/build_data.py exp_curve carried on past 99, into the actors' own lists
let curved = 99;
function extendCurves(world, cap) {
  if (cap <= curved) return;
  curved = cap;
  const lv = [28, 61, 100], num = [2500, 4500, 6500];
  for (const [id, [basis, infl]] of Object.entries(world.laps.exp)) {
    const exp = world.actors[id].exp;
    let m = basis, n = 0.75 + infl / 200;
    for (let i = 2; i <= cap; i++) {
      if (i >= exp.length) {
        let e = exp[i - 1] + Math.trunc(m);
        for (let k = 0; k < 3; k++) {
          if (i < lv[k]) continue;
          e += num[k] * (i - lv[k]) + Math.floor((e - exp[i - 1]) / 95);
          if (k > 0) e += num[k] * (i - lv[k]);
        }
        exp.push(e);
      }
      m *= 1 + n;
      n *= 0.9;
    }
  }
}
setLevelCap(() => {
  const g = window.__game, s = g && g.state;
  const cap = finalLevel(lapCount(s));
  if (g && g.world) extendCurves(g.world, cap);
  return cap;
});

// ---------- 移動 ----------
const fly = fieldHooks.step; // (src/cards_a.js: variable 420 counts down, ×2)
fieldHooks.step = (s, plain) => {
  const want = fly ? fly(s, plain) : plain;
  const map = window.__game.world.maps[s.map]; // on foot there are no card moves
  if (!isLap(s) || (map && map.walk)) return want;
  return want > plain ? plain * 3 : plain * 2;
};

// ---------- 卡片 ----------
// variable 230 = 11: every list, and the cards added after a boss (all of those also say switch 860). After shopGoods and
// the favourite's 141 (src/cards_square.js, src/cards_b.js)
items.shopHooks.push((world, s, ids) => {
  if (!isLap(s) || !world.csq) return ids;
  const c = world.csq, all = new Set(ids);
  for (const k of ['z1', 'z2', 'z3', 'z4', 'zG', 'zGadd']) for (const id of c.shop[k] || []) all.add(id);
  for (const [id, q] of c.bonus) if (q.sw) all.add(id);
  const fav = ids[0] === 141 ? [141] : [];
  return [...fav, ...[...all].filter((id) => world.items[id] && !fav.includes(id)).sort((a, b) => world.items[a].order - world.items[b].order)];
});
// $data_items[141].consumable = false (39903, 145149)
function card141(world) {
  const it = world.items[141];
  if (it) Object.defineProperty(it, 'spent', { get: () => !isLap(stateOf()), enumerable: true, configurable: true });
}
const waitWorld = setInterval(() => { const g = window.__game; if (g && g.world) { clearInterval(waitWorld); card141(g.world); } }, 200);

// ---------- 難度 ----------
// variable 353: 0 up to the rounds played; the save's own round limits what another save chose on this device
export const difficulty = (s) => (isLap(s) ? Math.min(options.diff || 0, lapCount(s)) : 0);
const RATED = ['maxhp', 'atk', 'spi', 'agi', 'exp', 'gold', 'sp']; // (def stays; sp is the enemy's maxmp, all.rb 50775)
const base = new Map();
let applied = 0;
function setDifficulty(world, d) {
  if (d === applied) return;
  applied = d;
  for (const e of [...Object.values(world.enemies), ...world.bestiary]) {
    if (!base.has(e)) base.set(e, RATED.map((k) => e[k]));
    RATED.forEach((k, i) => { const v = base.get(e)[i]; if (v != null) e[k] = Math.ceil((v * (100 + d * 10)) / 100); });
  }
}
battleRules.setup = (world, game) => setDifficulty(world, difficulty(game.state));
// 共有経験値 of a 時之間 boss (variable 306, all.rb 50724); its CAP (variable 317) stays
battleRules.reward = (t) => (t && t.shared ? { ...t, shared: Math.ceil((t.shared * (100 + difficulty(stateOf()) * 10)) / 100) } : t);

// ---------- 設定 ----------
for (const k of ['evWait', 'evBgm', 'evReady', 'capMul', 'diff']) options[k] = options[k] || 0;
const DIFF = (n) => [...Array(n + 1).keys()].map((d) => [d, d ? `${d}0％以上` : '通常']);
lapOptions.rows = (g) => {
  if (!isLap(g.state)) return [];
  setDifficulty(g.world, difficulty(g.state));
  return [
    ['evWait', '事件等待', [[0, '有效'], [1, '無效']], '事件時的等待設定'],
    ['evBgm', '事件戰鬥ＢＧＭ', songList('battle'), '設定事件戰鬥的BGM'],
    ['evReady', '事件戰鬥前ＢＧＭ', songList('ready'), '設定事件戰鬥開始到第一次出招前的BGM（戰鬥前ＢＧＭ也要設定才會播，和原版一樣）'],
    ['capMul', 'ＣＡＰＺＰ變換量', [[0, '1倍'], [1, '10倍'], [2, '100倍'], [3, '1000倍']], '設定使用重力裝置卡時按上下按鈕的轉換量'],
    ['diff', '難易度', DIFF(lapCount(g.state)), '設定戰鬥的難度。敵人的能力和經驗值會依設定值上升，最大值依周目數提升'],
  ];
};
capRules.mul = () => (isLap(stateOf()) ? 10 ** (options.capMul || 0) : 1);
cutRules.wait = (n) => (isLap(stateOf()) && options.evWait && n > 2 ? 1 : n); // (all.rb 30431)

// ---------- BGM ----------
// a later round's event battle (no escape): all.rb 47545, 53145, set_battle_ready_bgm 51342. With 戰鬥前ＢＧＭ left at 默認
// the first test there plays the battle's song, whatever 事件戰鬥前ＢＧＭ says
lapOptions.ready = (g, b) => {
  if (!isLap(g.state) || !b.boss) return options.ready;
  return options.ready && options.evReady;
};
lapOptions.event = (g) => (isLap(g.state) ? options.evBgm : 0);

// ---------- ?dev=lapb… ----------
const lapDev = (game, round) => {
  if (!devZ3(game, 'lap')) return null;
  const s = game.state;
  s.laps = round - 1;
  return s;
};
registerZ3('lapb', {
  dev(game, step) {
    const r = /^lapb(\d+|max|shop|tr)$/.exec(step);
    if (!r) return false;
    const k = r[1];
    if (k === 'tr') {
      if (!devZ3(game, 'tr')) return false;
      const s = game.state;
      s.laps = 1;
      s.sw[860] = true;
      return true;
    }
    const s = lapDev(game, /\d/.test(k) ? Math.max(2, +k) : k === 'max' ? 31 : 2);
    if (!s) return false;
    if (k === 'shop') {
      s.zeni = 9999999;
      s.map = '1'; s.x = 7 * 32 + 16; s.y = 4 * 32 + 16;
      items.gainCard(game.world, s, 141);
      items.gainCard(game.world, s, 76);
      items.gainCard(game.world, s, 203);
      return true;
    }
    const cap = levelCap();
    for (const m of s.party) {
      const curve = game.world.actors[m.id].exp;
      m.level = k === 'max' ? cap : cap - 1;
      m.exp = k === 'max' ? curve[cap] : curve[cap] - 1;
      m.maxLv = m.level;
      applyLevel(game.world, m);
      m.hp = m.maxhp;
      m.ki = m.maxki;
    }
    return true;
  },
});

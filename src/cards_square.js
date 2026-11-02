// 卡片格依時代換商品（Scene_Shop 的 z1～zG_cardlist、create_get_card 的 card_id_z1～zg、神經衰弱，變數 44）＋卡片 198／199／200、90／103／157 村人、119 基朗、202 界王星 — docs/cards-plan.md; the data is built by tools/build_cards_square.py.
// Card effects register in src/items.js fieldCards[id] = async ({ game, battle }) => used | 'close' | false.
// The goods / prizes by part of the story are in src/cardgames.js (cardSquare, shopGoods, prizePool; the shop's list goes
// through items.shopHooks, registered here before src/cards_b.js adds 141); here:
//   198 卡片商店 / 199 卡片抽籤 / 200 卡片連線   Scene_Db_Card other_card_run (all.rb 147224): the next card square is the
//        shop (switch 866) / the concentration game (867) / the lottery (868); refused while it already is. The note's
//        \N[2] (actor 2's name, set_cardmas_name 145117) says which one is set now.
//   202 界王星   Scene_Db_Status run_card (all.rb 46186): +150 ZP to one member
//   90 村人A / 103 村人B / 157 村人C / 119 基朗   skill cards (Items element 32): src/growth.js useSkillCard teaches
//        効果UP(HP) 431 / 効果UP(KI) 440 / 効果UP(H・K) 449 / 気まぐれ 390 (world.growth, tools/build_cards_square.py);
//        their effects: get_recovery_hpki_skill_par (all.rb 19395, items.healBonus) and get_battle_skill's きまぐれ
//        (all.rb 6794, growth.cardHooks).
// ?dev=csq / csqz2 / csqz3 / csqz4 / csqzg: a save of that part of the story next to a card square (map 1), with CAP
// and these cards.
import { audio, rand, toast } from './core.js?v=20261103-0433';
import * as items from './items.js?v=20261103-0433';
import * as growth from './growth.js?v=20261103-0433';
import { pickMember } from './partymenu.js?v=20261103-0433';
import { newCard } from './battle.js?v=20261103-0433';
import { registerZ3 } from './z3.js?v=20261103-0433';
import { shopGoods } from './cardgames.js?v=20261103-0433';

const { fieldCards } = items;
const SE_ERR = 'Z3 エラー';

// ---------- the card shop's goods: this part of the story's lists (variable 44), first of items.shopHooks ----------
items.shopHooks.push((world, s) => shopGoods(world, s));

// ---------- 198 / 199 / 200: the next card square ----------
const FORCE = { 198: 866, 199: 867, 200: 868 };
// set_cardmas_name: 商店 / 连线 / 抽签 / 随机 (the translation's words, kept: 867 is the concentration game, 868 the lottery)
const modeName = (s) => (!s || !s.sw ? '隨機' : s.sw[866] ? '商店' : s.sw[867] ? '連線' : s.sw[868] ? '抽籤' : '隨機');
for (const [id, sw] of Object.entries(FORCE)) {
  fieldCards[id] = async ({ game }) => {
    const s = game.state;
    s.sw = s.sw || {};
    if (s.sw[sw]) { audio.se(SE_ERR, 70); toast('現在使用也沒有效果'); return false; }
    for (const n of Object.values(FORCE)) s.sw[n] = n === sw;
    audio.se('ZD カードセット', 80);
    return true;
  };
}
// the note's \N[2], filled in whenever the card screen shows it (src/items.js reads it.desc)
function noteWithMode(world) {
  for (const id of Object.keys(FORCE)) {
    const it = world.items[id];
    if (!it || Object.getOwnPropertyDescriptor(it, 'desc').get) continue;
    const text = it.desc;
    Object.defineProperty(it, 'desc', { get: () => text.replace('\\N[2]', modeName(window.__game && window.__game.state)), enumerable: true, configurable: true });
  }
}
const waitWorld = setInterval(() => { const g = window.__game; if (g && g.world) { clearInterval(waitWorld); noteWithMode(g.world); } }, 200);

// ---------- 202 界王星: +150 ZP ----------
fieldCards[202] = async ({ game }) => {
  const m = await pickMember(game, '界王星', () => true, true);
  if (!m) return false;
  audio.se('Z1 パワーアップ', 80);
  growth.ensure(m).zp += 150;
  return true;
};

// ---------- the skills of 村人A/B/C and 基朗 ----------
// get_recovery_hpki_skill_par: [skill, HP %, KI %], every one the member has adds up
const RECOVERY = [
  ...[10, 11, 12, 13, 14, 15, 16, 17, 20].map((p, k) => [431 + k, p, 0]), // 効果UP(HP)
  ...[10, 11, 12, 13, 14, 15, 16, 17, 20].map((p, k) => [440 + k, 0, p]), // 効果UP(KI)
  ...[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 10].map((p, k) => [449 + k, p, p]), // 効果UP(H・K)
];
let W = null;
export function healBonus(world, m) {
  let hp = 0, ki = 0;
  for (const [id, h, k] of RECOVERY) if (growth.has(world, m, id)) { hp += h; ki += k; }
  return [hp, ki];
}
// きまぐれ: l1 the card's attack and guard stars at random, l2 its school, l3 both (create_card_i for the school)
export function kimagure(world, m, c) {
  if (growth.has(world, m, 390)) { c.a = rand(8); c.g = rand(8); }
  else if (growth.has(world, m, 391)) c.s = newCard().s;
  else if (growth.has(world, m, 402)) { c.a = rand(8); c.g = rand(8); c.s = newCard().s; }
}
if (Array.isArray(items.healBonus)) items.healBonus.push((m) => (W ? healBonus(W, m) : [0, 0]));
if (Array.isArray(growth.cardHooks)) growth.cardHooks.push(kimagure);
const waitW = setInterval(() => { const g = window.__game; if (g && g.world) { clearInterval(waitW); W = g.world; } }, 200);

// ---------- ?dev=csq… ----------
const DEV = {
  csq: {},
  csqz2: { v40: 1 },
  csqz3: { v40: 2 },
  csqz4: { v40: 2, sw: [431] },
  csqzg: { v40: 2, sw: [431], v43: 186 },
};
registerZ3('csq', {
  dev(game, step) {
    const d = DEV[step];
    if (!d) return false;
    const s = game.state = game.newState();
    items.cardState(s);
    s.var[40] = d.v40 || 0;
    if (d.v43) s.var[43] = d.v43;
    for (const n of d.sw || []) s.sw[n] = true;
    s.zeni = 99999;
    for (const id of [198, 199, 200, 202, 90, 103, 157, 119, 9, 12]) items.gainCard(game.world, s, id);
    s.map = '1'; s.x = 7 * 32 + 16; s.y = 4 * 32 + 16;
    game.startField();
    return true;
  },
});

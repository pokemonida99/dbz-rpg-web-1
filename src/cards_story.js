// 劇情與特殊卡片：38 波倫加、48 未來特效藥、57 藥草、58 瀉藥、59 炸藥、62 任意卡、63 交換、68 顛倒、78 筋斗雲、125～133 重要物品與撒旦的簽名、140 芭蕉扇、145 20號、155 弗利薩(S)、168 時間君、171 恐龍 — docs/cards-plan.md; the data is built by tools/build_cards_story.py.
// Card effects register in src/items.js fieldCards[id] = async ({ game, battle }) => used | 'close' | false.
// After the original's Scene_Db_Card other_card_run (all.rb 146483), Scene_Db_Status run_card (45546),
// output_card_change_effect (146203) and Scene_Db_Member_change (142220). docs/cards-story.md.
//   38 波倫加 (battle)    EXP / CAP / SP up for one more won battle (variables 311-313), every hand card Z/Z 「氣」,
//                         everyone power + guard up, everyone full HP / KI and back on their feet
//   48 未來特效藥          on 悟空 (actor 3 / 14): switch 428, no heart attack in Z3 (src/z3e.js)
//   62 任意卡 (battle)    one hand card's school becomes 「氣」 (16)
//   78 筋斗雲             隊伍變更 on the field or in battle (not in the 時之間, switch 78); never used up
//   140 芭蕉扇            on 琪琪 (actor 10): switch 557 (the Z4 epilogue, src/z4e.js)
//   171 恐龍              +2 食物 (74), +2 宴席 (75)
//   63 / 68 / 145 / 155   skill cards (src/growth.js useSkillCard, world.growth.cards); the skills' battle effects below
//   57 58 59, 125-133, 168: the original never lets them be used (kind 'none')
import { audio, toast } from './core.js?v=20261108-1145';
import * as items from './items.js?v=20261108-1145';
import * as growth from './growth.js?v=20261108-1145';
import { KI_CARD } from './battle.js?v=20261108-1145';
import { pickMember, memberChange } from './partymenu.js?v=20261108-1145';
import { registerZ3, member, party } from './z3.js?v=20261108-1145';
import { candidates } from './timeroom.js?v=20261108-1145';

const { fieldCards, overlay, h, button, iconCanvas, handCanvas, gainCard, trim, cardState } = items;
const SE_OK = 'Z3 決定', SE_ERR = 'Z3 エラー';

// ---------- a small window over the card screen (the card screen hides while a hook card runs) ----------
// body(p, end, acts) fills the pick area (and may replace the buttons); end(v) closes it and resolves v. 返回 resolves false.
function panel(game, id, text, body) {
  const it = game.world.items[id];
  const el = overlay();
  return new Promise((res) => {
    const end = (v) => { el.remove(); res(v); };
    const head = h('div', 'cw head', it.name);
    const box = h('div', 'cw');
    const d = h('div', 'detail');
    d.append(iconCanvas(it, 64), h('div', 'tx', text));
    const p = h('div', 'pick');
    box.append(d, p);
    const acts = h('div', 'acts');
    acts.append(button('返回', () => { audio.se(SE_OK, 70); end(false); }));
    el.append(head, h('div', 'list'), box, acts);
    body(p, end, acts);
  });
}
function confirm(game, id) {
  return panel(game, id, '要使用這張卡片嗎？', (p, end, acts) => {
    acts.replaceChildren(button('是', () => end(true)), button('否', () => { audio.se(SE_OK, 70); end(false); }));
  });
}

// ---------- 38 波倫加 (other_card_run 146999, output_card_change_effect 38) ----------
fieldCards[38] = async ({ game, battle }) => {
  if (!battle || !(await confirm(game, 38))) return false;
  const s = game.state;
  audio.se('Z3 レベルアップ', 80);
  for (const v of [311, 312, 313]) s.var[v] = (s.var[v] || 0) + 1; // EXP / CAP / SP up
  for (const c of s.hand) { c.a = 7; c.g = 7; c.s = KI_CARD; } // every card Z / Z, 「氣」
  for (const m of s.party) {
    const f = items.memberFx(m); // $cha_power_up / $cha_defense_up
    f.pow = true; f.def = true;
    m.hp = m.maxhp; m.ki = m.maxki; growth.revive(m); // full, $chadead false
  }
  toast('使用了「波倫加」');
  return true;
};

// ---------- 48 未來特效藥 / 140 芭蕉扇: one member (run_card 46026 / 46143) ----------
fieldCards[48] = async ({ game }) => {
  const m = await pickMember(game, '未來特效藥', (x) => x.id === 3 || x.id === 14, false);
  if (!m) return false;
  audio.se('Z3 レベルアップ', 80);
  game.state.sw[428] = true; // 悟空が心臓病発症しない
  toast('使用了「未來特效藥」');
  return true;
};
fieldCards[140] = async ({ game }) => {
  const s = game.state;
  const m = await pickMember(game, '芭蕉扇', (x) => x.id === 10 && !s.sw[557], false);
  if (!m) return false;
  audio.se('DB3 刀', 80);
  s.sw[557] = true;
  toast('使用了「芭蕉扇」');
  return true;
};

// ---------- 62 任意卡: one hand card → 「氣」 (chk_change_card_run / output_card_change_effect 62) ----------
fieldCards[62] = async ({ game, battle }) => {
  if (!battle) return false;
  const hand = game.state.hand;
  if (!hand.some((c) => c.s !== KI_CARD)) { audio.se(SE_ERR, 70); toast('現在使用也沒有效果'); return false; }
  return panel(game, 62, '選擇要變成「氣」的卡。', (p, end) => {
    hand.forEach((cd) => {
      const b = h('button', `hand${cd.s === KI_CARD ? ' off' : ''}`);
      b.append(handCanvas(cd));
      b.onclick = () => {
        if (cd.s === KI_CARD) { audio.se(SE_ERR, 70); return; }
        if (p.busy) return;
        p.busy = true;
        audio.se('Z2 カードアップ', 80);
        items.cardBlink(game.state, 62, [b]).then(() => { // (the blink, then the change: output_card_change_effect 62)
          cd.s = KI_CARD;
          b.replaceChildren(handCanvas(cd));
          toast('使用了「任意卡」');
          setTimeout(() => end(true), 400);
        });
      };
      p.append(b);
    });
  });
};

// ---------- 171 恐龍 (other_card_run 147153) ----------
fieldCards[171] = async ({ game }) => {
  const s = game.state, C = s.cardMax.C;
  if ((s.cards[74] || 0) >= C && (s.cards[75] || 0) >= C) { audio.se(SE_ERR, 70); toast('現在使用也沒有效果'); return false; }
  if (!(await confirm(game, 171))) return false;
  gainCard(game.world, s, 74, 2); // たべもの
  gainCard(game.world, s, 75, 2); // ごちそう
  trim(game.world, s); // set_max_item_card: copies over the limit are sold
  audio.se('Z3 アイテム取得', 80);
  toast('使用了「恐龍」');
  return true;
};

// ---------- 78 筋斗雲: 隊伍變更 (other_card_run 146579, Scene_Db_Member_change call_state 1 / 3) ----------
// get_sinario_full_party (all.rb 13667): who may come along in this part of the story (variable 43); outside it
// every member is struck from the list (update_party_del_list), so only those in the party can be taken out.
const FULL = [
  [[90, 91], [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20, 15]], // メタルクウラ編
  [[92, 93, 95, 96], [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20, 23]], // 13号編、セルゲーム編
  [[97], [4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20]], // セルゲーム編 (悟空と16号除外)
  [[121], [3, 14, 4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20]], // ブロリー編
  [[126, 127, 128], [4, 5, 18, 6, 7, 8, 9, 10, 24, 12, 19, 17, 20]], // ボージャック編
  [[[171, 200], 801], [3, 14, 4, 5, 18, 12, 19, 17, 20, 25, 26, 6, 7, 8, 9, 16, 32, 27, 28, 29, 30, 10, 24, 15, 21, 22, 23]], // 外伝全員集合後
];
function fullParty(v43) {
  for (const [keys, ids] of FULL) if (keys.some((k) => (Array.isArray(k) ? v43 >= k[0] && v43 <= k[1] : v43 === k))) return ids;
  return [];
}
export function cloudOffer(game) {
  const s = game.state, v43 = s.var[43] || 0;
  const full = v43 === 999 ? null : fullParty(v43);
  return candidates(s).filter((id) => game.world.actors[id] && (!full || full.includes(id))).map((id) => member(game, id));
}
fieldCards[78] = async ({ game, battle }) => {
  const s = game.state;
  if (s.sw[78]) { audio.se(SE_ERR, 70); toast('在這裡不能使用'); return false; } // 時の間にいたら使えない
  audio.se(SE_OK, 70);
  const ids = await memberChange(game, cloudOffer(game));
  if (!ids) return false;
  party(game, ids);
  s.var[42] = s.party[0].id;
  if (s.party.length === 1 && s.party[0].hp <= 0) { s.party[0].hp = 1; growth.revive(s.party[0]); } // one member, KO'd: HP 1
  if (battle) battle.party = s.party; // (setParty makes a new list; keepPlans re-pairs the picks)
  return 'close';
};

// ---------- skills from the skill cards (src/growth.js extra / cardHooks) ----------
const fx = (world, id) => world.growth.skills[id].fx;
const inSlot = (m, id) => { growth.ensure(m); return m.typ.includes(id) || m.add.includes(id); }; // temp_cha_skill.index
const MIKUDASU = [401, 400, 399, 398, 397, 396, 395, 394, 393]; // 見下す 9 … 1
const sum = (c) => c.a + c.g;
let cardWorld = null; // cardMid gets no world: cardHooks run earlier in the same cardFor call and keep it
growth.cardHooks.push((world) => { cardWorld = world; });
growth.extra.push({
  // 422 さかさま (get_battle_skill, all.rb 6863): the card played has its stars turned over (after ミラクル全開パワー)
  cardMid: (c, m) => {
    if (cardWorld && growth.has(cardWorld, m, 422)) { c.a = 7 - c.a; c.g = 7 - c.g; }
    return c;
  },
  // 見下す (set_damage_add, all.rb 14480 / 15850): own card's stars above the enemy's → more damage dealt, less taken
  dealt: (d, b, m, skill, x) => {
    const id = x && x.card && x.foeCard && sum(x.card) > sum(x.foeCard) && MIKUDASU.find((k) => inSlot(m, k));
    if (id) growth.ran(id); // (all.rb 14483)
    return id ? d * Number(fx(b.world, id).a) : d;
  },
  taken: (d, b, m, x) => {
    const id = x && x.card && x.foeCard && sum(x.card) > sum(x.foeCard) && MIKUDASU.find((k) => growth.has(b.world, m, k));
    if (id) growth.ran(id, 'skill', 1); // (15853)
    return id ? d * Number(fx(b.world, id).g) : d;
  },
  // get_attack_hit_skill (all.rb 17309 / 17330): 取替え swaps the whole card with the enemy's unless the member moved
  // first (少年); 吸収(攻撃) takes one attack star
  hit: (v, b, m, foe, card) => {
    if (!card || !foe.card) return v;
    const f = items.memberFx(m);
    if (growth.has(b.world, m, 421) && !(f && f.sente)) {
      for (const k of ['a', 'g', 's']) [card[k], foe.card[k]] = [foe.card[k], card[k]];
      growth.ran(421, 'hit'); // (17324)
    }
    if (growth.has(b.world, m, 260)) {
      foe.card.a = Math.max(0, foe.card.a - 1);
      card.a = Math.min(7, card.a + 1);
      growth.ran(260, 'hit'); // (17337)
    }
    return v;
  },
});

// ---------- ?dev=cst: a Z4 (メタルクウラ編, variable 43 = 90) save with every card of this file ----------
registerZ3('cst', {
  dev(game, step) {
    if (step !== 'cst') return false;
    const s = game.state = game.newState();
    s.var[40] = 2; s.var[43] = 90;
    for (const n of [68, 69, 502, 107, 522, 426]) s.sw[n] = true; // 琪琪, 龜仙人, 若者, 貝吉塔, 特蘭克斯 on offer
    s.flags.z3 = 'done';
    party(game, [3, 5, 4, 12, 17, 6, 10]);
    cardState(s);
    for (const id of [38, 48, 57, 58, 59, 62, 63, 68, 78, 125, 126, 127, 128, 129, 131, 132, 133, 140, 145, 155, 168, 171]) gainCard(game.world, s, id, 1);
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    return true;
  },
});

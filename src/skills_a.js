// 固有技能 effects (see docs/batch1-plan.md 之後補上): registered as growth.extra entries — written by a helper, filled in below
//   王子の誇り 9 / 428 / 429   fighting alone: damage dealt ×fx.a, taken ×fx.g; EXP ×fx.b while not the top level
//   サイヤ人の結束 80-88       like Z戦士の絆: per other fighting member holding it, dealt +(fx.a − 1), taken −(1 − fx.g)
//   応援 77-79, 197-202        the first fighting member (card order) holding it: everyone's dealt ×fx.a, taken ×fx.g
import * as growth from './growth.js?v=20261102-1935';

const G = () => window.__game; // (main.js) the running game: the party for 王子の誇り's EXP (the exp hook gets no world)
const n = (v) => Number(v) || 0;
const fx = (w, id) => (w.growth.skills[id] || { fx: {} }).fx;
// temp_nakama_skill.index / temp_cha_skill.index on the raw slots: 固有 or 追加, SP not looked at
const inSlot = (m, id) => { growth.ensure(m); return m.typ.includes(id) || m.add.includes(id); };
// $cha_skill_spval[cha][id] >= $cha_skill_get_val[id]
const spFull = (w, m, id) => (growth.ensure(m).sp[id] || 0) >= n((w.growth.skills[id] || {}).sp);
const best = (w, m, fam) => fam.find((id) => growth.has(w, m, id)) || 0;

const PRIDE = [429, 428, 9]; // 王子の誇り 3 … 1 (dealt checks the highest first)
const KETSU = [88, 87, 86, 85, 84, 83, 82, 81, 80]; // サイヤ人の結束 9 … 1
const KETSU_MATE = [80, 81, 82, 83, 84, 85, 86, 87, 88, 670]; // what a mate may hold (最終決戦改 670 counts too)
const OUEN = [202, 201, 200, 199, 198, 197, 79, 78, 77]; // 応援 9 … 1

// battle_join_count (all.rb 792): the cards set this turn ($cardset_cha_no != 99), a member KO'd during the turn included
const joinCount = (b) => (b.plans || []).filter(Boolean).length;
// the set cards, in card order, of members still up ($cardset_cha_no[y], $chadeadchk == false)
const setters = (b) => b.party.map((x, i) => [x, b.plans && b.plans[i]]).filter(([x, p]) => p && !x.ko)
  .sort((p, q) => p[1].card - q[1].card).map(([x]) => x);

// サイヤ人の結束 (all.rb 14974 / 16324): the other fighting members still up who hold one of KETSU_MATE in a slot and
// have the SP of any of them complete (the original tests 80, 81 … 88, 670 in turn, whatever level the slot holds)
const ketsuMates = (b, m) => setters(b).filter((x) => x !== m && KETSU_MATE.some((id) => inSlot(x, id))
  && KETSU_MATE.some((id) => spFull(b.world, x, id))).length;

// 応援 (all.rb 15242 / 16638): the first member (card order, the attacker / defender too) holding any level in a slot
// whose SP of a level is complete, 202 first, gives that level's rate; one without any complete level is skipped
function ouen(b, k) {
  for (const x of setters(b)) {
    if (!OUEN.some((id) => inSlot(x, id))) continue;
    const id = OUEN.find((id) => spFull(b.world, x, id));
    if (id) return n(fx(b.world, id)[k]);
  }
  return 1;
}

growth.extra.push({
  // set_damage_add(add = 0)
  dealt: (d, b, m) => {
    const w = b.world;
    // 王子の誇り (all.rb 14711): only one card set this turn → ×1.15 / 1.3 / 1.5
    const pr = joinCount(b) === 1 && best(w, m, PRIDE);
    if (pr) d *= n(fx(w, pr).a);
    // サイヤ人の結束 (all.rb 14974): its own highest level, 1 + (0.01 … 0.09) × mates
    const ks = best(w, m, KETSU);
    const k = ks ? ketsuMates(b, m) : 0;
    if (k) d *= 1 + (n(fx(w, ks).a) - 1) * k;
    // 応援 (all.rb 15242): ×1.03 … 1.13
    return d * ouen(b, 'a');
  },
  // set_damage_add(add = 1)
  taken: (d, b, m) => {
    const w = b.world;
    // 王子の誇り (all.rb 16082, chk_skill_learn): alone → ×0.9 / 0.8 / 0.65, the original tests 9 first, then 428, 429
    const pr = joinCount(b) === 1 && [9, 428, 429].find((id) => growth.has(w, m, id));
    if (pr) d *= n(fx(w, pr).g);
    // サイヤ人の結束 (all.rb 16324): 1 − (0.01, 0.015 … 0.045, 0.06) × mates
    const ks = best(w, m, KETSU);
    const k = ks ? ketsuMates(b, m) : 0;
    if (k) d *= 1 - (1 - n(fx(w, ks).g)) * k;
    // 応援 (all.rb 16638): ×0.95 … 0.85
    return d * ouen(b, 'g');
  },
  // get_exp_add (all.rb 18410): 王子の誇り — the first of 9, 428, 429 in a slot, its SP complete, and someone in the
  // party ($partyc) above this member's level → ×1.3. The original also needs the actor id ≠ party size − 1
  // (`temp_cha_no != $partyc.size-1`, a slip kept as it is)
  exp: (v, m) => {
    const g = G(), w = g && g.world, party = (g && g.state && g.state.party) || [];
    if (!w) return v;
    const id = [9, 428, 429].find((x) => inSlot(m, x));
    if (!id || !spFull(w, m, id) || m.id === party.length - 1) return v;
    return party.some((x) => x.level > m.level) ? v * n(fx(w, id).b) : v;
  },
});

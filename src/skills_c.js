// 固有技能 effects C (docs/batch1-plan.md 之後補上): 挑発, 絶望への反抗, Pエネルギー炉 — registered as growth.extra entries.
// After the original (all.rb):
//   挑発 31-33, 125-130      get_attack_hit_skill 17111 / 17160-17242: when the member's attack hits, the enemy card's
//                           attack / guard stars go down by fx.ah / fx.gh (applied with the other hit skills at 17566)
//   絶望への反抗 354-362     chk_zetubo_ran 8169: HP ≥ hi % or ≤ lo % → the card played becomes the member's own school,
//                           whatever its school (get_battle_skill 7374, at the card pick 48894; auto 49610; blink 49737)
//   Pエネルギー炉 423-425    turn_recover_hpki 18640 / 18941: HP +fx.hp %, KI +fx.ki % a turn, in the same elsif chain as
//                           再生 10 / 11 / 12, 魔族の力 35, ネイルと同化 248, 神と融合 249 (only the first one learned counts)
import * as growth from './growth.js?v=20261104-0727';

const { has, ensure } = growth;
const num = (v) => Number(v) || 0;
const clamp7 = (v) => Math.max(0, Math.min(7, v));
const fx = (w, id) => (w.growth.skills[id] || { fx: {} }).fx;
const inSlot = (m, id) => { ensure(m); return m.typ.includes(id) || m.add.includes(id); }; // temp_cha_skill.index

// ---------- 挑発 ----------
const CHOUHATSU = [130, 129, 128, 127, 126, 125, 33, 32, 31]; // 挑発 9 … 1 (fx ah / gh = -5/-5 … -1/0)
// the first level in a slot decides (temp_cha_skill.index), and only once its SP is complete
const chouhatsu = (w, m) => { const id = CHOUHATSU.find((x) => inSlot(m, x)); return id && has(w, m, id) ? id : 0; };

// ---------- 絶望への反抗 ----------
// [skill, HP ≥ hi %, HP ≤ lo %] (ceil(maxhp × % / 100)); checked highest first, each `learned && HP` (8172-8217)
const ZETSUBOU = [[362, 70, 35], [361, 75, 30], [360, 78, 27], [359, 80, 25], [358, 82, 23], [357, 84, 21], [356, 86, 19],
  [355, 88, 17], [354, 90, 15]];
export function zetsubou(w, m) {
  if (!w || !m || !m.maxhp) return false;
  return ZETSUBOU.some(([id, hi, lo]) => has(w, m, id)
    && (m.hp >= Math.ceil((m.maxhp * hi) / 100) || m.hp <= Math.ceil((m.maxhp * lo) / 100)));
}
let cardWorld = null; // the 'card' key gets no world: cardHooks run first in the same cardFor call and keep it
growth.cardHooks.push((world) => { cardWorld = world; });
let pickTime = false; // battle.js asks 'school' at the card pick (see the patch in the report): then 'card' leaves it alone

// ---------- Pエネルギー炉 ----------
const P_RO = [423, 424, 425];
const HP_CHAIN = [10, 12, 35, 248, 249, 423, 424, 425]; // 18620-18651 (10 / 12 / 35 / 248 / 249: growth.recover)
const KI_CHAIN = [11, 12, 248, 249, 423, 424, 425]; // 18921-18942 (11 / 12 / 248 / 249: growth.recover)
const pct = (max, p) => Math.ceil((max * p) / 100);

// recover runs before the other entries' (練氣 in src/cards_b.js): 気を練る comes after these in turn_recover_hpki (19096)
growth.extra.unshift({
  recover: (v, b) => {
    const w = b.world;
    for (const m of b.party) {
      ensure(m);
      const fresh = m.ko && m.koTurn === b.turn; // $chadeadchk[x] != $chadead[x]: fell this turn, no HP
      const h = HP_CHAIN.find((id) => has(w, m, id));
      if (P_RO.includes(h) && !fresh) {
        m.hp = Math.min(m.maxhp, m.hp + pct(m.maxhp, num(fx(w, h).hp)));
        if (m.ko && m.hp >= m.maxhp) { // back on its feet (18820): the original's KI part (18898) then runs for it too
          growth.revive(m);
          m.ki = Math.min(m.maxki, m.ki + pct(m.maxki, 2.5)); // $turn_recover_ki, which growth.recover skipped
        }
      }
      if (m.ko) continue; // KI only for the members up (18896)
      const k = KI_CHAIN.find((id) => has(w, m, id));
      if (P_RO.includes(k)) m.ki = Math.min(m.maxki, m.ki + pct(m.maxki, num(fx(w, k).ki)));
    }
    return v;
  },
});

growth.extra.push({
  // 挑発 (17160-17242, 17566): after 取替え / 吸収 (src/cards_story.js), like the original's deferred star change
  hit: (v, b, m, foe) => {
    const id = foe && foe.card && chouhatsu(b.world, m);
    if (!id) return v;
    const f = fx(b.world, id);
    foe.card.a = clamp7(foe.card.a - num(f.ah));
    foe.card.g = clamp7(foe.card.g - num(f.gh));
    return v;
  },
  // 絶望への反抗 at the card pick: a 「必」 card (battle.js asks 'pick' for those only) …
  pick: (v, b, m) => v || zetsubou(b.world, m),
  // … and any card, once battle.js asks 'school' for every card it picks (48894 / 49610)
  school: (v, b, m) => { pickTime = true; return v || zetsubou(b.world, m); },
  // get_battle_skill (7374, last of it): until then, the card played becomes the member's school when the turn resolves
  card: (c, m) => (!pickTime && zetsubou(cardWorld, m) && c.s !== m.school ? { ...c, s: m.school } : c),
});

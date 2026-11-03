// 固有技能 effects (see docs/batch1-plan.md 之後補上): registered as growth.extra entries — written by a helper, filled in below
//   慈愛の心 57 / 426 / 427   more damage dealt / less taken the lower the other fighters' HP (alone: the full rate);
//                             immune to the enemy's 動きを止める moves (the `bind` key: no call point yet)
//   負けん気 70-72, 185-190   a chance (rate) to take × 0.6
//   未来への希望 336-344      card stars, and damage dealt / taken, growing with the battle's turn count
import * as growth from './growth.js?v=20261104-0727';
import { rand } from './core.js?v=20261104-0727';

const FAM = {
  jiai: [57, 426, 427],
  maken: [70, 71, 72, 185, 186, 187, 188, 189, 190], // 負けん気 1 … 9
  mirai: [336, 337, 338, 339, 340, 341, 342, 343, 344], // 未来への希望 1 … 9
};
const G = () => window.__game; // (main.js) the running game: its scene is the Battle while one is on
const sk = (w, id) => w.growth.skills[id];
const n = (v) => Number(v) || 0;
const first = (w, m, fam) => fam.find((id) => growth.has(w, m, id)); // the first learned one, in the order given
const hpRate = (x) => Math.trunc((x.hp / x.maxhp) * 100); // (hp.prec_f / maxhp.prec_f * 100).prec_i
const joined = (b) => b.party.filter((x, i) => b.plans && b.plans[i]); // $cardset_cha_no without the 99s

// 慈愛の心: the lowest HP % of the members who played a card this turn, other than m and not KO'd (or anyone when only
// one played: get_battle_sankaninzu == 1) → [nakamahp, flag], flag false when nobody counted (15173-15189 / 16495-16509)
function jiaiHp(b, m) {
  const js = joined(b), alone = js.length === 1;
  let hp = 100, flag = false;
  for (const x of js) {
    if ((x !== m && !x.ko) || alone) { hp = Math.min(hp, hpRate(x)); flag = true; }
  }
  return [hp, flag, js.length];
}

// 未来への希望: the multiplier at turn t for the level k (1 … 9): base, then ±0.01 a turn from turn 2 up to turn k
function miraiRate(k, t, base, step) {
  let r = base;
  for (let x = 2; x <= Math.min(k, t); x++) r += step;
  return r;
}

growth.extra.push({
  // 未来への希望 (get_battle_skill, all.rb 7049-7150): from turn 1, stars on the card played (lowest level first; the slot
  // holds the skill and its SP is complete). cha_attack_num / cha_guard_num join ムダのない動き's and are clamped 0…7
  // after (7277); all of them only add, so adding here before ムダのない動き (src/growth.js cardFor) comes to the same.
  cardMid: (c, m) => {
    const b = G() && G().scene;
    if (!b || !b.party || !b.party.includes(m) || !(b.turn >= 1)) return c;
    const w = b.world, t = b.turn;
    growth.ensure(m);
    const id = FAM.mirai.find((x) => m.typ.includes(x) || m.add.includes(x)); // temp_cha_skill.index, typical + add slots
    if (!id || (m.sp[id] || 0) < sk(w, id).sp) return c; // $cha_skill_spval >= $cha_skill_get_val
    const k = FAM.mirai.indexOf(id) + 1;
    let a = 1, g = 1; // every level: +1 / +1
    if (k >= 3 && t >= 3) a++;
    if (k >= 5 && t >= 5) g++;
    if (k >= 7 && t >= 7) a++;
    if (k >= 8 && t >= 9) g++;
    if (k >= 9 && t >= 11) a++;
    if (k >= 9 && t >= 13) g++;
    c.a = Math.max(0, Math.min(7, c.a + a));
    c.g = Math.max(0, Math.min(7, c.g + g));
    return c;
  },

  dealt: (d, b, m) => {
    const w = b.world;
    let x = d;
    // 慈愛の心 (set_damage_add add 0, all.rb 15171-15222): l3 checked first; × (1 + r × (100 − nakamahp) / 100), alone
    // × (1 + r), r = 0.6 / 0.4 / 0.2, truncated there (prec_i)
    const ja = first(w, m, [427, 426, 57]);
    if (ja) {
      const [hp, flag, num] = jiaiHp(b, m);
      if (flag || num === 1) {
        const r = { 427: 0.6, 426: 0.4, 57: 0.2 }[ja], np = 100 - hp;
        x = num !== 1 ? Math.trunc(x * (1 + (r * np) / 100)) : Math.trunc(x * (1 + r));
      }
    }
    // 未来への希望 (15503-15594): only with Trunks (17 / 20) in the party, from turn 1, l9 checked first:
    // l1-7 1.03, l8 1.05, l9 1.06, + 0.01 a turn from turn 2 up to turn = level
    const mi = b.party.some((p) => p.id === 17 || p.id === 20) && b.turn >= 1 && [...FAM.mirai].reverse().find((id) => growth.has(w, m, id));
    if (mi) {
      const k = FAM.mirai.indexOf(mi) + 1;
      x *= miraiRate(k, b.turn, k === 9 ? 1.06 : k === 8 ? 1.05 : 1.03, 0.01);
    }
    return x;
  },

  taken: (d, b, m) => {
    const w = b.world;
    let x = d;
    // 慈愛の心 (add 1, all.rb 16493-16545): l1 checked first here; × (1 − r × (100 − nakamahp) / 100), alone × (1 − r),
    // r = 0.2 / 0.3 / 0.4, truncated there
    const ja = first(w, m, FAM.jiai);
    if (ja) {
      const [hp, flag, num] = jiaiHp(b, m);
      if (flag) {
        const r = { 57: 0.2, 426: 0.3, 427: 0.4 }[ja];
        x = num !== 1 ? Math.trunc(x * (1 - (r * (100 - hp)) / 100)) : Math.trunc(x * (1 - r));
      }
    }
    // 負けん気 (16567-16627): l1 checked first; rand(100) + 1 < rate (25 … 50) → × 0.6
    const mk = first(w, m, FAM.maken);
    if (mk && rand(100) + 1 < n(sk(w, mk).fx.rate)) x *= 0.6;
    // 未来への希望 (16758-16863): from turn 1, l1 checked first: 0.97, − 0.01 a turn from turn 2 up to turn = level
    const mi = b.turn >= 1 && first(w, m, FAM.mirai);
    if (mi) x *= miraiRate(FAM.mirai.indexOf(mi) + 1, b.turn, 0.97, -0.01);
    return x;
  },

  // 慈愛の心 (chk_ziairun, all.rb 8266; 68933 / 68945): an enemy move that stops the member hit (element 12 / 14, or 13
  // with the enemy's school card) does not stop one who has learned it. ext('bind', true, b, m, foe, skill) → false
  // when the stop is blocked (no call point yet: the remake has no enemy stop on party members)
  bind: (v, b, m) => (v && first(b.world, m, [427, 426, 57]) ? false : v),
});

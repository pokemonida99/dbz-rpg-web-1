// 大工程第一批 skc: the passive skills the skill cards teach (the 時之間 bosses' cards and the shop's added ones,
// docs/skc.md), registered as growth.extra entries like src/skills_a/b/c.js. After the original (all.rb):
//   card stars (get_battle_skill 6909-7290): 起死回生 367/368, 攻守一体 381-384 (cardHooks, before ミラクル全開パワー);
//     アタッカー 503-506, ディフェンダー 507-510, アウトサイダー 430/644-651, 吸収(撃破) 511-528 ('card', before 捨て身)
//   the card's school: アウトサイダー and 気を溜める 203-211 turn a 「必」 card into the own school ('pick'), 気の暴走
//     458-466 any card while KI is high ('school', chk_kinobousou_ran 8113)
//   who moves first: 先手必勝 64-66/173-178 (get_skill_sente 7911, items.firstMovers 'sente')
//   KI cost (get_mp_cost 7542): スタートダッシュ ×1.2, 気の暴走 ×1.75, 様子見 625-633 (set when the damage is worked
//     out, so here a refund right after it), 剛腕 697-705 (no special moves at all: 'normalOnly')
//   damage (set_damage_add 14356): 剛腕, 限界を超えたパワー 250-258, スタートダッシュ 378-380, 傍若無人 476-484, 刺し違える覚悟
//     634-642 / taken: タフネス 518-526, 鋼鉄の身体 51-53/155-160, スタートダッシュ, 限界を超えたパワー, 傍若無人, 刺し違える覚悟
//   evasion (get_avoid_add 17990, 68785): 緊急回避 392, 刺し違える覚悟 (never evades)
//   on a hit (get_attack_hit_skill 17111): 吸収(防御) 261, 吸収(攻防) 290, ヒットアンドアウェイ 221-227 / hit by an enemy:
//     不屈の精神 212-220
//   turn end (turn_recover_hpki 18557): 心身一如 300-308, 時間稼ぎ 369-377, 不死身の体 412-420, Uせいめいたい 529-537,
//     限界を超えたパワー's KI; 光の旅 620-624 (create_card_i 20846: a new card of the own school after n turns)
//   S-combos: 同調 363 (run_battle_start_mae_skill 68282: every participant's card takes the highest stars)
//   after the battle: カードドロップ 74-76/191-196 (get_card_drop_add 18109, the second drop only)
//   on the map: 引き寄せ 616 / 追い払い 617 (encounter 165385: always / never an encounter)
// 必中 389 and 鋼の意思 619 are already in src/battle.js (playerDamage, stopMember); 激怒 22 in src/growth.js.
import * as growth from './growth.js?v=20261107-2349';
import { rand } from './core.js?v=20261107-2349';
import { isFav } from './cards_b.js?v=20261107-2349';
import { zetsubou } from './skills_c.js?v=20261107-2349';
import { registerZ3, party, heal } from './z3.js?v=20261107-2349';
import { applyLevel } from './party.js?v=20261107-2349';

const { has, ensure, ran } = growth;
const G = () => window.__game;
const num = (v) => Number(v) || 0;
const fx = (w, id) => (w.growth.skills[id] || { fx: {} }).fx;
const clamp7 = (v) => Math.max(0, Math.min(7, v));
const first = (w, m, fam) => fam.find((id) => has(w, m, id)) || 0; // the first learned one, in the order given
const battle = () => { const g = G(), b = g && g.scene; return b && b.party && b.foes && b.plans ? b : null; };
const hpRate = (m) => Math.trunc((m.hp / m.maxhp) * 100); // (hp.prec_f / maxhp.prec_f * 100).prec_i
const HINSHI = 31; // $hinshi_hp
const idx = (b, m) => b.party.indexOf(m);
const joined = (b, m) => !!(b.plans && b.plans[idx(b, m)]); // $cardset_cha_no has the member ($cha_btl_cont_part_turn ≠ 0)

// ---------- families (highest level first unless noted: the order the original checks them in) ----------
const SENTE = [178, 177, 176, 175, 174, 173, 66, 65, 64]; // 先手必勝 9 … 1 (fx.rate 36 … 12)
const TAMERU = [211, 210, 209, 208, 207, 206, 205, 204, 203]; // 気を溜める 9 … 1 (fx.rate 33 … 15)
const KOUBOU = [384, 383, 382, 381]; // 攻守一体 4 … 1 (fx.ah = fx.gh 7 / 5 / 3 / 1)
const ATTACKER = [506, 505, 504, 503], DEFENDER = [510, 509, 508, 507]; // fx.ah / fx.gh 4 … 1
const OUTSIDER = [651, 650, 649, 648, 647, 646, 645, 644, 430]; // アウトサイダー 9 … 1 (fx.ah / gh 5/5 … 1/1)
const GEKIHA = [528, 527, 517, 516, 515, 514, 513, 512, 511]; // 吸収(撃破) 9 … 1 (fx.ah / gh 5/5 … 1/1)
const BOUSOU = [[466, 60], [465, 64], [464, 68], [463, 70], [462, 72], [461, 74], [460, 76], [459, 78], [458, 80]]; // KI ≥ %
const YOUSUMI = [633, 632, 631, 630, 629, 628, 627, 626, 625]; // 様子見 9 … 1 (fx.kis 0.5 … 0.9)
const GOUWAN = [705, 704, 703, 702, 701, 700, 699, 698, 697]; // 剛腕 9 … 1 (fx.a 2 … 1.3)
const GENKAI = [258, 257, 256, 255, 254, 253, 252, 251, 250]; // 限界を超えたパワー 9 … 1 (fx.a 1.3 … 1.12, fx.g 0.7 … 0.9)
const START = [[380, 3], [379, 2], [378, 1]]; // スタートダッシュ 3 … 1: the first n turns
const BOUJAKU = [484, 483, 482, 481, 480, 479, 478, 477, 476]; // 傍若無人 9 … 1 (fx.a 1.5 … 1.1, fx.g 0.75 … 0.95)
const SASHI = [642, 641, 640, 639, 638, 637, 636, 635, 634]; // 刺し違える覚悟 9 … 1 (fx.a 1.35 … 1.1; taken × 1.3)
const TOUGH = [526, 525, 524, 523, 522, 521, 520, 519, 518]; // タフネス 9 … 1 (fx.g 0.3 … 0.7)
const KOUTETSU = [51, 52, 53, 155, 156, 157, 158, 159, 160]; // 鋼鉄の身体 1 … 9 (lowest first, fx.g 0.95 … 0.8)
const FUKUTSU = [212, 213, 214, 215, 216, 217, 218, 219, 220]; // 不屈の精神 1 … 9 (lowest first, fx.ki 1 … 8, 10 KI points)
const HIT_AWAY = [221, 222, 223, 224, 225, 226, 227]; // ヒットアンドアウェイ 1 … 7 (lowest first, fx.gh)
const SHINSHIN = [300, 301, 302, 303, 304, 305, 306, 307, 308]; // 心身一如 1 … 9 (lowest first)
// 心身一如's HP / KI % as the original adds them: `3 / 2`, `5 / 2` … are integer divisions there (l1 HP 1, l5 HP 2, l1 KI 1, l9 KI 2)
const SHINSHIN_HP = [1, 1.75, 2, 2.25, 2, 2.75, 3, 3.25, 4];
const SHINSHIN_KI = [1, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2.05, 2];
const JIKAN = [377, 376, 375, 374, 373, 372, 371, 370, 369]; // 時間稼ぎ 9 … 1 (fx.hp / fx.ki %)
const FUJIMI = [[420, 0.3], [419, 0.35], [418, 0.4], [417, 0.45], [416, 0.5], [415, 0.55], [414, 0.6], [413, 0.65], [412, 0.7]];
const USEIMEI = [[537, 10], [536, 8], [535, 7], [534, 6], [533, 5], [532, 4], [531, 3], [530, 2], [529, 1]]; // HP % back
const DROP = [[74, 0.95], [75, 0.92], [76, 0.89], [191, 0.86], [192, 0.83], [193, 0.8], [194, 0.77], [195, 0.74], [196, 0.7]];
const HIKARI = [[620, 6], [621, 5], [622, 4], [623, 3], [624, 2]]; // 光の旅 1 … 5: the turns (checked in this order)
const DOUCHOU = 363, KYU_DEF = 261, KYU_AD = 290, KINKYU = 392, HIKIYOSE = 616, OIHARAI = 617;

// ---------- per battle state ----------
const per = new WeakMap(); // battle → { rolls: Map(member → {turn, sente, tameru}), full: Set, hits: Map, acted: Map, light: Map, ki: Map }
function st(b) {
  let x = per.get(b);
  if (!x) per.set(b, (x = { rolls: new Map(), full: new Set(), hits: new Map(), acted: new Map(), light: new Map(), ki: new Map(), yous: new Map() }));
  return x;
}
// the turn-start rolls (all.rb 47437: $cha_ki_tameru_rand / $cha_sente_rand = rand(100) + 1), made when first asked for
function rolls(b, m) {
  const r = st(b).rolls;
  let x = r.get(m);
  if (!x || x.turn !== b.turn) r.set(m, (x = { turn: b.turn, sente: rand(100) + 1, tameru: rand(100) + 1 }));
  return x;
}
const roll = (b, m, fam, k) => { const id = first(b.world, m, fam); return id && rolls(b, m)[k] < num(fx(b.world, id).rate) ? id : 0; };
const tameru = (b, m) => roll(b, m, TAMERU, 'tameru'); // $cha_ki_tameru_flag
const sente = (b, m) => roll(b, m, SENTE, 'sente'); // $cha_sente_flag
const bousou = (w, m) => BOUSOU.some(([id, p]) => has(w, m, id) && m.ki >= Math.ceil((m.maxki * p) / 100));
const gouwan = (w, m) => !!first(w, m, GOUWAN);
const startN = (w, m, t) => { const e = START.find(([id]) => has(w, m, id)); return e && t <= e[1] ? e[0] : 0; };

// ---------- the card's stars ----------
// 起死回生 / 攻守一体 come right after さかさま in get_battle_skill (6915-6961), before 真の力 and ムダのない動き; run here
// with きまぐれ, before ミラクル全開パワー — the same result, since ミラクル全開パワー makes the card Z / Z anyway and さかさま's
// swap keeps both conditions as they are
growth.cardHooks.push((w, m, c) => {
  growth.ensure(m);
  if (m.typ.includes(367) || m.add.includes(367)) { // 起死回生1: temp_cha_skill.index(367), its SP complete
    if (has(w, m, 367) && c.a === 0 && c.g === 0) { c.a = 7; c.g = 7; }
  } else if (has(w, m, 368)) { // 起死回生2
    if (c.a === 0 && c.g === 0) { c.a = 7; c.g = 7; } else if (c.a === 1 && c.g === 1) { c.a = 6; c.g = 6; }
  }
  const kb = c.a === c.g && first(w, m, KOUBOU);
  if (kb) { const k = num(fx(w, kb).ah); c.a = clamp7(c.a + k); c.g = clamp7(c.g + k); }
});
// アタッカー, ディフェンダー, アウトサイダー, 吸収(撃破) (7155-7281): after ムダのない動き, before 捨て身 / 鉄壁 (src/cards_b.js)
// and 絶望への反抗 — so this entry goes first in the 'card' chain. 吸収(撃破): once an enemy of this battle is down
growth.extra.unshift({
  card: (c, m) => {
    const b = battle(), w = b ? b.world : G() && G().world;
    if (!w) return c;
    let a = 0, g = 0;
    const at = first(w, m, ATTACKER), df = first(w, m, DEFENDER), os = first(w, m, OUTSIDER);
    if (at) a += num(fx(w, at).ah);
    if (df) g += num(fx(w, df).gh);
    if (os) { a += num(fx(w, os).ah); g += num(fx(w, os).gh); }
    const gk = b && b.foes.some((f) => f.hp <= 0) && first(w, m, GEKIHA); // $enedead.include?(true)
    if (gk) { a += num(fx(w, gk).ah); g += num(fx(w, gk).gh); }
    if (!a && !g) return c;
    return { ...c, a: clamp7(c.a + a), g: clamp7(c.g + g) };
  },
});

// ---------- the card's school, who moves first, KI ----------
// marks a card with the school it had before anything turned it into the member's own (気の暴走's KI rule, 7756 looks at
// $temp_cardi). 'school' is also asked while the hand is drawn, but only for cards not converted yet, so the mark holds.
const mark = (cd) => { if (cd && !('skcS' in cd)) Object.defineProperty(cd, 'skcS', { value: cd.s, enumerable: false }); };

growth.extra.push({
  // a 「必」 card: アウトサイダー (7353, then no S-combo), 気を溜める when this turn's roll is under its rate (6909)
  pick: (v, b, m, cd) => { mark(cd); return v || !!first(b.world, m, OUTSIDER) || !!tameru(b, m); },
  // 気の暴走 (chk_kinobousou_ran 8113): KI at or above 80 … 60 % of the max — any card is of the own school
  school: (v, b, m, cd) => { mark(cd); return v || bousou(b.world, m); },
  // 剛腕 (chk_gouwanrun 8399): no move window, 自動 picks no move (48898 / 49561), and so no S-combo either (52175)
  normalOnly: (v, b, m) => v || gouwan(b.world, m),
  // 先手必勝 (get_skill_sente): this turn's roll under the rate → first, before every enemy too (46663)
  sente: (v, b, m) => v || !!sente(b, m),

  // get_mp_cost (7701-7808): スタートダッシュ ×1.2 in its first turns, 気の暴走 ×1.75 when it turned a card of another
  // school (not 「氣」, not while 絶望への反抗 holds, a 「必」 card only when nothing else would have made it the own school:
  // 気を溜める, the favourite character, スーパーベジータ 643, アウトサイダー1 430 — the original's list, level 1 only)
  ki: (v, m) => {
    const b = battle();
    if (!b || !b.party.includes(m)) return v;
    const w = b.world;
    if (b.turn >= 1 && startN(w, m, b.turn)) v *= 1.2;
    const i = idx(b, m), p = b.plans[i] || (b.phase === 'plan' && b.cur === i && b.pending);
    const cd = p && b.hand[p.card];
    const o = cd && cd.skcS;
    if (o != null && bousou(w, m) && o !== m.school && o !== 16 && !zetsubou(w, m)
      && (o !== 0 || !(tameru(b, m) || isFav(b.game.state, m) || has(w, m, 643) || has(w, m, 430)))) v *= 1.75;
    if (b.phase === 'fight') st(b).ki.set(m, { turn: b.turn, ki: m.ki }); // (様子見: what the move costs, see dealt)
    return v;
  },

  // ---------- damage dealt (set_damage_add add 0) ----------
  dealt: (d, b, m, skill, ctx = {}) => {
    const w = b.world, x = st(b);
    let r = d;
    // 様子見 (14421): the own card's stars (attack + guard) below the enemy card's → this action's KI cost × 0.9 … 0.5
    // ($skill_yousumi_runflag, read by get_mp_cost when the KI is paid right after the first target's damage, 54580).
    // Here the KI is already paid: the difference comes back. Not for an S-combo (its KI was paid before, 53396).
    const ys = ctx.card && ctx.foeCard && first(w, m, YOUSUMI);
    const key = `${b.turn}`;
    if (ys && ctx.card.a + ctx.card.g < ctx.foeCard.a + ctx.foeCard.g) {
      ran(ys);
      const paid = x.ki.get(m);
      if (paid && paid.turn === b.turn && skill && !skill.combo && x.yous.get(m) !== key) {
        const cost = paid.ki - m.ki;
        if (cost > 0) m.ki = Math.min(m.maxki, m.ki + cost - Math.trunc(cost * num(fx(w, ys).kis)));
      }
    }
    x.yous.set(m, key); // only the first target of the action (@all_attack_count == 1)
    x.ki.delete(m);
    x.acted.set(m, b.turn);
    // 剛腕 (14533): a normal attack (tec_no 1)
    const gw = !skill && first(w, m, GOUWAN);
    if (gw) { r *= num(fx(w, gw).a); ran(gw); }
    // 限界を超えたパワー (15398): while the KI left (after this move's cost) is at least a tenth of the max; it then costs
    // 8 % of the max KI at the turn's end ($fullpower_on_flag)
    const gk = first(w, m, GENKAI);
    if (gk) { ran(gk); if (Math.trunc(m.maxki / 10) <= m.ki) { r *= num(fx(w, gk).a); x.full.add(m); } }
    // スタートダッシュ (15597): × 1.5 in the first 1 / 2 / 3 turns
    const sd = startN(w, m, b.turn);
    if (sd) { r *= 1.5; ran(sd); }
    // 傍若無人 (15620), 刺し違える覚悟 (15719)
    const bj = first(w, m, BOUJAKU);
    if (bj) { r *= num(fx(w, bj).a); ran(bj); }
    const sc = first(w, m, SASHI);
    if (sc) { r *= num(fx(w, sc).a); ran(sc); }
    return r;
  },

  // ---------- damage taken (set_damage_add add 1) ----------
  taken: (d, b, m) => {
    const w = b.world, x = st(b);
    let r = d;
    // タフネス (15795): no hit taken yet this turn (l9: fewer than 2) → × 0.7 … 0.3
    const tf = first(w, m, TOUGH), hits = (x.hits.get(m) || {})[b.turn] || 0;
    if (tf && (tf === 526 ? hits < 2 : hits === 0)) { r *= num(fx(w, tf).g); ran(tf, 'skill', 1); }
    // 鋼鉄の身体 (15974)
    const kt = first(w, m, KOUTETSU);
    if (kt) { r *= num(fx(w, kt).g); ran(kt, 'skill', 1); }
    // スタートダッシュ (16733): × 0.7
    const sd = startN(w, m, b.turn);
    if (sd) { r *= 0.7; ran(sd, 'skill', 1); }
    // 限界を超えたパワー (16865, lowest level first): the KI check takes off the move's cost while the member has a move
    // set and hasn't acted yet this turn
    const gk = [...GENKAI].reverse().find((id) => has(w, m, id));
    if (gk) {
      ran(gk, 'skill', 1);
      const p = b.plans[idx(b, m)];
      let cost = 0;
      if (p && p.skill && x.acted.get(m) !== b.turn) cost = growth.kiCost(w, m, p.skill);
      if (Math.trunc(m.maxki / 10) <= m.ki - cost) { r *= num(fx(w, gk).g); x.full.add(m); }
    }
    // 傍若無人 (16954), 刺し違える覚悟 (17054: × 1.3)
    const bj = first(w, m, BOUJAKU);
    if (bj) { r *= num(fx(w, bj).g); ran(bj, 'skill', 1); }
    const sc = first(w, m, SASHI);
    if (sc) { r *= 1.3; ran(sc, 'skill', 1); }
    return r;
  },

  // ---------- evasion (get_avoid_add) ----------
  // 緊急回避: HP under 31 % → +35 (刺し違える覚悟: below, after every other entry)
  avoid: (v, b, m) => (has(b.world, m, KINKYU) && hpRate(m) < HINSHI ? v + 35 : v),

  // ---------- our attack hit (get_attack_hit_skill, applied together at 17545) ----------
  hit: (v, b, m, foe, card) => {
    const w = b.world;
    let ca = 0, cg = 0, ea = 0, eg = 0;
    const out = [];
    if (has(w, m, KYU_DEF) && rand(100) + 1 < 65) { eg--; cg++; out.push(KYU_DEF); } // 吸収(防御)
    if (has(w, m, KYU_AD) && rand(100) + 1 < 40) { ea--; eg--; ca++; cg++; out.push(KYU_AD); } // 吸収(攻防)
    const ha = first(w, m, HIT_AWAY); // ヒットアンドアウェイ
    if (ha) { cg += num(fx(w, ha).gh); out.push(ha); }
    if (!out.length) return v;
    for (const id of out) ran(id, 'hit');
    if (card) { card.a = clamp7(card.a + ca); card.g = clamp7(card.g + cg); }
    if (foe && foe.card) { foe.card.a = clamp7(foe.card.a + ea); foe.card.g = clamp7(foe.card.g + eg); }
    return v;
  },

  // ---------- an enemy's attack hit us ----------
  hurt: (v, b, m) => {
    const w = b.world, x = st(b);
    const h = x.hits.get(m) || {};
    h[b.turn] = (h[b.turn] || 0) + 1; // $one_turn_cha_hit_num (68919; タフネス)
    x.hits.set(m, h);
    // 不屈の精神 (17861): KI + 1 … 8, 10 points
    const fk = first(w, m, FUKUTSU);
    if (fk) { m.ki = Math.min(m.maxki, m.ki + num(fx(w, fk).ki)); ran(fk, 'hit', 1); }
    // 刺し違える覚悟 (不惜身命 17715): shown when it was hit
    const sc = first(w, m, SASHI);
    if (sc) ran(sc, 'hit', 1);
    return v;
  },

  // ---------- S-combo ----------
  // 同調 (68303): from the first participant who holds it on, the highest attack / guard stars of the participants'
  // cards; every participant's card then takes them
  combo: (v, b, who) => {
    const w = b.world;
    let on = false, ma = 0, mg = 0;
    for (const i of who) {
      const m = b.party[i];
      if (has(w, m, DOUCHOU)) on = true;
      if (!on) continue;
      const cd = b.hand[b.plans[i].card];
      ma = Math.max(ma, cd.a); mg = Math.max(mg, cd.g);
    }
    if (on && (ma || mg)) {
      ran(DOUCHOU);
      for (const i of who) { const cd = b.hand[b.plans[i].card]; cd.a = ma; cd.g = mg; }
    }
    return v;
  },
  // 傍若無人 / アウトサイダー / 剛腕: never part of an S-combo (52143-52175, 140449) — for src/combo.js to ask
  noCombo: (v, b, m) => v || !!first(b.world, m, BOUJAKU) || !!first(b.world, m, OUTSIDER) || gouwan(b.world, m),

  // ---------- turn end (turn_recover_hpki, after the base recovery and 再生 … Pエネルギー炉) ----------
  recover: (v, b) => {
    const w = b.world, x = st(b);
    // 時間稼ぎ: the first member (party order) holding the highest level anyone holds (chk_skill_learn(377) with no
    // member); when that one fought this turn, the members who didn't get HP / KI
    let jk = null;
    for (const id of JIKAN) { const h = b.party.find((m) => has(w, m, id)); if (h) { jk = { id, h }; break; } }
    for (const m of b.party) {
      ensure(m);
      const fresh = m.ko && m.koTurn === b.turn; // $chadeadchk != $chadead: fell this turn
      let hp = 0, ki = 0, on = false;
      const ss = SHINSHIN.findIndex((id) => has(w, m, id));
      if (ss >= 0 && !joined(b, m)) { hp += SHINSHIN_HP[ss]; ki += SHINSHIN_KI[ss]; on = true; } // 心身一如
      if (jk && joined(b, jk.h) && !joined(b, m)) { hp += num(fx(w, jk.id).hp); ki += num(fx(w, jk.id).ki); on = true; }
      const wasKo = m.ko;
      if (on && !fresh) m.hp = Math.min(m.maxhp, m.hp + Math.ceil((m.maxhp * hp) / 100));
      if (on && m.ko && m.hp >= m.maxhp) growth.revive(m);
      // Uせいめいたい: a member down since an earlier turn is back with 1 … 10 % HP, unless everyone is down
      const us = USEIMEI.find(([id]) => has(w, m, id));
      if (us && m.ko && !fresh && b.party.some((y) => !y.ko)) {
        growth.revive(m);
        m.hp = Math.min(m.maxhp, m.hp + Math.ceil((m.maxhp * us[1]) / 100));
      }
      // 不死身の体: back on its feet at 70 … 30 % HP
      const fj = FUJIMI.find(([id]) => has(w, m, id));
      if (fj && m.ko && m.hp >= m.maxhp * fj[1]) growth.revive(m);
      if (m.ko) continue;
      if (wasKo) m.ki = Math.min(m.maxki, m.ki + Math.ceil((m.maxki * 2.5) / 100)); // ($turn_recover_ki, for the one up again)
      if (on) m.ki = Math.min(m.maxki, m.ki + Math.ceil((m.maxki * ki) / 100));
      // 限界を超えたパワー (19211): − 8 % of the max KI (ceil of the negative)
      if (x.full.has(m)) m.ki = Math.max(0, m.ki + Math.ceil((m.maxki * -8) / 100));
    }
    x.full.clear();
    hikari(b);
    return v;
  },

  // ---------- after the battle: カードドロップ (src/items.js afterBattle asks 'drop' for each drop) ----------
  // the second drop of the enemy only (51428): its denominator × 0.95 … 0.7 by the first member up holding it (to_i);
  // the original's denominator 1 then becomes rand(0), which never drops — kept at 1 here
  drop: (den, b, f, id) => {
    const d2 = ((b.world.skc || {}).drop2 || {})[f.id];
    if (!d2 || d2[0] !== id || d2[1] !== den) return den;
    for (const m of b.party) {
      if (m.ko) continue;
      const e = DROP.find(([sid]) => has(b.world, m, sid));
      if (e) return Math.max(1, Math.trunc(den * e[1]));
    }
    return den;
  },
});

// 光の旅 (46645 / 20846): each turn a member fought, its count goes up (to the level's turns + 1); when the used cards are
// dealt again, the first new card takes the school of the first member (party order) whose count has come up, which
// starts again from 0, the second card the next one's …
function hikari(b) {
  const w = b.world, light = st(b).light;
  const used = b.plans.map((p) => p && p.card).filter((k) => k != null).sort((p, q) => p - q);
  const due = [];
  for (const m of b.party) {
    const e = HIKARI.find(([id]) => has(w, m, id));
    if (!e || !joined(b, m)) continue;
    const t = light.get(m) || 0;
    if (t <= e[1]) light.set(m, t + 1);
    if (light.get(m) >= e[1]) due.push([m, e[0]]);
  }
  due.forEach(([m], k) => {
    if (k >= used.length || b.practice) return;
    b.hand[used[k]].s = m.school;
    light.set(m, 0);
  });
}

// 刺し違える覚悟 (不惜身命 68785): the enemy's attack always lands — after the evasion roll, so after every 'avoid' entry
// (残像拳, 武泰斗の教え, 緊急回避); a card's evasion (カナッサ, src/items.js evades) still comes first
setTimeout(() => growth.extra.push({ avoid: (v, b, m) => (first(b.world, m, SASHI) ? Math.min(v, 0) : v) }));

// ---------- the map: 引き寄せ (an encounter at every move) / 追い払い (none) ----------
// chk_skill_learn(616 / 617, 0): anyone in the party. The remake has no card moves (the field is walked); one move is
// taken as 4 steps here, the length an encounter has in the original at 1 in 5 moves against the remake's 12-25 steps.
const ENC_MOVE = 4;
setTimeout(() => {
  const game = G();
  if (!game || game.skcHooked) return;
  game.skcHooked = true;
  const step = game.onStep;
  game.onStep = function () {
    const s = this.state, w = this.world, p = s.party || [];
    if (w && !this.busy) {
      if (p.some((m) => has(w, m, OIHARAI))) s.nextEnc = Math.max(s.nextEnc, 2); // never down to 0
      else if (p.some((m) => has(w, m, HIKIYOSE))) s.nextEnc = Math.min(s.nextEnc, ENC_MOVE);
    }
    return step.call(this);
  };
});

// ---------- ?dev=skc… (&timer) ----------
// skc: the time room hall (the ?dev=tr progress) with 悟空・比克・悟飯・天津飯 Lv 40 and every skc skill card in hand;
// skc<skill>[_<skill>…]: the same, up to three of those skills learned by 悟空 in his 追加 slots, then a fight with
// 甜菜人 ×2 (skcb…: with 拉蒂茲, a boss). (A real 時之間 boss: ?dev=trz1kaio and the others, src/tr_z*.js.)
export const SKC_CARDS = [65, 66, 94, 95, 99, 101, 102, 108, 111, 115, 116, 117, 118, 143, 146, 147, 149, 150, 152, 158, 159,
  161, 163, 164, 185, 188, 189, 190, 191, 192, 193, 208, 209, 210, 213];
registerZ3('skc', {
  dev(game, step) {
    const k = /^skc(b?)((?:\d+_?)*)$/.exec(step);
    if (!k) return false;
    const w = game.world, s = game.state = game.newState();
    s.var[40] = 2;
    for (const n of [68, 69, 502, 107, 522, 109, 426, 567, 520, 119, 431, 458, 521, 545, 429, 532, 421, 533, 561, 563, 564, 566, 568]) s.sw[n] = true;
    s.flags.z3 = 'done';
    party(game, [3, 4, 5, 6]);
    for (const m of s.party) { m.level = 40; m.exp = w.actors[m.id].exp[40]; applyLevel(w, m); heal(m); }
    s.cards = s.cards || {};
    for (const id of SKC_CARDS) s.cards[id] = 1;
    s.zeni = 99999;
    const goku = ensure(s.party[0]), ids = k[2].split('_').filter(Boolean).map(Number);
    goku.addN = 3;
    ids.forEach((id, x) => { if (x < 3) { goku.add[x] = id; goku.sp[id] = w.growth.skills[id].sp; goku.got[id] = goku.set[id] = 1; } });
    s.map = '48'; s.x = 44 * 32 + 16; s.y = 29 * 32 + 16;
    game.startField();
    if (ids.length) setTimeout(() => game.startBattle(k[1] ? [10] : [1, 1], false, { loseOk: true }), 300);
    return true;
  },
});

// Character growth, after the original:
//   SP and passive skills (スキル, 008_Share_Sub_skill.rb): three 固有技能 slots filled by level, up to three 追加技能
//     slots set from the skills someone in the party has learned; SP from every battle teaches the 追加技能
//     (get_cha_sp_run), CAP can buy them; the battle effects are the hooks under "battle" below
//   ZP (Scene_Db_Status mode 6, item card 71 龜屋): enemies beaten + 50 per new top level, 150 ZP per stat step
//   the shared EXP pool (variable 305, card 77 哥美拉 → Scene_Db_Status mode 7)
//   proficiency power (102_Scene_Db_Battle_Anime.rb:15995) and the KO rule (010_Share.rb turn_recover_hpki)
// Per member (saved with the party): typ[3] 固有技能, add[3] 追加技能, addN open 追加 slots, sp {skill: SP},
// got {skill: 1} learned, set {skill: 1} ever set, zp, maxLv (top level reached), plus {hp,ki,atk,def,agi} from ZP,
// ko (knocked out: stays out until HP is back to full or the party rests).
// Per game: state.skillSeen {skill: n} ($skill_set_get_num[1], which skills the 追加技能 list offers), var[305] pool.
import { audio, say, choose, rand, VERSION } from './core.js?v=20261108-0603';
import { levelUp, levelCap } from './party.js?v=20261108-0603';

const SKILL_GET_MAX = 9; // $skill_get_max
const HINSHI = 31; // $hinshi_hp: below this HP % a member is "dying"
export const STATUSUP_ZP = 150; // $statusup_zp
const LEVELUP_ZP = 50; // $levelup_add_zp
const SE_GET = 'DB2 アイテム取得';

// ---------- data ----------
const sk = (world, id) => world.growth.skills[id] || { n: '', m: '', sp: 0, cap: 0, same: [], up: 0, old: [], share: false, fx: {} };
const need = (world, id) => sk(world, id).sp;
export const skillName = (world, id) => sk(world, id).n;

export function ensure(m) {
  m.typ = m.typ || [0, 0, 0];
  m.add = m.add || [0, 0, 0];
  if (m.addN == null) m.addN = 1;
  m.sp = m.sp || {};
  m.got = m.got || {};
  m.set = m.set || {};
  if (m.zp == null) m.zp = 0;
  if (m.maxLv == null) m.maxLv = m.level;
  m.plus = m.plus || { hp: 0, ki: 0, atk: 0, def: 0, agi: 0 };
  return m;
}
const seen = (s, id, n) => { s.skillSeen = s.skillSeen || {}; s.skillSeen[id] = n == null ? Math.min(SKILL_GET_MAX, (s.skillSeen[id] || 0) + 1) : n; };

// chk_skill_learn: in a 固有 slot, or in a 追加 slot with its SP complete
export function has(world, m, id) {
  ensure(m);
  return m.typ.includes(id) || (m.add.includes(id) && (m.sp[id] || 0) >= need(world, id));
}
// the first learned skill of a family (highest level first) → its data, or null
function best(world, m, fam) {
  for (const id of fam) if (has(world, m, id)) return sk(world, id);
  return null;
}
const bestId = (world, m, fam) => fam.find((id) => has(world, m, id)) || 0; // (for ran)
const F = {
  blood: [2, 3, 4, 89, 90, 91, 92, 93, 94], // サイヤ人の血 (checked lowest first, like get_exp_add)
  // Z戦士の絆, with 地球育ちのサイヤ人 678-686 counted as the same (all.rb 14737-14771 / 16112: 686, 106, 685, 105 … 678, 13)
  kizuna: [686, 106, 685, 105, 684, 104, 683, 103, 682, 102, 681, 101, 680, 15, 679, 14, 678, 13],
  kicon: [124, 123, 122, 121, 120, 119, 27, 26, 25], // 気のコントロール
  hissatsu: [288, 287, 286, 285, 284, 283, 282, 281, 280], // 必殺の一撃
  wakideru: [166, 165, 164, 163, 162, 161, 60, 59, 58], // 湧き出る力
  miracle: [61, 62, 63, 167, 168, 169, 170, 171, 172], // ミラクル全開パワー
  muda: [112, 111, 110, 109, 108, 107, 18, 17, 16], // ムダのない動き
  koutetsu: [154, 153, 152, 151, 150, 149, 50, 49, 48], // 鋼鉄の拳
  kanashi: [39, 40, 41, 131, 132, 133, 134, 135, 136], // かなしばり
  regen: [10, 12, 35, 248, 249], // turn_recover_hpki HP (18620-18639): 再生能力, 魔族の力 +5 %, ネイルと同化 +7, 神と融合 +8
  regenKi: [11, 12, 248, 249], // the KI part (18929-18938): 再生能力 +5 %, ネイルと同化 +3, 神と融合 +5
  soul: [100, 99, 98, 97, 96, 95, 7, 6, 5], // サイヤ人魂 (超サイヤ人's サイヤ人の血: all.rb 14589 / 15903)
  seifuku: [546, 545, 544, 543, 542, 541, 540, 539, 538], // 征服
};
const BLOOD_SP = { 2: 1.1, 3: 1.15, 4: 1.2, 89: 1.25, 90: 1.3, 91: 1.35, 92: 1.4, 93: 1.45, 94: 1.5 }; // get_sp_add
const num = (v) => Number(v) || 0;

// get_exp_add / get_sp_add: サイヤ人の血
// ---------- passive effects other modules add (src/cards_*.js: the favourite character, the skill cards' skills) ----------
// extra.push({ key: fn, … }); ext(key, v, ...args) passes v through every entry that has the key and returns it. Keys and
// where they run: ki (kiCost) · exp / sp (expFor / spFor) · cardMid (cardFor, after ミラクル全開パワー) · card (cardFor, last) ·
// dealt (b, m, skill, ctx {card, foe, foeCard}) · taken (b, m, ctx {card, foe, foeCard}) · hit (onHit: b, m, foe, card) ·
// recover (b) · avoid / hurt / cover / pick (src/battle.js) · combo (src/combo.js)
export const extra = [];
export const ext = (k, v, ...a) => { for (const e of extra) if (e[k]) v = e[k](v, ...a); return v; };

// ---------- skills that fired (output_runskill all.rb 54324: the name boxes sliding in over the battle film) ----------
// ran(id, kind, course): kind 'skill' = $tmp_run_skill (set_damage_add, emptied at each call: dealt / taken start a new
// group), 'hit' = $tmp_run_hit_skill (get_attack_hit_skill), 'cover' = $tmp_run_kabau_skill; course 0 = the party
// attacks, 1 = an enemy does (option 351). src/viz.js draws runShow.
export const runShow = { kind: null, ids: [], course: 0, n: 0, open: false, quiet: false };
export function ran(id, kind = 'skill', course = 0) {
  const r = runShow;
  if (!r.open || r.kind !== kind) { Object.assign(r, { kind, ids: [], course, open: true, quiet: false }); r.n++; }
  if (id && !r.ids.includes(id)) r.ids.push(id);
}
// set_damage_add's `$tmp_run_skill = []` (14369); a second target of the same member's attack this turn shows nothing
// (output_runskill: @all_attack_count == 1 for the party)
let lastDealt = null;
function newRun(b, m, course) {
  const key = course === 0 && b ? `${b.turn}:${m && m.id}` : null;
  Object.assign(runShow, { kind: 'skill', ids: [], course, open: true, quiet: !!key && key === lastDealt && b === lastB });
  runShow.n++;
  lastDealt = key; lastB = b;
}
let lastB = null;

export function expFor(world, m, exp) {
  exp = ext('exp', exp, m); // (喜歡的角色 ×1.15: src/cards_b.js)
  const b = best(world, m, F.blood);
  return Math.trunc(b ? exp * num(b.fx.b) : exp);
}
function spFor(world, m, sp) {
  sp = ext('sp', sp, m); // (喜歡的角色 ×1.5)
  const id = F.blood.find((x) => has(world, m, x));
  return Math.trunc(id ? sp * BLOOD_SP[id] : sp);
}

// ---------- proficiency (熟練度, docs/battle-rules.md §3.3) ----------
// power = ceil(base × (100 + L) / 100), L = min(uses, 999); past 1000 uses + (uses − 999) / 5 more
export function power(state, m, skill) {
  const level = skill ? (state.skillLv || {})[skill.id] || 0 : (state.atkLv || {})[m.id] || 0;
  let p = Math.ceil(((skill ? skill.power : 3) * (100 + Math.min(level, 999))) / 100);
  if (level > 1000) p = Math.ceil(p + (level - 999) / 5);
  return p;
}

// ---------- battle ----------
// turn start: the per-turn rolls for 湧き出る力 and ミラクル全開パワー (101_Scene_Db_Battle.rb, rand(100)+1)
export function turnStart(b) {
  for (const m of b.party) { typicalFix(b.world, b.game.state, ensure(m)); m.wk = rand(100) + 1; m.mz = rand(100) + 1; }
}

// set_typical_skill: a 固有技能 put in a slot, learned
export function setTypical(w, s, m, slot, id) {
  ensure(m);
  m.typ[slot] = id;
  m.set[id] = m.got[id] = 1;
  m.sp[id] = need(w, id);
  seen(s, id);
}
// set_typical_skill_first (all.rb 3312, at a new game / continue): a member whose first 固有 slot is empty gets the
// listed ones (琪琪, 龜仙人, 貝吉塔, 特蘭克斯, 16～18 號, 未來悟飯, 多瑪一夥, 巴達克 — him not in his Z1 story, variable
// 43 = 101). Here it runs at battle start / end, once a member (firstTyp), into the empty slots (page 6131 may have set slot 0 before his first battle). CE34 後から追加設定:
// 巴達克's 最終決戦改 once Frieza is beaten in ZG (switch 598) or 外伝 is cleared (586), for saves from before 6131 set it.
function typicalFix(w, s, m) {
  const first = (w.growth.first || {})[m.id];
  if (first && !m.firstTyp && !((m.id === 16 || m.id === 32) && (s.var || {})[43] === 101)) {
    first.forEach((id, slot) => { if (id && !m.typ[slot]) setTypical(w, s, m, slot, id); });
    m.firstTyp = 1;
  }
  if ((m.id === 16 || m.id === 32) && s.sw && (s.sw[598] || s.sw[586]) && m.typ[0] !== 670) setTypical(w, s, m, 0, 670);
  // CE34 フラグ / スキル付け替え: once Goku is back on Namek (switch 531) → switch 1312, and his slot 2's Z戦士の絆 becomes
  // 地球育ちのサイヤ人 of the same level (3 and 14; Map007 event 2 page 486 does the same for 3)
  if (s.sw && s.sw[531]) s.sw[1312] = true;
  if (s.sw && s.sw[1312] && (m.id === 3 || m.id === 14)) earthSaiyan(w, s, m);
}
// set_typical_skill chano, 2, 678 + x where slot 2 holds Z戦士の絆 [13, 14, 15, 101 … 106][x]
const KIZUNA_LV = [13, 14, 15, 101, 102, 103, 104, 105, 106];
export function earthSaiyan(w, s, m) {
  const k = KIZUNA_LV.indexOf(ensure(m).typ[2]);
  if (k >= 0) setTypical(w, s, m, 2, 678 + k);
}

// set_damage_add: is the enemy treated as a boss ($data_enemies[id].element_ranks[22] == 1)? 戦闘練習 sets the
// 訓練人偶's (map 007: element_ranks[22] = 1 / 3 by the choice)
let bossIds = null;
function bossFoe(b, foe) {
  if (b.practice && b.practice.bossKind != null) return !!b.practice.bossKind;
  bossIds = bossIds || new Set(b.world.growth.boss || []);
  return bossIds.has(foe.id);
}

// get_mp_cost: 湧き出る力 (no KI this turn), then 気のコントロール and 必殺の一撃 multiply the cost
export function kiCost(world, m, skill) {
  let cost = skill.ki;
  const wk = best(world, m, F.wakideru);
  if (wk && (m.wk || 101) < num(wk.fx.rate)) return 0;
  if (cost) cost = ext('ki', cost, m); // (喜歡的角色 ×0.8)
  if (cost) {
    const kc = best(world, m, F.kicon);
    if (kc) cost *= num(kc.fx.kis);
    const hs = best(world, m, F.hissatsu);
    if (hs) cost *= num(hs.fx.kis);
  }
  return Math.trunc(cost);
}

// get_battle_skill: the card a member plays — ミラクル全開パワー makes it Z/Z, ムダのない動き adds stars
// changes to a played card before the passive skills below (get_battle_skill, all.rb 6794: きまぐれ in src/cards_square.js):
// each f(world, m, c) changes c
export const cardHooks = [];
export function cardFor(world, m, cd) {
  const c = { ...cd };
  for (const f of cardHooks) f(world, m, c);
  const mp = best(world, m, F.miracle);
  if (mp && (m.mz || 101) < num(mp.fx.rate)) { c.a = 7; c.g = 7; }
  ext('cardMid', c, m); // (さかさま 422: src/cards_story.js)
  // 真の力 38 (超2 悟飯, all.rb 6978-6996): a star below 4 is raised to 4 (added with ムダのない動き's, clamped below)
  if (has(world, m, 38)) { c.a = Math.max(c.a, 4); c.g = Math.max(c.g, 4); }
  const md = best(world, m, F.muda);
  if (md) {
    c.a = Math.max(0, Math.min(7, c.a + num(md.fx.ah)));
    c.g = Math.max(0, Math.min(7, c.g + num(md.fx.gh)));
  }
  return ext('card', c, m); // (捨身: src/cards_b.js)
}

// createcardval: a card a member used comes back as 1/1 or Z/Z (both stars) with 一か八か
export function regenCard(world, m, cd) {
  if (m && has(world, m, 618)) { const v = rand(2) ? 7 : 0; cd.a = v; cd.g = v; }
  return cd;
}

// members who played a card this turn and are still up, other than m (Z戦士の絆, 激怒 look at them)
const mates = (b, m) => b.party.filter((x, i) => x !== m && !x.ko && b.plans && b.plans[i]);
const kizunaMates = (b, m) => mates(b, m).filter((x) => F.kizuna.some((id) => has(b.world, x, id))).length;
const dying = (x) => (x.hp * 100) / x.maxhp < HINSHI;

// set_damage_add(add = 0): damage dealt — サイヤ人魂, 鋼鉄の拳, Z戦士の絆, 激怒, 最終決戦 / 最終決戦改 (a boss, ×1.25 each),
// 征服 (a normal enemy), 必殺の一撃 (special moves)
export function dealt(b, m, skill, d, ctx = {}) {
  const w = b.world;
  newRun(b, m, 0);
  let x = d;
  const so = best(w, m, F.soul);
  if (so) x *= num(so.fx.a);
  const kt = best(w, m, F.koutetsu);
  if (kt) { x *= num(kt.fx.a); ran(bestId(w, m, F.koutetsu)); }
  const kz = best(w, m, F.kizuna);
  const n = kz ? kizunaMates(b, m) : 0;
  if (n) { x *= 1 + (num(kz.fx.a) - 1) * n; ran(bestId(w, m, F.kizuna)); }
  if (has(w, m, 22) && mates(b, m).some(dying)) { x *= 1 + 0.35 * mates(b, m).filter(dying).length; ran(22); }
  if (ctx.foe) x = bossRate(b, m, ctx.foe, x, 'a');
  const hs = best(w, m, F.hissatsu);
  if (hs && skill) { x *= num(hs.fx.a); ran(bestId(w, m, F.hissatsu)); }
  x = ext('dealt', x, b, m, skill, ctx); // (連擊, 輕視 …: src/cards_*.js)
  return Math.trunc(x);
}
// all.rb 14679 / 15665 (dealt, k 'a') and 16045 / 16999 (taken, k 'g'): 最終決戦 8 and 最終決戦改 670 against a boss
// (both stack), 征服 538-546 against a normal enemy (its highest level)
function bossRate(b, m, foe, x, k) {
  const w = b.world;
  const course = k === 'a' ? 0 : 1;
  if (bossFoe(b, foe)) {
    for (const id of [8, 670]) if (has(w, m, id)) { x *= num(sk(w, id).fx[k]); ran(id, 'skill', course); }
  } else {
    const sf = best(w, m, F.seifuku);
    if (sf) { x *= num(sf.fx[k]); ran(bestId(w, m, F.seifuku), 'skill', course); }
  }
  return x;
}
// set_damage_add(add = 1): damage taken — サイヤ人魂, Z戦士の絆, 激怒, 最終決戦 / 最終決戦改 (×0.85 each), 征服
export function taken(b, m, d, ctx = {}) {
  const w = b.world;
  newRun(b, m, 1);
  let x = d;
  const so = best(w, m, F.soul);
  if (so) x *= num(so.fx.g);
  const kz = best(w, m, F.kizuna);
  const n = kz ? kizunaMates(b, m) : 0;
  if (n) { x *= 1 - (1 - num(kz.fx.g)) * n; ran(bestId(w, m, F.kizuna), 'skill', 1); }
  if (has(w, m, 22) && mates(b, m).some(dying)) { x *= 0.8; ran(22, 'skill', 1); }
  if (ctx.foe) x = bossRate(b, m, ctx.foe, x, 'g');
  x = ext('taken', x, b, m, ctx); // (掩護, 輕視 …)
  return Math.trunc(x);
}
// get_attack_hit_skill: かなしばり may stop the enemy that was hit (STOP_TURN)
export function onHit(b, m, foe, card) {
  const id = F.kanashi.find((x) => has(b.world, m, x));
  if (id && rand(100) + 1 < num(sk(b.world, id).fx.rate)) { foe.stop = (foe.stop || 0) + 1; ran(id, 'hit'); }
  ext('hit', null, b, m, foe, card); // (急中生智, 交換, 吸收: src/cards_*.js)
}
// a stopped enemy loses its action (the counter goes down)
export function foeStopped(f) {
  if (!f.stop) return false;
  f.stop--;
  return true;
}

// KO: the member is out of the fight until healed to full
export function knockOut(m, turn) { m.ko = true; m.koTurn = turn; m.hp = 0; }
export function revive(m) { m.ko = false; }

// turn_recover_hpki (from the second turn): HP +3 %, a KO'd member +7.5 % (not in the turn it fell) and back on its
// feet only at full HP; 再生 / 魔族の力 / ネイルと同化 / 神と融合 (fx.hp %); KI +2.5 % for the members still up, + 再生 /
// ネイルと同化 / 神と融合 (fx.ki %). (Pエネルギー炉 later in the same elsif chains: src/skills_c.js)
export function recover(b) {
  for (const m of b.party) {
    ensure(m);
    const fresh = m.ko && m.koTurn === b.turn;
    if (!fresh) m.hp = Math.min(m.maxhp, m.hp + Math.ceil((m.maxhp * (m.ko ? 7.5 : 3)) / 100));
    const rg = best(b.world, m, F.regen);
    if (rg && !fresh) m.hp = Math.min(m.maxhp, m.hp + Math.ceil((m.maxhp * num(rg.fx.hp)) / 100));
    if (m.ko && m.hp >= m.maxhp) revive(m);
    if (!m.ko) m.ki = Math.min(m.maxki, m.ki + Math.ceil((m.maxki * 2.5) / 100));
    const rk = !m.ko && best(b.world, m, F.regenKi);
    if (rk) m.ki = Math.min(m.maxki, m.ki + Math.ceil((m.maxki * num(rk.fx.ki)) / 100));
  }
  ext('recover', null, b); // (練氣: src/cards_b.js)
}

// ---------- after a won battle (101_Scene_Db_Battle.rb chk_all_enemy_dead) ----------
// before the EXP: the shared pool takes the whole EXP, every member gets ZP per enemy
export function beforeExp(b, exp) {
  const s = b.game.state;
  s.var = s.var || {};
  s.var[305] = (s.var[305] || 0) + exp;
  for (const m of b.party) ensure(m).zp += b.foes.length * ext('zpRate', 1, s); // get_zp_bairitu (50754): ×2-5 by the wishes (src/sys.js)
}

// SP for every member's 追加技能, then the 固有技能 their level now allows. Returns the message pages
// ({lines, se}) in order.
export function afterBattle(b) {
  const w = b.world, s = b.game.state;
  let sp = b.trReward && b.trReward.sp ? b.trReward.sp : b.foes.reduce((t, f) => t + (f.sp || 0), 0); // (a 時之間 boss: variable 318)
  s.var = s.var || {};
  const heavy = s.var[313] || 0; // 加重衣 (card 82): SP ×1.5 for the next won battles
  if (heavy > 0) sp = Math.trunc(sp * 1.5);
  const pages = [{ lines: heavy > 1 ? [`獲得　${sp}　SP！`, `(加重衣的效果剩餘　${heavy - 1}回)`] : [`獲得　${sp}　SP！`] }];
  if (heavy === 1) pages.push({ lines: ['加重衣的效果結束了！'] });
  if (heavy > 0) s.var[313] = heavy - 1;
  for (const m of b.party) {
    typicalFix(w, s, ensure(m));
    const got = spRun(w, s, m, spFor(w, m, sp));
    for (const id of got) pages.push({ se: SE_GET, lines: [`${m.name}　學會技能`, `${skillName(w, id)}　了！`] });
    for (const id of typicalRun(w, s, m)) pages.push({ se: SE_GET, lines: [`${m.name}`, `已學會技能　${skillName(w, id)}　！`] });
  }
  return pages;
}

// chk_run_next_add_skill: a learned skill whose next level is shared keeps learning the next level in its slot
function nextRuns(w, m, id, onlyNew) {
  const up = sk(w, id).up;
  return !!m.got[id] && sk(w, up).share && (!onlyNew || !m.got[up]);
}

// get_cha_sp_run: SP into each 追加技能 slot; returns the skills learned now
function spRun(w, s, m, gain) {
  const out = [];
  for (let x = 0; x < 3; x++) {
    const id0 = m.add[x];
    if (!id0) continue;
    const next = nextRuns(w, m, id0, false);
    const id = next ? sk(w, id0).up : id0;
    if ((m.sp[id] || 0) < need(w, id)) m.sp[id] = (m.sp[id] || 0) + gain;
    if ((m.sp[id] || 0) >= need(w, id) && !m.got[id]) {
      m.sp[id] = need(w, id);
      m.set[id] = m.got[id] = 1;
      if (id > 1) {
        seen(s, id);
        if (nextRuns(w, m, id, false)) { seen(s, sk(w, id).up, 1); m.set[sk(w, id).up] = 1; }
        out.push(id);
        if (next) m.add[x] = id;
      }
    }
  }
  return out;
}

// get_typical_skill: each slot moves one step when the level allows and the slot holds the previous level
function typicalRun(w, s, m) {
  const out = [];
  const table = w.growth.typical[m.id] || [];
  const earth = (m.id === 3 || m.id === 14) && s.sw && s.sw[1312]; // all.rb 3598-3787: 地球育ちのサイヤ人 for Z戦士の絆
  const picks = [];
  for (const [lv, id0, col] of table) {
    const id = earth && KIZUNA_LV.includes(id0) ? 678 + KIZUNA_LV.indexOf(id0) : id0;
    if (m.level < lv) continue;
    const old = sk(w, id).old;
    if (old.length ? old.includes(m.typ[col]) && m.typ[col] !== id : m.typ[col] === 0) picks.push([id, col]);
  }
  for (const [id, col] of picks) {
    m.sp[id] = need(w, id);
    m.set[id] = m.got[id] = 1;
    seen(s, id);
    m.typ[col] = id;
    out.push(id);
  }
  return out;
}

// ---------- 能力 screen: 固有技能 / 追加技能 (Scene_Db_Status, Y) ----------
// get_cha_skill_manual: the description and the effect details
export function manual(world, id) {
  if (!id) return '什麼也沒有設置！';
  const k = sk(world, id), f = k.fx;
  let t = k.m.replace(/\\n/g, '\n');
  const add = [];
  let line = '';
  const push = (s, same) => { if (same && line) line += '／' + s; else { if (line) add.push(line); line = s; } };
  if (f.a) push(`造成的傷害：${f.a}倍`);
  if (f.g) push(`受到的傷害：${f.g}倍`);
  if (f.hp) push(`HP：${f.hp}${f.hpm || '％'}`);
  if (f.ki) push(`KI：${f.ki}${f.kim || '％'}`, !!f.hp);
  if (f.hps) push(`HP：${f.hps}${f.hpsm || '％'}`);
  if (f.kis) push(`KI：${f.kis}${f.kism || '％'}`, !!f.hps);
  if (f.ah) push(`攻擊星數：${f.ah}星`);
  if (f.gh) push(`防禦星數：${f.gh}星`, !!f.ah);
  if (f.b) push(`倍率：${f.b}${f.bm || '％'}`);
  if (f.rate) push(`概率：${f.rate}％`);
  if (line) add.push(line);
  if (add.length) t += '\n＊＊　效果詳細　＊＊\n' + add.join('\n');
  return t;
}

// how a 追加技能 slot reads: name, then GET / LVUP / MAX with the SP
export function addSlotInfo(world, m, x) {
  ensure(m);
  const id = m.add[x];
  const learnedNow = (m.sp[id] || 0) >= need(world, id) && id !== 1;
  if (id <= 1) return { id, name: skillName(world, id), dim: !learnedNow, prog: '' };
  if (nextRuns(world, m, id, true)) {
    const up = sk(world, id).up;
    return { id, name: skillName(world, id), dim: !learnedNow, prog: `LVUP：${m.sp[up] || 0}／${need(world, up)}`, progDim: false };
  }
  const tag = m.got[id] ? 'MAX：' : 'GET：';
  return { id, name: skillName(world, id), dim: !learnedNow, prog: `${tag}${m.sp[id] || 0}／${need(world, id)}`, progDim: !learnedNow };
}

// get_output_skill_list (skill list option "全部"): 卸下, then every shared skill someone has learned, in list order
export function skillList(world, state, m) {
  ensure(m);
  const sn = state.skillSeen || {};
  const ids = Object.keys(world.growth.skills).map(Number).filter((id) => {
    const k = sk(world, id);
    return k.share && sn[id] > 0 && (!k.old.length || k.old.some((o) => sn[o] > 0));
  });
  ids.sort((a, b) => sk(world, a).ord - sk(world, b).ord);
  return [0, ...ids].map((id) => ({
    id, name: id ? skillName(world, id) : '卸下',
    dim: id && (m.sp[id] || 0) < need(world, id), fresh: id && !m.set[id],
  }));
}

// the 自由 slot (仮面男, card 110): skills this member has learned, not already in a 固有 slot (get_output_skill_list
// with setfreeskill_flag)
export function freeSlot(m) { return ensure(m).typ.indexOf(34); }
export function freeList(world, state, m) {
  const sn = state.skillSeen || {};
  const same01 = [m.typ[0], m.typ[1]].flatMap((x) => sk(world, x).same);
  return Object.keys(world.growth.skills).map(Number).filter((id) => {
    const k = sk(world, id);
    return sn[id] > 0 && (!k.old.length || k.old.some((o) => sn[o] > 0)) && id !== 34 && m.got[id] && !m.typ.includes(id)
      && !same01.includes(id);
  }).sort((a, b) => sk(world, a).ord - sk(world, b).ord).map((id) => ({ id, name: skillName(world, id), dim: (m.sp[id] || 0) < need(world, id) }));
}
// window 12: allowed when learned and not doubled by a 固有技能 (a 追加 slot holding it is emptied)
export function freeOk(world, m, id) {
  const hit = (x) => x && (x === id || sk(world, x).same.includes(id));
  return id > 0 && (m.sp[id] || 0) >= need(world, id) && !m.typ.some(hit);
}
export function applyFree(world, state, m, id) {
  const slot = freeSlot(m);
  if (slot < 0 || !freeOk(world, m, id)) return false;
  const hit = (x) => x && (x === id || sk(world, x).same.includes(id));
  m.add = m.add.map((x) => (hit(x) ? 0 : x));
  m.set[id] = m.got[id] = 1;
  m.typ[slot] = id;
  seen(state, id, 1);
  m.freeSet = true; // $cha_set_free_skill
  return true;
}

// chk_same_skill: the skill (or one with the same effect) is already in a 固有 slot or another 追加 slot
function sameSkill(world, m, id, slot) {
  const hit = (x) => x && (x === id || sk(world, x).same.includes(id));
  return m.typ.some(hit) || m.add.some((x, i) => i !== slot && hit(x));
}

// what choosing skill `id` for 追加 slot `slot` does (Scene_Db_Status window 3):
//   {kind: 'no'} | {kind: 'place'} | {kind: 'learn' | 'set', cost}
export function chooseAdd(world, m, id, slot) {
  ensure(m);
  const k = sk(world, id);
  const ok = id === 0 || (!sameSkill(world, m, id, slot) && (!k.old.length || k.old.some((o) => m.got[o])));
  if (!ok) return { kind: 'no' };
  const cost = Math.round(k.cap * (1 - (m.sp[id] || 0) / (k.sp || 1)));
  if (m.add[slot] === id && !m.got[id] && m.set[id]) return { kind: 'learn', cost };
  if (m.got[id] || (m.set[id] && !k.old.length) || id === 0) return { kind: 'place' };
  return { kind: m.set[id] ? 'learn' : 'set', cost };
}
// window 10 「是的」: pay CAP (state.zeni) and set / learn; false when the CAP is short
export function applyAdd(world, state, m, id, slot) {
  const r = chooseAdd(world, m, id, slot);
  if (r.kind === 'no') return false;
  if (r.kind !== 'place') {
    if (state.zeni < r.cost) return false;
    const k = sk(world, id);
    if (!m.set[id]) { m.set[id] = 1; state.zeni -= k.cap; } else {
      state.zeni -= r.cost;
      m.got[id] = 1;
      m.sp[id] = k.sp;
      if (nextRuns(world, m, id, false)) { seen(state, k.up, 1); m.set[k.up] = 1; }
    }
  }
  m.add[slot] = id;
  return true;
}
// window 11: a 固有技能 bought one level up with CAP (Skill_levelup_bairitu = 1)
export function typicalUp(world, m, slot) {
  const up = sk(world, ensure(m).typ[slot]).up;
  return up ? { id: up, name: skillName(world, up), cost: sk(world, up).cap } : null;
}
export function applyTypicalUp(world, state, m, slot) {
  const u = typicalUp(world, m, slot);
  if (!u || state.zeni < u.cost) return false;
  state.zeni -= u.cost;
  m.set[u.id] = m.got[u.id] = 1;
  seen(state, u.id, 1);
  m.sp[u.id] = need(world, u.id);
  m.typ[slot] = u.id;
  return true;
}

// ---------- field cards (src/items.js fieldCards, registered when that module exists) ----------
let pickMember = null; // set by partymenu.js: (game, title, ok(m) → bool, zpPage) → Promise<member | null>
export function setPicker(fn) { pickMember = fn; }

// a number entry like the original's (event command 103): ◀ ▶ steps, 決定 / 取消 → number | null
function askNumber(digits) {
  return new Promise((res) => {
    const max = 10 ** digits - 1;
    let v = 0;
    const box = document.createElement('div');
    box.className = 'gr-num';
    const render = () => {
      const steps = (ds) => `<div class="gr-row">${ds.map((d) => `<button class="btn" data-d="${d}">${d > 0 ? '+' + d : d}</button>`).join('')}</div>`;
      box.innerHTML = `<div class="gr-val">${String(v).padStart(digits, '0')}</div>${steps([1, 10, 100])}${steps([-1, -10, -100])}<div class="gr-row"><button class="btn" data-a="ok">決定</button><button class="btn" data-a="no">取消</button></div>`;
    };
    render();
    box.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.d) { v = Math.max(0, Math.min(max, v + Number(t.dataset.d))); audio.se('Z3 カーソル移動'); render(); return; }
      audio.se('Z3 決定');
      box.remove();
      res(t.dataset.a === 'ok' ? v : null);
    });
    document.getElementById('app').appendChild(box);
  });
}
const flash = () => {
  const f = document.createElement('div');
  f.style.cssText = 'position:absolute;inset:0;background:#fff;z-index:60;opacity:1;transition:opacity .25s;pointer-events:none';
  document.getElementById('app').appendChild(f);
  requestAnimationFrame(() => { f.style.opacity = '0'; });
  setTimeout(() => f.remove(), 300);
};
const ask = async (lines) => { await say(lines.map((t) => ['', t]), true); return choose(['是', '否']); };

// card 71 龜屋: Map007 event 1 pages 26 / 28 (ZP割り振り)
const ZP_STATS = [['HP', 'hp', 'maxhp', 4], ['KI', 'ki', 'maxki', 3], ['攻擊力', 'atk', 'atk', 2], ['防禦力', 'def', 'def', 1], ['速度', 'agi', 'agi', 1]];
export async function useZp(game) {
  const s = game.state;
  s.sw = s.sw || {};
  if (!s.sw[478]) { s.sw[478] = true; await say([['', `在這裡可以使用ZP提升角色的能力！\n提高一次能力，ZP要消耗${STATUSUP_ZP}！`]]); }
  if (await ask(['消費ZP提升角色的能力嗎？'])) return true;
  let m;
  while ((m = await pickMember(game, 'ZP', (x) => Math.floor(ensure(x).zp / STATUSUP_ZP) > 0, true))) {
    let again = true;
    while (again) {
      await say([['', '提高什麼能力？']], true);
      let k = await choose(['HP', 'KI', '攻擊力', '下一頁']);
      if (k === 3) {
        await say([['', '提高什麼能力？']], true);
        k = await choose(['防禦力', '速度', '前一頁', '選擇結束']);
        if (k === 2) continue;
        if (k === 3) break;
        k += 3;
      }
      const [label, key, stat, step] = ZP_STATS[k];
      const max = Math.floor(m.zp / STATUSUP_ZP);
      let n;
      for (;;) {
        await say([['', `${m.name}的　${label}　${m[stat]}提高多少？\n每次消費${STATUSUP_ZP}提高${step}，最大次數${max}`]], true);
        n = await askNumber(5);
        if (n == null) break;
        if (n > max) { await say([['', 'ZP不足']]); continue; }
        if (n === 0) { await say([['', '請輸入一個或多個值']]); continue; }
        break;
      }
      if (n == null) continue;
      const cost = n * STATUSUP_ZP, after = m[stat] + n * step;
      if (await ask([`${m.name}的　${label}自${m[stat]}　提高到　${after}\n可以嗎？　ZP　消費：${cost}　剩餘：${m.zp - cost}`])) continue;
      audio.se('Z3 レベルアップ');
      flash();
      await say([['', `${m.name}的　${label}自　${m[stat]}　提高到　${after}　\nZP　消費：${cost}　剩餘：${m.zp - cost}`]]);
      m.plus[key] += n * step;
      m[stat] += n * step;
      if (key === 'hp') m.hp += n * step;
      if (key === 'ki') m.ki += n * step;
      m.zp -= cost;
      m.runzp = (m.runzp || 0) + n;
      again = false;
    }
    if (await ask(['還繼續嗎？'])) break;
  }
  return true;
}

// card 77 哥美拉: Map007 event 15 pages 91001 / 91003 (共有経験値割り振り). The base level (variable 324) is only set
// from Z2 on, so in Z1 the rate stays 1.0.
export async function usePool(game) {
  const s = game.state, w = game.world;
  s.sw = s.sw || {};
  s.var = s.var || {};
  if (!s.sw[481]) { s.sw[481] = true; await say([['', '使用共有經驗值能給角色升級！\n另外 低於基準等級的場合 效果會倍增！']]); }
  const base = s.var[324] || 0;
  if (await ask([`要使用共有經驗值讓角色升級嗎？\n共有經驗值：${s.var[305] || 0}　基準等級：${base}`])) return true;
  if (!s.var[305]) { await say([['', '沒有共有經驗值']]); return true; }
  let m;
  while ((m = await pickMember(game, '共有經驗值', (x) => x.level < levelCap(), false))) {
    const curve = w.actors[m.id].exp;
    const rest = Math.max(0, curve[m.level + 1] - m.exp); // (a save from when the cap was 99: EXP past the next level)
    const rate = Math.min(3, Math.max(1, 1 + (base - m.level) * 0.1));
    const rateText = Number.isInteger(rate) ? rate.toFixed(1) : String(rate);
    let n;
    for (;;) {
      await say([['', `要給 ${m.name} 使用多少經驗值？\n下一級還需要　${rest}　經驗\n共有經驗值：${s.var[305]}　倍率：${rateText}倍`]], true);
      n = await askNumber(8);
      if (n == null) break;
      if (n > s.var[305]) { await say([['', '共有經驗值不足']]); continue; }
      if (n === 0) { await say([['', '請輸入大於或等於 1 的值']]); continue; }
      break;
    }
    if (n != null) {
      const gain = Math.trunc(n * rate);
      if (!(await ask([`${m.name} 將獲得 ${gain} 經驗值　這樣可以嗎？\n下一級還需要 ${rest}　共有經驗值 \n使用：${n} 剩餘：${s.var[305] - n}`]))) {
        audio.se('Z1 レベルアップ', 80);
        flash();
        const before = m.level;
        m.exp += gain;
        levelUp(w, m);
        if (m.level > before) await say([['', `${m.name}的等級提升　LV${before}　⇒　LV${m.level}　`]]);
        s.var[305] -= n;
      }
    }
    if (await ask(['要繼續嗎？'])) break;
    if (!s.var[305]) { await say([['', '沒有共有經驗值']]); break; }
  }
  return true;
}

// card 72 悟飯(C): one more 追加技能 slot (up to 3) — run_card, Scene_Db_Status
export async function useAddSlot(game) {
  const m = await pickMember(game, '悟飯(C)', (x) => ensure(x).addN < 3, true);
  if (!m) return false;
  audio.se('Z1 パワーアップ');
  m.addN++;
  return true;
}

// card 88 超聖水: +15 ZP to one member
export async function useZpWater(game) {
  const m = await pickMember(game, '超聖水', () => true, true);
  if (!m) return false;
  audio.se('Z1 パワーアップ');
  ensure(m).zp += 15;
  return true;
}
// card 121 妖怪: a KO'd member with some HP back is on its feet again (not in a one-member party)
export async function useGhost(game) {
  if (game.state.party.length < 2) { audio.se('Z3 エラー'); return false; }
  const m = await pickMember(game, '妖怪', (x) => !!x.ko && x.hp > 0, false);
  if (!m) return false;
  audio.se('Z3 回復');
  revive(m);
  return true;
}
// card 82 加重衣: SP ×1.5 for 5 more won battles (variable 313, up to 999)
export function useHeavyGi(game) {
  const s = game.state;
  s.var = s.var || {};
  if ((s.var[313] || 0) >= 999) { audio.se('Z3 エラー'); return false; }
  s.var[313] = Math.min(999, (s.var[313] || 0) + 5);
  audio.se('Z3 回復');
  return true;
}
// skill cards (other_card_run): the skill joins the 追加技能 list once
export function useSkillCard(game, skill) {
  const s = game.state;
  s.skillSeen = s.skillSeen || {};
  if (s.skillSeen[skill] > 0) { audio.se('Z3 エラー'); return false; }
  seen(s, skill);
  audio.se(SE_GET);
  return true;
}
let freeSkillScreen = null; // set by partymenu.js: (game, member) → Promise<bool>
export function setFreeSkillScreen(fn) { freeSkillScreen = fn; }
// card 110 仮面男: set a learned skill into a member's 自由 slot
export async function useMask(game) {
  const m = await pickMember(game, '假面男', (x) => freeSlot(x) >= 0, true);
  return m ? freeSkillScreen(game, m) : false;
}

// the cards this module runs, registered in src/items.js fieldCards (skill cards need world.growth.cards)
const wrap = (fn) => async (ctx) => !!(await fn(ctx.game));
let cardsMod = null, cardsWorld = null;
function registerCards() {
  if (!cardsMod || !cardsWorld) return;
  const fc = cardsMod.fieldCards;
  fc[71] = ({ game }) => useZp(game);
  fc[77] = ({ game }) => usePool(game);
  fc[72] = ({ game }) => useAddSlot(game);
  fc[82] = wrap(useHeavyGi);
  fc[88] = wrap(useZpWater);
  fc[110] = wrap(useMask);
  fc[121] = wrap(useGhost);
  for (const [id, skill] of Object.entries(cardsWorld.growth.cards || {})) fc[id] = wrap((game) => useSkillCard(game, skill));
}
export function setGrowthWorld(w) { cardsWorld = w; registerCards(); }
import(`./items.js?v=${VERSION}`).then((it) => { if (it.fieldCards) { cardsMod = it; registerCards(); } }).catch(() => {});

const css = document.createElement('style');
css.textContent = `
.gr-num { position: absolute; left: 8px; right: 8px; bottom: calc(var(--safe-b) + 150px); z-index: 70; background: #ffd8a0;
  border: 4px solid #c8642a; padding: 8px; display: flex; flex-direction: column; gap: 6px; color: var(--ink); }
.gr-val { font-size: 28px; text-align: center; letter-spacing: 4px; }
.gr-row { display: flex; gap: 4px; }
.gr-row .btn { flex: 1; min-width: 0; margin: 0; padding: 4px 0; text-align: center; font-size: 16px; }
`;
document.head.appendChild(css);

// 卡片效果 B：141 喜歡角色變更（喜歡的角色系統）、142 悟空、144 比克、148 克林、151 貝吉塔、153 沙維扎、156 快速龍、160 威洛、169 外星人、173 氣墊車、197 修行之石、203 重力裝置、211 悟空(B)、212 克林(B) — docs/cards-plan.md; the data is built by tools/build_cards_b.py.
// Card effects register in src/items.js fieldCards[id] = async ({ game, battle }) => used | 'close' | false.
// After the original (106_Scene_Db_Card.rb other_card_run / output_card_change_effect, 100_Scene_Db_Status.rb run_card
// and the CAP → ZP window, Map007 event 1 pages 23 / 25, CE263). docs/cards-b.md has the details.
//   141 喜歡角色變更  the favourite character (variable 104, the base character: get_ori_cha_no). The favourite's
//                    special moves cost KI × 0.8, it gets EXP × 1.15 and SP × 1.5, and a 「必」 card it picks becomes
//                    its own school. The card is sold again after 20 won battles (variables 228 / 229, switch 469).
//   142 144 148 151 153 160 211 212  skill cards: the skill joins the 追加技能 list (world.growth.cards → src/growth.js);
//                    their battle effects are below ("skills")
//   156 快速龍  every card of the hand becomes 「氣」 (16)　　169 外星人  one card of the hand is dealt again
//   173 氣墊車  15 more card moves at double distance (variable 420, shared with 76 飛機)
//   197 修行之石  every special move of one member +5 uses (add_actor_all_tec_level)
//   203 重力裝置  CAP → ZP for one member, 15 CAP a point ($captozp_rate); never used up
import { audio, say, choose, img } from './core.js?v=20261103-1518';
import * as items from './items.js?v=20261103-1518';
import * as battle from './battle.js?v=20261103-1518';
import * as partymenu from './partymenu.js?v=20261103-1518';
import * as growth from './growth.js?v=20261103-1518';

const { fieldCards, overlay, h, button, handCanvas } = items;
const { newCard, KI_CARD } = battle;
const { pickMember } = partymenu;
const { ensure } = growth;

const SE_ERR = 'Z3 エラー', SE_CARD = 'Z2 カードアップ', SE_POWER = 'Z1 パワーアップ', SE_MOVE = 'Z3 カーソル移動';
const yes = async (text) => { await say([['', text]], true); return (await choose(['是', '否'])) === 0; };

// ---------- the favourite character (お気に入りキャラ) ----------
const ORI = { 14: 3, 18: 5, 19: 12, 20: 17, 26: 25, 32: 16 }; // get_ori_cha_no: a Super Saiyan form → the character
export const ori = (id) => ORI[id] || id;
const vars = (s) => (s.var = s.var || {});
export const favId = (s) => (s && s.var && s.var[104]) || 0;
export const isFav = (s, m) => !!m && favId(s) > 0 && favId(s) === ori(m.id);
const FAV_BATTLES = 20; // $okiniiri_btlnum → variable 229
// variable 228 (won battles since the favourite was set; 20 at the start): counted from the 戰鬥記錄 wins
const wins = (s) => (s.stats && s.stats.wins) || 0;
export const favBattles = (s) => (s.flags && s.flags.cdbFavWins != null ? wins(s) - s.flags.cdbFavWins : FAV_BATTLES + wins(s));
// the card shop offers card 141 (Scene_Shop: variable 228 ≥ 229 and switch 469, King Kai beaten in Z1)
export const favOnSale = (s) => favBattles(s) >= FAV_BATTLES && !!((s.sw && s.sw[469]) || (vars(s)[40] || 0) >= 1 || (s.var[41] || 0) >= 132);
// set_start_val (all.rb 13870, at a new game and every load): variable 228 = $okiniiri_btlnum (20) — src/main.js load()
export function favLoad(s) {
  if (!s) return;
  s.flags = s.flags || {};
  if (s.flags.cdbFavWins != null) s.flags.cdbFavWins = wins(s) - FAV_BATTLES;
}
// Scene_Db_Status output_party (all.rb 45434): the favourite's mark, アイコン (29 × 16, 0), next to the face
partymenu.hooks.badge = (s, m) => {
  if (!isFav(s, m)) return null;
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  c.className = 'pm-badge';
  const im = img(ICONS);
  const paint = () => c.getContext('2d').drawImage(im.im, 29 * 16, 0, 16, 16, 0, 0, 16, 16);
  if (im.ok) paint(); else im.p.then(() => im.ok && paint());
  return c;
};
const ICONS = 'Graphics/Pictures/アイコン.PNG';
const badgeCss = document.createElement('style');
badgeCss.textContent = '.pm-mem > .pm-badge { position: absolute; right: 2px; top: 2px; width: 16px; height: 16px; }';
document.head.appendChild(badgeCss);

// card 141: Map007 event 1 page 23 → Scene_Db_Status call_state 5 → page 25
fieldCards[141] = async ({ game }) => {
  const s = game.state, T = game.world.cardsB.fav;
  s.sw = s.sw || {};
  s.flags = s.flags || {};
  const name = (id) => (game.world.actors[id] || {}).name || '';
  if (!s.sw[74]) { await say(game.world.cardsB.info.map((t) => ['', t])); s.sw[74] = true; } // CE263, once
  if (favId(s)) await say([['', T.now.replace('{old}', name(favId(s)))]]);
  if (!(await yes(T.ask))) return false; // the card comes back (126 [141] +1)
  for (;;) {
    const m = await pickMember(game, '喜歡角色變更', (x) => favId(s) !== x.id, false);
    const pick = m ? ori(m.id) : 0; // variable 105
    if (pick) {
      await say([['', (favId(s) ? T.change : T.set).replace('{old}', name(favId(s))).replace('{new}', name(pick))]]);
      if (await yes(T.ok)) {
        audio.se('DB2 アイテム取得');
        await say([['', T.done.replace('{new}', name(pick))]]);
        vars(s)[104] = pick;
        s.flags.cdbFavWins = wins(s); // variable 228 = 0
        return true;
      }
    } else await say([['', T.none]]);
    if (!(await yes(T.again))) return false; // 続けるか確認 → no: the card comes back
  }
};

// ---------- 173 氣墊車 (スカイカー): variable 420 +15, up to 999 (the field reads it, like 76 飛機) ----------
fieldCards[173] = async ({ game }) => {
  const v = vars(game.state);
  if ((v[420] || 0) >= 999) { audio.se(SE_ERR); return false; }
  v[420] = Math.min(999, (v[420] || 0) + 15);
  audio.se('DB3 エネルギー波2');
  return true;
};

// ---------- the hand (output_card_change_effect, chk_change_card_run) ----------
// the six cards; `one` = pick one (169), else all of them change at once (156). Resolves true when changed.
function handWindow(game, it, one, change) {
  const s = game.state, hand = s.hand;
  const el = overlay();
  return new Promise((done) => {
    let busy = false;
    const close = (r) => { el.remove(); done(r); };
    const render = (flash) => {
      el.innerHTML = '';
      el.appendChild(h('div', 'cw head', it.name));
      const box = h('div', 'cw');
      box.appendChild(h('div', 'detail', one ? '點一張要換掉的卡牌。' : '所持卡牌的流派全部變為「氣」！'));
      const p = h('div', 'pick');
      hand.forEach((cd, k) => {
        const b = h('button', 'hand');
        b.appendChild(handCanvas(cd));
        if (flash && flash.includes(k)) b.classList.add('flash');
        b.onclick = () => { if (one && !busy) go([k]); };
        p.appendChild(b);
      });
      box.appendChild(p);
      el.appendChild(h('div', 'list'));
      el.appendChild(box);
      const acts = h('div', 'acts');
      if (one && !busy) acts.appendChild(button('返回', () => { audio.se(SE_MOVE); close(false); }));
      el.appendChild(acts);
    };
    const go = async (ks) => { // the card blinks, then changes (items.cardBlink: 50 frames, as the original)
      busy = true;
      audio.se(SE_CARD);
      render();
      await items.cardBlink(s, one ? 169 : 156, [...el.querySelectorAll('.pick .hand')].filter((b, k) => ks.includes(k)));
      change(ks);
      render();
      setTimeout(() => close(true), 500);
    };
    render();
    if (!one) go(hand.map((c, k) => k));
  });
}
fieldCards[156] = async ({ game }) => { // ハイヤードラゴン: every card 「氣」 (a hand already all 「氣」 can't use it)
  const hand = game.state.hand;
  if (!hand.some((c) => c.s !== KI_CARD)) { audio.se(SE_ERR); return false; }
  return handWindow(game, game.world.items[156], false, () => { hand.forEach((c) => { c.s = KI_CARD; }); });
};
fieldCards[169] = async ({ game }) => { // 異星人: createcardval on the picked card
  const hand = game.state.hand;
  return handWindow(game, game.world.items[169], true, ([k]) => { hand[k] = newCard(); });
};

// ---------- 197 修行之石: add_actor_all_tec_level(member, 5) ----------
const TEC_MAX = 99999; // $cha_skill_level_max
fieldCards[197] = async ({ game }) => {
  const s = game.state;
  const m = await pickMember(game, '修行之石', () => true, false);
  if (!m) return false;
  audio.se(SE_POWER);
  s.skillLv = s.skillLv || {};
  for (const sid of m.skills) s.skillLv[sid] = Math.min(TEC_MAX, (s.skillLv[sid] || 0) + 5);
  return true;
};

// ---------- 203 重力裝置: Scene_Db_Status window_state 15 (CAP → ZP), $captozp_rate = 15 ----------
const CAP_RATE = 15;
function capToZp(game, m) {
  const s = game.state, T = game.world.cardsB.zp;
  return new Promise((done) => {
    let cap = 0, timer = 0;
    const box = document.createElement('div');
    box.className = 'cdb-zp win';
    const stop = () => { clearTimeout(timer); timer = 0; };
    // ▲ / ▼ (R: ×10, L+R: ×100, the original's variable 471 = 0); held down it repeats
    const step = (n) => {
      const before = cap;
      cap = Math.max(0, Math.min(Math.floor(s.zeni / CAP_RATE) * CAP_RATE, cap + n * CAP_RATE));
      if (cap !== before) audio.se(SE_MOVE);
      render();
    };
    const render = () => {
      const zp = cap / CAP_RATE;
      box.querySelector('.have').textContent = T.have.replace('{have}', s.zeni);
      box.querySelector('.use').textContent = T.use.replace('{cap}', cap).replace('{zp}', zp);
    };
    const line = (cls, t) => { const d = document.createElement('div'); d.className = cls; d.textContent = t; return d; };
    box.append(line('', `${m.name}`), line('', T.rate.replace('{cap}', CAP_RATE).replace('{zp}', 1)), line('', T.how));
    for (const ns of [[1, 10, 100], [-1, -10, -100]]) {
      const row = line('cdb-row', '');
      for (const n of ns) {
        const b = document.createElement('button');
        b.className = 'btn';
        b.textContent = `${n > 0 ? '▲' : '▼'}${Math.abs(n) * CAP_RATE}`;
        b.onpointerdown = (e) => {
          e.stopPropagation();
          step(n);
          let wait = 400;
          const again = () => { step(n); wait = Math.max(60, wait * 0.8); timer = setTimeout(again, wait); };
          stop();
          timer = setTimeout(again, wait);
        };
        b.onpointerup = b.onpointerleave = b.onpointercancel = stop;
        row.append(b);
      }
      box.append(row);
    }
    box.append(line('have', ''), line('use', ''));
    const row = line('cdb-row', '');
    for (const [label, ok] of [[T.yes, true], [T.no, false]]) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = label;
      b.onpointerdown = (e) => {
        e.stopPropagation();
        if (ok && !cap) { audio.se(SE_ERR); return; }
        stop();
        box.remove();
        if (!ok) { audio.se('Z3 決定'); done(false); return; }
        audio.se(SE_POWER);
        ensure(m).zp += cap / CAP_RATE;
        s.zeni -= cap;
        done(true);
      };
      row.append(b);
    }
    box.append(row);
    box.addEventListener('pointerdown', (e) => e.stopPropagation());
    render();
    document.getElementById('app').appendChild(box);
  });
}
fieldCards[203] = async ({ game }) => {
  for (;;) { // 否 goes back to choosing the member (window_state 0)
    const m = await pickMember(game, '重力裝置', () => true, true);
    if (!m) return false;
    if (await capToZp(game, m)) return true;
  }
};

// ---------- the passive effects: the favourite character and the skill cards' skills ----------
// They run through src/growth.js `extra` (growth.ext(key, value, …) at the original's points; docs/cards-b.md).
// Highest level first, like chk_skill_learn checked from the top.
const FAM = {
  sutemi: [365, 54], // 捨て身 2 / 1 (get_battle_skill 7283)
  kabau: [279, 278, 277, 276, 275, 274, 273, 272, 271], // かばう: damage × g (chk_kabau 8322, set_damage_add 15780)
  neru: [299, 298, 297, 296, 295, 294, 293, 292, 291], // 気を練る: N % HP → N % KI (turn_recover_hpki 19096)
  kiten: [56], // とっさの機転 (get_attack_hit_skill 17465)
  rengeki: [247, 246, 245, 244, 243, 242, 241, 240, 239], // 連撃: × (1 + (a − 1)(chain − 1)) (set_damage_add 15338)
  fukutsu: [47, 46, 45], // 不屈の闘志: guard stars + gh when hit (17514)
  zanzo: [118, 117, 116, 115, 114, 113, 21, 20, 19], // 残像拳: evasion + rate (get_avoid_add 17990)
  renkei: [677, 676, 675, 674, 673, 672, 671], // 連携: combo attack stars + ah, the best of the members (68525)
};
const G = () => window.__game; // (main.js) the running game: its state for the favourite, its world for the skills
const best = (w, m, fam) => { const id = fam.find((x) => growth.has(w, m, x)); return id ? w.growth.skills[id] : null; };
const firstId = (w, m, fam) => fam.find((x) => growth.has(w, m, x)) || 0; // (growth.ran: the skill shown)
const n = (v) => Number(v) || 0;
const dying = (x) => Math.trunc((x.hp * 100) / x.maxhp) < 31; // $hinshi_hp
const clamp7 = (v) => Math.max(0, Math.min(7, v));
const passive = {
  ki: (v, m) => (isFav(G().state, m) ? v * 0.8 : v), // get_mp_cost
  exp: (v, m) => (isFav(G().state, m) ? v * 1.15 : v), // get_exp_add
  sp: (v, m) => (isFav(G().state, m) ? v * 1.5 : v), // get_sp_add
  pick: (v, b, m, cd) => v || (cd.s === 0 && isFav(b.game.state, m)), // a 「必」 card becomes the favourite's school
  card: (c, m) => {
    const sk = best(G().world, m, FAM.sutemi);
    if (sk && sk === G().world.growth.skills[365]) { const k = Math.min(7 - c.a, c.g); return { ...c, a: c.a + k, g: c.g - k }; }
    if (sk && c.a < c.g) return { ...c, a: c.g, g: c.a };
    return c;
  },
  dealt: (v, b, m) => { const r = best(b.world, m, FAM.rengeki); if (r && b.chain > 1) growth.ran(firstId(b.world, m, FAM.rengeki)); return r && b.chain > 1 ? v * (1 + (n(r.fx.a) - 1) * (b.chain - 1)) : v; },
  taken: (v, b, m) => { if (b.cover !== m) return v; const k = best(b.world, m, FAM.kabau); if (k) growth.ran(firstId(b.world, m, FAM.kabau), 'skill', 1); return k ? v * n(k.fx.g) : v; },
  hit: (v, b, m, foe) => { // the enemy's card stops allowing its special move
    const cd = foe.card;
    if (!growth.has(b.world, m, 56) || !cd || !(cd.s === 0 || cd.s === foe.school) || b.world.cardsB.sure.includes(Number(foe.id))) return v;
    if (!battle.enemyCard) return v;
    for (let k = 0; k < 50; k++) { const s = battle.enemyCard().s; if (s !== 0 && s !== foe.school) { cd.s = s; break; } } // create_card_i(1, true, school)
    growth.ran(56, 'hit'); // (all.rb 17475)
    return v;
  },
  recover: (v, b) => {
    for (const m of b.party) {
      if (m.ko || m.hp <= 0) continue;
      const k = best(b.world, m, FAM.neru);
      if (!k) continue;
      const N = n(k.fx.hp), cost = Math.ceil((m.maxhp * N) / 100);
      if (m.hp > cost && m.ki !== m.maxki) { m.ki = Math.min(m.maxki, m.ki + Math.ceil((m.maxki * N) / 100)); m.hp -= cost; }
    }
    return v;
  },
  avoid: (v, b, m) => { const z = best(b.world, m, FAM.zanzo); return z ? v + n(z.fx.rate) : v; },
  hurt: (v, b, m) => { // the guard stars of the card this member plays
    const f = best(b.world, m, FAM.fukutsu), p = b.plans && b.plans[b.party.indexOf(m)];
    if (f && p) { b.hand[p.card].g = clamp7(b.hand[p.card].g + n(f.fx.gh)); growth.ran(firstId(b.world, m, FAM.fukutsu), 'hit', 1); } // (17520)
    return v;
  },
  cover: (one, b) => { // the first member (in card order) with かばう who played a card, isn't dying and isn't the target
    if (!dying(one)) return one;
    const by = b.party.map((m, i) => [m, b.plans && b.plans[i]]).filter(([m, p]) => p && m !== one && !m.ko && m.hp > 0 && !dying(m))
      .sort((x, y) => x[1].card - y[1].card);
    const c = by.find(([m]) => best(b.world, m, FAM.kabau));
    if (c) growth.ran(firstId(b.world, c[0], FAM.kabau), 'cover', 1); // $tmp_run_kabau_skill (all.rb 15784), shown in the cover scene
    return c ? c[0] : one;
  },
  combo: (v, b, who) => v + Math.max(0, ...who.map((i) => n((best(b.world, b.party[i], FAM.renkei) || { fx: {} }).fx.ah))),
};
if (growth.extra) growth.extra.push(passive);
// the card shop: 141 first once 20 battles are won (Scene_Shop: $favorite_card_no swapped to the top)
if (items.shopHooks) items.shopHooks.push((world, s, ids) => (favOnSale(s) && !ids.includes(141) ? [141, ...ids] : ids));

const css = document.createElement('style');
css.textContent = `
.cdb-zp { position: absolute; left: 8px; right: 8px; bottom: calc(var(--safe-b) + 24px); z-index: 70; display: flex; flex-direction: column;
  gap: 6px; font-size: 16px; line-height: 1.3; }
.cdb-zp .cdb-row { display: flex; gap: 4px; }
.cdb-zp .cdb-row .btn { flex: 1; min-width: 0; margin: 0; padding: 6px 0; text-align: center; font-size: 16px; touch-action: none; }
.cdb-zp .use { color: #d0480c; }
`;
document.head.appendChild(css);

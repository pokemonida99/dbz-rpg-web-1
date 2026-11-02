// Party screens, tactics and the battle command menu, after the original:
//   battle command (101_Scene_Db_Battle.rb output_menu / window_key_state, $WinState 0 / 5), for touch:
//     自動・菜單・逃跑, tap a card for manual input　　菜單 → 隊伍・卡牌・組合技・作戰
//   隊伍 (100_Scene_Db_Status.rb, from the battle menu and the field menu): each member's face, school, LV / HP / KI,
//     攻擊力・防禦力・速度・經驗・NEXT (or 擊破數・通常攻擊次數), the special moves with KI cost or use count;
//     tap a member, then 換順序 and another member to swap places — party[0] leads on the map (var 42)
//   作戰 (103_Scene_Db_Tactics_Menu.rb, $cha_tactics): per-character settings that 自動 follows
//     (set_auto_btl / set_auto_tec, 101_Scene_Db_Battle.rb:2940-3230)
// Swapping active and waiting members (Scene_Db_Member_change) is the 時之間's (memberChange below, src/timeroom.js)
// and an item card's, so the field menu doesn't offer it; in Z1 only the active party ($partyc) earns EXP (get_sinario_full_party is empty).
//
// Other screens plug into the menu through `menuEntries` (卡牌 = remake-cards, 組合技 = remake-combo):
//   menuEntries.card = async ({ game, battle }) => { … }   // battle is null when opened from the field menu
// In battle the choosing comes back (picks kept) when the promise resolves, unless it resolves to 'stay'
// (the entry has moved the battle on by itself, e.g. started the turn).
import { img, audio, rand } from './core.js?v=20261102-1344';
import * as growth from './growth.js?v=20261102-1344'; // 技能 page, ZP, KI cost with passive skills

const FACES = 'Graphics/Pictures/Z1_顔味方.PNG'; // 64×64; row = actor id - 3; columns: normal, hurt, KO
const CARDS = 'Graphics/Pictures/カード関係.PNG';
const DIGITS = 'Graphics/Pictures/数字英語.PNG'; // 16×16: row 0 black digits + "/", row 1 HPKILV…NO, row 3 white-on-purple
const SE_OK = 'Z3 決定', SE_MOVE = 'Z3 カーソル移動', SE_ERR = 'Z3 エラー', SE_RUN = 'Z1 逃げる'; // 139_Public.rb $BGM_*

// ---------- saved per game: tactics and the counters the status screen shows ----------
// state.tactics[actor] = $cha_tactics[0..8][actor]; state.skillLv[skill] = $cha_skill_level (use count, by skill id,
// what S-combos check); state.atkLv[actor] = $cha_normal_attack_level; state.defeats[actor] = $cha_defeat_num
const TACTICS_DEFAULT = { target: 0, tec: 0, nonki: 0, kiheri: 0, kiPct: 1, tecId: 0 };
export function tactics(state, m) {
  state.tactics = state.tactics || {};
  // set_cha_tactics_nil_to_zero: all 0 except "KI below N%" = 1; the chosen move must be one the character knows
  const t = (state.tactics[m.id] = state.tactics[m.id] || {});
  for (const [k, v] of Object.entries(TACTICS_DEFAULT)) if (t[k] == null) t[k] = v;
  if (!m.skills.includes(t.tecId)) t.tecId = m.skills[0] || 0;
  return t;
}

// after one player action (102_Scene_Db_Battle_Anime.rb:88135 / 88224, 010_Share.rb cha_defeat_num_add)
export function tally(state, m, skill, defeated) {
  const add = (k, id, n = 1) => { state[k] = state[k] || {}; state[k][id] = Math.min(99999, (state[k][id] || 0) + n); };
  if (skill) add('skillLv', skill.id); else add('atkLv', m.id);
  if (defeated) add('defeats', m.id, defeated);
}

// ---------- 自動 (set_auto_tec / set_auto_btl) ----------
// Skill element flags (Skills.element_set in the original database): 27 = 小技, 28 = 大技 (a few are both).
const SMALL = new Set([1, 2, 5, 31, 33, 34, 35, 46, 47, 61, 62, 63, 71, 72, 81, 82, 83, 91, 92, 93]);
const BIG = new Set([29, 36, 47, 63, 64, 73, 83, 84, 92, 93]);

// KI a move really costs (get_mp_cost, 008_Share_Sub_skill.rb:4601); other systems replace it,
// e.g. the 必殺技 item card makes the next move free (src/items.js sets hooks.kiNeed)
export const hooks = { kiNeed: (m, ki) => ki };

// the special move 自動 picks for a member whose card allows one (null = no move: a normal attack)
export function autoSkill(world, state, m) {
  const skills = m.skills.map((id) => world.skills[id]).filter(Boolean).map((s) => ({ ...s, ki: growth.kiCost(world, m, s) }));
  if (!skills.length) return null;
  const t = tactics(state, m);
  const cost = (s) => hooks.kiNeed(m, s.ki);
  for (let loop = 1; loop < 2000; loop++) {
    const pick = skills[rand(skills.length)];
    let min = cost(pick); // the cheapest move this setting could use; below it the KI is short
    if (t.tec === 3) for (const s of skills) if (BIG.has(s.id)) min = Math.min(min, cost(s));
    if (t.tec === 4) min = Math.min(min, cost(world.skills[t.tecId]));
    let set = t.tec;
    if (m.ki < min || loop > 50) set = t.nonki === 0 ? 1 : 2; // short of KI: 不使用KI or 小技能
    if (t.kiheri === 1 && t.kiPct >= Math.floor((m.ki * 100) / m.maxki)) set = 1;
    let s = pick;
    if (set === 1 && pick.ki !== 0) continue; // the move's own cost (Skills.mp_cost), like the original
    if (set === 2 && !SMALL.has(pick.id)) continue;
    if (set === 3 && !BIG.has(pick.id)) continue;
    if (set === 4) s = skills.find((x) => x.id === t.tecId) || world.skills[t.tecId];
    if (m.ki < cost(s)) continue;
    return s;
  }
  return null;
}

// the enemy 自動 attacks: 0 弱小的 = the lowest HP now, 1 強大的 = the highest max HP (alive)
export function autoTarget(state, m, foes) {
  const alive = foes.filter((f) => f.hp > 0);
  const t = tactics(state, m);
  return (t.target === 1 ? alive.reduce((a, b) => (b.maxhp > a.maxhp ? b : a)) : alive.reduce((a, b) => (b.hp < a.hp ? b : a))).slot;
}

// ---------- battle command menu ----------
export const menuEntries = {
  party: (ctx) => openParty(ctx),
  card: null, // 卡牌 — remake-cards
  combo: null, // 組合技 — remake-combo
  tactics: (ctx) => openTactics(ctx),
};
const ENTRY_NAMES = { party: '隊伍', card: '卡牌', combo: '組合技', tactics: '作戰' };

// The command row while choosing (touch version of $WinState 0 / 5): 自動・菜單・(返回)・逃跑.
// The original's 戰鬥 → 手動 step is gone: tapping a hand card is manual input for the highlighted member
// (src/battle.js planning). 逃跑 is hidden in fights that can't be fled.
export function commandButtons(b) {
  return [
    ['自動', () => { audio.se(SE_OK); b.autoPlan(); }],
    ['菜單', () => { audio.se(SE_OK); battleMenu(b); }],
    ...(b.history.length ? [['返回', () => b.undo()]] : []),
    ...(b.boss ? [] : [['逃跑', () => { audio.se(SE_RUN); b.done('escape'); }]]),
  ];
}

// $WinState 5: 隊伍・卡牌・組合技・作戰; the picks made so far are kept (by member, so 隊伍's 換順序 is fine)
function battleMenu(b) {
  b.say('菜單');
  b.buttons = [...Object.keys(ENTRY_NAMES).map((k) => [ENTRY_NAMES[k], async () => {
    if (!menuEntries[k]) { audio.se(SE_ERR); b.say(`${ENTRY_NAMES[k]}：準備中`); return; }
    audio.se(SE_OK);
    b.buttons = [];
    const r = await b.keepPlans(() => menuEntries[k]({ game: b.game, battle: b }));
    if (r !== 'stay') b.resume();
  }]), ['返回', () => b.resume()]];
}

// ---------- field menu (140_Field_Main.rb: 隊伍・卡牌・記錄・概況・組合技・作戰・…) ----------
export function fieldMenuHtml() {
  return `<div class="pm-grid">${Object.keys(ENTRY_NAMES).map((k) =>
    `<button class="btn" data-m="${k}" ${menuEntries[k] ? '' : 'disabled'}>${ENTRY_NAMES[k]}${menuEntries[k] ? '' : '<small>準備中</small>'}</button>`).join('')}</div>`;
}
export function openEntry(key, ctx) { return menuEntries[key] ? menuEntries[key](ctx) : Promise.resolve(); }

// ---------- drawing bits (the original's art, as small canvases) ----------
function sprite(sheet, sx, sy, w, h, cw = w, ch = h) {
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const im = img(sheet);
  const paint = (fn) => { if (im.ok) fn(c.getContext('2d'), im.im); else im.p.then(() => im.ok && fn(c.getContext('2d'), im.im)); };
  if (w) paint((g, i) => g.drawImage(i, sx, sy, w, h, 0, 0, w, h));
  c.paint = paint;
  return c;
}
const faceOf = (m, size = 64) => {
  const col = m.ko || m.hp <= 0 ? 2 : m.hp * 4 < m.maxhp ? 1 : 0;
  const c = sprite(FACES, 64 * col, 64 * (m.id - 3), 64, 64);
  c.style.width = c.style.height = size + 'px';
  c.className = 'pm-face';
  return c;
};
function schoolTag(school) { // "[神]" under the face
  const c = sprite(CARDS, 0, 192, 64, 32);
  c.paint((g, i) => g.drawImage(i, 32 * school, 64, 32, 32, 16, 0, 32, 32));
  return c;
}
// a number in the original 16px digits (row 0 black, row 3 white on purple)
function digits(n, row = 0) {
  const s = String(Math.max(0, Math.floor(n)));
  const c = sprite(DIGITS, 0, 0, 0, 0, 16 * s.length, 16);
  c.paint((g, i) => { for (let k = 0; k < s.length; k++) g.drawImage(i, 16 * Number(s[k]), 16 * row, 16, 16, 16 * k, 0, 16, 16); });
  c.className = 'pm-num';
  return c;
}
const LETTER = { H: 0, P: 1, K: 2, I: 3, L: 4, V: 5, N: 8, O: 9 };
function word(w) {
  const c = sprite(DIGITS, 0, 0, 0, 0, 16 * w.length, 16);
  c.paint((g, i) => [...w].forEach((ch, k) => g.drawImage(i, 16 * LETTER[ch], 16, 16, 16, 16 * k, 0, 16, 16)));
  c.className = 'pm-num';
  return c;
}
const slash = () => Object.assign(sprite(DIGITS, 160, 0, 16, 16), { className: 'pm-num' });
const el = (tag, cls, ...kids) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of kids) e.append(k);
  return e;
};

// the overlay shared by 隊伍 and 作戰: party list on top, the screen's own windows below, 返回 at the bottom
function screen(title, game, battle, body) {
  const s = game.state;
  const root = el('div', 'pm');
  document.getElementById('app').appendChild(root);
  let cur = 0, swapFrom = null;
  const done = new Promise((res) => { root.close = (v) => { audio.se(SE_OK); root.remove(); res(v); }; });
  const render = () => {
    const party = s.party;
    cur = Math.min(cur, party.length - 1);
    root.innerHTML = '';
    const list = el('div', 'win pm-list');
    const head = el('div', 'pm-head', word('NO'), el('span', '', title));
    list.append(head);
    const row = el('div', 'pm-members');
    party.forEach((m, i) => {
      const b = el('button', 'pm-mem' + (i === cur ? ' on' : '') + (swapFrom === i ? ' from' : ''), digits(i + 1, 3), faceOf(m, 44), el('span', '', m.name));
      b.onclick = () => {
        if (swapFrom != null) { // 並び替え: the two swap places (Scene_Db_Status update, $window_state 1)
          if (swapFrom !== i) {
            [party[swapFrom], party[i]] = [party[i], party[swapFrom]];
            s.var[42] = party[0].id; // the character shown on the map
          }
          audio.se(SE_OK);
          cur = i;
          swapFrom = null;
        } else { audio.se(SE_MOVE); cur = i; }
        render();
      };
      row.append(b);
    });
    list.append(row);
    if (swapFrom != null) list.append(el('div', 'pm-hint', `要和誰交換位置？（${party[swapFrom].name}）`));
    root.append(list, ...body(party[cur], render, { battle, close: (v) => root.close(v) }));
    const bar = el('div', 'pm-bar');
    if (title === '隊伍' && party.length > 1) {
      const sw = el('button', 'btn', swapFrom == null ? '換順序' : '取消');
      sw.onclick = () => { audio.se(SE_OK); swapFrom = swapFrom == null ? cur : null; render(); };
      bar.append(sw);
    }
    const back = el('button', 'btn', '返回');
    back.onclick = () => root.close();
    bar.append(back);
    root.append(bar);
  };
  render();
  root.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); });
  return done;
}

// ---------- 隊伍 (Scene_Db_Status) ----------
let showUses = false, showSkills = false; // X: KI消耗 ⇄ 使用回數, Y: 能力 ⇄ 技能 (kept between visits, like the original)
let skillSel = null; // the chosen skill row on the 技能 page: { kind: 'typ' | 'add', x }
let skillList = null; // the 追加技能 list is open for this slot ($window_state 3): { x, pick }
function statWin(world, s, m, skillPage) {
  const st = el('div', 'win pm-stat');
  const left = el('div', 'pm-left', faceOf(m), schoolTag(m.school));
  const curve = world.actors[m.id].exp;
  const next = m.level >= 99 ? 0 : curve[m.level + 1] - m.exp;
  const nums = el('div', 'pm-nums',
    el('div', '', word('LV'), el('i'), digits(m.level)),
    el('div', '', word('HP'), el('i'), digits(m.hp)), el('div', '', slash(), el('i'), digits(m.maxhp)),
    el('div', '', word('KI'), el('i'), digits(m.ki)), el('div', '', slash(), el('i'), digits(m.maxki)));
  growth.ensure(m);
  const rows = skillPage === 'zp' // the member picker for ZP / 悟飯(C): the stats ZP raises, and the ZP
    ? [['攻擊力', m.atk], ['防禦力', m.def], ['速度', m.agi], ['ZP', m.zp]]
    : skillPage
      ? [['擊破數', (s.defeats || {})[m.id] || 0], ['ZP', m.zp], ['通常攻擊次數', (s.atkLv || {})[m.id] || 0]]
      : [['攻擊力', m.atk], ['防禦力', m.def], ['速度', m.agi], ['經驗', m.exp], ['NEXT', next]];
  const tbl = el('div', 'pm-rows');
  for (const [k, v] of rows) tbl.append(el('div', '', el('span', '', k), digits(v)));
  st.append(el('div', 'pm-top', left, nums), tbl);
  return st;
}
export function openParty({ game, battle }) {
  const world = game.world, s = game.state;
  skillSel = skillList = null;
  return screen('隊伍', game, battle, (m, render) => {
    if (skillSel && skillSel.m !== m) skillSel = skillList = null;
    const st = statWin(world, s, m, showSkills);
    const tog = el('div', 'pm-tog');
    if (showSkills) {
      const t2 = el('button', 'btn', '看能力');
      t2.onclick = () => { audio.se(SE_MOVE); showSkills = false; skillSel = skillList = null; render(); };
      tog.append(t2);
      return [st, ...skillPage(game, m, render, battle), tog];
    }
    const tec = el('div', 'win pm-tec');
    tec.append(el('div', 'pm-th', el('span', '', '必殺技'), el('span', '', showUses ? '使用回數' : 'KI消耗')));
    for (const id of m.skills) {
      const k = world.skills[id];
      tec.append(el('div', 'pm-tr', el('span', '', k.name), digits(showUses ? (s.skillLv || {})[id] || 0 : k.ki)));
    }
    if (!m.skills.length) tec.append(el('div', 'pm-tr', el('span', '', '（沒有必殺技）')));
    const t1 = el('button', 'btn', showUses ? '看 KI 消耗' : '看使用回數');
    t1.onclick = () => { audio.se(SE_MOVE); showUses = !showUses; render(); };
    const t2 = el('button', 'btn', '看技能');
    t2.onclick = () => { audio.se(SE_MOVE); showSkills = true; render(); };
    tog.append(t1, t2);
    return [st, tec, tog];
  });
}

// the 技能 page: 固有技能 ×3, 追加技能 ×3 (open slots numbered), the chosen one's description; on the map a 固有技能 can
// be raised a level with CAP and a 追加技能 slot changed from the list (in battle: ※戰鬥中不能變更)
const FULLWIDTH = ['１', '２', '３'];
function skillPage(game, m, render, battle) {
  const world = game.world, s = game.state;
  if (skillList) return skillListPage(game, m, render);
  const box = el('div', 'win pm-skl');
  const row = (kind, x, label, name, dim, prog, progDim) => {
    const on = skillSel && skillSel.kind === kind && skillSel.x === x;
    const b = el('button', 'pm-sk' + (on ? ' on' : ''), el('b', '', label), el('span', dim ? 'dim' : '', name));
    if (prog) b.append(el('small', progDim ? 'dim' : '', prog));
    b.onclick = () => { audio.se(SE_MOVE); skillSel = { m, kind, x }; render(); };
    return b;
  };
  box.append(el('div', 'pm-th', el('span', '', '固有技能')));
  m.typ.forEach((id, x) => box.append(row('typ', x, id > 0 ? FULLWIDTH[x] : '', growth.skillName(world, id), false)));
  box.append(el('div', 'pm-th', el('span', '', '追加技能')));
  for (let x = 0; x < 3; x++) {
    const info = growth.addSlotInfo(world, m, x);
    const r = row('add', x, x < m.addN ? FULLWIDTH[x] : '', info.name, info.dim, info.prog, info.progDim);
    if (x >= m.addN) r.disabled = true;
    box.append(r);
  }
  const out = [box];
  if (skillSel) {
    const id = skillSel.kind === 'typ' ? m.typ[skillSel.x] : m.add[skillSel.x];
    const memo = el('div', 'win pm-memo', growth.manual(world, id));
    out.push(memo);
    const acts = el('div', 'pm-tog');
    if (battle) memo.append(el('div', 'pm-hint', '※戰鬥中不能變更'));
    else if (skillSel.kind === 'typ') {
      const up = growth.typicalUp(world, m, skillSel.x);
      if (up) {
        const b = el('button', 'btn', `用 CAP 升級：${up.name}`);
        b.onclick = () => confirmBox(render, [`剩餘CAP：${s.zeni}`, `技能等級提升需要CAP：${up.cost}`, '使用CAP提升等級嗎？'], ['好的', '不用'], () => {
          if (!growth.applyTypicalUp(world, s, m, skillSel.x)) { audio.se(SE_ERR); return; }
          audio.se(SE_OK);
        });
        acts.append(b);
      }
    } else {
      const b = el('button', 'btn', '更換技能');
      b.onclick = () => { audio.se(SE_OK); skillList = { x: skillSel.x, pick: null }; render(); };
      acts.append(b);
    }
    if (acts.children.length) out.push(acts);
  }
  return out;
}

// the 追加技能 list ($window_state 3): 卸下 and the skills that can be set, grey until learned
function skillListPage(game, m, render) {
  const world = game.world, s = game.state;
  const slot = skillList.x;
  const box = el('div', 'win pm-skl pm-list2');
  box.append(el('div', 'pm-th', el('span', '', `追加技能 ${FULLWIDTH[slot]}`), el('span', '', `CAP：${s.zeni}`)));
  for (const it of growth.skillList(world, s, m)) {
    const b = el('button', 'pm-sk' + (skillList.pick === it.id ? ' on' : ''), el('span', it.dim ? 'dim' : '', it.name));
    if (it.fresh) b.append(el('small', '', '未設置'));
    b.onclick = () => { audio.se(SE_MOVE); skillList.pick = it.id; render(); };
    box.append(b);
  }
  const out = [box];
  const pick = skillList.pick;
  if (pick != null) out.push(el('div', 'win pm-memo', pick ? growth.manual(world, pick) : '卸下正在裝備的技能！'));
  const acts = el('div', 'pm-tog');
  const ok = el('button', 'btn', '決定');
  ok.onclick = () => {
    if (pick == null) return;
    const r = growth.chooseAdd(world, m, pick, slot);
    if (r.kind === 'no') { audio.se(SE_ERR); return; }
    const done = () => { skillList = null; skillSel = { m, kind: 'add', x: slot }; };
    if (r.kind === 'place') { growth.applyAdd(world, s, m, pick, slot); audio.se(SE_OK); done(); render(); return; }
    const verb = r.kind === 'learn' ? '學會' : '設置';
    confirmBox(render, [`現有CAP：${s.zeni}`, `${verb}技能消耗CAP：${r.cost}`, `需要${verb}嗎？`], ['是的', '取消'], () => {
      if (!growth.applyAdd(world, s, m, pick, slot)) { audio.se(SE_ERR); return; }
      audio.se(SE_OK);
      done();
    });
  };
  const back = el('button', 'btn', '取消');
  back.onclick = () => { audio.se(SE_OK); skillList = null; render(); };
  acts.append(ok, back);
  out.push(acts);
  return out;
}

// the original's small yes / no windows (output_result, output_skillup_result)
function confirmBox(render, lines, [yes, no], onYes) {
  audio.se(SE_OK);
  const box = el('div', 'win pm-ask', ...lines.map((t) => el('div', '', t)));
  const row = el('div', 'pm-tog');
  const a = el('button', 'btn', yes), b = el('button', 'btn', no);
  a.onclick = () => { box.remove(); onYes(); render(); };
  b.onclick = () => { audio.se(SE_OK); box.remove(); };
  row.append(a, b);
  box.append(row);
  document.querySelector('.pm').append(box);
}

// Scene_Db_Status as a member picker (call_state 3 / 6 / 7: item cards, ZP, the shared EXP). `zpPage` opens on the
// page with ZP, like cards whose element set has 31. 決定 on a member `ok` accepts → that member, 返回 → null
export function pickMember(game, title, ok, zpPage) {
  return screen(title, game, null, (m, render, { close }) => {
    const bar = el('div', 'pm-tog');
    const b = el('button', 'btn', '決定');
    b.onclick = () => { if (!ok(m)) { audio.se(SE_ERR); return; } close(m); };
    bar.append(b);
    return [statWin(game.world, game.state, m, zpPage ? 'zp' : false), bar];
  }).then((m) => m || null);
}
growth.setPicker(pickMember);

// ---------- 隊伍變更 (Scene_Db_Member_change, called from the 時之間: src/timeroom.js) ----------
// The party (up to nine, $partyc) from the members on offer (create_party_picture). Tapping one on offer puts them in
// at the end, or takes them out if they are in (C); a full party refuses with the error sound; tapping a party slot
// takes that one out (B takes out the last); 重設 = X (the party as it was); 決定 needs someone in. Resolves with the
// ids, or null (取消, the remake's shortcut for 重設 + 決定).
export function memberChange(game, offer) {
  const world = game.world, s = game.state;
  const start = s.party.map((m) => m.id);
  let list = [...start], look = offer.find((m) => m.id === list[0]) || offer[0];
  const who = (id) => offer.find((m) => m.id === id) || s.party.find((m) => m.id === id);
  return new Promise((res) => {
    const root = el('div', 'pm');
    document.getElementById('app').appendChild(root);
    root.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); });
    const end = (v) => { root.remove(); res(v); };
    const render = () => {
      root.innerHTML = '';
      const top = el('div', 'win pm-list', el('div', 'pm-head', word('NO'), el('span', '', `隊伍變更（${list.length}／9 人）`)));
      const slots = el('div', 'pm-slots');
      for (let i = 0; i < 9; i++) {
        const m = list[i] != null ? who(list[i]) : null;
        const b = el('button', 'pm-slot' + (m ? '' : ' empty'), digits(i + 1, 3), m ? faceOf(m, 36) : el('i'));
        b.onclick = () => {
          if (!m) { audio.se(SE_ERR); return; }
          audio.se(SE_MOVE);
          list.splice(i, 1);
          look = m;
          render();
        };
        slots.append(b);
      }
      top.append(slots, el('div', 'pm-hint', '點下面的角色加入或移出隊伍；點上面的格子移出。'));
      const pool = el('div', 'win pm-members pm-pool');
      for (const m of offer) {
        const inParty = list.includes(m.id);
        const b = el('button', 'pm-mem' + (inParty ? ' in' : '') + (look === m ? ' on' : ''), faceOf(m, 44), el('span', '', m.name));
        b.onclick = () => {
          look = m;
          if (inParty) { audio.se(SE_MOVE); list = list.filter((id) => id !== m.id); } else if (list.length >= 9) audio.se(SE_ERR);
          else { audio.se(SE_MOVE); list.push(m.id); }
          render();
        };
        pool.append(b);
      }
      const bar = el('div', 'pm-bar');
      const ok = el('button', 'btn', '決定');
      ok.onclick = () => { if (!list.length) { audio.se(SE_ERR); return; } audio.se(SE_OK); end(list); };
      const reset = el('button', 'btn', '重設');
      reset.onclick = () => { audio.se(SE_OK); list = [...start]; render(); };
      const back = el('button', 'btn', '取消');
      back.onclick = () => { audio.se(SE_OK); end(null); };
      bar.append(ok, reset, back);
      root.append(top, pool, ...(look ? [statWin(world, s, look, false)] : []), bar);
    };
    render();
  });
}

// card 110 仮面男 (Scene_Db_Status, Freeskill_set_card_no): pick a learned skill for the member's 自由 slot
function freeSkillScreen(game, m) {
  const world = game.world, s = game.state;
  return new Promise((res) => {
    let pick = null;
    const root = el('div', 'pm');
    document.getElementById('app').appendChild(root);
    root.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.unlock(); });
    const end = (v) => { root.remove(); res(v); };
    const render = () => {
      root.innerHTML = '';
      const box = el('div', 'win pm-skl pm-list2', el('div', 'pm-th', el('span', '', `${m.name}　自由技能`)));
      const list = growth.freeList(world, s, m);
      for (const it of list) {
        const b = el('button', 'pm-sk' + (pick === it.id ? ' on' : ''), el('span', it.dim ? 'dim' : '', it.name));
        b.onclick = () => { audio.se(SE_MOVE); pick = it.id; render(); };
        box.append(b);
      }
      if (!list.length) box.append(el('div', 'pm-hint', '（沒有可以設定的技能）'));
      root.append(box);
      if (pick != null) root.append(el('div', 'win pm-memo', growth.manual(world, pick)));
      const acts = el('div', 'pm-tog');
      const ok = el('button', 'btn', '決定');
      ok.onclick = () => {
        if (pick == null || !growth.freeOk(world, m, pick)) { audio.se(SE_ERR); return; }
        confirmBox(render, [`設定技能：${growth.skillName(world, pick)}`, '在「自由」技能欄設定這個技能嗎？'], ['確定', '取消'], () => {
          growth.applyFree(world, s, m, pick);
          audio.se(SE_OK);
          end(true);
        });
      };
      const back = el('button', 'btn', '取消');
      back.onclick = () => { audio.se(SE_OK); end(false); };
      acts.append(ok, back);
      root.append(acts);
    };
    render();
  });
}
growth.setFreeSkillScreen(freeSkillScreen);

// ---------- 作戰 (Scene_Db_Tactics_Menu) ----------
// option texts from output_status (the Chinese edition), in Traditional characters
export function openTactics({ game, battle }) {
  const world = game.world, s = game.state;
  return screen('作戰', game, battle, (m, render) => {
    const t = tactics(s, m);
    const box = el('div', 'win pm-tac');
    const opt = (key, value, label) => {
      const b = el('button', 'pm-opt' + (t[key] === value ? ' on' : ''), label);
      b.onclick = () => { audio.se(SE_MOVE); t[key] = value; render(); };
      return b;
    };
    // ◀ value ▶ stepper (the specified move / the KI percentage), live only while its option is chosen;
    // `big` adds «» for steps of 5 (the original's left / right)
    const stepper = (live, text, step, big) => {
      const w = el('span', 'pm-step' + (live ? '' : ' off'));
      const btn = (label, d) => {
        const b = el('button', '', label);
        b.onclick = () => { if (live) { audio.se(SE_MOVE); step(d); render(); } };
        return b;
      };
      if (big) w.append(btn('«', -5));
      w.append(btn('◀', -1), el('b', '', text), btn('▶', 1));
      if (big) w.append(btn('»', 5));
      return w;
    };
    const group = (name, ...lines) => {
      box.append(el('div', 'pm-gname', name));
      for (const line of lines) box.append(el('div', 'pm-line', ...line));
    };
    group('・優先攻擊的敵人', [opt('target', 0, '弱小的'), opt('target', 1, '強大的')]);
    const ix = m.skills.indexOf(t.tecId);
    group('・技能的選擇',
      [opt('tec', 0, '自動'), opt('tec', 1, '不使用KI')],
      [opt('tec', 2, '小技能'), opt('tec', 3, '大技能')],
      [opt('tec', 4, '使用指定的招式：')],
      m.skills.length ? [stepper(t.tec === 4, world.skills[t.tecId].name, (d) => { t.tecId = m.skills[(ix + d + m.skills.length) % m.skills.length]; })] : []);
    group('・指定的招式／KI不足時', [opt('nonki', 0, 'KI不使用'), opt('nonki', 1, '小技能')]);
    group('・KI的消費', [opt('kiheri', 0, '不介意')], [opt('kiheri', 1, `${t.kiPct}％以下不使用KI`)],
      [stepper(t.kiheri === 1, `${t.kiPct}％`, (d) => { t.kiPct = ((((t.kiPct - 1 + d) % 99) + 99) % 99) + 1; }, true)]);
    if (!m.skills.length) box.append(el('div', 'pm-hint', `${m.name}沒有必殺技，自動時只會普通攻擊。`));
    return [box];
  });
}

const css = document.createElement('style');
css.textContent = `
.pm { position: absolute; inset: 0; z-index: 46; background: #9040f0; display: flex; flex-direction: column; gap: 4px;
  padding: calc(var(--safe-t) + 4px) 4px calc(var(--safe-b) + 4px); overflow-y: auto; touch-action: pan-y; color: var(--ink); }
.pm .win { border-width: 8px; border-image-width: 8px; padding: 4px 6px; }
.pm canvas { image-rendering: pixelated; flex: none; }
.pm .pm-num { height: 16px; }
.pm-head { display: flex; align-items: center; gap: 8px; font-size: 18px; color: #d0480c; }
.pm-members { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 4px; margin-top: 4px; }
.pm-mem { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 3px 0; font-size: 15px; color: var(--ink);
  background: #fff0d0; border: 2px solid transparent; position: relative; }
.pm-mem > canvas:first-child { position: absolute; left: 2px; top: 2px; }
.pm-mem .pm-face { background: #000; }
.pm-mem.on { border-color: #f83800; }
.pm-mem.from { background: #ffd27a; }
.pm-hint { font-size: 15px; color: #d0480c; margin-top: 4px; }
.pm-slots { display: grid; grid-template-columns: repeat(9, 1fr); gap: 2px; margin-top: 4px; }
.pm-slot { position: relative; aspect-ratio: 1; padding: 0; background: #000; border: 2px solid #c8642a; display: flex; align-items: center; justify-content: center; }
.pm-slot .pm-face { width: 100% !important; height: 100% !important; }
.pm-slot > canvas:first-child { position: absolute; left: 0; top: 0; z-index: 1; width: 12px; height: 12px; }
.pm-slot.empty { background: #fff0d0; border-style: dashed; }
.pm-pool { grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); }
.pm-pool .pm-mem { font-size: 13px; }
.pm-pool .pm-mem > canvas:first-child { position: static; }
.pm-mem.in { opacity: .45; }
.pm-stat .pm-top { display: flex; gap: 12px; }
.pm-left { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.pm-left .pm-face { background: #000; }
.pm-nums { flex: 1; display: grid; grid-template-columns: 1fr; gap: 2px; align-content: start; max-width: 190px; }
.pm-nums > div, .pm-rows > div, .pm-tr { display: flex; align-items: center; }
.pm-nums i { flex: 1; }
.pm-rows { margin-top: 6px; display: grid; gap: 2px; font-size: 17px; }
.pm-rows > div span, .pm-tr span { flex: 1; }
.pm-tec { font-size: 17px; }
.pm-th { display: flex; justify-content: space-between; color: #d0480c; margin-bottom: 2px; }
.pm-tr { min-height: 24px; }
.pm-tog, .pm-bar { display: flex; gap: 6px; }
.pm-tog .btn, .pm-bar .btn { margin: 0; text-align: center; flex: 1; }
.pm-bar { margin-top: auto; }
.pm-tac { font-size: 17px; }
.pm-skl { font-size: 17px; display: flex; flex-direction: column; gap: 2px; }
.pm-sk { min-height: 30px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; text-align: left; padding: 3px 6px; font-size: 17px; color: var(--ink);
  background: #fff0d0; border: 2px solid transparent; }
.pm-sk b { width: 1.2em; font-weight: 400; color: #d0480c; }
.pm-sk span { flex: 1; }
.pm-sk small { width: 100%; padding-left: 1.6em; font-size: 14px; }
.pm-sk .dim { color: #a08868; }
.pm-sk.on { border-color: #f83800; }
.pm-sk:disabled { opacity: .45; }
.pm-list2 { max-height: 46vh; overflow-y: auto; }
.pm-memo { font-size: 15px; white-space: pre-line; line-height: 1.35; }
.pm-ask { position: absolute; left: 12px; right: 12px; top: 34%; z-index: 2; font-size: 17px; display: flex; flex-direction: column; gap: 4px; }
.pm-gname { margin-top: 6px; }
.pm-gname:first-child { margin-top: 0; }
.pm-line { display: flex; gap: 6px; padding-left: 16px; margin-top: 4px; }
.pm-opt { flex: 1; text-align: left; padding: 4px 6px; font-size: 16px; color: var(--ink); background: #fff0d0; border: 2px solid transparent; }
.pm-opt::before { content: "▶"; color: #d0480c; font-size: 12px; margin-right: 4px; visibility: hidden; }
.pm-opt.on { border-color: #f83800; }
.pm-opt.on::before { visibility: visible; }
.pm-step { flex: 1; display: flex; align-items: center; gap: 6px; }
.pm-step b { flex: 1; text-align: center; font-weight: 400; color: #d0480c; }
.pm-step button { width: 36px; height: 32px; font-size: 16px; color: var(--ink); background: #fff0d0; border: 2px solid #c8642a; }
.pm-step.off { opacity: .4; }
#menu .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 6px; }
#menu .pm-grid .btn { text-align: center; }
`;
document.head.appendChild(css);
